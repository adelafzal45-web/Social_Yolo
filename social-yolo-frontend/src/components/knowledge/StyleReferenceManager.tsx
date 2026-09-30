'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  CheckCircle2,
  Database,
  Globe,
  ImagePlus,
  Layers,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
  Zap,
} from 'lucide-react';

import {
  createStyleReferenceApi,
  deleteStyleReferenceApi,
  getRagStatsApi,
  getStyleReferencesApi,
  reindexStyleReferencesApi,
  resolveImageUrl,
  seedStarterLibraryApi,
  setStyleReferenceScopeApi,
  updateStyleReferenceApi,
} from '@/lib/api';
import { RagCorpusStats, StyleReference, UserRole } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';

const MAX_UPLOAD_MB = 10;

interface StyleReferenceManagerProps {
  /** `user` = personal library only; `admin` = full control incl. global pool. */
  mode: 'user' | 'admin';
  /** Categories offered in the upload form (beyond whatever already exists). */
  suggestedCategories?: string[];
}

/**
 * Style Reference Library manager.
 *
 * Upload a reference image → Gemini Vision writes its design language in words
 * → it is embedded → the RAG retriever can match it against a future brief and
 * hand the picture to the image model as a visual anchor.
 *
 * The same component powers both the signed-in user's own library
 * (`/dashboard/references`) and the admin knowledge base
 * (`/admin/knowledge`); `mode` only changes which controls are shown.
 */
