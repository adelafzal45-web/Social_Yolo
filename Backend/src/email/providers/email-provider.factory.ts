import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EmailProviderEntity,
  EmailProviderType,
  SmtpEncryption,
} from '../entities/email-provider.entity';
import { EmailProvider } from './email-provider.interface';
import { SmtpProvider } from './smtp.provider';
import { ResendProvider } from './resend.provider';
import { AmazonSesProvider } from './ses.provider';
import { SendGridProvider } from './sendgrid.provider';
import { MailgunProvider } from './mailgun.provider';
import { PostmarkProvider } from './postmark.provider';
import { EmailCryptoService } from '../services/email-crypto.service';

@Injectable()
export class EmailProviderFactory {
  private readonly logger = new Logger(EmailProviderFactory.name);

  constructor(
    @InjectRepository(EmailProviderEntity)
    private readonly providerRepo: Repository<EmailProviderEntity>,
    private readonly cryptoService: EmailCryptoService,
  ) {}

  /**
   * Instantiates the active provider configured in DB, or falls back to environment variables.
   */
  async getActiveProvider(): Promise<EmailProvider> {
    // 1. Check DB for active default provider
    try {
      const dbProvider = await this.providerRepo.findOne({
        where: [
          { isDefault: true, isActive: true },
          { isActive: true },
        ],
        order: { isDefault: 'DESC', updatedAt: 'DESC' },
      });

      if (dbProvider) {
        return this.createFromEntity(dbProvider);
      }
    } catch (err: any) {
      this.logger.warn(`Could not load email provider from database: ${err.message}. Falling back to env.`);
    }

    // 2. Fall back to environment variables
    return this.createFromEnv();
  }

  /**
   * Instantiates a provider directly from an entity (used during SMTP tests)
   */
  createFromEntity(entity: EmailProviderEntity, plainPasswordOverride?: string): EmailProvider {
    const password =
      plainPasswordOverride ||
      (entity.encryptedPassword ? this.cryptoService.decrypt(entity.encryptedPassword) : '');

    switch (entity.type) {
      case EmailProviderType.RESEND:
        return new ResendProvider({
          apiKey: password,
          fromEmail: entity.fromEmail,
          fromName: entity.fromName,
          replyTo: entity.replyTo || undefined,
        });

      case EmailProviderType.SES:
        return new AmazonSesProvider({
          accessKeyId: entity.username || undefined,
          secretAccessKey: password,
          region: process.env.AWS_REGION || 'us-east-1',
          fromEmail: entity.fromEmail,
          fromName: entity.fromName,
          replyTo: entity.replyTo || undefined,
        });

      case EmailProviderType.SENDGRID:
        return new SendGridProvider({
          apiKey: password,
          fromEmail: entity.fromEmail,
          fromName: entity.fromName,
          replyTo: entity.replyTo || undefined,
        });

      case EmailProviderType.MAILGUN:
        return new MailgunProvider({
          apiKey: password,
          domain: entity.host || '',
          fromEmail: entity.fromEmail,
          fromName: entity.fromName,
        });

      case EmailProviderType.POSTMARK:
        return new PostmarkProvider({
          serverToken: password,
          fromEmail: entity.fromEmail,
          fromName: entity.fromName,
          replyTo: entity.replyTo || undefined,
        });

      case EmailProviderType.SMTP:
      default:
        return new SmtpProvider({
          host: entity.host || process.env.SMTP_HOST || 'localhost',
          port: entity.port || Number(process.env.SMTP_PORT || 587),
          username: entity.username || process.env.SMTP_USER || undefined,
          password: password || process.env.SMTP_PASSWORD || undefined,
          secure: entity.secure ?? (process.env.SMTP_SECURE === 'true'),
          encryptionType: entity.encryptionType || SmtpEncryption.STARTTLS,
          fromEmail: entity.fromEmail || process.env.SMTP_FROM_EMAIL || 'noreply@socialyolo.com',
          fromName: entity.fromName || process.env.SMTP_FROM_NAME || 'SocialYolo',
          replyTo: entity.replyTo || process.env.EMAIL_REPLY_TO || undefined,
          returnPath: entity.returnPath || undefined,
        });
    }
  }

  /**
   * Instantiates a provider from environment configuration
   */
  createFromEnv(): EmailProvider {
    const providerType = (process.env.EMAIL_PROVIDER || 'smtp').toLowerCase();

    if (providerType === 'resend' && process.env.RESEND_API_KEY) {
      return new ResendProvider({
        apiKey: process.env.RESEND_API_KEY,
        fromEmail: process.env.EMAIL_FROM || 'noreply@socialyolo.com',
        fromName: process.env.EMAIL_FROM_NAME || 'SocialYolo',
        replyTo: process.env.EMAIL_REPLY_TO,
      });
    }

    return new SmtpProvider({
      host: process.env.SMTP_HOST || '127.0.0.1',
      port: Number(process.env.SMTP_PORT || 587),
      username: process.env.SMTP_USER || undefined,
      password: process.env.SMTP_PASSWORD || undefined,
      secure: process.env.SMTP_SECURE === 'true',
      encryptionType: process.env.SMTP_SECURE === 'true' ? SmtpEncryption.TLS : SmtpEncryption.STARTTLS,
      fromEmail: process.env.SMTP_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@socialyolo.com',
      fromName: process.env.SMTP_FROM_NAME || process.env.EMAIL_FROM_NAME || 'SocialYolo',
      replyTo: process.env.EMAIL_REPLY_TO || undefined,
    });
  }
}
