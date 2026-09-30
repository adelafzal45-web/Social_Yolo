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
      {/* Clean Page Title (Single logo lives in top dashboard header) */}
      <div className="pb-2">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          AI Creation Studio
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Guided Step-by-Step AI Creative Suite
        </p>
      </div>

      {/* 10-Step Wizard Component */}
      <PostGenerator />
    </div>
  );
}
