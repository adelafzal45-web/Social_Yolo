'use client';

import React from 'react';
import { Check, ShoppingBag, Music, Briefcase } from 'lucide-react';
import { StarburstIcon, FlowerStarIcon } from '../ui/Icons';

export function AudienceSection() {
  const audiences = [
    {
      icon: ShoppingBag,
      title: "E-Commerce & Retail Brands",
      desc: "Turn raw smartphone product shots into scroll-stopping promotional flyers that boost conversions without graphic designers.",
      iconBg: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
      checkColor: "bg-blue-500/20 text-blue-400 border border-blue-500/40",
    },
    {
      icon: Music,
      title: "Nightclubs, Bars & Event Promoters",
      desc: "Create dynamic party flyers, DJ tour banners, and happy hour announcements with dark cyber and neon lighting effects.",
      iconBg: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
      checkColor: "bg-amber-500/20 text-amber-400 border border-amber-500/40",
    },
    {
      icon: Briefcase,
      title: "Freelancers & Marketing Agencies",
      desc: "Produce dozens of creative concepts for your clients in seconds, scaling your studio output without creative burnout.",
      iconBg: "bg-purple-500/10 text-purple-400 border border-purple-500/30",
      checkColor: "bg-purple-500/20 text-purple-400 border border-purple-500/40",
    },
  ];

  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden border-t border-slate-200 dark:border-slate-800/80 transition-colors duration-200">
      {/* Decorative background accents */}
      <div className="absolute top-10 right-20 text-purple-500/20 pointer-events-none">
        <FlowerStarIcon className="w-16 h-16" />
      </div>
      <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Audiences */}
          <div className="lg:col-span-6">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/70 px-3.5 py-1 rounded-full border border-purple-300 dark:border-purple-800/60">
              Tailored For You
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-4 font-display">
              Who This Is <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 dark:from-purple-400 dark:via-pink-400 dark:to-amber-300 bg-clip-text text-transparent">Perfect For</span>
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base mb-8">
              Whether you sell fashion, host events, or manage marketing for local businesses,
              Social Yolo generates high-conversion social assets on demand without prompt complexity.
            </p>

            <div className="space-y-4">
              {audiences.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-md hover:border-purple-300 dark:hover:border-slate-700 transition flex items-start gap-4"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${item.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white font-display">
                        {item.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${item.checkColor}`}>
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: 3D Angled Mobile Mockups */}
          <div className="lg:col-span-6 flex justify-center relative">
            <div className="relative w-full max-w-[420px] h-[480px] flex items-center justify-center">
              
              {/* Back Phone */}
              <div className="absolute -right-4 sm:right-2 top-4 w-[210px] sm:w-[240px] aspect-[9/18] bg-slate-900 rounded-[36px] p-2.5 shadow-2xl border-2 border-slate-700 dark:border-slate-800 rotate-12 hover:rotate-6 transition-transform duration-300">
                <div className="w-full h-full rounded-[28px] overflow-hidden bg-slate-950 relative">
                  <img
                    src="https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=500&auto=format&fit=crop&q=80"
                    alt="Fitness flyer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Front Phone */}
              <div className="absolute left-2 sm:left-6 bottom-4 w-[220px] sm:w-[250px] aspect-[9/18] bg-slate-900 rounded-[36px] p-2.5 shadow-2xl border-2 border-slate-600 dark:border-slate-700 -rotate-6 hover:rotate-0 transition-transform duration-300 z-10">
                <div className="w-full h-full rounded-[28px] overflow-hidden bg-slate-950 relative">
                  <img
                    src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80"
                    alt="Event flyer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 to-transparent text-white text-xs font-bold">
                    Club Night Promo 🔥
                  </div>
                </div>
              </div>

              {/* Purple Sparkle */}
              <div className="absolute -bottom-4 right-8 text-purple-600 dark:text-purple-400 z-20 animate-pulse pointer-events-none">
                <StarburstIcon className="w-12 h-12" />
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
