export type NicheCategory =
  | 'food_beverage'
  | 'fashion_apparel'
  | 'beauty_wellness'
  | 'home_lifestyle'
  | 'tech_gadgets'
  | 'fitness_sports'
  | 'pets'
  | 'other';

export type DesignStyle =
  | 'minimalist'
  | 'bold'
  | 'luxury'
  | 'lifestyle'
  | 'tech'
  | 'playful';

export type PlatformKey =
  | 'instagram_portrait'
  | 'instagram_square'
  | 'instagram_story'
  | 'facebook_feed'
  | 'pinterest_pin'
  | 'twitter_feed'
  | 'linkedin_feed';

export interface PlatformConfig {
  key: PlatformKey;
  name: string;
  code: string;
  width: number;
  height: number;
  label: string;
  defaultSelected: boolean;
}

export type OutputMode = 'creative' | 'meta_ad';
export type ContentType = 'static' | 'video';
export type CreativeStatus = 'approved' | 'needs_review' | 'rejected';

export interface BrandProfile {
  id: string;
  name: string;
  tagline: string;
  description: string;
  websiteUrl: string;
  niche: NicheCategory;
  nicheLabel: string;
  logoUrl?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    display: string;
    body: string;
  };
  tone: 'Warm' | 'Playful' | 'Premium' | 'Direct' | 'Bold';
  createdAt: string;
}

export interface CreativeVariant {
  id: string;
  platformKey: PlatformKey;
  platformName: string;
  width: number;
  height: number;
  label: string;
  style: DesignStyle;
  headline: string;
  body: string;
  ctaText: string;
  textCoveragePct: number;
  metaPass: boolean;
  status: CreativeStatus;
  renderUrl?: string;
  backdropId?: string;
}

export interface Project {
  id: string;
  name: string;
  brandId: string;
  brandName: string;
  clientFolder?: string;
  status: 'draft' | 'generating' | 'review' | 'approved';
  outputMode: OutputMode;
  platforms: PlatformKey[];
  style: DesignStyle;
  contentType: ContentType;
  quantity: number;
  originalPhotoUrl: string;
  enhancedPhotoUrl?: string;
  transparentPhotoUrl?: string;
  backgroundMode: 'keep' | 'remove' | 'ai_replace';
  backgroundPreset: string;
  imageAdjustments?: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  copy: {
    headline: string;
    body: string;
    occasion: string;
    customNote?: string;
  };
  creatives: CreativeVariant[];
  creditsUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatarLetter: string;
  // 'USER' is the default role for real Supabase-authenticated accounts.
  // 'CREATOR'/'GUEST' remain for the existing prototype personas.
  role: 'ADMIN' | 'CREATOR' | 'GUEST' | 'USER';
  plan: 'Free Trial' | 'Starter' | 'Pro' | 'Agency';
  credits: number;
  maxCredits: number;
  resetDays: number;
  clientFoldersCount: number;
  theme: 'dark' | 'light' | 'system';
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Editor' | 'Viewer';
  status: 'Active' | 'Invite pending';
  avatarLetter: string;
}

export interface Invoice {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: 'Paid' | 'Pending';
  pdfUrl?: string;
}

export interface AppNotification {
  id: string;
  type: 'warning' | 'success' | 'info' | 'payment';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface TopUpPack {
  id: string;
  credits: number;
  price: number;
  priceFormatted: string;
  popular?: boolean;
}
