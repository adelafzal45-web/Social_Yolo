import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { EmailSuppressionEntity } from '../entities/email-suppression.entity';
import { EmailPreferenceEntity } from '../entities/email-preference.entity';
import { BrandProfile } from '../../brands/entities/brand-profile.entity';
import { Post } from '../../posts/entities/post.entity';

export interface AudienceCriteria {
  target?: 'all' | 'specific_users' | 'specific_brands' | 'plan' | 'content_creators' | 'inactive_users' | 'custom';
  userIds?: string[];
  brandIds?: string[];
  plans?: string[];
  inactiveDays?: number;
  category?: 'MARKETING' | 'OFFER' | 'TRANSACTIONAL' | 'SYSTEM';
}

export interface ResolvedRecipient {
  userId?: string;
  email: string;
  name: string;
}

export interface AudienceEstimation {
  totalTargeted: number;
  suppressedCount: number;
  optedOutCount: number;
  eligibleCount: number;
  sample: ResolvedRecipient[];
}

@Injectable()
export class AudienceResolverService {
  private readonly logger = new Logger(AudienceResolverService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(EmailSuppressionEntity)
    private readonly suppressionRepo: Repository<EmailSuppressionEntity>,
    @InjectRepository(EmailPreferenceEntity)
    private readonly preferenceRepo: Repository<EmailPreferenceEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Resolves eligible audience recipients for a given campaign criteria.
   */
  async resolveAudience(criteria: AudienceCriteria): Promise<ResolvedRecipient[]> {
    const rawUsers = await this.queryTargetedUsers(criteria);
    const eligible = await this.filterEligibleUsers(rawUsers, criteria.category || 'MARKETING');
    return eligible;
  }

  /**
   * Estimates recipient count and suppression breakdown without dispatching.
   */
  async estimateAudience(criteria: AudienceCriteria): Promise<AudienceEstimation> {
    const rawUsers = await this.queryTargetedUsers(criteria);
    const totalTargeted = rawUsers.length;

    if (totalTargeted === 0) {
      return {
        totalTargeted: 0,
        suppressedCount: 0,
        optedOutCount: 0,
        eligibleCount: 0,
        sample: [],
      };
    }

    // Check suppressions
    const emails = rawUsers.map((u) => u.email.toLowerCase().trim());
    const suppressions = await this.suppressionRepo.find({
      where: { email: In(emails) },
      select: ['email'],
    });
    const suppressedSet = new Set(suppressions.map((s) => s.email.toLowerCase()));

    // Check preferences (if marketing/offer)
    const category = criteria.category || 'MARKETING';
    let optedOutCount = 0;
    const optedOutSet = new Set<string>();

    if (category === 'MARKETING' || category === 'OFFER') {
      const userIds = rawUsers.map((u) => u.id).filter(Boolean);
      if (userIds.length > 0) {
        const prefs = await this.preferenceRepo.find({
          where: { userId: In(userIds) },
        });
        for (const p of prefs) {
          if (category === 'OFFER' && !p.offerEmails) {
            optedOutSet.add(p.userId);
          } else if (category === 'MARKETING' && !p.marketingEmails) {
            optedOutSet.add(p.userId);
          }
        }
      }
    }

    let suppressedCount = 0;
    const eligible: ResolvedRecipient[] = [];

    // Deduplicate by email
    const seenEmails = new Set<string>();

    for (const u of rawUsers) {
      const email = u.email.toLowerCase().trim();
      if (seenEmails.has(email)) continue;
      seenEmails.add(email);

      if (suppressedSet.has(email)) {
        suppressedCount++;
        continue;
      }

      if (optedOutSet.has(u.id)) {
        optedOutCount++;
        continue;
      }

      eligible.push({
        userId: u.id,
        email: u.email,
        name: u.name || 'Valued Creator',
      });
    }

    return {
      totalTargeted,
      suppressedCount,
      optedOutCount,
      eligibleCount: eligible.length,
      sample: eligible.slice(0, 10),
    };
  }

  private async queryTargetedUsers(criteria: AudienceCriteria): Promise<User[]> {
    const qb = this.userRepo.createQueryBuilder('user').where('user.is_active = :isActive', { isActive: true });

    switch (criteria.target) {
      case 'specific_users':
        if (criteria.userIds && criteria.userIds.length > 0) {
          qb.andWhere('user.id IN (:...userIds)', { userIds: criteria.userIds });
        }
        break;

      case 'specific_brands':
        if (criteria.brandIds && criteria.brandIds.length > 0) {
          qb.innerJoin('brand_profiles', 'brand', 'brand.user_id = user.id')
            .andWhere('brand.id IN (:...brandIds)', { brandIds: criteria.brandIds });
        }
        break;

      case 'plan':
        if (criteria.plans && criteria.plans.length > 0) {
          qb.andWhere('LOWER(user.plan) IN (:...plans)', {
            plans: criteria.plans.map((p) => p.toLowerCase()),
          });
        }
        break;

      case 'content_creators':
        // Users who generated posts
        qb.innerJoin('posts', 'post', 'post.user_id = user.id');
        qb.groupBy('user.id');
        break;

      case 'inactive_users':
        if (criteria.inactiveDays && criteria.inactiveDays > 0) {
          const threshold = new Date(Date.now() - criteria.inactiveDays * 86400 * 1000);
          qb.andWhere('user.updated_at < :threshold', { threshold });
        }
        break;

      case 'all':
      default:
        // All active users
        break;
    }

    qb.orderBy('user.created_at', 'DESC');
    return qb.getMany();
  }

  private async filterEligibleUsers(
    users: User[],
    category: string,
  ): Promise<ResolvedRecipient[]> {
    if (users.length === 0) return [];

    const emails = users.map((u) => u.email.toLowerCase().trim());
    const userIds = users.map((u) => u.id).filter(Boolean);

    // Fetch suppressions in bulk
    const suppressions = await this.suppressionRepo.find({
      where: { email: In(emails) },
      select: ['email'],
    });
    const suppressedSet = new Set(suppressions.map((s) => s.email.toLowerCase()));

    // Fetch preferences in bulk
    const optedOutSet = new Set<string>();
    if (category === 'MARKETING' || category === 'OFFER') {
      if (userIds.length > 0) {
        const prefs = await this.preferenceRepo.find({
          where: { userId: In(userIds) },
        });
        for (const p of prefs) {
          if (category === 'OFFER' && !p.offerEmails) optedOutSet.add(p.userId);
          else if (category === 'MARKETING' && !p.marketingEmails) optedOutSet.add(p.userId);
        }
      }
    }

    const result: ResolvedRecipient[] = [];
    const seenEmails = new Set<string>();

    for (const u of users) {
      const email = u.email.toLowerCase().trim();
      if (seenEmails.has(email)) continue;
      seenEmails.add(email);

      if (suppressedSet.has(email)) continue;
      if (optedOutSet.has(u.id)) continue;

      result.push({
        userId: u.id,
        email: u.email,
        name: u.name || 'Valued Creator',
      });
    }

    return result;
  }
}
