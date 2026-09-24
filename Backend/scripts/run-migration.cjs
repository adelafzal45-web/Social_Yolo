const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function run() {
  const connectionString = 'postgresql://postgres:admin@localhost:5432/social_yolo';
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('[Migration] Connected to PostgreSQL (social_yolo).');

    const sqlPath = path.resolve(__dirname, '../src/database/migrations/0002_better_auth.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query(sql);
    console.log('[Migration] 0002_better_auth.sql applied successfully.');

    const userRes = await client.query('SELECT COUNT(*) FROM "user"');
    const sessionRes = await client.query('SELECT COUNT(*) FROM "session"');
    const accountRes = await client.query('SELECT COUNT(*) FROM "account"');
    const verificationRes = await client.query('SELECT COUNT(*) FROM "verification"');

    console.log(`[Migration] Success! Records: user=${userRes.rows[0].count}, session=${sessionRes.rows[0].count}, account=${accountRes.rows[0].count}, verification=${verificationRes.rows[0].count}`);
    
    // Sample preview of migrated users
    const sampleUsers = await client.query('SELECT id, name, email, role, "isActive" FROM "user" LIMIT 5');
    console.log('[Migration] Sample users:', sampleUsers.rows);
  } catch (err) {
    console.error('[Migration] Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
