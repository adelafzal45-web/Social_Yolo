import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DesignReference } from '../design-references/entities/design-reference.entity';
import { DesignReferenceEmbedding } from '../design-references/entities/design-reference-embedding.entity';

export interface VectorSearchQuery {
  intentEmbedding: number[];
  brandEmbedding?: number[];
  platform?: string;
  designType?: string;
  industry?: string;
  style?: string;
  aspectRatio?: string;
  objective?: string;
  topK?: number;
}

export interface ScoredReference {
  reference: DesignReference;
  semanticSimilarity: number;
  visualSimilarity: number;
  combinedSimilarity: number;
}

@Injectable()
export class VectorSearchService {
  private readonly logger = new Logger(VectorSearchService.name);

  constructor(
    @InjectRepository(DesignReference)
    private readonly referenceRepo: Repository<DesignReference>,
    @InjectRepository(DesignReferenceEmbedding)
    private readonly embeddingRepo: Repository<DesignReferenceEmbedding>,
  ) {}

  /**
   * Performs multi-vector search with metadata filtering.
   * Computes cosine similarity across semantic and visual embeddings.
   */
  async searchSimilarReferences(query: VectorSearchQuery): Promise<ScoredReference[]> {
    const topK = query.topK || 5;

    // 1. Fetch active references with embeddings and patterns
    const qb = this.referenceRepo.createQueryBuilder('ref')
      .innerJoinAndSelect('ref.embeddings', 'emb')
      .leftJoinAndSelect('ref.patterns', 'pat')
      .where('ref.isActive = :isActive', { isActive: true });

    // 2. Pre-filter by metadata where appropriate
    if (query.platform) {
      qb.andWhere('(ref.platform ILIKE :platform OR ref.platform IS NULL)', {
        platform: `%${query.platform}%`,
      });
    }

    const rows = await qb.getMany();
    if (rows.length === 0) {
      // Fallback: fetch without platform constraint
      const fallbackRows = await this.referenceRepo.find({
        relations: ['embeddings', 'patterns'],
        take: 20,
      });
      return this.scoreRows(fallbackRows, query).slice(0, topK);
    }

    return this.scoreRows(rows, query).slice(0, topK);
  }

  private scoreRows(rows: DesignReference[], query: VectorSearchQuery): ScoredReference[] {
    const scored: ScoredReference[] = [];

    for (const ref of rows) {
      const emb = ref.embeddings?.[0];
      if (!emb) continue;

      let semSim = 0;
      let visSim = 0;

      if (emb.semanticEmbedding && emb.semanticEmbedding.length > 0) {
        semSim = this.cosineSimilarity(query.intentEmbedding, emb.semanticEmbedding);
      }

      if (emb.visualEmbedding && emb.visualEmbedding.length > 0) {
        const targetVis = query.brandEmbedding && query.brandEmbedding.length > 0
          ? query.brandEmbedding
          : query.intentEmbedding;
        visSim = this.cosineSimilarity(targetVis, emb.visualEmbedding);
      }

      // 60% semantic intent similarity + 40% visual aesthetic similarity
      const combined = semSim * 0.6 + visSim * 0.4;

      scored.push({
        reference: ref,
        semanticSimilarity: semSim,
        visualSimilarity: visSim,
        combinedSimilarity: combined,
      });
    }

    return scored.sort((a, b) => b.combinedSimilarity - a.combinedSimilarity);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length === 0 || b.length === 0) return 0;
    const len = Math.min(a.length, b.length);
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
