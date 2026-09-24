'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { setAuthToken } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser, loginWithGoogle } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMessage(decodeURIComponent(error));
      return;
    }

    if (token) {
      try {
        setAuthToken(token);
        refreshUser()
          .then(() => {
            setStatus('success');
            setTimeout(() => {
              router.push('/dashboard');
            }, 800);
          })
          .catch((err) => {
            setStatus('error');
            setErrorMessage(err.message || 'Failed to initialize session profile.');
          });
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Failed to save authentication session.');
      }
    } else if (code) {
      // Direct Google OAuth code return (e.g. from redirect flow)
      setStatus('loading');
      loginWithGoogle({ code, redirectUri: window.location.origin + '/auth/callback' })
        .then(() => {
          setStatus('success');
          setTimeout(() => {
            router.push('/dashboard');
          }, 800);
        })
        .catch((err) => {
          setStatus('error');
          setErrorMessage(err.message || 'Failed to authenticate Google authorization code.');
        });
    } else {
      setStatus('error');
      setErrorMessage('No authentication token or authorization code received from Google.');
    }
  }, [searchParams, refreshUser, loginWithGoogle, router]);

  return (
    <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl text-center">
      {status === 'loading' && (
        <div className="space-y-4 py-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Completing Google Sign-In</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Verifying your Google identity and establishing your creative studio session...
          </p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4 py-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Successfully Authenticated!</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Welcome to Social Yolo AI. Redirecting to your dashboard...
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4 py-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-800/40 text-rose-500 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Authentication Failed</h2>
          <p className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3 text-left">
            {errorMessage || 'Unable to authenticate with Google.'}
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/login"
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition flex items-center justify-center gap-2 shadow-md shadow-purple-500/20"
            >
              <span>Return to Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GoogleAuthCallbackPage() {
  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-4 py-12 relative overflow-hidden transition-colors duration-200">
      <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:24px_24px] opacity-15 dark:opacity-25 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-purple-600/15 via-indigo-600/10 to-pink-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <Suspense
        fallback={
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing callback...</span>
          </div>
        }
      >
        <CallbackHandler />
      </Suspense>
    </main>
  );
}
