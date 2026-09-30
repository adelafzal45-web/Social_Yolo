import { Injectable } from '@nestjs/common';
import { RetrievedReference } from './retriever.service';
export type { RetrievedStyle } from './retriever.service';

/**
 * ════════════════════════════════════════════════════════════════════════════
 *  PROMPT ARCHITECTURE — SINGLE FILE OF TRUTH
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  This is THE file to edit when you want to change how posts are generated.
 *  Every string that reaches Gemini's image model is assembled here.
 *
 *  THE TWO-STAGE PIPELINE
 *  ──────────────────────
 *   Stage 1  buildPlannerPrompt()        → Gemini TEXT model (gemini-2.5-flash)
 *            Reads the brief + RAG references and returns a JSON design plan.
 *
 *   Stage 2  buildRendererPromptFromPlan() → Gemini IMAGE model (flash-image)
 *            Takes the planner's `image_generation_prompt` and adds the hard
 *            rendering contracts: attachment handling, typography contract,
 *            negative prompt, production standards.
 *
 *   Fallback buildFinalPrompt()          → used when the planner stage fails.
 *   Pollinations buildCompactImagePrompt() → used when IMAGE_PROVIDER=pollinations.
 *
 *  THE SEVEN BLOCKS OF A STAGE-2 PROMPT (in order)
 *  ───────────────────────────────────────────────
 *   1. CREATIVE DIRECTION      — the planner's prose, verbatim
 *   2. VISUAL REFERENCE NOTES  — what each attached reference image is for
 *   3. ATTACHMENT SPECS        — model / product / logo handling
 *   4. TYPOGRAPHY CONTRACT     — exact strings, counts, positions
 *   5. COMPOSITION CONTRACT    — aspect-ratio aware layout rules
 *   6. NEGATIVE PROMPT         — exhaustive list of what must not appear
 *   7. PRODUCTION STANDARDS    — camera, optics, lighting, resolution
 *
 *  WHY IT IS BUILT THIS WAY
 *  ────────────────────────
 *  Image models follow the LAST instruction most faithfully, which is why the
 *  negative prompt and the production standards sit at the very bottom.
 *  Typography is given its own numbered contract because gibberish lettering
 *  is the single most common failure mode on social posts. RAG references are
 *  described as *transferable traits* rather than things to copy, which stops
 *  the model from cloning another brand's logo or product into the new post.
 *
 *  TUNING KNOBS (env vars, see README)
 *  ───────────────────────────────────
 *   RAG_MIN_SIMILARITY      lowest cosine a reference needs to be injected
 *   RAG_MAX_REFERENCES      how many text references reach the prompt
 *   GEMINI_MAX_STYLE_REFS   how many reference IMAGES are attached
 * ════════════════════════════════════════════════════════════════════════════
 */

/** Maximum characters of each style summary that go into the final prompt. */
const MAX_SUMMARY_CHARS = 320;

export interface DesignBriefContext {
  prompt?: string;
  category?: string;
  content?: string;
  colorScheme?: string;
  font?: string;
  postSize?: string;
  outputType?: string;
  hasSubjectImage?: boolean;
  subjectImagesCount?: number;
  hasModelImage?: boolean;
  backgroundRemoved?: boolean;
  hasLogo?: boolean;
  /**
   * The user explicitly asked for a logo-free creative. When true the renderer
   * must be told to ignore the attached logo entirely and produce no mark.
   */
  showLogo?: boolean;
  /** Contact email to typeset on the artwork (already sanitised). */
  contactEmail?: string;
  /** Contact phone to typeset on the artwork (already sanitised). */
  contactPhone?: string;
  /** Fixed slot for the contact line, or 'auto' for intelligent placement. */
  contactPlacement?: string;
  /** Number of RAG reference images that will be attached to the call. */
  referenceImageCount?: number;
  /** Labels of those reference images, so the prompt can explain each one. */
  referenceImageTitles?: string[];

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
  /**
   * Brand identity recovered from the customer's own website by the
   * extract-from-url scraper. These are the fields that turn a generic post
   * into a post that actually looks like *this* business — they are emitted as
   * their own authoritative BRAND DNA block rather than being flattened into
   * `additionalInstructions`, which used to truncate them to 300 characters and
   * strip every scrapable signal out of the prompt.
   */
  brandTagline?: string;
  brandDescription?: string;
  /** Absolute URL of the customer's website, e.g. https://adress.com. */
  brandWebsiteUrl?: string;
  additionalInstructions?: string;

  /* ------------------------------------------------------------------ */
  /* ON-CANVAS TEXT OVERLAY — the ONLY text allowed on the image         */
  /* ------------------------------------------------------------------ */

  /**
   * The short, user-authored string that may be printed on the creative
   * (e.g. "Eid Sale", "Cheesy Factor"). Empty/absent means the render must
   * contain ZERO lettering. This is the single source of truth for on-canvas
   * copy — the brief, the headline, the body copy and the CTA are context
   * only and are never rendered.
   */
  onImageText?: string;
  /** Font style for `onImageText`. Falls back to the brand heading font. */
  onImageTextFont?: string;
  /** Fixed placement slot, or 'auto'/absent for intelligent placement. */
  onImageTextPlacement?: string;
  /** Optional colour hint for `onImageText`. */
  onImageTextColor?: string;

  /* ------------------------------------------------------------------ */
  /* USER-SUPPLIED STYLE REFERENCES                                      */
  /* ------------------------------------------------------------------ */

  /**
   * Screenshots / moodboards the user uploaded as "make it look like this".
   * The images themselves are attached to the image model; only their notes
   * (and ordering) are carried here so the prompt can address each one.
   */
  inspirationImages?: Array<{
    /** Index in the attachment order (1-based, for human readability). */
    index: number;
    /** The user's optional note about this reference. */
    note?: string;
  }>;
}

/**
 * Where the hero subject is expected to sit on each canvas, so the
 * intelligent-placement contract can reason about where the quiet zones are.
 */
const AUTO_PLACEMENT_ZONES: Record<string, string> = {
  '1:1': 'the central 50% of the frame, leaving the outer bands quiet.',
  '4:5': 'the middle 58% band, leaving the top ~26% and bottom ~16% quieter.',
  '9:16': 'the middle 56% band, leaving the top ~22% and bottom ~14% quieter (and clear of platform UI overlays).',
  '16:9': 'one horizontal third, leaving the opposite third comparatively open.',
  '3:4': 'the central 55% column, leaving the top ~28% and bottom ~15% quieter.',
  '4:3': 'roughly two thirds of the frame, leaving one side comparatively open.',
};

export type PostCreativeArchetype =
  | 'commercial_product'
  | 'fashion_model_editorial'
  | 'promotional_campaign'
  | 'event_keynote'
  | 'educational_infographic'
  | 'brand_announcement'
  | 'social_lifestyle'
  /**
   * A website, web app, online store, dashboard or digital product being
   * shown on a device. Without this archetype a brief like "our website is
   * live now" fell through to `commercial_product`, whose art direction talks
   * about "brushed anodized metal" and "organic drops" — which is exactly how
   * you end up photographing a wedge of cheese instead of a laptop.
   */
  | 'digital_showcase';

/** Maps a canvas aspect ratio to concrete, actionable layout instructions. */
const ASPECT_RATIO_DIRECTIVES: Record<string, string> = {
  '1:1': 'Square 1:1 — keep all type inside the central 70% safe area, hero subject on a thirds intersection, one clear focal point.',
  '4:5': 'Portrait 4:5 — stack the hierarchy top-to-bottom: eyebrow/headline in the upper third, hero subject centre, supporting line and CTA pinned in the lower third above a 12% bottom safe margin.',
  '9:16': 'Vertical 9:16 story — design for thumb-scrolling: oversized headline in the top 25%, hero subject in the middle band, CTA pill in the bottom 18% clear of the platform UI overlay.',
  '16:9': 'Landscape 16:9 — use a horizontal rule-of-thirds split, text block left or right with the hero subject holding the opposite third, generous side margins.',
  '3:4': 'Portrait 3:4 — classic editorial column: dominant hero subject, headline in the upper third, small supporting line and CTA beneath it, deep uncluttered lower field.',
  '4:3': 'Landscape 4:3 — balanced editorial spread, hero subject centre-left, text hierarchy right, calm negative space.',
};

/**
 * Everything that is not a prompt: archetype detection, the per-archetype
 * art-direction blocks, the negative prompt and small text helpers.
 */
@Injectable()
export class PromptBuilderService {
  /**
   * Detects the creative archetype of the post from occasion, layout
   * preference, prompt, category and extra instructions. The archetype picks
   * which art-direction block gets injected, which is a cheap and surprisingly
   * effective way to specialise the output per campaign type.
   */
  private detectArchetype(ctx: DesignBriefContext): PostCreativeArchetype {
    const raw =
      `${ctx.occasion || ''} ${ctx.layoutPreference || ''} ${ctx.prompt || ''} ${ctx.category || ''} ${ctx.additionalInstructions || ''}`.toLowerCase();

    // ── Digital / website briefs ────────────────────────────────────────
    // This runs FIRST on purpose. A brief like "our website is live now" also
    // contains "launch"-flavoured words, so checking the announcement branch
    // first would hand it a pedestal-and-spotlight brief with no device in it.
    // Detecting it up front is what turns the post into a laptop/phone
    // actually showing the brand's own site in the brand's own palette.
    if (this.isDigitalSubject(raw, ctx)) {
      return 'digital_showcase';
    }

    if (
      ctx.hasModelImage ||
      raw.includes('model') ||
      raw.includes('person') ||
      raw.includes('fashion') ||
      raw.includes('portrait') ||
      ctx.layoutPreference === 'model_focus'
    ) {
      return 'fashion_model_editorial';
    }

    if (
      raw.includes('event') ||
      raw.includes('webinar') ||
      raw.includes('conference') ||
      raw.includes('summit') ||
      raw.includes('workshop') ||
      ctx.occasion === 'event'
    ) {
      return 'event_keynote';
    }

    if (
      raw.includes('sale') ||
      raw.includes('promo') ||
      raw.includes('discount') ||
      raw.includes('offer') ||
      raw.includes('clearance') ||
      ctx.occasion === 'promotional'
    ) {
      return 'promotional_campaign';
    }

    if (
      raw.includes('education') ||
      raw.includes('tip') ||
      raw.includes('guide') ||
      raw.includes('how-to') ||
      raw.includes('fact') ||
      ctx.occasion === 'educational'
    ) {
      return 'educational_infographic';
    }

    if (
      raw.includes('announcement') ||
      raw.includes('milestone') ||
      raw.includes('launch') ||
      raw.includes('unveil') ||
      ctx.occasion === 'announcement'
    ) {
      return 'brand_announcement';
    }

    if (
      raw.includes('lifestyle') ||
      raw.includes('story') ||
      raw.includes('community') ||
      ctx.layoutPreference === 'lifestyle'
    ) {
      return 'social_lifestyle';
    }

    return 'commercial_product';
  }

