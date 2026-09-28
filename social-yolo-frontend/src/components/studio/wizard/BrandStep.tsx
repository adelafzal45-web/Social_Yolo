'use client';

import React, { useState, useRef } from 'react';
import {
  Globe,
  Sparkles,
  RefreshCw,
  Building2,
  Upload,
  Image as ImageIcon,
  Palette,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Sliders,
  AlertCircle,
} from 'lucide-react';
import { BrandProfile, ExtractedBrandData } from '@/lib/types';
import { extractBrandFromUrlApi } from '@/lib/api';
import { WizardBrandData } from './types';

interface BrandStepProps {
  data: WizardBrandData;
  onChange: (fields: Partial<WizardBrandData>) => void;
  brands: BrandProfile[];
  onSkip?: () => void;
}

const COLOR_PRESETS = [
  { name: 'Royal Gold', primary: '#7c5cff', secondary: '#e0aa4e', accent: '#ffffff' },
  { name: 'Emerald Luxe', primary: '#0f3d2e', secondary: '#c5a059', accent: '#f5f5f0' },
  { name: 'Warm Sunset', primary: '#f97316', secondary: '#ec4899', accent: '#fef08a' },
  { name: 'Midnight Noir', primary: '#09090b', secondary: '#3f3f46', accent: '#a1a1aa' },
  { name: 'Cyber Neon', primary: '#06b6d4', secondary: '#a855f7', accent: '#ec4899' },
  { name: 'Clean Nordic', primary: '#334155', secondary: '#94a3b8', accent: '#f1f5f9' },
];

const POPULAR_FONTS = [
  'Playfair Display',
  'Montserrat',
  'Inter',
  'Cinzel',
  'Plus Jakarta Sans',
  'Poppins',
  'Lato',
];

