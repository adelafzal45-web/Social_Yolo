import {
  BadGatewayException,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  IMAGE_SERVICE_URL,
  IMAGE_SERVICE_TIMEOUT_MS,
} from '../../config/image-service.config';

/** Response of the Python service's `GET /embedding-health` endpoint. */
export interface ClipHealth {
  model: string;
  loaded: boolean;
  dimensions: number | null;
  error?: string | null;
}

/** One embedding returned by the Python CLIP endpoints. */
export interface ClipEmbedding {
  /** Unit-length vector (normalized at encode time → cosine == dot product). */
  vector: number[];
  /** CLIP model that produced it, e.g. `clip-ViT-B-32` (stored with the row). */
  model: string;
  dimensions: number;
}

/**
 * Client for the CLIP embedding endpoints of the Python image service:
 * `POST /embed-image`, `POST /embed-text` and `GET /embedding-health`.
 *
 * CLIP embeds images AND text into ONE shared vector space — that is what
 * lets a typed prompt find visually similar past post images. These vectors
 * live in `post_image_embeddings` and must never be mixed with the Gemini
 * text vectors of `post_embeddings` (different model, different space).
 *
 * The first call after the Python service starts triggers the model load
 * (and one-time download), so a generous timeout is used — the same
 * `IMAGE_SERVICE_TIMEOUT_MS` as the bg-removal pipeline.
 */
@Injectable()
export class ImageEmbeddingsService {
  private readonly logger = new Logger(ImageEmbeddingsService.name);

  /** In-memory cache for CLIP prompt embeddings (identical prompts re-used). */
  private readonly cache = new Map<string, ClipEmbedding>();
  private static readonly CACHE_MAX_ENTRIES = 200;

  /** Embeds one image (PNG/JPEG bytes) with the CLIP image encoder. */
  async embedImage(
    buffer: Buffer,
    filename = 'image.png',
    mimeType = 'image/png',
  ): Promise<ClipEmbedding> {
    const formData = new FormData();
    const blob = new Blob([buffer as unknown as BlobPart], { type: mimeType });
    formData.append('file', blob, filename);
    return this.toClipEmbedding(
      await this.post('embed-image', formData),
      'embed-image',
    );
  }

  /** Embeds a short text prompt with the CLIP text encoder (cached). */
  async embedQuery(text: string): Promise<ClipEmbedding> {
    const cached = this.cache.get(text);
    if (cached) {
      return cached;
    }

    const embedding = this.toClipEmbedding(
      await this.post('embed-text', JSON.stringify({ text }), {
        'Content-Type': 'application/json',
      }),
      'embed-text',
    );

    this.cache.set(text, embedding);
    if (this.cache.size > ImageEmbeddingsService.CACHE_MAX_ENTRIES) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) {
        this.cache.delete(oldest);
      }
    }
    return embedding;
  }

  /** Probes the Python service; null when the CLIP endpoints are unavailable. */
  async health(): Promise<ClipHealth | null> {
    try {
      const response = await fetch(`${IMAGE_SERVICE_URL}/embedding-health`, {
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) {
        return null;
      }
      return (await response.json()) as ClipHealth;
    } catch {
      return null;
    }
  }

  private async post(
    endpoint: string,
    body: BodyInit,
    headers?: Record<string, string>,
  ): Promise<unknown> {
    try {
      const response = await fetch(`${IMAGE_SERVICE_URL}/${endpoint}`, {
        method: 'POST',
        body,
        headers,
        signal: AbortSignal.timeout(IMAGE_SERVICE_TIMEOUT_MS),
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new BadGatewayException(
          `Image embedding service ${endpoint} responded ${response.status}` +
            (detail ? `: ${detail.slice(0, 300)}` : ''),
        );
      }
      return await response.json();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new BadGatewayException(
        `Image embedding service call failed: ${message}`,
      );
    }
  }

  private toClipEmbedding(data: unknown, endpoint: string): ClipEmbedding {
    const payload = data as {
      embedding?: unknown;
      dimensions?: unknown;
      model?: unknown;
    };
    if (!Array.isArray(payload?.embedding) || payload.embedding.length === 0) {
      throw new BadGatewayException(
        `${endpoint} returned no embedding vector.`,
      );
    }
    const vector = payload.embedding.map(Number);
    return {
      vector,
      model: String(payload.model ?? 'unknown'),
      dimensions: Number(payload.dimensions ?? vector.length),
    };
  }
}

/** Guesses the MIME type from a file path (PNG/JPEG only — that is all we store). */
export function mimeFromImagePath(imagePath: string): string {
  return /\.jpe?g$/i.test(imagePath) ? 'image/jpeg' : 'image/png';
}
