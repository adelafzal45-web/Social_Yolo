import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Headers,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateCheckoutDto, VerifyPaymentDto } from './dto/billing.dto';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('summary')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current plan, subscription status, and credit history' })
  @ApiResponse({
    status: 200,
    description: 'Billing summary for authenticated user.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getSummary(@CurrentUser('id') userId: string) {
    return this.billingService.getSummary(userId);
  }

  @Get('subscription')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get active subscription for authenticated user' })
  async getSubscription(@CurrentUser('id') userId: string) {
    return this.billingService.getSubscription(userId);
  }

  @Post('safepay/checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a SafePay payment checkout session' })
  @ApiResponse({
    status: 200,
    description: 'Returns SafePay checkout redirect URL and tracking token.',
  })
  async createSafePayCheckout(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.billingService.createSafePayCheckout(userId, dto);
  }

  @Post('safepay/verify')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify completed SafePay payment server-side' })
  @ApiResponse({
    status: 200,
    description: 'Payment verified and subscription/credits activated.',
  })
  async verifySafePayPayment(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.billingService.verifySafePayPayment(userId, dto);
  }

  @Post('safepay/webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'SafePay webhook callback handler with HMAC signature validation' })
  async handleSafePayWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-sfpy-signature') signature?: string,
    @Headers('x-sfpy-timestamp') timestamp?: string,
  ) {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const sig = signature || (req.headers['x-sfpy-signature'] as string) || (req.headers['X-SFPY-SIGNATURE'] as string);
    const ts = timestamp || (req.headers['x-sfpy-timestamp'] as string) || (req.headers['X-SFPY-TIMESTAMP'] as string);

    return this.billingService.handleSafePayWebhook(rawBody, sig, ts);
  }

  @Post('subscription/cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel current active subscription at end of billing cycle' })
  async cancelSubscription(@CurrentUser('id') userId: string) {
    return this.billingService.cancelSubscription(userId);
  }

  @Post('topup')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Deprecated: Redirects users to real SafePay payment checkout' })
  async topup(@Body() dto: any, @CurrentUser('id') userId: string) {
    // Prevent unverified free credit top-ups
    throw new BadRequestException(
      'Direct simulated top-ups are disabled in production. Please initiate checkout via POST /api/billing/safepay/checkout.',
    );
  }
}
