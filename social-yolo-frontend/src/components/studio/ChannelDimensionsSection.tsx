'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface ChannelDimensionsSectionProps {
  selectedPlatforms: string[];
  setSelectedPlatforms: React.Dispatch<React.SetStateAction<string[]>>;
}

export const PLATFORM_SPECS = [
  { id: 'instagram', code: 'IG', name: 'Instagram', dims: '1080 × 1350 · Feed Portrait', ratio: '4:5', aspectClass: 'aspect-[4/5]' },
  { id: 'tiktok', code: 'TT', name: 'TikTok & Reels', dims: '1080 × 1920 · Full Vertical Story', ratio: '9:16', aspectClass: 'aspect-[9/16]' },
  { id: 'facebook', code: 'FB', name: 'Facebook Ad', dims: '1200 × 628 · Landscape Link Ad', ratio: '1.91:1', aspectClass: 'aspect-[1.91/1]' },
  { id: 'linkedin', code: 'LI', name: 'LinkedIn', dims: '1200 × 1200 · Square Post', ratio: '1:1', aspectClass: 'aspect-square' },
  { id: 'pinterest', code: 'P', name: 'Pinterest', dims: '1000 × 1500 · Tall Pin', ratio: '2:3', aspectClass: 'aspect-[2/3]' },
  { id: 'twitter', code: 'X', name: 'Twitter / X', dims: '1200 × 675 · Wide Card', ratio: '16:9', aspectClass: 'aspect-[16/9]' },
];

export function ChannelDimensionsSection({
  selectedPlatforms,
  setSelectedPlatforms,
}: ChannelDimensionsSectionProps) {
  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column Platform Checkboxes */}
      <div className="lg:col-span-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Select Target Channels
          </span>
          <span className="text-xs text-brand-600 dark:text-brand-400 font-bold">
            {selectedPlatforms.length} selected
          </span>
        </div>

        <div className="space-y-2">
          {PLATFORM_SPECS.map((plat) => {
            const isChecked = selectedPlatforms.includes(plat.id);
            return (
              <div
                key={plat.id}
                onClick={() => togglePlatform(plat.id)}
                className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition ${
                  isChecked
                    ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500/70 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center font-bold text-xs text-brand-700 dark:text-brand-300">
                    {plat.code}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{plat.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{plat.dims}</p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs font-bold transition ${
                    isChecked
                      ? 'bg-brand-600 border-brand-500 text-white'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  {isChecked && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column Variant Aspect Previews */}
      <div className="lg:col-span-7 space-y-4">
        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-lg dark:shadow-xl space-y-4 min-h-[440px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
              Multi-Ratio Responsive Matrix
            </span>
            <span className="text-[10px] text-slate-500">
              Each channel generates with its authentic native aspect ratio
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end pt-4">
            {selectedPlatforms.map((platId) => {
              const plat = PLATFORM_SPECS.find((p) => p.id === platId);
              if (!plat) return null;
              return (
                <div
                  key={plat.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-3 flex flex-col justify-between items-center text-center shadow-sm space-y-2"
                >
                  <div className={`w-full max-w-[120px] ${plat.aspectClass} rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center p-2`}>
                    <div className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-500 dark:text-amber-400 flex items-center justify-center text-xs">
                      ☕
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 mt-1">{plat.ratio}</span>
                  </div>
                  <div className="text-[10px]">
                    <p className="font-bold text-slate-900 dark:text-white">{plat.name}</p>
                    <p className="text-slate-500">{plat.dims.split('·')[0]}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500 pt-4 border-t border-slate-200 dark:border-slate-800">
            No distorted letterboxes or stretched images. The AI renderer synthesizes compositions directly into each ratio.
          </p>
        </div>
      </div>
    </div>
  );
}
