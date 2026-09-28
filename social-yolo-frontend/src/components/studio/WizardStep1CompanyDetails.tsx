'use client';

import React, { useState, useRef } from 'react';
import {
  Building2,
  Globe,
  Sparkles,
  RefreshCw,
  Palette,
  Check,
  Upload,
  Image as ImageIcon,
  Type,
  AlertCircle,
  X,
  Trash2,
  Edit3,
  Sliders,
  HelpCircle,
} from 'lucide-react';
import { BrandProfile, ExtractedBrandData } from '@/lib/types';
import { extractBrandFromUrlApi } from '@/lib/api';

export interface Step1CompanyData {
  brandProfileId?: string;
  websiteUrl: string;
  brandName: string;
  niche: string;
  tagline: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  tone: string;
  logoFile: File | null;
  logoUrl?: string | null;
}

interface WizardStep1CompanyDetailsProps {
  data: Step1CompanyData;
  onChange: (fields: Partial<Step1CompanyData>) => void;
  brands: BrandProfile[];
}

export const NICHE_OPTIONS = [
  'E-Commerce & Retail',
  'Fashion & Luxury Apparel',
  'Beauty, Skincare & Cosmetics',
  'Health, Fitness & Wellness',
  'Food, Beverage & Dining',
  'SaaS, Software & Tech',
  'Real Estate & Architecture',
  'Financial Services & Fintech',
  'Creative Agency & Media',
  'Education & Coaching',
];

export const TONE_OPTIONS = [
  { id: 'Luxury & Elegant', label: 'Luxury & Elegant', desc: 'Refined, premium, gold accents & depth' },
  { id: 'Modern & Minimalist', label: 'Modern & Minimalist', desc: 'Clean lines, spacious layout, restrained typography' },
  { id: 'Bold & High-Impact', label: 'Bold & High-Impact', desc: 'Punchy saturated tones, high contrast & energy' },
  { id: 'Authentic Lifestyle', label: 'Authentic Lifestyle', desc: 'Warm natural sunlit atmosphere & relatable human feel' },
  { id: 'Futuristic Tech', label: 'Futuristic Tech', desc: 'Clean geometric precision with subtle neon & cyber glow' },
  { id: 'Playful & Vibrant', label: 'Playful & Vibrant', desc: 'Upbeat, friendly rounded geometry & cheerful bright colors' },
];

export const COLOR_PRESETS = [
  { name: 'Royal Gold', primary: '#7c5cff', secondary: '#e0aa4e', accent: '#ffffff' },
  { name: 'Emerald Luxe', primary: '#0f3d2e', secondary: '#c5a059', accent: '#f5f5f0' },
  { name: 'Warm Sunset', primary: '#f97316', secondary: '#ec4899', accent: '#fef08a' },
  { name: 'Midnight Noir', primary: '#09090b', secondary: '#3f3f46', accent: '#a1a1aa' },
  { name: 'Cyber Neon', primary: '#06b6d4', secondary: '#a855f7', accent: '#ec4899' },
  { name: 'Clean Nordic', primary: '#334155', secondary: '#94a3b8', accent: '#f1f5f9' },
  { name: 'Ocean Electric', primary: '#0369a1', secondary: '#38bdf8', accent: '#ffffff' },
];

export const FONT_PRESETS = [
  { heading: 'Playfair Display', body: 'Inter', label: 'Classic Luxury (Serif + Sans)' },
  { heading: 'Montserrat', body: 'Inter', label: 'Modern Geometric (Bold Display)' },
  { heading: 'Cinzel', body: 'Lato', label: 'High-End Editorial (Cinematic Serif)' },
  { heading: 'Plus Jakarta Sans', body: 'Plus Jakarta Sans', label: 'Tech & Startup (Clean Neo-Grotesque)' },
  { heading: 'Inter', body: 'Inter', label: 'Neutral Minimalist (Crisp Readability)' },
];

