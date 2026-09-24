import {
  Controller,
  Post,
  Param,
  Body,
  Headers,
  Req,
  HttpCode,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../../auth/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EmailEventEntity,
  EmailEventType,
} from '../entities/email-event.entity';
import {
  EmailRecipientEntity,
  EmailRecipientStatus,
} from '../entities/email-recipient.entity';
import {
  EmailSuppressionEntity,
  SuppressionReason,
} from '../entities/email-suppression.entity';
import * as crypto from 'crypto';

@Controller('email/webhooks')
export class EmailWebhookController {
  private readonly logger = new Logger(EmailWebhookController.name);

  constructor(
    @InjectRepository(EmailEventEntity)
    private readonly eventRepo: Repository<EmailEventEntity>,
    @InjectRepository(EmailRecipientEntity)
    private readonly recipientRepo: Repository<EmailRecipientEntity>,
    @InjectRepository(EmailSuppressionEntity)
    private readonly suppressionRepo: Repository<EmailSuppressionEntity>,
  ) {}

  @Public()
  @Post(':provider')
  @HttpCode(200)
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() payload: any,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
  ) {
    this.logger.log(`Received webhook from provider: ${provider}`);

    // Verify webhook signature if configured
    this.verifyProviderSignature(provider, payload, headers);

    const normalizedEvents = this.normalizeProviderEvents(provider, payload);

    for (const evt of normalizedEvents) {
      await this.processNormalizedEvent(provider, evt);
    }

    return { received: true, count: normalizedEvents.length };
  }

  private verifyProviderSignature(
    provider: string,
    payload: any,
    headers: Record<string, string>,
  ) {
    const secret = process.env.EMAIL_WEBHOOK_SECRET;
    if (!secret) {
      // If secret not configured in dev, allow through with warning
      return;
    }

    const signature =
      headers['x-webhook-signature'] ||
      headers['x-hub-signature-256'] ||
      headers['stripe-signature'];

    if (signature) {
      const rawBody = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expected = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        throw new BadRequestException('Invalid webhook signature');
      }
    }
  }

  private normalizeProviderEvents(provider: string, payload: any): any[] {
    const events: any[] = [];
    const now = new Date();

    if (Array.isArray(payload)) {
      // SendGrid sends an array of events
      for (const item of payload) {
        events.push(this.normalizeSingleItem(provider, item, now));
      }
    } else {
      events.push(this.normalizeSingleItem(provider, payload, now));
    }

    return events.filter(Boolean);
  }

  private normalizeSingleItem(provider: string, item: any, now: Date) {
    const rawType = (item.type || item.event || item.eventType || '').toLowerCase();
    let eventType: EmailEventType = EmailEventType.SENT;

    if (rawType.includes('deliver')) eventType = EmailEventType.DELIVERED;
    else if (rawType.includes('open')) eventType = EmailEventType.OPENED;
    else if (rawType.includes('click')) eventType = EmailEventType.CLICKED;
    else if (rawType.includes('bounce')) eventType = EmailEventType.BOUNCED;
    else if (rawType.includes('complaint') || rawType.includes('spam'))
      eventType = EmailEventType.COMPLAINED;
    else if (rawType.includes('fail') || rawType.includes('dropped'))
      eventType = EmailEventType.FAILED;
    else if (rawType.includes('unsub')) eventType = EmailEventType.UNSUBSCRIBED;

    const messageId =
      item.messageId ||
      item.message_id ||
      item['smtp-id'] ||
      item.providerMessageId ||
      item.data?.email_id ||
      item.id;

    const eventId =
      item.id ||
      item.event_id ||
      item.sg_event_id ||
      `${provider}-${messageId || Date.now()}-${eventType}-${Math.random().toString(36).slice(2)}`;

    const recipient = item.email || item.recipient || item.data?.to?.[0];

    return {
      provider,
      providerEventId: String(eventId),
      providerMessageId: messageId ? String(messageId) : null,
      eventType,
      recipient,
      occurredAt: item.timestamp ? new Date(item.timestamp * 1000) : now,
      metadata: item,
    };
  }

  private async processNormalizedEvent(provider: string, evt: any) {
    // 1. Idempotency Check: Don't process duplicate events
    const existing = await this.eventRepo.findOne({
      where: { provider, providerEventId: evt.providerEventId },
    });

    if (existing) {
      this.logger.debug(`Skipping duplicate webhook event: ${evt.providerEventId}`);
      return;
    }

    // 2. Locate matching recipient by providerMessageId or email
    let recipient: EmailRecipientEntity | null = null;
    if (evt.providerMessageId) {
      recipient = await this.recipientRepo.findOne({
        where: { providerMessageId: evt.providerMessageId },
      });
    }

    if (!recipient && evt.recipient) {
      recipient = await this.recipientRepo.findOne({
        where: { email: evt.recipient.toLowerCase().trim() },
        order: { createdAt: 'DESC' },
      });
    }

    // 3. Save Normalized Event
    const eventRecord = this.eventRepo.create({
      campaignId: recipient?.campaignId || null,
      recipientId: recipient?.id || null,
      provider,
      providerEventId: evt.providerEventId,
      eventType: evt.eventType,
      eventData: evt.metadata,
      occurredAt: evt.occurredAt,
    });
    await this.eventRepo.save(eventRecord).catch(() => {});

    // 4. Update Recipient Entity status
    if (recipient) {
      const updateData: Partial<EmailRecipientEntity> = {};
      const now = new Date();

      switch (evt.eventType) {
        case EmailEventType.DELIVERED:
          updateData.status = EmailRecipientStatus.DELIVERED;
          updateData.deliveredAt = recipient.deliveredAt || now;
          break;
        case EmailEventType.OPENED:
          updateData.status = EmailRecipientStatus.OPENED;
          updateData.openedAt = recipient.openedAt || now;
          break;
        case EmailEventType.CLICKED:
          updateData.status = EmailRecipientStatus.CLICKED;
          updateData.clickedAt = recipient.clickedAt || now;
          break;
        case EmailEventType.BOUNCED:
          updateData.status = EmailRecipientStatus.BOUNCED;
          updateData.bouncedAt = now;
          break;
        case EmailEventType.COMPLAINED:
          updateData.status = EmailRecipientStatus.COMPLAINED;
          break;
        case EmailEventType.FAILED:
          updateData.status = EmailRecipientStatus.FAILED;
          updateData.failedAt = now;
          break;
        case EmailEventType.UNSUBSCRIBED:
          updateData.status = EmailRecipientStatus.UNSUBSCRIBED;
          updateData.unsubscribedAt = now;
          break;
      }

      await this.recipientRepo.update(recipient.id, updateData);
    }

    // 5. If Bounce or Complaint, add to Suppression List automatically
    const targetEmail = recipient?.email || evt.recipient;
    if (targetEmail) {
      const cleanEmail = targetEmail.toLowerCase().trim();
      if (evt.eventType === EmailEventType.BOUNCED) {
        await this.addSuppression(cleanEmail, SuppressionReason.HARD_BOUNCE, `webhook:${provider}`);
      } else if (evt.eventType === EmailEventType.COMPLAINED) {
        await this.addSuppression(cleanEmail, SuppressionReason.COMPLAINT, `webhook:${provider}`);
      }
    }
  }

  private async addSuppression(email: string, reason: SuppressionReason, source: string) {
    const exists = await this.suppressionRepo.findOne({ where: { email } });
    if (!exists) {
      await this.suppressionRepo.save(
        this.suppressionRepo.create({
          email,
          reason,
          source,
        }),
      ).catch(() => {});
      this.logger.log(`Added ${email} to suppression list (${reason}) via ${source}`);
    }
  }
}