  /**
   * True when the post is really about a *website, app or digital product*
   * rather than a physical thing.
   *
   * Two signals are combined, because either one alone is unreliable:
   *
   *  1. **Explicit digital vocabulary** in the brief — "website", "web app",
   *     "landing page", "online store", "download the app", "is live now".
   *     Phrases like "is live", "just launched", "now open" only count when
   *     they sit next to a digital noun, otherwise "the shop is now open" would
   *     be mistaken for a website.
   *  2. **A known web presence** — if the brand scraper recovered a website URL
   *     AND the user selected a digital-leaning visual direction, the post is
   *     about showing that site even if the wording is vague.
   *
   * An uploaded product photo or model photo vetoes the archetype: if the user
   * handed us a physical product to hero, they want a product shot, not a
   * laptop.
   */
  private isDigitalSubject(raw: string, ctx: DesignBriefContext): boolean {
    // A real uploaded asset always wins — it is an unambiguous statement of
    // what the hero subject is.
    if (ctx.hasSubjectImage || ctx.hasModelImage) {
      return false;
    }

    const DIGITAL_NOUNS = [
      'website',
      'web site',
      'webpage',
      'web page',
      'web app',
      'webapp',
      'landing page',
      'homepage',
      'home page',
      'online store',
      'e-commerce',
      'ecommerce',
      'e store',
      'mobile app',
      'our app',
      'the app',
      'application',
      'dashboard',
      'portal',
      'platform',
      'software',
      'saas',
      'b2b saas',
      'download',
      'app store',
      'play store',
      'browser',
      'link in bio',
      'shop online',
      'order online',
      'book online',
      'menu online',
      'ui',
      'ux',
      'website launch',
    ];

    const hasDigitalNoun = DIGITAL_NOUNS.some((term) => raw.includes(term));

    // "is live" / "now open" only imply a website when a digital noun or a web
    // presence is already in play.
    const LIVE_PHRASES = [
      'is live',
      'are live',
      'now live',
      'just went live',
      'went live',
      'go live',
      'going live',
      'now open',
      'just launched',
      'now launching',
      'is online',
      'now online',
      'we are up',
    ];
    const hasLivePhrase = LIVE_PHRASES.some((term) => raw.includes(term));

    if (hasDigitalNoun) {
      return true;
    }
    if (hasLivePhrase && (ctx.brandWebsiteUrl || ctx.niche || ctx.category)) {
      return true;
    }

    // Visual direction "ai_decide" with a known web presence is still ambiguous
    // on its own, so only the explicit digital layout choices count here.
    const DIGITAL_DIRECTIONS = ['website', 'web', 'app', 'digital', 'ui_mockup'];
    const direction = (ctx.layoutPreference || '').toLowerCase();
    if (ctx.brandWebsiteUrl && DIGITAL_DIRECTIONS.some((d) => direction.includes(d))) {
      return true;
    }

    return false;
  }

  /** Tailored high-end art direction guidelines per archetype. */
  private getArchetypeGuidelines(archetype: PostCreativeArchetype): string {
    switch (archetype) {
      case 'fashion_model_editorial':
        return (
          'ARCHETYPE: HAUTE COUTURE & EDITORIAL PORTRAIT.\n' +
          '- Hero focal point is the specific human model or brand ambassador.\n' +
          '- EXACT HUMAN LIKENESS MANDATE: If a model reference photo is provided, duplicate their exact facial structure, bone architecture, eye shape/color, nose, mouth/lips, skin tone/complexion, and hair without alteration. Do NOT replace with a generic stock face or modify their ethnic identity.\n' +
          '- PHOTOREALISTIC HUMAN ANATOMY & TEXTURE: Render with true biological fidelity: microscopic skin pores, natural light subsurface scattering, realistic peach fuzz/fine hairs, authentic moisture catchlights in the pupils, and anatomically perfect hands with 5 distinct fingers, natural knuckle folds, and realistic fingernails (NO waxy/plastic AI skin).\n' +
          '- NATURAL PRODUCT INTERACTION: The model must be naturally and gracefully interacting with the featured commercial product (holding it with a gentle relaxed grip, wearing it, applying it, or showcasing it in a high-fashion lookbook posture).\n' +
          '- LIGHTING & OPTICS: Flawless commercial studio lighting (Profoto softbox key, subtle rim/edge kicker light to separate model from background, soft ambient bounce fill). 85mm f/1.4 prime lens with cinematic, creamy bokeh and tack-sharp focus on eyes and product.'
        );

      case 'promotional_campaign':
        return (
          'ARCHETYPE: LUXURY PROMOTIONAL CAMPAIGN.\n' +
          '- High-end luxury commercial sale aesthetic (reminiscent of Apple, Nike, or Parisian luxury retail).\n' +
          '- Bold, aspirational visual anchor paired with an elegant, modern promotional badge or discount callout.\n' +
          '- Premium metallic, neon rim, or polished glass accents highlighting the key offer.\n' +
          '- Impeccable graphic design hierarchy: generous negative space, sophisticated typography, zero cheap coupon clutter.'
        );

      case 'event_keynote':
        return (
          'ARCHETYPE: PRESTIGIOUS EVENT & SUMMIT KEYNOTE.\n' +
          '- Atmospheric, awe-inspiring stage or modern architectural venue setting.\n' +
          '- Volumetric ambient lighting, sleek LED backdrop glow, and dramatic focal contrast.\n' +
          '- Prominent, beautifully balanced event typography detailing the theme, dates, and venue.\n' +
          '- Dynamic perspective with authoritative, world-class presentation aesthetic.'
        );

      case 'educational_infographic':
        return (
          'ARCHETYPE: MINIMALIST EDITORIAL & KNOWLEDGE CARD.\n' +
          '- Clean Scandinavian editorial design with supreme typography legibility.\n' +
          '- Organized visual hierarchy, crisp iconography or focal graphic, and generous breathing margins.\n' +
          '- High-contrast typography hierarchy: bold numbered points or takeaway headline with readable supporting text.\n' +
          '- Sophisticated neutral canvas with strategic brand accent color pops.'
        );


      case 'brand_announcement':
        return (
          'ARCHETYPE: ICONIC BRAND ANNOUNCEMENT & MILESTONE.\n' +
          '- Prestigious, celebratory visual presentation with modern sculptural or architectural pedestals.\n' +
          '- Golden-hour sunbeams, dramatic architectural spotlights, or sleek dark luxury monolith framing.\n' +
          '- Confident, executive typography communicating authority, innovation, and triumph.\n' +
          '- Clean, uncluttered canvas commanding immediate reverence and attention.'
        );

      case 'social_lifestyle':
        return (
          'ARCHETYPE: ASPIRATIONAL LIFESTYLE & COMMUNITY STORY.\n' +
          '- Authentic candid realism with warm, inviting natural sunlit atmosphere.\n' +
          '- Relatable human connection, candid interactions, and atmospheric environment.\n' +
          '- Cinematic color grading (Kodak Portra 400 tones, gentle grain, rich midtones).\n' +
          '- Seamlessly blends lifestyle storytelling with brand identity.'
        );

      case 'digital_showcase':
        return (
          'ARCHETYPE: PREMIUM DIGITAL PRODUCT & WEBSITE SHOWCASE.\n' +
          '- HERO SUBJECT: a real, physically believable device — an open laptop, a desktop monitor, a tablet or a phone — angled at roughly 20-35 degrees so the screen is fully legible and clearly the focal point of the frame. The device is the product. Never substitute a physical object for it.\n' +
          '- THE SCREEN IS THE BRAND: render a clean, realistic, modern web page filling the display — a crisp top navigation bar, a strong hero banner, well-spaced blocks of body content and a clear call-to-action button. The page must be styled in the exact brand colours and typography supplied in the BRAND DNA block so it is instantly recognisable as THIS business.\n' +
          '- The attached logo belongs in the page header of that on-screen website, rendered small and crisp. Never distort, recolour or watermark it.\n' +
          '- STAGING: a real, aspirational desk or workspace — warm wood or matte stone, soft daylight from one side, subtle depth of field falling off behind the device. Real contact shadow beneath the device so it is grounded, never floating.\n' +
          '- LIGHTING & OPTICS: soft window key light with a gentle screen-glow bounce onto the surface, 50mm f/1.4 lens, tack-sharp focus on the screen so the interface reads, creamy falloff on the surroundings. Photorealistic — this is a photograph of a real device, not a 3D render.\n' +
          '- Do NOT add any other text anywhere on the canvas outside the supplied on-canvas string. The only lettering the screen itself carries is the brand logo and minimal, believable UI labels.'
        );

      case 'commercial_product':
      default:
        return (
          'ARCHETYPE: WORLD-CLASS COMMERCIAL PRODUCT SHOWCASE.\n' +
          '- Master commercial studio photography (Hasselblad H6D / Phase One IQ4 150MP aesthetic).\n' +
          '- Tactile physical materials with micro-details: brushed anodized metal, polished glass caustics, soft leather grain, or organic drops.\n' +
          '- Precision studio lighting (diffused softbox overhead, gentle rim kicker, subtle contact shadows on surface).\n' +
          '- Macro-sharp focal clarity on the hero subject with soft, organic depth-of-field falloff.'
        );
    }
  }

