import { BrandConfig, BrandCacheEntry } from '@/types/brand';

/**
 * Production-ready default SocialYolo branding.
 * Always available as a zero-dependency local fallback.
 */
export const DEFAULT_BRAND_CONFIG: BrandConfig = {
  name: 'SocialYolo',
  shortName: 'SocialYolo',
  description: 'AI Social Media Studio & Post Generator',
  logo: '',
  logoLight: '',
  logoDark: '',
  favicon: '/favicon.ico',
  sidebarLogo: '',
  sidebarIcon: '',
  primaryColor: '#6366f1',
  secondaryColor: '#a855f7',
  websiteUrl: 'https://socialyolo.ai',
  supportUrl: 'https://socialyolo.ai/support',
  headerDisplayMode: 'logo_title_tagline',
  headerCtaMode: 'both',
  showLogo: true,
  showTitle: true,
  showTagline: true,
};

// Security denylist: Remote brand configurations MUST NOT configure these properties
const FORBIDDEN_SECURITY_KEYS = new Set([
  'api',
  'apibaseurl',
  'apiurl',
  'auth',
  'authorization',
  'authprovider',
  'backend',
  'backendurl',
  'database',
  'databaseurl',
  'jwt',
  'oauth',
  'password',
  'permissions',
  'proxy',
  'proxyurl',
  'rbac',
  'redirect',
  'redirecturl',
  'role',
  'roles',
  'secret',
  'token',
  'user',
  'users',
]);

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const FETCH_TIMEOUT_MS = 3500; // 3.5 seconds

// In-memory cache for ultra-fast, zero-overhead retrieval across component renders
let memoryCachedConfig: BrandConfig | null = null;
let memoryCachedUrl: string | null = null;
let memoryCacheExpiry: number = 0;

/**
 * Validates whether a given string is a safe HTTP(S) URL or safe relative path.
 * Strictly prevents javascript:, vbscript:, and data: HTML exploits.
 */
export function isSafeUrl(rawUrl: unknown): boolean {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return false;
  const trimmed = rawUrl.trim();

  // Allow relative asset paths like /assets/logo.svg
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\')) {
    return true;
  }

  // Allow safe data URIs for images only (e.g. data:image/png;base64,...)
  if (/^data:image\/(png|jpe?g|svg\+xml|webp|gif|x-icon);base64,[a-zA-Z0-9+/=]+$/.test(trimmed)) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Validates a color string to ensure it is a safe hex, rgb, or hsl value.
 * Prevents arbitrary CSS injection via color properties.
 */
