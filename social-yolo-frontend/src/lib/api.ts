import {
  AuthResponse,
  BillingSummary,
  BrandProfile,
  CreditPackage,
  PriceCalculation,
  OrderItem,
  DiscountItem,
  CreditCostItem,
  AdminWalletItem,
  AdminAuditLogItem,
  AdminBillingStats,
  ExtractedBrandData,
  GeneratePostResponse,
  GuidedPostInput,
  HealthResponse,
  NotificationItem,
  Post,
  ProductAnalysisResult,
  RemoveBackgroundOptions,
  RemoveBackgroundResponse,
  User,
  UserRole,
} from './types';

// In-memory authentication state (zero localStorage persistence)
let _inMemoryAuthToken: string | null = null;
let _inMemoryUserId: string | null = null;

export function getAuthToken(): string | null {
  return _inMemoryAuthToken;
}

export function setAuthToken(token: string | null): void {
  _inMemoryAuthToken = token ? token.trim() : null;
}

export function clearAuthToken(): void {
  _inMemoryAuthToken = null;
  _inMemoryUserId = null;
}

export function getStoredUserId(): string {
  return _inMemoryUserId || '';
}

export function setStoredUserId(id: string | null): void {
  _inMemoryUserId = id ? id.trim() : null;
}

let _inMemoryBackendPort = '3001';

export function getStoredBackendPort(): string {
  return _inMemoryBackendPort;
}

export function setStoredBackendPort(port: string): void {
  _inMemoryBackendPort = port ? port.trim() : '3001';
}

export function getDirectBackendOrigin(): string {
  if (typeof window !== 'undefined' && window.location) {
    const port = getStoredBackendPort() || '3001';
    return `http://${window.location.hostname || 'localhost'}:${port}`;
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:3001';
}

export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  // Prefer proxy route for images to avoid CORS and port hardcoding
  return `/api/proxy${cleanPath}`;
}

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleApiResponse(res: Response, fallbackMessage: string): Promise<any> {
  let data: any = {};
  try {
    data = await res.json();
  } catch {
    // non-json response
  }

  if (!res.ok) {
    const errorMsg = data.message || data.error || `${fallbackMessage} (${res.status})`;
    throw new Error(errorMsg);
  }
  return data;
}

/* ================= AUTHENTICATION APIS ================= */

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch('/api/proxy/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await handleApiResponse(res, 'Login failed');
  if (data.token) {
    setAuthToken(data.token);
    if (data.user?.id) setStoredUserId(data.user.id);
  }
  return data;
}

export const GOOGLE_AUTH_URL = '/api/proxy/auth/google';

export async function googleAuthApi(
  payload: string | { credential?: string; code?: string; redirectUri?: string }
): Promise<AuthResponse> {
  const body = typeof payload === 'string' ? { credential: payload } : payload;
  const res = await fetch('/api/proxy/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await handleApiResponse(res, 'Google authentication failed');
  if (data.token) {
    setAuthToken(data.token);
    if (data.user?.id) setStoredUserId(data.user.id);
  }
  return data;
}

export async function instantGoogleAuthApi(email?: string, name?: string): Promise<AuthResponse> {
  const res = await fetch('/api/proxy/auth/google/instant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name }),
  });

  const data = await handleApiResponse(res, 'Instant Google sign-in failed');
  if (data.token) {
    setAuthToken(data.token);
    if (data.user?.id) setStoredUserId(data.user.id);
  }
  return data;
}

