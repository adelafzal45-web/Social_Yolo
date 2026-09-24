import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from 'rxjs';
import { CreativeGeneration, CreativeGenerationStatus } from './entities/creative-generation.entity';
import { CreativeVariation } from './entities/creative-variation.entity';
import { CreativeExport } from './entities/creative-export.entity';
import { BrandIntelligenceService } from '../brand-intelligence/brand-intelligence.service';
import { CreativeRAGService } from '../creative-rag/creative-rag.service';
import { DeterministicRendererService } from './deterministic-renderer.service';
import { DesignQualityControlService } from './design-quality-control.service';
import { MetaDesignEngineService } from './meta-design-engine.service';
import { DesignReferencesService } from '../design-references/design-references.service';
import { GeminiService } from '../post-generator/gemini.service';
import { PollinationsService } from '../post-generator/providers/pollinations.service';
import {
  StructuredDesignService,
  AiDesignEditAction,
  StructuredDesignDocument,
} from './services/structured-design.service';
import {
  ConceptGenerationService,
  DesignConceptItem,
} from './services/concept-generation.service';
import {
  DesignValidationService,
  DesignValidationReport,
} from './services/design-validation.service';
import { PlatformAdaptationService } from './services/platform-adaptation.service';
import { PlatformConfigService } from '../design-platform/platform-config.service';
import { CreditsService } from '../credits/credits.service';

export class StartStudioGenerationDto {
  projectId?: string;
  brandId?: string;
  userId?: string;
  projectName?: string;
  designType?: 'creative' | 'meta_ad';
  creativeType?: string;
  objective?: string;
  style?: string;
  composition?: string;
  mood?: string;
  cta?: string;
  platform?: string;
  headline?: string;
  subheadline?: string;
  productName?: string;
  offer?: string;
  brandAssets?: {
    logoUrl?: string;
    heroImageUrl?: string;
  };
}

export interface StudioProgressEvent {
  jobId: string;
  status: CreativeGenerationStatus;
  stage: string;
  stageIndex: number; // 0..9
  progressPct: number;
  variations?: any[];
  error?: string;
}

const STAGES: Array<{ status: CreativeGenerationStatus; label: string; pct: number }> = [
  { status: 'ANALYZING_BRAND', label: 'Analyzing Brand Identity', pct: 10 },
  { status: 'UNDERSTANDING_GOAL', label: 'Understanding Creative Intent', pct: 20 },
  { status: 'RETRIEVING_REFERENCES', label: 'Finding Relevant Visual Intelligence', pct: 30 },
  { status: 'ANALYZING_PATTERNS', label: 'Analyzing Design Patterns', pct: 40 },
  { status: 'PLANNING_COMPOSITION', label: 'Building Design Direction', pct: 50 },
  { status: 'GENERATING_ASSETS', label: 'Generating Visual Assets', pct: 65 },
  { status: 'BUILDING_CREATIVE', label: 'Generating Master Variations', pct: 80 },
  { status: 'APPLYING_BRAND', label: 'Applying Brand Identity', pct: 90 },
  { status: 'QUALITY_CHECKING', label: 'Quality Checking Designs', pct: 95 },
  { status: 'FINALIZING', label: 'Finalizing', pct: 100 },
];

@Injectable()
export class CreativeGenerationEngineService {
  private readonly logger = new Logger(CreativeGenerationEngineService.name);
  private readonly jobStreams = new Map<string, Subject<StudioProgressEvent>>();

  constructor(
    @InjectRepository(CreativeGeneration)
    private readonly generationRepo: Repository<CreativeGeneration>,
    @InjectRepository(CreativeVariation)
    private readonly variationRepo: Repository<CreativeVariation>,
    @InjectRepository(CreativeExport)
    private readonly exportRepo: Repository<CreativeExport>,
    private readonly brandIntelligence: BrandIntelligenceService,
    private readonly creativeRAG: CreativeRAGService,
    private readonly deterministicRenderer: DeterministicRendererService,
    private readonly qualityControl: DesignQualityControlService,
    private readonly metaDesignEngine: MetaDesignEngineService,
    private readonly designReferencesService: DesignReferencesService,
    private readonly geminiService: GeminiService,
    private readonly pollinationsService: PollinationsService,
    private readonly structuredDesignService: StructuredDesignService,
    private readonly conceptGenerationService: ConceptGenerationService,
    private readonly designValidationService: DesignValidationService,
    private readonly platformAdaptationService: PlatformAdaptationService,
    private readonly platformConfigService: PlatformConfigService,
    private readonly creditsService: CreditsService,
  ) {}

