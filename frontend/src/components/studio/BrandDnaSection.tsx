'use client';

import React from 'react';
import { BrandProfile } from '@/lib/types';
import { Palette, Type } from 'lucide-react';

interface BrandDnaSectionProps {
  brands: BrandProfile[];
  selectedBrandId: string;
  setSelectedBrandId: (id: string) => void;
  brandColors: string[];
  setBrandColors: (colors: string[]) => void;
  brandTone: string;
  setBrandTone: (tone: string) => void;
  fontHeading: string;
  setFontHeading: (f: string) => void;
  fontBody: string;
  setFontBody: (f: string) => void;
  layoutPreference: string;
  setLayoutPreference: (l: string) => void;
}

const TONES = ['Luxury & Elegant', 'Bold & Punchy', 'Minimalist & Clean', 'Warm & Friendly', 'Tech & Modern', 'Urgent & Promotional'];
const FONTS = [
  { name: 'Playfair Display', type: 'Serif / Luxury' },
  { name: 'Inter / Modern Sans', type: 'Sans-serif / Clean' },
  { name: 'Cabinet Grotesk', type: 'Display / Bold' },
  { name: 'Cinzel', type: 'Editorial / High-end' },
  { name: 'Plus Jakarta Sans', type: 'Tech / Tech-forward' },
];

const LAYOUTS = [
  { id: 'centered', label: 'Centered Hero', desc: 'Subject in middle with headline above/below' },
  { id: 'split', label: 'Split Clean', desc: 'Product on one side, bold copy on other' },
  { id: 'minimalist', label: 'Spacious Negative', desc: 'Lots of breathing space with small refined text' },
  { id: 'dynamic', label: 'Dynamic Diagonal', desc: 'Energetic angle with floating graphic elements' },
];

export function BrandDnaSection({
  brands,
  selectedBrandId,
  setSelectedBrandId,
  brandColors,
  setBrandColors,
  brandTone,
  setBrandTone,
  fontHeading,
  setFontHeading,
  fontBody,
  setFontBody,
  layoutPreference,
  setLayoutPreference,
}: BrandDnaSectionProps) {
  const selectedBrand = brands.find((b) => b.id === selectedBrandId);

  const handleColorChange = (index: number, newColor: string) => {
    const updated = [...brandColors];
    updated[index] = newColor;
    setBrandColors(updated);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-6 space-y-6">
        {/* Brand Profile Selector */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
            01 Select Brand Identity
          </span>
          {brands.length > 0 ? (
            <select
              value={selectedBrandId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedBrandId(id);
                const found = brands.find((b) => b.id === id);
                if (found) {
                  const cols = [found.primaryColor, found.secondaryColor, found.accentColor].filter(Boolean) as string[];
                  if (cols.length) setBrandColors(cols);
                  if (found.tone) setBrandTone(found.tone);
                  if (found.fontHeading) setFontHeading(found.fontHeading);
                  if (found.fontBody) setFontBody(found.fontBody);
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 shadow-sm"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.brandName} {b.niche ? `(${b.niche})` : ''}
                </option>
              ))}
            </select>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              No saved brand profiles. You can enter colors and fonts below.
            </div>
          )}
        </div>

        {/* Brand Palette */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            02 Color Palette Harmony
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['Primary', 'Secondary', 'Accent'].map((label, idx) => (
              <div key={idx} className="space-y-1.5">
                <span className="text-[10px] text-slate-500 font-medium">{label} Color</span>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <input
                    type="color"
                    value={brandColors[idx] || (idx === 0 ? '#7c5cff' : idx === 1 ? '#e0aa4e' : '#ffffff')}
                    onChange={(e) => handleColorChange(idx, e.target.value)}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                  />
                  <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 uppercase">
                    {brandColors[idx] || (idx === 0 ? '#7C5CFF' : idx === 1 ? '#E0AA4E' : '#FFFFFF')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tone Selection */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
            03 Brand Voice &amp; Tone
          </span>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setBrandTone(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                  brandTone === t
                    ? 'bg-brand-100 dark:bg-brand-950/80 border-brand-500 text-brand-800 dark:text-brand-200 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Typography */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            04 Typography Styling
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FONTS.map((font) => (
              <div
                key={font.name}
                onClick={() => setFontHeading(font.name)}
                className={`p-2.5 rounded-xl border cursor-pointer transition ${
                  fontHeading === font.name
                    ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <p className="text-xs font-bold text-slate-900 dark:text-white">{font.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{font.type}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column Layout & Composition */}
      <div className="lg:col-span-6 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
            05 Composition &amp; Layout
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LAYOUTS.map((layout) => (
              <div
                key={layout.id}
                onClick={() => setLayoutPreference(layout.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition ${
                  layoutPreference === layout.id
                    ? 'bg-brand-50/50 dark:bg-slate-900 border-brand-500 ring-2 ring-brand-500/20 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{layout.label}</h4>
                  {layoutPreference === layout.id && <span className="text-brand-600 dark:text-brand-400 font-bold text-xs">✓</span>}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">{layout.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Brand Preview Card */}
        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Brand DNA Summary
          </span>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-lg shadow-md"
              style={{ backgroundColor: brandColors[0] || '#7c5cff' }}
            >
              ◈
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedBrand?.brandName || 'Custom Brand Profile'}
              </h4>
              <p className="text-xs text-slate-500">
                {fontHeading} · {brandTone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500">Palette:</span>
            {brandColors.map((col, i) => (
              <span
                key={i}
                className="w-5 h-5 rounded-full border border-white/20 shadow-sm inline-block"
                style={{ backgroundColor: col }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
