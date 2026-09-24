import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { UpstashService } from '../redis/upstash.service';
import {
  AUTH_RATELIMIT_MAX,
  AUTH_RATELIMIT_WINDOW,
} from '../../config/auth.config';

/**
 * Distributed, serverless-safe rate limiter for auth-sensitive endpoints, backed
 * by Upstash Redis and keyed by client IP. Not in-memory — safe across multiple
 * instances. Fails OPEN when Upstash is unreachable so authentication does not
 * become unusable, while still throttling under normal operation (429 on abuse).
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly upstash: UpstashService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const identifier = this.clientIp(req);
    const { success } = await this.upstash.limit(
      'auth',
      identifier,
      AUTH_RATELIMIT_MAX,
      AUTH_RATELIMIT_WINDOW,
    );
    if (!success) {
      throw new HttpException(
        'Too many requests. Please try again shortly.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }

  private clientIp(req: Request): string {
    const forwarded = (req.headers['x-forwarded-for'] as string) || '';
    const first = forwarded.split(',')[0]?.trim();
    return first || req.ip || req.socket?.remoteAddress || 'unknown';
  }
}
