import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { OVERLAY_TEXT_PLACEMENTS } from './create-guided-post.dto';

/** Body for `POST /api/posts/generate` (files: `file` and `logo` are multipart parts). */
export class GeneratePostDto {
  @ApiProperty({
    description:
      'Short description or creative brief of the post you want (optional if productName is provided, required otherwise).',
    example: 'Eid sale post with 50% discount',
    maxLength: 500,
    required: false,
  })
  @ValidateIf((o) => !o.productName || !String(o.productName).trim())
  @IsNotEmpty({
    message: 'prompt is required when productName is not provided',
  })
  @IsString()
  @MaxLength(500)
  prompt?: string;

  @ApiProperty({
    required: false,
    description:
      'Design category (gym, education, drinks, food, fashion, retail, etc. — free text)',
    example: 'fashion',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    required: false,
    description: 'Exact copy/text to write ON the post (rendered verbatim)',
    example: '50% OFF THIS WEEKEND ONLY',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({
    required: false,
    description: 'Brand colors (names, hex codes or description)',
    example: '#1A365D, #ED8936, Gold',
  })
  @IsString()
  @IsOptional()
  colorScheme?: string;

  @ApiProperty({
    required: false,
    description: 'Font preference for all text on the post',
    example: 'Montserrat bold sans-serif',
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
    description: 'Output format: png (default) or jpg',
    default: 'png',
  })
  @IsString()
  @IsOptional()
  outputType?: string;

  // Guided fields preserved
  @ApiProperty({
    required: false,
    description:
      'Product, service, or brand topic name (optional if prompt is provided, required otherwise)',
    example: 'Cold Brew Coffee',
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
    description: 'Font or typography style preference for headings',
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
      'OPTIONAL. The short, user-authored string allowed to appear ON the image. ' +
      'When omitted, no lettering is rendered. The prompt/brief itself is NEVER rendered.',
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
    description: 'Font style for the on-canvas text.',
    example: 'Bold Condensed Sans',
  })
  @IsString()
  @MaxLength(80)
  @IsOptional()
  onImageTextFont?: string;

  @ApiProperty({
    required: false,
    description:
      'Where the on-canvas text sits. Use "auto" (or omit) for intelligent placement.',
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
    description: 'Optional colour hint for the on-canvas text.',
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
      'Whether to composite the brand logo onto the generated image. When false the logo is ignored.',
    default: true,
  })
  @IsOptional()
  showLogo?: boolean;

  @ApiProperty({
    required: false,
    description:
      'Absolute URL of the brand logo scraped from the website. Downloaded and verified server-side.',
    example: 'https://cdn.example.com/logo.png',
  })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({
    required: false,
    description: 'Whether the contact details below are typeset onto the image.',
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
      'Where the contact line sits. Use "auto" (or omit) for intelligent placement.',
    enum: OVERLAY_TEXT_PLACEMENTS,
    default: 'auto',
  })
  @IsString()
  @IsIn(OVERLAY_TEXT_PLACEMENTS as unknown as string[], {
    message: `contactPlacement must be one of: ${OVERLAY_TEXT_PLACEMENTS.join(', ')}`,
  })
  @IsOptional()
  contactPlacement?: string;

  @ApiProperty({
    required: false,
    type: String,
    description:
      'JSON array of OPTIONAL per-image notes for the uploaded user reference ' +
      'images, index-aligned with the `refImage` files.',
    example: '["match this colour grade", ""]',
  })
  @IsString()
  @MaxLength(4000)
  @IsOptional()
  referenceNotes?: string;
}
