import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

interface MemoryCacheEntry {
  value: string;
  expiresAt: number;
}

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private redisClient: Redis | null = null;
  private isRedisConnected = false;
  private readonly memoryCache = new Map<string, MemoryCacheEntry>();

  constructor() {
    this.initRedis();
  }

  private initRedis() {
    const redisHost = process.env.REDIS_HOST || '127.0.0.1';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    const redisPassword = process.env.REDIS_PASSWORD || undefined;

    try {
      this.redisClient = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        lazyConnect: true,
        connectTimeout: 1500,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 3) {
            return null; // Stop retrying and seamlessly use in-memory cache
          }
          return Math.min(times * 1000, 3000);
        },
      });

      this.redisClient.on('connect', () => {
        this.isRedisConnected = true;
        this.logger.log(`Redis connected on ${redisHost}:${redisPort}`);
      });

      this.redisClient.on('error', (err) => {
        this.isRedisConnected = false;
        // Suppress noisy logs, gracefully fallback
      });

      this.redisClient.connect().catch(() => {
        this.isRedisConnected = false;
        this.logger.log(
          'Redis server offline. High-performance in-memory cache activated.',
        );
      });
    } catch (err: any) {
      this.isRedisConnected = false;
      this.logger.log(`Using in-memory cache: ${err.message}`);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.isRedisConnected && this.redisClient) {
      try {
        const raw = await this.redisClient.get(key);
        if (raw) return JSON.parse(raw) as T;
      } catch {
        // Fall back to memory cache
      }
    }

    const entry = this.memoryCache.get(key);
    if (entry) {
      if (Date.now() > entry.expiresAt) {
        this.memoryCache.delete(key);
        return null;
      }
      return JSON.parse(entry.value) as T;
    }

    return null;
  }

  async set(key: string, value: any, ttlSeconds = 60): Promise<void> {
    const serialized = JSON.stringify(value);

    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.setex(key, ttlSeconds, serialized);
      } catch {
        // Fall back to memory
      }
    }

    this.memoryCache.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    // Clean up expired keys if memory cache grows large
    if (this.memoryCache.size > 500) {
      const now = Date.now();
      for (const [k, v] of this.memoryCache.entries()) {
        if (now > v.expiresAt) this.memoryCache.delete(k);
      }
    }
  }

  async del(key: string): Promise<void> {
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch {}
    }
    this.memoryCache.delete(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const k of this.memoryCache.keys()) {
      if (regex.test(k)) {
        this.memoryCache.delete(k);
      }
    }

    if (this.isRedisConnected && this.redisClient) {
      try {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      } catch {}
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
      } catch {}
    }
  }
}