export function BrandStep({
  data,
  onChange,
  brands,
  onSkip,
}: BrandStepProps) {
  const [urlInput, setUrlInput] = useState(data.websiteUrl || '');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractSuccess, setExtractSuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Extract brand details from website URL
  const handleExtractFromUrl = async () => {
    const raw = urlInput.trim();
    if (!raw) {
      setExtractError('Please enter a website URL (e.g. apple.com or https://nike.com)');
      return;
    }

    let normalizedUrl = raw;
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    setIsExtracting(true);
    setExtractError(null);
    setExtractSuccess(false);

    try {
      const extracted: ExtractedBrandData = await extractBrandFromUrlApi(normalizedUrl);
      onChange({
        websiteUrl: normalizedUrl,
        brandName: extracted.brandName || data.brandName || 'Brand',
        niche: extracted.niche || data.niche,
        tagline: extracted.tagline || data.tagline,
        description: extracted.description || data.description,
        primaryColor: extracted.primaryColor || data.primaryColor,
        secondaryColor: extracted.secondaryColor || data.secondaryColor,
        accentColor: extracted.accentColor || data.accentColor,
        fontHeading: extracted.fontHeading || data.fontHeading,
        fontBody: extracted.fontBody || data.fontBody,
        tone: extracted.tone || data.tone,
        logoUrl: extracted.logoUrl || data.logoUrl,
      });
      setExtractSuccess(true);
    } catch (err: any) {
      console.warn('URL extraction note:', err);
      setExtractError(
        err?.message || 'Could not fetch brand from URL. You can still enter your brand details manually below.'
      );
      // Still store the entered URL
      onChange({ websiteUrl: normalizedUrl });
    } finally {
      setIsExtracting(false);
    }
  };

  // Select a saved brand profile
  const handleSelectSavedBrand = (b: BrandProfile) => {
    onChange({
      brandProfileId: b.id,
      brandName: b.brandName || data.brandName,
      websiteUrl: b.websiteUrl || data.websiteUrl,
      niche: b.niche || data.niche,
      tagline: b.tagline || data.tagline,
      description: b.description || data.description,
      primaryColor: b.primaryColor || data.primaryColor,
      secondaryColor: b.secondaryColor || data.secondaryColor,
      accentColor: b.accentColor || data.accentColor,
      fontHeading: b.fontHeading || data.fontHeading,
      fontBody: b.fontBody || data.fontBody,
      tone: b.tone || data.tone,
      logoUrl: b.logoUrl || data.logoUrl,
    });
    if (b.websiteUrl) setUrlInput(b.websiteUrl);
  };

  // Handle Logo file selection
  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange({
        logoFile: file,
        logoUrl: URL.createObjectURL(file),
      });
    }
  };

  const handleClearLogo = () => {
    onChange({ logoFile: null, logoUrl: null });
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 text-brand-700 dark:text-brand-300 text-xs font-semibold">
          <Globe className="w-3.5 h-3.5" />
          <span>Step 1 · Brand Identity</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          What is your brand or business?
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Enter your website to automatically extract your brand colors, logo, and tone, or choose a saved brand.
        </p>
      </div>

      {/* Main Action: URL Input with 1-Click Extraction */}
      <div className="relative p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-brand-500/5 via-slate-50 to-indigo-500/5 dark:from-brand-950/30 dark:via-slate-900/60 dark:to-indigo-950/30 border border-brand-200/80 dark:border-brand-800/40 shadow-sm space-y-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Extract Brand from Website
        </label>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleExtractFromUrl();
                }
              }}
              placeholder="e.g. nike.com or yourbrand.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            type="button"
            onClick={handleExtractFromUrl}
            disabled={isExtracting || !urlInput.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition disabled:opacity-40 disabled:pointer-events-none flex-shrink-0"
          >
            {isExtracting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Extracting DNA…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Extract Brand DNA</span>
              </>
            )}
          </button>
        </div>

        {/* Extraction status banners */}
        {extractSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Brand identity successfully extracted! Colors and name have been auto-populated.</span>
          </div>
        )}
        {extractError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{extractError}</span>
          </div>
        )}
      </div>

      {/* Saved Brand Profiles (if user has any saved) */}
      {brands.length > 0 && (
        <div className="space-y-2.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Or Pick a Saved Brand Profile
          </label>
          <div className="flex flex-wrap gap-2">
            {brands.map((b) => {
              const isSelected = data.brandProfileId === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleSelectSavedBrand(b)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                    isSelected
                      ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-brand-500'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{b.brandName}</span>
                  {b.primaryColor && (
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block"
                      style={{ backgroundColor: b.primaryColor }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Core Brand Fields (Always visible, clean and focused) */}
      <div className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Brand Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Brand Name <span className="text-brand-500">*</span>
            </label>
            <input
              type="text"
              value={data.brandName}
              onChange={(e) => onChange({ brandName: e.target.value })}
              placeholder="e.g. Lumina Labs"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Brand Heading Font */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Brand Font
            </label>
            <select
              value={data.fontHeading}
              onChange={(e) => onChange({ fontHeading: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {POPULAR_FONTS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Logo Upload + Color Picker in a compact row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Logo upload */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Brand Logo (Optional)
            </label>
            <div className="flex items-center gap-3">
              {data.logoUrl ? (
                <div className="relative w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img
                    src={data.logoUrl}
                    alt="Brand Logo"
                    className="w-full h-full object-contain p-1"
                  />
                  <button
                    type="button"
                    onClick={handleClearLogo}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition"
                    title="Remove logo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 flex-shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-brand-500 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 transition"
              >
                {data.logoUrl ? 'Replace Logo' : 'Upload Logo'}
              </button>
            </div>
          </div>

          {/* Primary Color & Preset Swatches */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Primary Brand Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={data.primaryColor}
                onChange={(e) => onChange({ primaryColor: e.target.value })}
                className="w-9 h-9 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={data.primaryColor}
                onChange={(e) => onChange({ primaryColor: e.target.value })}
                placeholder="#7c5cff"
                className="w-24 px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono"
              />
              <div className="flex items-center gap-1.5 ml-auto">
                {COLOR_PRESETS.slice(0, 4).map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    onClick={() =>
                      onChange({
                        primaryColor: c.primary,
                        secondaryColor: c.secondary,
                        accentColor: c.accent,
                      })
                    }
                    className="w-6 h-6 rounded-full border border-black/10 transition-transform hover:scale-110"
                    style={{ backgroundColor: c.primary }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Brand Settings (Expandable Accordion) */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Advanced Brand Settings</span>
          {showAdvanced ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {showAdvanced && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Secondary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={data.secondaryColor}
                    onChange={(e) => onChange({ secondaryColor: e.target.value })}
                    className="w-7 h-7 p-0.5 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={data.secondaryColor}
                    onChange={(e) => onChange({ secondaryColor: e.target.value })}
                    className="w-24 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={data.accentColor}
                    onChange={(e) => onChange({ accentColor: e.target.value })}
                    className="w-7 h-7 p-0.5 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={data.accentColor}
                    onChange={(e) => onChange({ accentColor: e.target.value })}
                    className="w-24 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Tagline / Motto
                </label>
                <input
                  type="text"
                  value={data.tagline}
                  onChange={(e) => onChange({ tagline: e.target.value })}
                  placeholder="e.g. Pure Innovation"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Industry / Niche
                </label>
                <input
                  type="text"
                  value={data.niche}
                  onChange={(e) => onChange({ niche: e.target.value })}
                  placeholder="e.g. Luxury Fashion, Coffee, SaaS"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
