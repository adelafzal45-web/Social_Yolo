'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sparkles,
  LogOut,
  Bell,
  Menu,
  X,
  Zap,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Trash2,
  ChevronDown,
  User as UserIcon,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  CreditCard,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useBrand } from '@/context/BrandContext';
import { UserRole } from '@/lib/types';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { JumpToSearch } from '@/components/ui/JumpToSearch';
import { getAuthorizedRoutes } from '@/config/navigation.config';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, refreshUser } = useAuth();
  const { brand } = useBrand();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Restore sidebar collapse state from localStorage and cookie
  useEffect(() => {
    try {
      const saved = localStorage.getItem('socialyolo_sidebar_collapsed');
      if (saved !== null) {
        setSidebarCollapsed(saved === 'true');
      } else {
        const match = document.cookie.match(/(?:^|; )socialyolo_sidebar_collapsed=([^;]*)/);
        if (match) {
          setSidebarCollapsed(match[1] === 'true');
        }
      }
    } catch {}
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('socialyolo_sidebar_collapsed', String(next));
        document.cookie = `socialyolo_sidebar_collapsed=${next}; path=/; max-age=31536000; SameSite=Lax`;
      } catch {}
      return next;
    });
  };

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotification();

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const planName = (user?.plan || 'Free Trial').toUpperCase().replace('_', ' ');
  const userCredits = user?.credits ?? 50;

  // Single Source of Truth: Get authorized routes based on active RBAC role
  const authorizedRoutes = getAuthorizedRoutes(user?.role);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-brand-500 selection:text-white transition-colors duration-200">
      {/* TOPBAR */}
      <header className="sticky top-0 z-40 h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between transition-colors duration-200">
        {/* Left: Hamburger + Brand + Jump To Search */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <BrandLogo variant="header" href="/dashboard" />

          {/* Header Jump To Search Box (Desktop & Tablet) */}
          <div className="hidden sm:block ml-2 md:ml-4">
            <JumpToSearch />
          </div>
        </div>

        {/* Right: Mobile Jump To, Credits, Notifications, Theme, User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Jump To Trigger Button */}
          <div className="sm:hidden">
            <JumpToSearch />
          </div>

          {/* Plan badge (desktop) */}
          <Link
            href="/dashboard/billing"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-950/70 border border-brand-200 dark:border-brand-800/60 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {planName}
          </Link>

          {/* Credits Counter Pill */}
          <Link
            href="/dashboard/billing"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-xs font-medium hover:border-brand-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-xs group"
            title="Click to manage or top up credits"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400/30 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-slate-900 dark:text-white">{userCredits}</span>
            <span className="text-slate-500 dark:text-slate-400 hidden xs:inline">Credits</span>
            <span className="ml-1 text-[10px] bg-brand-500/15 text-brand-700 dark:text-brand-300 px-1.5 py-0.2 rounded font-semibold">
              + Top-up
            </span>
          </Link>

          {/* Theme Mode Switcher (Icon-only, Light/Dark) */}
          <ThemeToggle />

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white dark:ring-slate-950 animate-pulse" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] bg-brand-500/15 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded-full font-bold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => markAllAsRead()}
                          className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline font-semibold transition cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={() => clearAllNotifications()}
                          className="text-[11px] text-slate-400 hover:text-rose-500 font-medium transition cursor-pointer"
                          title="Clear all notifications"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-xs">
                    <button
                      type="button"
                      onClick={() => setFilterUnreadOnly(false)}
                      className={`flex-1 py-1 rounded-lg font-semibold text-center transition ${
                        !filterUnreadOnly
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      All ({notifications.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterUnreadOnly(true)}
                      className={`flex-1 py-1 rounded-lg font-semibold text-center transition ${
                        filterUnreadOnly
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Unread ({unreadCount})
                    </button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {(() => {
                    const items = filterUnreadOnly
                      ? notifications.filter((n) => !n.read && !n.isRead)
                      : notifications;

                    if (items.length === 0) {
                      return (
                        <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs space-y-2">
                          <Bell className="w-6 h-6 mx-auto opacity-30" />
                          <p>
                            {filterUnreadOnly ? 'No unread notifications.' : 'No notifications yet.'}
                          </p>
                        </div>
                      );
                    }

                    return items.map((item) => {
                      const isUnread = !item.read && !item.isRead;
                      const isBilling = item.type === 'billing';
                      const isSuccess = item.type === 'success' || item.type === 'generation';
                      const isWarning = item.type === 'warning';
                      const isError = item.type === 'error';

                      const iconBg = isBilling
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                        : isSuccess
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        : isWarning
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                        : isError
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                        : 'bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400';

                      const ItemIcon = isBilling
                        ? Zap
                        : isSuccess
                        ? CheckCircle2
                        : isWarning
                        ? AlertTriangle
                        : isError
                        ? AlertCircle
                        : Info;

                      return (
                        <div
                          key={item.id}
                          className={`group px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-start gap-3 ${
                            isUnread ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${iconBg}`}>
                            <ItemIcon className="w-3.5 h-3.5" />
                          </div>

                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => {
                              if (isUnread) markAsRead(item.id);
                            }}
                          >
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                {item.title}
                              </p>
                              {isUnread && (
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed break-words">
                              {item.message}
                            </p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                              {new Date(item.createdAt).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(item.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition cursor-pointer"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-indigo-700 flex items-center justify-center font-bold text-xs text-white shadow-inner">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 hidden sm:block" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name || 'Creator'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.email || 'user@socialyolo.ai'}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span>Balance:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{userCredits} Credits</span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Account Settings
                  </Link>
                  <Link
                    href="/dashboard/billing"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    Subscription & Billing
                  </Link>
                  {user?.role === UserRole.ADMIN && (
                    <Link
                      href="/admin/users"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-800 transition"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      Admin Control Panel
                    </Link>
                  )}
                </div>

                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* BODY WITH SIDEBAR */}
      <div className="flex-1 flex overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside
          className={`hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/60 backdrop-blur-md shrink-0 py-3 justify-between transition-[width] duration-300 ease-in-out select-none ${
            sidebarCollapsed ? 'w-20 px-2' : 'w-64 px-3'
          }`}
        >
          <div className="space-y-3">
            {/* Sidebar Top Header with Dedicated Fold/Expand Toggle */}
            <div
              className={`flex items-center pb-2 border-b border-slate-100 dark:border-slate-800/80 ${
                sidebarCollapsed ? 'justify-center' : 'justify-end px-1'
              }`}
            >
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Navigation Items (Requirement 1: 'Navigation' text header completely removed, items start directly) */}
            <nav className="space-y-1" aria-label="Main Navigation">
              {authorizedRoutes.map((item) => {
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;

                if (sidebarCollapsed) {
                  // Collapsed Sidebar Layout (Follows media_1790000004435.png: Clean centered icon-only with accessible floating tooltip)
                  return (
                    <div key={item.id} className="relative group flex items-center justify-center my-1">
                      <Link
                        href={item.href}
                        aria-label={item.label}
                        className={`relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-200 ${
                          active
                            ? 'bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/25 ring-2 ring-brand-400/30'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850'
                        }`}
                      >
                        <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-white' : ''}`} />
                        {active && (
                          <span className="sr-only">(Active)</span>
                        )}
                      </Link>

                      {/* Accessible Floating Hover Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute left-full ml-3 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xl whitespace-nowrap z-50 transition-opacity duration-150 border border-slate-700/50 flex items-center gap-2">
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-bold bg-brand-500/30 text-brand-300">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

                // Expanded Sidebar Layout (Display: Logo, Icons, Navigation text, Active-state indicator)
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold tracking-wider ${
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          {!sidebarCollapsed ? (
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">AI Creative Engine</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                Automated prompt synthesis and commercial image generation.
              </p>
              <Link
                href="/dashboard/studio"
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition border border-slate-200 dark:border-slate-700/60"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
                New Post
              </Link>
            </div>
          ) : (
            <div className="relative group flex flex-col items-center py-1">
              <Link
                href="/dashboard/studio"
                aria-label="Create New Post"
                className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 hover:bg-brand-50 dark:hover:bg-brand-950/60 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center justify-center transition border border-slate-200 dark:border-slate-800 shadow-xs"
              >
                <Sparkles className="w-5 h-5" />
              </Link>
              <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute left-full ml-3 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xl whitespace-nowrap z-50 transition-opacity duration-150 border border-slate-700/50">
                New Post
              </div>
            </div>
          )}
        </aside>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="relative flex flex-col w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-4 justify-between z-10 animate-in slide-in-from-left duration-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <BrandLogo variant="header" href="/dashboard" />
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Close navigation"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {authorizedRoutes.map((item) => {
                    const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                          active
                            ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[9px] bg-brand-500/15 text-brand-700 dark:text-brand-300 px-1.5 py-0.5 rounded font-bold">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Theme</span>
                  <ThemeToggle />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Balance</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{userCredits} Credits</span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition border border-rose-200 dark:border-rose-800/40"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* MAIN VIEWPORT */}
        <main className="flex-1 overflow-y-auto min-w-0 p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
