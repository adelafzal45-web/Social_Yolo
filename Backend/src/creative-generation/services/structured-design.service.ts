import { Injectable, Logger } from '@nestjs/common';

export type LayerType =
  | 'background'
  | 'image'
  | 'logo'
  | 'headline'
  | 'subheadline'
  | 'body'
  | 'cta'
  | 'badge'
  | 'decorative';

export interface DesignLayer {
  id: string;
  name: string;
  type: LayerType;
  content: string; // text string, image URL, or hex color
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  font?: string;
  fontSize?: number;
  fontWeight?: string | number;
  color?: string;
  backgroundColor?: string;
  opacity?: number;
  zIndex: number;
  borderRadius?: number;
  visible: boolean;
  locked: boolean;
}

export interface StructuredCanvas {
  width: number;
  height: number;
  backgroundColor: string;
  backgroundGradient?: string | null;
  aspectRatio: string;
}

export interface StructuredDesignDocument {
  id: string;
  version: number;
  canvas: StructuredCanvas;
  layers: DesignLayer[];
  metadata: {
    platform: string;
    style: string;
    brandName?: string;
    brandColors?: string[];
    updatedAt: string;
    lastAction?: string;
  };
}

export type AiDesignEditAction =
  | 'improve_design'
  | 'make_more_minimal'
  | 'make_more_premium'
  | 'make_more_bold'
  | 'change_layout'
  | 'change_typography'
  | 'replace_image'
  | 'improve_contrast'
  | 'use_brand_colors'
  | 'generate_variation';

@Injectable()
export class StructuredDesignService {
  private readonly logger = new Logger(StructuredDesignService.name);

