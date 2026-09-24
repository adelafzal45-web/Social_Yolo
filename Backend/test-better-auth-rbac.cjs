const http = require('http');
const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/Users/Haseeb Iqbal/Desktop/SocialYolo/Social_Yolo/Backend/.env' });

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3001';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/social_yolo';
const dbPool = new Pool({
  connectionString,
  ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
});

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log('  [PASS] ' + message);
    passed++;
  } else {
    console.error('  [FAIL] ' + message);
    failed++;
  }
}

function parseCookies(setCookieHeader) {
  if (!setCookieHeader) return '';
  const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  return headers.map(h => h.split(';')[0]).join('; ');
}

async function request(baseUrl, path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(baseUrl + path);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    if (body && !reqOptions.headers['Content-Type']) {
      reqOptions.headers['Content-Type'] = 'application/json';
    }
    if (!reqOptions.headers['Origin']) {
      reqOptions.headers['Origin'] = FRONTEND_URL;
    }

    const req = http.request(reqOptions, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        let data = buffer.toString();
        try {
          data = JSON.parse(data);
        } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data,
          cookies: parseCookies(res.headers['set-cookie']),
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Better Auth & RBAC End-to-End Test Suite ---\n');

  const randomSuffix = Math.floor(Math.random() * 1000000);
  const testUserEmail = 'testuser_' + randomSuffix + '@example.com';
  const testPassword = 'Password@123';
  const testUserName = 'Test User ' + randomSuffix;

  // 1. Better Auth Sign-Up (Default role = USER)
  console.log('1. Testing User Sign-Up via Better Auth...');
  const signUpRes = await request(FRONTEND_URL, '/api/auth/sign-up/email', {
    method: 'POST',
  }, {
    name: testUserName,
    email: testUserEmail,
    password: testPassword,
  });

  assert(signUpRes.status === 200 || signUpRes.status === 201, 'Sign-up endpoint returned ' + signUpRes.status);
  const userCookie = signUpRes.cookies;
  assert(Boolean(userCookie), 'Sign-up returned session cookies');

  // Verify directly in PostgreSQL that role is USER
  const dbUserRes = await dbPool.query('SELECT id, email, role FROM "user" WHERE email = $1', [testUserEmail]);
  assert(dbUserRes.rows.length === 1, 'New user record exists in PostgreSQL user table');
  const createdUser = dbUserRes.rows[0];
  assert(createdUser.role === 'USER', 'User role defaults to USER in database (got: ' + createdUser.role + ')');

  // 2. Privilege Escalation Prevention Test
  console.log('\n2. Testing Privilege Escalation Attack Prevention...');
  const hackerEmail = 'hacker_' + randomSuffix + '@example.com';
  const attackRes = await request(FRONTEND_URL, '/api/auth/sign-up/email', {
    method: 'POST',
  }, {
    name: 'Malicious Actor',
    email: hackerEmail,
    password: testPassword,
    role: 'ADMIN',
  });

  const dbHackerRes = await dbPool.query('SELECT id, email, role FROM "user" WHERE email = $1', [hackerEmail]);
  assert(dbHackerRes.rows.length === 1, 'Attacker record created');
  assert(dbHackerRes.rows[0].role === 'USER', 'Privilege escalation blocked: role forced to USER (got: ' + dbHackerRes.rows[0].role + ')');

  // 3. User Sign-In & Session Persistence
  console.log('\n3. Testing Sign-In and Session Cookie Verification...');
  const signInRes = await request(FRONTEND_URL, '/api/auth/sign-in/email', {
    method: 'POST',
  }, {
    email: testUserEmail,
    password: testPassword,
  });

  assert(signInRes.status === 200, 'Sign-in returned HTTP 200');
  const activeUserCookie = signInRes.cookies || userCookie;
  assert(Boolean(activeUserCookie), 'Sign-in set active session cookie');

  // Verify session exists in PostgreSQL session table
  const dbSessionRes = await dbPool.query('SELECT * FROM session WHERE "userId" = $1', [createdUser.id]);
  assert(dbSessionRes.rows.length >= 1, 'Active session record verified in PostgreSQL session table');

  // 4. RBAC: Standard USER attempting to access Admin endpoints
  console.log('\n4. Testing RBAC: Standard USER accessing protected Admin routes...');
  const userAdminCheck = await request(FRONTEND_URL, '/api/proxy/users', {
    method: 'GET',
    headers: { Cookie: activeUserCookie },
  });

  assert(userAdminCheck.status === 403, 'Standard user is forbidden from /api/users (HTTP 403, got: ' + userAdminCheck.status + ')');

  // 5. RBAC: Standard USER attempting to modify user roles
  console.log('\n5. Testing RBAC: Standard USER attempting role promotion...');
  const userPatchRoleCheck = await request(FRONTEND_URL, '/api/proxy/users/' + createdUser.id + '/role', {
    method: 'PATCH',
    headers: { Cookie: activeUserCookie },
  }, {
    role: 'ADMIN',
  });

  assert(userPatchRoleCheck.status === 403, 'Standard user cannot promote users (HTTP 403, got: ' + userPatchRoleCheck.status + ')');

  // 6. RBAC: ADMIN User Access
  console.log('\n6. Testing RBAC: ADMIN access to Admin endpoints...');
  const adminLoginRes = await request(FRONTEND_URL, '/api/auth/sign-in/email', {
    method: 'POST',
  }, {
    email: 'admin@socialyolo.local',
    password: 'Admin@123',
  });

  assert(adminLoginRes.status === 200, 'Admin sign-in succeeded');
  const adminCookie = adminLoginRes.cookies;

  const adminUsersList = await request(FRONTEND_URL, '/api/proxy/users', {
    method: 'GET',
    headers: { Cookie: adminCookie },
  });

  assert(adminUsersList.status === 200, 'Admin successfully fetched users list (HTTP 200, got: ' + adminUsersList.status + ')');
  assert(Array.isArray(adminUsersList.data.users || adminUsersList.data), 'Admin users endpoint returned array of users');

  // 7. Admin Status Management
  console.log('\n7. Testing Admin user status toggle...');
  const toggleStatusRes = await request(FRONTEND_URL, '/api/proxy/users/' + createdUser.id + '/status', {
    method: 'PATCH',
    headers: { Cookie: adminCookie },
  }, {
    isActive: false,
  });

  assert(toggleStatusRes.status === 200, 'Admin successfully updated user active status');

  const dbStatusCheck = await dbPool.query('SELECT "isActive" FROM "user" WHERE id = $1', [createdUser.id]);
  assert(dbStatusCheck.rows[0].isActive === false, 'User status successfully set to inactive in database');

  // 8. Better Auth Sign-Out & Session Revocation
  console.log('\n8. Testing Sign-Out and Session Revocation...');
  const signOutRes = await request(FRONTEND_URL, '/api/auth/sign-out', {
    method: 'POST',
    headers: { Cookie: activeUserCookie },
  }, {});

  assert(signOutRes.status === 200, 'Sign-out endpoint returned HTTP 200');

  // Clean up test records
  await dbPool.query('DELETE FROM "session" WHERE "userId" IN ($1, $2)', [createdUser.id, dbHackerRes.rows[0].id]);
  await dbPool.query('DELETE FROM "account" WHERE "userId" IN ($1, $2)', [createdUser.id, dbHackerRes.rows[0].id]);
  await dbPool.query('DELETE FROM "user" WHERE id IN ($1, $2)', [createdUser.id, dbHackerRes.rows[0].id]);

  console.log('\n--- Verification Summary: ' + passed + ' Passed, ' + failed + ' Failed ---');
  await dbPool.end();
  if (failed > 0) process.exit(1);
}

runTests().catch(async (err) => {
  console.error('Test run error:', err);
  await dbPool.end();
  process.exit(1);
});
