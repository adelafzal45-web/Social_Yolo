import type { AuthUser } from '../decorators/current-user.decorator';
import { DEFAULT_ORGANIZATION_ID } from '../../config/auth.config';

export type AppRole = 'USER' | 'ADMIN';

export interface ProfileRecord {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url?: string | null;
  role: AppRole;
  isActive?: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
}

/**
 * Baseline permissions granted to an authenticated USER so the existing studio
 * endpoints (background removal, viewing) keep working for real signups.
 * ADMIN bypasses permission checks in PermissionsGuard via the ADMIN role, but
 * we also grant the full set for completeness.
 */
const USER_PERMISSIONS = ['image:remove-background', 'image:view', 'project.create', 'creative.generate'];
const ADMIN_PERMISSIONS = [
  'image:remove-background',
  'image:admin',
  'image:view',
  'project.manage',
  'credits.manage',
];

export function normalizeRole(role: string | null | undefined): AppRole {
  return (role || '').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER';
}

/** Build the request-scoped AuthUser from a trusted profile/user row. */
export function profileToAuthUser(
  profile: ProfileRecord,
  fallbackEmail?: string,
): AuthUser {
  const role = normalizeRole(profile.role);
  return {
    id: profile.id,
    email: profile.email || fallbackEmail || '',
    name: profile.name || profile.email || fallbackEmail || 'User',
    roles: [role],
    permissions: role === 'ADMIN' ? ADMIN_PERMISSIONS : USER_PERMISSIONS,
    organizationId: DEFAULT_ORGANIZATION_ID || '',
  };
}

/**
 * Fallback when session token is verified. Never trust a client-supplied role —
 * always default to USER.
 */
export function claimsToAuthUser(
  sub: string,
  email: string | undefined,
  name: string | undefined,
): AuthUser {
  return {
    id: sub,
    email: email || '',
    name: name || email || 'User',
    roles: ['USER'],
    permissions: USER_PERMISSIONS,
    organizationId: DEFAULT_ORGANIZATION_ID || '',
  };
}
