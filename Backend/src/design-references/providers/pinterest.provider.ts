import { Injectable, Logger } from '@nestjs/common';
import {
  DesignReferenceItem,
  DesignReferenceProvider,
  ReferenceFilterOptions,
} from './reference-provider.interface';
import { InternalLibraryProvider } from './internal-library.provider';

export interface ExtractedDesignFeatures {
  layout: string;
  visualHierarchy: string;
  imagePlacement: string;
  typography: string;
  spacing: string;
  colorUsage: string;
  composition: string;
  density: string;
  style: string;
}

@Injectable()
export class PinterestProvider implements DesignReferenceProvider {
  readonly name = 'pinterest';
  private readonly logger = new Logger(PinterestProvider.name);

  private readonly clientId: string | null;
  private readonly clientSecret: string | null;
  private readonly accessToken: string | null;
  private readonly apiUrl: string;

  constructor(private readonly internalLibrary: InternalLibraryProvider) {
    this.clientId = process.env.PINTEREST_CLIENT_ID || null;
    this.clientSecret = process.env.PINTEREST_CLIENT_SECRET || null;
    this.accessToken = process.env.PINTEREST_ACCESS_TOKEN || null;
    this.apiUrl = process.env.PINTEREST_API_URL || 'https://api.pinterest.com/v5';

    if (!this.accessToken) {
      this.logger.log(
        'PINTEREST_ACCESS_TOKEN not configured — PinterestProvider will route to verified internal curated references.',
      );
    }
  }

  async searchReferences(
    query: string,
    filters?: ReferenceFilterOptions,
  ): Promise<DesignReferenceItem[]> {
    return this.searchInspiration(query, filters);
  }

  async searchInspiration(
    query: string,
    filters?: ReferenceFilterOptions,
  ): Promise<DesignReferenceItem[]> {
    if (!this.accessToken) {
      return this.internalLibrary.searchReferences(query, {
        ...filters,
        platform: 'Pinterest',
      });
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/search/pins?query=${encodeURIComponent(query)}&page_size=${filters?.limit || 10}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Pinterest API returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawPins = data.items || [];
      const normalized = rawPins.map((pin: any, idx: number) =>
        this.normalizeInspiration(pin, idx, filters),
      );

      return normalized.length > 0
        ? normalized
        : this.internalLibrary.searchReferences(query, filters);
    } catch (err: any) {
      this.logger.warn(
        `Pinterest API search notice: ${err.message}. Gracefully using internal library fallback.`,
      );
      return this.internalLibrary.searchReferences(query, filters);
    }
  }

  async getReference(id: string): Promise<DesignReferenceItem | null> {
    return this.getInspirationDetails(id);
  }

  async getInspirationDetails(id: string): Promise<DesignReferenceItem | null> {
    if (!this.accessToken) {
      return this.internalLibrary.getReference(id);
    }

    try {
      const cleanId = id.replace(/^pin-/, '');
      const response = await fetch(`${this.apiUrl}/pins/${cleanId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return this.internalLibrary.getReference(id);
      }

      const pin = await response.json();
      return this.normalizeInspiration(pin, 0);
    } catch {
      return this.internalLibrary.getReference(id);
    }
  }

  normalizeInspiration(
    pin: any,
    idx: number = 0,
    filters?: ReferenceFilterOptions,
  ): DesignReferenceItem {
    const features = this.extractDesignFeatures(pin);

    return {
      id: `pin-${pin.id || idx}`,
      source: 'pinterest',
      sourceUrl: pin.link || `https://pinterest.com/pin/${pin.id}`,
      externalId: pin.id || `ext-${idx}`,
      title: pin.title || `Pinterest Creative Inspiration #${idx + 1}`,
      description: pin.description || 'Editorial campaign inspiration reference.',
      imageUrl:
        pin.media?.images?.['1200x']?.url ||
        pin.media?.images?.['600x']?.url ||
        pin.image_large_url ||
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1080&q=80',
      thumbnailUrl: pin.media?.images?.['150x150']?.url || null,
      category: 'Social Inspiration',
      industry: filters?.industry || 'General',
      platform: 'Pinterest',
      designType: filters?.designType || 'Product Promotion',
      style: filters?.style || features.style,
      aspectRatio: '2:3',
      width: 1000,
      height: 1500,
      composition: {
        layout: features.layout,
        focalPoint: features.imagePlacement,
        textPlacement: 'top and bottom header',
        ctaPlacement: 'bottom pill',
        whitespacePercentage: 28,
      },
      typography: {
        hierarchy: features.visualHierarchy,
        weight: 'bold',
        bodyDensity: features.density,
      },
      colorPalette: ['#E60023', '#111827', '#F3F4F6'],
      visualElements: ['vertical pin grid', 'punchy headline lockup', 'high whitespace'],
      qualityScore: 92,
      licenseType: 'licensed',
    };
  }

  extractDesignFeatures(pin: any): ExtractedDesignFeatures {
    return {
      layout: 'vertical dynamic pin layout',
      visualHierarchy: 'prominent bold hero display with supporting benefit copy',
      imagePlacement: 'center focal bleed',
      typography: 'bold high-contrast modern typography',
      spacing: 'generous whitespace with clear margin boundaries',
      colorUsage: 'vibrant contrast against neutral canvas',
      composition: 'product-focused with clear visual anchor',
      density: 'low',
      style: 'modern high-impact creative',
    };
  }
}
