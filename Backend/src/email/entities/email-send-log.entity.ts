import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('email_send_logs')
export class EmailSendLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_email_send_logs_message_id')
  @Column({ name: 'message_id', type: 'varchar', length: 255, nullable: true })
  messageId!: string | null;

  @Column({ type: 'varchar', length: 50 })
  provider!: string;

  @Index('idx_email_send_logs_recipient')
  @Column({ type: 'varchar', length: 255 })
  recipient!: string;

  @Column({ type: 'varchar', length: 255 })
  subject!: string;

  @Column({ type: 'varchar', length: 50 })
  status!: string;

  @Column({ name: 'provider_response', type: 'text', nullable: true })
  providerResponse!: string | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @Column({ name: 'attempt_count', type: 'integer', default: 1 })
  attemptCount!: number;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
