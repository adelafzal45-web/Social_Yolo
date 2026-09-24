export type EmailProviderType = 'smtp' | 'resend' | 'ses' | 'sendgrid' | 'mailgun' | 'postmark';
export type SmtpEncryption = 'TLS' | 'STARTTLS' | 'NONE';

export interface EmailProvider {
  id: string;
  name: string;
  type: EmailProviderType;
  host: string | null;
  port: number | null;
  username: string | null;
  encryptedPassword: string | null;
  hasPassword?: boolean;
  secure: boolean;
  encryptionType: SmtpEncryption;
  fromEmail: string;
  fromName: string;
  replyTo: string | null;
  returnPath: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TemplateCategory =
  | 'TRANSACTIONAL'
  | 'MARKETING'
  | 'SECURITY'
  | 'SYSTEM'
  | 'CAMPAIGN'
  | 'OFFER';

export interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  category: TemplateCategory;
  subject: string;
  htmlContent: string;
  textContent: string | null;
  variables: string[];
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailOffer {
  id: string;
  offerName: string;
  title: string;
  description: string | null;
  discount: string | null;
  promoCode: string | null;
  startDate: string | null;
  endDate: string | null;
  ctaText: string;
  ctaUrl: string | null;
  bannerUrl: string | null;
  terms: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CampaignType =
  | 'OFFER'
  | 'PROMOTION'
  | 'ANNOUNCEMENT'
  | 'NEWSLETTER'
  | 'PRODUCT_UPDATE'
  | 'CUSTOM';

export type CampaignStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'SENDING'
  | 'COMPLETED'
  | 'PAUSED'
  | 'CANCELLED';

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  templateId: string | null;
  offerId: string | null;
  brandId: string | null;
  campaignType: CampaignType;
  status: CampaignStatus;
  audienceDefinition: Record<string, any>;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailRecipient {
  id: string;
  campaignId: string;
  userId: string | null;
  email: string;
  status:
    | 'PENDING'
    | 'QUEUED'
    | 'PROCESSING'
    | 'SENT'
    | 'DELIVERED'
    | 'OPENED'
    | 'CLICKED'
    | 'BOUNCED'
    | 'COMPLAINED'
    | 'FAILED'
    | 'UNSUBSCRIBED';
  providerMessageId: string | null;
  queuedAt: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bouncedAt: string | null;
  failedAt: string | null;
  unsubscribedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface EmailSuppression {
  id: string;
  email: string;
  reason: 'UNSUBSCRIBED' | 'HARD_BOUNCE' | 'COMPLAINT' | 'MANUAL';
  source: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface EmailPreferences {
  id: string;
  userId: string;
  marketingEmails: boolean;
  offerEmails: boolean;
  productUpdates: boolean;
  newsletters: boolean;
  systemNotifications: boolean;
  securityEmails: boolean;
}

export interface DnsRecordStatus {
  type: 'SPF' | 'DKIM' | 'DMARC' | 'MX';
  name: string;
  expected: string;
  found?: string;
  status: 'VERIFIED' | 'PENDING' | 'FAILED';
  description: string;
}

export interface DomainVerificationResult {
  domain: string;
  isVerified: boolean;
  status: 'VERIFIED' | 'PENDING' | 'FAILED';
  checkedAt: string;
  records: DnsRecordStatus[];
}

export interface EmailOverviewStats {
  totalSent: number;
  delivered: number;
  pending: number;
  processing: number;
  failed: number;
  bounced: number;
  complained: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  complaintRate: number;
  timeRange: string;
  campaignsCount: {
    total: number;
    active: number;
    scheduled: number;
    completed: number;
  };
}

export interface AudienceEstimationResult {
  totalTargeted: number;
  suppressedCount: number;
  optedOutCount: number;
  eligibleCount: number;
  sample: Array<{
    userId?: string;
    email: string;
    name: string;
  }>;
}

export interface SmtpTestResult {
  connection: {
    connected: boolean;
    message: string;
    code?: string | number;
    latencyMs: number;
  };
  testEmail?: {
    success: boolean;
    messageId?: string;
    providerResponse?: string;
    error?: string;
  } | null;
  testedAt: string;
}
