import {
  AuthResponse,
  BillingSummary,
  BrandProfile,
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
  ContentConcept,
  StructuredContentRequest,
  GeneratedContentResult,
  PostMetric,
  ContentPerformanceInsight,
  BrandAnalyticsOverview,
  BrandAnalysisResult,
  CreativeGeneration,
  CreativeVariation,
  DesignReference,
  SmartDefaultsResult,
  StartStudioGenerationInput,
  AiDesignEditAction,
  StudioConfigResponse,
  SafePayCheckoutResponse,
  SafePayVerifyResponse,
  AdminCreateUserPayload,
  AdminUpdateUserPayload,
  UserBillingDetails,
} from './types';

export type { User as AuthUser, ProcessedImageResult, Verdict, RemoveBackgroundOptions } from './types';
import type {
  EmailProvider,
  EmailTemplate,
  EmailOffer,
  EmailCampaign,
  EmailRecipient,
  EmailSuppression,
  EmailPreferences,
  DomainVerificationResult,
  EmailOverviewStats,
  AudienceEstimationResult,
  SmtpTestResult,
} from '../types/email';
export * from '../types/email';
export { UserRole };

export async function startGenerationJob(
  token: string,
  payload: {
    projectId: string;
    platforms?: string[];
    style?: string;
    quantity?: number;
    outputMode?: string;
    provider?: string;
  }
): Promise<any> {
  const headers = getAuthHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  const res = await fetch('/api/proxy/generation/jobs', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleApiResponse(res, 'Failed to start generation job');
}

export function subscribeGenerationJobStream(
  token: string,
  jobId: string,
  onMessage: (data: any) => void,
  onComplete?: () => void,
  onError?: (err: any) => void
): () => void {
  let isCancelled = false;
  const controller = new AbortController();

  (async () => {
    try {
      const headers = getAuthHeaders(token ? { Authorization: `Bearer ${token}` } : {});
      const res = await fetch(`/api/proxy/generation/jobs/${jobId}/stream`, {
        headers,
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        throw new Error(`SSE stream failed with status ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!isCancelled) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const match = line.match(/^data:\s*(.+)$/m);
          if (match) {
            try {
              const parsed = JSON.parse(match[1]);
              onMessage(parsed);
              if (parsed.status === 'COMPLETED' || parsed.progressPct >= 100) {
                if (onComplete) onComplete();
              }
            } catch (e) {
              // ignore parse errors
            }
          }
        }
      }
      if (onComplete) onComplete();
    } catch (err: any) {
      if (!isCancelled && onError) {
        onError(err);
      }
    }
  })();

  return () => {
    isCancelled = true;
    controller.abort();
  };
}

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
  const userId = getStoredUserId();
  if (userId) {
    headers['x-user-id'] = userId;
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

export const login = loginApi;
export const register = registerApi;
export const logout = logoutApi;
export type { AuthResponse as LoginResponse } from './types';

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

export async function getMeApi(token?: string): Promise<any> {
  const headers = getAuthHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  const res = await fetch('/api/proxy/auth/me', {
    method: 'GET',
    headers,
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
  return {
    ...userProfile,
    user: userProfile,
    credits: { balance: userProfile.credits || 50 },
    organization: { tier: userProfile.plan || 'Pro' },
  };
}

export const getAuthProfile = getMeApi;


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

export async function adminCreateUserApi(payload: AdminCreateUserPayload): Promise<User> {
  const res = await fetch('/api/proxy/admin/users', {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  return handleApiResponse(res, 'Failed to create user');
}

export async function adminUpdateUserApi(
  id: string,
  payload: AdminUpdateUserPayload
): Promise<User> {
  const res = await fetch(`/api/proxy/admin/users/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  return handleApiResponse(res, 'Failed to update user profile');
}

export async function adminGetUserBillingApi(id: string): Promise<UserBillingDetails> {
  const res = await fetch(`/api/proxy/admin/users/${id}/billing`, {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  return handleApiResponse(res, 'Failed to load user billing profile');
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

export async function enhanceImageApi(
  file: File,
  options?: { brightness?: number; saturation?: number; contrast?: number }
): Promise<{ url: string }> {
  try {
    const fd = new FormData();
    fd.append('file', file, file.name);
    if (options?.brightness !== undefined) fd.append('brightness', String(options.brightness));
    if (options?.saturation !== undefined) fd.append('saturation', String(options.saturation));
    const res = await fetch('/api/proxy/image-processing/enhance', {
      method: 'POST',
      body: fd,
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return { url: resolveImageUrl(data.url || data.imageUrl) };
    }
  } catch {
    // fallback
  }
  return { url: typeof window !== 'undefined' ? URL.createObjectURL(file) : '' };
}

export async function removeBackground(
  file: File,
  options: RemoveBackgroundOptions & { provider?: string } = {},
  userToken?: string | null,
): Promise<RemoveBackgroundResponse> {
  const fd = new FormData();
  fd.append('file', file, file.name);

  const queryParams = new URLSearchParams();
  if (options.model) queryParams.set('model', options.model);
  if (options.provider) queryParams.set('provider', options.provider);
  queryParams.set('preserve_text', String(options.preserveText ?? true));
  if (options.alphaMatting) queryParams.set('alpha_matting', 'true');
  const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';

  const headers = getAuthHeaders(userToken ? { Authorization: `Bearer ${userToken}` } : {});


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
  if (userId) {
    headers['x-user-id'] = userId;
  }

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
  if (userId) {
    headers['x-user-id'] = userId;
  }

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
  if (input.file) fd.append('file', input.file, input.file.name);
  if (input.logo) fd.append('logo', input.logo, input.logo.name);

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
  return {
    ...data,
    imageUrl: resolveImageUrl(data.imageUrl),
    originalImageUrl: resolveImageUrl(data.originalImageUrl),
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

export async function getBrandsApi(token?: string): Promise<BrandProfile[]> {
  const headers = getAuthHeaders(token ? { Authorization: `Bearer ${token}` } : {});
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


export const fetchBrands = getBrandsApi;
export const getBrandProfilesApi = getBrandsApi;

export async function fetchProjects(token?: string): Promise<any[]> {
  const headers = getAuthHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  try {
    const res = await fetch('/api/proxy/projects', { headers, cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.items || [];
  } catch {
    return [];
  }
}

export async function createProject(tokenOrData: any, dataIfToken?: any): Promise<any> {
  const token = typeof tokenOrData === 'string' ? tokenOrData : undefined;
  const payload = typeof tokenOrData === 'string' ? dataIfToken : tokenOrData;
  const headers = getAuthHeaders(
    token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' },
  );
  const res = await fetch('/api/proxy/projects', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  return handleApiResponse(res, 'Failed to create project');
}

export async function updateProject(tokenOrId: any, idOrData: any, dataIfToken?: any): Promise<any> {
  let token: string | undefined;
  let id: string;
  let payload: any;
  if (dataIfToken !== undefined) {
    token = tokenOrId;
    id = idOrData;
    payload = dataIfToken;
  } else {
    id = tokenOrId;
    payload = idOrData;
  }
  const headers = getAuthHeaders(
    token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' },
  );
  const res = await fetch(`/api/proxy/projects/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });
  return handleApiResponse(res, 'Failed to update project');
}

export async function fetchCreditBalance(): Promise<number> {
  const summary = await getBillingSummaryApi().catch(() => null);
  return summary?.balance || 0;
}

export async function topUpCredits(tokenOrCredits: any, creditsOrCents?: any, centsIfToken?: any): Promise<any> {
  const credits = typeof tokenOrCredits === 'number' ? tokenOrCredits : (typeof creditsOrCents === 'number' ? creditsOrCents : 50);
  return topupCreditsApi(credits, `${credits} Credits Pack`);
}


export async function fetchSubscription(): Promise<any> {
  const summary = await getBillingSummaryApi().catch(() => null);
  return summary?.subscription || null;
}

export async function fetchInvoices(token?: string): Promise<any[]> {
  const headers = getAuthHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  try {
    const res = await fetch('/api/proxy/billing/invoices', { headers, cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.items || [];
  } catch {
    return [];
  }
}

export async function fetchTeamMembers(token?: string): Promise<any[]> {
  const headers = getAuthHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  try {
    const res = await fetch('/api/proxy/teams/members', { headers, cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.items || [];
  } catch {
    return [];
  }
}

export async function updateCreativeVariant(id: string, data: any): Promise<any> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/proxy/posts/variants/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
  return handleApiResponse(res, 'Failed to update creative variant');
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

export async function getBrandByIdApi(id: string): Promise<BrandProfile> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`/api/proxy/brands/${id}`, {
      headers,
      cache: 'no-store',
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/brands/${id}`, {
      headers,
      cache: 'no-store',
    });
  }
  return handleApiResponse(res, 'Failed to fetch brand profile');
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

export async function analyzeUrlApi(url: string): Promise<{ jobId: string; status: string; message: string }> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch('/api/proxy/brands/analyze-url', {
      method: 'POST',
      headers,
      body: JSON.stringify({ url }),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/brands/analyze-url`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url }),
    });
  }
  return handleApiResponse(res, 'Failed to start website analysis');
}

export async function getAnalysisJobStatusApi(jobId: string): Promise<any> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`/api/proxy/brands/analysis/${jobId}`, {
      headers,
      cache: 'no-store',
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/brands/analysis/${jobId}`, {
      headers,
      cache: 'no-store',
    });
  }
  return handleApiResponse(res, 'Failed to fetch analysis job status');
}

export async function reanalyzeBrandApi(id: string): Promise<{ jobId: string; status: string; brandId: string }> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`/api/proxy/brands/${id}/reanalyze`, {
      method: 'POST',
      headers,
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/brands/${id}/reanalyze`, {
      method: 'POST',
      headers,
    });
  }
  return handleApiResponse(res, 'Failed to re-analyze brand website');
}

export async function getBrandInsightsApi(brandId: string): Promise<any> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`/api/proxy/brands/${brandId}/insights`, {
      headers,
      cache: 'no-store',
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/brands/${brandId}/insights`, {
      headers,
      cache: 'no-store',
    });
  }
  return handleApiResponse(res, 'Failed to fetch brand insights');
}

export async function updateBrandInsightsApi(brandId: string, data: any): Promise<any> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch(`/api/proxy/brands/${brandId}/insights`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/brands/${brandId}/insights`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
  }
  return handleApiResponse(res, 'Failed to update brand insights');
}

export async function getBrandSourcesApi(brandId: string): Promise<any[]> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`/api/proxy/brands/${brandId}/sources`, {
      headers,
      cache: 'no-store',
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/brands/${brandId}/sources`, {
      headers,
      cache: 'no-store',
    });
  }
  const items = await handleApiResponse(res, 'Failed to fetch brand sources');
  return Array.isArray(items) ? items : [];
}

export async function getBrandFullApi(id: string): Promise<BrandProfile> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`/api/proxy/brands/${id}/full`, {
      headers,
      cache: 'no-store',
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/brands/${id}/full`, {
      headers,
      cache: 'no-store',
    });
  }
  return handleApiResponse(res, 'Failed to fetch full brand profile');
}

export async function analyzeBrandSyncApi(url: string): Promise<BrandAnalysisResult> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch('/api/proxy/brands/analyze/sync', {
      method: 'POST',
      headers,
      body: JSON.stringify({ url }),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/brands/analyze/sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url }),
    });
  }
  return handleApiResponse(res, 'Failed to analyze website');
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

export async function createSafePayCheckoutApi(params: {
  planId?: string;
  packId?: string;
  redirectUrl?: string;
  cancelUrl?: string;
}): Promise<SafePayCheckoutResponse> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch('/api/proxy/billing/safepay/checkout', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/billing/safepay/checkout`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
  }
  return handleApiResponse(res, 'Failed to initialize SafePay checkout');
}

export async function verifySafePayPaymentApi(params: {
  paymentId?: string;
  trackerToken?: string;
}): Promise<SafePayVerifyResponse> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch('/api/proxy/billing/safepay/verify', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/billing/safepay/verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
  }
  return handleApiResponse(res, 'Failed to verify SafePay payment');
}

export async function cancelSubscriptionApi(reason?: string): Promise<{
  success: boolean;
  message: string;
  cancelAtPeriodEnd: boolean;
  expiresAt: string;
}> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch('/api/proxy/billing/subscription/cancel', {
      method: 'POST',
      headers,
      body: JSON.stringify({ reason }),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/billing/subscription/cancel`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reason }),
    });
  }
  return handleApiResponse(res, 'Failed to cancel subscription');
}

export async function getSubscriptionApi(): Promise<{
  subscription: any;
  availablePlans: any[];
  creditPacks: any[];
}> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch('/api/proxy/billing/subscription', {
      headers,
      cache: 'no-store',
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/billing/subscription`, {
      headers,
      cache: 'no-store',
    });
  }
  return handleApiResponse(res, 'Failed to load subscription details');
}

export async function topupCreditsApi(
  credits: number,
  packTitle: string
): Promise<{ success: boolean; credits: number; message: string }> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch('/api/proxy/billing/topup', {
      method: 'POST',
      headers,
      body: JSON.stringify({ credits, packTitle }),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/billing/topup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ credits, packTitle }),
    });
  }

  return handleApiResponse(res, 'Failed to top up credits');
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

/* ================= CONTENT INTELLIGENCE APIS ================= */

export async function generateContentApi(
  data: StructuredContentRequest
): Promise<GeneratedContentResult> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch('/api/proxy/content/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/content/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  }
  return handleApiResponse(res, 'Failed to generate content');
}

export async function listContentApi(
  brandId?: string,
  platform?: string,
  status?: string
): Promise<Post[]> {
  const headers = getAuthHeaders();
  const params = new URLSearchParams();
  if (brandId) params.append('brandId', brandId);
  if (platform) params.append('platform', platform);
  if (status) params.append('status', status);

  const qs = params.toString() ? `?${params.toString()}` : '';
  let res: Response;
  try {
    res = await fetch(`/api/proxy/content${qs}`, {
      headers,
      cache: 'no-store',
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/content${qs}`, {
      headers,
      cache: 'no-store',
    });
  }
  const items = await handleApiResponse(res, 'Failed to list content');
  return Array.isArray(items) ? items : [];
}

export async function getContentByIdApi(id: string): Promise<Post> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`/api/proxy/content/${id}`, {
      headers,
      cache: 'no-store',
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/content/${id}`, {
      headers,
      cache: 'no-store',
    });
  }
  return handleApiResponse(res, 'Failed to get content item');
}

export async function updateContentApi(id: string, data: Partial<Post>): Promise<Post> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch(`/api/proxy/content/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/content/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
  }
  return handleApiResponse(res, 'Failed to update content');
}

export async function deleteContentApi(id: string): Promise<void> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`/api/proxy/content/${id}`, {
      method: 'DELETE',
      headers,
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/content/${id}`, {
      method: 'DELETE',
      headers,
    });
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to delete content');
  }
}

/* ================= CONTENT CONCEPTS APIS ================= */

export async function listConceptsApi(
  brandId?: string,
  status?: string
): Promise<ContentConcept[]> {
  const headers = getAuthHeaders();
  const params = new URLSearchParams();
  if (brandId) params.append('brandId', brandId);
  if (status) params.append('status', status);

  const qs = params.toString() ? `?${params.toString()}` : '';
  let res: Response;
  try {
    res = await fetch(`/api/proxy/content/concepts${qs}`, {
      headers,
      cache: 'no-store',
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/content/concepts${qs}`, {
      headers,
      cache: 'no-store',
    });
  }
  const items = await handleApiResponse(res, 'Failed to list content concepts');
  return Array.isArray(items) ? items : [];
}

export async function generateConceptsApi(
  brandId: string,
  options?: { count?: number; campaignId?: string; pillarId?: string; theme?: string }
): Promise<ContentConcept[]> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch('/api/proxy/content/concepts/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify({ brandId, ...options }),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/content/concepts/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ brandId, ...options }),
    });
  }
  const items = await handleApiResponse(res, 'Failed to generate concepts');
  return Array.isArray(items) ? items : [];
}

export async function updateConceptApi(
  id: string,
  data: Partial<ContentConcept>
): Promise<ContentConcept> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch(`/api/proxy/content/concepts/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/content/concepts/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
  }
  return handleApiResponse(res, 'Failed to update concept');
}

export async function deleteConceptApi(id: string): Promise<void> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`/api/proxy/content/concepts/${id}`, {
      method: 'DELETE',
      headers,
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/content/concepts/${id}`, {
      method: 'DELETE',
      headers,
    });
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to delete concept');
  }
}

/* ================= ANALYTICS APIS ================= */

export async function getBrandAnalyticsOverviewApi(
  brandId: string
): Promise<BrandAnalyticsOverview> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`/api/proxy/analytics/brands/${brandId}/overview`, {
      headers,
      cache: 'no-store',
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/analytics/brands/${brandId}/overview`, {
      headers,
      cache: 'no-store',
    });
  }
  return handleApiResponse(res, 'Failed to fetch brand analytics');
}

export async function getBrandPerformanceInsightsApi(
  brandId: string
): Promise<ContentPerformanceInsight[]> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`/api/proxy/analytics/brands/${brandId}/insights`, {
      headers,
      cache: 'no-store',
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/analytics/brands/${brandId}/insights`, {
      headers,
      cache: 'no-store',
    });
  }
  const items = await handleApiResponse(res, 'Failed to fetch performance insights');
  return Array.isArray(items) ? items : [];
}

export async function generateBrandInsightsApi(
  brandId: string
): Promise<ContentPerformanceInsight[]> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch(`/api/proxy/analytics/brands/${brandId}/insights/generate`, {
      method: 'POST',
      headers,
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/analytics/brands/${brandId}/insights/generate`, {
      method: 'POST',
      headers,
    });
  }
  const items = await handleApiResponse(res, 'Failed to generate performance insights');
  return Array.isArray(items) ? items : [];
}

export async function recordPostMetricsApi(
  postId: string,
  metrics: Partial<PostMetric>
): Promise<PostMetric> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch(`/api/proxy/analytics/posts/${postId}/metrics`, {
      method: 'POST',
      headers,
      body: JSON.stringify(metrics),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/analytics/posts/${postId}/metrics`, {
      method: 'POST',
      headers,
      body: JSON.stringify(metrics),
    });
  }
  return handleApiResponse(res, 'Failed to record post metrics');
}

// =============================================================================
// SocialYolo — Production Email, SMTP & Real-Time Offer Campaign APIs
// =============================================================================

export async function getEmailOverviewApi(timeRange = '7d'): Promise<{
  metrics: EmailOverviewStats;
  queue: any;
}> {
  const headers = getAuthHeaders();
  const res = await fetch(`/api/proxy/email/overview?timeRange=${encodeURIComponent(timeRange)}`, {
    headers,
  });
  return handleApiResponse(res, 'Failed to fetch email overview');
}

export async function getEmailProvidersApi(): Promise<EmailProvider[]> {
  const headers = getAuthHeaders();
  const res = await fetch('/api/proxy/email/providers', { headers });
  return handleApiResponse(res, 'Failed to fetch email providers');
}

export async function saveEmailProviderApi(dto: Partial<EmailProvider>): Promise<EmailProvider> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const method = dto.id ? 'PUT' : 'POST';
  const url = dto.id ? `/api/proxy/email/providers/${dto.id}` : '/api/proxy/email/providers';
  const res = await fetch(url, {
    method,
    headers,
    body: JSON.stringify(dto),
  });
  return handleApiResponse(res, 'Failed to save email provider');
}

export async function deleteEmailProviderApi(id: string): Promise<{ success: boolean }> {
  const headers = getAuthHeaders();
  const res = await fetch(`/api/proxy/email/providers/${id}`, {
    method: 'DELETE',
    headers,
  });
  return handleApiResponse(res, 'Failed to delete email provider');
}

export async function testSmtpConnectionApi(dto: any): Promise<SmtpTestResult> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch('/api/proxy/email/test-smtp', {
    method: 'POST',
    headers,
    body: JSON.stringify(dto),
  });
  return handleApiResponse(res, 'Failed to test SMTP connection');
}

export async function verifyEmailDomainApi(domain?: string): Promise<DomainVerificationResult> {
  const headers = getAuthHeaders();
  const query = domain ? `?domain=${encodeURIComponent(domain)}` : '';
  const res = await fetch(`/api/proxy/email/domains/verify${query}`, { headers });
  return handleApiResponse(res, 'Failed to verify email domain');
}

export async function getEmailTemplatesApi(category?: string): Promise<EmailTemplate[]> {
  const headers = getAuthHeaders();
  const query = category && category !== 'ALL' ? `?category=${encodeURIComponent(category)}` : '';
  const res = await fetch(`/api/proxy/email/templates${query}`, { headers });
  return handleApiResponse(res, 'Failed to fetch email templates');
}

export async function getEmailTemplateApi(id: string): Promise<EmailTemplate> {
  const headers = getAuthHeaders();
  const res = await fetch(`/api/proxy/email/templates/${id}`, { headers });
  return handleApiResponse(res, 'Failed to fetch email template');
}

export async function saveEmailTemplateApi(dto: Partial<EmailTemplate>): Promise<EmailTemplate> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const method = dto.id ? 'PUT' : 'POST';
  const url = dto.id ? `/api/proxy/email/templates/${dto.id}` : '/api/proxy/email/templates';
  const res = await fetch(url, {
    method,
    headers,
    body: JSON.stringify(dto),
  });
  return handleApiResponse(res, 'Failed to save email template');
}

export async function deleteEmailTemplateApi(id: string): Promise<{ success: boolean }> {
  const headers = getAuthHeaders();
  const res = await fetch(`/api/proxy/email/templates/${id}`, {
    method: 'DELETE',
    headers,
  });
  return handleApiResponse(res, 'Failed to delete email template');
}

export async function previewEmailTemplateApi(html: string, context: Record<string, any> = {}): Promise<{ html: string }> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch('/api/proxy/email/templates/preview', {
    method: 'POST',
    headers,
    body: JSON.stringify({ html, context }),
  });
  return handleApiResponse(res, 'Failed to render template preview');
}

export async function getEmailOffersApi(): Promise<EmailOffer[]> {
  const headers = getAuthHeaders();
  const res = await fetch('/api/proxy/email/offers', { headers });
  return handleApiResponse(res, 'Failed to fetch offers');
}

export async function saveEmailOfferApi(dto: Partial<EmailOffer>): Promise<EmailOffer> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const method = dto.id ? 'PUT' : 'POST';
  const url = dto.id ? `/api/proxy/email/offers/${dto.id}` : '/api/proxy/email/offers';
  const res = await fetch(url, {
    method,
    headers,
    body: JSON.stringify(dto),
  });
  return handleApiResponse(res, 'Failed to save offer');
}

export async function deleteEmailOfferApi(id: string): Promise<{ success: boolean }> {
  const headers = getAuthHeaders();
  const res = await fetch(`/api/proxy/email/offers/${id}`, {
    method: 'DELETE',
    headers,
  });
  return handleApiResponse(res, 'Failed to delete offer');
}

export async function estimateAudienceApi(criteria: any): Promise<AudienceEstimationResult> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch('/api/proxy/email/audience/estimate', {
    method: 'POST',
    headers,
    body: JSON.stringify(criteria),
  });
  return handleApiResponse(res, 'Failed to estimate audience');
}

export async function getEmailCampaignsApi(status?: string): Promise<EmailCampaign[]> {
  const headers = getAuthHeaders();
  const query = status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}` : '';
  const res = await fetch(`/api/proxy/email/campaigns${query}`, { headers });
  return handleApiResponse(res, 'Failed to fetch campaigns');
}

export async function getEmailCampaignApi(id: string): Promise<EmailCampaign> {
  const headers = getAuthHeaders();
  const res = await fetch(`/api/proxy/email/campaigns/${id}`, { headers });
  return handleApiResponse(res, 'Failed to fetch campaign details');
}

export async function saveEmailCampaignApi(dto: Partial<EmailCampaign>): Promise<EmailCampaign> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const method = dto.id ? 'PUT' : 'POST';
  const url = dto.id ? `/api/proxy/email/campaigns/${dto.id}` : '/api/proxy/email/campaigns';
  const res = await fetch(url, {
    method,
    headers,
    body: JSON.stringify(dto),
  });
  return handleApiResponse(res, 'Failed to save campaign');
}

export async function sendEmailCampaignApi(id: string): Promise<{ success: boolean; message: string }> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/proxy/email/campaigns/${id}/send`, {
    method: 'POST',
    headers,
  });
  return handleApiResponse(res, 'Failed to trigger campaign send');
}

export async function pauseEmailCampaignApi(id: string): Promise<{ success: boolean }> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/proxy/email/campaigns/${id}/pause`, {
    method: 'POST',
    headers,
  });
  return handleApiResponse(res, 'Failed to pause campaign');
}

export async function resumeEmailCampaignApi(id: string): Promise<{ success: boolean }> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/proxy/email/campaigns/${id}/resume`, {
    method: 'POST',
    headers,
  });
  return handleApiResponse(res, 'Failed to resume campaign');
}

export async function cancelEmailCampaignApi(id: string): Promise<{ success: boolean }> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/proxy/email/campaigns/${id}/cancel`, {
    method: 'POST',
    headers,
  });
  return handleApiResponse(res, 'Failed to cancel campaign');
}

