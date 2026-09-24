import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BrandProfile } from '../../brands/entities/brand-profile.entity';

@Entity('brand_embeddings')
export class BrandEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_brand_embeddings_brand_id')
  @Column({ name: 'brand_id', type: 'uuid' })
  brandId!: string;

  @ManyToOne(() => BrandProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brand_id' })
  brand!: BrandProfile;

  /** Embedding vector (768 dimensions) */
  @Column({ name: 'embedding', type: 'real', array: true })
  embedding!: number[];

  @Column({ name: 'source_text', type: 'text' })
  sourceText!: string;

  @Column({ name: 'embedding_type', type: 'varchar', length: 50, default: 'combined' })
  embeddingType!: 'visual_identity' | 'brand_voice' | 'combined';

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
