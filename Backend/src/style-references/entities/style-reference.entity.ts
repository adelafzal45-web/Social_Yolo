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

import { User } from '../../users/entities/user.entity';

/**
 * A *style reference* — the image + AI-written style description that the RAG
 * retriever can pull in and hand to Gemini as a visual anchor.
 *
 * Two scopes:
 *  - `global` rows have `ownerUserId = NULL`. They are the curated knowledge
 *    base every account on the platform benefits from (managed by an admin).
 *  - `user` rows belong to a single account and are only visible to that
 *    account (plus the global pool).
 *
 * `embedding` is a 768-dim `real[]` produced by `gemini-embedding-001` from
 * **multimodal** content (the image + its analysed description), so a request
 * that is itself understood semantically can be matched against a *picture*
 * reference. `imagePath` is nullable on purpose: text-only knowledge entries
 * (imported legacy samples, curated style playbooks) are valid references too,
 * they simply carry no visual anchor.
 */
@Entity('style_references')
export class StyleReference {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_style_references_owner')
  @Column({ name: 'owner_user_id', type: 'uuid', nullable: true })
  ownerUserId!: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'owner_user_id' })
  owner!: User | null;

  /** Short human label, e.g. "Editorial skincare hero — soft beige". */
  @Column({ name: 'title', type: 'varchar', length: 255, nullable: true })
  title!: string | null;

  /** Free-form note typed by the uploader explaining why this is a good reference. */
  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  /**
   * The exact text that was embedded: AI visual analysis merged with the
   * uploader's notes. This is what the prompt builder quotes back to the
   * planner model as retrieval context.
   */
  @Column({ name: 'content_text', type: 'text' })
  contentText!: string;

  @Index('idx_style_references_category')
  @Column({ name: 'category', type: 'varchar', length: 100, nullable: true })
  category!: string | null;

  /** Lowercase keywords used for lexical boosting during retrieval. */
  @Column({ name: 'tags', type: 'text', array: true, default: '{}' })
  tags!: string[];

  /** Path relative to `Backend/public`; NULL for text-only knowledge entries. */
  @Column({ name: 'image_path', type: 'text', nullable: true })
  imagePath!: string | null;

  /** 'global' = curated by an admin, 'user' = private to one account. */
  @Index('idx_style_references_source')
  @Column({ name: 'source', type: 'text', default: 'user' })
  source!: 'global' | 'user';

  /** Deactivated references stay in the DB but are never retrieved. */
  @Index('idx_style_references_active')
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  /** How many generations this reference has actually been injected into. */
  @Column({ name: 'usage_count', type: 'integer', default: 0 })
  usageCount!: number;

  /** 768-dim multimodal embedding; NULL until the first successful embed. */
  @Column({ name: 'embedding', type: 'real', array: true, nullable: true })
  embedding!: number[] | null;

  /** Structured AI analysis: palette, typography, lighting, composition, mood. */
  @Column({ name: 'analysis', type: 'jsonb', nullable: true })
  analysis!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
