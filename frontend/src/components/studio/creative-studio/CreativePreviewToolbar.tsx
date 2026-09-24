'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Crown,
  MinusCircle,
  Zap,
  Type,
  Layout,
  RefreshCw,
  MousePointerClick,
  Loader2,
  Check,
} from 'lucide-react';
import { CreativeVariation } from '@/lib/types';

interface CreativePreviewToolbarProps {
  variation: CreativeVariation;
  onRefine: (action: string, customCta?: string) => Promise<void>;
  isRefining: boolean;
}

export const REFINEMENT_ACTIONS = [
  {
    action: 'regenerate',
    label: 'Regenerate',
    desc: 'Generate a fresh visual direction',
    icon: RefreshCw,
  },
  {
    action: 'make_premium',
    label: 'Make Premium',
    desc: 'Deepen luxury, refine negative space',
    icon: Crown,
  },
  {
    action: 'make_minimal',
    label: 'Make Minimal',
    desc: 'Strip back to essential elements',
    icon: MinusCircle,
  },
  {
    action: 'make_bold',
    label: 'Make Bold',
    desc: 'Boost contrast and punchy weights',
    icon: Zap,
  },
  {
    action: 'better_typography',
    label: 'Improve Typography',
    desc: 'Enhance hierarchy and leading',
    icon: Type,
  },
  {
    action: 'change_layout',
    label: 'Shift Layout',
    desc: 'Rearrange headline and hero lockup',
    icon: Layout,
  },
];

export function CreativePreviewToolbar({
  variation,
  onRefine,
  isRefining,
}: CreativePreviewToolbarProps) {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [customCtaInput, setCustomCtaInput] = useState(variation.ctaText || '');
  const [showCtaEditor, setShowCtaEditor] = useState(false);

  const handleActionClick = async (action: string) => {
    setActiveAction(action);
    try {
      await onRefine(action);
    } finally {
      setActiveAction(null);
    }
  };

  const handleUpdateCta = async () => {
    if (!customCtaInput.trim()) return;
    setActiveAction('update_cta');
    try {
      await onRefine('update_cta', customCtaInput.trim());
      setShowCtaEditor(false);
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            One-Click Aesthetic Refinement
          </h4>
        </div>
        <button
          type="button"
          onClick={() => setShowCtaEditor(!showCtaEditor)}
          className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1"
        >
          <MousePointerClick className="w-3.5 h-3.5" />
          <span>{showCtaEditor ? 'Close CTA Edit' : 'Edit CTA Text'}</span>
        </button>
      </div>

      {/* Button-Driven Refinement Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {REFINEMENT_ACTIONS.map((item) => {
          const Icon = item.icon;
          const isLoading = isRefining && activeAction === item.action;

          return (
            <button
              key={item.action}
              type="button"
              disabled={isRefining}
              onClick={() => handleActionClick(item.action)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 hover:bg-brand-500/5 dark:hover:bg-brand-500/10 text-left transition disabled:opacity-50 cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-500 group-hover:text-white flex items-center justify-center text-slate-600 dark:text-slate-300 transition">
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                  {item.label}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1">
                  {item.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Optional CTA text override panel */}
      {showCtaEditor && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 animate-in fade-in">
          <input
            type="text"
            value={customCtaInput}
            onChange={(e) => setCustomCtaInput(e.target.value)}
            placeholder="e.g. Claim 50% Off Today"
            className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="button"
            onClick={handleUpdateCta}
            disabled={isRefining || !customCtaInput.trim()}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition"
          >
            {isRefining && activeAction === 'update_cta' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>Apply CTA</span>
          </button>
        </div>
      )}
    </div>
  );
}