  /**
   * ╔═════════════════════════════════════════════════════════════════════╗
   * ║ BLOCK: BRAND DNA — the scraped website, promoted to first-class     ║
   * ╚═════════════════════════════════════════════════════════════════════╝
   *
   * THIS IS THE FIX FOR "it fetched the logo and colours but the post ignored
   * them".
   *
   * Previously the scraped brand identity had no home in the prompt. The
   * tagline and description were concatenated into `additionalInstructions` by
   * the frontend and then truncated to 300 characters, so by the time the image
   * model saw them they were a fragment of a sentence buried in a "CLIENT
   * OVERRIDE" line. The logo was the only thing that genuinely arrived, and
   * only as a small corner watermark.
   *
   * Now every scrapable signal is emitted as its own labelled, non-truncated
   * block, and the palette is stated as a *rule* ("this exact hex, on these
   * exact surfaces") rather than a suggestion. When a logo is attached the
   * block also states where it belongs, which is what stops the model from
   * slapping it in a random corner or ignoring it entirely.
   *
   * Returns an empty array when there is genuinely no brand data, so prompts
   * for unbranded users stay exactly as lean as before.
   */
  private buildBrandDnaBlock(ctx: DesignBriefContext): string[] {
    const brandName = sanitizePromptText(ctx.brandName, 100).trim();
    const niche = sanitizePromptText(ctx.niche || ctx.category, 90).trim();
    const tagline = sanitizePromptText(ctx.brandTagline, 160).trim();
    const description = sanitizePromptText(ctx.brandDescription, 400).trim();
    const website = sanitizePromptText(ctx.brandWebsiteUrl, 200).trim();
    const tone = sanitizePromptText(ctx.tone, 80).trim();

    // The palette is the single most important scrapable signal. Normalise it
    // so the renderer always sees concrete hex values, never a vague name.
    const palette = (
      ctx.brandColors && ctx.brandColors.length > 0
        ? ctx.brandColors
        : [ctx.primaryColor, ctx.secondaryColor, ctx.accentColor]
    )
      .map((c) => sanitizePromptText(c, 20).trim())
      .filter((c): c is string => Boolean(c))
      .slice(0, 4);

    if (
      !brandName &&
      !niche &&
      !tagline &&
      !description &&
      !website &&
      palette.length === 0
    ) {
      return [];
    }

    const lines: string[] = [
      '',
      '### BRAND DNA (scraped from the customer\'s own website — this is the brand the post belongs to):',
    ];

    if (brandName) lines.push(`- Brand: ${brandName}`);
    if (niche) lines.push(`- Industry / niche: ${niche}`);
    if (description) lines.push(`- What this business does: ${description}`);
    if (tagline) {
      lines.push(
        `- Brand tagline (for your understanding of their voice — it is CONTEXT, do NOT print it unless it is the supplied on-canvas string): "${tagline}"`,
      );
    }
    if (website) lines.push(`- Their website: ${website}`);
    if (tone) lines.push(`- Brand voice: ${tone}`);

    if (palette.length > 0) {
      lines.push(
        `- AUTHORITATIVE BRAND PALETTE: ${palette.join(', ')}`,
        '  PALETTE RULE: these exact colours are the brand. Use them for the dominant surfaces, the accent details and any on-screen interface. Do not introduce competing hues, and do not "improve" or shift these tones.',
      );
    }

    const headingFont = sanitizePromptText(
      ctx.fontHeading || ctx.font || '',
      60,
    ).trim();
    const bodyFont = sanitizePromptText(ctx.fontBody || '', 60).trim();
    if (headingFont || bodyFont) {
      lines.push(
        `- BRAND TYPOGRAPHY: headings in ${headingFont || 'a refined display serif'}, body/UI in ${bodyFont || 'a clean modern sans-serif'}. Use these typefaces on any rendered interface or headline.`,
      );
    }

    if (ctx.hasLogo && ctx.showLogo !== false) {
      lines.push(
        '- BRAND LOGO: the attached logo is their official mark. It must appear exactly once, unwarped, at full brand colour. If this post shows a website or app on a device, place the logo inside that on-screen page header. Otherwise place it in a quiet corner band of the canvas. Never stretch, rotate, outline, drop-shadow it into a watermark, or repeat it.',
      );
    }

    lines.push(
      'APPLY THIS: the finished post must be unmistakably recognisable as belonging to THIS business — same palette, same typography, same visual register. A generic stock-looking result is a failed result.',
    );

    return lines;
  }

  /**
   * The exhaustive negative prompt. Image models weight the tail of the prompt
   * heavily, so this is always the second-to-last block.
   */
  private buildNegativePrompt(archetype?: PostCreativeArchetype): string {
    return [
      'NEGATIVE PROMPT — NONE of the following may appear:',
      'gibberish or misspelled lettering; duplicated words; repeated headlines; random alphabet soup; stray or floating text; warped or distorted glyphs;',
      // These are the fixes for text leaking onto the canvas from the brief
      // itself, which is the most common and most embarrassing failure mode.
      'any rendering of the creative brief, the user prompt, the concept description, the campaign concept, or any sentence/fragment of the instructions given to you — the brief is CONTEXT for you, never COPY for the viewer;',
      'any rendering of the marketing headline, the body copy, the call to action, the key message, the offer, the tagline or the brand name, unless they are byte-for-byte identical to the one on-canvas text string you were given;',
      'invented lettering of any kind — if no on-canvas text was supplied, the image must contain zero letters;',
      'a caption strip, subtitle bar, or descriptive sentence along the bottom edge of the image;',
      'text placed over a face, over eyes, over hands, or crossing the silhouette of the model or the product;',
      'watermarks; stock-photo logo overlays; fake QR codes; fake legal fine print; invented brand names; invented URLs; hashtags or @handles;',
      // "fake UI chrome" is banned for physical-product posts, but it is the
      // entire subject for a digital_showcase post — so it is emitted
      // conditionally rather than unconditionally.
      ...(archetype === 'digital_showcase'
        ? []
        : ['fake UI chrome; a screen, monitor or device in the frame;']),
      'duplicate subjects; the same product or person rendered twice; split-screen collages of several uploaded photos;',
      'distorted hands; six fingers; melted facial features; crossed or misaligned eyes; plastic waxy skin; mannequin-like faces;',
      'blurry subjects; motion blur; heavy noise; visible JPEG artefacts; banding; oversharpening halos; chromatic aberration;',
      'flat amateur smartphone lighting; on-camera flash; cluttered backgrounds; harsh direct sun on the subject face;',
      'cartoon; anime; manga; comic-book art; vector illustration; clip-art; low-poly; 3D CGI render; uncanny 3D render;',
      'plastic-looking CGI product shots; text that is upside down, mirrored, or cropped at the canvas edge;',
      'off-brand colours; muddy colour mixing; oversaturated neon clashing with the brand palette;',
      'anything that looks AI-generated: melted details, inconsistent reflections, impossible geometry, floating objects.',
      // Archetype-specific bans. "fake UI chrome" above is fatal for a website
      // post — the whole point of a digital_showcase render IS the interface —
      // so the generic ban is swapped for a precise one that only forbids
      // gibberish inside the screen, never the screen itself.
      ...(archetype === 'digital_showcase'
        ? [
            'CRITICAL for this brief: NO food, NO cheese, NO fruit, NO clothing, NO cosmetic product, NO packaged grocery item and NO generic physical merchandise as the hero subject — if the post is about a website or app, the hero is the DEVICE, never an unrelated product that happens to match the brand colours;',
            'a blank, black, white or mirrored screen; a screen showing lorem ipsum, placeholder boxes, "@handle" or random keyboard mash;',
            'a device with no screen content, a device shot from an angle where the screen is unreadable, or a screen so small the page is illegible;',
            'more than one device unless the composition deliberately mirrors one; floating devices; a device that is visibly pasted onto the background;',
          ]
        : []),
    ].join(' ');
  }


  /**
   * BLOCK: RAG reference dossier.
   *
   * Each retrieved reference is presented as a labelled, numbered card with
   * its origin, match confidence and category, followed by the transferable
   * design traits. The explicit "abstract the craft, never copy the subject"
   * instruction is what stops the model from cloning another brand's product
   * or logo into the new post.
   */
  private buildReferenceDossier(references: RetrievedReference[]): string[] {
    if (references.length === 0) {
      return [];
    }

    const personal = references.filter((r) => r.kind === 'user_post');
    const shared = references.filter((r) => r.kind !== 'user_post');
    const lines: string[] = [
      '',
      '### RAG RETRIEVAL — DESIGN REFERENCE DOSSIER',
      'These are real, previously-approved designs retrieved from the platform knowledge base because they are semantically closest to this brief. Study them as a senior designer would.',
      '',
      'HOW TO USE THEM (mandatory):',
      '- ABSORB the transferable craft: palette temperature, lighting quality and direction, compositional structure, typographic hierarchy, depth treatment, surface texture, colour contrast, and overall mood.',
      '- SELECT the 1-2 references whose traits genuinely suit this brief and fuse them with the campaign archetype below. Do not average all of them into a muddy compromise.',
      '- NEVER copy their subject matter, product, brand, logo, or any readable text. Only the design language transfers.',
      '- Treat the similarity score as a confidence signal, not an instruction: above 75% is a strong match, below 45% is weak background inspiration only.',
    ];

    const renderCard = (ref: RetrievedReference, index: number): string[] => {
      const origin =
        ref.kind === 'user_post'
          ? `PROVEN PERSONAL TASTE (this account rated it ${ref.rating ?? '4+'} stars)`
          : ref.kind === 'style_ref'
            ? ref.source === 'global'
              ? 'CURATED PLATFORM REFERENCE'
              : 'ACCOUNT STYLE LIBRARY REFERENCE'
            : 'CURATED REFERENCE POST';
      const confidence = `${Math.round(ref.similarity * 100)}% match`;
      return [
        '',
        `[R${index}] ${sanitizePromptText(ref.title, 90)}`,
        `  origin: ${origin} | relevance: ${confidence}${ref.category ? ` | category: ${sanitizePromptText(ref.category, 40)}` : ''}`,
        `  original brief: "${sanitizePromptText(ref.brief, 180)}"`,
        `  transferable design traits: ${truncate(ref.contentText, MAX_SUMMARY_CHARS)}`,
      ];
    };

    if (personal.length > 0) {
      lines.push('', '— PROVEN FORMATS THIS ACCOUNT ALREADY APPROVED (highest priority) —');
      personal.forEach((ref, i) => lines.push(...renderCard(ref, i + 1)));
    }

    if (shared.length > 0) {
      lines.push(
        '',
        '— PLATFORM KNOWLEDGE BASE (proven patterns for this category) —',
      );
      shared.forEach((ref, i) => lines.push(...renderCard(ref, personal.length + i + 1)));
    }

    return lines;
  }

