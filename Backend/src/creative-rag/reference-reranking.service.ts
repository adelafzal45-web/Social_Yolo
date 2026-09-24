import { Injectable, Logger } from '@nestjs/common';
import { ScoredReference } from './vector-search.service';

export interface RerankingCriteria {
  platform: string;
  industry: string;
  style: string;
  designType: string;
  objective: string;
  brandColors?: string[];
}

export interface RankedReference {
  scoredRef: ScoredReference;
  finalScore: number;
  scoreBreakdown: {
    vectorSimilarity: number;
    platformRelevance: number;
    industryRelevance: number;
    styleRelevance: number;
    designQuality: number;
    brandCompatibility: number;
  };
}

@Injectable()
export class ReferenceRerankingService {
  private readonly logger = new Logger(ReferenceRerankingService.name);

  rerank(
    candidates: ScoredReference[],
    criteria: RerankingCriteria,
    topN: number = 3,
  ): RankedReference[] {
    const ranked: RankedReference[] = [];

    for (const item of candidates) {
      const ref = item.reference;

      // 1. Vector Similarity (0..1)
      const vectorSim = Math.max(0, Math.min(1, item.combinedSimilarity));

      // 2. Platform Relevance (0..1)
      let platformRel = 0.5;
      if (ref.platform) {
        const rp = ref.platform.toLowerCase();
        const cp = criteria.platform.toLowerCase();
        if (rp === cp) platformRel = 1.0;
        else if (rp.includes(cp) || cp.includes(rp)) platformRel = 0.8;
      }

      // 3. Industry Relevance (0..1)
      let industryRel = 0.5;
      if (ref.industry && criteria.industry) {
        const ri = ref.industry.toLowerCase();
        const ci = criteria.industry.toLowerCase();
        if (ri === ci) industryRel = 1.0;
        else if (ri.includes(ci) || ci.includes(ri)) industryRel = 0.8;
      }

      // 4. Style Relevance (0..1)
      let styleRel = 0.5;
      if (ref.style && criteria.style) {
        const rs = ref.style.toLowerCase();
        const cs = criteria.style.toLowerCase();
        if (rs === cs) styleRel = 1.0;
        else if (rs.includes(cs) || cs.includes(rs)) styleRel = 0.8;
      }

      // 5. Design Quality (0..1)
      const designQuality = Math.max(0, Math.min(1, (ref.qualityScore || 85) / 100));

      // 6. Brand Compatibility (0..1)
      let brandCompat = 0.6;
      if (criteria.brandColors && criteria.brandColors.length > 0 && ref.colorPalette) {
        // Higher compatibility if references have harmonious or neutral backdrops
        brandCompat = 0.8;
      }

      // Weighted Multi-Factor Score Formula (Section 8)
      // Vector Similarity: 35%
      // Platform Relevance: 15%
      // Industry Relevance: 15%
      // Style Relevance: 15%
      // Design Quality: 10%
      // Brand Compatibility: 10%
      const finalScore =
        vectorSim * 0.35 +
        platformRel * 0.15 +
        industryRel * 0.15 +
        styleRel * 0.15 +
        designQuality * 0.10 +
        brandCompat * 0.10;

      ranked.push({
        scoredRef: item,
        finalScore,
        scoreBreakdown: {
          vectorSimilarity: vectorSim,
          platformRelevance: platformRel,
          industryRelevance: industryRel,
          styleRelevance: styleRel,
          designQuality,
          brandCompatibility: brandCompat,
        },
      });
    }

    return ranked.sort((a, b) => b.finalScore - a.finalScore).slice(0, topN);
  }
}
