import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import type {
  GeneratePostImageParams,
  GeneratedImage,
} from '../gemini.service';

/**
 * Free text-to-image provider (Pollinations.ai) — no API key required.
 * Acts as an intelligent fallback engine when Gemini image quota is limited.
 * Includes concurrency serialization and exponential backoff to handle rate limits.
 */
@Injectable()
export class PollinationsService {
  private readonly logger = new Logger(PollinationsService.name);

  private readonly endpoint =
    process.env.POLLINATIONS_URL || 'https://image.pollinations.ai/prompt';
  private readonly timeoutMs = Number(
    process.env.POLLINATIONS_TIMEOUT_MS ?? 120_000,
  );

  private static readonly ATTEMPTS = 4;
  private static readonly BASE_DELAY_MS = 3_000;

  // Queue to serialize Pollinations API calls and prevent concurrent IP 429 rate limits
  private queue: Promise<any> = Promise.resolve();

  async generatePostImage(
    params: GeneratePostImageParams,
  ): Promise<GeneratedImage> {
    // Chain onto queue so requests run sequentially with a slight cooling delay
    return new Promise<GeneratedImage>((resolve, reject) => {
      this.queue = this.queue
        .then(async () => {
          try {
            const result = await this.executeGeneration(params);
            // Brief cooling pause between successive Pollinations calls
            await new Promise((r) => setTimeout(r, 1500));
            resolve(result);
          } catch (err) {
            reject(err);
          }
        })
        .catch((err) => {
          // Keep queue alive even if previous task failed
          reject(err);
        });
    });
  }

  private async executeGeneration(
    params: GeneratePostImageParams,
  ): Promise<GeneratedImage> {
    const seed = Math.floor(Math.random() * 1_000_000);
    const width = params.width || 1024;
    const height = params.height || 1024;

    const url =
      `${this.endpoint}/${encodeURIComponent(params.prompt)}` +
      `?width=${width}&height=${height}&nologo=true&seed=${seed}`;

    this.logger.log(
      `Pollinations: generating image ${width}x${height} (seed ${seed})…`,
    );

    let lastError: unknown;
    for (
      let attempt = 1;
      attempt <= PollinationsService.ATTEMPTS;
      attempt += 1
    ) {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(this.timeoutMs),
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length < 1_000) {
          throw new Error(
            `suspiciously small response (${buffer.length} bytes)`,
          );
        }
        this.logger.log(
          `Pollinations: received ${buffer.length} bytes (attempt ${attempt})`,
        );
        return {
          imageBase64: buffer.toString('base64'),
          mimeType: 'image/jpeg',
        };
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Pollinations attempt ${attempt}/${PollinationsService.ATTEMPTS} failed: ${message}`,
        );
        if (attempt < PollinationsService.ATTEMPTS) {
          const delay = PollinationsService.BASE_DELAY_MS * attempt;
          await new Promise((resolveDelay) => setTimeout(resolveDelay, delay));
        }
      }
    }

    const message =
      lastError instanceof Error ? lastError.message : String(lastError);
    this.logger.error(
      `Pollinations image generation failed after ${PollinationsService.ATTEMPTS} attempts: ${message}`,
    );
    throw new BadGatewayException(
      `Pollinations image generation failed: ${message}`,
    );
  }
}
