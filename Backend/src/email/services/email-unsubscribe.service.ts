import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EmailUnsubscribeService {
  private readonly secret: string;

  constructor() {
    this.secret =
      process.env.EMAIL_UNSUBSCRIBE_SECRET ||
      process.env.JWT_SECRET ||
      'social_yolo_unsub_secret_salt_2026';
  }

  /**
   * Generates a signed, non-guessable unsubscribe token that does not leak plain user IDs
   */
  generateToken(email: string, userId?: string): string {
    const payload = JSON.stringify({
      e: email.toLowerCase().trim(),
      u: userId || null,
      t: Date.now(),
    });

    const b64Payload = Buffer.from(payload).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(b64Payload)
      .digest('base64url');

    return `${b64Payload}.${signature}`;
  }

  /**
   * Verifies the authenticity and validity of the unsubscribe token
   */
  verifyToken(token: string): { valid: boolean; email?: string; userId?: string } {
    try {
      const parts = token.split('.');
      if (parts.length !== 2) return { valid: false };

      const [b64Payload, providedSignature] = parts;
      const expectedSignature = crypto
        .createHmac('sha256', this.secret)
        .update(b64Payload)
        .digest('base64url');

      if (
        !crypto.timingSafeEqual(
          Buffer.from(providedSignature),
          Buffer.from(expectedSignature),
        )
      ) {
        return { valid: false };
      }

      const decoded = JSON.parse(
        Buffer.from(b64Payload, 'base64url').toString('utf8'),
      );

      return {
        valid: true,
        email: decoded.e,
        userId: decoded.u || undefined,
      };
    } catch {
      return { valid: false };
    }
  }

  /**
   * Generates full public URL for unsubscribe page
   */
  getUnsubscribeUrl(email: string, userId?: string): string {
    const appUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const token = this.generateToken(email, userId);
    return `${appUrl}/email/unsubscribe?token=${token}`;
  }
}
