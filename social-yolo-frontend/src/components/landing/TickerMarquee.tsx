'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface TickerMarqueeProps {
  reverse?: boolean;
}

export function TickerMarquee({ reverse = false }: TickerMarqueeProps) {
  const items = [
    "INSTANT POST GENERATION",
    "100% AUTOMATIC BACKGROUND REMOVAL",
    "PERSONAL RAG STYLE MEMORY",
    "4K HIGH RESOLUTION EXPORT",
    "STUDIO-GRADE TYPOGRAPHY",
    "PHOTOREALISTIC AI ENGINE",
    "ZERO DESIGN EXPERIENCE NEEDED",
  ];

  return (
    <div className="w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 text-slate-950 py-3.5 sm:py-4 overflow-hidden shadow-inner border-y border-yellow-500/30">
      <div className={`flex w-max ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'} whitespace-nowrap`}>
        {/* Repeat 4 times for seamless infinite loop */}
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-6 mx-4">
            {items.map((text, idx) => (
              <div key={idx} className="flex items-center gap-6">
                <span className="font-extrabold text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950 inline-block" />
                  {text}
                </span>
                <span className="text-slate-950/40 text-lg font-bold">•</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
