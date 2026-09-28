'use client';

import React from 'react';
import { Sparkles, ArrowRight, Eye } from 'lucide-react';
import { StarburstIcon } from '../ui/Icons';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TemplateShowcaseProps {
  onSelectPrompt?: (prompt: string) => void;
}

export function TemplateShowcase({ onSelectPrompt }: TemplateShowcaseProps) {
  const router = useRouter();

  const templates = [
    {
      id: 1,
      title: "SUMMER NIGHT",
      category: "Nightclub / DJ Party",
      style: "bold",
      badge: "Bestseller",
      badgeColor: "bg-indigo-600 text-white",
      image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: 2,
      title: "SWEET CRUSH",
      category: "Lounge & Cocktails",
      style: "luxury",
      badge: "Trending",
      badgeColor: "bg-rose-600 text-white",
      image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: 3,
      title: "LADIES NIGHT",
      category: "Club & Fashion",
      style: "tech",
      badge: "Hot",
      badgeColor: "bg-emerald-600 text-white",
      image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: 4,
      title: "HAPPY HOUR",
      category: "Bar & Drinks",
      style: "playful",
      badge: "Popular",
      badgeColor: "bg-amber-500 text-slate-950 font-black",
      image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80",
    },
  ];

  return (
    <section id="templates" className="py-20 relative bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-900">
      {/* Decorative sparkle */}
      <div className="absolute top-10 right-8 text-brand-600/40 dark:text-brand-400/40">
        <StarburstIcon className="w-8 h-8" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 bg-brand-100 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-800/80 px-3.5 py-1 rounded-full">
              Inspiration Showcase
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2 font-display">
              Bestseller <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-amber-500 dark:from-brand-400 dark:to-amber-400">Templates</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1">
              Select any campaign visual aesthetic to pre-load directly into the AI Studio.
            </p>
          </div>

          <Link
            href="/dashboard/studio"
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-sm font-bold text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 transition"
          >
            <span>Open Creator Studio</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4 Poster Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="group relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 hover:-translate-y-2 hover:border-brand-500/50 hover:shadow-2xl"
            >
              {/* Poster Image */}
              <div className="aspect-[3/4] w-full relative overflow-hidden">
                <img
                  src={tpl.image}
                  alt={tpl.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-85"
                />

                {/* Top Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase shadow-md ${tpl.badgeColor}`}>
                    {tpl.badge}
                  </span>
                </div>

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent opacity-95 transition-opacity" />

                {/* Poster Card Details */}
                <div className="absolute bottom-0 inset-x-0 p-5 flex flex-col justify-end z-10">
                  <span className="text-[10px] font-semibold text-brand-300 uppercase tracking-wider">
                    {tpl.category}
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-1 font-display tracking-wide">
                    {tpl.title}
                  </h3>

                  <Link
                    href={`/dashboard/studio?style=${tpl.style}`}
                    className="mt-4 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Create in Studio</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