export async function getEmailCampaignAnalyticsApi(id: string): Promise<any> {
  const headers = getAuthHeaders();
  const res = await fetch(`/api/proxy/email/campaigns/${id}/analytics`, { headers });
  return handleApiResponse(res, 'Failed to fetch campaign analytics');
}

export async function getEmailCampaignRecipientsApi(
  id: string,
  status?: string,
  page = 1,
  limit = 50
): Promise<{ items: EmailRecipient[]; total: number; page: number; limit: number }> {
  const headers = getAuthHeaders();
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status && status !== 'ALL') params.set('status', status);
  const res = await fetch(`/api/proxy/email/campaigns/${id}/recipients?${params.toString()}`, {
    headers,
  });
  return handleApiResponse(res, 'Failed to fetch campaign recipients');
}

export function subscribeCampaignProgressStream(
  campaignId: string,
  onUpdate: (data: any) => void
): () => void {
  const controller = new AbortController();
  const headers = getAuthHeaders();

  (async () => {
    try {
      const res = await fetch(`/api/proxy/email/campaigns/${campaignId}/stream`, {
        headers,
        signal: controller.signal,
      });
      if (!res.ok || !res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const match = line.match(/^data:\s*(.+)$/m);
          if (match) {
            try {
              const data = JSON.parse(match[1]);
              onUpdate(data);
            } catch {}
          }
        }
      }
    } catch {}
  })();

  return () => controller.abort();
}