  /**
   * BLOCK: on-canvas text manifest.
   *
   * This block is the single reason a user prompt used to end up printed on
   * the creative. The old implementation pushed `headline`, `bodyCopy`, `cta`
   * AND `keyMessage` into the "MUST appear verbatim" whitelist — and since the
   * wizard passed the user's own idea as `keyMessage`, Gemini dutifully
   * typeset the raw brief onto the artwork.
   *
   * The contract is now inverted and far stricter:
   *
   *  1. **Only `ctx.onImageText` is renderable.** It is the one field the user
   *     explicitly typed for the canvas. Everything else in the prompt — the
   *     brief, the AI headline, the body copy, the CTA, the key message, the
   *     brand name — is declared NON-RENDERABLE context.
   *  2. **Empty means empty.** With no `onImageText` the contract demands a
   *     pure, letter-free image rather than letting the model "helpfully"
   *     invent a headline.
   *  3. **Positive manifest over negative prohibition.** Image models obey
   *     "write exactly this" far more reliably than "do not write X".
   */
  private buildTypographyContract(ctx: DesignBriefContext): string[] {
    // The ONLY string that may be printed on the artwork.
    const overlay = sanitizePromptText(ctx.onImageText, 80).trim();
    const placement = (ctx.onImageTextPlacement || 'auto').trim().toLowerCase();
    const font = sanitizePromptText(
      ctx.onImageTextFont || ctx.fontHeading || ctx.font || '',
      60,
    ).trim();
    const color = sanitizePromptText(ctx.onImageTextColor || '', 40).trim();

    // The brand contact line is the SECOND permitted string. It is built from
    // already-sanitised values, so it can be reproduced verbatim safely.
    const contactLine = buildContactLine(ctx.contactEmail, ctx.contactPhone);
    const contactPlacement = (ctx.contactPlacement || 'auto').trim().toLowerCase();

    const lines: string[] = [
      '',
      '### ON-CANVAS TEXT MANIFEST (exhaustive whitelist — the complete list of every character allowed on the artwork):',
    ];

    // ── Nothing at all requested: demand a completely letter-free image ──
    if (!overlay && !contactLine) {
      lines.push(
        'ALLOWED: NOTHING. The user supplied no text to display, so this image must contain ZERO lettering.',
        'Render a pure, fully art-directed visual: photography, product, subject, texture and negative space only.',
        'No headline, no subhead, no caption, no tagline, no price, no badge, no watermark, no logo lockup, no signage, no label, no stamp, no UI chrome anywhere on the canvas.',
        'Do not "help" by inventing a headline — an image with no text is the correct and desired outcome here.',
        'The entire canvas edge-to-edge must be free of all typographic content.',
      );
      return lines;
    }

    // ── Headline and/or contact line requested ──
    const fontLine = font
      ? `Set it in ${font}, rendered with true typographic craft: correct kerning, optical alignment, a deliberate weight and letter-spacing appropriate to its size.`
      : 'Set it in one refined display face with true typographic craft: correct kerning, optical alignment, a deliberate weight and appropriate letter-spacing.';

    const colorLine = color
      ? `Colour it ${color}, guaranteeing a minimum 4.5:1 contrast against whatever sits directly behind it.`
      : 'Colour it in the highest-contrast tone available from the brand palette, guaranteeing a minimum 4.5:1 contrast against whatever sits directly behind it.';

    // Enumerate the whitelist dynamically: [T1] and/or [C1].
    if (overlay) {
      lines.push(
        'ALLOWED — render ONLY these strings, and absolutely nothing else:',
        `   [T1] "${overlay}" — spelled exactly, same capitalisation, same word order, left-to-right, no line break inside it.`,
      );
    } else {
      lines.push(
        'ALLOWED — render ONLY the contact line below, and absolutely nothing else:',
      );
    }

    if (contactLine) {
      lines.push(
        `   [C1] "${contactLine}" — the brand's contact details. Reproduce character-for-character, including every digit, symbol and separator.`,
      );
    }

    lines.push(
      '',
      '### TYPOGRAPHY SPECIFICATION:',
      `1. ${fontLine}`,
      `2. ${colorLine}`,
    );

    if (overlay) {
      lines.push(
        `3. [T1] scale: the headline must occupy roughly 6–14% of the canvas height so it reads instantly at thumbnail size without dominating the composition.`,
        '4. Legibility: if it sits over a photograph, place it on a quiet region or add a soft gradient scrim so every letter is crisp. Never reduce contrast to make it fit.',
        '5. Margins: keep at least a 7% margin between the text block and every canvas edge. Never crop, clip, hyphenate or run a letter off the frame.',
        '6. Never repeat the string, never duplicate it as a shadow or echo, never add filler words, never lorem ipsum.',
      );
    } else {
      lines.push(
        '3. Render [C1] as ONE clean, single-line contact lockup. Never break the phone number or the email address across two lines.',
      );
    }

    if (contactLine) {
      lines.push(
        ...buildContactTypographyRules(ctx, contactLine, contactPlacement, Boolean(overlay)),
      );
    }

    if (overlay) {
      this.pushPlacementRules(lines, ctx, placement);
    } else {
      // Contact-only: still needs the intelligent-placement reasoning, but for
      // the contact line rather than the headline.
      lines.push(...this.buildContactPlacementRules(ctx, contactPlacement));
    }

    this.pushTextNegativeRules(lines, Boolean(overlay), Boolean(contactLine));

    return lines;
  }

  /**
   * Appends either the user's fixed placement slot or, when they did not
   * choose one, a full "art director decides" reasoning contract so Gemini can
   * place the overlay intelligently instead of guessing.
   */
  private pushPlacementRules(
    lines: string[],
    ctx: DesignBriefContext,
    placement: string,
  ): void {
    if (placement && placement !== 'auto') {
      lines.push(
        '',
        '### PLACEMENT (fixed by the user — follow exactly):',
        `Anchor the text in the "${placement.replace(/_/g, ' ')}" region of the canvas. Respect the safe margin defined above and keep the text fully on-canvas.`,
        'If that exact region is physically occupied by the subject, shift the text as little as possible to the nearest adjacent quiet area rather than ever moving it over the subject.',
      );
      return;
    }

    // No placement given → the refined "art director decides" contract.
    const ratio = (ctx.aspectRatio || ctx.postSize || '1:1').trim();
    const zone = AUTO_PLACEMENT_ZONES[ratio] ?? AUTO_PLACEMENT_ZONES['1:1'];
    lines.push(
      '',
      '### PLACEMENT (the user did not choose a position — YOU decide, intelligently):',
      'Follow this exact reasoning order before committing to a position:',
      `1. Work out where the hero subject physically occupies the frame. For this ${ratio} canvas the subject is expected to sit around: ${zone}`,
      '2. Choose the single largest quiet region the subject leaves free. Prefer a region with even tonal density so the type stays crisp.',
      '3. If the type would overlap the subject, its face, or the product label, move the text — never let a letter cross the subject silhouette.',
      '4. If the background behind that region is busy, darken or simplify it with a soft gradient scrim rather than moving the text onto the subject.',
      '5. Optically align the block: use the region centre or a clean edge, and balance the negative space so the composition does not look lopsided.',
      '6. If — and only if — there is genuinely no room for legible type anywhere, omit the text entirely. A clean image always beats text over a face.',
    );
  }

  /**
   * The exhaustive "never print this" list. Every string the model read in the
   * prompt but is not allowed to typeset is named here by its role.
   */
  private pushTextNegativeRules(
    lines: string[],
    hasOverlay: boolean,
    hasContact: boolean,
  ): void {
    // Reference the whitelist entries that actually exist, so the model never
    // hunts for a [T1] or [C1] that was not supplied.
    const allowed = [
      hasOverlay ? '[T1]' : null,
      hasContact ? '[C1]' : null,
    ]
      .filter(Boolean)
      .join(' or ');

    const scope = allowed
      ? `unless byte-for-byte identical to ${allowed} above`
      : 'under any circumstances';

    lines.push(
      '',
      '### FORBIDDEN — do not render any of the following:',
      'The campaign brief, the concept description, the user prompt, the core idea, or ANY word, sentence or fragment of the instructions you were given — the brief is CONTEXT for you, never COPY for the viewer;',
      `The marketing headline, the body copy, the call to action, the key message, the offer, the tagline, the brand name or the product description, ${scope};`,
      hasContact
        ? 'any phone number, email address, URL, handle or QR code OTHER than the exact [C1] contact line above — never invent, guess, complete or "improve" a contact detail, and never append a country code, extension or extra digit that is not in [C1];'
        : 'any invented tagline, slogan, hashtag, "@" mention, handle, URL, price, discount figure, date, disclaimer, phone number, email address, address, QR code, legal fine print or app-interface element;',
      'a caption strip, subtitle bar or descriptive sentence along any edge of the image;',
      'text placed over a face, over eyes, over hands, or crossing the silhouette of the model or the product.',
    );
  }

  /**
   * Placement reasoning for the contact line when there is no headline to place.
   * Contacts conventionally anchor the bottom of a social post, so the contract
   * biases toward a lower band while still deferring to the subject's occupancy.
   */
  private buildContactPlacementRules(
    ctx: DesignBriefContext,
    placement: string,
  ): string[] {
    if (placement && placement !== 'auto') {
      return [
        '',
        '### CONTACT LINE PLACEMENT (fixed by the user — follow exactly):',
        `Anchor [C1] in the "${placement.replace(/_/g, ' ')}" region of the canvas.`,
        'Respect the safe margin defined above and keep the contact line fully on-canvas.',
        'If that exact region is physically occupied by the subject, shift it as little as possible to the nearest adjacent quiet area rather than ever moving it over the subject.',
      ];
    }

    const ratio = (ctx.aspectRatio || ctx.postSize || '1:1').trim();
    const zone = AUTO_PLACEMENT_ZONES[ratio] ?? AUTO_PLACEMENT_ZONES['1:1'];

    return [
      '',
      '### CONTACT LINE PLACEMENT (the user did not choose a position — YOU decide, intelligently):',
      'Work out where the hero subject physically occupies the frame before placing anything. For this',
      `${ratio} canvas the subject is expected to sit around: ${zone}`,
      'Then follow this reasoning order:',
      '1. Contacts conventionally anchor the FOOT of a social post, so prefer the lowest quiet band (typically the bottom 14–20%) — but only if the subject leaves it clear.',
      '2. If the lower band is occupied, choose the next quietest region that the subject leaves free, preferring even tonal density so the type stays crisp.',
      '3. Never let the contact line overlap the subject, its face, its hands, or the brand logo. Keep clear space around all of them.',
      '4. If the background behind the chosen region is busy, add a soft gradient scrim rather than moving the line onto the subject.',
      '5. Optically align the lockup to a clean edge so the composition does not look lopsided, and keep at least a 7% margin from every canvas edge.',
      '6. If — and only if — there is genuinely no room for legible type anywhere, omit the contact line entirely. A clean image always beats text over a face.',
    ];
  }

  /**
   * BLOCK: subject-occupancy / text safe zone.
   *
   * This is what stops headlines landing across a model's face. The renderer is
   * told to *first* work out where the subject physically occupies the frame,
   * then place every text element only in the largest remaining quiet region.
   *
   * The archetype matters: a centre-dominant model portrait and a centre
   * product shot fail in opposite ways, so the safe bands are mirrored when
   * the hero is a human.
   */
  private buildTextSafeZone(ctx: DesignBriefContext): string[] {
    const ratio = (ctx.aspectRatio || ctx.postSize || '1:1').trim();
    const hasModel = Boolean(ctx.hasModelImage);
    const hasProduct = Boolean(ctx.subjectImagesCount || ctx.hasSubjectImage);

    // A model portrait dominates the centre, so bias type out to the edges.
    const modelLeads = hasModel && !ctx.hasSubjectImage;

    const bands: Record<string, string> = modelLeads
      ? {
          '1:1': 'type lives in the outer 28% margin band on ONE side only (left or right), stacked and aligned to a single axis; the centre 50% stays completely clear of lettering.',
          '4:5': 'headline anchored top-left or top-right within the outer 25% band, aligned to one vertical edge; the vertical centre band where the subject sits carries no type at all.',
          '9:16': 'headline pinned in the top 18% only and CTA in the bottom 14% only, full-bleed to the outer edges; the middle 60% — where the subject is — carries no text whatsoever.',
          '16:9': 'text column confined to the left or right 30% and vertically centred; the subject holds the opposite 60%.',
          '3:4': 'headline in the outer left or right 26% column, vertically centred, aligned to one edge; the centre subject area stays clear.',
          '4:3': 'text column in the left or right 28%; subject on the opposite two thirds.',
        }
      : {
          '1:1': 'type occupies the top 30% and bottom 18% bands only; the central 50% holds the product alone.',
          '4:5': 'eyebrow and headline stacked in the top 26%, supporting line and CTA in the bottom 16% above a clear margin; the centre 58% band is reserved entirely for the product.',
          '9:16': 'oversized headline in the top 22%, product in the middle 56%, CTA pill in the bottom 14% clear of platform UI overlays.',
          '16:9': 'horizontal split — text stack in the left or right 32%, product on the opposite third with generous side margins.',
          '3:4': 'headline across the top 28%, product centred and dominant, small supporting line and CTA in the bottom 15%.',
          '4:3': 'balanced spread — text hierarchy in the right or left 30%, product on the opposite two thirds.',
        };

    const band =
      bands[ratio] ??
      bands[Object.keys(bands).find((k) => ratio.includes(k)) ?? '1:1'];

    const forbidden = hasModel
      ? [
          'NO type over the face — keep a clear gap of at least one eye-width around the eyes, nose and mouth.',
          'NO type over the hands, fingers or any exposed skin.',
          "NO type crossing the model's silhouette, hair outline or shoulder line.",
        ]
      : hasProduct
        ? [
            'NO type over the product, its label, logo, embossing or any printed detail on it.',
            "NO type crossing the product's silhouette — never let a letter cut across the product edge.",
          ]
        : [
            "NO type over the focal subject's silhouette or centre of mass.",
            'NO type inside the busiest, highest-detail region of the frame.',
          ];

    return [
      '',
      '### SUBJECT-OCCUPANCY & TEXT SAFE ZONE (apply before placing any lettering):',
      '1. First determine where the hero subject physically occupies the frame. Then place every text element only in the largest remaining quiet region.',
      `2. For this ${ratio} canvas: ${band}`,
      ...forbidden.map((f, i) => `${i + 3}. ${f}`),
      '5. If there is genuinely no room to place text without violating these rules, OMIT the text entirely — a clean image always beats text over a face.',
      '6. If the background is too busy for legible type, darken or simplify the area behind the text with a soft gradient. Never move the text onto the subject.',
    ];
  }



