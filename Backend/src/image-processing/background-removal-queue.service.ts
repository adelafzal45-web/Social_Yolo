import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { RedisCacheService } from '../common/cache/redis-cache.service';

// Lazy-load native @imgly/background-removal-node (in-process ONNX)
let _imglyRemoveBackground:
  | ((blob: Blob, config?: any) => Promise<Blob>)
  | null = null;
async function getImglyRemoveBackground() {
  if (!_imglyRemoveBackground) {
    const mod = await import('@imgly/background-removal-node');
    _imglyRemoveBackground = mod.removeBackground;
  }
  return _imglyRemoveBackground;
}

export interface BackgroundJobData {
  jobId: string;
  imageBufferBase64: string;
  mimeType: string;
  options: {
    model?: string;
    preserveText?: boolean;
    alphaMatting?: boolean;
  };
  createdAt: number;
}

export interface BackgroundJobResult {
  jobId: string;
  buffer: Buffer;
  backgroundRemoved: boolean;
  engine: string;
  error?: string;
  durationMs: number;
}

export interface JobStatusResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'not_found';
  createdAt?: number;
  durationMs?: number;
  engine?: string;
  error?: string;
  resultUrl?: string;
  resultBase64?: string;
}

const QUEUE_KEY = 'queue:bg_removal:jobs';
const JOB_PREFIX = 'queue:bg_removal:job:';
const RESULT_PREFIX = 'queue:bg_removal:res:';
const CHANNEL_PREFIX = 'queue:bg_removal:done:';

