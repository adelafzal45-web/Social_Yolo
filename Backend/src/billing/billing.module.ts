import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { CreditTransaction } from './entities/credit-transaction.entity';
import { UserSubscription } from './entities/subscription.entity';
import { Payment } from './entities/payment.entity';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { SafepayService } from './providers/safepay.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      CreditTransaction,
      UserSubscription,
      Payment,
    ]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [BillingController],
  providers: [BillingService, SafepayService],
  exports: [BillingService, SafepayService],
})
export class BillingModule {}
