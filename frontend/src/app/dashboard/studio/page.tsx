'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';

export default function LegacyStudioRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/studio');
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 mb-2">
        <Sparkles className="w-6 h-6 animate-pulse" />
        <h2 className="text-xl font-bold">Transferring to Unified AI Post Studio...</h2>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Redirecting to the promptless post generation experience.
      </p>
    </div>
  );
}
