'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { brandingConfig } from '@/config/branding.config';
import { useTheme } from '@/context/ThemeContext';

interface AppLogoProps {
  variant?: 'full' | 'collapsed' | 'icon-only';
  className?: string;
  href?: string;
  showLink?: boolean;
}

export function AppLogo({
  variant = 'full',
  className = '',
  href = '/dashboard',
  showLink = true,
}: AppLogoProps) {
  const { isDark } = useTheme();
  const { logo, sidebar } = brandingConfig;

  // Resolve logo image source based on theme if provided
  const imageSrc = isDark
    ? logo.darkSrc || logo.src
    : logo.lightSrc || logo.src;

  const content = (
    <div
      className={`inline-flex items-center gap-3 select-none group ${
        variant === 'collapsed' ? 'justify-center w-full' : ''
      } ${className}`}
    >
      {/* Visual Emblem / Icon */}
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={brandingConfig.appName}
          className={`${
            variant === 'collapsed' ? 'w-9 h-9' : 'w-9 h-9'
          } object-contain rounded-xl`}
        />
      ) : (
        <div
          className={`relative rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform duration-200 shrink-0 ${
            variant === 'collapsed' ? 'w-10 h-10' : 'w-9 h-9'
          }`}
        >
          <Sparkles className="w-5 h-5 text-white" />
        </div>
      )}

      {/* Expanded Text Branding */}
      {variant === 'full' && (
        <div className="flex flex-col min-w-0 transition-opacity duration-200">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
              {logo.title}
            </span>
            {logo.highlight && (
              <span className="text-base font-extrabold text-brand-600 dark:text-brand-400">
                {logo.highlight}
              </span>
            )}
          </div>
          {logo.badge && (
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase mt-0.5">
              {logo.badge}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (!showLink) {
    return content;
  }

  return (
    <Link href={href} aria-label={brandingConfig.appName} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-xl">
      {content}
    </Link>
  );
}
