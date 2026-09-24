'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { BackendStatusModal } from '../ui/BackendStatusModal';
import { BrandLogo } from '../brand/BrandLogo';
import { useBrand } from '@/context/BrandContext';

export function Footer() {
  const { brand } = useBrand();

  return (
    <footer className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 py-12 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-200 dark:border-slate-800">
          {/* Logo & Brand */}
          <BrandLogo variant="landing" subtitle={brand.description || 'Next-Generation AI Creative Studio'} />

          {/* Links */}
          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <a href="/dashboard/studio" className="hover:text-purple-600 dark:hover:text-purple-400 transition">AI Studio</a>
            <a href="#templates" className="hover:text-purple-600 dark:hover:text-purple-400 transition">Templates</a>
            <a href="#features" className="hover:text-purple-600 dark:hover:text-purple-400 transition">Features</a>
            <a href="#pricing" className="hover:text-purple-600 dark:hover:text-purple-400 transition">Pricing</a>
            {brand.supportUrl ? (
              <a href={brand.supportUrl} target="_blank" rel="noopener noreferrer" className="hover:text-purple-600 dark:hover:text-purple-400 transition">Support</a>
            ) : (
              <a href="#faq" className="hover:text-purple-600 dark:hover:text-purple-400 transition">FAQ</a>
            )}
          </div>

          {/* Status Modal Trigger */}
          <div>
            <BackendStatusModal />
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" /> for creators, brands &amp; agencies.
          </p>
        </div>
      </div>
    </footer>
  );
}
