'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Globe,
  Sparkles,
  RefreshCw,
  Edit3,
  Plus,
  ExternalLink,
  Building2,
  Palette,
  Package,
  Users,
  Target,
  Share2,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  BarChart2,
} from 'lucide-react';
import {
  getBrandByIdApi,
  getBrandInsightsApi,
  reanalyzeBrandApi,
  getAnalysisJobStatusApi,
  updateBrandInsightsApi,
} from '@/lib/api';
import { BrandProfile, BrandInsight } from '@/lib/types';
import { useNotification } from '@/context/NotificationContext';

export default function BrandDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useNotification();
  const brandId = params.id as string;

  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [insight, setInsight] = useState<BrandInsight | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Re-analysis & Refresh Modal state (Spec Section 38)
  const [refreshModalOpen, setRefreshModalOpen] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [refreshDiff, setRefreshDiff] = useState<any | null>(null);

  // Quick Add Product state
  const [addProductModal, setAddProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');

  const loadBrandData = async () => {
    setLoading(true);
    try {
      const b = await getBrandByIdApi(brandId);
      setBrand(b);
      const ins = await getBrandInsightsApi(brandId);
      setInsight(ins);
    } catch (err: any) {
      toast({
        title: 'Error loading brand',
        message: err.message || 'Could not load brand details.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (brandId) loadBrandData();
  }, [brandId]);

  const handleTriggerReanalyze = async () => {
    setReanalyzing(true);
    setRefreshDiff(null);
    try {
      const res = await reanalyzeBrandApi(brandId);
      const poll = setInterval(async () => {
        try {
          const status = await getAnalysisJobStatusApi(res.jobId);
          if (status?.status === 'completed' && status.result) {
            clearInterval(poll);
            setReanalyzing(false);
            // Build diff between existing brand and newly detected
            setRefreshDiff({
              existing: {
                brandName: brand?.brandName || brand?.name,
                description: brand?.description,
                industry: brand?.industry,
                products: insight?.products || [],
              },
              detected: {
                brandName: status.result.brandName,
                description: status.result.description,
                industry: status.result.industry,
                products: status.result.products || [],
              },
            });
          } else if (status?.status === 'failed') {
            clearInterval(poll);
            setReanalyzing(false);
            toast({
              title: 'Re-analysis Failed',
              message: status.error || 'Could not re-analyze website.',
              type: 'error',
            });
          }
        } catch {
          // continue polling
        }
      }, 1500);
    } catch (err: any) {
      setReanalyzing(false);
      toast({
        title: 'Error',
        message: err.message || 'Could not start re-analysis.',
        type: 'error',
      });
    }
  };

  const handleApplyDiff = async (field: string) => {
    if (!refreshDiff?.detected) return;
    try {
      if (field === 'products') {
        const updatedProducts = [
          ...(insight?.products || []),
          ...refreshDiff.detected.products,
        ];
        await updateBrandInsightsApi(brandId, { products: updatedProducts });
      }
      toast({
        title: 'Updated',
        message: `Field ${field} updated from latest website scan.`,
        type: 'success',
      });
      loadBrandData();
      setRefreshModalOpen(false);
    } catch (err: any) {
      toast({
        title: 'Update failed',
        message: err.message,
        type: 'error',
      });
    }
  };

  const handleQuickAddProduct = async () => {
    if (!newProductName.trim()) return;
    try {
      const currentProducts = insight?.products || [];
      const updated = [
        ...currentProducts,
        {
          name: newProductName.trim(),
          category: newProductCategory.trim() || 'General',
        },
      ];
      await updateBrandInsightsApi(brandId, { products: updated });
      toast({
        title: 'Product Added',
        message: `Added "${newProductName}" to brand catalog.`,
        type: 'success',
      });
      setNewProductName('');
      setNewProductCategory('');
      setAddProductModal(false);
      loadBrandData();
    } catch (err: any) {
      toast({
        title: 'Error adding product',
        message: err.message,
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 space-x-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Loading brand intelligence...</span>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
        <h2 className="text-xl font-bold text-foreground">Brand Not Found</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          The requested brand could not be retrieved.
        </p>
        <Link
          href="/brands"
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
        >
          Return to Brands
        </Link>
      </div>
    );
  }

  const displayName = brand.name || brand.brandName || 'Untitled Brand';
  const primaryColor = brand.primaryColor || '#7c5cff';
  const productsList = insight?.products || [];
  const servicesList = insight?.services || [];
  const audienceList = insight?.targetAudience || [];
  const brandVoice = brand.brandVoice || insight?.brandVoice || {};

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Brand Header Banner */}
      <div className="rounded-3xl border border-border/60 bg-card p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: primaryColor }}
        />

        <div className="flex items-center gap-5">
          {brand.logoUrl ? (
            <img
              src={brand.logoUrl}
              alt={displayName}
              className="w-20 h-20 rounded-2xl object-contain bg-background p-2 border border-border/70 shadow-xs shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center font-extrabold text-3xl text-white shadow-xs shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                {displayName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                {brand.status || 'Active'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {brand.industry && (
                <span className="font-semibold text-foreground/80 bg-muted/70 px-2 py-0.5 rounded-md">
                  {brand.industry}
                </span>
              )}
              {brand.websiteUrl && (
                <a
                  href={brand.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-primary transition font-medium"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {brand.websiteUrl.replace(/^https?:\/\//i, '').replace(/\/$/, '')}
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              )}
              {(brand.city || brand.country) && (
                <span>{[brand.city, brand.country].filter(Boolean).join(', ')}</span>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Actions (Spec Section 37) */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <Link
            href={`/content/create?brandId=${brand.id}`}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow hover:bg-primary/90 transition active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            Create Content
          </Link>

          <button
            onClick={() => {
              setRefreshModalOpen(true);
              handleTriggerReanalyze();
            }}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border/70 hover:bg-muted text-xs font-semibold text-foreground transition"
            title="Refresh from Website"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Details
          </button>

          <Link
            href={`/brands/${brand.id}/content`}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-card border border-border/70 hover:border-primary/50 text-xs font-semibold text-foreground transition"
          >
            <Layers className="w-3.5 h-3.5 text-primary" />
            Content
          </Link>

          <Link
            href={`/brands/${brand.id}/inspiration`}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-card border border-border/70 hover:border-primary/50 text-xs font-semibold text-foreground transition"
          >
            <Lightbulb className="w-3.5 h-3.5 text-primary" />
            Inspiration
          </Link>

          <Link
            href={`/brands/${brand.id}/analytics`}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-card border border-border/70 hover:border-primary/50 text-xs font-semibold text-foreground transition"
          >
            <BarChart2 className="w-3.5 h-3.5 text-primary" />
            Analytics
          </Link>

          <Link
            href={`/brands/${brand.id}/settings`}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border/70 hover:bg-muted text-xs font-semibold text-foreground transition"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Brand
          </Link>

          <Link
            href={`/content/create?brandId=${brand.id}`}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white shadow-sm transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Create Content
          </Link>
        </div>
      </div>

      {/* Main Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Brand Knowledge (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Value Proposition & Description */}
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Brand Positioning & Value Proposition
            </h2>
            <p className="text-base font-semibold text-foreground leading-snug">
              {insight?.valueProposition || brand.tagline || 'Leading innovation with exceptional craftsmanship.'}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {insight?.companyDescription || brand.description || 'No detailed description recorded.'}
            </p>
          </div>

          {/* Products & Services with Quick Add */}
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
                  Products & Catalog ({productsList.length})
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Automatically fed into post generation when product is selected
                </p>
              </div>

              <button
                onClick={() => setAddProductModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Product
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {productsList.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-background border border-border/70 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">{p.name}</span>
                    {p.category && (
                      <span className="text-[10px] font-semibold text-primary px-2 py-0.5 bg-primary/10 rounded-md">
                        {p.category}
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {p.description}
                    </p>
                  )}
                </div>
              ))}
              {productsList.length === 0 && (
                <div className="sm:col-span-2 text-center py-6 text-xs text-muted-foreground border border-dashed border-border/70 rounded-xl">
                  No products added yet. Click &quot;Add Product&quot; to build your catalog.
                </div>
              )}
            </div>

            {servicesList.length > 0 && (
              <div className="pt-4 border-t border-border/40 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Services Offered ({servicesList.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {servicesList.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-foreground"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Target Audience & Market Signals */}
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Target Audience & Key Demographics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {audienceList.map((aud, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-background border border-border/70 space-y-1"
                >
                  <div className="font-bold text-xs text-foreground flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    {aud.segment}
                  </div>
                  {aud.description && (
                    <p className="text-xs text-muted-foreground">{aud.description}</p>
                  )}
                </div>
              ))}
              {audienceList.length === 0 && (
                <div className="sm:col-span-2 text-xs text-muted-foreground italic">
                  General consumer audience inferred from website content.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Visual DNA & Performance Signals (1 col) */}
        <div className="space-y-8">
          {/* Visual Identity DNA */}
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Brand Palette & Colors
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-border/70">
                <span className="text-xs font-medium text-foreground">Primary Color</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full border border-black/20"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <span className="text-xs font-mono font-bold text-foreground">
                    {primaryColor}
                  </span>
                </div>
              </div>

              {brand.secondaryColors?.map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-border/70"
                >
                  <span className="text-xs font-medium text-foreground">Secondary {idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full border border-black/20"
                      style={{ backgroundColor: c }}
                    />
                    <span className="text-xs font-mono font-bold text-foreground">{c}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inferred Brand Voice Profile */}
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Brand Voice Profile
            </h2>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-background border border-border/70">
                <span className="text-muted-foreground uppercase text-[10px] font-bold block mb-1">
                  Tone
                </span>
                <span className="font-semibold text-foreground">
                  {brandVoice?.tone?.join(', ') || brand.tone || 'Warm & Modern'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-background border border-border/70">
                <span className="text-muted-foreground uppercase text-[10px] font-bold block mb-1">
                  Formality
                </span>
                <span className="font-semibold text-foreground capitalize">
                  {brandVoice?.formality || 'Medium'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-background border border-border/70">
                <span className="text-muted-foreground uppercase text-[10px] font-bold block mb-1">
                  Humor
                </span>
                <span className="font-semibold text-foreground capitalize">
                  {brandVoice?.humor || 'Low'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-background border border-border/70">
                <span className="text-muted-foreground uppercase text-[10px] font-bold block mb-1">
                  Technicality
                </span>
                <span className="font-semibold text-foreground capitalize">
                  {brandVoice?.technicality || 'Medium'}
                </span>
              </div>
            </div>
          </div>

          {/* Social Media Integration */}
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Social Profiles Connected
            </h2>

            <div className="space-y-2">
              {brand.socialLinks && Object.keys(brand.socialLinks).length > 0 ? (
                Object.entries(brand.socialLinks).map(([network, url]) => (
                  <div
                    key={network}
                    className="flex items-center justify-between p-2 rounded-xl bg-background border border-border/70 text-xs"
                  >
                    <span className="font-semibold capitalize text-foreground">{network}</span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline truncate max-w-40"
                    >
                      {url.replace(/^https?:\/\//i, '')}
                    </a>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground italic py-2">
                  No social profiles detected from website scan.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* REFRESH BRAND DETAILS MODAL (Spec Section 38) */}
      {refreshModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <div className="flex items-center gap-3">
                <RefreshCw className={`w-5 h-5 text-primary ${reanalyzing ? 'animate-spin' : ''}`} />
                <h3 className="text-lg font-bold text-foreground">Refresh Brand Details</h3>
              </div>
              <button
                onClick={() => setRefreshModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold"
              >
                Close
              </button>
            </div>

            {reanalyzing ? (
              <div className="text-center py-12 space-y-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                <p className="text-sm font-bold text-foreground">Re-crawling {brand.websiteUrl}...</p>
                <p className="text-xs text-muted-foreground">
                  Comparing current website against your saved profile.
                </p>
              </div>
            ) : refreshDiff ? (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-muted/40 text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground font-bold">User-Edited Protection: </strong>
                  SocialYolo never automatically overwrites fields you customized. Compare the existing values with newly detected values below and choose what to apply:
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {/* Industry Diff */}
                  <div className="p-4 rounded-xl bg-background border border-border/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-foreground">Industry</span>
                      <button
                        onClick={() => handleApplyDiff('industry')}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Apply Detected
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Saved Profile:</span>
                        <span className="font-semibold text-foreground">
                          {refreshDiff.existing.industry || 'None'}
                        </span>
                      </div>
                      <div>
                        <span className="text-primary block text-[10px]">Newly Detected:</span>
                        <span className="font-semibold text-emerald-400">
                          {refreshDiff.detected.industry || 'None'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Products Diff */}
                  <div className="p-4 rounded-xl bg-background border border-border/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-foreground">
                        Products ({refreshDiff.detected.products.length} found)
                      </span>
                      <button
                        onClick={() => handleApplyDiff('products')}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Merge New Products
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {refreshDiff.detected.products.map((p: any, i: number) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-xs text-foreground font-medium"
                        >
                          {p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border/40">
                  <button
                    onClick={() => setRefreshModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* QUICK ADD PRODUCT MODAL */}
      {addProductModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-base font-bold text-foreground">Add New Product</h3>
              <button
                onClick={() => setAddProductModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-foreground">Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Summer Silk Shirt"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border/70 rounded-xl text-foreground font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground">Category (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Apparel"
                  value={newProductCategory}
                  onChange={(e) => setNewProductCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border/70 rounded-xl text-foreground"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/40">
              <button
                onClick={() => setAddProductModal(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickAddProduct}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