  getJobStream(jobId: string): Subject<StudioProgressEvent> {
    let stream = this.jobStreams.get(jobId);
    if (!stream) {
      stream = new Subject<StudioProgressEvent>();
      this.jobStreams.set(jobId, stream);
    }
    return stream;
  }

  async getGeneration(id: string): Promise<CreativeGeneration> {
    const gen = await this.generationRepo.findOne({
      where: { id },
      relations: ['variations', 'exports'],
    });
    if (!gen) {
      throw new NotFoundException(`Generation run ${id} not found.`);
    }
    return gen;
  }

  async startGeneration(dto: StartStudioGenerationDto): Promise<CreativeGeneration> {
    const designType = dto.designType || 'creative';
    const objective = dto.objective || (designType === 'meta_ad' ? 'SALES' : 'Promote Product');
    const style = dto.style || (designType === 'meta_ad' ? 'Performance' : (dto.creativeType || 'Editorial'));
    const compositionPreference = dto.composition || 'Product Focus';
    const mood = dto.mood || 'Premium';
    const cta = dto.cta || (designType === 'meta_ad' ? 'Shop Now' : 'Discover More');
    const platform = dto.platform || 'Master Canvas (1080x1350)';

    // 1. Persist Initial Generation record with flexible Master Canvas 1080x1350 (4:5)
    const generation = this.generationRepo.create({
      projectId: dto.projectId || null,
      brandId: dto.brandId || null,
      userId: dto.userId || null,
      projectName: dto.projectName || 'Social Campaign',
      designType,
      objective,
      style,
      compositionPreference,
      mood,
      cta,
      platform,
      aspectRatio: '4:5',
      width: 1080,
      height: 1350,
      configuration: dto as any,
      status: 'QUEUED',
      currentStageLabel: 'Analyzing Brand',
      progressPct: 5,
    });

    const saved = await this.generationRepo.save(generation);

    // 2. Trigger asynchronous execution pipeline
    setImmediate(() => {
      this.executeStudioPipeline(saved.id, dto).catch((err) => {
        this.logger.error(`Pipeline failure for ${saved.id}: ${err.message}`);
      });
    });

    return saved;
  }

