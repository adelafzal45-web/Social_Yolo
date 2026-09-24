import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentConcept } from './entities/content-concept.entity';
import { BrandsService } from '../brands/brands.service';
import { AiGeneration } from './entities/ai-generation.entity';

@Injectable()
export class ContentConceptsService {
  private readonly logger = new Logger(ContentConceptsService.name);

  private get model(): string {
    return (process.env.GEMINI_MODEL || process.env.GEMINI_TEXT_MODEL || 'gemini-3.6-flash').replace(/^models\//i, '');
  }

  constructor(
    @InjectRepository(ContentConcept)
    private readonly conceptRepo: Repository<ContentConcept>,
    @InjectRepository(AiGeneration)
    private readonly aiGenRepo: Repository<AiGeneration>,
    private readonly brandsService: BrandsService,
  ) {}

  /**
   * Autonomously generates creative campaign concepts from structured brand DNA (Spec Section 24).
   */
  async generateConcepts(
    userId: string,
    brandId: string,
    options?: { campaignId?: string; pillarId?: string; platform?: string },
  ): Promise<ContentConcept[]> {
    const brand = await this.brandsService.getBrandById(userId, brandId);
    const insight = await this.brandsService.getInsights(userId, brandId);

    const brandName = brand.name || brand.brandName || 'Brand';
    const industry = brand.industry || brand.niche || 'Business';
    const products = insight?.products || [];
    const audience = insight?.targetAudience?.[0]?.segment || 'Target Audience';
    const primaryColor = brand.primaryColor || '#7c5cff';

    const startTime = Date.now();
    const apiKey = process.env.GEMINI_API_KEY;

    let generatedCards: any[] = [];

    if (apiKey && apiKey.trim().length > 0) {
      try {
        const systemPrompt = `You are a high-level creative brand strategist.
Generate 3 distinct creative content concept ideas for social media.
NO PROMPT WRITING REQUIRED. Use the brand facts.

Output format MUST be valid JSON:
{
  "concepts": [
    {
      "title": "Short punchy concept title",
      "concept": "1-2 sentence core concept explanation",
      "hook": "Scroll-stopping first line hook",
      "angle": "Educational" | "Contrarian" | "Storytelling" | "Behind the Scenes" | "Product Spotlight",
      "visualDirection": {
        "style": "Editorial Minimal / Bold Studio / Dynamic Lifestyle",
        "aspectRatio": "1:1",
        "colorHarmony": "${primaryColor}"
      },
      "platforms": ["instagram", "linkedin"]
    }
  ]
}`;

        const userPrompt = `Brand: ${brandName}
Industry: ${industry}
Value Proposition: ${insight?.valueProposition || brand.description || 'Quality and innovation'}
Key Product: ${products[0]?.name || 'Flagship Offering'}
Audience: ${audience}`;

        const model = this.model;
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.7,
              },
            }),
          },
        );

        if (res.ok) {
          const data: any = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed.concepts)) {
              generatedCards = parsed.concepts;
            }
          }
        }
      } catch (err: any) {
        this.logger.warn(`AI concept generation warning: ${err.message}. Using deterministic strategy.`);
      }
    }

    // High quality deterministic fallback matching the brand
    if (generatedCards.length === 0) {
      generatedCards = [
        {
          title: `5 Costly Mistakes in ${industry}`,
          concept: `Educational teardown highlighting common pitfalls and positioning ${brandName} as the trusted solution.`,
          hook: `Most companies get this wrong before they even launch their first initiative.`,
          angle: 'Educational',
          visualDirection: {
            style: 'Editorial / Clean Infographic',
            aspectRatio: '4:5',
            colorHarmony: primaryColor,
          },
          platforms: ['instagram', 'linkedin'],
        },
        {
          title: `Behind the Craft: How We Built ${products[0]?.name || 'Our Flagship'}`,
          concept: `Storytelling angle showcasing the standards, dedication, and value proposition behind the brand.`,
          hook: `We spent months engineering this so you would never have to compromise on quality.`,
          angle: 'Storytelling',
          visualDirection: {
            style: 'Cinematic Studio / Warm Lighting',
            aspectRatio: '1:1',
            colorHarmony: brand.secondaryColor || '#e0aa4e',
          },
          platforms: ['instagram', 'facebook'],
        },
        {
          title: `The Modern Playbook for ${audience}`,
          concept: `Direct value proposition framework giving immediate actionable takeaways to high-intent buyers.`,
          hook: `If you are looking to elevate results this quarter, start with this one shift.`,
          angle: 'Authority Building',
          visualDirection: {
            style: 'High Contrast Bold Typography',
            aspectRatio: '1:1',
            colorHarmony: primaryColor,
          },
          platforms: ['linkedin', 'x'],
        },
      ];
    }

    // Persist to database
    const savedEntities: ContentConcept[] = [];
    for (const card of generatedCards) {
      const entity = this.conceptRepo.create({
        brandId,
        campaignId: options?.campaignId || null,
        pillarId: options?.pillarId || null,
        title: card.title,
        concept: card.concept,
        hook: card.hook,
        angle: card.angle,
        visualDirection: card.visualDirection,
        platforms: card.platforms || ['instagram'],
        status: 'ready',
      });
      const saved = await this.conceptRepo.save(entity);
      savedEntities.push(saved);
    }

    // Log telemetry
    try {
      const log = this.aiGenRepo.create({
        workspaceId: brand.workspaceId || userId,
        userId,
        taskType: 'concept_generation',
        provider: 'gemini',
        model: this.model,
        input: { brandId, brandName, industry },
        output: { conceptsCount: savedEntities.length },
        latencyMs: Date.now() - startTime,
        status: 'success',
      });
      await this.aiGenRepo.save(log);
    } catch {}

    return savedEntities;
  }

  async listConcepts(brandId: string): Promise<ContentConcept[]> {
    return this.conceptRepo.find({
      where: { brandId },
      order: { createdAt: 'DESC' },
    });
  }

  async getConceptById(id: string): Promise<ContentConcept> {
    const concept = await this.conceptRepo.findOne({ where: { id } });
    if (!concept) throw new NotFoundException(`Concept ${id} not found.`);
    return concept;
  }

  async useConcept(id: string): Promise<ContentConcept> {
    const concept = await this.getConceptById(id);
    concept.status = 'used';
    return this.conceptRepo.save(concept);
  }
}
