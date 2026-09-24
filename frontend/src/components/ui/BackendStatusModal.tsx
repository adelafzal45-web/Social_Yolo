'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  User,
  ExternalLink,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  checkBackendHealth,
  getStoredBackendPort,
  getStoredUserId,
  setStoredBackendPort,
  setStoredUserId,
} from '@/lib/api';
import { HealthResponse } from '@/lib/types';

export function BackendStatusModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [userId, setUserId] = useState('');
  const [backendPort, setBackendPort] = useState('3001');
  const [saveMessage, setSaveMessage] = useState('');

  const refreshStatus = async () => {
    setIsChecking(true);
    try {
      const res = await checkBackendHealth();
      setHealth(res);
    } catch {
      setHealth({
        backend: false,
        pythonService: false,
        activeUrl: 'Offline',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    setUserId(getStoredUserId());
    setBackendPort(getStoredBackendPort());
    refreshStatus();
  }, []);

  const handleSaveSettings = () => {
    setStoredUserId(userId);
    setStoredBackendPort(backendPort);
    setSaveMessage('Settings saved! Re-testing connection...');
    setTimeout(() => setSaveMessage(''), 3000);
    refreshStatus();
  };

  const isAllGood = health?.backend;
  const isBackendGood = health?.backend;

  return (
    <>
      {/* Navbar trigger pill */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-800 transition-all duration-200 bg-slate-900/90 backdrop-blur shadow-sm hover:border-slate-700 hover:scale-[1.02] cursor-pointer"
      >
        <span className="relative flex h-2 w-2">
          {isBackendGood ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          )}
        </span>
        <span className="text-slate-300 hidden sm:inline">
          {isAllGood ? 'Backend & AI Active' : 'Backend Offline'}
        </span>
        <Activity className="w-3.5 h-3.5 text-purple-400" />
      </button>

      {/* Modal Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full p-6 relative overflow-hidden text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Backend & Engine Status</h3>
                  <p className="text-xs text-slate-400">Live API & Microservice health</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Health Cards */}
            <div className="mt-4 space-y-2.5">
              {/* NestJS Backend */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {health?.backend ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  )}
                  <div>
                    <div className="text-sm font-semibold text-white">NestJS API</div>
                    <div className="text-xs text-slate-400">
                      Target: port {backendPort} (or 3000)
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    health?.backend
                      ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-800/60 text-rose-300'
                  }`}
                >
                  {health?.backend ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Node.js Native Background Engine */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-sm font-semibold text-white">Node.js Background Engine</div>
                    <div className="text-xs text-slate-400">@imgly/background-removal-node (ONNX, built-in)</div>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-emerald-950/60 border-emerald-800/60 text-emerald-300">
                  Built-in
                </span>
              </div>
            </div>

            {/* User Identity & Port Settings */}
            <div className="mt-5 pt-4 border-t border-slate-800 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  User ID for RAG Personal Style Memory
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. creator_1"
                  className="w-full text-xs px-3 py-2 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-950 text-white placeholder-slate-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Posts rated 4–5★ under this User ID train your personalized style pool.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                  <Server className="w-3.5 h-3.5 text-purple-400" />
                  NestJS Backend Port
                </label>
                <div className="flex gap-2">
                  {['3001', '3000'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setBackendPort(p)}
                      className={`flex-1 text-xs py-1.5 rounded-lg border font-medium transition cursor-pointer ${
                        backendPort === p
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      Port {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {saveMessage && (
              <div className="mt-3 text-xs text-emerald-400 font-medium text-center">
                {saveMessage}
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-6 flex items-center gap-2">
              <button
                onClick={handleSaveSettings}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold transition shadow-sm hover:shadow cursor-pointer"
              >
                Save & Apply
              </button>
              <button
                onClick={refreshStatus}
                disabled={isChecking}
                className="py-2 px-3 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                Re-check
              </button>
            </div>

            {/* Swagger Documentation Link */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Swagger API Docs</span>
              <a
                href={`http://localhost:${backendPort}/api/docs`}
                target="_blank"
                rel="noreferrer"
                className="text-purple-400 font-semibold hover:underline flex items-center gap-1"
              >
                Open /api/docs <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
