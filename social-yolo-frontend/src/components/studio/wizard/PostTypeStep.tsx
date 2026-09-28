'use client';

import React from 'react';
import {
  Layers,
  Sparkles,
  Tag,
  ShoppingBag,
  Calendar,
  GraduationCap,
  Megaphone,
  Wand2,
  Check,
} from 'lucide-react';

export interface PostTypeOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  accentGradient: string;
}

export const POST_TYPES: PostTypeOption[] = [
  {
    id: 'social_media',
    title: 'Social Media Post',
    description: 'Engaging feed content, quotes, tips, or everyday brand stories.',
    icon: Sparkles,
    accentGradient: 'from-blue-500/10 via-indigo-500/5 to-purple-500/10',
  },
  {
    id: 'promotional',
    title: 'Promotional Post',
    description: 'Flash sales, limited-time discounts, seasonal offers & deals.',
    icon: Tag,
    badge: 'Popular',
    accentGradient: 'from-amber-500/10 via-orange-500/5 to-rose-500/10',
  },
  {
    id: 'product_ad',
    title: 'Product Advertisement',
    description: 'Showcase a product hero shot with key benefits and call to action.',
    icon: ShoppingBag,
    badge: 'High Conversion',
    accentGradient: 'from-emerald-500/10 via-teal-500/5 to-cyan-500/10',
  },
  {
    id: 'event',
    title: 'Event Post',
    description: 'Webinars, conferences, live sessions, workshops & meetups.',
    icon: Calendar,
    accentGradient: 'from-violet-500/10 via-purple-500/5 to-fuchsia-500/10',
  },
  {
    id: 'educational',
    title: 'Educational Post',
    description: 'Step-by-step guides, infographics, tutorials, and bite-sized tips.',
    icon: GraduationCap,
    accentGradient: 'from-sky-500/10 via-blue-500/5 to-indigo-500/10',
  },
  {
    id: 'announcement',
    title: 'Announcement',
    description: 'Milestones, new feature releases, team updates, or breaking news.',
    icon: Megaphone,
    accentGradient: 'from-rose-500/10 via-pink-500/5 to-amber-500/10',
  },
  {
    id: 'custom',
    title: 'Custom',
    description: 'Tailor-made format tailored for your exact unique campaign vision.',
    icon: Wand2,
    accentGradient: 'from-brand-500/10 via-fuchsia-500/5 to-indigo-500/10',
  },
];

interface PostTypeStepProps {
  selectedType: string;
  customType: string;
  onSelect: (typeId: string) => void;
  onChangeCustomType: (val: string) => void;
}

export function PostTypeStep({
  selectedType,
  customType,
  onSelect,
  onChangeCustomType,
}: PostTypeStepProps) {
  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 text-brand-700 dark:text-brand-300 text-xs font-semibold">
          <Layers className="w-3.5 h-3.5" />
          <span>Step 2 · Creation Type</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          What would you like to create?
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Choose a format to begin. You can customize the styling and platform in upcoming steps.
        </p>
      </div>

      {/* Grid of Large Visual Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {POST_TYPES.map((item) => {
          const isSelected = selectedType === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`relative group text-left p-5 rounded-2xl border-2 transition-all duration-200 bg-white dark:bg-slate-900/90 hover:scale-[1.01] flex flex-col justify-between ${
                isSelected
                  ? 'border-brand-600 dark:border-brand-500 shadow-xl shadow-brand-500/15 ring-2 ring-brand-500/30'
                  : 'border-slate-200 dark:border-slate-800/90 hover:border-brand-400 dark:hover:border-brand-600 shadow-sm'
              }`}
            >
              {/* Subtle card top gradient */}
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.accentGradient} opacity-60 pointer-events-none transition-opacity group-hover:opacity-100`}
              />

              <div className="relative z-10 space-y-3 w-full">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/50 group-hover:text-brand-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                        {item.badge}
                      </span>
                    )}
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* If Custom is selected, show smooth input */}
      {selectedType === 'custom' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-brand-50/70 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 animate-fadeIn space-y-2 max-w-xl mx-auto">
          <label className="block text-xs font-bold text-brand-900 dark:text-brand-200">
            Specify your custom format or theme:
          </label>
          <input
            type="text"
            value={customType}
            onChange={(e) => onChangeCustomType(e.target.value)}
            placeholder="e.g. Podcast cover teaser, YouTube Community poll graphic, or Hiring poster"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
