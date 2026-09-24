import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailQueueService, CampaignJobData, SendEmailJobData } from '../queues/email-queue.service';
import {
  EmailCampaignEntity,
  EmailCampaignStatus,
} from '../entities/email-campaign.entity';
import {
  EmailRecipientEntity,
  EmailRecipientStatus,
} from '../entities/email-recipient.entity';
import { EmailTemplateService } from '../services/email-template.service';
import { AudienceResolverService } from '../services/audience-resolver.service';
import { EmailOfferEntity } from '../entities/email-offer.entity';
import { EmailUnsubscribeService } from '../services/email-unsubscribe.service';
import { BrandProfile } from '../../brands/entities/brand-profile.entity';

@Injectable()
export class EmailCampaignProcessor implements OnModuleInit {
  private readonly logger = new Logger(EmailCampaignProcessor.name);

  constructor(
    private readonly queueService: EmailQueueService,
    private readonly templateService: EmailTemplateService,
    private readonly audienceResolver: AudienceResolverService,
    private readonly unsubscribeService: EmailUnsubscribeService,
    @InjectRepository(EmailCampaignEntity)
    private readonly campaignRepo: Repository<EmailCampaignEntity>,
    @InjectRepository(EmailRecipientEntity)
    private readonly recipientRepo: Repository<EmailRecipientEntity>,
    @InjectRepository(EmailOfferEntity)
    private readonly offerRepo: Repository<EmailOfferEntity>,
    @InjectRepository(BrandProfile)
    private readonly brandRepo: Repository<BrandProfile>,
  ) {}

  onModuleInit() {
    this.queueService.registerCampaignWorker(this.processCampaignJob.bind(this));
  }

  async processCampaignJob(job: CampaignJobData): Promise<void> {
    const campaign = await this.campaignRepo.findOne({
      where: { id: job.campaignId },
    });

    if (!campaign) {
      this.logger.error(`Campaign ${job.campaignId} not found`);
      return;
    }

    switch (job.action) {
      case 'start':
      case 'resume':
        await this.executeCampaignDispatch(campaign);
        break;

      case 'pause':
        await this.campaignRepo.update(campaign.id, {
          status: EmailCampaignStatus.PAUSED,
        });
        this.logger.log(`Campaign ${campaign.name} paused.`);
        break;

      case 'cancel':
        await this.campaignRepo.update(campaign.id, {
          status: EmailCampaignStatus.CANCELLED,
        });
        // Cancel pending/queued recipients
        await this.recipientRepo.update(
          { campaignId: campaign.id, status: EmailRecipientStatus.PENDING },
          { status: EmailRecipientStatus.FAILED, errorMessage: 'Campaign cancelled by admin' },
        );
        this.logger.log(`Campaign ${campaign.name} cancelled.`);
        break;
    }
  }

