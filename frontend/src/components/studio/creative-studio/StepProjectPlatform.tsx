'use client';

import React from 'react';
import {
  FolderPlus,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Pin,
  Sparkles,
  Layers,
} from 'lucide-react';

export interface PlatformOption {
  id: string;
  name: string;
  dimensions: string;
  aspectRatio: string;
  desc: string;
  icon: any;
}

export const PLATFORMS_LIST: PlatformOption[] = [
  {
    id: 'Instagram Post',
    name: 'Instagram Post',
    dimensions: '1080 × 1350',
    aspectRatio: '4:5',
    desc: 'Vertical portrait feed post',
    icon: Instagram,
  },
  {
    id: 'Instagram Story',
    name: 'Instagram Story / Reel',
    dimensions: '1080 × 1920',
    aspectRatio: '9:16',
    desc: 'Full-screen vertical mobile',
    icon: Instagram,
  },
  {
    id: 'Facebook Post',
    name: 'Facebook Post',
    dimensions: '1200 × 628',
    aspectRatio: '1.91:1',
    desc: 'Standard feed link ad / banner',
    icon: Facebook,
  },
  {
    id: 'Facebook Story',
    name: 'Facebook Story',
    dimensions: '1080 × 1920',
    aspectRatio: '9:16',
    desc: 'Vertical mobile story ad',
    icon: Facebook,
  },
  {
    id: 'LinkedIn',
    name: 'LinkedIn Post',
    dimensions: '1080 × 1350',
    aspectRatio: '4:5',
    desc: 'Professional B2B feed graphic',
    icon: Linkedin,
  },
  {
    id: 'X',
    name: 'X (Twitter)',
    dimensions: '1200 × 628',
    aspectRatio: '16:9',
    desc: 'Horizontal feed summary card',
    icon: Twitter,
  },
  {
    id: 'Pinterest',
    name: 'Pinterest Pin',
    dimensions: '1000 × 1500',
    aspectRatio: '2:3',
    desc: 'High-converting vertical pin',
    icon: Pin,
  },
  {
    id: 'General Social Media',
    name: 'Square Universal',
    dimensions: '1080 × 1080',
    aspectRatio: '1:1',
    desc: 'Multi-platform square post',
    icon: Layers,
  },
];

interface StepProjectPlatformProps {
  projectName: string;
  setProjectName: (name: string) => void;
  campaign: string;
  setCampaign: (camp: string) => void;
  platform: string;
  setPlatform: (plat: string) => void;
}

export function StepProjectPlatform({
  projectName,
  setProjectName,
  campaign,
  setCampaign,
  platform,
  setPlatform,
}: StepProjectPlatformProps) {
  const selectedPlatform = PLATFORMS_LIST.find((p) => p.id === platform) || PLATFORMS_LIST[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Step Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 text-xs font-semibold mb-2 border border-brand-500/20">
          <FolderPlus className="w-3.5 h-3.5" />
          <span>Step 1 of 5</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Create Project &amp; Choose Platform
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Give your campaign a name and select the target social media platform. Recommended canvas dimensions are applied automatically.
        </p>
      </div>

      {/* Project & Campaign Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Project Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. Summer Release Campaign"
            className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-sm transition"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Campaign Purpose / Tag (Optional)
          </label>
          <input
            type="text"
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            placeholder="e.g. Q3 Growth, Weekend Flash Sale"
            className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-sm transition"
          />
        </div>
      </div>

      {/* Platform Selector Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Target Platform &amp; Recommended Dimensions
          </label>
          <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">
            Active: {selectedPlatform.dimensions} ({selectedPlatform.aspectRatio})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {PLATFORMS_LIST.map((p) => {
            const Icon = p.icon;
            const isSelected = platform === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatform(p.id)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500/10 shadow-md ring-2 ring-brand-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                      isSelected
                        ? 'bg-brand-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {p.aspectRatio}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</h4>
                <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold mt-0.5">
                  {p.dimensions}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                  {p.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
