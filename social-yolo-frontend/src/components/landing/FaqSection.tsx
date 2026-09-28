'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { StarburstIcon } from '../ui/Icons';

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does the AI post generation process work?",
      a: "When you submit a short prompt and optional product photo, our backend routes the photo to our Python microservice to cleanly remove the background. Then, our RAG engine retrieves your highest-rated past posts to formulate an expanded designer brief, which is rendered into a finished high-resolution flyer.",
    },
    {
      q: "Does the system automatically remove backgrounds from photos?",
      a: "Yes! The system includes an integrated Python FastAPI microservice running the rembg AI engine. It separates your product or subject with pixel-perfect transparency before generating the final composition.",
    },
    {
      q: "How does the personal RAG style memory work?",
      a: "Every time you rate a generated post 4 or 5 stars, its style embeddings are indexed into your personal style pool in PostgreSQL. Future generations automatically retrieve your favorite aesthetics to keep your branding consistent.",
    },
    {
      q: "Can I use the generated posts for commercial advertising?",
      a: "Absolutely! Every post you generate is 100% royalty-free and owned by you. You can publish them on Instagram, Facebook, TikTok, billboards, flyers, and digital ad campaigns.",
    },
    {
      q: "What engines are supported?",
      a: "The system natively uses an advanced multimodal image synthesis engine with automatic intelligent fallback, ensuring you can generate posts reliably and with maximum uptime.",
    },
  ];

  return (
    <section id="faq" className="py-24 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden border-t border-slate-200 dark:border-slate-800/80">
      {/* Decorative sparkle */}
      <div className="absolute top-12 left-12 text-amber-400/30 pointer-events-none">
        <StarburstIcon className="w-8 h-8" />
      </div>
      <div className="absolute bottom-12 right-12 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/70 px-3.5 py-1 rounded-full border border-purple-200 dark:border-purple-800/60">
            Got Questions?
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-4 font-display">
            Frequently Asked <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 dark:from-purple-400 dark:via-pink-400 dark:to-amber-300 bg-clip-text text-transparent">Questions</span>
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm">
            Everything you need to know about Social Yolo, RAG learning, and background removal.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3.5">
          {faqs.map((faq, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm dark:shadow-lg overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 dark:text-white text-base hover:text-purple-600 dark:hover:text-purple-300 transition cursor-pointer"
                >
                  <span className="font-display">{faq.q}</span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 flex-shrink-0 border ${
                      isOpen ? 'rotate-180 bg-purple-100 dark:bg-purple-900/60 border-purple-300 dark:border-purple-700/60 text-purple-700 dark:text-purple-300' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
