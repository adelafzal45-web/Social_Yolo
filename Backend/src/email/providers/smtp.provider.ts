import * as nodemailer from 'nodemailer';
import {
  EmailProvider,
  SendEmailOptions,
  SendEmailResult,
  VerifyConnectionResult,
} from './email-provider.interface';
import { SmtpEncryption } from '../entities/email-provider.entity';

export interface SmtpConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  secure?: boolean;
  encryptionType?: SmtpEncryption;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  returnPath?: string;
}

export class SmtpProvider implements EmailProvider {
  private transporter: nodemailer.Transporter | null = null;
  private config: SmtpConfig;

  constructor(config: SmtpConfig) {
    this.config = config;
    this.initTransporter();
  }

  private initTransporter() {
    const isSecure =
      this.config.secure ||
      this.config.encryptionType === SmtpEncryption.TLS ||
      this.config.port === 465;

    const auth =
      this.config.username && this.config.password
        ? {
            user: this.config.username,
            pass: this.config.password,
          }
        : undefined;

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port || (isSecure ? 465 : 587),
      secure: isSecure,
      auth,
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  getProviderName(): string {
    return 'smtp';
  }

  async verifyConnection(): Promise<VerifyConnectionResult> {
    const start = Date.now();
    try {
      if (!this.transporter) {
        this.initTransporter();
      }
      await this.transporter!.verify();
      const latencyMs = Date.now() - start;
      return {
        success: true,
        message: 'SMTP connection established and authenticated successfully (250 OK)',
        code: 250,
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      return {
        success: false,
        message: err.message || 'SMTP connection failed',
        code: err.responseCode || err.code || 'ECONNREFUSED',
        latencyMs,
      };
    }
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      if (!this.transporter) {
        this.initTransporter();
      }

      const fromAddress = `"${options.fromName || this.config.fromName}" <${
        options.fromEmail || this.config.fromEmail
      }>`;

      const headers: Record<string, string> = {
        ...(options.headers || {}),
        'X-Mailer': 'SocialYolo-Production-Engine/1.0',
      };

      if (options.campaignId) {
        headers['X-Campaign-ID'] = options.campaignId;
      }
      if (options.recipientId) {
        headers['X-Recipient-ID'] = options.recipientId;
      }
      if (options.idempotencyKey) {
        headers['X-Idempotency-Key'] = options.idempotencyKey;
      }
      if (options.unsubscribeUrl) {
        headers['List-Unsubscribe'] = `<${options.unsubscribeUrl}>`;
        headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
      }

      const mailOptions: nodemailer.SendMailOptions = {
        from: fromAddress,
        to: options.to,
        replyTo: options.replyTo || this.config.replyTo || undefined,
        envelope: this.config.returnPath
          ? {
              from: this.config.returnPath,
              to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
            }
          : undefined,
        subject: options.subject,
        html: options.html,
        text: options.text,
        headers,
      };

      const info = await this.transporter!.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        providerResponse: typeof info.response === 'string' ? info.response : JSON.stringify(info.response || {}),
        timestamp: new Date(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to send email via SMTP',
        providerResponse: err.response || err.code,
        timestamp: new Date(),
      };
    }
  }
}
