import {
  AuthResponse,
  BillingSummary,
  BrandProfile,
  CreateStyleReferenceInput,
  ExtractedBrandData,
  GeneratePostResponse,
  GuidedPostInput,
  HealthResponse,
  NotificationItem,
  Post,
  ProductAnalysisResult,
  PromptPreviewResponse,
  RagCorpusStats,
  RemoveBackgroundOptions,
  RemoveBackgroundResponse,
  StyleReference,
  StyleReferenceListResponse,
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

/* ================= IMAGE EDITING & APPROVAL ================= */

/**
 * IMAGE EDITING.
 *
 * Sends the user's natural-language change request to the backend, which
 * combines it with the existing creative and asks Gemini for a revised image
 * (the image itself is already stored server-side, so nothing is re-uploaded).
 * Returns the new post, linked to its parent via `parentPostId`.
 */
export async function editPostImage(
  postId: string,
  instructions: string,
): Promise<Post> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });

  let res: Response;
  try {
    res = await fetch(`/api/proxy/posts/${postId}/edit`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ instructions }),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/posts/${postId}/edit`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ instructions }),
    });
  }

  const data = await handleApiResponse(res, 'Failed to apply the edit');
  return {
    ...data,
    imageUrl: resolveImageUrl(data.imageUrl),
    originalImageUrl: resolveImageUrl(data.originalImageUrl),
  };
}

/**
 * APPROVE → VECTOR KNOWLEDGE BASE.
 *
 * Marks the creative as approved, which embeds it and promotes it into the RAG
 * knowledge base so it is retrieved as a style reference on future generations.
 * Pass `false` to withdraw approval and remove it from the pool.
 */
export async function approvePost(
  postId: string,
  approved = true,
): Promise<Post> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });

  let res: Response;
  try {
    res = await fetch(`/api/proxy/posts/${postId}/approve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ approved }),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/posts/${postId}/approve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ approved }),
    });
  }

  const data = await handleApiResponse(res, 'Failed to update approval');
  return {
    ...data,
    imageUrl: resolveImageUrl(data.imageUrl),
    originalImageUrl: resolveImageUrl(data.originalImageUrl),
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
  // On-image text overlay. When empty, the backend renders a letter-free image.
  if (input.onImageText) fd.append('onImageText', input.onImageText);
  if (input.onImageTextFont) fd.append('onImageTextFont', input.onImageTextFont);
  if (input.onImageTextPlacement) {
    fd.append('onImageTextPlacement', input.onImageTextPlacement);
  }
  if (input.onImageTextColor) fd.append('onImageTextColor', input.onImageTextColor);
  // Brand logo + contact details
  if (input.showLogo !== undefined) fd.append('showLogo', String(input.showLogo));
  if (input.logoUrl) fd.append('logoUrl', input.logoUrl);
  if (input.showContact !== undefined) fd.append('showContact', String(input.showContact));
  if (input.contactEmail) fd.append('contactEmail', input.contactEmail);
  if (input.contactPhone) fd.append('contactPhone', input.contactPhone);
  if (input.contactPlacement) fd.append('contactPlacement', input.contactPlacement);
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



/* ================= STYLE REFERENCE LIBRARY / RAG ================= */

/**
 * Uploads a reference image to the Style Reference Library.
 *
 * The backend runs Gemini Vision over the picture to write its design
 * language in words, embeds it, and makes it retrievable for the very next
 * generation. `makeGlobal` is honoured only for admins.
 */
export async function createStyleReferenceApi(
  input: CreateStyleReferenceInput,
): Promise<StyleReference> {
  const fd = new FormData();
  fd.append('file', input.file);
  if (input.title) fd.append('title', input.title);
  if (input.notes) fd.append('notes', input.notes);
  if (input.category) fd.append('category', input.category);
  if (input.tags) fd.append('tags', input.tags);
  if (input.hint) fd.append('hint', input.hint);
  if (input.makeGlobal) fd.append('makeGlobal', 'true');

  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch('/api/proxy/style-references', { method: 'POST', headers, body: fd });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/style-references`, {
      method: 'POST',
      headers,
      body: fd,
    });
  }

  return handleApiResponse(res, 'Failed to upload the style reference');
}

export async function getStyleReferencesApi(
  params: { scope?: 'all' | 'global' | 'mine'; category?: string; search?: string } = {},
): Promise<StyleReferenceListResponse> {
  const qs = new URLSearchParams();
  if (params.scope) qs.set('scope', params.scope);
  if (params.category) qs.set('category', params.category);
  if (params.search) qs.set('search', params.search);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';

  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`/api/proxy/style-references${suffix}`, { headers, cache: 'no-store' });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/style-references${suffix}`, {
      headers,
      cache: 'no-store',
    });
  }

  return handleApiResponse(res, 'Failed to load style references');
}