export async function getEmailSuppressionsApi(): Promise<EmailSuppression[]> {
  const headers = getAuthHeaders();
  const res = await fetch('/api/proxy/email/suppressions', { headers });
  return handleApiResponse(res, 'Failed to fetch suppression list');
}

export async function addEmailSuppressionApi(
  email: string,
  reason = 'MANUAL'
): Promise<EmailSuppression> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch('/api/proxy/email/suppressions', {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, reason }),
  });
  return handleApiResponse(res, 'Failed to add email suppression');
}

export async function deleteEmailSuppressionApi(id: string): Promise<{ success: boolean }> {
  const headers = getAuthHeaders();
  const res = await fetch(`/api/proxy/email/suppressions/${id}`, {
    method: 'DELETE',
    headers,
  });
  return handleApiResponse(res, 'Failed to remove email suppression');
}

export async function getEmailPreferencesApi(): Promise<EmailPreferences> {
  const headers = getAuthHeaders();
  const res = await fetch('/api/proxy/email/preferences', { headers });
  return handleApiResponse(res, 'Failed to fetch email preferences');
}

export async function updateEmailPreferencesApi(
  dto: Partial<EmailPreferences>
): Promise<EmailPreferences> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch('/api/proxy/email/preferences', {
    method: 'PUT',
    headers,
    body: JSON.stringify(dto),
  });
  return handleApiResponse(res, 'Failed to update email preferences');
}

