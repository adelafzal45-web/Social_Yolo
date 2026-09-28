'use client';

import React from 'react';
import {
  Globe,
  Layers,
  FileText,
  Users,
  Palette,
  Share2,
  Sparkles,
  CheckCircle2,
  Check,
} from 'lucide-react';

export interface StepItem {
  num: number;
  id: string;
  title: string;
  shortTitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const WIZARD_STEPS: StepItem[] = [
  { num: 1, id: 'brand', title: 'Brand & URL', shortTitle: 'Brand', icon: Globe },
  { num: 2, id: 'type', title: 'Post Type', shortTitle: 'Type', icon: Layers },
  { num: 3, id: 'idea', title: 'Idea & Topic', shortTitle: 'Idea', icon: FileText },
  { num: 4, id: 'audience', title: 'Audience', shortTitle: 'Audience', icon: Users },
  { num: 5, id: 'style', title: 'Design Style', shortTitle: 'Style', icon: Palette },
  { num: 6, id: 'platform', title: 'Platform', shortTitle: 'Platform', icon: Share2 },
  { num: 7, id: 'visuals', title: 'Visual Focus', shortTitle: 'Visuals', icon: Sparkles },
  { num: 8, id: 'review', title: 'Review & Build', shortTitle: 'Review', icon: CheckCircle2 },
];

interface StepIndicatorProps {
  currentStep: number;
  onSelectStep: (stepNum: number) => void;
  completedSteps?: number[];
}

export function StepIndicator({
  currentStep,
  onSelectStep,
}: StepIndicatorProps) {
  const currentStepObj = WIZARD_STEPS.find((s) => s.num === currentStep) || WIZARD_STEPS[0];
  const progressPercent = ((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100;

  return (
    <div className="w-full space-y-4">
      {/* Mobile step status banner */}
      <div className="flex sm:hidden items-center justify-between text-xs px-1">
        <span className="font-semibold text-brand-600 dark:text-brand-400">
          Step {currentStep} of {WIZARD_STEPS.length}: {currentStepObj.title}
        </span>
        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
          {Math.round(progressPercent)}% completed
        </span>
      </div>

      {/* Thin animated progress track */}
      <div className="relative w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-600 via-indigo-600 to-amber-400 transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Desktop / Tablet step nodes */}
      <div className="hidden sm:grid grid-cols-8 gap-1.5 items-center">
        {WIZARD_STEPS.map((step) => {
          const isCurrent = currentStep === step.num;
          const isPast = currentStep > step.num;
          const Icon = step.icon;

          return (
            <button
              key={step.num}
              type="button"
              disabled={step.num > currentStep}
              onClick={() => {
                if (step.num < currentStep) {
                  onSelectStep(step.num);
                }
              }}
              title={step.title}
              className={`group flex flex-col items-center gap-1.5 py-1.5 px-1 rounded-xl transition-all duration-200 text-center ${
                isCurrent
                  ? 'bg-brand-50/80 dark:bg-brand-950/40 text-brand-600 dark:text-brand-300 font-bold shadow-sm'
                  : isPast
                  ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer font-medium'
                  : 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-transform duration-200 ${
                  isCurrent
                    ? 'bg-gradient-to-br from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/30 scale-110'
                    : isPast
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {isPast ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>
              <span className="text-[11px] leading-tight truncate max-w-full">
                {step.shortTitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
