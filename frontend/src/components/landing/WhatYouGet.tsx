'use client';

import React from 'react';
import { Layout, Scissors, Sparkles, Download, CheckCircle2 } from 'lucide-react';
import { StarburstIcon } from '../ui/Icons';

export function WhatYouGet() {
  const cards = [
    {
      icon: Layout,
      title: "High-Converting AI Layouts",
      subtitle: "Engineered for maximum engagement and viral reach across Instagram, TikTok, and LinkedIn.",
      badge: "Design Suite",
      badgeColor: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
      iconBg: "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-indigo-500/20",
      accent: "text-indigo-400",
    },
    {
      icon: Scissors,
      title: "AI Background Removal",
      subtitle: "Instant transparent product cutouts powered by our high-precision rembg neural engine.",
      badge: "Microservice",
      badgeColor: "bg-amber-500/10 text-amber-300 border-amber-500/30",
      iconBg: "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-amber-500/20",
      accent: "text-amber-400",
    },
    {
      icon: Sparkles,
      title: "Self-Improving RAG Style",
      subtitle: "Rates of 4–5★ train your personal vector pool to replicate your brand aesthetic over time.",
      badge: "AI Feedback Loop",
      badgeColor: "bg-purple-500/10 text-purple-300 border-purple-500/30",
      iconBg: "bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-purple-500/20",
      accent: "text-purple-400",
    },
    {
      icon: Download,
      title: "Studio-Grade 4K Export",
      subtitle: "One-click uncompressed PNG downloads with pixel-sharp typography ready for instant publish.",
      badge: "Instant Asset",
      badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
      iconBg: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/20",
      accent: "text-emerald-400",
    },
  ];

  return (
    <section id="capabilities" className="py-24 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden border-t border-slate-200 dark:border-slate-800/80 transition-colors duration-200">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative Starburst */}
      <div className="absolute top-12 left-10 text-amber-500/40 dark:text-amber-400/40 pointer-events-none">
        <StarburstIcon className="w-8 h-8" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/70 px-3.5 py-1 rounded-full border border-purple-200 dark:border-purple-800/60">
            Core Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-4 font-display">
            What You&apos;ll <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 dark:from-purple-400 dark:via-pink-400 dark:to-amber-300 bg-clip-text text-transparent">Get</span>
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Everything your brand needs to produce high-impact social content without prompt engineering or design agencies.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/90 shadow-md dark:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full border ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-display">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {card.subtitle}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold">
                  <CheckCircle2 className={`w-4 h-4 ${card.accent}`} />
                  <span className="text-slate-700 dark:text-slate-300">Included in all plans</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
