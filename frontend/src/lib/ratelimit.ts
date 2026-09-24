import { redis } from './redis';

export interface RateLimitResult {
  success: boolean;
  remaining: number;
}

const DEFAULT_MAX = Number(process.env.AUTH_RATELIMIT_MAX ?? 10);
const DEFAULT_WINDOW_SECONDS = 60;

/**
 * Provider-agnostic rate limiter for auth-sensitive operations.
 * Fails OPEN: If Redis is unavailable, requests are permitted.
 */
export async function rateLimit(
  identifier: string,
  limit = DEFAULT_MAX,
  windowSeconds = DEFAULT_WINDOW_SECONDS,
): Promise<RateLimitResult> {
  const key = `ratelimit:auth:${identifier}`;
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    if (current > limit) {
      return { success: false, remaining: 0 };
    }

    return { success: true, remaining: Math.max(0, limit - current) };
  } catch {
    // Fail OPEN if Redis fails
    return { success: true, remaining: limit };
  }
}