  /**
   * BLOCK: composition contract — turns the requested aspect ratio into
   * concrete, checkable layout instructions.
   */
  private buildCompositionContract(ctx: DesignBriefContext): string[] {
    const ratio = (ctx.aspectRatio || ctx.postSize || '1:1').trim();
    const directive =
      ASPECT_RATIO_DIRECTIVES[ratio] ??
      ASPECT_RATIO_DIRECTIVES[
        Object.keys(ASPECT_RATIO_DIRECTIVES).find((key) => ratio.includes(key)) ?? '1:1'
      ];

    const palette =
      ctx.brandColors && ctx.brandColors.length > 0
        ? ctx.brandColors.join(', ')
        : [ctx.primaryColor, ctx.secondaryColor, ctx.accentColor]
            .filter(Boolean)
            .join(', ') || ctx.colorScheme;

    return [
      '',
      '### COMPOSITION & COLOUR CONTRACT:',
      `1. Canvas: ${directive}`,
      '2. Exactly ONE focal subject. Everything else is staging, texture or negative space that supports it.',
      '3. Maintain clear depth: foreground subject in sharp focus, midground context softly resolved, background falling away.',
      palette
        ? `4. Anchor the palette on ${sanitizePromptText(palette, 120)}. Keep contrast deliberate so the type always wins over the image.`
        : '4. Use a restrained, sophisticated palette with one clear accent colour.',
      '5. Leave deliberate negative space around every text block — never let type compete with busy detail.',
      '6. No borders, frames, or cheap sticker clutter unless the brief explicitly asks for them.',
    ];
  }

  /**
   * BLOCK: user-supplied style references.
   *
   * The user can attach screenshots or moodboards with an optional note each
   * ("make the background like this", "borrow this colour grade"). This block
   * turns that into an addressable list so the model can act on each one
   * individually instead of averaging them into mush.
   *
   * The guard rails matter more here than for RAG references: these are images
   * the user found *somewhere else*, so they frequently contain someone else's
   * product, logo and typography. We want the craft, never the identity.
   */
  private buildUserReferenceBlock(
    refs: NonNullable<DesignBriefContext['inspirationImages']>,
  ): string[] {
    const withNotes = refs.filter((r) => (r.note || '').trim().length > 0);
    const withoutNotes = refs.filter((r) => (r.note || '').trim().length === 0);

    const lines: string[] = [
      '',
      '### USER REFERENCE IMAGES (highest-priority creative direction):',
      `${refs.length} image${refs.length > 1 ? 's are' : ' is'} attached as the client’s own visual direction. ${refs.length > 1 ? 'These OVERRIDE' : 'This OVERRIDES'} any automatically-retrieved style reference on every point of conflict — if the client asked for it, it wins.`,
      '',
      'HOW TO USE THEM:',
      '- ABSORB the transferable craft: palette and colour temperature, lighting quality and direction, background treatment, compositional structure, depth, surface texture, mood and finish.',
      '- Apply the client’s note for that image as a specific, literal instruction — it is a direct order, not a suggestion.',
      '',
      'HARD LIMITS (non-negotiable):',
      '- NEVER copy the subject matter, product, person, packaging, brand name, logo, wordmark, or any readable text that appears in a reference image.',
      '- NEVER reproduce a reference as a literal copy or paste any part of it into the frame; this is inspiration, not a collage.',
      '- Only the DESIGN LANGUAGE transfers. The subject of this post comes from the product/model/logo attachments described above.',
    ];

    refs.forEach((ref, i) => {
      const n = ref.index || i + 1;
      const note = (ref.note || '').trim();
      lines.push(
        note
          ? `  [U${n}] CLIENT REFERENCE ${n} — the user says: "${sanitizePromptText(note, 300)}" Follow that instruction precisely for this image.`
          : `  [U${n}] CLIENT REFERENCE ${n} — no note was given, so absorb its overall look, palette and mood as the target aesthetic.`,
      );
    });

    if (withNotes.length > 0 && withoutNotes.length > 0) {
      lines.push(
        '',
        `Note that ${withNotes.length} of the references carry a written instruction and ${withoutNotes.length} do not — for the ones without a note, infer the intent from the image itself rather than assuming the note applies to them.`,
      );
    }

    return lines;
  }

  /**
   * BLOCK: attachment specifications — explains what each uploaded image is
   * and exactly how the model is allowed to use it.
   */
  private buildAttachmentSpecs(ctx: DesignBriefContext): string[] {
    const lines: string[] = ['', '### ATTACHMENT SPECIFICATIONS:'];

    if (ctx.hasModelImage && ctx.subjectImagesCount && ctx.subjectImagesCount > 0) {
      lines.push(
        'HUMAN MODEL REFERENCE — the first attachment. This is the EXACT person who must star in this campaign post. Maintain 100% identity fidelity: identical bone structure, eyes, nose, mouth, jawline, skin complexion and undertone, hair texture and styling. Do NOT alter their facial identity, age, or ethnicity. Render with authentic human biological realism (natural pores, subsurface scattering, authentic pupil catchlights, realistic hands with 5 fingers). Never substitute with a generic stock face.',
        `PRODUCT REFERENCE(S) — the next ${ctx.subjectImagesCount} attachment(s) show the exact commercial product from different angles. Use them as ground truth for its 3D geometry, branding, colour and material. Feature ONE single hero product in a magnificent focal presentation. Do NOT paste, collage or display all the photos together on the canvas.`,
      );
    } else if (ctx.hasModelImage) {
      lines.push(
        'HUMAN MODEL REFERENCE — the attached image is the EXACT person who must star as the model/ambassador. Faithfully reproduce their facial features, facial structure, eyes, nose, lips, jawline, skin tone, hair, and complexion without altering their identity. Render with authentic human skin texture (visible pores, soft natural skin sheen, zero plastic/waxy look) and anatomically perfect hands.',
      );
    } else if (ctx.subjectImagesCount && ctx.subjectImagesCount > 1) {
      lines.push(
        `PRODUCT REFERENCE(S) — ${ctx.subjectImagesCount} attachments show the same product from different angles and details. Use them to understand its true physical form, then feature ONE single hero product in the composition with supreme commercial clarity. Do NOT collage or show all photos at once on the post canvas.`,
      );
    } else if (ctx.hasSubjectImage) {
      lines.push(
        ctx.backgroundRemoved
          ? 'HERO SUBJECT — the attached transparent PNG is the hero subject. Seamlessly integrate it into the scene with accurate ground contact shadows, ambient occlusion, and lighting that matches the scene colour temperature exactly. Maintain authentic shape, colour and texture. Never substitute or distort it.'
          : 'HERO SUBJECT — the attached photo is the primary hero subject. Reproduce it accurately without distortion or replacement and blend it naturally into the surrounding staging.',
      );
    } else {
      lines.push(
        'No product photo was attached. Compose the hero subject from the written brief with complete commercial realism.',
      );
    }

    if (ctx.hasLogo && ctx.showLogo === false) {
lines.push(
        'BRAND LOGO — the user has EXPLICITLY DISABLED logo placement for this post. An image is attached but it is the old logo: DO NOT reproduce it, DO NOT trace it, DO NOT place it anywhere, and DO NOT invent a replacement mark, wordmark, monogram or badge. This creative must be completely logo-free.',
      );
    } else if (ctx.hasLogo) {
      // For a digital showcase the logo belongs INSIDE the on-screen page
      // header. Telling the model to also drop it "top-right of the canvas"
      // produced two competing instructions and it usually did both.
      const isDigital = this.detectArchetype(ctx) === 'digital_showcase';
      lines.push(
        isDigital
          ? 'BRAND LOGO — one attachment is the official brand logo. Reproduce it UNCHANGED and UNWARPED at ONE PLACE ONLY: inside the header of the website/app shown on the device screen, rendered small, crisp and at full brand colour. Do NOT also place a second copy in a corner of the canvas. Never stretch, rotate, recolour, outline or drop-shadow it into a watermark.'
          : 'BRAND LOGO — one attachment is the official brand logo. Reproduce it UNCHANGED and UNWARPED at ONE PLACE ONLY. Preserve its exact proportions, colours and lettering; never stretch, rotate, recolour, outline, drop-shadow into a watermark, repeat or scatter it. Place it in the quietest corner band the subject leaves free — normally top-right — with generous padding and maximum contrast against the background. If the background there is busy, add a soft scrim behind it rather than moving it over the subject.',
      );
    }

    // User-supplied references come before the auto-retrieved ones to mirror
    // the physical attachment order in the Gemini call.
    const userRefs = ctx.inspirationImages || [];
    if (userRefs.length > 0) {
      lines.push(
        ...this.buildUserReferenceBlock(userRefs),
      );
    }

    const refCount = ctx.referenceImageCount || 0;
    if (refCount > 0) {
      const titles = (ctx.referenceImageTitles || []).slice(0, refCount);
      lines.push(
        `STYLE REFERENCE IMAGES — the last ${refCount} attachment${refCount > 1 ? 's are' : ' is'} retrieved from the approved knowledge base. ${titles
          .map((t, i) => `Reference ${i + 1}: "${sanitizePromptText(t, 90)}"`)
          .join('. ')}. These are STYLE anchors only: match their lighting quality, palette temperature, compositional energy, depth and finish. NEVER reproduce their subject, product, brand, logo, or any text from them.`,
      );
    }

    return lines;
  }


