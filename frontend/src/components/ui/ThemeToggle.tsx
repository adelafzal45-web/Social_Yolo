'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean; // Deprecated: Kept for backwards-compatibility with existing callers, but no text is rendered per requirements
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { toggleTheme, isDark } = useTheme();

  const title = isDark
    ? 'Switch to light mode (currently Dark)'
    : 'Switch to dark mode (currently Light)';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex items-center justify-center p-2 rounded-xl border transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 select-none ${
        isDark
          ? 'bg-slate-900/90 border-slate-800 text-amber-400 hover:text-amber-300 hover:bg-slate-800 hover:border-slate-700 shadow-xs'
          : 'bg-white border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 hover:border-slate-300 shadow-xs'
      } ${className}`}
      aria-label={title}
      title={title}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-all duration-300 hover:rotate-90" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700 hover:text-indigo-600 transition-all duration-300 -rotate-12 hover:rotate-0" />
        )}
      </div>
    </button>
  );
}
