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