  /**
   * STAGE 1 — sent to the Gemini TEXT model.
   *
   * Asks an art director to turn the brief + retrieved references into a
   * structured JSON design plan. Keeping this separate from the image call
   * means all the reasoning happens on a cheap, fast text model, and the
   * expensive image model receives one dense, already-decided prompt.
   */
  buildPlannerPrompt(
    ctx: DesignBriefContext,
    references: RetrievedReference[],
  ): string {
    const archetype = this.detectArchetype(ctx);
    const lines: string[] = [
      'You are an elite, world-renowned Creative Art Director and Senior Designer for global luxury brands and top commercial agencies (WPP, Omnicom, Pentagram, Apple In-House). You have 20 years of art direction and you are known for work that is unmistakably expensive.',
      '',
      'TASK: analyse the creative brief and the retrieved design references below, then produce ONE agency-grade visual design plan for an AI image generator. The plan will be executed by a renderer model, so be decisive and concrete — no hedging, no "or", no alternatives.',
      '',
      `### CLASSIFIED CAMPAIGN ARCHETYPE: ${archetype.toUpperCase()}`,
      this.getArchetypeGuidelines(archetype),
      '',
      '### COMPLETE CREATIVE BRIEF SPECIFICATIONS:',
    ];

    if (ctx.prompt) lines.push(`- Core Concept / Vision (CONTEXT ONLY — never print this): "${sanitizePromptText(ctx.prompt, 500)}"`);
    if (ctx.productName) lines.push(`- Featured Subject / Product: "${sanitizePromptText(ctx.productName, 150)}"`);
    if (ctx.brandName) lines.push(`- Brand Name (do not print unless it is the overlay text): "${sanitizePromptText(ctx.brandName, 100)}"`);
    if (ctx.category || ctx.niche) lines.push(`- Industry & Commercial Niche: ${sanitizePromptText(ctx.category || ctx.niche, 80)}`);
    if (ctx.platform) lines.push(`- Publishing Platform: ${sanitizePromptText(ctx.platform, 50)}`);
    if (ctx.aspectRatio) lines.push(`- Canvas Aspect Ratio: ${sanitizePromptText(ctx.aspectRatio, 20)}`);
    if (ctx.style) lines.push(`- Selected Design Style: ${sanitizePromptText(ctx.style, 80)}`);
    if (ctx.occasion) lines.push(`- Campaign Purpose: ${sanitizePromptText(ctx.occasion, 80)}`);
    if (ctx.backgroundMode) lines.push(`- Staging & Background Mode: ${sanitizePromptText(ctx.backgroundMode, 80)}`);
    if (ctx.layoutPreference) lines.push(`- Visual Direction & Focus: ${sanitizePromptText(ctx.layoutPreference, 80)}`);

    // The one and only string permitted on the canvas.
    const overlayText = sanitizePromptText(ctx.onImageText, 80).trim();
    const contactLine = buildContactLine(ctx.contactEmail, ctx.contactPhone);
    const allowedStrings: string[] = [];
    if (overlayText) allowedStrings.push(`[T1] "${overlayText}" (the headline)`);
    if (contactLine) allowedStrings.push(`[C1] "${contactLine}" (the brand contact line)`);

    if (allowedStrings.length > 0) {
      lines.push(
        '',
        '### ON-CANVAS TEXT — THE ONLY STRINGS ALLOWED TO APPEAR ON THE IMAGE:',
        ...allowedStrings,
        overlayText
          ? ctx.onImageTextFont
            ? `Required font style for [T1]: ${sanitizePromptText(ctx.onImageTextFont, 60)}`
            : 'Font style for [T1]: use the brand heading font.'
          : '',
        overlayText && ctx.onImageTextColor
          ? `Required colour for [T1]: ${sanitizePromptText(ctx.onImageTextColor, 40)}`
          : '',
        overlayText
          ? (ctx.onImageTextPlacement || 'auto') !== 'auto'
            ? `Fixed placement for [T1]: ${String(ctx.onImageTextPlacement).replace(/_/g, ' ')}.`
            : 'Placement for [T1]: NOT specified by the user — decide the single best quiet region yourself, as a senior art director would, never covering the subject.'
          : '',
        contactLine
          ? `Placement for [C1]: ${
              (ctx.contactPlacement || 'auto') !== 'auto'
                ? `fixed by the user — ${String(ctx.contactPlacement).replace(/_/g, ' ')}.`
                : 'not specified — anchor it in the quietest band the subject leaves free (a lower band is conventional for contact details), never covering the subject and never colliding with [T1] or the logo.'
            }`
          : '',
        'EVERY other string in this brief — the core concept, headline, body copy, key message, CTA, offer, brand name, product description — is CONTEXT ONLY and must NEVER be typeset onto the image.',
        'Your plan MUST leave room for these exact strings on the canvas and MUST state where each one sits. A plan that leaves no room for them is an incorrect plan.',
      );
    } else {
      lines.push(
        '',
        '### ON-CANVAS TEXT:',
        'The user supplied NO text to display. The finished image must contain ZERO lettering — no headline, no caption, no tagline, no badge, no contact details, no watermark. A pure, letter-free visual is required.',
      );
    }

    if (ctx.headline) lines.push(`- Draft Hero Headline (internal copy only — DO NOT print): "${sanitizePromptText(ctx.headline, 200)}"`);
    if (ctx.bodyCopy) lines.push(`- Draft Body Copy (internal copy only — DO NOT print): "${sanitizePromptText(ctx.bodyCopy, 400)}"`);
    if (ctx.keyMessage) lines.push(`- Key Message / Value Prop (internal copy only — DO NOT print): "${sanitizePromptText(ctx.keyMessage, 250)}"`);
    if (ctx.cta) lines.push(`- Call To Action (internal copy only — DO NOT print): "${sanitizePromptText(ctx.cta, 80)}"`);
    if (ctx.targetAudience) lines.push(`- Target Audience Demographic: ${sanitizePromptText(ctx.targetAudience, 150)}`);
    if (ctx.tone) lines.push(`- Brand Voice & Tone: ${sanitizePromptText(ctx.tone, 80)}`);

    const palette =
      ctx.brandColors && ctx.brandColors.length > 0
        ? ctx.brandColors.map((c) => sanitizePromptText(c, 20)).join(', ')
        : [ctx.primaryColor, ctx.secondaryColor, ctx.accentColor].filter(Boolean).join(', ') || ctx.colorScheme;
    if (palette) lines.push(`- Brand Color Palette (authoritative): ${palette}`);

    // The full scraped brand identity, untruncated and explicitly labelled.
    // The one-line palette above is a summary; this block is the *reasoning*
    // context the art director needs to invent a subject that belongs to this
    // specific business (e.g. "a laptop showing THEIR site" instead of "a
    // laptop showing some generic page").
    lines.push(...this.buildBrandDnaBlock(ctx));

    if (ctx.fontHeading || ctx.font || ctx.fontBody) {
      lines.push(`- Typography: ${ctx.fontHeading || ctx.font || 'Editorial Serif / Modern Neo-Grotesque'} for headlines, ${ctx.fontBody || 'clean sans-serif'} for secondary text`);
    }
    if (ctx.language) lines.push(`- Text Language: ${sanitizePromptText(ctx.language, 40)}`);
    if (ctx.additionalInstructions) lines.push(`- Additional Guidance: ${sanitizePromptText(ctx.additionalInstructions, 300)}`);

    // Attachment awareness in the planner so it can design *around* the assets.
    if (ctx.hasModelImage) lines.push('- Attached Human Model Reference: YES — a dedicated photo of the exact person who must star as the model.');
    if (ctx.subjectImagesCount) lines.push(`- Attached Product Reference Photos: ${ctx.subjectImagesCount}`);
    if (ctx.hasSubjectImage) lines.push(`- Hero product photo attached, background removed: ${ctx.backgroundRemoved ?? false}`);
    if (ctx.hasLogo && ctx.showLogo === false) {
      lines.push('- Attached Brand Logo: attached but the user has DISABLED it — the final image must contain NO logo, wordmark or brand mark of any kind. Design the composition as if no logo existed.');
    } else if (ctx.hasLogo) {
      lines.push('- Attached Brand Logo: YES (must appear exactly once, in a quiet corner band, unwarped and uncoloured).');
    }
    // User references are the client's own direction and outrank everything the
    // retriever surfaced, so they are announced before the RAG dossier.
    const userRefs = ctx.inspirationImages || [];
    if (userRefs.length > 0) {
      lines.push(
        `- Attached USER REFERENCE IMAGES (the client's own screenshots/moodboards): ${userRefs.length}. These are the highest-priority visual direction and OVERRIDE the retrieved knowledge-base references on any point of conflict.`,
      );
      userRefs.forEach((ref, i) => {
        const note = (ref.note || '').trim();
        lines.push(
          note
            ? `    * User reference ${ref.index || i + 1} — CLIENT INSTRUCTION: "${sanitizePromptText(note, 300)}" (follow it literally; take only the design language, never their subject/logo/text)`
            : `    * User reference ${ref.index || i + 1} — no note given; take its overall palette, lighting and mood as the target aesthetic (never its subject/logo/text)`,
        );
      });
    }

    if ((ctx.referenceImageCount || 0) > 0) lines.push(`- Attached Style Reference Images from the knowledge base: ${ctx.referenceImageCount} (style anchors only — never copy their subject or text).`);

    lines.push(...this.buildReferenceDossier(references));

    // ── SUBJECT COMMITMENT ──────────────────────────────────────────────
    // Without this, the planner defaults to a safe, generic studio product
    // shot no matter what the brief actually says. Forcing it to name ONE
    // literal, physical hero subject — derived from the brief AND the brand
    // DNA — is what stops "our website is live now" from becoming a wedge of
    // cheese on a seamless backdrop.
    lines.push(
      '',
      '### STEP ZERO — COMMIT TO A LITERAL HERO SUBJECT (do this before writing anything else):',
      'The single most important decision in this plan is WHAT IS PHYSICALLY IN THE FRAME. Decide it explicitly, then build the whole composition around it.',
      '1. Read the core concept and name, in your own mind, the ONE physical object or scene a viewer would photograph to communicate this exact message. Be literal and specific — "an open aluminium laptop on a walnut desk", not "a modern product shot".',
      '2. Cross-check that choice against the BRAND DNA block. If the brand sells furniture, the device/room/prop you choose must suit that industry. If the brief is about the website or app, the hero is the DEVICE plus the on-screen page — never a stand-in product that merely matches the brand colours.',
      '3. Never default to a generic studio pedestal, seamless backdrop or floating cube because you could not decide. A wrong-but-specific subject is a recoverable error; an anonymous one is a wasted generation.',
      `4. This campaign is classified as ${archetype.toUpperCase()}. Honour that classification's art direction exactly.`,
      '5. State your chosen hero subject in plain words in the composition notes so the decision is auditable.',
    );

    lines.push(
      '',
      '### HOW TO WRITE "image_generation_prompt":',
      'It is a single dense paragraph (60-110 words) that a renderer model will execute verbatim. It MUST specify, in this order:',
      '1. The scene and its staging environment;',
      '2. the exact focal subject and how it is positioned;',
      '3. camera position, lens and optical character;',
      '4. the lighting setup (key, fill, rim, practical) and its quality;',
      '5. the colour harmony and where the accent colour lands;',
      '6. the typography layout: if the brief supplies on-canvas text strings, name where each ONE sits and which region stays text-free around the subject; if it does not, state that the frame is deliberately letter-free;',
      '7. the atmospheric depth and finish.',
      'Write it as a single flowing paragraph of concrete visual language. Do not use bullet points, headings, or placeholders.',
      'CRITICAL: the paragraph describes the IMAGE. It must never read as a caption, a slogan, or a sentence to be printed on the canvas. The ONLY text that may appear on the artwork is the exact on-canvas text string supplied in the brief (if any). Never mention, quote or paraphrase the brief, the concept, the headline, the body copy, the key message or the CTA in a way that would put those words on the image.',
    );

    lines.push(
      '',
      '### OUTPUT — return ONLY valid JSON, no markdown fences, no commentary:',
      '{',
      '  "image_generation_prompt": "<the 60-110 word renderer prompt described above>",',
      '  "hero_subject": "<the ONE literal physical object/scene you committed to, in under 12 words>",',
      '  "art_direction": {',
      '    "color_palette": ["Primary", "Secondary", "Accent"],',
      '    "typography": "font character, weights, case, and where each text element sits",',
      '    "composition": "layout structure, focal point, and negative-space strategy",',
      '    "lighting_and_mood": "lighting setup and the emotional atmosphere it creates"',
      '  },',
      '  "references_used": ["R1", "R3"],',
      '  "rationale": "one sentence on which retrieved reference traits you fused and why"',
      '}',
      '',
      'RULES:',
      '1. Valid JSON only — the first character must be { and the last must be }.',
      '2. The on-canvas text string (if the brief supplies one) MUST be reproduced character-for-character in your plan; never rewrite, translate, expand or "improve" it.',
      '3. On-canvas text is limited to that ONE string. Do not plan a headline, a subhead, a caption, a CTA pill or a badge unless the brief explicitly supplied them as on-canvas text.',
      '4. If the brief supplies no on-canvas text, plan a completely letter-free image and say so explicitly in the composition notes.',
      '5. Never invent a brand name, product claim, price, URL or statistic that was not in the brief.',
      '6. Mandate true commercial photography quality: real skin texture, authentic materials, natural shadows, volumetric depth.',
      '7. Strictly forbid cartoon, anime, illustration, low-poly 3D, and cheap stock graphics.',
    );

    return lines.join('\n');
  }


