import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

/** Input for one image-generation call. */
export interface GeneratePostImageParams {
  /** The full designer-style prompt. */
  prompt: string;
  /** Optional subject image (transparent PNG from bg-removal pipeline), base64. */
  imageBase64?: string;
  /** MIME type of the input image; defaults to image/png. */
  imageMimeType?: string;
  /** Optional multiple subject/product images (base64) */
  images?: Array<{ base64: string; mimeType?: string }>;
  /** Optional human model reference image (base64) */
  modelImage?: { base64: string; mimeType?: string };
  /**
   * User-supplied style references (screenshots, moodboards, "make it look like
   * this" examples). Each may carry an optional note explaining what the user
   * wants taken from it.
   */
  inspirationImages?: Array<{
    base64: string;
    mimeType?: string;
    note?: string;
  }>;
  /** Optional company logo image, base64. */
  logoBase64?: string;
  /** MIME type of the logo image; defaults to image/png. */
  logoMimeType?: string;
  /** Optional reference style images (base64) */
  referenceImages?: Array<{ base64: string; mimeType?: string }>;
  /** Target width in pixels (e.g. 1080) */
  width?: number;
  /** Target height in pixels (e.g. 1350) */
  height?: number;
  /** Aspect ratio string: 1:1, 4:5, 9:16, 16:9, 3:4 */
  aspectRatio?: string;
  /** Canvas postSize string e.g. instagram_post, etc. */
  postSize?: string;
}

/** One generated image returned by the engine. */
export interface GeneratedImage {
  imageBase64: string;
  mimeType: string;
  modelText?: string;
}

/**
 * Input for a refinement pass: the already-created creative plus the user's
 * change request. The existing image is attached as the FIRST content part so
 * the model treats it as the ground truth it must edit, not as inspiration.
 */
export interface EditPostImageParams {
  /** The previously generated image, base64 (without the data: prefix). */
  sourceImageBase64: string;
  /** MIME type of the source image; defaults to image/png. */
  sourceImageMimeType?: string;
  /** The fully assembled edit instruction sent to the image model. */
  prompt: string;
  /** Aspect ratio string of the canvas to preserve. */
  aspectRatio?: string;
  /** Canvas postSize string, used for the ratio fallback mapping. */
  postSize?: string;
}

/** Structured selections for guided post creation without prompt writing. */
export interface GuidedPostOptions {
  productName: string;
  platform?: string; // instagram, facebook, tiktok, linkedin, pinterest, twitter
  aspectRatio?: string; // 1:1, 4:5, 9:16, 16:9, 1.91:1, 3:4
  style?: string; // luxury, minimalist, bold, lifestyle, tech, playful
  occasion?: string; // sale, launch, event, seasonal, quote, awareness
  backgroundMode?: string; // ai_replace, studio_solid, nature, neon, luxury_marble, transparent, keep_original
  headline?: string;
  bodyCopy?: string;
  niche?: string;
  brandColors?: string[];
  brandTone?: string;
  targetAudience?: string;
  keyMessage?: string;
  cta?: string;
  language?: string;
  fontHeading?: string;
  fontBody?: string;
  layoutPreference?: string;
  brandName?: string;
  additionalInstructions?: string;
}

/** Product analysis extracted by Gemini Vision. */
export interface ProductAnalysisResult {
  productName: string;
  niche: string;
  description: string;
  dominantColors: string[];
  suggestedStyles: string[];
  suggestedHeadlines: string[];
}

export interface MarketingCopyParams {
  productName: string;
  platform: string;
  brandName?: string;
  niche?: string;
  occasion?: string;
  style?: string;
  targetAudience?: string;
  keyMessage?: string;
  tone?: string;
  language?: string;
  userHeadline?: string;
  userBodyCopy?: string;
  userCta?: string;
  variationIndex?: number;
  totalVariations?: number;
}

export interface MarketingCopyResult {
  headline: string;
  bodyCopy: string;
  cta: string;
}

/**
 * Structured description of a reference image, produced by Gemini Vision.
 * `styleSummary` is the sentence-dense art-direction brief that gets embedded
 * and later quoted back to the planner model as retrieval context.
 */
export interface StyleImageAnalysis {
  title: string;
  category: string;
  tags: string[];
  visualDescription: string;
  styleSummary: string;
  composition: string;
  lighting: string;
  typography: string;
  colorPalette: string[];
  mood: string;
  qualityBar: string;
  /** False when the deterministic fallback template was used. */
  analysedByAi: boolean;
}

