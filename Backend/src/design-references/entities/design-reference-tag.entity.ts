import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DesignReference } from './design-reference.entity';

@Entity('design_reference_tags')
export class DesignReferenceTag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_design_ref_tag_reference_id')
  @Column({ name: 'reference_id', type: 'uuid' })
  referenceId!: string;

  @ManyToOne(() => DesignReference, (ref) => ref.tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reference_id' })
  reference!: DesignReference;

  @Index('idx_design_ref_tag_name')
  @Column({ name: 'tag', type: 'varchar', length: 100 })
  tag!: string;

  @Column({ name: 'category', type: 'varchar', length: 50, default: 'general' })
  category!: 'style' | 'industry' | 'mood' | 'element' | 'composition' | 'general';

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
