import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  name: string;
}

@Injectable()
export class TokenService {
  private readonly secret: string;
  private readonly expiresIn: string;
  private readonly logger = new Logger(TokenService.name);

  constructor() {
    const isProd = process.env.NODE_ENV === 'production';
    const envSecret = process.env.JWT_SECRET?.trim();

    if (
      isProd &&
      (!envSecret || envSecret.includes('fallback') || envSecret.length < 32)
    ) {
      throw new Error(
        'FATAL: In production, JWT_SECRET must be set to a cryptographically secure key of at least 32 characters.',
      );
    }

    if (!envSecret) {
      this.logger.warn(
        'SECURITY WARNING: JWT_SECRET is not set in environment. Using development fallback secret.',
      );
    }

    this.secret = envSecret || 'social_yolo_jwt_fallback_secret_key_2026';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  sign(payload: JwtPayload): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn as any,
    });
  }

  verify(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.secret) as JwtPayload;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Authentication token has expired.');
      }
      throw new UnauthorizedException('Invalid authentication token.');
    }
  }
}
