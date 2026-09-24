import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Res,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../../auth/guards/jwt-auth.guard';
import { EmailUnsubscribeService } from '../services/email-unsubscribe.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EmailSuppressionEntity,
  SuppressionReason,
} from '../entities/email-suppression.entity';
import { EmailPreferenceEntity } from '../entities/email-preference.entity';
import {
  EmailRecipientEntity,
  EmailRecipientStatus,
} from '../entities/email-recipient.entity';
import { EmailEventEntity, EmailEventType } from '../entities/email-event.entity';

// 1x1 transparent PNG pixel buffer
const TRANSPARENT_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

@Controller('email/public')
export class EmailPublicController {
  constructor(
    private readonly unsubscribeService: EmailUnsubscribeService,
    @InjectRepository(EmailSuppressionEntity)
    private readonly suppressionRepo: Repository<EmailSuppressionEntity>,
    @InjectRepository(EmailPreferenceEntity)
    private readonly preferenceRepo: Repository<EmailPreferenceEntity>,
    @InjectRepository(EmailRecipientEntity)
    private readonly recipientRepo: Repository<EmailRecipientEntity>,
    @InjectRepository(EmailEventEntity)
    private readonly eventRepo: Repository<EmailEventEntity>,
  ) {}

  @Public()
  @Get('unsubscribe/:token')
  async getUnsubscribeInfo(@Param('token') token: string) {
    const verified = this.unsubscribeService.verifyToken(token);
    if (!verified.valid || !verified.email) {
      throw new BadRequestException('Invalid or expired unsubscribe link');
    }

    const isSuppressed = await this.suppressionRepo.findOne({
      where: { email: verified.email },
    });

    let prefs: EmailPreferenceEntity | null = null;
    if (verified.userId) {
      prefs = await this.preferenceRepo.findOne({
        where: { userId: verified.userId },
      });
    }

    return {
      email: verified.email,
      isUnsubscribed: Boolean(isSuppressed),
      preferences: prefs,
    };
  }

  @Public()
  @Post('unsubscribe')
  async executeUnsubscribe(
    @Body() body: { token: string; unsubscribeAll?: boolean; preferences?: any },
  ) {
    const verified = this.unsubscribeService.verifyToken(body.token);
    if (!verified.valid || !verified.email) {
      throw new BadRequestException('Invalid or expired unsubscribe link');
    }

    const email = verified.email.toLowerCase().trim();

    if (body.unsubscribeAll !== false) {
      // Add to suppression list
      let suppression = await this.suppressionRepo.findOne({ where: { email } });
      if (!suppression) {
        suppression = this.suppressionRepo.create({
          email,
          reason: SuppressionReason.UNSUBSCRIBED,
          source: 'one_click_unsubscribe',
        });
        await this.suppressionRepo.save(suppression);
      }
    }

    // Update preferences if userId available
    if (verified.userId && body.preferences) {
      await this.preferenceRepo.update(
        { userId: verified.userId },
        {
          marketingEmails: body.preferences.marketingEmails ?? false,
          offerEmails: body.preferences.offerEmails ?? false,
          productUpdates: body.preferences.productUpdates ?? false,
          newsletters: body.preferences.newsletters ?? false,
        },
      );
    }

    return {
      success: true,
      message: 'You have been successfully unsubscribed from marketing communications.',
    };
  }

  @Public()
  @Get('track/open/:recipientId')
  async trackOpen(@Param('recipientId') recipientId: string, @Res() res: Response) {
    try {
      const recipient = await this.recipientRepo.findOne({
        where: { id: recipientId },
      });

      if (recipient && !recipient.openedAt) {
        await this.recipientRepo.update(recipient.id, {
          status: EmailRecipientStatus.OPENED,
          openedAt: new Date(),
        });

        await this.eventRepo.save(
          this.eventRepo.create({
            campaignId: recipient.campaignId,
            recipientId: recipient.id,
            provider: 'internal_tracker',
            providerEventId: `open-${recipient.id}-${Date.now()}`,
            eventType: EmailEventType.OPENED,
            occurredAt: new Date(),
          }),
        );
      }
    } catch {}

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(TRANSPARENT_PIXEL);
  }

  @Public()
  @Get('track/click/:recipientId')
  async trackClick(
    @Param('recipientId') recipientId: string,
    @Query('url') destinationUrl: string,
    @Res() res: Response,
  ) {
    if (!destinationUrl) {
      throw new BadRequestException('Target URL is required');
    }

    try {
      const recipient = await this.recipientRepo.findOne({
        where: { id: recipientId },
      });

      if (recipient) {
        await this.recipientRepo.update(recipient.id, {
          status: EmailRecipientStatus.CLICKED,
          clickedAt: recipient.clickedAt || new Date(),
        });

        await this.eventRepo.save(
          this.eventRepo.create({
            campaignId: recipient.campaignId,
            recipientId: recipient.id,
            provider: 'internal_tracker',
            providerEventId: `click-${recipient.id}-${Date.now()}`,
            eventType: EmailEventType.CLICKED,
            eventData: { destinationUrl },
            occurredAt: new Date(),
          }),
        );
      }
    } catch {}

    res.redirect(destinationUrl);
  }
}