export function isSafeColor(color: unknown): boolean {
  if (typeof color !== 'string' || !color.trim()) return false;
  const trimmed = color.trim();
  // Safe hex color: #RGB, #RRGGBB, #RRGGBBAA
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
    return true;
  }
  // Safe rgb/rgba/hsl/hsla syntax
  if (/^(rgb|hsl)a?\(\s*[\d.%\s,/-]+\s*\)$/i.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * Validates and sanitizes untrusted remote brand configuration data.
 * Guarantees correct types, strips security keys, and falls back to defaults for missing/invalid properties.
 */
export function validateBrandConfig(data: unknown): BrandConfig {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ...DEFAULT_BRAND_CONFIG };
  }

  const raw = data as Record<string, unknown>;
  const clean: BrandConfig = { ...DEFAULT_BRAND_CONFIG };

  // 1. Validate display text fields
  if (typeof raw.name === 'string' && raw.name.trim()) {
    clean.name = raw.name.trim().slice(0, 100);
  }
  if (typeof raw.shortName === 'string' && raw.shortName.trim()) {
    clean.shortName = raw.shortName.trim().slice(0, 50);
  } else {
    clean.shortName = clean.name;
  }
  if (typeof raw.description === 'string' && raw.description.trim()) {
    clean.description = raw.description.trim().slice(0, 300);
  }

  // 2. Validate URLs with strict protocol verification
  const urlKeys: Array<keyof BrandConfig> = [
    'logo',
    'logoLight',
    'logoDark',
    'favicon',
    'sidebarLogo',
    'sidebarIcon',
    'websiteUrl',
    'supportUrl',
  ];

  for (const key of urlKeys) {
    const val = raw[key];
    if (typeof val === 'string' && isSafeUrl(val)) {
      clean[key] = val.trim();
    }
  }

  // 3. Validate color codes
  if (isSafeColor(raw.primaryColor)) {
    clean.primaryColor = (raw.primaryColor as string).trim();
  }
  if (isSafeColor(raw.secondaryColor)) {
    clean.secondaryColor = (raw.secondaryColor as string).trim();
  }

  // 4. Validate header display concepts & actions
  if (
    raw.headerDisplayMode === 'logo_only' ||
    raw.headerDisplayMode === 'logo_title' ||
    raw.headerDisplayMode === 'logo_title_tagline'
  ) {
    clean.headerDisplayMode = raw.headerDisplayMode;
  }
  if (
    raw.headerCtaMode === 'both' ||
    raw.headerCtaMode === 'get_started_only' ||
    raw.headerCtaMode === 'sign_in_only'
  ) {
    clean.headerCtaMode = raw.headerCtaMode;
  }
  if (typeof raw.showLogo === 'boolean') clean.showLogo = raw.showLogo;
  if (typeof raw.showTitle === 'boolean') clean.showTitle = raw.showTitle;
  if (typeof raw.showTagline === 'boolean') clean.showTagline = raw.showTagline;

  // 5. Preserve any safe custom branding metadata while strictly stripping security keys
  for (const [key, val] of Object.entries(raw)) {
    const lowerKey = key.toLowerCase();
    if (FORBIDDEN_SECURITY_KEYS.has(lowerKey)) {
      continue; // Block security-sensitive keys
    }
    if (!(key in clean)) {
      if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        clean[key] = val;
      }
    }
  }

  return clean;
}

/**
 * Determines the target brand config URL for a given application URL or hostname.
 */
export function determineBrandSourceUrl(currentUrl?: string): string | null {
  let hostname = '';
  if (currentUrl) {
    try {
      hostname = new URL(currentUrl, 'http://localhost').hostname.toLowerCase();
    } catch {
      // Fallback
      hostname = '';
    }
  } else if (typeof window !== 'undefined' && window.location) {
    hostname = window.location.hostname.toLowerCase();
  }

  // Check optional domain-to-config mapping (JSON string in env)
  const mappingJson = process.env.NEXT_PUBLIC_BRAND_CONFIG_MAP;
  if (mappingJson && hostname) {
    try {
      const map = JSON.parse(mappingJson);
      if (map && typeof map === 'object' && map[hostname] && isSafeUrl(map[hostname])) {
        return map[hostname];
      }
    } catch {
      // Ignore JSON parse error in mapping
    }
  }

  // Check base brand config URL
  const configUrl = process.env.NEXT_PUBLIC_BRAND_CONFIG_URL || process.env.BRAND_CONFIG_URL;
  if (configUrl && typeof configUrl === 'string' && configUrl.trim()) {
    let resolved = configUrl.trim();
    // Template pattern support: e.g. https://configs.example.com/brands/{hostname}.json
    if (resolved.includes('{hostname}') && hostname) {
      resolved = resolved.replace(/\{hostname\}/g, encodeURIComponent(hostname));
    }
    if (isSafeUrl(resolved)) {
      return resolved;
    }
  }

  return null;
}

/**
 * Retrieves the cached brand configuration from browser storage if valid.
 */
function getStorageCache(hostname: string): BrandConfig | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(`socialyolo_brand_cache_${hostname}`);
    if (!raw) return null;
    const entry: BrandCacheEntry = JSON.parse(raw);
    if (entry && entry.config && typeof entry.expiresAt === 'number') {
      if (Date.now() < entry.expiresAt) {
        return entry.config;
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return null;
}

/**
 * Saves a resolved brand configuration to browser storage with TTL.
 */
function setStorageCache(hostname: string, config: BrandConfig) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const entry: BrandCacheEntry = {
      config,
      hostname,
      cachedAt: Date.now(),
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    window.localStorage.setItem(`socialyolo_brand_cache_${hostname}`, JSON.stringify(entry));
  } catch {
    // Ignore storage quota or disabled errors
  }
}