export async function registerApi(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch('/api/proxy/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await handleApiResponse(res, 'Registration failed');
  if (data.token) {
    setAuthToken(data.token);
    if (data.user?.id) setStoredUserId(data.user.id);
  }
  return data;
}

export async function logoutApi(): Promise<void> {
  try {
    await fetch('/api/proxy/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } finally {
    clearAuthToken();
  }
}

export async function refreshSessionApi(): Promise<AuthResponse> {
  const res = await fetch('/api/proxy/auth/refresh', {
    method: 'POST',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  const data = await handleApiResponse(res, 'Session refresh failed');
  if (data.token) {
    setAuthToken(data.token);
    if (data.user?.id) setStoredUserId(data.user.id);
  }
  return data;
}

export async function getMeApi(): Promise<User> {
  const res = await fetch('/api/proxy/auth/me', {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  const data = await handleApiResponse(res, 'Failed to fetch user profile');
  const userProfile: User = data.user || data;
  if (data.token) {
    setAuthToken(data.token);
  }
  if (userProfile?.id) {
    setStoredUserId(userProfile.id);
  }
  return userProfile;
}

export async function forgotPasswordApi(
  email: string
): Promise<{ message: string; devToken?: string; resetUrl?: string }> {
  const res = await fetch('/api/proxy/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return handleApiResponse(res, 'Failed to request password reset');
}

export async function resetPasswordApi(token: string, newPassword: string): Promise<{ message: string }> {
  const res = await fetch('/api/proxy/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  return handleApiResponse(res, 'Failed to reset password');
}

export async function changePasswordApi(
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  const res = await fetch('/api/proxy/auth/change-password', {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return handleApiResponse(res, 'Failed to change password');
}

/* ================= ADMIN RBAC APIS ================= */

export async function getUsersApi(
  page = 1,
  limit = 20,
  search?: string
): Promise<{ users: User[]; total: number }> {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) query.set('search', search);

  const res = await fetch(`/api/proxy/users?${query.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  return handleApiResponse(res, 'Failed to load user management list');
}

export async function updateUserRoleApi(id: string, role: UserRole): Promise<User> {
  const res = await fetch(`/api/proxy/users/${id}/role`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ role }),
  });
  return handleApiResponse(res, 'Failed to update user role');
}

export async function updateUserStatusApi(id: string, isActive: boolean): Promise<User> {
  const res = await fetch(`/api/proxy/users/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ isActive }),
  });
  return handleApiResponse(res, 'Failed to update user status');
}

export async function deleteUserApi(id: string): Promise<void> {
  const res = await fetch(`/api/proxy/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to delete user');
  }
}

/* ================= STUDIO & IMAGE APIS ================= */

export async function checkBackendHealth(): Promise<HealthResponse> {
  const ports = ['3001'];
  let backendOk = false;
  let pythonOk = false;
  let activeUrl = `http://localhost:${getStoredBackendPort()}`;

  try {
    const res = await fetch('/api/proxy/image-processing/health', {
      method: 'GET',
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      backendOk = true;
      pythonOk = Boolean(data.available);
      return {
        backend: backendOk,
        pythonService: pythonOk,
        activeUrl: 'Connected via Proxy',
        timestamp: new Date().toISOString(),
      };
    }
  } catch {
    // fallback to direct probe
  }

  for (const port of ports) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/image-processing/health`, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setStoredBackendPort(port);
        return {
          backend: true,
          pythonService: Boolean(data.available),
          activeUrl: `http://localhost:${port}`,
          timestamp: new Date().toISOString(),
        };
      }
    } catch {
      // try next
    }
  }

  return {
    backend: backendOk,
    pythonService: pythonOk,
    activeUrl,
    timestamp: new Date().toISOString(),
  };
}

export async function removeBackground(
  file: File,
  options: RemoveBackgroundOptions = {},
): Promise<RemoveBackgroundResponse> {
  const fd = new FormData();
  fd.append('file', file, file.name);

  const queryParams = new URLSearchParams();
  if (options.model) queryParams.set('model', options.model);
  queryParams.set('preserve_text', String(options.preserveText ?? true));
  if (options.alphaMatting) queryParams.set('alpha_matting', 'true');
  const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';

  const headers = getAuthHeaders();

  let res: Response | null = null;
  let lastError: Error | null = null;

  // Tier 1: Try Next.js proxy route to NestJS backend
  try {
    const proxyRes = await fetch(`/api/proxy/image-processing/remove-background${qs}`, {
      method: 'POST',
      headers,
      body: fd,
    });
    if (proxyRes.ok) {
      res = proxyRes;
    } else {
      const errData = await proxyRes.json().catch(() => ({}));
      lastError = new Error(errData.message || errData.error || `Proxy error (${proxyRes.status})`);
    }
  } catch (err: any) {
    lastError = err;
  }

  // Tier 2: If proxy failed, try direct NestJS backend origin
  if (!res) {
    try {
      const backendRes = await fetch(`${getDirectBackendOrigin()}/api/image-processing/remove-background${qs}`, {
        method: 'POST',
        headers,
        body: fd,
      });
      if (backendRes.ok) {
        res = backendRes;
      } else {
        const errData = await backendRes.json().catch(() => ({}));
        lastError = new Error(errData.message || errData.error || `Backend error (${backendRes.status})`);
      }
    } catch (backendErr: any) {
      lastError = backendErr;
    }
  }

  // No Python fallback — background removal is now native Node.js inside NestJS

  if (!res) {
    throw lastError || new Error('Failed to connect to background removal service.');
  }

  const data = await handleApiResponse(res, 'Background removal failed');
  return data;
}

export async function generatePost(
  prompt: string,
  file?: File | null,
  userId?: string,
  options?: Partial<GuidedPostInput>
): Promise<GeneratePostResponse> {
  const fd = new FormData();
  fd.append('prompt', prompt);
  if (file) {
    fd.append('file', file, file.name);
  }
  if (options?.logo) fd.append('logo', options.logo, options.logo.name);
  if (options?.content) fd.append('content', options.content);
  if (options?.category) fd.append('category', options.category);
  if (options?.colorScheme) fd.append('colorScheme', options.colorScheme);
  if (options?.font) fd.append('font', options.font);
  if (options?.postSize) fd.append('postSize', options.postSize);
  if (options?.outputType) fd.append('outputType', options.outputType);
  if (options?.productName) fd.append('productName', options.productName);
  if (options?.headline) fd.append('headline', options.headline);
  if (options?.style) fd.append('style', options.style);
  if (options?.occasion) fd.append('occasion', options.occasion);

  const headers = getAuthHeaders();

  let res: Response;
  try {
    res = await fetch('/api/proxy/posts/generate', {
      method: 'POST',
      body: fd,
      headers,
    });
  } catch {
    const directUrl = `${getDirectBackendOrigin()}/api/posts/generate`;
    res = await fetch(directUrl, {
      method: 'POST',
      body: fd,
      headers,
    });
  }

  const data = await handleApiResponse(res, 'Post generation failed');
  return {
    ...data,
    imageUrl: resolveImageUrl(data.imageUrl),
  };
}

export async function getRecentPosts(limit = 20): Promise<Post[]> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`/api/proxy/posts?limit=${limit}`, {
      headers,
      cache: 'no-store',
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/posts?limit=${limit}`, {
      headers,
      cache: 'no-store',
    });
  }

  const posts: Post[] = await handleApiResponse(res, 'Failed to load posts');
  return posts.map((post) => ({
    ...post,
    imageUrl: post.imagePath ? resolveImageUrl(post.imagePath) : post.imageUrl ? resolveImageUrl(post.imageUrl) : null,
  }));
}

export async function ratePost(
  postId: string,
  rating: number,
  userId?: string
): Promise<Post> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });

  let res: Response;
  try {
    res = await fetch(`/api/proxy/posts/${postId}/rate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ rating }),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/posts/${postId}/rate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ rating }),
    });
  }

  const data = await handleApiResponse(res, 'Rating failed');
  return {
    ...data,
    imageUrl: resolveImageUrl(data.imageUrl),
  };
}

