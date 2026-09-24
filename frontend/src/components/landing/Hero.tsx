'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ArrowRight, Star, ShieldCheck, Zap, Layers } from 'lucide-react';
import { StarburstIcon, FlowerStarIcon } from '../ui/Icons';

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Background ambient gradient glow blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none -z-10">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-brand-600/10 dark:bg-brand-600/15 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-[450px] h-[450px] bg-indigo-600/10 dark:bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      {/* Decorative Starbursts */}
      <div className="absolute top-16 right-[12%] pointer-events-none text-brand-500/40 dark:text-brand-400/40 animate-pulse-slow">
        <StarburstIcon className="w-10 h-10" />
      </div>
      <div className="absolute bottom-20 left-[6%] pointer-events-none text-amber-500/30 dark:text-amber-400/30">
        <FlowerStarIcon className="w-14 h-14" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Copy & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-800/80 text-brand-700 dark:text-brand-300 text-xs font-bold tracking-wide uppercase shadow-sm mb-6">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>⚡ Automated Creation — Advanced Vision AI</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12] font-display">
              Promote <br />
              your <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 via-indigo-600 to-amber-500 dark:from-brand-400 dark:via-indigo-300 dark:to-amber-400">brand</span> <br />
              professionally
            </h1>

            {/* Description Paragraph */}
            <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl font-normal leading-relaxed">
              Create stunning, high-converting social media posts and promotional flyers in seconds.
              Simply provide your product or photo, choose your platform &amp; visual style, and AI renders studio-grade commercial art.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <Link
                href="/dashboard/studio"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-white font-bold text-base shadow-lg shadow-brand-500/25 transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-3"
              >
                <span>Launch AI Studio</span>
                <Sparkles className="w-5 h-5 text-amber-200" />
              </Link>

              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-base shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Explore Dashboard</span>
                <ArrowRight className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              </Link>
            </div>

            {/* Social Proof & Stars */}
            <div className="mt-10 flex items-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-800/80 w-full max-w-lg">
              {/* Overlapping Avatar Stack */}
              <div className="flex -space-x-2.5 overflow-hidden">
                <img
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover shadow-sm"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  alt="Creator 1"
                />
                <img
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover shadow-sm"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                  alt="Creator 2"
                />
                <img
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover shadow-sm"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
                  alt="Creator 3"
                />
                <img
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover shadow-sm"
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
                  alt="Creator 4"
                />
              </div>

              <div>
                <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                  <span className="text-xs font-bold text-slate-900 dark:text-white ml-1">4.9/5</span>
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Trusted by 5,000+ creators &amp; brands
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Laptop & Floating Product Mockup */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            {/* Glow backdrop behind mockups */}
            <div className="absolute w-[320px] sm:w-[420px] h-[320px] sm:h-[420px] bg-gradient-to-tr from-brand-500/20 via-indigo-500/15 to-amber-400/15 rounded-full blur-3xl -z-10" />

            {/* Main Mockup Composition */}
            <div className="relative w-full max-w-[500px]">
              
              {/* Laptop Display Shell */}
              <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-3.5 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                {/* Screen content */}
                <div className="relative aspect-[16/10] bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <img
                    src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80"
                    alt="Social Yolo Flyer Mockup"
                    className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700"
                  />
                  {/* Overlay Gradient & UI Badge */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-4 flex flex-col justify-end">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-600/90 backdrop-blur-md text-white text-[11px] font-bold w-fit mb-1 border border-brand-400/30">
                      <Zap className="w-3 h-3 text-amber-300" />
                      AI Vision Art Direction
                    </div>
                    <p className="text-white font-extrabold text-sm sm:text-base">
                      Summer Solstice Neon Campaign
                    </p>
                    <p className="text-slate-300 text-xs">Instant Staging • Luxury Glow</p>
                  </div>
                </div>

                {/* Laptop Base Stand */}
                <div className="h-3 sm:h-4 bg-slate-100 dark:bg-slate-800/80 rounded-b-xl mt-1.5 flex justify-center items-center">
                  <div className="w-16 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                </div>
              </div>

              {/* Floating Mobile Card 1 (Left Badge) */}
              <div className="absolute -bottom-6 -left-6 sm:-left-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-3.5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-bold shadow-md">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Auto Cutout</div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Ready in ~2s (ISNet)</div>
                </div>
              </div>

              {/* Floating Mobile Card 2 (Top Right Badge) */}
              <div className="absolute -top-6 -right-4 sm:-right-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-3.5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Brand DNA</div>
                  <div className="text-[11px] text-brand-600 dark:text-brand-300 font-semibold">1-Click Consistency</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
