'use client';

import React from 'react';
import { FileText, Sparkles, Lightbulb } from 'lucide-react';

interface IdeaStepProps {
  idea: string;
  onChangeIdea: (val: string) => void;
  headline?: string;
  onChangeHeadline?: (val: string) => void;
  cta?: string;
  onChangeCta?: (val: string) => void;
  postTypeLabel?: string;
}

const INSPIRATION_PILLS = [
  '50% off flash sale this weekend only',
  'Introducing our new artisan cold brew blend',
  'Early bird tickets for Tech Innovators Summit 2026',
  '3 quick tips to boost your productivity today',
  'We just crossed 100,000 happy customers!',
  'Limited edition midnight leather jacket drop',
];

const CTA_PRESETS = [
  'Shop Now',
  'Learn More',
  'Get Started',
  'Claim Offer',
  'Order Today',
  'Sign Up Free',
  'Book Now',
  'Explore Drop',
];

export function IdeaStep({
  idea,
  onChangeIdea,
  headline = '',
  onChangeHeadline,
  cta = '',
  onChangeCta,
  postTypeLabel,
}: IdeaStepProps) {
  return (
    <div className="space-y-8 animate-fadeIn max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 text-brand-700 dark:text-brand-300 text-xs font-semibold">
          <FileText className="w-3.5 h-3.5" />
          <span>Step 3 · Core Idea & Messaging</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          What is your post about?
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Share your message in plain words, and specify an optional headline & CTA button.
        </p>
      </div>

      {/* Main Large Text Area */}
      <div className="space-y-3">
        <div className="relative rounded-2xl border-2 border-slate-200 dark:border-slate-800 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 transition-all bg-white dark:bg-slate-900 shadow-sm p-4 sm:p-5">
          <textarea
            value={idea}
            onChange={(e) => onChangeIdea(e.target.value)}
            rows={4}
            placeholder="Describe your product, service, offer, event, or campaign idea…"
            className="w-full bg-transparent text-slate-900 dark:text-white text-base sm:text-lg resize-none focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 leading-relaxed"
            autoFocus
          />

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              <span>AI will compose the final visual and copy</span>
            </span>
            <span>{idea.length} characters</span>
          </div>
        </div>

        {/* Quick Inspiration Pills */}
        <div className="space-y-2 pt-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Need inspiration? Click an example:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {INSPIRATION_PILLS.map((pill, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onChangeIdea(pill)}
                className="text-xs px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition shadow-sm text-left"
              >
                “{pill}”
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Headline & Call to Action (CTA) Inputs */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Headline & Call to Action (CTA)</span>
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Optional · AI will compose if left blank</span>
        </div>

        {/* Headline Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Post Headline (Hook)
          </label>
          <input
            type="text"
            value={headline}
            onChange={(e) => onChangeHeadline && onChangeHeadline(e.target.value)}
            placeholder="e.g. Pure Craft. Zero Compromise. (or leave blank for AI)"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
          />
        </div>

        {/* CTA Input + Quick Pills */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Call to Action (CTA Button / Badge)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={cta}
              onChange={(e) => onChangeCta && onChangeCta(e.target.value)}
              placeholder="e.g. Shop Now, Link in Bio, Pre-Order"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
            />
          </div>

          {/* Quick CTA Presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {CTA_PRESETS.map((preset) => {
              const isSelected = cta.toLowerCase() === preset.toLowerCase();
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChangeCta && onChangeCta(preset)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                    isSelected
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-brand-500'
                  }`}
                >
                  {preset}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
