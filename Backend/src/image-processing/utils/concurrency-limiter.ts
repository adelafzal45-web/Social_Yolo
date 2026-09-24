import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  RequestTimeoutException,
} from '@nestjs/common';
import {
  MAX_CONCURRENT_JOBS,
  MAX_QUEUE_SIZE,
  PROCESSING_TIMEOUT_MS,
} from '../../config/image-processing.config';

interface QueueItem<T> {
  task: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
  enqueuedAt: number;
}

@Injectable()
export class ConcurrencyLimiter {
  private readonly logger = new Logger(ConcurrencyLimiter.name);
  private activeJobs = 0;
  private readonly queue: QueueItem<any>[] = [];
  private readonly maxConcurrent: number;
  private readonly maxQueue: number;
  private readonly timeoutMs: number;

  constructor() {
    this.maxConcurrent = MAX_CONCURRENT_JOBS;
    this.maxQueue = MAX_QUEUE_SIZE;
    this.timeoutMs = PROCESSING_TIMEOUT_MS;
    this.logger.log(
      `Concurrency limiter initialized: maxConcurrent=${this.maxConcurrent}, maxQueue=${this.maxQueue}, timeoutMs=${this.timeoutMs}ms`,
    );
  }

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.activeJobs >= this.maxConcurrent) {
      if (this.queue.length >= this.maxQueue) {
        this.logger.warn(
          `Rejecting request: queue capacity exceeded (${this.queue.length}/${this.maxQueue})`,
        );
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Server processing queue is full. Please retry shortly.',
            retryAfterSeconds: 5,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      this.logger.log(
        `Job queued. Current active: ${this.activeJobs}, waiting queue: ${this.queue.length + 1}`,
      );

      return new Promise<T>((resolve, reject) => {
        this.queue.push({
          task,
          resolve,
          reject,
          enqueuedAt: Date.now(),
        });
      });
    }

    return this.executeTask(task);
  }

  private async executeTask<T>(task: () => Promise<T>): Promise<T> {
    this.activeJobs++;
    this.logger.debug(`Executing job. Active jobs count: ${this.activeJobs}`);

    let timeoutId: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          new RequestTimeoutException(
            `Image processing timed out after ${this.timeoutMs}ms.`,
          ),
        );
      }, this.timeoutMs);
    });

    try {
      const result = await Promise.race([task(), timeoutPromise]);
      return result;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      this.activeJobs--;
      this.processNext();
    }
  }

  private processNext(): void {
    if (this.queue.length > 0 && this.activeJobs < this.maxConcurrent) {
      const nextItem = this.queue.shift();
      if (nextItem) {
        const waitDuration = Date.now() - nextItem.enqueuedAt;
        this.logger.debug(
          `Dispatching queued task after ${waitDuration}ms wait`,
        );
        this.executeTask(nextItem.task)
          .then(nextItem.resolve)
          .catch(nextItem.reject);
      }
    }
  }

  getStatus() {
    return {
      activeJobs: this.activeJobs,
      queuedJobs: this.queue.length,
      maxConcurrent: this.maxConcurrent,
      maxQueue: this.maxQueue,
      availableSlots: Math.max(0, this.maxConcurrent - this.activeJobs),
    };
  }
}
