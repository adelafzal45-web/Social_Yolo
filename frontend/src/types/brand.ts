/**
 * Brand Configuration Schema for SocialYolo Dynamic Branding System
 */

export type HeaderDisplayMode = 'logo_only' | 'logo_title' | 'logo_title_tagline';
export type HeaderCtaMode = 'both' | 'get_started_only' | 'sign_in_only';

export interface BrandConfig {
  /** Application display name (e.g. "SocialYolo") */
  name: string;
  /** Short or compact name for badges and space-constrained areas */
  shortName?: string;
  /** Brand tagline or description */
  description?: string;
  /** Main logo URL */
  logo?: string;
  /** Light-theme logo URL (used when light theme is active) */
  logoLight?: string;
  /** Dark-theme logo URL (used when dark theme is active) */
  logoDark?: string;
  /** Browser favicon URL */
  favicon?: string;
  /** Sidebar logo URL (expanded navigation header) */
  sidebarLogo?: string;
  /** Sidebar icon URL (collapsed navigation header or favicon fallback) */
  sidebarIcon?: string;
  /** Primary accent color (hex or CSS color string) */
  primaryColor?: string;
  /** Secondary accent color (hex or CSS color string) */
  secondaryColor?: string;
  /** Public marketing or brand website */
  websiteUrl?: string;
  /** Help center or customer support URL */
  supportUrl?: string;
  /**
   * Header branding display style:
   * - 'logo_only': Only show the logo badge/image (title and tagline are hidden)
   * - 'logo_title': Show the logo and the title name (tagline is hidden)
   * - 'logo_title_tagline': Show logo, title name, and tagline (full)
   */
  headerDisplayMode?: HeaderDisplayMode;
  /** Header CTA button style: 'both' | 'get_started_only' | 'sign_in_only' */
  headerCtaMode?: HeaderCtaMode;
  /** Explicit visibility toggles */
  showLogo?: boolean;
  showTitle?: boolean;
  showTagline?: boolean;
  /** Additional custom brand attributes */
  [key: string]: any;
}

export interface BrandCacheEntry {
  config: BrandConfig;
  hostname: string;
  cachedAt: number;
  expiresAt: number;
}
