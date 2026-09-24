import { BrandProfile, DesignStyle, NicheCategory } from '../types';

export interface CopyVariation {
  id: string;
  headline: string;
  body: string;
  tagline: string;
}

export function recommendStyle(niche: NicheCategory): DesignStyle {
  switch (niche) {
    case 'food_beverage':
      return 'lifestyle';
    case 'beauty_wellness':
      return 'minimalist';
    case 'fashion_apparel':
      return 'bold';
    case 'tech_gadgets':
      return 'tech';
    case 'fitness_sports':
      return 'bold';
    case 'pets':
      return 'playful';
    case 'home_lifestyle':
      return 'luxury';
    default:
      return 'lifestyle';
  }
}

export function generateBrandIdentity(
  siteUrl: string,
  description: string,
  niche: NicheCategory,
): Omit<BrandProfile, 'id' | 'createdAt'> {
  const desc = description.toLowerCase();

  let name = 'Meridian Coffee Co.';
  let tagline = 'Small-batch beans, roasted weekly.';
  let tone: BrandProfile['tone'] = 'Warm';

  // Infer name if user entered a site or brand words
  if (siteUrl && siteUrl.trim()) {
    const clean = siteUrl
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('.')[0];
    if (clean && clean.length > 2) {
      name = clean
        .split(/[-_]/)
        .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
        .filter(Boolean)
        .join(' ');
    }
  } else if (desc.includes('coffee') || desc.includes('roaster')) {
    name = 'Meridian Coffee Co.';
    tagline = 'Small-batch beans, roasted weekly.';
    tone = 'Warm';
  } else if (desc.includes('skin') || desc.includes('glow') || desc.includes('serum')) {
    name = 'Aster & Co. Skincare';
    tagline = 'Clean botanical hydration for luminous skin.';
    tone = 'Premium';
  } else if (desc.includes('apparel') || desc.includes('street') || desc.includes('wear')) {
    name = 'KINETIC Studio';
    tagline = 'Architectural streetwear engineered for movement.';
    tone = 'Bold';
  } else if (desc.includes('audio') || desc.includes('tech') || desc.includes('headphone')) {
    name = 'VORTEX Acoustics';
    tagline = 'Spatial precision. Unrivaled clarity.';
    tone = 'Direct';
  }

  // Curated color palettes per niche
  let colors = {
    primary: '#c98a3f',
    secondary: '#3a2c5a',
    accent: '#e0aa4e',
    background: '#0d0d14',
    text: '#ffffff',
  };

  let fonts = {
    display: "'Canela Fallback', 'Fraktion Serif', Georgia, serif",
    body: "'Söhne Fallback', 'Inter', -apple-system, sans-serif",
  };

  if (niche === 'food_beverage') {
    colors = {
      primary: '#c98a3f',
      secondary: '#3a2210',
      accent: '#e0aa4e',
      background: '#0d0d14',
      text: '#ffffff',
    };
    fonts = {
      display: "'Canela Fallback', Georgia, serif",
      body: "'Söhne Fallback', 'Inter', sans-serif",
    };
    tone = 'Warm';
  } else if (niche === 'beauty_wellness') {
    colors = {
      primary: '#a86fae',
      secondary: '#2e1830',
      accent: '#f2c4d8',
      background: '#0e0b14',
      text: '#ffffff',
    };
    fonts = {
      display: "'Canela Fallback', 'Didot', serif",
      body: "'Inter', sans-serif",
    };
    tone = 'Premium';
  } else if (niche === 'fashion_apparel' || niche === 'fitness_sports') {
    colors = {
      primary: '#ff5c38',
      secondary: '#1c1c24',
      accent: '#ffb020',
      background: '#09090e',
      text: '#ffffff',
    };
    fonts = {
      display: "'Impact', 'Inter', sans-serif",
      body: "'Inter', sans-serif",
    };
    tone = 'Bold';
  } else if (niche === 'tech_gadgets') {
    colors = {
      primary: '#3ecf8e',
      secondary: '#111827',
      accent: '#60a5fa',
      background: '#070b12',
      text: '#ffffff',
    };
    fonts = {
      display: "'SF Pro Display', 'Inter', sans-serif",
      body: "'SF Pro Text', 'Inter', sans-serif",
    };
    tone = 'Direct';
  } else if (niche === 'pets') {
    colors = {
      primary: '#f59e0b',
      secondary: '#1f2937',
      accent: '#34d399',
      background: '#0c0f16',
      text: '#ffffff',
    };
    fonts = {
      display: "'Comfortaa', 'Inter', sans-serif",
      body: "'Inter', sans-serif",
    };
    tone = 'Playful';
  }

  const nicheMap: Record<NicheCategory, string> = {
    food_beverage: 'Food & Beverage',
    fashion_apparel: 'Fashion & Apparel',
    beauty_wellness: 'Beauty & Wellness',
    home_lifestyle: 'Home & Lifestyle',
    tech_gadgets: 'Tech & Gadgets',
    fitness_sports: 'Fitness & Sports',
    pets: 'Pets',
    other: 'General Retail',
  };

  return {
    name,
    tagline,
    description: description || 'Artisanal high-craft product crafted with passion and precision.',
    websiteUrl: siteUrl || 'https://www.meridiancoffeeco.com',
    niche,
    nicheLabel: nicheMap[niche] || 'Food & Beverage',
    colors,
    fonts,
    tone,
  };
}