/* ================= GUIDED CREATOR & PRODUCT SCANNER ================= */

export async function createGuidedPost(input: GuidedPostInput): Promise<Post> {
  const fd = new FormData();
  if (input.productName) fd.append('productName', input.productName);
  if (input.prompt) fd.append('prompt', input.prompt);
  if (input.category) fd.append('category', input.category);
  if (input.content) fd.append('content', input.content);
  if (input.colorScheme) fd.append('colorScheme', input.colorScheme);
  if (input.font) fd.append('font', input.font);
  if (input.postSize) fd.append('postSize', input.postSize);
  if (input.outputType) fd.append('outputType', input.outputType);
  if (input.platform) fd.append('platform', input.platform);
  if (input.aspectRatio) fd.append('aspectRatio', input.aspectRatio);
  if (input.style) fd.append('style', input.style);
  if (input.occasion) fd.append('occasion', input.occasion);
  if (input.backgroundMode) fd.append('backgroundMode', input.backgroundMode);
  if (input.headline) fd.append('headline', input.headline);
  if (input.bodyCopy) fd.append('bodyCopy', input.bodyCopy);
  if (input.targetAudience) fd.append('targetAudience', input.targetAudience);
  if (input.keyMessage) fd.append('keyMessage', input.keyMessage);
  if (input.cta) fd.append('cta', input.cta);
  if (input.language) fd.append('language', input.language);
  if (input.tone) fd.append('tone', input.tone);
  if (input.fontHeading) fd.append('fontHeading', input.fontHeading);
  if (input.fontBody) fd.append('fontBody', input.fontBody);
  if (input.primaryColor) fd.append('primaryColor', input.primaryColor);
  if (input.secondaryColor) fd.append('secondaryColor', input.secondaryColor);
  if (input.accentColor) fd.append('accentColor', input.accentColor);
  if (input.layoutPreference) fd.append('layoutPreference', input.layoutPreference);
  if (input.brandProfileId) fd.append('brandProfileId', input.brandProfileId);
  if (input.brandName) fd.append('brandName', input.brandName);
  if (input.additionalInstructions) fd.append('additionalInstructions', input.additionalInstructions);
  if (input.niche) fd.append('niche', input.niche);
  if (input.variationsCount) {
    fd.append('variationsCount', String(input.variationsCount));
    fd.append('totalVariations', String(input.variationsCount));
  } else if (input.totalVariations) {
    fd.append('totalVariations', String(input.totalVariations));
  }
  if (input.files && input.files.length > 0) {
    for (const f of input.files) {
      fd.append('files', f, f.name);
      fd.append('file', f, f.name);
    }
  } else if (input.file) {
    fd.append('file', input.file, input.file.name);
  }
  if (input.logo) fd.append('logo', input.logo, input.logo.name);
  if (input.model) fd.append('model', input.model, input.model.name);

  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch('/api/proxy/posts/create-guided', {
      method: 'POST',
      body: fd,
      headers,
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/posts/create-guided`, {
      method: 'POST',
      body: fd,
      headers,
    });
  }

  const data = await handleApiResponse(res, 'Post generation failed');
  const resolvedVariants = Array.isArray(data.variants)
    ? data.variants.map((v: any) => ({
        ...v,
        imageUrl: resolveImageUrl(v.imageUrl),
        originalImageUrl: resolveImageUrl(v.originalImageUrl),
      }))
    : undefined;

  return {
    ...data,
    imageUrl: resolveImageUrl(data.imageUrl),
    originalImageUrl: resolveImageUrl(data.originalImageUrl),
    variants: resolvedVariants,
  };
}

export async function analyzeProductImage(file: File): Promise<ProductAnalysisResult> {
  const fd = new FormData();
  fd.append('file', file, file.name);

  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch('/api/proxy/posts/analyze-image', {
      method: 'POST',
      body: fd,
      headers,
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/posts/analyze-image`, {
      method: 'POST',
      body: fd,
      headers,
    });
  }

  return handleApiResponse(res, 'Image analysis failed');
}

