'use client';

import React, { useRef } from 'react';
import { Image as ImageIcon, Upload, X, Sparkles, Sliders, FileText } from 'lucide-react';

export interface Step4AssetsData {
  file: File | null;
  logoFile?: File | null;
  referenceFile?: File | null;
  backgroundMode: string;
  additionalInstructions: string;
}

interface WizardStep4AssetsProps {
  data: Step4AssetsData;
  onChange: (fields: Partial<Step4AssetsData>) => void;
  rawOriginalUrl: string | null;
  cutoutUrl: string | null;
  isProcessingAsset?: boolean;
  onUploadProductFile: (f: File) => void;
  onRemoveProductFile: () => void;
}

const BG_MODES = [
  { id: 'ai_replace', label: 'AI Studio Staging', desc: 'Cinematic staging with dynamic studio lighting & soft shadows' },
  { id: 'studio_solid', label: 'Solid Studio Backdrop', desc: 'Clean monochrome commercial pedestal' },
  { id: 'nature', label: 'Sunlit Nature', desc: 'Golden-hour sunlight, organic textures & botanicals' },
  { id: 'luxury_marble', label: 'Marble & Gold', desc: 'Opulent polished stone with gold reflective highlights' },
  { id: 'neon', label: 'Cyber Neon Glow', desc: 'Vibrant rim lighting & futuristic atmosphere' },
  { id: 'keep_original', label: 'Keep Original Environment', desc: 'Enhance lighting without replacing scene' },
];

export function WizardStep4Assets({
  data,
  onChange,
  rawOriginalUrl,
  cutoutUrl,
  isProcessingAsset = false,
  onUploadProductFile,
  onRemoveProductFile,
}: WizardStep4AssetsProps) {
  const productInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const refImageInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Step Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
          <ImageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>ASSETS &amp; INSTRUCTIONS</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Attach product assets &amp; special instructions
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Upload product photos, logos, or reference imagery. All uploads are completely optional — if you do not have a photo, AI will generate a photorealistic subject from scratch!
        </p>
      </div>

      {/* Upload Dropzones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Primary Product Photo */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Product Photo
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                Optional
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Your actual product or packshot.
            </p>
          </div>

          {data.file ? (
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-brand-300 dark:border-brand-800 flex items-center gap-3">
              {(cutoutUrl || rawOriginalUrl) ? (
                <img
                  src={cutoutUrl || rawOriginalUrl || ''}
                  alt="Product"
                  className="w-12 h-12 rounded-lg object-contain bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-sm">
                  IMG
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {data.file.name}
                </p>
                <p className="text-[10px] text-slate-500">
                  {(data.file.size / 1024).toFixed(0)} KB {isProcessingAsset && '· Segmenting...'}
                </p>
              </div>
              <button
                type="button"
                onClick={onRemoveProductFile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => productInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-brand-500 rounded-xl p-5 text-center cursor-pointer transition bg-white/70 dark:bg-slate-900/60"
            >
              <input
                ref={productInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUploadProductFile(f);
                }}
              />
              <Upload className="w-6 h-6 text-brand-600 dark:text-brand-400 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Upload Product</p>
              <p className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, WEBP up to 20MB</p>
            </div>
          )}
        </div>

        {/* 2. Logo Upload */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Brand Logo
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                Optional
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Transparent PNG logo overlay.
            </p>
          </div>

          {data.logoFile ? (
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-brand-300 dark:border-brand-800 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-brand-600">
                LOGO
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {data.logoFile.name}
                </p>
                <p className="text-[10px] text-slate-500">
                  {(data.logoFile.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChange({ logoFile: null })}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => logoInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-brand-500 rounded-xl p-5 text-center cursor-pointer transition bg-white/70 dark:bg-slate-900/60"
            >
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onChange({ logoFile: f });
                }}
              />
              <Upload className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Upload Logo</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Transparent PNG or SVG</p>
            </div>
          )}
        </div>

        {/* 3. Reference Mood Image */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Reference / Mood
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                Optional
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Visual style or composition guide.
            </p>
          </div>

          {data.referenceFile ? (
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-brand-300 dark:border-brand-800 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-600">
                MOOD
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {data.referenceFile.name}
                </p>
                <p className="text-[10px] text-slate-500">
                  {(data.referenceFile.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChange({ referenceFile: null })}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => refImageInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-brand-500 rounded-xl p-5 text-center cursor-pointer transition bg-white/70 dark:bg-slate-900/60"
            >
              <input
                ref={refImageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onChange({ referenceFile: f });
                }}
              />
              <Sparkles className="w-6 h-6 text-amber-500 dark:text-amber-400 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Upload Reference</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Style, palette, or lighting sample</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Background Treatment Environment */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>Background Treatment &amp; Environment</span>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
            Optional
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BG_MODES.map((mode) => {
            const isSelected = data.backgroundMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onChange({ backgroundMode: mode.id })}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/50 text-slate-900 dark:text-white shadow-sm ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900'
                }`}
              >
                <h4 className="text-xs font-bold leading-tight">{mode.label}</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                  {mode.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Additional Instructions */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Additional Creative Instructions / Special Notes</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              Optional
            </span>
          </span>
        </label>
        <textarea
          rows={3}
          value={data.additionalInstructions}
          onChange={(e) => onChange({ additionalInstructions: e.target.value })}
          placeholder="e.g. Keep typography in upper left corner, ensure product has dramatic golden rim lighting, emphasize organic feel..."
          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition resize-none"
        />
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Any specific composition guidelines, brand restrictions, or artistic notes for the AI Art Director.
        </p>
      </div>
    </div>
  );
}
