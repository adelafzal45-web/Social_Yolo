import { Injectable, Logger } from '@nestjs/common';
import {
  DesignReferenceItem,
  DesignReferenceProvider,
  ReferenceFilterOptions,
} from './reference-provider.interface';

@Injectable()
export class InternalLibraryProvider implements DesignReferenceProvider {
  readonly name = 'internal';
  private readonly logger = new Logger(InternalLibraryProvider.name);

  // Curated internal design dataset with pre-analyzed agency-grade design patterns
  private readonly references: DesignReferenceItem[] = [
    {
      id: 'ref-internal-001',
      source: 'internal',
      title: 'Minimal Nordic Ceramic Showcase',
      description: 'Clean architectural product spotlight with generous whitespace and stone pedestal',
      imageUrl: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1080&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=400&q=80',
      category: 'Home & Living',
      industry: 'Home & Decor',
      platform: 'Instagram Post',
      designType: 'Product Promotion',
      style: 'Minimal',
      aspectRatio: '1:1',
      width: 1080,
      height: 1080,
      composition: {
        layout: 'centered product',
        focalPoint: 'center pedestal',
        textPlacement: 'upper-center',
        ctaPlacement: 'bottom-center',
        grid: 'rule_of_thirds',
        whitespacePercentage: 45,
      },
      typography: {
        hierarchy: 'understated serif headline',
        weight: 'regular',
        bodyDensity: 'low',
        fontClassification: 'editorial-serif',
        contrast: 'high',
      },
      colorPalette: ['#2b2a27', '#d6cdb7', '#f4f1ea', '#938274'],
      visualElements: ['natural morning light', 'ceramic pedestal', 'stone shadows', 'airy negative space'],
      qualityScore: 96,
      licenseType: 'internal',
    },
    {
      id: 'ref-internal-002',
      source: 'internal',
      title: 'Luxury Swiss Chronograph Editorial',
      description: 'Moody dark metallic commercial advertisement with gold rim highlights and bold headline',
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1080&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
      category: 'Luxury Goods',
      industry: 'Luxury & Jewelry',
      platform: 'Instagram Post',
      designType: 'Brand Awareness',
      style: 'Luxury',
      aspectRatio: '4:5',
      width: 1080,
      height: 1350,
      composition: {
        layout: 'asymmetric editorial',
        focalPoint: 'lower-right product',
        textPlacement: 'upper-left',
        ctaPlacement: 'bottom-left',
        grid: 'golden_ratio',
        whitespacePercentage: 35,
      },
      typography: {
        hierarchy: 'large bold headline',
        weight: 'bold',
        bodyDensity: 'medium',
        fontClassification: 'modern-sans',
        contrast: 'maximum',
      },
      colorPalette: ['#09090b', '#d4af37', '#27272a', '#fafafa'],
      visualElements: ['metallic reflections', 'dark textured carbon', 'cinematic gold lighting'],
      qualityScore: 98,
      licenseType: 'internal',
    },
    {
      id: 'ref-internal-003',
      source: 'internal',
      title: 'Vibrant Athletic Energy Flyer',
      description: 'Bold high-energy sportswear advertisement with dynamic diagonal lines and vibrant contrast',
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1080&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
      category: 'Fashion & Apparel',
      industry: 'Sports & Fitness',
      platform: 'Facebook Post',
      designType: 'Sales Advertisement',
      style: 'Bold',
      aspectRatio: '16:9',
      width: 1200,
      height: 628,
      composition: {
        layout: 'split layout',
        focalPoint: 'floating footwear left',
        textPlacement: 'right-side block',
        ctaPlacement: 'bottom-right',
        grid: 'split',
        whitespacePercentage: 25,
      },
      typography: {
        hierarchy: 'heavy condensed title',
        weight: 'extrabold',
        bodyDensity: 'moderate',
        fontClassification: 'impact-condensed',
        contrast: 'vibrant',
      },
      colorPalette: ['#e11d48', '#0f172a', '#ffffff', '#f59e0b'],
      visualElements: ['floating footwear', 'energy particles', 'diagonal motion vectors'],
      qualityScore: 94,
      licenseType: 'internal',
    },
    {
      id: 'ref-internal-004',
      source: 'internal',
      title: 'SaaS Platform Analytics Story',
      description: 'Sleek dark-mode dashboard hero banner with glowing neon cyan gradients and technical badge',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1080&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
      category: 'Tech & Software',
      industry: 'Tech & SaaS',
      platform: 'Instagram Story',
      designType: 'Lead Generation',
      style: 'Futuristic',
      aspectRatio: '9:16',
      width: 1080,
      height: 1920,
      composition: {
        layout: 'vertical stack',
        focalPoint: 'center floating UI badge',
        textPlacement: 'top-center',
        ctaPlacement: 'lower-center swipe button',
        grid: 'centered',
        whitespacePercentage: 30,
      },
      typography: {
        hierarchy: 'tech modern geometric',
        weight: 'semibold',
        bodyDensity: 'low',
        fontClassification: 'mono-modern',
        contrast: 'high',
      },
      colorPalette: ['#030712', '#06b6d4', '#8b5cf6', '#f8fafc'],
      visualElements: ['glass card reflection', 'ambient gradient blur', 'metrics graphic', 'pill badge'],
      qualityScore: 95,
      licenseType: 'internal',
    },
    {
      id: 'ref-internal-005',
      source: 'internal',
      title: 'Artisan Cold Brew Coffee Magazine Ad',
      description: 'Warm editorial lifestyle publication spread with warm amber backlight and botanical accents',
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1080&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
      category: 'Food & Beverage',
      industry: 'Food & Beverage',
      platform: 'Instagram Post',
      designType: 'Product Launch',
      style: 'Editorial',
      aspectRatio: '4:5',
      width: 1080,
      height: 1350,
      composition: {
        layout: 'magazine grid',
        focalPoint: 'amber glassware center-left',
        textPlacement: 'top-left over whitespace',
        ctaPlacement: 'bottom-right elegant stamp',
        grid: 'editorial_asymmetric',
        whitespacePercentage: 38,
      },
      typography: {
        hierarchy: 'high-fashion serif title with small mono kicker',
        weight: 'medium',
        bodyDensity: 'medium',
        fontClassification: 'editorial-serif',
        contrast: 'high',
      },
      colorPalette: ['#1c1917', '#d97706', '#fef3c7', '#78350f'],
      visualElements: ['golden liquid droplets', 'roasted coffee beans', 'linen cloth texture'],
      qualityScore: 97,
      licenseType: 'internal',
    },
    {
      id: 'ref-internal-006',
      source: 'internal',
      title: 'Botanical Organic Skincare Promo',
      description: 'Fresh clean organic cosmetic presentation with morning dew drops and pastel peach backdrop',
      imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1080&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80',
      category: 'Beauty & Wellness',
      industry: 'Beauty & Skincare',
      platform: 'Pinterest',
      designType: 'Product Promotion',
      style: 'Clean',
      aspectRatio: '3:4',
      width: 1000,
      height: 1333,
      composition: {
        layout: 'clean pedestal',
        focalPoint: 'dropper bottle center',
        textPlacement: 'top-center header',
        ctaPlacement: 'bottom-center pill',
        grid: 'rule_of_thirds',
        whitespacePercentage: 42,
      },
      typography: {
        hierarchy: 'soft modern grotesque',
        weight: 'regular',
        bodyDensity: 'low',
        fontClassification: 'modern-sans',
        contrast: 'clean',
      },
      colorPalette: ['#fff7ed', '#ea580c', '#365314', '#ffffff'],
      visualElements: ['dew drops', 'eucalyptus leaves', 'matte glass dropper', 'sunlit shadows'],
      qualityScore: 93,
      licenseType: 'internal',
    },
  ];

