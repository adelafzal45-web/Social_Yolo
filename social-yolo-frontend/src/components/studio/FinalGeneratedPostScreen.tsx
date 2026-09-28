'use client';

import React, { useState } from 'react';
import {
  Download,
  Star,
  RefreshCw,
  Edit3,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { StarsRating } from '@/components/ui/StarsRating';

export interface FinalPostResult {
  id: string;
  postId: string;
  platform: string;
  aspectRatio: string;
  imageUrl: string;
  headline: string;
  bodyCopy: string;
  cta?: string;
  hashtags?: string[];
  rating?: number | null;
  isFavorite?: boolean;
}

interface FinalGeneratedPostScreenProps {
  posts: FinalPostResult[];
  onRatePost: (postId: string, rating: number) => void;
  onToggleFavorite: (postId: string) => void;
  onRegenerate: () => void;
  onUpdatePostCopy: (postId: string, headline: string, bodyCopy: string) => void;
  onCreateAnother: () => void;
}

export function FinalGeneratedPostScreen({
  posts,
  onRatePost,
  onToggleFavorite,
  onRegenerate,
  onUpdatePostCopy,
  onCreateAnother,
}: FinalGeneratedPostScreenProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const currentPost = posts[selectedIdx] || posts[0];

  const [isEditing, setIsEditing] = useState(false);
  const [editHeadline, setEditHeadline] = useState(currentPost?.headline || '');
  const [editBody, setEditBody] = useState(currentPost?.bodyCopy || '');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Sync edit state when active post changes
  React.useEffect(() => {
    if (currentPost) {
      setEditHeadline(currentPost.headline || '');
      setEditBody(currentPost.bodyCopy || '');
      setIsEditing(false);
    }
  }, [selectedIdx, currentPost]);

  if (!currentPost) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveCopy = () => {
    onUpdatePostCopy(currentPost.postId, editHeadline, editBody);
    setIsEditing(false);
  };

  const hashtagsList =
    currentPost.hashtags?.length
      ? currentPost.hashtags
      : [
          `#${currentPost.platform.toLowerCase()}`,
          '#socialyolo',
          '#commercialcreative',
          '#marketing',
          '#brandgrowth',
        ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>AI GENERATION COMPLETE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Your Final Creative is Ready
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Download high-resolution assets, refine the generated copy, or bookmark this post.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCreateAnother}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
          >
            Create Another Post
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 text-xs font-bold transition shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate</span>
          </button>
        </div>
      </div>

      {/* Variation Switcher Tabs (if more than 1 variation) */}
      {posts.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-500 mr-2">Variations:</span>
          {posts.map((p, idx) => (
            <button
              key={p.id || idx}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                selectedIdx === idx
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              Variation {idx + 1}
            </button>
          ))}
        </div>
      )}

      {/* Main Grid: Left Visual Post Display / Right Copy & Refinements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visual Post Display */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-2xl flex items-center justify-center group">
            {/* Top Badges */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-black/75 backdrop-blur-md text-white border border-white/10 shadow-lg">
                {currentPost.platform}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md text-white border border-white/10 shadow-lg">
                {currentPost.aspectRatio}
              </span>
            </div>

            {/* Top Right Quick Actions */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleFavorite(currentPost.postId)}
                title={currentPost.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                className={`p-2 rounded-full backdrop-blur-md transition border shadow-lg ${
                  currentPost.isFavorite
                    ? 'bg-amber-500 text-white border-amber-400'
                    : 'bg-black/60 text-white hover:bg-black/80 border-white/10'
                }`}
              >
                <Star className={`w-4 h-4 ${currentPost.isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Generated Image */}
            <div className="w-full flex items-center justify-center p-2 bg-slate-950">
              <img
                src={currentPost.imageUrl}
                alt={currentPost.headline || 'Generated Post'}
                className="max-h-[600px] w-auto object-contain rounded-2xl shadow-inner transition-transform duration-300"
              />
            </div>
          </div>

          {/* Quick Rating Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Rate this generation:
            </span>
            <StarsRating
              initialRating={currentPost.rating || null}
              onRate={(val) => onRatePost(currentPost.postId, val)}
            />
          </div>
        </div>

        {/* Right Column: Copy & Actions */}
        <div className="lg:col-span-5 space-y-5">
          {/* Download Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50/50 dark:from-brand-950/40 dark:to-slate-900 border border-brand-200 dark:border-brand-900/60 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                Download Post
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                8K Ready
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={currentPost.imageUrl}
                download={`social-yolo-${currentPost.platform.toLowerCase()}-${Date.now()}.png`}
                className="py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </a>
              <a
                href={currentPost.imageUrl}
                download={`social-yolo-${currentPost.platform.toLowerCase()}-${Date.now()}.jpg`}
                className="py-3 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 transition"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Download JPG</span>
              </a>
            </div>
          </div>

          {/* Copy & Caption Card with Refinement */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Generated Copy &amp; Caption
              </span>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Refine Copy</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCopy}
                    className="px-2.5 py-1 rounded-lg bg-brand-600 text-white text-xs font-bold"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>

            {/* Headline */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-500">Headline</span>
                <button
                  type="button"
                  onClick={() => handleCopy(currentPost.headline, 'headline')}
                  className="text-[11px] text-slate-500 hover:text-brand-600 flex items-center gap-1"
                >
                  {copiedField === 'headline' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'headline' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {isEditing ? (
                <input
                  type="text"
                  value={editHeadline}
                  onChange={(e) => setEditHeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              ) : (
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  {currentPost.headline || 'Special Release'}
                </h4>
              )}
            </div>

            {/* Body / Caption */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-500">Caption / Description</span>
                <button
                  type="button"
                  onClick={() => handleCopy(currentPost.bodyCopy, 'body')}
                  className="text-[11px] text-slate-500 hover:text-brand-600 flex items-center gap-1"
                >
                  {copiedField === 'body' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'body' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {isEditing ? (
                <textarea
                  rows={4}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 resize-none"
                />
              ) : (
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
                  {currentPost.bodyCopy}
                </p>
              )}
            </div>

            {/* Hashtags */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-500">Hashtags</span>
                <button
                  type="button"
                  onClick={() => handleCopy(hashtagsList.join(' '), 'hashtags')}
                  className="text-[11px] text-slate-500 hover:text-brand-600 flex items-center gap-1"
                >
                  {copiedField === 'hashtags' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'hashtags' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5">
                {hashtagsList.map((tag) => (
                  <span key={tag} className="text-[11px] font-medium text-brand-600 dark:text-brand-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
