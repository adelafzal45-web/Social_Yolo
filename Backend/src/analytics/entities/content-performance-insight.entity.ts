import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('content_performance_insights')
export class ContentPerformanceInsight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'brand_id', type: 'uuid' })
  brandId: string;

  @Column({ name: 'pattern_type', length: 100 })
  patternType: string;

  @Column('text')
  insight: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.85 })
  confidence: number;

  @Column({ name: 'metrics_summary', type: 'jsonb', default: () => "'{}'" })
  metricsSummary: Record<string, any>;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  recommendations: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
