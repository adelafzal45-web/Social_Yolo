import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { BrandInsight } from './brand-insight.entity';
import { BrandSource } from './brand-source.entity';

@Entity('brand_profiles')
export class BrandProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_brand_profiles_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.brandProfiles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index('idx_brand_profiles_workspace_id')
  @Column({ name: 'workspace_id', type: 'uuid', nullable: true })
  workspaceId!: string | null;

  @Column({ name: 'brand_name', type: 'varchar', length: 255 })
  brandName!: string;

  @Column({ name: 'name', type: 'varchar', length: 255, nullable: true })
  name?: string | null;

  @Column({ name: 'tagline', type: 'varchar', length: 255, nullable: true })
  tagline!: string | null;

  @Column({ name: 'niche', type: 'varchar', length: 100, default: 'General' })
  niche!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'website_url', type: 'varchar', length: 255, nullable: true })
  websiteUrl!: string | null;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl!: string | null;

  @Column({
    name: 'primary_color',
    type: 'varchar',
    length: 30,
    default: '#7c5cff',
  })
  primaryColor!: string;

  @Column({
    name: 'secondary_color',
    type: 'varchar',
    length: 30,
    default: '#e0aa4e',
  })
  secondaryColor!: string;

  @Column({
    name: 'accent_color',
    type: 'varchar',
    length: 30,
    default: '#3ecf8e',
  })
  accentColor!: string;

  @Column({
    name: 'font_heading',
    type: 'varchar',
    length: 100,
    default: 'Canela',
  })
  fontHeading!: string;

  @Column({ name: 'font_body', type: 'varchar', length: 100, default: 'Söhne' })
  fontBody!: string;

  @Column({ name: 'tone', type: 'varchar', length: 50, default: 'Warm' })
  tone!: string;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  /* ──── New Intelligence Engine Columns ──── */

  @Column({ name: 'industry', type: 'varchar', length: 255, nullable: true })
  industry!: string | null;

  @Column({ name: 'sub_industry', type: 'varchar', length: 255, nullable: true })
  subIndustry!: string | null;

  @Column({ name: 'country', type: 'varchar', length: 100, nullable: true })
  country!: string | null;

  @Column({ name: 'city', type: 'varchar', length: 150, nullable: true })
  city!: string | null;

  @Column({ name: 'favicon_url', type: 'text', nullable: true })
  faviconUrl!: string | null;

  @Column({ name: 'secondary_colors', type: 'jsonb', nullable: true })
  secondaryColors!: string[] | null;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'active' })
  status!: string;

  @Column({ name: 'brand_voice', type: 'jsonb', nullable: true })
  brandVoice!: Record<string, any> | null;

  @Column({ name: 'social_links', type: 'jsonb', nullable: true })
  socialLinks!: Record<string, string> | null;

  /* ──── Timestamps & Relationships ──── */

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => Post, (post) => post.brandProfile)
  posts!: Post[];

  @OneToOne(() => BrandInsight, (insight) => insight.brand, { cascade: true })
  insight!: BrandInsight | null;

  @OneToMany(() => BrandSource, (source) => source.brand, { cascade: true })
  sources!: BrandSource[];
}
