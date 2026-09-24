import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { EmailRecipientEntity, EmailRecipientStatus } from '../entities/email-recipient.entity';
import { EmailSendLogEntity } from '../entities/email-send-log.entity';
import { EmailEventEntity, EmailEventType } from '../entities/email-event.entity';
import { EmailCampaignEntity, EmailCampaignStatus } from '../entities/email-campaign.entity';

export interface EmailOverviewMetrics {
  totalSent: number;
  delivered: number;
  pending: number;
  processing: number;
  failed: number;
  bounced: number;
  complained: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  complaintRate: number;
  timeRange: string;
  campaignsCount: {
    total: number;
    active: number;
    scheduled: number;
    completed: number;
  };
}

@Injectable()
export class EmailAnalyticsService {
  constructor(
    @InjectRepository(EmailRecipientEntity)
    private readonly recipientRepo: Repository<EmailRecipientEntity>,
    @InjectRepository(EmailSendLogEntity)
    private readonly sendLogRepo: Repository<EmailSendLogEntity>,
    @InjectRepository(EmailEventEntity)
    private readonly eventRepo: Repository<EmailEventEntity>,
    @InjectRepository(EmailCampaignEntity)
    private readonly campaignRepo: Repository<EmailCampaignEntity>,
  ) {}

  /**
   * Calculates genuine delivery and interaction metrics across a time window.
   */
  async getOverviewMetrics(timeRange = '7d'): Promise<EmailOverviewMetrics> {
    const startDate = this.getStartDateForRange(timeRange);

    // Query recipient statuses from real database records
    const recipients = await this.recipientRepo.find({
      where: startDate ? { createdAt: MoreThanOrEqual(startDate) } : {},
    });

    let pending = 0;
    let processing = 0;
    let sent = 0;
    let delivered = 0;
    let opened = 0;
    let clicked = 0;
    let bounced = 0;
    let complained = 0;
    let failed = 0;
    let unsubscribed = 0;

    for (const r of recipients) {
      if (r.status === EmailRecipientStatus.PENDING || r.status === EmailRecipientStatus.QUEUED) pending++;
      else if (r.status === EmailRecipientStatus.PROCESSING) processing++;
      else if (r.status === EmailRecipientStatus.SENT) sent++;
      else if (r.status === EmailRecipientStatus.DELIVERED) delivered++;
      else if (r.status === EmailRecipientStatus.OPENED) {
        delivered++;
        opened++;
      } else if (r.status === EmailRecipientStatus.CLICKED) {
        delivered++;
        opened++;
        clicked++;
      } else if (r.status === EmailRecipientStatus.BOUNCED) bounced++;
      else if (r.status === EmailRecipientStatus.COMPLAINED) complained++;
      else if (r.status === EmailRecipientStatus.FAILED) failed++;
      else if (r.status === EmailRecipientStatus.UNSUBSCRIBED) unsubscribed++;
    }

    const totalSent = sent + delivered + bounced + failed + complained;

    // Real rate calculations based on actual events
    const deliveryRate = totalSent > 0 ? Number(((delivered / totalSent) * 100).toFixed(2)) : 0;
    const openRate = delivered > 0 ? Number(((opened / delivered) * 100).toFixed(2)) : 0;
    const clickRate = opened > 0 ? Number(((clicked / opened) * 100).toFixed(2)) : 0;
    const bounceRate = totalSent > 0 ? Number(((bounced / totalSent) * 100).toFixed(2)) : 0;
    const unsubscribeRate = totalSent > 0 ? Number(((unsubscribed / totalSent) * 100).toFixed(2)) : 0;
    const complaintRate = totalSent > 0 ? Number(((complained / totalSent) * 100).toFixed(2)) : 0;

    // Campaign counts
    const campaigns = await this.campaignRepo.find({
      select: ['id', 'status'],
    });

    const campaignsCount = {
      total: campaigns.length,
      active: campaigns.filter((c) => c.status === EmailCampaignStatus.SENDING).length,
      scheduled: campaigns.filter((c) => c.status === EmailCampaignStatus.SCHEDULED).length,
      completed: campaigns.filter((c) => c.status === EmailCampaignStatus.COMPLETED).length,
    };

    return {
      totalSent,
      delivered,
      pending,
      processing,
      failed,
      bounced,
      complained,
      opened,
      clicked,
      unsubscribed,
      deliveryRate,
      openRate,
      clickRate,
      bounceRate,
      unsubscribeRate,
      complaintRate,
      timeRange,
      campaignsCount,
    };
  }

  /**
   * Calculates genuine metrics for a single campaign.
   */
  async getCampaignAnalytics(campaignId: string) {
    const recipients = await this.recipientRepo.find({
      where: { campaignId },
    });

    let pending = 0;
    let queued = 0;
    let processing = 0;
    let sent = 0;
    let delivered = 0;
    let opened = 0;
    let clicked = 0;
    let bounced = 0;
    let complained = 0;
    let failed = 0;
    let unsubscribed = 0;

    for (const r of recipients) {
      if (r.status === EmailRecipientStatus.PENDING) pending++;
      else if (r.status === EmailRecipientStatus.QUEUED) queued++;
      else if (r.status === EmailRecipientStatus.PROCESSING) processing++;
      else if (r.status === EmailRecipientStatus.SENT) sent++;
      else if (r.status === EmailRecipientStatus.DELIVERED) delivered++;
      else if (r.status === EmailRecipientStatus.OPENED) {
        delivered++;
        opened++;
      } else if (r.status === EmailRecipientStatus.CLICKED) {
        delivered++;
        opened++;
        clicked++;
      } else if (r.status === EmailRecipientStatus.BOUNCED) bounced++;
      else if (r.status === EmailRecipientStatus.COMPLAINED) complained++;
      else if (r.status === EmailRecipientStatus.FAILED) failed++;
      else if (r.status === EmailRecipientStatus.UNSUBSCRIBED) unsubscribed++;
    }

    const totalRecipients = recipients.length;
    const totalDispatched = sent + delivered + bounced + failed + complained;

    return {
      campaignId,
      totalRecipients,
      pending,
      queued,
      processing,
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      complained,
      failed,
      unsubscribed,
      deliveryRate: totalDispatched > 0 ? Number(((delivered / totalDispatched) * 100).toFixed(2)) : 0,
      openRate: delivered > 0 ? Number(((opened / delivered) * 100).toFixed(2)) : 0,
      clickRate: opened > 0 ? Number(((clicked / opened) * 100).toFixed(2)) : 0,
      bounceRate: totalDispatched > 0 ? Number(((bounced / totalDispatched) * 100).toFixed(2)) : 0,
      unsubscribeRate: totalDispatched > 0 ? Number(((unsubscribed / totalDispatched) * 100).toFixed(2)) : 0,
      complaintRate: totalDispatched > 0 ? Number(((complained / totalDispatched) * 100).toFixed(2)) : 0,
    };
  }

  private getStartDateForRange(range: string): Date | null {
    const now = new Date();
    switch (range) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case '7d':
        return new Date(now.getTime() - 7 * 86400 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 86400 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 86400 * 1000);
      case 'all':
      default:
        return null;
    }
  }
}
