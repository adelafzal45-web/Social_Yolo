'use client';

import React from 'react';
import {
  CheckCircle2,
  Sparkles,
  Edit3,
  Globe,
  Layers,
  FileText,
  Users,
  Palette,
  Share2,
  Image as ImageIcon,
  Zap,
  Copy,
} from 'lucide-react';
import { WizardFormData } from './types';
import { POST_TYPES } from './PostTypeStep';
import { STYLES } from './StyleStep';
import { PLATFORMS } from './PlatformStep';
import { VISUAL_DIRECTIONS } from './VisualDirectionStep';

interface ReviewStepProps {
  formData: WizardFormData;
  userCredits: number;
  onEditStep: (stepNum: number) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onChangeVariationsCount?: (count: number) => void;
}

export function ReviewStep({
  formData,
  userCredits,
  onEditStep,
  onGenerate,
  isGenerating,
  onChangeVariationsCount,
}: ReviewStepProps) {
  // Resolvers for human labels
  const postTypeObj = POST_TYPES.find((t) => t.id === formData.postType);
  const postTypeLabel =
    formData.postType === 'custom'
      ? formData.customPostType || 'Custom Format'
      : postTypeObj?.title || 'Social Media Post';

  const styleObj = STYLES.find((s) => s.id === formData.style);
  const styleLabel = styleObj?.title || formData.style || 'Modern';

  const platformObj = PLATFORMS.find((p) => p.id === formData.platform);
  const platformLabel = `${platformObj?.name || 'Instagram'} (${formData.aspectRatio})`;

  const visualObj = VISUAL_DIRECTIONS.find((v) => v.id === formData.visualDirection);
  const visualLabel = visualObj?.title || 'Let AI Decide';

  const audienceLabel =
    formData.audiences.length > 0
      ? formData.audiences.join(', ') +
        (formData.customAudience ? `, ${formData.customAudience}` : '')
      : formData.customAudience || 'General Audience';

  const reviewItems = [
    {
      step: 1,
      title: 'Brand Identity',
      icon: Globe,
      value: formData.brand.brandName || 'Default Brand',
      extra: (
        <div className="flex items-center gap-2 mt-1">
          {formData.brand.logoUrl && (
            <img
              src={formData.brand.logoUrl}
              alt="Logo"
              className="w-4 h-4 rounded object-contain"
            />
          )}
          <span
            className="w-3 h-3 rounded-full border border-black/10 inline-block"
            style={{ backgroundColor: formData.brand.primaryColor || '#7c5cff' }}
          />
          <span className="text-[11px] text-slate-500 font-mono">
            {formData.brand.fontHeading || 'Playfair Display'}
          </span>
        </div>
      ),
    },
    {
      step: 2,
      title: 'Post Type',
      icon: Layers,
      value: postTypeLabel,
    },
    {
      step: 3,
      title: 'Post Idea',
      icon: FileText,
      value: formData.idea || 'No topic description specified',
      isQuote: true,
    },
    {
      step: 4,
      title: 'Target Audience',
      icon: Users,
      value: audienceLabel,
    },
    {
      step: 5,
      title: 'Visual Style',
      icon: Palette,
      value: styleLabel,
    },
    {
      step: 6,
      title: 'Platform & Size',
      icon: Share2,
      value: platformLabel,
    },
    {
      step: 7,
      title: 'Visual Focus',
      icon: ImageIcon,
      value: visualLabel,
      extra: (
        <div className="flex flex-col gap-1.5 mt-1.5">
          {formData.productImages && formData.productImages.length > 0 ? (
            <div className="flex flex-col gap-1">
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                ✓ {formData.productImages.length}{' '}
                {formData.productImages.length === 1 ? 'product photo' : 'product photos'} attached
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                {formData.productImages.map((img, i) => (
                  <div
                    key={img.id || i}
                    className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0"
                    title={img.file.name}
                  >
                    <img
                      src={img.cutoutUrl || img.rawUrl}
                      alt={img.file.name}
                      className="w-full h-full object-contain p-0.5"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : formData.productFile ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              ✓ Custom product photo attached
            </span>
          ) : null}
          {formData.modelFile && (
            <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
              ✓ Model picture attached
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 text-brand-700 dark:text-brand-300 text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Step 8 · Review & Generate</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Review your creative brief
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Everything is set! You can jump back to edit any section, or click generate to start rendering.
        </p>
      </div>

      {/* Structured Summary Cards */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-sm overflow-hidden">
        {reviewItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {item.title}
                  </div>
                  <div
                    className={`text-sm font-semibold text-slate-900 dark:text-white mt-0.5 ${
                      item.isQuote ? 'italic text-slate-700 dark:text-slate-300 line-clamp-2' : 'truncate'
                    }`}
                  >
                    {item.value}
                  </div>
                  {item.extra}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onEditStep(item.step)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex-shrink-0"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Number of Variants Selector */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <Copy className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                How many variants would you like to generate?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Generate multiple distinct creative concepts to compare, A/B test, or post across your feed.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            {formData.variationsCount || 1} {(formData.variationsCount || 1) === 1 ? 'Variant' : 'Variants'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {[
            { count: 1, label: '1 Variant', subtitle: 'Single Post' },
            { count: 2, label: '2 Variants', subtitle: 'A/B Test' },
            { count: 3, label: '3 Variants', subtitle: 'Recommended' },
            { count: 4, label: '4 Variants', subtitle: 'Campaign Pack' },
          ].map((opt) => {
            const isSelected = (formData.variationsCount || 1) === opt.count;
            return (
              <button
                key={opt.count}
                type="button"
                onClick={() => onChangeVariationsCount?.(opt.count)}
                className={`group flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-center ${
                  isSelected
                    ? 'border-brand-600 dark:border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 shadow-sm ring-1 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 hover:border-brand-400'
                }`}
              >
                <span className="text-sm font-black">{opt.label}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {opt.subtitle}
                </span>
                <span
                  className={`text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded ${
                    isSelected
                      ? 'bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {opt.count * 5} credits
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Credit balance & Generate CTA box */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-brand-900 via-indigo-950 to-slate-950 text-white shadow-xl shadow-brand-900/20 border border-brand-700/40 text-center space-y-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 fill-amber-300" />
            <span>
              Generation Cost: {(formData.variationsCount || 1) * 5} Credits (Balance: {userCredits} Credits)
            </span>
          </div>
          <h3 className="text-xl font-bold tracking-tight">Ready to bring your post to life?</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Our multi-agent pipeline will synthesize the art concept, typography, and visual assets in high definition.
          </p>
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-500 via-indigo-500 to-amber-400 hover:from-brand-400 hover:to-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-brand-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5 fill-slate-950" />
          <span>
            ✨ Generate {(formData.variationsCount || 1) === 1 ? 'My Post' : `${formData.variationsCount} Post Variants`}
          </span>
        </button>
      </div>
    </div>
  );
}
