import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

export interface SendEmailJobData {
  recipientId?: string;
  campaignId?: string;
  userId?: string;
  email: string;
  subject: string;
  html: string;
  text?: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  unsubscribeUrl?: string;
  idempotencyKey?: string;
  attempt?: number;
}

export interface CampaignJobData {
  campaignId: string;
  action: 'start' | 'resume' | 'pause' | 'cancel';
}

export interface WebhookJobData {
  provider: string;
  payload: any;
  headers?: Record<string, string>;
  receivedAt: string;
}

export interface QueueStats {
  redisConnected: boolean;
  sendQueue: { waiting: number; active: number; completed: number; failed: number };
  campaignQueue: { waiting: number; active: number; completed: number; failed: number };
  mode: 'bullmq-redis' | 'resilient-in-memory';
}

@Injectable()
export class EmailQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailQueueService.name);
  private redisConnection: Redis | null = null;
  private isRedisConnected = false;

  // BullMQ Queues
  private sendQueue: Queue<SendEmailJobData> | null = null;
  private retryQueue: Queue<SendEmailJobData> | null = null;
  private webhookQueue: Queue<WebhookJobData> | null = null;
  private campaignQueue: Queue<CampaignJobData> | null = null;
  private scheduledQueue: Queue<any> | null = null;
  private cleanupQueue: Queue<any> | null = null;

  // Resilient In-Memory Fallback Queue (when Redis is offline)
  private readonly inMemorySendQueue: SendEmailJobData[] = [];
  private readonly inMemoryCampaignQueue: CampaignJobData[] = [];
  private isProcessingMemoryQueue = false;

  // Handlers registered by workers
  private sendJobHandler?: (jobData: SendEmailJobData) => Promise<void>;
  private campaignJobHandler?: (jobData: CampaignJobData) => Promise<void>;
  private webhookJobHandler?: (jobData: WebhookJobData) => Promise<void>;

  async onModuleInit() {
    await this.initRedisAndQueues();
  }

  private async initRedisAndQueues() {
    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST || '127.0.0.1';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    const redisPassword = process.env.REDIS_PASSWORD || undefined;

    try {
      this.redisConnection = redisUrl
        ? new Redis(redisUrl, { maxRetriesPerRequest: null, lazyConnect: true })
        : new Redis({
            host: redisHost,
            port: redisPort,
            password: redisPassword,
            maxRetriesPerRequest: null,
            lazyConnect: true,
            connectTimeout: 2000,
            retryStrategy: (times) => (times > 2 ? null : 1000),
          });

      this.redisConnection.on('connect', () => {
        this.isRedisConnected = true;
        this.logger.log('BullMQ connected to Redis successfully.');
      });

      this.redisConnection.on('error', (err) => {
        this.isRedisConnected = false;
        // Graceful suppression: log debug only
      });

      await this.redisConnection.connect().catch(() => {
        this.isRedisConnected = false;
      });

      if (this.isRedisConnected && this.redisConnection) {
        const queueOpts = { connection: this.redisConnection };
        this.sendQueue = new Queue('email.send', queueOpts);
        this.retryQueue = new Queue('email.retry', queueOpts);
        this.webhookQueue = new Queue('email.webhook', queueOpts);
        this.campaignQueue = new Queue('email.campaign', queueOpts);
        this.scheduledQueue = new Queue('email.scheduled', queueOpts);
        this.cleanupQueue = new Queue('email.cleanup', queueOpts);
        this.logger.log('BullMQ queues initialized: email.send, email.retry, email.webhook, email.campaign, email.scheduled, email.cleanup');
      } else {
        this.logger.log('Redis server offline. High-performance resilient in-memory email queue activated.');
      }
    } catch (err: any) {
      this.isRedisConnected = false;
      this.logger.log(`Using resilient in-memory email queue: ${err.message}`);
    }
  }

  registerSendWorker(handler: (jobData: SendEmailJobData) => Promise<void>) {
    this.sendJobHandler = handler;
    if (this.isRedisConnected && this.redisConnection) {
      const concurrency = parseInt(process.env.EMAIL_MAX_CONCURRENCY || '10', 10);
      new Worker<SendEmailJobData>(
        'email.send',
        async (job: Job<SendEmailJobData>) => {
          await handler(job.data);
        },
        { connection: this.redisConnection, concurrency },
      );

      new Worker<SendEmailJobData>(
        'email.retry',
        async (job: Job<SendEmailJobData>) => {
          await handler(job.data);
        },
        { connection: this.redisConnection, concurrency: 5 },
      );
    }
  }

  registerCampaignWorker(handler: (jobData: CampaignJobData) => Promise<void>) {
    this.campaignJobHandler = handler;
    if (this.isRedisConnected && this.redisConnection) {
      new Worker<CampaignJobData>(
        'email.campaign',
        async (job: Job<CampaignJobData>) => {
          await handler(job.data);
        },
        { connection: this.redisConnection, concurrency: 2 },
      );
    }
  }

  registerWebhookWorker(handler: (jobData: WebhookJobData) => Promise<void>) {
    this.webhookJobHandler = handler;
    if (this.isRedisConnected && this.redisConnection) {
      new Worker<WebhookJobData>(
        'email.webhook',
        async (job: Job<WebhookJobData>) => {
          await handler(job.data);
        },
        { connection: this.redisConnection, concurrency: 5 },
      );
    }
  }

  async addSendJob(jobData: SendEmailJobData, opts?: { delay?: number; jobId?: string }) {
    if (this.isRedisConnected && this.sendQueue) {
      try {
        await this.sendQueue.add('send', jobData, {
          jobId: opts?.jobId || jobData.idempotencyKey,
          delay: opts?.delay || 0,
          removeOnComplete: true,
          removeOnFail: false,
        });
        return;
      } catch (err: any) {
        this.logger.warn(`Failed to add job to BullMQ, falling back to memory queue: ${err.message}`);
      }
    }

    // In-memory fallback
    this.inMemorySendQueue.push(jobData);
    this.processMemoryQueues();
  }

  async addCampaignJob(jobData: CampaignJobData) {
    if (this.isRedisConnected && this.campaignQueue) {
      try {
        await this.campaignQueue.add('campaign', jobData, {
          jobId: `campaign:${jobData.campaignId}:${jobData.action}:${Date.now()}`,
          removeOnComplete: true,
        });
        return;
      } catch (err: any) {
        this.logger.warn(`Failed to enqueue campaign to BullMQ, using memory queue: ${err.message}`);
      }
    }

    this.inMemoryCampaignQueue.push(jobData);
    this.processMemoryQueues();
  }

  async addRetryJob(jobData: SendEmailJobData, attempt: number, delayMs: number) {
    const updatedData = { ...jobData, attempt };
    if (this.isRedisConnected && this.retryQueue) {
      try {
        await this.retryQueue.add('retry', updatedData, {
          delay: delayMs,
          removeOnComplete: true,
        });
        return;
      } catch {
        // fall through to memory
      }
    }

    setTimeout(() => {
      this.inMemorySendQueue.push(updatedData);
      this.processMemoryQueues();
    }, delayMs);
  }

  async addWebhookJob(jobData: WebhookJobData) {
    if (this.isRedisConnected && this.webhookQueue) {
      try {
        await this.webhookQueue.add('webhook', jobData, { removeOnComplete: true });
        return;
      } catch {
        // fall through to handler
      }
    }

    if (this.webhookJobHandler) {
      setImmediate(() => this.webhookJobHandler!(jobData).catch(() => {}));
    }
  }

  private async processMemoryQueues() {
    if (this.isProcessingMemoryQueue) return;
    this.isProcessingMemoryQueue = true;

    try {
      // Process campaigns
      while (this.inMemoryCampaignQueue.length > 0 && this.campaignJobHandler) {
        const campaignJob = this.inMemoryCampaignQueue.shift();
        if (campaignJob) {
          await this.campaignJobHandler(campaignJob).catch((err) =>
            this.logger.error(`Error processing memory campaign job: ${err.message}`),
          );
        }
      }

      // Process recipient sends with batching
      const batchSize = parseInt(process.env.EMAIL_BATCH_SIZE || '25', 10);
      while (this.inMemorySendQueue.length > 0 && this.sendJobHandler) {
        const batch = this.inMemorySendQueue.splice(0, batchSize);
        await Promise.all(
          batch.map((job) =>
            this.sendJobHandler!(job).catch((err) =>
              this.logger.error(`Error processing memory send job: ${err.message}`),
            ),
          ),
        );
        // Small yield to prevent event loop starvation
        await new Promise((r) => setTimeout(r, 20));
      }
    } finally {
      this.isProcessingMemoryQueue = false;
    }
  }

  async getQueueStats(): Promise<QueueStats> {
    if (this.isRedisConnected && this.sendQueue && this.campaignQueue) {
      try {
        const [sendCounts, campCounts] = await Promise.all([
          this.sendQueue.getJobCounts('waiting', 'active', 'completed', 'failed'),
          this.campaignQueue.getJobCounts('waiting', 'active', 'completed', 'failed'),
        ]);
        return {
          redisConnected: true,
          mode: 'bullmq-redis',
          sendQueue: {
            waiting: sendCounts.waiting || 0,
            active: sendCounts.active || 0,
            completed: sendCounts.completed || 0,
            failed: sendCounts.failed || 0,
          },
          campaignQueue: {
            waiting: campCounts.waiting || 0,
            active: campCounts.active || 0,
            completed: campCounts.completed || 0,
            failed: campCounts.failed || 0,
          },
        };
      } catch {
        // If Redis failed mid-call, fall back
      }
    }

    return {
      redisConnected: false,
      mode: 'resilient-in-memory',
      sendQueue: {
        waiting: this.inMemorySendQueue.length,
        active: this.isProcessingMemoryQueue ? 1 : 0,
        completed: 0,
        failed: 0,
      },
      campaignQueue: {
        waiting: this.inMemoryCampaignQueue.length,
        active: 0,
        completed: 0,
        failed: 0,
      },
    };
  }

  async onModuleDestroy() {
    try {
      await Promise.allSettled([
        this.sendQueue?.close(),
        this.retryQueue?.close(),
        this.webhookQueue?.close(),
        this.campaignQueue?.close(),
        this.scheduledQueue?.close(),
        this.cleanupQueue?.close(),
        this.redisConnection?.quit(),
      ]);
    } catch {}
  }
}
