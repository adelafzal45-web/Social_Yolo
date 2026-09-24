'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Layers,
  ArrowRight,
  Copy,
  Check,
  Edit3,
  Trash2,
  ExternalLink,
  Plus,
  Loader2,
  Building2,
  Lightbulb,
  BarChart2,
  ArrowLeft,
} from 'lucide-react';
import {
  getBrandByIdApi,
  listContentApi,
  listConceptsApi,
  deleteContentApi,
} from '@/lib/api';
import { BrandProfile, Post, ContentConcept } from '@/lib/types';
import { useNotification } from '@/context/NotificationContext';

export default function BrandContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const brandId = resolvedParams.id;
  const { toast } = useNotification();

  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [concepts, setConcepts] = useState<ContentConcept[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [b, p, c] = await Promise.all([
          getBrandByIdApi(brandId),
          listContentApi(brandId),
          listConceptsApi(brandId),
        ]);
        setBrand(b);
        setPosts(p);
        setConcepts(c);
      } catch (err: any) {
        toast('Failed to load brand content', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [brandId]);

  const handleCopy = (post: Post) => {
    const text = `${post.caption || post.bodyCopy || ''}\n\n${(post.hashtags || []).join(' ')}`;
    navigator.clipboard.writeText(text);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast('Caption & hashtags copied!', 'info');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await deleteContentApi(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast('Post deleted', 'info');
    } catch {
      toast('Failed to delete post', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="text-gray-500 font-medium">Loading brand content assets...</p>
      </div>
    );
  }

  const displayName = brand?.name || brand?.brandName || 'Brand';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link & Header */}
      <div>
        <Link
          href={`/brands/${brandId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-purple-600 transition mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {displayName} Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {displayName} Content Engine
              </h1>
              <span className="px-3 py-1 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold">
                {posts.length} Posts
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              All generated copy, concepts, and campaign posts tied directly to this brand’s DNA.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/content/concepts?brandId=${brandId}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
            >
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Concepts ({concepts.length})
            </Link>
            <Link
              href={`/brands/${brandId}/analytics`}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
            >
              <BarChart2 className="w-4 h-4 text-purple-500" />
              Analytics
            </Link>
            <Link
              href={`/content/create?brandId=${brandId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs transition shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              Generate Content
            </Link>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      {posts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-300 dark:border-slate-800 p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center mx-auto text-purple-600">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            No Posts Generated for {displayName} Yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Generate platform-ready captions, hooks, and visual directions using this brand's verified identity.
          </p>
          <Link
            href={`/content/create?brandId=${brandId}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm transition shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Generate First Post
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                    {post.platform}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300">
                    {post.status || 'draft'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                  {post.headline || post.title || 'Untitled Post'}
                </h3>

                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-5 whitespace-pre-line leading-relaxed">
                  {post.caption || post.bodyCopy}
                </p>

                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {post.hashtags.slice(0, 4).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-gray-50 dark:bg-slate-800 text-[10px] font-mono text-gray-600 dark:text-gray-400"
                      >
                        {tag.startsWith('#') ? tag : `#${tag}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopy(post)}
                    className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                    title="Copy caption"
                  >
                    {copiedId === post.id ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(post.id)}
                    className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-400 hover:text-red-500 transition"
                    title="Delete post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <Link
                  href={`/dashboard/studio?headline=${encodeURIComponent(
                    post.headline || ''
                  )}&bodyCopy=${encodeURIComponent(post.caption || '')}&platform=${post.platform}`}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  <span>Studio</span>
                  <Sparkles className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
