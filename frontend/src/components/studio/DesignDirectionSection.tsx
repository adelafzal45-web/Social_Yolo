'use client';

import React from 'react';
import { Sparkles, Check } from 'lucide-react';

interface DesignDirectionSectionProps {
  selectedStyle: string;
  setSelectedStyle: (s: string) => void;
}

export const DESIGN_STYLES = [
  {
    id: 'luxury',
    label: 'Luxury & Editorial',
    tagline: 'Deep tone, gold hairlines, elegant serif',
    previewBg: 'bg-zinc-950',
    accentColor: '#c9a24e',
    accentBg: 'linear-gradient(135deg, #1f1a14, #382c19)',
    idealFor: 'Watches, jewelry, perfume, specialty coffee',
  },
  {
    id: 'minimalist',
    label: 'Minimalist Studio',
    tagline: 'Clean space, restrained type, natural daylight',
    previewBg: 'bg-stone-900',
    accentColor: '#e5e7eb',
    accentBg: 'linear-gradient(135deg, #27272a, #18181b)',
    idealFor: 'Skincare, ceramics, apparel, wellness',
  },
  {
    id: 'bold',
    label: 'Bold & High-Energy',
    tagline: 'High-contrast color, dynamic angles, big type',
    previewBg: 'bg-amber-950',
    accentColor: '#ff7a3d',
    accentBg: 'linear-gradient(135deg, #ff7a3d, #ffb648)',
    idealFor: 'Beverages, fitness, sales campaigns, streetwear',
  },
  {
    id: 'lifestyle',
    label: 'Authentic Lifestyle',
    tagline: 'Warm sunlight, human context, soft organic tones',
    previewBg: 'bg-emerald-950',
    accentColor: '#a7f3d0',
    accentBg: 'linear-gradient(135deg, #27372d, #14211a)',
    idealFor: 'Food, home decor, eco-friendly goods, travel',
  },
  {
    id: 'tech',
    label: 'Futuristic Tech Glow',
    tagline: 'Grid structure, mono type, cyan & violet lighting',
    previewBg: 'bg-slate-950',
    accentColor: '#38bdf8',
    accentBg: 'linear-gradient(135deg, #0f172a, #1e293b)',
    idealFor: 'Gadgets, electronics, apps, software, SaaS',
  },
  {
    id: 'playful',
    label: 'Playful & Joyful',
    tagline: 'Bright pastel palette, rounded forms, pop vibes',
    previewBg: 'bg-purple-950',
    accentColor: '#f472b6',
    accentBg: 'linear-gradient(135deg, #3b143c, #1f0b24)',
    idealFor: 'Snacks, youth fashion, pets, accessories',
  },
];

export function DesignDirectionSection({ selectedStyle, setSelectedStyle }: DesignDirectionSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Choose a Design Direction</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Select the aesthetic mood, lighting and color grading for your campaign creatives.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSelectedStyle('luxury')}
          className="px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-800/80 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900 text-xs font-semibold transition flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>+ AI Recommended</span>
        </button>
      </div>

      {/* 6 Visual Direction Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DESIGN_STYLES.map((st) => {
          const isSelected = selectedStyle === st.id;
          return (
            <div
              key={st.id}
              onClick={() => setSelectedStyle(st.id)}
              className={`rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200 relative group ${
                isSelected
                  ? 'border-brand-500 ring-2 ring-brand-500/30 shadow-xl bg-brand-50/50 dark:bg-slate-900'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Visual Card Header */}
              <div
                className="h-28 flex items-center justify-center relative overflow-hidden"
                style={{ background: st.accentBg }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-xl"
                  style={{ backgroundColor: st.accentColor, color: '#000' }}
                >
                  {st.label.charAt(0)}
                </div>

                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs shadow-md">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{st.label}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{st.tagline}</p>
                <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  Best for: {st.idealFor}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
