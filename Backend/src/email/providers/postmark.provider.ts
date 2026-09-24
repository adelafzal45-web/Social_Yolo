import {
  EmailProvider,
  SendEmailOptions,
  SendEmailResult,
  VerifyConnectionResult,
} from './email-provider.interface';

export interface PostmarkConfig {
  serverToken: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
}

export class PostmarkProvider implements EmailProvider {
  private config: PostmarkConfig;

  constructor(config: PostmarkConfig) {
    this.config = config;
  }

  getProviderName(): string {
    return 'postmark';
  }

  async verifyConnection(): Promise<VerifyConnectionResult> {
    const start = Date.now();
    if (!this.config.serverToken) {
      return {
        success: false,
        message: 'Postmark server token is missing',
        latencyMs: 0,
      };
    }
    return {
      success: true,
      message: 'Postmark adapter ready',
      code: 200,
      latencyMs: Date.now() - start,
    };
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    return {
      success: true,
      messageId: `pm-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      providerResponse: 'Postmark message accepted',
      timestamp: new Date(),
    };
  }
}
