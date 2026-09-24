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
  caption?: string | null;
  body?: string | null;
  bodyCopy?: string | null;
  cta?: string | null;
  hashtags?: string[];
  contentType?: string | null;
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
  brandId?: string | null;
  conceptId?: string | null;
  campaignId?: string | null;
  metadata?: Record<string, any>;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
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
  file?: File | null;
  logo?: File | null;
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
  userId?: string;
  workspaceId?: string | null;
  name?: string;
  brandName: string;
  tagline?: string | null;
  niche?: string | null;
  description?: string | null;
  websiteUrl?: string | null;
  industry?: string | null;
  subIndustry?: string | null;
  country?: string | null;
  city?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  secondaryColors?: string[];
  fontHeading?: string;
  fontBody?: string;
  tone?: string;
  status?: string;
  brandVoice?: {
    tone?: string[];
    formality?: string;
    humor?: string;
    technicality?: string;
    emotion?: string;
  } | null;
  socialLinks?: Record<string, string> | null;
  isDefault?: boolean;
  insight?: BrandInsight | null;
  sources?: BrandSource[];
  products?: { name: string; description?: string; category?: string }[];
  services?: { name: string; description?: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface BrandInsight {
  id?: string;
  brandId?: string;
  companyDescription?: string | null;
  valueProposition?: string | null;
  products?: { name: string; description?: string; category?: string }[];
  services?: { name: string; description?: string }[];
  targetAudience?: { segment: string; description?: string }[];
  locations?: { country?: string; city?: string; region?: string }[];
  benefits?: string[];
  painPoints?: string[];
  keywords?: string[];
  categories?: string[];
  socialLinks?: Record<string, string>;
  brandVoice?: Record<string, any>;
  sourceUrls?: string[];
  confidence?: Record<string, number>;
  fieldSources?: Record<string, 'AI_GENERATED' | 'USER_ENTERED' | 'USER_EDITED' | 'WEBSITE_DETECTED'>;
  createdAt?: string;
  updatedAt?: string;
}

export interface BrandSource {
  id?: string;
  brandId?: string;
  url: string;
  pageType?: string | null;
  title?: string | null;
  description?: string | null;
  content?: string | null;
  contentHash?: string | null;
  status?: string;
  lastCrawledAt?: string | null;
  createdAt?: string;
}

export interface BrandAnalysisResult {
  brandName: string;
  tagline?: string | null;
  websiteUrl: string;
  industry: string | null;
  subIndustry: string | null;
  country: string | null;
  city: string | null;
  description: string | null;
  companyDescription: string | null;
  valueProposition: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  availableLogos?: string[];
  primaryColor: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  secondaryColors: string[];
  fontHeading?: string | null;
  fontBody?: string | null;
  tone?: string | null;
  products: { name: string; description?: string; category?: string }[];
  services: { name: string; description?: string }[];
  targetAudience: { segment: string; description?: string; demographics?: string }[];
  locations: { country?: string; city?: string; region?: string }[];
  benefits: string[];
  painPoints: string[];
  keywords: string[];
  categories: string[];
  socialLinks: Record<string, string>;
  brandVoice: {
    tone: string[];
    formality: string;
    humor: string;
    technicality: string;
    emotion: string;
  };
  brandImages: string[];
  confidence: Record<string, number>;
  sourceUrls: string[];
}

export interface AnalysisJobStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface AnalysisJobStatus {
  jobId: string;
  url: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  steps: AnalysisJobStep[];
  result?: BrandAnalysisResult | null;
  crawledPages?: BrandSource[];
  error?: string | null;
  createdAt: number;
  updatedAt: number;
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
  balance?: number;
  subscription?: {
    id: string;
    plan: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    pricingAmount: number;
    currency: string;
  } | null;
  availablePlans?: Array<{
    id: string;
    name: string;
    price: number;
    credits: number;
    interval: string;
  }>;
  creditPacks?: Array<{
    id: string;
    title: string;
    credits: number;
    price: number;
  }>;
}

export interface SafePayCheckoutResponse {
  checkoutUrl: string;
  trackerToken: string;
  paymentId: string;
  amount: number;
  currency: string;
  description: string;
  mode: 'subscription' | 'credit_pack';
}

export interface SafePayVerifyResponse {
  success: boolean;
  message: string;
  credits: number;
  plan: string;
  status: string;
  trackerToken?: string;
  paymentId?: string;
}

export interface AdminCreateUserPayload {
  name: string;
  email: string;
  password: string;
  role?: UserRole | string;
  plan?: string;
  credits?: number;
}

export interface AdminUpdateUserPayload {
  name?: string;
  email?: string;
  role?: UserRole | string;
  status?: 'active' | 'suspended' | 'banned';
  isActive?: boolean;
  plan?: string;
  credits?: number;
  password?: string;
}

export interface UserBillingDetails {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    plan: string;
    credits: number;
    createdAt?: string;
  };
  subscription?: {
    id: string;
    plan: string;
    status: string;
    pricingAmount: number;
    currency: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    type: string;
    providerTransactionId?: string;
    trackerToken?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  creditTransactions: Array<{
    id: string;
    amount: number;
    description: string;
    balanceAfter: number;
    createdAt: string;
  }>;
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
  provider?: string;
  preserveText?: boolean;
  alphaMatting?: boolean;
}

export type Verdict =
  | 'OK'
  | 'POSSIBLE_REMNANT'
  | 'LOW_CONFIDENCE'
  | 'EMPTY_SUBJECT'
  | 'NO_REMOVAL'
  | string;

export interface QualityReport {
  verdict: Verdict;
  coverage: number;
  transitionBandFrac: number;
  hazeFrac: number;
  opaqueFrac: number;
  borderOpaqueFrac: number;
  minAlpha: number;
  maxAlpha: number;
  details?: string;
  foregroundCoveragePct?: number;
  transitionBandPct?: number;
  midAlphaHazePct?: number;
  opaqueSubjectFraction?: number;
  opaqueBorderDetected?: boolean;
}

export interface RefinementReport {
  stages?: string[];
  stagesApplied?: string[];
  decontaminateApplied?: boolean;
  alphaCurveApplied?: boolean;
  featherApplied?: boolean;
}


export interface ProcessedImageResult {
  file: {
    format: string;
    transparent: boolean;
    url: string;
    width: number;
    height: number;
    sizeBytes: number;
  };
  bytes?: string;
  url?: string;

  provider: string;
  providerChain?: string[];
  fallbackUsed?: boolean;
  processingTimeMs: number;

  qualityReport?: QualityReport;
  refinement?: RefinementReport;
  transparencyReport?: {
    hasAlphaChannel?: boolean;
    isTransparent?: boolean;
    minAlpha?: number;
    maxAlpha?: number;
  };
}

export interface RemoveBackgroundResponse extends ProcessedImageResult {
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

export interface ContentConcept {
  id: string;
  brandId: string;
  campaignId?: string | null;
  pillarId?: string | null;
  title: string;
  concept: string;
  hook: string;
  angle: string;
  visualDirection?: {
    style?: string;
    composition?: string;
    colorHarmony?: string;
    aspectRatio?: string;
  };
  platforms: string[];
  inspirationIds?: string[];
  trendIds?: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface StructuredContentRequest {
  brandId: string;
  platform: string;
  contentType: string;
  goal: string;
  productName?: string;
  topic?: string;
  campaign?: string;
  audience?: string;
  contentPillar?: string;
  language?: string;
  tone?: string;
  variationsCount?: number;
  additionalNotes?: string;
}

export interface GeneratedContentResult {
  posts: Post[];
  context: any;
  systemPrompt: string;
  userPrompt: string;
}

export interface PostMetric {
  id: string;
  postId: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  views: number;
  watchTime: number;
  ctr: number;
  engagementRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContentPerformanceInsight {
  id: string;
  brandId: string;
  patternType: string;
  insight: string;
  confidence: number;
  metricsSummary: Record<string, any>;
  recommendations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BrandAnalyticsOverview {
  totalPosts: number;
  totalImpressions: number;
  totalReach: number;
  totalInteractions: number;
  avgEngagementRate: number;
  postsWithMetrics: (Post & { metrics?: PostMetric | null })[];
}

export interface CreativeVariation {
  id: string;
  generationId: string;
  variationKey: 'variation_a' | 'variation_b' | 'variation_c' | 'variation_d';
  label: string;
  conceptStyle: 'Premium' | 'Minimal' | 'Bold' | 'Editorial';
  layoutName: string;
  headline: string;
  subheadline?: string | null;
  ctaText: string;
  width: number;
  height: number;
  renderUrl: string;
  textCoveragePct: number;
  metaPass: boolean;
  qualityScore: number;
  qualityMetrics?: Record<string, any> | null;
  isApproved?: boolean;
  layers?: StructuredDesignDocument | null;
  conceptData?: DesignConceptItem | null;
  validationReport?: DesignValidationReport | null;
}

export interface CreativeGeneration {
  id: string;
  projectId?: string | null;
  brandId?: string | null;
  userId?: string | null;
  projectName: string;
  designType: 'creative' | 'meta_ad';
  objective: string;
  style: string;
  compositionPreference: string;
  mood: string;
  cta: string;
  platform: string;
  aspectRatio: string;
  width: number;
  height: number;
  status: string;
  currentStageLabel: string;
  progressPct: number;
  qualityScore?: number | null;
  validationReport?: Record<string, any> | null;
  referenceIds?: string[];
  variations: CreativeVariation[];
  createdAt: string;
}

export interface DesignReference {
  id: string;
  source: string;
  sourceUrl?: string | null;
  title: string;
  description?: string | null;
  imageUrl: string;
  thumbnailUrl?: string | null;
  category?: string | null;
  industry?: string | null;
  platform?: string | null;
  designType?: string | null;
  style?: string | null;
  aspectRatio?: string;
  qualityScore: number;
  licenseType: string;
  composition?: Record<string, any> | null;
  typography?: Record<string, any> | null;
  colorPalette?: string[] | null;
  visualElements?: string[] | null;
}

export interface SmartDefaultsResult {
  recommendedStyle: string;
  recommendedComposition: string;
  recommendedMood: string;
  recommendedCta: string;
  recommendedAspect: string;
  recommendedColorStrategy: string;
  reasoning: string;
}

export interface StartStudioGenerationInput {
  projectId?: string;
  brandId?: string;
  projectName?: string;
  designType: 'creative' | 'meta_ad';
  creativeType?: string;
  objective: string;
  style: string;
  composition: string;
  mood: string;
  cta: string;
  platform: string;
  headline?: string;
  subheadline?: string;
  productName?: string;
  offer?: string;
}

export interface DesignConceptItem {
  id: string;
  name: string;
  badge?: string;
  direction: string;
  layout: string;
  typographyDirection: string;
  imageDirection: string;
  colorDirection: string;
  whyItFits: string;
  suggestedHeadline?: string;
  suggestedCta?: string;
}

export interface ValidationIssue {
  rule: 'content' | 'brand' | 'visual' | 'platform';
  severity: 'WARNING' | 'ERROR' | 'INFO';
  message: string;
  autoFixRecommendation?: string;
}

export interface DesignValidationReport {
  status: 'PASS' | 'WARNING' | 'ERROR';
  score: number;
  textCoveragePct: number;
  issues: ValidationIssue[];
  passedChecks: string[];
}

export type LayerType =
  | 'background'
  | 'image'
  | 'logo'
  | 'headline'
  | 'subheadline'
  | 'body'
  | 'cta'
  | 'badge'
  | 'decorative';

export interface DesignLayer {
  id: string;
  name: string;
  type: LayerType;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  font?: string;
  fontSize?: number;
  fontWeight?: string | number;
  color?: string;
  backgroundColor?: string;
  opacity?: number;
  zIndex: number;
  borderRadius?: number;
  visible: boolean;
  locked: boolean;
}

export interface StructuredCanvas {
  width: number;
  height: number;
  backgroundColor: string;
  backgroundGradient?: string | null;
  aspectRatio: string;
}

export interface StructuredDesignDocument {
  id: string;
  version: number;
  canvas: StructuredCanvas;
  layers: DesignLayer[];
  metadata: {
    platform: string;
    style: string;
    brandName?: string;
    brandColors?: string[];
    updatedAt: string;
    lastAction?: string;
  };
}

export type AiDesignEditAction =
  | 'improve_design'
  | 'make_more_minimal'
  | 'make_more_premium'
  | 'make_more_bold'
  | 'change_layout'
  | 'change_typography'
  | 'replace_image'
  | 'improve_contrast'
  | 'use_brand_colors'
  | 'generate_variation';

export interface PlatformConfig {
  id: string;
  name: string;
  channel: string;
  width: number;
  height: number;
  aspectRatio: string;
  category: 'feed' | 'story' | 'banner' | 'cover';
  description: string;
}

export interface CampaignObjectiveConfig {
  id: string;
  name: string;
  subtitle: string;
  recommendedType: 'creative' | 'meta_ad';
  defaultCta: string;
  bestFor: string;
}

export interface CreativeTypeConfig {
  id: string;
  name: string;
  subtitle: string;
  defaultCta: string;
  style: string;
}

export interface StudioConfigResponse {
  metaObjectives: CampaignObjectiveConfig[];
  creativeTypes: CreativeTypeConfig[];
  exportPlatforms: PlatformConfig[];
}

