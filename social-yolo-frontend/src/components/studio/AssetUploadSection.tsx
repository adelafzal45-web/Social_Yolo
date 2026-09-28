'use client';

import React, { useRef } from 'react';
import { Upload, RefreshCw, Sliders, RotateCcw, X, Image as ImageIcon, Sparkles } from 'lucide-react';
import { ProductAnalysisResult } from '@/lib/types';

interface AssetUploadSectionProps {
  file: File | null;
  rawOriginalUrl: string | null;
  cutoutUrl: string | null;
  isRemovingBg: boolean;
  previewMode: 'after' | 'before';
  setPreviewMode: (m: 'after' | 'before') => void;
  bgMode: string;
  setBgMode: (m: any) => void;
  brightness: number;
  setBrightness: (n: number) => void;
  contrast: number;
  setContrast: (n: number) => void;
  saturation: number;
  setSaturation: (n: number) => void;
  activeEditorTool: 'brightness' | 'contrast' | 'saturation';
  setActiveEditorTool: (t: 'brightness' | 'contrast' | 'saturation') => void;
  referenceImageFile: File | null;
  referenceImageUrl: string | null;
  setReferenceImageFile: (f: File | null) => void;
  setReferenceImageUrl: (u: string | null) => void;
  onUploadImage: (f: File) => void;
  analysis: ProductAnalysisResult | null;
  productName: string;
  setProductName: (s: string) => void;
  setHeadline: (s: string) => void;
}

