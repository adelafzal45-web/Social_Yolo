import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreditTransaction } from './entities/credit-transaction.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(CreditTransaction)
    private readonly txRepo: Repository<CreditTransaction>,
    private readonly notifService: NotificationsService,
  ) {}

  async getSummary(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const transactions = await this.txRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return {
      plan: user?.plan || 'free_trial',
      credits: user?.credits ?? 50,
      monthlyAllowance:
        user?.plan === 'agency'
          ? 1000
          : user?.plan === 'pro'
            ? 350
            : user?.plan === 'starter'
              ? 100
              : 50,
      renewsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        description: t.description,
        balanceAfter: t.balanceAfter,
        createdAt: t.createdAt,
      })),
    };
  }

  async topupCredits(userId: string, creditsToAdd: number, packTitle: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    user.credits = (user.credits || 0) + creditsToAdd;
    await this.userRepo.save(user);

    const tx = this.txRepo.create({
      userId,
      amount: creditsToAdd,
      description: `Top-up: ${packTitle}`,
      balanceAfter: user.credits,
    });
    await this.txRepo.save(tx);

    await this.notifService
      .create(
        userId,
        'Credits Added! ⚡',
        `Successfully added ${creditsToAdd} credits (${packTitle}). New balance: ${user.credits} credits.`,
        'billing',
      )
      .catch(() => {});

    return {
      success: true,
      credits: user.credits,
      message: `Successfully credited ${creditsToAdd} credits. New balance: ${user.credits}`,
    };
  }

  async deductCredits(
    userId: string,
    amount: number,
    reason: string,
  ): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      return true; // allow guest if user doesn't exist
    }

    const result = await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ credits: () => `credits - ${amount}` })
      .where('id = :id AND credits >= :amount', { id: userId, amount })
      .returning(['id', 'credits'])
      .execute();

    if (!result.affected || result.affected === 0) {
      throw new BadRequestException(
        `Insufficient credits. You need ${amount} credits, but have ${user.credits}. Please top up.`,
      );
    }

    const updatedCredits = result.raw?.[0]?.credits ?? user.credits - amount;

    const tx = this.txRepo.create({
      userId,
      amount: -amount,
      description: reason,
      balanceAfter: updatedCredits,
    });
    await this.txRepo.save(tx);

    return true;
  }

  async refundCredits(
    userId: string,
    amount: number,
    reason: string,
  ): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;

    user.credits = (user.credits || 0) + amount;
    await this.userRepo.save(user);

    const tx = this.txRepo.create({
      userId,
      amount: amount,
      description: `Refund: ${reason}`,
      balanceAfter: user.credits,
    });
    await this.txRepo.save(tx);
  }
}