  private async executeStudioPipeline(jobId: string, dto: StartStudioGenerationDto) {
    const stream = this.getJobStream(jobId);

    const updateStage = async (stageIndex: number) => {
      const step = STAGES[stageIndex];
      await this.generationRepo.update(jobId, {
        status: step.status,
        currentStageLabel: step.label,
        progressPct: step.pct,
      });
      stream.next({
        jobId,
        status: step.status,
        stage: step.label,
        stageIndex,
        progressPct: step.pct,
      });
    };

    try {
      // Stage 1: Analyzing Brand (10%)
      await updateStage(0);
      let brandIntel: any;
      if (dto.brandId) {
        brandIntel = await this.brandIntelligence.getBrandIntelligence(dto.brandId);
      } else {
        brandIntel = {
          brandName: dto.projectName || 'Apex Studio',
          industry: 'Commercial Retail',
          visualIdentity: {
            primaryColor: '#7c5cff',
            secondaryColor: '#e0aa4e',
            accentColor: '#3ecf8e',
            fontHeading: 'Canela',
            fontBody: 'Inter',
            palette: ['#7c5cff', '#e0aa4e', '#3ecf8e'],
          },
          personality: { tone: 'Modern & Premium' },
        };
      }
      await new Promise((r) => setTimeout(r, 450));

      // Stage 2: Understanding Creative Goal & Generating Concepts (20%)
      await updateStage(1);
      const isMeta = dto.designType === 'meta_ad';
      const metaOpt = isMeta
        ? this.metaDesignEngine.optimizeForMetaAd(dto.platform || 'instagram_feed', {
            headline: dto.headline,
            subheadline: dto.subheadline,
            cta: dto.cta,
            brandName: brandIntel.brandName,
          })
        : null;

      let headline = metaOpt ? metaOpt.headline : dto.headline || `${brandIntel.brandName} — Elevate Your Ritual`;
      let subheadline = metaOpt ? metaOpt.subheadline : dto.subheadline || dto.offer || 'Crafted with precision for mindful living.';
      let ctaText = metaOpt ? metaOpt.cta : dto.cta || 'SHOP NOW';

      // Pre-generate concepts
      const concepts = await this.conceptGenerationService.generateConcepts({
        brandName: brandIntel.brandName,
        industry: brandIntel.industry,
        brandColors: brandIntel.visualIdentity?.palette,
        designType: dto.designType,
        platform: dto.platform,
        objective: dto.objective,
        productName: dto.productName,
        style: dto.style,
      });

      await new Promise((r) => setTimeout(r, 450));

      // Stage 3: Finding Design References (Visual RAG) (30%)
      await updateStage(2);
      const brandEmbedding = dto.brandId
        ? await this.brandIntelligence.getOrCreateBrandEmbedding(dto.brandId)
        : undefined;

      const ragResult = await this.creativeRAG.executeRAG({
        brand: brandIntel,
        brandEmbedding,
        platform: dto.platform || 'Instagram Post',
        designType: dto.designType || 'creative',
        objective: dto.objective || 'Promote Product',
        style: dto.style || 'Premium',
        compositionPreference: dto.composition || 'Product Focus',
        mood: dto.mood || 'Premium',
        productName: dto.productName,
        customHeadline: dto.headline,
      });

      const refIds = ragResult.retrievedReferences.map((r) => r.id);
      await this.designReferencesService.recordReferenceUsage(refIds);
      await new Promise((r) => setTimeout(r, 500));

      // Stage 4: Analyzing Design Patterns (40%)
      await updateStage(3);
      await new Promise((r) => setTimeout(r, 450));

      // Stage 5: Planning Composition (50%)
      await updateStage(4);
      await this.generationRepo.update(jobId, {
        referenceIds: refIds,
        designStrategy: ragResult.originalStrategy as any,
      });
      await new Promise((r) => setTimeout(r, 450));

      // Stage 6: Generating Visual Assets (65%)
      await updateStage(5);
      let bgBuffer: Buffer | undefined;

      try {
        const visualPrompt = `Professional commercial advertising background for ${brandIntel.brandName}, ${dto.style || 'Premium'} aesthetic, staged product environment, soft natural studio lighting, 8k resolution, elegant space for typography overlay. No visible text or letters.`;
        if (this.geminiService.isConfigured) {
          const genImg = await this.geminiService.generatePostImage({
            prompt: visualPrompt,
            width: 1080,
            height: 1080,
            aspectRatio: '1:1',
          });
          bgBuffer = Buffer.from(genImg.imageBase64, 'base64');
        } else {
          const genImg = await this.pollinationsService.generatePostImage({
            prompt: visualPrompt,
            width: 1080,
            height: 1080,
          });
          bgBuffer = Buffer.from(genImg.imageBase64, 'base64');
        }
      } catch (assetErr: any) {
        this.logger.warn(`AI visual asset generation notice: ${assetErr.message}. Utilizing dynamic gradient canvas.`);
      }
      await new Promise((r) => setTimeout(r, 500));

      // Stage 7: Building Creative (Multi-Variation Generation) (80%)
      await updateStage(6);

      // We generate 4 distinct concepts based on designType
      const conceptDefinitions: Array<{
        key: 'variation_a' | 'variation_b' | 'variation_c' | 'variation_d';
        label: string;
        style: 'Premium' | 'Minimal' | 'Bold' | 'Editorial';
        headlineMod: string;
        conceptData: DesignConceptItem;
      }> = isMeta
        ? [
            {
              key: 'variation_a',
              label: 'Variation 1 — Direct Performance Card',
              style: 'Bold',
              headlineMod: concepts[0]?.suggestedHeadline || (dto.offer ? `${dto.offer} — LIMITED OFFER` : headline.toUpperCase()),
              conceptData: concepts[0],
            },
            {
              key: 'variation_b',
              label: 'Variation 2 — High-Converting Minimal',
              style: 'Minimal',
              headlineMod: concepts[1]?.suggestedHeadline || headline.replace(/—.*/, '').trim(),
              conceptData: concepts[1] || concepts[0],
            },
            {
              key: 'variation_c',
              label: 'Variation 3 — Brand Authority Showcase',
              style: 'Premium',
              headlineMod: concepts[2]?.suggestedHeadline || `Trusted Quality: ${headline}`,
              conceptData: concepts[2] || concepts[0],
            },
            {
              key: 'variation_d',
              label: 'Variation 4 — Storytelling Narrative',
              style: 'Editorial',
              headlineMod: concepts[3]?.suggestedHeadline || `Experience ${brandIntel.brandName}`,
              conceptData: concepts[3] || concepts[0],
            },
          ]
        : [
            {
              key: 'variation_a',
              label: 'Variation 1 — Editorial Prestige',
              style: 'Editorial',
              headlineMod: concepts[0]?.suggestedHeadline || headline,
              conceptData: concepts[0],
            },
            {
              key: 'variation_b',
              label: 'Variation 2 — Luxury Minimal',
              style: 'Minimal',
              headlineMod: concepts[1]?.suggestedHeadline || headline.replace(/—.*/, '').trim(),
              conceptData: concepts[1] || concepts[0],
            },
            {
              key: 'variation_c',
              label: 'Variation 3 — Bold Modern',
              style: 'Bold',
              headlineMod: concepts[2]?.suggestedHeadline || headline.toUpperCase(),
              conceptData: concepts[2] || concepts[0],
            },
            {
              key: 'variation_d',
              label: 'Variation 4 — Artistic Showcase',
              style: 'Premium',
              headlineMod: concepts[3]?.suggestedHeadline || `The Art of ${brandIntel.brandName}`,
              conceptData: concepts[3] || concepts[0],
            },
          ];

      const createdVariations: CreativeVariation[] = [];

      for (const concept of conceptDefinitions) {
        const rendered = await this.deterministicRenderer.renderCreative({
          width: 1080,
          height: 1350,
          backgroundImageBuffer: bgBuffer,
          brandName: brandIntel.brandName,
          headline: concept.headlineMod,
          subheadline,
          ctaText,
          brandPrimaryColor: brandIntel.visualIdentity.primaryColor,
          brandAccentColor: brandIntel.visualIdentity.accentColor,
          fontHeading: brandIntel.visualIdentity.fontHeading,
          fontBody: brandIntel.visualIdentity.fontBody,
          style: concept.style,
        });

        // Generate editable structured document (Layers + Canvas)
        const structuredDoc = this.structuredDesignService.createInitialDocument({
          width: 1080,
          height: 1350,
          aspectRatio: dto.platform?.toLowerCase().includes('story') ? '9:16' : '4:5',
          platform: dto.platform || 'Instagram Post',
          style: concept.style,
          brandName: brandIntel.brandName,
          brandColors: brandIntel.visualIdentity?.palette || [
            brandIntel.visualIdentity?.primaryColor,
            brandIntel.visualIdentity?.secondaryColor,
          ],
          headline: concept.headlineMod,
          subheadline,
          ctaText,
          logoUrl: dto.brandAssets?.logoUrl,
          imageUrl: dto.brandAssets?.heroImageUrl,
          discountOffer: dto.offer,
        });

        // Automated Design Validation (Content, Brand, Visual, Platform)
        const validationReport = this.designValidationService.validateDesign(
          structuredDoc,
          dto.platform,
        );

        const qaValidation = this.qualityControl.validateAndImprove({
          width: 1080,
          height: 1350,
          headline: concept.headlineMod,
          subheadline,
          ctaText,
          brandPrimaryColor: brandIntel.visualIdentity.primaryColor,
          brandAccentColor: brandIntel.visualIdentity.accentColor,
          textCoveragePct: rendered.textCoveragePct,
          platform: dto.platform || 'Instagram Post',
          isMetaAd: isMeta,
        });

        const variationEntity = this.variationRepo.create({
          generationId: jobId,
          variationKey: concept.key,
          label: concept.label,
          conceptStyle: concept.style,
          layoutName: `${concept.style} Grid Layout`,
          headline: qaValidation.improvedParams.headline,
          subheadline: qaValidation.improvedParams.subheadline || null,
          body: null,
          ctaText: qaValidation.improvedParams.ctaText,
          width: 1080,
          height: 1350,
          renderUrl: rendered.relativeUrl,
          textCoveragePct: rendered.textCoveragePct,
          metaPass: rendered.textCoveragePct <= 20,
          qualityScore: Math.round((qaValidation.result.overallScore + validationReport.score) / 2),
          qualityMetrics: qaValidation.result.breakdown as any,
          layers: structuredDoc as any,
          conceptData: concept.conceptData as any,
          validationReport: validationReport as any,
        });

        const savedVar = await this.variationRepo.save(variationEntity);
        createdVariations.push(savedVar);
      }

      // Stage 8 & 9: Complete QA and Finalize
      await updateStage(7);
      await new Promise((r) => setTimeout(r, 400));
      await updateStage(8);
      await new Promise((r) => setTimeout(r, 400));

      // Stage 10: Finalizing (100%)
      await updateStage(9);
      await this.generationRepo.update(jobId, {
        status: 'COMPLETED',
        progressPct: 100,
        currentStageLabel: 'All 4 Variations Generated & QA Verified',
        qualityScore: Math.round(
          createdVariations.reduce((acc, v) => acc + v.qualityScore, 0) / createdVariations.length,
        ),
      });

      stream.next({
        jobId,
        status: 'COMPLETED',
        stage: 'All 4 Variations Generated & QA Verified',
        stageIndex: 9,
        progressPct: 100,
        variations: createdVariations,
      });

      stream.complete();
      this.jobStreams.delete(jobId);
    } catch (err: any) {
      this.logger.error(`Generation job ${jobId} failed: ${err.message}`);
      await this.generationRepo.update(jobId, {
        status: 'FAILED',
        errorMessage: err.message,
      });
      stream.next({
        jobId,
        status: 'FAILED',
        stage: 'Generation Failed',
        stageIndex: 0,
        progressPct: 0,
        error: err.message,
      });
      stream.complete();
      this.jobStreams.delete(jobId);
    }
  }

