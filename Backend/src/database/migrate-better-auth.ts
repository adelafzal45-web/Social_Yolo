import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export async function runBetterAuthMigration(): Promise<void> {
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
    console.log('[Migration] Connected to PostgreSQL.');

    const sqlPath = path.resolve(
      __dirname,
      './migrations/0002_better_auth.sql',
    );
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query(sql);
    console.log('[Migration] 0002_better_auth.sql applied successfully.');

    // Verify migrated counts
    const userCount = await client.query('SELECT COUNT(*) FROM "user"');
    const sessionCount = await client.query('SELECT COUNT(*) FROM "session"');
    const accountCount = await client.query('SELECT COUNT(*) FROM "account"');

    console.log(
      `[Migration] Current records — user: ${userCount.rows[0].count}, session: ${sessionCount.rows[0].count}, account: ${accountCount.rows[0].count}`,
    );
  } catch (err: any) {
    console.error('[Migration] Migration failed:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  runBetterAuthMigration()
    .then(() => {
      console.log('[Migration] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migration] Fatal error:', err);
      process.exit(1);
    });
}
