import { Injectable } from '@nestjs/common';

export interface PlatformSafeArea {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface PlatformConfig {
  id: string;
  name: string;
  channel: string;
  width: number;
  height: number;
  aspectRatio: string;
  safeArea: PlatformSafeArea;
  active: boolean;
  category: 'feed' | 'story' | 'banner' | 'cover';
  description: string;
  creditCost?: number;
}

export interface CampaignObjectiveConfig {
  id: string;
  label: string;
  description: string;
  recommendedCta: string[];
  metaOptimizationGoal: string;
}

export interface CreativeTypeConfig {
  id: string;
  name: string;
  description: string;
  recommendedLayout: string;
  badge: string;
}

@Injectable()
export class PlatformConfigService {
  private readonly platforms: PlatformConfig[] = [
    {
      id: 'instagram_post',
      name: 'Instagram Post',
      channel: 'Instagram',
      width: 1080,
      height: 1350,
      aspectRatio: '4:5',
      safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
      active: true,
      category: 'feed',
      description: 'Vertical portrait feed post (1080 × 1350 px)',
      creditCost: 1,
    },
    {
      id: 'instagram_square',
      name: 'Instagram Square',
      channel: 'Instagram',
      width: 1080,
      height: 1080,
      aspectRatio: '1:1',
      safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
      active: true,
      category: 'feed',
      description: 'Standard square feed post (1080 × 1080 px)',
      creditCost: 1,
    },
    {
      id: 'instagram_story',
      name: 'Instagram Story',
      channel: 'Instagram',
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
      safeArea: { top: 250, bottom: 250, left: 40, right: 40 },
      active: true,
      category: 'story',
      description: 'Full-screen mobile story with safe zone margins (1080 × 1920 px)',
      creditCost: 1,
    },
    {
      id: 'instagram_reel_cover',
      name: 'Instagram Reel Cover',
      channel: 'Instagram',
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
      safeArea: { top: 420, bottom: 420, left: 0, right: 0 },
      active: true,
      category: 'story',
      description: 'Vertical reel cover with centered 1:1 safe display (1080 × 1920 px)',
      creditCost: 1,
    },
    {
      id: 'facebook_post',
      name: 'Facebook Banner',
      channel: 'Facebook',
      width: 1200,
      height: 628,
      aspectRatio: '1.91:1',
      safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
      active: true,
      category: 'banner',
      description: 'Standard landscape feed link card & banner (1200 × 628 px)',
      creditCost: 1,
    },
    {
      id: 'facebook_cover',
      name: 'Facebook Cover',
      channel: 'Facebook',
      width: 820,
      height: 312,
      aspectRatio: '2.63:1',
      safeArea: { top: 20, bottom: 20, left: 40, right: 40 },
      active: true,
      category: 'cover',
      description: 'Page header & campaign banner (820 × 312 px)',
      creditCost: 1,
    },
    {
      id: 'linkedin_post',
      name: 'LinkedIn Showcase',
      channel: 'LinkedIn',
      width: 1080,
      height: 1350,
      aspectRatio: '4:5',
      safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
      active: true,
      category: 'feed',
      description: 'Professional B2B vertical feed showcase (1080 × 1350 px)',
      creditCost: 1,
    },
    {
      id: 'x_post',
      name: 'X (Twitter) Card',
      channel: 'X',
      width: 1200,
      height: 628,
      aspectRatio: '16:9',
      safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
      active: true,
      category: 'banner',
      description: 'Horizontal feed summary card (1200 × 628 px)',
      creditCost: 1,
    },
    {
      id: 'youtube_community',
      name: 'YouTube Community',
      channel: 'YouTube',
      width: 1080,
      height: 1080,
      aspectRatio: '1:1',
      safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
      active: true,
      category: 'feed',
      description: 'Channel community tab graphic (1080 × 1080 px)',
      creditCost: 1,
    },
    {
      id: 'pinterest_pin',
      name: 'Pinterest Pin',
      channel: 'Pinterest',
      width: 1000,
      height: 1500,
      aspectRatio: '2:3',
      safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
      active: true,
      category: 'feed',
      description: 'High-converting vertical viral pin (1000 × 1500 px)',
      creditCost: 1,
    },
  ];

