'use client';

import React, { useState, useEffect } from 'react';
import {
  Palette,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Check,
  X,
  RefreshCw,
  Building2,
  Type,
  Search,
  Star,
  ArrowRight,
  SlidersHorizontal,
  Wand2,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { getBrandsApi, createBrandApi, updateBrandApi, deleteBrandApi } from '@/lib/api';
import { BrandProfile, BrandAnalysisResult, BrandSource } from '@/lib/types';
import { useNotification } from '@/context/NotificationContext';
import { UrlAnalysisModal } from '@/components/brand/UrlAnalysisModal';
import { BrandReviewModal } from '@/components/brand/BrandReviewModal';
import { BrandDnaDrawer } from '@/components/brand/BrandDnaDrawer';

const TONES = [
  'Prestigious & Luxury',
  'Scandinavian Minimalist',
  'Bold & High-Energy',
  'Authentic & Warm Lifestyle',
  'Technical & Modern',
  'Playful & Friendly',
];

const FONTS = [
  'Canela',
  'Playfair Display',
  'Cinzel',
  'Cormorant Garamond',
  'Lora',
  'Bodoni Moda',
  'Fraunces',
  'Merriweather',
  'Prata',
  'DM Serif Display',
  'Inter',
  'Plus Jakarta Sans',
  'DM Sans',
  'Roboto',
  'Open Sans',
  'Lato',
  'Helvetica',
  'Geist',
  'Montserrat',
  'Outfit',
  'Poppins',
  'Raleway',
  'Work Sans',
  'Manrope',
  'Urbanist',
  'Syne',
  'Cabinet Grotesk',
  'Clash Display',
  'Space Grotesk',
  'Oswald',
  'Bebas Neue',
  'Anton',
  'Righteous',
];

const BRAND_PRESET_PALETTES = [
  { name: 'Royal Gold', primary: '#7c5cff', secondary: '#e0aa4e', accent: '#ffffff' },
  { name: 'Emerald Luxe', primary: '#0f3d2e', secondary: '#c5a059', accent: '#f5f5f0' },
  { name: 'Warm Sunset', primary: '#f97316', secondary: '#ec4899', accent: '#fef08a' },
  { name: 'Midnight Noir', primary: '#09090b', secondary: '#3f3f46', accent: '#a1a1aa' },
  { name: 'Cyber Neon', primary: '#06b6d4', secondary: '#a855f7', accent: '#ec4899' },
  { name: 'Clean Nordic', primary: '#334155', secondary: '#94a3b8', accent: '#f1f5f9' },
  { name: 'Crimson Velvet', primary: '#881337', secondary: '#f59e0b', accent: '#fffbeb' },
  { name: 'Ocean Electric', primary: '#0369a1', secondary: '#38bdf8', accent: '#ffffff' },
];

export default function BrandsPage() {
  const { toast } = useNotification();
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Website Analyzer & Intelligence Modals
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [dnaDrawerOpen, setDnaDrawerOpen] = useState(false);
  const [analyzedResult, setAnalyzedResult] = useState<BrandAnalysisResult | null>(null);
  const [analyzedSources, setAnalyzedSources] = useState<BrandSource[]>([]);
  const [selectedBrandForDna, setSelectedBrandForDna] = useState<BrandProfile | null>(null);

  // Filter & Search states
  const [activeFilter, setActiveFilter] = useState<'all' | 'default'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal active tab
  const [modalTab, setModalTab] = useState<'identity' | 'colors' | 'typography'>('identity');

  // Form states
  const [brandName, setBrandName] = useState('');
  const [niche, setNiche] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#7c5cff');
  const [secondaryColor, setSecondaryColor] = useState('#e0aa4e');
  const [accentColor, setAccentColor] = useState('#ffffff');
  const [fontHeading, setFontHeading] = useState('Plus Jakarta Sans');
  const [fontBody, setFontBody] = useState('Inter');
  const [tone, setTone] = useState('Prestigious & Luxury');
  const [isDefault, setIsDefault] = useState(false);

  const loadBrands = async () => {
    setLoading(true);
    try {
      const items = await getBrandsApi();
      setBrands(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setBrandName('');
    setNiche('');
    setPrimaryColor('#7c5cff');
    setSecondaryColor('#e0aa4e');
    setAccentColor('#ffffff');
    setFontHeading('Plus Jakarta Sans');
    setFontBody('Inter');
    setTone('Prestigious & Luxury');
    setIsDefault(brands.length === 0);
    setErrorMsg(null);
    setModalTab('identity');
    setModalOpen(true);
  };

  const openEditModal = (b: BrandProfile) => {
    setEditingId(b.id);
    setBrandName(b.brandName);
    setNiche(b.niche || '');
    setPrimaryColor(b.primaryColor || '#7c5cff');
    setSecondaryColor(b.secondaryColor || '#e0aa4e');
    setAccentColor(b.accentColor || '#ffffff');
    setFontHeading(b.fontHeading || 'Plus Jakarta Sans');
    setFontBody(b.fontBody || 'Inter');
    setTone(b.tone || 'Prestigious & Luxury');
    setIsDefault(Boolean(b.isDefault));
    setErrorMsg(null);
    setModalTab('identity');
    setModalOpen(true);
  };

  const handleHexChange = (
    setter: (val: string) => void,
    val: string
  ) => {
    let clean = val.trim();
    if (!clean.startsWith('#') && clean.length > 0) {
      clean = '#' + clean;
    }
    setter(clean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      setErrorMsg('Brand Name is required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (editingId) {
        const updated = await updateBrandApi(editingId, {
          brandName: brandName.trim(),
          niche: niche.trim() || undefined,
          primaryColor,
          secondaryColor,
          accentColor,
          fontHeading,
          fontBody,
          tone,
          isDefault,
        });
        setBrands((prev) =>
          prev.map((b) => (b.id === editingId ? updated : isDefault ? { ...b, isDefault: false } : b))
        );
      } else {
        const created = await createBrandApi({
          brandName: brandName.trim(),
          niche: niche.trim() || undefined,
          primaryColor,
          secondaryColor,
          accentColor,
          fontHeading,
          fontBody,
          tone,
          isDefault,
        });
        setBrands((prev) => [
          created,
          ...(isDefault ? prev.map((b) => ({ ...b, isDefault: false })) : prev),
        ]);
      }
      toast.success(editingId ? 'Brand profile updated successfully.' : 'New brand profile created.', 'Brand DNA Saved');
      setModalOpen(false);
    } catch (err: any) {
      const msg = err.message || 'Failed to save brand profile';
      setErrorMsg(msg);
      toast.error(msg, 'Brand Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand profile?')) return;
    try {
      await deleteBrandApi(id);
      setBrands((prev) => prev.filter((b) => b.id !== id));
      toast.info('Brand profile deleted.', 'Brand Removed');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to delete brand profile.', 'Delete Error');
    }
  };

  const filteredBrands = brands.filter((b) => {
    if (activeFilter === 'default' && !b.isDefault) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.brandName.toLowerCase().includes(q) ||
        (b.niche && b.niche.toLowerCase().includes(q)) ||
        (b.tone && b.tone.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* SCREEN HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Palette className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>Brand DNA Profiles</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Store your official brand colors, typography and creative tone. The AI engine automatically incorporates this DNA into every generation.
          </p>
        </div>

        {/* DUAL ACTION BUTTONS */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setUrlModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-bold text-xs transition shadow-lg shadow-purple-600/25 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Analyze Website</span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/20 uppercase tracking-wider">
              AI
            </span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-zinc-200 font-bold text-xs transition border border-slate-300 dark:border-slate-700 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Manually</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH TABS BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full sm:w-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Brands ({brands.length})
          </button>
          <button
            onClick={() => setActiveFilter('default')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === 'default'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Default Brand</span>
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search brands by name, niche..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
      </div>

      {/* BRAND CARDS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-16 text-center bg-white dark:bg-slate-900/40 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3">
            <Palette className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {searchQuery ? 'No matching brand profiles found' : 'No Brand DNA created yet'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            {searchQuery
              ? 'Try adjusting your search query or clear the filter.'
              : "Analyze your website with AI in 5 seconds or create a custom brand profile manually."}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setUrlModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-md shadow-purple-600/20 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Analyze Website URL</span>
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition border border-slate-300 dark:border-slate-700 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Manually</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBrands.map((brand) => (
            <div
              key={brand.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800/80 hover:border-brand-500/50 transition flex flex-col justify-between space-y-4 relative shadow-sm dark:shadow-lg group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3 truncate">
                    {/* Brand Logo or Monogram */}
                    <div
                      className="w-11 h-11 rounded-2xl p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-sm"
                      style={{ borderColor: (brand.primaryColor || '#7c5cff') + '40' }}
                    >
                      {brand.logoUrl || brand.faviconUrl ? (
                        <img
                          src={brand.logoUrl || brand.faviconUrl || ''}
                          alt={brand.brandName}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.target as any).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span
                          className="text-xs font-black"
                          style={{ color: brand.primaryColor || '#7c5cff' }}
                        >
                          {brand.brandName.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="truncate">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {brand.brandName}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate flex items-center gap-1.5">
                        <span>{brand.industry || brand.niche || 'General'}</span>
                        {brand.websiteUrl && (
                          <a
                            href={brand.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-purple-600 dark:text-purple-400 hover:underline"
                            title={brand.websiteUrl}
                          >
                            <ExternalLink className="w-2.5 h-2.5 inline" />
                          </a>
                        )}
                      </p>
                    </div>
                  </div>

                  {brand.isDefault && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30 shrink-0">
                      Default
                    </span>
                  )}
                </div>

                {/* Tagline if available */}
                {brand.tagline && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-1 mt-1">
                    "{brand.tagline}"
                  </p>
                )}

                {/* Color Swatches */}
                <div className="pt-3">
                  <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                    Color Palette Harmony
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { color: brand.primaryColor, label: 'Primary' },
                      { color: brand.secondaryColor, label: 'Secondary' },
                      { color: brand.accentColor, label: 'Accent' },
                    ].map((swatch, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-300 dark:border-slate-800"
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-white/20 shadow-sm shrink-0"
                          style={{ backgroundColor: swatch.color }}
                        />
                        <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-300">
                          {swatch.color}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Typography & Tone */}
                <div className="pt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                      Heading Font
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-200 truncate block">
                      {brand.fontHeading}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                      Brand Tone
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-200 truncate block">
                      {brand.tone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBrandForDna(brand);
                    setDnaDrawerOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/20 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>View DNA</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {brand.websiteUrl && (
                    <button
                      onClick={() => {
                        setUrlModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white border border-slate-300 dark:border-slate-700 transition cursor-pointer"
                      title="Re-sync with website"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(brand)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white border border-slate-300 dark:border-slate-700 transition cursor-pointer"
                    title="Edit brand"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(brand.id)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 transition cursor-pointer"
                    title="Delete brand"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL (WITH TABS & GUARANTEED VISIBLE BUTTONS) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div role="dialog" aria-modal="true" className="modal-dialog relative w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-900 dark:text-slate-100">
            
            {/* MODAL HEADER */}
            <div className="p-5 sm:p-6 pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {editingId ? 'Edit Brand DNA' : 'New Brand DNA Profile'}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      Configure your official brand styling rules and creative palette.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* MODAL NAVIGATION TABS */}
              <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-200/90 dark:bg-slate-950 rounded-2xl border border-slate-300 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalTab('identity')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                    modalTab === 'identity'
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Identity</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('colors')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                    modalTab === 'colors'
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Colors</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('typography')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                    modalTab === 'typography'
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Typography</span>
                </button>
              </div>
            </div>

            {/* ERROR ALERT */}
            {errorMsg && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* SCROLLABLE MODAL BODY */}
            <form id="brand-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
              
              {/* TAB 1: IDENTITY */}
              {modalTab === 'identity' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <label className="text-slate-900 dark:text-slate-100 font-extrabold text-xs block mb-1.5">
                      Brand / Business Name *
                    </label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="e.g. Lumina Watches, Aura Beauty, Apex Tech"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 text-xs font-semibold shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-slate-900 dark:text-slate-100 font-extrabold text-xs block mb-1.5">
                      Niche / Industry Category
                    </label>
                    <input
                      type="text"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      placeholder="e.g. Luxury Goods, Nightclub Events, E-Commerce, SaaS"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 text-xs font-semibold shadow-sm"
                    />
                  </div>

                  {/* Set as default brand checkbox */}
                  <label className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-800 flex items-center gap-3 cursor-pointer hover:border-slate-400 dark:hover:border-slate-700 transition shadow-sm">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="w-4 h-4 accent-brand-600 rounded cursor-pointer"
                    />
                    <div>
                      <span className="text-slate-900 dark:text-white font-bold block text-xs">
                        Set as Default Brand Profile
                      </span>
                      <span className="text-[11px] text-slate-700 dark:text-slate-400 block mt-0.5 font-medium">
                        New campaign creations in the studio will automatically preload this DNA.
                      </span>
                    </div>
                  </label>
                </div>
              )}

              {/* TAB 2: COLOR HARMONY */}
              {modalTab === 'colors' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Preset Quick-Picks */}
                  <div>
                    <span className="text-slate-900 dark:text-slate-100 font-extrabold text-xs block mb-2">
                      Curated Designer Presets
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {BRAND_PRESET_PALETTES.map((preset) => {
                        const isMatch =
                          primaryColor.toLowerCase() === preset.primary.toLowerCase() &&
                          secondaryColor.toLowerCase() === preset.secondary.toLowerCase() &&
                          accentColor.toLowerCase() === preset.accent.toLowerCase();

                        return (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => {
                              setPrimaryColor(preset.primary);
                              setSecondaryColor(preset.secondary);
                              setAccentColor(preset.accent);
                            }}
                            className={`p-2.5 rounded-xl border-2 text-left transition cursor-pointer shadow-sm ${
                              isMatch
                                ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/60 ring-2 ring-brand-500/30'
                                : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-400'
                            }`}
                          >
                            <span className="text-[11px] font-black text-slate-900 dark:text-white block truncate mb-1.5">
                              {preset.name}
                            </span>
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10" style={{ backgroundColor: preset.primary }} />
                              <div className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10" style={{ backgroundColor: preset.secondary }} />
                              <div className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10" style={{ backgroundColor: preset.accent }} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Pickers */}
                  <div className="pt-2">
                    <span className="text-slate-900 dark:text-slate-100 font-extrabold text-xs block mb-2">
                      Custom Color Swatches &amp; HEX Codes
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { label: 'Primary', val: primaryColor, setter: setPrimaryColor },
                        { label: 'Secondary', val: secondaryColor, setter: setSecondaryColor },
                        { label: 'Accent', val: accentColor, setter: setAccentColor },
                      ].map((col) => (
                        <div key={col.label} className="p-3 rounded-xl bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-800 space-y-2 shadow-sm">
                          <span className="text-[10px] uppercase font-black text-slate-700 dark:text-slate-300 block tracking-wider">
                            {col.label} Tone
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="relative w-7 h-7 rounded-lg overflow-hidden border-2 border-slate-300 dark:border-slate-700 shrink-0 cursor-pointer shadow-sm">
                              <input
                                type="color"
                                value={col.val}
                                onChange={(e) => col.setter(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <div className="w-full h-full" style={{ backgroundColor: col.val }} />
                            </div>
                            <input
                              type="text"
                              maxLength={7}
                              value={col.val.toUpperCase()}
                              onChange={(e) => handleHexChange(col.setter, e.target.value)}
                              className="w-full bg-slate-100 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border-2 border-slate-300 dark:border-slate-700 text-xs font-mono font-black text-slate-900 dark:text-white uppercase focus:outline-none focus:border-brand-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Live Harmony Preview Strip */}
                  <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-800 flex items-center justify-between gap-3 shadow-sm">
                    <div>
                      <span className="text-[10px] uppercase font-black text-slate-600 dark:text-slate-400 block tracking-wider">
                        Live Palette Preview
                      </span>
                      <span className="text-xs font-mono font-black text-slate-900 dark:text-white">
                        {primaryColor} • {secondaryColor} • {accentColor}
                      </span>
                    </div>

                    <div
                      className="px-3.5 py-1.5 rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 border border-black/10 dark:border-white/10"
                      style={{ backgroundColor: primaryColor, color: accentColor }}
                    >
                      <span style={{ color: secondaryColor }}>★</span>
                      <span>Brand Accent</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TYPOGRAPHY & TONE */}
              {modalTab === 'typography' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <label className="text-slate-900 dark:text-slate-100 font-extrabold text-xs block mb-1.5">
                      Primary Headline Font
                    </label>
                    <select
                      value={fontHeading}
                      onChange={(e) => setFontHeading(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 text-xs font-bold cursor-pointer shadow-sm"
                    >
                      {FONTS.map((f) => (
                        <option key={f} value={f} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-1">{f}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-900 dark:text-slate-100 font-extrabold text-xs block mb-1.5">
                      Supporting Body Font
                    </label>
                    <select
                      value={fontBody}
                      onChange={(e) => setFontBody(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 text-xs font-bold cursor-pointer shadow-sm"
                    >
                      {FONTS.map((f) => (
                        <option key={f} value={f} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-1">{f}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-900 dark:text-slate-100 font-extrabold text-xs block mb-1.5">
                      Voice Tone &amp; Aesthetic Atmosphere
                    </label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 text-xs font-bold cursor-pointer shadow-sm"
                    >
                      {TONES.map((t) => (
                        <option key={t} value={t} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-1">{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </form>

            {/* STICKY MODAL FOOTER WITH GUARANTEED VISIBLE ACTION BUTTONS */}
            <div className="p-4 sm:px-6 bg-slate-100 dark:bg-slate-950 border-t border-slate-300 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {modalTab !== 'identity' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (modalTab === 'typography') setModalTab('colors');
                      else if (modalTab === 'colors') setModalTab('identity');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-700 font-bold text-xs transition cursor-pointer shadow-sm"
                  >
                    ← Back
                  </button>
                ) : (
                  <span className="text-xs text-slate-700 dark:text-slate-400 font-bold">
                    Identity
                  </span>
                )}

                {modalTab !== 'typography' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (modalTab === 'identity') setModalTab('colors');
                      else if (modalTab === 'colors') setModalTab('typography');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-700 font-bold text-xs transition cursor-pointer shadow-sm"
                  >
                    Next →
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-700 font-bold text-xs transition shadow-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="brand-form"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-brand-500/25 transition cursor-pointer disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{editingId ? 'Save Changes' : 'Create Brand DNA'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* URL ANALYSIS MODAL */}
      <UrlAnalysisModal
        isOpen={urlModalOpen}
        onClose={() => setUrlModalOpen(false)}
        onAnalysisComplete={(result, sources) => {
          setUrlModalOpen(false);
          setAnalyzedResult(result);
          setAnalyzedSources(sources);
          setReviewModalOpen(true);
        }}
        onManualCreateRequested={() => {
          setUrlModalOpen(false);
          openCreateModal();
        }}
      />

      {/* EDITABLE REVIEW MODAL */}
      {analyzedResult && (
        <BrandReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setAnalyzedResult(null);
          }}
          analysisResult={analyzedResult}
          sources={analyzedSources}
          onSaveSuccess={(savedBrand) => {
            setBrands((prev) => [
              savedBrand,
              ...(savedBrand.isDefault ? prev.map((b) => ({ ...b, isDefault: false })) : prev),
            ]);
            loadBrands();
          }}
        />
      )}

      {/* BRAND DNA DRAWER */}
      <BrandDnaDrawer
        isOpen={dnaDrawerOpen}
        onClose={() => {
          setDnaDrawerOpen(false);
          setSelectedBrandForDna(null);
        }}
        brand={selectedBrandForDna}
        onReanalyzeRequested={() => {
          setDnaDrawerOpen(false);
          setUrlModalOpen(true);
        }}
      />
    </div>
  );
}
