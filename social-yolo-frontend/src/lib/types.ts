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
  isApproved?: boolean;
  approvedAt?: string | null;
  parentPostId?: string | null;
  editCount?: number;
  onImageText?: string | null;
  onImageTextFont?: string | null;
  onImageTextPlacement?: OnImageTextPlacement;
  onImageTextColor?: string | null;
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
  /** Explicit palette list — takes precedence over the single color fields. */
  brandColors?: string[];
  layoutPreference?: string;
  brandProfileId?: string;
  brandName?: string;
  additionalInstructions?: string;
  niche?: string;
  /**
   * Scraped brand DNA from the customer's website. These are first-class brief
   * fields on the backend so the art director can design a subject that belongs
   * to this specific business, instead of the identity being flattened into
   * `additionalInstructions` and truncated away.
   */
  brandTagline?: string;
  brandDescription?: string;
  brandWebsiteUrl?: string;
  variationIndex?: number;
  totalVariations?: number;
  variationsCount?: number;
  /**
   * OPTIONAL. The only text rendered ON the image. When omitted, the creative is
   * generated with no lettering at all — the user's brief is never printed.
   */
  onImageText?: string;
  onImageTextFont?: string;
  onImageTextPlacement?: OnImageTextPlacement;
  onImageTextColor?: string;
  /** Composite the brand logo onto the image. Defaults to true. */
  showLogo?: boolean;
  /**
   * Absolute URL of a scraped brand logo. The backend downloads and verifies it
   * server-side, so a logo found on the user's website works without an upload.
   */
  logoUrl?: string;
  /** Typeset the contact details below onto the image. */
  showContact?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  contactPlacement?: OnImageTextPlacement;
  /**
   * User reference screenshots / moodboards ("make it look like this").
   * Sent as `refImage` parts; `referenceNotes` carries the per-image notes.
   */
  refImages?: File[] | null;
  referenceNotes?: string[];
  file?: File | null;
  files?: File[] | null;
  logo?: File | null;
  model?: File | null;
}

/** One user-supplied reference image plus its optional instruction. */
export interface UserReferenceImage {
  id: string;
  file: File;
  previewUrl: string;
  /** Optional note describing what to take from this reference. */
  note: string;
}

/** Placement slots for the on-image text. `auto` = let the AI decide. */
export type OnImageTextPlacement =
  | 'auto'
  | 'top_left'
  | 'top_center'
  | 'top_right'
  | 'center_left'
  | 'center'
  | 'center_right'
  | 'bottom_left'
  | 'bottom_center'
  | 'bottom_right';

/** Payload for a natural-language image edit. */
export interface EditPostInput {
  instructions: string;
}

/** Payload for approving a post into the vector knowledge base. */
export interface ApprovePostInput {
  approved?: boolean;
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
  /** Whether the logo should be composited onto generated images. */
  showLogoOnImage?: boolean;
  contactEmail?: string | null;
  contactPhone?: string | null;
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
  /** Where the logo was found on the page, for the "found via …" label. */
  logoSource?: string | null;
  /**
   * True when a Gemini-compatible raster logo was actually downloaded and
   * verified. When false the UI must ask the user to upload their own logo.
   */
  logoReady?: boolean;
  /**
   * `data:<mime>;base64,…` for the verified logo. The frontend converts this
   * into a real `File` so the scraped logo actually reaches image generation
   * instead of being preview-only.
   */
  logoDataUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactWebsite?: string | null;
}

/* ================= STYLE REFERENCE LIBRARY ================= */

/** One entry in the RAG Style Reference Library. */
export interface StyleReference {
  id: string;
  title: string | null;
  notes: string | null;
  /** The exact text that was embedded (AI analysis + uploader note). */
  contentText: string;
  category: string | null;
  tags: string[];
  imageUrl: string | null;
  source: 'global' | 'user';
  isActive: boolean;
  /** How many generations this reference has been injected into. */
  usageCount: number;
  hasEmbedding: boolean;
  analysedByAi: boolean;
  analysis: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface StyleReferenceListResponse {
  items: StyleReference[];
  total: number;
  categories: string[];
}

export interface RagCorpusStats {
  total: number;
  userPosts: number;
  globalPosts: number;
  styleReferences: number;
  withImages: number;
  embeddingsConfigured: boolean;
  embeddingModel: string;
  embeddingDimensions: number;
}

export interface CreateStyleReferenceInput {
  file: File;
  title?: string;
  notes?: string;
  category?: string;
  tags?: string;
  hint?: string;
  /** Admin-only: promote the upload into the shared global pool. */
  makeGlobal?: boolean;
}

export interface PromptPreviewReference {
  id: string;
  kind: 'user_post' | 'global_post' | 'style_ref';
  source: string;
  title: string;
  category: string | null;
  similarity: number;
  score: number;
  rating: number | null;
  hasImage: boolean;
}

export interface PromptPreviewResponse {
  retrievalQuery: string;
  retrievalError: string | null;
  embeddingsConfigured: boolean;
  referencesRetrieved: number;
  visualReferences: Array<{ id: string; title: string; imagePath: string; similarity: number }>;
  corpus: Omit<RagCorpusStats, 'embeddingsConfigured' | 'embeddingModel' | 'embeddingDimensions'>;
  references: PromptPreviewReference[];
  /** Stage-1 prompt sent to the Gemini text model. */
  plannerPrompt: string;
  /** Stage-2 prompt sent to the Gemini image model (the final prompt). */
  finalPrompt: string;
  /** Used when the planner stage fails. */
  fallbackPrompt: string;
  /** Used when IMAGE_PROVIDER=pollinations. */
  pollinationsPrompt: string;
}