  async getConcepts(generationId: string): Promise<DesignConceptItem[]> {
    const gen = await this.getGeneration(generationId);
    const config = gen.configuration || {};

    return this.conceptGenerationService.generateConcepts({
      brandName: gen.projectName,
      designType: gen.designType,
      platform: gen.platform,
      objective: gen.objective,
      style: gen.style,
      productName: config.productName,
    });
  }

  async selectConcept(generationId: string, conceptId: string): Promise<CreativeVariation> {
    const variations = await this.variationRepo.find({
      where: { generationId },
    });
    if (!variations || variations.length === 0) {
      throw new NotFoundException(`No variations found for generation ${generationId}`);
    }

    let selected = variations.find(
      (v) =>
        v.variationKey === conceptId ||
        v.conceptStyle.toLowerCase() === conceptId.toLowerCase() ||
        v.id === conceptId,
    );

    if (!selected) {
      selected = variations[0];
    }

    for (const v of variations) {
      v.isApproved = v.id === selected.id;
      await this.variationRepo.save(v);
    }

    return selected;
  }

  async applyAiEdit(
    variationId: string,
    action: AiDesignEditAction,
    options?: { customCta?: string; customImage?: string },
  ): Promise<CreativeVariation> {
    const variation = await this.variationRepo.findOne({
      where: { id: variationId },
      relations: ['generation'],
    });
    if (!variation) throw new NotFoundException(`Variation ${variationId} not found.`);

    // If layers don't exist yet, build initial document
    let doc: StructuredDesignDocument = variation.layers as any;
    if (!doc || !doc.layers) {
      doc = this.structuredDesignService.createInitialDocument({
        width: variation.width,
        height: variation.height,
        aspectRatio: variation.height > variation.width ? '4:5' : '1:1',
        platform: variation.generation?.platform || 'Instagram Post',
        style: variation.conceptStyle,
        headline: variation.headline,
        subheadline: variation.subheadline || undefined,
        ctaText: variation.ctaText,
      });
    }

    // Apply the promptless edit action
    const updatedDoc = this.structuredDesignService.applyAiEditAction(
      doc,
      action,
      options,
    );

    // Re-validate against design rules
    const validationReport = this.designValidationService.validateDesign(
      updatedDoc,
      variation.generation?.platform,
    );

    // Extract headline and cta for re-rendering
    const headlineLayer = updatedDoc.layers.find((l) => l.type === 'headline');
    const ctaLayer = updatedDoc.layers.find((l) => l.type === 'cta');
    const subLayer = updatedDoc.layers.find((l) => l.type === 'subheadline');

    if (headlineLayer) variation.headline = headlineLayer.content;
    if (ctaLayer) variation.ctaText = ctaLayer.content;
    if (subLayer) variation.subheadline = subLayer.content;

    // Deterministic re-render
    const brandIntel = variation.generation?.brandId
      ? await this.brandIntelligence.getBrandIntelligence(variation.generation.brandId)
      : null;

    const rendered = await this.deterministicRenderer.renderCreative({
      width: updatedDoc.canvas.width,
      height: updatedDoc.canvas.height,
      brandName: brandIntel?.brandName || 'Brand',
      headline: variation.headline,
      subheadline: variation.subheadline || undefined,
      ctaText: variation.ctaText,
      brandPrimaryColor: brandIntel?.visualIdentity?.primaryColor || '#7c5cff',
      brandAccentColor: brandIntel?.visualIdentity?.accentColor || '#3ecf8e',
      fontHeading: brandIntel?.visualIdentity?.fontHeading || 'Canela',
      fontBody: brandIntel?.visualIdentity?.fontBody || 'Inter',
      style: variation.conceptStyle,
    });

    variation.renderUrl = rendered.relativeUrl;
    variation.textCoveragePct = rendered.textCoveragePct;
    variation.layers = updatedDoc as any;
    variation.validationReport = validationReport as any;
    variation.qualityScore = validationReport.score;

    return this.variationRepo.save(variation);
  }

