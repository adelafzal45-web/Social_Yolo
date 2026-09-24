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
import { DesignReference } from './design-reference.entity';

@Entity('design_reference_patterns')
export class DesignReferencePattern {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_design_ref_pat_reference_id')
  @Column({ name: 'reference_id', type: 'uuid' })
  referenceId!: string;

  @ManyToOne(() => DesignReference, (ref) => ref.patterns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reference_id' })
  reference!: DesignReference;

  /**
   * Composition details:
   * { layout: 'asymmetric editorial', focalPoint: 'product', textPlacement: 'upper-left', ctaPlacement: 'lower-right', grid: 'golden-ratio' }
   */
  @Column({ name: 'composition', type: 'jsonb' })
  composition!: {
    layout: string;
    focalPoint: string;
    textPlacement: string;
    ctaPlacement: string;
    grid?: string;
    whitespacePercentage?: number;
  };

  /**
   * Typography hierarchy:
   * { hierarchy: 'large headline', weight: 'bold', bodyDensity: 'low', fontClassification: 'serif-display' }
   */
  @Column({ name: 'typography', type: 'jsonb' })
  typography!: {
    hierarchy: string;
    weight: string;
    bodyDensity: string;
    fontClassification?: string;
    contrast?: string;
  };

  /**
   * Color strategy:
   * { background: 'dark', accentUsage: 'controlled', mood: 'luxury', dominantColors: string[] }
   */
  @Column({ name: 'color', type: 'jsonb' })
  color!: {
    background: string;
    accentUsage: string;
    mood?: string;
    dominantColors?: string[];
  };

  /**
   * Spacing & Negative Space:
   * { whitespace: 'high', paddingRatio: 0.15 }
   */
  @Column({ name: 'spacing', type: 'jsonb' })
  spacing!: {
    whitespace: string;
    paddingRatio?: number;
  };

  /**
   * Visual Treatment:
   * { depth: true, shadows: 'subtle', lighting: 'soft-studio', textures: ['marble', 'pedestal'] }
   */
  @Column({ name: 'visual_treatment', type: 'jsonb' })
  visualTreatment!: {
    depth: boolean;
    shadows: string;
    lighting?: string;
    textures?: string[];
  };

  /**
   * Visual Hierarchy:
   * { priorityOrder: ['product', 'headline', 'cta'] }
   */
  @Column({ name: 'visual_hierarchy', type: 'jsonb' })
  visualHierarchy!: {
    priorityOrder: string[];
    focalEmphasis?: string;
  };

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
