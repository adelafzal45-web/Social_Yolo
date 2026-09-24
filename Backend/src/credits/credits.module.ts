import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CreditAccount,
  CreditTransaction,
  Invoice,
  Organization,
} from '../database/entities';
import { CreditsService } from './credits.service';
import { CreditsController } from './credits.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CreditAccount,
      CreditTransaction,
      Organization,
      Invoice,
    ]),
  ],
  controllers: [CreditsController],
  providers: [CreditsService],
  exports: [CreditsService],
})
export class CreditsModule {}
