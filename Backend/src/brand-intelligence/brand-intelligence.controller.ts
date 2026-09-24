import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BrandIntelligenceService } from './brand-intelligence.service';

@ApiTags('brand-intelligence')
@Controller('brand-intelligence')
export class BrandIntelligenceController {
  constructor(private readonly brandIntelligence: BrandIntelligenceService) {}

  @Get(':brandId')
  @ApiOperation({ summary: 'Get structured brand intelligence and visual DNA' })
  async getBrandIntelligence(@Param('brandId') brandId: string) {
    return this.brandIntelligence.getBrandIntelligence(brandId);
  }

  @Post(':brandId/smart-defaults')
  @ApiOperation({ summary: 'Get AI recommended style, composition, mood, and CTA' })
  async getSmartDefaults(
    @Param('brandId') brandId: string,
    @Body() body: { platform?: string; designType?: string; objective?: string },
  ) {
    const intel = await this.brandIntelligence.getBrandIntelligence(brandId);
    return this.brandIntelligence.getSmartDefaults(
      intel,
      body.platform || 'Instagram Post',
      body.designType || 'creative',
      body.objective || 'Promote Product',
    );
  }
}
