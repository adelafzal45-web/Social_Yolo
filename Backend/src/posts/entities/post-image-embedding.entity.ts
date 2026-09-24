import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Post } from './post.entity';

/**
 * Vector embedding of a post's IMAGE (the design itself), used by the
 * image-side RAG retriever.
 *
 * While `post_embeddings` stores Gemini TEXT vectors of captions/style
 * descriptions, this table stores CLIP vectors of the actual post images
 * (`clip-ViT-B-32` by default, 512 dims). CLIP embeds images and text into
 * ONE shared space, so a user's typed prompt — embedded with the CLIP text
 * encoder — can be compared directly against these vectors to find past
 * posts that LOOK like what the user is asking for.
 *
 * One post can have more than one row over its life: `generated` when the
 * image was first created, flipping to `user` once rated >= 4 (feedback
 * loop). Vectors from different CLIP models are never mixed — the `model`
 * column records the producer and the retriever filters on it.
 *
 * Stored as `real[]` for the same reason as `post_embeddings`: pgvector is
 * not installed; cosine similarity runs in the application (corpus is small).
 */
@Entity('post_image_embeddings')
export class PostImageEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: Post;

  @Column({ name: 'post_id', type: 'uuid' })
  postId!: string;

  /** Path (relative to `Backend/public`) of the image file this vector represents. */
  @Column({ name: 'image_path', type: 'text' })
  imagePath!: string;

  /**
   * Pool membership:
   * - `sample`    → global reference pool (e.g. seeded from past designs).
   * - `generated` → freshly generated, not yet rated; NOT retrieved.
   * - `user`      → rated >= 4; retrieved for this user.
   */
  @Column({ name: 'source', type: 'text' })
  source!: 'user' | 'sample' | 'generated';

  /**
   * Design category (gym, food, education…) of the post this vector
   * represents. Lets the retriever scope reference lookup to one category
   * so a post only ever borrows style from its own industry. Normalized
   * to lowercase on write; NULL = uncategorized (served only to
   * category-less requests).
   */
  @Column({ name: 'category', type: 'text', nullable: true })
  category!: string | null;

  /** CLIP model that produced this vector, e.g. `clip-ViT-B-32`. */
  @Column({ name: 'model', type: 'text' })
  model!: string;

  /** Vector length (512 for `clip-ViT-B-32`), kept alongside for sanity checks. */
  @Column({ name: 'dims', type: 'integer' })
  dims!: number;

  @Column({ name: 'embedding', type: 'real', array: true })
  embedding!: number[];

  /** Free-form facts: origin folder, engine that produced the image, etc. */
  @Column({ name: 'style_metadata', type: 'jsonb', nullable: true })
  styleMetadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