/* ================= POST MANAGEMENT & GALLERY ================= */

export async function getFilteredPosts(options: {
  platform?: string;
  style?: string;
  search?: string;
  favoritesOnly?: boolean;
  limit?: number;
  offset?: number;
} = {}): Promise<{ items: Post[]; total: number }> {
  const query = new URLSearchParams();
  if (options.platform && options.platform !== 'all') query.set('platform', options.platform);
  if (options.style && options.style !== 'all') query.set('style', options.style);
  if (options.search) query.set('search', options.search);
  if (options.favoritesOnly) query.set('favoritesOnly', 'true');
  if (options.limit) query.set('limit', String(options.limit));
  if (options.offset) query.set('offset', String(options.offset));

  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`/api/proxy/posts?${query.toString()}`, {
      headers,
      cache: 'no-store',
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/posts?${query.toString()}`, {
      headers,
      cache: 'no-store',
    });
  }

  const data = await handleApiResponse(res, 'Failed to load posts');
  const items: Post[] = Array.isArray(data) ? data : data.items || [];
  const total: number = Array.isArray(data) ? data.length : data.total ?? items.length;

  return {
    items: items.map((p) => ({
      ...p,
      imageUrl: resolveImageUrl(p.imageUrl || p.imagePath),
      originalImageUrl: resolveImageUrl(p.originalImageUrl),
    })),
    total,
  };
}

export async function getFavoritePosts(): Promise<Post[]> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch('/api/proxy/posts/favorites', {
      headers,
      cache: 'no-store',
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/posts/favorites`, {
      headers,
      cache: 'no-store',
    });
  }

  const posts: Post[] = await handleApiResponse(res, 'Failed to load favorites');
  return posts.map((p) => ({
    ...p,
    imageUrl: resolveImageUrl(p.imageUrl || p.imagePath),
    originalImageUrl: resolveImageUrl(p.originalImageUrl),
  }));
}

