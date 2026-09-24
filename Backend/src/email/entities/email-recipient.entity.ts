import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EmailCampaignEntity } from './email-campaign.entity';

export enum EmailRecipientStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
  BOUNCED = 'BOUNCED',
  COMPLAINED = 'COMPLAINED',
  FAILED = 'FAILED',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
}

@Entity('email_recipients')
@Index('idx_recipients_campaign_email', ['campaignId', 'email'])
export class EmailRecipientEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_email_recipients_campaign_id')
  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId!: string;

  @ManyToOne(() => EmailCampaignEntity, (camp) => camp.recipients, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'campaign_id' })
  campaign!: EmailCampaignEntity;

  @Index('idx_email_recipients_user_id')
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Index('idx_email_recipients_email')
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Index('idx_email_recipients_status')
  @Column({
    type: 'varchar',
    length: 30,
    default: EmailRecipientStatus.PENDING,
  })
  status!: EmailRecipientStatus;

  @Index('idx_email_recipients_provider_message_id')
  @Column({ name: 'provider_message_id', type: 'varchar', length: 255, nullable: true })
  providerMessageId!: string | null;

  @Index('idx_email_recipients_idempotency_key', { unique: true })
  @Column({ name: 'idempotency_key', type: 'varchar', length: 255, unique: true, nullable: true })
  idempotencyKey!: string | null;

  @Column({ name: 'queued_at', type: 'timestamptz', nullable: true })
  queuedAt!: Date | null;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt!: Date | null;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt!: Date | null;

  @Column({ name: 'opened_at', type: 'timestamptz', nullable: true })
  openedAt!: Date | null;

  @Column({ name: 'clicked_at', type: 'timestamptz', nullable: true })
  clickedAt!: Date | null;

  @Column({ name: 'bounced_at', type: 'timestamptz', nullable: true })
  bouncedAt!: Date | null;

  @Column({ name: 'failed_at', type: 'timestamptz', nullable: true })
  failedAt!: Date | null;

  @Column({ name: 'unsubscribed_at', type: 'timestamptz', nullable: true })
  unsubscribedAt!: Date | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
