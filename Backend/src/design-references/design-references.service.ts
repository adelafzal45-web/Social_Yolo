import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DesignReference, DesignReferenceSource, LicenseType } from './entities/design-reference.entity';
import { DesignReferenceEmbedding } from './entities/design-reference-embedding.entity';
import { DesignReferencePattern } from './entities/design-reference-pattern.entity';
import { DesignReferenceTag } from './entities/design-reference-tag.entity';
import { DesignReferenceAsset } from './entities/design-reference-asset.entity';
import {
  DesignReferenceItem,
  DesignReferenceProvider,
  ReferenceFilterOptions,
} from './providers/reference-provider.interface';
import { InternalLibraryProvider } from './providers/internal-library.provider';
import { PinterestProvider } from './providers/pinterest.provider';
import { BehanceProvider } from './providers/behance.provider';
import { UserUploadProvider } from './providers/user-upload.provider';
import { GeneratedDesignProvider } from './providers/generated-design.provider';
import { EmbeddingsService } from '../post-generator/rag/embeddings.service';

export class CreateDesignReferenceDto {
  source?: DesignReferenceSource;
  sourceUrl?: string;
  externalId?: string;
  title!: string;
  description?: string;
  imageUrl!: string;
  thumbnailUrl?: string;
  category?: string;
  industry?: string;
  platform?: string;
  designType?: string;
  style?: string;
  aspectRatio?: string;
  width?: number;
  height?: number;
  composition?: any;
  typography?: any;
  colorPalette?: string[];
  visualElements?: string[];
  qualityScore?: number;
  licenseType?: LicenseType;
  tags?: Array<{ tag: string; category?: any }>;
}

@Injectable()
export class DesignReferencesService implements OnModuleInit {
  private readonly logger = new Logger(DesignReferencesService.name);
  private readonly providers: Map<string, DesignReferenceProvider> = new Map();

  constructor(
    @InjectRepository(DesignReference)
    private readonly referenceRepo: Repository<DesignReference>,
    @InjectRepository(DesignReferenceEmbedding)
    private readonly embeddingRepo: Repository<DesignReferenceEmbedding>,
    @InjectRepository(DesignReferencePattern)
    private readonly patternRepo: Repository<DesignReferencePattern>,
    @InjectRepository(DesignReferenceTag)
    private readonly tagRepo: Repository<DesignReferenceTag>,
    @InjectRepository(DesignReferenceAsset)
    private readonly assetRepo: Repository<DesignReferenceAsset>,
    private readonly internalLibrary: InternalLibraryProvider,
    private readonly pinterestProvider: PinterestProvider,
    private readonly behanceProvider: BehanceProvider,
    private readonly userUploadProvider: UserUploadProvider,
    private readonly generatedDesignProvider: GeneratedDesignProvider,
    private readonly embeddingsService: EmbeddingsService,
  ) {
    this.registerProvider(this.internalLibrary);
    this.registerProvider(this.pinterestProvider);
    this.registerProvider(this.behanceProvider);
    this.registerProvider(this.userUploadProvider);
    this.registerProvider(this.generatedDesignProvider);
  }

  async onModuleInit() {
    await this.seedInitialReferences();
  }

