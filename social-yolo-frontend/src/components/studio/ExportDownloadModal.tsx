'use client';

import React, { useState } from 'react';
import { Download, Check, FileCheck } from 'lucide-react';
import { GeneratedVariant } from './VariantReviewGrid';

interface ExportDownloadModalProps {
  variants: GeneratedVariant[];
  exportFormat: 'PNG' | 'JPG';
  setExportFormat: (f: 'PNG' | 'JPG') => void;
  onDownloadAll: () => void;
  exportSuccess: boolean;
}

export function ExportDownloadModal({
  variants,
  exportFormat,
  setExportFormat,
  onDownloadAll,
  exportSuccess,
}: ExportDownloadModalProps) {
  const approvedCount = variants.filter((v) => v.status === 'approved').length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-center py-8 animate-in fade-in">
      <div className="w-16 h-16 rounded-3xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto shadow-lg">
        <Download className="w-8 h-8" />
      </div>

      <div className="space-y-1">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">
          Export &amp; High-Res Download
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Your assets are generated in 8k photorealistic quality and formatted for each social network.
        </p>
      </div>

      {/* Format Selection */}
      <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        {(['PNG', 'JPG'] as const).map((fmt) => (
          <button
            key={fmt}
            type="button"
            onClick={() => setExportFormat(fmt)}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
              exportFormat === fmt
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {fmt} (Lossless)
          </button>
        ))}
      </div>

      {/* Summary Box */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-left max-w-md mx-auto space-y-2">
        <div className="flex justify-between text-slate-500">
          <span>Approved Assets to Download:</span>
          <strong className="text-slate-900 dark:text-white">{approvedCount} files</strong>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Target Networks:</span>
          <span className="text-slate-700 dark:text-slate-300 capitalize">
            {Array.from(new Set(variants.map((v) => v.platform))).join(', ')}
          </span>
        </div>
      </div>

      {/* Download Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onDownloadAll}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-amber-500 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-brand-500/25 transition transform hover:-translate-y-0.5"
        >
          <Download className="w-5 h-5" />
          <span>Download All Approved Assets ({approvedCount})</span>
        </button>
      </div>

      {exportSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400 text-xs inline-flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>All high-resolution files have been downloaded to your machine!</span>
        </div>
      )}
    </div>
  );
}
