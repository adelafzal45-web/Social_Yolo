'use client';

import React, { useState } from 'react';
import { Palette, Building2, Type, Paintbrush, Wand2, Sparkles, Check, RefreshCw, ArrowLeftRight } from 'lucide-react';
import { BrandProfile } from '@/lib/types';

export interface Step3BrandDesignData {
  brandProfileId?: string;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  style: string;
}

interface WizardStep3BrandDesignProps {
  data: Step3BrandDesignData;
  onChange: (fields: Partial<Step3BrandDesignData>) => void;
  brands: BrandProfile[];
}

const PRESET_PALETTES = [
  { name: 'Royal Gold', primary: '#7c5cff', secondary: '#e0aa4e', accent: '#ffffff', tag: 'Luxury' },
  { name: 'Emerald Luxe', primary: '#0f3d2e', secondary: '#c5a059', accent: '#f5f5f0', tag: 'Premium' },
  { name: 'Warm Sunset', primary: '#f97316', secondary: '#ec4899', accent: '#fef08a', tag: 'High CTR' },
  { name: 'Midnight Noir', primary: '#09090b', secondary: '#3f3f46', accent: '#a1a1aa', tag: 'Editorial' },
  { name: 'Cyber Neon', primary: '#06b6d4', secondary: '#a855f7', accent: '#ec4899', tag: 'Tech Glow' },
  { name: 'Clean Nordic', primary: '#334155', secondary: '#94a3b8', accent: '#f1f5f9', tag: 'Minimal' },
  { name: 'Crimson Velvet', primary: '#881337', secondary: '#f59e0b', accent: '#fffbeb', tag: 'Bold' },
  { name: 'Ocean Electric', primary: '#0369a1', secondary: '#38bdf8', accent: '#ffffff', tag: 'Vibrant' },
];

const STYLES = [
  {
    id: 'luxury',
    label: 'Luxury & Premium',
    desc: 'Editorial gold accents, cinematic lighting & depth',
    badge: 'High Engagement',
  },
  {
    id: 'minimalist',
    label: 'Clean Minimalist',
    desc: 'Spacious Scandinavian layout, restrained breathing room',
    badge: 'Modern',
  },
  {
    id: 'bold',
    label: 'Bold & High-Impact',
    desc: 'Punchy saturated accents, high contrast & energy',
    badge: 'High CTR',
  },
  {
    id: 'lifestyle',
    label: 'Authentic Lifestyle',
    desc: 'Warm sunlit atmosphere, natural human context',
    badge: 'Organic',
  },
  {
    id: 'tech',
    label: 'Futuristic Tech',
    desc: 'Geometric precision, subtle neon & cyber glow',
    badge: 'SaaS / Tech',
  },
  {
    id: 'playful',
    label: 'Playful & Vibrant',
    desc: 'Friendly rounded geometry, cheerful bright tones',
    badge: 'Fun',
  },
];

const FONT_OPTIONS = [
  { heading: 'Playfair Display', body: 'Inter', label: 'Classic Luxury (Serif + Clean Sans)' },
  { heading: 'Montserrat', body: 'Inter', label: 'Modern Geometric (Bold Sans)' },
  { heading: 'Cinzel', body: 'Lato', label: 'High-End Editorial (Cinematic Serif)' },
  { heading: 'Plus Jakarta Sans', body: 'Plus Jakarta Sans', label: 'Tech & Startup (Clean Neo-Grotesque)' },
  { heading: 'Cabinet Grotesk', body: 'Outfit', label: 'Trendy Pop (Punchy Display)' },
];

