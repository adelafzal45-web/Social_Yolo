import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from '../../posts/entities/post.entity';
import { BrandProfile } from '../../brands/entities/brand-profile.entity';
import { CreditTransaction } from '../../billing/entities/credit-transaction.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { UserSubscription } from '../../billing/entities/subscription.entity';
import { Payment } from '../../billing/entities/payment.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum UserPlan {
  FREE_TRIAL = 'free_trial',
  STARTER = 'starter',
  PRO = 'pro',
  AGENCY = 'agency',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_users_email', { unique: true })
  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  passwordHash!: string | null;

  @Index('idx_users_google_id')
  @Column({ name: 'google_id', type: 'varchar', length: 255, nullable: true })
  googleId!: string | null;

  @Index('idx_users_better_auth_id')
  @Column({
    name: 'better_auth_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  betterAuthId!: string | null;

  @Column({
    name: 'auth_provider',
    type: 'varchar',
    length: 50,
    default: 'local',
  })
  authProvider!: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name!: string;

  @Index('idx_users_role')
  @Column({
    name: 'role',
    type: 'varchar',
    length: 50,
    default: UserRole.USER,
  })
  role!: UserRole;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'credits', type: 'integer', default: 50 })
  credits!: number;

  @Column({
    name: 'plan',
    type: 'varchar',
    length: 50,
    default: UserPlan.FREE_TRIAL,
  })
  plan!: UserPlan;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl!: string | null;

  @Column({
    name: 'reset_password_token',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  resetPasswordToken!: string | null;

  @Column({
    name: 'reset_password_expires',
    type: 'timestamptz',
    nullable: true,
  })
  resetPasswordExpires!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => Post, (post) => post.user)
  posts!: Post[];

  @OneToMany(() => BrandProfile, (brand) => brand.user)
  brandProfiles!: BrandProfile[];

  @OneToMany(() => CreditTransaction, (tx) => tx.user)
  creditTransactions!: CreditTransaction[];

  @OneToMany(() => Notification, (notif) => notif.user)
  notifications!: Notification[];

  @OneToMany(() => UserSubscription, (sub) => sub.user)
  subscriptions!: UserSubscription[];

  @OneToMany(() => Payment, (payment) => payment.user)
  payments!: Payment[];
}