/**
 * Dedicated Brand Service with complete lifecycle management.
 */
export class BrandService {
  private static readonly CUSTOM_BRANDING_KEY = 'socialyolo_custom_branding';

  /**
   * Retrieves any user-configured brand settings saved via the Settings page.
   */
  public static getCustomBrandConfig(): Partial<BrandConfig> | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const raw = window.localStorage.getItem(BrandService.CUSTOM_BRANDING_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Saves user-configured brand settings (logo, name, tagline, display concepts)
   * immediately into local storage and synchronizes memory caches & events.
   */
  public static saveBrandConfig(updates: Partial<BrandConfig>): BrandConfig {
    const current = BrandService.getBrandConfig();
    const merged: BrandConfig = { ...current, ...updates };
    const validated = validateBrandConfig(merged);

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(
          BrandService.CUSTOM_BRANDING_KEY,
          JSON.stringify(validated)
        );
      } catch (err) {
        console.warn('[BrandService] Failed to persist custom brand config', err);
      }
    }

    memoryCachedConfig = validated;
    memoryCacheExpiry = Date.now() + CACHE_TTL_MS;
    BrandService.applyBrandConfig(validated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('brand-config-updated', { detail: validated }));
    }

    return validated;
  }

  /**
   * Resets custom branding back to default SocialYolo branding.
   */
  public static resetBrandConfig(): BrandConfig {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(BrandService.CUSTOM_BRANDING_KEY);
      } catch {
        // ignore
      }
    }
    BrandService.clearCache();
    memoryCachedConfig = { ...DEFAULT_BRAND_CONFIG };
    memoryCacheExpiry = Date.now() + CACHE_TTL_MS;
    BrandService.applyBrandConfig(DEFAULT_BRAND_CONFIG);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('brand-config-updated', { detail: DEFAULT_BRAND_CONFIG }));
    }

    return { ...DEFAULT_BRAND_CONFIG };
  }

  /**
   * Returns the currently active brand configuration from memory or default fallback.
   */
  public static getBrandConfig(): BrandConfig {
    if (memoryCachedConfig) {
      return memoryCachedConfig;
    }
    const custom = BrandService.getCustomBrandConfig();
    if (custom) {
      memoryCachedConfig = validateBrandConfig({ ...DEFAULT_BRAND_CONFIG, ...custom });
      return memoryCachedConfig;
    }
    return { ...DEFAULT_BRAND_CONFIG };
  }

  /**
   * Resolves brand configuration by current application URL:
   * 1. Parses current origin/hostname.
   * 2. Checks multi-tier cache (memory & localStorage).
   * 3. Determines configured brand source URL.
   * 4. Fetches and validates brand JSON with timeout and failure resilience.
   * 5. Applies branding globally and updates caches.
   */
  public static async resolveBrandConfig(currentUrl?: string): Promise<BrandConfig> {
    let hostname = 'default';
    if (currentUrl) {
      try {
        hostname = new URL(currentUrl, 'http://localhost').hostname.toLowerCase();
      } catch {
        hostname = 'default';
      }
    } else if (typeof window !== 'undefined' && window.location) {
      hostname = window.location.hostname.toLowerCase();
    }

    const custom = BrandService.getCustomBrandConfig();

    // 1. Memory Cache check
    if (memoryCachedConfig && memoryCacheExpiry > Date.now()) {
      return custom ? validateBrandConfig({ ...memoryCachedConfig, ...custom }) : memoryCachedConfig;
    }

    // 2. Storage Cache check
    const storedConfig = getStorageCache(hostname);
    if (storedConfig) {
      const merged = custom ? validateBrandConfig({ ...storedConfig, ...custom }) : storedConfig;
      memoryCachedConfig = merged;
      memoryCacheExpiry = Date.now() + CACHE_TTL_MS;
      BrandService.applyBrandConfig(merged);
      return merged;
    }

    // 3. Determine target URL
    const targetUrl = determineBrandSourceUrl(currentUrl);
    if (!targetUrl) {
      // No custom brand config URL configured -> use local default merged with user custom settings
      const merged = custom ? validateBrandConfig({ ...DEFAULT_BRAND_CONFIG, ...custom }) : { ...DEFAULT_BRAND_CONFIG };
      memoryCachedConfig = merged;
      memoryCacheExpiry = Date.now() + CACHE_TTL_MS;
      BrandService.applyBrandConfig(merged);
      return merged;
    }

    // 4. Fetch remote brand configuration with timeout
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        cache: 'no-cache',
      });
      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      const validated = validateBrandConfig(json);
      const merged = custom ? validateBrandConfig({ ...validated, ...custom }) : validated;

      // 5. Update caches
      memoryCachedConfig = merged;
      memoryCachedUrl = targetUrl;
      memoryCacheExpiry = Date.now() + CACHE_TTL_MS;
      setStorageCache(hostname, merged);

      // 6. Apply branding globally
      BrandService.applyBrandConfig(merged);
      return merged;
    } catch (err: any) {
      // Graceful failure fallback: Never crash the application on branding errors
      console.warn(
        `[BrandService] Failed to retrieve brand config from "${targetUrl}" (${err?.message || 'unknown'}). Falling back to default branding.`
      );

      // Use user custom or storage cache if available, else local default
      const fallbackConfig = custom
        ? validateBrandConfig({ ...DEFAULT_BRAND_CONFIG, ...custom })
        : storedConfig || { ...DEFAULT_BRAND_CONFIG };
      memoryCachedConfig = fallbackConfig;
      memoryCacheExpiry = Date.now() + 60000; // brief 1m retry backoff on failure
      BrandService.applyBrandConfig(fallbackConfig);
      return fallbackConfig;
    }
  }

  /**
   * Dynamically updates the browser favicon (<link rel="icon">).
   * Replaces existing favicon elements without creating duplicates.
   */
  public static updateFavicon(faviconUrl?: string): void {
    if (typeof document === 'undefined') return;

    const targetUrl = isSafeUrl(faviconUrl) ? faviconUrl! : DEFAULT_BRAND_CONFIG.favicon || '/favicon.ico';

    try {
      const head = document.head || document.getElementsByTagName('head')[0];
      if (!head) return;

      // Find all existing favicon link tags
      const existingLinks = Array.from(head.querySelectorAll("link[rel*='icon']")) as HTMLLinkElement[];

      if (existingLinks.length > 0) {
        // Safely update href on all existing icon links without removing DOM nodes managed by Next.js
        for (const link of existingLinks) {
          if (link.href !== targetUrl) {
            link.href = targetUrl;
          }
        }
      } else {
        let dynamicLink = document.getElementById('dynamic-favicon') as HTMLLinkElement | null;
        if (!dynamicLink) {
          dynamicLink = document.createElement('link');
          dynamicLink.id = 'dynamic-favicon';
          dynamicLink.rel = 'icon';
          head.appendChild(dynamicLink);
        }
        if (dynamicLink.href !== targetUrl) {
          dynamicLink.href = targetUrl;
        }
      }
    } catch {
      // Ignore DOM exceptions during SSR or testing
    }
  }

  /**
   * Applies the brand configuration globally to the document DOM (favicon, CSS variables, etc.).
   */
  public static applyBrandConfig(config: BrandConfig): void {
    if (typeof document === 'undefined') return;

    // 1. Update Favicon
    BrandService.updateFavicon(config.favicon);

    // 2. Inject Dynamic CSS Variables if colors are provided
    try {
      const root = document.documentElement;
      if (config.primaryColor) {
        root.style.setProperty('--brand-primary-dynamic', config.primaryColor);
      }
      if (config.secondaryColor) {
        root.style.setProperty('--brand-secondary-dynamic', config.secondaryColor);
      }
    } catch {
      // Ignore styling exceptions
    }
  }

  /**
   * Clears in-memory and local storage caches (useful for testing or manual refresh).
   */
  public static clearCache(): void {
    memoryCachedConfig = null;
    memoryCachedUrl = null;
    memoryCacheExpiry = 0;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const keys = Object.keys(window.localStorage);
        for (const k of keys) {
          if (k.startsWith('socialyolo_brand_cache_')) {
            window.localStorage.removeItem(k);
          }
        }
      } catch {
        // Ignore
      }
    }
  }
}
