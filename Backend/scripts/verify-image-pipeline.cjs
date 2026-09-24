const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_PROXY_URL = 'http://localhost:3000';

async function run() {
  console.log('================================================================');
  console.log('   END-TO-END IMAGE & TEXT PRESERVATION PIPELINE VERIFICATION   ');
  console.log('================================================================');

  // 1. Authenticate with backend to get JWT token
  console.log('\n[1] Authenticating with backend...');
  const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@socialyolo.com', password: 'Admin@123456' }),
  });
  if (!loginRes.ok) {
    throw new Error(`Login failed with status ${loginRes.status}`);
  }
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('    -> Authenticated as admin. JWT acquired.');

  // 2. Locate test image with text
  const testImgPath = path.resolve(__dirname, '../../image-service/test_input.png');
  if (!fs.existsSync(testImgPath)) {
    throw new Error(`Test image not found at ${testImgPath}`);
  }
  const imgBuffer = fs.readFileSync(testImgPath);
  console.log(`\n[2] Loaded test image containing product + text (${imgBuffer.length} bytes)`);

  // 3. Test through NestJS Backend directly: POST /api/image-processing/remove-background?preserve_text=true
  console.log('\n[3] Sending image through NestJS Backend -> Python Microservice...');
  const formData = new FormData();
  formData.append('file', new Blob([imgBuffer], { type: 'image/png' }), 'test_poster.png');

  const t0 = Date.now();
  const beRes = await fetch(`${BACKEND_URL}/api/image-processing/remove-background?preserve_text=true&model=isnet-general-use`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const durationBe = ((Date.now() - t0) / 1000).toFixed(2);
  console.log(`    -> Backend response status: ${beRes.status} in ${durationBe}s`);
  if (!beRes.ok) {
    const text = await beRes.text();
    throw new Error(`Backend request failed (${beRes.status}): ${text}`);
  }
  const beData = await beRes.json();
  if (!beData.url || !beData.bytes) {
    throw new Error('Backend response missing url or bytes payload');
  }
  console.log(`    -> Success! Received base64 PNG cutout (${beData.bytes.length} base64 chars)`);

  // 4. Test through Next.js Proxy: POST /api/proxy/image-processing/remove-background
  console.log('\n[4] Sending image through Next.js Proxy -> NestJS -> Python...');
  const proxyFormData = new FormData();
  proxyFormData.append('file', new Blob([imgBuffer], { type: 'image/png' }), 'test_proxy.png');

  const t1 = Date.now();
  const proxyRes = await fetch(`${FRONTEND_PROXY_URL}/api/proxy/image-processing/remove-background?preserve_text=true`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: proxyFormData,
  });

  const durationProxy = ((Date.now() - t1) / 1000).toFixed(2);
  console.log(`    -> Next.js Proxy response status: ${proxyRes.status} in ${durationProxy}s`);
  if (!proxyRes.ok) {
    const text = await proxyRes.text();
    throw new Error(`Proxy request failed (${proxyRes.status}): ${text}`);
  }
  const proxyData = await proxyRes.json();
  if (!proxyData.url || !proxyData.bytes) {
    throw new Error('Proxy response missing url or bytes payload');
  }
  console.log(`    -> Success! Received base64 PNG cutout via Proxy (${proxyData.bytes.length} base64 chars)`);

  // Save the result for visual confirmation
  const outPng = Buffer.from(proxyData.bytes, 'base64');
  const outPath = path.resolve(__dirname, 'pipeline_cutout_result.png');
  fs.writeFileSync(outPath, outPng);
  console.log(`\n[5] Saved pipeline cutout to ${outPath} (${outPng.length} bytes)`);

  console.log('\n================================================================');
  console.log('   🎉 ALL END-TO-END PIPELINE CHECKS PASSED (100% SUCCESS)      ');
  console.log('================================================================\n');
}

run().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