export async function toggleFavoritePost(id: string): Promise<Post> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch(`/api/proxy/posts/${id}/favorite`, {
      method: 'POST',
      headers,
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/posts/${id}/favorite`, {
      method: 'POST',
      headers,
    });
  }

  const data = await handleApiResponse(res, 'Failed to toggle favorite');
  return {
    ...data,
    imageUrl: resolveImageUrl(data.imageUrl || data.imagePath),
  };
}

export async function deletePostApi(id: string): Promise<void> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`/api/proxy/posts/${id}`, {
      method: 'DELETE',
      headers,
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/posts/${id}`, {
      method: 'DELETE',
      headers,
    });
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to delete post');
  }
}

/* ================= BRAND PROFILES APIS ================= */

export async function getBrandsApi(): Promise<BrandProfile[]> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch('/api/proxy/brands', {
      headers,
      cache: 'no-store',
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/brands`, {
      headers,
      cache: 'no-store',
    });
  }

  return handleApiResponse(res, 'Failed to load brand profiles');
}

export async function createBrandApi(brand: Partial<BrandProfile>): Promise<BrandProfile> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch('/api/proxy/brands', {
      method: 'POST',
      headers,
      body: JSON.stringify(brand),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/brands`, {
      method: 'POST',
      headers,
      body: JSON.stringify(brand),
    });
  }

  return handleApiResponse(res, 'Failed to create brand profile');
}

export async function updateBrandApi(id: string, brand: Partial<BrandProfile>): Promise<BrandProfile> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch(`/api/proxy/brands/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(brand),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/brands/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(brand),
    });
  }

  return handleApiResponse(res, 'Failed to update brand profile');
}

export async function deleteBrandApi(id: string): Promise<void> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`/api/proxy/brands/${id}`, {
      method: 'DELETE',
      headers,
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/brands/${id}`, {
      method: 'DELETE',
      headers,
    });
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to delete brand profile');
  }
}

export async function extractBrandFromUrlApi(url: string): Promise<ExtractedBrandData> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch('/api/proxy/brands/extract-from-url', {
      method: 'POST',
      headers,
      body: JSON.stringify({ url }),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/brands/extract-from-url`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url }),
    });
  }

  return handleApiResponse(res, 'Failed to extract company details from website');
}

/* ================= BILLING & CREDITS APIS ================= */

export async function getBillingSummaryApi(): Promise<BillingSummary> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch('/api/proxy/billing/summary', {
      headers,
      cache: 'no-store',
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/billing/summary`, {
      headers,
      cache: 'no-store',
    });
  }

  return handleApiResponse(res, 'Failed to load billing summary');
}

export async function getCreditPackagesApi(): Promise<CreditPackage[]> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch('/api/proxy/billing/packages', {
      headers,
      cache: 'no-store',
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/billing/packages`, {
      headers,
      cache: 'no-store',
    });
  }
  return handleApiResponse(res, 'Failed to load credit packages');
}

export async function validateCouponApi(
  packageId: string,
  couponCode: string,
): Promise<PriceCalculation> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch('/api/proxy/billing/validate-coupon', {
      method: 'POST',
      headers,
      body: JSON.stringify({ packageId, couponCode }),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/billing/validate-coupon`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ packageId, couponCode }),
    });
  }
  return handleApiResponse(res, 'Failed to validate coupon code');
}