export async function getRagStatsApi(): Promise<RagCorpusStats> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch('/api/proxy/style-references/stats', { headers, cache: 'no-store' });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/style-references/stats`, {
      headers,
      cache: 'no-store',
    });
  }
  return handleApiResponse(res, 'Failed to load RAG statistics');
}


export async function updateStyleReferenceApi(
  id: string,
  patch: { title?: string; notes?: string; category?: string; tags?: string; isActive?: string },
): Promise<StyleReference> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch(`/api/proxy/style-references/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(patch),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/style-references/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(patch),
    });
  }
  return handleApiResponse(res, 'Failed to update the style reference');
}

export async function deleteStyleReferenceApi(id: string): Promise<void> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`/api/proxy/style-references/${id}`, { method: 'DELETE', headers });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/style-references/${id}`, {
      method: 'DELETE',
      headers,
    });
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to delete the style reference');
  }
}

/** Admin-only: promote/demote an entry between the global pool and private. */
export async function setStyleReferenceScopeApi(
  id: string,
  makeGlobal: boolean,
): Promise<StyleReference> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch(`/api/proxy/style-references/${id}/scope`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ makeGlobal }),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/style-references/${id}/scope`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ makeGlobal }),
    });
  }
  return handleApiResponse(res, 'Failed to change the reference scope');
}

/**
 * Admin-only: seeds the built-in curated global knowledge base.
 * This is the UI replacement for `node scripts/seed-sample-posts.cjs`.
 */
export async function seedStarterLibraryApi(): Promise<{
  created: number;
  skipped: number;
  failed: number;
}> {
  const headers = getAuthHeaders();
  let res: Response;
  try {
    res = await fetch('/api/proxy/style-references/seed-starter-library', { method: 'POST', headers });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/style-references/seed-starter-library`, {
      method: 'POST',
      headers,
    });
  }
  return handleApiResponse(res, 'Failed to seed the starter library');
}

/** Admin-only: recomputes embeddings for entries that have none. */
export async function reindexStyleReferencesApi(force = false): Promise<{
  processed: number;
  failed: number;
}> {
  const headers = getAuthHeaders();
  const suffix = force ? '?force=true' : '';
  let res: Response;
  try {
    res = await fetch(`/api/proxy/style-references/reindex${suffix}`, { method: 'POST', headers });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/style-references/reindex${suffix}`, {
      method: 'POST',
      headers,
    });
  }
  return handleApiResponse(res, 'Failed to reindex the knowledge base');
}

/**
 * PROMPT LAB — returns the exact Stage-1 and Stage-2 prompts plus the RAG
 * retrieval trace for a brief, without generating an image or spending credit.
 */
export async function previewPromptApi(
  brief: Partial<GuidedPostInput>,
): Promise<PromptPreviewResponse> {
  const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
  let res: Response;
  try {
    res = await fetch('/api/proxy/posts/preview-prompt', {
      method: 'POST',
      headers,
      body: JSON.stringify(brief),
    });
  } catch {
    res = await fetch(`${getDirectBackendOrigin()}/api/posts/preview-prompt`, {
      method: 'POST',
      headers,
      body: JSON.stringify(brief),
    });
  }
  return handleApiResponse(res, 'Failed to preview the prompt');
}

