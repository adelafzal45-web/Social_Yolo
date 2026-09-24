/**
 * Provider-Agnostic Auth, Database & Redis Configuration.
 *
 * Designed to support any PostgreSQL provider (local, Neon, Supabase PostgreSQL, Railway, RDS, etc.)
 * and any Redis provider (local Redis, Upstash, Redis Cloud, AWS ElastiCache, etc.).
 *
 * Every value is optional with fail-safe defaults. Missing services degrade gracefully
 * without crashing the backend process.
 */

function str(name: string): string | undefined {
  const raw = process.env[name];
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

// --- Better Auth & Database -------------------------------------------------
export const DATABASE_URL = str('DATABASE_URL');
export const BETTER_AUTH_SECRET =
  str('BETTER_AUTH_SECRET') ||
  'social-yolo-better-auth-secret-production-key-2026-secure';

// --- Redis (Provider-Agnostic: Standard REDIS_URL or Upstash REST) -----------
export const REDIS_URL = str('REDIS_URL');
export const UPSTASH_REDIS_REST_URL = str('UPSTASH_REDIS_REST_URL');
export const UPSTASH_REDIS_REST_TOKEN = str('UPSTASH_REDIS_REST_TOKEN');

export const REDIS_ENABLED = Boolean(
  REDIS_URL || (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN),
);

// --- Tunables ---------------------------------------------------------------
export const AUTH_RATELIMIT_MAX = int('AUTH_RATELIMIT_MAX', 10);
export const AUTH_RATELIMIT_WINDOW = str('AUTH_RATELIMIT_WINDOW') ?? '60 s';
export const SESSION_CACHE_TTL_SECONDS = int('SESSION_CACHE_TTL_SECONDS', 60);
export const PROFILE_CACHE_TTL_SECONDS = int('PROFILE_CACHE_TTL_SECONDS', 60);
export const DEFAULT_ORGANIZATION_ID = str('DEFAULT_ORGANIZATION_ID');
