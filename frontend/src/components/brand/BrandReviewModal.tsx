'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Palette,
  Check,
  Building2,
  Type,
  Users,
  Share2,
  Layers,
  Plus,
  Trash2,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Globe,
  Tag,
} from 'lucide-react';
import { createBrandApi } from '@/lib/api';
import { BrandAnalysisResult, BrandSource, BrandProfile } from '@/lib/types';
import { useNotification } from '@/context/NotificationContext';

interface BrandReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult: BrandAnalysisResult;
  sources?: BrandSource[];
  onSaveSuccess: (saved: BrandProfile) => void;
}

const TONES = [
  'Prestigious & Luxury',
  'Scandinavian Minimalist',
  'Bold & High-Energy',
  'Authentic & Warm Lifestyle',
  'Technical & Modern',
  'Playful & Friendly',
];

const FONTS = [
  'Plus Jakarta Sans',
  'Inter',
  'Playfair Display',
  'Montserrat',
  'Cinzel',
  'Outfit',
  'Space Grotesk',
  'Cabinet Grotesk',
  'Söhne',
];

export const BrandReviewModal: React.FC<BrandReviewModalProps> = ({
  isOpen,
  onClose,
  analysisResult,
  sources = [],
  onSaveSuccess,
}) => {
  const { toast } = useNotification();

  const [activeTab, setActiveTab] = useState<
    'identity' | 'palette' | 'voice' | 'products' | 'socials'
  >('identity');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editable Form State
  const [brandName, setBrandName] = useState(analysisResult.brandName || '');
  const [tagline, setTagline] = useState(analysisResult.tagline || '');
  const [websiteUrl, setWebsiteUrl] = useState(analysisResult.websiteUrl || '');
  const [industry, setIndustry] = useState(analysisResult.industry || '');
  const [subIndustry, setSubIndustry] = useState(analysisResult.subIndustry || '');
  const [niche, setNiche] = useState(analysisResult.industry || 'General');
  const [description, setDescription] = useState(analysisResult.description || '');
  const [companyDescription, setCompanyDescription] = useState(
    analysisResult.companyDescription || analysisResult.description || '',
  );
  const [valueProposition, setValueProposition] = useState(
    analysisResult.valueProposition || '',
  );
  const [country, setCountry] = useState(analysisResult.country || '');
  const [city, setCity] = useState(analysisResult.city || '');

  // Visual Assets
  const [logoUrl, setLogoUrl] = useState<string>(analysisResult.logoUrl || '');
  const [faviconUrl, setFaviconUrl] = useState<string>(analysisResult.faviconUrl || '');
  const [primaryColor, setPrimaryColor] = useState<string>(
    analysisResult.primaryColor || '#7c5cff',
  );
  const [secondaryColor, setSecondaryColor] = useState<string>(
    analysisResult.secondaryColor || '#e0aa4e',
  );
  const [accentColor, setAccentColor] = useState<string>(
    analysisResult.accentColor || '#3ecf8e',
  );
  const [secondaryColors, setSecondaryColors] = useState<string[]>(
    analysisResult.secondaryColors || [],
  );
  const [fontHeading, setFontHeading] = useState<string>(
    analysisResult.fontHeading || 'Plus Jakarta Sans',
  );
  const [fontBody, setFontBody] = useState<string>(
    analysisResult.fontBody || 'Inter',
  );

  // Tone & Voice
  const [tone, setTone] = useState<string>(
    analysisResult.tone || 'Technical & Modern',
  );

  // Products & Services
  const [products, setProducts] = useState(analysisResult.products || []);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');

  const [services, setServices] = useState(analysisResult.services || []);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');

  const [benefits, setBenefits] = useState<string[]>(analysisResult.benefits || []);
  const [newBenefit, setNewBenefit] = useState('');

  const [painPoints, setPainPoints] = useState<string[]>(
    analysisResult.painPoints || [],
  );
  const [newPainPoint, setNewPainPoint] = useState('');

  const [keywords, setKeywords] = useState<string[]>(analysisResult.keywords || []);
  const [newKeyword, setNewKeyword] = useState('');

  // Socials
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(
    analysisResult.socialLinks || {},
  );

  // Default option
  const [isDefault, setIsDefault] = useState(true);

  if (!isOpen) return null;

  const handleSaveBrand = async () => {
    if (!brandName.trim()) {
      setErrorMsg('Brand Name is required.');
      setActiveTab('identity');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        brandName: brandName.trim(),
        tagline: tagline.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        industry: industry.trim() || undefined,
        subIndustry: subIndustry.trim() || undefined,
        niche: niche.trim() || undefined,
        description: description.trim() || undefined,
        country: country.trim() || undefined,
        city: city.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        faviconUrl: faviconUrl.trim() || undefined,
        primaryColor,
        secondaryColor,
        accentColor,
        secondaryColors,
        fontHeading,
        fontBody,
        tone,
        isDefault,
        socialLinks,
        brandVoice: {
          tone: [tone],
          formality: analysisResult.brandVoice?.formality || 'medium',
          humor: analysisResult.brandVoice?.humor || 'low',
          technicality: analysisResult.brandVoice?.technicality || 'medium',
          emotion: analysisResult.brandVoice?.emotion || 'medium',
        },
        insights: {
          companyDescription,
          valueProposition,
          products,
          services,
          targetAudience: analysisResult.targetAudience || [],
          locations: analysisResult.locations || [],
          benefits,
          painPoints,
          keywords,
          categories: analysisResult.categories || [],
          socialLinks,
          brandVoice: {
            tone: [tone],
            formality: analysisResult.brandVoice?.formality || 'medium',
          },
          confidence: analysisResult.confidence || {},
          sourceUrls: sources.map((s) => s.url),
        },
        sources: sources.map((s) => ({
          url: s.url,
          pageType: s.pageType,
          title: s.title,
          description: s.description,
          content: s.content,
          contentHash: s.contentHash,
          status: 'crawled',
        })),
      };

      const saved = await createBrandApi(payload as any);
      toast.success(
        `Brand DNA for "${saved.brandName}" has been successfully saved to your workspace.`,
        'Brand Profile Saved',
      );
      onSaveSuccess(saved);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save brand profile');
      toast.error(err.message || 'Failed to save brand profile', 'Save Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Review & Customize Brand DNA
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  AI Extracted
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Extracted from <span className="text-purple-400 font-mono">{websiteUrl}</span>. Edit and customize before saving.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/30 px-6 overflow-x-auto scrollbar-none">
          {[
            { id: 'identity', label: 'Identity & Strategy', icon: Building2 },
            { id: 'palette', label: 'Visuals & Colors', icon: Palette },
            { id: 'voice', label: 'Tone & Voice', icon: Type },
            { id: 'products', label: 'Products & Market', icon: Users },
            { id: 'socials', label: 'Socials & Sources', icon: Share2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-purple-500 text-white bg-purple-500/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-purple-400' : 'text-zinc-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Error notification banner if any */}
        {errorMsg && (
          <div className="px-6 py-2 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: IDENTITY & STRATEGY */}
          {activeTab === 'identity' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Brand / Company Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Acme Studio"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Tagline / Slogan
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Empowering creators worldwide"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Software & Technology"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Sub-Industry
                  </label>
                  <input
                    type="text"
                    value={subIndustry}
                    onChange={(e) => setSubIndustry(e.target.value)}
                    placeholder="e.g. AI Content Generation"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="2-3 sentence overview of what the company does..."
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Unique Value Proposition (USP)
                </label>
                <textarea
                  rows={2}
                  value={valueProposition}
                  onChange={(e) => setValueProposition(e.target.value)}
                  placeholder="What makes this brand stand out from competitors..."
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. United States"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    City / Headquarters
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. San Francisco"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VISUALS & COLORS */}
          {activeTab === 'palette' && (
            <div className="space-y-6">
              {/* Logo Selection Section */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Brand Logo & Icon
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Pick from detected logos or enter a direct image URL.
                    </p>
                  </div>
                  {logoUrl && (
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 p-1 flex items-center justify-center overflow-hidden">
                      <img
                        src={logoUrl}
                        alt="Selected Logo"
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          (e.target as any).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Candidate Logos Grid */}
                {analysisResult.availableLogos && analysisResult.availableLogos.length > 0 && (
                  <div className="mb-3.5">
                    <p className="text-[10px] uppercase font-semibold text-zinc-500 mb-2">
                      Detected Logo Candidates:
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {analysisResult.availableLogos.map((cand, idx) => {
                        const isSelected = cand === logoUrl;
                        return (
                          <button
                            key={cand + idx}
                            type="button"
                            onClick={() => setLogoUrl(cand)}
                            className={`p-2 rounded-xl border flex items-center justify-center h-14 w-20 transition-all bg-zinc-900 relative ${
                              isSelected
                                ? 'border-purple-500 ring-2 ring-purple-500/30'
                                : 'border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <img
                              src={cand}
                              alt={`Candidate ${idx}`}
                              className="max-h-full max-w-full object-contain"
                            />
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Primary Logo URL
                    </label>
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://.../logo.png"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs font-mono outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Favicon URL
                    </label>
                    <input
                      type="text"
                      value={faviconUrl}
                      onChange={(e) => setFaviconUrl(e.target.value)}
                      placeholder="https://.../favicon.ico"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs font-mono outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Color Palette */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                  Brand Color Palette
                </h3>
                <p className="text-[11px] text-zinc-400 mb-4">
                  These colors automatically guide your social post generations and graphic layouts.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  {/* Primary Color */}
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      Primary Color
                    </span>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white font-mono text-xs outline-none"
                      />
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      Secondary Color
                    </span>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white font-mono text-xs outline-none"
                      />
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      Accent Color
                    </span>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white font-mono text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary palette chips */}
                {secondaryColors.length > 0 && (
                  <div>
                    <span className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">
                      Detected Palette Candidates (click to set as primary):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {secondaryColors.map((hex, i) => (
                        <button
                          key={hex + i}
                          type="button"
                          onClick={() => setPrimaryColor(hex)}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/80 rounded-lg text-xs font-mono text-zinc-300 transition-all"
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-black/20"
                            style={{ backgroundColor: hex }}
                          />
                          <span>{hex}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Typography */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                  Typography Pairing
                </h3>
                <p className="text-[11px] text-zinc-400 mb-4">
                  Select typography for headlines and body text.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Heading Font
                    </label>
                    <select
                      value={fontHeading}
                      onChange={(e) => setFontHeading(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      {FONTS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Body Font
                    </label>
                    <select
                      value={fontBody}
                      onChange={(e) => setFontBody(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      {FONTS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Live Typography Preview */}
                <div
                  className="p-4 rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-900 to-black"
                  style={{ borderColor: primaryColor + '40' }}
                >
                  <p
                    className="text-lg font-bold mb-1"
                    style={{ fontFamily: fontHeading, color: primaryColor }}
                  >
                    {brandName || 'Your Brand Headline'}
                  </p>
                  <p
                    className="text-xs text-zinc-300"
                    style={{ fontFamily: fontBody }}
                  >
                    {tagline || 'Experience unmatched design excellence tailored for social media.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TONE & VOICE */}
          {activeTab === 'voice' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Brand Communication Tone
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {TONES.map((t) => {
                    const isSelected = tone === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTone(t)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-purple-600/10 border-purple-500 ring-2 ring-purple-500/20'
                            : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-bold ${
                              isSelected ? 'text-purple-400' : 'text-zinc-200'
                            }`}
                          >
                            {t}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brand Voice Dimensions */}
              {analysisResult.brandVoice && (
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                    Brand Voice Characteristics
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
                        Formality
                      </span>
                      <span className="text-zinc-200 font-medium capitalize">
                        {analysisResult.brandVoice.formality || 'Medium'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
                        Humor
                      </span>
                      <span className="text-zinc-200 font-medium capitalize">
                        {analysisResult.brandVoice.humor || 'Subtle'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
                        Technicality
                      </span>
                      <span className="text-zinc-200 font-medium capitalize">
                        {analysisResult.brandVoice.technicality || 'Moderate'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
                        Emotion
                      </span>
                      <span className="text-zinc-200 font-medium capitalize">
                        {analysisResult.brandVoice.emotion || 'Empowering'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PRODUCTS & MARKET */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Products List */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Detected Products ({products.length})
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Add or refine key products for post campaign automation.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  {products.map((prod, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-bold text-white block">{prod.name}</span>
                        {prod.description && (
                          <span className="text-zinc-400 text-[11px] block">
                            {prod.description}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setProducts((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add product inline */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Product name"
                    className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white outline-none"
                  />
                  <input
                    type="text"
                    value={newProductDesc}
                    onChange={(e) => setNewProductDesc(e.target.value)}
                    placeholder="Brief description (optional)"
                    className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newProductName.trim()) return;
                      setProducts((prev) => [
                        ...prev,
                        { name: newProductName.trim(), description: newProductDesc.trim() },
                      ]);
                      setNewProductName('');
                      setNewProductDesc('');
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Keywords & SEO */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                  Content Keywords
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {keywords.map((kw, idx) => (
                    <span
                      key={kw + idx}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 text-xs flex items-center gap-1.5"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => setKeywords((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-zinc-500 hover:text-rose-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
                          setKeywords((prev) => [...prev, newKeyword.trim()]);
                          setNewKeyword('');
                        }
                      }
                    }}
                    placeholder="Type a keyword and press Enter"
                    className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SOCIALS & SOURCES */}
          {activeTab === 'socials' && (
            <div className="space-y-6">
              {/* Social Profiles */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                  Connected Social Profiles
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['instagram', 'linkedin', 'x', 'facebook', 'youtube', 'tiktok'].map((platform) => (
                    <div key={platform}>
                      <label className="block text-[11px] font-semibold text-zinc-400 capitalize mb-1">
                        {platform === 'x' ? 'Twitter / X' : platform}
                      </label>
                      <input
                        type="text"
                        value={socialLinks[platform] || ''}
                        onChange={(e) =>
                          setSocialLinks((prev) => ({ ...prev, [platform]: e.target.value }))
                        }
                        placeholder={`https://${platform}.com/...`}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white font-mono outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Crawled Source Pages */}
              {sources.length > 0 && (
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                    Crawled Pages ({sources.length})
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {sources.map((s, idx) => (
                      <div
                        key={s.url + idx}
                        className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs flex items-center justify-between"
                      >
                        <div className="truncate mr-2">
                          <span className="font-semibold text-zinc-200 block truncate">
                            {s.title || s.url}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono block truncate">
                            {s.url}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-purple-300 border border-purple-500/20 uppercase flex-shrink-0">
                          {s.pageType || 'PAGE'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 text-purple-600 focus:ring-purple-500 bg-zinc-900"
            />
            <span className="text-xs text-zinc-300">Set as my default brand profile</span>
          </label>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveBrand}
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Brand DNA...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Brand Profile</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
