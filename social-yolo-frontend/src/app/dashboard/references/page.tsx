'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Loader2, Sparkles } from 'lucide-react';

import StyleReferenceManager from '@/components/knowledge/StyleReferenceManager';
import { useAuth } from '@/context/AuthContext';

/** Industries offered as autocomplete hints in the upload form. */
const SUGGESTED_CATEGORIES = [
  'beauty',
  'fashion',
  'food',
  'tech',
  'fitness',
  'real-estate',
  'education',
  'events',
  'retail',
  'wellness',
  'automotive',
  'travel',
  'home',
  'hospitality',
  'finance',
];

/**
 * My Style References.
 *
 * A signed-in user's personal RAG library. Anything uploaded here is analysed
 * by Gemini Vision, embedded, and automatically retrieved on their next
 * generation — no seeding script, no manual embedding step.
 */
export default function MyReferencesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard/references');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-slate-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
          </Link>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            My Style References
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-3xl">
            Teach the AI your taste. Upload the designs you love and every future post is
            generated in that visual language — lighting, palette, composition and typography
            you already approved, with none of their branding.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-brand-200 dark:border-brand-900/60 bg-brand-50/60 dark:bg-brand-950/20 p-4">
        <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400 mt-0.5 shrink-0" />
        <p className="text-xs text-brand-900 dark:text-brand-200/90 leading-relaxed">
          <strong>How it works:</strong> each upload is read by AI Vision, which writes out its
          design language in words; that description is embedded into the vector store. On your
          next generation, the most similar references are pulled in automatically and used both
          as written guidance and, when an image exists, as a visual anchor for the renderer.
          The more you add, the sharper the match.
        </p>
      </div>

      <StyleReferenceManager mode="user" suggestedCategories={SUGGESTED_CATEGORIES} />
    </div>
  );
}