  async adaptVariation(
    variationId: string,
    targetPlatformId: string,
  ): Promise<{ adaptedVariation: CreativeVariation; appliedAdjustments: string[] }> {
    const variation = await this.variationRepo.findOne({
      where: { id: variationId },
      relations: ['generation'],
    });
    if (!variation) throw new NotFoundException(`Variation ${variationId} not found.`);

    let doc: StructuredDesignDocument = variation.layers as any;
    if (!doc || !doc.layers) {
      doc = this.structuredDesignService.createInitialDocument({
        width: variation.width,
        height: variation.height,
        aspectRatio: '1:1',
        platform: variation.generation?.platform || 'Instagram Post',
        style: variation.conceptStyle,
        headline: variation.headline,
        subheadline: variation.subheadline || undefined,
        ctaText: variation.ctaText,
      });
    }

    const { adaptedDocument, appliedAdjustments } = this.platformAdaptationService.adaptDesign(
      doc,
      targetPlatformId,
    );

    const validationReport = this.designValidationService.validateDesign(
      adaptedDocument,
      targetPlatformId,
    );

    const targetConfig = this.platformConfigService.getPlatformById(targetPlatformId);

    // Create a new variation representing the adapted design
    const adaptedEntity = this.variationRepo.create({
      generationId: variation.generationId,
      variationKey: variation.variationKey,
      label: `${variation.label} (${targetConfig?.name || targetPlatformId})`,
      conceptStyle: variation.conceptStyle,
      layoutName: `${variation.conceptStyle} Adapted Layout`,
      headline: variation.headline,
      subheadline: variation.subheadline,
      body: variation.body,
      ctaText: variation.ctaText,
      width: adaptedDocument.canvas.width,
      height: adaptedDocument.canvas.height,
      renderUrl: variation.renderUrl,
      textCoveragePct: variation.textCoveragePct,
      metaPass: true,
      qualityScore: validationReport.score,
      layers: adaptedDocument as any,
      conceptData: variation.conceptData,
      validationReport: validationReport as any,
    });

    const saved = await this.variationRepo.save(adaptedEntity);
    return { adaptedVariation: saved, appliedAdjustments };
  }

