import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

export enum EmailEventType {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  CLICKED = 'clicked',
  BOUNCED = 'bounced',
  COMPLAINED = 'complained',
  FAILED = 'failed',
  UNSUBSCRIBED = 'unsubscribed',
}

@Entity('email_events')
@Unique('uq_email_events_provider_event', ['provider', 'providerEventId'])
export class EmailEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_email_events_campaign_id')
  @Column({ name: 'campaign_id', type: 'uuid', nullable: true })
  campaignId!: string | null;

  @Index('idx_email_events_recipient_id')
  @Column({ name: 'recipient_id', type: 'uuid', nullable: true })
  recipientId!: string | null;

  @Column({ type: 'varchar', length: 50 })
  provider!: string;

  @Column({ name: 'provider_event_id', type: 'varchar', length: 255 })
  providerEventId!: string;

  @Index('idx_email_events_type')
  @Column({
    name: 'event_type',
    type: 'varchar',
    length: 50,
  })
  eventType!: EmailEventType;

  @Column({ name: 'event_data', type: 'jsonb', default: {} })
  eventData!: Record<string, any>;

  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
