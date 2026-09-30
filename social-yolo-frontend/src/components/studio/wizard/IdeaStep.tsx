'use client';

import React from 'react';
import { FileText, Sparkles, Lightbulb } from 'lucide-react';
import { OnImageTextPanel } from './OnImageTextPanel';
import { OnImageTextPlacement } from '@/lib/types';

interface IdeaStepProps {
  idea: string;
  onChangeIdea: (val: string) => void;
  postTypeLabel?: string;
  // On-image text overlay (optional)
  onImageText: string;
  onChangeOnImageText: (val: string) => void;
  onImageTextFont: string;
  onChangeOnImageTextFont: (val: string) => void;
  onImageTextPlacement: OnImageTextPlacement;
  onChangeOnImageTextPlacement: (val: OnImageTextPlacement) => void;
  brandFont?: string;
}

const INSPIRATION_PILLS = [
  '50% off flash sale this weekend only',
  'Introducing our new artisan cold brew blend',
  'Early bird tickets for Tech Innovators Summit 2026',
  '3 quick tips to boost your productivity today',
  'We just crossed 100,000 happy customers!',
  'Limited edition midnight leather jacket drop',
];

export function IdeaStep({
  idea,
  onChangeIdea,
  postTypeLabel,
  onImageText,
  onChangeOnImageText,
  onImageTextFont,
  onChangeOnImageTextFont,
  onImageTextPlacement,
  onChangeOnImageTextPlacement,
  brandFont,
}: IdeaStepProps) {
  return (
    <div className="space-y-8 animate-fadeIn max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 text-brand-700 dark:text-brand-300 text-xs font-semibold">
          <FileText className="w-3.5 h-3.5" />
          <span>Step 3 · Core Idea</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          What is your post about?
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Share your message in plain words. Social Yolo will craft the perfect headline, copy, and layout.
        </p>
      </div>

      {/* Main Large Text Area */}
      <div className="space-y-3">
        <div className="relative rounded-2xl border-2 border-slate-200 dark:border-slate-800 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 transition-all bg-white dark:bg-slate-900 shadow-sm p-4 sm:p-5">
          <textarea
            value={idea}
            onChange={(e) => onChangeIdea(e.target.value)}
            rows={5}
            placeholder="Describe your product, service, offer, event, or idea…"
            className="w-full bg-transparent text-slate-900 dark:text-white text-base sm:text-lg resize-none focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 leading-relaxed"
            autoFocus
          />

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              <span>AI will compose the final copy</span>
            </span>
            <span>{idea.length} characters</span>
          </div>
        </div>

        {/* Helper Note */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
          <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-800 dark:text-slate-200">Don’t worry about the wording.</strong>{' '}
            Social Yolo turns your idea into a polished post with headline, body
            copy, and a persuasive call-to-action for your caption.
          </p>
        </div>
      </div>

      {/* Optional: the exact text to print ON the artwork */}
      <OnImageTextPanel
        value={onImageText}
        onChange={onChangeOnImageText}
        font={onImageTextFont}
        onChangeFont={onChangeOnImageTextFont}
        placement={onImageTextPlacement}
        onChangePlacement={onChangeOnImageTextPlacement}
        brandFont={brandFont}
      />

      {/* Quick Inspiration Pills */}
      <div className="space-y-2.5 pt-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Need ideas? Click to use an example:
        </label>
        <div className="flex flex-wrap gap-2">
          {INSPIRATION_PILLS.map((pill, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChangeIdea(pill)}
              className="text-xs px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition shadow-sm text-left"
            >
              “{pill}”
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