export async function getEmailAuditLogsApi(limit = 50): Promise<any[]> {
  const headers = getAuthHeaders();
  const res = await fetch(`/api/proxy/email/audit-logs?limit=${limit}`, { headers });
  return handleApiResponse(res, 'Failed to fetch email audit logs');
}

// Public Unsubscribe APIs (no auth header needed)
export async function getPublicUnsubscribeInfoApi(token: string): Promise<{
  email: string;
  isUnsubscribed: boolean;
  preferences: any;
}> {
  const res = await fetch(`/api/proxy/email/public/unsubscribe/${encodeURIComponent(token)}`);
  return handleApiResponse(res, 'Failed to retrieve unsubscribe information');
}

export async function executePublicUnsubscribeApi(
  token: string,
  unsubscribeAll = true,
  preferences?: any
): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/proxy/email/public/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, unsubscribeAll, preferences }),
  });
  return handleApiResponse(res, 'Failed to process unsubscribe request');
}

/* ──── AI Creative Design Studio APIs (Visual RAG & Generation) ──── */

export async function startStudioGenerationApi(
  input: StartStudioGenerationInput
): Promise<{ jobId: string; status: string; progressPct: number; message: string }> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch('/api/proxy/creative-generation/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
  return handleApiResponse(res, 'Failed to initiate AI Creative Studio generation');
}

