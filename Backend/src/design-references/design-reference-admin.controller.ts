import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreateDesignReferenceDto,
  DesignReferencesService,
} from './design-references.service';

@ApiTags('admin-design-references')
@Controller('admin/design-references')
export class DesignReferenceAdminController {
  constructor(private readonly referencesService: DesignReferencesService) {}

  @Get()
  @ApiOperation({ summary: 'Admin list all design references' })
  async adminList(
    @Query('industry') industry?: string,
    @Query('style') style?: string,
    @Query('limit') limit?: number,
  ) {
    return this.referencesService.findAll({
      industry,
      style,
      limit: limit ? Number(limit) : 50,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Add a new design reference with embeddings and tags' })
  async create(@Body() dto: CreateDesignReferenceDto) {
    return this.referencesService.createReference(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update reference metadata, tags, or quality score' })
  async update(
    @Param('id') id: string,
    @Body() updates: Partial<CreateDesignReferenceDto>,
  ) {
    return this.referencesService.updateReference(id, updates);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a design reference' })
  async remove(@Param('id') id: string) {
    return this.referencesService.deleteReference(id);
  }

  @Post('re-seed')
  @ApiOperation({ summary: 'Re-seed default curated references dataset' })
  async reSeed() {
    await this.referencesService.seedInitialReferences();
    return { success: true, message: 'Design references re-seeded' };
  }
}
