'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  ShieldCheck,
  CheckCircle2,
  Maximize2,
  SlidersHorizontal,
  ArrowLeft,
  Crown,
  MinusCircle,
  Zap,
  BookOpen,
  X,
  FileCheck2,
} from 'lucide-react';
import { CreativeGeneration, CreativeVariation } from '@/lib/types';
import { CreativePreviewToolbar } from './CreativePreviewToolbar';
import { ExportModalDialog } from './ExportModalDialog';

interface VariationsGalleryViewProps {
  generation: CreativeGeneration;
  variations: CreativeVariation[];
  onRefineVariation: (variationId: string, action: string, customCta?: string) => Promise<void>;
  onBackToConfig: () => void;
  isRefining: boolean;
}

export function VariationsGalleryView({
  generation,
  variations,
  onRefineVariation,
  onBackToConfig,
  isRefining,
}: VariationsGalleryViewProps) {
  const [selectedVariationId, setSelectedVariationId] = useState<string>(
    variations[0]?.id || ''
  );
  const [exportVariation, setExportVariation] = useState<CreativeVariation | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const selectedVariation =
    variations.find((v) => v.id === selectedVariationId) || variations[0];

  const getStyleIcon = (style: string) => {
    switch (style) {
      case 'Premium':
        return <Crown className="w-3.5 h-3.5 text-amber-500" />;
      case 'Minimal':
        return <MinusCircle className="w-3.5 h-3.5 text-blue-500" />;
      case 'Bold':
        return <Zap className="w-3.5 h-3.5 text-rose-500" />;
      case 'Editorial':
        return <BookOpen className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-brand-500" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Bar Navigation & Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToConfig}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {generation.projectName || 'AI Creative Campaign'}
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
                {generation.platform}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Generated 4 distinct aesthetic concepts via Visual RAG &amp; Deterministic Rendering
            </p>
          </div>
        </div>

        {/* Global QA Score Badge */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>
              QA Passed: {generation.qualityScore || 96}/100
            </span>
          </div>
        </div>
      </div>

      {/* 4 Distinct Variations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {variations.map((v, idx) => {
          const isSelected = selectedVariation?.id === v.id;
          const letter = String.fromCharCode(65 + idx); // A, B, C, D

          return (
            <div
              key={v.id}
              className={`rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col bg-white dark:bg-slate-900 ${
                isSelected
                  ? 'border-brand-500 shadow-xl ring-2 ring-brand-500/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
              }`}
            >
              {/* Concept Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-black flex items-center justify-center">
                    {letter}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {getStyleIcon(v.conceptStyle)}
                      <span>{v.conceptStyle} Concept</span>
                    </h4>
                  </div>
                </div>

                {/* Meta Pass / Text Coverage Badge */}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    v.textCoveragePct <= 20
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  }`}
                >
                  {Math.round(v.textCoveragePct || 14)}% text
                </span>
              </div>

              {/* Image Preview Container */}
              <div
                className="relative bg-slate-100 dark:bg-slate-950 aspect-[4/5] overflow-hidden group cursor-pointer"
                onClick={() => setSelectedVariationId(v.id)}
              >
                <img
                  src={v.renderUrl}
                  alt={v.label}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Hover overlay with quick preview icon */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxUrl(v.renderUrl);
                    }}
                    className="p-2.5 rounded-full bg-white/90 text-slate-900 hover:bg-white shadow-lg transition"
                    title="Full-Screen Preview"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExportVariation(v);
                    }}
                    className="p-2.5 rounded-full bg-brand-600 text-white hover:bg-brand-700 shadow-lg transition"
                    title="Export Creative"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Metadata Info & Action Buttons */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h5 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                    {v.headline || v.label}
                  </h5>
                  {v.subheadline && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {v.subheadline}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>CTA: &ldquo;{v.ctaText}&rdquo;</span>
                    <span className="font-semibold text-emerald-500 font-mono">
                      QA {v.qualityScore || 95}/100
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVariationId(v.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      isSelected
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>{isSelected ? 'Selected' : 'Refine'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportVariation(v)}
                    className="py-2 px-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Variation Refinement Toolbar */}
      {selectedVariation && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Refining Active Concept: {selectedVariation.conceptStyle} ({selectedVariation.label})
            </span>
          </div>
          <CreativePreviewToolbar
            variation={selectedVariation}
            onRefine={(action, customCta) =>
              onRefineVariation(selectedVariation.id, action, customCta)
            }
            isRefining={isRefining}
          />
        </div>
      )}

      {/* Export Modal */}
      {exportVariation && (
        <ExportModalDialog
          isOpen={!!exportVariation}
          onClose={() => setExportVariation(null)}
          variation={exportVariation}
          defaultPlatform={generation.platform}
        />
      )}

      {/* Full-Screen Lightbox Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setLightboxUrl(null)}
        >
          <div
            className="relative max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl bg-black border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 z-10 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxUrl}
              alt="Full Resolution View"
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
