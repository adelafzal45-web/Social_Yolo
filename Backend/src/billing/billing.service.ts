import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User, UserPlan } from '../users/entities/user.entity';
import { CreditTransaction } from './entities/credit-transaction.entity';
import {
  UserSubscription,
  SubscriptionStatus,
} from './entities/subscription.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { SafepayService } from './providers/safepay.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCheckoutDto, VerifyPaymentDto } from './dto/billing.dto';

const isUuid = (val?: string): boolean =>
  Boolean(
    val &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        val.trim(),
      ),
  );

export const SUBSCRIPTION_PLANS: Record<
  string,
  {
    id: string;
    name: string;
    price: number;
    currency: string;
    monthlyCredits: number;
    period: string;
    features: string[];
  }
> = {
  free_trial: {
    id: 'free_trial',
    name: 'Free Trial',
    price: 0,
    currency: 'PKR',
    monthlyCredits: 50,
    period: 'forever',
    features: [
      '50 Welcome Credits',
      'High-Resolution AI Vision',
      'All 6 Platform Ratios',
      '1 Brand DNA Profile',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter Creator',
    price: 1900,
    currency: 'PKR',
    monthlyCredits: 100,
    period: 'per month',
    features: [
      '100 Credits / month',
      'Fast ISNet BG Removal',
      '3 Brand DNA Profiles',
      'Commercial Usage License',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro Marketer',
    price: 4900,
    currency: 'PKR',
    monthlyCredits: 350,
    period: 'per month',
    features: [
      '350 Credits / month',
      'Unlimited Brand Profiles',
      'High-Priority AI Style Queue',
      'Personal Style Memory Tuning',
      'VIP Discord Support',
    ],
  },
  agency: {
    id: 'agency',
    name: 'Scale Agency',
    price: 14900,
    currency: 'PKR',
    monthlyCredits: 1000,
    period: 'per month',
    features: [
      '1,000 Credits / month',
      'Multi-User Team Seats',
      'Custom Font Uploads',
      'Dedicated Cloud Microservice',
      '99.9% SLA Guarantee',
    ],
  },
};

export const CREDIT_PACKS: Record<
  string,
  {
    id: string;
    title: string;
    credits: number;
    price: number;
    currency: string;
    costPerCredit: string;
  }
> = {
  starter_pack: {
    id: 'starter_pack',
    title: 'Starter Pack',
    credits: 50,
    price: 900,
    currency: 'PKR',
    costPerCredit: 'Rs 18 / credit',
  },
  creator_pack: {
    id: 'creator_pack',
    title: 'Creator Pack',
    credits: 150,
    price: 1900,
    currency: 'PKR',
    costPerCredit: 'Rs 12.67 / credit',
  },
  agency_pack: {
    id: 'agency_pack',
    title: 'Agency Power Pack',
    credits: 500,
    price: 4900,
    currency: 'PKR',
    costPerCredit: 'Rs 9.80 / credit',
  },
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(CreditTransaction)
    private readonly txRepo: Repository<CreditTransaction>,
    @InjectRepository(UserSubscription)
    private readonly subRepo: Repository<UserSubscription>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly dataSource: DataSource,
    private readonly notifService: NotificationsService,
    private readonly safepayService: SafepayService,
  ) {}

  private async resolveUuid(candidateId: string): Promise<string | null> {
    if (!candidateId || !candidateId.trim()) return null;
    const cleanId = candidateId.trim();
    if (isUuid(cleanId)) return cleanId;
    try {
      const rows = await this.userRepo.query(
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

  /**
   * Retrieves authoritative billing summary for user from database
   */
  async getSummary(userId: string) {
    const validUserId = await this.resolveUuid(userId);
    if (!validUserId) {
      throw new NotFoundException('User not found.');
    }

    const user = await this.userRepo.findOne({ where: { id: validUserId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Retrieve active or most recent subscription
    const subscription = await this.subRepo.findOne({
      where: { userId: validUserId },
      order: { createdAt: 'DESC' },
    });

    const transactions = await this.txRepo.find({
      where: { userId: validUserId },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    const payments = await this.paymentRepo.find({
      where: { userId: validUserId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const activePlanKey = user.plan || subscription?.plan || 'free_trial';
    const planConfig = SUBSCRIPTION_PLANS[activePlanKey] || SUBSCRIPTION_PLANS.free_trial;

    return {
      plan: activePlanKey,
      planDetails: planConfig,
      credits: user.credits ?? 50,
      monthlyAllowance: planConfig.monthlyCredits,
      subscription: subscription
        ? {
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            price: Number(subscription.price),
            currency: subscription.currency,
            billingInterval: subscription.billingInterval,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            canceledAt: subscription.canceledAt,
          }
        : null,
      renewsAt: subscription?.currentPeriodEnd || null,
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        description: t.description,
        balanceAfter: t.balanceAfter,
        createdAt: t.createdAt,
      })),
      recentPayments: payments.map((p) => ({
        id: p.id,
        plan: p.plan,
        packId: p.packId,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        provider: p.provider,
        providerTransactionId: p.providerTransactionId,
        createdAt: p.createdAt,
        completedAt: p.completedAt,
      })),
      availablePlans: Object.values(SUBSCRIPTION_PLANS),
      availablePacks: Object.values(CREDIT_PACKS),
    };
  }

  /**
   * Retrieves active subscription for user
   */
  async getSubscription(userId: string): Promise<UserSubscription | null> {
    const validUserId = await this.resolveUuid(userId);
    if (!validUserId) return null;
    return this.subRepo.findOne({
      where: { userId: validUserId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Creates a real SafePay Checkout Session for a Subscription Plan or Credit Pack
   */
  async createSafePayCheckout(
    userId: string,
    dto: CreateCheckoutDto,
  ): Promise<{
    checkoutUrl: string;
    trackerToken: string;
    paymentId: string;
    amount: number;
    currency: string;
  }> {
    const validUserId = await this.resolveUuid(userId);
    if (!validUserId) {
      throw new NotFoundException('User not found.');
    }

    const user = await this.userRepo.findOne({ where: { id: validUserId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    let amount = 0;
    let currency = 'PKR';
    let plan: string | null = null;
    let packId: string | null = null;
    let credits = 0;

    if (dto.planId) {
      const selectedPlan = SUBSCRIPTION_PLANS[dto.planId];
      if (!selectedPlan || selectedPlan.price <= 0) {
        throw new BadRequestException('Invalid subscription plan for payment checkout.');
      }
      amount = selectedPlan.price;
      currency = selectedPlan.currency;
      plan = selectedPlan.id;
      credits = selectedPlan.monthlyCredits;
    } else if (dto.packId) {
      const selectedPack = CREDIT_PACKS[dto.packId];
      if (!selectedPack) {
        throw new BadRequestException('Invalid credit pack selected.');
      }
      amount = selectedPack.price;
      currency = selectedPack.currency;
      packId = selectedPack.id;
      credits = selectedPack.credits;
    } else {
      throw new BadRequestException('Either planId or packId must be provided for checkout.');
    }

    // 1. Create a pending Payment record in database
    const checkoutRef = `chk_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const payment = this.paymentRepo.create({
      userId: validUserId,
      provider: 'safepay',
      checkoutSessionRef: checkoutRef,
      plan,
      packId,
      credits,
      amount,
      currency,
      status: PaymentStatus.PENDING,
      metadata: {
        userEmail: user.email,
        userName: user.name,
        initiatedAt: new Date().toISOString(),
      },
    });
    await this.paymentRepo.save(payment);

    // 2. Prepare Callback URLs
    const frontendBase =
      process.env.FRONTEND_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';
    const redirectUrl =
      dto.redirectUrl ||
      `${frontendBase}/dashboard/billing?session_id=${payment.id}`;
    const cancelUrl =
      dto.cancelUrl ||
      `${frontendBase}/dashboard/billing?canceled=true&session_id=${payment.id}`;

    // 3. Call SafePay to initialize checkout session
    try {
      const { trackerToken, checkoutUrl } = await this.safepayService.initCheckout({
        amount,
        currency,
        orderId: payment.id,
        redirectUrl,
        cancelUrl,
      });

      // Update payment record with provider tracker token
      payment.trackerToken = trackerToken;
      payment.providerTransactionId = trackerToken;
      await this.paymentRepo.save(payment);

      this.logger.log(
        `SafePay checkout session created for user ${user.email} (Payment ${payment.id}, Tracker ${trackerToken})`,
      );

      return {
        checkoutUrl,
        trackerToken,
        paymentId: payment.id,
        amount,
        currency,
      };
    } catch (err: any) {
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = `Checkout creation error: ${err.message}`;
      await this.paymentRepo.save(payment);
      throw err;
    }
  }

  /**
   * Verifies SafePay payment server-side and atomically fulfills subscription / credits.
   * Safe, idempotent, and protected against browser manipulation.
   */
  async verifySafePayPayment(
    userId: string,
    dto: VerifyPaymentDto,
  ): Promise<{
    success: boolean;
    message: string;
    payment: any;
    summary: any;
  }> {
    const validUserId = await this.resolveUuid(userId);
    if (!validUserId) {
      throw new NotFoundException('User not found.');
    }

    // Locate the payment record
    let payment: Payment | null = null;
    if (dto.paymentId) {
      payment = await this.paymentRepo.findOne({
        where: { id: dto.paymentId, userId: validUserId },
      });
    } else if (dto.trackerToken) {
      payment = await this.paymentRepo.findOne({
        where: { trackerToken: dto.trackerToken, userId: validUserId },
      });
    }

    if (!payment) {
      throw new NotFoundException('Payment record not found.');
    }

    // Idempotency: If already completed, return existing success state immediately
    if (payment.status === PaymentStatus.COMPLETED) {
      this.logger.log(`Payment ${payment.id} already verified and completed.`);
      const summary = await this.getSummary(validUserId);
      return {
        success: true,
        message: 'Payment has already been verified and credited.',
        payment,
        summary,
      };
    }

    const trackerToken = payment.trackerToken || dto.trackerToken;
    if (!trackerToken) {
      throw new BadRequestException('No SafePay tracking token associated with this payment.');
    }

    // 1. Authoritatively verify with SafePay server-side API
    const verification = await this.safepayService.verifyOrder(trackerToken);
    if (!verification.isValid || verification.state !== 'PAID') {
      this.logger.warn(
        `SafePay order verification failed for Payment ${payment.id}: state=${verification.state}`,
      );
      if (verification.state === 'CANCELLED') {
        payment.status = PaymentStatus.CANCELLED;
        payment.failureReason = 'Payment was cancelled by the user.';
      } else {
        payment.status = PaymentStatus.FAILED;
        payment.failureReason = `SafePay order verification returned state: ${verification.state}`;
      }
      await this.paymentRepo.save(payment);

      throw new BadRequestException(
        payment.failureReason || 'Payment could not be verified with SafePay.',
      );
    }

    // 2. Execute ACID Database Transaction for fulfillment
    await this.fulfillPaymentInTransaction(payment, verification);

    const summary = await this.getSummary(validUserId);
    return {
      success: true,
      message: 'Payment verified successfully! Your subscription and credits have been activated.',
      payment,
      summary,
    };
  }

  /**
   * Processes verified payment fulfillment inside an ACID database transaction.
   * Updates Payment, User, UserSubscription, and CreditTransaction atomically.
   */
  private async fulfillPaymentInTransaction(
    payment: Payment,
    verification: any,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Re-fetch payment with lock to avoid race conditions
      const lockedPayment = await queryRunner.manager.findOne(Payment, {
        where: { id: payment.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lockedPayment) {
        throw new NotFoundException('Payment not found during transaction.');
      }

      if (lockedPayment.status === PaymentStatus.COMPLETED) {
        await queryRunner.rollbackTransaction();
        return;
      }

      // Re-fetch user with lock
      const user = await queryRunner.manager.findOne(User, {
        where: { id: lockedPayment.userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException('User not found during transaction.');
      }

      // 1. Update Payment status
      lockedPayment.status = PaymentStatus.COMPLETED;
      lockedPayment.completedAt = new Date();
      lockedPayment.metadata = {
        ...lockedPayment.metadata,
        verifiedAt: new Date().toISOString(),
        safepayVerification: verification,
      };
      await queryRunner.manager.save(lockedPayment);

      // 2. Fulfill Subscription or Credit Pack
      if (lockedPayment.plan) {
        const planKey = lockedPayment.plan;
        const planConfig = SUBSCRIPTION_PLANS[planKey];
        const allowance = planConfig?.monthlyCredits || lockedPayment.credits || 100;

        // Upsert Subscription
        let sub = await queryRunner.manager.findOne(UserSubscription, {
          where: { userId: user.id },
        });

        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        if (!sub) {
          sub = queryRunner.manager.create(UserSubscription, {
            userId: user.id,
            plan: planKey,
            status: SubscriptionStatus.ACTIVE,
            price: lockedPayment.amount,
            currency: lockedPayment.currency,
            billingInterval: 'monthly',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
            provider: 'safepay',
            providerSubscriptionId: lockedPayment.providerTransactionId,
          });
        } else {
          sub.plan = planKey;
          sub.status = SubscriptionStatus.ACTIVE;
          sub.price = lockedPayment.amount;
          sub.currency = lockedPayment.currency;
          sub.currentPeriodStart = now;
          sub.currentPeriodEnd = periodEnd;
          sub.cancelAtPeriodEnd = false;
          sub.canceledAt = null;
          sub.providerSubscriptionId = lockedPayment.providerTransactionId;
        }
        await queryRunner.manager.save(sub);

        // Update User plan and add allowance
        user.plan = planKey as UserPlan;
        user.credits = (user.credits || 0) + allowance;
        await queryRunner.manager.save(user);

        // Record Credit Transaction
        const tx = queryRunner.manager.create(CreditTransaction, {
          userId: user.id,
          amount: allowance,
          balanceAfter: user.credits,
          description: `SafePay: ${planConfig?.name || planKey} Subscription (Monthly Allowance)`,
        });
        await queryRunner.manager.save(tx);
      } else if (lockedPayment.packId) {
        const packConfig = CREDIT_PACKS[lockedPayment.packId];
        const creditsToAdd = packConfig?.credits || lockedPayment.credits || 50;

        user.credits = (user.credits || 0) + creditsToAdd;
        await queryRunner.manager.save(user);

        const tx = queryRunner.manager.create(CreditTransaction, {
          userId: user.id,
          amount: creditsToAdd,
          balanceAfter: user.credits,
          description: `SafePay: ${packConfig?.title || 'Credit Pack'} Top-Up`,
        });
        await queryRunner.manager.save(tx);
      }

      await queryRunner.commitTransaction();

      // Send notification asynchronously
      this.notifService
        .create(
          user.id,
          'Payment Successful! 💳',
          lockedPayment.plan
            ? `Your subscription to ${lockedPayment.plan.toUpperCase()} has been activated with ${lockedPayment.credits} credits.`
            : `Your credit pack of ${lockedPayment.credits} credits has been added to your balance.`,
          'billing',
        )
        .catch(() => {});
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Handles incoming SafePay Webhooks securely with signature verification & idempotency.
   */
  async handleSafePayWebhook(
    rawBody: Buffer | string,
    signature?: string,
    timestamp?: string,
  ): Promise<{ received: boolean; processed: boolean; message: string }> {
    // 1. Verify Webhook Signature
    const isSignatureValid = this.safepayService.verifyWebhookSignature(
      signature,
      timestamp,
      rawBody,
    );

    if (!isSignatureValid) {
      this.logger.error('SafePay webhook failed HMAC signature verification.');
      throw new UnauthorizedException('Invalid SafePay webhook signature.');
    }

    let payload: any;
    try {
      const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
      payload = JSON.parse(bodyStr);
    } catch {
      throw new BadRequestException('Malformed JSON webhook payload.');
    }

    const event = payload?.data || payload;
    const trackerToken =
      event?.token || event?.tracker?.token || event?.order?.token || event?.beacon;
    const state = (event?.state || event?.status || '').toUpperCase();

    if (!trackerToken) {
      this.logger.warn('SafePay webhook event does not contain a tracking token.');
      return { received: true, processed: false, message: 'Missing tracker token.' };
    }

    // Locate the payment
    const payment = await this.paymentRepo.findOne({
      where: [
        { trackerToken },
        { providerTransactionId: trackerToken },
      ],
    });

    if (!payment) {
      this.logger.warn(`No payment found matching webhook tracker ${trackerToken}`);
      return { received: true, processed: false, message: 'Payment record not found.' };
    }

    // Check idempotency
    if (payment.status === PaymentStatus.COMPLETED) {
      this.logger.log(`Webhook: Payment ${payment.id} already processed.`);
      return { received: true, processed: true, message: 'Already processed.' };
    }

    if (state === 'PAID' || state === 'COMPLETED') {
      await this.fulfillPaymentInTransaction(payment, event);
      this.logger.log(`Webhook: Payment ${payment.id} fulfilled successfully.`);
      return { received: true, processed: true, message: 'Payment fulfilled.' };
    } else if (state === 'CANCELLED' || state === 'FAILED') {
      payment.status = state === 'CANCELLED' ? PaymentStatus.CANCELLED : PaymentStatus.FAILED;
      payment.failureReason = `SafePay webhook reported status: ${state}`;
      await this.paymentRepo.save(payment);
      return { received: true, processed: true, message: `Payment marked ${payment.status}.` };
    }

    return { received: true, processed: false, message: `Ignored status: ${state}` };
  }

  /**
   * Cancels subscription at period end
   */
  async cancelSubscription(userId: string): Promise<{ success: boolean; message: string }> {
    const validUserId = await this.resolveUuid(userId);
    if (!validUserId) {
      throw new NotFoundException('User not found.');
    }

    const sub = await this.subRepo.findOne({
      where: { userId: validUserId, status: SubscriptionStatus.ACTIVE },
    });

    if (!sub) {
      throw new BadRequestException('No active paid subscription found to cancel.');
    }

    sub.cancelAtPeriodEnd = true;
    sub.canceledAt = new Date();
    await this.subRepo.save(sub);

    return {
      success: true,
      message: `Your subscription will remain active until ${new Date(sub.currentPeriodEnd).toLocaleDateString()}, after which it will not renew.`,
    };
  }

  /**
   * Deducts credits atomically inside an ACID transaction.
   * Prevents race conditions and negative balances.
   */
  async deductCredits(
    userId: string,
    amount: number,
    reason: string,
  ): Promise<boolean> {
    if (amount <= 0) return true;

    const validUserId = await this.resolveUuid(userId);
    if (!validUserId) {
      throw new BadRequestException('Authentication required. Cannot deduct credits from unverified user.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: validUserId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException('User not found.');
      }

      if ((user.credits ?? 0) < amount) {
        throw new BadRequestException(
          `Insufficient credits. You need ${amount} credits, but only have ${user.credits || 0}. Please top up your balance.`,
        );
      }

      user.credits = user.credits - amount;
      await queryRunner.manager.save(user);

      const tx = queryRunner.manager.create(CreditTransaction, {
        userId: validUserId,
        amount: -amount,
        description: reason,
        balanceAfter: user.credits,
      });
      await queryRunner.manager.save(tx);

      await queryRunner.commitTransaction();
      return true;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Refunds credits atomically inside an ACID transaction.
   */
  async refundCredits(
    userId: string,
    amount: number,
    reason: string,
  ): Promise<void> {
    if (amount <= 0) return;

    const validUserId = await this.resolveUuid(userId);
    if (!validUserId) return;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: validUserId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        await queryRunner.rollbackTransaction();
        return;
      }

      user.credits = (user.credits || 0) + amount;
      await queryRunner.manager.save(user);

      const tx = queryRunner.manager.create(CreditTransaction, {
        userId: validUserId,
        amount,
        description: `Refund: ${reason}`,
        balanceAfter: user.credits,
      });
      await queryRunner.manager.save(tx);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to refund credits: ${err}`);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Administrative adjustment of user credits with auditable transaction log
   */
  async adminAdjustCredits(
    targetUserId: string,
    amount: number,
    reason: string,
  ): Promise<{ credits: number; transaction: CreditTransaction }> {
    const validUserId = await this.resolveUuid(targetUserId);
    if (!validUserId) {
      throw new NotFoundException('User not found.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: validUserId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException('User not found.');
      }

      const newBalance = (user.credits || 0) + amount;
      if (newBalance < 0) {
        throw new BadRequestException('Cannot deduct more credits than user currently possesses.');
      }

      user.credits = newBalance;
      await queryRunner.manager.save(user);

      const tx = queryRunner.manager.create(CreditTransaction, {
        userId: validUserId,
        amount,
        description: `Admin Adjustment: ${reason}`,
        balanceAfter: newBalance,
      });
      const savedTx = await queryRunner.manager.save(tx);

      await queryRunner.commitTransaction();

      return { credits: newBalance, transaction: savedTx };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Lists all recorded payments with pagination for administration
   */
  async listAllPayments(page = 1, limit = 50) {
    const [payments, total] = await this.paymentRepo.findAndCount({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      payments: payments.map((p) => ({
        id: p.id,
        user: {
          id: p.user?.id,
          email: p.user?.email,
          name: p.user?.name,
        },
        plan: p.plan,
        packId: p.packId,
        credits: p.credits,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        provider: p.provider,
        providerTransactionId: p.providerTransactionId,
        failureReason: p.failureReason,
        createdAt: p.createdAt,
        completedAt: p.completedAt,
      })),
      total,
    };
  }
}
