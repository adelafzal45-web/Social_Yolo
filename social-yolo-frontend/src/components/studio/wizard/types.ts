import { BrandProfile, Post } from '@/lib/types';

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
  // Step 3: Idea / Description, Headline & CTA
  idea: string;
  headline?: string;
  cta?: string;
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
  logoUrl?: string | null;
  variants?: FinalPostResult[];
}
