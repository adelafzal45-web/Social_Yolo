import { Injectable } from '@nestjs/common';
import { RetrievedStyle } from './retriever.service';

/** Maximum characters of each style summary that go into the final prompt. */
const MAX_SUMMARY_CHARS = 240;

export interface DesignBriefContext {
  prompt?: string;
  category?: string;
  content?: string;
  colorScheme?: string;
  font?: string;
  postSize?: string;
  outputType?: string;
  hasSubjectImage?: boolean;
  backgroundRemoved?: boolean;
  hasLogo?: boolean;

  // Guided fields
  productName?: string;
  platform?: string;
  aspectRatio?: string;
  style?: string;
  occasion?: string;
  backgroundMode?: string;
  headline?: string;
  bodyCopy?: string;
  targetAudience?: string;
  keyMessage?: string;
  cta?: string;
  language?: string;
  tone?: string;
  fontHeading?: string;
  fontBody?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  brandColors?: string[];
  layoutPreference?: string;
  niche?: string;
  brandName?: string;
  additionalInstructions?: string;
}

@Injectable()
export class PromptBuilderService {
  /**
   * Builds the prompt for the Gemini TEXT model (Stage 1 design-planning pass).
   * Generates a structured JSON design plan containing image_generation_prompt.
   */
  buildPlannerPrompt(
    ctx: DesignBriefContext,
    styles: RetrievedStyle[],
  ): string {
    const lines: string[] = [];

    lines.push(
      'You are an award-winning Creative Art Director for elite commercial social media advertising campaigns.',
      'Your task is to analyze the following comprehensive design brief and create an agency-grade visual design plan for the image generator.',
      '',
      '### DESIGN BRIEF SPECIFICATIONS:',
    );

    if (ctx.prompt) lines.push(`- Core User Concept / Idea: "${ctx.prompt}"`);
    if (ctx.productName)
      lines.push(`- Featured Product / Service: "${ctx.productName}"`);
    if (ctx.brandName) lines.push(`- Brand Name: "${ctx.brandName}"`);
    if (ctx.category || ctx.niche)
      lines.push(`- Commercial Category / Niche: ${ctx.category || ctx.niche}`);
    if (ctx.platform) lines.push(`- Target Platform: ${ctx.platform}`);
    if (ctx.postSize) lines.push(`- Canvas Post Size: ${ctx.postSize}`);
    if (ctx.aspectRatio)
      lines.push(`- Canvas Aspect Ratio: ${ctx.aspectRatio}`);
    if (ctx.style) lines.push(`- Aesthetic Direction: ${ctx.style}`);
    if (ctx.occasion) lines.push(`- Campaign Occasion / Goal: ${ctx.occasion}`);
    if (ctx.backgroundMode)
      lines.push(`- Staging / Background Environment: ${ctx.backgroundMode}`);
    if (ctx.headline) lines.push(`- Main Headline: "${ctx.headline}"`);
    if (ctx.content)
      lines.push(
        `- Exact On-Post Copy (MUST BE RENDERED VERBATIM): "${ctx.content}"`,
      );
    if (ctx.bodyCopy) lines.push(`- Supporting Body Copy: "${ctx.bodyCopy}"`);
    if (ctx.keyMessage)
      lines.push(`- Key Message / Offer: "${ctx.keyMessage}"`);
    if (ctx.cta) lines.push(`- Call To Action (Button / Badge): "${ctx.cta}"`);
    if (ctx.targetAudience)
      lines.push(`- Target Audience: ${ctx.targetAudience}`);
    if (ctx.tone) lines.push(`- Tone of Voice: ${ctx.tone}`);
    if (ctx.colorScheme) lines.push(`- Brand Color Scheme: ${ctx.colorScheme}`);
    if (ctx.brandColors && ctx.brandColors.length > 0)
      lines.push(`- Brand Palette Hex Codes: ${ctx.brandColors.join(', ')}`);
    if (ctx.font) lines.push(`- Typography Font: ${ctx.font}`);
    if (ctx.fontHeading) lines.push(`- Heading Font: ${ctx.fontHeading}`);
    if (ctx.fontBody) lines.push(`- Body Font: ${ctx.fontBody}`);
    if (ctx.layoutPreference)
      lines.push(`- Layout Composition: ${ctx.layoutPreference}`);
    if (ctx.language) lines.push(`- Language of Text: ${ctx.language}`);
    if (ctx.outputType)
      lines.push(
        `- Requested Image Output Format: ${ctx.outputType.toUpperCase()}`,
      );
    if (ctx.additionalInstructions)
      lines.push(
        `- Additional Creative Guidelines: ${ctx.additionalInstructions}`,
      );
    if (ctx.hasSubjectImage)
      lines.push(
        `- Subject Image: YES (Uploaded product photo attached — background removed=${ctx.backgroundRemoved ?? false})`,
      );
    if (ctx.hasLogo)
      lines.push(
        '- Brand Logo: YES (Company logo attached, must be integrated prominently into design)',
      );

    if (styles.length > 0) {
      lines.push('', '### REFERENCE PAST DESIGNS (STYLE RETRIEVAL FROM RAG):');
      styles.forEach((style, index) => {
        const origin =
          style.source === 'user' ? 'high-rated past post' : 'curated sample';
        lines.push(
          `${index + 1}. [${origin}] "${style.userPrompt}": ${truncate(style.contentText, MAX_SUMMARY_CHARS)}`,
        );
      });
      lines.push(
        'Harmonize with the tone, hierarchy, and aesthetic quality of these references.',
      );
    }

    lines.push(
      '',
      '### STRICT INSTRUCTIONS:',
      '1. Return ONLY a valid, parseable JSON object without markdown fences or code blocks.',
      '2. The JSON MUST follow this exact schema:',
      '{',
      '  "image_generation_prompt": "A vivid, complete, detailed prompt describing the exact photographic scene, product placement, background textures, lighting, typography layout, verbatim copy, and color grading for the image generator",',
      '  "art_direction": {',
      '    "color_palette": ["Primary color", "Secondary color", "Accent color"],',
      '    "typography": "Description of font styles and text hierarchy",',
      '    "composition": "Layout and spatial hierarchy description",',
      '    "lighting_and_mood": "Lighting setup and emotional atmosphere"',
      '  }',
      '}',
      '3. In "image_generation_prompt", ensure any on-post text (headline, content copy, discount, CTA) is clearly instructed to be rendered legibly with sharp typography.',
      '4. Strictly mandate PHOTOREALISM (real product photography, authentic lighting). Forbid cartoon, anime, illustration, or 3D cartoon renders.',
    );

    return lines.join('\n');
  }

