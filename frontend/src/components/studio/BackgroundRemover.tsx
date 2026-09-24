'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Scissors,
  Upload,
  Download,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  FileImage,
  Type,
  Cpu,
  Eye,
  Sliders,
} from 'lucide-react';
import { removeBackground } from '@/lib/api';
import { RemoveBackgroundResponse, RemoveBackgroundOptions } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

interface BackgroundRemoverProps {
  onUseInGenerator?: (file: File) => void;
}

export function BackgroundRemover({ onUseInGenerator }: BackgroundRemoverProps) {
  const { isAuthenticated } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [processed, setProcessed] = useState<RemoveBackgroundResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressStatus, setProgressStatus] = useState<string>('');

  // Enhanced control options
  const [preserveText, setPreserveText] = useState<boolean>(true);
  const [selectedModel, setSelectedModel] = useState<string>('u2net_human_seg');
  const [bgPreview, setBgPreview] = useState<'transparent' | 'white' | 'dark' | 'gradient'>('transparent');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processSelectedFile = async (
    targetFile: File,
    optionsOverride?: RemoveBackgroundOptions
  ) => {
    setIsProcessing(true);
    setError(null);
    setProgressStatus('Uploading image to AI engine...');

    const opts: RemoveBackgroundOptions = {
      model: optionsOverride?.model ?? selectedModel,
      preserveText: optionsOverride?.preserveText ?? preserveText,
    };

    try {
      setProgressStatus('Running ONNX background removal (first run ~10s, cached runs ~2s)...');
      const res = await removeBackground(targetFile, opts);
      setProcessed(res);
      if (res.backgroundRemoved === false) {
        setError('⚠️ Background removal encountered an issue — showing original image. Try again or use a clearer photo.');
        setProgressStatus('');
      } else {
        setProgressStatus('✅ Transparent cutout ready!');
      }
    } catch (err: any) {
      setError(
        err.message ||
          'Background removal failed. Make sure the backend (port 3001) is running.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFile = async (selected: File) => {
    // 1. Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(selected.type) && !/\.(jpe?g|png|webp)$/i.test(selected.name)) {
      setError('Invalid format. Only authentic JPG, PNG, and WebP images are supported.');
      return;
    }

    if (selected.size > 15 * 1024 * 1024) {
      setError('File size exceeds maximum limit of 15 MB.');
      return;
    }

    setFile(selected);
    setError(null);
    setProcessed(null);
    setProgressStatus('Reading image...');

    const reader = new FileReader();
    reader.onload = () => setOriginalUrl(reader.result as string);
    reader.readAsDataURL(selected);

    await processSelectedFile(selected);
  };

  const handleReprocess = () => {
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      handleFile(dropped);
    }
  };

  const handleDownload = () => {
    if (!processed?.url) return;
    const link = document.createElement('a');
    link.href = processed.url;
    link.download = `social_yolo_cutout_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleSendToGenerator = () => {
    if (file && onUseInGenerator) {
      onUseInGenerator(file);
    }
  };

  const getPreviewBgClass = () => {
    switch (bgPreview) {
      case 'white':
        return 'bg-white';
      case 'dark':
        return 'bg-slate-900';
      case 'gradient':
        return 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500';
      default:
        return 'checkerboard-bg';
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-purple-100/90 dark:border-slate-800 shadow-xl transition-colors">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-6 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Scissors className="w-5 h-5 text-amber-500" />
            <span>AI Background Remover Studio</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/60">
              Text &amp; Detail Protection
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Neural segmentation with OCR text protection, edge anti-aliasing &amp; transparent alpha PNG
          </p>
        </div>

        {file && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleReprocess}
              disabled={isProcessing}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>Reprocess</span>
            </button>
            <button
              onClick={() => {
                setFile(null);
                setOriginalUrl(null);
                setProcessed(null);
                setError(null);
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
            >
              New Photo
            </button>
          </div>
        )}
      </div>

      {/* Unauthenticated notice */}
      {!isAuthenticated && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Sign in to access background removal and save your studio creations.</span>
          </div>
          <Link
            href="/login?redirect=/#generator"
            className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700 transition flex-shrink-0"
          >
            Sign In Now
          </Link>
        </div>
      )}

      {/* Studio Options Panel */}
      <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          {/* Preserve Text Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={preserveText}
              onChange={(e) => setPreserveText(e.target.checked)}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-600"
            />
            <span className="flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Preserve Text &amp; Logos</span>
            </span>
          </label>

          {/* Model Selector */}
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="u2net_human_seg">👤 Portrait &amp; Fashion (Full Person &amp; Apparel)</option>
              <option value="isnet-general-use">📦 Products &amp; Objects (Clean Edge AI)</option>
              <option value="bria-rmbg">🎯 Studio Hair &amp; Precision (Ultra)</option>
            </select>
          </div>
        </div>

        {/* Preview Background Toggle */}
        <div className="flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span className="text-slate-500 dark:text-slate-400 font-medium">Preview BG:</span>
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5">
            <button
              onClick={() => setBgPreview('transparent')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                bgPreview === 'transparent' ? 'bg-slate-900 text-white dark:bg-slate-700' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Alpha
            </button>
            <button
              onClick={() => setBgPreview('white')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                bgPreview === 'white' ? 'bg-slate-900 text-white dark:bg-slate-700' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              White
            </button>
            <button
              onClick={() => setBgPreview('dark')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                bgPreview === 'dark' ? 'bg-slate-900 text-white dark:bg-slate-700' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setBgPreview('gradient')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                bgPreview === 'gradient' ? 'bg-slate-900 text-white dark:bg-slate-700' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Color
            </button>
          </div>
        </div>
      </div>

      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all group max-w-xl mx-auto ${
            isDragging
              ? 'border-brand-500 bg-brand-50/50 scale-[1.01]'
              : 'border-amber-200 hover:border-amber-500 bg-amber-50/20 hover:bg-amber-50/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-amber-200 text-amber-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <Upload className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-900 font-display">
            Drag &amp; drop product, portrait, or poster photo here
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            JPG, PNG, WebP up to 15 MB • Never erodes foreground details; keeps text, typography, and badges 100% intact.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-amber-200 text-[11px] font-bold text-slate-600 shadow-sm">
            <FileImage className="w-3.5 h-3.5 text-amber-500" />
            <span>Or browse file from computer</span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Side by side comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original Box */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileImage className="w-3.5 h-3.5 text-slate-400" />
                <span>Original Image</span>
              </span>
              <div className="aspect-square w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center relative">
                {originalUrl && (
                  <img
                    src={originalUrl}
                    alt="Original"
                    className="w-full h-full object-contain p-2"
                  />
                )}
              </div>
            </div>

            {/* Processed Box */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-600" />
                  <span>Isolated Foreground</span>
                </span>
                {processed && (
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Cutout Ready (Text &amp; Subject Intact)</span>
                  </span>
                )}
              </span>
              <div
                className={`aspect-square w-full rounded-2xl overflow-hidden border border-purple-200 transition-colors flex items-center justify-center relative ${getPreviewBgClass()}`}
              >
                {isProcessing ? (
                  <div className="text-center p-6 space-y-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100">
                    <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
                    <p className="text-xs font-bold text-slate-700">
                      {progressStatus}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Preserving character strokes, hair strands &amp; borders
                    </p>
                  </div>
                ) : processed?.url ? (
                  <img
                    src={processed.url}
                    alt="Processed Cutout"
                    className="w-full h-full object-contain p-2 animate-in fade-in"
                  />
                ) : (
                  <div className="text-center text-xs text-slate-400 p-4">
                    Ready to process
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          {processed && (
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={handleDownload}
                className="w-full sm:w-auto flex-1 py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download Transparent PNG</span>
              </button>

              {onUseInGenerator && (
                <button
                  onClick={handleSendToGenerator}
                  className="w-full sm:w-auto flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-600 hover:from-brand-700 hover:to-fuchsia-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-glow"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>Send Cutout to Post Generator</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
