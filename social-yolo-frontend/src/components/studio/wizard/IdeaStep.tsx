'use client';

import React from 'react';
import { Sparkles, Lightbulb, MonitorSmartphone } from 'lucide-react';
import { OnImageTextPanel } from './OnImageTextPanel';
import { ReferenceInspirationPanel } from './ReferenceInspirationPanel';
import { OnImageTextPlacement, UserReferenceImage } from '@/lib/types';

interface IdeaStepProps {
  /**
   * The one and only post input. Whatever the user types is BOTH the art
   * direction the AI designs from and the headline typeset on the creative.
   */
  onImageText: string;
  onChangeOnImageText: (val: string) => void;
  onImageTextFont: string;
  onChangeOnImageTextFont: (val: string) => void;
  onImageTextPlacement: OnImageTextPlacement;
  onChangeOnImageTextPlacement: (val: OnImageTextPlacement) => void;
  brandFont?: string;
  /** True when the user scraped their brand from a website. */
  hasBrandWebsite?: boolean;
  // User reference screenshots / moodboards ("make it look like this")
  referenceImages: UserReferenceImage[];
  onAddReferenceImages: (files: File[]) => void;
  onRemoveReferenceImage: (id: string) => void;
  onChangeReferenceNote: (id: string, note: string) => void;
}

const INSPIRATION_PILLS = [
  '50% off flash sale this weekend only',
  'Our new website is live now',
  'Introducing our new artisan cold brew blend',
  'Early bird tickets for Tech Innovators Summit 2026',
  '3 quick tips to boost your productivity today',
  'We just crossed 100,000 happy customers!',
  'Limited edition midnight leather jacket drop',
];

/**
 * STEP 3 — THE SINGLE POST INPUT.
 *
 * This step used to show two competing boxes: a large "Describe your product,
 * service, offer, event, or idea…" textarea and, underneath it, the on-image
 * text field. In practice people typed into the wrong one, or expected the
 * description to shape the artwork while it was (correctly) treated as
 * non-printable context — which produced a stock-looking image with a sentence
 * slapped across it.
 *
 * There is now exactly ONE field. Whatever the user types is both:
 *   • the art direction the AI reads to decide what to actually photograph, and
 *   • the headline typeset on the finished post.
 * One box, one meaning, no ambiguity.
 */
export function IdeaStep({
  onImageText,
  onChangeOnImageText,
  onImageTextFont,
  onChangeOnImageTextFont,
  onImageTextPlacement,
  onChangeOnImageTextPlacement,
  brandFont,
  hasBrandWebsite = false,
  referenceImages,
  onAddReferenceImages,
  onRemoveReferenceImage,
  onChangeReferenceNote,
}: IdeaStepProps) {
  return (
    <div className="space-y-8 animate-fadeIn max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 text-brand-700 dark:text-brand-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 3 · Your Post</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          What should this post say?
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Write your message in plain words. The AI reads it to design the
          artwork, then prints it on the post.
        </p>
      </div>

      {/* THE one input — art direction and on-canvas copy in a single field */}
      <div className="space-y-3">
        <div className="relative rounded-2xl border-2 border-slate-200 dark:border-slate-800 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 transition-all bg-white dark:bg-slate-900 shadow-sm p-4 sm:p-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Your post message
          </label>
          <textarea
            value={onImageText}
            onChange={(e) => onChangeOnImageText(e.target.value.slice(0, 80))}
            rows={3}
            placeholder="e.g. Our new website is live now"
            className="w-full bg-transparent text-slate-900 dark:text-white text-base sm:text-lg resize-none focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 leading-relaxed font-semibold"
            autoFocus
          />

          <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              <span>Designs the image &amp; prints this text</span>
            </span>
            <span>{onImageText.length}/80</span>
          </div>
        </div>

        {/* Helper Note */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
          <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-800 dark:text-slate-200">
              One sentence is enough.
            </strong>{' '}
            Say what the post is about and the AI figures out the rest — the
            subject, the colours, the layout. It already knows your brand from
            Step 1, so never repeat your colours or logo.
          </p>
        </div>

        {hasBrandWebsite && (
          <div className="p-3.5 rounded-xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 text-xs text-brand-800 dark:text-brand-300 flex items-start gap-2.5">
            <MonitorSmartphone className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Tip:</strong> mention your website, app or online store and
              the AI will show it open on a device, styled in your real brand
              colours and logo.
            </p>
          </div>
        )}
      </div>

      {/* Optional: user reference screenshots / moodboards */}
      <ReferenceInspirationPanel
        images={referenceImages}
        onAdd={onAddReferenceImages}
        onRemove={onRemoveReferenceImage}
        onChangeNote={onChangeReferenceNote}
      />

      {/* Optional: font + placement styling for that same text */}
      <OnImageTextPanel
        value={onImageText}
        font={onImageTextFont}
        onChangeFont={onChangeOnImageTextFont}
        placement={onImageTextPlacement}
        onChangePlacement={onChangeOnImageTextPlacement}
        brandFont={brandFont}
      />

      {/* Quick Inspiration Pills */}
      <div className="space-y-2.5 pt-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Need ideas? Click to use an example:
        </label>
        <div className="flex flex-wrap gap-2">
          {INSPIRATION_PILLS.map((pill, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChangeOnImageText(pill)}
              className="text-xs px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition shadow-sm text-left"
            >
              “{pill}”
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
