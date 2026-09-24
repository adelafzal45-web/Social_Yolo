import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InspirationAnalysis } from './inspiration-analysis.entity';

@Entity('inspiration_items')
export class InspirationItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_inspiration_provider')
  @Column({ name: 'provider', type: 'varchar', length: 100 })
  provider!: string;

  @Column({ name: 'external_id', type: 'varchar', length: 255 })
  externalId!: string;

  @Column({ name: 'external_url', type: 'text', nullable: true })
  externalUrl!: string | null;

  @Column({ name: 'title', type: 'text', nullable: true })
  title!: string | null;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'author_name', type: 'varchar', length: 255, nullable: true })
  authorName!: string | null;

  @Column({ name: 'author_url', type: 'text', nullable: true })
  authorUrl!: string | null;

  @Column({ name: 'media_type', type: 'varchar', length: 50, default: 'image' })
  mediaType!: string;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl!: string | null;

  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl!: string | null;

  @Column({ name: 'video_url', type: 'text', nullable: true })
  videoUrl!: string | null;

  @Column({ name: 'width', type: 'integer', nullable: true })
  width!: number | null;

  @Column({ name: 'height', type: 'integer', nullable: true })
  height!: number | null;

  @Column({ name: 'tags', type: 'jsonb', nullable: true })
  tags!: string[] | null;

  @Column({ name: 'colors', type: 'jsonb', nullable: true })
  colors!: string[] | null;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata!: Record<string, any> | null;

  @Column({ name: 'license_info', type: 'jsonb', nullable: true })
  licenseInfo!: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToOne(() => InspirationAnalysis, (analysis) => analysis.item)
  analysis!: InspirationAnalysis;
}
