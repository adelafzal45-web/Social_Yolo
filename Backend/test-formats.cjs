const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PORT = process.env.PORT || 3002;
const BASE = `http://127.0.0.1:${PORT}/api`;

async function run() {
  console.log('--- Testing Multiple Formats: PNG, WebP & Large Image ---');

  // 1. Get Creator token
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'creator@socialyolo.local', password: 'Creator@123' }),
  });
  const { accessToken } = await loginRes.json();

  // Generate test PNG with a colored circle on white background
  const testPng = await sharp({
    create: {
      width: 400,
      height: 400,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          '<svg><circle cx="200" cy="200" r="120" fill="red" /></svg>',
        ),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer();

  // Generate test WebP
  const testWebp = await sharp(testPng).webp().toBuffer();

  // Generate high-resolution image (3000x3000px)
  const testLarge = await sharp({
    create: {
      width: 3000,
      height: 3000,
      channels: 3,
      background: { r: 240, g: 240, b: 240 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          '<svg><rect x="500" y="500" width="2000" height="2000" fill="blue" /></svg>',
        ),
        top: 0,
        left: 0,
      },
    ])
    .jpeg()
    .toBuffer();

  async function testUpload(buffer, filename, mime, label) {
    console.log(`\nTesting ${label}...`);
    const fd = new FormData();
    const blob = new Blob([buffer], { type: mime });
    fd.append('file', blob, filename);

    const t0 = Date.now();
    const res = await fetch(`${BASE}/image-processing/remove-background`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: fd,
    });

    if (res.status !== 200) {
      console.error(`  ❌ Failed with status ${res.status}:`, await res.text());
      process.exit(1);
    }

    const data = await res.json();
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`  ✅ 200 OK in ${elapsed}s! Format: ${data.file.format}, Transparent: ${data.file.transparent}`);

    // Verify alpha channel using sharp
    const outBuf = Buffer.from(data.bytes, 'base64');
    const meta = await sharp(outBuf).metadata();
    const stats = await sharp(outBuf).stats();

    if (meta.format !== 'png' || meta.channels !== 4) {
      console.error('  ❌ Output is not 4-channel PNG!');
      process.exit(1);
    }

    const alphaMin = stats.channels[3].min;
    console.log(`  ✅ Verified 4-channel PNG (${meta.width}x${meta.height}). Alpha min: ${alphaMin} (Transparent: ${alphaMin < 255})`);
  }

  await testUpload(testPng, 'test.png', 'image/png', 'PNG -> Transparent PNG');
  await testUpload(testWebp, 'test.webp', 'image/webp', 'WebP -> Transparent PNG');
  await testUpload(testLarge, 'large.jpg', 'image/jpeg', '3000x3000 Large Image -> Transparent PNG');

  console.log('\n🎉 ALL FORMAT & DIMENSION TESTS PASSED PERFECTLY!');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
