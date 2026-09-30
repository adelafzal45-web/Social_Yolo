'use client';

import React, { useState, useRef, useCallback } from 'react';
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
  Mail,
  Phone,
  MapPin,
  BadgeCheck,
  Info,
} from 'lucide-react';
import { BrandProfile, ExtractedBrandData, OnImageTextPlacement } from '@/lib/types';
import { extractBrandFromUrlApi } from '@/lib/api';
import { WizardBrandData } from './types';

/**
 * Converts a `data:` URL produced by the backend into a real `File`.
 *
 * This is the bridge that makes a *scraped* logo usable: the browser cannot read
 * the bytes of a cross-origin image, so the backend downloads the logo and hands
 * it back base64-encoded. Without this step the extracted logo would only ever
 * be a preview and would never be sent to the image generator.
 */
async function dataUrlToFile(dataUrl: string, filename: string): Promise<File | null> {
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    if (!blob || blob.size === 0) return null;
    return new File([blob], filename, { type: blob.type || 'image/png' });
  } catch {
    return null;
  }
}

/** Human-readable label for where the logo was discovered on the page. */
const LOGO_SOURCE_LABELS: Record<string, string> = {
  'json-ld': 'structured data (Organization logo)',
  'og-logo': 'the page’s OpenGraph logo tag',
  'og-image': 'the page’s social share image',
  'apple-touch-icon': 'the site’s high-resolution app icon',
  'img-tag': 'a logo image on the homepage',
  'link-icon': 'the site’s icon link',
  'common-path': 'a standard logo file on the site',
  favicon: 'the site favicon',
};

