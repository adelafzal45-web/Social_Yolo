import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RedisCacheService } from '../common/cache/redis-cache.service';

/**
 * Sliding-window rate limiter for the post generation endpoints.
 * Backed by Redis when connected, falling back to a bounded in-memory sliding window.
 */
@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly hits = new Map<string, number[]>();
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly MAX_TRACKED_USERS = 1000;

  constructor(private readonly cacheService: RedisCacheService) {
    this.limit = Number(process.env.POSTGEN_RATE_LIMIT ?? 10);
    this.windowMs = Number(process.env.POSTGEN_RATE_WINDOW_MIN ?? 60) * 60_000;
  }

  /**
   * Registers one generation attempt for `key`.
   * Throws 429 when the caller already used up the window's budget.
   */
  async consume(key: string): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const redisKey = `ratelimit:postgen:${key}`;

    // 1. Try Redis sliding window
    try {
      const cached = await this.cacheService.get<number[]>(redisKey);
      const timestamps: number[] = Array.isArray(cached)
        ? cached.filter((t) => t > windowStart)
        : [];

      if (timestamps.length >= this.limit) {
        const retryInMin = Math.ceil(
          (timestamps[0] + this.windowMs - now) / 60_000,
        );
        throw new HttpException(
          `Generation rate limit reached (${this.limit} per ` +
            `${Math.round(this.windowMs / 60_000)} min). Try again in ~${retryInMin} min.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      timestamps.push(now);
      const ttlSec = Math.ceil(this.windowMs / 1000);
      await this.cacheService.set(redisKey, timestamps, ttlSec);
      return;
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw err;
      }
      // If Redis operation failed, proceed with in-memory fallback
    }

    // 2. In-Memory fallback with strict boundary limits
    const memHits = (this.hits.get(key) ?? []).filter((t) => t > windowStart);

    if (memHits.length >= this.limit) {
      const retryInMin = Math.ceil((memHits[0] + this.windowMs - now) / 60_000);
      throw new HttpException(
        `Generation rate limit reached (${this.limit} per ` +
          `${Math.round(this.windowMs / 60_000)} min). Try again in ~${retryInMin} min.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    memHits.push(now);
    this.hits.set(key, memHits);

    // Evict old entries if memory map grows large
    if (this.hits.size > this.MAX_TRACKED_USERS) {
      for (const [k, timestamps] of this.hits.entries()) {
        const active = timestamps.filter((t) => t > windowStart);
        if (active.length === 0) {
          this.hits.delete(k);
        }
      }
    }
  }
}
