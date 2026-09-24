import { Injectable, Logger } from '@nestjs/common';
import { VectorSearchService } from './vector-search.service';
import { ReferenceRerankingService, RankedReference } from './reference-reranking.service';
import { DesignPatternExtractionService, ExtractedDesignPattern } from './design-pattern-extraction.service';
import { OriginalityEngineService, OriginalCreativeStrategy } from './originality-engine.service';
import { StructuredBrandIntelligence } from '../brand-intelligence/brand-intelligence.service';
import { EmbeddingsService } from '../post-generator/rag/embeddings.service';

export interface CreativeRAGRequest {
  brand: StructuredBrandIntelligence;
  brandEmbedding?: number[];
  platform: string;
  designType: string;
  objective: string;
  style: string;
  compositionPreference?: string;
  mood?: string;
  productName?: string;
  customHeadline?: string;
}

export interface CreativeRAGResult {
  retrievedReferences: Array<{
    id: string;
    title: string;
    source: string;
    imageUrl: string;
    similarityScore: number;
    finalRankScore: number;
  }>;
  extractedPatterns: ExtractedDesignPattern[];
  originalStrategy: OriginalCreativeStrategy;
}

@Injectable()
export class CreativeRAGService {
  private readonly logger = new Logger(CreativeRAGService.name);

  constructor(
    private readonly vectorSearch: VectorSearchService,
    private readonly rerankingService: ReferenceRerankingService,
    private readonly patternExtractor: DesignPatternExtractionService,
    private readonly originalityEngine: OriginalityEngineService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  /**
   * Complete Visual RAG Pipeline (Section 1 & 29):
   * Intent -> Embeddings -> Vector Search -> Reranking -> Pattern Extraction -> Originality Blend
   */
  async executeRAG(request: CreativeRAGRequest): Promise<CreativeRAGResult> {
    // 1. Synthesize Creative Intent Query
    const intentQueryText = [
      `Design Type: ${request.designType}`,
      `Objective: ${request.objective}`,
      `Style: ${request.style}`,
      `Platform: ${request.platform}`,
      `Industry: ${request.brand.industry}`,
      request.productName ? `Product: ${request.productName}` : '',
      request.customHeadline ? `Headline: ${request.customHeadline}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    // 2. Compute Intent Embedding
    let intentEmbedding: number[];
    try {
      intentEmbedding = await this.embeddingsService.embedText(intentQueryText);
    } catch {
      intentEmbedding = this.generateFallbackVector(intentQueryText, 768);
    }

    // 3. Multi-Vector Search with Metadata Filtering
    const candidates = await this.vectorSearch.searchSimilarReferences({
      intentEmbedding,
      brandEmbedding: request.brandEmbedding,
      platform: request.platform,
      designType: request.designType,
      industry: request.brand.industry,
      style: request.style,
      topK: 6,
    });

    this.logger.log(`Visual RAG: Retrieved ${candidates.length} candidates for style "${request.style}".`);

    // 4. Multi-Factor Reranking (Section 8)
    const ranked: RankedReference[] = this.rerankingService.rerank(
      candidates,
      {
        platform: request.platform,
        industry: request.brand.industry,
        style: request.style,
        designType: request.designType,
        objective: request.objective,
        brandColors: request.brand.visualIdentity.palette,
      },
      3,
    );

    // 5. Design Pattern Extraction (Section 7)
    const patterns = this.patternExtractor.extractPatterns(ranked);

    // 6. Originality Layer & Brand Adaptation (Section 20)
    const originalStrategy = this.originalityEngine.synthesizeOriginalStrategy(
      patterns,
      request.brand,
      {
        platform: request.platform,
        designType: request.designType,
        style: request.style,
        objective: request.objective,
        compositionPreference: request.compositionPreference,
      },
    );

    const retrievedReferences = ranked.map(({ scoredRef, finalScore }) => ({
      id: scoredRef.reference.id,
      title: scoredRef.reference.title,
      source: scoredRef.reference.source,
      imageUrl: scoredRef.reference.imageUrl,
      similarityScore: parseFloat(scoredRef.combinedSimilarity.toFixed(3)),
      finalRankScore: parseFloat(finalScore.toFixed(3)),
    }));

    return {
      retrievedReferences,
      extractedPatterns: patterns,
      originalStrategy,
    };
  }

  private generateFallbackVector(text: string, dims: number = 768): number[] {
    const vec = new Array(dims).fill(0);
    const lower = text.toLowerCase();
    for (let i = 0; i < lower.length; i++) {
      const code = lower.charCodeAt(i);
      vec[i % dims] += (code % 31) / 31;
    }
    const norm = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0)) || 1;
    return vec.map((v) => parseFloat((v / norm).toFixed(4)));
  }
}
