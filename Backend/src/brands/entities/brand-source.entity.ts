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
import { BrandProfile } from './brand-profile.entity';

/**
 * Records of individual web pages crawled during brand analysis.
 * Preserves the raw content and metadata from each source page.
 */
@Entity('brand_sources')
export class BrandSource {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_brand_sources_brand_id')
  @Column({ name: 'brand_id', type: 'uuid' })
  brandId!: string;

  @ManyToOne(() => BrandProfile, (brand) => brand.sources, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brand_id' })
  brand!: BrandProfile;

  @Column({ name: 'url', type: 'text' })
  url!: string;

  /** HOMEPAGE | ABOUT | PRODUCT | SERVICE | BLOG | CONTACT | OTHER */
  @Column({ name: 'page_type', type: 'varchar', length: 100, nullable: true })
  pageType!: string | null;

  @Column({ name: 'title', type: 'text', nullable: true })
  title!: string | null;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  /** Extracted readable text content from the page */
  @Column({ name: 'content', type: 'text', nullable: true })
  content!: string | null;

  /** SHA-256 hash of content for deduplication */
  @Column({ name: 'content_hash', type: 'varchar', length: 255, nullable: true })
  contentHash!: string | null;

  /** crawled | failed | pending */
  @Column({ name: 'status', type: 'varchar', length: 50, default: 'pending' })
  status!: string;

  @Column({ name: 'last_crawled_at', type: 'timestamptz', nullable: true })
  lastCrawledAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
