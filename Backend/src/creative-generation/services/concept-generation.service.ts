import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../../post-generator/gemini.service';

export interface DesignConceptItem {
  id: string;
  name: string;
  badge?: string;
  direction: string;
  layout: string;
  typographyDirection: string;
  imageDirection: string;
  colorDirection: string;
  whyItFits: string;
  suggestedHeadline?: string;
  suggestedCta?: string;
}

export interface GenerateConceptsDto {
  brandName?: string;
  industry?: string;
  brandColors?: string[];
  tone?: string;
  designType?: 'creative' | 'meta_ad';
  platform?: string;
  objective?: string;
  mainTopic?: string;
  productName?: string;
  style?: string;
}

@Injectable()
export class ConceptGenerationService {
  private readonly logger = new Logger(ConceptGenerationService.name);

  constructor(private readonly geminiService: GeminiService) {}

  async generateConcepts(dto: GenerateConceptsDto): Promise<DesignConceptItem[]> {
    const brandName = dto.brandName || 'Brand';
    const industry = dto.industry || 'Lifestyle & Commerce';
    const designType = dto.designType || 'creative';
    const platform = dto.platform || 'Instagram Post';
    const objective = dto.objective || 'Product Promotion';
    const style = dto.style || 'Modern';
    const primaryColor = dto.brandColors?.[0] || '#7C5CFF';
    const secondaryColor = dto.brandColors?.[1] || '#E0AA4E';

    // 4 Distinct High-End Archetypes tailored to the requirements
    const defaultConcepts: DesignConceptItem[] = [
      {
        id: 'concept-1-bold',
        name: 'Bold Focal Anchor',
        badge: 'High CTR',
        direction: 'Maximal visual impact engineered to immediately stop social feed scrolling.',
        layout: 'Split screen with oversized hero product cutout on left and high-contrast typography block on right.',
        typographyDirection: 'Heavy grotesque sans-serif title with crisp tracking and high-contrast drop shadow.',
        imageDirection: 'Isolated floating product visual with subtle directional ambient rim lighting.',
        colorDirection: `Dominant brand primary (${primaryColor}) background with vibrant secondary (${secondaryColor}) CTA highlight.`,
        whyItFits: `Directly targets ${objective} by leading with raw visual authority and impossible-to-miss offer callouts on ${platform}.`,
        suggestedHeadline: dto.productName ? `Elevate With ${dto.productName}` : `Engineered For Excellence`,
        suggestedCta: 'Shop Now',
      },
      {
        id: 'concept-2-editorial',
        name: 'Editorial Prestige',
        badge: 'Prestige',
        direction: 'Sophisticated magazine-style layout conveying luxury, elegance, and authenticity.',
        layout: 'Asymmetrical editorial composition with 35% negative space, subtle inset border framing, and refined caption lockups.',
        typographyDirection: 'High-contrast editorial serif heading paired with minimalist geometric body copy.',
        imageDirection: 'Full-bleed atmospheric lifestyle scene with warm grain texture and soft diffused natural lighting.',
        colorDirection: `Muted dark obsidian canvas accented by refined gold and brand primary (${primaryColor}).`,
        whyItFits: `Elevates ${brandName}'s brand equity in the ${industry} space, signaling premium craftsmanship.`,
        suggestedHeadline: dto.productName ? `The New Era: ${dto.productName}` : `A Masterpiece in Every Detail`,
        suggestedCta: 'Explore Collection',
      },
      {
        id: 'concept-3-minimal',
        name: 'Minimal Geometric Modern',
        badge: 'Pure & Clean',
        direction: 'Breathable, clean aesthetic with strict visual hierarchy and purposeful whitespace.',
        layout: 'Centered hero showcase framed by generous negative space and micro-label metadata tags.',
        typographyDirection: 'Clean Swiss-style modernist typography with generous letter-spacing and crisp hierarchy.',
        imageDirection: 'Minimal studio product rendering on clean monochromatic pedestals with ultra-soft shadow falloff.',
        colorDirection: `Clean off-white / light slate canvas with selective brand accent hits on pills and badges.`,
        whyItFits: `Communicates clarity, focus, and transparency without visual clutter—perfect for modern digital consumers.`,
        suggestedHeadline: dto.productName ? `Simplicity Redefined: ${dto.productName}` : `Pure Performance`,
        suggestedCta: 'Discover More',
      },
      {
        id: 'concept-4-meta-conversion',
        name: 'Direct Performance Card',
        badge: designType === 'meta_ad' ? 'Meta Optimized' : 'Popular',
        direction: 'Conversion-engineered direct response architecture complying with strict platform safe zones.',
        layout: 'Framed card design with top urgency tag, hero product center, benefit checklist, and high-visibility bottom CTA.',
        typographyDirection: 'Bold geometric display headline with compact high-legibility subtitle (strictly <= 20% canvas text).',
        imageDirection: 'Dynamic in-action product demonstration or dramatic angle spotlighting key user benefit.',
        colorDirection: `High-contrast duotone palette designed for rapid mobile scanning on dark and light mode feeds.`,
        whyItFits: `Calibrated specifically for ${platform} performance marketing, driving immediate conversions and tap-throughs.`,
        suggestedHeadline: dto.productName ? `Claim Your ${dto.productName}` : `Limited Drop — Don't Miss Out`,
        suggestedCta: 'Claim Offer',
      },
    ];

    // If Gemini is available, customize the concepts dynamically with brand and product context
    try {
      if (this.geminiService && (this.geminiService as any).apiKey) {
        const prompt = `You are an elite creative design director. Given the project details below, output a JSON array of 4 distinct social media design concepts.
Brand: ${brandName} (${industry})
Tone: ${dto.tone || 'Modern'}
Platform: ${platform}
Objective: ${objective}
Style: ${style}
Product: ${dto.productName || 'Featured Collection'}
Topic: ${dto.mainTopic || 'Brand Announcement'}

Output format strictly as JSON array with 4 objects:
[
  {
    "id": "concept-1",
    "name": "Concept Title",
    "badge": "Short Badge",
    "direction": "1-2 sentences on creative direction",
    "layout": "Layout description",
    "typographyDirection": "Typography approach",
    "imageDirection": "Image and visual treatment",
    "colorDirection": "Color strategy",
    "whyItFits": "Why this aligns with the campaign objective and brand DNA",
    "suggestedHeadline": "Catchy headline",
    "suggestedCta": "Button CTA"
  }
]`;

        const responseText = await this.geminiService.generateText(prompt);
        const jsonMatch = responseText?.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length >= 3) {
            return parsed.map((item, idx) => ({
              ...defaultConcepts[idx % defaultConcepts.length],
              ...item,
              id: item.id || `concept-${idx + 1}`,
            }));
          }
        }
      }
    } catch (err: any) {
      this.logger.debug(`Gemini concept generation notice: ${err?.message}. Using deterministic design intelligence concepts.`);
    }

    return defaultConcepts;
  }
}
