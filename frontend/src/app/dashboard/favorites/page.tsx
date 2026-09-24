'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, Download, Sparkles, ArrowRight, Eye, Trash2 } from 'lucide-react';
import { getFavoritePosts, toggleFavoritePost, ratePost } from '@/lib/api';
import { Post } from '@/lib/types';
import { StarsRating } from '@/components/ui/StarsRating';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const items = await getFavoritePosts();
      setFavorites(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleToggleFavorite = async (id: string) => {
    try {
      await toggleFavoritePost(id);
      setFavorites((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRate = async (id: string, rating: number) => {
    try {
      await ratePost(id, rating);
      setFavorites((prev) =>
        prev.map((p) => (p.id === id ? { ...p, rating } : p))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Favorite Creations</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-400/30">
              {favorites.length} Saved
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Your personal moodboard and high-performing commercial assets saved for fast reference.
          </p>
        </div>

        <Link
          href="/dashboard/studio"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow-md shadow-brand-600/20"
        >
          <Sparkles className="w-4 h-4" />
          <span>Create New</span>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="aspect-square rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-16 text-center bg-slate-50 dark:bg-slate-900/30">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-500 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
            <Star className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No favorited posts yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Click the star icon on any post in your Studio or Gallery to save it here.
          </p>
          <Link
            href="/dashboard/gallery"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold transition"
          >
            Explore Gallery &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {favorites.map((post) => (
            <div
              key={post.id}
              className="group relative rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 transition flex flex-col shadow-sm dark:shadow-lg"
            >
              <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt={post.title || post.userPrompt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}

                <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-white border border-white/10">
                    {post.platform || 'Social'}
                  </span>
                  <button
                    onClick={() => handleToggleFavorite(post.id)}
                    className="p-1.5 rounded-full bg-amber-400 text-slate-950 shadow-md shadow-amber-400/40 hover:scale-110 transition"
                    title="Remove from favorites"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>

                {post.imageUrl && (
                  <a
                    href={post.imageUrl}
                    download={`social-yolo-${post.id}.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2.5 right-2.5 p-2 rounded-xl bg-black/80 hover:bg-black text-white opacity-0 group-hover:opacity-100 transition backdrop-blur-md"
                    title="Download image"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                  </a>
                )}
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
                  <StarsRating
                    initialRating={post.rating}
                    size="sm"
                    onRate={(r) => handleRate(post.id, r)}
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
