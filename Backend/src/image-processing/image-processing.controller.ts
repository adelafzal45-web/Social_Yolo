import {
  BadRequestException,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ImageProcessingService } from './image-processing.service';
import type { UploadedFile as UploadType } from '../common/upload/image-upload';
import { ALLOWED_IMAGE_MIME_TYPES, MAX_PHOTO_BYTES } from '../common/upload/image-upload';

@ApiTags('image-processing')
@Controller('image-processing')
export class ImageProcessingController {
  constructor(private readonly imageProcessingService: ImageProcessingService) {}

  /**
   * Standalone endpoint that lets the frontend send *any* image through
   * the background-removal + enhancement pipeline without tying it to
   * a specific user record.
   *
   * Returns the processed PNG as a base64 data-URL plus raw base64 bytes.
   */
  @Post('remove-background')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_PHOTO_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: `Image to process (${ALLOWED_IMAGE_MIME_TYPES.join(', ')}), up to ${MAX_PHOTO_BYTES / (1024 * 1024)} MB.`,
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({
    summary: 'Remove background and enhance an image (Python microservice)',
    description: `Accepts ${ALLOWED_IMAGE_MIME_TYPES.join(', ')} up to ${MAX_PHOTO_BYTES / (1024 * 1024)} MB. Returns the processed PNG.`,
  })
  @ApiResponse({ status: 201, description: 'Processed image bytes (PNG).', type: Buffer })
  @ApiResponse({ status: 400, description: 'Invalid or oversized file.' })
  async removeBackground(
    @UploadedFile() file: UploadType | undefined,
  ): Promise<{ url: string; bytes: string }> {
    if (!file) {
      throw new BadRequestException('No file provided.');
    }
    const processed = await this.imageProcessingService.processImage(file);
    const base64 = processed.toString('base64');
    return {
      bytes: base64,
      url: `data:image/png;base64,${base64}`,
    };
  }

  /**
   * Health-check proxy — tells the frontend whether the Python service
   * is currently reachable.
   */
  @Get('health')
  @ApiOperation({ summary: 'Check if the Python image service is reachable' })
  @ApiResponse({ status: 200, description: 'Service health status.' })
  async health(): Promise<{ available: boolean }> {
    const available = await this.imageProcessingService.checkHealth();
    return { available };
  }
}
