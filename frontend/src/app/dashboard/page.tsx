'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Palette,
  CreditCard,
  Zap,
  ArrowRight,
  Star,
  Download,
  Share2,
  CheckCircle2,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getFilteredPosts, getBrandsApi, toggleFavoritePost, ratePost } from '@/lib/api';
import { Post, BrandProfile } from '@/lib/types';
import { StarsRating } from '@/components/ui/StarsRating';

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalPosts, setTotalPosts] = useState<number>(0);
  const [favoriteCount, setFavoriteCount] = useState<number>(0);
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [postsRes, brandsRes] = await Promise.all([
        getFilteredPosts({ limit: 8 }),
        getBrandsApi().catch(() => []),
      ]);
      setPosts(postsRes.items);
      setTotalPosts(postsRes.total);
      setFavoriteCount(postsRes.items.filter((p) => p.isFavorite).length);
      setBrands(brandsRes);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleFavorite = async (id: string) => {
    try {
      const updated = await toggleFavoritePost(id);
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isFavorite: updated.isFavorite } : p))
      );
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
    } catch (err) {
      console.error(err);
    }
  };

  const userCredits = user?.credits ?? 50;
  const planTitle = (user?.plan || 'Free Trial').toUpperCase().replace('_', ' ');

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-950/60 via-slate-900 to-indigo-950/40 border border-brand-800/40 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-700 dark:text-brand-300 border border-brand-500/30">
              <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>AI Creative Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Welcome back, {user?.name || 'Creator'} 👋
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
              Generate studio-grade social campaigns in seconds. Simply upload a product or select your style preferences.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/studio"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-500 via-brand-600 to-indigo-600 hover:from-brand-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Studio</span>
            </Link>
            <Link
              href="/dashboard/gallery"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200 font-semibold text-sm border border-slate-200 dark:border-slate-800 shadow-sm transition"
            >
              <span>View Gallery</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* METRIC STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Credits */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Available Credits</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {userCredits}
              <span className="text-xs font-normal text-slate-400">/ 50</span>
            </div>
            <Link
              href="/dashboard/billing"
              className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline transition inline-block pt-1"
            >
              + Top up balance &rarr;
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
            <Zap className="w-6 h-6 fill-amber-400/20" />
          </div>
        </div>

        {/* Total Generated */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Creations</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalPosts}</div>
            <Link
              href="/dashboard/gallery"
              className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline transition inline-block pt-1"
            >
              View all designs &rarr;
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        {/* Brand DNA Profiles */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Brand Profiles</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{brands.length}</div>
            <Link
              href="/dashboard/brands"
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline transition inline-block pt-1"
            >
              Manage Brand DNA &rarr;
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
            <Palette className="w-6 h-6" />
          </div>
        </div>

        {/* Plan Tier */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Current Plan</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white truncate max-w-[140px]">{planTitle}</div>
            <Link
              href="/dashboard/billing"
              className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline transition inline-block pt-1"
            >
              Manage subscription &rarr;
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* QUICK LAUNCHERS GRID */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Create by Channel & Format</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              title: 'Instagram Feed',
              ratio: '1:1 Square',
              icon: '📸',
              href: '/dashboard/studio?platform=instagram&aspectRatio=1:1',
            },
            {
              title: 'TikTok & Reels',
              ratio: '9:16 Vertical',
              icon: '📱',
              href: '/dashboard/studio?platform=tiktok&aspectRatio=9:16',
            },
            {
              title: 'LinkedIn Post',
              ratio: '4:5 Portrait',
              icon: '💼',
              href: '/dashboard/studio?platform=linkedin&aspectRatio=4:5',
            },
            {
              title: 'Facebook Ad',
              ratio: '1:1 Square',
              icon: '👥',
              href: '/dashboard/studio?platform=facebook&aspectRatio=1:1',
            },
            {
              title: 'Pinterest Pin',
              ratio: '9:16 Tall',
              icon: '📌',
              href: '/dashboard/studio?platform=pinterest&aspectRatio=9:16',
            },
            {
              title: 'Twitter / X Banner',
              ratio: '16:9 Landscape',
              icon: '🐦',
              href: '/dashboard/studio?platform=twitter&aspectRatio=16:9',
            },
          ].map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800/80 hover:border-brand-500/40 transition group text-left flex flex-col justify-between shadow-sm"
            >
              <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">
                {item.icon}
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-300 transition">
                  {item.title}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{item.ratio}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* RECENT CREATIONS SHOWCASE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Creations</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Saved in your persistent PostgreSQL gallery.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition"
              title="Refresh creations"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-500' : ''}`} />
            </button>
            <Link
              href="/dashboard/gallery"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              View all ({totalPosts}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="aspect-square rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse border border-slate-200 dark:border-slate-800"
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-slate-50 dark:bg-slate-900/30">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">No posts created yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Get started by generating your first high-converting commercial post in the AI Studio.
            </p>
            <Link
              href="/dashboard/studio"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Generate First Post
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="group relative rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-brand-500/50 transition-all flex flex-col shadow-sm dark:shadow-lg hover:shadow-brand-500/10"
              >
                {/* Image display */}
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

                  {/* Top badges: Platform & Favorite */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/10">
                      {post.platform || 'Instagram'}
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
                      title={post.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`w-3.5 h-3.5 ${post.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Quick download hover overlay */}
                  {post.imageUrl && (
                    <a
                      href={post.imageUrl}
                      download={`social-yolo-${post.id}.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2.5 right-2.5 p-2 rounded-xl bg-black/70 hover:bg-black text-white opacity-0 group-hover:opacity-100 transition backdrop-blur-md shadow-lg"
                      title="Download image"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Card footer details */}
                <div className="p-3.5 flex flex-col justify-between flex-1 gap-2">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {post.title || post.productName || post.userPrompt}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {post.style ? `Style: ${post.style}` : post.userPrompt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
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
    </div>
  );
}
