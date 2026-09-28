'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { checkBackendHealth, getStoredBackendPort, setStoredBackendPort } from '@/lib/api';
import { HealthResponse } from '@/lib/types';

export default function SettingsPage() {
  const { user, changePassword } = useAuth();

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
          Manage your personal credentials, subscription identity, and verify backend microservice health.
        </p>
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