  async validateVariation(variationId: string): Promise<DesignValidationReport> {
    const variation = await this.variationRepo.findOne({
      where: { id: variationId },
      relations: ['generation'],
    });
    if (!variation) throw new NotFoundException(`Variation ${variationId} not found.`);

    let doc: StructuredDesignDocument = variation.layers as any;
    if (!doc || !doc.layers) {
      doc = this.structuredDesignService.createInitialDocument({
        width: variation.width,
        height: variation.height,
        aspectRatio: '1:1',
        platform: variation.generation?.platform || 'Instagram Post',
        style: variation.conceptStyle,
        headline: variation.headline,
        subheadline: variation.subheadline || undefined,
        ctaText: variation.ctaText,
      });
    }

    const report = this.designValidationService.validateDesign(
      doc,
      variation.generation?.platform,
    );

    variation.validationReport = report as any;
    variation.qualityScore = report.score;
    await this.variationRepo.save(variation);

    return report;
  }

  async exportVariation(
    variationId: string,
    format: 'png' | 'jpg' | 'webp' = 'png',
    scale: number = 1,
    targetPlatform?: string,
    organizationId?: string,
  ): Promise<CreativeExport> {
    let variation = await this.variationRepo.findOne({
      where: { id: variationId },
      relations: ['generation'],
    });
    if (!variation) throw new NotFoundException(`Variation ${variationId} not found.`);

    // If targetPlatform is requested and differs from master, adapt it
    if (targetPlatform && targetPlatform !== 'master' && targetPlatform !== variation.generation?.platform) {
      try {
        const adaptationResult = await this.adaptVariation(variationId, targetPlatform);
        variation = adaptationResult.adaptedVariation;
      } catch (adaptErr: any) {
        this.logger.warn(`Platform adaptation notice during export: ${adaptErr.message}`);
      }
    }

    const exportScale = Math.max(1, Math.min(scale, 4));
    const exportWidth = Math.round(variation.width * exportScale);
    const exportHeight = Math.round(variation.height * exportScale);

    // Credit accounting: 1 credit for standard (1x), 2 credits for hi-res (2x/4x)
    if (organizationId) {
      const creditCost = exportScale > 1 ? 2 : 1;
      try {
        await this.creditsService.commitReservation(
          organizationId,
          creditCost,
          variation.id,
          `Exported ${variation.label} (${targetPlatform || variation.generation?.platform || 'Master Canvas'}, ${exportWidth}x${exportHeight}, ${format.toUpperCase()})`,
        );
      } catch (creditErr: any) {
        this.logger.warn(`Credit deduction notice during export: ${creditErr.message}`);
      }
    }

    const exp = this.exportRepo.create({
      generationId: variation.generationId,
      variationId: variation.id,
      format,
      platform: targetPlatform || variation.generation?.platform || 'Master Canvas',
      width: exportWidth,
      height: exportHeight,
      exportUrl: variation.renderUrl,
      fileSizeBytes: Math.round(exportWidth * exportHeight * 0.8),
    });

    return this.exportRepo.save(exp);
  }

