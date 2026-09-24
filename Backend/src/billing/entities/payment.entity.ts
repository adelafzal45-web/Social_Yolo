import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserSubscription } from './subscription.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_payments_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'subscription_id', type: 'uuid', nullable: true })
  subscriptionId!: string | null;

  @ManyToOne(() => UserSubscription, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'subscription_id' })
  subscription!: UserSubscription | null;

  @Column({ name: 'provider', type: 'varchar', length: 50, default: 'safepay' })
  provider!: string;

  @Index('idx_payments_provider_tx_id', { unique: true })
  @Column({
    name: 'provider_transaction_id',
    type: 'varchar',
    length: 255,
    nullable: true,
    unique: true,
  })
  providerTransactionId!: string | null;

  @Index('idx_payments_tracker_token')
  @Column({
    name: 'tracker_token',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  trackerToken!: string | null;

  @Index('idx_payments_checkout_ref', { unique: true })
  @Column({
    name: 'checkout_session_ref',
    type: 'varchar',
    length: 255,
    nullable: true,
    unique: true,
  })
  checkoutSessionRef!: string | null;

  @Column({ name: 'plan', type: 'varchar', length: 50, nullable: true })
  plan!: string | null;

  @Column({ name: 'pack_id', type: 'varchar', length: 50, nullable: true })
  packId!: string | null;

  @Column({ name: 'credits', type: 'integer', default: 0 })
  credits!: number;

  @Column({
    name: 'amount',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amount!: number;

  @Column({ name: 'currency', type: 'varchar', length: 10, default: 'PKR' })
  currency!: string;

  @Index('idx_payments_status')
  @Column({
    name: 'status',
    type: 'varchar',
    length: 50,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  paymentMethod!: string | null;

  @Column({
    name: 'webhook_event_ref',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  webhookEventRef!: string | null;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason!: string | null;

  @Column({ name: 'metadata', type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;
}
