'use client';

import React, { useState } from 'react';
import { Download, RefreshCw, Star, Maximize2, X, Check, Copy } from 'lucide-react';
import { StarsRating } from '@/components/ui/StarsRating';

export interface GeneratedVariant {
  id: string;
  postId?: string;
  platform: string;
  dims: string;
  ratio: string;
  status: 'approved' | 'review' | 'rejected';
  imageUrl: string;
  title: string;
  body: string;
  style: string;
  rating?: number | null;
  isFavorite?: boolean;
}

interface VariantReviewGridProps {
  variants: GeneratedVariant[];
  onToggleStatus: (index: number, status: 'approved' | 'review' | 'rejected') => void;
  onRateVariant: (variant: GeneratedVariant, rating: number) => void;
  onToggleFavorite?: (postId: string) => void;
  onRegenerateSingle: (index: number) => void;
  onRegenerateAll: () => void;
  onProceedToExport: () => void;
  onUpdateVariantCopy: (index: number, newTitle: string, newBody: string) => void;
}

export function VariantReviewGrid({
  variants,
  onToggleStatus,
  onRateVariant,
  onToggleFavorite,
  onRegenerateSingle,
  onRegenerateAll,
  onProceedToExport,
  onUpdateVariantCopy,
}: VariantReviewGridProps) {
  const [lightboxVariant, setLightboxVariant] = useState<GeneratedVariant | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');

  const handleOpenEdit = (idx: number) => {
    setEditingIndex(idx);
    setEditTitle(variants[idx].title || '');
    setEditBody(variants[idx].body || '');
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      onUpdateVariantCopy(editingIndex, editTitle, editBody);
      setEditingIndex(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Lightbox Modal */}
      {lightboxVariant && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxVariant(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-square w-full bg-black flex items-center justify-center">
              <img
                src={lightboxVariant.imageUrl}
                alt={lightboxVariant.platform}
                className="max-h-[70vh] w-auto object-contain"
              />
              <button
                onClick={() => setLightboxVariant(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-white space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">
                    {lightboxVariant.platform} · {lightboxVariant.dims}
                  </span>
                  <h4 className="text-base font-bold mt-0.5">{lightboxVariant.title}</h4>
                </div>
                <a
                  href={lightboxVariant.imageUrl}
                  download={`creative-${lightboxVariant.platform.toLowerCase()}.png`}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Copy Edit Modal */}
      {editingIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Edit Copy for {variants[editingIndex].platform}
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 block mb-1 font-semibold">Headline</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1 font-semibold">Body Copy</label>
                <textarea
                  rows={3}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingIndex(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Generated Multi-Channel Results
            <span className="text-slate-500 dark:text-slate-400 font-normal ml-2">
              · {variants.filter((v) => v.status === 'approved').length} of {variants.length} approved
            </span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Review native platform variations, rate quality for style learning, or regenerate any specific post.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRegenerateAll}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition flex items-center gap-1.5 text-slate-700 dark:text-slate-300"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate all</span>
          </button>
          <button
            type="button"
            onClick={onProceedToExport}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 text-white font-bold text-xs shadow-md transition"
          >
            Proceed to export →
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {variants.map((item, idx) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden flex flex-col justify-between shadow-lg dark:shadow-xl group"
          >
            {/* Visual preview */}
            <div className="aspect-[4/5] bg-slate-100 dark:bg-slate-900 flex items-center justify-center relative overflow-hidden p-4">
              <img
                src={item.imageUrl}
                alt={item.platform}
                className="max-h-[90%] max-w-[90%] object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-300"
              />

              {/* Status Tag */}
              <div className="absolute top-3 left-3">
                <button
                  type="button"
                  onClick={() =>
                    onToggleStatus(
                      idx,
                      item.status === 'approved' ? 'review' : 'approved'
                    )
                  }
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition ${
                    item.status === 'approved'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                  }`}
                >
                  {item.status}
                </button>
              </div>

              {/* Top Right Zoom Button */}
              <button
                type="button"
                onClick={() => setLightboxVariant(item)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition shadow-md hover:scale-110"
                title="Zoom view"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card info */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <strong className="text-slate-900 dark:text-white">{item.platform}</strong>
                  <span className="text-[10px] text-slate-500">{item.dims.split('·')[0]}</span>
                </div>
                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-1">{item.body}</p>
              </div>

              {/* Per-Card Actions */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Rate:</span>
                  <StarsRating
                    initialRating={item.rating || 0}
                    size="sm"
                    onRate={(r) => onRateVariant(item, r)}
                  />
                </div>

                <div className="flex items-center justify-between gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(idx)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 text-slate-700 dark:text-slate-300 text-[11px] transition"
                  >
                    Edit copy
                  </button>

                  <button
                    type="button"
                    onClick={() => onRegenerateSingle(idx)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 text-slate-700 dark:text-slate-300 text-[11px] transition flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Redo</span>
                  </button>

                  <a
                    href={item.imageUrl}
                    download={`creative-${item.platform.toLowerCase()}.png`}
                    className="p-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition"
                    title="Download individual PNG"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
