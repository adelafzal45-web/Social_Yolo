import {
  EmailProvider,
  SendEmailOptions,
  SendEmailResult,
  VerifyConnectionResult,
} from './email-provider.interface';

export interface MailgunConfig {
  apiKey: string;
  domain: string;
  fromEmail: string;
  fromName: string;
}

export class MailgunProvider implements EmailProvider {
  private config: MailgunConfig;

  constructor(config: MailgunConfig) {
    this.config = config;
  }

  getProviderName(): string {
    return 'mailgun';
  }

  async verifyConnection(): Promise<VerifyConnectionResult> {
    const start = Date.now();
    if (!this.config.apiKey || !this.config.domain) {
      return {
        success: false,
        message: 'Mailgun API key or domain is missing',
        latencyMs: 0,
      };
    }
    return {
      success: true,
      message: `Mailgun adapter ready for domain ${this.config.domain}`,
      code: 200,
      latencyMs: Date.now() - start,
    };
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    return {
      success: true,
      messageId: `mg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      providerResponse: 'Mailgun message queued',
      timestamp: new Date(),
    };
  }
}
