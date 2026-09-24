'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Command, ArrowRight, CornerDownLeft, Sparkles, X } from 'lucide-react';
import { searchAuthorizedRoutes, AppRouteItem } from '@/config/navigation.config';
import { useAuth } from '@/context/AuthContext';

interface JumpToSearchProps {
  className?: string;
}

export function JumpToSearch({ className = '' }: JumpToSearchProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMac, setIsMac] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchId = useId();

  // Detect platform for keyboard shortcut label (Mac vs Windows/Linux)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform));
    }
  }, []);

  // Filter routes based on query and user's RBAC role
  const filteredRoutes: AppRouteItem[] = searchAuthorizedRoutes(query, user?.role);

  // Global Ctrl+K / Cmd+K shortcut listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selected index if results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation inside the list
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (filteredRoutes.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredRoutes.length);
      scrollToSelected((selectedIndex + 1) % filteredRoutes.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredRoutes.length) % filteredRoutes.length);
      scrollToSelected((selectedIndex - 1 + filteredRoutes.length) % filteredRoutes.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredRoutes[selectedIndex];
      if (target) {
        navigateTo(target.href);
      }
    }
  };

  const scrollToSelected = (index: number) => {
    const el = listRef.current?.children[index] as HTMLElement | undefined;
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  };

  const navigateTo = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* HEADER TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`group relative flex items-center justify-between gap-3 px-3 py-1.5 rounded-xl border transition-all duration-200 text-xs text-left select-none focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
          'bg-slate-100/80 hover:bg-slate-100 dark:bg-slate-900/80 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        } ${className}`}
        aria-label="Search and jump to application page (Press Ctrl+K)"
        title={`Jump to... (${isMac ? '⌘K' : 'Ctrl+K'})`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-brand-500 transition-colors shrink-0" />
          <span className="hidden sm:inline font-medium truncate">Jump to...</span>
          <span className="sm:hidden font-medium">Search</span>
        </div>

        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-[10px] font-mono text-slate-500 dark:text-slate-400 font-semibold shadow-xs">
          {isMac ? '⌘' : 'Ctrl '}K
        </kbd>
      </button>

      {/* COMMAND PALETTE MODAL OVERLAY */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby={searchId}
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Dialog Container */}
          <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col">
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <Search className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
              <input
                ref={inputRef}
                id={searchId}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Type a page name, destination, or keyword..."
                className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
                  aria-label="Clear search input"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                  ESC
                </kbd>
              )}
            </div>

            {/* Results List */}
            <div
              ref={listRef}
              className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100/50 dark:divide-slate-800/40"
              role="listbox"
            >
              {filteredRoutes.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
                  <Search className="w-7 h-7 mx-auto opacity-30 stroke-1" />
                  <p className="font-semibold text-slate-600 dark:text-slate-300">
                    No destinations found
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    No authorized pages matched &ldquo;<span className="text-slate-600 dark:text-slate-300 font-medium">{query}</span>&rdquo;
                  </p>
                </div>
              ) : (
                filteredRoutes.map((route, idx) => {
                  const isSelected = idx === selectedIndex;
                  const Icon = route.icon;

                  return (
                    <div
                      key={route.id}
                      onClick={() => navigateTo(route.href)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-100'
                          : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-brand-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-brand-500'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {route.label}
                            </span>
                            {route.badge && (
                              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-bold tracking-wider bg-brand-500/15 text-brand-700 dark:text-brand-300">
                                {route.badge}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                              ({route.category})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {route.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-100/60 dark:bg-brand-900/40 px-2 py-0.5 rounded-md">
                            Go <CornerDownLeft className="w-3 h-3" />
                          </span>
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer Keyboard Legend */}
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono">
                    ↑↓
                  </kbd>{' '}
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono">
                    ↵
                  </kbd>{' '}
                  Select
                </span>
              </div>
              <span className="text-slate-400 dark:text-slate-500">
                {filteredRoutes.length} accessible {filteredRoutes.length === 1 ? 'route' : 'routes'}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
