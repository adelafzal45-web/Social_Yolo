import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ImageProcessingService } from './image-processing.service';
import type { UploadedFile as UploadType } from '../common/upload/image-upload';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_PHOTO_BYTES,
} from '../common/upload/image-upload';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard';

@ApiTags('image-processing')
@Controller('image-processing')
export class ImageProcessingController {
  constructor(
    private readonly imageProcessingService: ImageProcessingService,
  ) {}

  /**
   * Standalone endpoint that lets the frontend send any image through
   * the native Node.js background-removal + enhancement pipeline.
   *
   * Uses @imgly/background-removal-node (ONNX, no Python required).
   * Returns the processed PNG as a base64 data-URL plus raw base64 bytes.
   */
  @Post('remove-background')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_PHOTO_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'model',
    required: false,
    description: 'Model size: small (fast, default) or medium (quality)',
  })
  @ApiQuery({
    name: 'preserve_text',
    required: false,
    description: 'Preserve text/slogans/badges (default true)',
  })
  @ApiQuery({
    name: 'alpha_matting',
    required: false,
    description: 'Enable alpha matting for hair (default false)',
  })
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
    summary: 'Remove background using native Node.js ONNX engine',
    description: `Native @imgly/background-removal-node (no Python required). Accepts ${ALLOWED_IMAGE_MIME_TYPES.join(', ')} up to ${MAX_PHOTO_BYTES / (1024 * 1024)} MB. Returns transparent PNG.`,
  })
  @ApiResponse({
    status: 201,
    description: 'Processed transparent PNG (base64).',
  })
  @ApiResponse({ status: 400, description: 'Invalid or oversized file.' })
  @ApiResponse({
    status: 500,
    description: 'Background removal engine failed.',
  })
  async removeBackground(
    @UploadedFile() file: UploadType | undefined,
    @Query('model') model?: string,
    @Query('preserve_text') preserveText?: string,
    @Query('alpha_matting') alphaMatting?: string,
  ): Promise<{
    url: string;
    bytes: string;
    engine: string;
    backgroundRemoved: boolean;
    jobId?: string;
    durationMs?: number;
  }> {
    if (!file) {
      throw new BadRequestException('No file provided.');
    }

    const options = {
      model: model || 'u2net_human_seg',
      preserveText: preserveText !== 'false',
      alphaMatting: alphaMatting === 'true',
    };

    const result = await this.imageProcessingService.processImageWithStatus(
      file,
      options,
    );

    const base64 = result.buffer.toString('base64');
    const mimeType = result.backgroundRemoved
      ? 'image/png'
      : file.mimetype || 'image/jpeg';
    return {
      bytes: base64,
      url: `data:${mimeType};base64,${base64}`,
      engine: result.engine,
      backgroundRemoved: result.backgroundRemoved,
      jobId: result.jobId,
      durationMs: result.durationMs,
    };
  }

  /**
   * Enqueues a background removal job into the Redis Queue asynchronously.
   * Returns immediately with the jobId and queuePosition.
   */
  @Post('queue')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_PHOTO_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Enqueue background removal into Redis Queue asynchronously',
    description: 'Pushes the image to the Redis Queue and immediately returns a jobId for polling.',
  })
  async enqueue(
    @UploadedFile() file: UploadType | undefined,
    @Query('model') model?: string,
    @Query('preserve_text') preserveText?: string,
    @Query('alpha_matting') alphaMatting?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided.');
    }

    const options = {
      model: model || 'u2net_human_seg',
      preserveText: preserveText !== 'false',
      alphaMatting: alphaMatting === 'true',
    };

    return this.imageProcessingService.enqueueAsync(file, options);
  }

  /**
   * Checks the status and retrieves the result of a queued background removal job.
   */
  @Get('jobs/:jobId')
  @Public()
  @ApiOperation({
    summary: 'Get status & result of a queued background removal job',
  })
  async getJobStatus(@Param('jobId') jobId: string) {
    const status = await this.imageProcessingService.getJobStatus(jobId);
    return status;
  }

  /**
   * Health-check — native Node.js engine is always available.
   */
  @Get('health')
  @Public()
  @ApiOperation({
    summary:
      'Check if the native Node.js background removal engine is available',
  })
  @ApiResponse({ status: 200, description: 'Engine health status.' })
  async health(): Promise<{
    available: boolean;
    service: string;
    engine: string;
  }> {
    return {
      available: true,
      service: 'node-native-redis-queue',
      engine: '@imgly/background-removal-node',
    };
  }
}
