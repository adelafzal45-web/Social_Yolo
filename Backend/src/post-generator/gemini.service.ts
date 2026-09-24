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

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  private readonly client: GoogleGenAI | null;
  private readonly imageModel: string;
  private readonly textModel: string;

  constructor() {
    this.imageModel =
      process.env.GEMINI_IMAGE_MODEL || 'models/gemini-2.5-flash-image';
    this.textModel = (
      process.env.GEMINI_MODEL ||
      process.env.GEMINI_TEXT_MODEL ||
      'gemini-3.6-flash'
    ).replace(/^models\//i, '');
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
   * Converts user selections into an agency-grade art director prompt.
   * Completely eliminates the need for user prompt engineering!
   */
  synthesizeArtDirectorPrompt(opts: GuidedPostOptions): string {
    const product = opts.productName || 'product';
    const platform = opts.platform || 'Instagram';
    const style = opts.style || 'luxury';
    const occasion = opts.occasion
      ? `Campaign Goal & Occasion: ${opts.occasion}.`
      : '';
    const headline = opts.headline ? `Headline copy: "${opts.headline}".` : '';
    const bodyCopy = opts.bodyCopy
      ? `Supporting copy/details: "${opts.bodyCopy}".`
      : '';
    const audience = opts.targetAudience
      ? `Target audience demographic: ${opts.targetAudience}.`
      : '';
    const keyMsg = opts.keyMessage
      ? `Key offer / message to highlight: ${opts.keyMessage}.`
      : '';
    const cta = opts.cta ? `Clear call to action button: "${opts.cta}".` : '';
    const lang =
      opts.language && opts.language.toLowerCase() !== 'english'
        ? `Text language: ${opts.language}.`
        : '';
    const typography = opts.fontHeading
      ? `Typography style: ${opts.fontHeading} headline font with ${opts.fontBody || 'clean sans-serif'} body text.`
      : '';
    const layout = opts.layoutPreference
      ? `Layout composition: ${opts.layoutPreference} arrangement with balanced negative space.`
      : '';

    let bgInstruction =
      'Staged in an immaculate high-end studio setting with soft natural cinematic lighting and subtle drop shadows.';
    if (opts.backgroundMode === 'studio_solid') {
      bgInstruction =
        'Clean solid monochromatic studio backdrop with cinematic product pedestal and balanced soft key lighting.';
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
    if (style === 'minimalist') {
      styleVibe =
        'Scandinavian minimalist aesthetic, spacious layout, restrained typography hierarchy, muted earthy tones, ample breathing room.';
    } else if (style === 'bold') {
      styleVibe =
        'Energetic bold advertising, dynamic diagonal angles, saturated vivid color accents, striking typography, high impact.';
    } else if (style === 'luxury') {
      styleVibe =
        'Luxury editorial aesthetic, gold and midnight tones, exquisite craftsmanship, cinematic depth of field, elegant serif touches.';
    } else if (style === 'lifestyle') {
      styleVibe =
        'Authentic candid lifestyle atmosphere, warm inviting light, natural human context, warm authentic color grading.';
    } else if (style === 'playful') {
      styleVibe =
        'Playful friendly pop aesthetic, warm bright colors, rounded organic shapes, joyful atmosphere.';
    } else if (style === 'tech') {
      styleVibe =
        'Sleek futuristic tech aesthetic, precise geometric grid, cool cyan and violet ambient glow, clean modern look.';
    }

    const colorHint = opts.brandColors?.length
      ? `Brand color harmony: ${opts.brandColors.join(', ')}.`
      : '';

    const toneHint = opts.brandTone ? `Tone of voice: ${opts.brandTone}.` : '';
    const brandHint = opts.brandName ? `Brand name: "${opts.brandName}".` : '';
    const extraGuidance = opts.additionalInstructions
      ? `Additional creative guidelines: ${opts.additionalInstructions}.`
      : '';

    return (
      `Professional social media commercial advertisement featuring ${product}${opts.brandName ? ` for brand "${opts.brandName}"` : ''}, tailored specifically for ${platform}. ` +
      `${bgInstruction} ${styleVibe} ${occasion} ${headline} ${bodyCopy} ${keyMsg} ${cta} ${audience} ${toneHint} ${brandHint} ${colorHint} ${typography} ${layout} ${lang} ${extraGuidance} ` +
      `Photorealistic commercial photography, 8k resolution, razor-sharp focus on the subject, perfectly balanced composition, readable typography.`
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

    // 1. Subject hero image FIRST
    if (params.imageBase64) {
      contents.push({
        inlineData: {
          mimeType: params.imageMimeType || 'image/png',
          data: params.imageBase64,
        },
      });
    }

    // 2. Company logo SECOND
    if (params.logoBase64) {
      contents.push({
        inlineData: {
          mimeType: params.logoMimeType || 'image/png',
          data: params.logoBase64,
        },
      });
    }

    // 3. Any visual reference style images
    if (params.referenceImages && params.referenceImages.length > 0) {
      for (const ref of params.referenceImages.slice(0, 2)) {
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
    let targetRatio = '1:1';
    const size = (params.postSize || '').toLowerCase();
    if (size === 'instagram_portrait' || size === 'linkedin_post') {
      targetRatio = '4:5';
    } else if (
      size === 'instagram_story' ||
      size === 'whatsapp_status' ||
      size === 'tiktok_video'
    ) {
      targetRatio = '9:16';
    } else if (
      size === 'twitter_post' ||
      size === 'youtube_thumbnail' ||
      size === 'meta_feed'
    ) {
      targetRatio = '16:9';
    } else if (size === 'pinterest_pin') {
      targetRatio = '3:4';
    } else if (params.aspectRatio) {
      const cleanRatio = params.aspectRatio.trim();
      if (['1:1', '4:5', '9:16', '16:9', '3:4', '4:3'].includes(cleanRatio)) {
        targetRatio = cleanRatio;
      } else if (cleanRatio === '1.91:1') {
        targetRatio = '16:9';
      } else if (cleanRatio === '2:3') {
        targetRatio = '4:5';
      }
    }

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

  async generateText(prompt: string): Promise<string> {
    if (!this.client) {
      return '';
    }
    try {
      const response = await this.client.models.generateContent({
        model: this.textModel,
        contents: [{ text: prompt }],
      });
      return response.text || '';
    } catch (err: any) {
      this.logger.warn(`Gemini text generation failed: ${err.message}`);
      return '';
    }
  }
}
