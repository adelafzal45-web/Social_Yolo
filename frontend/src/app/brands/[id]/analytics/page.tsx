'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  BarChart2,
  TrendingUp,
  Sparkles,
  ArrowLeft,
  Loader2,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  MousePointer,
  RefreshCw,
  Plus,
  CheckCircle2,
  Lightbulb,
  Building2,
  Check,
} from 'lucide-react';
import {
  getBrandByIdApi,
  getBrandAnalyticsOverviewApi,
  getBrandPerformanceInsightsApi,
  generateBrandInsightsApi,
  recordPostMetricsApi,
} from '@/lib/api';
import {
  BrandProfile,
  BrandAnalyticsOverview,
  ContentPerformanceInsight,
  PostMetric,
  Post,
} from '@/lib/types';
import { useNotification } from '@/context/NotificationContext';

export default function BrandAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const brandId = resolvedParams.id;
  const { toast } = useNotification();

  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [overview, setOverview] = useState<BrandAnalyticsOverview | null>(null);
  const [insights, setInsights] = useState<ContentPerformanceInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  // Record metrics modal
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [impressionsInput, setImpressionsInput] = useState<number>(0);
  const [reachInput, setReachInput] = useState<number>(0);
  const [likesInput, setLikesInput] = useState<number>(0);
  const [commentsInput, setCommentsInput] = useState<number>(0);
  const [sharesInput, setSharesInput] = useState<number>(0);
  const [clicksInput, setClicksInput] = useState<number>(0);
  const [savingMetrics, setSavingMetrics] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [b, ov, ins] = await Promise.all([
          getBrandByIdApi(brandId),
          getBrandAnalyticsOverviewApi(brandId),
          getBrandPerformanceInsightsApi(brandId),
        ]);
        setBrand(b);
        setOverview(ov);
        setInsights(ins);
      } catch (err: any) {
        toast('Failed to load brand analytics', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [brandId]);

  const handleGenerateInsights = async () => {
    setGeneratingInsights(true);
    try {
      const fresh = await generateBrandInsightsApi(brandId);
      setInsights(fresh);
      toast('Synthesized fresh performance learning patterns!', 'success');
    } catch (err: any) {
      toast('Failed to generate insights', 'error');
    } finally {
      setGeneratingInsights(false);
    }
  };

  const openRecordModal = (post: Post & { metrics?: PostMetric | null }) => {
    setSelectedPost(post);
    setImpressionsInput(post.metrics?.impressions || 0);
    setReachInput(post.metrics?.reach || 0);
    setLikesInput(post.metrics?.likes || 0);
    setCommentsInput(post.metrics?.comments || 0);
    setSharesInput(post.metrics?.shares || 0);
    setClicksInput(post.metrics?.clicks || 0);
  };

  const handleSaveMetrics = async () => {
    if (!selectedPost) return;
    setSavingMetrics(true);
    try {
      await recordPostMetricsApi(selectedPost.id, {
        impressions: impressionsInput,
        reach: reachInput,
        likes: likesInput,
        comments: commentsInput,
        shares: sharesInput,
        clicks: clicksInput,
      });
      // Reload overview
      const updatedOverview = await getBrandAnalyticsOverviewApi(brandId);
      setOverview(updatedOverview);
      setSelectedPost(null);
      toast('Metrics recorded! Engine updated its context weighting.', 'success');
    } catch (err: any) {
      toast('Failed to record metrics', 'error');
    } finally {
      setSavingMetrics(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="text-gray-500 font-medium">Loading performance analytics & feedback loop...</p>
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
                {displayName} Performance Intelligence
              </h1>
              <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-semibold">
                Feedback Loop Active
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              SocialYolo continuously analyzes engagement and CTR patterns to refine tone, hooks, and formats for future generations.
            </p>
          </div>

          <button
            type="button"
            disabled={generatingInsights}
            onClick={handleGenerateInsights}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs transition shadow-sm"
          >
            {generatingInsights ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Extract Fresh Insights
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Total Posts
          </span>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {overview?.totalPosts || 0}
          </div>
          <p className="text-[11px] text-gray-400">Created from brand DNA</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Tracked Impressions
          </span>
          <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">
            {(overview?.totalImpressions || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-400">Total verified views</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Total Interactions
          </span>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {(overview?.totalInteractions || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-400">Likes, comments & shares</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Avg Engagement Rate
          </span>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {overview?.avgEngagementRate ? `${overview.avgEngagementRate}%` : '—'}
          </div>
          <p className="text-[11px] text-gray-400">Across active platforms</p>
        </div>
      </div>

      {/* AI Performance Insights / Learning Patterns */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Autonomous Performance Learning Patterns ({insights.length})
        </h2>

        {insights.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-dashed border-gray-300 dark:border-slate-800 text-center max-w-lg mx-auto space-y-3">
            <p className="text-sm text-gray-500">
              No learning insights compiled yet. Record metrics for your posts or click "Extract Fresh Insights".
            </p>
            <button
              type="button"
              onClick={handleGenerateInsights}
              className="px-4 py-2 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 font-semibold text-xs rounded-xl"
            >
              Analyze Initial Patterns
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {insights.map((ins) => (
              <div
                key={ins.id}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                    {ins.patternType.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    Confidence: {Math.round(ins.confidence * 100)}%
                  </span>
                </div>

                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-relaxed">
                  {ins.insight}
                </p>

                {ins.recommendations && ins.recommendations.length > 0 && (
                  <div className="pt-2 border-t border-gray-100 dark:border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Context Directives Applied to New Content:
                    </span>
                    <ul className="space-y-1">
                      {ins.recommendations.map((rec, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Posts Performance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Post Analytics & Performance Tracking
          </h3>
          <span className="text-xs text-gray-500">
            Record real metrics to calibrate the intelligence engine
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-slate-800/60 text-gray-500 dark:text-gray-400 uppercase font-semibold">
              <tr>
                <th className="p-4">Post / Hook</th>
                <th className="p-4">Platform</th>
                <th className="p-4 text-right">Impressions</th>
                <th className="p-4 text-right">Interactions</th>
                <th className="p-4 text-right">CTR</th>
                <th className="p-4 text-right">Engagement</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {overview?.postsWithMetrics?.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-4 font-medium text-gray-900 dark:text-white max-w-xs truncate">
                    {post.headline || post.title || 'Untitled Post'}
                  </td>
                  <td className="p-4 uppercase font-semibold text-purple-600">
                    {post.platform}
                  </td>
                  <td className="p-4 text-right font-mono">
                    {post.metrics?.impressions?.toLocaleString() || 0}
                  </td>
                  <td className="p-4 text-right font-mono">
                    {(
                      (post.metrics?.likes || 0) +
                      (post.metrics?.comments || 0) +
                      (post.metrics?.shares || 0)
                    ).toLocaleString()}
                  </td>
                  <td className="p-4 text-right font-mono text-gray-500">
                    {post.metrics?.ctr ? `${post.metrics.ctr}%` : '—'}
                  </td>
                  <td className="p-4 text-right font-mono font-semibold text-emerald-600">
                    {post.metrics?.engagementRate ? `${post.metrics.engagementRate}%` : '—'}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => openRecordModal(post)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 font-semibold text-xs transition"
                    >
                      Update Metrics
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Metrics Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Record Post Performance
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              "{selectedPost.headline || selectedPost.title}"
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Impressions
                </label>
                <input
                  type="number"
                  min="0"
                  value={impressionsInput}
                  onChange={(e) => setImpressionsInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Reach
                </label>
                <input
                  type="number"
                  min="0"
                  value={reachInput}
                  onChange={(e) => setReachInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Likes / Reactions
                </label>
                <input
                  type="number"
                  min="0"
                  value={likesInput}
                  onChange={(e) => setLikesInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Comments
                </label>
                <input
                  type="number"
                  min="0"
                  value={commentsInput}
                  onChange={(e) => setCommentsInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Shares
                </label>
                <input
                  type="number"
                  min="0"
                  value={sharesInput}
                  onChange={(e) => setSharesInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Clicks
                </label>
                <input
                  type="number"
                  min="0"
                  value={clicksInput}
                  onChange={(e) => setClicksInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="px-4 py-2 rounded-xl text-xs text-gray-500 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingMetrics}
                onClick={handleSaveMetrics}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
              >
                {savingMetrics ? 'Saving...' : 'Save & Calibrate Engine'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
