import { Injectable } from '@nestjs/common';

import { RetrievedImageStyle, RetrievedStyle } from './retriever.service';
import { DesignBrief, POST_SIZES } from '../design-brief';

/** Maximum characters of each style summary that go into the final prompt. */
const MAX_SUMMARY_CHARS = 220;
/** How many retrieved reference images get attached to the Gemini call. */
const MAX_REFERENCE_IMAGES = 2;

/**
 * Static rule sections of the DESIGN-PLANNING prompt (modeled on Social
 * Yolo's master designer template). The interpolated parts (user inputs,
 * retrieved references, output JSON) are assembled in
 * `buildPlannerPrompt()`; everything here is engine-agnostic instruction
 * text. Colors are deliberately NOT limited to three — the user's color
 * scheme may hold any number of colors and the planner maps them into
 * primary/supporting/accent roles.
 */
const PLANNER_RULES = `==================================================
CORE OBJECTIVE
==================================================

Create a polished social media graphic based on the provided information.

The final design must:

1. Clearly communicate the main message within 1-3 seconds.
2. Make the product, offer, service, or main subject visually dominant.
3. Establish a strong visual hierarchy.
4. Use the user's color scheme consistently across the design (the scheme may contain any number of colors).
5. Use the requested font wherever possible.
6. Keep typography highly readable.
7. Create a professional composition appropriate for the selected category.
8. Use whitespace intelligently.
9. Make important information visually prominent.
10. Avoid unnecessary visual clutter.
11. Maintain a premium and professionally designed appearance.
12. Optimize the composition for the selected post size.
13. Make the design look intentionally created by a professional graphic designer, not like a generic AI template.

==================================================
STYLE REFERENCE ANALYSIS
==================================================

The STYLE REFERENCES listed in the inputs were retrieved from the design
style library by vector similarity - they are past posts whose briefs match
the post idea and the category. The rendering model will also receive up to
two actual REFERENCE IMAGES of these past posts.

Analyze the references before planning the design. Extract their:

- Overall visual style
- Composition
- Layout structure
- Typography hierarchy
- Image placement
- Product placement
- Color relationships
- Background treatment
- Shapes and graphic elements
- Spacing
- Alignment
- Promotional elements
- Visual emphasis
- Overall mood

Use the references as INSPIRATION for:

- Layout direction
- Visual hierarchy
- Design sophistication
- Composition ideas
- Graphic treatment
- Typography relationships
- Promotional presentation

IMPORTANT:

DO NOT copy the reference posts exactly.

Do not reproduce:
- Exact layout
- Exact text
- Exact logo placement
- Exact illustrations
- Exact person/model
- Exact product arrangement
- Exact decorative elements
- Exact proportions

Instead, plan an ORIGINAL design that captures the useful visual principles
of the references while following the user's own brand inputs.

==================================================
CONTENT HANDLING
==================================================

Use the user's supplied CONTENT as the primary source.

Do not invent:
- Prices
- Discounts
- Product specifications
- Features
- Reviews
- Statistics
- Contact information
- Claims
- Guarantees

unless they are explicitly provided by the user. (EXCEPTION: when CONTENT was
not provided at all, craft a short, punchy headline yourself that fits the
post idea and category - but never fabricate specific numbers.)

If the supplied content is too long for the selected post size, intelligently
shorten or organize it while preserving the original meaning. Never reword
the main headline unless space strictly requires it.

Prioritize information in this order:

1. Main headline
2. Product / offer
3. Key benefit or supporting message
4. Price / discount / CTA
5. Secondary information

Do not place every piece of supplied text onto the design if doing so makes
the graphic cluttered.

==================================================
TYPOGRAPHY
==================================================

Use the requested FONT from the user inputs above.

Create a clear typography hierarchy using variations in:

- Font size
- Font weight
- Letter spacing
- Line spacing
- Case
- Position

The main headline should receive the strongest typographic emphasis.

Prices, discounts, percentages, offers, or important numbers should receive
strong visual emphasis when present.

Never make important text too small.

Avoid excessive font styles. Use a maximum of 2-3 typographic treatments
unless the design concept specifically requires more.

==================================================
COLOR SYSTEM
==================================================

The user supplied a COLOR SCHEME in the inputs above. It may contain one
color, several named colors, hex codes or a description - use ALL of them as
the design palette.

Suggested usage when several colors are given:

- First color = dominant/background/primary visual color
- Middle color(s) = supporting colors
- Last color = accent/CTA/highlight

You may use white, black, or neutral tones only when necessary for readability
and visual balance.

Do not introduce random additional brand colors.

Maintain sufficient contrast between text and background.

==================================================
PRODUCT PRESENTATION
==================================================

If a subject/product image is provided (attached FIRST by the rendering
model):

- Make the product clearly visible.
- Preserve the product's important visual characteristics.
- Do not unnecessarily distort the product.
- Do not change product packaging, logo, label, or important details.
- Remove or minimize distracting backgrounds when appropriate.
- Use realistic shadows, highlights, reflections, or depth when appropriate.
- Give the product enough breathing room.
- Make the product one of the primary focal points.

If a person/model is in the subject image, preserve natural proportions and a
realistic appearance.

If a company LOGO is provided (attached SECOND), plan a prominent but
tasteful placement for it - typically a corner or header area - and keep it
exactly as supplied (never redraw, recolor or distort it).

==================================================
LAYOUT SYSTEM
==================================================

Choose the layout based on the content and category rather than forcing one
fixed template.

Possible layouts include:

- Product-focused hero
- Split composition
- Centered product
- Editorial advertisement
- Promotional offer
- Minimal luxury
- Bold typography
- Product + lifestyle image
- Discount-focused
- Before/after
- Feature showcase
- Product catalog style
- Modern card composition

Use:

- Grid alignment
- Consistent margins
- Strong spacing
- Visual balance
- Clear focal point
- Intentional asymmetry when appropriate

Avoid randomly placing elements.

==================================================
PROMOTIONAL DESIGN
==================================================

If the content includes words like SALE, DISCOUNT, SAVE, OFFER, LIMITED TIME,
NEW, PRICE, DEAL, FREE SHIPPING or SPECIAL OFFER, plan for the promotional
information to be visually prominent.

Possible visual treatments:

- Circular badge
- Pill
- Ribbon
- Large percentage
- Highlight box
- Price lockup
- Accent shape
- Large numeric typography

However, only use these elements when they fit the design.

Do not add promotional claims that were not supplied.

==================================================
CATEGORY ADAPTATION
==================================================

Adapt the design to the CATEGORY from the user inputs above. Typical
adaptations:

- Food: appetizing product presentation, rich product photography, strong
  sensory visual hierarchy
- Fashion: editorial composition, lifestyle imagery, elegant typography
- Beauty: clean premium composition, soft spacing, product-focused
  presentation
- Technology: modern layout, strong contrast, clean geometric elements
- Real Estate: property-focused imagery, professional typography, clear
  information hierarchy
- Restaurant: food-focused imagery, strong offer/CTA, warm and engaging
  composition
- E-commerce: product first, price/offer clearly visible, strong shopping CTA
- Gym / Fitness: energetic composition, bold condensed typography, dynamic
  athlete imagery, strong contrast
- Education: trustworthy structured layout, clear headings, friendly tones
- Drinks: refreshing imagery, condensation/freshness cues, vibrant accents

==================================================
DESIGN QUALITY RULES
==================================================

The final design should feel:

- Professional
- Modern
- Premium
- Balanced
- Commercially usable
- Social-media ready
- Visually engaging
- Easy to scan

Avoid:

- Too much text
- Tiny text
- Random shapes
- Excessive gradients
- Excessive shadows
- Poor contrast
- Misaligned elements
- Crowded layouts
- Generic stock-template appearance
- Unnecessary icons
- Decorative elements that compete with the product
- Distorted product images
- Incorrect spelling
- Incorrect prices
- Duplicate text

==================================================
SOCIAL MEDIA OPTIMIZATION
==================================================

Design specifically for the POST SIZE from the user inputs above.

Respect the aspect ratio.

Keep important content away from the extreme edges.

Ensure the main message remains readable on mobile screens.

Create a strong visual focal point.

The post should work as a standalone social media advertisement without
requiring additional explanation.

==================================================
FINAL DESIGN PRINCIPLE
==================================================

Think like a senior graphic designer and art director.

Do not simply place the user's text and product image onto a canvas.

Instead:

UNDERSTAND → PLAN → COMPOSE → STYLE → PRIORITIZE → GENERATE

Every design decision must support the user's post idea and objective.

Create an ORIGINAL design inspired by the supplied references, while
maintaining the user's brand colors, typography, content, product,
dimensions, and category.`;

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

    // 6b. Copy discipline + promotional emphasis.
    lines.push(
      'Copy discipline: use the supplied content as the primary source — do NOT invent prices, discounts, statistics, claims or contact details that were not provided. If the content is too long for the format, organize or shorten it intelligently while preserving meaning and the visual priority (main headline > product/offer > key benefit > price/discount/CTA > secondary info).',
    );
    lines.push(
      'Promotional emphasis: when the content contains SALE, DISCOUNT, OFFER, LIMITED TIME, NEW or similar words, render that information prominently (e.g. a circular badge, pill, ribbon, large percentage or price lockup) — but only if it fits the composition.',
    );

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
   * Builds the DESIGN-PLANNING prompt: a long, structured art-director
   * brief (modeled on Social Yolo's master designer template) sent to the
   * TEXT model, which answers with a JSON design plan whose
   * `image_generation_prompt` is rendered by the image model via
   * `buildRendererPromptFromPlan()`. Used only as a first stage — when the
   * planner fails, `buildFinalPrompt()` produces the prompt directly.
   */
  buildPlannerPrompt(
    userPrompt: string,
    styles: RetrievedStyle[],
    imageStyles: RetrievedImageStyle[],
    context: PromptContext,
  ): string {
    const { brief } = context;
    const size = POST_SIZES[brief.postSize];

    const styleList = styles.length
      ? styles
          .map(
            (style, index) =>
              `${index + 1}. [${style.source === 'user' ? "the user's own past post" : 'library sample'}] "${style.userPrompt}" — ${truncate(style.contentText, 260)}`,
          )
          .join('\n')
      : '(none retrieved — design from the brief alone)';

    const referenceList = imageStyles.length
      ? imageStyles
          .map(
            (reference, index) =>
              `${index + 1}. "${reference.userPrompt}" (${(reference.similarity * 100).toFixed(0)}% style match)`,
          )
          .join('\n')
      : '(none retrieved)';

    return `You are the AI Social Media Post Designer for a platform called "Social Yolo".

Your job is to transform the user's inputs into a professional, visually
appealing, conversion-focused social media post for a product, service,
promotion, announcement, or brand.

The user may provide:
- Post Idea
- Content
- Category
- Color Scheme
- Font
- Post Size
- File Type: PNG or JPG
- Design / Concept instructions
- Product / Subject Image (attached separately to the rendering model)
- Company Logo (attached separately)
- Style Reference Images (retrieved from the design style library)

==================================================
USER INPUTS
==================================================

POST IDEA:
${userPrompt}

CONTENT (text to place on the post):
${brief.content ?? '(not provided — craft a short, suitable headline yourself)'}

CATEGORY:
${brief.category ?? '(not provided — infer it from the post idea)'}

COLOR SCHEME (may be one color, several colors, hex codes or a description):
${brief.colorScheme ?? '(not provided — choose a palette that suits the category)'}

FONT:
${brief.font ?? '(not provided — choose a font that suits the category)'}

POST SIZE:
${size.label} — ${size.aspect} canvas, ${size.width}x${size.height} px

FILE TYPE:
${brief.outputType.toUpperCase()}

DESIGN / CONCEPT INSTRUCTIONS:
${brief.designConcept ?? '(not provided)'}

STYLE REFERENCES (text descriptions from the vector style library — closest matches first):
${styleList}

REFERENCE IMAGES (attached to the RENDERING model, not visible to you):
${referenceList}

ATTACHMENT ORDER at rendering time: the subject/product image FIRST (its
background removed), the company logo SECOND, and the up-to-two reference
images AFTER. Plan the design around that order.

${PLANNER_RULES}

==================================================
OUTPUT REQUIREMENTS
==================================================

Respond with ONLY a JSON object (no markdown fences, no commentary) in this
exact structure:

{
  "design_direction": "",
  "visual_concept": "",
  "layout": "",
  "background": "",
  "color_usage": {
    "primary": "",
    "secondary": "",
    "accent": ""
  },
  "typography": {
    "font": "",
    "headline_style": "",
    "body_style": "",
    "cta_style": ""
  },
  "content_hierarchy": [
    "",
    "",
    "",
    ""
  ],
  "product_placement": "",
  "image_treatment": "",
  "graphic_elements": [],
  "spacing_and_alignment": "",
  "reference_inspiration": "",
  "avoid": [],
  "image_generation_prompt": "",
  "final_size": "${brief.postSize}",
  "file_type": "${brief.outputType}"
}

Rules:
- "image_generation_prompt" must be a complete, detailed prompt that can be
  sent directly to an image-generation/design model. It must describe:
  canvas size/aspect ratio (${size.width}x${size.height}, ${size.aspect}),
  background, product placement, product scale, typography hierarchy, the
  EXACT supplied text, font direction, the color palette, graphic elements,
  lighting, shadows, composition, spacing, visual style, reference-inspired
  design principles, overall mood, and commercial/social-media quality.
- "content_hierarchy" must list the text elements in visual priority order,
  with the EXACT supplied copy first.
- "color_usage" must explain how the user's color scheme is split into
  primary/secondary/accent roles.
- Do not include unnecessary explanations inside the image-generation prompt.
- "final_size" and "file_type" must repeat the values given in USER INPUTS.`;
  }

  /**
   * Converts the planner's JSON design plan into the final prompt for the
   * IMAGE model: the full plan (its `image_generation_prompt` as the master
   * description) plus the attachment map, the verbatim copy reminder, the
   * exact canvas and the photorealistic rendering rules. The image model
   * must output an IMAGE — never the JSON itself.
   */
  buildRendererPromptFromPlan(
    plan: Record<string, unknown>,
    userPrompt: string,
    context: PromptContext,
  ): string {
    const { brief } = context;
    const size = POST_SIZES[brief.postSize];
    const planText = JSON.stringify(plan, null, 2);
    const imagePrompt =
      typeof plan.image_generation_prompt === 'string'
        ? plan.image_generation_prompt
        : '';

    const lines: string[] = [];

    lines.push(
      'You are a professional social media post designer and art director. Render ONE finished social media post image exactly according to the approved art-direction plan below.',
    );

    lines.push(`Post idea: "${userPrompt}".`);

    lines.push(`ART-DIRECTION PLAN (follow precisely):\n${planText}`);

    if (imagePrompt) {
      lines.push(
        `The plan's "image_generation_prompt" is the master description — follow every detail of it: canvas, background, composition, product placement and scale, typography hierarchy, palette, graphic elements, lighting, shadows and mood:\n${imagePrompt}`,
      );
    }

    lines.push(this.buildAttachmentInstructions(context));

    if (brief.content) {
      lines.push(
        `Text content: write EXACTLY this copy on the post — "${brief.content}". Render every word correctly, do not paraphrase, translate or add any other marketing text.`,
      );
    }

    lines.push(
      `Canvas: ${size.label} — ${size.aspect}, ${size.width}x${size.height} px. Keep all important content inside the safe area, away from the extreme edges.`,
    );

    lines.push(
      'Rendering quality: PHOTOREALISTIC result — any people must look like real humans with natural skin, realistic faces and true-to-life proportions; the subject must look like real product photography, preserving packaging, label and logo details exactly; readable typography with sufficient text/background contrast; clean professional composition; balanced spacing. Strictly avoid cartoon, anime, illustration, 3D-render or animated styles.',
    );

    lines.push(
      `Deliverable: one finished ${brief.outputType.toUpperCase()} image, ready to publish as-is. Output ONLY the image — no JSON, no explanations, no extra text.`,
    );

    return lines.join('\n\n');
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
