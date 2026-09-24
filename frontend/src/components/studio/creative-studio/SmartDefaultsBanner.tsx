'use client';

import React from 'react';
import { Sparkles, Check, ArrowRight, Loader2 } from 'lucide-react';
import { SmartDefaultsResult } from '@/lib/types';

interface SmartDefaultsBannerProps {
  smartDefaults: SmartDefaultsResult | null;
  isLoading: boolean;
  onApply: (defaults: SmartDefaultsResult) => void;
}

export function SmartDefaultsBanner({
  smartDefaults,
  isLoading,
  onApply,
}: SmartDefaultsBannerProps) {
  if (isLoading) {
    return (
      <div className="p-4 rounded-2xl border border-brand-500/20 bg-brand-500/5 flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-brand-500 animate-spin shrink-0" />
        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
          Synthesizing Brand DNA to recommend optimal design parameters...
        </p>
      </div>
    );
  }

  if (!smartDefaults) return null;

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-brand-500/30 bg-gradient-to-r from-brand-500/10 via-purple-500/10 to-indigo-500/10 shadow-sm relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-brand-500 text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              AI Creative Intelligence Recommendation
            </h4>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed">
            {smartDefaults.reasoning ||
              'Based on your brand identity and campaign goals, we have calibrated the ideal aesthetic parameters.'}
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              Style: <strong>{smartDefaults.recommendedStyle}</strong>
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              Composition: <strong>{smartDefaults.recommendedComposition}</strong>
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              Mood: <strong>{smartDefaults.recommendedMood}</strong>
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              CTA: <strong>{smartDefaults.recommendedCta}</strong>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onApply(smartDefaults)}
          className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition shrink-0"
        >
          <Check className="w-4 h-4" />
          <span>Apply Smart Presets</span>
        </button>
      </div>
    </div>
  );
}
