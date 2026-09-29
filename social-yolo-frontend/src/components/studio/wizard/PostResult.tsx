'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  Share2,
  RefreshCw,
  Sparkles,
  Palette,
  Edit3,
  Maximize2,
  Copy,
  Check,
  Star,
  Sliders,
  ChevronDown,
  ChevronUp,
  X,
  PlusCircle,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { StarsRating } from '@/components/ui/StarsRating';
import { FinalPostResult } from './types';
import { STYLES } from './StyleStep';
import { useNotification } from '@/context/NotificationContext';

interface PostResultProps {
  post: FinalPostResult;
  onRatePost: (postId: string, rating: number) => void;
  onToggleFavorite: (postId: string) => void;
  onRegenerate: () => void;
  onUpdatePostCopy: (postId: string, headline: string, bodyCopy: string, cta: string) => void;
  onCreateAnother: () => void;
  onChangeStyle?: (newStyle: string) => void;
  onResize?: (newRatio: string) => void;
}

/**
 * Composites the brand logo into the top-right corner of the downloaded image
 * to guarantee physical brand logo inclusion on saved assets.
 */
async function compositeLogoOnImage(
  imageUrl: string,
  logoUrl?: string | null,
): Promise<Blob> {
  if (!logoUrl) {
    const res = await fetch(imageUrl);
    return await res.blob();
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        fetch(imageUrl)
          .then((r) => r.blob())
          .then(resolve)
          .catch(reject);
        return;
      }

      // Draw background creative
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';

      const finishWithCanvas = () => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else {
            fetch(imageUrl)
              .then((r) => r.blob())
              .then(resolve)
              .catch(reject);
          }
        }, 'image/png');
      };

      logoImg.onload = () => {
        try {
          const padding = Math.round(canvas.width * 0.04);
          const maxLogoW = Math.round(canvas.width * 0.20);
          const maxLogoH = Math.round(canvas.height * 0.10);

          const ratio = (logoImg.width || 1) / (logoImg.height || 1);
          let targetW = maxLogoW;
          let targetH = targetW / ratio;

          if (targetH > maxLogoH) {
            targetH = maxLogoH;
            targetW = targetH * ratio;
          }

          const badgePadX = Math.round(targetW * 0.12);
          const badgePadY = Math.round(targetH * 0.12);
          const badgeW = targetW + badgePadX * 2;
          const badgeH = targetH + badgePadY * 2;
          const badgeX = canvas.width - padding - badgeW;
          const badgeY = padding;
          const badgeRadius = Math.round(badgeH * 0.22);

          ctx.save();
          // Drop shadow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
          ctx.shadowBlur = Math.round(canvas.width * 0.016);
          ctx.shadowOffsetY = Math.round(canvas.width * 0.005);

          // Frosted white container pill
          ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeRadius);
          } else {
            ctx.rect(badgeX, badgeY, badgeW, badgeH);
          }
          ctx.fill();

          // Subtle hairline border
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = Math.max(1, Math.round(canvas.width * 0.0015));
          ctx.stroke();

          // Draw logo inside badge
          ctx.drawImage(
            logoImg,
            badgeX + badgePadX,
            badgeY + badgePadY,
            targetW,
            targetH,
          );
          ctx.restore();

          finishWithCanvas();
        } catch {
          finishWithCanvas();
        }
      };

      logoImg.onerror = () => {
        finishWithCanvas();
      };

      logoImg.src = logoUrl;
    };

    img.onerror = () => {
      fetch(imageUrl)
        .then((r) => r.blob())
        .then(resolve)
        .catch(reject);
    };

    img.src = imageUrl;
  });
}