  private async executeCampaignDispatch(campaign: EmailCampaignEntity) {
    this.logger.log(`Starting execution for campaign: ${campaign.name} (${campaign.id})`);

    await this.campaignRepo.update(campaign.id, {
      status: EmailCampaignStatus.SENDING,
      startedAt: campaign.startedAt || new Date(),
    });

    // 1. Load Template
    const template = campaign.templateId
      ? await this.templateService.findById(campaign.templateId)
      : null;

    if (!template) {
      this.logger.error(`Cannot dispatch campaign ${campaign.id}: Template not found`);
      await this.campaignRepo.update(campaign.id, {
        status: EmailCampaignStatus.CANCELLED,
      });
      return;
    }

    // 2. Load Offer (if any)
    const offer = campaign.offerId
      ? await this.offerRepo.findOne({ where: { id: campaign.offerId } })
      : null;

    // 3. Load Brand (if any)
    const brand = campaign.brandId
      ? await this.brandRepo.findOne({ where: { id: campaign.brandId } })
      : null;

    // 4. Resolve Audience from DB
    const resolvedRecipients = await this.audienceResolver.resolveAudience({
      ...campaign.audienceDefinition,
      category: campaign.campaignType === 'OFFER' ? 'OFFER' : 'MARKETING',
    });

    if (resolvedRecipients.length === 0) {
      this.logger.log(`Campaign ${campaign.name} has no eligible recipients.`);
      await this.campaignRepo.update(campaign.id, {
        status: EmailCampaignStatus.COMPLETED,
        completedAt: new Date(),
      });
      return;
    }

    this.logger.log(
      `Campaign ${campaign.name}: Resolved ${resolvedRecipients.length} eligible recipients. Enqueueing jobs...`,
    );

    // 5. Batch create recipients and enqueue jobs
    const batchSize = parseInt(process.env.EMAIL_BATCH_SIZE || '50', 10);
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    for (let i = 0; i < resolvedRecipients.length; i += batchSize) {
      // Check if paused or cancelled mid-dispatch
      const currentCampaign = await this.campaignRepo.findOne({
        where: { id: campaign.id },
        select: ['status'],
      });

      if (
        currentCampaign?.status === EmailCampaignStatus.PAUSED ||
        currentCampaign?.status === EmailCampaignStatus.CANCELLED
      ) {
        this.logger.log(`Stopping campaign dispatch: status is ${currentCampaign?.status}`);
        return;
      }

      const batch = resolvedRecipients.slice(i, i + batchSize);

      for (const rec of batch) {
        const idempotencyKey = `${campaign.id}:${rec.userId || rec.email}:${template.id}`;

        // Create or find recipient record
        let recipientRecord = await this.recipientRepo.findOne({
          where: { idempotencyKey },
        });

        if (!recipientRecord) {
          recipientRecord = this.recipientRepo.create({
            campaignId: campaign.id,
            userId: rec.userId || null,
            email: rec.email,
            status: EmailRecipientStatus.QUEUED,
            idempotencyKey,
            queuedAt: new Date(),
          });
          recipientRecord = await this.recipientRepo.save(recipientRecord);
        } else if (recipientRecord.status === EmailRecipientStatus.SENT || recipientRecord.status === EmailRecipientStatus.DELIVERED) {
          // Already sent, prevent duplicate sending
          continue;
        }

        const unsubscribeUrl = this.unsubscribeService.getUnsubscribeUrl(
          rec.email,
          rec.userId || undefined,
        );

        // Build interpolation context
        const context = {
          user: {
            name: rec.name,
            email: rec.email,
          },
          brand: brand
            ? {
                name: brand.brandName,
                tagline: brand.tagline,
                website: brand.websiteUrl,
              }
            : {
                name: 'SocialYolo',
                tagline: 'AI Creative Studio',
                website: 'https://socialyolo.com',
              },
          offer: offer
            ? {
                title: offer.title,
                description: offer.description,
                discount: offer.discount,
                code: offer.promoCode,
                expiresAt: offer.endDate ? new Date(offer.endDate).toLocaleDateString() : 'Limited Time',
                ctaUrl: offer.ctaUrl || `${appUrl}/dashboard/billing`,
              }
            : {},
          campaign: {
            unsubscribeUrl,
            preferencesUrl: `${appUrl}/email/unsubscribe`,
          },
          app: {
            url: appUrl,
          },
        };

        const renderedHtml = this.templateService.render(template.htmlContent, context);
        const renderedSubject = this.templateService.render(campaign.subject, context);

        const sendJobData: SendEmailJobData = {
          recipientId: recipientRecord.id,
          campaignId: campaign.id,
          userId: rec.userId || undefined,
          email: rec.email,
          subject: renderedSubject,
          html: renderedHtml,
          text: template.textContent ? this.templateService.render(template.textContent, context) : undefined,
          unsubscribeUrl,
          idempotencyKey,
        };

        await this.queueService.addSendJob(sendJobData);
      }

      // Small delay between batches to respect rate limits
      await new Promise((r) => setTimeout(r, 100));
    }

    this.logger.log(`Finished enqueueing all jobs for campaign: ${campaign.name}`);
  }
}
