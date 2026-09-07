import {
  Injectable,
  Logger,
} from '@nestjs/common';
import type { UploadedFile } from '../common/upload/image-upload';
import { readFileBuffer } from '../common/upload/image-upload';
import {
  IMAGE_SERVICE_URL,
  IMAGE_SERVICE_TIMEOUT_MS,
} from '../config/image-service.config';

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  /**
   * Sends an image to the Python microservice for background removal
   * and enhancement (sharpness + contrast).
   *
   * If the Python service is unreachable or returns an error, the
   * **original** image bytes are returned so that the calling upload
   * still succeeds — the pipeline degrades gracefully.
   *
   * @param file The uploaded file (multer `UploadedFile`).
   * @returns Processed PNG bytes from Python, or the original bytes as a fallback.
   */
  async processImage(file: UploadedFile): Promise<Buffer> {
    const originalBytes = await readFileBuffer(file);

    try {
      const formData = new FormData();
      const blob = new Blob([originalBytes as unknown as BlobPart], { type: file.mimetype });
      formData.append('file', blob, file.originalname);

      const response = await fetch(
        `${IMAGE_SERVICE_URL}/process-image`,
        {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(IMAGE_SERVICE_TIMEOUT_MS),
        },
      );

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        this.logger.warn(
          `Image service responded ${response.status}: ${text || response.statusText}. ` +
            'Falling back to original image.',
        );
        return originalBytes;
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Image service unavailable (${message}). Falling back to original image.`,
      );
      return originalBytes;
    }
  }

  /**
   * Returns the original image bytes **without** calling Python.
   * Useful when you want to skip background removal (e.g. the caller
   * knows the image already has a transparent background).
   */
  async processImageOptional(
    file: UploadedFile,
    enabled: boolean,
  ): Promise<Buffer> {
    if (!enabled) {
      return readFileBuffer(file);
    }
    return this.processImage(file);
  }

  /**
   * Health-check: returns `true` when the Python service responds on its
   * root endpoint within the configured timeout.
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${IMAGE_SERVICE_URL}/`, {
        signal: AbortSignal.timeout(5_000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
