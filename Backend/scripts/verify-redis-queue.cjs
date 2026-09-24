const { BackgroundRemovalQueueService } = require('../dist/image-processing/background-removal-queue.service');
const { RedisCacheService } = require('../dist/common/cache/redis-cache.service');

async function testQueue() {
  console.log('Testing BackgroundRemovalQueueService...');

  const cacheService = new RedisCacheService();
  const queueService = new BackgroundRemovalQueueService(cacheService);

  await queueService.onModuleInit();
  console.log('BackgroundRemovalQueueService initialized and worker loop started.');

  // 1x1 pixel base64 PNG
  const samplePng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  console.log('Enqueuing image to Background Removal Queue (Redis / Hybrid worker)...');
  const startTime = Date.now();
  const result = await queueService.enqueueAndWait(samplePng, 'image/png', {}, 20000);

  console.log('✅ Job completed successfully!');
  console.log(' - Job ID:', result.jobId);
  console.log(' - Engine:', result.engine);
  console.log(' - Output Buffer bytes:', result.buffer.length);
  console.log(' - Background Removed:', result.backgroundRemoved);
  console.log(' - Duration:', result.durationMs, 'ms');

  // Test async queue submission as well
  console.log('Testing async enqueue (enqueueAsync)...');
  const asyncJob = await queueService.enqueueAsync(samplePng, 'image/png', {});
  console.log('✅ Async job enqueued successfully:', asyncJob);

  await queueService.onModuleDestroy();
  await cacheService.onModuleDestroy();
  console.log('✅ Background Removal Queue tests PASSED successfully!');
  process.exit(0);
}

testQueue().catch((err) => {
  console.error('Queue test failed:', err);
  process.exit(1);
});
