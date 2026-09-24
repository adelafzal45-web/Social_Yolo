import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandProfile } from '../brands/entities/brand-profile.entity';
import { BrandInsight } from '../brands/entities/brand-insight.entity';
import { BrandEmbedding } from './entities/brand-embedding.entity';
import { EmbeddingsService } from '../post-generator/rag/embeddings.service';

export interface StructuredBrandIntelligence {
  brandId: string;
  brandName: string;
  tagline: string | null;
  websiteUrl: string | null;
  industry: string;
  subIndustry: string | null;
  description: string | null;
  visualIdentity: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    palette: string[];
    fontHeading: string;
    fontBody: string;
    logoUrl: string | null;
    faviconUrl: string | null;
  };
  personality: {
    tone: string;
    brandVoice: Record<string, any>;
    moodAdjectives: string[];
  };
  audience: {
    segments: any[];
    valueProposition: string | null;
    painPoints: string[];
    benefits: string[];
  };
  products: any[];
  services: any[];
}

export interface SmartDefaultsResult {
  recommendedStyle: string;
  recommendedComposition: string;
  recommendedMood: string;
  recommendedCta: string;
  recommendedAspect: string;
  recommendedColorStrategy: string;
  reasoning: string;
}

@Injectable()
export class BrandIntelligenceService {
  private readonly logger = new Logger(BrandIntelligenceService.name);

