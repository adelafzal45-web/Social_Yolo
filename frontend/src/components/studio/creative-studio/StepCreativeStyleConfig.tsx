'use client';

import React from 'react';
import {
  Sparkles,
  SlidersHorizontal,
  Layout,
  SunMedium,
  MousePointerClick,
  CheckCircle2,
} from 'lucide-react';
import { SmartDefaultsResult } from '@/lib/types';
import { SmartDefaultsBanner } from './SmartDefaultsBanner';

export const STYLES_LIST = [
  {
    id: 'Minimalist Modern',
    name: 'Minimalist Modern',
    desc: 'Spacious negative space, clean geometric balance, contemporary feel',
    accent: '#6366F1',
    gradient: 'from-indigo-500/20 via-slate-100 to-white dark:via-slate-900 dark:to-slate-950',
  },
  {
    id: 'Luxury Premium',
    name: 'Luxury Premium',
    desc: 'Refined serif accents, rich dark/gold contrast, high-end prestige',
    accent: '#D97706',
    gradient: 'from-amber-500/20 via-slate-900 to-black dark:from-amber-600/30 dark:to-black',
  },
  {
    id: 'Bold Vibrant',
    name: 'Bold Vibrant',
    desc: 'High-contrast punchy colors, strong visual hooks, maximum scroll-stopping power',
    accent: '#EC4899',
    gradient: 'from-pink-500/20 via-rose-500/10 to-purple-500/20',
  },
  {
    id: 'Editorial Magazine',
    name: 'Editorial Magazine',
    desc: 'Artistic typography lockups, asymmetrical editorial layouts, Vogue-inspired',
    accent: '#8B5CF6',
    gradient: 'from-purple-500/20 via-slate-100 to-white dark:via-slate-900 dark:to-slate-950',
  },
  {
    id: 'Tech Futuristic',
    name: 'Tech Futuristic',
    desc: 'Deep gradients, glowing subtle accents, sleek modern SaaS aesthetic',
    accent: '#06B6D4',
    gradient: 'from-cyan-500/20 via-blue-900 to-slate-950',
  },
  {
    id: 'Warm Organic',
    name: 'Warm Organic',
    desc: 'Natural earth tones, soft shadows, inviting lifestyle aesthetic',
    accent: '#10B981',
    gradient: 'from-emerald-500/20 via-amber-50 to-stone-100 dark:via-stone-900 dark:to-stone-950',
  },
];

export const COMPOSITIONS_LIST = [
  {
    id: 'Split Screen',
    name: 'Split Screen',
    desc: 'Half hero visual, half typography and CTA pill',
  },
  {
    id: 'Hero Visual Center',
    name: 'Hero Center',
    desc: 'Spotlight subject centered with balanced text above and below',
  },
  {
    id: 'Diagonal Dynamic',
    name: 'Diagonal Dynamic',
    desc: 'Angled flow conveying speed, action, and energy',
  },
  {
    id: 'Floating Showcase',
    name: 'Floating Showcase',
    desc: 'Subject floating in clean 3D ambient space with soft shadow',
  },
  {
    id: 'Framed Card',
    name: 'Framed Card',
    desc: 'Structured inner borders with clean content framing',
  },
  {
    id: 'Typography Heavy',
    name: 'Typography Heavy',
    desc: 'Large expressive headline lockup dominating the canvas',
  },
];

export const MOODS_LIST = [
  { id: 'Energetic & Exciting', name: 'Energetic & Exciting', desc: 'Fast-paced, high impact' },
  { id: 'Sophisticated & Calm', name: 'Sophisticated & Calm', desc: 'Subtle elegance, serene' },
  { id: 'Trustworthy & Corporate', name: 'Trustworthy & Corporate', desc: 'Reliable, structured' },
  { id: 'Playful & Friendly', name: 'Playful & Friendly', desc: 'Approachable, warm colors' },
  { id: 'Urgent & High-Converting', name: 'Urgent & High-Converting', desc: 'Action-driving contrast' },
];

export const CTAS_LIST = [
  'Shop Now',
  'Get Started',
  'Learn More',
  'Claim Offer',
  'Book Free Demo',
  'Join Waitlist',
  'Explore Collection',
  'Try for Free',
];

