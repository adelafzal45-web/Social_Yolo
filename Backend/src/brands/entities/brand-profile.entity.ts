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
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

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

  @Column({ name: 'brand_name', type: 'varchar', length: 255 })
  brandName!: string;

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

  /**
   * Whether the user wants this brand's logo composited onto the generated
   * image. Defaults to true — having a logo attached is almost always wanted.
   */
  @Column({ name: 'show_logo_on_image', type: 'boolean', default: true })
  showLogoOnImage!: boolean;

  /** Public contact email the brand wants typeset on the creative (optional). */
  @Column({ name: 'contact_email', type: 'varchar', length: 160, nullable: true })
  contactEmail!: string | null;

  /** Public contact phone/WhatsApp number (optional). */
  @Column({ name: 'contact_phone', type: 'varchar', length: 60, nullable: true })
  contactPhone!: string | null;

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

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => Post, (post) => post.brandProfile)
  posts!: Post[];
}
