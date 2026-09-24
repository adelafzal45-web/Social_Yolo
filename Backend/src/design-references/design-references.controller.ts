import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DesignReferencesService } from './design-references.service';

@ApiTags('design-references')
@Controller('design-references')
export class DesignReferencesController {
  constructor(private readonly referencesService: DesignReferencesService) {}

  @Get()
  @ApiOperation({ summary: 'List and filter active visual design references' })
  @ApiQuery({ name: 'industry', required: false })
  @ApiQuery({ name: 'style', required: false })
  @ApiQuery({ name: 'platform', required: false })
  @ApiQuery({ name: 'designType', required: false })
  @ApiQuery({ name: 'minQualityScore', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('industry') industry?: string,
    @Query('style') style?: string,
    @Query('platform') platform?: string,
    @Query('designType') designType?: string,
    @Query('minQualityScore') minQualityScore?: number,
    @Query('limit') limit?: number,
  ) {
    return this.referencesService.findAll({
      industry,
      style,
      platform,
      designType,
      minQualityScore: minQualityScore ? Number(minQualityScore) : undefined,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single visual design reference with full pattern details' })
  async findOne(@Param('id') id: string) {
    return this.referencesService.findOne(id);
  }
}
