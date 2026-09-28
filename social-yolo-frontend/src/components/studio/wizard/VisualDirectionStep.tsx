'use client';

import React, { useRef } from 'react';
import {
  Sparkles,
  ShoppingBag,
  User,
  Type,
  Layout,
  Sun,
  Palette,
  Wand2,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  RefreshCw,
  Scissors,
} from 'lucide-react';

export interface VisualDirectionOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const VISUAL_DIRECTIONS: VisualDirectionOption[] = [
  {
    id: 'ai_decide',
    title: 'Let AI Decide',
    description: 'AI automatically crafts the optimal visual hierarchy based on your topic.',
    icon: Wand2,
    badge: 'Recommended',
  },
  {
    id: 'product_focus',
    title: 'Product Focus',
    description: 'Hero product placement front-and-center with studio lighting.',
    icon: ShoppingBag,
  },
  {
    id: 'model_focus',
    title: 'Person / Model',
    description: 'Human-centric emotional resonance, fashion model or ambassador portrait.',
    icon: User,
    badge: 'Model Friendly',
  },
  {
    id: 'text_focus',
    title: 'Text Focus',
    description: 'Typography-driven bold statements, quotes, stats or announcements.',
    icon: Type,
  },
  {
    id: 'product_text',
    title: 'Product + Text',
    description: 'Harmonious split with product hero and high-impact messaging.',
    icon: Layout,
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle',
    description: 'Real-world contextual scenes, natural daylight and ambient vibe.',
    icon: Sun,
  },
  {
    id: 'abstract',
    title: 'Abstract / Creative',
    description: 'Dynamic 3D forms, flowing textures, patterns and artistic energy.',
    icon: Palette,
  },
];

import { UploadedProductImage } from './types';

interface VisualDirectionStepProps {
  selectedDirection: string;
  onSelectDirection: (directionId: string) => void;
  // Multi-image support
  productImages?: UploadedProductImage[];
  onAddProductImages?: (files: File[]) => void;
  onRemoveProductImage?: (id: string) => void;
  onClearAllProductImages?: () => void;
  // Backward compatibility props
  productFile?: File | null;
  rawOriginalUrl?: string | null;
  cutoutUrl?: string | null;
  isProcessingAsset?: boolean;
  onUploadProductFile?: (f: File) => void;
  onRemoveProductFile?: () => void;
  // Model picture
  modelFile: File | null;
  modelRawUrl: string | null;
  modelCutoutUrl: string | null;
  isProcessingModel?: boolean;
  onUploadModelFile: (f: File) => void;
  onRemoveModelFile: () => void;
  // Background mode
  backgroundMode: string;
  onChangeBackgroundMode: (mode: string) => void;
}

