import { Injectable } from '@nestjs/common';
import {
  InspirationProvider,
  InspirationSearchRequest,
  InspirationSearchResult,
  InspirationItemDto,
} from '../interfaces/inspiration-provider.interface';

@Injectable()
export class BehanceProvider implements InspirationProvider {
  readonly name = 'behance';

  async search(request: InspirationSearchRequest): Promise<InspirationSearchResult> {
    const query = request.query || 'branding brand identity case study';
    const items: InspirationItemDto[] = [
      {
        provider: 'behance',
        externalId: 'beh_4001',
        externalUrl: 'https://behance.net/gallery/4001',
        title: `${query} — Visual Identity Direction`,
        description: 'Comprehensive brand architecture, primary grid system, and packaging layout',
        authorName: 'Atelier Identity',
        mediaType: 'image',
        imageUrl: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=400&q=80',
        width: 1400,
        height: 900,
        tags: [query, 'branding', 'behance'],
        colors: ['#3B82F6', '#0F172A'],
        licenseInfo: { type: 'Creative Reference Only' },
      },
    ];

    return {
      provider: 'behance',
      query,
      total: items.length,
      items,
    };
  }

  async getItem(externalId: string): Promise<InspirationItemDto | null> {
    return null;
  }
}