  constructor(
    @InjectRepository(BrandProfile)
    private readonly brandRepo: Repository<BrandProfile>,
    @InjectRepository(BrandInsight)
    private readonly insightRepo: Repository<BrandInsight>,
    @InjectRepository(BrandEmbedding)
    private readonly embeddingRepo: Repository<BrandEmbedding>,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async getBrandIntelligence(brandId: string): Promise<StructuredBrandIntelligence> {
    const brand = await this.brandRepo.findOne({
      where: { id: brandId },
      relations: ['insight'],
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${brandId} not found.`);
    }

    const insight = brand.insight;
    const palette = [
      brand.primaryColor,
      brand.secondaryColor,
      brand.accentColor,
      ...(brand.secondaryColors || []),
    ].filter(Boolean);

    const voice = brand.brandVoice || insight?.brandVoice || {};
    const toneString = brand.tone || 'Modern, Premium';

    return {
      brandId: brand.id,
      brandName: brand.brandName || brand.name || 'Brand',
      tagline: brand.tagline || null,
      websiteUrl: brand.websiteUrl || null,
      industry: brand.industry || brand.niche || 'General Commercial',
      subIndustry: brand.subIndustry || null,
      description: brand.description || insight?.companyDescription || null,
      visualIdentity: {
        primaryColor: brand.primaryColor || '#7c5cff',
        secondaryColor: brand.secondaryColor || '#e0aa4e',
        accentColor: brand.accentColor || '#3ecf8e',
        palette: palette.length ? palette : ['#7c5cff', '#e0aa4e', '#3ecf8e'],
        fontHeading: brand.fontHeading || 'Canela',
        fontBody: brand.fontBody || 'Söhne',
        logoUrl: brand.logoUrl || null,
        faviconUrl: brand.faviconUrl || null,
      },
      personality: {
        tone: toneString,
        brandVoice: voice,
        moodAdjectives: Array.isArray(voice.tone) ? voice.tone : [toneString],
      },
      audience: {
        segments: insight?.targetAudience || [],
        valueProposition: insight?.valueProposition || null,
        painPoints: insight?.painPoints || [],
        benefits: insight?.benefits || [],
      },
      products: insight?.products || [],
      services: insight?.services || [],
    };
  }

  async getOrCreateBrandEmbedding(brandId: string): Promise<number[]> {
    const existing = await this.embeddingRepo.findOne({
      where: { brandId },
      order: { createdAt: 'DESC' },
    });

    if (existing && existing.embedding && existing.embedding.length > 0) {
      return existing.embedding;
    }

    const intel = await this.getBrandIntelligence(brandId);
    const summaryText = [
      `Brand: ${intel.brandName}`,
      `Industry: ${intel.industry}`,
      `Tone: ${intel.personality.tone}`,
      `Fonts: ${intel.visualIdentity.fontHeading}, ${intel.visualIdentity.fontBody}`,
      `Colors: ${intel.visualIdentity.palette.join(', ')}`,
      intel.description ? `Description: ${intel.description}` : '',
      intel.audience.valueProposition ? `Value: ${intel.audience.valueProposition}` : '',
    ]
      .filter(Boolean)
      .join('. ');

    let vector: number[];
    try {
      vector = await this.embeddingsService.embedText(summaryText);
    } catch {
      // Deterministic fallback vector
      vector = this.generateFallbackVector(summaryText, 768);
    }

    const record = this.embeddingRepo.create({
      brandId,
      embedding: vector,
      sourceText: summaryText,
      embeddingType: 'combined',
    });
    await this.embeddingRepo.save(record);

    return vector;
  }

  getSmartDefaults(
    intel: StructuredBrandIntelligence,
    platform: string = 'Instagram Post',
    designType: string = 'creative',
    objective: string = 'Promote Product',
  ): SmartDefaultsResult {
    const ind = (intel.industry || '').toLowerCase();
    const plat = platform.toLowerCase();
    const obj = objective.toLowerCase();

    let recommendedStyle = 'Premium';
    if (ind.includes('tech') || ind.includes('software') || ind.includes('saas')) {
      recommendedStyle = 'Futuristic';
    } else if (ind.includes('fashion') || ind.includes('apparel') || ind.includes('editorial')) {
      recommendedStyle = 'Editorial';
    } else if (ind.includes('food') || ind.includes('beverage') || ind.includes('wellness')) {
      recommendedStyle = 'Vibrant';
    } else if (ind.includes('luxury') || ind.includes('jewelry') || ind.includes('watch')) {
      recommendedStyle = 'Luxury';
    } else if (ind.includes('corporate') || ind.includes('finance') || ind.includes('legal')) {
      recommendedStyle = 'Corporate';
    }

    let recommendedComposition = 'Product Focus';
    if (obj.includes('lead') || obj.includes('service')) {
      recommendedComposition = 'Person Focus';
    } else if (obj.includes('quote') || obj.includes('educational')) {
      recommendedComposition = 'Typography Focus';
    } else if (obj.includes('awareness') || obj.includes('lifestyle')) {
      recommendedComposition = 'Editorial';
    }

    let recommendedMood = 'Premium';
    if (recommendedStyle === 'Bold' || obj.includes('sales')) {
      recommendedMood = 'Energetic';
    } else if (recommendedStyle === 'Corporate') {
      recommendedMood = 'Trustworthy';
    } else if (recommendedStyle === 'Minimal') {
      recommendedMood = 'Calm';
    }

    let recommendedCta = 'Shop Now';
    if (obj.includes('service') || obj.includes('book')) {
      recommendedCta = 'Book Now';
    } else if (obj.includes('lead') || obj.includes('sign up')) {
      recommendedCta = 'Sign Up';
    } else if (obj.includes('educate') || obj.includes('awareness')) {
      recommendedCta = 'Learn More';
    } else if (obj.includes('app')) {
      recommendedCta = 'Download';
    }

    let recommendedAspect = '1:1';
    if (plat.includes('story') || plat.includes('reel') || plat.includes('tiktok')) {
      recommendedAspect = '9:16';
    } else if (plat.includes('instagram') && !plat.includes('story')) {
      recommendedAspect = '4:5';
    } else if (plat.includes('pin') || plat.includes('pinterest')) {
      recommendedAspect = '3:4';
    } else if (plat.includes('facebook') || plat.includes('twitter') || plat.includes('x')) {
      recommendedAspect = '16:9';
    }

    const reasoning = `Recommended ${recommendedStyle} aesthetic with ${recommendedComposition} layout for ${intel.industry} on ${platform} prioritizing ${objective}.`;

    return {
      recommendedStyle,
      recommendedComposition,
      recommendedMood,
      recommendedCta,
      recommendedAspect,
      recommendedColorStrategy: `${intel.visualIdentity.primaryColor} dominant with ${intel.visualIdentity.accentColor} CTA button pop`,
      reasoning,
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
