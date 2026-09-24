import { Injectable, Logger } from '@nestjs/common';

export interface MetaPlacementSpec {
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  safeZoneTop: number;
  safeZoneBottom: number;
  maxHeadlineChars: number;
  maxSubheadlineChars: number;
  recommendedCta: string;
}

@Injectable()
export class MetaDesignEngineService {
  private readonly logger = new Logger(MetaDesignEngineService.name);

  private readonly placements: Record<string, MetaPlacementSpec> = {
    'instagram_feed': {
      name: 'Instagram Feed Portrait',
      width: 1080,
      height: 1350,
      aspectRatio: '4:5',
      safeZoneTop: 70,
      safeZoneBottom: 80,
      maxHeadlineChars: 48,
      maxSubheadlineChars: 80,
      recommendedCta: 'SHOP NOW',
    },
    'instagram_story': {
      name: 'Instagram Story / Reel',
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
      safeZoneTop: 180,
      safeZoneBottom: 220,
      maxHeadlineChars: 40,
      maxSubheadlineChars: 60,
      recommendedCta: 'SWIPE UP / LEARN MORE',
    },
    'facebook_feed': {
      name: 'Facebook Link Ad',
      width: 1200,
      height: 628,
      aspectRatio: '1.91:1',
      safeZoneTop: 60,
      safeZoneBottom: 60,
      maxHeadlineChars: 50,
      maxSubheadlineChars: 90,
      recommendedCta: 'ORDER NOW',
    },
  };

  getPlacementSpec(placementName: string): MetaPlacementSpec {
    const key = placementName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (key.includes('story') || key.includes('reel')) return this.placements['instagram_story'];
    if (key.includes('facebook')) return this.placements['facebook_feed'];
    return this.placements['instagram_feed'];
  }

  optimizeForMetaAd(
    placement: string,
    content: {
      headline?: string;
      subheadline?: string;
      cta?: string;
      brandName: string;
    },
  ) {
    const spec = this.getPlacementSpec(placement);

    const headline = (content.headline || 'Exclusive Limited Release')
      .slice(0, spec.maxHeadlineChars)
      .trim();

    const subheadline = content.subheadline
      ? content.subheadline.slice(0, spec.maxSubheadlineChars).trim()
      : undefined;

    const cta = (content.cta || spec.recommendedCta).toUpperCase();

    return {
      spec,
      headline,
      subheadline,
      cta,
      safeMargins: {
        top: spec.safeZoneTop,
        bottom: spec.safeZoneBottom,
        left: 70,
        right: 70,
      },
    };
  }
}
