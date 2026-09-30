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
  Type,
  EyeOff,
  Phone,
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

  // Mirrors exactly what the backend will typeset as the [C1] contact line.
  const contactLine =
    formData.brand.showContactOnImage &&
    ((formData.brand.contactEmail || '').trim() || (formData.brand.contactPhone || '').trim())
      ? [
          (formData.brand.contactPhone || '').trim(),
          (formData.brand.contactEmail || '').trim(),
        ]
          .filter(Boolean)
          .join('  ·  ')
      : '';

  const reviewItems = [
    {
      step: 1,
      title: 'Brand Identity',
      icon: Globe,
      value: formData.brand.brandName || 'Default Brand',
      extra: (
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex items-center gap-2 flex-wrap">
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
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                formData.brand.showLogoOnImage
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              {formData.brand.showLogoOnImage ? 'Logo on image' : 'No logo'}
            </span>
          </div>

          {/* Contact line status — mirrors exactly what gets typeset. */}
          {contactLine ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 text-[10px] font-bold border border-brand-200 dark:border-brand-800/60">
                <Phone className="w-3 h-3" />
                {contactLine}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {formData.brand.contactPlacement === 'auto'
                  ? 'AI decides placement'
                  : formData.brand.contactPlacement?.replace(/_/g, ' ')}
              </span>
            </div>
          ) : null}
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
      title: 'Your Post',
      icon: FileText,
      value:
        formData.onImageText?.trim() || 'No post message specified yet',
      isQuote: true,
      extra: (
        <div className="mt-2 flex flex-col gap-1.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase">
            How it&apos;s set
          </div>
          {formData.onImageText?.trim() ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 text-xs font-bold border border-brand-200 dark:border-brand-800/60">
                <Type className="w-3.5 h-3.5" />
                “{formData.onImageText}”
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {formData.onImageTextFont}
                {' · '}
                {formData.onImageTextPlacement === 'auto'
                  ? 'AI decides placement'
                  : formData.onImageTextPlacement.replace(/_/g, ' ')}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5" />
              No message yet — the image will be generated with no text on it.
            </span>
          )}
          {/* User reference screenshots and their optional instructions */}
          {formData.referenceImages?.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                Reference images ({formData.referenceImages.length})
              </div>
              <div className="flex flex-col gap-1.5">
                {formData.referenceImages.map((r, i) => (
                  <div key={r.id} className="flex items-start gap-2">
                    <img
                      src={r.previewUrl}
                      alt={`Reference ${i + 1}`}
                      className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 object-cover flex-shrink-0"
                    />
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug min-w-0">
                      {r.note?.trim() ? (
                        <>“{r.note}”</>
                      ) : (
                        <span className="text-slate-400 italic">
                          Style reference only (no note)
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
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

      {/* Graceful & UI-friendly Generate CTA */}
      <div className="pt-4 pb-2 flex flex-col items-center justify-center gap-3">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 hover:from-brand-500 hover:via-indigo-500 hover:to-violet-500 text-white font-bold text-base shadow-xl shadow-brand-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          <Sparkles className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform duration-200" />
          <span>Generate My Post</span>
          {Boolean(formData.variationsCount && formData.variationsCount > 1) && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
              {formData.variationsCount} Variants
            </span>
          )}
        </button>

        <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>
            {(formData.variationsCount || 1) * 5} Credits · Balance: {userCredits} Credits
          </span>
        </div>
      </div>
    </div>
  );
}
