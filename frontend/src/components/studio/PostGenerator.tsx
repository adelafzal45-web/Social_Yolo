'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  X,
  Download,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Clock,
  User,
  Zap,
  Maximize2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generatePost, getStoredUserId, ratePost, resolveImageUrl } from '@/lib/api';
import { GeneratePostResponse } from '@/lib/types';
import { PROMPT_PRESETS } from '@/lib/utils';
import { StarsRating } from '../ui/StarsRating';

interface PostGeneratorProps {
  initialPrompt?: string;
  onPostGenerated?: (post: any) => void;
}

export function PostGenerator({ initialPrompt = '', onPostGenerated }: PostGeneratorProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  
  // Generation lifecycle state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratePostResponse | null>(null);
  const [currentRating, setCurrentRating] = useState<number | null>(null);
  const [ratingMessage, setRatingMessage] = useState<string | null>(null);
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setUserId(getStoredUserId());
  }, []);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5 MB.');
        return;
      }
      setFile(selected);
      setError(null);
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(selected);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Generate Post
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setRatingMessage(null);
    setCurrentRating(null);
    setGenerationStep(1);
    setElapsedTime(0);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    // Simulate progress steps while awaiting response
    const step2Timer = setTimeout(() => setGenerationStep(2), 2500);
    const step3Timer = setTimeout(() => setGenerationStep(3), 6000);
    const step4Timer = setTimeout(() => setGenerationStep(4), 11000);

    try {
      const res = await generatePost(cleanPrompt, file, userId);
      setResult(res);
      setCurrentRating(res.rating || null);
      if (onPostGenerated) {
        onPostGenerated(res);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate post. Please check backend connection.');
    } finally {
      clearTimeout(step2Timer);
      clearTimeout(step3Timer);
      clearTimeout(step4Timer);
      if (timerRef.current) clearInterval(timerRef.current);
      setIsGenerating(false);
      setGenerationStep(0);
    }
  };

  // Handle post rating
  const handleRate = async (stars: number) => {
    if (!result?.id) return;
    setCurrentRating(stars);
    try {
      await ratePost(result.id, stars, userId);
      if (stars >= 4) {
        setRatingMessage(`Rated ${stars}★! Added to your personal RAG style pool.`);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } else {
        setRatingMessage(`Rated ${stars}★. Removed from your style pool.`);
      }
    } catch (err: any) {
      setRatingMessage(`Failed to save rating: ${err.message}`);
    }
  };

  const handleCopyPrompt = () => {
    if (result?.finalPrompt) {
      navigator.clipboard.writeText(result.finalPrompt);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="w-full">
      {/* Lightbox Modal */}
      {isLightboxOpen && result?.imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img
              src={result.imageUrl}
              alt="Generated Post Zoom"
              className="max-h-[85vh] w-auto rounded-xl shadow-2xl object-contain"
            />
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-2 right-2 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form: Inputs */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-purple-100/90 dark:border-slate-800 shadow-xl transition-colors">
          <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <span>AI Prompt &amp; Subject</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Describe the design or choose a preset style below.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              <User className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">{userId || 'guest'}</span>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-5">
            {/* Prompt Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Your Prompt
                </label>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {prompt.length}/300 chars
                </span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="e.g. Eid sale post with 50% discount badge and luxurious golden accents"
                className="w-full text-sm p-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 dark:bg-slate-950/70 hover:bg-white dark:hover:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition resize-none"
              />
            </div>

            {/* Prompt Preset Chips */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <span>Quick Inspirations:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PROMPT_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPrompt(p.prompt)}
                    className="text-xs py-1.5 px-3 rounded-full bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-brand-700 dark:text-brand-300 font-semibold border border-purple-200/60 dark:border-purple-800/60 transition hover:scale-[1.02] text-left"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Subject Image Upload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
                  Subject Photo <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                {file && (
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>

              {!file ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-200 hover:border-brand-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/60 hover:bg-purple-50/30 transition group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-11 h-11 rounded-2xl bg-white shadow-sm border border-purple-100 text-brand-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Click to upload product or subject photo
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    JPG, PNG, WebP up to 5 MB • Background automatically removed
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-2xl flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-purple-200 flex-shrink-0 relative checkerboard-bg">
                    {filePreview && (
                      <img
                        src={filePreview}
                        alt="Selected subject"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {(file.size / 1024).toFixed(0)} KB • Background will be removed
                    </p>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                    Attached
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              className={`w-full py-4 px-6 rounded-2xl text-white font-extrabold text-sm shadow-glow transition-all duration-200 flex items-center justify-center gap-2 ${
                !prompt.trim() || isGenerating
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-brand-600 via-fuchsia-600 to-pink-500 hover:from-brand-700 hover:to-pink-600 hover:shadow-glow-lg hover:scale-[1.01]'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing ({elapsedTime}s)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>Generate Post ✨</span>
                </>
              )}
            </button>
          </form>

          {/* Progress Timeline during generation */}
          {isGenerating && (
            <div className="mt-6 p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-brand-900">
                <span>Generation Pipeline in progress</span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-3.5 h-3.5" /> {elapsedTime}s
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className={`flex items-center gap-2 ${generationStep >= 1 ? 'text-brand-700 font-bold' : 'text-slate-400'}`}>
                  {generationStep > 1 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                  )}
                  <span>1. Subject background removal (Python rembg)</span>
                </div>

                <div className={`flex items-center gap-2 ${generationStep >= 2 ? 'text-brand-700 font-bold' : 'text-slate-400'}`}>
                  {generationStep > 2 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : generationStep === 2 ? (
                    <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300" />
                  )}
                  <span>2. Vector RAG style memory retrieval</span>
                </div>

                <div className={`flex items-center gap-2 ${generationStep >= 3 ? 'text-brand-700 font-bold' : 'text-slate-400'}`}>
                  {generationStep > 3 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : generationStep === 3 ? (
                    <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300" />
                  )}
                  <span>3. Synthesizing full agency designer brief</span>
                </div>

                <div className={`flex items-center gap-2 ${generationStep >= 4 ? 'text-brand-700 font-bold' : 'text-slate-400'}`}>
                  {generationStep === 4 ? (
                    <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300" />
                  )}
                  <span>4. High-resolution commercial rendering</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Output: Result Card */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-purple-100/90 dark:border-slate-800 shadow-xl flex-1 flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span>Generated Studio Post</span>
                </h3>
                {result?.engine && (
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      result.engine === 'pollinations'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    Engine: {result.engine.toLowerCase().includes('gemini') ? 'AI Ultra' : result.engine.toLowerCase().includes('pollinations') ? 'AI Standard' : result.engine}
                  </span>
                )}
              </div>

              {/* Image Output Box */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center checkerboard-bg group">
                {result?.imageUrl ? (
                  <>
                    <img
                      src={result.imageUrl}
                      alt="Generated Post Output"
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <button
                      onClick={() => setIsLightboxOpen(true)}
                      className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition shadow-lg"
                      title="Zoom full screen"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-8 text-slate-400">
                    <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-slate-800 border border-purple-100 dark:border-slate-700 text-brand-400 flex items-center justify-center mx-auto mb-3">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No post generated yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Enter your prompt on the left and click &ldquo;Generate Post&rdquo; to start the AI pipeline.
                    </p>
                  </div>
                )}
              </div>

              {/* Result Actions & Feedback */}
              {result?.imageUrl && (
                <div className="mt-5 space-y-4">
                  {/* Download & Zoom */}
                  <div className="flex items-center gap-3">
                    <a
                      href={result.imageUrl}
                      download={`social_yolo_${result.id}.png`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download High-Res PNG</span>
                    </a>
                  </div>

                  {/* Engine Note */}
                  {result.engine === 'pollinations' && (
                    <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>
                        Generated via <strong>Standard Engine</strong> (text-to-image synthesis).
                        To include the subject photo directly in designs, activate high-resolution multimodal vision.
                      </span>
                    </div>
                  )}

                  {/* Interactive Star Rating for RAG Feedback Loop */}
                  <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-slate-800/60 border border-purple-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Rate this design (RAG Feedback):
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        ⭐ 4–5 adds to your style memory · 1–3 removes it
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <StarsRating
                        initialRating={currentRating || 0}
                        onRate={handleRate}
                        size="md"
                      />
                    </div>
                  </div>

                  {ratingMessage && (
                    <div className="text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/50 p-2.5 rounded-xl border border-brand-200 dark:border-brand-800 text-center animate-in fade-in">
                      {ratingMessage}
                    </div>
                  )}

                  {/* Collapsible Final Prompt Inspector */}
                  {result.finalPrompt && (
                    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden text-xs">
                      <button
                        type="button"
                        onClick={() => setShowPromptDetails(!showPromptDetails)}
                        className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between font-semibold text-slate-700 dark:text-slate-200 transition"
                      >
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                          View Final Synthesized Designer Prompt
                        </span>
                        {showPromptDetails ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      {showPromptDetails && (
                        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 space-y-3">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>Expanded by Social Yolo RAG Engine:</span>
                            <button
                              type="button"
                              onClick={handleCopyPrompt}
                              className="text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              {isCopied ? 'Copied!' : 'Copy Prompt'}
                            </button>
                          </div>
                          <pre className="text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl whitespace-pre-wrap font-mono max-h-48 overflow-y-auto border border-slate-200/60 dark:border-slate-800 leading-relaxed">
                            {result.finalPrompt}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
