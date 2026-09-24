import {
  EmailProvider,
  SendEmailOptions,
  SendEmailResult,
  VerifyConnectionResult,
} from './email-provider.interface';

export interface ResendConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
}

export class ResendProvider implements EmailProvider {
  private config: ResendConfig;

  constructor(config: ResendConfig) {
    this.config = config;
  }

  getProviderName(): string {
    return 'resend';
  }

  async verifyConnection(): Promise<VerifyConnectionResult> {
    const start = Date.now();
    try {
      if (!this.config.apiKey) {
        return {
          success: false,
          message: 'Resend API key is missing',
          latencyMs: 0,
        };
      }
      const res = await fetch('https://api.resend.com/api-keys', {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });
      const latencyMs = Date.now() - start;
      if (res.ok) {
        return {
          success: true,
          message: 'Resend API connection authenticated successfully',
          code: 200,
          latencyMs,
        };
      }
      const data = await res.json().catch(() => ({}));
      return {
        success: false,
        message: data.message || `Resend auth failed with status ${res.status}`,
        code: res.status,
        latencyMs,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Resend connection error',
        latencyMs: Date.now() - start,
      };
    }
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const from = `"${options.fromName || this.config.fromName}" <${
        options.fromEmail || this.config.fromEmail
      }>`;
      const to = Array.isArray(options.to) ? options.to : [options.to];

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          reply_to: options.replyTo || this.config.replyTo,
          headers: options.headers,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.id) {
        return {
          success: true,
          messageId: data.id,
          providerResponse: JSON.stringify(data),
          timestamp: new Date(),
        };
      }

      return {
        success: false,
        error: data.message || `Resend returned HTTP ${res.status}`,
        providerResponse: JSON.stringify(data),
        timestamp: new Date(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Resend request failed',
        timestamp: new Date(),
      };
    }
  }
}
