import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { AIRouterService } from './ai-router.service';
import { RAGService } from './rag.service';
import { GenerateCopyPrompt } from './interfaces/ai-provider.interface';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AIController {
  constructor(
    private readonly aiRouter: AIRouterService,
    private readonly ragService: RAGService,
  ) {}

  @Post('generate-copy')
  @ApiOperation({
    summary: 'Generate high-converting ad copy via multi-model router',
  })
  async generateCopy(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      prompt: GenerateCopyPrompt;
      provider?: string;
      brandId?: string;
    },
  ) {
    let ragContext: string[] = [];
    if (body.brandId) {
      ragContext = await this.ragService.retrieveContext(
        user.organizationId,
        body.brandId,
        body.prompt.occasion || body.prompt.style || 'ad',
      );
    }

    const mergedPrompt: GenerateCopyPrompt = {
      ...body.prompt,
      ragContext,
    };

    return this.aiRouter.generateCopy(
      user.organizationId,
      mergedPrompt,
      body.provider || 'gemini',
      user.id,
    );
  }

  @Post('rag/index')
  @ApiOperation({
    summary: 'Index brand guidelines or specs into RAG vector store',
  })
  async indexDocument(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      brandId: string;
      title: string;
      contentText: string;
      sourceType?: 'website' | 'guidelines' | 'product_spec' | 'campaign';
    },
  ) {
    return this.ragService.indexDocument(
      user.organizationId,
      body.brandId,
      body.title,
      body.contentText,
      body.sourceType,
    );
  }

  @Post('rag/query')
  @ApiOperation({ summary: 'Semantic search against brand knowledge base' })
  async queryRAG(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      brandId: string;
      query: string;
      topK?: number;
    },
  ) {
    return this.ragService.retrieveContext(
      user.organizationId,
      body.brandId,
      body.query,
      body.topK || 3,
    );
  }

  @Get('telemetry')
  @ApiOperation({
    summary: 'View recent AI model execution telemetry and latency',
  })
  async getTelemetry(
    @CurrentUser() user: AuthUser,
    @Query('limit') limit?: number,
  ) {
    return this.aiRouter.getRecentLogs(
      user.organizationId,
      limit ? Number(limit) : 20,
    );
  }
}
