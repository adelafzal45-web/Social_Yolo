'use client';

import React from 'react';
import { Sparkles, MessageSquare, Target, Megaphone, Globe } from 'lucide-react';

interface CopyAudienceSectionProps {
  headline: string;
  setHeadline: (s: string) => void;
  bodyCopy: string;
  setBodyCopy: (s: string) => void;
  occasion: string;
  setOccasion: (s: string) => void;
  targetAudience: string;
  setTargetAudience: (s: string) => void;
  keyMessage: string;
  setKeyMessage: (s: string) => void;
  cta: string;
  setCta: (s: string) => void;
  language: string;
  setLanguage: (s: string) => void;
  aiVariations: Array<{ title: string; desc: string }>;
  cutoutUrl: string | null;
}

const OCCASIONS = [
  'Limited Edition Launch',
  'Seasonal Sale (30-50% Off)',
  'Product Spotlight / Restock',
  'Brand Awareness / Story',
  'Customer Review / Testimonial',
  'Event / Holiday Special',
];

const CTAS = ['Shop Now', 'Order Today', 'Learn More', 'Get 20% Off', 'Book Consultation', 'Claim Offer'];

const AUDIENCES = [
  'Young Professionals (22–35)',
  'Luxury & High-Net-Worth Buyers',
  'Fitness & Health Enthusiasts',
  'Parents & Family Shoppers',
  'Tech Innovators & Developers',
  'Eco-Conscious Consumers',
];

export function CopyAudienceSection({
  headline,
  setHeadline,
  bodyCopy,
  setBodyCopy,
  occasion,
  setOccasion,
  targetAudience,
  setTargetAudience,
  keyMessage,
  setKeyMessage,
  cta,
  setCta,
  language,
  setLanguage,
  aiVariations,
  cutoutUrl,
}: CopyAudienceSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column Controls */}
      <div className="lg:col-span-6 space-y-5">
        {/* Campaign Purpose & Occasion */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2 flex items-center gap-1.5">
            <Megaphone className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            01 Campaign Goal / Occasion
          </label>
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((occ) => (
              <button
                key={occ}
                type="button"
                onClick={() => setOccasion(occ)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                  occasion === occ
                    ? 'bg-brand-100 dark:bg-brand-950/80 border-brand-500 text-brand-800 dark:text-brand-200 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {occ}
              </button>
            ))}
          </div>
        </div>

        {/* Headline */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              02 Creative Headline
            </label>
            <span className="text-[11px] text-slate-500 font-mono">{headline.length}/60</span>
          </div>
          <input
            type="text"
            maxLength={60}
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Small Batch. Big Morning."
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition shadow-sm"
          />
        </div>

        {/* Body Copy & Key Message */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Body Copy
              </label>
              <span className="text-[11px] text-slate-500 font-mono">{bodyCopy.length}/200</span>
            </div>
            <textarea
              rows={2}
              maxLength={200}
              value={bodyCopy}
              onChange={(e) => setBodyCopy(e.target.value)}
              placeholder="Short supporting product copy..."
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition resize-none shadow-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Offer / Key Message
            </label>
            <input
              type="text"
              value={keyMessage}
              onChange={(e) => setKeyMessage(e.target.value)}
              placeholder="e.g. 30% Off This Weekend"
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition shadow-sm"
            />
          </div>
        </div>

        {/* Target Audience */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            03 Target Audience Demographic
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {AUDIENCES.map((aud) => (
              <button
                key={aud}
                type="button"
                onClick={() => setTargetAudience(aud)}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition border ${
                  targetAudience === aud
                    ? 'bg-brand-100 dark:bg-brand-950/80 border-brand-500 text-brand-800 dark:text-brand-200'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400'
                }`}
              >
                {aud}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="Or type custom audience (e.g. Coffee lovers looking for organic single origin)..."
            className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 shadow-sm"
          />
        </div>

        {/* CTA & Language */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Call to Action (CTA)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {CTAS.slice(0, 4).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCta(c)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                    cta === c
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="e.g. Shop Now"
              className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Arabic">Arabic</option>
              <option value="Urdu">Urdu</option>
              <option value="Italian">Italian</option>
            </select>
          </div>
        </div>

        {/* AI Suggested Headlines */}
        {aiVariations.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              AI Copy Inspirations
            </span>
            {aiVariations.map((v, i) => (
              <div
                key={i}
                onClick={() => {
                  setHeadline(v.title);
                  if (v.desc) setBodyCopy(v.desc);
                }}
                className={`p-3 rounded-2xl border cursor-pointer transition ${
                  headline === v.title
                    ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    checked={headline === v.title}
                    onChange={() => {}}
                    className="mt-1 accent-brand-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{v.title}</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{v.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Live Copy Preview Card */}
      <div className="lg:col-span-6 space-y-4">
        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-lg dark:shadow-2xl relative min-h-[440px] flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Live Preview — Synchronized Across Platforms
          </span>

          <div className="my-auto text-center space-y-4 py-8">
            {cutoutUrl ? (
              <img
                src={cutoutUrl}
                alt="Product"
                className="w-28 h-28 object-contain mx-auto drop-shadow-xl"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-amber-400/20 text-amber-500 dark:text-amber-400 flex items-center justify-center text-3xl mx-auto shadow-md">
                ☕
              </div>
            )}

            <div className="space-y-1.5 max-w-sm mx-auto">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {headline || 'Small batch. Big morning.'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {bodyCopy || 'Roasted in 12kg batches, every Tuesday.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-400/10 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-400/30 uppercase tracking-wider">
                {occasion || 'Special Release'}
              </span>
              {keyMessage && (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300 border border-brand-200 dark:border-brand-800 uppercase tracking-wider">
                  {keyMessage}
                </span>
              )}
            </div>

            {cta && (
              <div className="pt-2">
                <span className="inline-block px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md">
                  {cta} →
                </span>
              </div>
            )}
          </div>

          <p className="text-[10px] text-slate-500 dark:text-slate-600 text-center">
            Copy scale, line breaks &amp; CTA placement are automatically optimized per platform.
          </p>
        </div>
      </div>
    </div>
  );
}
