import { Injectable } from '@nestjs/common';
import {
  InspirationProvider,
  InspirationSearchRequest,
  InspirationSearchResult,
  InspirationItemDto,
} from '../interfaces/inspiration-provider.interface';

@Injectable()
export class DribbbleProvider implements InspirationProvider {
  readonly name = 'dribbble';

  async search(request: InspirationSearchRequest): Promise<InspirationSearchResult> {
    const query = request.query || 'social media flyer UI layout';
    const items: InspirationItemDto[] = [
      {
        provider: 'dribbble',
        externalId: 'drb_5001',
        externalUrl: 'https://dribbble.com/shots/5001',
        title: `${query} — High Impact Promo Card`,
        description: 'Vibrant gradient typography with elevated drop-shadow product placement',
        authorName: 'Shot Designer',
        mediaType: 'image',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
        width: 1200,
        height: 900,
        tags: [query, 'dribbble', 'graphic design'],
        colors: ['#8B5CF6', '#EC4899'],
        licenseInfo: { type: 'Dribbble Shot Reference' },
      },
    ];

    return {
      provider: 'dribbble',
      query,
      total: items.length,
      items,
    };
  }

  async getItem(externalId: string): Promise<InspirationItemDto | null> {
    return null;
  }
}
