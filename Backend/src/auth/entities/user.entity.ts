import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Subscription plan tiers. */
export enum UserPlan {
  FREE = 'free',
  PRO = 'pro',
}

/** Stripe-style subscription lifecycle states (mock mode uses the same values). */
export enum SubscriptionStatus {
  NONE = 'none',
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
}

/**
 * Application user. Identity for auth (JWT) and billing:
 *
 * - `plan` + `subscriptionStatus` decide whether generation is allowed.
 * - `creditsUsed` counts paid-with-free-tier generations (free trial limit
 *   comes from `FREE_GENERATIONS` in `.env`, default 3).
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash!: string;

  @Column({ name: 'display_name', type: 'text', nullable: true })
  displayName!: string | null;

  @Column({ type: 'text', default: UserPlan.FREE })
  plan!: UserPlan;

  /** Number of free generations consumed (only incremented on success). */
  @Column({ name: 'credits_used', type: 'integer', default: 0 })
  creditsUsed!: number;

  @Column({ name: 'stripe_customer_id', type: 'text', nullable: true })
  stripeCustomerId!: string | null;

  @Column({ name: 'stripe_subscription_id', type: 'text', nullable: true })
  stripeSubscriptionId!: string | null;

  @Column({
    name: 'subscription_status',
    type: 'text',
    default: SubscriptionStatus.NONE,
  })
  subscriptionStatus!: SubscriptionStatus;

  /** When the current paid period ends; NULL on the free plan. */
  @Column({ name: 'current_period_end', type: 'timestamptz', nullable: true })
  currentPeriodEnd!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
