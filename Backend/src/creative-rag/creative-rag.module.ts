import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DesignReference } from '../design-references/entities/design-reference.entity';
import { DesignReferenceEmbedding } from '../design-references/entities/design-reference-embedding.entity';
import { VectorSearchService } from './vector-search.service';
import { ReferenceRerankingService } from './reference-reranking.service';
import { DesignPatternExtractionService } from './design-pattern-extraction.service';
import { OriginalityEngineService } from './originality-engine.service';
import { CreativeRAGService } from './creative-rag.service';
import { EmbeddingsService } from '../post-generator/rag/embeddings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DesignReference, DesignReferenceEmbedding]),
  ],
  providers: [
    VectorSearchService,
    ReferenceRerankingService,
    DesignPatternExtractionService,
    OriginalityEngineService,
    CreativeRAGService,
    EmbeddingsService,
  ],
  exports: [CreativeRAGService, VectorSearchService, OriginalityEngineService],
})
export class CreativeRAGModule {}