export function WizardStep3BrandDesign({ data, onChange, brands }: WizardStep3BrandDesignProps) {
  const isAutoMode = !data.primaryColor && !data.secondaryColor && !data.accentColor;

  const matchingPreset = PRESET_PALETTES.find(
    (p) =>
      p.primary.toLowerCase() === data.primaryColor?.toLowerCase() &&
      p.secondary.toLowerCase() === data.secondaryColor?.toLowerCase() &&
      p.accent.toLowerCase() === data.accentColor?.toLowerCase()
  );

  const [paletteMode, setPaletteMode] = useState<'auto' | 'presets' | 'custom'>(() => {
    if (isAutoMode) return 'auto';
    if (matchingPreset) return 'presets';
    return 'custom';
  });

  const handleSelectMode = (mode: 'auto' | 'presets' | 'custom') => {
    setPaletteMode(mode);
    if (mode === 'auto') {
      onChange({ primaryColor: '', secondaryColor: '', accentColor: '' });
    } else if (mode === 'presets') {
      if (isAutoMode) {
        onChange({
          primaryColor: PRESET_PALETTES[0].primary,
          secondaryColor: PRESET_PALETTES[0].secondary,
          accentColor: PRESET_PALETTES[0].accent,
        });
      }
    } else if (mode === 'custom') {
      if (isAutoMode) {
        onChange({
          primaryColor: '#7c5cff',
          secondaryColor: '#e0aa4e',
          accentColor: '#ffffff',
        });
      }
    }
  };

  const handleHexInput = (key: 'primaryColor' | 'secondaryColor' | 'accentColor', val: string) => {
    let clean = val.trim();
    if (!clean.startsWith('#') && clean.length > 0) {
      clean = '#' + clean;
    }
    onChange({ [key]: clean });
  };

  const handleRandomize = () => {
    const randomPool = [
      { primary: '#4f46e5', secondary: '#f59e0b', accent: '#ec4899' },
      { primary: '#059669', secondary: '#34d399', accent: '#fef08a' },
      { primary: '#dc2626', secondary: '#fb923c', accent: '#fef9c3' },
      { primary: '#0284c7', secondary: '#38bdf8', accent: '#ffffff' },
      { primary: '#7c3aed', secondary: '#c084fc', accent: '#a7f3d0' },
      { primary: '#0f172a', secondary: '#38bdf8', accent: '#f43f5e' },
      { primary: '#b45309', secondary: '#fbbf24', accent: '#ffffff' },
    ];
    const pick = randomPool[Math.floor(Math.random() * randomPool.length)];
    onChange({
      primaryColor: pick.primary,
      secondaryColor: pick.secondary,
      accentColor: pick.accent,
    });
  };

  const handleSwap = () => {
    onChange({
      primaryColor: data.secondaryColor || '#e0aa4e',
      secondaryColor: data.primaryColor || '#7c5cff',
    });
  };

  const handleSelectBrand = (brandId: string) => {
    if (!brandId) {
      onChange({ brandProfileId: '' });
      return;
    }
    const found = brands.find((b) => b.id === brandId);
    if (found) {
      onChange({
        brandProfileId: found.id,
        brandName: found.brandName || data.brandName,
        primaryColor: found.primaryColor || data.primaryColor,
        secondaryColor: found.secondaryColor || data.secondaryColor,
        accentColor: found.accentColor || data.accentColor,
        fontHeading: found.fontHeading || data.fontHeading,
        fontBody: found.fontBody || data.fontBody,
      });
      setPaletteMode('custom');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Step Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
          <Palette className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>BRAND &amp; DESIGN</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Establish your visual identity
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Specify your brand colors, typography, and aesthetic direction. If you skip this step, AI will automatically synthesize a balanced, high-converting design.
        </p>
      </div>

      {/* 1. Brand Profile & Brand Name */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Brand Profile or Business Name</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              Optional
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {brands.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Load Saved Brand Profile</span>
              <select
                value={data.brandProfileId || ''}
                onChange={(e) => handleSelectBrand(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                <option value="">Custom / No saved profile</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.brandName} {b.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Brand / Company Name</span>
            <input
              type="text"
              value={data.brandName}
              onChange={(e) => onChange({ brandName: e.target.value })}
              placeholder="e.g. Lumina Roasters, Aura Beauty, Vertex Cloud"
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>
        </div>
      </div>

      {/* 2. Visual / Design Direction */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Paintbrush className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Visual / Design Direction</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              Optional
            </span>
          </label>
          <span className="text-xs text-slate-500">
            Selected: <span className="font-semibold text-slate-900 dark:text-white capitalize">{data.style}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {STYLES.map((style) => {
            const isSelected = data.style.toLowerCase() === style.id.toLowerCase();
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => onChange({ style: style.id })}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/50 text-slate-900 dark:text-white shadow-md ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold">{style.label}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {style.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                  {style.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Brand Colors & Presets */}
      <div className="space-y-4 p-5 rounded-3xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 transition">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Brand Color Harmony</span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                {isAutoMode ? 'AI Auto-Detect' : matchingPreset ? `Preset: ${matchingPreset.name}` : 'Custom Palette'}
              </span>
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Choose whether to use AI-detected colors, a designer preset, or your own custom brand palette.
            </p>
          </div>

          {/* Palette Mode Selector Tabs */}
          <div className="inline-flex p-1 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto shadow-sm">
            <button
              type="button"
              onClick={() => handleSelectMode('auto')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                paletteMode === 'auto'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>AI Auto</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectMode('presets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                paletteMode === 'presets'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Presets</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectMode('custom')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                paletteMode === 'custom'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Custom Palette</span>
            </button>
          </div>
        </div>

        {/* Tab 1: AI Auto-Harmony */}
        {paletteMode === 'auto' && (
          <div className="p-4 rounded-2xl border border-dashed border-brand-300 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-950/30 flex items-center justify-between gap-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Intelligent Automatic Harmony
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  AI Vision will automatically analyze your subject photo and synthesize a high-contrast commercial palette.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleSelectMode('custom')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-white hover:border-brand-500/50 shrink-0 shadow-sm"
            >
              Customize Colors
            </button>
          </div>
        )}

        {/* Tab 2: Designer Presets */}
        {paletteMode === 'presets' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PRESET_PALETTES.map((preset) => {
                const isSelected =
                  data.primaryColor?.toLowerCase() === preset.primary.toLowerCase() &&
                  data.secondaryColor?.toLowerCase() === preset.secondary.toLowerCase() &&
                  data.accentColor?.toLowerCase() === preset.accent.toLowerCase();

                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() =>
                      onChange({
                        primaryColor: preset.primary,
                        secondaryColor: preset.secondary,
                        accentColor: preset.accent,
                      })
                    }
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-2.5 relative ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/60 ring-2 ring-brand-500/30 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-lg border border-black/10 dark:border-white/10 shadow-inner" style={{ backgroundColor: preset.primary }} title={`Primary: ${preset.primary}`} />
                      <div className="w-6 h-6 rounded-lg border border-black/10 dark:border-white/10 shadow-inner" style={{ backgroundColor: preset.secondary }} title={`Secondary: ${preset.secondary}`} />
                      <div className="w-6 h-6 rounded-lg border border-black/10 dark:border-white/10 shadow-inner" style={{ backgroundColor: preset.accent }} title={`Accent: ${preset.accent}`} />
                    </div>

                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      {preset.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Custom Palette Inputs */}
        {paletteMode === 'custom' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Primary Color', desc: 'Backdrops & Dominant Tone', val: data.primaryColor || '#7c5cff', key: 'primaryColor' as const },
                { label: 'Secondary Color', desc: 'Badges & Complementary Shapes', val: data.secondaryColor || '#e0aa4e', key: 'secondaryColor' as const },
                { label: 'Accent Color', desc: 'CTAs, Stars & Highlight Elements', val: data.accentColor || '#ffffff', key: 'accentColor' as const },
              ].map((col) => (
                <div
                  key={col.key}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        {col.label}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {col.desc}
                      </p>
                    </div>
                    {/* Visual Color Swatch Input */}
                    <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner shrink-0 cursor-pointer">
                      <input
                        type="color"
                        value={col.val}
                        onChange={(e) => onChange({ [col.key]: e.target.value })}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Click to open color picker"
                      />
                      <div className="w-full h-full" style={{ backgroundColor: col.val }} />
                    </div>
                  </div>

                  {/* Direct HEX Code Input Field */}
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 focus-within:border-brand-500 transition">
                    <span className="text-xs font-mono text-slate-400 select-none">#</span>
                    <input
                      type="text"
                      maxLength={7}
                      value={col.val.replace('#', '').toUpperCase()}
                      onChange={(e) => handleHexInput(col.key, e.target.value)}
                      placeholder="7C5CFF"
                      className="w-full bg-transparent font-mono text-xs font-bold text-slate-900 dark:text-white uppercase focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Palette Utility Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRandomize}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/40 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-sm transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-brand-500" />
                  <span>Generate Harmony</span>
                </button>
                <button
                  type="button"
                  onClick={handleSwap}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/40 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-sm transition"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-amber-500" />
                  <span>Swap Primary &amp; Secondary</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleSelectMode('auto')}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white underline font-medium"
              >
                Clear to AI Auto
              </button>
            </div>
          </div>
        )}

        {/* Live Palette Harmony Strip */}
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Palette:
            </span>
            <div className="flex items-center -space-x-1">
              <div
                className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-950 shadow-sm"
                style={{ backgroundColor: data.primaryColor || '#7c5cff' }}
                title={`Primary: ${data.primaryColor || 'Auto'}`}
              />
              <div
                className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-950 shadow-sm"
                style={{ backgroundColor: data.secondaryColor || '#e0aa4e' }}
                title={`Secondary: ${data.secondaryColor || 'Auto'}`}
              />
              <div
                className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-950 shadow-sm"
                style={{ backgroundColor: data.accentColor || '#ffffff' }}
                title={`Accent: ${data.accentColor || 'Auto'}`}
              />
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
              {isAutoMode
                ? 'AI Auto Harmony'
                : `${data.primaryColor} • ${data.secondaryColor} • ${data.accentColor}`}
            </span>
          </div>

          <div
            className="px-3 py-1 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
            style={{
              backgroundColor: data.primaryColor || '#7c5cff',
              color: data.accentColor || '#ffffff',
            }}
          >
            <span style={{ color: data.secondaryColor || '#fcd34d' }}>★</span>
            <span>Sample Button</span>
          </div>
        </div>
      </div>

      {/* 4. Font Preference */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>Typography Style Preference</span>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
            Optional
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {FONT_OPTIONS.map((f) => {
            const isSelected = data.fontHeading === f.heading;
            return (
              <button
                key={f.heading}
                type="button"
                onClick={() => onChange({ fontHeading: f.heading, fontBody: f.body })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/50 text-slate-900 dark:text-white shadow-sm ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900'
                }`}
              >
                <p className="text-xs font-bold">{f.label}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                  {f.heading} / {f.body}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