  /**
   * ╔═════════════════════════════════════════════════════════════════════╗
   * ║ STAGE 2 — THIS IS THE FINAL PROMPT SENT TO THE GEMINI IMAGE MODEL  ║
   * ╚═════════════════════════════════════════════════════════════════════╝
   *
   * Seven blocks, in this exact order (order matters — image models weight
   * the tail of a prompt most heavily):
   *
   *   1. CREATIVE DIRECTION     the planner's decision, verbatim
   *   2. ATTACHMENT SPECS       what each uploaded image is and may be used for
   *   3. TYPOGRAPHY CONTRACT    exact strings, counts and positions
   *   4. COMPOSITION CONTRACT   aspect-ratio aware layout + palette
   *   5. RAG REFERENCE NOTES    what the retrieved designs taught us
   *   6. NEGATIVE PROMPT        exhaustive list of forbidden artefacts
   *   7. PRODUCTION STANDARDS   camera, optics, lighting, resolution
   */
  buildRendererPromptFromPlan(
    planPrompt: string,
    ctx: DesignBriefContext,
    references: RetrievedReference[] = [],
  ): string {
    const lines: string[] = [];
    const archetype = this.detectArchetype(ctx);

    // 1. Creative direction
    lines.push(
      '=== 1. CREATIVE DIRECTION ===',
      planPrompt.trim(),
      '',
    );

    // 1b. BRAND DNA — the scraped website identity, restated for the renderer.
    // The planner saw this too, but the renderer is a separate model call with
    // no memory of the planner prompt, so the brand rules must be repeated here
    // or the palette simply will not be applied.
    lines.push(...this.buildBrandDnaBlock(ctx));

    // 1c. ARCHETYPE CONTRACT — also repeated from the planner stage.
    // The planner is only allowed 60-110 words, so the class-level art
    // direction (which device, which lighting, which staging) can easily be
    // compressed out of its paragraph. Re-asserting it here guarantees the
    // renderer still knows this is a website showcase and not a food shoot.
    lines.push(
      '',
      `### CAMPAIGN ARCHETYPE (authoritative): ${archetype.toUpperCase()}`,
      this.getArchetypeGuidelines(archetype),
    );

    // 2. Attachment specifications
    lines.push(...this.buildAttachmentSpecs(ctx));

    // 3. Typography contract
    lines.push(...this.buildTypographyContract(ctx));

    // 3b. Text safe zone (must precede the composition block so the renderer
    //     has already decided where the subject sits when it lays out type)
    lines.push(...this.buildTextSafeZone(ctx));

    // 4. Composition contract
    lines.push(...this.buildCompositionContract(ctx));

    // 5. RAG reference notes (text only — the images themselves are attached)
    const dossier = this.buildReferenceDossier(references);
    if (dossier.length > 0) {
      lines.push(
        '',
        '=== 5. RAG REFERENCE NOTES ===',
        ...dossier,
        'APPLY THIS: the traits above have already been resolved into the creative direction. This block is a reminder to preserve their lighting quality, palette temperature and compositional intent — not a second source of subject matter.',
      );
    }

    // 6. Negative prompt
    lines.push(
      '',
      '=== 6. NEGATIVE PROMPT ===',
      this.buildNegativePrompt(archetype),
    );

    // 7. Production standards
    lines.push(
      '',
      '=== 7. PRODUCTION STANDARDS ===',
      'Final render: 8K ultra-high definition; Phase One IQ4 / Hasselblad H6D medium-format optics; 85mm f/1.4 prime with creamy cinematic bokeh; Profoto softbox key with rim kicker separation; razor-sharp focus on the hero subject; authentic skin texture with visible pores for any human; true-to-life material texture; balanced deliberate negative space; immaculate colour grading locked to the brand palette.',
      'The result must be indistinguishable from a professionally art-directed, photographed and retouched commercial campaign image.',
    );

    if (ctx.additionalInstructions) {
      lines.push(
        '',
        `CLIENT OVERRIDE (highest authority, applies over everything above where they conflict): ${sanitizePromptText(ctx.additionalInstructions, 400)}`,
      );
    }

    return lines.join('\n');
  }


  /**
   * IMAGE EDITING — the prompt for a refinement pass.
   *
   * Sent to the image model together with the *already generated* image. The
   * contract is built around one idea: a surgical edit. The user asked for
   * specific changes, so everything they did not mention must survive intact.
   * Without that instruction the model tends to "improve" the whole creative
   * and the user loses the composition they were happy with.
   *
   * The typography block is re-appended so an edit that touches the text (or
   * adds it) still obeys the same single-string manifest — otherwise editing
   * an image is the easiest way to accidentally reintroduce prompt leakage.
   */
  buildEditPrompt(
    instructions: string,
    ctx: DesignBriefContext,
  ): string {
    const changeRequest = sanitizePromptText(instructions, 600).trim();
    const ratio = (ctx.aspectRatio || ctx.postSize || '1:1').trim();

    const lines: string[] = [
      '=== EDIT MODE — REFINING AN EXISTING CREATIVE ===',
      '',
      'The attached image is a finished, already-approved commercial creative. You are NOT designing a new campaign from scratch. You are applying a precise set of changes to THIS image and returning the complete revised image.',
      '',
      '=== WHAT THE USER WANTS CHANGED ===',
      changeRequest || 'Refine this creative: improve the lighting balance and the overall polish while keeping the concept identical.',
      '',
      '=== HOW TO EDIT (critical rules) ===',
      '1. Apply the requested change(s) and NOTHING else. This is a surgical edit, not a reinterpretation.',
      '2. Everything the user did not ask to change must stay exactly as it is: the same subject, the same product, the same composition, the same camera angle, the same lighting direction, the same colour palette, the same mood and the same aspect ratio.',
      '3. Preserve identity fidelity for any person or product already in the image — same face, same bone structure, same colours, same materials, same proportions.',
      '4. Keep the render at the same commercial quality bar: true-to-life texture, natural shadows, professional colour grading, no melted details or AI artefacts.',
      `5. Preserve the canvas shape (${ratio}). Never re-crop, letterbox or change the aspect ratio of the original.`,
      '6. Return ONE complete, finished image. Never return a before/after collage, split-screen, diptych, or a grid of variants.',
      '7. Never print your own reasoning, the edit instructions, or any description of the change onto the image.',
    ];

    // Re-apply the same text contract so an edit can never leak the brief.
    lines.push(...this.buildTypographyContract(ctx));

    if (ctx.additionalInstructions) {
      lines.push(
        '',
        `CLIENT OVERRIDE (highest authority): ${sanitizePromptText(ctx.additionalInstructions, 400)}`,
      );
    }

    lines.push(
      '',
      '=== FINAL PRODUCTION STANDARD ===',
      '8K ultra-high definition; Phase One IQ4 / Hasselblad H6D medium-format optics; razor-sharp focus on the hero subject; authentic skin texture with visible pores for any human; true-to-life material texture; balanced deliberate negative space; immaculate colour grading locked to the brand palette. The result must be indistinguishable from a professionally art-directed, photographed and retouched commercial campaign image.',
    );

    return lines.join('\n');
  }


  /**
   * FALLBACK — used when the Stage-1 planner call fails (bad JSON, quota,
   * network). Builds the same seven-block contract directly from the brief so
   * a planning hiccup never degrades the output quality.
   */
  buildFinalPrompt(
    ctx: DesignBriefContext,
    references: RetrievedReference[] = [],
    engine: 'gemini' | 'pollinations' = 'gemini',
  ): string {
    if (engine === 'pollinations') {
      return this.buildCompactImagePrompt(ctx, references);
    }

    const archetype = this.detectArchetype(ctx);
    const mainTopic =
      ctx.prompt ||
      (ctx.productName
        ? `${ctx.productName} — ${ctx.headline || 'Campaign'}`
        : 'High-end commercial social media post');

    const lines: string[] = [
      '=== 1. CREATIVE DIRECTION ===',
      `You are an award-winning creative art director and master commercial photographer. Design a single, complete, ultra-high-end social media campaign post about: "${sanitizePromptText(mainTopic, 500)}".`,
      '',
      `CAMPAIGN ARCHETYPE: ${archetype.toUpperCase()}`,
      this.getArchetypeGuidelines(archetype),
      '',
      'HERO SUBJECT: decide the ONE literal physical object or scene that best communicates the message above, and build the entire composition around it. Be specific and concrete. Never default to a generic pedestal, seamless backdrop or floating cube because you could not decide.',
      '',
      `Design aesthetic: ${sanitizePromptText(ctx.style || 'luxury', 60)}, with master commercial colour grading.`,
      ctx.backgroundMode
        ? `Staging & background: ${sanitizePromptText(ctx.backgroundMode, 60)}.`
        : 'Staging: an immaculate, deliberately art-directed environment that supports the subject.',
    ];

    // Same authoritative brand block the two-stage path emits, so a planner
    // failure can never silently drop the scraped brand identity.
    lines.push(...this.buildBrandDnaBlock(ctx));

    if (ctx.targetAudience) {
      lines.push(`Crafted for: ${sanitizePromptText(ctx.targetAudience, 150)}.`);
    }
    if (ctx.tone) {
      lines.push(`Brand voice: ${sanitizePromptText(ctx.tone, 60)} — reflected in the visual confidence of the frame.`);
    }

    lines.push(...this.buildAttachmentSpecs(ctx));
    lines.push(...this.buildTypographyContract(ctx));
    lines.push(...this.buildTextSafeZone(ctx));
    lines.push(...this.buildCompositionContract(ctx));

    const dossier = this.buildReferenceDossier(references);
    if (dossier.length > 0) {
      lines.push(
        '',
        '=== 5. RAG REFERENCE NOTES ===',
        ...dossier,
        'APPLY THIS: absorb the transferable craft of the references above while keeping the campaign concept, product and on-canvas text exactly as specified in this brief.',
      );
    }

    lines.push(
      '',
      '=== 6. NEGATIVE PROMPT ===',
      this.buildNegativePrompt(archetype),
    );
    lines.push(
      '',
      '=== 7. PRODUCTION STANDARDS ===',
      'Final render: 8K ultra-high definition; Phase One IQ4 / Hasselblad H6D medium-format optics; 85mm f/1.4 prime with creamy cinematic bokeh; Profoto softbox key with rim kicker separation; razor-sharp focus on the hero subject; authentic skin texture with visible pores for any human; true-to-life material texture; balanced deliberate negative space; immaculate colour grading locked to the brand palette. Strictly photorealistic commercial standard.',
    );

    if (ctx.additionalInstructions) {
      lines.push(
        '',
        `CLIENT OVERRIDE (highest authority, applies over everything above where they conflict): ${sanitizePromptText(ctx.additionalInstructions, 400)}`,
      );
    }

    return lines.join('\n');
  }


