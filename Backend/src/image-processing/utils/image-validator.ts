import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import {
  ALLOWED_MIME_TYPES,
  MAX_IMAGE_HEIGHT,
  MAX_IMAGE_WIDTH,
  MAX_TOTAL_PIXELS,
  OUTPUT_QUALITY,
} from '../../config/image-processing.config';

export interface ValidatedMetadata {
  format: string;
  width: number;
  height: number;
  channels: number;
  hasAlpha: boolean;
  sizeBytes: number;
}

export interface TransparencyReport {
  hasAlphaChannel: boolean;
  isTransparent: boolean;
  minAlpha: number;
  maxAlpha: number;
}

@Injectable()
export class ImageValidator {
  private readonly logger = new Logger(ImageValidator.name);

  /**
   * Validates image format, magic bytes, dimensions, and total pixels (decompression bomb protection).
   */
  async validateImage(
    buffer: Buffer,
    declaredMimeType?: string,
  ): Promise<ValidatedMetadata> {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Uploaded file buffer is empty.');
    }

    let metadata: sharp.Metadata;
    try {
      // Sharp parses the actual header/magic bytes regardless of declared filename/mimetype
      metadata = await sharp(buffer).metadata();
    } catch (err: any) {
      this.logger.warn(`Sharp header validation failed: ${err.message}`);
      throw new BadRequestException(
        'Invalid or corrupted image format. Only authentic JPEG, PNG, and WebP images are allowed.',
      );
    }

    const format = (metadata.format || '').toLowerCase();
    const validFormats = ['jpeg', 'jpg', 'png', 'webp'];
    if (!validFormats.includes(format)) {
      throw new BadRequestException(
        `Unsupported image format: "${format}". Allowed formats: JPEG, PNG, WebP.`,
      );
    }

    if (declaredMimeType) {
      const normalizedDeclared = declaredMimeType.toLowerCase().trim();
      if (!ALLOWED_MIME_TYPES.includes(normalizedDeclared)) {
        throw new BadRequestException(
          `Declared MIME type "${declaredMimeType}" is not allowed.`,
        );
      }
    }

    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (width <= 0 || height <= 0) {
      throw new BadRequestException('Image has invalid or zero dimensions.');
    }

    if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
      throw new BadRequestException(
        `Image dimensions exceed maximum limits (${MAX_IMAGE_WIDTH}x${MAX_IMAGE_HEIGHT}). Given: ${width}x${height}.`,
      );
    }

    const totalPixels = width * height;
    if (totalPixels > MAX_TOTAL_PIXELS) {
      throw new BadRequestException(
        `Image resolution exceeds maximum allowed pixels (${MAX_TOTAL_PIXELS} px). Potential decompression bomb detected.`,
      );
    }

    return {
      format,
      width,
      height,
      channels: metadata.channels || 3,
      hasAlpha: Boolean(metadata.hasAlpha),
      sizeBytes: buffer.length,
    };
  }

  /**
   * Sharp Preprocessing:
   * - Normalizes orientation (EXIF orientation auto-rotation)
   * - Ensures standard sRGB color space
   * - Caps excessive dimensions for AI processing while preserving aspect ratio
   */
  async preprocess(
    buffer: Buffer,
  ): Promise<{ buffer: Buffer; metadata: sharp.Metadata }> {
    let pipeline = sharp(buffer, { failOn: 'error' }).rotate(); // Auto-rotates according to EXIF orientation tag

    const meta = await pipeline.metadata();

    // If image is exceptionally high resolution (> 2560px on longest side), downscale smoothly for AI inference
    const maxSide = 2560;
    if (
      (meta.width && meta.width > maxSide) ||
      (meta.height && meta.height > maxSide)
    ) {
      this.logger.log(
        `Downscaling oversized image to ${maxSide}px bound for model inference.`,
      );
      pipeline = pipeline.resize(maxSide, maxSide, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert to uncompressed PNG to standardize input for the AI matting model
    const preprocessedBuffer = await pipeline.toFormat('png').toBuffer();

    const finalMeta = await sharp(preprocessedBuffer).metadata();
    return { buffer: preprocessedBuffer, metadata: finalMeta };
  }

  /**
   * Inspects the output image's alpha channel to verify true transparency.
   */
  async checkTransparency(buffer: Buffer): Promise<TransparencyReport> {
    try {
      const stats = await sharp(buffer).stats();
      const hasAlphaChannel = stats.channels.length === 4;

      if (!hasAlphaChannel) {
        return {
          hasAlphaChannel: false,
          isTransparent: false,
          minAlpha: 255,
          maxAlpha: 255,
        };
      }

      const alphaChannel = stats.channels[3];
      const isTransparent = alphaChannel.min < 255;

      return {
        hasAlphaChannel: true,
        isTransparent,
        minAlpha: alphaChannel.min,
        maxAlpha: alphaChannel.max,
      };
    } catch (err: any) {
      this.logger.warn(`Failed to inspect transparency stats: ${err.message}`);
      return {
        hasAlphaChannel: false,
        isTransparent: false,
        minAlpha: 0,
        maxAlpha: 255,
      };
    }
  }

  /**
   * Sharp Post-processing:
   * - Ensures output is a clean PNG with correct alpha channel
   * - Applies maximum compression (level 9) with adaptive filtering
   * - Strips personal/sensitive EXIF metadata while preserving color profile
   */
  async postprocess(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .ensureAlpha() // Guarantees 4 channels (RGBA)
      .png({
        compressionLevel: 9,
        adaptiveFiltering: true,
        quality: OUTPUT_QUALITY,
        force: true,
      })
      .toBuffer();
  }
}
