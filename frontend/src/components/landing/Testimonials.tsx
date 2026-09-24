'use client';

import React from 'react';
import { Star, Quote } from 'lucide-react';
import { StarburstIcon } from '../ui/Icons';

export function Testimonials() {
  const reviews = [
    {
      name: "Marcus Vance",
      role: "Club Promoter & Event Producer",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      content:
        "Social Yolo cut our weekly flyer design time from 3 days to literally 5 minutes. The lighting, typography, and background removal are mind-blowing.",
      stars: 5,
    },
    {
      name: "Elena Rostova",
      role: "E-Commerce Founder (Glow Luxe)",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      content:
        "I just snap a photo of our cosmetic bottles on my desk, type 'luxury summer sale', and the generated posts look like a $5,000 photoshoot. Best ROI ever.",
      stars: 5,
    },
    {
      name: "Andre Silva",
      role: "Creative Agency Director",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      content:
        "The RAG feedback loop is real magic: whenever we rate posts 5 stars, the system actually remembers our style for subsequent renders!",
      stars: 5,
    },
  ];

  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden border-t border-slate-200 dark:border-slate-800/80 transition-colors duration-200">
      {/* Decorative starburst */}
      <div className="absolute top-12 right-16 text-purple-600/30 dark:text-purple-400/30 pointer-events-none">
        <StarburstIcon className="w-8 h-8" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/70 px-3.5 py-1 rounded-full border border-purple-300 dark:border-purple-800/60">
            Real Reviews
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-4 font-display">
            What Our <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 dark:from-purple-400 dark:via-pink-400 dark:to-amber-300 bg-clip-text text-transparent">Customers Say</span>
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Over 5,000+ business owners, DJs, and creators trust Social Yolo daily.
          </p>
        </div>

        {/* 3 Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev, i) => (
            <div
              key={i}
              className="p-7 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl hover:border-purple-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between relative group"
            >
              <div>
                {/* Gold Quote Mark and Stars */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(rev.stars)].map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                    <Quote className="w-4 h-4 fill-current" />
                  </div>
                </div>

                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed italic">
                  &ldquo;{rev.content}&rdquo;
                </p>
              </div>

              {/* Author Info */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <img
                  src={rev.avatar}
                  alt={rev.name}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                    {rev.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{rev.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
