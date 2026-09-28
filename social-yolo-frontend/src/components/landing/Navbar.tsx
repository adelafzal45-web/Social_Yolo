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
import { BackendStatusModal } from '../ui/BackendStatusModal';
import { useAuth } from '@/context/AuthContext';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { ThemeToggle } from '../ui/ThemeToggle';

export function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-amber-400 flex items-center justify-center text-white shadow-glow group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 text-white animate-pulse-slow" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white flex items-center gap-1 font-display">
                SOCIAL <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-amber-400">YOLO</span>
              </span>
              <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 tracking-wider uppercase -mt-1">
                Creative AI Studio
              </span>
            </div>
          </Link>

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
            <BackendStatusModal />

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <Link
                  href="/dashboard"
                  className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>

                {/* User badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-white leading-tight max-w-[110px] truncate">
                      {user.name || user.email}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-brand-400">
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* Change password button */}
                <button
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="p-2 rounded-xl text-slate-400 hover:text-brand-400 hover:bg-slate-900 transition border border-transparent hover:border-slate-800"
                  title="Change Password"
                >
                  <KeyRound className="w-4 h-4" />
                </button>

                {/* Logout button */}
                <button
                  onClick={() => logout()}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition border border-transparent hover:border-rose-900/40"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>

                <Link
                  href="/register"
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md hover:shadow-glow transition flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <BackendStatusModal />
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900"
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
              <div className="grid grid-cols-2 gap-2 pb-3 mb-2 border-b border-slate-800">
                <Link
                  href="/login"
                  onClick={() => setIsMobileOpen(false)}
                  className="py-2.5 text-center rounded-xl bg-slate-900 text-xs font-bold text-slate-300 border border-slate-800"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileOpen(false)}
                  className="py-2.5 text-center rounded-xl bg-brand-600 text-white text-xs font-bold shadow"
                >
                  Get Started
                </Link>
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
