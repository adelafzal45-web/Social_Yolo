'use client';

import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { StarburstIcon } from '../ui/Icons';

export function CtaBanner() {
  return (
    <section className="py-20 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-8 sm:p-14 text-center text-white shadow-2xl border border-purple-800/40">
          {/* Ambient lighting inside banner */}
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Decorative Sparkle */}
          <div className="absolute top-8 right-12 text-purple-400/40 pointer-events-none animate-pulse">
            <StarburstIcon className="w-10 h-10" />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4 border border-amber-500/30">
              ⚡ Start Creating Today
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display leading-tight tracking-tight text-white">
              Ready to Transform Your <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                Brand&apos;s Visuals?
              </span>
            </h2>

            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
              Join 5,000+ business owners, agencies, and creators. Create studio-quality posts effortlessly with advanced AI.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/dashboard/studio"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-base transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-105 flex items-center justify-center gap-2"
              >
                <span>Launch Studio Now</span>
                <Sparkles className="w-5 h-5 text-amber-300" />
              </a>
              <a
                href="#templates"
                className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white/10 dark:bg-slate-900/80 hover:bg-white/20 dark:hover:bg-slate-800 border border-white/20 dark:border-slate-700 text-white font-bold text-base transition-all flex items-center justify-center gap-2"
              >
                <span>Browse Showcase</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
