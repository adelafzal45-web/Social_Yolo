import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum AutomationTrigger {
  USER_REGISTERED = 'user.registered',
  USER_INACTIVE = 'user.inactive',
  SUBSCRIPTION_EXPIRING = 'subscription.expiring',
  SUBSCRIPTION_EXPIRED = 'subscription.expired',
  OFFER_CREATED = 'offer.created',
  USER_QUALIFIES_OFFER = 'user.qualifies_offer',
  TRIAL_ENDING = 'trial.ending',
  PAYMENT_SUCCESSFUL = 'payment.successful',
  PAYMENT_FAILED = 'payment.failed',
}

@Entity('email_automation_rules')
export class EmailAutomationRuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Index('idx_email_automations_trigger')
  @Column({
    name: 'trigger_event',
    type: 'varchar',
    length: 100,
  })
  triggerEvent!: AutomationTrigger;

  @Column({ type: 'jsonb', default: {} })
  conditions!: Record<string, any>;

  @Column({ name: 'template_id', type: 'uuid' })
  templateId!: string;

  @Column({ name: 'offer_id', type: 'uuid', nullable: true })
  offerId!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
