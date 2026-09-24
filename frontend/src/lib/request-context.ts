import { headers } from 'next/headers';

/**
 * Server-only request helpers for the auth actions. `headers()` is async in
 * Next 15.
 */

/** Best-effort client IP for rate-limit keys (first hop of x-forwarded-for). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return h.get('x-real-ip') ?? '127.0.0.1';
}

/** The app's public origin, used for OAuth / email-confirmation redirects. */
export async function getAppOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, '');

  const h = await headers();
  const origin = h.get('origin');
  if (origin) return origin;

  const host = h.get('host') ?? 'localhost:3001';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`;
}
