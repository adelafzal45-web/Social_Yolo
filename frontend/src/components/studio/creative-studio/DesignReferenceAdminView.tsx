'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Plus,
  ExternalLink,
  Sparkles,
  Palette,
  Type,
  Filter,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { DesignReference } from '@/lib/types';
import { listDesignReferencesApi, createDesignReferenceApi } from '@/lib/api';

export function DesignReferenceAdminView() {
  const [references, setReferences] = useState<DesignReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Reference form state
  const [newTitle, setNewTitle] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newSource, setNewSource] = useState('internal_library');
  const [newIndustry, setNewIndustry] = useState('tech');
  const [newStyle, setNewStyle] = useState('Minimalist Modern');
  const [isSaving, setIsSaving] = useState(false);

  const fetchReferences = async () => {
    setIsLoading(true);
    try {
      const filters: any = {};
      if (selectedIndustry !== 'all') filters.industry = selectedIndustry;
      if (selectedStyle !== 'all') filters.style = selectedStyle;
      const data = await listDesignReferencesApi(filters);
      setReferences(data || []);
    } catch (err) {
      console.error('Failed to load visual references', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferences();
  }, [selectedIndustry, selectedStyle]);

  const handleCreateReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newImageUrl.trim()) return;

    setIsSaving(true);
    try {
      await createDesignReferenceApi({
        title: newTitle.trim(),
        imageUrl: newImageUrl.trim(),
        source: newSource,
        industry: newIndustry,
        style: newStyle,
        qualityScore: 95,
        licenseType: 'curated',
      });
      setShowAddModal(false);
      setNewTitle('');
      setNewImageUrl('');
      fetchReferences();
    } catch (err) {
      console.error('Failed to save design reference', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Layers className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Visual RAG Design Intelligence Library
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Curated repository of high-performing design references used by the vector similarity engine to synthesize original compositions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Design Reference</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        <select
          value={selectedIndustry}
          onChange={(e) => setSelectedIndustry(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
        >
          <option value="all">All Industries</option>
          <option value="tech">Technology / SaaS</option>
          <option value="fashion">Fashion &amp; Apparel</option>
          <option value="fitness">Fitness &amp; Wellness</option>
          <option value="food">Food &amp; Beverage</option>
          <option value="finance">Finance &amp; B2B</option>
        </select>

        <select
          value={selectedStyle}
          onChange={(e) => setSelectedStyle(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
        >
          <option value="all">All Styles</option>
          <option value="Minimalist Modern">Minimalist Modern</option>
          <option value="Luxury Premium">Luxury Premium</option>
          <option value="Bold Vibrant">Bold Vibrant</option>
          <option value="Editorial Magazine">Editorial Magazine</option>
          <option value="Tech Futuristic">Tech Futuristic</option>
        </select>

        <span className="ml-auto text-slate-400 text-xs">
          Showing {references.length} indexed references
        </span>
      </div>

      {/* References Grid */}
      {isLoading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
          <p className="text-xs text-slate-500">Querying Visual RAG embeddings...</p>
        </div>
      ) : references.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
          No design references found for the selected criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {references.map((ref) => (
            <div
              key={ref.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
            >
              {/* Image Preview */}
              <div className="aspect-[4/5] bg-slate-100 dark:bg-slate-950 relative overflow-hidden group">
                <img
                  src={ref.imageUrl}
                  alt={ref.title}
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                />
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-slate-950/70 backdrop-blur-sm text-[10px] font-bold text-white uppercase">
                  {ref.source.replace('_', ' ')}
                </span>
              </div>

              {/* Details */}
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                    {ref.title}
                  </h4>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {ref.style && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
                        {ref.style}
                      </span>
                    )}
                    {ref.industry && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {ref.industry}
                      </span>
                    )}
                  </div>
                </div>

                {/* Color swatches if any */}
                {ref.colorPalette && ref.colorPalette.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Palette className="w-3 h-3 text-slate-400" />
                    <div className="flex items-center gap-1">
                      {ref.colorPalette.slice(0, 4).map((c, i) => (
                        <span
                          key={i}
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <span className="ml-auto text-[10px] font-mono text-emerald-500 font-bold">
                      QA {ref.qualityScore || 95}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Reference Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Index New Design Reference
            </h3>
            <form onSubmit={handleCreateReference} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Modern Minimalist SaaS Hero"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  required
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Industry
                  </label>
                  <select
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium"
                  >
                    <option value="tech">Tech / SaaS</option>
                    <option value="fashion">Fashion</option>
                    <option value="fitness">Fitness</option>
                    <option value="food">Food</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Style
                  </label>
                  <select
                    value={newStyle}
                    onChange={(e) => setNewStyle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium"
                  >
                    <option value="Minimalist Modern">Minimalist Modern</option>
                    <option value="Luxury Premium">Luxury Premium</option>
                    <option value="Bold Vibrant">Bold Vibrant</option>
                    <option value="Editorial Magazine">Editorial Magazine</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold"
                >
                  {isSaving ? 'Indexing...' : 'Save Reference'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