export async function getStudioGenerationApi(
  jobId: string
): Promise<CreativeGeneration> {
  const headers = getAuthHeaders();
  const res = await fetch(`/api/proxy/creative-generation/jobs/${jobId}`, { headers });
  return handleApiResponse(res, 'Failed to fetch generation job status');
}

export function subscribeStudioProgressStream(
  jobId: string,
  onProgress: (event: any) => void,
  onComplete?: (variations?: CreativeVariation[]) => void,
  onError?: (err: any) => void
): () => void {
  let isCancelled = false;
  const controller = new AbortController();

  (async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/proxy/creative-generation/jobs/${jobId}/stream`, {
        headers,
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`SSE stream failed with status ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!isCancelled) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const match = line.match(/^data:\s*(.+)$/m);
          if (match) {
            try {
              const parsed = JSON.parse(match[1]);
              onProgress(parsed);
              if (parsed.status === 'COMPLETED' || parsed.progressPct >= 100) {
                if (onComplete) onComplete(parsed.variations);
              }
            } catch {}
          }
        }
      }
      if (onComplete) onComplete();
    } catch (err: any) {
      if (!isCancelled && onError) {
        onError(err);
      }
    }
  })();

  return () => {
    isCancelled = true;
    controller.abort();
  };
}

export async function refineStudioVariationApi(
  variationId: string,
  action: string,
  customCta?: string
): Promise<CreativeVariation> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/proxy/creative-generation/variations/${variationId}/refine`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, customCta }),
  });
  return handleApiResponse(res, 'Failed to apply design refinement');
}

export async function exportStudioCreativeApi(payload: {
  variationId: string;
  format: 'png' | 'jpg' | 'webp';
  platform?: string;
  customWidth?: number;
  customHeight?: number;
}): Promise<any> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch('/api/proxy/creative-export/export', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  return handleApiResponse(res, 'Failed to export creative');
}

export async function getBrandSmartDefaultsApi(
  brandId: string,
  options?: { platform?: string; designType?: string; objective?: string }
): Promise<SmartDefaultsResult> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/proxy/brand-intelligence/${brandId}/smart-defaults`, {
    method: 'POST',
    headers,
    body: JSON.stringify(options || {}),
  });
  return handleApiResponse(res, 'Failed to load smart defaults');
}

