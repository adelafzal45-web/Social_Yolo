'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Globe,
  Sparkles,
  Search,
  ExternalLink,
  Settings,
  LayoutDashboard,
  Layers,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Building2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { getBrandsApi, deleteBrandApi } from '@/lib/api';
import { BrandProfile } from '@/lib/types';
import { useNotification } from '@/context/NotificationContext';

export default function BrandsListPage() {
  const router = useRouter();
  const { toast } = useNotification();
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const data = await getBrandsApi();
      setBrands(data || []);
    } catch (err: any) {
      toast({
        title: 'Error loading brands',
        message: err.message || 'Unable to fetch brands.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete brand "${name}"?`)) return;
    setDeletingId(id);
    try {
      await deleteBrandApi(id);
      setBrands((prev) => prev.filter((b) => b.id !== id));
      toast({
        title: 'Brand Deleted',
        message: `Brand "${name}" was successfully removed.`,
        type: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Deletion Failed',
        message: err.message || 'Failed to delete brand.',
        type: 'error',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredBrands = brands.filter((b) => {
    const q = searchQuery.toLowerCase();
    const name = (b.name || b.brandName || '').toLowerCase();
    const industry = (b.industry || b.niche || '').toLowerCase();
    const url = (b.websiteUrl || '').toLowerCase();
    return name.includes(q) || industry.includes(q) || url.includes(q);
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            AI Content Intelligence Engine
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Brands
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            SocialYolo collects structured brand DNA once from your website and automatically applies it across all AI content generation—without writing prompts.
          </p>
        </div>

        <Link
          href="/brands/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all active:scale-[0.98] shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Brand
        </Link>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by brand name, industry, or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-card border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/70"
          />
        </div>

        <div className="text-xs text-muted-foreground font-medium self-end sm:self-center">
          Showing <span className="text-foreground font-semibold">{filteredBrands.length}</span> of {brands.length} brands
        </div>
      </div>

      {/* Brand Grid / List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-2xl border border-border/40 bg-card/50 animate-pulse p-6 space-y-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
              <div className="h-16 bg-muted/60 rounded-xl" />
              <div className="h-8 bg-muted/40 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-border/70 bg-card/30">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary mb-4 shadow-sm">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            {searchQuery ? 'No brands matched your search' : 'No brands created yet'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2 mb-6">
            {searchQuery
              ? 'Try searching with a different term or clear the filter.'
              : 'Add your brand by simply entering your website URL. SocialYolo will crawl your site, extract products, services, audience, and colors automatically.'}
          </p>
          <Link
            href="/brands/new"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition shadow"
          >
            <Plus className="w-4 h-4" />
            Add Your First Brand
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBrands.map((brand) => {
            const displayName = brand.name || brand.brandName || 'Untitled Brand';
            const displayIndustry = brand.industry || brand.niche || 'General Business';
            const primaryColor = brand.primaryColor || '#7c5cff';

            return (
              <div
                key={brand.id}
                className="group relative rounded-2xl border border-border/60 bg-card hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden"
              >
                {/* Brand Color Top Stripe */}
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: primaryColor }}
                />

                <div className="p-6 flex-1 space-y-4">
                  {/* Brand Avatar + Title */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {brand.logoUrl ? (
                        <img
                          src={brand.logoUrl}
                          alt={displayName}
                          className="w-12 h-12 rounded-xl object-contain bg-muted/40 p-1 border border-border/50 shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-sm shrink-0"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h2 className="text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {displayName}
                        </h2>
                        <span className="inline-block text-xs font-medium text-muted-foreground truncate">
                          {displayIndustry}
                        </span>
                      </div>
                    </div>

                    {brand.isDefault && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                        Default
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed">
                    {brand.description || brand.tagline || 'No brand description recorded yet.'}
                  </p>

                  {/* Website link */}
                  {brand.websiteUrl && (
                    <div className="flex items-center gap-1.5 text-xs text-primary font-medium truncate">
                      <Globe className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                      <a
                        href={brand.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {brand.websiteUrl.replace(/^https?:\/\//i, '').replace(/\/$/, '')}
                      </a>
                    </div>
                  )}

                  {/* Colors & Tone Tag */}
                  <div className="pt-2 flex items-center justify-between border-t border-border/30">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded-full border border-black/20 shadow-xs"
                        style={{ backgroundColor: primaryColor }}
                        title={`Primary: ${primaryColor}`}
                      />
                      {brand.secondaryColor && (
                        <div
                          className="w-4 h-4 rounded-full border border-black/20 shadow-xs"
                          style={{ backgroundColor: brand.secondaryColor }}
                          title={`Secondary: ${brand.secondaryColor}`}
                        />
                      )}
                      {brand.accentColor && (
                        <div
                          className="w-4 h-4 rounded-full border border-black/20 shadow-xs"
                          style={{ backgroundColor: brand.accentColor }}
                          title={`Accent: ${brand.accentColor}`}
                        />
                      )}
                    </div>

                    <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                      {brand.tone || 'Warm'}
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="px-6 py-3.5 bg-muted/20 border-t border-border/40 flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/brands/${brand.id}`}
                      className="px-3 py-1.5 rounded-lg bg-card hover:bg-muted border border-border/60 text-foreground transition flex items-center gap-1.5"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      Dashboard
                    </Link>
                    <Link
                      href={`/content/create?brandId=${brand.id}`}
                      className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Create Post
                    </Link>
                  </div>

                  <div className="flex items-center gap-1">
                    <Link
                      href={`/brands/${brand.id}/settings`}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition"
                      title="Brand Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(brand.id, displayName)}
                      disabled={deletingId === brand.id}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                      title="Delete Brand"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
