import { Module } from '@nestjs/common';

import { ImageProcessingModule } from '../image-processing/image-processing.module';
import { PostsModule } from '../posts/posts.module';
import { GeminiService } from './gemini.service';
import { FeedbackService } from './feedback.service';
import { PollinationsService } from './providers/pollinations.service';
import { PostGeneratorController } from './post-generator.controller';
import { PostGeneratorService } from './post-generator.service';
import { EmbeddingsService } from './rag/embeddings.service';
import { PromptBuilderService } from './rag/prompt-builder.service';
import { RateLimitService } from './rate-limit.service';
import { RetrieverService } from './rag/retriever.service';

/**
 * AI Post Generator — Module 3 adds the RAG layer (embeddings,
 * retriever, prompt builder) on top of the Module 2 Gemini integration.
 */
@Module({
  imports: [ImageProcessingModule, PostsModule],
  controllers: [PostGeneratorController],
  providers: [
    GeminiService,
    PollinationsService,
    PostGeneratorService,
    EmbeddingsService,
    RetrieverService,
    PromptBuilderService,
    FeedbackService,
    RateLimitService,
  ],
})
export class PostGeneratorModule {}