  async searchReferences(
    query: string,
    filters?: ReferenceFilterOptions,
  ): Promise<DesignReferenceItem[]> {
    let list = [...this.references];

    if (filters?.platform) {
      const p = filters.platform.toLowerCase();
      list = list.filter((r) => r.platform?.toLowerCase().includes(p) || p.includes(r.platform?.toLowerCase() || ''));
    }

    if (filters?.industry) {
      const ind = filters.industry.toLowerCase();
      list = list.filter((r) => r.industry?.toLowerCase().includes(ind) || ind.includes(r.industry?.toLowerCase() || ''));
    }

    if (filters?.style) {
      const st = filters.style.toLowerCase();
      list = list.filter((r) => r.style?.toLowerCase() === st || r.style?.toLowerCase().includes(st));
    }

    if (filters?.designType) {
      const dt = filters.designType.toLowerCase();
      list = list.filter((r) => r.designType?.toLowerCase().includes(dt));
    }

    if (filters?.minQualityScore) {
      list = list.filter((r) => r.qualityScore >= (filters.minQualityScore || 0));
    }

    if (list.length === 0) {
      // Fallback to top quality general references if strict filter yields nothing
      list = this.references.slice(0, filters?.limit || 4);
    }

    return list.slice(0, filters?.limit || 10);
  }

  async getReference(id: string): Promise<DesignReferenceItem | null> {
    return this.references.find((r) => r.id === id) || null;
  }
}
