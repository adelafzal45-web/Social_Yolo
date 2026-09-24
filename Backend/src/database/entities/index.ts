import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';

// -----------------------------------------------------------------------------
// 1. Organization (Multi-Tenancy Root)
// -----------------------------------------------------------------------------
@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 50, default: 'Pro' })
  tier!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => User, (user) => user.organization)
  users!: User[];
}

// -----------------------------------------------------------------------------
// 2. User & RBAC
// -----------------------------------------------------------------------------
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => Organization, (org) => org.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName!: string;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'varchar', length: 50, default: 'CREATOR' })
  role!: string;

  @Column({
    type: 'simple-array',
    default:
      'image:remove-background,image:view,project.create,creative.generate',
  })
  permissions!: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

// -----------------------------------------------------------------------------
// 3. Subscription & Plans
// -----------------------------------------------------------------------------
@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  name!: string;

  @Column({ name: 'price_cents', type: 'int', default: 0 })
  priceCents!: number;

  @Column({ name: 'monthly_credits', type: 'int', default: 100 })
  monthlyCredits!: number;

  @Column({ name: 'max_team_seats', type: 'int', default: 1 })
  maxTeamSeats!: number;

  @Column({ name: 'max_client_folders', type: 'int', default: 0 })
  maxClientFolders!: number;

  @Column({ name: 'features', type: 'jsonb', default: {} })
  features!: Record<string, any>;
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId!: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: string;

  @Column({ name: 'current_period_start', type: 'timestamp' })
  currentPeriodStart!: Date;

  @Column({ name: 'current_period_end', type: 'timestamp' })
  currentPeriodEnd!: Date;

  @Column({ name: 'cancel_at_period_end', type: 'boolean', default: false })
  cancelAtPeriodEnd!: boolean;
}

// -----------------------------------------------------------------------------
// 4. Credit Accounting (ACID, Reservations & Transactions)
// -----------------------------------------------------------------------------
@Entity('credit_accounts')
export class CreditAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'organization_id', type: 'uuid', unique: true })
  organizationId!: string;

  @Column({ type: 'int', default: 214 })
  balance!: number;

  @Column({ name: 'reserved_balance', type: 'int', default: 0 })
  reservedBalance!: number;

  @Column({ type: 'int', default: 1 })
  version!: number; // Optimistic locking
}

@Entity('credit_transactions')
export class CreditTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ type: 'int' })
  amount!: number; // Positive for grant/top-up, negative for deduction

  @Column({ name: 'balance_after', type: 'int' })
  balanceAfter!: number;

  @Column({ type: 'varchar', length: 50 })
  type!: 'GRANT' | 'CONSUME' | 'RESERVE' | 'RELEASE' | 'TOPUP';

  @Column({ type: 'varchar', length: 255, default: '' })
  description!: string;

  @Column({
    name: 'reference_id',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  referenceId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

// -----------------------------------------------------------------------------
// 5. Brands & RAG Vector Knowledge Base
// -----------------------------------------------------------------------------
@Entity('brands')
export class Brand {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'organization_id', type: 'varchar', length: 255, default: 'd0cf85ae-ed2c-486a-889d-27dca93daa66' })
  organizationId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  tagline!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Column({ name: 'website_url', type: 'varchar', length: 500, default: '' })
  websiteUrl!: string;

  @Column({ type: 'varchar', length: 50, default: 'food_beverage' })
  niche!: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl?: string;

  @Column({ name: 'colors', type: 'jsonb', default: {} })
  colors!: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };

  @Column({ name: 'fonts', type: 'jsonb', default: {} })
  fonts!: {
    display: string;
    body: string;
  };

  @Column({ type: 'varchar', length: 50, default: 'Warm' })
  tone!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

@Entity('rag_documents')
export class RAGDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Index()
  @Column({ name: 'brand_id', type: 'uuid' })
  brandId!: string;

  @Column({ name: 'source_type', type: 'varchar', length: 50 })
  sourceType!: 'website' | 'guidelines' | 'product_spec' | 'campaign';

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'content_text', type: 'text' })
  contentText!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  checksum?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

@Entity('rag_chunks')
export class RAGChunk {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'document_id', type: 'uuid' })
  documentId!: string;

  @Column({ name: 'chunk_index', type: 'int' })
  chunkIndex!: number;

  @Column({ type: 'text' })
  content!: string;

  // Stored as floating point vector array for cosine similarity retrieval
  @Column({ name: 'embedding', type: 'float8', array: true, nullable: true })
  embedding?: number[];

  @Column({ name: 'token_count', type: 'int', default: 0 })
  tokenCount!: number;
}

