import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/decorators/current-user.decorator';
import { EmailService } from '../email.service';
import { EmailAnalyticsService } from '../services/email-analytics.service';
import { EmailDnsService } from '../services/email-dns.service';
import { EmailTemplateService } from '../services/email-template.service';
import { AudienceResolverService } from '../services/audience-resolver.service';
import { EmailQueueService } from '../queues/email-queue.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailCampaignEntity, EmailCampaignStatus } from '../entities/email-campaign.entity';
import { EmailRecipientEntity } from '../entities/email-recipient.entity';
import { EmailAuditLogEntity } from '../entities/email-audit-log.entity';

@Controller('email')
@UseGuards(JwtAuthGuard)
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly analyticsService: EmailAnalyticsService,
    private readonly dnsService: EmailDnsService,
    private readonly templateService: EmailTemplateService,
    private readonly audienceResolver: AudienceResolverService,
    private readonly queueService: EmailQueueService,
    @InjectRepository(EmailCampaignEntity)
    private readonly campaignRepo: Repository<EmailCampaignEntity>,
    @InjectRepository(EmailRecipientEntity)
    private readonly recipientRepo: Repository<EmailRecipientEntity>,
    @InjectRepository(EmailAuditLogEntity)
    private readonly auditRepo: Repository<EmailAuditLogEntity>,
  ) {}

  // ---------------------------------------------------------------------------
  // Overview & Health Dashboard
  // ---------------------------------------------------------------------------
  @Get('overview')
  async getOverview(@Query('timeRange') timeRange = '7d') {
    const [metrics, queueStats] = await Promise.all([
      this.analyticsService.getOverviewMetrics(timeRange),
      this.queueService.getQueueStats(),
    ]);

    return {
      metrics,
      queue: queueStats,
    };
  }

  // ---------------------------------------------------------------------------
  // SMTP & Provider Management
  // ---------------------------------------------------------------------------
  @Get('providers')
  async getProviders() {
    return this.emailService.getProviders();
  }

  @Post('providers')
  async createProvider(
    @Body() dto: any,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.emailService.saveProvider(dto, user?.id, user?.email, req.ip);
  }

  @Put('providers/:id')
  async updateProvider(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.emailService.saveProvider({ ...dto, id }, user?.id, user?.email, req.ip);
  }

  @Delete('providers/:id')
  async deleteProvider(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.emailService.deleteProvider(id, user?.id, user?.email, req.ip);
  }

  @Post('test-smtp')
  async testSmtp(
    @Body() dto: any,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.emailService.testSmtpConnection(dto, user?.id, user?.email, req.ip);
  }

  // ---------------------------------------------------------------------------
  // Domain & DNS Verification
  // ---------------------------------------------------------------------------
  @Get('domains/verify')
  async verifyDomain(@Query('domain') domain?: string) {
    const targetDomain = domain || process.env.SMTP_DOMAIN || 'socialyolo.com';
    return this.dnsService.verifyDomain(targetDomain);
  }

  // ---------------------------------------------------------------------------
  // Templates Management
  // ---------------------------------------------------------------------------
  @Get('templates')
  async getTemplates(@Query('category') category?: any) {
    return this.templateService.findAll(category);
  }

  @Get('templates/:id')
  async getTemplate(@Param('id') id: string) {
    const t = await this.templateService.findById(id);
    if (!t) throw new NotFoundException('Template not found');
    return t;
  }

  @Post('templates')
  async createTemplate(
    @Body() dto: any,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    const template = await this.templateService.create({ ...dto, createdBy: user?.id });
    await this.emailService.logAudit({
      actorId: user?.id,
      actorEmail: user?.email,
      action: 'TEMPLATE_CREATED',
      entity: 'email_templates',
      entityId: template.id,
      ip: req.ip,
      metadata: { name: template.name, slug: template.slug },
    });
    return template;
  }

  @Put('templates/:id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    const template = await this.templateService.update(id, dto);
    await this.emailService.logAudit({
      actorId: user?.id,
      actorEmail: user?.email,
      action: 'TEMPLATE_UPDATED',
      entity: 'email_templates',
      entityId: id,
      ip: req.ip,
    });
    return template;
  }

  @Delete('templates/:id')
  async deleteTemplate(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    const success = await this.templateService.delete(id);
    await this.emailService.logAudit({
      actorId: user?.id,
      actorEmail: user?.email,
      action: 'TEMPLATE_DELETED',
      entity: 'email_templates',
      entityId: id,
      ip: req.ip,
    });
    return { success };
  }

  @Post('templates/preview')
  async previewTemplate(@Body() body: { html: string; context: Record<string, any> }) {
    const rendered = this.templateService.render(body.html || '', body.context || {});
    return { html: rendered };
  }

  // ---------------------------------------------------------------------------
  // Offers Management
  // ---------------------------------------------------------------------------
  @Get('offers')
  async getOffers() {
    return this.emailService.getOffers();
  }

  @Post('offers')
  async createOffer(
    @Body() dto: any,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.emailService.createOffer(dto, user?.id, user?.email, req.ip);
  }

  @Put('offers/:id')
  async updateOffer(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.emailService.updateOffer(id, dto, user?.id, user?.email, req.ip);
  }

  @Delete('offers/:id')
  async deleteOffer(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.emailService.deleteOffer(id, user?.id, user?.email, req.ip);
  }

  // ---------------------------------------------------------------------------
  // Audience Estimation
  // ---------------------------------------------------------------------------
  @Post('audience/estimate')
  async estimateAudience(@Body() criteria: any) {
    return this.audienceResolver.estimateAudience(criteria || {});
  }

  // ---------------------------------------------------------------------------
  // Campaigns Management & Lifecycle
  // ---------------------------------------------------------------------------
  @Get('campaigns')
  async getCampaigns(@Query('status') status?: any) {
    const where = status && status !== 'ALL' ? { status } : {};
    return this.campaignRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  @Get('campaigns/:id')
  async getCampaign(@Param('id') id: string) {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  @Post('campaigns')
  async createCampaign(
    @Body() dto: any,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    const campaign = this.campaignRepo.create({
      name: dto.name,
      subject: dto.subject,
      templateId: dto.templateId,
      offerId: dto.offerId || null,
      brandId: dto.brandId || null,
      campaignType: dto.campaignType || 'CUSTOM',
      status: dto.status || EmailCampaignStatus.DRAFT,
      audienceDefinition: dto.audienceDefinition || {},
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      createdBy: user?.id,
    });

    const saved = await this.campaignRepo.save(campaign);

    await this.emailService.logAudit({
      actorId: user?.id,
      actorEmail: user?.email,
      action: 'CAMPAIGN_CREATED',
      entity: 'email_campaigns',
      entityId: saved.id,
      ip: req.ip,
      metadata: { name: saved.name, type: saved.campaignType },
    });

    return saved;
  }

  @Put('campaigns/:id')
  async updateCampaign(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    await this.campaignRepo.update(id, dto);
    await this.emailService.logAudit({
      actorId: user?.id,
      actorEmail: user?.email,
      action: 'CAMPAIGN_UPDATED',
      entity: 'email_campaigns',
      entityId: id,
      ip: req.ip,
    });
    return this.campaignRepo.findOne({ where: { id } });
  }

  @Post('campaigns/:id/send')
  async sendCampaign(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.queueService.addCampaignJob({
      campaignId: id,
      action: 'start',
    });

    await this.emailService.logAudit({
      actorId: user?.id,
      actorEmail: user?.email,
      action: 'CAMPAIGN_STARTED',
      entity: 'email_campaigns',
      entityId: id,
      ip: req.ip,
    });

    return { success: true, message: 'Campaign dispatch queued' };
  }

  @Post('campaigns/:id/pause')
  async pauseCampaign(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    await this.queueService.addCampaignJob({ campaignId: id, action: 'pause' });
    await this.emailService.logAudit({
      actorId: user?.id,
      actorEmail: user?.email,
      action: 'CAMPAIGN_PAUSED',
      entity: 'email_campaigns',
      entityId: id,
      ip: req.ip,
    });
    return { success: true, message: 'Campaign paused' };
  }

  @Post('campaigns/:id/resume')
  async resumeCampaign(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    await this.queueService.addCampaignJob({ campaignId: id, action: 'resume' });
    await this.emailService.logAudit({
      actorId: user?.id,
      actorEmail: user?.email,
      action: 'CAMPAIGN_RESUMED',
      entity: 'email_campaigns',
      entityId: id,
      ip: req.ip,
    });
    return { success: true, message: 'Campaign resumed' };
  }

  @Post('campaigns/:id/cancel')
  async cancelCampaign(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    await this.queueService.addCampaignJob({ campaignId: id, action: 'cancel' });
    await this.emailService.logAudit({
      actorId: user?.id,
      actorEmail: user?.email,
      action: 'CAMPAIGN_CANCELLED',
      entity: 'email_campaigns',
      entityId: id,
      ip: req.ip,
    });
    return { success: true, message: 'Campaign cancelled' };
  }

  @Get('campaigns/:id/analytics')
  async getCampaignAnalytics(@Param('id') id: string) {
    return this.analyticsService.getCampaignAnalytics(id);
  }

  @Get('campaigns/:id/recipients')
  async getCampaignRecipients(
    @Param('id') id: string,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const where: any = { campaignId: id };
    if (status && status !== 'ALL') where.status = status;

    const [items, total] = await this.recipientRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    return { items, total, page: pageNum, limit: limitNum };
  }

  /**
   * Real-time Campaign Progress Stream via Server-Sent Events (SSE)
   */
  @Get('campaigns/:id/stream')
  async streamCampaignProgress(
    @Param('id') id: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let isClosed = false;
    req.on('close', () => {
      isClosed = true;
    });

    const sendUpdate = async () => {
      if (isClosed) return;
      try {
        const stats = await this.analyticsService.getCampaignAnalytics(id);
        const campaign = await this.campaignRepo.findOne({
          where: { id },
          select: ['id', 'status', 'startedAt', 'completedAt'],
        });
        res.write(`data: ${JSON.stringify({ ...stats, status: campaign?.status })}\n\n`);
      } catch {}
    };

    // Send initial immediately
    await sendUpdate();

    // Poll every 2 seconds while active
    const interval = setInterval(async () => {
      if (isClosed) {
        clearInterval(interval);
        return;
      }
      await sendUpdate();
    }, 2000);
  }

  /**
   * Exports campaign recipients as CSV
   */
  @Get('campaigns/:id/export')
  async exportCampaignRecipients(@Param('id') id: string, @Res() res: Response) {
    const recipients = await this.recipientRepo.find({
      where: { campaignId: id },
      order: { createdAt: 'ASC' },
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="campaign-${id}-recipients.csv"`);

    const header = 'Email,Status,SentAt,DeliveredAt,OpenedAt,ClickedAt,ErrorMessage\n';
    res.write(header);

    for (const r of recipients) {
      const line = `"${r.email}","${r.status}","${r.sentAt || ''}","${r.deliveredAt || ''}","${
        r.openedAt || ''
      }","${r.clickedAt || ''}","${(r.errorMessage || '').replace(/"/g, '""')}"\n`;
      res.write(line);
    }

    res.end();
  }

  // ---------------------------------------------------------------------------
  // Suppression List
  // ---------------------------------------------------------------------------
  @Get('suppressions')
  async getSuppressions() {
    return this.emailService.getSuppressions();
  }

  @Post('suppressions')
  async addSuppression(@Body() body: { email: string; reason: any }) {
    if (!body.email) throw new BadRequestException('Email is required');
    return this.emailService.addSuppression(body.email, body.reason || 'MANUAL', 'manual_admin');
  }

  @Delete('suppressions/:id')
  async removeSuppression(@Param('id') id: string) {
    return this.emailService.removeSuppression(id);
  }

  // ---------------------------------------------------------------------------
  // Preferences Center
  // ---------------------------------------------------------------------------
  @Get('preferences')
  async getPreferences(@CurrentUser() user: AuthUser) {
    return this.emailService.getUserPreferences(user.id);
  }

  @Put('preferences')
  async updatePreferences(@CurrentUser() user: AuthUser, @Body() dto: any) {
    return this.emailService.updateUserPreferences(user.id, dto);
  }

  // ---------------------------------------------------------------------------
  // Audit Logs
  // ---------------------------------------------------------------------------
  @Get('audit-logs')
  async getAuditLogs(@Query('limit') limit = '50') {
    const take = Math.min(100, Math.max(1, parseInt(limit, 10)));
    return this.auditRepo.find({
      order: { createdAt: 'DESC' },
      take,
    });
  }
}