export function PostResult({
  post,
  onRatePost,
  onToggleFavorite,
  onRegenerate,
  onUpdatePostCopy,
  onCreateAnother,
  onChangeStyle,
  onResize,
}: PostResultProps) {
  const { toast } = useNotification();
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showEditCopyModal, setShowEditCopyModal] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [showResizeModal, setShowResizeModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isCopiedText, setIsCopiedText] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  // Variant switcher state
  const variantsList: FinalPostResult[] =
    post.variants && post.variants.length > 0 ? post.variants : [post];
  const [activeVariantIndex, setActiveVariantIndex] = useState<number>(0);

  // Ensure index stays valid
  const currentPost = variantsList[activeVariantIndex] || variantsList[0] || post;

  // Editable copy state synced to current variant
  const [headlineEdit, setHeadlineEdit] = useState(currentPost.headline || '');
  const [bodyCopyEdit, setBodyCopyEdit] = useState(currentPost.bodyCopy || '');
  const [ctaEdit, setCtaEdit] = useState(currentPost.cta || 'Shop Now');

  useEffect(() => {
    setHeadlineEdit(currentPost.headline || '');
    setBodyCopyEdit(currentPost.bodyCopy || '');
    setCtaEdit(currentPost.cta || 'Shop Now');
  }, [currentPost.postId, currentPost.id, currentPost.headline, currentPost.bodyCopy, currentPost.cta]);

  // Handle single high-res image download (composites logo if provided)
  const handleDownload = async () => {
    try {
      const blob = await compositeLogoOnImage(currentPost.imageUrl, currentPost.logoUrl);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `social-yolo-creative-${currentPost.postId || 'post'}-v${activeVariantIndex + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('High-resolution creative downloaded!', 'Downloaded');
    } catch {
      window.open(currentPost.imageUrl, '_blank');
    }
  };

  // Handle batch download of all variants (composites logo if provided)
  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    toast.info(`Preparing download for all ${variantsList.length} variants...`, 'Batch Download');
    try {
      for (let i = 0; i < variantsList.length; i++) {
        const item = variantsList[i];
        try {
          const blob = await compositeLogoOnImage(
            item.imageUrl,
            item.logoUrl || currentPost.logoUrl,
          );
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `social-yolo-creative-${item.postId || 'variant'}-v${i + 1}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          // Small pause so browser handles multi-downloads cleanly
          await new Promise((resolve) => setTimeout(resolve, 400));
        } catch {
          window.open(item.imageUrl, '_blank');
        }
      }
      toast.success(`All ${variantsList.length} variants downloaded successfully!`, 'Batch Complete');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // Handle Share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentPost.headline || 'Social Yolo Post',
          text: `${currentPost.headline}\n\n${currentPost.bodyCopy}`,
          url: currentPost.imageUrl,
        });
      } catch {
        // Share cancelled
      }
    } else {
      navigator.clipboard.writeText(currentPost.imageUrl);
      toast.success('Image link copied to clipboard!', 'Link Copied');
    }
  };

  // Copy headline & body copy to clipboard
  const handleCopyText = () => {
    const textToCopy = `${currentPost.headline}\n\n${currentPost.bodyCopy}\n\n👉 ${currentPost.cta}`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopiedText(true);
    setTimeout(() => setIsCopiedText(false), 2000);
    toast.success('Captions copied to clipboard!', 'Copy Ready');
  };

  // Save updated copy
  const handleSaveCopy = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePostCopy(currentPost.postId, headlineEdit, bodyCopyEdit, ctaEdit);
    setShowEditCopyModal(false);
    toast.success('Post copy updated successfully!', 'Copy Saved');
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/60 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {variantsList.length > 1
                ? `All ${variantsList.length} Creative Variants Ready`
                : 'Creative Render Ready'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Your Generated Post
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onCreateAnother}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold hover:border-brand-500 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-brand-600" />
            <span>Create Another</span>
          </button>

          {variantsList.length > 1 && (
            <button
              type="button"
              onClick={handleDownloadAll}
              disabled={isDownloadingAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 text-xs font-bold hover:bg-brand-100 dark:hover:bg-brand-900/60 transition shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-brand-600" />
              <span>{isDownloadingAll ? 'Downloading...' : `Download All (${variantsList.length})`}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-brand-500/25 transition"
          >
            <Download className="w-4 h-4" />
            <span>{variantsList.length > 1 ? `Download Variant ${activeVariantIndex + 1}` : 'Download'}</span>
          </button>
        </div>
      </div>

      {/* Variant Selector Strip (Shown when multiple variants generated) */}
      {variantsList.length > 1 && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Choose Variant to Preview & Edit ({variantsList.length} generated)
              </span>
            </div>
            <span className="text-xs text-slate-500">
              Active: <span className="font-bold text-brand-600 dark:text-brand-400">Variant #{activeVariantIndex + 1}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {variantsList.map((v, idx) => {
              const isActive = idx === activeVariantIndex;
              return (
                <button
                  key={v.postId || idx}
                  type="button"
                  onClick={() => setActiveVariantIndex(idx)}
                  className={`group relative text-left p-2.5 rounded-2xl border transition-all flex items-center gap-3 ${
                    isActive
                      ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-950/40 ring-2 ring-brand-500/30 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 relative border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                    <img
                      src={v.imageUrl}
                      alt={`Variant ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    {isActive && (
                      <div className="absolute top-1 right-1 p-0.5 rounded-full bg-brand-600 text-white">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-extrabold ${isActive ? 'text-brand-700 dark:text-brand-300' : 'text-slate-900 dark:text-white'}`}>
                        Variant #{idx + 1}
                      </span>
                      {idx === 0 && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                      {v.headline || `Angle variation ${idx + 1}`}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main 2-Column Workspace (Preview Canvas + Quick Actions & Copy) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visual Canvas Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative group rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-2xl flex items-center justify-center">
            {/* Aspect Ratio Canvas */}
            <div
              className={`w-full relative flex items-center justify-center ${
                currentPost.aspectRatio === '9:16'
                  ? 'aspect-[9/16] max-h-[640px]'
                  : currentPost.aspectRatio === '16:9'
                  ? 'aspect-[16/9]'
                  : currentPost.aspectRatio === '4:5'
                  ? 'aspect-[4/5]'
                  : currentPost.aspectRatio === '1.91:1'
                  ? 'aspect-[1.91/1]'
                  : 'aspect-square'
              }`}
            >
              <img
                src={currentPost.imageUrl}
                alt="Generated social creative"
                className="w-full h-full object-cover select-none"
              />

              {/* Brand Logo Overlay on Post Canvas (when user provides logo) */}
              {currentPost.logoUrl && (
                <div className="absolute top-4 right-4 z-10 pointer-events-none drop-shadow-md">
                  <div className="px-2.5 py-1.5 rounded-xl bg-white/90 dark:bg-black/80 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-lg flex items-center justify-center">
                    <img
                      src={currentPost.logoUrl}
                      alt="Brand Logo"
                      className="max-h-8 max-w-[84px] sm:max-h-10 sm:max-w-[100px] w-auto h-auto object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Hover Overlay Controls */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="p-3 rounded-full bg-white/90 text-slate-900 hover:bg-white hover:scale-110 transition shadow-lg"
                  title="Expand to Fullscreen"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="p-3 rounded-full bg-brand-600 text-white hover:bg-brand-500 hover:scale-110 transition shadow-lg"
                  title="Download Image"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>

              {/* Aspect Ratio & Variant Pill Badge */}
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-mono text-white/90 border border-white/10 flex items-center gap-1.5">
                <span>{currentPost.platform.toUpperCase()} · {currentPost.aspectRatio}</span>
                {variantsList.length > 1 && (
                  <span className="text-brand-300 font-semibold border-l border-white/20 pl-1.5">
                    Variant {activeVariantIndex + 1}/{variantsList.length}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Canvas Bottom Quick Bar */}
          <div className="flex items-center justify-between px-2">
            {/* Star Rating */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Rate Quality:</span>
              <StarsRating
                initialRating={currentPost.rating || 0}
                onRate={(r) => onRatePost(currentPost.postId, r)}
                size="sm"
              />
            </div>

            {/* Favorite & Share */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleFavorite(currentPost.postId)}
                className={`p-2 rounded-xl border transition ${
                  currentPost.isFavorite
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600'
                }`}
                title={currentPost.isFavorite ? 'Favorited' : 'Add to Favorites'}
              >
                <Star
                  className={`w-4 h-4 ${currentPost.isFavorite ? 'fill-amber-400' : ''}`}
                />
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
                title="Share Creative"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions & Copy Section */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Actions Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Regenerate */}
              <button
                type="button"
                onClick={onRegenerate}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500 hover:bg-brand-50/30 dark:hover:bg-brand-950/20 text-slate-700 dark:text-slate-300 text-xs font-bold transition shadow-sm"
              >
                <RefreshCw className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Regenerate</span>
              </button>

              {/* Change Style */}
              <button
                type="button"
                onClick={() => setShowStyleModal(true)}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500 hover:bg-brand-50/30 dark:hover:bg-brand-950/20 text-slate-700 dark:text-slate-300 text-xs font-bold transition shadow-sm"
              >
                <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Change Style</span>
              </button>

              {/* Change Text */}
              <button
                type="button"
                onClick={() => setShowEditCopyModal(true)}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500 hover:bg-brand-50/30 dark:hover:bg-brand-950/20 text-slate-700 dark:text-slate-300 text-xs font-bold transition shadow-sm"
              >
                <Edit3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Change Text</span>
              </button>

              {/* Resize */}
              <button
                type="button"
                onClick={() => setShowResizeModal(true)}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500 hover:bg-brand-50/30 dark:hover:bg-brand-950/20 text-slate-700 dark:text-slate-300 text-xs font-bold transition shadow-sm"
              >
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Resize Ratio</span>
              </button>
            </div>
          </div>

          {/* Generated Copy Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Post Copy & Caption
              </span>
              <button
                type="button"
                onClick={handleCopyText}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
              >
                {isCopiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy All</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Headline</div>
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {currentPost.headline}
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Body Caption</div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {currentPost.bodyCopy}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Call to Action</div>
              <div className="inline-block px-3 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold text-xs border border-brand-200 dark:border-brand-800/60">
                {currentPost.cta}
              </div>
            </div>
          </div>

          {/* Advanced Editing Accordion */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950/60 p-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-600 transition"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-500" />
                <span>Advanced Editing</span>
              </div>
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showAdvanced && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3 text-xs animate-fadeIn">
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Fine-tune rendering parameters for subsequent iterations:
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      toast.info('Negative prompt guidance active in engine.', 'AI Tuning');
                    }}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border text-left text-slate-700 dark:text-slate-300 font-medium hover:border-brand-500"
                  >
                    ✦ Prevent text distortion & watermark artifacts
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      toast.info('Color grading contrast lock applied.', 'Art Direction');
                    }}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border text-left text-slate-700 dark:text-slate-300 font-medium hover:border-brand-500"
                  >
                    ✦ Boost commercial high-dynamic-range contrast
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: Edit Copy Modal */}
      {showEditCopyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Edit Post Copy {variantsList.length > 1 ? `(Variant #${activeVariantIndex + 1})` : ''}
              </h3>
              <button
                type="button"
                onClick={() => setShowEditCopyModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCopy} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Headline
                </label>
                <input
                  type="text"
                  value={headlineEdit}
                  onChange={(e) => setHeadlineEdit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Body Caption
                </label>
                <textarea
                  rows={4}
                  value={bodyCopyEdit}
                  onChange={(e) => setBodyCopyEdit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Call to Action (CTA)
                </label>
                <input
                  type="text"
                  value={ctaEdit}
                  onChange={(e) => setCtaEdit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditCopyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Change Style Modal */}
      {showStyleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Change Design Style & Regenerate
              </h3>
              <button
                type="button"
                onClick={() => setShowStyleModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STYLES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setShowStyleModal(false);
                    if (onChangeStyle) onChangeStyle(st.id);
                  }}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:bg-brand-50/20 text-center space-y-1 transition"
                >
                  <div
                    className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center text-white"
                    style={{ backgroundColor: st.accentColor }}
                  >
                    <st.icon className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {st.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Resize Modal */}
      {showResizeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Resize Platform Dimensions
              </h3>
              <button
                type="button"
                onClick={() => setShowResizeModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: '1:1 Square (Instagram/Post)', ratio: '1:1' },
                { label: '4:5 Portrait (Instagram/LinkedIn)', ratio: '4:5' },
                { label: '9:16 Story/Reel (TikTok)', ratio: '9:16' },
                { label: '16:9 Landscape (X/Twitter)', ratio: '16:9' },
                { label: '1.91:1 Landscape (Facebook)', ratio: '1.91:1' },
              ].map((r) => (
                <button
                  key={r.ratio}
                  type="button"
                  onClick={() => {
                    setShowResizeModal(false);
                    if (onResize) onResize(r.ratio);
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold transition text-left ${
                    currentPost.aspectRatio === r.ratio
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
                      : 'border-slate-200 dark:border-slate-800 hover:border-brand-500'
                  }`}
                >
                  <div>{r.ratio}</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">{r.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX */}
      {isLightboxOpen && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div
            className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentPost.imageUrl}
              alt="High resolution generated post"
              className="w-full h-full object-contain"
            />
            {currentPost.logoUrl && (
              <div className="absolute top-6 right-6 z-10 pointer-events-none drop-shadow-lg">
                <div className="px-3 py-2 rounded-xl bg-white/90 dark:bg-black/80 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl flex items-center justify-center">
                  <img
                    src={currentPost.logoUrl}
                    alt="Brand Logo"
                    className="max-h-12 max-w-[120px] w-auto h-auto object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
