import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { RedisService } from '../auth/redis/redis.service';
import { ProfilesService } from '../auth/profiles/profiles.service';
import type { AppRole, ProfileRecord } from '../auth/profiles/profile-role.util';
import { CreateAdminUserDto, UpdateAdminUserDto } from './dto/admin-user.dto';
import { SUBSCRIPTION_PLANS } from '../billing/billing.service';

export interface AdminUserRecord extends ProfileRecord {
  isActive: boolean;
  credits: number;
  plan: string;
  subscriptionStatus?: string;
  renewsAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  avatarUrl?: string | null;
}

/**
 * Admin-only operations over PostgreSQL users and billing entities.
 * Synchronizes with Better Auth and TypeORM users table.
 */
@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly profiles: ProfilesService,
    private readonly redis: RedisService,
  ) {}

  async listProfiles(search?: string, limit = 100): Promise<AdminUserRecord[]> {
    try {
      let query = `
        SELECT 
          u.id, 
          u.email, 
          COALESCE(u.name, pu.name) as name, 
          COALESCE(u.image, pu.avatar_url) as avatar_url, 
          u.role, 
          COALESCE(pu.is_active, u."isActive", true) as is_active,
          COALESCE(pu.credits, 50) as credits,
          COALESCE(pu.plan, 'free_trial') as plan,
          s.status as subscription_status,
          s.current_period_end as renews_at,
          u."createdAt" as created_at, 
          u."updatedAt" as updated_at
        FROM "user" u
        LEFT JOIN users pu ON LOWER(pu.email) = LOWER(u.email)
        LEFT JOIN user_subscriptions s ON s.user_id = pu.id
      `;
      const params: any[] = [];

      if (search && search.trim()) {
        query += ` WHERE LOWER(u.email) LIKE $1 OR LOWER(COALESCE(u.name, pu.name)) LIKE $1`;
        params.push(`%${search.trim().toLowerCase()}%`);
      }

      query += ` ORDER BY u."createdAt" DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const rows = await this.dataSource.query(query, params);
      return rows.map((r: any) => ({
        id: r.id,
        email: r.email,
        name: r.name || (r.email ? r.email.split('@')[0] : 'User'),
        avatar_url: r.avatar_url,
        avatarUrl: r.avatar_url,
        role: (r.role || 'USER').toUpperCase() as AppRole,
        isActive: Boolean(r.is_active),
        credits: Number(r.credits) || 0,
        plan: r.plan || 'free_trial',
        subscriptionStatus: r.subscription_status || (r.plan && r.plan !== 'free_trial' ? 'active' : 'inactive'),
        renewsAt: r.renews_at ? new Date(r.renews_at).toISOString() : null,
        created_at: r.created_at,
        updated_at: r.updated_at,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      }));
    } catch (err: any) {
      this.logger.error(`Failed to list users from database: ${err.message}`);
      return [];
    }
  }

  /**
   * Registers/Creates a new user via Admin.
   * Creates records in both Better Auth ("user" + "account") and legacy ("users")
   * with secure bcrypt password hashing. Allows immediate login via both systems.
   */
  async createUser(dto: CreateAdminUserDto): Promise<AdminUserRecord> {
    const email = dto.email.trim().toLowerCase();
    const name = dto.name.trim();
    const role = (dto.role || 'USER').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER';
    const plan = dto.plan || 'free_trial';
    const planConfig = SUBSCRIPTION_PLANS[plan];
    const credits = dto.credits !== undefined ? dto.credits : planConfig?.monthlyCredits || 50;
    const isActive = dto.isActive !== false;

    // Check duplicate in both tables
    const existing = await this.dataSource.query(
      `SELECT email FROM "user" WHERE LOWER(email) = LOWER($1) 
       UNION 
       SELECT email FROM users WHERE LOWER(email) = LOWER($1) 
       LIMIT 1`,
      [email],
    );

    if (existing && existing.length > 0) {
      throw new BadRequestException('An account with this email address already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const genuineUserId = crypto.randomUUID();
      const accountId = `acc_${crypto.randomBytes(12).toString('hex')}`;

      // 1. Insert into Better Auth "user"
      await queryRunner.query(
        `INSERT INTO "user" ("id", "name", "email", "emailVerified", "role", "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, true, $4, $5, NOW(), NOW())`,
        [genuineUserId, name, email, role, isActive],
      );

      // 2. Insert into Better Auth "account" (credential provider with bcrypt password)
      await queryRunner.query(
        `INSERT INTO "account" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
         VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())`,
        [accountId, genuineUserId, genuineUserId, passwordHash],
      );

      // 3. Insert into public.users (legacy/typeorm sync)
      await queryRunner.query(
        `INSERT INTO users ("id", "better_auth_id", "email", "name", "password_hash", "role", "is_active", "credits", "plan", "auth_provider", "created_at", "updated_at")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'local', NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           name = EXCLUDED.name,
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           is_active = EXCLUDED.is_active,
           credits = EXCLUDED.credits,
           plan = EXCLUDED.plan,
           updated_at = NOW()`,
        [
          genuineUserId,
          genuineUserId,
          email,
          name,
          passwordHash,
          role.toLowerCase(),
          isActive,
          credits,
          plan,
        ],
      );

      // 4. If paid plan, create subscription record
      if (plan !== 'free_trial' && planConfig) {
        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await queryRunner.query(
          `INSERT INTO user_subscriptions ("id", "user_id", "plan", "status", "pricing_amount", "currency", "current_period_start", "current_period_end", "cancel_at_period_end", "provider", "created_at", "updated_at")
           VALUES (gen_random_uuid(), $1, $2, 'active', $3, $4, $5, $6, false, 'admin_provisioned', NOW(), NOW())`,
          [genuineUserId, plan, planConfig.price, planConfig.currency, now, periodEnd],
        );
      }

      // 5. Record initial credit transaction
      if (credits > 0) {
        await queryRunner.query(
          `INSERT INTO credit_transactions ("id", "user_id", "amount", "balance_after", "description", "created_at")
           VALUES (gen_random_uuid(), $1, $2, $2, 'Admin initial credit allocation', NOW())`,
          [genuineUserId, credits],
        );
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Admin created new user account: ${email} (${role}, ${plan})`);

      return {
        id: genuineUserId,
        email,
        name,
        role: role as AppRole,
        isActive,
        credits,
        plan,
        subscriptionStatus: plan !== 'free_trial' ? 'active' : 'inactive',
        created_at: new Date(),
        updated_at: new Date(),
      };
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Admin failed to create user ${email}: ${err.message}`);
      throw new BadRequestException(`Failed to create user: ${err.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Updates an existing user's details (name, role, status, plan, credits, password)
   */
  async updateUser(id: string, dto: UpdateAdminUserDto): Promise<AdminUserRecord> {
    const userRows = await this.dataSource.query(
      `SELECT u.id, u.email, pu.id as genuine_id FROM "user" u 
       LEFT JOIN users pu ON LOWER(pu.email) = LOWER(u.email)
       WHERE u.id = $1 OR pu.id::text = $1 LIMIT 1`,
      [id],
    );

    if (!userRows || userRows.length === 0) {
      throw new NotFoundException(`User with ID "${id}" was not found.`);
    }

    const { email } = userRows[0];
    const genuineId = userRows[0].genuine_id || userRows[0].id;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Name update
      if (dto.name) {
        await queryRunner.query(
          `UPDATE "user" SET name = $1, "updatedAt" = NOW() WHERE LOWER(email) = LOWER($2)`,
          [dto.name.trim(), email],
        );
        await queryRunner.query(
          `UPDATE users SET name = $1, updated_at = NOW() WHERE LOWER(email) = LOWER($2)`,
          [dto.name.trim(), email],
        );
      }

      // 2. Role update
      if (dto.role) {
        const valRole = dto.role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER';
        await queryRunner.query(
          `UPDATE "user" SET role = $1, "updatedAt" = NOW() WHERE LOWER(email) = LOWER($2)`,
          [valRole, email],
        );
        await queryRunner.query(
          `UPDATE users SET role = $1, updated_at = NOW() WHERE LOWER(email) = LOWER($2)`,
          [valRole.toLowerCase(), email],
        );
      }

      // 3. Status update
      if (dto.isActive !== undefined) {
        await queryRunner.query(
          `UPDATE "user" SET "isActive" = $1, "updatedAt" = NOW() WHERE LOWER(email) = LOWER($2)`,
          [dto.isActive, email],
        );
        await queryRunner.query(
          `UPDATE users SET is_active = $1, updated_at = NOW() WHERE LOWER(email) = LOWER($2)`,
          [dto.isActive, email],
        );
      }

      // 4. Plan update
      if (dto.plan) {
        const planKey = dto.plan;
        await queryRunner.query(
          `UPDATE users SET plan = $1, updated_at = NOW() WHERE LOWER(email) = LOWER($2)`,
          [planKey, email],
        );

        if (planKey !== 'free_trial') {
          const planConfig = SUBSCRIPTION_PLANS[planKey];
          const now = new Date();
          const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          await queryRunner.query(
            `INSERT INTO user_subscriptions ("id", "user_id", "plan", "status", "price", "currency", "current_period_start", "current_period_end", "cancel_at_period_end", "provider", "created_at", "updated_at")
             VALUES (gen_random_uuid(), $1, $2, 'active', $3, $4, $5, $6, false, 'admin_update', NOW(), NOW())
             ON CONFLICT ("id") DO NOTHING`,
            [genuineId, planKey, planConfig?.price || 0, planConfig?.currency || 'PKR', now, periodEnd],
          );
        }
      }

      // 5. Credits update
      if (dto.credits !== undefined) {
        await queryRunner.query(
          `UPDATE users SET credits = $1, updated_at = NOW() WHERE LOWER(email) = LOWER($2)`,
          [dto.credits, email],
        );
        await queryRunner.query(
          `INSERT INTO credit_transactions ("id", "user_id", "amount", "balance_after", "description", "created_at")
           VALUES (gen_random_uuid(), $1, 0, $2, 'Admin credit adjustment', NOW())`,
          [genuineId, dto.credits],
        );
      }

      // 6. Password update
      if (dto.password) {
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(dto.password, salt);

        await queryRunner.query(
          `UPDATE "account" SET password = $1, "updatedAt" = NOW() 
           WHERE "userId" IN (SELECT id FROM "user" WHERE LOWER(email) = LOWER($2)) AND "providerId" = 'credential'`,
          [newHash, email],
        );
        await queryRunner.query(
          `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE LOWER(email) = LOWER($2)`,
          [newHash, email],
        );
      }

      await queryRunner.commitTransaction();
      await this.profiles.invalidate(id);

      const all = await this.listProfiles();
      const updated = all.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (!updated) {
        throw new NotFoundException(`User with ID "${id}" was not found.`);
      }
      return updated;
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async setRole(id: string, role: AppRole): Promise<AdminUserRecord> {
    return this.updateUser(id, { role });
  }

  async setStatus(id: string, isActive: boolean): Promise<AdminUserRecord> {
    return this.updateUser(id, { isActive });
  }

  async deleteUser(id: string): Promise<void> {
    await this.dataSource.query(`DELETE FROM "user" WHERE id = $1`, [id]);
    await this.dataSource.query(`DELETE FROM users WHERE id::text = $1`, [id]).catch(() => {});
    await this.profiles.invalidate(id);
  }

  /**
   * Retrieves complete billing, subscription, and payment records for a user
   */
  async getUserBilling(id: string) {
    const userRows = await this.dataSource.query(
      `SELECT u.id, u.email, u.name, pu.id as genuine_id, pu.credits, pu.plan 
       FROM "user" u 
       LEFT JOIN users pu ON LOWER(pu.email) = LOWER(u.email)
       WHERE u.id = $1 OR pu.id::text = $1 LIMIT 1`,
      [id],
    );

    if (!userRows || userRows.length === 0) {
      throw new NotFoundException(`User with ID "${id}" was not found.`);
    }

    const u = userRows[0];
    const genuineId = u.genuine_id || u.id;

    const subscriptions = await this.dataSource.query(
      `SELECT * FROM user_subscriptions WHERE user_id = $1 ORDER BY created_at DESC`,
      [genuineId],
    );

    const payments = await this.dataSource.query(
      `SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [genuineId],
    );

    const transactions = await this.dataSource.query(
      `SELECT * FROM credit_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [genuineId],
    );

    return {
      user: {
        id: u.id,
        email: u.email,
        name: u.name,
        credits: u.credits ?? 50,
        plan: u.plan || 'free_trial',
      },
      currentSubscription: subscriptions[0] || null,
      subscriptions,
      payments,
      transactions,
    };
  }
}
