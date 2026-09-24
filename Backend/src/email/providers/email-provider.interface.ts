export interface SendEmailOptions {
  to: string | string[];
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
  campaignId?: string;
  recipientId?: string;
  idempotencyKey?: string;
  unsubscribeUrl?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  providerResponse?: string;
  error?: string;
  timestamp: Date;
}

export interface VerifyConnectionResult {
  success: boolean;
  message: string;
  code?: string | number;
  latencyMs: number;
}

export interface EmailProvider {
  getProviderName(): string;
  verifyConnection(): Promise<VerifyConnectionResult>;
  send(options: SendEmailOptions): Promise<SendEmailResult>;
}
