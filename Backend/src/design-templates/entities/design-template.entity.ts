import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('design_templates')
export class DesignTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_design_templates_name', { unique: true })
  @Column({ name: 'name', type: 'varchar', length: 100, unique: true })
  name!: string; // 'Minimal Product' | 'Premium Product' | 'Luxury' | 'Editorial' | 'Bold Typography' | 'Product Showcase' | 'Offer' | 'Corporate' | 'Lifestyle' | 'Announcement' | 'Educational' | 'Split Screen' | 'Dark Premium' | 'Clean White'

  @Index('idx_design_templates_category')
  @Column({ name: 'category', type: 'varchar', length: 100 })
  category!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'grid', type: 'jsonb' })
  grid!: {
    type: 'golden_ratio' | 'rule_of_thirds' | 'split' | 'centered' | 'editorial_asymmetric';
    columns?: number;
    rows?: number;
  };

  @Column({ name: 'margins', type: 'jsonb' })
  margins!: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };

  @Column({ name: 'text_regions', type: 'jsonb' })
  textRegions!: {
    headline: { x: number; y: number; width: number; height: number; align: string; maxFontSize: number };
    subheadline?: { x: number; y: number; width: number; height: number; align: string; maxFontSize: number };
    body?: { x: number; y: number; width: number; height: number; align: string; maxFontSize: number };
  };

  @Column({ name: 'image_regions', type: 'jsonb' })
  imageRegions!: {
    hero: { x: number; y: number; width: number; height: number; fit: string };
  };

  @Column({ name: 'cta_region', type: 'jsonb' })
  ctaRegion!: {
    x: number;
    y: number;
    width: number;
    height: number;
    align: string;
    style: string;
  };

  @Column({ name: 'logo_region', type: 'jsonb' })
  logoRegion!: {
    x: number;
    y: number;
    maxWidth: number;
    maxHeight: number;
    position: 'top-left' | 'top-right' | 'top-center' | 'bottom-center';
  };

  @Column({ name: 'typography_rules', type: 'jsonb' })
  typographyRules!: {
    hierarchy: string;
    headlineWeight: string;
    letterSpacing: string;
    lineHeightMultiplier: number;
  };

  @Column({ name: 'spacing_rules', type: 'jsonb' })
  spacingRules!: {
    whitespaceTier: 'low' | 'moderate' | 'generous' | 'editorial';
    minPaddingPx: number;
  };

  @Column({ name: 'supported_ratios', type: 'jsonb', default: ['1:1', '4:5', '9:16', '16:9'] })
  supportedRatios!: string[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
