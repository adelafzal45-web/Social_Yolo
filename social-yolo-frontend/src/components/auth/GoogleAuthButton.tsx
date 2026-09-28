'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Zap, AlertCircle } from 'lucide-react';
import { GOOGLE_AUTH_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '652055305762-0qbin6a591tbmgknm2ak4sc1dv1e86a6.apps.googleusercontent.com';

interface GoogleAuthButtonProps {
  label?: string;
  className?: string;
  allowInstantDirect?: boolean;
}

declare global {
  interface Window {
    google?: any;
  }
}

export function GoogleAuthButton({
  label = 'Continue with Google',
  className = '',
  allowInstantDirect = true,
}: GoogleAuthButtonProps) {
  const router = useRouter();
  const { loginWithGoogle, loginWithInstantGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Connecting to Google...');
  const [authError, setAuthError] = useState<string | null>(null);
  const codeClientRef = useRef<any>(null);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const gsiInitialized = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initGsi = () => {
      if (!window.google) return;

      // 1. Initialize Code Client (popup mode)
      if (window.google.accounts?.oauth2 && !codeClientRef.current) {
        try {
          codeClientRef.current = window.google.accounts.oauth2.initCodeClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'openid email profile',
            ux_mode: 'popup',
            callback: async (response: any) => {
              if (response.code) {
                setIsLoading(true);
                setLoadingText('Authenticating with Google & issuing JWT...');
                setAuthError(null);
                try {
                  await loginWithGoogle({ code: response.code, redirectUri: 'postmessage' });
                  router.push('/dashboard');
                } catch (err: any) {
                  setIsLoading(false);
                  setAuthError(err.message || 'Google code verification failed.');
                }
              } else if (response.error) {
                setIsLoading(false);
                if (response.error !== 'popup_closed_by_user') {
                  setAuthError(response.error_description || response.error);
                }
              }
            },
            error_callback: (nonOAuthError: any) => {
              setIsLoading(false);
              console.warn('Google popup error:', nonOAuthError);
            },
          });
        } catch (e) {
          console.warn('Error initializing Google Code Client:', e);
        }
      }

      // 2. Initialize ID Token client & render button
      if (window.google.accounts?.id && !gsiInitialized.current) {
        gsiInitialized.current = true;
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response: any) => {
              if (response.credential) {
                setIsLoading(true);
                setLoadingText('Verifying Google credentials & issuing JWT...');
                setAuthError(null);
                try {
                  await loginWithGoogle(response.credential);
                  router.push('/dashboard');
                } catch (err: any) {
                  setIsLoading(false);
                  setAuthError(err.message || 'Google credential verification failed.');
                }
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Render official Google button into container if available
          if (googleBtnContainerRef.current) {
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              text: 'continue_with',
              shape: 'pill',
              logo_alignment: 'left',
              width: 320,
            });
          }
        } catch (e) {
          console.warn('Error initializing Google ID client:', e);
        }
      }
    };

    if (!window.google?.accounts?.id && !window.google?.accounts?.oauth2) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.body.appendChild(script);
    } else {
      initGsi();
    }
  }, [loginWithGoogle, router]);

  const handleGoogleClick = () => {
    setAuthError(null);
    setIsLoading(true);
    setLoadingText('Opening Google Sign-In...');

    // Method 1: Use Code Client popup (takes user directly to Google credential login/account selection)
    if (codeClientRef.current) {
      try {
        codeClientRef.current.requestCode();
        // Reset loading state after a delay if user keeps popup open
        setTimeout(() => {
          setIsLoading(false);
        }, 5000);
        return;
      } catch (err) {
        console.warn('codeClient.requestCode failed, trying GSI prompt:', err);
      }
    }

    // Method 2: Trigger Google One-Tap prompt
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to server-side redirect
            window.location.href = GOOGLE_AUTH_URL;
          }
        });
        return;
      } catch {}
    }

    // Method 3: Fallback to server-side OAuth redirect
    window.location.href = GOOGLE_AUTH_URL;
  };

  const handleInstantDirectLogin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    setLoadingText('Signing in instantly...');
    try {
      await loginWithInstantGoogle();
      router.push('/dashboard');
    } catch {
      window.location.href = GOOGLE_AUTH_URL;
    }
  };

  return (
    <div className="space-y-2 w-full">
      {authError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      {/* Primary Custom Styled Button */}
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={isLoading}
        className={`w-full py-3.5 px-4 rounded-2xl border font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer select-none shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-70 disabled:cursor-not-allowed bg-white hover:bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:text-white dark:border-slate-800 hover:scale-[1.01] active:scale-[0.99] ${className}`}
        title={label}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
            <span className="text-slate-600 dark:text-slate-300 text-xs font-medium">{loadingText}</span>
          </>
        ) : (
          <>
            {/* Official Google "G" Logo */}
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="font-semibold">{label}</span>
          </>
        )}
      </button>

      {/* Hidden/Mounted Official Google Button Container */}
      <div ref={googleBtnContainerRef} className="hidden" aria-hidden="true" />

      {allowInstantDirect && !isLoading && (
        <div className="flex items-center justify-between text-[11px] px-1 text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Google OAuth & Instant Pass
          </span>
          <button
            type="button"
            onClick={handleInstantDirectLogin}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Zap className="w-3 h-3 text-amber-500 dark:text-amber-400 fill-amber-400" />
            1-Click Instant Pass
          </button>
        </div>
      )}
    </div>
  );
}
