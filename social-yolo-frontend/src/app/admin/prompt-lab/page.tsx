'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  ClipboardCopy,
  Eye,
  FlaskConical,
  Layers,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

import { previewPromptApi } from '@/lib/api';
import { PromptPreviewResponse } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';

type Tab = 'final' | 'planner' | 'fallback' | 'pollinations';

/**
 * PROMPT LAB.
 *
 * The fastest way to tune `src/post-generator/rag/prompt-builder.service.ts`:
 * type a brief, and see the byte-for-byte text that would be sent to Gemini
 * plus exactly which references RAG pulled in and why. No image is generated
 * and no credit is spent.
 */
export default function PromptLabPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const { toast } = useNotification();

  const [brief, setBrief] = useState<string>('');
  const [productName, setProductName] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [style, setStyle] = useState<string>('');
  const [occasion, setOccasion] = useState<string>('');
  const [platform, setPlatform] = useState('instagram');
  const [aspectRatio, setAspectRatio] = useState('4:5');
  const [headline, setHeadline] = useState<string>('');
  const [cta, setCta] = useState<string>('');
  const [brandColors, setBrandColors] = useState<string>('');

  const [result, setResult] = useState<PromptPreviewResponse | null>(null);
  const [tab, setTab] = useState<Tab>('final');
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const run = async () => {
    if (!brief.trim() && !productName.trim()) {
      toast.error('Describe the post you want (brief or product name).', 'Missing Brief');
      return;
    }
    setRunning(true);
    try {
      const res = await previewPromptApi({
        prompt: brief.trim() || undefined,
        productName: productName.trim() || undefined,
        category: category.trim() || undefined,
        style: style.trim() || undefined,
        occasion: occasion.trim() || undefined,
        platform,
        aspectRatio,
        headline: headline.trim() || undefined,
        cta: cta.trim() || undefined,
        brandColors: brandColors
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
      });
      setResult(res);
      setTab('final');
      if (!res.embeddingsConfigured) {
        toast.warning(
          'GEMINI_API_KEY is not set, so RAG retrieval was skipped. Add it to Backend/.env to see references.',
          'Embeddings Offline',
        );
      }
    } catch (err: any) {
      toast.error(err.message || 'Preview failed', 'Error');
    } finally {
      setRunning(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    const text =
      tab === 'final'
        ? result.finalPrompt
        : tab === 'planner'
          ? result.plannerPrompt
          : tab === 'fallback'
            ? result.fallbackPrompt
            : result.pollinationsPrompt;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Clipboard access was denied by the browser.', 'Copy Failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-slate-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Verifying admin access…
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    if (!isAuthenticated) router.replace('/login?redirect=/admin/prompt-lab');
    return null;
  }

  const input =
    'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition';
  const label =
    'block text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5';

  const activeText =
    result === null
      ? ''
      : tab === 'final'
        ? result.finalPrompt
        : tab === 'planner'
          ? result.plannerPrompt
          : tab === 'fallback'
            ? result.fallbackPrompt
            : result.pollinationsPrompt;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <Link
            href="/admin/knowledge"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to knowledge base
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black flex items-center gap-2.5">
              <FlaskConical className="w-6 h-6 text-brand-400" />
              Prompt Lab
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wide">
              <ShieldAlert className="w-3 h-3" /> Admin only
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1.5 max-w-3xl">
            Inspect the exact text sent to Gemini before spending a credit. Every prompt is
            assembled in{' '}
            <code className="text-[12px] px-1 py-0.5 rounded bg-slate-800 text-slate-300">
              src/post-generator/rag/prompt-builder.service.ts
            </code>{' '}
            — edit that file, restart the backend, and this page updates.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── BRIEF FORM ────────────────────────────────────────── */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div>
                <label className={label}>Creative brief</label>
                <textarea
                  className={`${input} resize-none h-24`}
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="e.g. Launch a limited-run matte lipstick in deep berry — editorial, confident, feminine"
                />
              </div>
              <div>
                <label className={label}>Product / subject</label>
                <input
                  className={input}
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Velvet Matte Lipstick"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Category</label>
                  <input
                    className={input}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="beauty"
                  />
                </div>
                <div>
                  <label className={label}>Style</label>
                  <input
                    className={input}
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    placeholder="luxury"
                  />
                </div>
                <div>
                  <label className={label}>Occasion</label>
                  <input
                    className={input}
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    placeholder="launch"
                  />
                </div>
                <div>
                  <label className={label}>Brand colors</label>
                  <input
                    className={input}
                    value={brandColors}
                    onChange={(e) => setBrandColors(e.target.value)}
                    placeholder="#5b1030, #d4af6a"
                  />
                </div>
                <div>
                  <label className={label}>Platform</label>
                  <select
                    className={input}
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                  >
                    {['instagram', 'facebook', 'tiktok', 'linkedin', 'pinterest', 'twitter'].map(
                      (p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div>
                  <label className={label}>Aspect ratio</label>
                  <select
                    className={input}
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                  >
                    {['1:1', '4:5', '9:16', '16:9', '3:4'].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Headline</label>
                  <input
                    className={input}
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="THE BERRY EDIT"
                  />
                </div>
                <div>
                  <label className={label}>CTA</label>
                  <input
                    className={input}
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                    placeholder="Shop Now"
                  />
                </div>
              </div>

              <button
                onClick={run}
                disabled={running}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer"
              >
                {running ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
                {running ? 'Retrieving & composing…' : 'Preview prompts'}
              </button>
            </div>
          </div>

          {/* ── OUTPUT ────────────────────────────────────────────── */}
          <div className="lg:col-span-8 space-y-4">
            {!result ? (
              <div className="flex flex-col items-center justify-center gap-2 py-24 rounded-2xl border border-dashed border-slate-800 text-center">
                <Eye className="w-8 h-8 text-slate-700" />
                <p className="text-sm font-semibold text-slate-400">No preview yet</p>
                <p className="text-xs text-slate-600 max-w-sm">
                  Fill in a brief on the left and press Preview. You will see the exact Stage-1
                  and Stage-2 prompts plus the RAG retrieval trace.
                </p>
              </div>
            ) : (
              <>
                {/* retrieval trace */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-300">
                      RAG retrieval trace
                    </h3>
                    <span className="ml-auto text-[10px] font-bold text-slate-500">
                      {result.referencesRetrieved} reference(s) ·{' '}
                      {result.visualReferences.length} image anchor(s)
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-950/60 p-3 mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                      Semantic query (what was embedded)
                    </p>
                    <p className="text-[11px] text-slate-300 font-mono leading-relaxed break-words">
                      {result.retrievalQuery}
                    </p>
                  </div>

                  {result.retrievalError && (
                    <p className="text-[11px] text-rose-400 mb-2">
                      Retrieval error: {result.retrievalError}
                    </p>
                  )}

                  {result.references.length === 0 ? (
                    <p className="text-[11px] text-slate-500">
                      No references matched. Add some on the Knowledge page, or seed the starter
                      library.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {result.references.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center gap-2 text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-950/40"
                        >
                          <span className="font-mono text-slate-600 shrink-0">
                            {r.kind === 'user_post'
                              ? 'PERS'
                              : r.kind === 'style_ref'
                                ? 'LIB'
                                : 'GLB'}
                          </span>
                          <span className="text-slate-300 truncate flex-1">{r.title}</span>
                          {r.category && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                              {r.category}
                            </span>
                          )}
                          {r.hasImage && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 shrink-0">
                              img
                            </span>
                          )}
                          <span
                            className={`font-mono shrink-0 ${
                              r.similarity >= 0.6
                                ? 'text-emerald-400'
                                : r.similarity >= 0.45
                                  ? 'text-amber-400'
                                  : 'text-slate-500'
                            }`}
                          >
                            {(r.similarity * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>


                {/* prompt text */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                  <div className="flex items-center gap-1 p-2 border-b border-slate-800 overflow-x-auto">
                    {(
                      [
                        ['final', 'Final image prompt'],
                        ['planner', 'Stage 1 planner'],
                        ['fallback', 'Planner fallback'],
                        ['pollinations', 'Pollinations'],
                      ] as [Tab, string][]
                    ).map(([key, caption]) => (
                      <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                          tab === key
                            ? 'bg-brand-600 text-white'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        {caption}
                      </button>
                    ))}
                    <span className="ml-auto pl-2 text-[10px] font-mono text-slate-500 shrink-0">
                      {activeText.length.toLocaleString()} chars
                    </span>
                    <button
                      onClick={copy}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <ClipboardCopy className="w-3 h-3" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-[11px] leading-relaxed text-slate-300 font-mono whitespace-pre-wrap break-words max-h-[32rem] overflow-y-auto">
                    {activeText}
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

