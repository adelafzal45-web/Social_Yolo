import { Injectable, Logger } from '@nestjs/common';
import { BrandProfile } from '../brands/entities/brand-profile.entity';
import { BrandInsight } from '../brands/entities/brand-insight.entity';
import { PlatformStrategyService, PlatformConfig } from './platform-strategy.service';

export class StructuredContentRequest {
  brandId!: string;
  platform!: string;
  contentType!: string; // 'Social Post' | 'Carousel' | 'Story' | 'Flyer' | 'Ad'
  goal!: string; // 'Awareness' | 'Engagement' | 'Sales' | 'Launch' | 'Educational'
  productName?: string;
  topic?: string;
  campaign?: string;
  audience?: string;
  contentPillar?: string;
  language?: string;
  tone?: string;
  variationsCount?: number;
  additionalNotes?: string;
}

export interface AssembledBrandContext {
  brandName: string;
  websiteUrl: string | null;
  industry: string;
  valueProposition: string;
  brandVoice: Record<string, any>;
  primaryColor: string;
  secondaryColors: string[];
  productDetails?: { name: string; description?: string; category?: string } | null;
  targetAudience: string;
  campaignContext?: string | null;
  platformStrategy: PlatformConfig;
  inspirationSignals?: Record<string, any> | null;
  performanceInsights?: string[] | null;
  structuredSystemPrompt: string;
  structuredUserPrompt: string;
}

@Injectable()
export class AiContextBuilderService {
  private readonly logger = new Logger(AiContextBuilderService.name);

  constructor(
    private readonly platformStrategy: PlatformStrategyService,
  ) {}

  /**
   * Assembles the multi-layered AI context with strict precedence order (Spec Section 40).
   */
  buildContext(
    brand: BrandProfile,
    insight: BrandInsight | null,
    request: StructuredContentRequest,
    inspirationSignals?: any,
    performanceInsights?: string[],
  ): AssembledBrandContext {
    const platformConfig = this.platformStrategy.getStrategy(request.platform);

    // 1. Core Brand Data (Priority 1: User-edited / verified)
    const brandName = brand.name || brand.brandName || 'Brand';
    const websiteUrl = brand.websiteUrl || null;
    const industry = brand.industry || brand.niche || 'General Business';
    const valueProposition =
      insight?.valueProposition ||
      brand.description ||
      brand.tagline ||
      'Quality and modern craftsmanship';

    // 2. Product Details
    let selectedProduct: any = null;
    if (request.productName && insight?.products) {
      selectedProduct = insight.products.find(
        (p) => p.name.toLowerCase() === request.productName!.toLowerCase(),
      ) || { name: request.productName };
    } else if (insight?.products && insight.products.length > 0) {
      selectedProduct = insight.products[0];
    }

    // 3. Audience
    const targetAudience =
      request.audience ||
      insight?.targetAudience?.[0]?.segment ||
      'Engaged consumers looking for quality solutions';

    // 4. Tone
    const tone =
      request.tone && request.tone !== 'Brand Default'
        ? request.tone
        : brand.tone || 'Modern & Warm';

    // 5. Build strict system instruction
    const systemPrompt = `You are SocialYolo's autonomous AI Content Intelligence Engine.
You write platform-optimized, high-performing social copy adhering strictly to the brand's verified identity.

NEVER ask the user for prompts. Use ONLY the provided structured brand context.
Generate compelling hooks, body copy, platform CTAs, and hashtags.

Output format MUST be valid JSON:
{
  "variations": [
    {
      "variationType": "Educational" | "Promotional" | "Storytelling" | "Conversational" | "Emotional",
      "hook": "Attention-grabbing first line (under 125 chars)",
      "caption": "Full social caption formatted for the target platform with spacing",
      "body": "Core message/body copy",
      "cta": "Platform-specific call to action",
      "hashtags": ["#tag1", "#tag2", "#tag3"],
      "visualDirection": {
        "style": "Visual style keywords",
        "composition": "Suggested layout and subject placement",
        "colorHarmony": "Hex or palette suggestion",
        "aspectRatio": "${platformConfig.recommendedAspectRatios[0]}"
      }
    }
  ]
}`;

    // 6. Build structured user prompt from context
    const userPromptParts: string[] = [
      `=== BRAND CONTEXT ===`,
      `Brand Name: ${brandName}`,
      `Website: ${websiteUrl || 'N/A'}`,
      `Industry: ${industry}`,
      `Value Proposition: ${valueProposition}`,
      `Brand Tone: ${tone}`,
      `Primary Color: ${brand.primaryColor || '#7c5cff'}`,
      ``,
      `=== CONTENT SPECIFICATIONS ===`,
      `Platform: ${platformConfig.name}`,
      `Content Type: ${request.contentType || 'Social Post'}`,
      `Marketing Goal: ${request.goal || 'Awareness'}`,
      `Language: ${request.language || 'English'}`,
      `Number of Variations to Generate: ${request.variationsCount || 3}`,
      selectedProduct ? `Featured Product: ${selectedProduct.name} (${selectedProduct.description || ''})` : `Topic/Focus: ${request.topic || 'General Brand Spotlight'}`,
      request.campaign ? `Campaign: ${request.campaign}` : '',
      request.contentPillar ? `Content Pillar: ${request.contentPillar}` : '',
      request.additionalNotes ? `Extra Directive: ${request.additionalNotes}` : '',
      `Target Audience: ${targetAudience}`,
      ``,
      `=== PLATFORM STRATEGY RULES ===`,
      `CTA Style: ${platformConfig.ctaStyle}`,
      `Hashtag Density: Maximum ${platformConfig.hashtagLimit} hashtags`,
      `Formatting: ${platformConfig.formattingRules.join('; ')}`,
    ];

    if (inspirationSignals) {
      userPromptParts.push(
        ``,
        `=== INSPIRATION STYLE SIGNALS ===`,
        `Aesthetic Reference: ${inspirationSignals.aesthetic || 'Editorial Minimalist'}`,
        `Lighting Mood: ${inspirationSignals.lighting || 'Diffused studio daylight'}`,
      );
    }

    if (performanceInsights && performanceInsights.length > 0) {
      userPromptParts.push(
        ``,
        `=== HISTORICAL PERFORMANCE LEARNING ===`,
        ...performanceInsights.map((insight) => `* ${insight}`),
      );
    }

    const userPrompt = userPromptParts.filter(Boolean).join('\n');

    return {
      brandName,
      websiteUrl,
      industry,
      valueProposition,
      brandVoice: brand.brandVoice || {},
      primaryColor: brand.primaryColor || '#7c5cff',
      secondaryColors: brand.secondaryColors || ['#e0aa4e'],
      productDetails: selectedProduct,
      targetAudience,
      campaignContext: request.campaign || null,
      platformStrategy: platformConfig,
      inspirationSignals,
      performanceInsights,
      structuredSystemPrompt: systemPrompt,
      structuredUserPrompt: userPrompt,
    };
  }
}
