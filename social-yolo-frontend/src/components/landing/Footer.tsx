'use client';

import React from 'react';
import { Sparkles, Heart } from 'lucide-react';
import { BackendStatusModal } from '../ui/BackendStatusModal';

export function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 py-12 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-200 dark:border-slate-800">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white font-display">
                SOCIAL <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 dark:from-purple-400 dark:via-pink-400 dark:to-amber-300 bg-clip-text text-transparent">YOLO</span>
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">Next-Generation AI Creative Studio</p>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <a href="/dashboard/studio" className="hover:text-purple-600 dark:hover:text-purple-400 transition">AI Studio</a>
            <a href="#templates" className="hover:text-purple-600 dark:hover:text-purple-400 transition">Templates</a>
            <a href="#features" className="hover:text-purple-600 dark:hover:text-purple-400 transition">Features</a>
            <a href="#pricing" className="hover:text-purple-600 dark:hover:text-purple-400 transition">Pricing</a>
            <a href="#faq" className="hover:text-purple-600 dark:hover:text-purple-400 transition">FAQ</a>
          </div>

          {/* Status Modal Trigger */}
          <div>
            <BackendStatusModal />
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Social Yolo. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" /> for creators, brands &amp; agencies.
          </p>
        </div>
      </div>
    </footer>
  );
}
