'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Trash2,
  Palette,
  Globe,
  Tag,
  Building2,
  Users,
  ShieldCheck,
  Check,
  AlertCircle,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import {
  getBrandByIdApi,
  getBrandInsightsApi,
  updateBrandApi,
  updateBrandInsightsApi,
  deleteBrandApi,
} from '@/lib/api';
import { BrandProfile, BrandInsight } from '@/lib/types';
import { useNotification } from '@/context/NotificationContext';

export default function BrandSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useNotification();
  const brandId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [insight, setInsight] = useState<BrandInsight | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [industry, setIndustry] = useState('');
  const [subIndustry, setSubIndustry] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#7c5cff');
  const [secondaryColor, setSecondaryColor] = useState('#e0aa4e');
  const [valueProposition, setValueProposition] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [services, setServices] = useState<any[]>([]);
  const [newServiceName, setNewServiceName] = useState('');

  useEffect(() => {
    const fetchBrand = async () => {
      setLoading(true);
      try {
        const b = await getBrandByIdApi(brandId);
        setBrand(b);
        setName(b.name || b.brandName || '');
        setWebsiteUrl(b.websiteUrl || '');
        setIndustry(b.industry || b.niche || '');
        setSubIndustry(b.subIndustry || '');
        setCountry(b.country || '');
        setCity(b.city || '');
        setDescription(b.description || '');
        setLogoUrl(b.logoUrl || '');
        setFaviconUrl(b.faviconUrl || '');
        setPrimaryColor(b.primaryColor || '#7c5cff');
        setSecondaryColor(b.secondaryColor || '#e0aa4e');

        const ins = await getBrandInsightsApi(brandId);
        setInsight(ins);
        setValueProposition(ins?.valueProposition || '');
        setProducts(ins?.products || []);
        setServices(ins?.services || []);
      } catch (err: any) {
        toast({
          title: 'Error loading brand',
          message: err.message,
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    if (brandId) fetchBrand();
  }, [brandId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateBrandApi(brandId, {
        brandName: name.trim(),
        name: name.trim(),
        websiteUrl: websiteUrl.trim(),
        industry: industry.trim(),
        subIndustry: subIndustry.trim(),
        country: country.trim(),
        city: city.trim(),
        description: description.trim(),
        logoUrl: logoUrl.trim(),
        faviconUrl: faviconUrl.trim(),
        primaryColor,
        secondaryColor,
      });

      await updateBrandInsightsApi(brandId, {
        valueProposition: valueProposition.trim(),
        products,
        services,
      });

      toast({
        title: 'Brand Settings Saved',
        message: 'All updates and field edits successfully persisted.',
        type: 'success',
      });
      router.push(`/brands/${brandId}`);
    } catch (err: any) {
      toast({
        title: 'Save Failed',
        message: err.message,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this brand and all its insights?')) return;
    try {
      await deleteBrandApi(brandId);
      toast({
        title: 'Brand Deleted',
        message: 'Brand was permanently deleted.',
        type: 'success',
      });
      router.push('/brands');
    } catch (err: any) {
      toast({
        title: 'Delete Failed',
        message: err.message,
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 space-x-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-5">
        <Link
          href={`/brands/${brandId}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-xl text-destructive hover:bg-destructive/10 border border-destructive/20 text-xs font-semibold transition"
          >
            Delete Brand
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow hover:bg-primary/90 transition flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Brand Settings & DNA</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Customize core brand identity and catalog attributes. User edits take highest precedence during automatic website scans.
        </p>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm space-y-8">
        {/* Core Attributes */}
        <div className="space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            General Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Brand Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Website URL</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Industry</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Sub-Industry</label>
              <input
                type="text"
                value={subIndustry}
                onChange={(e) => setSubIndustry(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl text-foreground"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3.5 text-sm bg-background border border-border/70 rounded-xl text-foreground resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Value Proposition</label>
            <input
              type="text"
              value={valueProposition}
              onChange={(e) => setValueProposition(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl text-foreground"
            />
          </div>
        </div>

        {/* Visual Identity */}
        <div className="space-y-5 pt-6 border-t border-border/40">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Visual Assets & Colors
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Logo URL</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Favicon URL</label>
              <input
                type="url"
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-36 px-3 py-1.5 text-xs bg-background border border-border/70 rounded-lg text-foreground font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Secondary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-36 px-3 py-1.5 text-xs bg-background border border-border/70 rounded-lg text-foreground font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Products Management */}
        <div className="space-y-4 pt-6 border-t border-border/40">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
            Products Catalog ({products.length})
          </h2>

          <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-background border border-border/70 min-h-12">
            {products.map((p, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs font-medium text-foreground"
              >
                {p.name}
                <button
                  type="button"
                  onClick={() => setProducts(products.filter((_, i) => i !== idx))}
                  className="hover:text-destructive transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add product name..."
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newProductName.trim()) {
                  e.preventDefault();
                  setProducts([...products, { name: newProductName.trim() }]);
                  setNewProductName('');
                }
              }}
              className="flex-1 px-3 py-2 text-xs bg-background border border-border/70 rounded-lg text-foreground"
            />
            <button
              type="button"
              onClick={() => {
                if (newProductName.trim()) {
                  setProducts([...products, { name: newProductName.trim() }]);
                  setNewProductName('');
                }
              }}
              className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-xs font-semibold text-foreground"
            >
              Add Product
            </button>
          </div>
        </div>

        {/* Bottom Save Action */}
        <div className="pt-6 border-t border-border/40 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow hover:bg-primary/90 transition flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save All Changes
          </button>
        </div>
      </div>
    </div>
  );
}
