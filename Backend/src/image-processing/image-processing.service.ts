import { Injectable, Logger } from '@nestjs/common';
import type { UploadedFile } from '../common/upload/image-upload';
import { readFileBuffer } from '../common/upload/image-upload';
import { RedisCacheService } from '../common/cache/redis-cache.service';
import { BackgroundRemovalQueueService } from './background-removal-queue.service';

export interface ProcessImageOptions {
  model?: string;
  preserveText?: boolean;
  alphaMatting?: boolean;
  postProcess?: boolean;
}

export interface ProcessedImageResult {
  buffer: Buffer;
  backgroundRemoved: boolean;
  engine: string;
  error?: string;
  jobId?: string;
  durationMs?: number;
}

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  constructor(
    private readonly queueService: BackgroundRemovalQueueService,
    private readonly cache: RedisCacheService,
  ) {}

  async processImage(
    file: UploadedFile,
    options: ProcessImageOptions = {},
  ): Promise<Buffer> {
    return (await this.processImageWithStatus(file, options)).buffer;
  }

  /**
   * Processes an image by routing it through the Redis Queue.
   * Concurrency is controlled, and repeat requests are served instantly via cache.
   */
  async processImageWithStatus(
    file: UploadedFile,
    options: ProcessImageOptions = {},
  ): Promise<ProcessedImageResult> {
    const originalBytes = await readFileBuffer(file);
    const mimeType = this.detectMimeType(originalBytes);

    try {
      const result = await this.queueService.enqueueAndWait(
        originalBytes,
        mimeType,
        options,
      );

      return {
        buffer: result.buffer,
        backgroundRemoved: result.backgroundRemoved,
        engine: result.engine,
        error: result.error,
        jobId: result.jobId,
        durationMs: result.durationMs,
      };
    } catch (err: any) {
      this.logger.warn(
        `Redis queue background removal exception (${err?.message || err}). Returning original image bytes.`,
      );
      return {
        buffer: originalBytes,
        backgroundRemoved: false,
        engine: 'passthrough-fallback',
        error: err?.message,
      };
    }
  }

  /**
   * Pushes a background removal job to the Redis Queue asynchronously.
   * Returns immediately with the jobId and queue position.
   */
  async enqueueAsync(
    file: UploadedFile,
    options: ProcessImageOptions = {},
  ) {
    const originalBytes = await readFileBuffer(file);
    const mimeType = this.detectMimeType(originalBytes);
    return this.queueService.enqueueAsync(originalBytes, mimeType, options);
  }

  /**
   * Fetches job status and result from the Redis Queue.
   */
  async getJobStatus(jobId: string) {
    return this.queueService.getJobStatus(jobId);
  }

  async processImageOptional(
    file: UploadedFile,
    enabled: boolean,
    options: ProcessImageOptions = {},
  ): Promise<Buffer> {
    if (!enabled) {
      return readFileBuffer(file);
    }
    return this.processImage(file, options);
  }

  async checkHealth(): Promise<boolean> {
    return true;
  }

  private detectMimeType(bytes: Buffer): string {
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
      return 'image/jpeg';
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    )
      return 'image/png';
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    )
      return 'image/webp';
    return 'image/jpeg';
  }
}
