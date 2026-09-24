import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('content_concepts')
export class ContentConcept {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_content_concepts_brand_id')
  @Column({ name: 'brand_id', type: 'uuid' })
  brandId!: string;

  @Column({ name: 'campaign_id', type: 'uuid', nullable: true })
  campaignId!: string | null;

  @Column({ name: 'pillar_id', type: 'uuid', nullable: true })
  pillarId!: string | null;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'concept', type: 'text', nullable: true })
  concept!: string | null;

  @Column({ name: 'hook', type: 'text', nullable: true })
  hook!: string | null;

  @Column({ name: 'angle', type: 'text', nullable: true })
  angle!: string | null;

  @Column({ name: 'visual_direction', type: 'jsonb', nullable: true })
  visualDirection!: Record<string, any> | null;

  @Column({ name: 'platforms', type: 'jsonb', nullable: true })
  platforms!: string[] | null;

  @Column({ name: 'inspiration_ids', type: 'jsonb', nullable: true })
  inspirationIds!: string[] | null;

  @Column({ name: 'trend_ids', type: 'jsonb', nullable: true })
  trendIds!: string[] | null;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'draft' })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
