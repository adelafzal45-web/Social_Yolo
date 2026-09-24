import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

const isUuid = (val?: string): boolean =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim()));

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  private async resolveUuid(candidateId: string): Promise<string | null> {
    if (!candidateId || !candidateId.trim()) return null;
    const cleanId = candidateId.trim();
    if (isUuid(cleanId)) return cleanId;
    try {
      const rows = await this.notifRepo.query(
        `SELECT id FROM public.users 
         WHERE better_auth_id = $1 
            OR id::text = $1 
            OR EXISTS (SELECT 1 FROM "user" bu WHERE bu.id = $1 AND LOWER(bu.email) = LOWER(public.users.email))
         LIMIT 1`,
        [cleanId],
      );
      return rows?.[0]?.id || null;
    } catch {
      return null;
    }
  }

  async listUserNotifications(userId: string) {
    const validUserId = await this.resolveUuid(userId);
    if (!validUserId) return [];

    const items = await this.notifRepo.find({
      where: { userId: validUserId },
      order: { createdAt: 'DESC' },
      take: 30,
    });

    // If empty for this user, seed default helpful onboarding notifications
    if (items.length === 0) {
      const welcome = this.notifRepo.create({
        userId: validUserId,
        title: 'Welcome to Social Yolo AI! ✨',
        message:
          'Your account includes 50 free creation credits. Start by creating a brand or launching the studio.',
        type: 'info',
        isRead: false,
      });
      const tip = this.notifRepo.create({
        userId: validUserId,
        title: 'AI Studio Ready',
        message:
          'Design studio-quality content effortlessly! Select your product, platform, and preferred visual style to create posts.',
        type: 'success',
        isRead: false,
      });
      return this.notifRepo.save([welcome, tip]);
    }

    return items;
  }

  async markAsRead(userId: string, id: string) {
    const validUserId = await this.resolveUuid(userId);
    if (!validUserId || !isUuid(id)) return { success: false };
    await this.notifRepo.update({ id, userId: validUserId }, { isRead: true });
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    const validUserId = await this.resolveUuid(userId);
    if (!validUserId) return { success: false };
    await this.notifRepo.update({ userId: validUserId }, { isRead: true });
    return { success: true };
  }

  async create(
    userId: string,
    title: string,
    message: string,
    type: string = 'info',
  ) {
    const validUserId = await this.resolveUuid(userId);
    if (!validUserId) return null;
    const notif = this.notifRepo.create({
      userId: validUserId,
      title,
      message,
      type,
      isRead: false,
    });
    return this.notifRepo.save(notif);
  }

  async deleteNotification(userId: string, id: string) {
    const validUserId = await this.resolveUuid(userId);
    if (!validUserId || !isUuid(id)) return { success: false, affected: 0 };
    const res = await this.notifRepo.delete({ id, userId: validUserId });
    return { success: true, affected: res.affected };
  }

  async clearAll(userId: string) {
    const validUserId = await this.resolveUuid(userId);
    if (!validUserId) return { success: false };
    await this.notifRepo.delete({ userId: validUserId });
    return { success: true };
  }
}
