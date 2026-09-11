import { Injectable } from '@nestjs/common';

import { RetrievedStyle } from './retriever.service';

/** Maximum characters of each style summary that go into the final prompt. */
const MAX_SUMMARY_CHARS = 220;

/**
 * Turns a short user prompt into a detailed designer-style prompt by
 * merging in the RAG-retrieved style context. The user never sees this
 * expanded prompt — they type 3–8 words, Gemini receives a full brief.
 */
@Injectable()
export class PromptBuilderService {
  buildFinalPrompt(
    userPrompt: string,
    styles: RetrievedStyle[],
    hasSubjectImage: boolean,
    engine: 'gemini' | 'pollinations' = 'gemini',
    backgroundRemoved = true,
  ): string {
    // Image-generation engines (FLUX etc.) do best with a compact, visual
    // prompt — long instruction briefs turn into muddy output. The full
    // designer brief below is meant for instruction-following editing
    // models like Gemini's image model.
    if (engine === 'pollinations') {
      return this.buildCompactImagePrompt(userPrompt, styles);
    }

    const lines: string[] = [];

    lines.push(
      `You are a professional social media post designer. Design a single complete social media post image about: "${userPrompt}".`,
    );

    if (styles.length > 0) {
      lines.push('Match the established style of these high-performing past posts:');
      styles.forEach((style, index) => {
        const origin = style.source === 'user' ? 'your past post' : 'sample';
        lines.push(
          `${index + 1}. [${origin}] Brief: "${style.userPrompt}" — ${truncate(style.contentText, MAX_SUMMARY_CHARS)}`,
        );
      });
    }

    lines.push(
      hasSubjectImage
        ? backgroundRemoved
          ? 'The attached image is the subject (background already removed, transparent PNG). It must appear EXACTLY as shown — same product, same colors, same shape, same materials, same details. Integrate it naturally into the design; never replace it with a similar or generic item.'
          : 'The attached photo is the subject. It must appear EXACTLY as shown — same product, same colors, same shape, same materials, same details, copied from the photo. Never redraw it differently or substitute a similar or generic item; integrate it naturally into the design.'
        : 'No subject image is attached — create suitable visuals yourself.',
    );

    lines.push(
      'Requirements: PHOTOREALISTIC result — any people must look like real humans with natural skin, realistic faces and true-to-life proportions, and the subject must look like real product photography; clean modern composition, readable typography, balanced colors, professional marketing quality, one finished image as the output. Strictly avoid cartoon, anime, illustration, 3D-render or animated styles.',
    );

    return lines.join('\n');
  }

  /**
   * Compact prompt tuned for pure text-to-image engines: concrete visual
   * descriptors only, no meta-instructions, style hints from the top RAG
   * matches boiled down to palette/mood keywords.
   */
  private buildCompactImagePrompt(userPrompt: string, styles: RetrievedStyle[]): string {
    const styleHints = styles
      .slice(0, 2)
      .map((style) => truncate(style.contentText, 140))
      .join(' ');

    return [
      `Photorealistic social media post photograph: ${userPrompt}. If a person is shown, it must be a real-looking human with a realistic face, natural skin and natural lighting.`,
      styleHints ? `Style direction: ${styleHints}` : '',
      'Real product photography look, bold clear headline text, vibrant colors, sharp focus, high detail, clean modern layout. No cartoon, no anime, no illustration, no animated style.',
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