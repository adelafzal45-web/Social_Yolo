'use client';

import React from 'react';
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  Layers,
  Search,
  Cpu,
  Palette,
  ShieldCheck,
  Type,
  FileCheck2,
} from 'lucide-react';

export const PIPELINE_STAGES = [
  {
    key: 'ANALYZING_BRAND',
    label: 'Analyzing Brand DNA & Guidelines',
    desc: 'Extracting primary colors, typography scale, tone, and brand persona.',
    icon: Sparkles,
  },
  {
    key: 'UNDERSTANDING_OBJECTIVE',
    label: 'Understanding Campaign Goal',
    desc: 'Calibrating marketing objective, audience psychology, and platform dynamics.',
    icon: Layers,
  },
  {
    key: 'VISUAL_RAG_RETRIEVAL',
    label: 'Retrieving References via Visual RAG',
    desc: 'Cosine similarity vector search across high-performing design library.',
    icon: Search,
  },
  {
    key: 'DESIGN_PATTERN_EXTRACTION',
    label: 'Analyzing Aesthetic Patterns',
    desc: 'Extracting composition flow, font weight contrast, and visual treatments.',
    icon: Cpu,
  },
  {
    key: 'COMPOSITION_PLANNING',
    label: 'Planning Original Composition Strategy',
    desc: 'Synthesizing 4 unique layout blueprints (Premium, Minimal, Bold, Editorial).',
    icon: Layers,
  },
  {
    key: 'BACKGROUND_SYNTHESIS',
    label: 'Generating High-Resolution Hero Assets',
    desc: 'AI visual generation for cinematic lighting and contextual backgrounds.',
    icon: Palette,
  },
  {
    key: 'VECTOR_RENDERING',
    label: 'Deterministic Vector Typography Layering',
    desc: 'Sharp rendering of razor-sharp vector typography, shadows, and badges.',
    icon: Type,
  },
  {
    key: 'BRAND_ASSET_INTEGRATION',
    label: 'Applying Brand Colors & Logo Lockup',
    desc: 'Injecting exact hex colors, high-contrast CTA pills, and brand assets.',
    icon: Palette,
  },
  {
    key: 'QUALITY_QA_CHECK',
    label: 'Quality QA & Meta Compliance Check',
    desc: 'Validating text density (&le;20%), readability contrast, and visual harmony.',
    icon: ShieldCheck,
  },
  {
    key: 'FINALIZING_VARIATIONS',
    label: 'Finalizing 4 Creative Concepts',
    desc: 'Encoding multi-resolution outputs for instant preview and multi-format export.',
    icon: FileCheck2,
  },
];

interface GenerationProgressModalProps {
  isOpen: boolean;
  progressPct: number;
  currentStage: string;
  stageMessage?: string;
  onCancel?: () => void;
}

export function GenerationProgressModal({
  isOpen,
  progressPct,
  currentStage,
  stageMessage,
  onCancel,
}: GenerationProgressModalProps) {
  if (!isOpen) return null;

  // Find index of current stage
  const currentIndex = PIPELINE_STAGES.findIndex((s) => s.key === currentStage);
  const activeIndex = currentIndex !== -1 ? currentIndex : Math.floor((progressPct / 100) * 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-brand-500 text-white shadow-sm">
                <Sparkles className="w-4 h-4 animate-spin" />
              </span>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                AI Creative Intelligence Engine
              </h3>
            </div>
            <span className="text-sm font-mono font-bold text-brand-600 dark:text-brand-400">
              {Math.min(100, Math.round(progressPct))}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 transition-all duration-300 ease-out"
              style={{ width: `${Math.max(5, Math.min(100, progressPct))}%` }}
            />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 font-medium truncate">
            {stageMessage || 'Synthesizing agency-grade social media designs...'}
          </p>
        </div>

        {/* 10-Step Timeline List */}
        <div className="p-6 overflow-y-auto space-y-3.5 divide-y divide-slate-100 dark:divide-slate-800/60">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            const isPending = idx > activeIndex;

            return (
              <div
                key={stage.key}
                className={`pt-3 first:pt-0 flex items-start gap-3.5 transition-all duration-200 ${
                  isCurrent
                    ? 'opacity-100'
                    : isCompleted
                    ? 'opacity-80'
                    : 'opacity-40'
                }`}
              >
                {/* State Icon */}
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-400">
                      {idx + 1}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4
                      className={`text-xs font-bold ${
                        isCurrent
                          ? 'text-brand-600 dark:text-brand-400'
                          : isCompleted
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {stage.label}
                    </h4>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 animate-pulse">
                        In Progress
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {stage.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span>Generating 4 distinct variations (Premium, Minimal, Bold, Editorial)</span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