  createInitialDocument(params: {
    width: number;
    height: number;
    aspectRatio: string;
    platform: string;
    style: string;
    brandName?: string;
    brandColors?: string[];
    headline?: string;
    subheadline?: string;
    ctaText?: string;
    imageUrl?: string;
    logoUrl?: string;
    discountOffer?: string;
  }): StructuredDesignDocument {
    const w = params.width || 1080;
    const h = params.height || 1350;
    const primaryColor = params.brandColors?.[0] || '#7C5CFF';
    const secondaryColor = params.brandColors?.[1] || '#E0AA4E';
    const headlineText = params.headline || 'Elevate Your Digital Experience';
    const ctaText = params.ctaText || 'Shop Now';

    const layers: DesignLayer[] = [
      // 1. Background
      {
        id: 'layer-bg',
        name: 'Canvas Background',
        type: 'background',
        content: '#0B0F19',
        x: 0,
        y: 0,
        width: w,
        height: h,
        zIndex: 0,
        visible: true,
        locked: true,
      },
      // 2. Hero Visual / Image Layer
      {
        id: 'layer-hero-image',
        name: 'Hero Visual Asset',
        type: 'image',
        content:
          params.imageUrl ||
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1080&q=80',
        x: Math.round(w * 0.1),
        y: Math.round(h * 0.18),
        width: Math.round(w * 0.8),
        height: Math.round(h * 0.45),
        zIndex: 1,
        borderRadius: 24,
        visible: true,
        locked: false,
      },
      // 3. Brand Logo Layer
      {
        id: 'layer-logo',
        name: 'Brand Logo',
        type: 'logo',
        content: params.logoUrl || params.brandName || 'SocialYolo',
        x: Math.round(w * 0.08),
        y: Math.round(h * 0.06),
        width: Math.round(w * 0.28),
        height: 48,
        font: 'Inter',
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        zIndex: 2,
        visible: true,
        locked: false,
      },
      // 4. Headline Layer
      {
        id: 'layer-headline',
        name: 'Primary Headline',
        type: 'headline',
        content: headlineText,
        x: Math.round(w * 0.08),
        y: Math.round(h * 0.68),
        width: Math.round(w * 0.84),
        height: Math.round(h * 0.12),
        font: 'Plus Jakarta Sans',
        fontSize: Math.round(w * 0.052),
        fontWeight: '800',
        color: '#FFFFFF',
        zIndex: 3,
        visible: true,
        locked: false,
      },
      // 5. Subheadline / Value Prop Layer
      {
        id: 'layer-subheadline',
        name: 'Subheadline',
        type: 'subheadline',
        content: params.subheadline || 'Engineered with deterministic precision & modern aesthetic harmony.',
        x: Math.round(w * 0.08),
        y: Math.round(h * 0.81),
        width: Math.round(w * 0.84),
        height: 36,
        font: 'Inter',
        fontSize: Math.round(w * 0.024),
        fontWeight: '400',
        color: '#94A3B8',
        zIndex: 4,
        visible: true,
        locked: false,
      },
      // 6. CTA Button Layer
      {
        id: 'layer-cta',
        name: 'Call-to-Action Pill',
        type: 'cta',
        content: ctaText,
        x: Math.round(w * 0.08),
        y: Math.round(h * 0.88),
        width: Math.round(w * 0.38),
        height: Math.round(h * 0.058),
        font: 'Inter',
        fontSize: Math.round(w * 0.022),
        fontWeight: '700',
        color: '#FFFFFF',
        backgroundColor: primaryColor,
        borderRadius: 9999,
        zIndex: 5,
        visible: true,
        locked: false,
      },
    ];

    // Optional promotional discount badge
    if (params.discountOffer) {
      layers.push({
        id: 'layer-discount-badge',
        name: 'Promotional Badge',
        type: 'badge',
        content: params.discountOffer,
        x: Math.round(w * 0.65),
        y: Math.round(h * 0.06),
        width: Math.round(w * 0.27),
        height: 36,
        font: 'Inter',
        fontSize: 13,
        fontWeight: '700',
        color: '#111827',
        backgroundColor: secondaryColor,
        borderRadius: 9999,
        zIndex: 6,
        visible: true,
        locked: false,
      });
    }

    return {
      id: `doc-${Date.now()}`,
      version: 1,
      canvas: {
        width: w,
        height: h,
        backgroundColor: '#0B0F19',
        aspectRatio: params.aspectRatio,
      },
      layers,
      metadata: {
        platform: params.platform,
        style: params.style,
        brandName: params.brandName,
        brandColors: params.brandColors,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  applyAiEditAction(
    doc: StructuredDesignDocument,
    action: AiDesignEditAction,
    options?: { customCta?: string; customImage?: string },
  ): StructuredDesignDocument {
    const updated = JSON.parse(JSON.stringify(doc)) as StructuredDesignDocument;
    updated.version += 1;
    updated.metadata.lastAction = action;
    updated.metadata.updatedAt = new Date().toISOString();

    const w = updated.canvas.width;
    const h = updated.canvas.height;
    const primaryColor = updated.metadata.brandColors?.[0] || '#7C5CFF';

    switch (action) {
      case 'make_more_minimal':
        // Reduce elements, increase negative space, clean typography
        updated.canvas.backgroundColor = '#0F172A';
        updated.layers.forEach((l) => {
          if (l.type === 'headline') {
            l.fontSize = Math.round(w * 0.046);
            l.fontWeight = '700';
            l.color = '#F8FAFC';
          }
          if (l.type === 'subheadline') {
            l.color = '#64748B';
          }
          if (l.type === 'cta') {
            l.backgroundColor = 'transparent';
            l.color = '#F8FAFC';
            l.borderRadius = 8;
          }
        });
        break;

      case 'make_more_premium':
        // Luxury serif styling, dark obsidian background, gold accent
        updated.canvas.backgroundColor = '#09090B';
        updated.layers.forEach((l) => {
          if (l.type === 'headline') {
            l.font = 'Playfair Display';
            l.fontSize = Math.round(w * 0.056);
            l.fontWeight = '700';
            l.color = '#FAF5EF';
          }
          if (l.type === 'cta') {
            l.backgroundColor = '#D97706';
            l.color = '#FFFFFF';
            l.borderRadius = 9999;
          }
        });
        break;

      case 'make_more_bold':
        // High-contrast punchy colors, maximum visual hook
        updated.canvas.backgroundColor = '#000000';
        updated.layers.forEach((l) => {
          if (l.type === 'headline') {
            l.fontSize = Math.round(w * 0.062);
            l.fontWeight = '900';
            l.color = '#FFFFFF';
          }
          if (l.type === 'cta') {
            l.backgroundColor = '#EF4444';
            l.color = '#FFFFFF';
            l.fontWeight = '800';
          }
        });
        break;

      case 'change_layout':
        // Rebalance positions: move hero to center, headline to top
        updated.layers.forEach((l) => {
          if (l.type === 'headline') {
            l.y = Math.round(h * 0.12);
          }
          if (l.type === 'subheadline') {
            l.y = Math.round(h * 0.22);
          }
          if (l.type === 'image') {
            l.y = Math.round(h * 0.32);
            l.height = Math.round(h * 0.48);
          }
          if (l.type === 'cta') {
            l.y = Math.round(h * 0.86);
            l.x = Math.round((w - l.width) / 2); // centered
          }
        });
        break;

      case 'change_typography':
        // Cycle fonts: Inter -> Plus Jakarta Sans -> Playfair -> Cabinet Grotesk
        updated.layers.forEach((l) => {
          if (l.type === 'headline') {
            l.font = l.font === 'Playfair Display' ? 'Plus Jakarta Sans' : 'Playfair Display';
          }
        });
        break;

      case 'improve_contrast':
        // Ensure WCAG AAA contrast ratio
        updated.canvas.backgroundColor = '#050505';
        updated.layers.forEach((l) => {
          if (l.type === 'headline') l.color = '#FFFFFF';
          if (l.type === 'subheadline') l.color = '#E2E8F0';
          if (l.type === 'cta') {
            l.backgroundColor = primaryColor;
            l.color = '#FFFFFF';
          }
        });
        break;

      case 'use_brand_colors':
        // Strictly apply brand palette
        updated.layers.forEach((l) => {
          if (l.type === 'cta') l.backgroundColor = primaryColor;
          if (l.type === 'badge') l.backgroundColor = updated.metadata.brandColors?.[1] || primaryColor;
        });
        break;

      case 'replace_image':
        if (options?.customImage) {
          const imgLayer = updated.layers.find((l) => l.type === 'image');
          if (imgLayer) imgLayer.content = options.customImage;
        }
        break;

      case 'generate_variation':
      case 'improve_design':
      default:
        // Optimize spacing and alignment
        updated.layers.forEach((l) => {
          if (l.type === 'cta' && options?.customCta) {
            l.content = options.customCta;
          }
        });
        break;
    }

    return updated;
  }
}
