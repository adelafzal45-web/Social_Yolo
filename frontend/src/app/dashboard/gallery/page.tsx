'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Image as ImageIcon,
  Search,
  Filter,
  Star,
  Download,
  Trash2,
  Eye,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Check,
  Copy,
  X,
} from 'lucide-react';
import { getFilteredPosts, toggleFavoritePost, ratePost, deletePostApi } from '@/lib/api';
import { Post } from '@/lib/types';
import { StarsRating } from '@/components/ui/StarsRating';

const PLATFORMS = [
  { id: 'all', label: 'All Channels' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'twitter', label: 'Twitter / X' },
];

const STYLES = [
  { id: 'all', label: 'All Styles' },
  { id: 'luxury', label: 'Luxury' },
  { id: 'minimalist', label: 'Minimalist' },
  { id: 'bold', label: 'Bold' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'tech', label: 'Tech Glow' },
  { id: 'playful', label: 'Playful' },
];

export default function GalleryPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [platform, setPlatform] = useState<string>('all');
  const [style, setStyle] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);

  // Modal / Lightbox
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await getFilteredPosts({
        platform: platform !== 'all' ? platform : undefined,
        style: style !== 'all' ? style : undefined,
        search: search.trim() || undefined,
        favoritesOnly,
        limit: 50,
      });
      setPosts(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts();
    }, 200);
    return () => clearTimeout(timer);
  }, [platform, style, search, favoritesOnly]);

  const handleToggleFavorite = async (id: string) => {
    try {
      const updated = await toggleFavoritePost(id);
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isFavorite: updated.isFavorite } : p))
      );
      if (activePost?.id === id) {
        setActivePost((prev) => (prev ? { ...prev, isFavorite: updated.isFavorite } : null));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRate = async (id: string, rating: number) => {
    try {
      await ratePost(id, rating);
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, rating } : p))
      );
      if (activePost?.id === id) {
        setActivePost((prev) => (prev ? { ...prev, rating } : null));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this post?')) return;
    try {
      await deletePostApi(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      if (activePost?.id === id) setActivePost(null);
    } catch (err) {
      console.error(err);
    }
  };

  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Creations Gallery</span>
            <span className="text-xs font-bold text-slate-400">({total})</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse, filter, preview, and download all generated commercial assets.
          </p>
        </div>

        <Link
          href="/dashboard/studio"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow-md shadow-brand-600/20"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Generation</span>
        </Link>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product, headline or style..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Favorites only switch */}
          <button
            type="button"
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition shrink-0 ${
              favoritesOnly
                ? 'bg-amber-400/20 border-amber-400 text-amber-600 dark:text-amber-300'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-current' : ''}`} />
            <span>Favorites Only</span>
          </button>
        </div>

        {/* Channel & Style filter tags */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1">
            Channel:
          </span>
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlatform(p.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                platform === p.id
                  ? 'bg-brand-600 text-white font-semibold'
                  : 'bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1">
            Style:
          </span>
          {STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                style === s.id
                  ? 'bg-brand-600 text-white font-semibold'
                  : 'bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* GALLERY GRID */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="aspect-square rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-16 text-center bg-slate-50 dark:bg-slate-900/30">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-500 dark:text-brand-400 flex items-center justify-center mx-auto mb-3">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No creations match your filters</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Try resetting your search query or channel filters, or create a brand new design.
          </p>
          <button
            onClick={() => {
              setPlatform('all');
              setStyle('all');
              setSearch('');
              setFavoritesOnly(false);
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold transition"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => setActivePost(post)}
              className="group relative rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 transition flex flex-col cursor-pointer shadow-sm dark:shadow-lg hover:shadow-brand-500/10"
            >
              <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt={post.title || post.userPrompt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    No Image
                  </div>
                )}

                {/* Top Badges */}
                <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-white border border-white/10">
                    {post.platform || 'Social'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(post.id);
                    }}
                    className={`p-1.5 rounded-full backdrop-blur-md transition ${
                      post.isFavorite
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/40'
                        : 'bg-black/60 text-white/80 hover:text-white'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${post.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Hover overlay actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-black/80 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md border border-white/10">
                    <Eye className="w-3.5 h-3.5" />
                    Inspect
                  </span>
                </div>
              </div>

              <div className="p-3.5 flex flex-col justify-between flex-1 gap-2">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {post.title || post.productName || post.userPrompt}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {post.style ? `Style: ${post.style}` : post.userPrompt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div onClick={(e) => e.stopPropagation()}>
                    <StarsRating
                      initialRating={post.rating}
                      size="sm"
                      onRate={(r) => handleRate(post.id, r)}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIGHTBOX / INSPECTOR MODAL */}
      {activePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col md:flex-row">
            {/* Close button */}
            <button
              onClick={() => setActivePost(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black text-white transition border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Image Viewport */}
            <div className="md:w-1/2 aspect-square md:aspect-auto bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4">
              {activePost.imageUrl && (
                <img
                  src={activePost.imageUrl}
                  alt={activePost.title || 'Preview'}
                  className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
                />
              )}
            </div>

            {/* Right Details Panel */}
            <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-500/30">
                    {activePost.platform || 'Instagram'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {activePost.style || 'Luxury'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {activePost.aspectRatio || '1:1'}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {activePost.title || activePost.productName || activePost.userPrompt}
                </h2>

                {activePost.headline && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Campaign Headline
                    </span>
                    <p className="text-xs font-semibold text-brand-600 dark:text-brand-300">"{activePost.headline}"</p>
                  </div>
                )}

                {/* Rating component */}
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block">AI Style Memory Rating:</span>
                  <StarsRating
                    initialRating={activePost.rating}
                    onRate={(r) => handleRate(activePost.id, r)}
                    size="md"
                    showLabel
                  />
                </div>

                {/* Synthesized Brief */}
                {activePost.finalPrompt && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Art Director Prompt:
                      </span>
                      <button
                        onClick={() => copyPrompt(activePost.finalPrompt || '')}
                        className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                      >
                        {copiedPrompt ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedPrompt ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-mono leading-relaxed max-h-28 overflow-y-auto">
                      {activePost.finalPrompt}
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Action Bar */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  onClick={() => handleDelete(activePost.id)}
                  className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/40 transition"
                  title="Delete post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleFavorite(activePost.id)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                      activePost.isFavorite
                        ? 'bg-amber-400 text-slate-950 shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:text-white'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${activePost.isFavorite ? 'fill-current' : ''}`} />
                    <span>{activePost.isFavorite ? 'Saved' : 'Favorite'}</span>
                  </button>

                  {activePost.imageUrl && (
                    <a
                      href={activePost.imageUrl}
                      download={`social-yolo-${activePost.id}.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-brand-600/20"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
