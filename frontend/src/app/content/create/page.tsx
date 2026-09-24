'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Layers,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  ChevronDown,
  Building2,
  Package,
  Globe,
  Palette,
  Sliders,
  Send,
  Loader2,
  Lightbulb,
  Edit2,
  CheckCircle2,
  RefreshCw,
  Eye,
  Tag,
  Share2,
} from 'lucide-react';
import {
  getBrandProfilesApi,
  getBrandFullApi,
  generateContentApi,
  updateContentApi,
  listConceptsApi,
} from '@/lib/api';
import { BrandProfile, Post, StructuredContentRequest } from '@/lib/types';
import { useNotification } from '@/context/NotificationContext';

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', ratio: '4:5 / 1:1', icon: '📸', color: '#E1306C' },
  { id: 'facebook', name: 'Facebook', ratio: '1.91:1 / 1:1', icon: '👥', color: '#1877F2' },
  { id: 'linkedin', name: 'LinkedIn', ratio: '1:1 / 1.91:1', icon: '💼', color: '#0A66C2' },
  { id: 'twitter', name: 'X (Twitter)', ratio: '16:9', icon: '🐦', color: '#000000' },
  { id: 'tiktok', name: 'TikTok', ratio: '9:16', icon: '🎵', color: '#EE1D52' },
  { id: 'pinterest', name: 'Pinterest', ratio: '2:3', icon: '📌', color: '#E60023' },
];

const CONTENT_TYPES = [
  { id: 'Social Post', label: 'Single Image Post', desc: 'Punchy headline + high-engagement caption' },
  { id: 'Carousel', label: 'Multi-Slide Carousel', desc: 'Educational breakdown or multi-point story' },
  { id: 'Story', label: 'Story / Reel Hook', desc: 'Quick vertical format with immediate punch' },
  { id: 'Flyer', label: 'Promotional Flyer', desc: 'Headline-heavy announcement or event copy' },
  { id: 'Ad', label: 'Direct Response Ad', desc: 'Conversion-driven hook, problem, solution, CTA' },
];

const MARKETING_GOALS = [
  { id: 'Awareness', label: 'Brand Awareness', desc: 'Highlight brand values & unique identity' },
  { id: 'Engagement', label: 'Audience Engagement', desc: 'Provoke comments, shares & conversations' },
  { id: 'Sales', label: 'Sales & Conversion', desc: 'Direct push on benefits, offer, or product' },
  { id: 'Launch', label: 'New Launch', desc: 'Excitement, unveil, or early access alert' },
  { id: 'Educational', label: 'Educational / Value', desc: 'Tips, insights, how-to, or industry lore' },
];

const TONES = [
  'Brand Default',
  'Professional & Authoritative',
  'Warm & Conversational',
  'Bold & High-Energy',
  'Luxury & Minimalist',
  'Playful & Witty',
  'Empathetic & Caring',
];

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Arabic',
  'Urdu',
  'Portuguese',
  'Japanese',
  'Italian',
];

function CreateContentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useNotification();

  // Brands list and selected brand
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<BrandProfile | null>(null);

  // Structured selectors (Spec Section 16 & 17 — NO AI PROMPT TEXTBOX)
  const [platform, setPlatform] = useState<string>('instagram');
  const [contentType, setContentType] = useState<string>('Social Post');
  const [goal, setGoal] = useState<string>('Engagement');
  const [productName, setProductName] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [campaign, setCampaign] = useState<string>('');
  const [contentPillar, setContentPillar] = useState<string>('');
  const [language, setLanguage] = useState<string>('English');
  const [tone, setTone] = useState<string>('Brand Default');
  const [variationsCount, setVariationsCount] = useState<number>(3);
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  // Generation execution & results
  const [generating, setGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<Post[]>([]);
  const [activeVariationIdx, setActiveVariationIdx] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editedCaption, setEditedCaption] = useState<string>('');

  // Load brands on mount
  useEffect(() => {
    async function loadBrands() {
      try {
        setLoadingBrands(true);
        const data = await getBrandProfilesApi();
        setBrands(data);

        // Check URL search params for brandId or conceptId
        const paramBrandId = searchParams.get('brandId');
        const paramConceptId = searchParams.get('conceptId');

        if (paramBrandId && data.some((b) => b.id === paramBrandId)) {
          setSelectedBrandId(paramBrandId);
        } else if (data.length > 0) {
          const def = data.find((b) => b.isDefault) || data[0];
          setSelectedBrandId(def.id);
        }

        if (paramConceptId) {
          // Preload concept info
          try {
            const concepts = await listConceptsApi(paramBrandId || undefined);
            const concept = concepts.find((c) => c.id === paramConceptId);
            if (concept) {
              setTopic(concept.title);
              setCampaign(concept.concept);
              if (concept.platforms && concept.platforms.length > 0) {
                setPlatform(concept.platforms[0].toLowerCase());
              }
            }
          } catch (err) {
            console.error('Error preloading concept:', err);
          }
        }
      } catch (err: any) {
        toast('Failed to load brands. Please make sure backend is running.', 'error');
      } finally {
        setLoadingBrands(false);
      }
    }
    loadBrands();
  }, [searchParams]);

  // Load full brand details when selectedBrandId changes
  useEffect(() => {
    if (!selectedBrandId) {
      setSelectedBrand(null);
      return;
    }
    async function fetchFullBrand() {
      try {
        const full = await getBrandFullApi(selectedBrandId);
        setSelectedBrand(full);
        const prods = (full as any).products || full.insight?.products;
        if (prods && prods.length > 0 && !productName) {
          setProductName(prods[0].name);
        }
      } catch {
        const fallback = brands.find((b) => b.id === selectedBrandId) || null;
        setSelectedBrand(fallback);
      }
    }
    fetchFullBrand();
  }, [selectedBrandId]);

  const handleGenerate = async () => {
    if (!selectedBrandId) {
      toast('Please select a brand first', 'warning');
      return;
    }

    setGenerating(true);
    setGeneratedPosts([]);

    const payload: StructuredContentRequest = {
      brandId: selectedBrandId,
      platform,
      contentType,
      goal,
      productName: productName && productName !== 'all' ? productName : undefined,
      topic: topic.trim() || undefined,
      campaign: campaign.trim() || undefined,
      contentPillar: contentPillar.trim() || undefined,
      language,
      tone: tone !== 'Brand Default' ? tone : undefined,
      variationsCount,
      additionalNotes: additionalNotes.trim() || undefined,
    };

    try {
      const res = await generateContentApi(payload);
      if (res.posts && res.posts.length > 0) {
        setGeneratedPosts(res.posts);
        setActiveVariationIdx(0);
        toast(`Generated ${res.posts.length} platform-optimized variations!`, 'success');
      } else {
        toast('No content was generated. Please try again.', 'error');
      }
    } catch (err: any) {
      toast(err.message || 'Failed to generate content', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
    toast('Copied to clipboard!', 'info');
  };

  const handleSaveEdit = async (post: Post) => {
    try {
      const updated = await updateContentApi(post.id, {
        caption: editedCaption,
        bodyCopy: editedCaption,
      });
      setGeneratedPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, caption: editedCaption, bodyCopy: editedCaption } : p))
      );
      setEditingPostId(null);
      toast('Changes saved to library post', 'success');
    } catch (err: any) {
      toast('Failed to save changes', 'error');
    }
  };

  if (loadingBrands) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="text-gray-500 font-medium">Loading Brand DNA & catalogs...</p>
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 text-center shadow-sm">
        <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950/50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Building2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          No Brand Profiles Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          SocialYolo does NOT require manual AI prompting. Simply provide your website once to extract and save your brand DNA, products, and visual identity.
        </p>
        <Link
          href="/brands/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
          Create Your First Brand
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const currentPost = generatedPosts[activeVariationIdx];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Autonomous Brand Intelligence
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Content
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Zero prompts needed. SocialYolo uses verified brand DNA, product catalogs, and platform heuristics to generate ready-to-publish posts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/content/concepts"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition"
          >
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Explore Concepts
          </Link>
          <Link
            href="/content/library"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition"
          >
            <Layers className="w-4 h-4 text-purple-600" />
            Content Library
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Structured Configuration Form (Spec Section 16 & 17) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-600" />
              Content Configuration
            </h2>

            {/* 1. Brand Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                1. Select Brand <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedBrandId}
                  onChange={(e) => setSelectedBrandId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white appearance-none pr-10 focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm font-medium"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.brandName || b.name} ({b.niche || b.industry || 'General'})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3.5 top-3.5 text-gray-400 pointer-events-none" />
              </div>

              {/* Brand DNA Capsule */}
              {selectedBrand && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full border border-white shadow-sm flex-shrink-0"
                      style={{ backgroundColor: selectedBrand.primaryColor || '#7c5cff' }}
                    />
                    <div>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {selectedBrand.brandName || selectedBrand.name}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                        Tone: {selectedBrand.tone || 'Modern'}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/brands/${selectedBrand.id}`}
                    className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                  >
                    View DNA <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* 2. Platform Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                2. Target Platform <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PLATFORMS.map((p) => {
                  const active = platform === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlatform(p.id)}
                      className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                        active
                          ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-600/30'
                          : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="text-xl">{p.icon}</span>
                      <span className="text-xs font-semibold">{p.name.split(' ')[0]}</span>
                      <span className="text-[10px] text-gray-400">{p.ratio.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Content Type & Marketing Goal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  3. Content Type
                </label>
                <div className="relative">
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white appearance-none pr-10 focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    {CONTENT_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3.5 top-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  4. Marketing Goal
                </label>
                <div className="relative">
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white appearance-none pr-10 focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    {MARKETING_GOALS.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3.5 top-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* 5. Featured Product (From Brand Catalog) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  5. Featured Product / Service
                </label>
                <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                  Auto-populated from Website
                </span>
              </div>
              <div className="relative">
                <select
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white appearance-none pr-10 focus:ring-2 focus:ring-purple-500 text-sm"
                >
                  <option value="all">Entire Brand / General Showcase</option>
                  {selectedBrand?.products?.map((p: any, idx: number) => (
                    <option key={idx} value={p.name}>
                      📦 {p.name} {p.category ? `(${p.category})` : ''}
                    </option>
                  ))}
                  {selectedBrand?.services?.map((s: any, idx: number) => (
                    <option key={`s-${idx}`} value={s.name}>
                      ⚡ {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3.5 top-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* 6. Optional Structured Angles (Topic, Campaign, Pillar) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Topic or Hook Focus <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weekend Launch, Holiday Sale, Why Quality Matters"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Campaign / Pillar <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Spring 2026, Behind The Scenes"
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* 7. Language, Tone & Variations */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Language
                </label>
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs appearance-none pr-8"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Tone
                </label>
                <div className="relative">
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs appearance-none pr-8"
                  >
                    {TONES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Variations
                </label>
                <div className="relative">
                  <select
                    value={variationsCount}
                    onChange={(e) => setVariationsCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs appearance-none pr-8 font-semibold"
                  >
                    <option value={1}>1 variation</option>
                    <option value={2}>2 variations</option>
                    <option value={3}>3 variations</option>
                    <option value={5}>5 variations</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Extra Guidance Single Line (Optional) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400">
                Additional Instructions <span className="text-gray-400 font-normal">(e.g. mention free shipping, promo code SAVE20)</span>
              </label>
              <input
                type="text"
                placeholder="Optional single-line constraint"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
              />
            </div>

            {/* Generate Action Button */}
            <button
              type="button"
              disabled={generating || !selectedBrandId}
              onClick={handleGenerate}
              className="w-full py-3.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 transition shadow-md shadow-purple-600/20"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Synthesizing Brand DNA & Generating Content...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Content Variations</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Generation Results & Live Preview */}
        <div className="lg:col-span-6 space-y-6">
          {generatedPosts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-dashed border-gray-300 dark:border-slate-800 flex flex-col items-center justify-center text-center min-h-[480px]">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Ready to Generate Intelligence
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                Select your brand, target platform, and goal on the left. SocialYolo autonomously crafts hooks, formatted captions, hashtags, and visual art direction.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Variation Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {generatedPosts.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveVariationIdx(idx);
                      setEditingPostId(null);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                      activeVariationIdx === idx
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    Variation #{idx + 1}
                  </button>
                ))}
              </div>

              {/* Active Variation Card */}
              {currentPost && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  {/* Card Header */}
                  <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {PLATFORMS.find((p) => p.id === currentPost.platform)?.icon || '📱'}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                            {currentPost.platform}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {currentPost.contentType || 'Social Post'}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                          {currentPost.title || 'Generated Post'}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            `${currentPost.caption || currentPost.bodyCopy}\n\n${(currentPost.hashtags || []).join(' ')}`,
                            `full-${currentPost.id}`
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                      >
                        {copiedField === `full-${currentPost.id}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-500" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy All</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-5">
                    {/* Hook Section */}
                    {currentPost.headline && (
                      <div className="p-4 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-900/40">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                            ⚡ Opening Hook
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(currentPost.headline || '', `hook-${currentPost.id}`)}
                            className="text-purple-600 hover:text-purple-700 text-xs flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            Copy Hook
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          "{currentPost.headline}"
                        </p>
                      </div>
                    )}

                    {/* Full Caption */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                          Caption & Body Copy
                        </span>
                        {editingPostId === currentPost.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(currentPost)}
                              className="text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPostId(null)}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPostId(currentPost.id);
                              setEditedCaption(currentPost.caption || currentPost.bodyCopy || '');
                            }}
                            className="text-xs text-gray-500 hover:text-purple-600 flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                        )}
                      </div>

                      {editingPostId === currentPost.id ? (
                        <textarea
                          rows={6}
                          value={editedCaption}
                          onChange={(e) => setEditedCaption(e.target.value)}
                          className="w-full p-3.5 text-sm rounded-xl border border-purple-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none"
                        />
                      ) : (
                        <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-800 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">
                          {currentPost.caption || currentPost.bodyCopy}
                        </div>
                      )}
                    </div>

                    {/* Call to Action */}
                    {currentPost.cta && (
                      <div className="flex items-center justify-between p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/50 dark:border-amber-900/30 text-xs">
                        <div>
                          <span className="font-bold text-amber-900 dark:text-amber-200 mr-2">
                            Recommended CTA:
                          </span>
                          <span className="text-amber-800 dark:text-amber-300">
                            {currentPost.cta}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Hashtags */}
                    {currentPost.hashtags && currentPost.hashtags.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                          Recommended Hashtags
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {currentPost.hashtags.map((tag: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-mono"
                            >
                              {tag.startsWith('#') ? tag : `#${tag}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Visual Art Direction (Spec Section 20) */}
                    {currentPost.designBrief && (
                      <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                            <Palette className="w-3.5 h-3.5" />
                            Visual Art Direction
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono">
                            Ratio: {currentPost.designBrief.aspectRatio || '1:1'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          <strong className="text-white">Style:</strong>{' '}
                          {currentPost.designBrief.style || 'Clean Minimalist'}
                        </p>
                        {currentPost.designBrief.composition && (
                          <p className="text-xs text-gray-300 leading-relaxed">
                            <strong className="text-white">Composition:</strong>{' '}
                            {currentPost.designBrief.composition}
                          </p>
                        )}
                        <p className="text-xs text-gray-300 leading-relaxed">
                          <strong className="text-white">Color Harmony:</strong>{' '}
                          {currentPost.designBrief.colorHarmony || selectedBrand?.primaryColor}
                        </p>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 dark:border-slate-800">
                      <Link
                        href={`/dashboard/studio?headline=${encodeURIComponent(
                          currentPost.headline || ''
                        )}&bodyCopy=${encodeURIComponent(
                          currentPost.caption || ''
                        )}&platform=${currentPost.platform}`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs font-semibold rounded-xl transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-400 dark:text-purple-600" />
                        Send to AI Studio (Render Graphic)
                      </Link>

                      <Link
                        href="/content/library"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700"
                      >
                        View in Content Library <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreateContentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-gray-500 font-medium">Loading Content Engine...</p>
        </div>
      }
    >
      <CreateContentContent />
    </Suspense>
  );
}
