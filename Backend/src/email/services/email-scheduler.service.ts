import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import {
  EmailCampaignEntity,
  EmailCampaignStatus,
} from '../entities/email-campaign.entity';
import {
  EmailAutomationRuleEntity,
  AutomationTrigger,
} from '../entities/email-automation-rule.entity';
import { EmailQueueService } from '../queues/email-queue.service';

@Injectable()
export class EmailSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailSchedulerService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(EmailCampaignEntity)
    private readonly campaignRepo: Repository<EmailCampaignEntity>,
    @InjectRepository(EmailAutomationRuleEntity)
    private readonly automationRepo: Repository<EmailAutomationRuleEntity>,
    private readonly queueService: EmailQueueService,
  ) {}

  onModuleInit() {
    // Run scheduler check every 30 seconds
    this.timer = setInterval(() => {
      this.checkScheduledCampaigns().catch((err) =>
        this.logger.error(`Error in scheduled campaigns check: ${err.message}`),
      );
    }, 30000);
  }

  /**
   * Scans database for scheduled campaigns whose scheduled_at <= NOW()
   */
  async checkScheduledCampaigns() {
    const dueCampaigns = await this.campaignRepo.find({
      where: {
        status: EmailCampaignStatus.SCHEDULED,
        scheduledAt: LessThanOrEqual(new Date()),
      },
    });

    for (const campaign of dueCampaigns) {
      this.logger.log(`Triggering scheduled campaign: ${campaign.name} (${campaign.id})`);
      await this.queueService.addCampaignJob({
        campaignId: campaign.id,
        action: 'start',
      });
    }
  }

  /**
   * Evaluates automation rules on business event
   */
  async triggerAutomation(trigger: AutomationTrigger, payload: Record<string, any>) {
    const rules = await this.automationRepo.find({
      where: { triggerEvent: trigger, isActive: true },
    });

    for (const rule of rules) {
      this.logger.log(`Evaluating automation rule "${rule.name}" for trigger ${trigger}`);
      // In production, resolves users matching rule conditions and queues email
    }
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