/** Coerces an unknown JSON value into a trimmed string with a safe fallback. */
function asString(value: unknown, fallback: string, fallbackAlt?: string): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (fallback && fallback.trim()) return fallback.trim();
  return fallbackAlt ?? '';
}

/** Normalises a free-text category into a comparable lowercase slug. */
function normalizeCategory(value: string): string {
  const clean = (value || '').trim().toLowerCase();
  return clean ? clean.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100) : '';
}

/**
 * Deterministic analysis used when Gemini is not configured or the vision call
 * fails. Keeps the upload useful (it is still embedded and still retrievable)
 * instead of throwing the uploader's work away.
 */
function buildFallbackStyleAnalysis(context: {
  title?: string;
  notes?: string;
  hint?: string;
}): StyleImageAnalysis {
  const title = (context.title || '').trim() || 'Untitled style reference';
  const notes = (context.notes || '').trim();
  const hint = (context.hint || '').trim();

  return {
    title,
    category: '',
    tags: [],
    visualDescription:
      'User-supplied visual reference. Automated visual analysis is unavailable, so only the uploader notes below are indexed.',
    styleSummary: [
      `Reference titled "${title}".`,
      notes ? `Uploader note: ${notes}` : 'No additional uploader notes were provided.',
      hint ? `Intended usage: ${hint}` : '',
      'Treat this image as a visual anchor for palette, lighting quality and compositional feel; do not reproduce any brand, logo or readable text from it.',
    ]
      .filter(Boolean)
      .join(' '),
    composition: '',
    lighting: '',
    typography: '',
    colorPalette: [],
    mood: '',
    qualityBar: '',
    analysedByAi: false,
  };
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  private readonly client: GoogleGenAI | null;
  private readonly imageModel: string;
  private readonly textModel: string;

  constructor() {
    this.imageModel =
      process.env.GEMINI_IMAGE_MODEL || 'models/gemini-2.5-flash-image';
    this.textModel = process.env.GEMINI_TEXT_MODEL || 'gemini-3.8-flash';
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
    } else {
      this.client = null;
      this.logger.warn(
        'GEMINI_API_KEY is not set — post generation will use fallback engine until key is added in Backend/.env',
      );
    }
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Multimodal Product Analyzer: Inspects an uploaded product photo and uses
   * Gemini Vision to extract the product name, category, color palette, and headlines.
   */
  async analyzeProductImage(
    imageBase64: string,
    imageMimeType: string = 'image/png',
  ): Promise<ProductAnalysisResult> {
    if (!this.client) {
      return {
        productName: 'Featured Product',
        niche: 'General & E-Commerce',
        description: 'Quality commercial product ready for social campaign',
        dominantColors: ['#7c5cff', '#e0aa4e', '#ffffff'],
        suggestedStyles: ['luxury', 'minimalist', 'bold'],
        suggestedHeadlines: [
          'Crafted for Excellence.',
          'Elevate Your Daily Ritual.',
          'Limited Batch Available Now.',
        ],
      };
    }

    try {
      const prompt =
        'You are an expert commercial advertising creative director. ' +
        'Analyze this product photo carefully. Return a strictly valid JSON object with the following fields: ' +
        '"productName" (short, precise product name, e.g. "Single-Origin Specialty Coffee"), ' +
        '"niche" (e.g. "Food & Beverage", "Fashion & Apparel", "Beauty & Wellness", "Tech & Gadgets", "Home & Lifestyle"), ' +
        '"description" (1-2 sentence aesthetic summary of the item), ' +
        '"dominantColors" (array of 3 hex color codes matching the product, e.g. ["#2b1810", "#c99e52", "#f4ecd8"]), ' +
        '"suggestedStyles" (array of 2-3 style names from: "luxury", "minimalist", "bold", "lifestyle", "tech", "playful"), ' +
        '"suggestedHeadlines" (array of 3 short, punchy, high-converting social media headlines). ' +
        'Respond ONLY with the JSON object.';

      const response = await this.client.models.generateContent({
        model: this.textModel,
        contents: [
          {
            inlineData: {
              mimeType: imageMimeType,
              data: imageBase64,
            },
          },
          { text: prompt },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text || '{}';
      const parsed = JSON.parse(rawText);

      return {
        productName: parsed.productName || 'Featured Product',
        niche: parsed.niche || 'General',
        description: parsed.description || '',
        dominantColors: Array.isArray(parsed.dominantColors)
          ? parsed.dominantColors
          : ['#7c5cff', '#e0aa4e'],
        suggestedStyles: Array.isArray(parsed.suggestedStyles)
          ? parsed.suggestedStyles
          : ['luxury', 'minimalist'],
        suggestedHeadlines: Array.isArray(parsed.suggestedHeadlines)
          ? parsed.suggestedHeadlines
          : ['Upgrade Your Everyday.'],
      };
    } catch (error) {
      this.logger.warn(
        `Gemini Vision analysis fallback: ${error instanceof Error ? error.message : error}`,
      );
      return {
        productName: 'Premium Product',
        niche: 'Lifestyle & Retail',
        description: 'Authentic commercial subject',
        dominantColors: ['#3a2c5a', '#e0aa4e', '#ffffff'],
        suggestedStyles: ['luxury', 'lifestyle'],
        suggestedHeadlines: [
          'Small Batch. Big Impact.',
          'Experience Pure Quality.',
          'Special Release This Week.',
        ],
      };
    }
  }

  /**
   * Multimodal Style Analyser (Style Reference Library).
   *
   * Looks at a reference image a user uploaded and writes the *transferable*
   * design language of that image in words: palette temperature, lighting
   * quality, compositional structure, typographic hierarchy, texture, mood and
   * likely industry. Those words are what get embedded, which is how a picture
   * becomes searchable by a text brief.
   *
   * Falls back to a deterministic template when Gemini is unavailable so the
   * upload still succeeds and is still retrievable.
   */
  async analyzeStyleImage(
    imageBase64: string,
    imageMimeType: string = 'image/png',
    context: { title?: string; notes?: string; hint?: string } = {},
  ): Promise<StyleImageAnalysis> {
    const fallback = buildFallbackStyleAnalysis(context);

    if (!this.client) {
      return fallback;
    }

    const contextBlock = [
      context.title ? `Uploader's label: "${context.title}"` : '',
      context.notes ? `Uploader's note: "${context.notes}"` : '',
      context.hint ? `Uploader's instruction: "${context.hint}"` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const prompt =
      'You are a senior art director building a searchable visual style index. ' +
      'Study the attached social-media design and describe its TRANSFERABLE design language — ' +
      'the traits another designer could imitate on a completely different product. ' +
      'Never mention the specific brand, product, or people in the picture; describe the craft, not the subject.\n\n' +
      (contextBlock ? `${contextBlock}\n\n` : '') +
      'Return ONLY a valid JSON object with this exact schema:\n' +
      '{\n' +
      '  "title": "6-10 word label for this design language",\n' +
      '  "category": "one lowercase industry slug (beauty, fashion, food, tech, fitness, real-estate, education, hospitality, retail, automotive, travel, wellness, home)",\n' +
      '  "tags": ["4-8 lowercase keywords covering palette, lighting, layout, typography, mood"],\n' +
      '  "visualDescription": "2-3 dense sentences: what is in the frame, how it is lit, where the eye is led, how type is placed",\n' +
      '  "styleSummary": "1 paragraph (60-110 words) written as a reusable art-direction brief: lighting setup, lens/optics feel, colour temperature and contrast, compositional structure, typographic hierarchy, surface texture, and overall mood",\n' +
      '  "composition": "how the layout is structured, where focal point and text blocks sit",\n' +
      '  "lighting": "specific lighting description",\n' +
      '  "typography": "type character, weight, case and placement",\n' +
      '  "colorPalette": ["#hexcode", "#hexcode", "#hexcode"],\n' +
      '  "mood": "3-6 words for the emotional register",\n' +
      '  "qualityBar": "one sentence describing the minimum production standard this design implies"\n' +
      '}';

    try {
      const response = await this.client.models.generateContent({
        model: this.textModel,
        contents: [
          {
            inlineData: {
              mimeType: imageMimeType,
              data: imageBase64,
            },
          },
          { text: prompt },
        ],
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse(response.text || '{}');
      const palette = Array.isArray(parsed.colorPalette)
        ? parsed.colorPalette.filter((c: unknown) => typeof c === 'string')
        : [];
      const tags = Array.isArray(parsed.tags)
        ? parsed.tags.filter((t: unknown) => typeof t === 'string')
        : [];

      return {
        title: asString(parsed.title, context.title || '', 'Style reference'),
        category: normalizeCategory(asString(parsed.category, '', 'general')),
        tags: tags.map((t: string) => t.toLowerCase().trim()).filter(Boolean).slice(0, 10),
        visualDescription: asString(parsed.visualDescription, '', ''),
        styleSummary: asString(parsed.styleSummary, '', ''),
        composition: asString(parsed.composition, '', ''),
        lighting: asString(parsed.lighting, '', ''),
        typography: asString(parsed.typography, '', ''),
        colorPalette: palette.slice(0, 6),
        mood: asString(parsed.mood, '', ''),
        qualityBar: asString(parsed.qualityBar, '', ''),
        analysedByAi: true,
      };
    } catch (error) {
      this.logger.warn(
        `Style image analysis fallback: ${error instanceof Error ? error.message : error}`,
      );
      return fallback;
    }
  }

  /**
   * Generates professional, high-converting social media marketing copy:
   * 1. Attention-grabbing headline (punchy, non-cliché, strictly under 8 words)
   * 2. Persuasive body caption (2 sentences max, customer benefit / hook, strictly NO repetition of the headline)
   * 3. Clear Call-To-Action (CTA button or badge text, 2-3 words)
   * 4. Guarantees diverse creative angles across multiple variations
   */
  async generateMarketingCopy(
    params: MarketingCopyParams,
  ): Promise<MarketingCopyResult> {
    const userHeadline = params.userHeadline?.trim();
    const userBody = params.userBodyCopy?.trim();

    // If user provided BOTH a distinct headline and distinct body copy (not identical), preserve them!
    if (userHeadline && userBody && userHeadline !== userBody) {
      return {
        headline: userHeadline,
        bodyCopy: userBody,
        cta: params.userCta?.trim() || 'Shop Now',
      };
    }

    const angleThemes = [
      'Focus on exceptional craftsmanship, premium quality, and sensory distinction.',
      'Focus on aspirational lifestyle, emotional transformation, and social confidence.',
      'Focus on limited availability, exclusive seasonal release, and high-impact value.',
      'Focus on everyday problem-solving, seamless convenience, and effortless delight.',
    ];
    const angle =
      angleThemes[(params.variationIndex || 0) % angleThemes.length];

    if (!this.client) {
      return this.generateFallbackCopy(params, angle);
    }

    try {
      const prompt =
        'You are an elite creative director and commercial copywriter for global top-tier advertising campaigns.\n' +
        'Craft compelling, professional commercial social media copy for:\n' +
        `- Product / Subject: "${params.productName}"\n` +
        `- Brand Name: "${params.brandName || 'Featured Brand'}"\n` +
        `- Target Platform: ${params.platform || 'Instagram'}\n` +
        `- Target Audience: ${params.targetAudience || 'Modern discerning consumers'}\n` +
        `- Tone of Voice: ${params.tone || 'Refined, authentic, and high-converting'}\n` +
        `- Campaign Goal / Occasion: ${params.occasion || 'Seasonal campaign'}\n` +
        `- Industry Niche: ${params.niche || 'Lifestyle & Commercial'}\n` +
        `- Creative Angle: ${angle}\n` +
        (params.keyMessage
          ? `- Key Focus / Offer: "${params.keyMessage}"\n`
          : '') +
        (params.language && params.language.toLowerCase() !== 'english'
          ? `- Output Language: ${params.language}\n`
          : '') +
        '\nCRITICAL COPYWRITING MANDATES:\n' +
        '1. STRICT ZERO REPETITION: The headline, body copy, and call-to-action MUST be completely distinct. Do NOT repeat phrases, slogans, or key words between them.\n' +
        '2. NO GENERIC AI FILLER: Never use generic placeholder phrases like "Crafted with Social Yolo AI", "Elevate your game", "Game changer", "In a world where", or "Unleash your potential".\n' +
        '3. HEADLINE: Short, memorable, punchy hook (4 to 7 words max). NO quotation marks.\n' +
        '4. BODY CAPTION: Exactly 2 tight, elegant sentences. Sentence 1 hooks with a sensory or emotional benefit; Sentence 2 provides a compelling reason to act now.\n' +
        '5. CTA: Direct, punchy 2-3 words (e.g. "Shop The Reserve", "Claim 20% Off", "Explore The Drop", "Pre-Order Now", "Book A Consultation").\n' +
        '\nRespond ONLY with a valid JSON object matching this schema:\n' +
        '{\n' +
        '  "headline": "Short punchy headline",\n' +
        '  "bodyCopy": "Two sentences of compelling caption.",\n' +
        '  "cta": "2-3 word call to action"\n' +
        '}';

      const response = await this.client.models.generateContent({
        model: this.textModel,
        contents: [{ text: prompt }],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const raw = response.text || '{}';
      const parsed = JSON.parse(raw);

      if (parsed.headline && parsed.bodyCopy) {
        return {
          headline: String(parsed.headline).replace(/["']/g, '').trim(),
          bodyCopy: String(parsed.bodyCopy).trim(),
          cta: String(parsed.cta || params.userCta || 'Shop Now').trim(),
        };
      }
      return this.generateFallbackCopy(params, angle);
    } catch (err: any) {
      this.logger.warn(`Copy generation fallback: ${err.message}`);
      return this.generateFallbackCopy(params, angle);
    }
  }

  /**
   * Deterministic, zero-repetition fallback copy generator with diverse angles.
   */
  private generateFallbackCopy(
    params: MarketingCopyParams,
    angle?: string,
  ): MarketingCopyResult {
    const product = params.productName || 'Featured Product';
    const brand = params.brandName ? `${params.brandName} ` : '';
    const idx = (params.variationIndex || 0) % 3;

    const templates = [
      {
        headline: 'Precision In Every Detail.',
        bodyCopy: `Engineered from the finest materials for those who appreciate true distinction. Discover the new ${brand}${product} standard.`,
        cta: params.userCta || 'Explore Collection',
      },
      {
        headline: 'Redefine Your Everyday Experience.',
        bodyCopy: `Designed to seamlessly elevate your lifestyle with effortless sophistication. Experience what makes ${product} uniquely captivating.`,
        cta: params.userCta || 'Shop The Drop',
      },
      {
        headline: 'The Next Evolution Has Arrived.',
        bodyCopy: `Handcrafted in limited batches for discerning tastemakers. Secure your ${product} before this curated release concludes.`,
        cta: params.userCta || 'Claim Yours Now',
      },
    ];

    const chosen = templates[idx];

    // If user provided a single message, use it without repeating
    if (params.userHeadline && !params.userBodyCopy) {
      return {
        headline: params.userHeadline,
        bodyCopy: chosen.bodyCopy,
        cta: chosen.cta,
      };
    }

    return chosen;
  }

  /**
   * Converts user selections into an agency-grade art director prompt.
   * Completely eliminates the need for user prompt engineering!
   */
  synthesizeArtDirectorPrompt(opts: GuidedPostOptions): string {
    const rawContext =
      `${opts.occasion || ''} ${opts.layoutPreference || ''} ${opts.additionalInstructions || ''}`.toLowerCase();
    const product = opts.productName || 'commercial campaign';
    const platform = opts.platform || 'Instagram';
    const style = (opts.style || 'luxury').toLowerCase();

    // 1. Detect Post Archetype
    let archetypeLead =
      'World-class commercial advertising photography featuring';
    if (
      rawContext.includes('model') ||
      rawContext.includes('person') ||
      opts.layoutPreference === 'model_focus'
    ) {
      archetypeLead =
        'High-fashion editorial commercial portrait photography featuring an elegant, charismatic model';
    } else if (
      rawContext.includes('event') ||
      rawContext.includes('webinar') ||
      rawContext.includes('summit')
    ) {
      archetypeLead =
        'Prestigious architectural event stage and keynote visual celebrating';
    } else if (
      rawContext.includes('sale') ||
      rawContext.includes('promo') ||
      rawContext.includes('discount')
    ) {
      archetypeLead =
        'Luxury high-end promotional commercial campaign (Apple/Parisian retail caliber) showcasing';
    } else if (
      rawContext.includes('education') ||
      rawContext.includes('guide') ||
      rawContext.includes('tip')
    ) {
      archetypeLead =
        'Clean Scandinavian editorial infographic and knowledge layout about';
    } else if (
      rawContext.includes('announcement') ||
      rawContext.includes('milestone') ||
      rawContext.includes('launch')
    ) {
      archetypeLead =
        'Iconic brand milestone and architectural launch announcement featuring';
    } else if (rawContext.includes('lifestyle')) {
      archetypeLead =
        'Aspirational candid lifestyle storytelling scene capturing';
    }

    const occasion = opts.occasion
      ? `Campaign Occasion & Goal: ${opts.occasion}.`
      : '';
    const headline = opts.headline ? `Hero Headline: "${opts.headline}".` : '';
    const bodyCopy = opts.bodyCopy
      ? `Supporting copy: "${opts.bodyCopy}".`
      : '';
    const audience = opts.targetAudience
      ? `Target audience demographic: ${opts.targetAudience}.`
      : '';
    const keyMsg = opts.keyMessage
      ? `Key value proposition: ${opts.keyMessage}.`
      : '';
    const cta = opts.cta ? `Call to action pill badge: "${opts.cta}".` : '';
    const lang =
      opts.language && opts.language.toLowerCase() !== 'english'
        ? `Text language: ${opts.language}.`
        : '';
    const typography = opts.fontHeading
      ? `Typography styling: ${opts.fontHeading} headline font with ${opts.fontBody || 'clean sans-serif'} secondary copy.`
      : '';
    const layout = opts.layoutPreference
      ? `Composition: ${opts.layoutPreference} arrangement with generous golden-ratio negative space.`
      : '';

    let bgInstruction =
      'Staged in an immaculate high-end studio setting with soft natural cinematic lighting and subtle drop shadows.';
    if (opts.backgroundMode === 'studio_solid') {
      bgInstruction =
        'Clean solid monochromatic studio backdrop with cinematic pedestal and balanced soft key lighting.';
    } else if (opts.backgroundMode === 'nature') {
      bgInstruction =
        'Organic natural environment with warm golden-hour sun rays, subtle botanical leaves, and organic textures.';
    } else if (opts.backgroundMode === 'neon') {
      bgInstruction =
        'Vibrant nightlife atmosphere with futuristic neon glow, rim lighting, and energetic dark ambient backdrop.';
    } else if (opts.backgroundMode === 'luxury_marble') {
      bgInstruction =
        'Opulent Italian marble surface with gold leaf accents, gentle reflective highlights, and high-end editorial lighting.';
    } else if (opts.backgroundMode === 'transparent') {
      bgInstruction =
        'Pure clean isolated studio cutout with transparent background and crisp anti-aliased edges.';
    }

    let styleVibe =
      'High-end commercial advertising aesthetic, immaculate color grading, balanced negative space.';
    if (style.includes('minimal')) {
      styleVibe =
        'Scandinavian minimalist aesthetic, spacious layout, restrained typography hierarchy, muted tones, ample breathing room.';
    } else if (style.includes('bold')) {
      styleVibe =
        'Energetic bold advertising, dynamic angles, saturated vivid color accents, striking typography, high impact.';
    } else if (style.includes('luxury')) {
      styleVibe =
        'Luxury editorial aesthetic, gold and midnight tones, exquisite craftsmanship, cinematic depth of field, elegant serif touches.';
    } else if (style.includes('lifestyle')) {
      styleVibe =
        'Authentic candid lifestyle atmosphere, warm inviting light, natural human context, Kodak Portra color grading.';
    } else if (style.includes('playful') || style.includes('creative')) {
      styleVibe =
        'Creative artistic pop aesthetic, warm vibrant colors, rounded organic shapes, joyful expressive atmosphere.';
    } else if (style.includes('tech') || style.includes('modern')) {
      styleVibe =
        'Sleek modern futuristic aesthetic, precise geometric grid, clean ambient glow, contemporary polish.';
    } else if (style.includes('professional')) {
      styleVibe =
        'Corporate polished aesthetic, trust-building structure, elegant clean lines, executive authority.';
    }

    const colorHint = opts.brandColors?.length
      ? `Brand color palette: ${opts.brandColors.join(', ')}.`
      : '';

    const toneHint = opts.brandTone ? `Tone of voice: ${opts.brandTone}.` : '';
    const brandHint = opts.brandName ? `Brand name: "${opts.brandName}".` : '';
    const extraGuidance = opts.additionalInstructions
      ? `Creative guidelines: ${opts.additionalInstructions}.`
      : '';

    return (
      `${archetypeLead} ${product}${opts.brandName ? ` for brand "${opts.brandName}"` : ''}, engineered for ${platform}. ` +
      `${bgInstruction} ${styleVibe} ${occasion} ${headline} ${bodyCopy} ${keyMsg} ${cta} ${audience} ${toneHint} ${brandHint} ${colorHint} ${typography} ${layout} ${lang} ${extraGuidance} ` +
      `PRODUCTION STANDARDS: 8k ultra-high definition, Phase One / Hasselblad commercial optics, 85mm f/1.4 lens, Profoto studio softbox lighting, natural skin texture with realistic pores (for human models), authentic material textures, razor-sharp focus on primary subject, balanced negative space, zero duplicate text or distortion, strictly photorealistic commercial standard.`
    );
  }

  /**
   * Two-Stage Prompting (Design-Planning Pass):
   * Sends the comprehensive design brief to the Gemini TEXT model to produce an
   * agency-grade JSON visual plan with `image_generation_prompt`.
   */
  async planDesign(
    plannerPrompt: string,
  ): Promise<{ image_generation_prompt: string; art_direction?: any }> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Gemini is not configured: set GEMINI_API_KEY in Backend/.env',
      );
    }

    try {
      const response = await this.client.models.generateContent({
        model: this.textModel,
        contents: [{ text: plannerPrompt }],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text || '{}';
      const parsed = JSON.parse(rawText);

      if (
        parsed.image_generation_prompt &&
        typeof parsed.image_generation_prompt === 'string'
      ) {
        return parsed;
      }
      throw new Error('Design plan JSON missing image_generation_prompt');
    } catch (err: any) {
      this.logger.warn(
        `Design planning pass failed: ${err.message}. Will use direct prompt.`,
      );
      throw err;
    }
  }

  /**
   * Generates one finished post image with proper aspect ratio support.
   * Images are sent FIRST before text prompt so editing models anchor properly on references.
   */
  async generatePostImage(
    params: GeneratePostImageParams,
  ): Promise<GeneratedImage> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Gemini is not configured: set GEMINI_API_KEY in Backend/.env',
      );
    }

    const contents: Array<Record<string, unknown>> = [];

    // 1. Human Model reference image FIRST (if provided)
    if (params.modelImage && params.modelImage.base64) {
      contents.push({
        inlineData: {
          mimeType: params.modelImage.mimeType || 'image/png',
          data: params.modelImage.base64,
        },
      });
    }

    // 2. Subject hero product image(s) SECOND (supports single or multiple product photos)
    // Capped so the multimodal payload stays within the image model's token
    // budget — extra angles add diminishing returns and crowd out style refs.
    if (params.images && params.images.length > 0) {
      for (const img of params.images.slice(0, 3)) {
        if (img.base64) {
          contents.push({
            inlineData: {
              mimeType: img.mimeType || 'image/png',
              data: img.base64,
            },
          });
        }
      }
    } else if (params.imageBase64) {
      contents.push({
        inlineData: {
          mimeType: params.imageMimeType || 'image/png',
          data: params.imageBase64,
        },
      });
    }

    // 3. Company logo THIRD
    if (params.logoBase64) {
      contents.push({
        inlineData: {
          mimeType: params.logoMimeType || 'image/png',
          data: params.logoBase64,
        },
      });
    }

    // 3b. USER-SUPPLIED STYLE REFERENCES (screenshots / moodboards).
    // Attached before the RAG anchors because explicit user intent must
    // outweigh automatically-retrieved inspiration. Capped so a large upload
    // cannot blow the model's attention budget.
    if (params.inspirationImages && params.inspirationImages.length > 0) {
      const maxInspiration = Math.max(
        0,
        Math.min(4, Number(process.env.GEMINI_MAX_USER_REFS ?? 3)),
      );
      for (const insp of params.inspirationImages.slice(0, maxInspiration)) {
        if (insp.base64) {
          contents.push({
            inlineData: {
              mimeType: insp.mimeType || 'image/png',
              data: insp.base64,
            },
          });
        }
      }
    }

    // 4. RAG-retrieved style reference images (visual anchors from the library)
    // GEMINI_MAX_STYLE_REFS controls how many retrieved references are attached.
    if (params.referenceImages && params.referenceImages.length > 0) {
      const maxRefs = Math.max(
        0,
        Math.min(4, Number(process.env.GEMINI_MAX_STYLE_REFS ?? 2)),
      );
      for (const ref of params.referenceImages.slice(0, maxRefs)) {
        contents.push({
          inlineData: {
            mimeType: ref.mimeType || 'image/png',
            data: ref.base64,
          },
        });
      }
    }

    // 4. Text prompt LAST (models anchor better on references that precede the instruction)
    contents.push({ text: params.prompt });

    // Map requested postSize or ratio to Gemini supported aspect ratio format
    const targetRatio = this.resolveAspectRatio(params.postSize, params.aspectRatio);

    try {
      const response = await this.client.models.generateContent({
        model: this.imageModel,
        contents,
        config: {
          ...(targetRatio ? { imageConfig: { aspectRatio: targetRatio } } : {}),
        } as any,
      });

      const parts = (response.candidates?.[0]?.content?.parts ??
        []) as unknown as Array<{
        text?: string;
        inlineData?: { mimeType?: string; data?: string };
      }>;

      const imagePart = parts.find(
        (part) => part.inlineData && part.inlineData.data,
      );
      if (!imagePart || !imagePart.inlineData?.data) {
        const textOut = parts
          .map((part) => part.text ?? '')
          .join(' ')
          .trim();
        throw new BadRequestException(
          textOut
            ? `Gemini did not return an image. Model said: ${textOut}`
            : 'Gemini returned no image and no explanation.',
        );
      }

      return {
        imageBase64: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType || 'image/png',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Gemini image generation failed: ${message}`);
      throw new BadGatewayException(
        `Gemini image generation failed: ${message}`,
      );
    }
  }

  /**
   * Maps a canvas `postSize` or aspect-ratio string onto one of the aspect
   * ratios the Gemini image model actually accepts. Shared by the initial
   * generation pass and the edit/refinement pass so an edit never silently
   * changes the canvas shape of the creative.
   */
  private resolveAspectRatio(
    postSize?: string,
    aspectRatio?: string,
  ): string {
    const size = (postSize || '').toLowerCase();
    if (size === 'instagram_portrait' || size === 'linkedin_post') return '4:5';
    if (
      size === 'instagram_story' ||
      size === 'whatsapp_status' ||
      size === 'tiktok_video'
    ) {
      return '9:16';
    }
    if (
      size === 'twitter_post' ||
      size === 'youtube_thumbnail' ||
      size === 'meta_feed'
    ) {
      return '16:9';
    }
    if (size === 'pinterest_pin') return '3:4';

    if (aspectRatio) {
      const cleanRatio = aspectRatio.trim();
      if (['1:1', '4:5', '9:16', '16:9', '3:4', '4:3'].includes(cleanRatio)) {
        return cleanRatio;
      }
      if (cleanRatio === '1.91:1') return '16:9';
      if (cleanRatio === '2:3') return '4:5';
    }
    return '1:1';
  }

  /**
   * IMAGE EDITING / REFINEMENT.
   *
   * Takes the creative that was already generated, attaches it as the first
   * (and primary) content part, and asks the image model to produce a new
   * version that satisfies the user's change request while everything the user
   * did not ask to change stays exactly as it was.
   *
   * The aspect ratio of the original is preserved so an edit never silently
   * re-crops a 9:16 story into a square.
   */
  async editPostImage(
    params: EditPostImageParams,
  ): Promise<GeneratedImage> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Gemini is not configured: set GEMINI_API_KEY in Backend/.env',
      );
    }

    if (!params.sourceImageBase64) {
      throw new BadRequestException(
        'The original image is required to edit a generated post.',
      );
    }

    // The existing creative comes FIRST and alone, so the model anchors on it
    // as the thing to be modified rather than as one of several references.
    const contents: Array<Record<string, unknown>> = [
      {
        inlineData: {
          mimeType: params.sourceImageMimeType || 'image/png',
          data: params.sourceImageBase64,
        },
      },
      { text: params.prompt },
    ];

    const targetRatio = this.resolveAspectRatio(
      params.postSize,
      params.aspectRatio,
    );

    try {
      const response = await this.client.models.generateContent({
        model: this.imageModel,
        contents,
        config: {
          ...(targetRatio ? { imageConfig: { aspectRatio: targetRatio } } : {}),
        } as any,
      });

      const parts = (response.candidates?.[0]?.content?.parts ??
        []) as unknown as Array<{
        text?: string;
        inlineData?: { mimeType?: string; data?: string };
      }>;

      const imagePart = parts.find(
        (part) => part.inlineData && part.inlineData.data,
      );
      if (!imagePart || !imagePart.inlineData?.data) {
        const textOut = parts
          .map((part) => part.text ?? '')
          .join(' ')
          .trim();
        throw new BadRequestException(
          textOut
            ? `Gemini could not apply that edit. Model said: ${textOut}`
            : 'Gemini returned no edited image and no explanation.',
        );
      }

      return {
        imageBase64: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType || 'image/png',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Gemini image edit failed: ${message}`);
      throw new BadGatewayException(`Gemini image edit failed: ${message}`);
    }
  }
}
