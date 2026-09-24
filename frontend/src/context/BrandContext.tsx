'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { BrandConfig } from '@/types/brand';
import { BrandService, DEFAULT_BRAND_CONFIG } from '@/lib/brandService';
import { useTheme } from './ThemeContext';

interface BrandContextType {
  brand: BrandConfig;
  isLoading: boolean;
  isCustomBrand: boolean;
  activeLogo: string;
  activeSidebarLogo: string;
  activeSidebarIcon: string;
  refreshBrand: () => Promise<void>;
  updateBrand: (updates: Partial<BrandConfig>) => Promise<BrandConfig>;
  resetBrand: () => Promise<BrandConfig>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  const [brand, setBrand] = useState<BrandConfig>(() => BrandService.getBrandConfig());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadBrand = useCallback(async () => {
    setIsLoading(true);
    try {
      const resolved = await BrandService.resolveBrandConfig(
        typeof window !== 'undefined' ? window.location.href : undefined
      );
      setBrand(resolved);
    } catch {
      setBrand({ ...DEFAULT_BRAND_CONFIG });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBrand();

    // Listen for custom brand updates across tabs / components
    const handleBrandConfigUpdated = (e: any) => {
      if (e?.detail) {
        setBrand(e.detail);
      } else {
        loadBrand();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('brand-config-updated', handleBrandConfigUpdated);
      return () => {
        window.removeEventListener('brand-config-updated', handleBrandConfigUpdated);
      };
    }
  }, [loadBrand]);

  const updateBrand = useCallback(async (updates: Partial<BrandConfig>): Promise<BrandConfig> => {
    const updated = BrandService.saveBrandConfig(updates);
    setBrand(updated);
    return updated;
  }, []);

  const resetBrand = useCallback(async (): Promise<BrandConfig> => {
    const reset = BrandService.resetBrandConfig();
    setBrand(reset);
    return reset;
  }, []);

  const isCustomBrand = useMemo(() => {
    return brand.name !== DEFAULT_BRAND_CONFIG.name || !!brand.logo;
  }, [brand]);

  // Compute theme-aware logos
  const activeLogo = useMemo(() => {
    if (isDark) {
      return brand.logoDark || brand.logo || '';
    }
    return brand.logoLight || brand.logo || '';
  }, [isDark, brand]);

  const activeSidebarLogo = useMemo(() => {
    if (brand.sidebarLogo) return brand.sidebarLogo;
    return activeLogo;
  }, [brand.sidebarLogo, activeLogo]);

  const activeSidebarIcon = useMemo(() => {
    if (brand.sidebarIcon) return brand.sidebarIcon;
    if (brand.favicon) return brand.favicon;
    return activeLogo;
  }, [brand.sidebarIcon, brand.favicon, activeLogo]);

  const refreshBrand = useCallback(async () => {
    BrandService.clearCache();
    await loadBrand();
  }, [loadBrand]);

  const value = useMemo(
    () => ({
      brand,
      isLoading,
      isCustomBrand,
      activeLogo,
      activeSidebarLogo,
      activeSidebarIcon,
      refreshBrand,
      updateBrand,
      resetBrand,
    }),
    [brand, isLoading, isCustomBrand, activeLogo, activeSidebarLogo, activeSidebarIcon, refreshBrand, updateBrand, resetBrand]
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandContextType {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}
