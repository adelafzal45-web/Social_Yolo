import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIUsageLog, RAGChunk, RAGDocument } from '../database/entities';
import { GeminiProvider } from './providers/gemini.provider';
import { GrokProvider } from './providers/grok.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { AIRouterService } from './ai-router.service';
import { RAGService } from './rag.service';
import { AIController } from './ai.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AIUsageLog, RAGDocument, RAGChunk])],
  controllers: [AIController],
  providers: [
    GeminiProvider,
    GrokProvider,
    OpenAIProvider,
    ClaudeProvider,
    AIRouterService,
    RAGService,
  ],
  exports: [AIRouterService, RAGService],
})
export class AIModule {}
