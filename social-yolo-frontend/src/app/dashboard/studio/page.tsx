'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { PostGenerator } from '@/components/studio/PostGenerator';

export default function PostGenerationStudioPage() {
  const { user } = useAuth();
  const userCredits = user?.credits ?? 50;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200">
      {/* Top Application Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-amber-400 flex items-center justify-center shadow-lg shadow-brand-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 dark:text-white tracking-wider text-sm">
                SOCIAL YOLO
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30">
                AI CREATION WIZARD
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Guided Step-by-Step AI Creative Suite
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {/* Credits Counter Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-bold text-amber-600 dark:text-amber-400">{userCredits}</span>
            <span className="text-slate-500 dark:text-slate-400">CREDITS</span>
          </div>

          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-600 to-indigo-700 flex items-center justify-center font-bold text-xs text-white border border-slate-200 dark:border-slate-700">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </div>

      {/* 10-Step Wizard Component */}
      <PostGenerator />
    </div>
  );
}
