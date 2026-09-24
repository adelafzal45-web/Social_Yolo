'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const AUTH_ONLY_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];
const PUBLIC_PATHS = ['/', '/auth/callback', ...AUTH_ONLY_PATHS];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isPublicPath = Boolean(
    pathname && (pathname === '/' || PUBLIC_PATHS.some((path) => path !== '/' && (pathname === path || pathname.startsWith(`${path}/`))))
  );

  const isAuthOnlyPath = Boolean(
    pathname && AUTH_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  );

  useEffect(() => {
    if (mounted && !isLoading) {
      if (!isAuthenticated && !isPublicPath) {
        // Not logged in -> Redirect to /login
        router.replace('/login');
      } else if (isAuthenticated && isAuthOnlyPath) {
        // Already logged in and on login/register -> Redirect to /dashboard
        router.replace('/dashboard');
      }
    }
  }, [mounted, isAuthenticated, isLoading, isPublicPath, isAuthOnlyPath, router, pathname]);

  // Before mounting on the client, render children if on public page, or fallback
  if (!mounted || isLoading) {
    if (isPublicPath) {
      return <>{children}</>;
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-purple-600/15 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 animate-pulse">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="flex flex-col items-center text-center">
            <h2 className="text-xl font-black text-white font-display tracking-tight">
              SOCIAL <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">YOLO</span>
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
              <span>Starting studio session...</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If unauthenticated and on a protected route, block render while redirect happens
  if (!isAuthenticated && !isPublicPath) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
          <span className="text-xs font-semibold text-slate-400">
            Redirecting to Sign In...
          </span>
        </div>
      </div>
    );
  }

  // If already authenticated and on login/register, block render while redirecting to dashboard
  if (isAuthenticated && isAuthOnlyPath) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
          <span className="text-xs font-semibold text-slate-400">
            Entering Studio...
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
