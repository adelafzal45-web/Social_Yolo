import { Injectable } from '@nestjs/common';
import {
  InspirationProvider,
  InspirationSearchRequest,
  InspirationSearchResult,
  InspirationItemDto,
} from '../interfaces/inspiration-provider.interface';

@Injectable()
export class PinterestProvider implements InspirationProvider {
  readonly name = 'pinterest';

  async search(request: InspirationSearchRequest): Promise<InspirationSearchResult> {
    const query = request.query || 'social media campaign aesthetics';
    const items: InspirationItemDto[] = [
      {
        provider: 'pinterest',
        externalId: 'pin_3001',
        externalUrl: 'https://pinterest.com/pin/3001',
        title: `${query} — Editorial Carousel Layout`,
        description: 'Multi-slide storytelling format with elevated serif typography',
        authorName: 'Creative Direction Co.',
        mediaType: 'image',
        imageUrl: 'https://images.unsplash.com/photo-1513094735237-8f2714d57c13?auto=format&fit=crop&w=1000&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1513094735237-8f2714d57c13?auto=format&fit=crop&w=400&q=80',
        width: 1080,
        height: 1350,
        tags: [query, 'pinterest', 'carousel', 'typography'],
        colors: ['#D97706', '#1E293B'],
        licenseInfo: { type: 'Reference Moodboard Only' },
      },
      {
        provider: 'pinterest',
        externalId: 'pin_3002',
        externalUrl: 'https://pinterest.com/pin/3002',
        title: `${query} — High-Contrast Product Showcase`,
        description: 'Clean architectural shadows on concrete textures',
        authorName: 'Studio Palette',
        mediaType: 'image',
        imageUrl: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=1000&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=400&q=80',
        width: 1080,
        height: 1350,
        tags: [query, 'pinterest', 'minimalist'],
        colors: ['#F3F4F6', '#111827'],
        licenseInfo: { type: 'Reference Moodboard Only' },
      },
    ];

    return {
      provider: 'pinterest',
      query,
      total: items.length,
      items,
    };
  }

  async getItem(externalId: string): Promise<InspirationItemDto | null> {
    return null;
  }
}
