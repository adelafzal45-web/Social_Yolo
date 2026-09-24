import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EmailCryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    // Derive key from JWT_SECRET or explicit EMAIL_ENCRYPTION_KEY, hashed to 32 bytes
    const secret =
      process.env.EMAIL_ENCRYPTION_KEY ||
      process.env.JWT_SECRET ||
      'social_yolo_default_email_secret_salt_2026';
    this.key = crypto.createHash('sha256').update(secret).digest();
  }

  /**
   * Encrypts plaintext using AES-256-GCM.
   * Returns formatted string: iv:authTag:ciphertext (hex encoded)
   */
  encrypt(plaintext: string): string {
    if (!plaintext) return '';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypts ciphertext formatted as iv:authTag:ciphertext
   */
  decrypt(ciphertext: string): string {
    if (!ciphertext) return '';
    try {
      const parts = ciphertext.split(':');
      if (parts.length !== 3) {
        // Plaintext fallback for unencrypted legacy values
        return ciphertext;
      }
      const [ivHex, authTagHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      // If decryption fails, return fallback or empty string
      return '';
    }
  }

  /**
   * Masks sensitive credentials for API responses
   */
  mask(value?: string | null): string {
    if (!value) return '';
    if (value.length <= 4) return '********';
    return `${value.substring(0, 2)}********${value.substring(value.length - 2)}`;
  }
}