export function AssetUploadSection({
  file,
  rawOriginalUrl,
  cutoutUrl,
  isRemovingBg,
  previewMode,
  setPreviewMode,
  bgMode,
  setBgMode,
  brightness,
  setBrightness,
  contrast,
  setContrast,
  saturation,
  setSaturation,
  activeEditorTool,
  setActiveEditorTool,
  referenceImageFile,
  referenceImageUrl,
  setReferenceImageFile,
  setReferenceImageUrl,
  onUploadImage,
  analysis,
  productName,
  setProductName,
  setHeadline,
}: AssetUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refFileInputRef = useRef<HTMLInputElement>(null);

  const previewFilterStyle = {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column Controls */}
      <div className="lg:col-span-5 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              01 Product Photos
            </span>
            <span className="text-xs text-slate-500 font-normal">
              {file ? '1 photo attached' : 'No photo attached'}
            </span>
          </div>

          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              file
                ? 'border-brand-500/60 bg-brand-50/40 dark:bg-slate-950/60'
                : 'border-slate-300 dark:border-slate-800 hover:border-brand-500/50 bg-slate-50/80 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-950/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUploadImage(f);
              }}
              className="hidden"
            />

            <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>

            <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">
              {file ? file.name : 'Upload product photo'}
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
              Background is cleanly extracted; fine typography, logos and product edges stay 100% intact.
            </p>

            {isRemovingBg && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-xs border border-brand-200 dark:border-brand-800 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Extracting clean subject cutout...</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Primary image is used as the hero shot across all social creatives.
          </p>
        </div>

        {/* Reference Image Cue */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Reference Image
            </span>
            <span className="text-[11px] text-slate-500">Optional</span>
          </div>
          <input
            ref={refFileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setReferenceImageFile(f);
                setReferenceImageUrl(URL.createObjectURL(f));
              }
            }}
            className="hidden"
          />
          {referenceImageUrl ? (
            <div className="border border-brand-500/40 rounded-xl p-2.5 bg-brand-50/50 dark:bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <img
                  src={referenceImageUrl}
                  alt="Mood reference"
                  className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-900 dark:text-white truncate max-w-[180px]">
                    {referenceImageFile?.name || 'Reference Image'}
                  </p>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Mood cue loaded</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReferenceImageFile(null);
                  setReferenceImageUrl(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:bg-slate-800 transition"
                title="Remove reference"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-950/30 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="text-[11px]">Upload mood reference</span>
              <button
                type="button"
                onClick={() => refFileInputRef.current?.click()}
                className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium text-[11px] transition"
              >
                Browse
              </button>
            </div>
          )}
          <p className="text-[10px] text-slate-500 mt-1">
            Used as a style cue only — layout, mood &amp; color balance.
          </p>
        </div>

        {/* Background Treatment Chips */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
            02 Background Environment
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'ai_replace', label: 'AI Studio' },
              { id: 'studio_solid', label: 'Solid Color' },
              { id: 'nature', label: 'Nature / Sun' },
              { id: 'luxury_marble', label: 'Marble Gold' },
              { id: 'neon', label: 'Neon Glow' },
              { id: 'keep_original', label: 'Keep Photo' },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setBgMode(mode.id)}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition border ${
                  bgMode === mode.id
                    ? 'bg-brand-100 dark:bg-brand-950/90 border-brand-500 text-brand-800 dark:text-brand-200 shadow-md shadow-brand-500/10'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* On-Site Detail & Clarity Enhancer */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              03 Detail &amp; Tone Tuning
            </span>
            <button
              type="button"
              onClick={() => {
                setBrightness(100);
                setContrast(105);
                setSaturation(105);
              }}
              className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="flex gap-1.5">
            {[
              { id: 'brightness', label: 'Brightness', val: brightness, set: setBrightness },
              { id: 'contrast', label: 'Contrast', val: contrast, set: setContrast },
              { id: 'saturation', label: 'Saturation', val: saturation, set: setSaturation },
            ].map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveEditorTool(tool.id as any)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                  activeEditorTool === tool.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tool.label}
              </button>
            ))}
          </div>

          {activeEditorTool === 'brightness' && (
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                <span>Brightness</span>
                <span className="text-slate-900 dark:text-white font-mono">{brightness}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="160"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
            </div>
          )}

          {activeEditorTool === 'contrast' && (
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                <span>Contrast</span>
                <span className="text-slate-900 dark:text-white font-mono">{contrast}%</span>
              </div>
              <input
                type="range"
                min="70"
                max="150"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
            </div>
          )}

          {activeEditorTool === 'saturation' && (
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                <span>Saturation</span>
                <span className="text-slate-900 dark:text-white font-mono">{saturation}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="160"
                value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Live Comparison Canvas */}
      <div className="lg:col-span-7 space-y-4">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden relative shadow-lg dark:shadow-2xl flex flex-col items-center justify-center p-6 min-h-[460px]">
          {/* Top Before / After Toggle */}
          <div className="absolute top-4 right-4 z-20 flex bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-full p-0.5 shadow-md backdrop-blur-md">
            <button
              type="button"
              onClick={() => setPreviewMode('after')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                previewMode === 'after'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              After Cutout
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('before')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                previewMode === 'before'
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Before Raw
            </button>
          </div>

          {/* Floating Badges */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 uppercase">
              {isRemovingBg ? 'SEGMENTING' : 'AI READY'}
            </span>
            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-brand-100 dark:bg-brand-950/80 text-brand-800 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60 uppercase">
              {bgMode.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {/* Interactive Visual Canvas */}
          <div
            className="w-full max-w-sm aspect-square rounded-2xl flex items-center justify-center relative overflow-hidden transition-all shadow-inner"
            style={{
              backgroundImage:
                bgMode === 'transparent'
                  ? 'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)'
                  : 'radial-gradient(circle at center, rgba(124, 92, 255, 0.08) 0%, rgba(15, 23, 42, 0.04) 100%)',
              backgroundSize: bgMode === 'transparent' ? '20px 20px' : 'cover',
            }}
          >
            {isRemovingBg ? (
              <div className="text-center space-y-3 p-6">
                <RefreshCw className="w-10 h-10 animate-spin text-brand-600 dark:text-brand-400 mx-auto" />
                <p className="text-xs font-bold text-slate-900 dark:text-white">Extracting subject &amp; preserving details...</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">Neural ONNX background removal in progress</p>
              </div>
            ) : previewMode === 'after' && cutoutUrl ? (
              <img
                src={cutoutUrl}
                alt="Cutout product"
                style={previewFilterStyle}
                className="max-h-[85%] max-w-[85%] object-contain drop-shadow-2xl transition-all duration-150"
              />
            ) : rawOriginalUrl ? (
              <img
                src={rawOriginalUrl}
                alt="Raw product"
                className="max-h-[88%] max-w-[88%] object-contain rounded-xl shadow-lg transition-all"
              />
            ) : (
              <div className="text-center p-6 space-y-2 text-slate-500">
                <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-900 flex items-center justify-center mx-auto text-2xl">
                  ✨
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-400">Upload an image to see live cutout</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-600">Product, retail, fashion, food &amp; cosmetics supported</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Vision Detection Card */}
        {analysis && (
          <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/50 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-brand-700 dark:text-brand-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                AI Vision Detected:
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {analysis.niche || 'Commercial Product'}
              </span>
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200">
              Product: <strong>{productName || analysis.productName}</strong>
            </p>
            {analysis.suggestedHeadlines?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {analysis.suggestedHeadlines.slice(0, 3).map((hl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setHeadline(hl)}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-brand-400 text-slate-700 dark:text-slate-300 transition shadow-sm"
                  >
                    "{hl}"
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
