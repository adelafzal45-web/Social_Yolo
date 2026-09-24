import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BrandProfile } from './brand-profile.entity';

/**
 * Extended brand intelligence extracted from website analysis and AI inference.
 * Stores structured products, services, audience, and confidence scores.
 */
@Entity('brand_insights')
export class BrandInsight {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_brand_insights_brand_id')
  @Column({ name: 'brand_id', type: 'uuid' })
  brandId!: string;

  @OneToOne(() => BrandProfile, (brand) => brand.insight, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brand_id' })
  brand!: BrandProfile;

  @Column({ name: 'company_description', type: 'text', nullable: true })
  companyDescription!: string | null;

  @Column({ name: 'value_proposition', type: 'text', nullable: true })
  valueProposition!: string | null;

  /** Array of product objects: [{ name, description, category }] */
  @Column({ name: 'products', type: 'jsonb', nullable: true })
  products!: Record<string, any>[] | null;

  /** Array of service objects: [{ name, description }] */
  @Column({ name: 'services', type: 'jsonb', nullable: true })
  services!: Record<string, any>[] | null;

  /** Target audience segments: [{ segment, description, demographics }] */
  @Column({ name: 'target_audience', type: 'jsonb', nullable: true })
  targetAudience!: Record<string, any>[] | null;

  /** Locations served: [{ country, city, region }] */
  @Column({ name: 'locations', type: 'jsonb', nullable: true })
  locations!: Record<string, any>[] | null;

  /** Key benefits offered */
  @Column({ name: 'benefits', type: 'jsonb', nullable: true })
  benefits!: string[] | null;

  /** Customer pain points addressed */
  @Column({ name: 'pain_points', type: 'jsonb', nullable: true })
  painPoints!: string[] | null;

  /** SEO/content keywords */
  @Column({ name: 'keywords', type: 'jsonb', nullable: true })
  keywords!: string[] | null;

  /** Business categories */
  @Column({ name: 'categories', type: 'jsonb', nullable: true })
  categories!: string[] | null;

  /** Structured social media links: { instagram, facebook, linkedin, ... } */
  @Column({ name: 'social_links', type: 'jsonb', nullable: true })
  socialLinks!: Record<string, string> | null;

  /** Inferred brand voice profile: { tone, formality, humor, technicality, emotion } */
  @Column({ name: 'brand_voice', type: 'jsonb', nullable: true })
  brandVoice!: Record<string, any> | null;

  /** URLs that were analyzed to extract this data */
  @Column({ name: 'source_urls', type: 'jsonb', nullable: true })
  sourceUrls!: string[] | null;

  /** Confidence scores per field: { industry: 0.94, products: 0.91, ... } */
  @Column({ name: 'confidence', type: 'jsonb', nullable: true })
  confidence!: Record<string, number> | null;

  /**
   * Tracks the data source per field to protect user edits:
   * { industry: 'AI_GENERATED', description: 'USER_EDITED', ... }
   *
   * Values: AI_GENERATED | USER_ENTERED | USER_EDITED | WEBSITE_DETECTED
   */
  @Column({ name: 'field_sources', type: 'jsonb', nullable: true })
  fieldSources!: Record<string, string> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
