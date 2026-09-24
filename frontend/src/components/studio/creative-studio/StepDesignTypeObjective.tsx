'use client';

import React from 'react';
import {
  Target,
  Sparkles,
  TrendingUp,
  ShoppingBag,
  Zap,
  Users,
  Calendar,
  Layers,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export interface ObjectiveOption {
  id: string;
  name: string;
  desc: string;
  icon: any;
  badge?: string;
}

export const OBJECTIVES_LIST: ObjectiveOption[] = [
  {
    id: 'conversion',
    name: 'Direct Sales & Conversion',
    desc: 'Optimized for high CTR, sales, and instant checkout action.',
    icon: ShoppingBag,
    badge: 'High ROI',
  },
  {
    id: 'brand_awareness',
    name: 'Brand Awareness & Prestige',
    desc: 'Establish brand recall, luxury feel, and visual authority.',
    icon: Sparkles,
  },
  {
    id: 'lead_gen',
    name: 'Lead Generation',
    desc: 'Compelling value proposition for signups and consultations.',
    icon: Target,
  },
  {
    id: 'product_launch',
    name: 'Product / Drop Launch',
    desc: 'Spotlight a new product release with dramatic hero aesthetics.',
    icon: Zap,
    badge: 'Popular',
  },
  {
    id: 'seasonal_promo',
    name: 'Flash Sale / Promotion',
    desc: 'Urgent promotional banner with high-contrast offer callout.',
    icon: Calendar,
  },
  {
    id: 'community_engagement',
    name: 'Engagement & Viral Reach',
    desc: 'Relatable, shareable visual crafted to drive saves and comments.',
    icon: Users,
  },
  {
    id: 'feature_announcement',
    name: 'Feature Spotlight',
    desc: 'Showcase key product capabilities and benefits cleanly.',
    icon: TrendingUp,
  },
];

interface StepDesignTypeObjectiveProps {
  designType: 'creative' | 'meta_ad';
  setDesignType: (type: 'creative' | 'meta_ad') => void;
  objective: string;
  setObjective: (obj: string) => void;
}

export function StepDesignTypeObjective({
  designType,
  setDesignType,
  objective,
  setObjective,
}: StepDesignTypeObjectiveProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-500 text-xs font-semibold mb-2 border border-violet-500/20">
          <Target className="w-3.5 h-3.5" />
          <span>Step 2 of 5</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Design Type &amp; Marketing Objective
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Choose whether this is a storytelling brand creative or a direct-response Meta advertisement.
        </p>
      </div>

      {/* Design Type Toggle Cards */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
          Select Design Paradigm
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Creative Design */}
          <button
            type="button"
            onClick={() => setDesignType('creative')}
            className={`p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden ${
              designType === 'creative'
                ? 'border-brand-500 bg-brand-500/10 shadow-md ring-2 ring-brand-500/30'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  designType === 'creative'
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Editorial &amp; Organic
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Creative Design Studio
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Focuses on storytelling, visual depth, brand prestige, and luxury typography. Ideal for feed posts, announcements, and organic engagement.
            </p>
            {designType === 'creative' && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Active Engine: Visual Storytelling</span>
              </div>
            )}
          </button>

          {/* Meta Ad */}
          <button
            type="button"
            onClick={() => setDesignType('meta_ad')}
            className={`p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden ${
              designType === 'meta_ad'
                ? 'border-brand-500 bg-brand-500/10 shadow-md ring-2 ring-brand-500/30'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  designType === 'meta_ad'
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Meta Ad Compliant (&le;20% Text)
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Meta Performance Ad
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Engineered for paid ad campaigns with strict Meta text-density limits, high-contrast CTA pills, and conversion psychology.
            </p>
            {designType === 'meta_ad' && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Active Engine: Meta Performance Optimizer</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Marketing Objective Buttons Grid */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
          Campaign Objective
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {OBJECTIVES_LIST.map((obj) => {
            const Icon = obj.icon;
            const isSelected = objective === obj.id;
            return (
              <button
                key={obj.id}
                type="button"
                onClick={() => setObjective(obj.id)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500/10 shadow-md ring-2 ring-brand-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                      isSelected
                        ? 'bg-brand-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {obj.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
                      {obj.badge}
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{obj.name}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {obj.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
