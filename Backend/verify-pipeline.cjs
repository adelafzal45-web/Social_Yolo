const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = process.env.PORT || 3002;
const BASE = `http://127.0.0.1:${PORT}/api`;

async function main() {
  console.log('========================================================');
  console.log('🚀 SOCIAL YOLO PIPELINE VERIFICATION SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(title, condition, detail = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${title} ${detail}`);
      failed++;
    }
  }

  // 1. Health Probe
  console.log('--- TEST 1: Service Health & Queue Status ---');
  try {
    const res = await fetch(`${BASE}/image-processing/health`);
    const data = await res.json();
    assert('Health endpoint responds 200 OK', res.status === 200);
    assert('Service is marked available', data.available === true);
    assert('Active provider is imgly', data.activeProvider === 'imgly');
    assert('Concurrency limiter queue initialized', data.queue && data.queue.maxConcurrent > 0);
  } catch (err) {
    assert('Health probe succeeded', false, err.message);
  }

  // 2. Providers List
  console.log('\n--- TEST 2: Provider Abstraction ---');
  try {
    const res = await fetch(`${BASE}/image-processing/providers`);
    const data = await res.json();
    assert('Providers endpoint responds 200 OK', res.status === 200);
    assert('Available providers includes imgly and bria',
      data.availableProviders.includes('imgly') && data.availableProviders.includes('bria'));
  } catch (err) {
    assert('Providers probe succeeded', false, err.message);
  }

  // 3. Authentication & RBAC Tokens
  console.log('\n--- TEST 3: Authentication & Token Acquisition ---');
  let adminToken = '';
  let creatorToken = '';
  let restrictedToken = '';

  try {
    const login = async (email, password) => {
      const r = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return { status: r.status, data: await r.json() };
    };

    const adminRes = await login('admin@socialyolo.local', 'Admin@123');
    assert('Admin login returns 200 & JWT', adminRes.status === 200 && Boolean(adminRes.data.accessToken));
    adminToken = adminRes.data.accessToken;

    const creatorRes = await login('creator@socialyolo.local', 'Creator@123');
    assert('Creator login returns 200 & JWT', creatorRes.status === 200 && Boolean(creatorRes.data.accessToken));
    creatorToken = creatorRes.data.accessToken;

    const restrictedRes = await login('restricted@socialyolo.local', 'User@123');
    assert('Restricted user login returns 200 & JWT', restrictedRes.status === 200 && Boolean(restrictedRes.data.accessToken));
    restrictedToken = restrictedRes.data.accessToken;
  } catch (err) {
    assert('Authentication flow succeeded', false, err.message);
  }

  // 4. Security & RBAC Enforcement
  console.log('\n--- TEST 4: Security & RBAC Enforcement ---');
  const sampleImagePath = path.resolve(__dirname, '../image-service/sample_photo.jpg');
  const sampleImageBytes = fs.readFileSync(sampleImagePath);

  // 4a. Unauthorized (No token)
  try {
    const fd = new FormData();
    const blob = new Blob([sampleImageBytes], { type: 'image/jpeg' });
    fd.append('file', blob, 'sample.jpg');

    const res = await fetch(`${BASE}/image-processing/remove-background`, {
      method: 'POST',
      body: fd,
    });
    assert('Missing token rejected with 401 Unauthorized', res.status === 401);
  } catch (err) {
    assert('Unauthorized check failed', false, err.message);
  }

  // 4b. RBAC Permission Denial (Restricted token lacking image:remove-background)
  try {
    const fd = new FormData();
    const blob = new Blob([sampleImageBytes], { type: 'image/jpeg' });
    fd.append('file', blob, 'sample.jpg');

    const res = await fetch(`${BASE}/image-processing/remove-background`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${restrictedToken}` },
      body: fd,
    });
    assert('Restricted user rejected with 403 Forbidden (RBAC)', res.status === 403);
  } catch (err) {
    assert('RBAC denial check failed', false, err.message);
  }

  // 4c. Invalid File Rejection (Disguised text file)
  try {
    const fd = new FormData();
    const badBlob = new Blob(['Not an image content'], { type: 'text/plain' });
    fd.append('file', badBlob, 'malicious.txt');

    const res = await fetch(`${BASE}/image-processing/remove-background`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${creatorToken}` },
      body: fd,
    });
    assert('Disguised/invalid file rejected with 400 Bad Request', res.status === 400);
  } catch (err) {
    assert('Invalid file check failed', false, err.message);
  }

  // 5. Full Real AI Processing Pipeline (JPEG -> Transparent PNG)
  console.log('\n--- TEST 5: Full Pipeline (JPEG -> Transparent PNG with @imgly) ---');
  try {
    const fd = new FormData();
    const blob = new Blob([sampleImageBytes], { type: 'image/jpeg' });
    fd.append('file', blob, 'sample_photo.jpg');

    console.log('  ⏳ Sending sample photo to background removal engine...');
    const t0 = Date.now();
    const res = await fetch(`${BASE}/image-processing/remove-background`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${creatorToken}` },
      body: fd,
    });

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    assert('Background removal returned 200 OK', res.status === 200);

    const json = await res.json();
    assert('Structured response has success=true', json.success === true);
    assert('Output format is genuinely png', json.file?.format === 'png');
    assert('File marked transparent=true', json.file?.transparent === true);
    assert('Alpha channel verified in transparencyReport', json.transparencyReport?.hasAlphaChannel === true);
    assert('Alpha stats show transparent pixels', json.transparencyReport?.isTransparent === true);
    assert('Processing provider is imgly', json.provider === 'imgly');
    console.log(`  ⏱️ Processing completed in ${elapsed}s (Server reported: ${json.processingTimeMs}ms)`);

    // Verify raw base64 and save to disk
    if (json.bytes) {
      const outBuf = Buffer.from(json.bytes, 'base64');
      const outPath = path.resolve(__dirname, 'processed_sample_photo.png');
      fs.writeFileSync(outPath, outBuf);
      assert(`Saved output transparent PNG to ${outPath} (${(outBuf.length / 1024).toFixed(0)} KB)`, fs.existsSync(outPath));
    }
  } catch (err) {
    assert('Full pipeline processing failed', false, err.message);
  }

  // 6. BRIA RMBG AI Provider Verification
  console.log('\n--- TEST 6: BRIA RMBG Provider (PNG -> Transparent PNG with bria) ---');
  try {
    const testInputPath = path.resolve(__dirname, 'test_input.png');
    const testInputBytes = fs.readFileSync(testInputPath);
    const fd = new FormData();
    const blob = new Blob([testInputBytes], { type: 'image/png' });
    fd.append('file', blob, 'test_input.png');

    console.log('  ⏳ Sending test image to BRIA RMBG provider...');
    const t0 = Date.now();
    const res = await fetch(`${BASE}/image-processing/remove-background?provider=bria`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${creatorToken}` },
      body: fd,
    });

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    assert('BRIA background removal returned 200 OK', res.status === 200);

    const json = await res.json();
    assert('BRIA response has success=true', json.success === true);
    assert('BRIA output format is png', json.file?.format === 'png');
    assert('BRIA output marked transparent=true', json.file?.transparent === true);
    assert('BRIA processing provider is bria', json.provider === 'bria');
    assert('BRIA alpha channel verified', json.transparencyReport?.hasAlphaChannel === true);
    console.log(`  ⏱️ BRIA processing completed in ${elapsed}s (Server reported: ${json.processingTimeMs}ms)`);
  } catch (err) {
    assert('BRIA pipeline processing failed', false, err.message);
  }

  console.log('\n========================================================');
  console.log(`🏁 VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');


  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
