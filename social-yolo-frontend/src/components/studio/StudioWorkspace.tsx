'use client';

import React, { useState } from 'react';
import { Sparkles, Scissors, Layers, Flame } from 'lucide-react';
import { PostGenerator } from './PostGenerator';
import { BackgroundRemover } from './BackgroundRemover';
import { RecentGallery } from './RecentGallery';
import { StarburstIcon } from '../ui/Icons';

interface StudioWorkspaceProps {
  selectedPrompt?: string;
}

export function StudioWorkspace({ selectedPrompt }: StudioWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'generator' | 'bg-remover' | 'gallery'>('generator');
  const [refreshGalleryTrigger, setRefreshGalleryTrigger] = useState(0);

  const handlePostGenerated = () => {
    // bump trigger so gallery will reload next time it's opened
    setRefreshGalleryTrigger((prev) => prev + 1);
  };

  const handleUseCutoutInGenerator = (file: File) => {
    setActiveTab('generator');
  };

  return (
    <section id="generator" className="py-16 relative">
      {/* Background ambient gradient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[600px] bg-gradient-to-b from-purple-200/20 via-pink-100/20 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Starburst icon */}
      <div className="absolute top-6 left-8 text-fuchsia-400 opacity-70 pointer-events-none">
        <StarburstIcon className="w-8 h-8" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-100 dark:bg-brand-950/70 text-brand-800 dark:text-brand-300 text-xs font-bold uppercase tracking-wider mb-2 border border-brand-200 dark:border-brand-800/60">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Interactive Live Studio</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display">
            Generate In <span className="text-gradient">Real Time</span>
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Type your vision, optionally attach a product photo, and watch our multi-agent AI pipeline produce studio-ready flyers.
          </p>
        </div>

        {/* The Glowing Tab Switcher */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-300/80 dark:border-purple-500/30 shadow-sm dark:shadow-glow dark:shadow-purple-900/40">
            <button
              onClick={() => setActiveTab('generator')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 ${
                activeTab === 'generator'
                  ? 'bg-gradient-to-r from-brand-600 via-fuchsia-600 to-pink-500 text-white shadow-md scale-[1.02]'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>AI Post Generator</span>
            </button>

            <button
              onClick={() => setActiveTab('bg-remover')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 ${
                activeTab === 'bg-remover'
                  ? 'bg-gradient-to-r from-brand-600 via-fuchsia-600 to-pink-500 text-white shadow-md scale-[1.02]'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
              }`}
            >
              <Scissors className="w-4 h-4 text-amber-300" />
              <span>Background Remover</span>
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 ${
                activeTab === 'gallery'
                  ? 'bg-gradient-to-r from-brand-600 via-fuchsia-600 to-pink-500 text-white shadow-md scale-[1.02]'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
              }`}
            >
              <Layers className="w-4 h-4 text-cyan-300" />
              <span>Creations &amp; RAG Pool</span>
            </button>
          </div>
        </div>

        {/* Active Tab Panel */}
        <div className="transition-all duration-300">
          {activeTab === 'generator' && (
            <PostGenerator
              initialPrompt={selectedPrompt}
              onPostGenerated={handlePostGenerated}
            />
          )}

          {activeTab === 'bg-remover' && (
            <BackgroundRemover onUseInGenerator={handleUseCutoutInGenerator} />
          )}

          {activeTab === 'gallery' && (
            <RecentGallery refreshTrigger={refreshGalleryTrigger} />
          )}
        </div>

      </div>
    </section>
  );
}
