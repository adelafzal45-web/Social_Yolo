import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
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
  ) {}

  canActivate(context: ExecutionContext): boolean {
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

    if (!token) {
      throw new UnauthorizedException(
        'Authentication token is missing. Please log in.',
      );
    }

    const payload = this.tokenService.verify(token);
    request.user = {
      ...payload,
      id: payload.sub,
    };
    return true;
  }
}
