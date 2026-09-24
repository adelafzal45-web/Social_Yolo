/**
 * Social Yolo — Centralized Application Branding & Identity Configuration
 *
 * Provides a single, configurable source for logos, icons, application names,
 * and favicons across all components, sidebars, and themes.
 */

export interface AppBrandingConfig {
  appName: string;
  appShortName: string;
  tagline: string;
  logo: {
    /** Optional custom image logo URL (e.g. '/brand/logo.png') */
    src?: string;
    /** Optional dedicated dark mode image logo */
    darkSrc?: string;
    /** Optional dedicated light mode image logo */
    lightSrc?: string;
    /** Brand display title */
    title: string;
    /** Brand display highlight or subtitle */
    highlight: string;
    /** Secondary badge or studio label */
    badge: string;
  };
  sidebar: {
    /** Text initials or fallback symbol */
    collapsedInitials: string;
    /** Optional custom image icon for collapsed sidebar */
    collapsedIconSrc?: string;
  };
  favicon: {
    default: string;
    svg: string;
    dark?: string;
    light?: string;
  };
}

export const brandingConfig: AppBrandingConfig = {
  appName: 'Social Yolo AI',
  appShortName: 'Social Yolo',
  tagline: 'Creative AI Studio',
  logo: {
    // Leave undefined to use the default high-performance SVG gradient icon
    src: undefined,
    darkSrc: undefined,
    lightSrc: undefined,
    title: 'Social Yolo',
    highlight: 'AI',
    badge: 'Creative Studio',
  },
  sidebar: {
    collapsedInitials: 'SY',
    collapsedIconSrc: undefined,
  },
  favicon: {
    default: '/favicon.svg',
    svg: '/favicon.svg',
    dark: '/favicon.svg',
    light: '/favicon.svg',
  },
};

export function getBranding(): AppBrandingConfig {
  return brandingConfig;
}
