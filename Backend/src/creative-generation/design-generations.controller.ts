import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiOperation, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  CreativeGenerationEngineService,
  StartStudioGenerationDto,
  StudioProgressEvent,
} from './creative-generation-engine.service';
import { AiDesignEditAction } from './services/structured-design.service';
import { PlatformConfigService } from '../design-platform/platform-config.service';

export class AiEditDto {
  action!: AiDesignEditAction;
  customCta?: string;
  customImage?: string;
}

export class AdaptPlatformDto {
  targetPlatform!: string;
}

export class ExportVariationDto {
  format?: 'png' | 'jpg' | 'webp';
  scale?: number;
  targetPlatform?: string;
  organizationId?: string;
}

export class SelectConceptDto {
  conceptId!: string;
}

@ApiTags('design-generations')
@Controller(['design-generations', 'v1/design-generations'])
export class DesignGenerationsController {
  constructor(
    private readonly generationEngine: CreativeGenerationEngineService,
    private readonly platformConfigService: PlatformConfigService,
  ) {}

  @Get('config')
  @ApiOperation({ summary: 'Get unified studio configuration (Meta objectives, creative types, export platforms)' })
  getStudioConfig() {
    return this.platformConfigService.getStudioConfig();
  }

  @Post()
  @ApiOperation({ summary: 'Start new AI-powered design generation run' })
  async createGeneration(@Body() dto: StartStudioGenerationDto) {
    const job = await this.generationEngine.startGeneration(dto);
    return {
      id: job.id,
      jobId: job.id,
      status: job.status,
      progressPct: job.progressPct,
      currentStageLabel: job.currentStageLabel,
      message: 'Design studio generation pipeline initialized.',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get status, pipeline stages, and variations of a generation run' })
  @ApiParam({ name: 'id', description: 'Generation run ID' })
  async getGeneration(@Param('id') id: string) {
    return this.generationEngine.getGeneration(id);
  }

  @Sse(':id/stream')
  @ApiOperation({ summary: 'Real-time Server-Sent Events (SSE) stream of 10-stage pipeline progress' })
  streamProgress(@Param('id') id: string): Observable<{ data: StudioProgressEvent }> {
    return this.generationEngine.getJobStream(id).pipe(
      map((event) => ({ data: event })),
    );
  }

  @Get(':id/concepts')
  @ApiOperation({ summary: 'Get the 3-4 synthesized creative concepts for review' })
  async getConcepts(@Param('id') id: string) {
    const concepts = await this.generationEngine.getConcepts(id);
    return {
      generationId: id,
      count: concepts.length,
      concepts,
    };
  }

  @Post(':id/select-concept')
  @ApiOperation({ summary: 'Select a concept archetype to proceed with' })
  async selectConcept(
    @Param('id') id: string,
    @Body() body: SelectConceptDto,
  ) {
    const selected = await this.generationEngine.selectConcept(id, body.conceptId);
    return {
      success: true,
      selectedVariation: selected,
    };
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Validate generation run or creative variation against 4 core criteria' })
  async validateDesign(@Param('id') id: string) {
    try {
      const gen = await this.generationEngine.getGeneration(id);
      const varId = gen.variations?.[0]?.id || id;
      const report = await this.generationEngine.validateVariation(varId);
      return { id, variationId: varId, report };
    } catch {
      const report = await this.generationEngine.validateVariation(id);
      return { id, variationId: id, report };
    }
  }

  @Post(':id/variation')
  @ApiOperation({ summary: 'Execute promptless AI action / generate design variation' })
  async applyVariation(
    @Param('id') id: string,
    @Body() body: AiEditDto,
  ) {
    let varId = id;
    try {
      const gen = await this.generationEngine.getGeneration(id);
      varId = gen.variations?.[0]?.id || id;
    } catch {}

    const updated = await this.generationEngine.applyAiEdit(
      varId,
      body.action,
      { customCta: body.customCta, customImage: body.customImage },
    );
    return {
      success: true,
      action: body.action,
      variation: updated,
    };
  }

  @Post(':id/adapt')
  @ApiOperation({ summary: 'Adapt design to target platform without regenerating from scratch' })
  async adaptDesign(
    @Param('id') id: string,
    @Body() body: AdaptPlatformDto,
  ) {
    let varId = id;
    try {
      const gen = await this.generationEngine.getGeneration(id);
      varId = gen.variations?.[0]?.id || id;
    } catch {}

    const result = await this.generationEngine.adaptVariation(
      varId,
      body.targetPlatform,
    );
    return {
      success: true,
      targetPlatform: body.targetPlatform,
      appliedAdjustments: result.appliedAdjustments,
      adaptedVariation: result.adaptedVariation,
    };
  }

  @Post('variations/:variationId/edit')
  @ApiOperation({
    summary:
      'Execute promptless AI design action (improve_design, make_more_minimal, make_more_premium, make_more_bold, change_layout, change_typography, replace_image, improve_contrast, use_brand_colors, generate_variation)',
  })
  async editVariation(
    @Param('variationId') variationId: string,
    @Body() body: AiEditDto,
  ) {
    const updated = await this.generationEngine.applyAiEdit(
      variationId,
      body.action,
      { customCta: body.customCta, customImage: body.customImage },
    );
    return {
      success: true,
      action: body.action,
      variation: updated,
    };
  }

  @Post('variations/:variationId/adapt')
  @ApiOperation({ summary: 'Adapt an existing design to another platform without regenerating from scratch' })
  async adaptVariation(
    @Param('variationId') variationId: string,
    @Body() body: AdaptPlatformDto,
  ) {
    const result = await this.generationEngine.adaptVariation(
      variationId,
      body.targetPlatform,
    );
    return {
      success: true,
      targetPlatform: body.targetPlatform,
      appliedAdjustments: result.appliedAdjustments,
      adaptedVariation: result.adaptedVariation,
    };
  }

  @Get('variations/:variationId/validation')
  @ApiOperation({ summary: 'Get automated design validation report (Content, Brand, Visual, Platform)' })
  async getValidationReport(@Param('variationId') variationId: string) {
    const report = await this.generationEngine.validateVariation(variationId);
    return {
      variationId,
      report,
    };
  }

  @Post('variations/:variationId/export')
  @ApiOperation({ summary: 'Generate high-resolution multi-format export (PNG, JPG, WebP) with platform adaptation and credit deduction' })
  async exportVariation(
    @Param('variationId') variationId: string,
    @Body() body: ExportVariationDto,
  ) {
    const exp = await this.generationEngine.exportVariation(
      variationId,
      body.format || 'png',
      body.scale || 1,
      body.targetPlatform,
      body.organizationId,
    );
    return {
      success: true,
      export: exp,
      downloadUrl: exp.exportUrl,
    };
  }

  @Post('variations/:variationId/approve')
  @ApiOperation({ summary: 'Approve variation and ingest into Visual RAG self-learning memory' })
  async approveVariation(@Param('variationId') variationId: string) {
    const approved = await this.generationEngine.approveVariation(variationId);
    return {
      success: true,
      message: 'Design approved and added to brand intelligence memory.',
      variation: approved,
    };
  }
}
