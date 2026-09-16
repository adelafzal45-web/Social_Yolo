import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PostEmbedding } from './post-embedding.entity';

/**
 * A generated social-media post (AI Post Generator feature).
 *
 * Rows with `userId = NULL` are **global sample posts** — the designer
 * reference pool every user's RAG retrieval can draw from.
 */
@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Owner user id. NULL = global sample post used as a style reference. */
  @Column({ name: 'user_id', type: 'text', nullable: true })
  userId!: string | null;

  /** Path (relative to `Backend/public`) of the generated post image. */
  @Column({ name: 'image_path', type: 'text', nullable: true })
  imagePath!: string | null;

  /** The short text the user typed (e.g. "Eid sale post"). */
  @Column({ name: 'user_prompt', type: 'text' })
  userPrompt!: string;

  /** The full designer-style prompt built by the RAG prompt builder and sent to Gemini. */
  @Column({ name: 'final_prompt', type: 'text', nullable: true })
  finalPrompt!: string | null;

  /**
   * Design category (gym, food, education…). NULL = uncategorized.
   * Used to scope RAG retrieval: a `gym` request only retrieves references
   * tagged `gym`. Normalized to lowercase on write.
   */
  @Column({ name: 'category', type: 'text', nullable: true })
  category!: string | null;

  /** Requested post size/format key (e.g. `instagram_post`, `instagram_story`). */
  @Column({ name: 'post_size', type: 'text', nullable: true })
  postSize!: string | null;

  /** Requested output file type (`jpg` | `png`). */
  @Column({ name: 'output_type', type: 'text', nullable: true })
  outputType!: string | null;

  /**
   * The structured design brief captured with the request — content copy,
   * color scheme, font, etc. — kept for future dynamic handling by the
   * front end.
   */
  @Column({ name: 'design_brief', type: 'jsonb', nullable: true })
  designBrief!: Record<string, unknown> | null;

  /** User rating 1–5; NULL until the user rates the post (feedback loop). */
  @Column({ name: 'rating', type: 'integer', nullable: true })
  rating!: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => PostEmbedding, (embedding) => embedding.post)
  embeddings!: PostEmbedding[];
}
