import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/studio',
  '/content',
  '/brands',
  '/settings',
];
const ADMIN_PREFIXES = ['/admin'];
const AUTH_PAGES = ['/login', '/signup', '/register'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Never redirect API proxy or internal API routes
  if (path.startsWith('/api/')) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get('access_token')?.value ||
    request.cookies.get('social_yolo_jwt_token')?.value ||
    request.cookies.get('better-auth.session_token')?.value ||
    request.cookies.get('__Secure-better-auth.session_token')?.value;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
  const isAdmin = ADMIN_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
  const isAuthPage = AUTH_PAGES.includes(path);

  // Redirect unauthenticated visitors attempting to access protected or admin routes
  if ((isProtected || isAdmin) && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login/signup to dashboard
  if (isAuthPage && token) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

