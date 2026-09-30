import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

class TopupDto {
  credits!: number;
  packTitle!: string;
}

@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get current plan and credit transaction history' })
  @ApiResponse({
    status: 200,
    description: 'Billing summary for authenticated user.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getSummary(@CurrentUser('id') userId: string) {
    return this.billingService.getSummary(userId);
  }

  @Post('topup')
  @ApiOperation({ summary: 'Simulate credit top-up pack purchase' })
  @ApiResponse({
    status: 200,
    description: 'Credits successfully added to authenticated user.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async topup(@Body() dto: TopupDto, @CurrentUser('id') userId: string) {
    return this.billingService.topupCredits(
      userId,
      dto.credits || 50,
      dto.packTitle || 'Credit Pack',
    );
  }
}
