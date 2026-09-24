'use client';

import React from 'react';
import { Zap, Target, Cpu, ShieldCheck, Database, Layers, Sparkles } from 'lucide-react';
import { StarburstIcon } from '../ui/Icons';

export function WhyChooseUs() {
  const points = [
    {
      icon: Zap,
      title: "Sub-60s Turnaround",
      desc: "Go from rough prompt and product photo to finished, ready-to-publish social flyer in under 60 seconds.",
    },
    {
      icon: Target,
      title: "Studio Precision",
      desc: "Our rembg microservice strips messy backgrounds so your product integrates photorealistically into the scene.",
    },
    {
      icon: Cpu,
      title: "Self-Learning RAG Memory",
      desc: "Rate designs 4-5★ to train your personal vector style pool. Future generations mimic your brand's unique vibe.",
    },
    {
      icon: ShieldCheck,
      title: "Commercial Ownership",
      desc: "Every generated image is 100% royalty-free and ready for commercial ads, billings, and digital marketing campaigns.",
    },
  ];

  return (
    <section id="why-us" className="py-24 bg-white dark:bg-slate-950 text-slate-900 dark:text-white relative overflow-hidden border-t border-slate-200 dark:border-slate-800/80">
      {/* Background glow and decorative starbursts */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-12 right-12 text-purple-600/30 dark:text-purple-400/30 pointer-events-none">
        <StarburstIcon className="w-16 h-16" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/70 px-3.5 py-1 rounded-full border border-purple-200 dark:border-purple-800/60">
            Unfair Advantage
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold mt-4 font-display text-slate-900 dark:text-white">
            Why Choose <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 dark:from-purple-400 dark:via-pink-400 dark:to-amber-300 bg-clip-text text-transparent">Social Yolo</span>
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Engineered from the ground up for agencies, event promoters, and e-commerce stores who need speed and polish.
          </p>
        </div>

        {/* 4 Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {points.map((pt, i) => {
            const Icon = pt.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/90 hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-200 group shadow-sm dark:shadow-none"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white mb-5 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-display">
                  {pt.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {pt.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Tech Stack Bar */}
        <div className="mt-16 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-6 shadow-sm dark:shadow-none">
          <div className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
            Engineered with modern AI infrastructure:
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Advanced Multimodal AI</span>
            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Python Rembg Neural Engine</span>
            <span className="flex items-center gap-1.5"><Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Vector RAG Embeddings</span>
            <span className="flex items-center gap-1.5"><Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> PostgreSQL & NestJS</span>
          </div>
        </div>
      </div>
    </section>
  );
}
