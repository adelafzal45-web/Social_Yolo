import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('email_offers')
export class EmailOfferEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'offer_name', type: 'varchar', length: 150 })
  offerName!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  discount!: string | null;

  @Index('idx_email_offers_promo_code')
  @Column({ name: 'promo_code', type: 'varchar', length: 50, nullable: true })
  promoCode!: string | null;

  @Column({ name: 'start_date', type: 'timestamptz', nullable: true })
  startDate!: Date | null;

  @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
  endDate!: Date | null;

  @Column({ name: 'cta_text', type: 'varchar', length: 100, default: 'Claim Offer' })
  ctaText!: string;

  @Column({ name: 'cta_url', type: 'varchar', length: 500, nullable: true })
  ctaUrl!: string | null;

  @Column({ name: 'banner_url', type: 'text', nullable: true })
  bannerUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  terms!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
