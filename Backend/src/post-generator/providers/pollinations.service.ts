import { BadGatewayException, Injectable, Logger } from '@nestjs/common';

import type { GeneratePostImageParams, GeneratedImage } from '../gemini.service';

/**
 * Free text-to-image provider (Pollinations.ai) — no API key required.
 *
 * Used for testing the pipeline without Gemini image quota
 * (`IMAGE_PROVIDER=pollinations` in `.env`). Limitation: it generates
 * from the text prompt only — the subject image is NOT sent to it.
 * Switch back to `gemini` once billing is enabled.
 */
@Injectable()
export class PollinationsService {
  private readonly logger = new Logger(PollinationsService.name);

  private readonly endpoint =
    process.env.POLLINATIONS_URL || 'https://image.pollinations.ai/prompt';
  private readonly timeoutMs = Number(process.env.POLLINATIONS_TIMEOUT_MS ?? 120_000);

  /** Total attempts per request — the free service drops connections occasionally. */
  private static readonly ATTEMPTS = 3;
  /** Pause between attempts, ms. */
  private static readonly RETRY_DELAY_MS = 4_000;

  /**
   * Generates one image from the prompt via a single GET request, retrying
   * up to `ATTEMPTS` times (Pollinations is a free, best-effort service that
   * occasionally drops connections — "fetch failed" — or returns 5xx).
   * `params.imageBase64` is intentionally ignored by this provider.
   */
  async generatePostImage(params: GeneratePostImageParams): Promise<GeneratedImage> {
    const seed = Math.floor(Math.random() * 1_000_000);
    const url =
      `${this.endpoint}/${encodeURIComponent(params.prompt)}` +
      `?width=1024&height=1024&nologo=true&seed=${seed}`;

    this.logger.log(`Pollinations: generating image (seed ${seed})…`);

    let lastError: unknown;
    for (let attempt = 1; attempt <= PollinationsService.ATTEMPTS; attempt += 1) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(this.timeoutMs) });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length < 1_000) {
          throw new Error(`suspiciously small response (${buffer.length} bytes)`);
        }
        this.logger.log(`Pollinations: received ${buffer.length} bytes (attempt ${attempt})`);
        return { imageBase64: buffer.toString('base64'), mimeType: 'image/jpeg' };
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);
        const cause =
          error instanceof Error && error.cause
            ? ` (cause: ${String((error as { cause?: unknown }).cause)})`
            : '';
        this.logger.warn(
          `Pollinations attempt ${attempt}/${PollinationsService.ATTEMPTS} failed: ` +
            `${message}${cause}`,
        );
        if (attempt < PollinationsService.ATTEMPTS) {
          await new Promise((resolveDelay) =>
            setTimeout(resolveDelay, PollinationsService.RETRY_DELAY_MS),
          );
        }
      }
    }

    const message = lastError instanceof Error ? lastError.message : String(lastError);
    this.logger.error(
      `Pollinations image generation failed after ${PollinationsService.ATTEMPTS} attempts: ${message}`,
    );
    throw new BadGatewayException(`Pollinations image generation failed: ${message}`);
  }
}