import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { PROFILE_CACHE_TTL_SECONDS } from '../../config/auth.config';
import type { ProfileRecord, AppRole } from './profile-role.util';

/**
 * Resolves user profiles with a read-through cache:
 *   Redis cache  →  PostgreSQL (source of truth)
 *
 * Postgres is always authoritative. Redis is a performance layer only: if it is
 * unavailable, `RedisService` returns null and we transparently fall back to
 * the database, so authorization never depends on Redis being up.
 */
@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly dataSource: DataSource,
  ) {}

  private cacheKey(userId: string): string {
    return `user:${userId}:profile`;
  }

  async getProfile(userId: string): Promise<ProfileRecord | null> {
    const cached = await this.redis.get<ProfileRecord>(this.cacheKey(userId));
    if (cached) return cached;

    try {
      // 1. Query Better Auth "user" table
      const rows = await this.dataSource.query(
        'SELECT id, email, name, image as avatar_url, role, "createdAt" as created_at, "updatedAt" as updated_at FROM "user" WHERE id = $1 LIMIT 1',
        [userId],
      );

      if (rows && rows.length > 0) {
        const u = rows[0];
        const profile: ProfileRecord = {
          id: u.id,
          email: u.email,
          name: u.name,
          avatar_url: u.avatar_url,
          role: ((u.role || 'USER').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER') as AppRole,
          created_at: u.created_at,
          updated_at: u.updated_at,
        };
        await this.redis.set(this.cacheKey(userId), profile, PROFILE_CACHE_TTL_SECONDS);
        return profile;
      }

      // 2. Fallback to legacy public.users table if not in "user"
      const legacyRows = await this.dataSource.query(
        'SELECT id, email, full_name as name, avatar_url, role, is_active, created_at, updated_at FROM users WHERE id = $1 LIMIT 1',
        [userId],
      );

      if (legacyRows && legacyRows.length > 0) {
        const u = legacyRows[0];
        const profile: ProfileRecord = {
          id: u.id,
          email: u.email,
          name: u.name,
          avatar_url: u.avatar_url,
          role: ((u.role || 'USER').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER') as AppRole,
          isActive: u.is_active !== false,
          created_at: u.created_at,
          updated_at: u.updated_at,
        };
        await this.redis.set(this.cacheKey(userId), profile, PROFILE_CACHE_TTL_SECONDS);
        return profile;
      }

      return null;
    } catch (err: any) {
      this.logger.warn(`PostgreSQL profile lookup failed for ${userId}: ${err.message}`);
      return null;
    }
  }

  /** Drop a cached profile after a trusted change (e.g. admin role assignment). */
  async invalidate(userId: string): Promise<void> {
    await this.redis.del(this.cacheKey(userId));
  }
}
