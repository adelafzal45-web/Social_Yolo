import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { User } from '../auth/entities/user.entity';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BillingService } from './billing.service';

class MockSubscribeDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;
}

/**
 * Usage/billing endpoints. Guarded — requires a Bearer JWT.
 *
 * The subscribe/cancel endpoints are a MOCK payment flow so the whole
 * free-trial → paywall → paid journey can be tested without Stripe keys.
 * Going live: swap `POST /billing/subscribe` for a Stripe Checkout Session
 * creation and flip the user to Pro inside the webhook handler
 * (see STRIPE_INTEGRATION.md).
 */
@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('usage')
  @ApiOperation({
    summary:
      'Current plan + remaining free generations (drives the UI credit counter).',
  })
  usage(@CurrentUser() user: User) {
    return this.billingService.usage(user);
  }

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'MOCK subscription: activates Pro immediately. Replace with Stripe Checkout when going live.',
  })
  async subscribe(@CurrentUser() user: User, @Body() dto: MockSubscribeDto) {
    const updated = await this.billingService.activateMockSubscription(
      user,
      dto.days ?? 30,
    );

    return this.billingService.usage(updated);
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel the subscription (back to the free tier).' })
  async cancel(@CurrentUser() user: User) {
    const updated = await this.billingService.cancelSubscription(user);
    return this.billingService.usage(updated);
  }
}