export async function listDesignReferencesApi(filters?: {
  industry?: string;
  style?: string;
  platform?: string;
  limit?: number;
}): Promise<DesignReference[]> {
  const params = new URLSearchParams();
  if (filters?.industry) params.set('industry', filters.industry);
  if (filters?.style) params.set('style', filters.style);
  if (filters?.platform) params.set('platform', filters.platform);
  if (filters?.limit) params.set('limit', String(filters.limit));

  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/proxy/design-references${qs}`);
  return handleApiResponse(res, 'Failed to fetch design references');
}

export async function createDesignReferenceApi(
  data: Partial<DesignReference>
): Promise<DesignReference> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch('/api/proxy/admin/design-references', {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return handleApiResponse(res, 'Failed to create design reference');
}

/* ──── Professional Design Studio Routes (/design-projects, /design-generations, /design-inspirations) ──── */

// 1. /design-projects
export async function listDesignProjectsApi(filters?: {
  status?: string;
  search?: string;
  clientFolder?: string;
  brandId?: string;
}): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.clientFolder) params.set('clientFolder', filters.clientFolder);
  if (filters?.brandId) params.set('brandId', filters.brandId);

  const qs = params.toString() ? `?${params.toString()}` : '';
  const headers = getAuthHeaders();
  const res = await fetch(`/api/proxy/design-projects${qs}`, { headers });
  return handleApiResponse(res, 'Failed to fetch design projects');
}

export async function getDesignProjectApi(id: string): Promise<any> {
  const headers = getAuthHeaders();
  const res = await fetch(`/api/proxy/design-projects/${id}`, { headers });
  return handleApiResponse(res, 'Failed to fetch design project details');
}

export async function createDesignProjectApi(dto: any): Promise<any> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch('/api/proxy/design-projects', {
    method: 'POST',
    headers,
    body: JSON.stringify(dto),
  });
  return handleApiResponse(res, 'Failed to create design project');
}

export async function updateDesignProjectApi(id: string, dto: any): Promise<any> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/proxy/design-projects/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(dto),
  });
  return handleApiResponse(res, 'Failed to update design project');
}

export async function duplicateDesignProjectApi(id: string): Promise<any> {
  const headers = getAuthHeaders();
  const res = await fetch(`/api/proxy/design-projects/${id}/duplicate`, {
    method: 'POST',
    headers,
  });
  return handleApiResponse(res, 'Failed to duplicate design project');
}

export async function deleteDesignProjectApi(id: string): Promise<{ deleted: boolean }> {
  const headers = getAuthHeaders();
  const res = await fetch(`/api/proxy/design-projects/${id}`, {
    method: 'DELETE',
    headers,
  });
  return handleApiResponse(res, 'Failed to delete design project');
}

export async function updateDesignProjectBrandApi(
  id: string,
  dto: { brandId?: string; brandName?: string; brandColors?: string[]; fontHeading?: string; fontBody?: string }
): Promise<any> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/proxy/design-projects/${id}/brand`, {
    method: 'POST',
    headers,
    body: JSON.stringify(dto),
  });
  return handleApiResponse(res, 'Failed to update design project brand');
}

