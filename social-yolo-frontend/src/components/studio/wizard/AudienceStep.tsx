'use client';

import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  GraduationCap,
  Briefcase,
  Building,
  Heart,
  Compass,
  Sparkles,
  Plus,
  Check,
  X,
} from 'lucide-react';

export interface AudienceOption {
  id: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const AUDIENCE_OPTIONS: AudienceOption[] = [
  {
    id: 'General Audience',
    label: 'General Audience',
    desc: 'Broad, universal appeal suitable for everyone',
    icon: Users,
  },
  {
    id: 'Customers',
    label: 'Customers',
    desc: 'Existing buyers, subscribers & brand advocates',
    icon: UserCheck,
  },
  {
    id: 'Students',
    label: 'Students',
    desc: 'Learners, Gen-Z, high school & college youth',
    icon: GraduationCap,
  },
  {
    id: 'Professionals',
    label: 'Professionals',
    desc: 'Corporate workers, consultants & specialists',
    icon: Briefcase,
  },
  {
    id: 'Business Owners',
    label: 'Business Owners',
    desc: 'Founders, entrepreneurs, executives & SMBs',
    icon: Building,
  },
  {
    id: 'Women',
    label: 'Women',
    desc: 'Tailored feminine resonance, beauty & wellness',
    icon: Heart,
  },
  {
    id: 'Men',
    label: 'Men',
    desc: 'Tailored masculine aesthetic, grooming & lifestyle',
    icon: Compass,
  },
  {
    id: 'Young Adults',
    label: 'Young Adults',
    desc: 'Ages 18-29, trend-conscious digital natives',
    icon: Sparkles,
  },
];

interface AudienceStepProps {
  selectedAudiences: string[];
  customAudience: string;
  onToggleAudience: (audienceId: string) => void;
  onChangeCustomAudience: (val: string) => void;
}

export function AudienceStep({
  selectedAudiences,
  customAudience,
  onToggleAudience,
  onChangeCustomAudience,
}: AudienceStepProps) {
  const [showCustomInput, setShowCustomInput] = useState(Boolean(customAudience));

  return (
    <div className="space-y-8 animate-fadeIn max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 text-brand-700 dark:text-brand-300 text-xs font-semibold">
          <Users className="w-3.5 h-3.5" />
          <span>Step 4 · Target Audience</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Who is this post for?
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Select one or multiple target groups to help AI tune the vocabulary, tone, and visual hook.
        </p>
      </div>

      {/* Grid of Audience Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {AUDIENCE_OPTIONS.map((item) => {
          const isSelected = selectedAudiences.includes(item.id);
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggleAudience(item.id)}
              className={`group flex items-start gap-3.5 p-4 rounded-2xl border-2 transition-all duration-200 text-left bg-white dark:bg-slate-900 ${
                isSelected
                  ? 'border-brand-600 dark:border-brand-500 bg-brand-50/40 dark:bg-brand-950/20 shadow-md ring-1 ring-brand-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-600'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/50 group-hover:text-brand-600'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {item.label}
                  </h3>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors flex-shrink-0 ${
                      isSelected
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'border-slate-300 dark:border-slate-700 bg-transparent'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {item.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Audience Tag / Input */}
      <div className="space-y-3">
        {!showCustomInput && (
          <button
            type="button"
            onClick={() => setShowCustomInput(true)}
            className="inline-flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            <Plus className="w-4 h-4" />
            <span>Add a specific or niche audience</span>
          </button>
        )}

        {showCustomInput && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Custom Target Group:
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(false);
                  onChangeCustomAudience('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={customAudience}
              onChange={(e) => onChangeCustomAudience(e.target.value)}
              placeholder="e.g. Eco-conscious moms aged 30-45, or SaaS product managers"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
}
