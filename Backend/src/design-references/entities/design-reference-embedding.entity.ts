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

@Entity('design_reference_embeddings')
export class DesignReferenceEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_design_ref_emb_reference_id')
  @Column({ name: 'reference_id', type: 'uuid' })
  referenceId!: string;

  @ManyToOne(() => DesignReference, (ref) => ref.embeddings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reference_id' })
  reference!: DesignReference;

  /** Multimodal/visual embedding (768 dimensions) representing visual aesthetic */
  @Column({ name: 'visual_embedding', type: 'real', array: true, nullable: true })
  visualEmbedding!: number[] | null;

  /** Semantic embedding representing tags, typography, composition, and description */
  @Column({ name: 'semantic_embedding', type: 'real', array: true, nullable: true })
  semanticEmbedding!: number[] | null;

  /** Brand style embedding representing palette and tone */
  @Column({ name: 'brand_embedding', type: 'real', array: true, nullable: true })
  brandEmbedding!: number[] | null;

  /** Creative intent embedding representing objective, designType, and audience */
  @Column({ name: 'creative_intent_embedding', type: 'real', array: true, nullable: true })
  creativeIntentEmbedding!: number[] | null;

  @Column({ name: 'dimensions', type: 'int', default: 768 })
  dimensions!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
