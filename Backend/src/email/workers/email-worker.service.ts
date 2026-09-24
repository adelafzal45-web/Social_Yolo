import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailQueueService, SendEmailJobData } from '../queues/email-queue.service';
import { EmailProviderFactory } from '../providers/email-provider.factory';
import {
  EmailRecipientEntity,
  EmailRecipientStatus,
} from '../entities/email-recipient.entity';
import { EmailSendLogEntity } from '../entities/email-send-log.entity';
import { EmailSuppressionEntity } from '../entities/email-suppression.entity';
import { EmailEventEntity, EmailEventType } from '../entities/email-event.entity';

@Injectable()
export class EmailWorkerService implements OnModuleInit {
  private readonly logger = new Logger(EmailWorkerService.name);

  constructor(
    private readonly queueService: EmailQueueService,
    private readonly providerFactory: EmailProviderFactory,
    @InjectRepository(EmailRecipientEntity)
    private readonly recipientRepo: Repository<EmailRecipientEntity>,
    @InjectRepository(EmailSendLogEntity)
    private readonly sendLogRepo: Repository<EmailSendLogEntity>,
    @InjectRepository(EmailSuppressionEntity)
    private readonly suppressionRepo: Repository<EmailSuppressionEntity>,
    @InjectRepository(EmailEventEntity)
    private readonly eventRepo: Repository<EmailEventEntity>,
  ) {}

  onModuleInit() {
    this.queueService.registerSendWorker(this.processSendJob.bind(this));
  }

  async processSendJob(job: SendEmailJobData): Promise<void> {
    const attempt = job.attempt || 1;
    const maxRetries = parseInt(process.env.EMAIL_RETRY_ATTEMPTS || '5', 10);

    // 1. Check Suppression list (Hard bounce, unsubscribed, complaint, manual)
    const isSuppressed = await this.suppressionRepo.findOne({
      where: { email: job.email.toLowerCase().trim() },
    });

    if (isSuppressed) {
      this.logger.log(`Skipping send to suppressed recipient: ${job.email} (${isSuppressed.reason})`);
      if (job.recipientId) {
        await this.recipientRepo.update(job.recipientId, {
          status: EmailRecipientStatus.UNSUBSCRIBED,
          errorMessage: `Recipient is on suppression list: ${isSuppressed.reason}`,
        });
      }
      return;
    }

    // 2. Mark recipient as PROCESSING
    if (job.recipientId) {
      await this.recipientRepo.update(job.recipientId, {
        status: EmailRecipientStatus.PROCESSING,
      });
    }

    // 3. Obtain provider and dispatch email
    const provider = await this.providerFactory.getActiveProvider();
    const result = await provider.send({
      to: job.email,
      fromEmail: job.fromEmail,
      fromName: job.fromName,
      replyTo: job.replyTo,
      subject: job.subject,
      html: job.html,
      text: job.text,
      campaignId: job.campaignId,
      recipientId: job.recipientId,
      idempotencyKey: job.idempotencyKey,
      unsubscribeUrl: job.unsubscribeUrl,
    });

    // 4. Record send log
    const sendLog = this.sendLogRepo.create({
      messageId: result.messageId || null,
      provider: provider.getProviderName(),
      recipient: job.email,
      subject: job.subject,
      status: result.success ? 'SENT' : 'FAILED',
      providerResponse: result.providerResponse || null,
      error: result.error || null,
      attemptCount: attempt,
      sentAt: result.success ? new Date() : null,
    });
    await this.sendLogRepo.save(sendLog).catch(() => {});

    // 5. Update Recipient status & Events
    if (result.success) {
      if (job.recipientId) {
        await this.recipientRepo.update(job.recipientId, {
          status: EmailRecipientStatus.SENT,
          providerMessageId: result.messageId || null,
          sentAt: new Date(),
        });

        // Record 'sent' event
        await this.eventRepo.save(
          this.eventRepo.create({
            campaignId: job.campaignId || null,
            recipientId: job.recipientId,
            provider: provider.getProviderName(),
            providerEventId: result.messageId || `sent-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            eventType: EmailEventType.SENT,
            eventData: { response: result.providerResponse },
            occurredAt: new Date(),
          }),
        ).catch(() => {});
      }
    } else {
      // Determine if error is transient or permanent
      const isTransient = this.isTransientError(result.error || '');

      if (isTransient && attempt < maxRetries) {
        // Exponential backoff: 2^attempt * 1000ms + jitter
        const delayMs = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 500);
        this.logger.warn(
          `Transient error sending to ${job.email} (attempt ${attempt}/${maxRetries}): ${result.error}. Retrying in ${delayMs}ms`,
        );
        await this.queueService.addRetryJob(job, attempt + 1, delayMs);
      } else {
        // Permanent failure or max retries reached
        this.logger.error(
          `Permanent failure sending to ${job.email} (attempt ${attempt}/${maxRetries}): ${result.error}`,
        );
        if (job.recipientId) {
          await this.recipientRepo.update(job.recipientId, {
            status: EmailRecipientStatus.FAILED,
            errorMessage: result.error || 'Provider rejected email send',
            failedAt: new Date(),
          });
        }
      }
    }
  }

  private isTransientError(error: string): boolean {
    const lower = error.toLowerCase();
    // Transient signals: rate limits, connection timeouts, network glitches
    if (
      lower.includes('rate limit') ||
      lower.includes('econnreset') ||
      lower.includes('etimedout') ||
      lower.includes('timeout') ||
      lower.includes('connection lost') ||
      lower.includes('try again') ||
      lower.includes('421') ||
      lower.includes('450') ||
      lower.includes('451') ||
      lower.includes('452')
    ) {
      return true;
    }
    // Permanent signals: invalid recipient, 550, spam rejected
    if (
      lower.includes('no such user') ||
      lower.includes('mailbox unavailable') ||
      lower.includes('address rejected') ||
      lower.includes('invalid address') ||
      lower.includes('550') ||
      lower.includes('551') ||
      lower.includes('553') ||
      lower.includes('suppressed')
    ) {
      return false;
    }
    return true;
  }
}
