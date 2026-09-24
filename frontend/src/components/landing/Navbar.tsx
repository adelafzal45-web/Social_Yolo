'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Menu,
  X,
  Shield,
  KeyRound,
  LogOut,
  User as UserIcon,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useBrand } from '@/context/BrandContext';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { ThemeToggle } from '../ui/ThemeToggle';
import { BrandLogo } from '../brand/BrandLogo';

export function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { brand } = useBrand();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const ctaMode = brand.headerCtaMode || 'both';

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <BrandLogo variant="landing" href="/" />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/dashboard/studio"
              className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-brand-500" />
              AI Studio
            </Link>
            <a
              href="#templates"
              className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
            >
              Templates
            </a>
            <a
              href="#features"
              className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
            >
              FAQ
            </a>
            {isAdmin && (
              <Link
                href="/admin/users"
                className="text-sm font-bold text-amber-400 hover:text-amber-300 bg-amber-950/40 hover:bg-amber-900/40 px-3 py-1.5 rounded-xl border border-amber-800/60 transition flex items-center gap-1.5"
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Admin Users</span>
              </Link>
            )}
          </nav>

          {/* Header Right Actions */}
          <div className="hidden sm:flex items-center gap-3.5">
            <ThemeToggle />

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <Link
                  href="/dashboard"
                  className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>

                {/* User badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight max-w-[110px] truncate">
                      {user.name || user.email}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-brand-500 dark:text-brand-400">
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* Change password button */}
                <button
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                  title="Change Password"
                >
                  <KeyRound className="w-4 h-4" />
                </button>

                {/* Logout button */}
                <button
                  onClick={() => logout()}
                  className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {(ctaMode === 'both' || ctaMode === 'sign_in_only') && (
                  <Link
                    href="/login"
                    className={`px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                      ctaMode === 'sign_in_only'
                        ? 'rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-md hover:shadow-glow'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </Link>
                )}

                {(ctaMode === 'both' || ctaMode === 'get_started_only') && (
                  <Link
                    href="/register"
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md hover:shadow-glow transition flex items-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Get Started</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
              aria-label="Toggle Menu"
            >
              {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileOpen && (
          <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 pt-3 pb-6 space-y-3">
            {isAuthenticated && user ? (
              <div className="pb-3 mb-2 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-white">{user.name}</div>
                  <div className="text-xs text-slate-400 font-mono">{user.email}</div>
                  <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider text-brand-400 bg-brand-950/50 px-2 py-0.5 rounded-full border border-brand-800">
                    Role: {user.role}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setIsMobileOpen(false);
                      setIsChangePasswordOpen(true);
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
                    title="Change Password"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileOpen(false);
                    }}
                    className="p-2 rounded-lg text-rose-400 hover:bg-rose-950/40"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className={`pb-3 mb-2 border-b border-slate-200 dark:border-slate-800 ${ctaMode === 'both' ? 'grid grid-cols-2 gap-2' : 'flex'}`}>
                {(ctaMode === 'both' || ctaMode === 'sign_in_only') && (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileOpen(false)}
                    className={`py-2.5 text-center rounded-xl text-xs font-bold border transition ${
                      ctaMode === 'sign_in_only'
                        ? 'w-full bg-brand-600 text-white border-brand-500 shadow'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Sign In
                  </Link>
                )}
                {(ctaMode === 'both' || ctaMode === 'get_started_only') && (
                  <Link
                    href="/register"
                    onClick={() => setIsMobileOpen(false)}
                    className="w-full py-2.5 text-center rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-bold shadow"
                  >
                    Get Started
                  </Link>
                )}
              </div>
            )}

            {isAdmin && (
              <Link
                href="/admin/users"
                onClick={() => setIsMobileOpen(false)}
                className="block py-2 text-base font-bold text-amber-400"
              >
                🛡️ Admin User Management
              </Link>
            )}

            <Link
              href="/dashboard/studio"
              onClick={() => setIsMobileOpen(false)}
              className="block py-2 text-base font-semibold text-slate-200 hover:text-brand-400"
            >
              ✨ AI Studio
            </Link>
            <a
              href="#templates"
              onClick={() => setIsMobileOpen(false)}
              className="block py-2 text-base font-semibold text-slate-300 hover:text-white"
            >
              🎨 Templates
            </a>
            <a
              href="#features"
              onClick={() => setIsMobileOpen(false)}
              className="block py-2 text-base font-semibold text-slate-300 hover:text-white"
            >
              ⚡ Features
            </a>
            <a
              href="#pricing"
              onClick={() => setIsMobileOpen(false)}
              className="block py-2 text-base font-semibold text-slate-300 hover:text-white"
            >
              🏷️ Pricing Plans
            </a>
          </div>
        )}
      </header>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </>
  );
}