export function VisualDirectionStep({
  selectedDirection,
  onSelectDirection,
  productImages = [],
  onAddProductImages,
  onRemoveProductImage,
  onClearAllProductImages,
  productFile,
  rawOriginalUrl,
  cutoutUrl,
  isProcessingAsset = false,
  modelFile,
  modelRawUrl,
  modelCutoutUrl,
  isProcessingModel = false,
  backgroundMode,
  onUploadProductFile,
  onRemoveProductFile,
  onUploadModelFile,
  onRemoveModelFile,
  onChangeBackgroundMode,
}: VisualDirectionStepProps) {
  const productInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  // Normalize product images: use productImages array if available, fallback to single productFile
  const effectiveProductImages: UploadedProductImage[] =
    productImages.length > 0
      ? productImages
      : productFile
      ? [
          {
            id: 'legacy-primary',
            file: productFile,
            rawUrl: rawOriginalUrl || '',
            cutoutUrl: cutoutUrl || null,
            isProcessing: isProcessingAsset,
          },
        ]
      : [];

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList);

    if (onAddProductImages) {
      onAddProductImages(filesArray);
    } else if (onUploadProductFile && filesArray[0]) {
      onUploadProductFile(filesArray[0]);
    }

    // Reset input so user can re-upload identical filename if desired
    e.target.value = '';
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadModelFile(file);
    }
  };

  const handleRemoveItem = (id: string) => {
    if (onRemoveProductImage) {
      onRemoveProductImage(id);
    } else if (onRemoveProductFile) {
      onRemoveProductFile();
    }
  };

  const handleClearAll = () => {
    if (onClearAllProductImages) {
      onClearAllProductImages();
    } else if (onRemoveProductFile) {
      onRemoveProductFile();
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 text-brand-700 dark:text-brand-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 7 · Visual Direction</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          What should the design focus on?
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Choose the hero element of your creative, or let AI select the ideal artistic composition.
        </p>
      </div>

      {/* Grid of Choices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {VISUAL_DIRECTIONS.map((item) => {
          const isSelected = selectedDirection === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectDirection(item.id)}
              className={`group flex items-start gap-3.5 p-4 rounded-2xl border-2 transition-all duration-200 text-left bg-white dark:bg-slate-900 ${
                isSelected
                  ? 'border-brand-600 dark:border-brand-500 bg-brand-50/40 dark:bg-brand-950/20 shadow-md ring-1 ring-brand-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-brand-400'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/50 group-hover:text-brand-600'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {item.title}
                    </h3>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-brand-600 text-white flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* OPTION 1: Product Photos Multi-Upload Section (Optional) */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Have product photos? (Upload 1 or more)
                </h4>
                {effectiveProductImages.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60">
                    {effectiveProductImages.length}{' '}
                    {effectiveProductImages.length === 1 ? 'photo' : 'photos'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Attach one or multiple product angles or items. AI will stage and arrange them harmoniously in the commercial layout.
              </p>
            </div>
          </div>
          {effectiveProductImages.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        <input
          ref={productInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleProductChange}
          className="hidden"
        />

        {effectiveProductImages.length === 0 ? (
          <div
            onClick={() => productInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 rounded-xl p-5 text-center cursor-pointer transition bg-white dark:bg-slate-950 hover:bg-brand-50/20"
          >
            <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
              <Upload className="w-6 h-6 text-brand-600 dark:text-brand-400" />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Click or drag & drop to upload product photos
                </span>
                <span className="text-[11px] text-brand-600 dark:text-brand-400 font-medium">
                  Select multiple files at once or add them one by one
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                PNG, JPG or WEBP (Max 15MB each) · Automatic background isolation applied
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {effectiveProductImages.map((imgItem, idx) => (
                <div
                  key={imgItem.id || idx}
                  className="group relative flex items-center gap-3 p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                  <div className="relative w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-700">
                    <img
                      src={imgItem.cutoutUrl || imgItem.rawUrl}
                      alt={imgItem.file.name}
                      className="w-full h-full object-contain p-1"
                    />
                    {imgItem.isProcessing && (
                      <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center text-white">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        #{idx + 1}
                      </span>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={imgItem.file.name}>
                        {imgItem.file.name}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 truncate">
                      <Scissors className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                      <span className="truncate">
                        {imgItem.isProcessing
                          ? 'Isolating subject…'
                          : imgItem.cutoutUrl
                          ? 'Isolated background'
                          : 'Original image'}
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(imgItem.id)}
                    title="Remove this image"
                    className="absolute top-2 right-2 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Add more button tile */}
              <button
                type="button"
                onClick={() => productInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 bg-white/60 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 hover:text-brand-600 transition min-h-[72px]"
              >
                <Upload className="w-4 h-4" />
                <span className="text-xs font-bold">+ Add Another Image</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* OPTION 2: Model / Person Picture Upload Section (Optional) */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Add Model Picture (Optional)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload a photo of your model, brand ambassador, or yourself to feature them as the hero persona.
              </p>
            </div>
          </div>
          {modelFile && (
            <button
              type="button"
              onClick={onRemoveModelFile}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Remove Model</span>
            </button>
          )}
        </div>

        <input
          ref={modelInputRef}
          type="file"
          accept="image/*"
          onChange={handleModelChange}
          className="hidden"
        />

        {!modelFile ? (
          <div
            onClick={() => modelInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl p-4 text-center cursor-pointer transition bg-white dark:bg-slate-950 hover:bg-indigo-50/20"
          >
            <div className="flex flex-col items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Click or drag & drop to upload model photo
              </span>
              <span className="text-[11px] text-slate-400">
                Attach portrait, fashion shot, or influencer photo (PNG, JPG, WEBP)
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0 border">
              <img
                src={modelCutoutUrl || modelRawUrl || ''}
                alt="Model preview"
                className="w-full h-full object-cover"
              />
              {isProcessingModel && (
                <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center text-white">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {modelFile.name}
              </p>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center justify-center sm:justify-start gap-1 mt-0.5 font-medium">
                <Check className="w-3 h-3 text-indigo-500" />
                <span>Model photo attached &amp; active in art direction</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => modelInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-500 transition"
            >
              Replace Model
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
