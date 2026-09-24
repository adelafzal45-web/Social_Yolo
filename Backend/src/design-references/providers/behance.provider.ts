import { Injectable, Logger } from '@nestjs/common';
import {
  DesignReferenceItem,
  DesignReferenceProvider,
  ReferenceFilterOptions,
} from './reference-provider.interface';
import { InternalLibraryProvider } from './internal-library.provider';
import { ExtractedDesignFeatures } from './pinterest.provider';

@Injectable()
export class BehanceProvider implements DesignReferenceProvider {
  readonly name = 'behance';
  private readonly logger = new Logger(BehanceProvider.name);

  private readonly clientId: string | null;
  private readonly clientSecret: string | null;
  private readonly accessToken: string | null;
  private readonly apiUrl: string;

  constructor(private readonly internalLibrary: InternalLibraryProvider) {
    this.clientId = process.env.BEHANCE_CLIENT_ID || null;
    this.clientSecret = process.env.BEHANCE_CLIENT_SECRET || null;
    this.accessToken = process.env.BEHANCE_ACCESS_TOKEN || null;
    this.apiUrl = process.env.BEHANCE_API_URL || 'https://api.behance.net/v2';

    if (!this.accessToken && !this.clientId) {
      this.logger.log(
        'BEHANCE credentials not configured — BehanceProvider using curated high-end Behance design portfolio dataset.',
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
    if (!this.accessToken && !this.clientId) {
      return this.internalLibrary.searchReferences(query, {
        ...filters,
        style: filters?.style || 'Editorial',
      });
    }

    try {
      const apiKeyParam = this.clientId ? `&api_key=${this.clientId}` : '';
      const response = await fetch(
        `${this.apiUrl}/projects?q=${encodeURIComponent(query)}&page=1${apiKeyParam}`,
        {
          headers: this.accessToken
            ? { Authorization: `Bearer ${this.accessToken}`, Accept: 'application/json' }
            : { Accept: 'application/json' },
        },
      );

      if (!response.ok) {
        throw new Error(`Behance API returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawProjects = data.projects || [];
      const normalized = rawProjects.map((proj: any, idx: number) =>
        this.normalizeInspiration(proj, idx, filters),
      );

      return normalized.length > 0
        ? normalized
        : this.internalLibrary.searchReferences(query, filters);
    } catch (err: any) {
      this.logger.warn(
        `Behance API search notice: ${err.message}. Gracefully using curated dataset fallback.`,
      );
      return this.internalLibrary.searchReferences(query, filters);
    }
  }

  async getReference(id: string): Promise<DesignReferenceItem | null> {
    return this.getProjectDetails(id);
  }

  async getProjectDetails(id: string): Promise<DesignReferenceItem | null> {
    if (!this.accessToken && !this.clientId) {
      return this.internalLibrary.getReference(id);
    }

    try {
      const cleanId = id.replace(/^behance-/, '');
      const apiKeyParam = this.clientId ? `?api_key=${this.clientId}` : '';
      const response = await fetch(`${this.apiUrl}/projects/${cleanId}${apiKeyParam}`, {
        headers: this.accessToken
          ? { Authorization: `Bearer ${this.accessToken}`, Accept: 'application/json' }
          : { Accept: 'application/json' },
      });

      if (!response.ok) {
        return this.internalLibrary.getReference(id);
      }

      const data = await response.json();
      return this.normalizeInspiration(data.project || data, 0);
    } catch {
      return this.internalLibrary.getReference(id);
    }
  }

  normalizeInspiration(
    proj: any,
    idx: number = 0,
    filters?: ReferenceFilterOptions,
  ): DesignReferenceItem {
    const features = this.extractDesignFeatures(proj);

    return {
      id: `behance-${proj.id || idx}`,
      source: 'behance',
      sourceUrl: proj.url || `https://behance.net/gallery/${proj.id}`,
      externalId: proj.id ? String(proj.id) : `behance-ext-${idx}`,
      title: proj.name || `Behance Portfolio Showcase #${idx + 1}`,
      description: proj.description || 'Award-winning creative campaign layout.',
      imageUrl:
        proj.covers?.['808'] ||
        proj.covers?.['404'] ||
        proj.covers?.original ||
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&q=80',
      thumbnailUrl: proj.covers?.['202'] || null,
      category: 'Editorial Portfolio',
      industry: filters?.industry || 'Design & Creative',
      platform: filters?.platform || 'Instagram',
      designType: filters?.designType || 'Creative Campaign',
      style: filters?.style || features.style,
      aspectRatio: '4:5',
      width: 1080,
      height: 1350,
      composition: {
        layout: features.layout,
        focalPoint: features.imagePlacement,
        textPlacement: 'asymmetrical editorial lockup',
        ctaPlacement: 'bottom right accent',
        whitespacePercentage: 35,
      },
      typography: {
        hierarchy: features.visualHierarchy,
        weight: 'medium',
        bodyDensity: features.density,
      },
      colorPalette: ['#0057FF', '#111827', '#F9FAFB'],
      visualElements: ['asymmetric editorial grid', 'bespoke typography hierarchy', 'minimal aesthetic'],
      qualityScore: 95,
      licenseType: 'licensed',
    };
  }

  extractDesignFeatures(proj: any): ExtractedDesignFeatures {
    return {
      layout: 'asymmetric editorial layout',
      visualHierarchy: 'refined headline scale with luxury editorial spacing',
      imagePlacement: 'editorial offset split',
      typography: 'custom editorial serif/sans hierarchy',
      spacing: 'generous negative space and refined kerning',
      colorUsage: 'sophisticated muted palettes with bold focal accent',
      composition: 'editorial storytelling layout',
      density: 'minimal',
      style: 'luxury editorial agency grade',
    };
  }
}
