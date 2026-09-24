import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Signs the user out (clears Better Auth session cookies) and redirects to /login.
 */
async function handleSignOut(request: Request): Promise<NextResponse> {
  const { origin } = new URL(request.url);
  try {
    await auth.api.signOut({
      headers: request.headers,
    });
  } catch {
    // Already signed out or error — continue to redirect
  }
  const response = NextResponse.redirect(`${origin}/login`, { status: 303 });
  response.cookies.delete('better-auth.session_token');
  response.cookies.delete('__Secure-better-auth.session_token');
  return response;
}

export async function POST(request: Request) {
  return handleSignOut(request);
}

export async function GET(request: Request) {
  return handleSignOut(request);
}
