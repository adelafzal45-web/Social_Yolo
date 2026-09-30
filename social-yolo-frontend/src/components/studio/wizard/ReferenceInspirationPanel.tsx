'use client';

import React, { useRef } from 'react';
import { Images, Plus, X, Sparkles, Info } from 'lucide-react';
import { UserReferenceImage } from '@/lib/types';

interface ReferenceInspirationPanelProps {
  images: UserReferenceImage[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onChangeNote: (id: string, note: string) => void;
  maxImages?: number;
}

/** Quick-start notes so users understand the field without reading the help text. */
const NOTE_SUGGESTIONS = [
  'Match this background treatment',
  'Borrow this colour grade',
  'Copy this lighting setup',
];

/**
 * USER REFERENCE IMAGES ("make it look like this").
 *
 * Lets the user attach screenshots or moodboards as extra creative direction.
 * Each image takes an OPTIONAL note describing what should be taken from it —
 * the note is passed to Gemini as a literal instruction for that specific
 * image, rather than being averaged across the whole set.
 *
 * These are deliberately separate from the product/model/logo uploads: the
 * references only supply *design language*, never the subject.
 */
export function ReferenceInspirationPanel({
  images,
  onAdd,
  onRemove,
  onChangeNote,
  maxImages = 4,
}: ReferenceInspirationPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canAdd = images.length < maxImages;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length > 0) onAdd(picked);
    // Reset so selecting the same file twice still fires a change event.
    e.target.value = '';
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
            images.length > 0
              ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}
        >
          <Images className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Reference images
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
              Optional
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Show us a style you like and tell the AI what to take from it.
          </p>
        </div>
      </div>

      {/* Drop zone / add button */}
      {canAdd ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const dropped = Array.from(e.dataTransfer.files || []);
            if (dropped.length) onAdd(dropped);
          }}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 text-xs font-bold text-slate-600 dark:text-slate-400 transition"
        >
          <Plus className="w-4 h-4" />
          <span>
            Add reference image
            {maxImages - images.length > 0
              ? ` (up to ${maxImages - images.length} more)`
              : ''}
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          Maximum of {maxImages} reference images reached. Remove one to swap it.
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        onChange={handleFiles}
        className="hidden"
      />

      {/* Per-image cards with optional note */}
      {images.length > 0 && (
        <div className="space-y-3">
          {images.map((img, i) => (
            <div
              key={img.id}
              className="flex gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40"
            >
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 flex-shrink-0">
                <img
                  src={img.previewUrl}
                  alt={`Reference ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-0 left-0 px-1.5 py-0.5 text-[9px] font-black bg-black/70 text-white rounded-br">
                  {i + 1}
                </span>
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  What should we take from this? (optional)
                </label>
                <input
                  type="text"
                  value={img.note}
                  onChange={(e) =>
                    onChangeNote(img.id, e.target.value.slice(0, 300))
                  }
                  placeholder="e.g. match this background treatment"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
                <div className="flex flex-wrap gap-1">
                  {NOTE_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onChangeNote(img.id, s)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-950 hover:text-indigo-600 dark:hover:text-indigo-300 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onRemove(img.id)}
                aria-label={`Remove reference ${i + 1}`}
                className="self-start p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Explainer */}
      <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 rounded-lg p-2.5">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
        <p>
          Your references are the <strong>highest priority</strong> creative
          direction — they override anything the AI picks on its own. We copy
          the <strong>design language</strong> only (palette, lighting, layout,
          mood), never another brand’s product, logo or text.
        </p>
      </div>
    </div>
  );
}
