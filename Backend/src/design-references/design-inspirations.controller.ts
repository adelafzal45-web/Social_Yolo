import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DesignReferencesService, CreateDesignReferenceDto } from './design-references.service';

export class ExtractFeaturesDto {
  imageUrl!: string;
}

export class SaveToBoardDto {
  referenceId!: string;
  boardName?: string;
  userId?: string;
}

export class EmbedInspirationDto {
  text!: string;
  visualText?: string;
}

@ApiTags('design-inspirations')
@Controller(['design-inspirations', 'v1/design-inspirations'])
export class DesignInspirationsController {
  constructor(private readonly referencesService: DesignReferencesService) {}

  @Post('index')
  @ApiOperation({ summary: 'Index new design reference into inspiration library and vector store' })
  async indexReference(@Body() dto: CreateDesignReferenceDto) {
    const created = await this.referencesService.indexReference(dto);
    return {
      success: true,
      message: 'Design reference indexed successfully.',
      reference: created,
    };
  }

  @Post('embed')
  @ApiOperation({ summary: 'Compute visual and semantic vector embeddings for reference or query' })
  async embedInspiration(@Body() dto: EmbedInspirationDto) {
    return this.referencesService.embedReference(dto.text, dto.visualText);
  }

  @Get()
  @ApiOperation({
    summary:
      'Search/list design inspirations across sources (Pinterest, Behance, internal library)',
  })
  @ApiQuery({ name: 'query', required: false })
  @ApiQuery({ name: 'source', required: false, enum: ['all', 'pinterest', 'behance', 'internal'] })
  @ApiQuery({ name: 'industry', required: false })
  @ApiQuery({ name: 'style', required: false })
  @ApiQuery({ name: 'platform', required: false })
  @ApiQuery({ name: 'designType', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async search(
    @Query('query') query?: string,
    @Query('source') source?: string,
    @Query('industry') industry?: string,
    @Query('style') style?: string,
    @Query('platform') platform?: string,
    @Query('designType') designType?: string,
    @Query('limit') limit?: number,
  ) {
    return this.referencesService.searchInspirations({
      query,
      source,
      industry,
      style,
      platform,
      designType,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get curated trending visual designs' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTrending(@Query('limit') limit?: number) {
    return this.referencesService.getTrending(limit ? Number(limit) : 12);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inspiration details with full extracted design features' })
  async findOne(@Param('id') id: string) {
    return this.referencesService.findOne(id);
  }

  @Post('extract')
  @ApiOperation({ summary: 'Extract design features from an image URL or reference asset' })
  async extractFeatures(@Body() body: ExtractFeaturesDto) {
    const features = await this.referencesService.extractFeatures(body.imageUrl);
    return {
      imageUrl: body.imageUrl,
      extractedFeatures: features,
    };
  }

  @Post('save')
  @ApiOperation({ summary: 'Save design reference to user or project inspiration board' })
  async saveToBoard(@Body() body: SaveToBoardDto) {
    return this.referencesService.saveToBoard(body);
  }
}
