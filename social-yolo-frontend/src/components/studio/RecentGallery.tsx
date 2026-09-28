'use client';

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Search,
  Download,
  Star,
  Sparkles,
  Calendar,
  Layers,
  Image as ImageIcon,
  Maximize2,
  X,
} from 'lucide-react';
import { getRecentPosts, ratePost } from '@/lib/api';
import { Post } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { StarsRating } from '../ui/StarsRating';

interface RecentGalleryProps {
  refreshTrigger?: number;
  onSelectPrompt?: (prompt: string) => void;
}

export function RecentGallery({ refreshTrigger, onSelectPrompt }: RecentGalleryProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high-rated' | 'unrated'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePost, setActivePost] = useState<Post | null>(null);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const data = await getRecentPosts(30);
      setPosts(data);
    } catch {
      // Backend may be offline or no posts yet
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [refreshTrigger]);

  const handleRate = async (postId: string, rating: number) => {
    try {
      await ratePost(postId, rating);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, rating } : p))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.userPrompt.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === 'high-rated') return (p.rating || 0) >= 4;
    if (filter === 'unrated') return !p.rating;
    return true;
  });

  return (
    <div className="w-full bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-purple-100/90 dark:border-slate-800 shadow-xl transition-colors">
      {/* Lightbox Modal */}
      {activePost && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActivePost(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-square w-full bg-black flex items-center justify-center">
              {activePost.imageUrl ? (
                <img
                  src={activePost.imageUrl}
                  alt={activePost.userPrompt}
                  className="max-h-[70vh] w-auto object-contain"
                />
              ) : (
                <span className="text-slate-500">No Image</span>
              )}
              <button
                onClick={() => setActivePost(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-white space-y-4">
              <div>
                <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">
                  Original Prompt
                </span>
                <p className="text-sm font-semibold mt-1">{activePost.userPrompt}</p>
              </div>

              {activePost.finalPrompt && (
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Synthesized Designer Prompt
                  </span>
                  <p className="text-xs text-slate-300 mt-1 max-h-28 overflow-y-auto bg-slate-800/80 p-3 rounded-xl font-mono whitespace-pre-wrap">
                    {activePost.finalPrompt}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Rating:</span>
                  <StarsRating
                    initialRating={activePost.rating || 0}
                    onRate={(stars) => handleRate(activePost.id, stars)}
                  />
                </div>

                {activePost.imageUrl && (
                  <a
                    href={activePost.imageUrl}
                    download={`post_${activePost.id}.png`}
                    className="py-2 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PNG
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Recent Creations &amp; Style Pool</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Posts rated 4–5★ are actively indexed into your personal vector RAG style pool.
          </p>
        </div>

        <button
          onClick={fetchPosts}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Feed
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recent prompts..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 bg-slate-50/50 dark:bg-slate-950/70 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === 'all'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All ({posts.length})
          </button>
          <button
            onClick={() => setFilter('high-rated')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              filter === 'high-rated'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Star className="w-3 h-3 fill-current" />
            Style Pool (4-5★)
          </button>
          <button
            onClick={() => setFilter('unrated')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === 'unrated'
                ? 'bg-slate-700 dark:bg-slate-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Unrated
          </button>
        </div>
      </div>

      {/* Grid of Posts */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading creations from database...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <ImageIcon className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">No posts found</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            {posts.length === 0
              ? 'No posts in database yet. Generate your first post in the AI Generator tab!'
              : 'No posts match your current search or filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group"
            >
              {/* Image Preview with Hover Buttons */}
              <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-950 overflow-hidden checkerboard-bg">
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt={post.userPrompt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    No image preview
                  </div>
                )}

                {/* Top Rating Badge */}
                <div className="absolute top-2.5 left-2.5">
                  {(post.rating || 0) >= 4 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-md flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> Style Pool
                    </span>
                  ) : post.rating ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800/80 text-white backdrop-blur shadow">
                      {post.rating}★
                    </span>
                  ) : null}
                </div>

                {/* Hover overlay with zoom button */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setActivePost(post)}
                    className="p-2.5 rounded-full bg-white text-slate-900 shadow-lg hover:scale-110 transition"
                    title="Zoom Details"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  {post.imageUrl && (
                    <a
                      href={post.imageUrl}
                      download={`post_${post.id}.png`}
                      className="p-2.5 rounded-full bg-white text-slate-900 shadow-lg hover:scale-110 transition"
                      title="Download PNG"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Card Meta & Rating */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-relaxed">
                    {post.userPrompt}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Rate:</span>
                  <StarsRating
                    initialRating={post.rating || 0}
                    onRate={(stars) => handleRate(post.id, stars)}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
