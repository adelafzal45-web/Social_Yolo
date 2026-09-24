import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CreativeGeneration } from './creative-generation.entity';
import { CreativeExport } from './creative-export.entity';

@Entity('creative_variations')
export class CreativeVariation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_creative_var_generation_id')
  @Column({ name: 'generation_id', type: 'uuid' })
  generationId!: string;

  @ManyToOne(() => CreativeGeneration, (gen) => gen.variations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'generation_id' })
  generation!: CreativeGeneration;

  @Column({ name: 'variation_key', type: 'varchar', length: 50 })
  variationKey!: 'variation_a' | 'variation_b' | 'variation_c' | 'variation_d';

  @Column({ name: 'label', type: 'varchar', length: 100 })
  label!: string; // e.g. "Variation A — Premium", "Variation B — Minimal", "Variation C — Bold", "Variation D — Editorial"

  @Column({ name: 'concept_style', type: 'varchar', length: 50 })
  conceptStyle!: 'Premium' | 'Minimal' | 'Bold' | 'Editorial';

  @Column({ name: 'layout_name', type: 'varchar', length: 100 })
  layoutName!: string;

  @Column({ name: 'headline', type: 'varchar', length: 255 })
  headline!: string;

  @Column({ name: 'subheadline', type: 'text', nullable: true })
  subheadline!: string | null;

  @Column({ name: 'body', type: 'text', nullable: true })
  body!: string | null;

  @Column({ name: 'cta_text', type: 'varchar', length: 100, default: 'Shop Now' })
  ctaText!: string;

  @Column({ name: 'width', type: 'int', default: 1080 })
  width!: number;

  @Column({ name: 'height', type: 'int', default: 1080 })
  height!: number;

  /** Final composited image render URL */
  @Column({ name: 'render_url', type: 'text' })
  renderUrl!: string;

  /** Raw background visual asset URL */
  @Column({ name: 'background_asset_url', type: 'text', nullable: true })
  backgroundAssetUrl!: string | null;

  /** Calculated text coverage density percentage (complying with Meta <= 20%) */
  @Column({ name: 'text_coverage_pct', type: 'float', default: 12 })
  textCoveragePct!: number;

  /** Whether design passed Meta ad rules */
  @Column({ name: 'meta_pass', type: 'boolean', default: true })
  metaPass!: boolean;

  /** Quality QA score (0..100) */
  @Column({ name: 'quality_score', type: 'float', default: 90 })
  qualityScore!: number;

  /** Quality metrics breakdown */
  @Column({ name: 'quality_metrics', type: 'jsonb', nullable: true })
  qualityMetrics!: Record<string, any> | null;

  /** User selection flag */
  @Column({ name: 'is_approved', type: 'boolean', default: false })
  isApproved!: boolean;

  /** Structured editable design document (Canvas + Layers) */
  @Column({ name: 'layers', type: 'jsonb', nullable: true })
  layers!: Record<string, any> | null;

  /** 3-4 concept details used for this variation */
  @Column({ name: 'concept_data', type: 'jsonb', nullable: true })
  conceptData!: Record<string, any> | null;

  /** Design validation report (PASS / WARNING / ERROR) */
  @Column({ name: 'validation_report', type: 'jsonb', nullable: true })
  validationReport!: Record<string, any> | null;

  @OneToMany(() => CreativeExport, (exp) => exp.variation)
  exports!: CreativeExport[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
