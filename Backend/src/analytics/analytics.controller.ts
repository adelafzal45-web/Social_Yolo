import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller(['analytics', 'v1/analytics'])
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('posts/:postId/metrics')
  async recordMetrics(
    @Param('postId') postId: string,
    @Body() body: any,
  ) {
    return this.analyticsService.recordMetrics(postId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('posts/:postId/metrics')
  async getPostMetrics(@Param('postId') postId: string) {
    return this.analyticsService.getPostMetrics(postId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('brands/:brandId/overview')
  async getBrandOverview(@Param('brandId') brandId: string) {
    return this.analyticsService.getBrandOverview(brandId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('brands/:brandId/insights')
  async getBrandInsights(@Param('brandId') brandId: string) {
    return this.analyticsService.getBrandInsights(brandId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('brands/:brandId/insights/generate')
  async generateInsights(@Param('brandId') brandId: string) {
    return this.analyticsService.generateInsightsForBrand(brandId);
  }
}
