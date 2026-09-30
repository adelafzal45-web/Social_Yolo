'use client';

import React from 'react';
import { Type, Sparkles, Wand2, Info } from 'lucide-react';
import { OnImageTextPlacement } from '@/lib/types';

interface OnImageTextPanelProps {
  /**
   * The single post message, typed in Step 3's main box. This panel only styles
   * it — it is deliberately read-only here so there is one input, not two.
   */
  value: string;
  font: string;
  onChangeFont: (val: string) => void;
  placement: OnImageTextPlacement;
  onChangePlacement: (val: OnImageTextPlacement) => void;
  brandFont?: string;
}

/** Font styles offered for the on-canvas text. */
const FONT_STYLES = [
  'Bold Condensed Sans',
  'Elegant Serif',
  'Modern Geometric Sans',
  'Luxury High-Contrast Didone',
  'Friendly Rounded Sans',
  'Editorial Slab Serif',
  'Minimal Light Sans',
  'Impact Display',
];

/** Placement slots, rendered as a 3x3 grid that mirrors the canvas. */
const PLACEMENTS: Array<{ id: OnImageTextPlacement; label: string }> = [
  { id: 'top_left', label: 'Top Left' },
  { id: 'top_center', label: 'Top Center' },
  { id: 'top_right', label: 'Top Right' },
  { id: 'center_left', label: 'Center Left' },
  { id: 'center', label: 'Center' },
  { id: 'center_right', label: 'Center Right' },
  { id: 'bottom_left', label: 'Bottom Left' },
  { id: 'bottom_center', label: 'Bottom Center' },
  { id: 'bottom_right', label: 'Bottom Right' },
];

/** Preview class per font style, so the picker's meaning is visible. */
const FONT_PREVIEW_CLASS: Record<string, string> = {
  'Bold Condensed Sans': 'font-black tracking-tight uppercase',
  'Elegant Serif': 'font-serif italic',
  'Modern Geometric Sans': 'font-sans-serif font-medium tracking-wide',
  'Luxury High-Contrast Didone':
    'font-serif font-light tracking-[0.2em] uppercase',
  'Friendly Rounded Sans': 'font-sans-serif font-bold',
  'Editorial Slab Serif': 'font-serif font-black',
  'Minimal Light Sans':
    'font-sans-serif font-light tracking-[0.25em] uppercase',
  'Impact Display': 'font-black uppercase leading-none',
};

/**
 * STYLING PANEL — NOT A SECOND INPUT.
 *
 * The text itself is typed once, in the "Your post message" box above. This
 * panel only decides how that same string is set on the canvas (typeface and
 * position). The duplicate text input that used to live here was removed when
 * the two Step 3 boxes were merged, so there is now exactly one place a user
 * types a message.
 *
 * Placement left on "Auto" hands the decision to the AI art director, which
 * reasons about where the subject sits and picks the largest quiet region.
 */
export function OnImageTextPanel({
  value,
  font,
  onChangeFont,
  placement,
  onChangePlacement,
  brandFont,
}: OnImageTextPanelProps) {
  const isActive = value.trim().length > 0;

  // Nothing typed yet — show a lightweight hint instead of an empty panel.
  if (!isActive) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 p-4 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2.5">
        <Type className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          Type your message above and the font and position options unlock here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-brand-600 to-indigo-600 text-white">
          <Type className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              How it&apos;s set
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
              Styling
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your message “{value}” will be printed exactly as written.
          </p>
        </div>
      </div>

      {/* Font style */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Font style
        </label>
        <div className="grid grid-cols-2 gap-2">
          {FONT_STYLES.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onChangeFont(f)}
              title={f}
              className={`px-3 py-2 rounded-xl border text-left transition ${
                font === f
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/50 ring-2 ring-brand-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-brand-400 bg-white dark:bg-slate-900'
              }`}
            >
              <div
                className={`text-sm text-slate-900 dark:text-white truncate ${FONT_PREVIEW_CLASS[f] || ''}`}
              >
                {value.trim()}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {f}
              </div>
            </button>
          ))}
        </div>
        {brandFont && font !== brandFont && (
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3 h-3 flex-shrink-0" />
            Your brand font is “{brandFont}” — pick it to stay on-brand.
          </p>
        )}
      </div>

      {/* Placement */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Where should it appear?
        </label>

        {/* Auto option */}
        <button
          type="button"
          onClick={() => onChangePlacement('auto')}
          className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition ${
            placement === 'auto'
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/50 ring-2 ring-brand-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-brand-400 bg-white dark:bg-slate-900'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              placement === 'auto'
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
          >
            <Wand2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Let AI decide (Recommended)
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Picks the best spot automatically so it never covers your
              product or model.
            </div>
          </div>
        </button>

        {/* 3x3 grid mirroring the canvas */}
        <div className="grid grid-cols-3 gap-1.5">
          {PLACEMENTS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onChangePlacement(p.id)}
              title={p.label}
              className={`px-2 py-2.5 rounded-lg border text-[10px] font-bold transition ${
                placement === p.id
                  ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-brand-400'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reassurance */}
      <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 rounded-lg p-2.5">
        <Sparkles className="w-3.5 h-3.5 text-brand-500 flex-shrink-0 mt-0.5" />
        <p>
          This is the <strong>only</strong> text on the artwork. The AI will not
          invent a headline, caption or slogan of its own.
        </p>
      </div>
    </div>
  );
}
