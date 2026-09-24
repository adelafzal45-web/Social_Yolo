import './env';

import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { Post } from '../posts/entities/post.entity';
import { PostEmbedding } from '../posts/entities/post-embedding.entity';
import { User } from '../users/entities/user.entity';
import { BrandProfile } from '../brands/entities/brand-profile.entity';
import { BrandInsight } from '../brands/entities/brand-insight.entity';
import { BrandSource } from '../brands/entities/brand-source.entity';
import { CreditTransaction } from '../billing/entities/credit-transaction.entity';
import { UserSubscription } from '../billing/entities/subscription.entity';
import { Payment } from '../billing/entities/payment.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { InspirationItem } from '../inspiration/entities/inspiration-item.entity';
import { InspirationAnalysis } from '../inspiration/entities/inspiration-analysis.entity';
import { InspirationCollection } from '../inspiration/entities/inspiration-collection.entity';
import { ContentConcept } from '../content/entities/content-concept.entity';
import { AiGeneration } from '../content/entities/ai-generation.entity';
import { PostMetric } from '../analytics/entities/post-metric.entity';
import { ContentPerformanceInsight } from '../analytics/entities/content-performance-insight.entity';
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
} from '../email/entities';
import { DesignReference } from '../design-references/entities/design-reference.entity';
import { DesignReferenceEmbedding } from '../design-references/entities/design-reference-embedding.entity';
import { DesignReferencePattern } from '../design-references/entities/design-reference-pattern.entity';
import { DesignReferenceTag } from '../design-references/entities/design-reference-tag.entity';
import { DesignReferenceAsset } from '../design-references/entities/design-reference-asset.entity';
import { CreativeGeneration } from '../creative-generation/entities/creative-generation.entity';
import { CreativeVariation } from '../creative-generation/entities/creative-variation.entity';
import { CreativeExport } from '../creative-generation/entities/creative-export.entity';
import { DesignTemplate } from '../design-templates/entities/design-template.entity';
import { BrandEmbedding } from '../brand-intelligence/entities/brand-embedding.entity';
import { Project, CreativeVariant, Brand } from '../database/entities';

/**
 * TypeORM connection to the project Postgres database ("Social Yolo").
 * Synchronize: true auto-updates tables as entities evolve.
 */
export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD ?? 'admin',
  database: process.env.DB_NAME || 'social_yolo',
  entities: [
    User,
    Post,
    PostEmbedding,
    BrandProfile,
    BrandInsight,
    BrandSource,
    CreditTransaction,
    UserSubscription,
    Payment,
    Notification,
    InspirationItem,
    InspirationAnalysis,
    InspirationCollection,
    ContentConcept,
    AiGeneration,
    PostMetric,
    ContentPerformanceInsight,
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
    DesignReference,
    DesignReferenceEmbedding,
    DesignReferencePattern,
    DesignReferenceTag,
    DesignReferenceAsset,
    CreativeGeneration,
    CreativeVariation,
    CreativeExport,
    DesignTemplate,
    BrandEmbedding,
    Project,
    CreativeVariant,
    Brand,
  ],
  synchronize: true,
  logging: ['error', 'warn'],
};