export default function StyleReferenceManager({
  mode,
  suggestedCategories = [],
}: StyleReferenceManagerProps) {
  const { user } = useAuth();
  const { toast } = useNotification();
  const isAdmin = user?.role === UserRole.ADMIN;

  const [items, setItems] = useState<StyleReference[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState<RagCorpusStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scope, setScope] = useState<'all' | 'mine' | 'global'>('all');
  const [search, setSearch] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [reindexing, setReindexing] = useState<boolean>(false);

  // Upload form state
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [hint, setHint] = useState<string>('');
  const [makeGlobal, setMakeGlobal] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allCategories = useMemo(
    () => Array.from(new Set([...suggestedCategories, ...categories])).sort(),
    [suggestedCategories, categories],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStyleReferencesApi({ scope, search: search || undefined });
      setItems(res.items);
      setCategories(res.categories || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load the style library', 'Library Error');
    } finally {
      setLoading(false);
    }
  }, [scope, search, toast]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await getRagStatsApi());
    } catch {
      // stats are informational only — never block the page on them
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Revoke the object URL when the preview changes or the component unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const visibleItems = useMemo(() => {
    if (activeCategory === 'all') return items;
    return items.filter((i) => i.category === activeCategory);
  }, [items, activeCategory]);

  const pickFile = (selected: File | null) => {
    if (!selected) return;
    if (!/^image\/(jpeg|png|webp)$/.test(selected.type)) {
      toast.error('Only JPG, PNG or WebP images are supported.', 'Unsupported File');
      return;
    }
    if (selected.size > MAX_UPLOAD_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_UPLOAD_MB} MB.`, 'File Too Large');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const resetForm = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setTitle('');
    setNotes('');
    setCategory('');
    setTags('');
    setHint('');
    setMakeGlobal(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Choose a reference image first.', 'Missing Image');
      return;
    }
    setUploading(true);
    try {
      const created = await createStyleReferenceApi({
        file,
        title: title.trim() || undefined,
        notes: notes.trim() || undefined,
        category: category.trim() || undefined,
        tags: tags.trim() || undefined,
        hint: hint.trim() || undefined,
        makeGlobal: makeGlobal && isAdmin,
      });
      toast.success(
        created.hasEmbedding
          ? `"${created.title || 'Reference'}" was analysed and embedded. It now influences your next generation.`
          : `"${created.title || 'Reference'}" was saved, but could not be embedded (no API key). Run Reindex once Gemini is configured.`,
        'Reference Indexed',
      );
      resetForm();
      await Promise.all([load(), loadStats()]);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed', 'Upload Error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: StyleReference) => {
    if (!confirm(`Delete "${item.title || 'this reference'}"? It will stop influencing future posts.`)) {
      return;
    }
    setBusyId(item.id);
    try {
      await deleteStyleReferenceApi(item.id);
      toast.success('Reference deleted.', 'Removed');
      await Promise.all([load(), loadStats()]);
    } catch (err: any) {
      toast.error(err.message || 'Delete failed', 'Error');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = async (item: StyleReference) => {
    setBusyId(item.id);
    try {
      await updateStyleReferenceApi(item.id, { isActive: item.isActive ? 'false' : 'true' });
      await Promise.all([load(), loadStats()]);
    } catch (err: any) {
      toast.error(err.message || 'Update failed', 'Error');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleScope = async (item: StyleReference) => {
    setBusyId(item.id);
    try {
      await setStyleReferenceScopeApi(item.id, item.source !== 'global');
      toast.success(
        item.source === 'global'
          ? 'Moved to your private library.'
          : 'Promoted to the shared global knowledge base.',
        'Scope Updated',
      );
      await Promise.all([load(), loadStats()]);
    } catch (err: any) {
      toast.error(err.message || 'Scope change failed', 'Error');
    } finally {
      setBusyId(null);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await seedStarterLibraryApi();
      toast.success(
        `Starter library: ${res.created} added, ${res.skipped} already present, ${res.failed} failed.`,
        'Library Seeded',
      );
      await Promise.all([load(), loadStats()]);
    } catch (err: any) {
      toast.error(err.message || 'Seeding failed', 'Error');
    } finally {
      setSeeding(false);
    }
  };

  const handleReindex = async () => {
    setReindexing(true);
    try {
      const res = await reindexStyleReferencesApi(false);
      toast.success(
        `Re-embedded ${res.processed} reference(s). ${res.failed} failed.`,
        'Reindex Complete',
      );
      await Promise.all([load(), loadStats()]);
    } catch (err: any) {
      toast.error(err.message || 'Reindex failed', 'Error');
    } finally {
      setReindexing(false);
    }
  };


  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition';
  const labelClass =
    'block text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5';

  return (
    <div className="space-y-6">
      {/* ── CORPUS STATS ─────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard icon={Database} label="Total retrievable" value={stats.total} tone="brand" />
          <StatCard icon={Sparkles} label="Your rated posts" value={stats.userPosts} tone="emerald" />
          <StatCard
            icon={Globe}
            label="Global knowledge"
            value={stats.globalPosts + stats.styleReferences}
            tone="indigo"
          />
          <StatCard icon={ImagePlus} label="With images" value={stats.withImages} tone="amber" />
          <StatCard
            icon={Zap}
            label="Embedding model"
            value={stats.embeddingsConfigured ? `${stats.embeddingDimensions}d` : 'offline'}
            tone={stats.embeddingsConfigured ? 'sky' : 'rose'}
            subtitle={stats.embeddingsConfigured ? stats.embeddingModel : 'Set GEMINI_API_KEY'}
          />
        </div>
      )}

      {/* ── UPLOAD ────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Upload className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          Add a style reference
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 max-w-2xl">
          Upload a design you love. AI Vision reads its lighting, palette, composition and
          typography, then embeds it — so future posts automatically imitate that craft, not
          that specific product or brand.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                pickFile(e.dataTransfer.files?.[0] ?? null);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative w-full aspect-[4/3] rounded-2xl border-2 border-dashed cursor-pointer overflow-hidden transition ${
                dragOver
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
                  : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 bg-slate-50 dark:bg-slate-900/40'
              }`}
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center">
                  <ImagePlus className="w-8 h-8 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Drop a reference image
                  </p>
                  <p className="text-[10px] text-slate-400">or click to browse · JPG, PNG, WebP</p>
                </div>
              )}
              {previewUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetForm();
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/70 text-white hover:bg-slate-900 transition cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
          </div>


          <div className="lg:col-span-3 space-y-3">
            <div>
              <label className={labelClass}>Title</label>
              <input
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Soft-lit skincare hero on stone"
              />
            </div>

            <div>
              <label className={labelClass}>Why is this a good reference?</label>
              <textarea
                className={`${inputClass} resize-none h-20`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Love the soft directional light and the way the type sits in the lower third. Use it for lighting, not colour."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Category</label>
                <input
                  className={inputClass}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  list="style-categories"
                  placeholder="beauty"
                />
                <datalist id="style-categories">
                  {allCategories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className={labelClass}>Tags</label>
                <input
                  className={inputClass}
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="beige, soft-light, serif"
                />
              </div>
            </div>

            {isAdmin && (
              <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={makeGlobal}
                  onChange={(e) => setMakeGlobal(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  Publish to the <strong>global</strong> knowledge base (visible to every account)
                </span>
              </label>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleUpload}
                disabled={uploading || !file}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {uploading ? 'Analysing & embedding…' : 'Analyse & Add to Library'}
              </button>
              {file && (
                <button
                  onClick={resetForm}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>


      {/* ── FILTERS + ADMIN ACTIONS ───────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {mode === 'admin' && (
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
            {(['all', 'global', 'mine'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize transition cursor-pointer ${
                  scope === s
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {s === 'all' ? 'Everything' : s === 'global' ? 'Global pool' : 'My uploads'}
              </button>
            ))}
          </div>
        )}

        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            className={`${inputClass} pl-9`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, notes or tags…"
          />
        </div>

        {mode === 'admin' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-40 cursor-pointer"
            >
              {seeding ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <BookOpen className="w-3.5 h-3.5" />
              )}
              Seed starter library
            </button>
            <button
              onClick={handleReindex}
              disabled={reindexing}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-40 cursor-pointer"
            >
              {reindexing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Reindex
            </button>
          </div>
        )}
      </div>

      {allCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            All
          </button>
          {allCategories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition cursor-pointer ${
                activeCategory === c
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* ── GRID ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading library…
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <Layers className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No references yet</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Upload a design you like, or ask an admin to seed the starter library. Every entry
            here sharpens the next generation.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleItems.map((item) => (
            <ReferenceCard
              key={item.id}
              item={item}
              busy={busyId === item.id}
              isAdmin={mode === 'admin' && isAdmin}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              onToggleScope={handleToggleScope}
            />
          ))}
        </div>
      )}
    </div>
  );
}


/* -------------------------------------------------------------------- */
/* sub-components                                                        */
/* -------------------------------------------------------------------- */

const STAT_TONES: Record<string, string> = {
  brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  tone: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`p-1.5 rounded-lg ${STAT_TONES[tone] || STAT_TONES.brand}`}>
          <Icon className="w-3.5 h-3.5" />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 truncate">
          {label}
        </span>
      </div>
      <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{value}</p>
      {subtitle && (
        <p className="text-[10px] text-slate-400 mt-1 truncate" title={subtitle}>
          {subtitle}
        </p>
      )}
    </div>
  );
}


function ReferenceCard({
  item,
  busy,
  isAdmin,
  onDelete,
  onToggleActive,
  onToggleScope,
}: {
  item: StyleReference;
  busy: boolean;
  isAdmin: boolean;
  onDelete: (item: StyleReference) => void;
  onToggleActive: (item: StyleReference) => void;
  onToggleScope: (item: StyleReference) => void;
}) {
  const analysis = (item.analysis || {}) as Record<string, any>;
  const palette: string[] = Array.isArray(analysis.colorPalette) ? analysis.colorPalette : [];
  const imageUrl = item.imageUrl ? resolveImageUrl(item.imageUrl) : null;

  return (
    <article
      className={`rounded-2xl border overflow-hidden transition ${
        item.isActive
          ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 opacity-70'
      }`}
    >
      <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={item.title || 'Style reference'} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-slate-400">
            <BookOpen className="w-6 h-6" />
            <span className="text-[10px] font-semibold">Text playbook</span>
          </div>
        )}

        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold backdrop-blur-sm ${
              item.source === 'global'
                ? 'bg-indigo-600/90 text-white'
                : 'bg-slate-900/80 text-white'
            }`}
          >
            {item.source === 'global' ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
            {item.source === 'global' ? 'Global' : 'Private'}
          </span>
          {!item.isActive && (
            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-900/80 text-white">
              Disabled
            </span>
          )}
          {!item.hasEmbedding && (
            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-rose-600/90 text-white">
              Not embedded
            </span>
          )}
          {item.analysedByAi && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-brand-600/90 text-white">
              <CheckCircle2 className="w-2.5 h-2.5" /> AI analysed
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-2.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
            {item.title || 'Untitled reference'}
          </h3>
          {item.category && (
            <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              {item.category}
            </span>
          )}
        </div>

        {palette.length > 0 && (
          <div className="flex items-center gap-1">
            {palette.slice(0, 6).map((hex, i) => (
              <span
                key={i}
                title={hex}
                className="w-4 h-4 rounded-md border border-slate-200 dark:border-slate-700"
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        )}

        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-3">
          {item.notes || item.contentText}
        </p>

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 5).map((t) => (
              <span
                key={t}
                className="text-[9px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-700 dark:text-brand-300 font-semibold"
              >
                #{t}
              </span>
            ))}
          </div>
        )}


        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] text-slate-400">Used {item.usageCount}×</span>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <button
                onClick={() => onToggleScope(item)}
                disabled={busy}
                title={item.source === 'global' ? 'Move to my library' : 'Publish globally'}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-40 cursor-pointer"
              >
                {item.source === 'global' ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  <Globe className="w-3.5 h-3.5" />
                )}
              </button>
            )}
            <button
              onClick={() => onToggleActive(item)}
              disabled={busy}
              title={item.isActive ? 'Disable' : 'Enable'}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-40 cursor-pointer"
            >
              {item.isActive ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={() => onDelete(item)}
              disabled={busy}
              title="Delete"
              className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-40 cursor-pointer"
            >
              {busy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

