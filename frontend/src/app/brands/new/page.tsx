'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Globe,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Edit3,
  Plus,
  X,
  Palette,
  Check,
  Building2,
  FileText,
  MapPin,
  Tag,
  Share2,
  Info,
  Loader2,
} from 'lucide-react';
import {
  analyzeUrlApi,
  getAnalysisJobStatusApi,
  createBrandApi,
} from '@/lib/api';
import { BrandProfile, BrandAnalysisResult, AnalysisJobStep } from '@/lib/types';
import { useNotification } from '@/context/NotificationContext';

type WizardStage = 'form' | 'analyzing' | 'review';

export default function CreateBrandPage() {
  const router = useRouter();
  const { toast } = useNotification();

  // Wizard Stage
  const [stage, setStage] = useState<WizardStage>('form');

  // Initial Form Fields (Spec Section 3)
  const [brandName, setBrandName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [shortDescription, setShortDescription] = useState('');

  // Analysis Progress (Spec Section 34)
  const [jobId, setJobId] = useState<string | null>(null);
  const [progressPct, setProgressPct] = useState<number>(10);
  const [currentStepText, setCurrentStepText] = useState<string>('Connecting to website...');
  const [steps, setSteps] = useState<AnalysisJobStep[]>([
    { id: 'connected', label: 'Website connected', status: 'pending' },
    { id: 'content_collected', label: 'Website content collected', status: 'pending' },
    { id: 'brand_info', label: 'Brand information detected', status: 'pending' },
    { id: 'products', label: 'Products detected', status: 'pending' },
    { id: 'services', label: 'Services detected', status: 'pending' },
    { id: 'social', label: 'Social profiles detected', status: 'pending' },
    { id: 'identity', label: 'Brand identity analyzed', status: 'pending' },
  ]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Editable Extracted Brand Profile (Spec Section 7 & 8)
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [subIndustry, setSubIndustry] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [valueProposition, setValueProposition] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#7c5cff');
  const [secondaryColors, setSecondaryColors] = useState<string[]>(['#e0aa4e', '#ffffff']);
  const [products, setProducts] = useState<{ name: string; description?: string }[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [services, setServices] = useState<{ name: string; description?: string }[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [targetAudience, setTargetAudience] = useState<{ segment: string; description?: string }[]>([]);
  const [newAudience, setNewAudience] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [newLocation, setNewLocation] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [brandVoice, setBrandVoice] = useState<{
    tone: string[];
    formality: string;
    humor: string;
    technicality: string;
    emotion: string;
  }>({
    tone: ['professional', 'modern', 'approachable'],
    formality: 'medium',
    humor: 'low',
    technicality: 'medium',
    emotion: 'medium',
  });
  const [newTone, setNewTone] = useState('');
  const [crawledSources, setCrawledSources] = useState<any[]>([]);

  // Saving State
  const [saving, setSaving] = useState(false);

  // Polling logic for async analysis job
  useEffect(() => {
    if (stage !== 'analyzing' || !jobId) return;

    const pollJob = async () => {
      try {
        const job = await getAnalysisJobStatusApi(jobId);
        if (!job) return;

        setProgressPct(job.progress || 20);
        if (job.currentStep) setCurrentStepText(job.currentStep);
        if (job.steps && Array.isArray(job.steps)) {
          setSteps(job.steps);
        }

        if (job.status === 'completed' && job.result) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          applyAnalysisResult(job.result, job.crawledPages || []);
          setStage('review');
        } else if (job.status === 'failed') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setAnalysisError(job.error || 'Website analysis could not complete. Please check the URL.');
        }
      } catch (err: any) {
        // Continue polling unless permanent error
      }
    };

    pollTimerRef.current = setInterval(pollJob, 1500);
    pollJob(); // Immediate check

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [stage, jobId]);

  const applyAnalysisResult = (res: BrandAnalysisResult, sources: any[]) => {
    if (res.brandName) setBrandName(res.brandName);
    if (res.websiteUrl) setWebsiteUrl(res.websiteUrl);
    if (res.industry) setIndustry(res.industry);
    if (res.subIndustry) setSubIndustry(res.subIndustry);
    if (res.country) setCountry(res.country);
    if (res.city) setCity(res.city);
    if (res.description) setShortDescription(res.description);
    if (res.companyDescription) setCompanyDescription(res.companyDescription);
    if (res.valueProposition) setValueProposition(res.valueProposition);
    if (res.logoUrl) setLogoUrl(res.logoUrl);
    if (res.faviconUrl) setFaviconUrl(res.faviconUrl);
    if (res.primaryColor) setPrimaryColor(res.primaryColor);
    if (res.secondaryColors?.length) setSecondaryColors(res.secondaryColors);
    if (res.products?.length) setProducts(res.products);
    if (res.services?.length) setServices(res.services);
    if (res.targetAudience?.length) setTargetAudience(res.targetAudience);
    if (res.locations?.length) {
      setLocations(
        res.locations.map((l) => [l.city, l.country].filter(Boolean).join(', ')).filter(Boolean)
      );
    }
    if (res.keywords?.length) setKeywords(res.keywords);
    if (res.socialLinks) setSocialLinks(res.socialLinks);
    if (res.brandVoice) setBrandVoice(res.brandVoice);
    setCrawledSources(sources);
  };

  const handleStartAnalysis = async () => {
    if (!websiteUrl || !websiteUrl.trim()) {
      toast({
        title: 'Website URL Required',
        message: 'Please enter your brand website URL to begin analysis.',
        type: 'warning',
      });
      return;
    }

    setAnalysisError(null);
    setProgressPct(10);
    setCurrentStepText('Connecting to website...');
    setSteps((prev) => prev.map((s) => ({ ...s, status: 'pending' })));
    setStage('analyzing');

    try {
      const res = await analyzeUrlApi(websiteUrl);
      if (res && res.jobId) {
        setJobId(res.jobId);
      } else {
        throw new Error('Could not initialize analysis job.');
      }
    } catch (err: any) {
      setAnalysisError(err.message || 'Unable to connect to website. Please verify the URL.');
    }
  };

  const handleSkipToManual = () => {
    if (!brandName.trim()) {
      setBrandName('My Brand');
    }
    setStage('review');
  };

  const handleSaveBrand = async () => {
    if (!brandName.trim()) {
      toast({
        title: 'Brand Name Required',
        message: 'Please enter a name for your brand.',
        type: 'warning',
      });
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<BrandProfile> & {
        insights?: any;
        sources?: any[];
      } = {
        name: brandName.trim(),
        brandName: brandName.trim(),
        websiteUrl: websiteUrl.trim() || null,
        industry: industry.trim() || null,
        subIndustry: subIndustry.trim() || null,
        country: country.trim() || null,
        city: city.trim() || null,
        description: shortDescription.trim() || null,
        logoUrl: logoUrl.trim() || null,
        faviconUrl: faviconUrl.trim() || null,
        primaryColor,
        secondaryColor: secondaryColors[0] || '#e0aa4e',
        accentColor: secondaryColors[1] || '#ffffff',
        secondaryColors,
        status: 'active',
        brandVoice,
        socialLinks,
        insights: {
          companyDescription: companyDescription.trim() || shortDescription.trim() || null,
          valueProposition: valueProposition.trim() || null,
          products,
          services,
          targetAudience,
          locations: locations.map((loc) => ({ country: loc })),
          benefits: [],
          painPoints: [],
          keywords,
          categories: industry ? [industry] : [],
          socialLinks,
          brandVoice,
          sourceUrls: crawledSources.map((s) => s.url).filter(Boolean),
          confidence: {
            brandName: 0.95,
            industry: 0.9,
            products: 0.9,
          },
        },
        sources: crawledSources,
      };

      const created = await createBrandApi(payload);
      toast({
        title: 'Brand Profile Saved!',
        message: `Brand "${created.brandName || created.name}" is now ready for autonomous content creation.`,
        type: 'success',
      });
      router.push(`/brands/${created.id}`);
    } catch (err: any) {
      toast({
        title: 'Save Failed',
        message: err.message || 'Could not save brand profile.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header breadcrumb & back */}
      <div className="flex items-center justify-between border-b border-border/40 pb-5">
        <Link
          href="/brands"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Brands
        </Link>
        <div className="text-xs font-semibold text-primary px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
          AI Content Intelligence
        </div>
      </div>

      {/* STAGE 1: INITIAL SIMPLE FORM (Spec Section 3) */}
      {stage === 'form' && (
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Add Your Brand
            </h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-2xl">
              Enter your website URL. SocialYolo's AI crawler analyzes your public website, detects products, services, value propositions, colors, and logos, and automatically configures your AI context.
            </p>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Required: Brand Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Brand Name <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nexvia"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground font-medium"
                />
              </div>

              {/* Required: Website URL */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Website URL <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="url"
                    placeholder="https://nexvia.pk"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground font-medium"
                  />
                </div>
              </div>

              {/* Optional: Industry */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Industry <span className="text-[11px] font-normal text-muted-foreground/80">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Software & Technology"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground"
                />
              </div>

              {/* Optional: Country & City */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Country <span className="text-[11px] font-normal text-muted-foreground/80">(Opt)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pakistan"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    City <span className="text-[11px] font-normal text-muted-foreground/80">(Opt)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lahore"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Optional: Short Description */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Short Description <span className="text-[11px] font-normal text-muted-foreground/80">(Optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Software development and business automation company..."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full p-4 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground resize-none"
              />
            </div>

            {/* Action Buttons (Spec Section 3) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/40">
              <button
                type="button"
                onClick={handleSkipToManual}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border/70 hover:bg-muted text-sm font-semibold text-muted-foreground hover:text-foreground transition order-2 sm:order-1"
              >
                Skip & Enter Manually
              </button>

              <button
                type="button"
                onClick={handleStartAnalysis}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 transition flex items-center justify-center gap-2 active:scale-[0.98] order-1 sm:order-2"
              >
                <Sparkles className="w-4 h-4" />
                Get Brand Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: ASYNC ANALYSIS PROGRESS (Spec Section 34) */}
      {stage === 'analyzing' && (
        <div className="space-y-8 max-w-2xl mx-auto py-10">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground">
              Analyzing Website...
            </h2>
            <p className="text-xs font-medium text-muted-foreground truncate max-w-md mx-auto">
              Scanning {websiteUrl} and extracting brand assets
            </p>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{currentStepText}</span>
              <span className="font-semibold text-foreground">{progressPct}%</span>
            </div>
          </div>

          {/* Checklist (Spec Section 34) */}
          <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
            {steps.map((step) => {
              const isDone = step.status === 'completed';
              const isInProgress = step.status === 'in_progress';
              const isFailed = step.status === 'failed';

              return (
                <div key={step.id} className="flex items-center gap-3 text-sm">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : isInProgress ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                  ) : isFailed ? (
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-border/80 shrink-0" />
                  )}
                  <span
                    className={
                      isDone
                        ? 'text-foreground font-medium'
                        : isInProgress
                        ? 'text-primary font-semibold'
                        : isFailed
                        ? 'text-destructive font-medium'
                        : 'text-muted-foreground/60'
                    }
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Error handling state */}
          {analysisError && (
            <div className="p-5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive space-y-4">
              <div className="flex items-center gap-3 text-sm font-semibold">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{analysisError}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleStartAnalysis}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-xl text-xs font-bold hover:bg-destructive/90 transition shadow-xs"
                >
                  Retry Analysis
                </button>
                <button
                  onClick={handleSkipToManual}
                  className="px-4 py-2 border border-destructive/30 rounded-xl text-xs font-semibold hover:bg-destructive/10 transition"
                >
                  Enter Details Manually
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STAGE 3: BRAND PROFILE RESULT & EDITABLE REVIEW (Spec Section 7 & 8) */}
      {stage === 'review' && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400 mb-2">
                <Check className="w-3.5 h-3.5" />
                Brand Details Found & Analyzed
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Review Brand Profile
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Every extracted field is editable. Verify your details before saving.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleStartAnalysis}
                className="px-4 py-2.5 rounded-xl border border-border/70 hover:bg-muted text-xs font-semibold text-foreground transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Analyze Again
              </button>
              <button
                type="button"
                onClick={handleSaveBrand}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow hover:bg-primary/90 transition flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Brand...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Brand
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-8 rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
            {/* Logo Preview & Visual Identity */}
            <div className="space-y-4 pb-6 border-b border-border/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Visual Identity & Assets
              </h3>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Logo Box */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl border border-border/60 bg-muted/40 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Brand Logo"
                        className="w-full h-full object-contain"
                        onError={() => setLogoUrl('')}
                      />
                    ) : (
                      <div
                        className="w-full h-full rounded-xl flex items-center justify-center font-bold text-2xl text-white shadow-xs"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {(brandName || 'B').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Logo URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="w-full sm:w-80 px-3 py-1.5 text-xs bg-background border border-border/70 rounded-lg text-foreground"
                    />
                  </div>
                </div>

                {/* Colors */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Brand Colors</label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-background p-1.5 rounded-xl border border-border/70">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-xs font-mono font-medium text-foreground pr-1">
                        {primaryColor}
                      </span>
                    </div>

                    {secondaryColors.map((color, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-background p-1.5 rounded-xl border border-border/70"
                      >
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => {
                            const updated = [...secondaryColors];
                            updated[idx] = e.target.value;
                            setSecondaryColors(updated);
                          }}
                          className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent"
                        />
                        <span className="text-xs font-mono font-medium text-foreground pr-1">
                          {color}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Core Brand Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-border/40">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-4 py-2 text-sm bg-background border border-border/70 rounded-xl font-bold text-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Website URL
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full px-4 py-2 text-sm bg-background border border-border/70 rounded-xl text-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Industry
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-2 text-sm bg-background border border-border/70 rounded-xl text-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Sub-Industry
                </label>
                <input
                  type="text"
                  value={subIndustry}
                  onChange={(e) => setSubIndustry(e.target.value)}
                  className="w-full px-4 py-2 text-sm bg-background border border-border/70 rounded-xl text-foreground"
                />
              </div>
            </div>

            {/* Descriptions & Value Proposition */}
            <div className="space-y-6 pb-6 border-b border-border/40">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Value Proposition
                </label>
                <input
                  type="text"
                  value={valueProposition}
                  onChange={(e) => setValueProposition(e.target.value)}
                  placeholder="The core promise and unique value your brand delivers to customers..."
                  className="w-full px-4 py-2.5 text-sm bg-background border border-border/70 rounded-xl text-foreground font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Company Description
                </label>
                <textarea
                  rows={3}
                  value={companyDescription || shortDescription}
                  onChange={(e) => {
                    setCompanyDescription(e.target.value);
                    setShortDescription(e.target.value);
                  }}
                  className="w-full p-4 text-sm bg-background border border-border/70 rounded-xl text-foreground resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Products & Services (Spec Section 6 & 10) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-border/40">
              {/* Products */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center justify-between">
                  <span>Products ({products.length})</span>
                </label>
                <div className="flex flex-wrap gap-2 min-h-12 p-3 rounded-xl bg-background border border-border/70">
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
                  {products.length === 0 && (
                    <span className="text-xs text-muted-foreground/60 italic">No products detected.</span>
                  )}
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
                    className="flex-1 px-3 py-1.5 text-xs bg-background border border-border/70 rounded-lg text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newProductName.trim()) {
                        setProducts([...products, { name: newProductName.trim() }]);
                        setNewProductName('');
                      }
                    }}
                    className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs font-semibold text-foreground"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Services */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center justify-between">
                  <span>Services ({services.length})</span>
                </label>
                <div className="flex flex-wrap gap-2 min-h-12 p-3 rounded-xl bg-background border border-border/70">
                  {services.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-foreground"
                    >
                      {s.name}
                      <button
                        type="button"
                        onClick={() => setServices(services.filter((_, i) => i !== idx))}
                        className="hover:text-destructive transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {services.length === 0 && (
                    <span className="text-xs text-muted-foreground/60 italic">No services detected.</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add service name..."
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newServiceName.trim()) {
                        e.preventDefault();
                        setServices([...services, { name: newServiceName.trim() }]);
                        setNewServiceName('');
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-background border border-border/70 rounded-lg text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newServiceName.trim()) {
                        setServices([...services, { name: newServiceName.trim() }]);
                        setNewServiceName('');
                      }
                    }}
                    className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs font-semibold text-foreground"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Target Audience & Keywords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-border/40">
              {/* Audience */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Target Audience
                </label>
                <div className="flex flex-wrap gap-2 min-h-12 p-3 rounded-xl bg-background border border-border/70">
                  {targetAudience.map((a, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted text-xs font-medium text-foreground"
                    >
                      {a.segment}
                      <button
                        type="button"
                        onClick={() => setTargetAudience(targetAudience.filter((_, i) => i !== idx))}
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
                    placeholder="e.g. Modern D2C Founders"
                    value={newAudience}
                    onChange={(e) => setNewAudience(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-background border border-border/70 rounded-lg text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newAudience.trim()) {
                        setTargetAudience([...targetAudience, { segment: newAudience.trim() }]);
                        setNewAudience('');
                      }
                    }}
                    className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs font-semibold text-foreground"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Keywords */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Keywords
                </label>
                <div className="flex flex-wrap gap-2 min-h-12 p-3 rounded-xl bg-background border border-border/70">
                  {keywords.map((k, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/80 text-xs font-medium text-foreground"
                    >
                      #{k}
                      <button
                        type="button"
                        onClick={() => setKeywords(keywords.filter((_, i) => i !== idx))}
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
                    placeholder="Add keyword..."
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-background border border-border/70 rounded-lg text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newKeyword.trim()) {
                        setKeywords([...keywords, newKeyword.trim().replace(/^#/, '')]);
                        setNewKeyword('');
                      }
                    }}
                    className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs font-semibold text-foreground"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Social Links (Spec Section 12) */}
            <div className="space-y-3 pb-6 border-b border-border/40">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Share2 className="w-4 h-4 text-primary" />
                Detected Social Profiles
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {['instagram', 'facebook', 'linkedin', 'x', 'youtube', 'tiktok', 'pinterest'].map((platform) => (
                  <div key={platform} className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                      {platform}
                    </span>
                    <input
                      type="url"
                      placeholder={`https://${platform}.com/...`}
                      value={socialLinks[platform] || ''}
                      onChange={(e) =>
                        setSocialLinks({
                          ...socialLinks,
                          [platform]: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-background border border-border/70 rounded-lg text-foreground"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Inferred Brand Voice (Spec Section 15) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Inferred Brand Voice
                </label>
                <span className="text-[11px] text-muted-foreground italic">
                  Editable AI-inferred characteristics
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Formality</span>
                  <select
                    value={brandVoice.formality}
                    onChange={(e) => setBrandVoice({ ...brandVoice, formality: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-background border border-border/70 rounded-lg text-foreground"
                  >
                    <option value="low">Low (Casual)</option>
                    <option value="medium">Medium (Balanced)</option>
                    <option value="high">High (Executive)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Humor</span>
                  <select
                    value={brandVoice.humor}
                    onChange={(e) => setBrandVoice({ ...brandVoice, humor: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-background border border-border/70 rounded-lg text-foreground"
                  >
                    <option value="low">Low (Direct)</option>
                    <option value="medium">Medium (Subtle)</option>
                    <option value="high">High (Playful)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Technicality</span>
                  <select
                    value={brandVoice.technicality}
                    onChange={(e) => setBrandVoice({ ...brandVoice, technicality: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-background border border-border/70 rounded-lg text-foreground"
                  >
                    <option value="low">Low (Accessible)</option>
                    <option value="medium">Medium (Informed)</option>
                    <option value="high">High (Deep Technical)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Emotion</span>
                  <select
                    value={brandVoice.emotion}
                    onChange={(e) => setBrandVoice({ ...brandVoice, emotion: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-background border border-border/70 rounded-lg text-foreground"
                  >
                    <option value="low">Low (Logical)</option>
                    <option value="medium">Medium (Inspiring)</option>
                    <option value="high">High (Passionate)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-border/40 flex items-center justify-between">
              <button
                type="button"
                onClick={handleStartAnalysis}
                className="px-5 py-2.5 rounded-xl border border-border/70 hover:bg-muted text-xs font-semibold text-foreground transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Analyze Again
              </button>

              <button
                type="button"
                onClick={handleSaveBrand}
                disabled={saving}
                className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow hover:bg-primary/90 transition flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Brand...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Brand
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
