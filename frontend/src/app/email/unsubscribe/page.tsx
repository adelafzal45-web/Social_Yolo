'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  getPublicUnsubscribeInfoApi,
  executePublicUnsubscribeApi,
} from '@/lib/api';

export default function PublicUnsubscribePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailInfo, setEmailInfo] = useState<{
    email: string;
    isUnsubscribed: boolean;
    preferences: any;
  } | null>(null);

  const [unsubscribedSuccessfully, setUnsubscribedSuccessfully] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Category preferences
  const [prefs, setPrefs] = useState({
    marketingEmails: false,
    offerEmails: false,
    productUpdates: true,
    newsletters: false,
  });

  useEffect(() => {
    if (!token) {
      setError('No unsubscribe token provided. Please use the link provided in your email.');
      setLoading(false);
      return;
    }

    getPublicUnsubscribeInfoApi(token)
      .then((info) => {
        setEmailInfo(info);
        if (info.preferences) {
          setPrefs({
            marketingEmails: info.preferences.marketingEmails,
            offerEmails: info.preferences.offerEmails,
            productUpdates: info.preferences.productUpdates,
            newsletters: info.preferences.newsletters,
          });
        }
      })
      .catch((err) => {
        setError(err.message || 'Invalid or expired unsubscribe link.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleUnsubscribeAll = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      await executePublicUnsubscribeApi(token, true);
      setUnsubscribedSuccessfully(true);
    } catch (err: any) {
      setError(err.message || 'Failed to process unsubscribe request.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveCustomPreferences = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      await executePublicUnsubscribeApi(token, false, prefs);
      setUnsubscribedSuccessfully(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update preferences.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 antialiased selection:bg-brand-500 selection:text-white">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-3">
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">SocialYolo Email Preferences</h1>
          <p className="text-xs text-slate-400">
            Control the emails you receive or unsubscribe from promotional campaigns.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-8 text-center text-slate-400 flex flex-col items-center gap-2 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-500" />
            <span>Verifying secure unsubscribe token...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-200">Unable to proceed</div>
              <div className="mt-0.5">{error}</div>
            </div>
          </div>
        )}

        {/* Success State */}
        {unsubscribedSuccessfully && (
          <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="font-bold text-sm text-white">Preferences Updated</h3>
            <p className="text-xs text-slate-400">
              Your email preferences have been securely recorded. You will no longer receive communications matching your opt-out settings.
            </p>
          </div>
        )}

        {/* Form State */}
        {!loading && !error && !unsubscribedSuccessfully && emailInfo && (
          <div className="space-y-5">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              Recipient: <strong className="text-white font-mono">{emailInfo.email}</strong>
            </div>

            {/* Quick Unsubscribe Button */}
            <button
              onClick={handleUnsubscribeAll}
              disabled={processing}
              className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
            >
              {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              1-Click Unsubscribe from All Marketing Emails
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800" />
              <span className="flex-shrink mx-3 text-[11px] text-slate-500 font-semibold uppercase">Or Choose Topics</span>
              <div className="flex-grow border-t border-slate-800" />
            </div>

            {/* Topics */}
            <div className="space-y-3 text-xs">
              {[
                { id: 'offerEmails', label: 'Promotional Offers & Discounts' },
                { id: 'marketingEmails', label: 'Product News & Strategy Tips' },
                { id: 'newsletters', label: 'Creator Inspiration Newsletter' },
                { id: 'productUpdates', label: 'Engine Performance & Updates' },
              ].map((item) => (
                <label
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition"
                >
                  <span className="text-slate-300 font-medium">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={(prefs as any)[item.id]}
                    onChange={(e) => setPrefs({ ...prefs, [item.id]: e.target.checked })}
                    className="rounded border-slate-700 text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                </label>
              ))}
            </div>

            <button
              onClick={handleSaveCustomPreferences}
              disabled={processing}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
            >
              Save Custom Preferences
            </button>
          </div>
        )}

        <div className="text-center text-[11px] text-slate-500 pt-2 border-t border-slate-800">
          &copy; 2026 SocialYolo, Inc. • Enterprise Email Delivery
        </div>
      </div>
    </div>
  );
}
