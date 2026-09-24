import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { Redis as UpstashRedis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import {
  REDIS_URL,
  UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN,
} from '../../config/auth.config';

type SlidingWindow = Parameters<typeof Ratelimit.slidingWindow>[1];

/**
 * Provider-Agnostic Redis Service for Backend.
 *
 * Supports:
 *   1. Standard Redis via REDIS_URL using ioredis (TCP/TLS) — works with Local Redis,
 *      Redis Cloud, AWS ElastiCache, Railway, Render, etc.
 *   2. Upstash Redis via UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (HTTP REST).
 *
 * Guaranteed fail-open behavior: failures in caching/rate-limiting never crash
 * business logic or authentication.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private ioRedisClient: Redis | null = null;
  private upstashClient: UpstashRedis | null = null;
  private readonly limiters = new Map<string, Ratelimit>();

  constructor() {
    this.initClient();
  }

  get enabled(): boolean {
    return Boolean(REDIS_URL || (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN));
  }

  private initClient() {
    if (REDIS_URL) {
      try {
        this.ioRedisClient = new Redis(REDIS_URL, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          connectTimeout: 2000,
        });
        this.ioRedisClient.on('error', (err) => {
          this.logger.warn(`Standard Redis connection error: ${err.message}`);
        });
        this.logger.log('Initialized standard Redis client (ioredis).');
        return;
      } catch (err: any) {
        this.logger.warn(`Failed to initialize ioredis: ${err.message}`);
      }
    }

    if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
      try {
        this.upstashClient = new UpstashRedis({
          url: UPSTASH_REDIS_REST_URL,
          token: UPSTASH_REDIS_REST_TOKEN,
        });
        this.logger.log('Initialized Upstash REST client.');
        return;
      } catch (err: any) {
        this.logger.warn(`Failed to initialize Upstash REST client: ${err.message}`);
      }
    }
  }

  async onModuleDestroy() {
    if (this.ioRedisClient) {
      try {
        await this.ioRedisClient.quit();
      } catch {}
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) return null;

    if (this.ioRedisClient) {
      try {
        const raw = await this.ioRedisClient.get(key);
        if (!raw) return null;
        try {
          return JSON.parse(raw) as T;
        } catch {
          return raw as unknown as T;
        }
      } catch (err: any) {
        this.logger.warn(`Redis GET failed for "${key}": ${err.message}`);
        return null;
      }
    }

    if (this.upstashClient) {
      try {
        const res = await this.upstashClient.get<T>(key);
        return res ?? null;
      } catch (err: any) {
        this.logger.warn(`Upstash GET failed for "${key}": ${err.message}`);
        return null;
      }
    }

    return null;
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    if (!this.enabled) return;

    if (this.ioRedisClient) {
      try {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        if (ttlSeconds > 0) {
          await this.ioRedisClient.set(key, serialized, 'EX', ttlSeconds);
        } else {
          await this.ioRedisClient.set(key, serialized);
        }
        return;
      } catch (err: any) {
        this.logger.warn(`Redis SET failed for "${key}": ${err.message}`);
      }
    }

    if (this.upstashClient) {
      try {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        if (ttlSeconds > 0) {
          await this.upstashClient.set(key, serialized, { ex: ttlSeconds });
        } else {
          await this.upstashClient.set(key, serialized);
        }
        return;
      } catch (err: any) {
        this.logger.warn(`Upstash SET failed for "${key}": ${err.message}`);
      }
    }
  }

  async del(key: string): Promise<void> {
    if (!this.enabled) return;

    if (this.ioRedisClient) {
      try {
        await this.ioRedisClient.del(key);
      } catch (err: any) {
        this.logger.warn(`Redis DEL failed for "${key}": ${err.message}`);
      }
    }

    if (this.upstashClient) {
      try {
        await this.upstashClient.del(key);
      } catch (err: any) {
        this.logger.warn(`Upstash DEL failed for "${key}": ${err.message}`);
      }
    }
  }

  async limit(
    name: string,
    identifier: string,
    tokens: number,
    window: string,
  ): Promise<{ success: boolean; remaining: number }> {
    if (!this.enabled) {
      return { success: true, remaining: tokens };
    }

    if (this.upstashClient) {
      const cacheKey = `${name}:${tokens}:${window}`;
      let limiter = this.limiters.get(cacheKey);
      if (!limiter) {
        limiter = new Ratelimit({
          redis: this.upstashClient,
          limiter: Ratelimit.slidingWindow(tokens, window as SlidingWindow),
          prefix: `ratelimit:${name}`,
          analytics: false,
        });
        this.limiters.set(cacheKey, limiter);
      }
      try {
        const res = await limiter.limit(identifier);
        return { success: res.success, remaining: res.remaining };
      } catch (err: any) {
        this.logger.warn(`Upstash rate-limit check failed: ${err.message}; failing open.`);
        return { success: true, remaining: tokens };
      }
    }

    if (this.ioRedisClient) {
      try {
        const key = `ratelimit:${name}:${identifier}`;
        const current = await this.ioRedisClient.incr(key);
        if (current === 1) {
          const seconds = parseInt(window, 10) || 60;
          await this.ioRedisClient.expire(key, seconds);
        }
        if (current > tokens) {
          return { success: false, remaining: 0 };
        }
        return { success: true, remaining: tokens - current };
      } catch (err: any) {
        this.logger.warn(`Redis rate-limit check failed: ${err.message}; failing open.`);
        return { success: true, remaining: tokens };
      }
    }

    return { success: true, remaining: tokens };
  }
}