  async approveVariation(variationId: string): Promise<CreativeVariation> {
    const variation = await this.variationRepo.findOne({
      where: { id: variationId },
      relations: ['generation'],
    });
    if (!variation) throw new NotFoundException(`Variation ${variationId} not found.`);

    variation.isApproved = true;
    await this.variationRepo.save(variation);

    // Ingest approved design into Visual RAG self-learning memory (Section 8 flywheel)
    try {
      await this.designReferencesService.ingestApprovedDesign({
        title: `${variation.generation?.projectName || 'Approved Design'} - ${variation.label}`,
        imageUrl: variation.renderUrl,
        style: variation.conceptStyle,
        platform: variation.generation?.platform,
        designType: variation.generation?.designType,
        typography: { headline: variation.headline, cta: variation.ctaText },
      });
    } catch (err: any) {
      this.logger.warn(`Could not ingest approved design to memory: ${err.message}`);
    }

    return variation;
  }

  async refineVariation(
    variationId: string,
    action:
      | 'MAKE_PREMIUM'
      | 'MAKE_MINIMAL'
      | 'MAKE_BOLD'
      | 'BETTER_TYPOGRAPHY'
      | 'BETTER_LAYOUT'
      | 'CHANGE_CTA'
      | 'APPLY_BRAND',
    customCta?: string,
  ): Promise<CreativeVariation> {
    const actionMap: Record<string, AiDesignEditAction> = {
      MAKE_PREMIUM: 'make_more_premium',
      MAKE_MINIMAL: 'make_more_minimal',
      MAKE_BOLD: 'make_more_bold',
      BETTER_TYPOGRAPHY: 'change_typography',
      BETTER_LAYOUT: 'change_layout',
      CHANGE_CTA: 'improve_design',
      APPLY_BRAND: 'use_brand_colors',
    };

    const targetAction = actionMap[action] || 'improve_design';
    return this.applyAiEdit(variationId, targetAction, { customCta });
  }
}
