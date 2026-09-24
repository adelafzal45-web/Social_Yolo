import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DesignReferenceEmbedding } from './design-reference-embedding.entity';
import { DesignReferencePattern } from './design-reference-pattern.entity';
import { DesignReferenceTag } from './design-reference-tag.entity';
import { DesignReferenceAsset } from './design-reference-asset.entity';

export type DesignReferenceSource =
  | 'pinterest'
  | 'behance'
  | 'internal'
  | 'user_upload'
  | 'socialyolo_memory'
  | 'curated_dataset';

export type LicenseType =
  | 'internal'
  | 'licensed'
  | 'public_reference'
  | 'user_uploaded'
  | 'proprietary_memory';

@Entity('design_references')
export class DesignReference {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_design_references_source')
  @Column({ name: 'source', type: 'varchar', length: 50, default: 'internal' })
  source!: DesignReferenceSource;

  @Column({ name: 'source_url', type: 'text', nullable: true })
  sourceUrl!: string | null;

  @Column({ name: 'external_id', type: 'varchar', length: 255, nullable: true })
  externalId!: string | null;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'image_url', type: 'text' })
  imageUrl!: string;

  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl!: string | null;

  @Index('idx_design_references_category')
  @Column({ name: 'category', type: 'varchar', length: 100, nullable: true })
  category!: string | null;

  @Index('idx_design_references_industry')
  @Column({ name: 'industry', type: 'varchar', length: 100, nullable: true })
  industry!: string | null;

  @Index('idx_design_references_platform')
  @Column({ name: 'platform', type: 'varchar', length: 100, nullable: true })
  platform!: string | null;

  @Index('idx_design_references_design_type')
  @Column({ name: 'design_type', type: 'varchar', length: 100, nullable: true })
  designType!: string | null;

  @Index('idx_design_references_style')
  @Column({ name: 'style', type: 'varchar', length: 100, nullable: true })
  style!: string | null;

  @Column({ name: 'aspect_ratio', type: 'varchar', length: 20, default: '1:1' })
  aspectRatio!: string;

  @Column({ name: 'width', type: 'int', default: 1080 })
  width!: number;

  @Column({ name: 'height', type: 'int', default: 1080 })
  height!: number;

  /** Extracted composition metadata: { layout, focalPoint, textPlacement, ctaPlacement, grid } */
  @Column({ name: 'composition', type: 'jsonb', nullable: true })
  composition!: Record<string, any> | null;

  /** Extracted typography rules: { hierarchy, weight, bodyDensity, fontStyle } */
  @Column({ name: 'typography', type: 'jsonb', nullable: true })
  typography!: Record<string, any> | null;

  /** Dominant color palette hex strings: ['#0f172a', '#e2e8f0', '#3b82f6'] */
  @Column({ name: 'color_palette', type: 'jsonb', nullable: true })
  colorPalette!: string[] | null;

  /** Key visual element descriptors: ['isolated product', 'glass morphism', 'soft shadows'] */
  @Column({ name: 'visual_elements', type: 'jsonb', nullable: true })
  visualElements!: string[] | null;

  /** Quality score 0..100 based on aesthetic rating & compliance */
  @Column({ name: 'quality_score', type: 'float', default: 88 })
  qualityScore!: number;

  @Column({ name: 'license_type', type: 'varchar', length: 50, default: 'internal' })
  licenseType!: LicenseType;

  @Column({ name: 'usage_count', type: 'int', default: 0 })
  usageCount!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => DesignReferenceEmbedding, (emb) => emb.reference, { cascade: true })
  embeddings!: DesignReferenceEmbedding[];

  @OneToMany(() => DesignReferencePattern, (pat) => pat.reference, { cascade: true })
  patterns!: DesignReferencePattern[];

  @OneToMany(() => DesignReferenceTag, (tag) => tag.reference, { cascade: true })
  tags!: DesignReferenceTag[];

  @OneToMany(() => DesignReferenceAsset, (asset) => asset.reference, { cascade: true })
  assets!: DesignReferenceAsset[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
