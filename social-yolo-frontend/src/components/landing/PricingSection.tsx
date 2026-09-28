'use client';

import React, { useState } from 'react';
import { Check, Sparkles, Shield, Zap, Star } from 'lucide-react';
import { StarburstIcon } from '../ui/Icons';

export function PricingSection() {
  const [currency, setCurrency] = useState<'BRL' | 'USD'>('BRL');

  const features = [
    "Unlimited AI Social Media Post Generations",
    "Automatic Python Rembg Background Removal",
    "Self-Improving RAG Style Memory (Vector)",
    "Commercial License & Royalty-Free Rights",
    "Ultra HD 4K Uncompressed PNG Downloads",
    "Instagram, TikTok, Facebook & Flyer Presets",
    "Access to All Future Model Updates & Styles",
    "7-Day 100% Money-Back Guarantee",
  ];

  return (
    <section id="pricing" className="py-24 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden border-t border-slate-200 dark:border-slate-800/80 transition-colors duration-200">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative starburst */}
      <div className="absolute top-10 left-12 text-purple-400/30 pointer-events-none">
        <StarburstIcon className="w-10 h-10" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/70 px-3.5 py-1 rounded-full border border-purple-300 dark:border-purple-800/60">
            Special Launch Offer
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-4 font-display">
            Simple, Transparent <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 dark:from-purple-400 dark:via-pink-400 dark:to-amber-300 bg-clip-text text-transparent">Pricing</span>
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            No complicated monthly lock-ins. Pay once, create unlimited viral social creatives.
          </p>

          {/* Currency Toggle */}
          <div className="mt-5 inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setCurrency('BRL')}
              className={`px-3.5 py-1 text-xs font-bold rounded-full transition cursor-pointer ${
                currency === 'BRL' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              R$ (BRL)
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3.5 py-1 text-xs font-bold rounded-full transition cursor-pointer ${
                currency === 'USD' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              $ (USD)
            </button>
          </div>
        </div>

        {/* The Featured Split Pricing Box */}
        <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Dark Gradient Hero Panel */}
          <div className="lg:col-span-5 bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-purple-900/40 dark:border-slate-800">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
                ⭐ Lifetime Deal
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-display leading-tight text-white">
                Social Yolo Pro Studio Pass
              </h3>
              <p className="mt-4 text-slate-300 text-xs sm:text-sm leading-relaxed">
                Complete access to the AI creative studio, rembg microservice, and personal RAG vector style memory.
              </p>
            </div>

            <div className="mt-10 pt-6 border-t border-purple-800/40 dark:border-slate-800 space-y-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Instant studio access immediately upon register</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>7-Day 100% Risk-Free Satisfaction Guarantee</span>
              </div>
            </div>
          </div>

          {/* Right Clean Panel with Price & Checklist */}
          <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between bg-slate-50/70 dark:bg-slate-900/90">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white font-display">
                      {currency === 'BRL' ? 'R$67' : '$29'}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">/ lifetime access</span>
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    ✓ Special early-bird pricing enabled
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/30 w-fit">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-300">4.9 / 5 (850+ reviews)</span>
                </div>
              </div>

              {/* Features List */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    <div className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-800/70 text-purple-700 dark:text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
              <a
                href="/register"
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-base shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>Get Instant Access Now</span>
                <Sparkles className="w-5 h-5 text-amber-300" />
              </a>
              <p className="text-center text-slate-500 dark:text-slate-400 text-[11px] mt-2.5">
                🔒 Encrypted Checkout • Instant Studio Activation • 100% Commercial Rights
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
