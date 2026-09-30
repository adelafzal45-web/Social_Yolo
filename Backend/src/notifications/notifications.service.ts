import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  async listUserNotifications(userId: string) {
    const items = await this.notifRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 30,
    });

    // If empty for this user, seed default helpful onboarding notifications
    if (items.length === 0) {
      const welcome = this.notifRepo.create({
        userId,
        title: 'Welcome to Social Yolo AI! ✨',
        message:
          'Your account includes 50 free creation credits. Start by creating a brand or launching the studio.',
        type: 'info',
        isRead: false,
      });
      const tip = this.notifRepo.create({
        userId,
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
    await this.notifRepo.update({ id, userId }, { isRead: true });
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.notifRepo.update({ userId }, { isRead: true });
    return { success: true };
  }

  async create(
    userId: string,
    title: string,
    message: string,
    type: string = 'info',
  ) {
    const notif = this.notifRepo.create({
      userId,
      title,
      message,
      type,
      isRead: false,
    });
    return this.notifRepo.save(notif);
  }

  async deleteNotification(userId: string, id: string) {
    const res = await this.notifRepo.delete({ id, userId });
    return { success: true, affected: res.affected };
  }

  async clearAll(userId: string) {
    await this.notifRepo.delete({ userId });
    return { success: true };
  }
}
