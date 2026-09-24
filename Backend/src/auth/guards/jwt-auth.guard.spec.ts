import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TokenService } from '../jwt.service';

function makeCtx(authorization?: string, cookies?: Record<string, string>, isPublic = false) {
  const headers: Record<string, string> = {};
  if (authorization) headers['authorization'] = authorization;

  const req: any = { headers, cookies: cookies || {} };
  const context: any = {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}),
    getClass: () => ({}),
  };
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(isPublic),
  } as unknown as Reflector;

  return { context, req, reflector };
}

describe('JwtAuthGuard', () => {
  let tokenService: TokenService;

  beforeEach(() => {
    tokenService = new TokenService();
  });

  it('allows access for public routes', () => {
    const { context, reflector } = makeCtx(undefined, undefined, true);
    const guard = new JwtAuthGuard(tokenService, reflector);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('accepts a valid Bearer token in Authorization header', () => {
    const token = tokenService.sign({
      sub: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
      role: 'user',
    });

    const { context, req, reflector } = makeCtx(`Bearer ${token}`);
    const guard = new JwtAuthGuard(tokenService, reflector);

    expect(guard.canActivate(context)).toBe(true);
    expect(req.user.id).toBe('user-123');
    expect(req.user.email).toBe('user@example.com');
    expect(req.user.roles).toContain('USER');
    expect(req.user.permissions).toContain('image:remove-background');
  });

  it('accepts token from cookies if Authorization header is absent', () => {
    const token = tokenService.sign({
      sub: 'user-cookie',
      email: 'cookie@example.com',
      name: 'Cookie User',
      role: 'admin',
    });

    const { context, req, reflector } = makeCtx(undefined, { access_token: token });
    const guard = new JwtAuthGuard(tokenService, reflector);

    expect(guard.canActivate(context)).toBe(true);
    expect(req.user.id).toBe('user-cookie');
    expect(req.user.roles).toContain('ADMIN');
  });

  it('rejects with UnauthorizedException when token is missing', () => {
    const { context, reflector } = makeCtx();
    const guard = new JwtAuthGuard(tokenService, reflector);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects with UnauthorizedException when token is invalid', () => {
    const { context, reflector } = makeCtx('Bearer invalid.jwt.token');
    const guard = new JwtAuthGuard(tokenService, reflector);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