export async function updateDesignProjectContentApi(
  id: string,
  dto: {
    objective?: string;
    mainTopic?: string;
    keyInfo?: string;
    headline?: string;
    subheadline?: string;
    cta?: string;
    offer?: string;
    price?: string;
    date?: string;
  }
): Promise<any> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/proxy/design-projects/${id}/content`, {
    method: 'POST',
    headers,
    body: JSON.stringify(dto),
  });
  return handleApiResponse(res, 'Failed to update design project content');
}

export async function searchDesignProjectInspirationApi(
  id: string,
  filters?: { query?: string; source?: string; style?: string; limit?: number }
): Promise<any[]> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/proxy/design-projects/${id}/inspiration/search`, {
    method: 'POST',
    headers,
    body: JSON.stringify(filters || {}),
  });
  return handleApiResponse(res, 'Failed to search project inspirations');
}

export async function generateDesignProjectConceptsApi(
  id: string,
  dto?: { customTopic?: string; style?: string }
): Promise<{ projectId: string; count: number; concepts: any[] }> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/proxy/design-projects/${id}/concepts`, {
    method: 'POST',
    headers,
    body: JSON.stringify(dto || {}),
  });
  return handleApiResponse(res, 'Failed to generate project concepts');
}

export async function generateDesignProjectRunApi(
  id: string,
  dto: {
    designType?: 'creative' | 'meta_ad';
    platform?: string;
    style?: string;
    headline?: string;
    subheadline?: string;
    cta?: string;
    offer?: string;
    productName?: string;
  }
): Promise<{ id: string; jobId: string; projectId: string; status: string; progressPct: number; currentStageLabel: string; message: string }> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/proxy/design-projects/${id}/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(dto),
  });
  return handleApiResponse(res, 'Failed to start project design generation');
}

export async function getDesignProjectGenerationsApi(id: string): Promise<any[]> {
  const headers = getAuthHeaders();
  const res = await fetch(`/api/proxy/design-projects/${id}/generations`, { headers });
  return handleApiResponse(res, 'Failed to fetch project generations');
}

// 2. /design-generations
export async function getStudioConfigApi(): Promise<StudioConfigResponse> {
  const headers = getAuthHeaders();
  const res = await fetch('/api/proxy/design-generations/config', { headers });
  return handleApiResponse(res, 'Failed to fetch studio configuration');
}

export async function createDesignGenerationApi(
  dto: StartStudioGenerationInput
): Promise<{ id: string; jobId: string; status: string; progressPct: number; message: string }> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch('/api/proxy/design-generations', {
    method: 'POST',
    headers,
    body: JSON.stringify(dto),
  });
  return handleApiResponse(res, 'Failed to start design generation');
}

export async function getDesignGenerationApi(id: string): Promise<CreativeGeneration> {
  const headers = getAuthHeaders();
  const res = await fetch(`/api/proxy/design-generations/${id}`, { headers });
  return handleApiResponse(res, 'Failed to fetch design generation status');
}

export async function getDesignConceptsApi(id: string): Promise<{ count: number; concepts: any[] }> {
  const headers = getAuthHeaders();
  const res = await fetch(`/api/proxy/design-generations/${id}/concepts`, { headers });
  return handleApiResponse(res, 'Failed to fetch design concepts');
}

export async function selectDesignConceptApi(id: string, conceptId: string): Promise<any> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/proxy/design-generations/${id}/select-concept`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ conceptId }),
  });
  return handleApiResponse(res, 'Failed to select design concept');
}

export async function editDesignVariationApi(
  variationId: string,
  action: AiDesignEditAction,
  options?: { customCta?: string; customImage?: string }
): Promise<{ success: boolean; variation: CreativeVariation }> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/proxy/design-generations/variations/${variationId}/edit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, ...options }),
  });
  return handleApiResponse(res, 'Failed to apply promptless AI edit');
}

