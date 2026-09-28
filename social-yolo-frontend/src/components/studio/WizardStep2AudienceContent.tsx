'use client';

import React from 'react';
import { Users, Globe, Tag, ArrowUpRight } from 'lucide-react';

export interface Step2AudienceData {
  targetAudience: string;
  language: string;
  tone: string;
  keyMessage: string;
  cta: string;
}

interface WizardStep2AudienceContentProps {
  data: Step2AudienceData;
  onChange: (fields: Partial<Step2AudienceData>) => void;
}

const AUDIENCE_CHIPS = [
  'Young Professionals (22–35)',
  'Luxury & High-Net-Worth Buyers',
  'Fitness & Health Enthusiasts',
  'Parents & Family Shoppers',
  'Tech Founders & Innovators',
  'Eco-Conscious Consumers',
  'Gen-Z Trendsetters',
  'Small Business Owners',
];

const LANGUAGES = [
  { id: 'English', label: 'English' },
  { id: 'Spanish', label: 'Spanish (Español)' },
  { id: 'French', label: 'French (Français)' },
  { id: 'German', label: 'German (Deutsch)' },
  { id: 'Italian', label: 'Italian (Italiano)' },
  { id: 'Portuguese', label: 'Portuguese (Português)' },
  { id: 'Dutch', label: 'Dutch (Nederlands)' },
  { id: 'Arabic', label: 'Arabic (العربية)' },
  { id: 'Hindi', label: 'Hindi (हिन्दी)' },
  { id: 'Japanese', label: 'Japanese (日本語)' },
];

const CTA_CHIPS = [
  'Shop Now',
  'Order Today',
  'Learn More',
  'Claim 20% Off',
  'Book Consultation',
  'Sign Up Free',
  'Get Started',
  'Limited Stock — Buy Now',
];

export function WizardStep2AudienceContent({
  data,
  onChange,
}: WizardStep2AudienceContentProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Step Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
          <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>STEP 3: AUDIENCE, CONTENT &amp; CTA</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Who are you speaking to?
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Tailor your campaign audience, language, offer details, and call to action.
        </p>
      </div>

      {/* 1. Target Audience */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span>Target Audience</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              Optional
            </span>
          </label>
          <span className="text-xs text-slate-500">
            {data.targetAudience ? 'Specified' : 'Broad commercial audience'}
          </span>
        </div>

        <input
          type="text"
          value={data.targetAudience}
          onChange={(e) => onChange({ targetAudience: e.target.value })}
          placeholder="e.g. Health-conscious coffee enthusiasts aged 25-40 looking for organic beans"
          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
        />

        {/* Quick Audience Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-1">
            Quick suggestions:
          </span>
          {AUDIENCE_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onChange({ targetAudience: chip })}
              className={`px-2.5 py-1 rounded-lg text-xs transition border ${
                data.targetAudience === chip
                  ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              + {chip}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Language Selection */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Campaign Language</span>
          </span>
          <span className="text-[10px] text-slate-500">Optional</span>
        </label>
        <select
          value={data.language}
          onChange={(e) => onChange({ language: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.label}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Generated headlines and body copy will be synthesized in this language.
        </p>
      </div>

      {/* 3. Offer / Value Details & Call To Action (CTA) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Offer / Value Proposition</span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                Optional
              </span>
            </span>
          </label>
          <input
            type="text"
            value={data.keyMessage}
            onChange={(e) => onChange({ keyMessage: e.target.value })}
            placeholder="e.g. 20% Off First Subscription + Free Tumbler"
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Any discount code, guarantee, or special promotion to highlight.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Call To Action (CTA)</span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                Optional
              </span>
            </span>
          </label>
          <input
            type="text"
            value={data.cta}
            onChange={(e) => onChange({ cta: e.target.value })}
            placeholder="e.g. Shop Now, Claim Offer, Link in Bio"
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {CTA_CHIPS.slice(0, 4).map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => onChange({ cta: chip })}
                className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