  private readonly metaObjectives: CampaignObjectiveConfig[] = [
    {
      id: 'awareness',
      label: 'Brand Awareness',
      description: 'Maximize reach and memorable brand impression across Meta feeds',
      recommendedCta: ['Learn More', 'Explore Brand', 'Discover More'],
      metaOptimizationGoal: 'BRAND_AWARENESS',
    },
    {
      id: 'traffic',
      label: 'Traffic & Link Clicks',
      description: 'Drive high-intent visitors directly to landing page or product catalog',
      recommendedCta: ['Visit Site', 'Shop Collection', 'Learn More'],
      metaOptimizationGoal: 'LINK_CLICKS',
    },
    {
      id: 'engagement',
      label: 'Engagement & Viral Reach',
      description: 'Provoke high saves, shares, and social conversation',
      recommendedCta: ['Join Discussion', 'Share Story', 'Learn More'],
      metaOptimizationGoal: 'POST_ENGAGEMENT',
    },
    {
      id: 'leads',
      label: 'Lead Generation',
      description: 'Capture qualified inquiries, signups, and prospective client details',
      recommendedCta: ['Sign Up', 'Get Quote', 'Request Demo', 'Apply Now'],
      metaOptimizationGoal: 'LEAD_GENERATION',
    },
    {
      id: 'sales',
      label: 'Sales & Conversions',
      description: 'Direct-response conversion card spotlighting immediate purchase incentive',
      recommendedCta: ['Shop Now', 'Claim Offer', 'Order Today', 'Buy Now'],
      metaOptimizationGoal: 'CONVERSIONS',
    },
    {
      id: 'promotion',
      label: 'Promotional Launch',
      description: 'Urgency-driven announcement for limited drops and seasonal sales',
      recommendedCta: ['Claim 20% Off', 'Limited Drop', 'Shop Sale'],
      metaOptimizationGoal: 'PROMOTIONS',
    },
  ];

  private readonly creativeTypes: CreativeTypeConfig[] = [
    {
      id: 'editorial_prestige',
      name: 'Editorial Prestige',
      description: 'High-fashion magazine layout with asymmetric negative space and refined serif headings',
      recommendedLayout: 'Asymmetrical Editorial Grid',
      badge: 'Luxury',
    },
    {
      id: 'luxury_minimal',
      name: 'Luxury Minimal',
      description: 'Spacious Swiss-modernist architecture with monochromatic pedestals and restrained typography',
      recommendedLayout: 'Clean Swiss Grid',
      badge: 'Minimal',
    },
    {
      id: 'bold_story',
      name: 'Bold Storytelling',
      description: 'Punchy high-contrast typography blocks with saturated accents and maximum visual hook',
      recommendedLayout: 'Split Screen Hook',
      badge: 'High Impact',
    },
    {
      id: 'typographic_hero',
      name: 'Typographic Hero',
      description: 'Large-scale expressive type treatment communicating brand philosophy and core ethos',
      recommendedLayout: 'Typography Centered',
      badge: 'Brand Ethos',
    },
    {
      id: 'lookbook_product',
      name: 'Lookbook Showcase',
      description: 'Artistic product staging with directional natural lighting and subtle ambient grain',
      recommendedLayout: 'Framed Product Focus',
      badge: 'Commerce',
    },
  ];

  getAllPlatforms(): PlatformConfig[] {
    return this.platforms.filter((p) => p.active);
  }

  getMetaObjectives(): CampaignObjectiveConfig[] {
    return this.metaObjectives;
  }

  getCreativeTypes(): CreativeTypeConfig[] {
    return this.creativeTypes;
  }

  getStudioConfig() {
    return {
      masterFormat: {
        width: 1080,
        height: 1350,
        aspectRatio: '4:5',
        description: 'Universal master design canvas',
      },
      metaObjectives: this.metaObjectives,
      creativeTypes: this.creativeTypes,
      platforms: this.getAllPlatforms(),
    };
  }

  getPlatformById(id: string): PlatformConfig | null {
    const normalized = id.toLowerCase().replace(/[\s-]/g, '_');
    const match = this.platforms.find(
      (p) => p.id === normalized || p.name.toLowerCase() === id.toLowerCase(),
    );
    if (match) return match;

    // Fallback for square or custom
    return this.platforms[0];
  }

  resolveCustomPlatform(width: number, height: number): PlatformConfig {
    const ratio = (width / height).toFixed(2);
    return {
      id: `custom_${width}x${height}`,
      name: `Custom (${width} × ${height})`,
      channel: 'Custom',
      width: Math.max(300, Math.min(width, 4000)),
      height: Math.max(300, Math.min(height, 4000)),
      aspectRatio: `${ratio}:1`,
      safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
      active: true,
      category: 'feed',
      description: `Custom dimensions: ${width} × ${height} px`,
      creditCost: 1,
    };
  }
}
