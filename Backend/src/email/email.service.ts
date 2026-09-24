import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EmailProviderEntity,
  EmailProviderType,
  SmtpEncryption,
} from './entities/email-provider.entity';
import { EmailCampaignEntity, EmailCampaignStatus } from './entities/email-campaign.entity';
import { EmailOfferEntity } from './entities/email-offer.entity';
import { EmailSuppressionEntity, SuppressionReason } from './entities/email-suppression.entity';
import { EmailPreferenceEntity } from './entities/email-preference.entity';
import { EmailAuditLogEntity } from './entities/email-audit-log.entity';
import { EmailProviderFactory } from './providers/email-provider.factory';
import { SendEmailResult } from './providers/email-provider.interface';
import { EmailCryptoService } from './services/email-crypto.service';
import { EmailQueueService } from './queues/email-queue.service';
import { EmailTemplateService } from './services/email-template.service';

export interface TestSmtpDto {
  providerId?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  secure?: boolean;
  encryptionType?: SmtpEncryption;
  fromEmail?: string;
  fromName?: string;
  testRecipient?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectRepository(EmailProviderEntity)
    private readonly providerRepo: Repository<EmailProviderEntity>,
    @InjectRepository(EmailCampaignEntity)
    private readonly campaignRepo: Repository<EmailCampaignEntity>,
    @InjectRepository(EmailOfferEntity)
    private readonly offerRepo: Repository<EmailOfferEntity>,
    @InjectRepository(EmailSuppressionEntity)
    private readonly suppressionRepo: Repository<EmailSuppressionEntity>,
    @InjectRepository(EmailPreferenceEntity)
    private readonly preferenceRepo: Repository<EmailPreferenceEntity>,
    @InjectRepository(EmailAuditLogEntity)
    private readonly auditRepo: Repository<EmailAuditLogEntity>,
    private readonly providerFactory: EmailProviderFactory,
    private readonly cryptoService: EmailCryptoService,
    private readonly queueService: EmailQueueService,
    private readonly templateService: EmailTemplateService,
  ) {}

  // ---------------------------------------------------------------------------
  // 1. SMTP & Provider Management
  // ---------------------------------------------------------------------------

  async getProviders() {
    const providers = await this.providerRepo.find({
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });

    // Mask passwords before returning to client
    return providers.map((p) => ({
      ...p,
      encryptedPassword: p.encryptedPassword ? '••••••••' : null,
      hasPassword: Boolean(p.encryptedPassword),
    }));
  }

  async saveProvider(dto: Partial<EmailProviderEntity>, actorId?: string, actorEmail?: string, ip?: string) {
    let provider: EmailProviderEntity;

    if (dto.id) {
      provider = (await this.providerRepo.findOne({ where: { id: dto.id } }))!;
      if (!provider) throw new NotFoundException('Provider not found');
    } else {
      provider = this.providerRepo.create();
    }

    // Encrypt password if updated
    if (dto.encryptedPassword && !dto.encryptedPassword.includes('••••')) {
      provider.encryptedPassword = this.cryptoService.encrypt(dto.encryptedPassword);
    }

    if (dto.isDefault) {
      // Unset previous default
      await this.providerRepo.update({ isDefault: true }, { isDefault: false });
    }

    Object.assign(provider, {
      name: dto.name || provider.name,
      type: dto.type || provider.type || EmailProviderType.SMTP,
      host: dto.host ?? provider.host,
      port: dto.port ?? provider.port,
      username: dto.username ?? provider.username,
      secure: dto.secure ?? provider.secure,
      encryptionType: dto.encryptionType || provider.encryptionType,
      fromEmail: dto.fromEmail || provider.fromEmail,
      fromName: dto.fromName || provider.fromName,
      replyTo: dto.replyTo ?? provider.replyTo,
      returnPath: dto.returnPath ?? provider.returnPath,
      isActive: dto.isActive ?? provider.isActive ?? true,
      isDefault: dto.isDefault ?? provider.isDefault ?? false,
    });

    const saved = await this.providerRepo.save(provider);

    await this.logAudit({
      actorId,
      actorEmail,
      action: dto.id ? 'PROVIDER_UPDATED' : 'PROVIDER_CREATED',
      entity: 'email_providers',
      entityId: saved.id,
      ip,
      metadata: { name: saved.name, type: saved.type, fromEmail: saved.fromEmail },
    });

    return {
      ...saved,
      encryptedPassword: '••••••••',
      hasPassword: Boolean(saved.encryptedPassword),
    };
  }

  async deleteProvider(id: string, actorId?: string, actorEmail?: string, ip?: string) {
    const res = await this.providerRepo.delete(id);
    await this.logAudit({
      actorId,
      actorEmail,
      action: 'PROVIDER_DELETED',
      entity: 'email_providers',
      entityId: id,
      ip,
    });
    return { success: Boolean(res.affected && res.affected > 0) };
  }

  /**
   * Tests SMTP Connection live against real server.
   * Never generates fake responses!
   */
  async testSmtpConnection(dto: TestSmtpDto, actorId?: string, actorEmail?: string, ip?: string) {
    let providerEntity: EmailProviderEntity;

    if (dto.providerId) {
      const found = await this.providerRepo.findOne({ where: { id: dto.providerId } });
      if (!found) throw new NotFoundException('Specified provider not found');
      providerEntity = found;
    } else {
      // Ephemeral provider configuration for testing
      providerEntity = this.providerRepo.create({
        name: 'Test SMTP Config',
        type: EmailProviderType.SMTP,
        host: dto.host || process.env.SMTP_HOST || '127.0.0.1',
        port: dto.port || Number(process.env.SMTP_PORT || 587),
        username: dto.username || process.env.SMTP_USER,
        secure: dto.secure ?? false,
        encryptionType: dto.encryptionType || SmtpEncryption.STARTTLS,
        fromEmail: dto.fromEmail || process.env.SMTP_FROM_EMAIL || 'noreply@socialyolo.com',
        fromName: dto.fromName || process.env.SMTP_FROM_NAME || 'SocialYolo',
      });
    }

    const providerInstance = this.providerFactory.createFromEntity(
      providerEntity,
      dto.password || undefined,
    );

    // 1. Verify Connection & Authentication
    const verifyResult = await providerInstance.verifyConnection();

    // 2. Optionally send real test email if recipient requested
    let testEmailResult: SendEmailResult | null = null;
    if (verifyResult.success && dto.testRecipient) {
      testEmailResult = await providerInstance.send({
        to: dto.testRecipient,
        fromEmail: providerEntity.fromEmail,
        fromName: providerEntity.fromName,
        subject: 'SocialYolo — SMTP Connection Test',
        html: `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0f172a;color:#f8fafc;padding:30px;">
          <div style="max-width:500px;margin:0 auto;background:#1e293b;padding:24px;border-radius:12px;border:1px solid #334155;">
            <h2 style="color:#38bdf8;margin-top:0;">✅ SMTP Connection Test Succeeded</h2>
            <p style="color:#94a3b8;">This is an authentic confirmation email sent from your SocialYolo installation.</p>
            <p style="font-size:13px;color:#64748b;">Host: ${providerEntity.host}:${providerEntity.port} • Encryption: ${providerEntity.encryptionType}</p>
          </div>
        </body></html>`,
      });
    }

    // 3. Write to Audit Log
    await this.logAudit({
      actorId,
      actorEmail,
      action: 'SMTP_TEST_EXECUTED',
      entity: 'email_providers',
      entityId: providerEntity.id || 'ephemeral',
      ip,
      metadata: {
        host: providerEntity.host,
        port: providerEntity.port,
        connectionSuccess: verifyResult.success,
        responseCode: verifyResult.code,
        testRecipient: dto.testRecipient,
        emailDelivered: testEmailResult?.success,
      },
    });

    return {
      connection: {
        connected: verifyResult.success,
        message: verifyResult.message,
        code: verifyResult.code,
        latencyMs: verifyResult.latencyMs,
      },
      testEmail: testEmailResult,
      testedAt: new Date(),
    };
  }

  // ---------------------------------------------------------------------------
  // 2. Transactional Email Dispatcher
  // ---------------------------------------------------------------------------

  async sendTransactionalEmail(payload: {
    to: string;
    templateSlug: string;
    context: Record<string, any>;
    fromEmail?: string;
    fromName?: string;
  }) {
    const template = await this.templateService.findBySlug(payload.templateSlug);
    if (!template) throw new NotFoundException(`Template '${payload.templateSlug}' not found`);

    const renderedHtml = this.templateService.render(template.htmlContent, payload.context);
    const renderedSubject = this.templateService.render(template.subject, payload.context);

    await this.queueService.addSendJob({
      email: payload.to,
      subject: renderedSubject,
      html: renderedHtml,
      fromEmail: payload.fromEmail,
      fromName: payload.fromName,
    });

    return { success: true, message: 'Transactional email queued for delivery' };
  }

  // ---------------------------------------------------------------------------
  // 3. Offers Management
  // ---------------------------------------------------------------------------

  async getOffers() {
    return this.offerRepo.find({ order: { createdAt: 'DESC' } });
  }

  async createOffer(dto: Partial<EmailOfferEntity>, actorId?: string, actorEmail?: string, ip?: string) {
    const offer = this.offerRepo.create({ ...dto, createdBy: actorId || null });
    const saved = await this.offerRepo.save(offer);
    await this.logAudit({
      actorId,
      actorEmail,
      action: 'OFFER_CREATED',
      entity: 'email_offers',
      entityId: saved.id,
      ip,
      metadata: { offerName: saved.offerName, promoCode: saved.promoCode },
    });
    return saved;
  }

  async updateOffer(id: string, dto: Partial<EmailOfferEntity>, actorId?: string, actorEmail?: string, ip?: string) {
    await this.offerRepo.update(id, dto);
    await this.logAudit({
      actorId,
      actorEmail,
      action: 'OFFER_UPDATED',
      entity: 'email_offers',
      entityId: id,
      ip,
    });
    return this.offerRepo.findOne({ where: { id } });
  }

  async deleteOffer(id: string, actorId?: string, actorEmail?: string, ip?: string) {
    const res = await this.offerRepo.delete(id);
    await this.logAudit({
      actorId,
      actorEmail,
      action: 'OFFER_DELETED',
      entity: 'email_offers',
      entityId: id,
      ip,
    });
    return { success: Boolean(res.affected && res.affected > 0) };
  }

  // ---------------------------------------------------------------------------
  // 4. Suppression List
  // ---------------------------------------------------------------------------

  async getSuppressions() {
    return this.suppressionRepo.find({ order: { createdAt: 'DESC' } });
  }

  async addSuppression(email: string, reason: SuppressionReason, source = 'manual') {
    const cleanEmail = email.toLowerCase().trim();
    let record = await this.suppressionRepo.findOne({ where: { email: cleanEmail } });
    if (!record) {
      record = this.suppressionRepo.create({
        email: cleanEmail,
        reason,
        source,
      });
      await this.suppressionRepo.save(record);
    }
    return record;
  }

  async removeSuppression(id: string) {
    const res = await this.suppressionRepo.delete(id);
    return { success: Boolean(res.affected && res.affected > 0) };
  }

  // ---------------------------------------------------------------------------
  // 5. User Preferences
  // ---------------------------------------------------------------------------

  async getUserPreferences(userId: string) {
    let prefs = await this.preferenceRepo.findOne({ where: { userId } });
    if (!prefs) {
      prefs = this.preferenceRepo.create({
        userId,
        marketingEmails: true,
        offerEmails: true,
        productUpdates: true,
        newsletters: true,
        systemNotifications: true,
        securityEmails: true,
      });
      prefs = await this.preferenceRepo.save(prefs);
    }
    return prefs;
  }

  async updateUserPreferences(userId: string, dto: Partial<EmailPreferenceEntity>) {
    await this.getUserPreferences(userId); // ensure exists
    // Security emails cannot be disabled
    const safeDto = { ...dto, securityEmails: true };
    await this.preferenceRepo.update({ userId }, safeDto);
    return this.getUserPreferences(userId);
  }

  // ---------------------------------------------------------------------------
  // 6. Audit Logging Helper
  // ---------------------------------------------------------------------------

  async logAudit(data: {
    actorId?: string | null;
    actorEmail?: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    ip?: string | null;
    metadata?: Record<string, any>;
  }) {
    const log = this.auditRepo.create({
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId || null,
      ip: data.ip || null,
      metadata: data.metadata || {},
    });
    return this.auditRepo.save(log).catch(() => {});
  }
}