export function generateCopyVariations(
  productName: string,
  description: string,
  occasion: string,
  tone: string,
  niche: NicheCategory,
): CopyVariation[] {
  const prod = productName || 'Specialty Blend';
  const occ = occasion || 'Limited edition';

  const sets: Record<string, CopyVariation[]> = {
    food_beverage: [
      {
        id: 'var-1',
        headline: 'Small batch. Big morning.',
        body: 'Roasted in 12kg batches, every Tuesday. Restocking this Friday — set a reminder.',
        tagline: 'Freshly roasted single-origin beans.',
      },
      {
        id: 'var-2',
        headline: 'Your coffee, freshly obsessed.',
        body: 'We roast weekly so your cup never sits around. Taste single-origin brilliance.',
        tagline: 'Crafted without compromise.',
      },
      {
        id: 'var-3',
        headline: 'Wake up to something honest.',
        body: 'No artificial flavors, no shortcuts. Just exceptional beans, roasted right.',
        tagline: 'Every morning deserves this.',
      },
      {
        id: 'var-4',
        headline: 'Roasted this morning. Ready for yours.',
        body: 'Uncompromising flavor crafted in micro-batches. Delivered fresh to your door.',
        tagline: 'Peak flavor guaranteed.',
      },
      {
        id: 'var-5',
        headline: 'The morning ritual you deserve.',
        body: 'Notes of dark cocoa, toasted hazelnut, and sweet honey. Experience the restock.',
        tagline: 'Limited release batch.',
      },
    ],
    beauty_wellness: [
      {
        id: 'var-1',
        headline: 'Deep hydration. Zero weight.',
        body: 'Formulated with ultra-pure botanicals for long-lasting, dewy luminosity all day.',
        tagline: 'Radiance by clean science.',
      },
      {
        id: 'var-2',
        headline: 'Your skin’s daily reset.',
        body: 'Target dryness and restore your moisture barrier in just 3 drops each morning.',
        tagline: 'Clean clinical botanicals.',
      },
      {
        id: 'var-3',
        headline: 'Glow that outlasts your day.',
        body: '100% vegan, cruelty-free, and dermatologically tested for delicate skin.',
        tagline: 'Pure, honest skincare.',
      },
      {
        id: 'var-4',
        headline: 'Simplicity meets high efficacy.',
        body: 'Say goodbye to 10-step routines. One potent formula that truly delivers.',
        tagline: 'Effortless morning glow.',
      },
    ],
    tech_gadgets: [
      {
        id: 'var-1',
        headline: 'Engineered for silence.',
        body: 'Adaptive noise cancellation meets studio-grade dynamic acoustics. Hear every detail.',
        tagline: 'Zero distractions.',
      },
      {
        id: 'var-2',
        headline: 'Precision in every curve.',
        body: 'Aircraft-grade magnesium housing with 40-hour continuous battery reserve.',
        tagline: 'Next-generation architecture.',
      },
      {
        id: 'var-3',
        headline: 'Sound without boundaries.',
        body: 'Spatial audio calibrated to your environment in real time. Order yours today.',
        tagline: 'Ultra-low latency.',
      },
      {
        id: 'var-4',
        headline: 'Power meets minimalist form.',
        body: 'Designed for creators who demand uncompromising performance wherever they go.',
        tagline: 'Engineered to inspire.',
      },
    ],
  };

  const defaultVariations: CopyVariation[] = [
    {
      id: 'var-1',
      headline: `${occ.toUpperCase()} · ${prod}`,
      body: `${description || 'Crafted with premium materials and engineered for perfection.'} Get yours today.`,
      tagline: 'Limited availability.',
    },
    {
      id: 'var-2',
      headline: `The new standard in ${prod}.`,
      body: 'Elevate your everyday routine with uncompromising quality and timeless design.',
      tagline: 'Built to stand out.',
    },
    {
      id: 'var-3',
      headline: 'Made for those who notice the details.',
      body: 'Every stitch, material, and curve is intentional. Experience the difference.',
      tagline: 'Unmatched craftsmanship.',
    },
    {
      id: 'var-4',
      headline: `Discover what makes ${prod} different.`,
      body: 'Available for a limited time with complimentary worldwide express shipping.',
      tagline: 'Order before it sells out.',
    },
  ];

  return sets[niche] || defaultVariations;
}
