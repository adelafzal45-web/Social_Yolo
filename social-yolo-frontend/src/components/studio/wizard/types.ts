import { BrandProfile, OnImageTextPlacement, Post } from '@/lib/types';

export interface WizardBrandData {
  brandProfileId?: string;
  websiteUrl: string;
  brandName: string;
  niche: string;
  tagline: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  tone: string;
  logoFile: File | null;
  logoUrl: string | null;
  /** Remote logo scraped from the website — sent so the backend can fetch it. */
  logoRemoteUrl?: string | null;
  /** How the logo was found, used for the "found via …" provenance label. */
  logoSource?: string | null;
  /** True only when the scraped logo was downloaded and verified as usable. */
  logoReady?: boolean;
  /** True once the user has been shown the "show logo on image?" prompt. */
  logoPrompted?: boolean;
  /** The user's choice: composite the logo onto generated images. */
  showLogoOnImage?: boolean;
  /** Contact email to typeset on the creative. */
  contactEmail?: string;
  /** Contact phone/WhatsApp to typeset on the creative. */
  contactPhone?: string;
  /** Whether the contact line should appear on the creative. */
  showContactOnImage?: boolean;
  /** Fixed slot for the contact line, or 'auto' for intelligent placement. */
  contactPlacement?: OnImageTextPlacement;
}

export interface UploadedProductImage {
  id: string;
  file: File;
  rawUrl: string;
  cutoutUrl: string | null;
  isProcessing?: boolean;
}

export interface WizardFormData {
  // Step 1: Brand Data & URL
  brand: WizardBrandData;
  // Step 2: Post Type
  postType: string;
  customPostType: string;
  // Step 3: Idea / Description
  idea: string;
  // Step 3b: On-image text overlay (optional) — the only text rendered on the art
  onImageText: string;
  onImageTextFont: string;
  onImageTextPlacement: OnImageTextPlacement;
  // Step 4: Audience
  audiences: string[];
  customAudience: string;
  // Step 5: Style
  style: string;
  // Step 6: Platform & Aspect Ratio
  platform: string;
  aspectRatio: string;
  // Step 7: Visual Direction & Subject Image
  visualDirection: string;
  productImages: UploadedProductImage[];
  productFile: File | null;
  rawOriginalUrl: string | null;
  cutoutUrl: string | null;
  modelFile: File | null;
  modelRawUrl: string | null;
  modelCutoutUrl: string | null;
  backgroundMode: string;
  // Step 8: Variations / Generation config
  variationsCount: number;
}

export interface FinalPostResult {
  id: string;
  postId: string;
  platform: string;
  aspectRatio: string;
  imageUrl: string;
  headline: string;
  bodyCopy: string;
  cta: string;
  rating: number | null;
  isFavorite: boolean;
  isApproved?: boolean;
  editCount?: number;
  parentPostId?: string | null;
  variants?: FinalPostResult[];
}
