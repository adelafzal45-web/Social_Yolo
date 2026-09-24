import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum EmailProviderType {
  SMTP = 'smtp',
  RESEND = 'resend',
  SES = 'ses',
  SENDGRID = 'sendgrid',
  MAILGUN = 'mailgun',
  POSTMARK = 'postmark',
}

export enum SmtpEncryption {
  TLS = 'TLS',
  STARTTLS = 'STARTTLS',
  NONE = 'NONE',
}

@Entity('email_providers')
export class EmailProviderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: EmailProviderType.SMTP,
  })
  type!: EmailProviderType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  host!: string | null;

  @Column({ type: 'integer', nullable: true })
  port!: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  username!: string | null;

  @Column({ name: 'encrypted_password', type: 'text', nullable: true })
  encryptedPassword!: string | null;

  @Column({ type: 'boolean', default: false })
  secure!: boolean;

  @Column({
    name: 'encryption_type',
    type: 'varchar',
    length: 20,
    default: SmtpEncryption.STARTTLS,
  })
  encryptionType!: SmtpEncryption;

  @Column({ name: 'from_email', type: 'varchar', length: 255 })
  fromEmail!: string;

  @Column({ name: 'from_name', type: 'varchar', length: 255 })
  fromName!: string;

  @Column({ name: 'reply_to', type: 'varchar', length: 255, nullable: true })
  replyTo!: string | null;

  @Column({ name: 'return_path', type: 'varchar', length: 255, nullable: true })
  returnPath!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Index('idx_email_providers_is_default')
  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