export async function adaptDesignPlatformApi(
  variationId: string,
  targetPlatform: string
): Promise<{ success: boolean; targetPlatform: string; appliedAdjustments: string[]; adaptedVariation: CreativeVariation }> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/proxy/design-generations/variations/${variationId}/adapt`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ targetPlatform }),
  });
  return handleApiResponse(res, 'Failed to adapt design to platform');
}

export async function validateDesignGenerationApi(id: string): Promise<any> {
  const headers = getAuthHeaders();
  const res = await fetch(`/api/proxy/design-generations/${id}/validate`, {
    method: 'POST',
    headers,
  });
  return handleApiResponse(res, 'Failed to validate design generation');
}

export async function applyDesignGenerationVariationApi(
  id: string,
  action: AiDesignEditAction,
  options?: { customCta?: string; customImage?: string }
): Promise<{ success: boolean; action: string; variation: any }> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/proxy/design-generations/${id}/variation`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, ...options }),
  });
  return handleApiResponse(res, 'Failed to apply design variation');
}

export async function adaptDesignGenerationApi(
  id: string,
  targetPlatform: string
): Promise<{ success: boolean; targetPlatform: string; appliedAdjustments: string[]; adaptedVariation: any }> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/proxy/design-generations/${id}/adapt`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ targetPlatform }),
  });
  return handleApiResponse(res, 'Failed to adapt design generation');
}

export async function getDesignValidationReportApi(variationId: string): Promise<any> {
  const headers = getAuthHeaders();
  const res = await fetch(`/api/proxy/design-generations/variations/${variationId}/validation`, { headers });
  return handleApiResponse(res, 'Failed to fetch design validation report');
}

export async function exportDesignVariationApi(
  variationId: string,
  format: 'png' | 'jpg' | 'webp' = 'png',
  scale: number = 1,
  targetPlatform?: string,
  organizationId?: string
): Promise<{ success: boolean; export: any; downloadUrl: string }> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/proxy/design-generations/variations/${variationId}/export`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ format, scale, targetPlatform, organizationId }),
  });
  return handleApiResponse(res, 'Failed to export design variation');
}

export async function approveDesignVariationApi(variationId: string): Promise<{ success: boolean; message: string; variation: CreativeVariation }> {
  const headers = getAuthHeaders();
  const res = await fetch(`/api/proxy/design-generations/variations/${variationId}/approve`, {
    method: 'POST',
    headers,
  });
  return handleApiResponse(res, 'Failed to approve design variation');
}

export function subscribeDesignGenerationStream(
  id: string,
  onProgress: (event: any) => void,
  onComplete?: (variations?: any[]) => void,
  onError?: (err: any) => void
): () => void {
  let isCancelled = false;
  const controller = new AbortController();

  (async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/proxy/design-generations/${id}/stream`, {
        headers,
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`SSE stream failed with status ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!isCancelled) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const match = line.match(/^data:\s*(.+)$/m);
          if (match) {
            try {
              const parsed = JSON.parse(match[1]);
              onProgress(parsed);
              if (parsed.status === 'COMPLETED' || parsed.progressPct >= 100) {
                if (onComplete) onComplete(parsed.variations);
              }
            } catch {}
          }
        }
      }
      if (onComplete) onComplete();
    } catch (err: any) {
      if (!isCancelled && onError) {
        onError(err);
      }
    }
  })();

  return () => {
    isCancelled = true;
    controller.abort();
  };
}

// 3. /design-inspirations
export async function searchDesignInspirationsApi(filters?: {
  query?: string;
  source?: string;
  industry?: string;
  style?: string;
  platform?: string;
  designType?: string;
  limit?: number;
}): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.query) params.set('query', filters.query);
  if (filters?.source) params.set('source', filters.source);
  if (filters?.industry) params.set('industry', filters.industry);
  if (filters?.style) params.set('style', filters.style);
  if (filters?.platform) params.set('platform', filters.platform);
  if (filters?.designType) params.set('designType', filters.designType);
  if (filters?.limit) params.set('limit', String(filters.limit));

  const qs = params.toString() ? `?${params.toString()}` : '';
  const headers = getAuthHeaders();
  const res = await fetch(`/api/proxy/design-inspirations${qs}`, { headers });
  return handleApiResponse(res, 'Failed to search design inspirations');
}

export async function getTrendingDesignInspirationsApi(limit: number = 12): Promise<any[]> {
  const headers = getAuthHeaders();
  const res = await fetch(`/api/proxy/design-inspirations/trending?limit=${limit}`, { headers });
  return handleApiResponse(res, 'Failed to fetch trending inspirations');
}

export async function getDesignInspirationDetailsApi(id: string): Promise<any> {
  const headers = getAuthHeaders();
  const res = await fetch(`/api/proxy/design-inspirations/${id}`, { headers });
  return handleApiResponse(res, 'Failed to fetch inspiration details');
}

export async function extractDesignFeaturesApi(imageUrl: string): Promise<any> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch('/api/proxy/design-inspirations/extract', {
    method: 'POST',
    headers,
    body: JSON.stringify({ imageUrl }),
  });
  return handleApiResponse(res, 'Failed to extract design features');
}

export async function saveDesignInspirationToBoardApi(
  referenceId: string,
  boardName?: string
): Promise<any> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch('/api/proxy/design-inspirations/save', {
    method: 'POST',
    headers,
    body: JSON.stringify({ referenceId, boardName }),
  });
  return handleApiResponse(res, 'Failed to save inspiration to board');
}

export async function indexDesignInspirationApi(dto: any): Promise<any> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch('/api/proxy/design-inspirations/index', {
    method: 'POST',
    headers,
    body: JSON.stringify(dto),
  });
  return handleApiResponse(res, 'Failed to index design inspiration');
}

export async function embedDesignInspirationApi(dto: { text: string; visualText?: string }): Promise<any> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch('/api/proxy/design-inspirations/embed', {
    method: 'POST',
    headers,
    body: JSON.stringify(dto),
  });
  return handleApiResponse(res, 'Failed to embed design inspiration');
}







