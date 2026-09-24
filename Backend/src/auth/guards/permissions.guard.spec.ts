import { ForbiddenException } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import {
  PERMISSIONS_KEY,
  ROLES_KEY,
} from '../decorators/permissions.decorator';
import type { AuthUser } from '../decorators/current-user.decorator';

/**
 * Server-side RBAC. Models the admin surface (@RequireRoles('ADMIN')): an ADMIN
 * is allowed (200), a USER is denied (403). Role comes from the request user,
 * which the JwtAuthGuard derives from the verified token + DB — never the client.
 */
function ctx(user: Partial<AuthUser> | undefined) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
}

function reflectorReturning(map: Record<string, string[] | undefined>) {
  return {
    getAllAndOverride: jest.fn((key: string) => map[key]),
  } as any;
}

describe('PermissionsGuard', () => {
  it('allows any request when no roles/permissions metadata is present', () => {
    const guard = new PermissionsGuard(reflectorReturning({}));
    expect(guard.canActivate(ctx({ roles: ['USER'], permissions: [] }))).toBe(
      true,
    );
  });

  describe('@RequireRoles(ADMIN) — the admin surface', () => {
    const adminOnly = reflectorReturning({ [ROLES_KEY]: ['ADMIN'] });

    it('allows an ADMIN (200)', () => {
      const guard = new PermissionsGuard(adminOnly);
      expect(
        guard.canActivate(ctx({ roles: ['ADMIN'], permissions: [] })),
      ).toBe(true);
    });

    it('denies a USER (403)', () => {
      const guard = new PermissionsGuard(adminOnly);
      expect(() =>
        guard.canActivate(ctx({ roles: ['USER'], permissions: [] })),
      ).toThrow(ForbiddenException);
    });

    it('denies when the user context is missing', () => {
      const guard = new PermissionsGuard(adminOnly);
      expect(() => guard.canActivate(ctx(undefined))).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('permission checks', () => {
    it('ADMIN bypasses a specific permission requirement', () => {
      const guard = new PermissionsGuard(
        reflectorReturning({ [PERMISSIONS_KEY]: ['image:remove-background'] }),
      );
      expect(
        guard.canActivate(ctx({ roles: ['ADMIN'], permissions: [] })),
      ).toBe(true);
    });

    it('allows a USER holding the required permission', () => {
      const guard = new PermissionsGuard(
        reflectorReturning({ [PERMISSIONS_KEY]: ['image:remove-background'] }),
      );
      expect(
        guard.canActivate(
          ctx({ roles: ['USER'], permissions: ['image:remove-background'] }),
        ),
      ).toBe(true);
    });

    it('denies a USER lacking the required permission (403)', () => {
      const guard = new PermissionsGuard(
        reflectorReturning({ [PERMISSIONS_KEY]: ['image:remove-background'] }),
      );
      expect(() =>
        guard.canActivate(
          ctx({ roles: ['USER'], permissions: ['image:view'] }),
        ),
      ).toThrow(ForbiddenException);
    });
  });
});
