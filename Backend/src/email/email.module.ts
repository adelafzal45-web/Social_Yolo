import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  EmailProviderEntity,
  EmailTemplateEntity,
  EmailOfferEntity,
  EmailCampaignEntity,
  EmailRecipientEntity,
  EmailEventEntity,
  EmailSuppressionEntity,
  EmailPreferenceEntity,
  EmailSendLogEntity,
  EmailAutomationRuleEntity,
  EmailAuditLogEntity,
} from './entities';
import { User } from '../users/entities/user.entity';
import { BrandProfile } from '../brands/entities/brand-profile.entity';
import { Post } from '../posts/entities/post.entity';
import { AuthModule } from '../auth/auth.module';

// Services & Providers
import { EmailCryptoService } from './services/email-crypto.service';
import { EmailProviderFactory } from './providers/email-provider.factory';
import { EmailQueueService } from './queues/email-queue.service';
import { EmailWorkerService } from './workers/email-worker.service';
import { EmailCampaignProcessor } from './workers/email-campaign.processor';
import { EmailSchedulerService } from './services/email-scheduler.service';
import { EmailTemplateService } from './services/email-template.service';
import { AudienceResolverService } from './services/audience-resolver.service';
import { EmailDnsService } from './services/email-dns.service';
import { EmailUnsubscribeService } from './services/email-unsubscribe.service';
import { EmailAnalyticsService } from './services/email-analytics.service';
import { EmailService } from './email.service';

// Controllers
import { EmailController } from './controllers/email.controller';
import { EmailWebhookController } from './controllers/email-webhook.controller';
import { EmailPublicController } from './controllers/email-public.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmailProviderEntity,
      EmailTemplateEntity,
      EmailOfferEntity,
      EmailCampaignEntity,
      EmailRecipientEntity,
      EmailEventEntity,
      EmailSuppressionEntity,
      EmailPreferenceEntity,
      EmailSendLogEntity,
      EmailAutomationRuleEntity,
      EmailAuditLogEntity,
      User,
      BrandProfile,
      Post,
    ]),
    AuthModule,
  ],
  controllers: [
    EmailController,
    EmailWebhookController,
    EmailPublicController,
  ],
  providers: [
    EmailCryptoService,
    EmailProviderFactory,
    EmailQueueService,
    EmailWorkerService,
    EmailCampaignProcessor,
    EmailSchedulerService,
    EmailTemplateService,
    AudienceResolverService,
    EmailDnsService,
    EmailUnsubscribeService,
    EmailAnalyticsService,
    EmailService,
  ],
  exports: [
    EmailService,
    EmailProviderFactory,
    EmailQueueService,
    EmailTemplateService,
    EmailAnalyticsService,
  ],
})
export class EmailModule {}
