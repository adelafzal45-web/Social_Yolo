'use client';

import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Palette,
  Layers,
  Wand2,
  CheckCircle2,
  Brush,
  Clock,
} from 'lucide-react';

interface GenerationStateProps {
  currentStageIndex: number;
  timeRemaining: number;
  platformName?: string;
}

const GENERATION_STAGES = [
  {
    num: 1,
    title: 'Understanding your idea',
    desc: 'Synthesizing context, hooks, and persuasive messaging',
    icon: Sparkles,
  },
  {
    num: 2,
    title: 'Creating the design concept',
    desc: 'Architecting visual balance, hierarchy, and typography',
    icon: Palette,
  },
  {
    num: 3,
    title: 'Generating visuals',
    desc: 'Rendering high-definition commercial scene and artwork',
    icon: Brush,
  },
  {
    num: 4,
    title: 'Applying your brand',
    desc: 'Harmonizing brand color palette, fonts, and logo placement',
    icon: Layers,
  },
  {
    num: 5,
    title: 'Finalizing your post',
    desc: 'Polishing contrast, canvas aspect ratio, and composition',
    icon: Wand2,
  },
];

export function GenerationState({
  currentStageIndex,
  timeRemaining,
  platformName = 'INSTAGRAM',
}: GenerationStateProps) {
  // Smoothly increment a visual progress percentage based on stage
  const [displayProgress, setDisplayProgress] = useState(15);

  useEffect(() => {
    const target = Math.min(95, (currentStageIndex + 1) * 20);
    const interval = setInterval(() => {
      setDisplayProgress((prev) => {
        if (prev < target) return prev + 1;
        return prev;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [currentStageIndex]);

  const activeStage = GENERATION_STAGES[currentStageIndex] || GENERATION_STAGES[0];

  return (
    <div className="py-12 sm:py-16 max-w-xl mx-auto text-center space-y-8 animate-fadeIn">
      {/* Centered Glowing Orb */}
      <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
        {/* Ambient Pulsing Rings */}
        <div className="absolute inset-0 rounded-full bg-brand-500/20 dark:bg-brand-500/30 animate-ping opacity-60" />
        <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-brand-600 via-indigo-600 to-amber-400 opacity-30 blur-xl animate-pulse" />

        {/* Central Icon Circle */}
        <div className="relative z-10 w-24 h-24 rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-amber-400 flex items-center justify-center shadow-2xl shadow-brand-500/40">
          <Sparkles className="w-11 h-11 text-white animate-spin-slow" />
        </div>
      </div>

      {/* Main Status Text */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/70 border border-brand-200 dark:border-brand-800/60 text-brand-700 dark:text-brand-300 text-xs font-bold uppercase tracking-wider">
          <Wand2 className="w-3.5 h-3.5 animate-bounce" />
          <span>AI Multi-Agent Studio Rendering</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Creating your post…
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
          {activeStage.desc}
        </p>
      </div>

      {/* Main Progress Bar & Timer */}
      <div className="space-y-2 max-w-md mx-auto">
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-brand-600 via-indigo-500 to-amber-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${displayProgress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>~{timeRemaining}s remaining</span>
          </span>
          <span>{displayProgress}%</span>
        </div>
      </div>

      {/* Step by Step Generation Stages List */}
      <div className="pt-4 max-w-md mx-auto space-y-2.5 text-left">
        {GENERATION_STAGES.map((stage, idx) => {
          const isDone = idx < currentStageIndex;
          const isCurrent = idx === currentStageIndex;
          const Icon = stage.icon;

          return (
            <div
              key={stage.num}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
                isCurrent
                  ? 'bg-brand-50/80 dark:bg-brand-950/50 border-brand-300 dark:border-brand-800 shadow-sm'
                  : isDone
                  ? 'bg-white/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/40 opacity-80'
                  : 'bg-transparent border-transparent opacity-40'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs transition-colors ${
                  isDone
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-brand-600 text-white animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-bold truncate ${
                    isCurrent
                      ? 'text-brand-900 dark:text-brand-200'
                      : isDone
                      ? 'text-slate-700 dark:text-slate-300'
                      : 'text-slate-400'
                  }`}
                >
                  {stage.title}
                </p>
              </div>

              {isCurrent && (
                <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider animate-pulse">
                  Working…
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
