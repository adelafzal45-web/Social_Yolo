'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  User as UserIcon,
  Lock,
  Server,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Shield,
  Key,
  Image as ImageIcon,
  Upload,
  Trash2,
  Sparkles,
  Eye,
  Layers,
  Type,
  Sliders,
  Check,
  Globe,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useBrand } from '@/context/BrandContext';
import { useNotification } from '@/context/NotificationContext';
import { checkBackendHealth, getStoredBackendPort, setStoredBackendPort } from '@/lib/api';
import { HealthResponse } from '@/lib/types';
import { HeaderDisplayMode, HeaderCtaMode } from '@/types/brand';

const PRESET_LOGOS = [
  {
    id: 'sparkle',
    name: 'Sparkle Studio',
    dataUri:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="12" fill="url(%23g1)"/><path d="M20 9L22.5 16.5L30 19L22.5 21.5L20 29L17.5 21.5L10 19L17.5 16.5L20 9Z" fill="white"/><defs><linearGradient id="g1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse"><stop stop-color="%237C3AED"/><stop offset="1" stop-color="%23EC4899"/></linearGradient></defs></svg>',
  },
  {
    id: 'bolt',
    name: 'Electric Bolt',
    dataUri:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="12" fill="url(%23g2)"/><path d="M22 8L11 22H19L17 32L29 18H21L22 8Z" fill="white"/><defs><linearGradient id="g2" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse"><stop stop-color="%2306B6D4"/><stop offset="1" stop-color="%233B82F6"/></linearGradient></defs></svg>',
  },
  {
    id: 'lens',
    name: 'Emerald Lens',
    dataUri:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="12" fill="url(%23g3)"/><circle cx="20" cy="20" r="10" stroke="white" stroke-width="2.5"/><circle cx="20" cy="20" r="4" fill="white"/><defs><linearGradient id="g3" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse"><stop stop-color="%2310B981"/><stop offset="1" stop-color="%23059669"/></linearGradient></defs></svg>',
  },
  {
    id: 'prism',
    name: 'Ruby Prism',
    dataUri:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="12" fill="url(%23g4)"/><path d="M20 9L30 19L20 31L10 19L20 9Z" fill="white"/><defs><linearGradient id="g4" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse"><stop stop-color="%23F59E0B"/><stop offset="1" stop-color="%23EF4444"/></linearGradient></defs></svg>',
  },
  {
    id: 'crest',
    name: 'Indigo Crest',
    dataUri:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="12" fill="url(%23g5)"/><path d="M13 27V13L20 19L27 13V27" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><defs><linearGradient id="g5" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse"><stop stop-color="%238B5CF6"/><stop offset="1" stop-color="%236366F1"/></linearGradient></defs></svg>',
  },
  {
    id: 'orbit',
    name: 'Midnight Orbit',
    dataUri:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="12" fill="%230F172A"/><circle cx="20" cy="20" r="9" stroke="%23E2E8F0" stroke-width="2" stroke-dasharray="4 2"/><circle cx="20" cy="20" r="3.5" fill="%2338BDF8"/></svg>',
  },
];