// Visual layout wireframe preview component
function CompositionWireframe({ type, isSelected }: { type: string; isSelected: boolean }) {
  const container = `w-12 h-10 rounded-lg border flex items-center justify-center p-1 transition-all overflow-hidden shrink-0 ${
    isSelected
      ? 'border-brand-500 bg-brand-500/10 shadow-xs'
      : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950'
  }`;

  if (type === 'Split Screen') {
    return (
      <div className={container}>
        <div className="w-1/2 h-full bg-slate-300 dark:bg-slate-700 rounded-l" />
        <div className="w-1/2 h-full flex flex-col justify-center gap-1 pl-1">
          <div className="h-1 w-full bg-slate-400 dark:bg-slate-500 rounded-full" />
          <div className="h-1 w-2/3 bg-slate-400 dark:bg-slate-500 rounded-full" />
        </div>
      </div>
    );
  }

  if (type === 'Hero Visual Center') {
    return (
      <div className={container}>
        <div className="w-full h-full flex flex-col items-center justify-between py-0.5">
          <div className="h-1 w-3/4 bg-slate-400 dark:bg-slate-500 rounded-full" />
          <div className="w-5 h-4 bg-slate-300 dark:bg-slate-700 rounded" />
          <div className="h-1 w-1/2 bg-slate-400 dark:bg-slate-500 rounded-full" />
        </div>
      </div>
    );
  }

  if (type === 'Diagonal Dynamic') {
    return (
      <div className={`${container} relative`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-300 dark:from-slate-700 via-transparent to-transparent" />
        <div className="relative z-10 flex flex-col gap-1 w-full px-1">
          <div className="h-1 w-2/3 bg-slate-400 dark:bg-slate-500 rounded-full" />
          <div className="h-1 w-1/3 bg-slate-400 dark:bg-slate-500 rounded-full" />
        </div>
      </div>
    );
  }

  if (type === 'Floating Showcase') {
    return (
      <div className={container}>
        <div className="w-6 h-5 rounded bg-white dark:bg-slate-800 shadow-sm border border-slate-300 dark:border-slate-700 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-brand-500" />
        </div>
      </div>
    );
  }

  if (type === 'Framed Card') {
    return (
      <div className={container}>
        <div className="w-full h-full border border-dashed border-slate-400 dark:border-slate-600 rounded flex items-center justify-center p-0.5">
          <div className="h-1 w-3/4 bg-slate-400 dark:bg-slate-500 rounded-full" />
        </div>
      </div>
    );
  }

  // Typography Heavy
  return (
    <div className={container}>
      <div className="w-full h-full flex flex-col justify-center gap-1">
        <div className="h-1.5 w-full bg-slate-500 dark:bg-slate-400 rounded-full" />
        <div className="h-1.5 w-5/6 bg-slate-500 dark:bg-slate-400 rounded-full" />
        <div className="h-1 w-1/2 bg-slate-400 dark:bg-slate-500 rounded-full" />
      </div>
    </div>
  );
}

interface StepCreativeStyleConfigProps {
  style: string;
  setStyle: (style: string) => void;
  composition: string;
  setComposition: (comp: string) => void;
  mood: string;
  setMood: (mood: string) => void;
  cta: string;
  setCta: (cta: string) => void;
  smartDefaults: SmartDefaultsResult | null;
  isLoadingDefaults: boolean;
}

export function StepCreativeStyleConfig({
  style,
  setStyle,
  composition,
  setComposition,
  mood,
  setMood,
  cta,
  setCta,
  smartDefaults,
  isLoadingDefaults,
}: StepCreativeStyleConfigProps) {
  const handleApplyDefaults = (defaults: SmartDefaultsResult) => {
    if (defaults.recommendedStyle) setStyle(defaults.recommendedStyle);
    if (defaults.recommendedComposition) setComposition(defaults.recommendedComposition);
    if (defaults.recommendedMood) setMood(defaults.recommendedMood);
    if (defaults.recommendedCta) setCta(defaults.recommendedCta);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-pink-500 text-xs font-semibold mb-2 border border-pink-500/20">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Step 3 of 5</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Style, Composition &amp; Aesthetics
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Select your desired visual style and composition. SocialYolo retrieves matching aesthetic references from the Visual RAG library.
        </p>
      </div>

      {/* Smart Defaults Banner */}
      <SmartDefaultsBanner
        smartDefaults={smartDefaults}
        isLoading={isLoadingDefaults}
        onApply={handleApplyDefaults}
      />

      {/* 1. Visual Style Grid */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
          <span>Visual Style Direction</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {STYLES_LIST.map((s) => {
            const isSelected = style === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyle(s.id)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500/[0.04] dark:bg-brand-500/[0.08] shadow-md ring-2 ring-brand-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: s.accent }}
                    />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">{s.name}</h4>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                  {s.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Composition Grid with Wireframes */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <Layout className="w-3.5 h-3.5 text-brand-500" />
          <span>Composition &amp; Layout Grid</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {COMPOSITIONS_LIST.map((c) => {
            const isSelected = composition === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setComposition(c.id)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative group ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500/[0.04] dark:bg-brand-500/[0.08] shadow-md ring-2 ring-brand-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="flex items-center gap-3">
                    <CompositionWireframe type={c.id} isSelected={isSelected} />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">{c.name}</h4>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-15 leading-relaxed">{c.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Mood & CTA Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mood Selector */}
        <div className="lg:col-span-6 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <SunMedium className="w-3.5 h-3.5 text-brand-500" />
            <span>Atmosphere &amp; Mood</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {MOODS_LIST.map((m) => {
              const isSelected = mood === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMood(m.id)}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                    isSelected
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-1 ring-brand-500 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <p className="font-bold">{m.name}</p>
                  <p className="text-[11px] font-normal text-slate-400 mt-0.5">{m.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA Selector */}
        <div className="lg:col-span-6 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <MousePointerClick className="w-3.5 h-3.5 text-brand-500" />
            <span>Call-to-Action Button Intent</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CTAS_LIST.map((item) => {
              const isSelected = cta === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCta(item)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    isSelected
                      ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
