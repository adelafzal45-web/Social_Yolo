import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import {
  SubscriptionStatus,
  User,
  UserPlan,
} from '../auth/entities/user.entity';
import { UsersService } from '../auth/users.service';

export const FREE_GENERATIONS = Number(process.env.FREE_GENERATIONS ?? 3);

/** Error body returned when the free trial is exhausted (HTTP 402). */
export class TrialExhaustedException extends HttpException {
  constructor(remaining: number) {
    super(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        code: 'TRIAL_EXHAUSTED',
        message:
          'You have used all your free generations. Upgrade to Pro for unlimited posts.',
        creditsRemaining: Math.max(remaining, 0),
        upgradeUrl: '/#upgrade',
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}

/**
 * Free-trial / subscription gate for post generation.
 *
 * Rules:
 * - Pro users with an active, unexpired subscription: unlimited.
 * - Free users: allowed while `creditsUsed < FREE_GENERATIONS`; the credit is
 *   consumed only AFTER a successful generation (failed attempts are free).
 */
@Injectable()
export class BillingService {
  constructor(private readonly usersService: UsersService) {}

  /** Throws `TrialExhaustedException` (402) unless generation may proceed. */
  assertCanGenerate(user: User): void {
    if (this.isProActive(user)) return;
    const remaining = this.creditsRemaining(user);
    if (remaining <= 0) {
      throw new TrialExhaustedException(remaining);
    }
  }

  /** Called after a successful generation to burn one free credit. */
  async consumeCredit(user: User): Promise<User> {
    if (this.isProActive(user)) return user;
    user.creditsUsed += 1;
    return this.usersService.save(user);
  }

  creditsRemaining(user: User): number {
    if (this.isProActive(user)) return Number.POSITIVE_INFINITY;
    return FREE_GENERATIONS - user.creditsUsed;
  }

  /** A Pro subscription is valid only while active and not past its period end. */
  isProActive(user: User): boolean {
    if (user.plan !== UserPlan.PRO) return false;
    if (user.subscriptionStatus !== SubscriptionStatus.ACTIVE) return false;
    if (user.currentPeriodEnd && user.currentPeriodEnd.getTime() < Date.now()) {
      return false;
    }
    return true;
  }

  usage(user: User) {
    const remaining = this.creditsRemaining(user);
    return {
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      creditsUsed: user.creditsUsed,
      creditsRemaining: Number.isFinite(remaining) ? remaining : null, // null = unlimited
      freeLimit: FREE_GENERATIONS,
      currentPeriodEnd: user.currentPeriodEnd,
      isPro: this.isProActive(user),
    };
  }

  /**
   * MOCK subscription: activates Pro immediately. Replace with a real Stripe
   * Checkout + webhook flow when going live (see `billing/README` notes in
   * `STRIPE_INTEGRATION.md`); the entity fields are already Stripe-shaped.
   */
  async activateMockSubscription(user: User, days = 30): Promise<User> {
    user.plan = UserPlan.PRO;
    user.subscriptionStatus = SubscriptionStatus.ACTIVE;
    user.currentPeriodEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    user.stripeSubscriptionId =
      user.stripeSubscriptionId ?? 'mock_sub_placeholder';
    return this.usersService.save(user);
  }

  /** Cancels the mock subscription — back to free tier (used credits kept). */
  async cancelSubscription(user: User): Promise<User> {
    user.plan = UserPlan.FREE;
    user.subscriptionStatus = SubscriptionStatus.CANCELED;
    user.currentPeriodEnd = null;
    return this.usersService.save(user);
  }

  async findByIdOrFail(id: string): Promise<User> {
    return this.usersService.findByIdOrFail(id);
  }
}
