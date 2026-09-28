'use client';

import React from 'react';
import {
  Share2,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Video,
  Layers,
  Check,
  CheckCircle2,
} from 'lucide-react';

export interface PlatformOption {
  id: string;
  name: string;
  defaultRatio: string;
  allowedRatios: string[];
  recommendedBadge: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  description: string;
}

export const PLATFORMS: PlatformOption[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    defaultRatio: '1:1',
    allowedRatios: ['1:1', '4:5', '9:16'],
    recommendedBadge: '1:1 Square & 4:5 Portrait',
    icon: Instagram,
    accentColor: '#e1306c',
    description: 'Feed posts, carousels, and visual showcase',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    defaultRatio: '1.91:1',
    allowedRatios: ['1.91:1', '1:1'],
    recommendedBadge: '1.91:1 Landscape',
    icon: Facebook,
    accentColor: '#1877f2',
    description: 'Timeline posts, link previews & community updates',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    defaultRatio: '4:5',
    allowedRatios: ['4:5', '1:1', '1.91:1'],
    recommendedBadge: '4:5 Vertical / 1:1 Square',
    icon: Linkedin,
    accentColor: '#0a66c2',
    description: 'Professional B2B announcements, insights & thought leadership',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    defaultRatio: '9:16',
    allowedRatios: ['9:16'],
    recommendedBadge: '9:16 Vertical Reel',
    icon: Video,
    accentColor: '#00f2fe',
    description: 'Full-screen mobile video covers & visual stories',
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    defaultRatio: '16:9',
    allowedRatios: ['16:9', '1:1'],
    recommendedBadge: '16:9 Landscape',
    icon: Twitter,
    accentColor: '#1da1f2',
    description: 'High-visibility in-stream feed media',
  },
  {
    id: 'multiple',
    name: 'Multiple Platforms',
    defaultRatio: '1:1',
    allowedRatios: ['1:1', '4:5'],
    recommendedBadge: '1:1 Universal Fit',
    icon: Layers,
    accentColor: '#7c5cff',
    description: 'Universal square standard compatible everywhere',
  },
];

const RATIO_DESCRIPTIONS: Record<string, string> = {
  '1:1': 'Square (1080 × 1080)',
  '4:5': 'Vertical Portrait (1080 × 1350)',
  '9:16': 'Full Vertical (1080 × 1920)',
  '16:9': 'Landscape (1200 × 675)',
  '1.91:1': 'Horizontal Feed (1200 × 628)',
};

interface PlatformStepProps {
  selectedPlatform: string;
  selectedRatio: string;
  onSelectPlatform: (platformId: string, defaultRatio: string) => void;
  onSelectRatio: (ratio: string) => void;
}

export function PlatformStep({
  selectedPlatform,
  selectedRatio,
  onSelectPlatform,
  onSelectRatio,
}: PlatformStepProps) {
  const currentPlatformObj =
    PLATFORMS.find((p) => p.id === selectedPlatform) || PLATFORMS[0];

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 text-brand-700 dark:text-brand-300 text-xs font-semibold">
          <Share2 className="w-3.5 h-3.5" />
          <span>Step 6 · Channel & Dimensions</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Where will you publish this?
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Select your target channel. Social Yolo automatically adapts canvas dimensions and aspect ratios.
        </p>
      </div>

      {/* Grid of Platform Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORMS.map((item) => {
          const isSelected = selectedPlatform.toLowerCase() === item.id.toLowerCase();
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectPlatform(item.id, item.defaultRatio)}
              className={`group text-left p-5 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between hover:scale-[1.01] ${
                isSelected
                  ? 'border-brand-600 dark:border-brand-500 bg-brand-50/40 dark:bg-brand-950/20 shadow-xl shadow-brand-500/15 ring-2 ring-brand-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-400'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: item.accentColor }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {item.defaultRatio}
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>Recommended:</span>
                <span className="font-semibold text-brand-600 dark:text-brand-400">
                  {item.defaultRatio}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Recommended Dimension Notification & Aspect Ratio Pill Switcher */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Optimal Aspect Ratio Auto-Selected:
            </span>
            <span className="px-2 py-0.5 rounded-md bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 font-mono text-xs font-bold">
              {selectedRatio} ({RATIO_DESCRIPTIONS[selectedRatio] || selectedRatio})
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            No need to configure pixel dimensions. We automatically render in high resolution (1080p+).
          </p>
        </div>

        {/* If platform supports multiple ratios, allow quick pill switch */}
        {currentPlatformObj.allowedRatios.length > 1 && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {currentPlatformObj.allowedRatios.map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => onSelectRatio(ratio)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  selectedRatio === ratio
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-brand-500'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
