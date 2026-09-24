'use client';

import React from 'react';
import {
  FileText,
  Sparkles,
  Info,
  CheckCircle2,
  Wand2,
  Tag,
  ArrowRight,
} from 'lucide-react';

interface StepContentOptionalProps {
  productName: string;
  setProductName: (val: string) => void;
  headline: string;
  setHeadline: (val: string) => void;
  subheadline: string;
  setSubheadline: (val: string) => void;
  offer: string;
  setOffer: (val: string) => void;
  customCta: string;
  setCustomCta: (val: string) => void;
  projectName: string;
  platform: string;
  designType: string;
  objective: string;
  style: string;
  composition: string;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function StepContentOptional({
  productName,
  setProductName,
  headline,
  setHeadline,
  subheadline,
  setSubheadline,
  offer,
  setOffer,
  customCta,
  setCustomCta,
  projectName,
  platform,
  designType,
  objective,
  style,
  composition,
  onGenerate,
  isGenerating,
}: StepContentOptionalProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold mb-2 border border-emerald-500/20">
          <FileText className="w-3.5 h-3.5" />
          <span>Step 5 of 5</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Content Guidance &amp; Generation
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review your design parameters and optionally specify exact copy or promotional text.
        </p>
      </div>

      {/* Autonomous Copywriting Guarantee Banner */}
      <div className="p-4 sm:p-5 rounded-2xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-800 dark:text-slate-200 shadow-sm flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0 mt-0.5">
          <Wand2 className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Autonomous Creative Copywriting Enabled
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            You do <strong>not</strong> need to write prompts or invent copy. SocialYolo&apos;s Creative Intelligence will automatically synthesize high-converting headlines, benefit copy, and CTA phrasing aligned with your Brand DNA and selected objective.
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Leave the fields below blank to let AI generate all copy, or fill in any specific wording you require.
          </p>
        </div>
      </div>

      {/* Optional Structured Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Product / Service Name (Optional)
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. SocialYolo Studio Pro"
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-sm transition"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Promotional Offer / Discount Badge (Optional)
          </label>
          <input
            type="text"
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
            placeholder="e.g. Save 30% Today • Limited Drop"
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-sm transition"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Custom Headline (Optional Override)
          </label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Leave blank for AI-generated headline"
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-sm transition"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Custom Subheadline / Key Benefit (Optional)
          </label>
          <input
            type="text"
            value={subheadline}
            onChange={(e) => setSubheadline(e.target.value)}
            placeholder="Leave blank for AI-generated subtext"
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-sm transition"
          />
        </div>
      </div>

      {/* Generation Summary Box */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Campaign Generation Summary
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Platform</span>
            <span className="font-bold text-slate-900 dark:text-white mt-0.5 block truncate">
              {platform}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Engine</span>
            <span className="font-bold text-slate-900 dark:text-white mt-0.5 block truncate">
              {designType === 'meta_ad' ? 'Meta Ad' : 'Creative Studio'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Style</span>
            <span className="font-bold text-slate-900 dark:text-white mt-0.5 block truncate">
              {style}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Composition</span>
            <span className="font-bold text-slate-900 dark:text-white mt-0.5 block truncate">
              {composition}
            </span>
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold text-base shadow-xl hover:shadow-2xl transition duration-200 flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
          >
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span>Generate 4 AI Creative Concepts</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
