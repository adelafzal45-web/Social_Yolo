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
export class UserUploadProvider implements DesignReferenceProvider {
  readonly name = 'user_upload';

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
      .where('ref.source = :source', { source: 'user_upload' });

    if (filters?.industry) {
      qb.andWhere('ref.industry ILIKE :industry', { industry: `%${filters.industry}%` });
    }
    if (filters?.style) {
      qb.andWhere('ref.style ILIKE :style', { style: `%${filters.style}%` });
    }

    const items = await qb.take(filters?.limit || 10).getMany();
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
      composition: (ref.composition as any) || { layout: 'standard', focalPoint: 'center', textPlacement: 'top', ctaPlacement: 'bottom' },
      typography: (ref.typography as any) || { hierarchy: 'bold headline', weight: 'bold', bodyDensity: 'medium' },
      colorPalette: ref.colorPalette || ['#000000', '#ffffff'],
      visualElements: ref.visualElements || ['user asset'],
      qualityScore: ref.qualityScore,
      licenseType: ref.licenseType,
    }));
  }

  async getReference(id: string): Promise<DesignReferenceItem | null> {
    const ref = await this.referenceRepo.findOne({ where: { id, source: 'user_upload' } });
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
      composition: (ref.composition as any) || { layout: 'standard', focalPoint: 'center', textPlacement: 'top', ctaPlacement: 'bottom' },
      typography: (ref.typography as any) || { hierarchy: 'bold headline', weight: 'bold', bodyDensity: 'medium' },
      colorPalette: ref.colorPalette || ['#000000', '#ffffff'],
      visualElements: ref.visualElements || ['user asset'],
      qualityScore: ref.qualityScore,
      licenseType: ref.licenseType,
    };
  }
}