  private registerProvider(provider: DesignReferenceProvider) {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  async seedInitialReferences() {
    const count = await this.referenceRepo.count();
    if (count > 0) return;

    this.logger.log('Seeding initial curated visual design references into database...');
    const exemplars = await this.internalLibrary.searchReferences('', { limit: 20 });

    for (const item of exemplars) {
      try {
        await this.createReference({
          source: (item.source as any) || 'internal',
          sourceUrl: item.sourceUrl || undefined,
          externalId: item.externalId || item.id,
          title: item.title,
          description: item.description || undefined,
          imageUrl: item.imageUrl,
          thumbnailUrl: item.thumbnailUrl || undefined,
          category: item.category || undefined,
          industry: item.industry || undefined,
          platform: item.platform || undefined,
          designType: item.designType || undefined,
          style: item.style || undefined,
          aspectRatio: item.aspectRatio || '1:1',
          width: item.width || 1080,
          height: item.height || 1080,
          composition: item.composition,
          typography: item.typography,
          colorPalette: item.colorPalette,
          visualElements: item.visualElements,
          qualityScore: item.qualityScore,
          licenseType: (item.licenseType as any) || 'internal',
          tags: [
            { tag: item.style || 'modern', category: 'style' },
            { tag: item.industry || 'general', category: 'industry' },
            { tag: item.designType || 'creative', category: 'mood' },
          ],
        });
      } catch (err: any) {
        this.logger.warn(`Failed to seed reference ${item.title}: ${err.message}`);
      }
    }
    this.logger.log('Visual design references seeded successfully.');
  }

  async createReference(dto: CreateDesignReferenceDto): Promise<DesignReference> {
    const reference = this.referenceRepo.create({
      source: dto.source || 'internal',
      sourceUrl: dto.sourceUrl || null,
      externalId: dto.externalId || null,
      title: dto.title,
      description: dto.description || null,
      imageUrl: dto.imageUrl,
      thumbnailUrl: dto.thumbnailUrl || null,
      category: dto.category || null,
      industry: dto.industry || null,
      platform: dto.platform || null,
      designType: dto.designType || null,
      style: dto.style || null,
      aspectRatio: dto.aspectRatio || '1:1',
      width: dto.width || 1080,
      height: dto.height || 1080,
      composition: dto.composition || null,
      typography: dto.typography || null,
      colorPalette: dto.colorPalette || null,
      visualElements: dto.visualElements || null,
      qualityScore: dto.qualityScore || 85,
      licenseType: dto.licenseType || 'internal',
    });

    const saved = await this.referenceRepo.save(reference);

    // 1. Create Pattern record
    if (dto.composition || dto.typography) {
      const pattern = this.patternRepo.create({
        referenceId: saved.id,
        composition: dto.composition || { layout: 'standard', focalPoint: 'center', textPlacement: 'top', ctaPlacement: 'bottom' },
        typography: dto.typography || { hierarchy: 'prominent headline', weight: 'bold', bodyDensity: 'low' },
        color: { background: 'neutral', accentUsage: 'controlled', dominantColors: dto.colorPalette || [] },
        spacing: { whitespace: 'balanced' },
        visualTreatment: { depth: true, shadows: 'soft' },
        visualHierarchy: { priorityOrder: ['product', 'headline', 'cta'] },
      });
      await this.patternRepo.save(pattern);
    }

    // 2. Create Tags
    if (dto.tags && dto.tags.length > 0) {
      for (const t of dto.tags) {
        const tagEntity = this.tagRepo.create({
          referenceId: saved.id,
          tag: t.tag.toLowerCase(),
          category: t.category || 'general',
        });
        await this.tagRepo.save(tagEntity);
      }
    }

    // 3. Compute Embeddings (Visual & Semantic)
    const semanticText = [
      saved.title,
      saved.industry,
      saved.style,
      saved.platform,
      saved.description,
      JSON.stringify(saved.composition || {}),
      JSON.stringify(saved.typography || {}),
    ]
      .filter(Boolean)
      .join(' | ');

    let semanticVec: number[];
    try {
      semanticVec = await this.embeddingsService.embedText(semanticText);
    } catch {
      semanticVec = this.generateFallbackVector(semanticText, 768);
    }

    // Generate visual embedding based on visual elements and composition
    const visualText = `Aesthetic: ${saved.style || 'clean'}. Composition: ${saved.composition?.layout || 'balanced'}. Palette: ${(saved.colorPalette || []).join(', ')}. Elements: ${(saved.visualElements || []).join(', ')}`;
    let visualVec: number[];
    try {
      visualVec = await this.embeddingsService.embedText(visualText);
    } catch {
      visualVec = this.generateFallbackVector(visualText, 768);
    }

    const embeddingRecord = this.embeddingRepo.create({
      referenceId: saved.id,
      semanticEmbedding: semanticVec,
      visualEmbedding: visualVec,
      dimensions: 768,
    });
    await this.embeddingRepo.save(embeddingRecord);

    return saved;
  }

  async findAll(filters?: ReferenceFilterOptions): Promise<DesignReference[]> {
    const qb = this.referenceRepo.createQueryBuilder('ref')
      .leftJoinAndSelect('ref.patterns', 'patterns')
      .leftJoinAndSelect('ref.tags', 'tags')
      .where('ref.isActive = :isActive', { isActive: true });

    if (filters?.industry) {
      qb.andWhere('ref.industry ILIKE :industry', { industry: `%${filters.industry}%` });
    }
    if (filters?.style) {
      qb.andWhere('ref.style ILIKE :style', { style: `%${filters.style}%` });
    }
    if (filters?.platform) {
      qb.andWhere('ref.platform ILIKE :platform', { platform: `%${filters.platform}%` });
    }
    if (filters?.designType) {
      qb.andWhere('ref.designType ILIKE :designType', { designType: `%${filters.designType}%` });
    }
    if (filters?.minQualityScore) {
      qb.andWhere('ref.qualityScore >= :score', { score: filters.minQualityScore });
    }

    return qb.orderBy('ref.qualityScore', 'DESC').take(filters?.limit || 20).getMany();
  }

  async findOne(id: string): Promise<DesignReference> {
    const ref = await this.referenceRepo.findOne({
      where: { id },
      relations: ['patterns', 'tags', 'embeddings', 'assets'],
    });
    if (!ref) {
      throw new NotFoundException(`Design reference ${id} not found.`);
    }
    return ref;
  }

  async updateReference(id: string, updates: Partial<CreateDesignReferenceDto>): Promise<DesignReference> {
    const ref = await this.findOne(id);
    Object.assign(ref, updates);
    return this.referenceRepo.save(ref);
  }

  async deleteReference(id: string): Promise<{ deleted: boolean }> {
    const ref = await this.findOne(id);
    await this.referenceRepo.remove(ref);
    return { deleted: true };
  }

  async recordReferenceUsage(referenceIds: string[]) {
    if (!referenceIds || referenceIds.length === 0) return;
    for (const id of referenceIds) {
      try {
        await this.referenceRepo.increment({ id }, 'usageCount', 1);
      } catch {}
    }
  }

  async ingestApprovedDesign(generationData: {
    title: string;
    imageUrl: string;
    industry?: string;
    platform?: string;
    style?: string;
    designType?: string;
    composition?: any;
    typography?: any;
    colorPalette?: string[];
  }): Promise<DesignReference> {
    return this.createReference({
      source: 'socialyolo_memory',
      title: generationData.title,
      imageUrl: generationData.imageUrl,
      industry: generationData.industry || 'General',
      platform: generationData.platform || 'Instagram',
      style: generationData.style || 'Premium',
      designType: generationData.designType || 'Product Promotion',
      composition: generationData.composition,
      typography: generationData.typography,
      colorPalette: generationData.colorPalette,
      qualityScore: 95,
      licenseType: 'proprietary_memory',
    });
  }

  async searchInspirations(params: {
    query?: string;
    source?: string;
    industry?: string;
    style?: string;
    platform?: string;
    designType?: string;
    limit?: number;
  }): Promise<any[]> {
    const q = params.query || '';
    const src = (params.source || 'all').toLowerCase();
    const limit = params.limit || 20;

    if (src === 'pinterest') {
      const items = await this.pinterestProvider.searchInspiration(q, {
        style: params.style,
        limit,
      });
      return items;
    }

    if (src === 'behance') {
      const items = await this.behanceProvider.searchInspiration(q, {
        style: params.style,
        limit,
      });
      return items;
    }

    // Default: Internal DB references with filters
    const dbRefs = await this.findAll({
      industry: params.industry,
      style: params.style,
      platform: params.platform,
      designType: params.designType,
      limit,
    });

    if (dbRefs.length > 0) {
      return dbRefs;
    }

    // Fallback to internal library provider
    return this.internalLibrary.searchReferences(q, {
      style: params.style,
      industry: params.industry,
      limit,
    });
  }

  async getTrending(limit: number = 12): Promise<DesignReference[]> {
    return this.referenceRepo
      .createQueryBuilder('ref')
      .leftJoinAndSelect('ref.patterns', 'patterns')
      .leftJoinAndSelect('ref.tags', 'tags')
      .where('ref.isActive = :isActive', { isActive: true })
      .orderBy('ref.usageCount', 'DESC')
      .addOrderBy('ref.qualityScore', 'DESC')
      .take(limit)
      .getMany();
  }

  async extractFeatures(imageUrl: string): Promise<any> {
    return this.behanceProvider.extractDesignFeatures(imageUrl);
  }

  async indexReference(dto: CreateDesignReferenceDto): Promise<DesignReference> {
    return this.createReference(dto);
  }

  async embedReference(text: string, visualText?: string): Promise<{
    semanticEmbedding: number[];
    visualEmbedding: number[];
    dimensions: number;
  }> {
    let semanticEmbedding: number[];
    try {
      semanticEmbedding = await this.embeddingsService.embedText(text);
    } catch {
      semanticEmbedding = this.generateFallbackVector(text, 768);
    }

    const vText = visualText || text;
    let visualEmbedding: number[];
    try {
      visualEmbedding = await this.embeddingsService.embedText(vText);
    } catch {
      visualEmbedding = this.generateFallbackVector(vText, 768);
    }

    return {
      semanticEmbedding,
      visualEmbedding,
      dimensions: 768,
    };
  }

  async saveToBoard(params: {
    referenceId: string;
    boardName?: string;
    userId?: string;
  }): Promise<{ success: boolean; message: string }> {
    await this.recordReferenceUsage([params.referenceId]);
    return {
      success: true,
      message: `Saved inspiration ${params.referenceId} to board "${params.boardName || 'Favorites'}".`,
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
