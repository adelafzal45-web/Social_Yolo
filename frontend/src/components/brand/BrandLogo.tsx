'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useBrand } from '@/context/BrandContext';

export interface BrandLogoProps {
  variant?: 'header' | 'sidebar-expanded' | 'sidebar-collapsed' | 'auth' | 'landing' | 'icon';
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  subtitleClassName?: string;
  showText?: boolean;
  showTitle?: boolean;
  showTagline?: boolean;
  displayMode?: 'logo_only' | 'logo_title' | 'logo_title_tagline';
  href?: string;
  subtitle?: string;
}

export function BrandLogo({
  variant = 'header',
  className = '',
  iconClassName = '',
  textClassName = '',
  subtitleClassName = '',
  showText = true,
  showTitle,
  showTagline,
  displayMode,
  href,
  subtitle,
}: BrandLogoProps) {
  const { brand, activeLogo, activeSidebarLogo, activeSidebarIcon } = useBrand();
  const [imageError, setImageError] = useState(false);

  // Determine appropriate logo image URL for current variant
  let logoUrl = activeLogo;
  if (variant === 'sidebar-collapsed') {
    logoUrl = activeSidebarIcon || activeLogo;
  } else if (variant === 'sidebar-expanded') {
    logoUrl = activeSidebarLogo || activeLogo;
  }

  const hasCustomImage = !!logoUrl && !imageError;

  // Icon Badge Component
  const renderIconBadge = () => {
    if (hasCustomImage) {
      return (
        <div
          className={`relative flex items-center justify-center overflow-hidden shrink-0 transition-transform ${
            variant === 'sidebar-collapsed'
              ? 'w-10 h-10 rounded-xl'
              : variant === 'auth' || variant === 'landing'
              ? 'w-10 h-10 rounded-2xl'
              : 'w-9 h-9 rounded-xl'
          } ${iconClassName}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt={brand.name}
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        </div>
      );
    }

    // Default Fallback Gradient Badge with Sparkles
    return (
      <div
        className={`rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 shrink-0 transition-transform ${
          variant === 'sidebar-collapsed'
            ? 'w-10 h-10 rounded-xl'
            : variant === 'auth' || variant === 'landing'
            ? 'w-10 h-10 rounded-2xl shadow-lg shadow-purple-500/20'
            : 'w-9 h-9 rounded-xl shadow-lg shadow-brand-500/20'
        } ${iconClassName}`}
      >
        <Sparkles
          className={
            variant === 'sidebar-collapsed'
              ? 'w-5 h-5 text-white'
              : variant === 'auth' || variant === 'landing'
              ? 'w-5 h-5 text-white'
              : 'w-5 h-5 text-white'
          }
        />
      </div>
    );
  };

  // Determine effective display mode: 'logo_only' | 'logo_title' | 'logo_title_tagline'
  const effectiveMode = displayMode || brand.headerDisplayMode || 'logo_title_tagline';

  // "means just logo then donot show title+tagline"
  const isLogoOnly =
    effectiveMode === 'logo_only' ||
    !showText ||
    variant === 'sidebar-collapsed' ||
    variant === 'icon' ||
    (showTitle === false && showTagline === false) ||
    (brand.showTitle === false && brand.showTagline === false);

  const shouldShowTitle =
    !isLogoOnly &&
    (showTitle !== undefined
      ? showTitle
      : brand.showTitle !== undefined
      ? brand.showTitle
      : true);

  const shouldShowTagline =
    !isLogoOnly &&
    (showTagline !== undefined
      ? showTagline
      : brand.showTagline !== undefined
      ? brand.showTagline
      : effectiveMode === 'logo_title_tagline');

  // If Logo-Only mode, collapsed sidebar, or icon variant, render JUST the logo
  if (isLogoOnly || (!shouldShowTitle && !shouldShowTagline)) {
    const iconContent = (
      <div className={`flex items-center justify-center ${className}`} title={brand.name}>
        {renderIconBadge()}
      </div>
    );

    if (href) {
      return (
        <Link href={href} className="group inline-flex items-center">
          {iconContent}
        </Link>
      );
    }
    return iconContent;
  }

  // Text details
  const displayName = brand.name || 'SocialYolo';
  const displaySubtitle = subtitle || brand.description || 'Creative Studio';

  const content = (
    <div className={`flex items-center gap-2.5 group ${className}`}>
      {renderIconBadge()}
      <div className="flex flex-col min-w-0">
        {shouldShowTitle && (
          <span
            className={`font-bold tracking-tight text-slate-900 dark:text-white truncate ${
              variant === 'landing' || variant === 'auth' ? 'text-xl font-extrabold font-display' : 'text-base'
            } ${textClassName}`}
          >
            {displayName}
          </span>
        )}
        {shouldShowTagline && displaySubtitle && (
          <span
            className={`text-[10px] font-medium text-brand-600 dark:text-brand-400 tracking-wider uppercase truncate -mt-0.5 ${subtitleClassName}`}
          >
            {displaySubtitle}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center group">
        {content}
      </Link>
    );
  }

  return content;
}
