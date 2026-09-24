import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { CreditsService } from './credits.service';

@ApiTags('credits')
@Controller('credits')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get('balance')
  @ApiOperation({
    summary: 'Get current credit balance, reserved credits, and limits',
  })
  async getBalance(@CurrentUser() user: AuthUser) {
    return this.creditsService.getBalance(user.organizationId);
  }

  @Post('top-up')
  @ApiOperation({ summary: 'Purchase additional credit pack' })
  async topUp(
    @CurrentUser() user: AuthUser,
    @Body() body: { amount: number; costCents?: number },
  ) {
    return this.creditsService.topUp(
      user.organizationId,
      body.amount,
      body.costCents,
    );
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List recent credit ledger transactions' })
  async getTransactions(
    @CurrentUser() user: AuthUser,
    @Query('limit') limit?: number,
  ) {
    return this.creditsService.getTransactions(
      user.organizationId,
      limit ? Number(limit) : 50,
    );
  }
}
