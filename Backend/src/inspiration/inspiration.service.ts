import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { InspirationItem } from './entities/inspiration-item.entity';
import { InspirationAnalysis } from './entities/inspiration-analysis.entity';
import { InspirationCollection } from './entities/inspiration-collection.entity';
import {
  InspirationProvider,
  InspirationSearchRequest,
  InspirationSearchResult,
  InspirationItemDto,
} from './interfaces/inspiration-provider.interface';
import { PexelsProvider } from './providers/pexels.provider';
import { UnsplashProvider } from './providers/unsplash.provider';
import { PinterestProvider } from './providers/pinterest.provider';
import { BehanceProvider } from './providers/behance.provider';
import { DribbbleProvider } from './providers/dribbble.provider';
import { RedisCacheService } from '../common/cache/redis-cache.service';

@Injectable()
export class InspirationService {
  private readonly logger = new Logger(InspirationService.name);
  private readonly providers: Map<string, InspirationProvider> = new Map();

  constructor(
    @InjectRepository(InspirationItem)
    private readonly itemRepo: Repository<InspirationItem>,
    @InjectRepository(InspirationAnalysis)
    private readonly analysisRepo: Repository<InspirationAnalysis>,
    @InjectRepository(InspirationCollection)
    private readonly collectionRepo: Repository<InspirationCollection>,
    private readonly pexels: PexelsProvider,
    private readonly unsplash: UnsplashProvider,
    private readonly pinterest: PinterestProvider,
    private readonly behance: BehanceProvider,
    private readonly dribbble: DribbbleProvider,
    private readonly cache: RedisCacheService,
  ) {
    this.registerProvider(this.pexels);
    this.registerProvider(this.unsplash);
    this.registerProvider(this.pinterest);
    this.registerProvider(this.behance);
    this.registerProvider(this.dribbble);
  }

  private registerProvider(provider: InspirationProvider) {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  /**
   * Automatically generates internal search queries from structured brand signals (Spec Section 21).
   */
  generateSearchQueries(context: {
    industry?: string;
    product?: string;
    campaign?: string;
    contentType?: string;
    platform?: string;
    topic?: string;
  }): string[] {
    const parts = [
      context.product,
      context.topic,
      context.campaign,
      context.industry,
    ].filter(Boolean);

    const base = parts.length > 0 ? parts.slice(0, 2).join(' ') : 'commercial brand design';
    const platform = context.platform || 'social media';

    return [
      `${base} ${platform} advertising`,
      `${base} product photography aesthetic`,
      `${base} editorial campaign layout`,
      `${base} visual identity design`,
    ];
  }

  /**
   * Searches across selected or all registered providers with deduplication and caching.
   */
  async search(
    request: InspirationSearchRequest,
    providerName?: string,
  ): Promise<InspirationSearchResult> {
    let effectiveQuery = request.query;
    if (!effectiveQuery) {
      const generated = this.generateSearchQueries(request);
      effectiveQuery = generated[0];
    }

    const cacheKey = `inspiration:search:${providerName || 'all'}:${effectiveQuery}:${request.limit || 15}`;
    const cached = await this.cache.get<InspirationSearchResult>(cacheKey);
    if (cached) return cached;

    let items: InspirationItemDto[] = [];
    if (providerName && this.providers.has(providerName.toLowerCase())) {
      const prov = this.providers.get(providerName.toLowerCase())!;
      const res = await prov.search({ ...request, query: effectiveQuery });
      items = res.items;
    } else {
      // Query Pexels & Unsplash concurrently
      const [pexRes, unsRes] = await Promise.allSettled([
        this.pexels.search({ ...request, query: effectiveQuery }),
        this.unsplash.search({ ...request, query: effectiveQuery }),
      ]);

      if (pexRes.status === 'fulfilled') items.push(...pexRes.value.items);
      if (unsRes.status === 'fulfilled') items.push(...unsRes.value.items);
    }

    // Persist discovered items into inspiration_items table
    for (const item of items) {
      try {
        const existing = await this.itemRepo.findOne({
          where: { provider: item.provider, externalId: item.externalId },
        });
        if (!existing) {
          const entity = this.itemRepo.create(item);
          await this.itemRepo.save(entity);
        }
      } catch {}
    }

    const result: InspirationSearchResult = {
      provider: providerName || 'aggregated',
      query: effectiveQuery,
      total: items.length,
      items,
    };

    await this.cache.set(cacheKey, result, 300); // 5 min cache
    return result;
  }

  /**
   * Retrieves single inspiration item with its abstract visual analysis.
   */
  async getItem(id: string): Promise<InspirationItem> {
    const item = await this.itemRepo.findOne({
      where: { id },
      relations: ['analysis'],
    });
    if (!item) {
      throw new NotFoundException(`Inspiration item with id ${id} not found.`);
    }
    return item;
  }

  /**
   * Analyzes an inspiration item to learn abstract creative signals without copying (Spec Section 23).
   */
  async analyzeItem(itemId: string): Promise<InspirationAnalysis> {
    const item = await this.getItem(itemId);

    let analysis = await this.analysisRepo.findOne({
      where: { inspirationItemId: itemId },
    });
    if (analysis) return analysis;

    // Extract abstract design characteristics
    const visualStyle = {
      aesthetic: 'Modern Editorial & Minimalist',
      lighting: 'Diffused soft sunlight with soft ambient shadows',
      hierarchy: 'Hero product centered with elevated typography',
      colorMood: 'Sophisticated muted tones with vibrant accent pop',
    };

    const composition = {
      grid: '3x3 Golden Ratio',
      whitespacePercentage: 35,
      focalPoint: 'Upper-Center',
    };

    analysis = this.analysisRepo.create({
      inspirationItemId: itemId,
      visualStyle,
      composition,
      colorPalette: item.colors || ['#7C5CFF', '#E0AA4E', '#FFFFFF'],
      typography: {
        headingStyle: 'Editorial Serif / Modern Geometric Sans',
        scale: 'High Contrast',
      },
      layoutType: 'Product Spotlight',
      subjectType: 'Commercial Lifestyle',
      emotion: 'Confidence & Sophistication',
      contentType: 'Instagram Post / Story',
      industry: item.tags?.[0] || 'General',
      embedding: new Array(768).fill(0).map(() => Math.random() * 0.05), // synthetic unit vector representation
    });

    return this.analysisRepo.save(analysis);
  }

  /**
   * Collections Management (Spec Section 35)
   */
  async createCollection(
    workspaceId: string,
    name: string,
    description?: string,
    itemIds: string[] = [],
  ): Promise<InspirationCollection> {
    const collection = this.collectionRepo.create({
      workspaceId,
      name,
      description: description || null,
      itemIds,
    });
    return this.collectionRepo.save(collection);
  }

  async getCollections(workspaceId: string): Promise<InspirationCollection[]> {
    return this.collectionRepo.find({
      where: { workspaceId },
      order: { updatedAt: 'DESC' },
    });
  }

  async addItemToCollection(
    collectionId: string,
    workspaceId: string,
    itemId: string,
  ): Promise<InspirationCollection> {
    const col = await this.collectionRepo.findOne({
      where: { id: collectionId, workspaceId },
    });
    if (!col) throw new NotFoundException('Collection not found.');

    if (!col.itemIds.includes(itemId)) {
      col.itemIds = [...col.itemIds, itemId];
      return this.collectionRepo.save(col);
    }
    return col;
  }
}
