import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DesignReferenceItem,
  DesignReferenceProvider,
  ReferenceFilterOptions,
} from './reference-provider.interface';
import { DesignReference } from '../entities/design-reference.entity';

@Injectable()
export class GeneratedDesignProvider implements DesignReferenceProvider {
  readonly name = 'socialyolo_memory';

  constructor(
    @InjectRepository(DesignReference)
    private readonly referenceRepo: Repository<DesignReference>,
  ) {}

  async searchReferences(
    query: string,
    filters?: ReferenceFilterOptions,
  ): Promise<DesignReferenceItem[]> {
    const qb = this.referenceRepo
      .createQueryBuilder('ref')
      .where('ref.source = :source', { source: 'socialyolo_memory' })
      .andWhere('ref.qualityScore >= :minQuality', { minQuality: filters?.minQualityScore || 85 });

    if (filters?.platform) {
      qb.andWhere('ref.platform ILIKE :platform', { platform: `%${filters.platform}%` });
    }
    if (filters?.style) {
      qb.andWhere('ref.style ILIKE :style', { style: `%${filters.style}%` });
    }

    const items = await qb.orderBy('ref.qualityScore', 'DESC').take(filters?.limit || 5).getMany();

    return items.map((ref) => ({
      id: ref.id,
      source: ref.source,
      sourceUrl: ref.sourceUrl,
      title: ref.title,
      description: ref.description,
      imageUrl: ref.imageUrl,
      thumbnailUrl: ref.thumbnailUrl,
      category: ref.category,
      industry: ref.industry,
      platform: ref.platform,
      designType: ref.designType,
      style: ref.style,
      aspectRatio: ref.aspectRatio,
      width: ref.width,
      height: ref.height,
      composition: (ref.composition as any) || { layout: 'proven studio pattern', focalPoint: 'product', textPlacement: 'top', ctaPlacement: 'bottom' },
      typography: (ref.typography as any) || { hierarchy: 'high converting headline', weight: 'bold', bodyDensity: 'low' },
      colorPalette: ref.colorPalette || ['#0f172a', '#3b82f6'],
      visualElements: ref.visualElements || ['studio approved creative'],
      qualityScore: ref.qualityScore,
      licenseType: ref.licenseType,
    }));
  }

  async getReference(id: string): Promise<DesignReferenceItem | null> {
    const ref = await this.referenceRepo.findOne({ where: { id, source: 'socialyolo_memory' } });
    if (!ref) return null;
    return {
      id: ref.id,
      source: ref.source,
      sourceUrl: ref.sourceUrl,
      title: ref.title,
      description: ref.description,
      imageUrl: ref.imageUrl,
      thumbnailUrl: ref.thumbnailUrl,
      category: ref.category,
      industry: ref.industry,
      platform: ref.platform,
      designType: ref.designType,
      style: ref.style,
      aspectRatio: ref.aspectRatio,
      width: ref.width,
      height: ref.height,
      composition: (ref.composition as any) || { layout: 'proven studio pattern', focalPoint: 'product', textPlacement: 'top', ctaPlacement: 'bottom' },
      typography: (ref.typography as any) || { hierarchy: 'high converting headline', weight: 'bold', bodyDensity: 'low' },
      colorPalette: ref.colorPalette || ['#0f172a', '#3b82f6'],
      visualElements: ref.visualElements || ['studio approved creative'],
      qualityScore: ref.qualityScore,
      licenseType: ref.licenseType,
    };
  }
}