  /**
   * POLLINATIONS FALLBACK — pure text-to-image engines have a much shorter
   * effective attention window and no attachment support, so this stays
   * compact, front-loads the subject, and keeps exactly one text element.
   */
  buildCompactImagePrompt(
    ctx: DesignBriefContext,
    references: RetrievedReference[] = [],
  ): string {
    const archetype = this.detectArchetype(ctx);
    const subject = ctx.productName || ctx.prompt || 'commercial campaign';
    const brand = ctx.brandName ? ` for "${ctx.brandName}"` : '';
    const style = ctx.style || 'luxury modern';
    const bg = ctx.backgroundMode
      ? `staged in a ${ctx.backgroundMode.replace(/_/g, ' ')} environment`
      : 'staged in an immaculate studio setting';

    const colors =
      ctx.brandColors && ctx.brandColors.length > 0
        ? `brand colors ${ctx.brandColors.slice(0, 3).join(', ')}`
        : ctx.colorScheme || '';

    // Only the explicit user overlay text may appear; otherwise render nothing.
    const overlayText = sanitizePromptText(ctx.onImageText, 80).trim();
    const placement = (ctx.onImageTextPlacement || 'auto').trim().toLowerCase();
    const overlayFont = sanitizePromptText(
      ctx.onImageTextFont || ctx.fontHeading || ctx.font || '',
      60,
    ).trim();
    const textOverlay = overlayText
      ? [
          `The ONLY text on the image is exactly: "${overlayText}"`,
          overlayFont ? `set in ${overlayFont}` : 'set in a refined display typeface',
          placement && placement !== 'auto'
            ? `anchored in the ${placement.replace(/_/g, ' ')} region`
            : 'placed in the largest quiet area that does not cover the subject',
          'crisp and perfectly legible. No other lettering, caption, headline, badge or watermark anywhere.',
        ].join(', ') + '.'
      : 'Absolutely no text, lettering, caption, badge or watermark anywhere in the image — a pure letter-free visual.';

    let archetypePrefix = 'Award-winning commercial photography of';
    if (archetype === 'fashion_model_editorial') {
      archetypePrefix = 'High-fashion editorial portrait photography of an elegant model featuring';
    } else if (archetype === 'event_keynote') {
      archetypePrefix = 'Prestigious keynote conference stage and event visual for';
    } else if (archetype === 'educational_infographic') {
      archetypePrefix = 'Minimalist Scandinavian editorial knowledge layout about';
    } else if (archetype === 'promotional_campaign') {
      archetypePrefix = 'Luxury commercial promotional advertisement for';
    } else if (archetype === 'social_lifestyle') {
      archetypePrefix = 'Authentic cinematic lifestyle photography of';
    } else if (archetype === 'digital_showcase') {
      // This is the sentence that stops the free-tier fallback from rendering a
      // cheese wedge for "our website is live now".
      archetypePrefix =
        'Photorealistic commercial photograph of a real open laptop on a premium desk, screen clearly showing a clean modern website with a navigation bar, hero banner and call-to-action button, screen styled in the brand colors';
    }

    // Only the single strongest reference is worth spending prompt budget on.
    const topRef = references[0];

    // The scraped brand identity, compressed for a short-attention engine.
    const brandLine = this.buildCompactBrandLine(ctx);

    return [
      `${archetypePrefix} ${subject}${brand}, ${bg}.`,
      `${style} aesthetic, ${colors}.`,
      brandLine,
      topRef
        ? `match the lighting quality, palette temperature and compositional energy of this approved reference style: ${truncate(topRef.contentText, 140)}.`
        : '',
      textOverlay,
      'Pristine Profoto studio lighting, soft key light, gentle specular highlights, razor-sharp focus on subject, cinematic depth of field, balanced negative space, 8k resolution, authentic editorial photography.',
      archetype === 'digital_showcase'
        ? 'Negative prompt: food, cheese, fruit, cosmetic products, generic merchandise, blank or black screen, lorem ipsum UI, floating device, blurry, low resolution, cartoon, anime, illustration, 3D render.'
        : 'Negative prompt: duplicate subjects, repeated words, distorted letters, floating gibberish, blurry, noisy, low resolution, amateur, cartoon, anime, illustration, 3D render.',
    ]
      .filter(Boolean)
      .join(' ');
  }

  /**
   * A one-line compression of the BRAND DNA block for engines with a very
   * short effective attention window (Pollinations). Same signals, no bloat.
   */
  private buildCompactBrandLine(ctx: DesignBriefContext): string {
    const parts: string[] = [];
    const palette = (
      ctx.brandColors && ctx.brandColors.length > 0
        ? ctx.brandColors
        : [ctx.primaryColor, ctx.secondaryColor, ctx.accentColor]
    )
      .map((c) => sanitizePromptText(c, 20).trim())
      .filter(Boolean)
      .slice(0, 3);

    if (palette.length > 0) {
      parts.push(`strictly on-brand palette ${palette.join(', ')}`);
    }
    const niche = sanitizePromptText(ctx.niche || ctx.category, 60).trim();
    if (niche) {
      parts.push(`a ${niche} brand`);
    }
    const desc = sanitizePromptText(ctx.brandDescription, 120).trim();
    if (desc) {
      parts.push(`business context: ${desc}`);
    }
    if (ctx.hasLogo && ctx.showLogo !== false) {
      parts.push('their logo appears once, small and unwarped');
    }

    return parts.length > 0
      ? `BRAND DNA: ${parts.join('; ')}. The post must be recognisably theirs, not generic stock.`
      : '';
  }
}

/* -------------------------------------------------------------------- */
/* module-level text helpers                                             */
/* -------------------------------------------------------------------- */

/** Collapses whitespace and hard-truncates with an ellipsis. */
function truncate(text: string, maxChars: number): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) {
    return clean;
  }
  return `${clean.slice(0, maxChars - 1)}…`;
}

/**
 * Strips control characters and neutralises prompt-injection break-out tokens
 * before any user-supplied string is embedded in a prompt.
 */
function sanitizePromptText(text?: string, maxLen = 300): string {
  if (!text) return '';
  return text
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/```/g, "'''")
    .replace(/\bignore (all|any|the) (previous|prior|above)\b/gi, '')
    .trim()
    .slice(0, maxLen);
}

/**
 * Builds the single contact string the renderer is allowed to typeset.
 *
 * Returns an empty string when the user supplied neither detail. The values are
 * sanitised upstream in `post-generator.service.ts`, and are sanitised again
 * here defensively so this function is safe to call from any prompt path.
 */
function buildContactLine(email?: string, phone?: string): string {
  const safeEmail = sanitizePromptText(email, 160).trim();
  const safePhone = sanitizePromptText(phone, 60).trim();
  return [safePhone, safeEmail].filter(Boolean).join('  ·  ');
}

/**
 * Contract for rendering the brand contact line ([C1]).
 *
 * Kept separate from the headline rules because the two must never be confused:
 * the headline is a display element, the contact line is a small functional
 * footer. When both are present the model is told explicitly to keep them in
 * different regions so they cannot collide.
 */
function buildContactTypographyRules(
  ctx: DesignBriefContext,
  contactLine: string,
  placement: string,
  hasOverlay: boolean,
): string[] {
  const lines = [
    '',
    `### CONTACT LINE [C1] — RENDER RULES:`,
    `1. Render "${contactLine}" exactly as written. Every digit, symbol, letter case and separator must match the source string precisely — a mistyped phone number is worse than no phone number.`,
    '2. Scale: set it small and functional — roughly 3–5% of the canvas height. It must read clearly on a phone screen but must never compete with the product or the headline.',
    '3. Weight: a clean, light-to-regular sans-serif with generous letter-spacing. Never bold enough to look like a second headline.',
    '4. Contrast: guarantee at least 4.5:1 against whatever sits directly behind it. If the region is busy, add a soft gradient scrim — never move the line onto the subject to gain contrast.',
    '5. Margins: keep at least a 7% margin from every canvas edge. Never crop, clip, truncate or run a character off the frame.',
    '6. Render it once, as a single line, in a single colour. Never repeat it, never mirror it, never split the email address across two lines.',
  ];

  if (hasOverlay) {
    lines.push(
      `7. Because a headline [T1] is ALSO being rendered, the two must occupy DIFFERENT regions of the canvas: give [C1] its own quiet band and leave clear space between it and [T1]. They must never overlap, never touch, and never share a baseline.`,
      `8. Resolve the layout in this order: place [T1] first in its region, then place [C1] in the quietest remaining region that is clear of both the subject and [T1].`,
    );
  }

  if (ctx.hasLogo && ctx.showLogo !== false) {
    lines.push(
      '9. Keep clear space around the brand logo — never let the contact line run into it, sit directly beneath it flush against it, or overlap it.',
    );
  }

  lines.push(
    placement && placement !== 'auto'
      ? `10. Placement is fixed by the user: "${placement.replace(/_/g, ' ')}". Honour it exactly, shifting only as much as needed to stay clear of the subject.`
      : hasOverlay
        ? '10. Placement is yours to decide, per rule 8 above: the quietest region left over after [T1] and the subject are placed. If no region can hold legible type, omit the contact line entirely.'
        : '10. Placement is yours to decide — see the placement contract below, and if no region can hold legible type without covering the subject, omit the contact line entirely.',
  );

  return lines;
}

