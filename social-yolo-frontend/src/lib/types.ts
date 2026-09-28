export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  credits?: number;
  plan?: 'free_trial' | 'starter' | 'pro' | 'agency' | string;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Post {
  id: string;
  imageUrl: string | null;
  originalImageUrl?: string | null;
  imagePath?: string | null;
  userPrompt: string;
  finalPrompt?: string | null;
  title?: string | null;
  productName?: string | null;
  niche?: string | null;
  platform?: string;
  aspectRatio?: string;
  style?: string;
  occasion?: string | null;
  backgroundMode?: string;
  headline?: string | null;
  bodyCopy?: string | null;
  cta?: string | null;
  rating: number | null;
  category?: string | null;
  content?: string | null;
  colorScheme?: string | null;
  font?: string | null;
  postSize?: string | null;
  outputType?: string;
  format?: string;
  logoUrl?: string | null;
  designBrief?: Record<string, any> | null;
  isFavorite?: boolean;
  engine?: string | null;
  status?: string;
  createdAt: string;
  variants?: Post[];
}

export interface GuidedPostInput {
  prompt?: string;
  category?: string;
  content?: string;
  colorScheme?: string;
  font?: string;
  postSize?: string;
  outputType?: string;
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
  layoutPreference?: string;
  brandProfileId?: string;
  brandName?: string;
  additionalInstructions?: string;
  niche?: string;
  variationIndex?: number;
  totalVariations?: number;
  variationsCount?: number;
  file?: File | null;
  files?: File[] | null;
  logo?: File | null;
  model?: File | null;
}

export interface ProductAnalysisResult {
  productName: string;
  niche: string;
  description: string;
  dominantColors: string[];
  suggestedStyles: string[];
  suggestedHeadlines: string[];
}

export interface BrandProfile {
  id: string;
  userId: string;
  brandName: string;
  niche: string | null;
  websiteUrl?: string | null;
  tagline?: string | null;
  description?: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  tone: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  description: string;
  balanceAfter: number;
  createdAt: string;
}

export interface BillingSummary {
  plan: string;
  credits: number;
  monthlyAllowance: number;
  renewsAt: string;
  transactions: CreditTransaction[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'billing' | 'generation' | 'tip' | 'success' | 'warning' | 'info' | 'error' | string;
  read?: boolean;
  isRead?: boolean;
  link?: string | null;
  createdAt: string;
}

export interface GeneratePostResponse extends Post {}

export interface RemoveBackgroundOptions {
  model?: string;
  preserveText?: boolean;
  alphaMatting?: boolean;
}

export interface RemoveBackgroundResponse {
  bytes: string;
  url: string;
  engine?: string;
  backgroundRemoved?: boolean;
}

export interface HealthResponse {
  backend: boolean;
  pythonService: boolean;
  activeUrl: string;
  timestamp: string;
}

export type ActiveTab = 'studio' | 'generator' | 'bg-remover' | 'gallery' | 'favorites' | 'brands' | 'billing';

export interface ExtractedBrandData {
  url: string;
  brandName: string;
  niche: string;
  tagline: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  brandColors: string[];
  fontHeading: string;
  fontBody: string;
  tone: string;
  logoUrl: string | null;
}
