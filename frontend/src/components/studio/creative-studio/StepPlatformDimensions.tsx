'use client';

import React from 'react';
import {
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Pin,
  Layers,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Monitor,
  Smartphone,
} from 'lucide-react';

export interface PlatformOption {
  id: string;
  name: string;
  channel: string;
  dimensions: string;
  aspectRatio: string;
  category: 'mobile_story' | 'portrait_feed' | 'landscape_banner' | 'square';
  desc: string;
  icon: any;
  brandGradient: string;
  canvasW: number;
  canvasH: number;
}

export const PLATFORMS_LIST: PlatformOption[] = [
  {
    id: 'Instagram Post',
    name: 'Instagram Post',
    channel: 'Instagram',
    dimensions: '1080 × 1350',
    aspectRatio: '4:5',
    category: 'portrait_feed',
    desc: 'High-converting vertical portrait feed',
    icon: Instagram,
    brandGradient: 'from-fuchsia-600 via-rose-500 to-amber-500',
    canvasW: 32,
    canvasH: 40,
  },
  {
    id: 'Instagram Story',
    name: 'Instagram Story / Reel',
    channel: 'Instagram',
    dimensions: '1080 × 1920',
    aspectRatio: '9:16',
    category: 'mobile_story',
    desc: 'Full-screen immersive vertical mobile',
    icon: Instagram,
    brandGradient: 'from-purple-600 via-pink-600 to-orange-500',
    canvasW: 24,
    canvasH: 42,
  },
  {
    id: 'Facebook Post',
    name: 'Facebook Feed & Ad',
    channel: 'Facebook',
    dimensions: '1200 × 628',
    aspectRatio: '1.91:1',
    category: 'landscape_banner',
    desc: 'Standard feed link ad & banner display',
    icon: Facebook,
    brandGradient: 'from-blue-600 to-indigo-600',
    canvasW: 46,
    canvasH: 24,
  },
  {
    id: 'Facebook Story',
    name: 'Facebook Story',
    channel: 'Facebook',
    dimensions: '1080 × 1920',
    aspectRatio: '9:16',
    category: 'mobile_story',
    desc: 'Vertical mobile story sponsor card',
    icon: Facebook,
    brandGradient: 'from-blue-500 to-sky-500',
    canvasW: 24,
    canvasH: 42,
  },
  {
    id: 'LinkedIn',
    name: 'LinkedIn Post',
    channel: 'LinkedIn',
    dimensions: '1080 × 1350',
    aspectRatio: '4:5',
    category: 'portrait_feed',
    desc: 'Authoritative B2B industry showcase',
    icon: Linkedin,
    brandGradient: 'from-blue-700 to-cyan-700',
    canvasW: 32,
    canvasH: 40,
  },
  {
    id: 'X',
    name: 'X (Twitter) Card',
    channel: 'X',
    dimensions: '1200 × 628',
    aspectRatio: '16:9',
    category: 'landscape_banner',
    desc: 'Horizontal feed summary graphic',
    icon: Twitter,
    brandGradient: 'from-slate-800 to-slate-950 dark:from-slate-700 dark:to-slate-900',
    canvasW: 44,
    canvasH: 25,
  },
  {
    id: 'Pinterest',
    name: 'Pinterest Pin',
    channel: 'Pinterest',
    dimensions: '1000 × 1500',
    aspectRatio: '2:3',
    category: 'portrait_feed',
    desc: 'High-converting vertical viral pin',
    icon: Pin,
    brandGradient: 'from-red-600 to-rose-600',
    canvasW: 28,
    canvasH: 42,
  },
  {
    id: 'General Social Media',
    name: 'Square Universal',
    channel: 'Universal',
    dimensions: '1080 × 1080',
    aspectRatio: '1:1',
    category: 'square',
    desc: 'Multi-platform standard square post',
    icon: Layers,
    brandGradient: 'from-brand-600 via-indigo-600 to-purple-600',
    canvasW: 34,
    canvasH: 34,
  },
];

interface StepPlatformDimensionsProps {
  platform: string;
  setPlatform: (plat: string) => void;
  onContinue?: () => void;
}

export function StepPlatformDimensions({
  platform,
  setPlatform,
  onContinue,
}: StepPlatformDimensionsProps) {
  const selectedPlatform = PLATFORMS_LIST.find((p) => p.id === platform) || PLATFORMS_LIST[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-2 border border-blue-500/20">
            <Layers className="w-3.5 h-3.5" />
            <span>Step 4 of 5</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Target Platform &amp; Canvas Dimensions
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Choose where your creative will be published. Canvas pixel dimensions and aspect ratios calibrate automatically with high DPI rasterization.
          </p>
        </div>

        {/* Selected Quick Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs font-semibold self-start sm:self-center">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-500 dark:text-slate-400">Selected:</span>
          <span className="font-bold text-slate-900 dark:text-white">{selectedPlatform.name}</span>
          <span className="px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400 font-mono font-bold text-[11px]">
            {selectedPlatform.aspectRatio}
          </span>
        </div>
      </div>

      {/* 8-Card Platform Grid */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLATFORMS_LIST.map((p) => {
            const Icon = p.icon;
            const isSelected = platform === p.id;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatform(p.id)}
                className={`group relative p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500/[0.04] dark:bg-brand-500/[0.08] shadow-lg ring-2 ring-brand-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                {/* Top Row: Icon + Canvas Preview Wireframe + Ratio Badge */}
                <div className="flex items-center justify-between mb-4 w-full">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${
                        isSelected
                          ? `bg-gradient-to-tr ${p.brandGradient} text-white shadow-md`
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {p.channel}
                    </span>
                  </div>

                  {/* Visual Aspect Ratio Mini Canvas Silhouette */}
                  <div className="flex items-center gap-2">
                    <div
                      title={`Aspect Ratio ${p.aspectRatio}`}
                      className={`rounded border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-brand-500/80 bg-brand-500/20 shadow-xs'
                          : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60'
                      }`}
                      style={{
                        width: `${p.canvasW}px`,
                        height: `${p.canvasH}px`,
                      }}
                    >
                      <span
                        className={`text-[8px] font-mono font-bold leading-none ${
                          isSelected
                            ? 'text-brand-700 dark:text-brand-300'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {p.aspectRatio}
                      </span>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                    )}
                  </div>
                </div>

                {/* Platform Name & Dimensions */}
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
                    {p.name}
                  </h4>

                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-xs font-semibold ${
                        isSelected
                          ? 'text-brand-600 dark:text-brand-400 font-bold'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {p.dimensions} px
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-1 pt-1">
                    {p.desc}
                  </p>
                </div>

                {/* Subtle bottom active bar indicator */}
                <div
                  className={`h-1 w-full rounded-full mt-3 transition-opacity ${
                    isSelected ? 'bg-brand-500 opacity-100' : 'bg-transparent opacity-0'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Selected Confirmation Banner with Clear Next Step Action */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-brand-500/5 to-slate-50 dark:from-slate-900 dark:via-brand-950/20 dark:to-slate-900 border border-brand-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider text-brand-600 dark:text-brand-400">
                  Ready For Generation
                </span>
                <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  {selectedPlatform.dimensions} px ({selectedPlatform.aspectRatio})
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Targeting <strong className="text-slate-900 dark:text-white">{selectedPlatform.name}</strong>. Canvas bounds, typography margins, and safe zones will be rendered to spec.
              </p>
            </div>
          </div>

          {onContinue && (
            <button
              type="button"
              onClick={onContinue}
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition shrink-0 cursor-pointer"
            >
              <span>Continue to Step 5: Content &amp; Launch</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
