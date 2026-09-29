import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Pure zero-leak HTTP reverse proxy from Next.js to NestJS backend.
 * Bypasses CORS in development and eliminates port exposure in production.
 * Strictly no-cache to guarantee tenant isolation across concurrent user sessions.
 */
async function forwardRequest(req: NextRequest, pathParts: string[]) {
  const effectiveParts = pathParts[0] === 'api' ? pathParts.slice(1) : pathParts;
  const path = effectiveParts.join('/');
  const searchParams = req.nextUrl.searchParams.toString();
  const queryString = searchParams ? `?${searchParams}` : '';

  // Forward authorization and session cookies
  const authHeader = req.headers.get('authorization');
  const cookieHeader = req.headers.get('cookie');
  const contentType = req.headers.get('content-type');
  const accept = req.headers.get('accept');

  let bodyBuffer: ArrayBuffer | null = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try {
      bodyBuffer = await req.arrayBuffer();
    } catch {
      bodyBuffer = null;
    }
  }

  const backendOrigin = process.env.BACKEND_URL || 'http://127.0.0.1:3001';
  const targetUrl = `${backendOrigin}/api/${path}${queryString}`;

  try {
    const headers: Record<string, string> = {};
    if (authHeader) headers['authorization'] = authHeader;
    if (cookieHeader) headers['cookie'] = cookieHeader;
    if (contentType) headers['content-type'] = contentType;
    if (accept) headers['accept'] = accept;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: bodyBuffer,
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(180000), // 180s timeout for AI generation operations
    });

    // Handle server redirects (301, 302, 307, 308)
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        return NextResponse.redirect(new URL(location, req.url), response.status);
      }
    }

    const resContentType = response.headers.get('content-type') || 'application/json';
    const data = await response.arrayBuffer();

    const outHeaders: Record<string, string> = {
      'Content-Type': resContentType,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    };
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      outHeaders['Set-Cookie'] = setCookie;
    }

    return new NextResponse(data, {
      status: response.status,
      headers: outHeaders,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        message: 'Unable to connect to NestJS backend on port 3001. Make sure the backend is running.',
        error: err?.message || 'Connection refused',
      },
      { status: 503 }
    );
  }
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forwardRequest(req, params.path);
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forwardRequest(req, params.path);
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forwardRequest(req, params.path);
}

export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forwardRequest(req, params.path);
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forwardRequest(req, params.path);
}
