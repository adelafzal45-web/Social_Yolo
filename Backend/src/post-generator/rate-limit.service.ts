import {
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

/**
 * Minimal in-memory sliding-window rate limiter for the Gemini generate
 * endpoint (cost control — every generation attempt costs API quota).
 *
 * Scoped per `x-user-id` (or a shared 'anonymous' bucket while no auth
 * exists). Resets on backend restart; swap for a Redis-backed limiter
 * when running multiple instances.
 */
@Injectable()
export class RateLimitService {
  private readonly hits = new Map<string, number[]>();
  private readonly limit: number;
  private readonly windowMs: number;

  constructor() {
    this.limit = Number(process.env.POSTGEN_RATE_LIMIT ?? 10);
    this.windowMs = Number(process.env.POSTGEN_RATE_WINDOW_MIN ?? 60) * 60_000;
  }

  /**
   * Registers one generation attempt for `key`.
   * Throws 429 when the caller already used up the window's budget.
   */
  consume(key: string): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const hits = (this.hits.get(key) ?? []).filter((t) => t > windowStart);

    if (hits.length >= this.limit) {
      const retryInMin = Math.ceil((hits[0] + this.windowMs - now) / 60_000);
      throw new HttpException(
        `Generation rate limit reached (${this.limit} per ` +
          `${Math.round(this.windowMs / 60_000)} min). Try again in ~${retryInMin} min.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    hits.push(now);
    this.hits.set(key, hits);
  }
}