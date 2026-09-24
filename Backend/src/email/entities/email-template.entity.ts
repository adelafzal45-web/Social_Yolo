import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum EmailTemplateCategory {
  TRANSACTIONAL = 'TRANSACTIONAL',
  MARKETING = 'MARKETING',
  SECURITY = 'SECURITY',
  SYSTEM = 'SYSTEM',
  CAMPAIGN = 'CAMPAIGN',
  OFFER = 'OFFER',
}

export enum EmailTemplateStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

@Entity('email_templates')
export class EmailTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Index('idx_email_templates_slug', { unique: true })
  @Column({ type: 'varchar', length: 100, unique: true })
  slug!: string;

  @Index('idx_email_templates_category')
  @Column({
    type: 'varchar',
    length: 50,
    default: EmailTemplateCategory.TRANSACTIONAL,
  })
  category!: EmailTemplateCategory;

  @Column({ type: 'varchar', length: 255 })
  subject!: string;

  @Column({ name: 'html_content', type: 'text' })
  htmlContent!: string;

  @Column({ name: 'text_content', type: 'text', nullable: true })
  textContent!: string | null;

  @Column({ type: 'jsonb', default: [] })
  variables!: string[];

  @Column({
    type: 'varchar',
    length: 30,
    default: EmailTemplateStatus.ACTIVE,
  })
  status!: EmailTemplateStatus;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
