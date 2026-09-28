'use client';

import React from 'react';
import { Award, Sparkles, Check } from 'lucide-react';
import { StarburstIcon } from '../ui/Icons';

export function CreatedBySection() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden border-t border-slate-200 dark:border-slate-800/80 transition-colors duration-200">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Creator Image with Glowing Starburst Behind */}
          <div className="lg:col-span-5 relative flex justify-center">
            {/* Glowing starburst behind */}
            <div className="absolute -top-10 -left-6 text-purple-500/30 pointer-events-none animate-pulse-slow">
              <StarburstIcon className="w-24 h-24" />
            </div>

            <div className="relative z-10 w-full max-w-[380px] rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 aspect-[4/5]">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80"
                alt="Creative Director"
                className="w-full h-full object-cover object-top"
              />
              
              {/* Overlay Badge */}
              <div className="absolute bottom-4 inset-x-4 p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-lg shadow-purple-500/20">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Creative Agency DNA</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Curated by top flyer artists</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right text */}
          <div className="lg:col-span-7">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/70 px-3.5 py-1 rounded-full border border-purple-300 dark:border-purple-800/60">
              Built for Impact
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-4 font-display leading-tight">
              Created for <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 dark:from-purple-400 dark:via-pink-400 dark:to-amber-300 bg-clip-text text-transparent">Creators, Promoters</span> &amp; Modern Brands
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 text-base leading-relaxed">
              Most AI image generators create abstract art that can&apos;t be used for business marketing.
              Social Yolo was built differently: our intelligent synthesizer injects agency typography rules,
              contrast hierarchies, and commercial layout structures into every render without requiring you to write prompts.
            </p>

            <div className="mt-6 space-y-3">
              {[
                "Preserves exact subject photo geometry while cleanly isolating your product",
                "Applies proven marketing visual hierarchies and high-contrast color palettes",
                "Adapts to your brand preference with real-time vector RAG style memory",
                "Includes commercial-safe fonts, badges, and promotional layouts",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <a
                href="/dashboard/studio"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition duration-200"
              >
                <span>Launch Creative Studio</span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
