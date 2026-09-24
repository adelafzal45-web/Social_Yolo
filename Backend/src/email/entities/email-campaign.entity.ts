import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { EmailRecipientEntity } from './email-recipient.entity';

export enum EmailCampaignType {
  OFFER = 'OFFER',
  PROMOTION = 'PROMOTION',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  NEWSLETTER = 'NEWSLETTER',
  PRODUCT_UPDATE = 'PRODUCT_UPDATE',
  CUSTOM = 'CUSTOM',
}

export enum EmailCampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENDING = 'SENDING',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

@Entity('email_campaigns')
export class EmailCampaignEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  subject!: string;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId!: string | null;

  @Column({ name: 'offer_id', type: 'uuid', nullable: true })
  offerId!: string | null;

  @Column({ name: 'brand_id', type: 'uuid', nullable: true })
  brandId!: string | null;

  @Index('idx_email_campaigns_type')
  @Column({
    name: 'campaign_type',
    type: 'varchar',
    length: 50,
    default: EmailCampaignType.CUSTOM,
  })
  campaignType!: EmailCampaignType;

  @Index('idx_email_campaigns_status')
  @Column({
    type: 'varchar',
    length: 30,
    default: EmailCampaignStatus.DRAFT,
  })
  status!: EmailCampaignStatus;

  @Column({ name: 'audience_definition', type: 'jsonb', default: {} })
  audienceDefinition!: Record<string, any>;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt!: Date | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => EmailRecipientEntity, (recipient) => recipient.campaign)
  recipients!: EmailRecipientEntity[];
}
