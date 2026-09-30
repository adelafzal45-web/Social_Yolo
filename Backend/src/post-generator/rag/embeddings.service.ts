import { createHash } from 'crypto';

import {
  BadGatewayException,
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

/**
 * Embeds text via the Gemini embedding API (`GEMINI_EMBEDDING_MODEL`,
 * default `gemini-embedding-001`) at `GEMINI_EMBEDDING_DIMENSIONS`
 * dimensions (default 768 — must match the `post_embeddings.embedding`
 * `real[]` column and the retriever's cosine math).
 */
@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);

  private readonly client: GoogleGenAI | null;
  private readonly model: string;
  private readonly dimensions: number;

  /** In-memory cache — identical prompts never re-hit the embedding API. */
  private readonly cache = new Map<string, number[]>();
  private static readonly CACHE_MAX_ENTRIES = 200;

  constructor() {
    this.model = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
    this.dimensions = Number(process.env.GEMINI_EMBEDDING_DIMENSIONS ?? 768);
    const apiKey = process.env.GEMINI_API_KEY;
    this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;
    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY is not set — RAG style retrieval will be skipped until it is added to Backend/.env',
      );
    }
  }

  /** True when an API key is configured. */
  get isConfigured(): boolean {
    return this.client !== null;
  }

  /** Embeds one text into a vector of `dimensions` floats (cached). */
  async embedText(text: string): Promise<number[]> {
    const key = this.cacheKey(text);
    const cached = this.cache.get(key);
    if (cached) {
      this.logger.log(`Embedding cache hit for "${text.slice(0, 48)}…"`);
      return cached;
    }

    const [vector] = await this.embedTexts([text]);

    this.cache.set(key, vector);
    if (this.cache.size > EmbeddingsService.CACHE_MAX_ENTRIES) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) {
        this.cache.delete(oldest);
      }
    }
    return vector;
  }

  /** Cache key binds the vector to the model + dimensionality that produced it. */
  private cacheKey(text: string): string {
    return createHash('sha256')
      .update(`${this.model}:${this.dimensions}:${text}`)
      .digest('hex');
  }

  /** Embeds several texts in one API call; result order matches input order. */
  async embedTexts(texts: string[]): Promise<number[][]> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Gemini is not configured: set GEMINI_API_KEY in Backend/.env and restart the backend.',
      );
    }
    if (texts.length === 0) {
      return [];
    }

    try {
      const response = await this.client.models.embedContent({
        model: this.model,
        contents: texts,
        config: { outputDimensionality: this.dimensions },
      });

      const embeddings = response.embeddings ?? [];
      if (embeddings.length !== texts.length) {
        throw new Error(
          `Gemini returned ${embeddings.length} embeddings for ${texts.length} texts.`,
        );
      }

      return embeddings.map((embedding, index) => {
        const values = embedding.values ?? [];
        if (values.length !== this.dimensions) {
          throw new Error(
            `Embedding #${index} has ${values.length} dimensions, expected ${this.dimensions}.`,
          );
        }
        return values;
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Embedding failed: ${message}`);
      throw new BadGatewayException(`Embedding failed: ${message}`);
    }
  }

  /**
   * Embeds an IMAGE (optionally paired with a text hint) into the same vector
   * space as `embedText`.
   *
   * This is what powers the visual half of the RAG layer: an uploaded style
   * reference is turned into a vector that can be compared against the vector
   * of a *text* brief, so "a moody editorial skincare shot" retrieves a
   * picture the user actually liked.
   *
   * Returns `null` when the embedding model rejects the payload (e.g. a model
   * build without multimodal support) so callers can gracefully fall back to
   * a text-only embedding instead of failing the whole upload.
   */
  async embedImage(
    imageBase64: string,
    options: { mimeType?: string; text?: string } = {},
  ): Promise<number[] | null> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Gemini is not configured: set GEMINI_API_KEY in Backend/.env and restart the backend.',
      );
    }

    const parts: Array<Record<string, unknown>> = [];
    if (options.text) {
      parts.push({ text: options.text });
    }
    parts.push({
      inlineData: {
        mimeType: options.mimeType || 'image/png',
        data: imageBase64,
      },
    });

    try {
      const response = await this.client.models.embedContent({
        model: this.model,
        contents: [{ role: 'user', parts }],
        config: { outputDimensionality: this.dimensions },
      });

      const values = response.embeddings?.[0]?.values;
      if (!Array.isArray(values) || values.length !== this.dimensions) {
        throw new Error(
          `Image embedding has ${values?.length ?? 'no'} dimensions, expected ${this.dimensions}.`,
        );
      }
      return values;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Multimodal (image) embedding unavailable: ${message.slice(0, 200)}. Falling back to text-only embedding.`,
      );
      return null;
    }
  }
}