// -----------------------------------------------------------------------------
// 6. Projects, Creative Variants & Compliance
// -----------------------------------------------------------------------------
@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'organization_id', type: 'varchar', length: 255, default: 'd0cf85ae-ed2c-486a-889d-27dca93daa66' })
  organizationId!: string;

  @Index()
  @Column({ name: 'brand_id', type: 'varchar', length: 255, default: '00000000-0000-0000-0000-000000000000' })
  brandId!: string;

  @Column({ name: 'brand_name', type: 'varchar', length: 255, default: '' })
  brandName!: string;

  @Column({
    name: 'client_folder',
    type: 'varchar',
    length: 255,
    default: 'No folder',
  })
  clientFolder!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status!: 'draft' | 'generating' | 'review' | 'approved';

  @Column({
    name: 'output_mode',
    type: 'varchar',
    length: 50,
    default: 'creative',
  })
  outputMode!: 'creative' | 'meta_ad';

  @Column({ type: 'simple-array', default: 'instagram_portrait,facebook_feed' })
  platforms!: string[];

  @Column({ type: 'varchar', length: 50, default: 'lifestyle' })
  style!: string;

  @Column({
    name: 'content_type',
    type: 'varchar',
    length: 50,
    default: 'static',
  })
  contentType!: 'static' | 'video';

  @Column({ type: 'int', default: 4 })
  quantity!: number;

  @Column({ name: 'original_photo_url', type: 'text', default: '' })
  originalPhotoUrl!: string;

  @Column({ name: 'enhanced_photo_url', type: 'text', nullable: true })
  enhancedPhotoUrl?: string;

  @Column({ name: 'transparent_photo_url', type: 'text', nullable: true })
  transparentPhotoUrl?: string;

  @Column({
    name: 'background_mode',
    type: 'varchar',
    length: 50,
    default: 'ai_replace',
  })
  backgroundMode!: 'keep' | 'remove' | 'ai_replace';

  @Column({
    name: 'background_preset',
    type: 'varchar',
    length: 100,
    default: 'Warm Studio',
  })
  backgroundPreset!: string;

  @Column({ name: 'copy', type: 'jsonb', default: {} })
  copy!: {
    headline: string;
    body: string;
    occasion: string;
    customNote?: string;
  };

  @Column({ name: 'credits_used', type: 'int', default: 0 })
  creditsUsed!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => CreativeVariant, (variant) => variant.project)
  creatives!: CreativeVariant[];
}

@Entity('creative_variants')
export class CreativeVariant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @ManyToOne(() => Project, (proj) => proj.creatives, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column({ name: 'platform_key', type: 'varchar', length: 50 })
  platformKey!: string;

  @Column({ name: 'platform_name', type: 'varchar', length: 50 })
  platformName!: string;

  @Column({ type: 'int' })
  width!: number;

  @Column({ type: 'int' })
  height!: number;

  @Column({ type: 'varchar', length: 100, default: '' })
  label!: string;

  @Column({ type: 'varchar', length: 50, default: 'lifestyle' })
  style!: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  headline!: string;

  @Column({ type: 'text', default: '' })
  body!: string;

  @Column({
    name: 'cta_text',
    type: 'varchar',
    length: 50,
    default: 'SHOP NOW',
  })
  ctaText!: string;

  @Column({ name: 'text_coverage_pct', type: 'int', default: 12 })
  textCoveragePct!: number;

  @Column({ name: 'meta_pass', type: 'boolean', default: true })
  metaPass!: boolean;

  @Column({ type: 'varchar', length: 50, default: 'approved' })
  status!: 'approved' | 'needs_review' | 'rejected';

  @Column({ name: 'render_url', type: 'text', nullable: true })
  renderUrl?: string;

  @Column({ name: 'storage_key', type: 'varchar', length: 255, nullable: true })
  storageKey?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

// -----------------------------------------------------------------------------
// 7. Generation Jobs & Real-Time Event Ledger
// -----------------------------------------------------------------------------
@Entity('generation_jobs')
export class GenerationJob {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Index()
  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @Column({ type: 'varchar', length: 50, default: 'QUEUED' })
  status!: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

  @Column({
    name: 'current_stage',
    type: 'varchar',
    length: 100,
    default: 'Queue Initialized',
  })
  currentStage!: string;

  @Column({ name: 'progress_pct', type: 'int', default: 0 })
  progressPct!: number;

  @Column({ name: 'cost_credits', type: 'int', default: 16 })
  costCredits!: number;

  @Index({ unique: true })
  @Column({
    name: 'idempotency_key',
    type: 'varchar',
    length: 100,
    unique: true,
  })
  idempotencyKey!: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

// -----------------------------------------------------------------------------
// 8. AI Usage Telemetry & Observability
// -----------------------------------------------------------------------------
@Entity('ai_usage_logs')
export class AIUsageLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string;

  @Column({ name: 'job_id', type: 'varchar', length: 100, nullable: true })
  jobId?: string;

  @Column({ type: 'varchar', length: 50 })
  provider!: 'gemini' | 'grok' | 'openai' | 'claude';

  @Column({ type: 'varchar', length: 100 })
  model!: string;

  @Column({ type: 'varchar', length: 100 })
  task!: string;

  @Column({ name: 'prompt_tokens', type: 'int', default: 0 })
  promptTokens!: number;

  @Column({ name: 'completion_tokens', type: 'int', default: 0 })
  completionTokens!: number;

  @Column({ name: 'latency_ms', type: 'int', default: 0 })
  latencyMs!: number;

  @Column({ name: 'cost_estimate_cents', type: 'float', default: 0 })
  costEstimateCents!: number;

  @Column({ type: 'varchar', length: 50, default: 'SUCCESS' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

// -----------------------------------------------------------------------------
// 9. Invoices & Audit Logs
// -----------------------------------------------------------------------------
@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'amount_cents', type: 'int' })
  amountCents!: number;

  @Column({ name: 'amount_formatted', type: 'varchar', length: 20 })
  amountFormatted!: string;

  @Column({ type: 'varchar', length: 255 })
  description!: string;

  @Column({ type: 'varchar', length: 50, default: 'Paid' })
  status!: string;

  @Column({ name: 'pdf_url', type: 'text', nullable: true })
  pdfUrl?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string;

  @Column({ type: 'varchar', length: 100 })
  action!: string;

  @Column({ name: 'resource_type', type: 'varchar', length: 50 })
  resourceType!: string;

  @Column({ name: 'resource_id', type: 'varchar', length: 100 })
  resourceId!: string;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @Column({
    name: 'ip_address',
    type: 'varchar',
    length: 50,
    default: '127.0.0.1',
  })
  ipAddress!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
