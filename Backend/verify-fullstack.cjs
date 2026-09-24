/**
 * Social Yolo — Full-Stack Real Backend Verification Suite
 * Tests all PostgreSQL-backed REST APIs, Auth, Brands, Projects, Credits, Billing PDF, Teams, AI Router, and Generation
 */

const http = require('http');

const PORT = 3002;
const BASE_URL = `http://localhost:${PORT}/api`;

async function request(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    if (body) {
      if (!reqOptions.headers['Content-Type']) {
        reqOptions.headers['Content-Type'] = 'application/json';
      }
    }

    const req = http.request(reqOptions, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentType = res.headers['content-type'] || '';
        let data = buffer;
        if (contentType.includes('application/json')) {
          try {
            data = JSON.parse(buffer.toString());
          } catch (e) {
            data = buffer.toString();
          }
        }
        resolve({ status: res.statusCode, headers: res.headers, data, buffer });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runVerification() {
  console.log('--- Starting Social Yolo Full-Stack Verification Suite ---');

  // 1. Health check
  const health = await request('/image-processing/health');
  assert(health.status === 200 && health.data.available === true, 'Health endpoint returns 200 OK');

  // 2. Authentication with Admin
  const adminLogin = await request('/auth/login', { method: 'POST' }, {
    email: 'admin@socialyolo.local',
    password: 'Admin@123',
  });
  assert(adminLogin.status === 200 && !!adminLogin.data.accessToken, 'Admin login succeeds with JWT');
  const adminToken = adminLogin.data.accessToken;

  // 3. Authentication with Creator (Riya)
  const riyaLogin = await request('/auth/login', { method: 'POST' }, {
    email: 'riya@brightpath.agency',
    password: 'Creator@123',
  });
  assert(riyaLogin.status === 200 && !!riyaLogin.data.accessToken, 'Riya (Creator) login succeeds');
  const token = riyaLogin.data.accessToken;

  // 4. Get Current Profile
  const me = await request('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(me.status === 200 && me.data.user.email === 'riya@brightpath.agency', 'GET /auth/me returns live user record');
  assert(!!me.data.organization && me.data.organization.name === 'Brightpath Agency', 'GET /auth/me returns organization entity');

  // 5. Brands API
  const brands = await request('/brands', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(brands.status === 200 && Array.isArray(brands.data) && brands.data.length > 0, 'GET /brands returns seeded brands');
  const testBrandId = brands.data[0].id;

  // 6. Projects API (List & Get)
  const projects = await request('/projects', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(projects.status === 200 && Array.isArray(projects.data), 'GET /projects returns projects list');

  // Create Project
  const newProj = await request('/projects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }, {
    name: 'Verification Campaign Project',
    brandId: testBrandId,
    clientFolder: 'Verification Folder',
    platforms: ['instagram_portrait', 'facebook_feed'],
    style: 'lifestyle',
  });
  assert(newProj.status === 201 && newProj.data.name === 'Verification Campaign Project', 'POST /projects creates new project');
  const projId = newProj.data.id;

  // 7. Credits Balance
  const balance = await request('/credits/balance', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(balance.status === 200 && typeof balance.data.balance === 'number', 'GET /credits/balance returns real credit balance');

  // Top Up Credits
  const topUp = await request('/credits/top-up', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }, {
    amount: 50,
    costCents: 500,
  });
  assert(topUp.status === 201 && topUp.data.account.balance >= 50, 'POST /credits/top-up adds credits and generates invoice');

  // 8. Billing API & PDF Invoice Generation
  const invoices = await request('/billing/invoices', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(invoices.status === 200 && invoices.data.length > 0, 'GET /billing/invoices returns billing history');

  const invId = invoices.data[0].id;
  const pdfRes = await request(`/billing/invoices/${invId}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(
    pdfRes.status === 200 && pdfRes.headers['content-type'] === 'application/pdf' && pdfRes.buffer.length > 500,
    'GET /billing/invoices/:id/pdf streams authentic generated PDF invoice binary',
  );

  // 9. Team Members API
  const team = await request('/team', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(team.status === 200 && Array.isArray(team.data) && team.data.length >= 2, 'GET /team lists organization members');

  // 10. AI Copy Generation Router
  const aiCopy = await request('/ai/generate-copy', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }, {
    prompt: {
      brandName: 'Meridian Coffee Co.',
      tone: 'Warm',
      style: 'lifestyle',
      occasion: 'Spring Cold Brew Launch',
    },
    provider: 'gemini',
    brandId: testBrandId,
  });
  assert(aiCopy.status === 201 && !!aiCopy.data.headline && !!aiCopy.data.ctaText, 'POST /ai/generate-copy generates structured ad copy');

  // 11. Asynchronous Generation Job
  const genJob = await request('/generation/jobs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }, {
    projectId: projId,
    platforms: ['instagram_portrait', 'facebook_feed'],
    style: 'lifestyle',
  });
  assert(genJob.status === 201 && !!genJob.data.id, 'POST /generation/jobs queues generation job');

  // Poll for async job pipeline stages to complete
  let jobStatus = null;
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    jobStatus = await request(`/generation/jobs/${genJob.data.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (jobStatus.status === 200 && jobStatus.data.status === 'COMPLETED') break;
  }
  assert(jobStatus?.status === 200 && jobStatus?.data.status === 'COMPLETED', 'Generation pipeline completed all stages asynchronously');

  // Verify project now has the creative variants persisted
  const updatedProj = await request(`/projects/${projId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(
    updatedProj.status === 200 &&
      Array.isArray(updatedProj.data.creatives) &&
      updatedProj.data.creatives.length === 2 &&
      updatedProj.data.creatives[0].metaPass === true,
    'Creative variants generated and saved with Meta compliance score',
  );

  console.log(`\n--- Verification Summary: ${passed} Passed, ${failed} Failed ---`);
  if (failed > 0) process.exit(1);
}

runVerification().catch((err) => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
