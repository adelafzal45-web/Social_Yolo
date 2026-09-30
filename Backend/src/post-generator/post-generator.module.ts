import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { BillingModule } from '../billing/billing.module';
import { BrandsModule } from '../brands/brands.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ImageProcessingModule } from '../image-processing/image-processing.module';
import { PostsModule } from '../posts/posts.module';
import { StyleReference } from '../style-references/entities/style-reference.entity';
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
 *
 * `StyleReference` is registered here because `RetrieverService` reads the
 * Style Reference Library alongside the post embeddings. The entity itself
 * lives in the style-references module, which imports *this* module.
 */
@Module({
  imports: [
    AuthModule,
    ImageProcessingModule,
    PostsModule,
    BillingModule,
    BrandsModule,
    NotificationsModule,
    TypeOrmModule.forFeature([StyleReference]),
  ],
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
  // Exported so the Style Reference Library can reuse the RAG trio without
  // duplicating providers (and without a circular module dependency).
  exports: [GeminiService, EmbeddingsService, RetrieverService, PromptBuilderService],
})
export class PostGeneratorModule {}
