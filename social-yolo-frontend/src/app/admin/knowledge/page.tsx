'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Database,
  FlaskConical,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

import StyleReferenceManager from '@/components/knowledge/StyleReferenceManager';
import { useAuth } from '@/context/AuthContext';

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
 * Admin → Knowledge Base.
 *
 * Platform-wide control of the RAG corpus: curate the global reference pool,
 * promote private uploads to global, seed the built-in starter library, and
 * reindex embeddings. This replaces the old `seed-sample-posts.cjs` script —
 * everything it did is now a button.
 */
export default function AdminKnowledgePage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login?redirect=/admin/knowledge');
      } else if (!isAdmin) {
        router.push('/');
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-slate-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Verifying admin access…
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black flex items-center gap-2.5">
              <Database className="w-6 h-6 text-indigo-400" />
              RAG Knowledge Base
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wide">
              <ShieldAlert className="w-3 h-3" /> Admin only
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1.5 max-w-3xl">
            Curate the design knowledge every generated post is grounded in. Global entries here
            are retrieved by all accounts; private entries stay with their owner. Each upload is
            auto-analysed and embedded, so the corpus improves without any manual seeding step.
          </p>
        </div>

        <StyleReferenceManager mode="admin" suggestedCategories={SUGGESTED_CATEGORIES} />

        <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <FlaskConical className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed">
            <strong className="text-slate-300">Replaced the seed script.</strong>{' '}
            <code className="text-[11px] px-1 py-0.5 rounded bg-slate-800 text-slate-300">
              scripts/seed-sample-posts.cjs
            </code>{' '}
            is no longer needed — the <em>Seed starter library</em> button above writes the same
            curated style playbooks as global entries and embeds them. Use{' '}
            <em>Reindex</em> after changing <code className="text-[11px]">GEMINI_EMBEDDING_MODEL</code>{' '}
            or <code className="text-[11px]">GEMINI_EMBEDDING_DIMENSIONS</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
