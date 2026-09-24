import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('email_preferences')
export class EmailPreferenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_email_preferences_user_id', { unique: true })
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  @Column({ name: 'marketing_emails', type: 'boolean', default: true })
  marketingEmails!: boolean;

  @Column({ name: 'offer_emails', type: 'boolean', default: true })
  offerEmails!: boolean;

  @Column({ name: 'product_updates', type: 'boolean', default: true })
  productUpdates!: boolean;

  @Column({ name: 'newsletters', type: 'boolean', default: true })
  newsletters!: boolean;

  @Column({ name: 'system_notifications', type: 'boolean', default: true })
  systemNotifications!: boolean;

  // Security emails always default to true and cannot be disabled by users
  @Column({ name: 'security_emails', type: 'boolean', default: true })
  securityEmails!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