export async function checkoutApi(
  packageId: string,
  couponCode?: string,
  paymentMethod?: string,
  idempotencyKey?: string,
): Promise<{ success: boolean; creditsAdded: number; newBalance: number; order: OrderItem; message: string }> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch('/api/proxy/billing/checkout', {
      method: 'POST',
      headers,
      body: JSON.stringify({ packageId, couponCode, paymentMethod, idempotencyKey }),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/billing/checkout`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ packageId, couponCode, paymentMethod, idempotencyKey }),
    });
  }
  return handleApiResponse(res, 'Failed to complete credit purchase');
}

/* ================= ADMIN BILLING APIS ================= */

export async function getAdminBillingStatsApi(): Promise<AdminBillingStats> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch('/api/proxy/admin/billing/stats', { headers, cache: 'no-store' });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/admin/billing/stats`, { headers, cache: 'no-store' });
  }
  return handleApiResponse(res, 'Failed to load admin billing stats');
}

export async function getAdminPackagesApi(): Promise<CreditPackage[]> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch('/api/proxy/admin/billing/packages', { headers, cache: 'no-store' });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/admin/billing/packages`, { headers, cache: 'no-store' });
  }
  return handleApiResponse(res, 'Failed to load credit packages');
}

export async function createAdminPackageApi(dto: any): Promise<CreditPackage> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch('/api/proxy/admin/billing/packages', {
      method: 'POST',
      headers,
      body: JSON.stringify(dto),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/admin/billing/packages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dto),
    });
  }
  return handleApiResponse(res, 'Failed to create credit package');
}

export async function updateAdminPackageApi(id: string, dto: any): Promise<CreditPackage> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch(`/api/proxy/admin/billing/packages/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(dto),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/admin/billing/packages/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(dto),
    });
  }
  return handleApiResponse(res, 'Failed to update credit package');
}

export async function deleteAdminPackageApi(id: string): Promise<void> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`/api/proxy/admin/billing/packages/${id}`, {
      method: 'DELETE',
      headers,
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/admin/billing/packages/${id}`, {
      method: 'DELETE',
      headers,
    });
  }
  if (!res.ok) {
    throw new Error('Failed to disable credit package');
  }
}

export async function getAdminCostsApi(): Promise<CreditCostItem[]> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch('/api/proxy/admin/billing/costs', { headers, cache: 'no-store' });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/admin/billing/costs`, { headers, cache: 'no-store' });
  }
  return handleApiResponse(res, 'Failed to load feature credit costs');
}

export async function updateAdminCostApi(
  id: string,
  creditCost: number,
  reason: string,
): Promise<CreditCostItem> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch(`/api/proxy/admin/billing/costs/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ creditCost, reason }),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/admin/billing/costs/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ creditCost, reason }),
    });
  }
  return handleApiResponse(res, 'Failed to update feature credit cost');
}

export async function getAdminDiscountsApi(): Promise<DiscountItem[]> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch('/api/proxy/admin/billing/discounts', { headers, cache: 'no-store' });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/admin/billing/discounts`, { headers, cache: 'no-store' });
  }
  return handleApiResponse(res, 'Failed to load discounts');
}

export async function createAdminDiscountApi(dto: any): Promise<DiscountItem> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch('/api/proxy/admin/billing/discounts', {
      method: 'POST',
      headers,
      body: JSON.stringify(dto),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/admin/billing/discounts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dto),
    });
  }
  return handleApiResponse(res, 'Failed to create discount');
}

export async function updateAdminDiscountApi(id: string, dto: any): Promise<DiscountItem> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch(`/api/proxy/admin/billing/discounts/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(dto),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/admin/billing/discounts/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(dto),
    });
  }
  return handleApiResponse(res, 'Failed to update discount');
}

export async function getAdminWalletsApi(
  search?: string,
  page = 1,
  limit = 20,
): Promise<{ items: AdminWalletItem[]; total: number; page: number; totalPages: number }> {
  const headers = getAuthHeaders();
  const query = new URLSearchParams();
  if (search) query.append('search', search);
  query.append('page', String(page));
  query.append('limit', String(limit));

  let res: Response;
  try {
    res = await fetch(`/api/proxy/admin/billing/wallets?${query.toString()}`, { headers, cache: 'no-store' });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/admin/billing/wallets?${query.toString()}`, { headers, cache: 'no-store' });
  }
  return handleApiResponse(res, 'Failed to load user wallets');
}

