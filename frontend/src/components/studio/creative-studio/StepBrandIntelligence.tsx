'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Globe,
  Palette,
  Type,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { BrandProfile } from '@/lib/types';
import { analyzeBrandSyncApi } from '@/lib/api';

interface StepBrandIntelligenceProps {
  brands: BrandProfile[];
  selectedBrandId: string;
  setSelectedBrandId: (id: string) => void;
  brandColors: string[];
  setBrandColors: (colors: string[]) => void;
  fontHeading: string;
  setFontHeading: (font: string) => void;
  fontBody: string;
  setFontBody: (font: string) => void;
  brandTone: string;
  setBrandTone: (tone: string) => void;
  projectName?: string;
  setProjectName?: (val: string) => void;
  campaign?: string;
  setCampaign?: (val: string) => void;
  onBrandCreatedOrUpdated?: (brand: BrandProfile) => void;
}

export function StepBrandIntelligence({
  brands,
  selectedBrandId,
  setSelectedBrandId,
  brandColors,
  setBrandColors,
  fontHeading,
  setFontHeading,
  fontBody,
  setFontBody,
  brandTone,
  setBrandTone,
  projectName,
  setProjectName,
  campaign,
  setCampaign,
  onBrandCreatedOrUpdated,
}: StepBrandIntelligenceProps) {
  const [crawlUrl, setCrawlUrl] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlError, setCrawlError] = useState<string | null>(null);
  const [crawlSuccess, setCrawlSuccess] = useState<string | null>(null);

  const selectedBrand = brands.find((b) => b.id === selectedBrandId);

  const handleBrandSelect = (id: string) => {
    setSelectedBrandId(id);
    const b = brands.find((brand) => brand.id === id);
    if (b) {
      const colors = [b.primaryColor, b.secondaryColor, b.accentColor].filter(Boolean) as string[];
      if (colors.length > 0) setBrandColors(colors);
      if (b.fontHeading) setFontHeading(b.fontHeading);
      if (b.fontBody) setFontBody(b.fontBody);
      if (b.tone) setBrandTone(b.tone);
    }
  };

  const handleCrawlWebsite = async () => {
    if (!crawlUrl.trim()) return;
    setIsCrawling(true);
    setCrawlError(null);
    setCrawlSuccess(null);

    try {
      let formattedUrl = crawlUrl.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }

      const result = await analyzeBrandSyncApi(formattedUrl);
      if (result) {
        const colors = [result.primaryColor, result.secondaryColor, result.accentColor].filter(Boolean) as string[];
        if (colors.length > 0) setBrandColors(colors);
        if (result.fontHeading) setFontHeading(result.fontHeading);
        if (result.fontBody) setFontBody(result.fontBody);
        if (result.tone) setBrandTone(result.tone);

        setCrawlSuccess(`Extracted brand DNA from ${result.brandName || formattedUrl}`);
      }
    } catch (err: any) {
      setCrawlError(err.message || 'Failed to extract brand assets from website URL.');
    } finally {
      setIsCrawling(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 text-xs font-semibold mb-2 border border-brand-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 1 of 5</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Project &amp; Brand Intelligence
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Give your creative project a name, and select or extract your brand identity. SocialYolo enforces exact brand hex colors, typography, and aesthetic rules.
        </p>
      </div>

      {/* Project & Campaign Inputs */}
      {setProjectName && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
              <span>Project Name</span>
              <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              type="text"
              value={projectName || ''}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Summer Release Campaign"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-sm transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Campaign Tag / Group (Optional)
            </label>
            <input
              type="text"
              value={campaign || ''}
              onChange={(e) => setCampaign && setCampaign(e.target.value)}
              placeholder="e.g. Q3 Growth, Weekend Flash Sale"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-sm transition"
            />
          </div>
        </div>
      )}

      {/* Main Grid: Selector & URL Importer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Brand Selector */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
              <span>Select Brand Profile</span>
              <span className="text-[11px] font-normal text-slate-400">
                {brands.length} available
              </span>
            </label>

            {brands.length > 0 ? (
              <select
                value={selectedBrandId}
                onChange={(e) => handleBrandSelect(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.brandName} {b.niche ? `• ${b.niche}` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 text-center">
                No saved brand profiles found. Use the URL extractor on the right to import your brand instantly.
              </div>
            )}

            {/* Quick Summary of Selected Brand */}
            {selectedBrand && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                {selectedBrand.logoUrl ? (
                  <img
                    src={selectedBrand.logoUrl}
                    alt={selectedBrand.brandName}
                    className="w-10 h-10 rounded-xl object-contain bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-base">
                    {selectedBrand.brandName?.charAt(0) || 'B'}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedBrand.brandName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {selectedBrand.industry || selectedBrand.niche || 'Custom Identity'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Color Palette Harmonizer */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-brand-500" />
              <span>Brand Color Palette (Deterministic Precision)</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['Primary', 'Secondary', 'Accent'].map((role, idx) => {
                const colorValue = brandColors[idx] || (idx === 0 ? '#7C5CFF' : idx === 1 ? '#E0AA4E' : '#FFFFFF');
                return (
                  <div key={role} className="space-y-1.5">
                    <span className="text-[11px] font-medium text-slate-500">{role}</span>
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <input
                        type="color"
                        value={colorValue}
                        onChange={(e) => {
                          const updated = [...brandColors];
                          updated[idx] = e.target.value;
                          setBrandColors(updated);
                        }}
                        className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 uppercase">
                        {colorValue}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Instant Website Importer & DNA Summary */}
        <div className="lg:col-span-6 space-y-4">
          {/* Website Crawler */}
          <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mb-2">
              <Globe className="w-4 h-4" />
              <span>Import Brand from Website URL</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              Enter your brand&apos;s website. SocialYolo will crawl your site, extract colors, typography, logos, and synthesize a Brand DNA vector.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={crawlUrl}
                onChange={(e) => setCrawlUrl(e.target.value)}
                placeholder="e.g. apple.com or https://nike.com"
                className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleCrawlWebsite}
                disabled={isCrawling || !crawlUrl.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm shrink-0"
              >
                {isCrawling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Extract DNA</span>
                  </>
                )}
              </button>
            </div>

            {crawlSuccess && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{crawlSuccess}</span>
              </div>
            )}

            {crawlError && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{crawlError}</span>
              </div>
            )}
          </div>

          {/* Typography & Tone Preview */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-brand-500" />
                  <span>Heading Font</span>
                </label>
                <input
                  type="text"
                  value={fontHeading}
                  onChange={(e) => setFontHeading(e.target.value)}
                  placeholder="e.g. Playfair Display"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-brand-500" />
                  <span>Body Font</span>
                </label>
                <input
                  type="text"
                  value={fontBody}
                  onChange={(e) => setFontBody(e.target.value)}
                  placeholder="e.g. Inter"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Brand Tone of Voice
              </label>
              <input
                type="text"
                value={brandTone}
                onChange={(e) => setBrandTone(e.target.value)}
                placeholder="e.g. Luxury, confident, modern, authoritative"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