/** Placement slots offered for the contact line. `auto` = let the AI decide. */
const CONTACT_PLACEMENTS: Array<{ id: OnImageTextPlacement; label: string }> = [
  { id: 'auto', label: 'Auto' },
  { id: 'bottom_center', label: 'Bottom' },
  { id: 'bottom_left', label: 'Bottom Left' },
  { id: 'bottom_right', label: 'Bottom Right' },
  { id: 'top_left', label: 'Top Left' },
  { id: 'top_center', label: 'Top' },
  { id: 'top_right', label: 'Top Right' },
];

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
  const [extracted, setExtracted] = useState<ExtractedBrandData | null>(null);
  const [logoNeedsUpload, setLogoNeedsUpload] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Derived contact state — mirrors exactly what the backend will typeset.
  const hasContactValue = Boolean(
    (data.contactEmail || '').trim() || (data.contactPhone || '').trim(),
  );
  const contactPreview = [
    (data.contactPhone || '').trim(),
    (data.contactEmail || '').trim(),
  ]
    .filter(Boolean)
    .join('  ·  ');

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
    setExtracted(null);

    try {
      const extracted: ExtractedBrandData = await extractBrandFromUrlApi(normalizedUrl);
      setExtracted(extracted);

      // The backend already downloaded and verified the logo as base64, so we
      // can turn it into a genuine File and hand it straight to the generator.
      // Without this the scraped logo would stay a preview-only URL.
      let scrapedLogoFile: File | null = null;
      if (extracted.logoReady && extracted.logoDataUrl) {
        scrapedLogoFile = await dataUrlToFile(extracted.logoDataUrl, 'brand-logo.png');
      }

      const hasUsableLogo = Boolean(scrapedLogoFile);

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
        logoFile: hasUsableLogo ? scrapedLogoFile : data.logoFile,
        logoUrl: hasUsableLogo
          ? extracted.logoDataUrl!
          : extracted.logoUrl || data.logoUrl,
        logoRemoteUrl: extracted.logoUrl || null,
        logoSource: extracted.logoSource || null,
        logoReady: hasUsableLogo,
        // Prompt the user about showing the logo on the image.
        logoPrompted: true,
        showLogoOnImage: hasUsableLogo ? (data.showLogoOnImage ?? true) : false,
        // Pre-fill contact details so the user only has to confirm them.
        contactEmail: extracted.contactEmail || data.contactEmail || '',
        contactPhone: extracted.contactPhone || data.contactPhone || '',
      });

      setExtractSuccess(true);
      // Surface the "we could not get a usable logo" state explicitly.
      if (!hasUsableLogo) {
        setLogoNeedsUpload(true);
      }
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
      logoRemoteUrl: b.logoUrl || null,
      logoSource: 'saved brand profile',
      // A saved profile's logo is a remote URL we have not verified, so let the
      // backend fetch it and ask the user to confirm before compositing.
      logoReady: false,
      logoPrompted: true,
      showLogoOnImage: b.showLogoOnImage ?? true,
      contactEmail: b.contactEmail || data.contactEmail || '',
      contactPhone: b.contactPhone || data.contactPhone || '',
    });
    if (b.websiteUrl) setUrlInput(b.websiteUrl);
  };

  // Handle Logo file selection
  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoNeedsUpload(false);
      onChange({
        logoFile: file,
        logoUrl: URL.createObjectURL(file),
        logoRemoteUrl: null,
        logoSource: 'your upload',
        logoReady: true,
        logoPrompted: true,
        // Default to ON: a user who just uploaded a logo wants it on the image.
        showLogoOnImage: true,
      });
    }
  };

  const handleClearLogo = () => {
    onChange({
      logoFile: null,
      logoUrl: null,
      logoRemoteUrl: null,
      logoSource: null,
      logoReady: false,
      showLogoOnImage: false,
    });
    setLogoNeedsUpload(false);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleToggleLogoOnImage = useCallback(
    (enabled: boolean) => {
      onChange({ showLogoOnImage: enabled });
    },
    [onChange],
  );

  /**
   * Keeps `showContactOnImage` consistent with the actual field contents, so
   * the toggle can never claim to print a contact line that does not exist.
   */
  const handleContactFieldChange = useCallback(
    (field: 'contactEmail' | 'contactPhone', value: string) => {
      const nextEmail = field === 'contactEmail' ? value : data.contactEmail || '';
      const nextPhone = field === 'contactPhone' ? value : data.contactPhone || '';
      const hasAny = Boolean(nextEmail.trim() || nextPhone.trim());
      onChange({
        [field]: value,
        showContactOnImage: hasAny,
        contactPlacement: data.contactPlacement || 'auto',
      } as Partial<WizardBrandData>);
    },
    [data.contactEmail, data.contactPhone, data.contactPlacement, onChange],
  );

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

        {/* Logo card spans the full width; the colour picker sits beside nothing else */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* ── Brand Logo: extraction status, upload prompt, and "show on image?" ── */}
          <div className="sm:col-span-2 space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Brand Logo
            </label>
            {extracted?.logoSource && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                <BadgeCheck className="w-3 h-3" />
                Found via {LOGO_SOURCE_LABELS[extracted.logoSource] || extracted.logoSource}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {data.logoUrl ? (
              <div className="relative w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img
                  src={data.logoUrl}
                  alt="Brand Logo"
                  className="w-full h-full object-contain p-1.5"
                  onError={(e) => {
                    // A remote logo can 404 or block hotlinking; hide it rather
                    // than showing a broken image, and let upload take over.
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
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
              <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 flex-shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleLogoFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-brand-500 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              {data.logoUrl ? 'Replace Logo' : 'Upload Logo'}
            </button>
            {data.logoUrl && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {data.logoSource === 'your upload'
                  ? 'From your upload'
                  : data.logoRemoteUrl
                    ? 'Scraped from your site'
                    : 'Attached'}
              </span>
            )}
          </div>
          {/* No usable raster logo — explicitly ask the user to upload one. */}
          {logoNeedsUpload && !data.logoFile && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/70 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="font-bold">We couldn&apos;t find a usable logo on your website.</p>
                <p className="text-[11px] leading-relaxed">
                  {extracted?.logoUrl
                    ? 'We located a logo but it is an SVG or icon format the image generator cannot place. Upload a PNG or JPG and we will use it instead.'
                    : 'No logo was detected on your site. Upload a PNG or JPG and it will be placed on your generated images.'}
                </p>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload my logo
                </button>
              </div>
            </div>
          )}

          {/* A logo is available — ask whether it should appear on the image. */}
          {data.logoFile && (
            <button
              type="button"
              onClick={() => handleToggleLogoOnImage(!data.showLogoOnImage)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                data.showLogoOnImage
                  ? 'border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-950/40'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300'
              }`}
            >
              <span
                className={`relative w-10 h-6 rounded-full transition flex-shrink-0 ${
                  data.showLogoOnImage ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                    data.showLogoOnImage ? 'left-[1.125rem]' : 'left-0.5'
                  }`}
                />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                  {data.showLogoOnImage
                    ? 'Logo will appear on your image'
                    : 'Logo will not appear on your image'}
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {data.showLogoOnImage
                    ? 'Placed once, unwarped, in the quietest corner the subject leaves free.'
                    : 'Your image will be generated completely logo-free.'}
                </span>
              </span>
            </button>
          )}
        </div>

          {/* Primary Color & Preset Swatches */}
          <div className="space-y-1.5 sm:col-span-2">
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
{/* ── Contact details to typeset on the creative ── */}
            <div className="grid grid-cols-1 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Contact details on the image
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5">
                  Optional — we pre-fill anything found on your website. Edit them, or clear
                  the fields to leave them off the creative entirely.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={data.contactEmail || ''}
                      onChange={(e) => handleContactFieldChange('contactEmail', e.target.value)}
                      placeholder="hello@yourbrand.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Phone / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      value={data.contactPhone || ''}
                      onChange={(e) => handleContactFieldChange('contactPhone', e.target.value)}
                      placeholder="+92 300 1234567"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>
              </div>
{/* Show/hide toggle — only meaningful once a value exists. */}
              <button
                type="button"
                disabled={!hasContactValue}
                onClick={() => onChange({ showContactOnImage: !data.showContactOnImage })}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition disabled:opacity-40 disabled:cursor-not-allowed ${
                  hasContactValue && data.showContactOnImage
                    ? 'border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-950/40'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'
                }`}
              >
                <span
                  className={`relative w-10 h-6 rounded-full transition flex-shrink-0 ${
                    hasContactValue && data.showContactOnImage
                      ? 'bg-brand-600'
                      : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                      hasContactValue && data.showContactOnImage
                        ? 'left-[1.125rem]'
                        : 'left-0.5'
                    }`}
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                    {!hasContactValue
                      ? 'Add an email or phone to show it on the image'
                      : data.showContactOnImage
                        ? 'Contact details will appear on your image'
                        : 'Contact details will stay off the image'}
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {contactPreview
                      ? `Will print: “${contactPreview}”`
                      : 'We pre-fill anything we found on your website.'}
                  </span>
                </span>
              </button>

              {/* Placement control, only while the contact line is enabled. */}
              {hasContactValue && data.showContactOnImage && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Contact line position
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CONTACT_PLACEMENTS.map((p) => {
                      const active = (data.contactPlacement || 'auto') === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          title={
                            p.id === 'auto'
                              ? 'Let the AI choose the quietest region'
                              : p.label
                          }
                          onClick={() => onChange({ contactPlacement: p.id })}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                            active
                              ? 'bg-brand-600 text-white border-brand-600'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-500'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-500 flex items-start gap-1">
                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    Auto lets the art director drop it into the quietest band, clear of your
                    product and logo. Fixed positions are honoured but nudged slightly if the
                    subject sits there.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
