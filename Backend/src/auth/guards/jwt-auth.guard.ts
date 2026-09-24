import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { TokenService } from '../jwt.service';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => (target: any, key?: any, descriptor?: any) => {
  if (descriptor) {
    Reflect.defineMetadata(IS_PUBLIC_KEY, true, descriptor.value);
    return descriptor;
  }
  Reflect.defineMetadata(IS_PUBLIC_KEY, true, target);
  return target;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector,
    @Optional() private readonly dataSource?: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    let token: string | undefined;

    const authHeader = request.headers['authorization'];
    if (authHeader && typeof authHeader === 'string') {
      const [bearer, extractedToken] = authHeader.split(' ');
      if (bearer === 'Bearer' && extractedToken) {
        token = extractedToken;
      }
    }

    // Fallback to httpOnly cookie if authorization header is absent
    if (!token && request.cookies) {
      token =
        request.cookies['access_token'] ||
        request.cookies['social_yolo_jwt_token'];
    }

    // 1. Try verifying as JWT token
    if (token) {
      try {
        const payload = this.tokenService.verify(token);
        const role = String(payload.role || 'user').toLowerCase();
        let userId = payload.sub;
        if (
          userId &&
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId) &&
          this.dataSource &&
          this.dataSource.isInitialized
        ) {
          const mapped = await this.dataSource.query(
            `SELECT id FROM public.users WHERE better_auth_id = $1 OR LOWER(email) = LOWER($2) LIMIT 1`,
            [userId, payload.email || ''],
          );
          if (mapped && mapped.length > 0) {
            userId = mapped[0].id;
          }
        }
        request.user = {
          ...payload,
          id: userId,
          sub: userId,
          role,
          roles: [role.toUpperCase(), role.toLowerCase()],
        };
        return true;
      } catch {
        // May be a Better Auth session token; fall through
      }
    }

    // 2. Try validating as Better Auth session token
    let rawCookieToken =
      request.cookies?.['better-auth.session_token'] ||
      request.cookies?.['__Secure-better-auth.session_token'];

    if (!rawCookieToken && request.headers['cookie']) {
      const match = String(request.headers['cookie']).match(
        /(?:(?:^|;\s*)(?:__Secure-)?better-auth\.session_token)=([^;]+)/,
      );
      if (match) {
        rawCookieToken = decodeURIComponent(match[1]);
      }
    }

    let betterAuthToken = token || rawCookieToken;
    if (betterAuthToken && typeof betterAuthToken === 'string') {
      betterAuthToken = betterAuthToken.trim();
      if (betterAuthToken.startsWith('s:')) {
        betterAuthToken = betterAuthToken.slice(2);
      }
      if (betterAuthToken.includes('.')) {
        betterAuthToken = betterAuthToken.split('.')[0];
      }
    }

    if (betterAuthToken && this.dataSource && this.dataSource.isInitialized) {
      try {
        const sessionRows = await this.dataSource.query(
          `SELECT s.id as "sessionId", s."expiresAt", u.id, u.email, u.name, u.role, u."isActive"
           FROM "session" s
           JOIN "user" u ON s."userId" = u.id
           WHERE s.token = $1 AND s."expiresAt" > NOW()
           LIMIT 1`,
          [betterAuthToken],
        );

        if (sessionRows && sessionRows.length > 0) {
          const u = sessionRows[0];
          if (u.isActive === false) {
            throw new UnauthorizedException('User account has been deactivated.');
          }

          // Resolve genuine UUID from public.users to maintain foreign key integrity
          let genuineUserId: string | null = null;
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(u.id);

          if (isUuid) {
            genuineUserId = u.id;
          } else {
            const existingUsers = await this.dataSource.query(
              `SELECT id, role, is_active FROM public.users 
               WHERE better_auth_id = $1 OR LOWER(email) = LOWER($2) 
               LIMIT 1`,
              [u.id, u.email],
            );

            if (existingUsers && existingUsers.length > 0) {
              genuineUserId = existingUsers[0].id;
              await this.dataSource.query(
                `UPDATE public.users SET better_auth_id = $1 WHERE id = $2 AND (better_auth_id IS NULL OR better_auth_id <> $1)`,
                [u.id, genuineUserId],
              );
            } else {
              const inserted = await this.dataSource.query(
                `INSERT INTO public.users (
                  id, better_auth_id, email, name, role, is_active, avatar_url, credits, plan, auth_provider, created_at, updated_at
                ) VALUES (
                  gen_random_uuid(), $1, LOWER($2), $3, $4, $5, $6, 50, 'free_trial', 'better-auth', NOW(), NOW()
                ) RETURNING id`,
                [
                  u.id,
                  u.email,
                  u.name || u.email.split('@')[0],
                  String(u.role || 'user').toLowerCase(),
                  u.isActive !== false,
                  u.image || null,
                ],
              );
              if (inserted && inserted.length > 0) {
                genuineUserId = inserted[0].id;
              }
            }
          }

          const effectiveId = genuineUserId || u.id;
          const roleUpper = String(u.role || 'USER').toUpperCase();
          const roleLower = roleUpper.toLowerCase();
          request.user = {
            id: effectiveId,
            sub: effectiveId,
            betterAuthId: u.id,
            email: u.email,
            name: u.name,
            role: roleLower,
            roles: [roleUpper, roleLower],
          };
          return true;
        }
      } catch (dbErr: any) {
        if (dbErr instanceof UnauthorizedException) throw dbErr;
      }
    }

    throw new UnauthorizedException(
      'Authentication token is missing or invalid. Please log in.',
    );
  }
}