  /**
   * Combines the planner's `image_generation_prompt` with exact attachment handling rules
   * (subject photo, company logo, aspect ratio, photorealism).
   */
  buildRendererPromptFromPlan(
    planPrompt: string,
    ctx: DesignBriefContext,
  ): string {
    const lines: string[] = [planPrompt];

    if (ctx.hasSubjectImage) {
      lines.push(
        ctx.backgroundRemoved
          ? 'ATTACHMENT 1 (SUBJECT): The attached product image is the hero subject with background removed. It must appear EXACTLY as shown — same product, same colors, same shape, same label and details. Integrate it naturally into the scene.'
          : 'ATTACHMENT 1 (SUBJECT): The attached product photo is the hero subject. Replicate the exact product shown without alteration or substitution; blend it naturally into the environment.',
      );
    }

    if (ctx.hasLogo) {
      lines.push(
        'ATTACHMENT (COMPANY LOGO): The attached image is the official company logo. Place it crisply and prominently in the top corner or appropriate brand spot on the post, completely unedited.',
      );
    }

    lines.push(
      'Requirements: High-end commercial advertising quality, razor-sharp focus, immaculate color grading, crisp legible typography, perfectly balanced negative space. Strictly photorealistic — no cartoon, anime, or 3D-render style.',
    );

    return lines.join('\n\n');
  }

