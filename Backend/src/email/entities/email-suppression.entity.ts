import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum SuppressionReason {
  UNSUBSCRIBED = 'UNSUBSCRIBED',
  HARD_BOUNCE = 'HARD_BOUNCE',
  COMPLAINT = 'COMPLAINT',
  MANUAL = 'MANUAL',
}

@Entity('email_suppressions')
export class EmailSuppressionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_email_suppressions_email', { unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Index('idx_email_suppressions_reason')
  @Column({
    type: 'varchar',
    length: 50,
    default: SuppressionReason.UNSUBSCRIBED,
  })
  reason!: SuppressionReason;

  @Column({ type: 'varchar', length: 100, default: 'system' })
  source!: string;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
