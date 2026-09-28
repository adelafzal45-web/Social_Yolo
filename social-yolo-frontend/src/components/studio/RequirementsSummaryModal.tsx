'use client';

import React from 'react';
import { X, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface RequirementsSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmGenerate: () => void;
  productName: string;
  selectedPlatforms: string[];
  selectedStyle: string;
  occasion: string;
  headline: string;
  bodyCopy: string;
  targetAudience: string;
  cta: string;
  brandColors: string[];
  brandTone: string;
  bgMode: string;
  totalCost: number;
  userCredits: number;
  hasInsufficientCredits: boolean;
}

export function RequirementsSummaryModal({
  isOpen,
  onClose,
  onConfirmGenerate,
  productName,
  selectedPlatforms,
  selectedStyle,
  occasion,
  headline,
  bodyCopy,
  targetAudience,
  cta,
  brandColors,
  brandTone,
  bgMode,
  totalCost,
  userCredits,
  hasInsufficientCredits,
}: RequirementsSummaryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" className="modal-dialog bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pre-Render Brief Verification</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Confirm Generation Brief
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review your gathered creative specifications before dispatching to the AI art director.
          </p>
        </div>

        {/* Requirements Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Product / Subject</span>
            <span className="font-semibold text-slate-900 dark:text-white">{productName || 'Featured Product'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Style Direction</span>
            <span className="font-semibold text-slate-900 dark:text-white capitalize">{selectedStyle}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Channels</span>
            <span className="font-semibold text-slate-900 dark:text-white uppercase">{selectedPlatforms.join(', ')}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Campaign Purpose</span>
            <span className="font-semibold text-slate-900 dark:text-white">{occasion || 'Commercial Campaign'}</span>
          </div>
          <div className="col-span-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Headline</span>
            <span className="font-semibold text-slate-900 dark:text-white">"{headline}"</span>
          </div>
          {targetAudience && (
            <div className="col-span-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Audience</span>
              <span className="text-slate-700 dark:text-slate-300">{targetAudience}</span>
            </div>
          )}
          {cta && (
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">CTA</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{cta}</span>
            </div>
          )}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Background Mode</span>
            <span className="font-semibold text-slate-900 dark:text-white">{bgMode}</span>
          </div>
        </div>

        {/* Credit Cost Box */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs">
          <div>
            <span className="font-bold text-slate-900 dark:text-white block">
              {selectedPlatforms.length} Native Multi-Ratio Variations
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
              5 credits per post · {totalCost} credits total
            </span>
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-amber-600 dark:text-amber-400">
              {totalCost} Credits
            </div>
            <div className="text-[10px] text-slate-500">
              Available: {userCredits}
            </div>
          </div>
        </div>

        {hasInsufficientCredits ? (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Insufficient credits to generate this batch. Please top up your balance.</span>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              Modify Brief
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onConfirmGenerate();
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition"
            >
              Confirm &amp; Generate Creatives →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
