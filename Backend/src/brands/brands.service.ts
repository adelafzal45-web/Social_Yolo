import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandProfile } from './entities/brand-profile.entity';
import { BrandInsight } from './entities/brand-insight.entity';
import { BrandSource } from './entities/brand-source.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { UpdateBrandInsightsDto } from './dto/update-brand-insights.dto';
import { RedisCacheService } from '../common/cache/redis-cache.service';

const isUuid = (val?: string): boolean =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim()));

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(BrandProfile)
    private readonly brandRepo: Repository<BrandProfile>,
    @InjectRepository(BrandInsight)
    private readonly insightRepo: Repository<BrandInsight>,
    @InjectRepository(BrandSource)
    private readonly sourceRepo: Repository<BrandSource>,
    private readonly cache: RedisCacheService,
  ) {}

  private async resolveUuid(candidateId: string): Promise<string | null> {
    if (!candidateId || !candidateId.trim()) return null;
    const cleanId = candidateId.trim();
    if (isUuid(cleanId)) return cleanId;
    try {
      const rows = await this.brandRepo.query(
        `SELECT id FROM public.users 
         WHERE better_auth_id = $1 
            OR id::text = $1 
            OR EXISTS (SELECT 1 FROM "user" bu WHERE bu.id = $1 AND LOWER(bu.email) = LOWER(public.users.email))
         LIMIT 1`,
        [cleanId],
      );
      return rows?.[0]?.id || null;
    } catch {
      return null;
    }
  }

  /* ──── Brand Profile CRUD ──── */

  async listUserBrands(userId: string): Promise<BrandProfile[]> {
    const validUserId = await this.resolveUuid(userId);
    if (!validUserId) return [];

    const cacheKey = `brands:user:${validUserId}`;
    const cached = await this.cache.get<BrandProfile[]>(cacheKey);
    if (cached) return cached;

    const brands = await this.brandRepo.find({
      where: [{ userId: validUserId }, { workspaceId: validUserId }],
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
    await this.cache.set(cacheKey, brands, 60);
    return brands;
  }

  async getBrandById(userId: string, id: string): Promise<BrandProfile> {
    const validUserId = await this.resolveUuid(userId);
    if (!validUserId || !isUuid(id)) {
      throw new NotFoundException(`Brand profile with ID ${id} not found.`);
    }

    const cacheKey = `brands:id:${id}`;
    const cached = await this.cache.get<BrandProfile>(cacheKey);
    if (cached) return cached;

    const brand = await this.brandRepo.findOne({
      where: [
        { id, userId: validUserId },
        { id, workspaceId: validUserId },
      ],
    });
    if (!brand) {
      throw new NotFoundException(`Brand profile with ID ${id} not found.`);
    }
    await this.cache.set(cacheKey, brand, 60);
    return brand;
  }

  async createBrand(
    userId: string,
    dto: CreateBrandDto,
  ): Promise<BrandProfile> {
    const validUserId = await this.resolveUuid(userId);
    if (!validUserId) {
      throw new NotFoundException('User not found.');
    }

    if (dto.isDefault) {
      await this.brandRepo.update({ userId: validUserId }, { isDefault: false });
    }

    const { insights, sources, ...brandData } = dto as any;
    const brandName = brandData.name || brandData.brandName || 'Untitled Brand';
    const workspaceId = brandData.workspaceId || validUserId;

    const brand = this.brandRepo.create({
      ...brandData,
      brandName,
      userId: validUserId,
      workspaceId,
    });
    const saved = (await this.brandRepo.save(brand)) as unknown as BrandProfile;

    if (insights && typeof insights === 'object') {
      await this.createOrUpdateInsights(validUserId, saved.id, insights, 'USER_ENTERED');
    }

    if (Array.isArray(sources) && sources.length > 0) {
      await this.saveCrawledSources(saved.id, sources);
    }

    await this.cache.delPattern(`brands:*`);
    return saved;
  }

  async getFullBrand(
    userId: string,
    id: string,
  ): Promise<any> {
    const brand = await this.getBrandById(userId, id);
    const insight = await this.insightRepo.findOne({
      where: { brandId: id },
      order: { updatedAt: 'DESC' },
    });
    const sources = await this.sourceRepo.find({
      where: { brandId: id },
      order: { createdAt: 'ASC' },
    });
    return {
      ...brand,
      insight,
      sources,
    };
  }

  async updateBrand(
    userId: string,
    id: string,
    dto: UpdateBrandDto,
  ): Promise<BrandProfile> {
    const validUserId = await this.resolveUuid(userId);
    if (!validUserId || !isUuid(id)) {
      throw new NotFoundException(`Brand profile with ID ${id} not found.`);
    }

    const brand = await this.getBrandById(validUserId, id);

    if (dto.isDefault) {
      await this.brandRepo.update({ userId: validUserId }, { isDefault: false });
    }

    Object.assign(brand, dto);
    const saved = await this.brandRepo.save(brand);
    await this.cache.delPattern(`brands:*`);
    return saved;
  }

  async deleteBrand(userId: string, id: string): Promise<{ success: boolean }> {
    const validUserId = await this.resolveUuid(userId);
    if (!validUserId || !isUuid(id)) {
      throw new NotFoundException(`Brand profile with ID ${id} not found.`);
    }

    const brand = await this.getBrandById(validUserId, id);
    await this.brandRepo.remove(brand);
    await this.cache.delPattern(`brands:*`);
    return { success: true };
  }

  /* ──── Brand Insights CRUD ──── */

  async getInsights(userId: string, brandId: string): Promise<BrandInsight | null> {
    // Verify brand ownership
    await this.getBrandById(userId, brandId);

    return this.insightRepo.findOne({
      where: { brandId },
      order: { updatedAt: 'DESC' },
    });
  }

  async createOrUpdateInsights(
    userId: string,
    brandId: string,
    dto: UpdateBrandInsightsDto,
    source: 'AI_GENERATED' | 'USER_EDITED' | 'USER_ENTERED' | 'WEBSITE_DETECTED' = 'AI_GENERATED',
  ): Promise<BrandInsight> {
    // Verify brand ownership
    await this.getBrandById(userId, brandId);

    let insight = await this.insightRepo.findOne({ where: { brandId } });

    // Build field source tracking
    const fieldSources: Record<string, string> = insight?.fieldSources || {};
    for (const key of Object.keys(dto)) {
      const value = (dto as any)[key];
      if (value !== undefined && value !== null) {
        // If the user edited a field, always mark it USER_EDITED
        // AI/website sources only set if not already USER_EDITED
        if (source === 'USER_EDITED') {
          fieldSources[key] = 'USER_EDITED';
        } else if (fieldSources[key] !== 'USER_EDITED' && fieldSources[key] !== 'USER_ENTERED') {
          fieldSources[key] = source;
        }
      }
    }

    if (insight) {
      // Merge: user-edited fields take priority — don't overwrite them with AI data
      if (source !== 'USER_EDITED') {
        for (const key of Object.keys(dto)) {
          if (fieldSources[key] === 'USER_EDITED' || fieldSources[key] === 'USER_ENTERED') {
            delete (dto as any)[key];
          }
        }
      }
      Object.assign(insight, dto, { fieldSources });
      return this.insightRepo.save(insight);
    }

    insight = this.insightRepo.create({
      brandId,
      ...dto,
      fieldSources,
    });
    return this.insightRepo.save(insight);
  }

  async updateInsightsFromUser(
    userId: string,
    brandId: string,
    dto: UpdateBrandInsightsDto,
  ): Promise<BrandInsight> {
    return this.createOrUpdateInsights(userId, brandId, dto, 'USER_EDITED');
  }

  /* ──── Brand Sources CRUD ──── */

  async getSources(userId: string, brandId: string): Promise<BrandSource[]> {
    // Verify brand ownership
    await this.getBrandById(userId, brandId);

    return this.sourceRepo.find({
      where: { brandId },
      order: { createdAt: 'ASC' },
    });
  }

  async createSource(
    brandId: string,
    data: Partial<BrandSource>,
  ): Promise<BrandSource> {
    const source = this.sourceRepo.create({
      ...data,
      brandId,
    });
    return this.sourceRepo.save(source);
  }

  async updateSourceStatus(
    sourceId: string,
    status: string,
    content?: string,
    contentHash?: string,
  ): Promise<void> {
    await this.sourceRepo.update(sourceId, {
      status,
      content: content ?? undefined,
      contentHash: contentHash ?? undefined,
      lastCrawledAt: new Date(),
    });
  }

  async saveCrawledSources(
    brandId: string,
    sources: Partial<BrandSource>[],
  ): Promise<BrandSource[]> {
    await this.deleteSourcesForBrand(brandId);
    const entities = sources.map((s) =>
      this.sourceRepo.create({
        ...s,
        brandId,
      }),
    );
    return this.sourceRepo.save(entities);
  }

  async deleteSourcesForBrand(brandId: string): Promise<void> {
    await this.sourceRepo.delete({ brandId });
  }
}
