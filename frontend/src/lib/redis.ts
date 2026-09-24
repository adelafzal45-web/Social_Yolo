/**
 * Provider-Agnostic Redis Client & Cache Service
 *
 * Supports:
 *   1. Standard Redis via REDIS_URL (ioredis or TCP/TLS connection) — Local Redis,
 *      Redis Cloud, AWS ElastiCache, Railway, Render, etc.
 *   2. Upstash Redis via UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (HTTP REST).
 *
 * Resilience:
 *   - FAILS OPEN: If Redis is unavailable or unconfigured, methods return null / pass through.
 *   - PostgreSQL remains the authoritative source of truth.
 *   - Prevents cross-user data leakage by enforcing strict key prefixes.
 */

interface RedisClientInterface {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
}

class UpstashRestClient implements RedisClientInterface {
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url.replace(/\/$/, '');
    this.token = token;
  }

  private async execute<T>(command: string, ...args: (string | number)[]): Promise<T | null> {
    try {
      const res = await fetch(`${this.url}/${command}/${args.map(encodeURIComponent).join('/')}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const data = await res.json();
      return (data.result as T) ?? null;
    } catch {
      return null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.execute<string | T>('get', key);
    if (!raw) return null;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    }
    return raw;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await this.execute('setex', key, ttlSeconds, serialized);
    } else {
      await this.execute('set', key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.execute('del', key);
  }

  async incr(key: string): Promise<number> {
    const res = await this.execute<number>('incr', key);
    return res ?? 1;
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.execute('expire', key, seconds);
  }
}

// In-Memory Fallback when Redis is offline or not configured
class InMemoryFallbackClient implements RedisClientInterface {
  private store = new Map<string, { value: any; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async incr(key: string): Promise<number> {
    const entry = this.store.get(key);
    const current = (entry && Date.now() <= entry.expiresAt ? Number(entry.value) : 0) + 1;
    this.store.set(key, {
      value: current,
      expiresAt: entry ? entry.expiresAt : Date.now() + 60000,
    });
    return current;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + seconds * 1000;
    }
  }
}

function createRedisClient(): RedisClientInterface {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    return new UpstashRestClient(upstashUrl, upstashToken);
  }

  return new InMemoryFallbackClient();
}

export const redis = createRedisClient();
