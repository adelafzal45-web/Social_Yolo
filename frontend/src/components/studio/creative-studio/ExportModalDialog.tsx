'use client';

import React, { useState } from 'react';
import {
  Download,
  X,
  FileImage,
  Layers,
  Sparkles,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { CreativeVariation } from '@/lib/types';
import { exportStudioCreativeApi } from '@/lib/api';

interface ExportModalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  variation: CreativeVariation;
  defaultPlatform?: string;
}

export function ExportModalDialog({
  isOpen,
  onClose,
  variation,
  defaultPlatform = 'Instagram Post',
}: ExportModalDialogProps) {
  const [format, setFormat] = useState<'png' | 'jpg' | 'webp'>('png');
  const [dimensionMode, setDimensionMode] = useState<string>('original');
  const [customWidth, setCustomWidth] = useState<number>(variation.width || 1080);
  const [customHeight, setCustomHeight] = useState<number>(variation.height || 1350);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ downloadUrl: string; sizeBytes?: number } | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportResult(null);

    try {
      const payload: any = {
        variationId: variation.id,
        format,
        platform: defaultPlatform,
      };

      if (dimensionMode === 'square') {
        payload.customWidth = 1080;
        payload.customHeight = 1080;
      } else if (dimensionMode === 'story') {
        payload.customWidth = 1080;
        payload.customHeight = 1920;
      } else if (dimensionMode === 'portrait') {
        payload.customWidth = 1080;
        payload.customHeight = 1350;
      } else if (dimensionMode === 'landscape') {
        payload.customWidth = 1200;
        payload.customHeight = 628;
      }

      const res = await exportStudioCreativeApi(payload);
      if (res && res.downloadUrl) {
        setExportResult(res);

        // Auto trigger download
        const a = document.createElement('a');
        a.href = res.downloadUrl;
        a.download = `socialyolo-${variation.conceptStyle.toLowerCase()}-${format}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: any) {
      setExportError(err.message || 'Failed to export creative asset');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Download className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Export Creative Asset
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {variation.label} • {variation.conceptStyle} Style
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Format Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
              Select File Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'png', name: 'PNG', desc: 'Lossless quality, crisp vector text' },
                { id: 'jpg', name: 'JPG', desc: 'High-res compressed, smaller file' },
                { id: 'webp', name: 'WebP', desc: 'Modern web, super lightweight' },
              ].map((fmt) => {
                const isSelected = format === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setFormat(fmt.id as any)}
                    className={`p-3.5 rounded-2xl border text-left transition ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <span className="block font-bold text-sm text-slate-900 dark:text-white uppercase">
                      {fmt.name}
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      {fmt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dimension Preset */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
              Dimensions &amp; Aspect Ratio
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'original', name: `Native Canvas (${variation.width}×${variation.height})` },
                { id: 'portrait', name: 'Portrait Feed 4:5 (1080×1350)' },
                { id: 'square', name: 'Universal Square 1:1 (1080×1080)' },
                { id: 'story', name: 'Vertical Story 9:16 (1080×1920)' },
              ].map((dim) => {
                const isSelected = dimensionMode === dim.id;
                return (
                  <button
                    key={dim.id}
                    type="button"
                    onClick={() => setDimensionMode(dim.id)}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-1 ring-brand-500'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {dim.name}
                  </button>
                );
              })}
            </div>
          </div>

          {exportResult && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Export generated successfully &amp; downloaded!</span>
              </div>
              <a
                href={exportResult.downloadUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="underline flex items-center gap-1 font-bold"
              >
                <span>Download Again</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {exportError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
              {exportError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Encoding {format.toUpperCase()}...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download {format.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
