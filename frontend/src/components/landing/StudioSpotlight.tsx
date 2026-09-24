'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Zap,
  Camera,
  Layers,
  Palette,
  ArrowRight,
  CheckCircle2,
  Sliders,
  Scissors,
  Star,
  Eye,
} from 'lucide-react';

export function StudioSpotlight() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: '01',
      title: 'AI Vision Auto-Scan',
      desc: 'Drop any product photo or subject. AI Vision instantly inspects materials, packaging, detects brand color palette, and suggests catchy campaign headlines.',
      icon: Camera,
      pill: 'Multimodal AI',
    },
    {
      num: '02',
      title: 'Multi-Channel Native Ratios',
      desc: 'Target Instagram Feed (1:1), Stories & TikTok (9:16), LinkedIn (4:5), or Twitter/X (16:9). Dimensions and typography are auto-scaled for maximum feed retention.',
      icon: Sliders,
      pill: '6 Channels',
    },
    {
      num: '03',
      title: 'Commercial Visual Styles',
      desc: 'Select from Luxury Gold & Midnight, Scandinavian Minimalist, Electric Bold, or Organic Lifestyle. No prompt engineering needed.',
      icon: Sparkles,
      pill: 'Curated Styles',
    },
    {
      num: '04',
      title: 'Brand DNA Injection',
      desc: 'Centralize your official brand colors and brand voice tone. Every campaign automatically adheres to your brand guidelines.',
      icon: Palette,
      pill: 'Brand Memory',
    },
  ];

  return (
    <section id="features" className="py-20 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden border-t border-slate-200 dark:border-slate-800/80 transition-colors duration-200">
      {/* Glow ambient background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-brand-600/10 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-100 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-800/80 text-brand-700 dark:text-brand-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>How Social Yolo AI Works</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
            The Intuitive <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-amber-500 dark:from-brand-400 dark:to-amber-400">Creative Workflow</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Eliminate complex prompt writing. Select your parameters, and our AI art director generates photorealistic, campaign-ready social media posts in seconds.
          </p>
        </div>

        {/* 2-Column Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Interactive Step Cards */}
          <div className="lg:col-span-6 space-y-4">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-50/50 dark:bg-slate-900 border-brand-500 shadow-xl shadow-brand-500/10 ring-1 ring-brand-500/30'
                      : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isActive
                            ? 'bg-brand-600 text-white shadow-md'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-brand-600 dark:text-brand-400 block">
                          STEP {step.num}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{step.title}</h3>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-white/10 shrink-0">
                      {step.pill}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed pl-13">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right Column: Live Interactive Mockup Card */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl overflow-hidden p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">AI Creative Stage</span>
                </div>
                <span className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold">Instant Staging Active</span>
              </div>

              {/* Mockup Preview Area */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner">
                <img
                  src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80"
                  alt="Sneaker Commercial Mockup"
                  className="w-full h-full object-cover"
                />

                {/* Simulated Floating Vision Scanner Overlay */}
                <div className="absolute top-4 left-4 p-3 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs space-y-1.5 shadow-lg max-w-[220px]">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px] uppercase">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>AI Vision Detected</span>
                  </div>
                  <p className="font-bold text-white text-xs truncate">Nike Crimson Edition</p>
                  <div className="flex items-center gap-1 pt-1">
                    <span className="w-3 h-3 rounded-full bg-rose-500 border border-white/30" />
                    <span className="w-3 h-3 rounded-full bg-amber-400 border border-white/30" />
                    <span className="w-3 h-3 rounded-full bg-slate-950 border border-white/30" />
                    <span className="text-[9px] text-slate-400 font-mono ml-1">Palette Extracted</span>
                  </div>
                </div>

                {/* Bottom Overlay Badge */}
                <div className="absolute bottom-4 inset-x-4 p-3 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-brand-300 block">
                      Generated Headline
                    </span>
                    <p className="text-xs font-bold text-white">&quot;Speed Redefined. Dominate the City.&quot;</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase">
                    5 Credits
                  </span>
                </div>
              </div>

              {/* Action Banner */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  <span>Want to test this with your own product?</span>
                </div>
                <Link
                  href="/dashboard/studio"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition"
                >
                  <span>Open Creator Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