@Injectable()
export class BackgroundRemovalQueueService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(BackgroundRemovalQueueService.name);

  private client: Redis | null = null;
  private bClient: Redis | null = null;
  private subClient: Redis | null = null;

  private isRedisConnected = false;
  private isShuttingDown = false;

  // In-memory fallback queue & emitter for when Redis is offline
  private readonly memoryQueue: BackgroundJobData[] = [];
  private readonly memoryResults = new Map<string, BackgroundJobResult>();
  private readonly memoryJobStatus = new Map<
    string,
    { status: 'queued' | 'processing' | 'completed' | 'failed'; error?: string; createdAt: number; durationMs?: number }
  >();
  private readonly emitter = new EventEmitter();

  private activeConcurrency = 0;
  private readonly maxConcurrency = 2; // Protect CPU & RAM from ONNX overload

  constructor(private readonly cacheService: RedisCacheService) {
    this.emitter.setMaxListeners(100);
  }

  async onModuleInit() {
    this.initRedis();
    this.startWorkerLoop();
  }

  async onModuleDestroy() {
    this.isShuttingDown = true;
    try {
      if (this.bClient) await this.bClient.quit().catch(() => {});
      if (this.subClient) await this.subClient.quit().catch(() => {});
      if (this.client) await this.client.quit().catch(() => {});
    } catch {}
  }

  private initRedis() {
    const redisHost = process.env.REDIS_HOST || '127.0.0.1';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    const redisPassword = process.env.REDIS_PASSWORD || undefined;

    const redisOpts = {
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      lazyConnect: true,
      connectTimeout: 2000,
      maxRetriesPerRequest: 1,
      retryStrategy: (times: number) => {
        if (times > 3) return null;
        return Math.min(times * 1000, 3000);
      },
    };

    try {
      this.client = new Redis(redisOpts);
      this.bClient = new Redis(redisOpts);
      this.subClient = new Redis(redisOpts);

      this.client.on('connect', () => {
        this.isRedisConnected = true;
        this.logger.log(`Redis Queue connected on ${redisHost}:${redisPort} (queue: ${QUEUE_KEY})`);
      });

      this.client.on('error', () => {
        this.isRedisConnected = false;
      });
      this.bClient.on('error', () => {
        this.isRedisConnected = false;
      });
      this.subClient.on('error', () => {
        this.isRedisConnected = false;
      });

      this.client.connect().catch(() => {
        this.isRedisConnected = false;
        this.logger.log('Redis server offline. Background removal queue running in hybrid in-memory worker mode.');
      });

      this.bClient.connect().catch(() => {});
      this.subClient.connect().catch(() => {});
    } catch (err: any) {
      this.isRedisConnected = false;
      this.logger.log(`Redis Queue using in-memory mode: ${err.message}`);
    }
  }

  /**
   * Enqueues an image for background removal and awaits the processed result.
   * Uses Redis Queue + PubSub when Redis is up; falls back to in-memory event queue.
   */
  async enqueueAndWait(
    imageBuffer: Buffer,
    mimeType = 'image/png',
    options: { model?: string; preserveText?: boolean; alphaMatting?: boolean } = {},
    timeoutMs = 60000,
  ): Promise<BackgroundJobResult> {
    const requestedModel = options.model || 'u2net_human_seg';

    // 1. Check instant cache first (< 2ms)
    const hash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
    const cacheKey = `bg:proc:${hash}:${requestedModel}`;

    try {
      const cached = await this.cacheService.get<string>(cacheKey);
      if (cached) {
        this.logger.log(`Background removal cache HIT for hash ${hash.slice(0, 8)}`);
        return {
          jobId: `cached-${hash.slice(0, 12)}`,
          buffer: Buffer.from(cached, 'base64'),
          backgroundRemoved: true,
          engine: 'redis-cache',
          durationMs: 2,
        };
      }
    } catch {}

    // 2. Create Job
    const jobId = crypto.randomUUID();
    const jobData: BackgroundJobData = {
      jobId,
      imageBufferBase64: imageBuffer.toString('base64'),
      mimeType,
      options,
      createdAt: Date.now(),
    };

    this.logger.log(`Enqueued background removal job ${jobId} (size: ${Math.round(imageBuffer.length / 1024)} KB) via ${this.isRedisConnected ? 'Redis Queue' : 'In-Memory Queue'}`);

    return new Promise<BackgroundJobResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.emitter.removeAllListeners(`done:${jobId}`);
        reject(new Error(`Background removal timed out after ${Math.round(timeoutMs / 1000)}s`));
      }, timeoutMs);

      // Listener for completion
      const onCompleted = (result: BackgroundJobResult) => {
        clearTimeout(timer);
        resolve(result);
      };

      this.emitter.once(`done:${jobId}`, onCompleted);

      // Enqueue to Redis or Memory
      if (this.isRedisConnected && this.client && this.subClient) {
        const channel = `${CHANNEL_PREFIX}${jobId}`;
        this.subClient.subscribe(channel, (err) => {
          if (err) {
            this.logger.warn(`Redis sub error for ${jobId}, using emitter fallback`);
          }
        });

        const subHandler = (ch: string, message: string) => {
          if (ch === channel) {
            try {
              const res = JSON.parse(message);
              this.subClient?.unsubscribe(channel).catch(() => {});
              this.subClient?.removeListener('message', subHandler);
              onCompleted({
                ...res,
                buffer: Buffer.from(res.bufferBase64, 'base64'),
              });
            } catch {}
          }
        };
        this.subClient.on('message', subHandler);

        // Store job and push to Redis queue list
        this.client
          .setex(`${JOB_PREFIX}${jobId}`, 3600, JSON.stringify(jobData))
          .then(() => this.client!.rpush(QUEUE_KEY, jobId))
          .catch((err) => {
            this.logger.warn(`Redis rpush failed (${err.message}). Falling back to memory queue.`);
            this.memoryQueue.push(jobData);
            this.processNextMemoryJob();
          });
      } else {
        this.memoryJobStatus.set(jobId, { status: 'queued', createdAt: Date.now() });
        this.memoryQueue.push(jobData);
        this.processNextMemoryJob();
      }
    });
  }

  /**
   * Enqueues a job asynchronously and returns immediately with the jobId.
   */
  async enqueueAsync(
    imageBuffer: Buffer,
    mimeType = 'image/png',
    options: { model?: string; preserveText?: boolean; alphaMatting?: boolean } = {},
  ): Promise<{ jobId: string; status: string; queuePosition: number }> {
    const jobId = crypto.randomUUID();
    const jobData: BackgroundJobData = {
      jobId,
      imageBufferBase64: imageBuffer.toString('base64'),
      mimeType,
      options,
      createdAt: Date.now(),
    };

    let queuePosition = 1;
    if (this.isRedisConnected && this.client) {
      await this.client.setex(`${JOB_PREFIX}${jobId}`, 3600, JSON.stringify(jobData));
      queuePosition = await this.client.rpush(QUEUE_KEY, jobId);
    } else {
      this.memoryJobStatus.set(jobId, { status: 'queued', createdAt: Date.now() });
      this.memoryQueue.push(jobData);
      queuePosition = this.memoryQueue.length;
      this.processNextMemoryJob();
    }

    return {
      jobId,
      status: 'queued',
      queuePosition,
    };
  }

  /**
   * Fetches job status and result by jobId.
   */
  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    if (this.isRedisConnected && this.client) {
      const resultRaw = await this.client.get(`${RESULT_PREFIX}${jobId}`);
      if (resultRaw) {
        const parsed = JSON.parse(resultRaw);
        return {
          jobId,
          status: 'completed',
          durationMs: parsed.durationMs,
          engine: parsed.engine,
          resultBase64: parsed.bufferBase64,
        };
      }

      const jobRaw = await this.client.get(`${JOB_PREFIX}${jobId}`);
      if (jobRaw) {
        return { jobId, status: 'processing' };
      }

      return { jobId, status: 'not_found' };
    }

    // Memory status
    if (this.memoryResults.has(jobId)) {
      const res = this.memoryResults.get(jobId)!;
      return {
        jobId,
        status: 'completed',
        durationMs: res.durationMs,
        engine: res.engine,
        resultBase64: res.buffer.toString('base64'),
      };
    }

    const memStatus = this.memoryJobStatus.get(jobId);
    if (memStatus) {
      return {
        jobId,
        status: memStatus.status,
        createdAt: memStatus.createdAt,
        error: memStatus.error,
      };
    }

    return { jobId, status: 'not_found' };
  }

  /**
   * Continuous worker loop for Redis queue consumers.
   */
  private async startWorkerLoop() {
    while (!this.isShuttingDown) {
      if (this.isRedisConnected && this.bClient && this.activeConcurrency < this.maxConcurrency) {
        try {
          // Block pop for up to 2 seconds
          const res = await this.bClient.blpop(QUEUE_KEY, 2);
          if (res && res[1]) {
            const jobId = res[1];
            this.processRedisJob(jobId).catch((err) => {
              this.logger.error(`Error processing Redis job ${jobId}: ${err.message}`);
            });
          }
        } catch {
          await new Promise((r) => setTimeout(r, 1000));
        }
      } else {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }

  private async processRedisJob(jobId: string) {
    if (!this.client) return;
    this.activeConcurrency++;
    const startTime = Date.now();

    try {
      const jobRaw = await this.client.get(`${JOB_PREFIX}${jobId}`);
      if (!jobRaw) {
        this.activeConcurrency--;
        return;
      }
      const jobData: BackgroundJobData = JSON.parse(jobRaw);
      const inputBuffer = Buffer.from(jobData.imageBufferBase64, 'base64');

      const result = await this.executeBgRemoval(inputBuffer, jobData.mimeType, jobData.options);
      const durationMs = Date.now() - startTime;

      const payload = {
        jobId,
        bufferBase64: result.buffer.toString('base64'),
        backgroundRemoved: result.backgroundRemoved,
        engine: result.engine,
        error: result.error,
        durationMs,
      };

      // Save result in Redis with 1 hour TTL
      await this.client.setex(`${RESULT_PREFIX}${jobId}`, 3600, JSON.stringify(payload));
      // Notify waiting callers via Redis Pub/Sub
      await this.client.publish(`${CHANNEL_PREFIX}${jobId}`, JSON.stringify(payload));

      // Also fire local emitter
      this.emitter.emit(`done:${jobId}`, {
        ...result,
        jobId,
        durationMs,
      });
    } catch (err: any) {
      this.logger.error(`Failed job ${jobId}: ${err.message}`);
    } finally {
      this.activeConcurrency--;
    }
  }

  private async processNextMemoryJob() {
    if (this.activeConcurrency >= this.maxConcurrency || this.memoryQueue.length === 0) {
      return;
    }

    const job = this.memoryQueue.shift();
    if (!job) return;

    this.activeConcurrency++;
    this.memoryJobStatus.set(job.jobId, { status: 'processing', createdAt: job.createdAt });
    const startTime = Date.now();

    try {
      const inputBuffer = Buffer.from(job.imageBufferBase64, 'base64');
      const result = await this.executeBgRemoval(inputBuffer, job.mimeType, job.options);
      const durationMs = Date.now() - startTime;

      const fullResult: BackgroundJobResult = {
        ...result,
        jobId: job.jobId,
        durationMs,
      };

      this.memoryResults.set(job.jobId, fullResult);
      this.memoryJobStatus.set(job.jobId, { status: 'completed', createdAt: job.createdAt, durationMs });

      this.emitter.emit(`done:${job.jobId}`, fullResult);
    } catch (err: any) {
      this.memoryJobStatus.set(job.jobId, { status: 'failed', error: err.message, createdAt: job.createdAt });
    } finally {
      this.activeConcurrency--;
      // Process next job in queue if any
      setImmediate(() => this.processNextMemoryJob());
    }
  }

  /**
   * The actual pure Node.js background removal execution.
   */
  private async executeBgRemoval(
    originalBytes: Buffer,
    mimeType: string,
    options: { model?: string; preserveText?: boolean; alphaMatting?: boolean },
  ): Promise<{ buffer: Buffer; backgroundRemoved: boolean; engine: string; error?: string }> {
    const requestedModel = options.model || 'u2net_human_seg';
    const hash = crypto.createHash('sha256').update(originalBytes).digest('hex');
    const cacheKey = `bg:proc:${hash}:${requestedModel}`;

    try {
      this.logger.log(`Worker executing ONNX background removal (size: ${originalBytes.length}B)...`);
      const inputBlob = new Blob([new Uint8Array(originalBytes)], { type: mimeType });
      const imglyRemove = await getImglyRemoveBackground();

      if (imglyRemove) {
        const outputBlob = await imglyRemove(inputBlob, {
          model: options.model === 'medium' ? 'medium' : 'small',
          output: { format: 'image/png', quality: 1.0 },
        });

        const outputBuffer = Buffer.from(await outputBlob.arrayBuffer());
        if (outputBuffer.length > 500) {
          this.logger.log(`Worker background removal finished! Output PNG: ${outputBuffer.length}B`);
          await this.cacheService.set(cacheKey, outputBuffer.toString('base64'), 86400).catch(() => {});
          return {
            buffer: outputBuffer,
            backgroundRemoved: true,
            engine: 'imgly-node-native-queued',
          };
        }
      }
    } catch (err: any) {
      this.logger.warn(`Worker ONNX error: ${err.message}. Returning original bytes.`);
      return {
        buffer: originalBytes,
        backgroundRemoved: false,
        engine: 'passthrough-fallback',
        error: err.message,
      };
    }

    return {
      buffer: originalBytes,
      backgroundRemoved: false,
      engine: 'passthrough',
    };
  }
}
