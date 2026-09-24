'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lightbulb,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  Share2,
  Palette,
  CheckCircle2,
  Building2,
  Loader2,
  Filter,
  ExternalLink,
} from 'lucide-react';
import {
  getBrandProfilesApi,
  listConceptsApi,
  generateConceptsApi,
  deleteConceptApi,
} from '@/lib/api';
import { BrandProfile, ContentConcept } from '@/lib/types';
import { useNotification } from '@/context/NotificationContext';

function ConceptsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useNotification();

  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [concepts, setConcepts] = useState<ContentConcept[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateTheme, setGenerateTheme] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // Load brands on mount
  useEffect(() => {
    async function loadBrands() {
      try {
        setLoading(true);
        const data = await getBrandProfilesApi();
        setBrands(data);

        const paramBrandId = searchParams.get('brandId');
        if (paramBrandId && data.some((b) => b.id === paramBrandId)) {
          setSelectedBrandId(paramBrandId);
        } else if (data.length > 0) {
          const def = data.find((b) => b.isDefault) || data[0];
          setSelectedBrandId(def.id);
        }
      } catch (err) {
        toast('Failed to load brands', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadBrands();
  }, [searchParams]);

  // Load concepts for the selected brand
  useEffect(() => {
    if (!selectedBrandId) {
      setConcepts([]);
      return;
    }

    async function loadConcepts() {
      try {
        setLoading(true);
        const data = await listConceptsApi(selectedBrandId);
        setConcepts(data);
      } catch (err: any) {
        toast('Failed to load concepts for brand', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadConcepts();
  }, [selectedBrandId]);

  const handleGenerate = async () => {
    if (!selectedBrandId) return;

    setGenerating(true);
    try {
      const generated = await generateConceptsApi(selectedBrandId, {
        count: 5,
        theme: generateTheme.trim() || undefined,
      });
      setConcepts((prev) => [...generated, ...prev]);
      setShowGenerateModal(false);
      setGenerateTheme('');
      toast(`Generated ${generated.length} fresh creative concepts!`, 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to generate concepts', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteConceptApi(id);
      setConcepts((prev) => prev.filter((c) => c.id !== id));
      toast('Concept deleted', 'info');
    } catch (err: any) {
      toast('Failed to delete concept', 'error');
    }
  };

  const selectedBrand = brands.find((b) => b.id === selectedBrandId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 rounded-full text-xs font-semibold mb-2">
            <Lightbulb className="w-3.5 h-3.5" />
            Creative Strategy Engine
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Content Concepts
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Autonomous marketing hooks, creative angles, and visual directions derived from your brand DNA.
          </p>
        </div>

        {/* Brand Selector & Generate Action */}
        <div className="flex flex-wrap items-center gap-3">
          {brands.length > 0 && (
            <div className="relative">
              <select
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none pr-8"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.brandName || b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            disabled={!selectedBrandId || generating}
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm transition shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Generate Concepts
          </button>
        </div>
      </div>

      {/* Generation Theme Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Generate Strategy Concepts
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              SocialYolo will synthesize {selectedBrand?.brandName || 'your brand'}’s value proposition, products, and target audience to formulate 5 distinct campaign concepts.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Optional Theme / Focus <span className="text-gray-400 font-normal">(e.g. Weekend Flash Sale, Ramadan Special, Spring Drop)</span>
              </label>
              <input
                type="text"
                value={generateTheme}
                onChange={(e) => setGenerateTheme(e.target.value)}
                placeholder="Leave blank for general brand spotlight"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={generating}
                onClick={handleGenerate}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate 5 Concepts
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-sm text-gray-500">Loading creative concepts...</p>
        </div>
      ) : concepts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-300 dark:border-slate-800 p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center mx-auto text-amber-500">
            <Lightbulb className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            No Concepts Generated Yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Let the Intelligence Engine analyze {selectedBrand?.brandName || 'your brand'} and formulate creative hooks and campaign angles.
          </p>
          <button
            type="button"
            disabled={generating || !selectedBrandId}
            onClick={() => handleGenerate()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm transition shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Generate Initial Concepts
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {concepts.map((concept) => (
            <div
              key={concept.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                    Concept
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(concept.id)}
                    className="text-gray-400 hover:text-red-500 transition p-1"
                    title="Delete concept"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Title & Hook */}
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                    {concept.title}
                  </h3>
                  {concept.hook && (
                    <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mt-1 italic">
                      "{concept.hook}"
                    </p>
                  )}
                </div>

                {/* Concept Narrative */}
                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-4 leading-relaxed">
                  {concept.concept}
                </p>

                {/* Angle */}
                {concept.angle && (
                  <div className="p-2.5 bg-gray-50 dark:bg-slate-800/60 rounded-xl text-[11px] text-gray-700 dark:text-gray-300">
                    <strong className="text-gray-900 dark:text-white">Creative Angle:</strong> {concept.angle}
                  </div>
                )}

                {/* Platforms & Visual Style */}
                <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-slate-800">
                  {concept.platforms && concept.platforms.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">Best On:</span>
                      {concept.platforms.map((p, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-[11px] font-medium text-gray-700 dark:text-gray-300"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

                  {concept.visualDirection?.style && (
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                      <Palette className="w-3.5 h-3.5 text-purple-500" />
                      <span>{concept.visualDirection.style}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={`/content/create?brandId=${concept.brandId}&conceptId=${concept.id}`}
                className="w-full py-2.5 px-4 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition"
              >
                <span>Use Concept to Create Post</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ConceptsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-gray-500 font-medium">Loading Concepts Engine...</p>
        </div>
      }
    >
      <ConceptsContent />
    </Suspense>
  );
}