  /**
   * Direct prompt builder (used as fallback or for direct engine execution).
   */
  buildFinalPrompt(
    ctx: DesignBriefContext,
    styles: RetrievedStyle[],
    engine: 'gemini' | 'pollinations' = 'gemini',
  ): string {
    if (engine === 'pollinations') {
      return this.buildCompactImagePrompt(ctx, styles);
    }

    const lines: string[] = [];
    const mainTopic =
      ctx.prompt ||
      (ctx.productName
        ? `${ctx.productName} — ${ctx.headline || 'Social Post'}`
        : 'Social media advertisement');

    lines.push(
      `You are an expert commercial graphic designer and art director. Design a single complete, professional social media campaign post image about: "${mainTopic}".`,
    );

    // Canvas & Platform
    const canvasSpec = ctx.postSize || ctx.aspectRatio || ctx.platform;
    if (canvasSpec) {
      lines.push(
        `Format & Canvas: Tailored for ${canvasSpec}. Maintain balanced composition and margins.`,
      );
    }

    // Category / Niche
    if (ctx.category || ctx.niche) {
      lines.push(`Industry Category: ${ctx.category || ctx.niche}.`);
    }

    // Style & Environment
    if (ctx.style) {
      lines.push(
        `Design Aesthetic: ${ctx.style} style with immaculate commercial grading.`,
      );
    }
    if (ctx.backgroundMode) {
      lines.push(`Background Staging: ${ctx.backgroundMode}.`);
    }

    // Copy & Typography
    const textPieces: string[] = [];
    if (ctx.headline) textPieces.push(`Headline: "${ctx.headline}"`);
    if (ctx.content)
      textPieces.push(`Main Copy (render verbatim): "${ctx.content}"`);
    if (ctx.bodyCopy) textPieces.push(`Body copy: "${ctx.bodyCopy}"`);
    if (ctx.keyMessage) textPieces.push(`Key message: "${ctx.keyMessage}"`);
    if (ctx.cta) textPieces.push(`Call-to-action button: "${ctx.cta}"`);
    if (textPieces.length > 0) {
      lines.push(
        `Text to render clearly on the design:\n- ${textPieces.join('\n- ')}`,
      );
    }

    // Typography
    if (ctx.font || ctx.fontHeading || ctx.fontBody) {
      lines.push(
        `Typography: ${ctx.font || `${ctx.fontHeading || 'Bold modern'} for headings and ${ctx.fontBody || 'clean sans-serif'} for body text`}. Ensure high contrast and sharp readability.`,
      );
    }

    // Colors
    if (
      ctx.colorScheme ||
      ctx.primaryColor ||
      (ctx.brandColors && ctx.brandColors.length > 0)
    ) {
      const colors =
        ctx.colorScheme ||
        ctx.brandColors?.join(', ') ||
        [ctx.primaryColor, ctx.secondaryColor, ctx.accentColor]
          .filter(Boolean)
          .join(', ');
      lines.push(`Color Harmony: ${colors}.`);
    }

    // Reference styles
    if (styles.length > 0) {
      lines.push(
        'Match the aesthetic quality and layout balance of these reference designs:',
      );
      styles.forEach((style, index) => {
        const origin =
          style.source === 'user' ? 'past high-rated post' : 'sample';
        lines.push(
          `${index + 1}. [${origin}] "${style.userPrompt}": ${truncate(style.contentText, MAX_SUMMARY_CHARS)}`,
        );
      });
    }

    // Subject image instructions
    if (ctx.hasSubjectImage) {
      lines.push(
        ctx.backgroundRemoved
          ? 'SUBJECT ATTACHMENT: The attached image is the hero subject (transparent PNG cutout). It must appear EXACTLY as photographed — same product, same colors, same shape, same details. Integrate it naturally into the scene; never substitute it.'
          : 'SUBJECT ATTACHMENT: The attached photo is the hero subject. Reproduce the exact product photographed; blend it naturally into the design.',
      );
    }

    // Company Logo instructions
    if (ctx.hasLogo) {
      lines.push(
        'LOGO ATTACHMENT: The attached image is the official brand logo. Incorporate it unchanged in a clean, prominent position on the post.',
      );
    }

    if (ctx.additionalInstructions) {
      lines.push(
        `Additional creative guidelines: ${ctx.additionalInstructions}.`,
      );
    }

    if (ctx.outputType) {
      lines.push(`Requested Output Format: ${ctx.outputType.toUpperCase()}.`);
    }

    lines.push(
      'Requirements: STRICTLY PHOTOREALISTIC commercial advertising quality — realistic human models with natural skin texture (if any), authentic product textures, cinematic lighting, sharp typography, professional layout. Strictly avoid cartoon, anime, illustration, or 3D animated renders.',
    );

    return lines.join('\n\n');
  }

  /**
   * Compact prompt tuned for pure text-to-image engines (Pollinations).
   */
  buildCompactImagePrompt(
    ctx: DesignBriefContext,
    styles: RetrievedStyle[],
  ): string {
    const mainTopic =
      ctx.prompt ||
      (ctx.productName
        ? `${ctx.productName} — ${ctx.headline || 'Social Post'}`
        : 'Social media advertisement');
    const styleHints = styles
      .slice(0, 2)
      .map((style) => truncate(style.contentText, 120))
      .join(' ');

    const copyText = ctx.content || ctx.headline || ctx.keyMessage || '';

    return [
      `Professional social media advertisement photograph: ${mainTopic}.`,
      copyText ? `Headline text: "${copyText}".` : '',
      ctx.category ? `Category: ${ctx.category}.` : '',
      ctx.colorScheme ? `Colors: ${ctx.colorScheme}.` : '',
      ctx.font ? `Typography: ${ctx.font}.` : '',
      ctx.postSize ? `Canvas format: ${ctx.postSize}.` : '',
      ctx.outputType ? `Format: ${ctx.outputType.toUpperCase()}.` : '',
      ctx.style ? `Aesthetic: ${ctx.style}.` : '',
      styleHints ? `Style influence: ${styleHints}.` : '',
      'Commercial advertising photography, sharp focus, clean typography, high detail, balanced composition. Strictly no cartoon, anime, or illustration.',
    ]
      .filter(Boolean)
      .join(' ');
  }
}

function truncate(text: string, maxChars: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) {
    return clean;
  }
  return `${clean.slice(0, maxChars - 1)}…`;
}
