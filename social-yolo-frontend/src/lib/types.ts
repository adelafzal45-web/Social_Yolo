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
  type?: string;
  amount: number;
  balanceBefore?: number;
  balanceAfter: number;
  description: string;
  referenceId?: string | null;
  createdBy?: string;
  createdAt: string;
}

export interface WalletData {
  id: string;
  currentBalance: number;
  totalPurchased: number;
  totalUsed: number;
  totalRefunded: number;
}

export interface CreditPackage {
  id: string;
  name: string;
  description: string | null;
  credits: number;
  price: number;
  currency: string;
  discountPercentage: number;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
}

export interface PriceCalculation {
  packageId: string;
  packageName: string;
  credits: number;
  currency: string;
  basePrice: number;
  discountCode: string | null;
  discountType: 'PERCENTAGE' | 'FIXED' | null;
  discountValue: number;
  discountAmount: number;
  finalPrice: number;
  isValidCoupon: boolean;
  couponMessage?: string;
}

export interface OrderItem {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  packageName?: string;
  credits: number;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  currency: string;
  couponCode: string | null;
  paymentStatus: string;
  orderStatus: string;
  paymentReference: string | null;
  createdAt: string;
}

export interface DiscountItem {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minimumPurchase: number;
  maximumDiscount: number | null;
  applicablePackageIds: string[] | null;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreditCostItem {
  id: string;
  feature: string;
  name: string;
  creditCost: number;
  isActive: boolean;
  createdAt: string;
}

export interface AdminWalletItem {
  userId: string;
  email: string;
  name: string;
  role: string;
  plan: string;
  isActive: boolean;
  walletId: string;
  currentBalance: number;
  totalPurchased: number;
  totalUsed: number;
  totalRefunded: number;
  createdAt: string;
}

export interface AdminAuditLogItem {
  id: string;
  adminId: string;
  adminEmail?: string;
  action: string;
  targetType: string;
  targetId: string;
  oldValue: any;
  newValue: any;
  reason: string;
  ipAddress: string | null;
  createdAt: string;
}

export interface AdminBillingStats {
  totalUsers: number;
  activePackages: number;
  activeDiscounts: number;
  totalOrdersPaid: number;
  totalRevenue: number;
  totalCirculatingCredits: number;
  totalCreditsConsumed: number;
  totalCreditsPurchased: number;
}

export interface BillingSummary {
  plan: string;
  credits: number;
  wallet: WalletData;
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
