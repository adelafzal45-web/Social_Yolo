import {
  EmailProvider,
  SendEmailOptions,
  SendEmailResult,
  VerifyConnectionResult,
} from './email-provider.interface';

export interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
}

export class SendGridProvider implements EmailProvider {
  private config: SendGridConfig;

  constructor(config: SendGridConfig) {
    this.config = config;
  }

  getProviderName(): string {
    return 'sendgrid';
  }

  async verifyConnection(): Promise<VerifyConnectionResult> {
    const start = Date.now();
    if (!this.config.apiKey) {
      return {
        success: false,
        message: 'SendGrid API key is missing',
        latencyMs: 0,
      };
    }
    try {
      const res = await fetch('https://api.sendgrid.com/v3/scopes', {
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
      });
      return {
        success: res.ok,
        message: res.ok ? 'SendGrid API key verified' : 'SendGrid authorization failed',
        code: res.status,
        latencyMs: Date.now() - start,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message,
        latencyMs: Date.now() - start,
      };
    }
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const recipients = Array.isArray(options.to)
      ? options.to.map((e) => ({ email: e }))
      : [{ email: options.to }];

    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: recipients }],
          from: { email: options.fromEmail || this.config.fromEmail, name: options.fromName || this.config.fromName },
          subject: options.subject,
          content: [
            { type: 'text/html', value: options.html },
            ...(options.text ? [{ type: 'text/plain', value: options.text }] : []),
          ],
        }),
      });

      const messageId = res.headers.get('x-message-id') || `sg-${Date.now()}`;
      return {
        success: res.status >= 200 && res.status < 300,
        messageId,
        providerResponse: `SendGrid HTTP ${res.status}`,
        timestamp: new Date(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        timestamp: new Date(),
      };
    }
  }
}