export async function adminAdjustWalletApi(
  userId: string,
  amount: number,
  action: 'add' | 'remove' | 'refund',
  reason: string,
): Promise<{ success: boolean; wallet: any; message: string }> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch(`/api/proxy/admin/billing/wallets/${userId}/adjust`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount, action, reason }),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/admin/billing/wallets/${userId}/adjust`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount, action, reason }),
    });
  }
  return handleApiResponse(res, 'Failed to adjust user wallet');
}

export async function getAdminTransactionsApi(params?: {
  userId?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: any[]; total: number; page: number; totalPages: number }> {
  const headers = getAuthHeaders();
  const query = new URLSearchParams();
  if (params?.userId) query.append('userId', params.userId);
  if (params?.type) query.append('type', params.type);
  if (params?.search) query.append('search', params.search);
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));

  let res: Response;
  try {
    res = await fetch(`/api/proxy/admin/billing/transactions?${query.toString()}`, { headers, cache: 'no-store' });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/admin/billing/transactions?${query.toString()}`, { headers, cache: 'no-store' });
  }
  return handleApiResponse(res, 'Failed to load transactions');
}

export async function getAdminOrdersApi(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: OrderItem[]; total: number; page: number; totalPages: number }> {
  const headers = getAuthHeaders();
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.search) query.append('search', params.search);
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));

  let res: Response;
  try {
    res = await fetch(`/api/proxy/admin/billing/orders?${query.toString()}`, { headers, cache: 'no-store' });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/admin/billing/orders?${query.toString()}`, { headers, cache: 'no-store' });
  }
  return handleApiResponse(res, 'Failed to load orders');
}

export async function getAdminAuditLogsApi(params?: {
  page?: number;
  limit?: number;
}): Promise<{ items: AdminAuditLogItem[]; total: number; page: number; totalPages: number }> {
  const headers = getAuthHeaders();
  const query = new URLSearchParams();
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));

  let res: Response;
  try {
    res = await fetch(`/api/proxy/admin/billing/audit-logs?${query.toString()}`, { headers, cache: 'no-store' });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/admin/billing/audit-logs?${query.toString()}`, { headers, cache: 'no-store' });
  }
  return handleApiResponse(res, 'Failed to load audit logs');
}

/* ================= NOTIFICATIONS APIS ================= */

export async function getNotificationsApi(): Promise<NotificationItem[]> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch('/api/proxy/notifications', {
      headers,
      cache: 'no-store',
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/notifications`, {
      headers,
      cache: 'no-store',
    });
  }

  const items = await handleApiResponse(res, 'Failed to load notifications');
  if (Array.isArray(items)) {
    return items.map((item: any) => ({
      ...item,
      read: item.read ?? item.isRead ?? false,
    }));
  }
  return [];
}

export async function markNotificationReadApi(id: string): Promise<void> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`/api/proxy/notifications/${id}/read`, {
      method: 'PATCH',
      headers,
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers,
    });
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to update notification');
  }
}

export async function markAllNotificationsReadApi(): Promise<void> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch('/api/proxy/notifications/read-all', {
      method: 'POST',
      headers,
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/notifications/read-all`, {
      method: 'POST',
      headers,
    });
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to mark all notifications as read');
  }
}

export async function deleteNotificationApi(id: string): Promise<void> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`/api/proxy/notifications/${id}`, {
      method: 'DELETE',
      headers,
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/notifications/${id}`, {
      method: 'DELETE',
      headers,
    });
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to delete notification');
  }
}

export async function clearAllNotificationsApi(): Promise<void> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch('/api/proxy/notifications/clear-all', {
      method: 'DELETE',
      headers,
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/notifications/clear-all`, {
      method: 'DELETE',
      headers,
    });
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to clear all notifications');
  }
}


