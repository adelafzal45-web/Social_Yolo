import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

/**
 * Placement slots offered to the user for the on-canvas text block.
 * `auto` deliberately means "let the art director decide" — the prompt builder
 * then emits a full intelligent-placement contract instead of a fixed slot.
 */
export const OVERLAY_TEXT_PLACEMENTS = [
  'auto',
  'top_left',
  'top_center',
  'top_right',
  'center_left',
  'center',
  'center_right',
  'bottom_left',
  'bottom_center',
  'bottom_right',
] as const;

export type OverlayTextPlacement = (typeof OVERLAY_TEXT_PLACEMENTS)[number];

export class CreateGuidedPostDto {
  @ApiProperty({
    required: false,
    description:
      'Custom idea, summary or short brief for the post (optional if productName is provided, required otherwise)',
    example: 'Eid sale post with 50% discount',
  })
  @ValidateIf((o) => !o.productName || !String(o.productName).trim())
  @IsNotEmpty({
    message: 'prompt is required when productName is not provided',
  })
  @IsString()
  prompt?: string;

  @ApiProperty({
    required: false,
    description:
      'Design category (gym, education, drinks, food, fashion, retail, etc. — free text)',
    example: 'drinks',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    required: false,
    description: 'Exact copy/text to write ON the post (rendered verbatim)',
    example: '50% OFF TODAY ONLY',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({
    required: false,
    description: 'Brand color scheme (names, hex codes or description)',
    example: '#2b1810, #c99e52, cream',
  })
  @IsString()
  @IsOptional()
  colorScheme?: string;

  @ApiProperty({
    required: false,
    description: 'Font preference for all text on the post',
    example: 'Cinzel Decorative',
  })
  @IsString()
  @IsOptional()
  font?: string;

  @ApiProperty({
    required: false,
    description:
      'Canvas format: instagram_post (default), instagram_portrait, instagram_story, meta_feed, meta_square, linkedin_post, twitter_post, pinterest_pin, youtube_thumbnail, whatsapp_status',
    default: 'instagram_post',
  })
  @IsString()
  @IsOptional()
  postSize?: string;

  @ApiProperty({
    required: false,
    description: 'Output image format: png (default) or jpg',
    default: 'png',
  })
  @IsString()
  @IsOptional()
  outputType?: string;

  @ApiProperty({
    description:
      'Product, service, or brand topic name (optional if prompt is provided, required otherwise)',
    example: 'Cold Brew Coffee',
    required: false,
  })
  @ValidateIf((o) => !o.prompt || !String(o.prompt).trim())
  @IsNotEmpty({
    message: 'productName is required when prompt is not provided',
  })
  @IsString()
  productName?: string;

  @ApiProperty({
    required: false,
    description:
      'Target platform: instagram, facebook, tiktok, linkedin, pinterest, twitter',
    default: 'instagram',
  })
  @IsString()
  @IsOptional()
  platform?: string;

  @ApiProperty({
    required: false,
    description: 'Aspect ratio: 1:1, 4:5, 9:16, 16:9, 1.91:1',
    default: '1:1',
  })
  @IsString()
  @IsOptional()
  aspectRatio?: string;

  @ApiProperty({
    required: false,
    description:
      'Design direction: luxury, minimalist, bold, lifestyle, tech, playful',
    default: 'luxury',
  })
  @IsString()
  @IsOptional()
  style?: string;

  @ApiProperty({
    required: false,
    description:
      'Campaign occasion or post purpose: sale, launch, event, quote, awareness, announcement',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  occasion?: string;

  @ApiProperty({
    required: false,
    description:
      'Background mode: ai_replace, studio_solid, nature, neon, luxury_marble, transparent, keep_original',
    default: 'ai_replace',
  })
  @IsString()
  @IsOptional()
  backgroundMode?: string;

  @ApiProperty({
    required: false,
    description: 'Main creative headline or title',
  })
  @IsString()
  @IsOptional()
  headline?: string;

  @ApiProperty({
    required: false,
    description: 'Body text, offer, or supporting copy',
  })
  @IsString()
  @IsOptional()
  bodyCopy?: string;

  @ApiProperty({
    required: false,
    description: 'Target audience description (e.g. Young professionals 25-35)',
  })
  @IsString()
  @IsOptional()
  targetAudience?: string;

  @ApiProperty({
    required: false,
    description:
      'Offer or key message to highlight (e.g. 30% Off this weekend)',
  })
  @IsString()
  @IsOptional()
  keyMessage?: string;

  @ApiProperty({
    required: false,
    description: 'Call to action text (e.g. Shop Now, Link in Bio, Learn More)',
  })
  @IsString()
  @IsOptional()
  cta?: string;

  @ApiProperty({
    required: false,
    description: 'Language of post text (e.g. English, Spanish, French, Urdu)',
  })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({
    required: false,
    description:
      'Tone of voice: Professional, Casual, Luxury, Playful, Bold, Urgent',
  })
  @IsString()
  @IsOptional()
  tone?: string;

  @ApiProperty({
    required: false,
    description: 'Font or typography style preference',
  })
  @IsString()
  @IsOptional()
  fontHeading?: string;

  @ApiProperty({ required: false, description: 'Body font preference' })
  @IsString()
  @IsOptional()
  fontBody?: string;

  @ApiProperty({
    required: false,
    description: 'Primary brand hex color code (e.g. #7c5cff)',
  })
  @IsString()
  @IsOptional()
  primaryColor?: string;

  @ApiProperty({
    required: false,
    description: 'Secondary brand hex color code (e.g. #e0aa4e)',
  })
  @IsString()
  @IsOptional()
  secondaryColor?: string;

  @ApiProperty({
    required: false,
    description: 'Accent brand hex color code (e.g. #3ecf8e)',
  })
  @IsString()
  @IsOptional()
  accentColor?: string;

  @ApiProperty({
    required: false,
    type: [String],
    description:
      'Explicit brand palette list. Takes precedence over the single color fields above when building both the prompt and the RAG retrieval query.',
    example: ['#7c5cff', '#e0aa4e', '#ffffff'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  brandColors?: string[];

  @ApiProperty({
    required: false,
    description:
      'Layout preference (e.g. centered, split, minimalist, dynamic)',
  })
  @IsString()
  @IsOptional()
  layoutPreference?: string;

  @ApiProperty({ required: false, description: 'Associated BrandProfile UUID' })
  @IsString()
  @IsOptional()
  brandProfileId?: string;

  @ApiProperty({
    required: false,
    description: 'Industry or commercial niche (e.g. Food & Beverage)',
  })
  @IsString()
  @IsOptional()
  niche?: string;

  @ApiProperty({ required: false, description: 'Brand or business name' })
  @IsString()
  @IsOptional()
  brandName?: string;

  @ApiProperty({
    required: false,
    description: 'Additional creative instructions or constraints',
  })
  @IsString()
  @IsOptional()
  additionalInstructions?: string;

  @ApiProperty({
    required: false,
    description:
      'Variation index (0, 1, 2...) to ensure diverse creative angles and zero repetition',
  })
  @IsOptional()
  variationIndex?: number;

  @ApiProperty({
    required: false,
    description: 'Total number of variations being requested',
  })
  @IsOptional()
  totalVariations?: number;

  @ApiProperty({
    required: false,
    description: 'Number of variations / variants requested (1 to 4)',
  })
  @IsOptional()
  variationsCount?: number;

  /* ------------------------------------------------------------------ */
  /* ON-CANVAS TEXT OVERLAY (optional, user-controlled)                 */
  /* ------------------------------------------------------------------ */

  @ApiProperty({
    required: false,
    description:
      'OPTIONAL. The short, user-authored string that is allowed to appear ON the image ' +
      '(e.g. "Eid Sale", "Cheesy Factor"). When omitted, the image is rendered with NO ' +
      'lettering at all. The user prompt/brief is NEVER rendered — only this field is.',
    example: 'Eid Sale',
    maxLength: 80,
  })
  @IsString()
  @MaxLength(80, {
    message: 'onImageText must be 80 characters or fewer',
  })
  @IsOptional()
  onImageText?: string;

  @ApiProperty({
    required: false,
    description:
      'Font style for the on-canvas text. Defaults to the brand heading font when omitted.',
    example: 'Bold Condensed Sans',
  })
  @IsString()
  @MaxLength(80)
  @IsOptional()
  onImageTextFont?: string;

  @ApiProperty({
    required: false,
    description:
      'Where the on-canvas text sits. Use "auto" (or omit) to let the art director place it ' +
      'intelligently in the largest quiet region that does not cover the subject.',
    enum: OVERLAY_TEXT_PLACEMENTS,
    default: 'auto',
  })
  @IsString()
  @IsIn(OVERLAY_TEXT_PLACEMENTS as unknown as string[], {
    message: `onImageTextPlacement must be one of: ${OVERLAY_TEXT_PLACEMENTS.join(', ')}`,
  })
  @IsOptional()
  onImageTextPlacement?: string;

  @ApiProperty({
    required: false,
    description:
      'Optional colour hint for the on-canvas text. Defaults to the brand palette accent.',
    example: '#ffffff',
  })
  @IsString()
  @MaxLength(40)
  @IsOptional()
  onImageTextColor?: string;
/* ------------------------------------------------------------------ */
  /* BRAND LOGO & CONTACT DETAILS                                       */
  /* ------------------------------------------------------------------ */

  @ApiProperty({
    required: false,
    description:
      'Whether to composite the brand logo onto the generated image. When false the logo ' +
      'is ignored entirely and the artwork is generated logo-free.',
    default: true,
  })
  @IsOptional()
  showLogo?: boolean;

  @ApiProperty({
    required: false,
    description:
      'Absolute URL of the brand logo scraped from the website. The backend downloads and ' +
      'verifies it server-side, so the logo works even when the user never uploaded a file.',
    example: 'https://cdn.example.com/logo.png',
  })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({
    required: false,
    description:
      'Whether the contact details below should be typeset onto the image. Inferred as true ' +
      'when either contact field is supplied.',
  })
  @IsOptional()
  showContact?: boolean;

  @ApiProperty({
    required: false,
    description: 'Contact email/WhatsApp address to render on the creative.',
    example: 'hello@lumina.com',
    maxLength: 160,
  })
  @IsString()
  @MaxLength(160)
  @IsOptional()
  contactEmail?: string;

  @ApiProperty({
    required: false,
    description: 'Contact phone number to render on the creative.',
    example: '+92 300 1234567',
    maxLength: 60,
  })
  @IsString()
  @MaxLength(60)
  @IsOptional()
  contactPhone?: string;

  @ApiProperty({
    required: false,
    description:
      'Where the contact line sits. Use "auto" (or omit) to let the art director place it ' +
      'intelligently in the quietest remaining band, clear of the subject and the logo.',
    enum: OVERLAY_TEXT_PLACEMENTS,
    default: 'auto',
  })
  @IsString()
  @IsIn(OVERLAY_TEXT_PLACEMENTS as unknown as string[], {
    message: `contactPlacement must be one of: ${OVERLAY_TEXT_PLACEMENTS.join(', ')}`,
  })
  @IsOptional()
  contactPlacement?: string;
}
