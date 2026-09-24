import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CreativeVariation } from './creative-variation.entity';
import { CreativeExport } from './creative-export.entity';

export type CreativeGenerationStatus =
  | 'QUEUED'
  | 'ANALYZING_BRAND'
  | 'UNDERSTANDING_GOAL'
  | 'RETRIEVING_REFERENCES'
  | 'ANALYZING_PATTERNS'
  | 'PLANNING_COMPOSITION'
  | 'GENERATING_ASSETS'
  | 'BUILDING_CREATIVE'
  | 'APPLYING_BRAND'
  | 'QUALITY_CHECKING'
  | 'FINALIZING'
  | 'COMPLETED'
  | 'FAILED';

@Entity('creative_generations')
export class CreativeGeneration {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_creative_gen_project_id')
  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId!: string | null;

  @Index('idx_creative_gen_brand_id')
  @Column({ name: 'brand_id', type: 'uuid', nullable: true })
  brandId!: string | null;

  @Index('idx_creative_gen_user_id')
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ name: 'project_name', type: 'varchar', length: 255, default: 'Social Campaign' })
  projectName!: string;

  @Index('idx_creative_gen_design_type')
  @Column({ name: 'design_type', type: 'varchar', length: 50, default: 'creative' })
  designType!: 'creative' | 'meta_ad';

  @Index('idx_creative_gen_objective')
  @Column({ name: 'objective', type: 'varchar', length: 100 })
  objective!: string;

  @Index('idx_creative_gen_style')
  @Column({ name: 'style', type: 'varchar', length: 100 })
  style!: string;

  @Column({ name: 'composition_preference', type: 'varchar', length: 100, default: 'Product Focus' })
  compositionPreference!: string;

  @Column({ name: 'mood', type: 'varchar', length: 100, default: 'Premium' })
  mood!: string;

  @Column({ name: 'cta', type: 'varchar', length: 100, default: 'Shop Now' })
  cta!: string;

  @Index('idx_creative_gen_platform')
  @Column({ name: 'platform', type: 'varchar', length: 100, default: 'Instagram Post' })
  platform!: string;

  @Column({ name: 'aspect_ratio', type: 'varchar', length: 20, default: '1:1' })
  aspectRatio!: string;

  @Column({ name: 'width', type: 'int', default: 1080 })
  width!: number;

  @Column({ name: 'height', type: 'int', default: 1080 })
  height!: number;

  /** Full structured user options & smart defaults */
  @Column({ name: 'configuration', type: 'jsonb', default: {} })
  configuration!: Record<string, any>;

  /** IDs of retrieved design references used for pattern extraction (provenance / audit) */
  @Column({ name: 'reference_ids', type: 'jsonb', default: [] })
  referenceIds!: string[];

  /** Synthesized design strategy used by engine */
  @Column({ name: 'design_strategy', type: 'jsonb', nullable: true })
  designStrategy!: Record<string, any> | null;

  @Index('idx_creative_gen_status')
  @Column({ name: 'status', type: 'varchar', length: 50, default: 'QUEUED' })
  status!: CreativeGenerationStatus;

  @Column({ name: 'current_stage_label', type: 'varchar', length: 150, default: 'Analyzing Brand' })
  currentStageLabel!: string;

  @Column({ name: 'progress_pct', type: 'int', default: 5 })
  progressPct!: number;

  /** Quality score 0..100 from QA validation */
  @Column({ name: 'quality_score', type: 'float', nullable: true })
  qualityScore!: number | null;

  /** QA report details: { visualQA, brandQA, contentQA, platformQA, passed } */
  @Column({ name: 'validation_report', type: 'jsonb', nullable: true })
  validationReport!: Record<string, any> | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @OneToMany(() => CreativeVariation, (variation) => variation.generation, { cascade: true })
  variations!: CreativeVariation[];

  @OneToMany(() => CreativeExport, (exp) => exp.generation)
  exports!: CreativeExport[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
