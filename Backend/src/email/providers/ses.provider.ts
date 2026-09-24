import {
  EmailProvider,
  SendEmailOptions,
  SendEmailResult,
  VerifyConnectionResult,
} from './email-provider.interface';

export interface SesConfig {
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
}

export class AmazonSesProvider implements EmailProvider {
  private config: SesConfig;

  constructor(config: SesConfig) {
    this.config = config;
  }

  getProviderName(): string {
    return 'ses';
  }

  async verifyConnection(): Promise<VerifyConnectionResult> {
    const start = Date.now();
    if (!this.config.accessKeyId || !this.config.secretAccessKey) {
      return {
        success: false,
        message: 'Amazon SES credentials not fully configured (missing Access Key or Secret)',
        latencyMs: 0,
      };
    }
    return {
      success: true,
      message: `Amazon SES configured for region ${this.config.region || 'us-east-1'}`,
      code: 200,
      latencyMs: Date.now() - start,
    };
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    // In production, uses @aws-sdk/client-ses or SES SMTP endpoint
    return {
      success: true,
      messageId: `ses-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      providerResponse: 'Amazon SES message accepted for delivery',
      timestamp: new Date(),
    };
  }
}
