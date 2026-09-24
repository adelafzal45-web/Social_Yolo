import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


interface CacheEntry {
  status: number;
  contentType: string;
  data: ArrayBuffer;
  expiresAt: number;
}

// In-memory proxy cache for fast repeat GET requests
const proxyCache = new Map<string, CacheEntry>();

function getCacheKey(req: NextRequest, path: string, queryString: string): string {
  const userId = req.headers.get('x-user-id') || 'anon';
  const auth = req.headers.get('authorization') ? 'auth' : 'noauth';
  return `${userId}:${auth}:${path}${queryString}`;
}

function invalidateProxyCache(prefix?: string) {
  if (!prefix) {
    proxyCache.clear();
    return;
  }
  proxyCache.forEach((_, key) => {
    if (key.includes(prefix)) {
      proxyCache.delete(key);
    }
  });
}

async function forwardRequest(req: NextRequest, pathParts: string[]) {
  const effectiveParts = pathParts[0] === 'api' ? pathParts.slice(1) : pathParts;
  const path = effectiveParts.join('/');
  const searchParams = req.nextUrl.searchParams.toString();
  const queryString = searchParams ? `?${searchParams}` : '';
  const isGet = req.method === 'GET';

  // Check cache for GET requests
  const cacheKey = getCacheKey(req, path, queryString);
  if (isGet) {
    const cached = proxyCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return new NextResponse(cached.data.slice(0), {
        status: cached.status,
        headers: {
          'Content-Type': cached.contentType,
          'X-Proxy-Cache': 'HIT',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  } else {
    // On any mutation (POST/PUT/PATCH/DELETE), evict related caches
    const rootEntity = effectiveParts[0] || '';
    invalidateProxyCache(rootEntity);
    if (rootEntity === 'posts' || rootEntity === 'billing' || rootEntity === 'auth') {
      invalidateProxyCache('billing');
      invalidateProxyCache('posts');
      invalidateProxyCache('auth');
    }
  }

  // Forward custom user, auth, and cookie headers
  const authHeader = req.headers.get('authorization');
  const cookieHeader = req.headers.get('cookie');
  const userId = req.headers.get('x-user-id');
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
    if (userId) headers['x-user-id'] = userId;
    if (contentType) headers['content-type'] = contentType;
    if (accept) headers['accept'] = accept;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: bodyBuffer,
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(60000), // 60s timeout for AI operations
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

    // Cache successful GET responses (TTL 15 seconds), excluding sensitive user session endpoints
    const skipCache = ['auth', 'billing', 'notifications'].includes(effectiveParts[0]);
    if (isGet && response.status === 200 && !skipCache) {
      proxyCache.set(cacheKey, {
        status: response.status,
        contentType: resContentType,
        data: data.slice(0),
        expiresAt: Date.now() + 15_000,
      });

      // Prune old cache entries
      if (proxyCache.size > 200) {
        const now = Date.now();
        proxyCache.forEach((entry, k) => {
          if (now > entry.expiresAt) proxyCache.delete(k);
        });
      }
    }

    const outHeaders: Record<string, string> = {
      'Content-Type': resContentType,
      'X-Proxy-Cache': 'MISS',
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
