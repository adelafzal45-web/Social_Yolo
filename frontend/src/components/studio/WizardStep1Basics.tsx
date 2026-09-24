'use client';

import React from 'react';
import { Layers, Sparkles, Check } from 'lucide-react';

export interface Step1BasicsData {
  platform: string;
  purpose: string;
  productName: string;
  mainMessage: string;
}

interface WizardStep1BasicsProps {
  data: Step1BasicsData;
  onChange: (fields: Partial<Step1BasicsData>) => void;
}

export interface PlatformConfig {
  id: string;
  label: string;
  icon: string;
  desc: string;
  ratio: string;
  dims: string;
}

export const PLATFORMS: PlatformConfig[] = [
  { id: 'instagram', label: 'Instagram', icon: '📸', desc: 'Feed & Stories', ratio: '1:1', dims: '1080 × 1080' },
  { id: 'facebook', label: 'Facebook', icon: '👥', desc: 'Feed & Ads', ratio: '1.91:1', dims: '1200 × 628' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', desc: 'B2B & Professional', ratio: '4:5', dims: '1080 × 1350' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', desc: 'Engaging & Viral', ratio: '9:16', dims: '1080 × 1920' },
  { id: 'twitter', label: 'X (Twitter)', icon: '🐦', desc: 'Quick Updates', ratio: '16:9', dims: '1920 × 1080' },
  { id: 'pinterest', label: 'Pinterest', icon: '📌', desc: 'Visual Inspiration', ratio: '9:16', dims: '1080 × 1920' },
];

export const POST_PURPOSES = [
  { id: 'product_launch', label: 'Product Launch', desc: 'Introduce a new product or feature' },
  { id: 'sale_promo', label: 'Sale & Promotion', desc: 'Discounts, seasonal sales & limited offers' },
  { id: 'brand_story', label: 'Brand Story', desc: 'Build trust, values & authentic connection' },
  { id: 'educational', label: 'Educational & Tips', desc: 'How-tos, value-driven advice & guides' },
  { id: 'event_announcement', label: 'Event Announcement', desc: 'Webinars, meetups, parties & releases' },
  { id: 'customer_review', label: 'Customer Testimonial', desc: 'Highlight reviews, quotes & social proof' },
];

export function WizardStep1Basics({ data, onChange }: WizardStep1BasicsProps) {
  const currentPlatform = PLATFORMS.find(
    (p) => p.id.toLowerCase() === data.platform.toLowerCase(),
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Step Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/80">
          <Layers className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>POST BASICS</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          What are we creating today?
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Select your target channel, post intent, and core product topic. AI will craft tailored visuals and copy to match.
        </p>
      </div>

      {/* 1. Target Platform */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span>Target Platform</span>
            <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
              Required
            </span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Selected: <span className="font-semibold text-slate-900 dark:text-white capitalize">{data.platform}</span>
            </span>
            {currentPlatform && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/80">
                Native Ratio: {currentPlatform.ratio} ({currentPlatform.dims})
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PLATFORMS.map((p) => {
            const isSelected = data.platform.toLowerCase() === p.id.toLowerCase();
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange({ platform: p.id })}
                className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/50 text-slate-900 dark:text-white shadow-md ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{p.icon}</span>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px]">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight">{p.label}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{p.desc}</p>
                  <div className="mt-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800/80 text-[9px] font-mono font-semibold text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700/60">
                    <span>{p.ratio}</span>
                    <span className="opacity-40">•</span>
                    <span className="opacity-80">{p.dims}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Post Purpose / Type */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <span>Post Purpose / Campaign Type</span>
          <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
            Required
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {POST_PURPOSES.map((purpose) => {
            const isSelected = data.purpose === purpose.id || data.purpose === purpose.label;
            return (
              <button
                key={purpose.id}
                type="button"
                onClick={() => onChange({ purpose: purpose.id })}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/50 text-slate-900 dark:text-white shadow-md ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{purpose.label}</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                    {purpose.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Product / Service Name & Main Message */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>Product or Service Name</span>
              <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                Required
              </span>
            </span>
          </label>
          <input
            type="text"
            value={data.productName}
            onChange={(e) => onChange({ productName: e.target.value })}
            placeholder="e.g. Single-Origin Cold Brew, Glow Serum, SaaS Pro Suite"
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            The core subject or item featured in the creative.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>Main Message / Core Topic</span>
              <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                Required
              </span>
            </span>
          </label>
          <textarea
            rows={3}
            value={data.mainMessage}
            onChange={(e) => onChange({ mainMessage: e.target.value })}
            placeholder="e.g. Freshly roasted every Tuesday in small batches. Claim 25% off your first subscription box today!"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition resize-none"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            The primary hook or takeaway for your viewers.
          </p>
        </div>
      </div>

      {/* Tip Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 dark:text-amber-300 space-y-0.5">
          <p className="font-bold">Automated Creative Synthesis</p>
          <p className="text-[11px] text-amber-700/90 dark:text-amber-400/90">
            Just specify your product and message. The AI creative engine will automatically translate your inputs into a professional art-directed social graphic.
          </p>
        </div>
      </div>
    </div>
  );
}
