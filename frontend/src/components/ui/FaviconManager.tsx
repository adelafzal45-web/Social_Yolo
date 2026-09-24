'use client';

import { useEffect } from 'react';
import { brandingConfig } from '@/config/branding.config';
import { useTheme } from '@/context/ThemeContext';

/**
 * Dynamically updates document favicon based on branding configuration
 * and user theme mode without hardcoding inside multiple components.
 */
export function FaviconManager() {
  const { isDark } = useTheme();

  useEffect(() => {
    const faviconUrl = isDark
      ? brandingConfig.favicon.dark || brandingConfig.favicon.default
      : brandingConfig.favicon.light || brandingConfig.favicon.default;

    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }, [isDark]);

  return null;
}
