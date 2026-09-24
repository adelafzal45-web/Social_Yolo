import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CreativeGeneration } from './creative-generation.entity';
import { CreativeVariation } from './creative-variation.entity';

@Entity('creative_exports')
export class CreativeExport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_creative_export_gen_id')
  @Column({ name: 'generation_id', type: 'uuid' })
  generationId!: string;

  @ManyToOne(() => CreativeGeneration, (gen) => gen.exports, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'generation_id' })
  generation!: CreativeGeneration;

  @Index('idx_creative_export_var_id')
  @Column({ name: 'variation_id', type: 'uuid' })
  variationId!: string;

  @ManyToOne(() => CreativeVariation, (v) => v.exports, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variation_id' })
  variation!: CreativeVariation;

  @Column({ name: 'format', type: 'varchar', length: 20, default: 'png' })
  format!: 'png' | 'jpg' | 'webp';

  @Column({ name: 'platform', type: 'varchar', length: 100, default: 'Instagram' })
  platform!: string;

  @Column({ name: 'width', type: 'int' })
  width!: number;

  @Column({ name: 'height', type: 'int' })
  height!: number;

  @Column({ name: 'export_url', type: 'text' })
  exportUrl!: string;

  @Column({ name: 'file_size_bytes', type: 'int', default: 0 })
  fileSizeBytes!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
