import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PostEmbedding } from './post-embedding.entity';
import { User } from '../../users/entities/user.entity';
import { BrandProfile } from '../../brands/entities/brand-profile.entity';

/**
 * A generated social-media post (AI Post Generator feature).
 *
 * Rows with `userId = NULL` are global sample posts — the designer
 * reference pool every user's RAG retrieval can draw from.
 */
@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Owner user id. NULL = global sample post used as a style reference. */
  @Index('idx_posts_user_id')
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, (user) => user.posts, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @Column({ name: 'brand_profile_id', type: 'uuid', nullable: true })
  brandProfileId!: string | null;

  @Index('idx_posts_brand_id')
  @Column({ name: 'brand_id', type: 'uuid', nullable: true })
  brandId!: string | null;

  @Column({ name: 'concept_id', type: 'uuid', nullable: true })
  conceptId!: string | null;

  @Column({ name: 'campaign_id', type: 'uuid', nullable: true })
  campaignId!: string | null;

  @Column({ name: 'content_type', type: 'varchar', length: 100, nullable: true })
  contentType!: string | null;

  @Column({ name: 'caption', type: 'text', nullable: true })
  caption!: string | null;

  @Column({ name: 'body', type: 'text', nullable: true })
  body!: string | null;

  @Column({ name: 'cta', type: 'text', nullable: true })
  cta!: string | null;

  @Column({ name: 'hashtags', type: 'jsonb', default: () => "'[]'" })
  hashtags!: string[];

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'" })
  metadata!: Record<string, any>;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt!: Date | null;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @ManyToOne(() => BrandProfile, (b) => b.posts, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'brand_profile_id' })
  brandProfile!: BrandProfile | null;

  /** Short creative title (e.g. "Ramadan Restock — Insta") */
  @Column({ name: 'title', type: 'varchar', length: 255, nullable: true })
  title!: string | null;

  /** Detected or user-selected product/topic name (e.g. "Cold Brew Coffee") */
  @Column({
    name: 'product_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  productName!: string | null;

  @Column({ name: 'niche', type: 'varchar', length: 100, nullable: true })
  niche!: string | null;

  /** Target platform: instagram, facebook, tiktok, linkedin, pinterest, twitter */
  @Index('idx_posts_platform')
  @Column({
    name: 'platform',
    type: 'varchar',
    length: 50,
    default: 'instagram',
  })
  platform!: string;

  /** 1:1, 4:5, 9:16, 16:9, 1.91:1 */
  @Column({ name: 'aspect_ratio', type: 'varchar', length: 20, default: '1:1' })
  aspectRatio!: string;

  /** luxury, minimalist, bold, lifestyle, tech, playful */
  @Column({ name: 'style', type: 'varchar', length: 50, default: 'luxury' })
  style!: string;

  /** sale, launch, event, seasonal, quote, awareness */
  @Column({ name: 'occasion', type: 'varchar', length: 50, nullable: true })
  occasion!: string | null;

  /** ai_replace, studio_solid, nature, neon, transparent, keep_original */
  @Column({
    name: 'background_mode',
    type: 'varchar',
    length: 50,
    default: 'ai_replace',
  })
  backgroundMode!: string;

  @Column({ name: 'headline', type: 'varchar', length: 255, nullable: true })
  headline!: string | null;

  @Column({ name: 'body_copy', type: 'text', nullable: true })
  bodyCopy!: string | null;

  /** Design category (gym, education, drinks, food, etc. — free text) */
  @Index('idx_posts_category')
  @Column({ name: 'category', type: 'varchar', length: 100, nullable: true })
  category!: string | null;

  /** Exact copy / text to write ON the post (rendered verbatim) */
  @Column({ name: 'content', type: 'text', nullable: true })
  content!: string | null;

  /** Brand colors (names, hex codes or description) */
  @Column({
    name: 'color_scheme',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  colorScheme!: string | null;

  /** Font preference for text on the post */
  @Column({ name: 'font', type: 'varchar', length: 100, nullable: true })
  font!: string | null;

  /** Canvas format: instagram_post, instagram_portrait, instagram_story, meta_feed, meta_square, etc. */
  @Column({ name: 'post_size', type: 'varchar', length: 50, nullable: true })
  postSize!: string | null;

  /** png or jpg */
  @Column({ name: 'output_type', type: 'varchar', length: 10, default: 'png' })
  outputType!: string;

  /** Path (relative to `Backend/public`) of uploaded company logo */
  @Column({ name: 'logo_path', type: 'text', nullable: true })
  logoPath!: string | null;

  /** Structured design plan / brief JSON (two-stage prompting plan) */
  @Column({ name: 'design_brief', type: 'jsonb', nullable: true })
  designBrief!: Record<string, any> | null;

  /** Path (relative to `Backend/public`) of original uploaded subject photo. */
  @Column({ name: 'original_image_path', type: 'text', nullable: true })
  originalImagePath!: string | null;

  /** Path (relative to `Backend/public`) of the generated post image. */
  @Column({ name: 'image_path', type: 'text', nullable: true })
  imagePath!: string | null;

  /** The short text the user typed or guided selections summary. */
  @Column({ name: 'user_prompt', type: 'text', default: '' })
  userPrompt!: string;

  /** The full designer-style prompt built and sent to the image engine. */
  @Column({ name: 'final_prompt', type: 'text', nullable: true })
  finalPrompt!: string | null;

  /** User rating 1–5; NULL until rated. */
  @Column({ name: 'rating', type: 'integer', nullable: true })
  rating!: number | null;

  /** Favorited / Saved status for user collection */
  @Index('idx_posts_is_favorite')
  @Column({ name: 'is_favorite', type: 'boolean', default: false })
  isFavorite!: boolean;

  /** Engine used: gemini-2.5-flash-image, pollinations, etc. */
  @Column({ name: 'engine', type: 'varchar', length: 50, nullable: true })
  engine!: string | null;

  /** pending, processing, completed, failed */
  @Column({ name: 'status', type: 'varchar', length: 30, default: 'completed' })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => PostEmbedding, (embedding) => embedding.post)
  embeddings!: PostEmbedding[];
}
