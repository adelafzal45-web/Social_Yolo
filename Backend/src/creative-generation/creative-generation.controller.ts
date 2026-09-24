import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  Sse,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable, map } from 'rxjs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreativeGenerationEngineService,
  StartStudioGenerationDto,
  StudioProgressEvent,
} from './creative-generation-engine.service';

@ApiTags('creative-generation')
@Controller('creative-generation')
export class CreativeGenerationController {
  constructor(
    private readonly generationEngine: CreativeGenerationEngineService,
  ) {}

  @Post('generate')
  @ApiOperation({ summary: 'Launch AI Creative Studio multi-variation generation' })
  async generate(@Body() dto: StartStudioGenerationDto) {
    const job = await this.generationEngine.startGeneration(dto);
    return {
      jobId: job.id,
      status: job.status,
      progressPct: job.progressPct,
      message: 'Creative Studio generation pipeline initialized.',
    };
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get current generation job status and variations' })
  async getStatus(@Param('id') id: string) {
    return this.generationEngine.getGeneration(id);
  }

  @Sse('jobs/:id/stream')
  @ApiOperation({ summary: 'Subscribe to real-time 10-stage generation SSE stream' })
  streamProgress(@Param('id') id: string): Observable<{ data: StudioProgressEvent }> {
    return this.generationEngine.getJobStream(id).pipe(
      map((event) => ({ data: event })),
    );
  }

  @Post('variations/:variationId/refine')
  @ApiOperation({ summary: 'Button-driven design refinement without prompt engineering' })
  async refine(
    @Param('variationId') variationId: string,
    @Body() body: { action: any; customCta?: string },
  ) {
    return this.generationEngine.refineVariation(variationId, body.action, body.customCta);
  }
}
