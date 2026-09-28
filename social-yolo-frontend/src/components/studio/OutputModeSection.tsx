'use client';

import React from 'react';
import { Check, ShieldCheck } from 'lucide-react';

interface OutputModeSectionProps {
  outputMode: 'creative' | 'static_ad';
  setOutputMode: (m: 'creative' | 'static_ad') => void;
}

export function OutputModeSection({ outputMode, setOutputMode }: OutputModeSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Choose Output Mode</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
          Select between unrestricted creative storytelling and strict commercial advertising compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option 1: Creative Design */}
        <div
          onClick={() => setOutputMode('creative')}
          className={`p-6 rounded-3xl border cursor-pointer transition relative ${
            outputMode === 'creative'
              ? 'bg-brand-50/40 dark:bg-slate-900 border-brand-500 ring-2 ring-brand-500/30 shadow-xl'
              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          {outputMode === 'creative' && (
            <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500 text-white">
              SELECTED
            </span>
          )}
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">Creative Design</h4>
          <p className="text-xs text-brand-700 dark:text-brand-300 mt-1">Full artistic freedom · organic feed &amp; stories</p>
          <ul className="mt-4 space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>No platform ad-policy constraints</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Unrestricted layout &amp; artistic typography coverage</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Best for organic engagement &amp; lifestyle brand building</span>
            </li>
          </ul>
        </div>

        {/* Option 2: Static Ad (Meta Design) */}
        <div
          onClick={() => setOutputMode('static_ad')}
          className={`p-6 rounded-3xl border cursor-pointer transition relative ${
            outputMode === 'static_ad'
              ? 'bg-amber-50/40 dark:bg-slate-900 border-brand-500 ring-2 ring-brand-500/30 shadow-xl'
              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          {outputMode === 'static_ad' && (
            <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500 text-white">
              SELECTED
            </span>
          )}
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">Paid Ad (Commercial Standard)</h4>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Meta &amp; Google ad-policy compliant placements</p>
          <ul className="mt-4 space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <li className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>On-image text bounded under 20% area for optimal ad reach</span>
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>Enforces safe CTA boundary zones for thumbs and status bars</span>
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>High-converting visual hierarchy tuned for ROAS</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
