import { Injectable } from '@nestjs/common';

import { RetrievedImageStyle, RetrievedStyle } from './retriever.service';
import { DesignBrief, POST_SIZES } from '../design-brief';

/** Maximum characters of each style summary that go into the final prompt. */
const MAX_SUMMARY_CHARS = 220;
/** How many retrieved reference images get attached to the Gemini call. */
const MAX_REFERENCE_IMAGES = 2;

/**
 * Everything the prompt builder needs besides the raw retrieved styles.
 * `brief` carries the structured requirements the user entered in the form
 * (content copy, colors, font, category, post size, output type) — every
 * provided field is woven into the prompt, missing ones are simply skipped.
 */
export interface PromptContext {
  /** Structured brand/design requirements collected from the user. */
  brief: DesignBrief;
  /** Which engine the prompt is for ('gemini' = full brief, 'pollinations' = compact). */
  engine: 'gemini' | 'pollinations';
  /** A subject image is attached FIRST. */
  hasSubjectImage: boolean;
  /** The subject's background was removed (transparent PNG). */
  backgroundRemoved: boolean;
  /** A company logo is attached (right after the subject, before references). */
  hasLogoImage: boolean;
}

/**
 * Turns a short user prompt into a detailed designer-style prompt by
 * merging in (a) the structured design brief the user filled in and
 * (b) the RAG-retrieved style context. The user never sees this expanded
 * prompt — they type a few words, Gemini receives a full brief.
 */
@Injectable()
export class PromptBuilderService {
  buildFinalPrompt(
    userPrompt: string,
    styles: RetrievedStyle[],
    imageStyles: RetrievedImageStyle[],
    context: PromptContext,
  ): string {
    const { brief, engine } = context;

    // Image-generation engines (FLUX etc.) do best with a compact, visual
    // prompt — long instruction briefs turn into muddy output. The full
    // designer brief below is meant for instruction-following editing
    // models like Gemini's image model.
    if (engine === 'pollinations') {
      return this.buildCompactImagePrompt(
        userPrompt,
        styles,
        imageStyles,
        context,
      );
    }

    const size = POST_SIZES[brief.postSize];
    const lines: string[] = [];

    lines.push(
      `You are a professional social media post designer. Design a single complete social media post image (${size.label}) about: "${userPrompt}".`,
    );

    // 1. The requested post format/size — the design must fill this canvas.
    lines.push(
      `Post format: ${size.label} — ${size.aspect} canvas, ${size.width}x${size.height} px. Compose the design to fill this exact format and keep all important content inside the safe area.`,
    );

    // 2. The brand category steers industry-appropriate design language.
    if (brief.category) {
      lines.push(
        `Brand category: "${brief.category}". The imagery, tone and design language must fit this industry (the same industry as the past-post style references below).`,
      );
    }

    if (styles.length > 0) {
      lines.push(
        'Match the established style of these high-performing past posts:',
      );
      styles.forEach((style, index) => {
        const origin = style.source === 'user' ? 'your past post' : 'sample';
        lines.push(
          `${index + 1}. [${origin}] Brief: "${style.userPrompt}" — ${truncate(style.contentText, MAX_SUMMARY_CHARS)}`,
        );
      });
    }

    if (imageStyles.length > 0) {
      lines.push(
        'Reference images attached AFTER the subject and logo show past post designs — mirror their visual style (layout, palette, typography, composition):',
      );
      imageStyles.slice(0, MAX_REFERENCE_IMAGES).forEach((reference, index) => {
        const origin =
          reference.source === 'user' ? 'your past post' : 'sample';
        lines.push(
          `${index + 1}. [${origin}] "${reference.userPrompt}" (${(reference.similarity * 100).toFixed(0)}% style match)`,
        );
      });
    }

    // 3. Attachment map — subject first, logo second, references after.
    lines.push(this.buildAttachmentInstructions(context));

    // 4. Brand colors.
    if (brief.colorScheme) {
      lines.push(
        `Color scheme: ${brief.colorScheme}. Use these colors consistently across background, accents and text so the post looks on-brand.`,
      );
    }

    // 5. Typography.
    if (brief.font) {
      lines.push(
        `Typography: set ALL text on the post in the "${brief.font}" font (or the closest available match); keep it crisp, readable and professionally kerned.`,
      );
    }

    // 6. The exact copy to write on the post.
    if (brief.content) {
      lines.push(
        `Text content: write EXACTLY this copy on the post — "${brief.content}". Render every word correctly, do not paraphrase, translate or add any other marketing text.`,
      );
    }

    lines.push(
      'Requirements: PHOTOREALISTIC result — any people must look like real humans with natural skin, realistic faces and true-to-life proportions, and the subject must look like real product photography; clean modern composition, readable typography, balanced colors, professional marketing quality, one finished image as the output. Strictly avoid cartoon, anime, illustration, 3D-render or animated styles.',
    );

    // 7. Requested deliverable format.
    lines.push(
      `Deliverable: one finished ${brief.outputType.toUpperCase()} image, ready to publish as-is.`,
    );

    return lines.join('\n');
  }