export function WizardStep1CompanyDetails({
  data,
  onChange,
  brands,
}: WizardStep1CompanyDetailsProps) {
  const [urlInput, setUrlInput] = useState(data.websiteUrl || '');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [extractedSuccess, setExtractedSuccess] = useState(false);
  const [showUrlHero, setShowUrlHero] = useState(Boolean(data.websiteUrl));
  const logoInputRef = useRef<HTMLInputElement>(null);

  const isValidHex = (hex: string) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);

  const handleFetchFromUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput || !urlInput.trim()) {
      setFetchError('Please enter a website URL or domain name (e.g. apple.com).');
      return;
    }

    setIsFetchingUrl(true);
    setFetchError(null);
    setExtractedSuccess(false);

    try {
      const result: ExtractedBrandData = await extractBrandFromUrlApi(urlInput.trim());

      onChange({
        websiteUrl: result.url || urlInput.trim(),
        brandName: result.brandName || data.brandName,
        niche: result.niche || data.niche,
        tagline: result.tagline || data.tagline,
        description: result.description || data.description,
        primaryColor: result.primaryColor || data.primaryColor,
        secondaryColor: result.secondaryColor || data.secondaryColor,
        accentColor: result.accentColor || data.accentColor,
        fontHeading: result.fontHeading || data.fontHeading,
        fontBody: result.fontBody || data.fontBody,
        tone: result.tone || data.tone,
        logoUrl: result.logoUrl || data.logoUrl,
        brandProfileId: '', // custom / new
      });

      setExtractedSuccess(true);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to auto-fetch brand details. You can enter them manually below.');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleSelectSavedBrand = (brand: BrandProfile) => {
    onChange({
      brandProfileId: brand.id,
      brandName: brand.brandName,
      websiteUrl: brand.websiteUrl || '',
      niche: brand.niche || data.niche,
      tagline: brand.tagline || '',
      description: brand.description || '',
      primaryColor: brand.primaryColor || '#7c5cff',
      secondaryColor: brand.secondaryColor || '#e0aa4e',
      accentColor: brand.accentColor || '#ffffff',
      fontHeading: brand.fontHeading || 'Playfair Display',
      fontBody: brand.fontBody || 'Inter',
      tone: brand.tone || 'Luxury & Elegant',
      logoUrl: brand.logoUrl || null,
    });
    if (brand.websiteUrl) {
      setUrlInput(brand.websiteUrl);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange({
        logoFile: file,
        logoUrl: URL.createObjectURL(file),
      });
    }
  };

  const handleRemoveLogo = () => {
    onChange({
      logoFile: null,
      logoUrl: null,
    });
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleColorHexChange = (
    field: 'primaryColor' | 'secondaryColor' | 'accentColor',
    val: string
  ) => {
    let formatted = val.trim();
    if (formatted && !formatted.startsWith('#')) {
      formatted = '#' + formatted;
    }
    onChange({ [field]: formatted });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Step Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/80">
          <Building2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>STEP 1: COMPANY &amp; BRAND DNA</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Who are we creating for?
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Fill in your company details manually below. Website URL is completely optional. Everything you configure here is automatically applied throughout your campaigns and creative assets.
        </p>
      </div>

      {/* OPTIONAL URL AUTO-FETCH HERO BAR */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 via-white to-brand-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-brand-950/20 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Optional: Auto-Fetch Brand DNA via Website URL</span>
          </div>
          {extractedSuccess && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <Check className="w-3 h-3" />
              <span>Brand DNA Loaded!</span>
            </span>
          )}
        </div>

        <form onSubmit={handleFetchFromUrl} className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Globe className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="e.g. yourcompany.com or https://brand.com (Optional)"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                onChange({ websiteUrl: e.target.value });
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={isFetchingUrl || !urlInput.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isFetchingUrl ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-200" />
                <span>Scanning Website...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Auto-Fetch Brand DNA</span>
              </>
            )}
          </button>
        </form>

        {fetchError && (
          <div className="mt-3 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fetchError}</span>
          </div>
        )}

        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <span>💡</span>
          <span>Don't have a website or prefer manual setup? Skip this step and fill in your brand details below!</span>
        </p>
      </div>

      {/* SAVED BRANDS SELECTOR (IF ANY EXIST) */}
      {brands && brands.length > 0 && (
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Or Choose from Saved Brands</span>
            <span className="text-[11px] font-normal text-slate-500">{brands.length} saved profile(s)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {brands.map((b) => {
              const isSelected = data.brandProfileId === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleSelectSavedBrand(b)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'border-brand-500 bg-brand-500 text-white shadow-sm ring-2 ring-brand-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: b.primaryColor || '#7c5cff' }}
                  />
                  <span>{b.brandName}</span>
                  {b.isDefault && (
                    <span className="text-[10px] font-semibold bg-white/20 px-1.5 py-0.2 rounded">Default</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CORE COMPANY PROFILE FIELDS (100% MANUAL CUSTOMIZABLE) */}
      <div className="space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Company Information
          </span>
          <span className="text-[11px] text-slate-500">All fields fully editable</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Company Name (Required) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Company / Brand Name</span>
              <span className="text-[10px] font-bold text-brand-600 bg-brand-50 dark:bg-brand-950/50 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-900">
                Required
              </span>
            </label>
            <input
              type="text"
              placeholder="e.g. Lumina Luxury Watches"
              value={data.brandName}
              onChange={(e) => onChange({ brandName: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Website URL (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Website URL</span>
              <span className="text-[10px] text-slate-400">Optional</span>
            </label>
            <input
              type="text"
              placeholder="e.g. https://mycompany.com (Optional)"
              value={data.websiteUrl}
              onChange={(e) => {
                onChange({ websiteUrl: e.target.value });
                setUrlInput(e.target.value);
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Commercial Niche / Industry (Dropdown + Custom Typing) */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Commercial Industry / Niche</span>
              <span className="text-[10px] text-slate-500">Select preset or type custom</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={NICHE_OPTIONS.includes(data.niche) ? data.niche : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    onChange({ niche: e.target.value });
                  }
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Choose an industry preset...</option>
                {NICHE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Or type custom industry (e.g. Artisan Ceramics)"
                value={data.niche}
                onChange={(e) => onChange({ niche: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Tagline / Slogan */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <span>Brand Tagline / Slogan</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Elevating timeless moments with Swiss precision."
              value={data.tagline}
              onChange={(e) => onChange({ tagline: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Company Description */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <span>Company Overview / Mission</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Direct-to-consumer luxury accessories crafted with sustainable materials and Swiss movement."
              value={data.description}
              onChange={(e) => onChange({ description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Company Logo Upload & Removal */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Company Logo</span>
              <span className="text-[10px] text-slate-500">Auto-extracted or Upload (Optional)</span>
            </label>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              {data.logoUrl ? (
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden relative shadow-sm">
                    <img
                      src={data.logoUrl}
                      alt="Company Logo"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {data.logoFile ? data.logoFile.name : 'Brand Logo Active'}
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold mt-0.5">
                      <Check className="w-3 h-3" />
                      <span>Ready to brand your marketing creatives</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/70 text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                    title="Remove Logo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      No logo attached
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Optional: Upload your logo (.png, .svg, .jpg) or leave blank for clean text branding
                    </p>
                  </div>
                  <label className="cursor-pointer shrink-0">
                    <div className="px-4 py-2 rounded-xl border border-brand-300 dark:border-brand-700 hover:border-brand-500 bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 text-xs font-bold flex items-center gap-2 transition-all shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Logo</span>
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BRAND COLORS (HEX INPUTS, COLOR PICKERS & PRESETS) */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Palette className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Brand Color Palette (Custom HEX or Picker)</span>
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Type your exact HEX color code or use the color swatch to adjust your brand colors.
            </p>
          </div>

          {/* Mini Live Palette Preview Strip */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
            <span
              className="w-5 h-5 rounded-lg border border-black/10 shadow-sm"
              style={{ backgroundColor: data.primaryColor || '#7c5cff' }}
              title="Primary"
            />
            <span
              className="w-5 h-5 rounded-lg border border-black/10 shadow-sm"
              style={{ backgroundColor: data.secondaryColor || '#e0aa4e' }}
              title="Secondary"
            />
            <span
              className="w-5 h-5 rounded-lg border border-black/10 shadow-sm"
              style={{ backgroundColor: data.accentColor || '#ffffff' }}
              title="Accent"
            />
          </div>
        </div>

        {/* 3 Color Pickers with Direct HEX inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Primary */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 shadow-sm">
            <div className="space-y-1 flex-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Primary Color</span>
              <input
                type="text"
                value={data.primaryColor || '#7c5cff'}
                onChange={(e) => handleColorHexChange('primaryColor', e.target.value)}
                className="w-full text-xs font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="#7c5cff"
              />
            </div>
            <input
              type="color"
              value={isValidHex(data.primaryColor) ? data.primaryColor : '#7c5cff'}
              onChange={(e) => onChange({ primaryColor: e.target.value })}
              className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent p-0 shrink-0"
            />
          </div>

          {/* Secondary */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 shadow-sm">
            <div className="space-y-1 flex-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Secondary Color</span>
              <input
                type="text"
                value={data.secondaryColor || '#e0aa4e'}
                onChange={(e) => handleColorHexChange('secondaryColor', e.target.value)}
                className="w-full text-xs font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="#e0aa4e"
              />
            </div>
            <input
              type="color"
              value={isValidHex(data.secondaryColor) ? data.secondaryColor : '#e0aa4e'}
              onChange={(e) => onChange({ secondaryColor: e.target.value })}
              className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent p-0 shrink-0"
            />
          </div>

          {/* Accent */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 shadow-sm">
            <div className="space-y-1 flex-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Accent Color</span>
              <input
                type="text"
                value={data.accentColor || '#ffffff'}
                onChange={(e) => handleColorHexChange('accentColor', e.target.value)}
                className="w-full text-xs font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="#ffffff"
              />
            </div>
            <input
              type="color"
              value={isValidHex(data.accentColor) ? data.accentColor : '#ffffff'}
              onChange={(e) => onChange({ accentColor: e.target.value })}
              className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent p-0 shrink-0"
            />
          </div>
        </div>

        {/* Quick Preset Palettes */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Quick Palette Presets:
          </span>
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((p) => {
              const isMatch =
                data.primaryColor.toLowerCase() === p.primary.toLowerCase() &&
                data.secondaryColor.toLowerCase() === p.secondary.toLowerCase();
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() =>
                    onChange({
                      primaryColor: p.primary,
                      secondaryColor: p.secondary,
                      accentColor: p.accent,
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
                    isMatch
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="flex -space-x-1">
                    <span className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: p.primary }} />
                    <span className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: p.secondary }} />
                    <span className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: p.accent }} />
                  </div>
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* BRAND TYPOGRAPHY (PRESETS & CUSTOM FONTS) */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Type className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Brand Typography</span>
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Define font styles for headlines and body copy across all rendered creatives.
          </p>
        </div>

        {/* Font Presets */}
        <div className="flex flex-wrap gap-2">
          {FONT_PRESETS.map((f) => {
            const isSelected =
              data.fontHeading.toLowerCase() === f.heading.toLowerCase() &&
              data.fontBody.toLowerCase() === f.body.toLowerCase();
            return (
              <button
                key={f.label}
                type="button"
                onClick={() => onChange({ fontHeading: f.heading, fontBody: f.body })}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Custom Font Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-500">Heading Font</span>
            <input
              type="text"
              placeholder="e.g. Playfair Display, Cinzel, Montserrat"
              value={data.fontHeading}
              onChange={(e) => onChange({ fontHeading: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-500">Body Font</span>
            <input
              type="text"
              placeholder="e.g. Inter, Lato, Plus Jakarta Sans"
              value={data.fontBody}
              onChange={(e) => onChange({ fontBody: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* BRAND VOICE & TONE (PRESETS + CUSTOM INPUT) */}
      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Brand Voice &amp; Tone</span>
            <span className="text-[10px] text-slate-500">Used for copywriting across all steps</span>
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Select a preset voice or customize your exact copy tone. This tone will automatically guide all headlines and captions.
          </p>
        </div>

        {/* Tone Preset Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {TONE_OPTIONS.map((t) => {
            const isSelected = data.tone.toLowerCase() === t.id.toLowerCase();
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange({ tone: t.id })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/60 text-slate-900 dark:text-white shadow-sm ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>{t.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                  {t.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Tone Input */}
        <div className="space-y-1 pt-1">
          <span className="text-[10px] font-bold uppercase text-slate-500">Or type custom brand voice</span>
          <input
            type="text"
            placeholder="e.g. Sophisticated &amp; witty, bold urban street style, or empathetic &amp; warm"
            value={data.tone}
            onChange={(e) => onChange({ tone: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
    </div>
  );
}
