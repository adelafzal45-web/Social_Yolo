'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  ExternalLink,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { analyzeUrlApi, getAnalysisJobStatusApi } from '@/lib/api';
import { BrandAnalysisResult, BrandSource, AnalysisJobStatus } from '@/lib/types';

interface UrlAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (result: BrandAnalysisResult, sources: BrandSource[]) => void;
  onManualCreateRequested?: () => void;
}

const PRESET_DOMAINS = [
  'stripe.com',
  'linear.app',
  'spotify.com',
  'airbnb.com',
  'apple.com',
  'notion.so',
];

export const UrlAnalysisModal: React.FC<UrlAnalysisModalProps> = ({
  isOpen,
  onClose,
  onAnalysisComplete,
  onManualCreateRequested,
}) => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [jobData, setJobData] = useState<AnalysisJobStatus | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      setStatus('idle');
      setUrl('');
      setErrorMessage(null);
      setJobData(null);
    }
  }, [isOpen]);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const startAnalysis = async (targetUrl?: string) => {
    const rawUrl = (targetUrl || url).trim();
    if (!rawUrl) {
      setErrorMessage('Please enter a valid website URL.');
      return;
    }

    setErrorMessage(null);
    setStatus('analyzing');
    stopPolling();

    try {
      const response = await analyzeUrlApi(rawUrl);
      const jobId = response.jobId;

      // Start polling for progress
      pollingRef.current = setInterval(async () => {
        try {
          const currentJob: AnalysisJobStatus = await getAnalysisJobStatusApi(jobId);
          setJobData(currentJob);

          if (currentJob.status === 'completed' && currentJob.result) {
            stopPolling();
            // Short delay to let the user see 100% completion
            setTimeout(() => {
              onAnalysisComplete(currentJob.result!, currentJob.crawledPages || []);
            }, 600);
          } else if (currentJob.status === 'failed') {
            stopPolling();
            setStatus('error');
            setErrorMessage(
              currentJob.error ||
                'Unable to crawl the website. Please verify the URL or enter brand details manually.',
            );
          }
        } catch (pollErr: any) {
          console.warn('Job polling notice:', pollErr.message);
        }
      }, 1200);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to start website analysis.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-28 bg-purple-600/20 blur-3xl pointer-events-none rounded-full" />

        {/* Close Button */}
        <button
          onClick={() => {
            stopPolling();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content Body */}
        <div className="p-7 sm:p-9 relative z-0">
          {status === 'idle' && (
            <div>
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Instant Brand DNA Extraction
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Enter your website URL — our AI engine will crawl, extract logos, colors, voice, and products.
                  </p>
                </div>
              </div>

              {/* URL Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  startAnalysis();
                }}
                className="mt-6"
              >
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="https://yourbrand.com or yourbrand.com"
                    autoFocus
                    className="w-full pl-11 pr-32 py-3.5 bg-zinc-800/70 border border-zinc-700/80 rounded-2xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-inner"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-600/25 transition-all"
                  >
                    <span>Analyze</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {errorMessage && (
                  <div className="flex items-center gap-2 mt-2.5 text-xs text-rose-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </form>

              {/* Example Suggestions */}
              <div className="mt-6 pt-5 border-t border-zinc-800/80">
                <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-2.5">
                  Try with popular brands:
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_DOMAINS.map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => {
                        setUrl(domain);
                        startAnalysis(domain);
                      }}
                      className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-white transition-all flex items-center gap-1"
                    >
                      <span>{domain}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Creation Fallback */}
              {onManualCreateRequested && (
                <div className="mt-7 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onManualCreateRequested();
                    }}
                    className="text-xs text-zinc-400 hover:text-zinc-200 underline transition-colors"
                  >
                    Or create brand profile manually without a website
                  </button>
                </div>
              )}
            </div>
          )}

          {status === 'analyzing' && (
            <div className="py-4">
              {/* Animated Radar Center */}
              <div className="relative flex items-center justify-center my-6">
                <div className="w-24 h-24 rounded-full bg-purple-600/10 border border-purple-500/20 flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border border-purple-500/40 animate-ping opacity-25" />
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
                    <Globe className="w-8 h-8 text-white animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Title and URL */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Analyzing Brand Identity
                </h3>
                <p className="text-xs text-purple-400 font-mono mt-0.5 max-w-sm mx-auto truncate">
                  {url.startsWith('http') ? url : `https://${url}`}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-800/80 rounded-full h-2 mb-6 overflow-hidden p-0.5 border border-zinc-700/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(jobData?.progress || 10, 8)}%` }}
                />
              </div>

              {/* Step list */}
              <div className="space-y-2.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
                {(jobData?.steps || [
                  { id: 'connected', label: 'Connecting to website...', status: 'in_progress' },
                  { id: 'content_collected', label: 'Collecting website content...', status: 'pending' },
                  { id: 'brand_info', label: 'Extracting brand identity & assets...', status: 'pending' },
                  { id: 'products', label: 'Synthesizing with Gemini AI...', status: 'pending' },
                ]).map((step, idx) => (
                  <div key={step.id || idx} className="flex items-center gap-3 text-xs">
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : step.status === 'in_progress' ? (
                      <Loader2 className="w-4 h-4 text-purple-400 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-zinc-700 flex-shrink-0" />
                    )}
                    <span
                      className={
                        step.status === 'completed'
                          ? 'text-zinc-300 font-medium'
                          : step.status === 'in_progress'
                            ? 'text-white font-semibold'
                            : 'text-zinc-500'
                      }
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-center">
                <p className="text-[11px] text-zinc-500">
                  This usually takes 5 to 10 seconds depending on site responsiveness.
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="py-2 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Analysis Incomplete</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto mb-6">
                {errorMessage ||
                  'We could not reach or extract brand details from this domain. Check the domain spelling or create your brand profile manually.'}
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStatus('idle');
                    setErrorMessage(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>

                {onManualCreateRequested && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onManualCreateRequested();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-md shadow-purple-600/20 transition-all"
                  >
                    <span>Enter Details Manually</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
