/**
 * seed-admin.ts — Insert a super-admin user into the database.
 *
 * Inserts into:
 *   1. Better Auth "user" table   (auth identity)
 *   2. Better Auth "account" table (credential provider with bcrypt hash)
 *   3. Legacy "users" table       (TypeORM / billing sync)
 *
 * Usage:
 *   npx ts-node src/database/seed-admin.ts
 */
import * as path from 'path';
import * as crypto from 'crypto';
import { Client } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// ─── Admin credentials ──────────────────────────────────────────────
const ADMIN_EMAIL = 'admin@socialyolo.com';
const ADMIN_PASSWORD = 'Admin@SocialYolo2026';
const ADMIN_NAME = 'Super Admin';
// ─────────────────────────────────────────────────────────────────────

async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    `postgresql://${process.env.DATABASE_USER || 'postgres'}:${encodeURIComponent(
      process.env.DATABASE_PASSWORD || '',
    )}@${process.env.DATABASE_HOST || 'localhost'}:${
      process.env.DATABASE_PORT || '5432'
    }/${process.env.DATABASE_NAME || 'postgres'}`;

  const isLocal =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');

  const client = new Client({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('[Seed] Connected to PostgreSQL.');

    // Check if admin already exists
    const existing = await client.query(
      `SELECT id FROM "user" WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [ADMIN_EMAIL],
    );

    if (existing.rows.length > 0) {
      console.log(`[Seed] Admin user "${ADMIN_EMAIL}" already exists (id: ${existing.rows[0].id}). Skipping.`);
      return;
    }

    const userId = crypto.randomUUID();
    const accountId = `acc_${crypto.randomBytes(12).toString('hex')}`;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);

    await client.query('BEGIN');

    // 1. Better Auth "user" table
    await client.query(
      `INSERT INTO "user" ("id", "name", "email", "emailVerified", "role", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, true, 'ADMIN', true, NOW(), NOW())`,
      [userId, ADMIN_NAME, ADMIN_EMAIL],
    );

    // 2. Better Auth "account" table (credential provider)
    await client.query(
      `INSERT INTO "account" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
       VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())`,
      [accountId, userId, userId, passwordHash],
    );

    // 3. Legacy "users" table (TypeORM)
    await client.query(
      `INSERT INTO users ("id", "better_auth_id", "email", "name", "password_hash", "role", "is_active", "credits", "plan", "auth_provider", "created_at", "updated_at")
       VALUES ($1, $2, $3, $4, $5, 'admin', true, 9999, 'agency', 'local', NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET
         role = 'admin',
         is_active = true,
         credits = 9999,
         plan = 'agency',
         password_hash = EXCLUDED.password_hash,
         better_auth_id = EXCLUDED.better_auth_id,
         updated_at = NOW()`,
      [userId, userId, ADMIN_EMAIL, ADMIN_NAME, passwordHash],
    );

    await client.query('COMMIT');

    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('  ✅ Admin user created successfully!');
    console.log('═══════════════════════════════════════════════');
    console.log(`  Email:    ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log(`  Role:     ADMIN`);
    console.log(`  Plan:     agency`);
    console.log(`  Credits:  9999`);
    console.log(`  User ID:  ${userId}`);
    console.log('═══════════════════════════════════════════════');
    console.log('');
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Seed] Failed to create admin:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
