import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Post } from './post.entity';

/**
 * Vector embedding of a post's style, used by the RAG retriever.
 *
 * The embedding is stored as a Postgres `real[]` (float4 array) because
 * the pgvector extension is not installed on this Postgres instance.
 * Cosine similarity is computed in the application (see
 * `rag/retriever.service.ts`) — for the expected corpus size (personal
 * posts + a few dozen samples) that is instant. If the corpus grows
 * large, install pgvector and change ONLY this column to
 * `vector(768)` + a `<=>` SQL query.
 */
@Entity('post_embeddings')
export class PostEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: Post;

  @Column({ name: 'post_id', type: 'uuid' })
  postId!: string;

  /** The exact text that was embedded (final prompt + post description). */
  @Column({ name: 'content_text', type: 'text' })
  contentText!: string;

  /** Where this embedding belongs: the user's personal pool or the global sample pool. */
  @Column({ name: 'source', type: 'text' })
  source!: 'user' | 'sample';

  /**
   * Embedding vector — 768 dimensions from `gemini-embedding-001`
   * (`outputDimensionality: 768`), one float per array slot.
   */
  @Column({ name: 'embedding', type: 'real', array: true })
  embedding!: number[];

  /** Free-form style facts: occasion, industry, palette, layout notes, etc. */
  @Column({ name: 'style_metadata', type: 'jsonb', nullable: true })
  styleMetadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}