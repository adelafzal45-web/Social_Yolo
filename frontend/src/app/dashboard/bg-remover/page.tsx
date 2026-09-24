'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowRight, RefreshCw } from 'lucide-react';

export default function BgRemoverRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/dashboard/studio');
    }, 800);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center animate-pulse">
        <Sparkles className="w-7 h-7" />
      </div>
      <h2 className="text-xl font-bold text-white">Background Removal is now inside AI Studio</h2>
      <p className="text-xs text-slate-400 max-w-md leading-relaxed">
        We have integrated instant neural background removal, clarity sliders, and Before/After comparison directly into the AI Studio.
      </p>
      <div className="pt-2 flex items-center gap-3">
        <Link
          href="/dashboard/studio"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow-lg shadow-brand-500/20"
        >
          <span>Open AI Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <RefreshCw className="w-3 h-3 animate-spin" /> Redirecting...
        </span>
      </div>
    </div>
  );
}
