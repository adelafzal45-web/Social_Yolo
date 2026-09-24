import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { InspirationItem } from './inspiration-item.entity';

@Entity('inspiration_analysis')
export class InspirationAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_inspiration_analysis_item')
  @Column({ name: 'inspiration_item_id', type: 'uuid' })
  inspirationItemId!: string;

  @OneToOne(() => InspirationItem, (item) => item.analysis, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inspiration_item_id' })
  item!: InspirationItem;

  @Column({ name: 'visual_style', type: 'jsonb', nullable: true })
  visualStyle!: Record<string, any> | null;

  @Column({ name: 'composition', type: 'jsonb', nullable: true })
  composition!: Record<string, any> | null;

  @Column({ name: 'color_palette', type: 'jsonb', nullable: true })
  colorPalette!: string[] | null;

  @Column({ name: 'typography', type: 'jsonb', nullable: true })
  typography!: Record<string, any> | null;

  @Column({ name: 'layout_type', type: 'varchar', length: 100, nullable: true })
  layoutType!: string | null;

  @Column({ name: 'subject_type', type: 'varchar', length: 100, nullable: true })
  subjectType!: string | null;

  @Column({ name: 'emotion', type: 'varchar', length: 100, nullable: true })
  emotion!: string | null;

  @Column({ name: 'content_type', type: 'varchar', length: 100, nullable: true })
  contentType!: string | null;

  @Column({ name: 'industry', type: 'varchar', length: 100, nullable: true })
  industry!: string | null;

  @Column({ name: 'embedding', type: 'real', array: true, nullable: true })
  embedding!: number[] | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
