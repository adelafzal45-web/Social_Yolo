'use client';

import { Sparkles, Ratio, Copy, AlertCircle } from 'lucide-react';
import { Step1BasicsData } from './WizardStep1Basics';
import { Step2AudienceData } from './WizardStep2AudienceContent';
import { Step3BrandDesignData } from './WizardStep3BrandDesign';
import { Step4AssetsData } from './WizardStep4Assets';

export interface Step5FinalData {
  aspectRatio: string;
  variationsCount: number;
}

interface WizardStep5FinalProps {
  step1: Step1BasicsData;
  step2: Step2AudienceData;
  step3: Step3BrandDesignData;
  step4: Step4AssetsData;
  step5: Step5FinalData;
  onChange: (fields: Partial<Step5FinalData>) => void;
  userCredits: number;
  isGenerating: boolean;
  onGenerate: () => void;
}

export const ASPECT_RATIOS = [
  {
    id: '1:1',
    label: '1:1 Square',
    dims: '1080 × 1080',
    desc: 'Instagram & Facebook Feed, LinkedIn Post',
    shape: 'aspect-square',
  },
  {
    id: '4:5',
    label: '4:5 Portrait',
    dims: '1080 × 1350',
    desc: 'Instagram Mobile Feed (Maximum screen estate)',
    shape: 'aspect-[4/5]',
  },
  {
    id: '9:16',
    label: '9:16 Vertical Story',
    dims: '1080 × 1920',
    desc: 'TikTok, Instagram Stories, Reels, YouTube Shorts',
    shape: 'aspect-[9/16]',
  },
  {
    id: '16:9',
    label: '16:9 Landscape',
    dims: '1920 × 1080',
    desc: 'Twitter / X, LinkedIn Article, YouTube Thumbnail',
    shape: 'aspect-[16/9]',
  },
  {
    id: '1.91:1',
    label: '1.91:1 Link Banner',
    dims: '1200 × 628',
    desc: 'Facebook & Twitter Shared Web Link Preview',
    shape: 'aspect-[1.91/1]',
  },
];

export function WizardStep5Final({
  step1,
  step2,
  step3,
  step4,
  step5,
  onChange,
  userCredits,
  isGenerating,
  onGenerate,
}: WizardStep5FinalProps) {
  const costPerPost = 5;
  const totalCost = step5.variationsCount * costPerPost;
  const hasInsufficientCredits = userCredits < totalCost;

  const platformKey = (step1.platform || '').toLowerCase();
  const PLATFORM_NATIVE_MAP: Record<string, { ratio: string; dims: string }> = {
    instagram: { ratio: '1:1', dims: '1080 × 1080' },
    facebook: { ratio: '1.91:1', dims: '1200 × 628' },
    linkedin: { ratio: '4:5', dims: '1080 × 1350' },
    tiktok: { ratio: '9:16', dims: '1080 × 1920' },
    twitter: { ratio: '16:9', dims: '1920 × 1080' },
    pinterest: { ratio: '9:16', dims: '1080 × 1920' },
  };
  const nativePlatform = PLATFORM_NATIVE_MAP[platformKey];
  const nativeRatio = nativePlatform?.ratio || '1:1';
  const isUsingNative = step5.aspectRatio === nativeRatio;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Step Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80">
          <Ratio className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>FINAL REQUIREMENTS &amp; GENERATION</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Dimensions &amp; Final Review
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Confirm your post dimensions and variation count. Review your configuration summary below, then trigger AI generation.
        </p>
      </div>

      {/* 1. Post Dimensions / Aspect Ratio */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Ratio className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Post Dimensions &amp; Aspect Ratio</span>
            <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
              Required
            </span>
          </label>
          <span className="text-xs text-slate-500">
            Selected: <span className="font-semibold text-slate-900 dark:text-white">{step5.aspectRatio}</span>
          </span>
        </div>

        {/* Platform Native Auto-Resolution Banner */}
        {nativePlatform && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-900 dark:text-purple-200">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] font-bold">
                ✓
              </span>
              <span>
                Target Platform <strong className="capitalize text-purple-700 dark:text-purple-300 font-bold">{step1.platform}</strong> selected: native dimensions auto-set to <strong className="font-mono font-bold">{nativeRatio}</strong> ({nativePlatform.dims}).
              </span>
            </div>
            {!isUsingNative && (
              <button
                type="button"
                onClick={() => onChange({ aspectRatio: nativeRatio })}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition shadow-sm"
              >
                Reset to {step1.platform} Native ({nativeRatio})
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {ASPECT_RATIOS.map((ratio) => {
            const isSelected = step5.aspectRatio === ratio.id;
            const isNative = ratio.id === nativeRatio;
            return (
              <button
                key={ratio.id}
                type="button"
                onClick={() => onChange({ aspectRatio: ratio.id })}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/50 text-slate-900 dark:text-white shadow-md ring-2 ring-brand-500/20'
                    : isNative
                    ? 'border-purple-200 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-950/20 text-slate-700 dark:text-slate-300 hover:border-purple-300'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs">{ratio.label}</span>
                    <span className="text-[10px] font-mono text-slate-500">{ratio.dims}</span>
                  </div>
                  {isNative && (
                    <div className="mb-2">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                        ★ Native for {step1.platform || 'Platform'}
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    {ratio.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Number of Variations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Copy className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Number of Creative Variations</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              Optional
            </span>
          </label>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-md">
          {[1, 2, 3].map((num) => {
            const isSelected = step5.variationsCount === num;
            return (
              <button
                key={num}
                type="button"
                onClick={() => onChange({ variationsCount: num })}
                className={`py-3 px-4 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="text-base font-black">{num} {num === 1 ? 'Variation' : 'Variations'}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-medium">{num * 5} Credits</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Requirement Brief Summary */}
      <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
          Creative Brief Summary
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Platform</span>
            <span className="font-bold text-slate-900 dark:text-white capitalize">{step1.platform}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Product</span>
            <span className="font-bold text-slate-900 dark:text-white truncate block">{step1.productName || 'Featured Item'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Ratio</span>
            <span className="font-bold text-slate-900 dark:text-white">{step5.aspectRatio}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Design Style</span>
            <span className="font-bold text-slate-900 dark:text-white capitalize">{step3.style}</span>
          </div>
        </div>

        {step1.mainMessage && (
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Core Message</span>
            <p className="text-slate-700 dark:text-slate-300 font-medium line-clamp-2">{step1.mainMessage}</p>
          </div>
        )}
      </div>

      {/* Credit Warning if insufficient */}
      {hasInsufficientCredits && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
          <div className="text-xs text-rose-800 dark:text-rose-300">
            <p className="font-bold">Insufficient Credits</p>
            <p>You have {userCredits} credits available, but {totalCost} credits are required.</p>
          </div>
        </div>
      )}

      {/* Primary Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || hasInsufficientCredits || !step1.productName.trim()}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-amber-500 hover:from-brand-500 hover:via-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-brand-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
          <span>Generate Post with AI ({totalCost} Credits)</span>
        </button>
      </div>
    </div>
  );
}