  /**
   * Compact prompt tuned for pure text-to-image engines: concrete visual
   * descriptors only, no meta-instructions, style hints from the top RAG
   * matches boiled down to palette/mood keywords. Pollinations cannot see
   * images, so retrieved image references contribute their briefs as text
   * and the design-brief fields are folded into one dense sentence.
   */
  private buildCompactImagePrompt(
    userPrompt: string,
    styles: RetrievedStyle[],
    imageStyles: RetrievedImageStyle[],
    context: PromptContext,
  ): string {
    const { brief } = context;
    const size = POST_SIZES[brief.postSize];

    const styleHints = styles
      .slice(0, 2)
      .map((style) => truncate(style.contentText, 140))
      .join(' ');

    const imageHints = imageStyles
      .slice(0, MAX_REFERENCE_IMAGES)
      .map((reference) => reference.userPrompt)
      .join(', ');

    const briefParts = [
      brief.category ? `${brief.category} brand` : '',
      brief.colorScheme ? `colors: ${brief.colorScheme}` : '',
      brief.font ? `"${brief.font}" typography` : '',
      brief.content ? `headline text exactly "${brief.content}"` : '',
    ].filter(Boolean);

    return [
      `Photorealistic ${size.label} (${size.aspect}) social media post: ${userPrompt}.` +
        (briefParts.length ? ` ${briefParts.join(', ')}.` : '') +
        ' If a person is shown, it must be a real-looking human with a realistic face, natural skin and natural lighting.',
      context.hasLogoImage
        ? `Include the provided company logo image${context.hasSubjectImage ? ' (second attached image)' : ''} unchanged in the design.`
        : '',
      styleHints ? `Style direction: ${styleHints}` : '',
      imageHints
        ? `Match the look of these past post designs: ${imageHints}.`
        : '',
      'Real product photography look, bold clear headline text, vibrant colors, sharp focus, high detail, clean modern layout. No cartoon, no anime, no illustration, no animated style.',
    ]
      .filter(Boolean)
      .join(' ');
  }

  /**
   * Explains the attached images in attachment order: subject FIRST,
   * logo SECOND, style references after — so the model never confuses a
   * style reference with content it must feature.
   */
  private buildAttachmentInstructions(context: PromptContext): string {
    const { hasSubjectImage, hasLogoImage, backgroundRemoved } = context;

    if (hasSubjectImage && hasLogoImage) {
      return backgroundRemoved
        ? 'The FIRST attached image is the subject (background already removed, transparent PNG). It must appear EXACTLY as shown — same product, same colors, same shape, same materials, same details — integrated naturally into the design. The SECOND attached image is the company logo: copy it EXACTLY as shown (never redraw, recolor or distort it) and place it prominently at a tasteful size, e.g. a corner or the header area. Every other attached image is a style reference ONLY — copy its design language, never its content.'
        : 'The first attached photo is the subject. It must appear EXACTLY as shown — same product, same colors, same shape, same materials, same details, copied from the photo; never redraw it differently. The SECOND attached image is the company logo: copy it EXACTLY as shown (never redraw, recolor or distort it) and place it prominently at a tasteful size. Every other attached image is a style reference ONLY — copy its design language, never its content.';
    }
    if (hasLogoImage) {
      return 'The attached image is the company logo: copy it EXACTLY as shown (never redraw, recolor or distort it) and place it prominently at a tasteful size, e.g. a corner or the header area. Every other attached image is a style reference ONLY — copy its design language, never its content.';
    }
    if (hasSubjectImage) {
      return backgroundRemoved
        ? 'The attached image is the subject (background already removed, transparent PNG). It must appear EXACTLY as shown — same product, same colors, same shape, same materials, same details. Integrate it naturally into the design; never replace it with a similar or generic item.'
        : 'The attached photo is the subject. It must appear EXACTLY as shown — same product, same colors, same shape, same materials, same details, copied from the photo. Never redraw it differently or substitute a similar or generic item; integrate it naturally into the design.';
    }
    return 'No subject image is attached — create suitable visuals yourself.';
  }
}

function truncate(text: string, maxChars: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) {
    return clean;
  }
  return `${clean.slice(0, maxChars - 1)}…`;
}
