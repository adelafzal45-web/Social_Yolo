'use client';

import React from 'react';
import {
  Palette,
  Sparkles,
  Crown,
  Maximize2,
  Briefcase,
  Zap,
  Brush,
  Feather,
  Flame,
  Check,
} from 'lucide-react';

export interface StyleOption {
  id: string;
  title: string;
  tagline: string;
  previewBg: string;
  previewText: string;
  fontVibe: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

export const STYLES: StyleOption[] = [
  {
    id: 'modern',
    title: 'Modern',
    tagline: 'Clean geometry, neo-gradients & sleek tech feel',
    previewBg: 'from-slate-950 via-indigo-950 to-slate-900 border-indigo-500/30',
    previewText: 'MODERN IMPACT',
    fontVibe: 'Sans-Serif · Neo-Grotesque',
    icon: Sparkles,
    accentColor: '#6366f1',
  },
  {
    id: 'luxury',
    title: 'Luxury',
    tagline: 'High-end black & gold elegance with regal depth',
    previewBg: 'from-zinc-950 via-stone-900 to-amber-950/50 border-amber-500/40',
    previewText: 'HAUTE COUTURE',
    fontVibe: 'Classic Serif · Editorial',
    icon: Crown,
    accentColor: '#e0aa4e',
  },
  {
    id: 'minimal',
    title: 'Minimal',
    tagline: 'Generous whitespace, subtle accents & zen clarity',
    previewBg: 'from-slate-100 via-stone-50 to-slate-200 dark:from-slate-900 dark:via-zinc-900 dark:to-slate-800 border-slate-300 dark:border-slate-700',
    previewText: 'LESS IS MORE',
    fontVibe: 'Monochrome · Minimal',
    icon: Maximize2,
    accentColor: '#64748b',
  },
  {
    id: 'professional',
    title: 'Professional',
    tagline: 'Corporate polish, trust-building structure & clean grid',
    previewBg: 'from-slate-900 via-blue-950 to-cyan-950 border-blue-500/30',
    previewText: 'ENTERPRISE TRUST',
    fontVibe: 'Clean Structured · Corporate',
    icon: Briefcase,
    accentColor: '#0284c7',
  },
  {
    id: 'bold',
    title: 'Bold',
    tagline: 'High-contrast vibrant palettes that demand attention',
    previewBg: 'from-purple-950 via-rose-950 to-orange-950 border-rose-500/40',
    previewText: 'STAND OUT LOUD',
    fontVibe: 'Ultra-Bold · Dynamic',
    icon: Zap,
    accentColor: '#f43f5e',
  },
  {
    id: 'creative',
    title: 'Creative',
    tagline: 'Artistic flair, expressive shapes & imaginative mood',
    previewBg: 'from-fuchsia-950 via-purple-900 to-indigo-950 border-fuchsia-500/40',
    previewText: 'ORIGINAL ART',
    fontVibe: 'Display · Expressive',
    icon: Brush,
    accentColor: '#d946ef',
  },
  {
    id: 'elegant',
    title: 'Elegant',
    tagline: 'Soft pastels, graceful symmetry & serene aesthetics',
    previewBg: 'from-stone-900 via-emerald-950/40 to-teal-950 border-teal-500/30',
    previewText: 'GRACEFUL ESSENCE',
    fontVibe: 'Calligraphic · Refined',
    icon: Feather,
    accentColor: '#14b8a6',
  },
  {
    id: 'promotional',
    title: 'Promotional',
    tagline: 'High urgency, conversion badges & punchy sales focus',
    previewBg: 'from-red-950 via-amber-950 to-orange-950 border-amber-500/40',
    previewText: 'SPECIAL OFFER',
    fontVibe: 'High Energy · Retail',
    icon: Flame,
    accentColor: '#f97316',
  },
];

interface StyleStepProps {
  selectedStyle: string;
  onSelectStyle: (styleId: string) => void;
}

export function StyleStep({
  selectedStyle,
  onSelectStyle,
}: StyleStepProps) {
  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 text-brand-700 dark:text-brand-300 text-xs font-semibold">
          <Palette className="w-3.5 h-3.5" />
          <span>Step 5 · Visual Style</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          What style should your post have?
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Pick the visual aesthetic that best represents your campaign vibe.
        </p>
      </div>

      {/* Grid of Visual Style Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STYLES.map((item) => {
          const isSelected = selectedStyle.toLowerCase() === item.id.toLowerCase();
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectStyle(item.id)}
              className={`relative group text-left rounded-2xl border-2 transition-all duration-200 overflow-hidden flex flex-col justify-between hover:scale-[1.02] ${
                isSelected
                  ? 'border-brand-600 dark:border-brand-500 shadow-xl shadow-brand-500/20 ring-2 ring-brand-500/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-600 bg-white dark:bg-slate-900'
              }`}
            >
              {/* Visual Card Preview Canvas */}
              <div
                className={`relative w-full h-24 bg-gradient-to-br ${item.previewBg} p-3 flex flex-col justify-between overflow-hidden border-b`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: item.accentColor }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="text-[11px] font-black tracking-wider text-white/90 drop-shadow-sm font-mono truncate">
                  {item.previewText}
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-3.5 space-y-1.5 bg-white dark:bg-slate-900 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2 mt-0.5">
                    {item.tagline}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400 font-medium">
                  {item.fontVibe}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