export default function SettingsPage() {
  const { user, changePassword } = useAuth();
  const { brand, updateBrand, resetBrand } = useBrand();
  const { toast } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Branding state
  const [appName, setAppName] = useState(brand.name || 'SocialYolo');
  const [appTagline, setAppTagline] = useState(brand.description || 'AI Social Media Studio & Post Generator');
  const [logoUrl, setLogoUrl] = useState(brand.logo || '');
  const [displayMode, setDisplayMode] = useState<HeaderDisplayMode>(brand.headerDisplayMode || 'logo_title_tagline');
  const [showLogo, setShowLogo] = useState<boolean>(brand.showLogo !== false);
  const [showTitle, setShowTitle] = useState<boolean>(brand.showTitle !== false);
  const [showTagline, setShowTagline] = useState<boolean>(brand.showTagline !== false);
  const [ctaMode, setCtaMode] = useState<HeaderCtaMode>(brand.headerCtaMode || 'both');
  const [savingBrand, setSavingBrand] = useState(false);
  const [brandSavedMsg, setBrandSavedMsg] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewDark, setPreviewDark] = useState<boolean>(true);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  // Connectivity state
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [configuredPort, setConfiguredPort] = useState('3001');

  useEffect(() => {
    setConfiguredPort(getStoredBackendPort());
    handleCheckHealth();
  }, []);

  useEffect(() => {
    setAppName(brand.name || 'SocialYolo');
    setAppTagline(brand.description || 'AI Social Media Studio & Post Generator');
    setLogoUrl(brand.logo || '');
    setDisplayMode(brand.headerDisplayMode || 'logo_title_tagline');
    setShowLogo(brand.showLogo !== false);
    setShowTitle(brand.showTitle !== false);
    setShowTagline(brand.showTagline !== false);
    setCtaMode(brand.headerCtaMode || 'both');
  }, [brand]);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image size exceeds 2MB limit.');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      setLogoUrl(dataUri);
      toast.success('Custom logo loaded into preview. Click "Save Branding Changes" to apply.', 'Logo Loaded');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectDisplayMode = (mode: HeaderDisplayMode) => {
    setDisplayMode(mode);
    if (mode === 'logo_only') {
      setShowLogo(true);
      setShowTitle(false);
      setShowTagline(false);
    } else if (mode === 'logo_title') {
      setShowLogo(true);
      setShowTitle(true);
      setShowTagline(false);
    } else {
      setShowLogo(true);
      setShowTitle(true);
      setShowTagline(true);
    }
  };

  const handleSaveBranding = async () => {
    setSavingBrand(true);
    setBrandSavedMsg(null);
    try {
      await updateBrand({
        name: appName.trim() || 'SocialYolo',
        shortName: appName.trim() || 'SocialYolo',
        description: appTagline.trim(),
        logo: logoUrl.trim(),
        headerDisplayMode: displayMode,
        showLogo,
        showTitle,
        showTagline,
        headerCtaMode: ctaMode,
      });
      setBrandSavedMsg('Header and branding settings successfully saved and applied globally.');
      toast.success('Header & branding updated successfully across all pages!', 'Changes Saved');
      setTimeout(() => setBrandSavedMsg(null), 4000);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save branding settings', 'Error');
    } finally {
      setSavingBrand(false);
    }
  };

  const handleResetBranding = async () => {
    if (!window.confirm('Reset header and branding back to default SocialYolo settings?')) return;
    setSavingBrand(true);
    try {
      await resetBrand();
      setAppName('SocialYolo');
      setAppTagline('AI Social Media Studio & Post Generator');
      setLogoUrl('');
      setDisplayMode('logo_title_tagline');
      setShowLogo(true);
      setShowTitle(true);
      setShowTagline(true);
      setCtaMode('both');
      toast.success('Header & branding restored to default settings.', 'Reset');
    } catch (err: any) {
      toast.error('Failed to reset branding settings', 'Error');
    } finally {
      setSavingBrand(false);
    }
  };

  const handleCheckHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await checkBackendHealth();
      setHealth(res);
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };

  const handlePortChange = (port: string) => {
    setConfiguredPort(port);
    setStoredBackendPort(port);
    handleCheckHealth();
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPwError('Please fill in both current and new passwords.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }

    setPwLoading(true);
    setPwError(null);
    setPwSuccess(null);

    try {
      await changePassword(currentPassword, newPassword);
      setPwSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwError(err.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          <span>Account & System Settings</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your brand logo, header display visibility concepts, personal credentials, and system health.
        </p>
      </div>

      {/* SECTION: HEADER BRANDING & LOGO SETTINGS */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm dark:shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Header Branding & Logo Configuration
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Change your app logo, toggle the Logo / Title / Tagline concept, and customize header actions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetBranding}
              disabled={savingBrand}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Reset Defaults
            </button>
            <button
              type="button"
              onClick={handleSaveBranding}
              disabled={savingBrand}
              className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition flex items-center gap-1.5"
            >
              {savingBrand ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Save Branding</span>
            </button>
          </div>
        </div>

        {brandSavedMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{brandSavedMsg}</span>
          </div>
        )}

        {/* 1. LIVE REAL-TIME HEADER PREVIEW */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-brand-500" />
              <span>Live Header Simulation</span>
            </span>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>Preview Mode:</span>
              <button
                type="button"
                onClick={() => setPreviewDark(!previewDark)}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                {previewDark ? '🌙 Dark' : '☀️ Light'}
              </button>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border transition-all ${
              previewDark
                ? 'bg-slate-950 border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              {/* Left: Brand Identity Component in Preview */}
              <div className="flex items-center gap-2.5">
                {/* Logo Badge */}
                {showLogo && (
                  <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-gradient-to-tr from-brand-600 via-indigo-600 to-amber-400 text-white shadow-md shadow-brand-500/20">
                    {logoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={logoUrl} alt={appName} className="w-full h-full object-contain" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-white" />
                    )}
                  </div>
                )}

                {/* Text details (title + tagline) */}
                {displayMode !== 'logo_only' && (showTitle || showTagline) && (
                  <div className="flex flex-col min-w-0">
                    {showTitle && (
                      <span className="font-bold tracking-tight text-sm truncate">
                        {appName || 'SocialYolo'}
                      </span>
                    )}
                    {showTagline && appTagline && displayMode === 'logo_title_tagline' && (
                      <span className="text-[9px] font-medium text-brand-500 tracking-wider uppercase truncate -mt-0.5">
                        {appTagline}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Middle Navigation (Simulated) */}
              <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-slate-400">
                <span className="text-brand-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Studio
                </span>
                <span>Templates</span>
                <span>Features</span>
                <span>Pricing</span>
              </div>

              {/* Right CTA Actions Simulation */}
              <div className="flex items-center gap-2">
                {(ctaMode === 'both' || ctaMode === 'sign_in_only') && (
                  <span
                    className={`px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 ${
                      ctaMode === 'sign_in_only'
                        ? 'rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-[11px]'
                        : 'text-slate-400'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Sign In
                  </span>
                )}

                {(ctaMode === 'both' || ctaMode === 'get_started_only') && (
                  <span className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-[11px] font-bold shadow-md flex items-center gap-1">
                    <UserPlus className="w-3.5 h-3.5" />
                    Get Started
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-200/20 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
              <span className="font-mono">
                Active Concept:{' '}
                <strong className="text-brand-500">
                  {displayMode === 'logo_only'
                    ? 'Logo Only (Title & Tagline Hidden)'
                    : displayMode === 'logo_title'
                    ? 'Logo + Title (Tagline Hidden)'
                    : 'Logo + Title + Tagline (Full)'}
                </strong>
              </span>
              <span>Backend & AI Active button: <strong className="text-rose-400">Removed</strong></span>
            </div>
          </div>
        </div>

        {/* 2. CONCEPT SELECTOR (LOGO ONLY vs LOGO + TITLE vs FULL) */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-900 dark:text-white block">
              Logo + Title + Tagline Visibility Concept
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Choose how your brand identity appears in the top navigation bar. Selecting &ldquo;Logo Only&rdquo; completely hides the title and tagline.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Option 1: Logo Only */}
            <div
              onClick={() => handleSelectDisplayMode('logo_only')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition relative flex flex-col justify-between ${
                displayMode === 'logo_only'
                  ? 'bg-brand-50/50 dark:bg-brand-950/30 border-brand-500 ring-2 ring-brand-500/20'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Logo Only
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300">
                    Cleanest
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Only shows your logo mark. Title name and descriptor tagline are hidden for a sleek, minimal header.
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Just Logo Icon</span>
                {displayMode === 'logo_only' && (
                  <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                )}
              </div>
            </div>

            {/* Option 2: Logo + Title */}
            <div
              onClick={() => handleSelectDisplayMode('logo_title')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition relative flex flex-col justify-between ${
                displayMode === 'logo_title'
                  ? 'bg-brand-50/50 dark:bg-brand-950/30 border-brand-500 ring-2 ring-brand-500/20'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Logo + Title
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Standard
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Shows your logo badge and application title. Subtitle tagline is omitted.
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Logo + App Name</span>
                {displayMode === 'logo_title' && (
                  <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                )}
              </div>
            </div>

            {/* Option 3: Full (Logo + Title + Tagline) */}
            <div
              onClick={() => handleSelectDisplayMode('logo_title_tagline')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition relative flex flex-col justify-between ${
                displayMode === 'logo_title_tagline'
                  ? 'bg-brand-50/50 dark:bg-brand-950/30 border-brand-500 ring-2 ring-brand-500/20'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Logo + Title + Tagline
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                    Full
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Displays your logo, the application name, and the marketing tagline below.
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">All Elements Visible</span>
                {displayMode === 'logo_title_tagline' && (
                  <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                )}
              </div>
            </div>
          </div>

          {/* Granular Visibility Checkboxes */}
          <div className="pt-2 flex flex-wrap items-center gap-5 text-xs text-slate-700 dark:text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showLogo}
                onChange={(e) => setShowLogo(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 dark:bg-slate-950"
              />
              <span className="font-semibold">Show Logo Icon</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showTitle}
                onChange={(e) => {
                  const val = e.target.checked;
                  setShowTitle(val);
                  if (!val && !showTagline) {
                    setDisplayMode('logo_only');
                  } else if (val && !showTagline) {
                    setDisplayMode('logo_title');
                  } else if (val && showTagline) {
                    setDisplayMode('logo_title_tagline');
                  }
                }}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 dark:bg-slate-950"
              />
              <span className="font-semibold">Show App Name / Title</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showTagline}
                onChange={(e) => {
                  const val = e.target.checked;
                  setShowTagline(val);
                  if (!val && showTitle) {
                    setDisplayMode('logo_title');
                  } else if (!val && !showTitle) {
                    setDisplayMode('logo_only');
                  } else if (val) {
                    setDisplayMode('logo_title_tagline');
                    setShowTitle(true);
                  }
                }}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 dark:bg-slate-950"
              />
              <span className="font-semibold">Show Tagline Subtitle</span>
            </label>
          </div>
        </div>

        {/* 3. LOGO MANAGEMENT (UPLOAD, URL, PRESETS) */}
        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-xs font-bold text-slate-900 dark:text-white block">
              Change Application Logo
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Upload your own logo image (PNG, SVG, JPG, WebP), paste a hosted image URL, or choose from our curated presets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Upload Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-gradient-to-tr from-brand-600 via-indigo-600 to-amber-400 text-white shadow-md shadow-brand-500/20 border border-slate-200 dark:border-slate-700">
                  {logoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {logoUrl ? 'Custom Logo Active' : 'Default Sparkle Logo'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {logoUrl ? 'Custom image loaded' : 'Gradient icon badge'}
                  </p>
                </div>
              </div>

              {uploadError && (
                <p className="text-[11px] text-rose-500 font-semibold">{uploadError}</p>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoFileUpload}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Logo File</span>
                </button>

                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40 transition"
                    title="Remove custom logo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Direct URL Input */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white block mb-1">
                  Or Paste Logo Image URL
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.svg"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Supports SVGs, transparent PNGs, and HTTPS links. Changes reflect instantly in the preview.
              </p>
            </div>
          </div>

          {/* Preset Logo Gallery */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Quick Preset Badges
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {PRESET_LOGOS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setLogoUrl(preset.dataUri)}
                  className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                    logoUrl === preset.dataUri
                      ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500 ring-2 ring-brand-500/20'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preset.dataUri} alt={preset.name} className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate w-full">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. TITLE & TAGLINE TEXT INPUTS */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-900 dark:text-white block mb-1">
              Application Title / Name
            </label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="SocialYolo"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-900 dark:text-white block mb-1">
              Descriptor Tagline / Subtitle
            </label>
            <input
              type="text"
              value={appTagline}
              onChange={(e) => setAppTagline(e.target.value)}
              placeholder="AI Social Media Studio & Post Generator"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* 5. HEADER ACTION BUTTONS (SIGN IN vs GET STARTED) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-900 dark:text-white block">
              Header Call-to-Action Buttons
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Choose which authentication actions appear in the top header for guest visitors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Option A: Both (Recommended) */}
            <div
              onClick={() => setCtaMode('both')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                ctaMode === 'both'
                  ? 'bg-brand-50/50 dark:bg-brand-950/30 border-brand-500 ring-2 ring-brand-500/20'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Sign In + Get Started
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Subtle &ldquo;Sign In&rdquo; text link for existing members + prominent gradient &ldquo;Get Started&rdquo; button for new signups.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Industry SaaS Standard</span>
                {ctaMode === 'both' && (
                  <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                )}
              </div>
            </div>

            {/* Option B: Get Started Only */}
            <div
              onClick={() => setCtaMode('get_started_only')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                ctaMode === 'get_started_only'
                  ? 'bg-brand-50/50 dark:bg-brand-950/30 border-brand-500 ring-2 ring-brand-500/20'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Get Started Only
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    High Conversion
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Single high-impact action button dedicated to user acquisition and instant registration.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Single Primary Button</span>
                {ctaMode === 'get_started_only' && (
                  <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                )}
              </div>
            </div>

            {/* Option C: Sign In Only */}
            <div
              onClick={() => setCtaMode('sign_in_only')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                ctaMode === 'sign_in_only'
                  ? 'bg-brand-50/50 dark:bg-brand-950/30 border-brand-500 ring-2 ring-brand-500/20'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Sign In Only
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Private Portal
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Single button directed to authentication. Best for private, B2B, or invite-only deployments.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Login Only</span>
                {ctaMode === 'sign_in_only' && (
                  <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: PROFILE SUMMARY */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm dark:shadow-xl">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <UserIcon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Profile Identity</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Full Name
            </span>
            <p className="font-semibold text-slate-900 dark:text-white">{user?.name || 'Creator'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Account Email
            </span>
            <p className="font-semibold text-slate-900 dark:text-white">{user?.email || 'user@socialyolo.ai'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Access Role
            </span>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30">
              {user?.role || 'User'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
              User ID
            </span>
            <p className="font-mono text-slate-600 dark:text-slate-400 truncate">{user?.id || 'Active Session'}</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: SECURITY & PASSWORD */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm dark:shadow-xl">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Key className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Change Password</h2>
        </div>

        {pwSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{pwSuccess}</span>
          </div>
        )}

        {pwError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{pwError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs max-w-md">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <button
            type="submit"
            disabled={pwLoading}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold flex items-center gap-2 transition shadow-md shadow-brand-600/20"
          >
            {pwLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Update Password</span>
          </button>
        </form>
      </div>

      {/* SECTION 3: SYSTEM CONNECTIVITY & HEALTH */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm dark:shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Service Health Diagnostics</h2>
          </div>
          <button
            onClick={handleCheckHealth}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Re-run health probe"
          >
            <RefreshCw className={`w-4 h-4 ${healthLoading ? 'animate-spin text-brand-500' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">NestJS Core API</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Authentication, PostgreSQL & Post Generator
              </p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                health?.backend
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                  : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
              }`}
            >
              {health?.backend ? 'Operational' : 'Offline / Standby'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Python Rembg Service</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Fast ISNet Mask Segmentation (:8000)
              </p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                health?.pythonService
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                  : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
              }`}
            >
              {health?.pythonService ? 'Operational' : 'Checking'}
            </span>
          </div>
        </div>

        {/* Port toggle */}
        <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Configured Backend Origin Port:</span>
          <div className="flex items-center gap-2">
            {['3001', '3000'].map((p) => (
              <button
                key={p}
                onClick={() => handlePortChange(p)}
                className={`px-3 py-1 rounded-lg border font-mono transition ${
                  configuredPort === p
                    ? 'bg-brand-600 text-white border-brand-500'
                    : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                :{p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
