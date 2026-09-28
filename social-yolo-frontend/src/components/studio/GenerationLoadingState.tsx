'use client';

import React from 'react';
import { Clock } from 'lucide-react';

interface GenerationLoadingStateProps {
  genStageIndex: number;
  timeRemaining: number;
  currentPlatformName?: string;
}

const STAGES = [
  'Photo clarity enhancement & subject extraction',
  'Synthesizing studio lighting & perspective depth',
  'Layout composition & safe-zone alignment',
  'Typography balancing & high-contrast readability',
  'Multi-ratio commercial color grading',
];

export function GenerationLoadingState({
  genStageIndex,
  timeRemaining,
  currentPlatformName,
}: GenerationLoadingStateProps) {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Animated Status Ring */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Background Track Circle */}
        <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />
        {/* Only the circular ring moves / spins */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-600 border-r-brand-500 animate-spin" />
        {/* Center number stays completely still and upright in the center */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <span className="text-base font-black text-slate-900 dark:text-white select-none leading-none">
            {Math.min(genStageIndex + 1, 5)}/5
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-xl font-black text-slate-900 dark:text-white">
          Synthesizing {currentPlatformName ? `${currentPlatformName} Creative` : 'Your Creatives'}...
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>Estimated time remaining: 0:{timeRemaining.toString().padStart(2, '0')}</span>
        </p>
      </div>

      {/* Checklist items */}
      <div className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2.5 text-left text-xs">
        {STAGES.map((label, idx) => {
          const isPassed = genStageIndex > idx;
          const isCurrent = genStageIndex === idx;
          return (
            <div
              key={idx}
              className={`flex items-center gap-3 transition-opacity ${
                isPassed
                  ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                  : isCurrent
                  ? 'text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-400 dark:text-slate-600 opacity-60'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isPassed
                    ? 'bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'
                    : isCurrent
                    ? 'bg-brand-600 text-white animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800'
                }`}
              >
                {isPassed ? '✓' : isCurrent ? '●' : ''}
              </div>
              <span>{label}</span>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-500">
        Please don't refresh or close this tab — your creations will be automatically saved to your gallery.
      </p>
    </div>
  );
}
