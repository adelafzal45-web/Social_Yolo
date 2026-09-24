'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Layers,
  Sparkles,
  Plus,
  Filter,
  Copy,
  Check,
  Edit3,
  Trash2,
  ExternalLink,
  ChevronDown,
  Calendar,
  BarChart2,
  Loader2,
  Tag,
  Eye,
  Heart,
  MessageSquare,
  Share2,
} from 'lucide-react';
import {
  listContentApi,
  getBrandProfilesApi,
  updateContentApi,
  deleteContentApi,
} from '@/lib/api';
import { Post, BrandProfile } from '@/lib/types';
import { useNotification } from '@/context/NotificationContext';

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸',
  facebook: '👥',
  linkedin: '💼',
  twitter: '🐦',
  tiktok: '🎵',
  pinterest: '📌',
};

function LibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useNotification();

  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedBrandId, setSelectedBrandId] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quick edit modal
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editCaption, setEditCaption] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('draft');
  const [savingEdit, setSavingEdit] = useState(false);

  // Load brands on mount
  useEffect(() => {
    async function loadBrands() {
      try {
        const b = await getBrandProfilesApi();
        setBrands(b);
      } catch (err) {
        console.error('Failed to load brands:', err);
      }
    }
    loadBrands();
  }, []);

  // Fetch posts when filters change
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        const brandId = selectedBrandId !== 'all' ? selectedBrandId : undefined;
        const platform = selectedPlatform !== 'all' ? selectedPlatform : undefined;
        const status = selectedStatus !== 'all' ? selectedStatus : undefined;
        const data = await listContentApi(brandId, platform, status);
        setPosts(data);
      } catch (err: any) {
        toast('Failed to load content posts', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [selectedBrandId, selectedPlatform, selectedStatus]);

  const handleCopy = (post: Post) => {
    const text = `${post.caption || post.bodyCopy || ''}\n\n${(post.hashtags || []).join(' ')}`;
    navigator.clipboard.writeText(text);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast('Caption & hashtags copied to clipboard!', 'info');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content item?')) return;
    try {
      await deleteContentApi(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast('Post deleted', 'info');
    } catch (err: any) {
      toast('Failed to delete post', 'error');
    }
  };

  const openEditModal = (post: Post) => {
    setEditingPost(post);
    setEditCaption(post.caption || post.bodyCopy || '');
    setEditStatus(post.status || 'draft');
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    setSavingEdit(true);
    try {
      const updated = await updateContentApi(editingPost.id, {
        caption: editCaption,
        bodyCopy: editCaption,
        status: editStatus,
      });
      setPosts((prev) =>
        prev.map((p) => (p.id === editingPost.id ? { ...p, ...updated } : p))
      );
      setEditingPost(null);
      toast('Post updated successfully', 'success');
    } catch (err: any) {
      toast('Failed to save changes', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5" />
            Asset Repository
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Content Library
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Browse, manage, copy, and export platform-optimized captions and posts generated from brand DNA.
          </p>
        </div>

        <Link
          href="/content/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm transition shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
          Create New Content
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mr-2">
          <Filter className="w-4 h-4" />
          Filters
        </div>

        {/* Brand Filter */}
        <select
          value={selectedBrandId}
          onChange={(e) => setSelectedBrandId(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-gray-700 dark:text-gray-300 focus:outline-none"
        >
          <option value="all">All Brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.brandName || b.name}
            </option>
          ))}
        </select>

        {/* Platform Filter */}
        <select
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-gray-700 dark:text-gray-300 focus:outline-none"
        >
          <option value="all">All Platforms</option>
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="linkedin">LinkedIn</option>
          <option value="twitter">X (Twitter)</option>
          <option value="tiktok">TikTok</option>
          <option value="pinterest">Pinterest</option>
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-gray-700 dark:text-gray-300 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
        </select>
      </div>

      {/* Post List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-sm text-gray-500">Loading library assets...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-300 dark:border-slate-800 p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center mx-auto text-purple-600">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            No Content Found
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You haven’t generated or saved any content matching the selected filters yet.
          </p>
          <Link
            href="/content/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm transition shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Create Your First Post
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => {
            const platformIcon = PLATFORM_ICONS[(post.platform || 'instagram').toLowerCase()] || '📱';
            return (
              <div
                key={post.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar: Platform & Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{platformIcon}</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                        {post.platform}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                        post.status === 'published'
                          ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                          : post.status === 'scheduled'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300'
                      }`}
                    >
                      {post.status || 'draft'}
                    </span>
                  </div>

                  {/* Title / Headline */}
                  <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                    {post.headline || post.title || 'Untitled Post'}
                  </h3>

                  {/* Caption Preview */}
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-5 whitespace-pre-line leading-relaxed">
                    {post.caption || post.bodyCopy || post.content}
                  </p>

                  {/* Hashtags */}
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
                      {post.hashtags.length > 4 && (
                        <span className="text-[10px] text-gray-400 self-center">
                          +{post.hashtags.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
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
                      onClick={() => openEditModal(post)}
                      className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                      title="Edit post"
                    >
                      <Edit3 className="w-4 h-4" />
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
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700"
                  >
                    <span>Send to Studio</span>
                    <Sparkles className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-gray-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-purple-600" />
                Edit Post
              </h3>
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                {editingPost.platform}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-gray-800 dark:text-gray-200"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Caption / Copy
              </label>
              <textarea
                rows={8}
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                className="w-full p-3.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingEdit}
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm"
              >
                {savingEdit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-gray-500 font-medium">Loading Content Library...</p>
        </div>
      }
    >
      <LibraryContent />
    </Suspense>
  );
}
