'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Layers,
  CheckCircle2,
  FolderPlus,
  Target,
  Palette,
  AlertCircle,
  Download,
  ShieldCheck,
  Crown,
  Zap,
  BookOpen,
  RefreshCw,
  Search,
  ExternalLink,
  Smartphone,
  Monitor,
  Layout,
  ChevronRight,
  Check,
  SlidersHorizontal,
  Plus,
  Edit3,
  Globe,
  Coins,
  X,
  ChevronDown,
  ChevronUp,
  Info,
  Type,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import {
  BrandProfile,
  CreativeGeneration,
  CreativeVariation,
  DesignConceptItem,
  DesignValidationReport,
  AiDesignEditAction,
  StudioConfigResponse,
  CampaignObjectiveConfig,
  CreativeTypeConfig,
  PlatformConfig,
} from '@/lib/types';
import {
  getBrandsApi,
  createBrandApi,
  updateBrandApi,
  analyzeUrlApi,
  getAnalysisJobStatusApi,
  getStudioConfigApi,
  createDesignGenerationApi,
  getDesignGenerationApi,
  subscribeDesignGenerationStream,
  getDesignConceptsApi,
  editDesignVariationApi,
  adaptDesignPlatformApi,
  exportDesignVariationApi,
  approveDesignVariationApi,
  searchDesignInspirationsApi,
  getTrendingDesignInspirationsApi,
  saveDesignInspirationToBoardApi,
  listDesignProjectsApi,
  fetchCreditBalance,
} from '@/lib/api';

const DEFAULT_OBJECTIVES: CampaignObjectiveConfig[] = [
  { id: 'AWARENESS', name: 'Brand Awareness', subtitle: 'Reach and brand recall', recommendedType: 'meta_ad', defaultCta: 'Learn More', bestFor: 'Reach & Authority' },
  { id: 'TRAFFIC', name: 'Traffic & Visits', subtitle: 'Send people to website', recommendedType: 'meta_ad', defaultCta: 'Visit Site', bestFor: 'Link Clicks' },
  { id: 'ENGAGEMENT', name: 'Engagement', subtitle: 'Comments, shares & saves', recommendedType: 'meta_ad', defaultCta: 'Join Conversation', bestFor: 'Virality' },
  { id: 'LEADS', name: 'Lead Generation', subtitle: 'Collect signups & inquiries', recommendedType: 'meta_ad', defaultCta: 'Sign Up', bestFor: 'High Intent' },
  { id: 'SALES', name: 'Direct Sales', subtitle: 'Drive purchases & conversions', recommendedType: 'meta_ad', defaultCta: 'Shop Now', bestFor: 'E-commerce ROI' },
  { id: 'PROMOTION', name: 'Special Promotion', subtitle: 'Discounts, sales & drops', recommendedType: 'meta_ad', defaultCta: 'Claim Offer', bestFor: 'Flash Sales' },
];

const DEFAULT_CREATIVE_TYPES: CreativeTypeConfig[] = [
  { id: 'EDITORIAL_PRESTIGE', name: 'Editorial Prestige', subtitle: 'Vogue & Kinfolk editorial aesthetic with generous white space', defaultCta: 'Discover More', style: 'Editorial' },
  { id: 'LUXURY_MINIMAL', name: 'Luxury Minimal', subtitle: 'Subtle elegance, muted gold/slate tones & focused centerpiece', defaultCta: 'Explore Collection', style: 'Minimal' },
  { id: 'BOLD_STORYTELLING', name: 'Bold Storytelling', subtitle: 'High contrast dynamic hierarchy with vivid modern flair', defaultCta: 'Read Story', style: 'Bold' },
  { id: 'TYPOGRAPHIC_HERO', name: 'Typographic Hero', subtitle: 'Expressive oversized headline paired with sharp geometric grid', defaultCta: 'Experience It', style: 'Editorial' },
  { id: 'LOOKBOOK_SHOWCASE', name: 'Lookbook Showcase', subtitle: 'Artisanal product framing with museum-grade lighting vibes', defaultCta: 'Shop Lookbook', style: 'Premium' },
];

const DEFAULT_EXPORT_PLATFORMS: PlatformConfig[] = [
  { id: 'instagram_post', name: 'Instagram Post', channel: 'Instagram', width: 1080, height: 1350, aspectRatio: '4:5', category: 'feed', description: 'Recommended vertical feed (1080 × 1350 px)' },
  { id: 'instagram_square', name: 'Instagram Square', channel: 'Instagram', width: 1080, height: 1080, aspectRatio: '1:1', category: 'feed', description: 'Classic square post (1080 × 1080 px)' },
  { id: 'instagram_story', name: 'Instagram Story', channel: 'Instagram', width: 1080, height: 1920, aspectRatio: '9:16', category: 'story', description: 'Full-screen mobile story with safe zones (1080 × 1920 px)' },
  { id: 'instagram_reel_cover', name: 'Instagram Reel Cover', channel: 'Instagram', width: 1080, height: 1920, aspectRatio: '9:16', category: 'story', description: 'Vertical reel cover with centered 1:1 safe display (1080 × 1920 px)' },
  { id: 'facebook_post', name: 'Facebook Post', channel: 'Facebook', width: 1200, height: 628, aspectRatio: '1.91:1', category: 'banner', description: 'Standard landscape feed link & banner (1200 × 628 px)' },
  { id: 'facebook_cover', name: 'Facebook Cover', channel: 'Facebook', width: 820, height: 312, aspectRatio: '2.63:1', category: 'cover', description: 'Page header & campaign banner (820 × 312 px)' },
  { id: 'linkedin_post', name: 'LinkedIn Post', channel: 'LinkedIn', width: 1080, height: 1350, aspectRatio: '4:5', category: 'feed', description: 'Professional B2B vertical feed (1080 × 1350 px)' },
  { id: 'x_post', name: 'X Post', channel: 'X', width: 1200, height: 628, aspectRatio: '16:9', category: 'banner', description: 'Horizontal feed summary card (1200 × 628 px)' },
  { id: 'youtube_community', name: 'YouTube Community', channel: 'YouTube', width: 1080, height: 1080, aspectRatio: '1:1', category: 'feed', description: 'Channel community tab graphic (1080 × 1080 px)' },
  { id: 'pinterest_pin', name: 'Pinterest Pin', channel: 'Pinterest', width: 1000, height: 1500, aspectRatio: '2:3', category: 'feed', description: 'High-converting vertical viral pin (1000 × 1500 px)' },
];

const CTA_PRESETS = [
  'Shop Now',
  'Explore Collection',
  'Discover More',
  'Claim Offer',
  'Learn More',
  'Get Started',
  'Limited Drop',
];

const DEFAULT_FONT_PAIRINGS = [
  { name: 'Editorial Luxury', heading: 'Canela', body: 'Inter', tag: 'Flagship' },
  { name: 'Classic Elegance', heading: 'Playfair Display', body: 'DM Sans', tag: 'High CTR' },
  { name: 'Modern Geometric', heading: 'Montserrat', body: 'Inter', tag: 'Clean' },
  { name: 'Tech & Startup', heading: 'Plus Jakarta Sans', body: 'Outfit', tag: 'Modern' },
  { name: 'Cinematic Regal', heading: 'Cinzel', body: 'Lato', tag: 'Prestige' },
  { name: 'Avant-Garde Pop', heading: 'Syne', body: 'Space Grotesk', tag: 'Creative' },
];

const DEFAULT_FONT_CATEGORIES = [
  {
    category: 'Serif / Editorial & Luxury',
    fonts: [
      'Canela',
      'Playfair Display',
      'Cinzel',
      'Cormorant Garamond',
      'Lora',
      'Bodoni Moda',
      'Fraunces',
      'Merriweather',
      'Prata',
      'DM Serif Display',
    ],
  },
  {
    category: 'Clean & Modern Sans-Serif',
    fonts: [
      'Inter',
      'Plus Jakarta Sans',
      'DM Sans',
      'Roboto',
      'Open Sans',
      'Lato',
      'Helvetica',
      'Geist',
    ],
  },
  {
    category: 'Geometric & Architectural',
    fonts: [
      'Montserrat',
      'Outfit',
      'Poppins',
      'Raleway',
      'Work Sans',
      'Manrope',
      'Urbanist',
    ],
  },
  {
    category: 'Bold Display & Expressive',
    fonts: [
      'Syne',
      'Cabinet Grotesk',
      'Clash Display',
      'Space Grotesk',
      'Oswald',
      'Bebas Neue',
      'Anton',
      'Righteous',
    ],
  },
];

export default function UnifiedPostStudioPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useNotification();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'create' | 'inspiration' | 'projects'>('create');

  // Config loaded from backend
  const [studioConfig, setStudioConfig] = useState<StudioConfigResponse>({
    metaObjectives: DEFAULT_OBJECTIVES,
    creativeTypes: DEFAULT_CREATIVE_TYPES,
    exportPlatforms: DEFAULT_EXPORT_PLATFORMS,
  });

  // Credit balance
  const [creditBalance, setCreditBalance] = useState<number>(user?.credits ?? 214);

  // Brands State
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [showBrandDetails, setShowBrandDetails] = useState<boolean>(true);

  // Brand Modal (Add / Edit)
  const [showBrandModal, setShowBrandModal] = useState<boolean>(false);
  const [brandModalMode, setBrandModalMode] = useState<'add' | 'edit'>('add');
  const [brandCreationTab, setBrandCreationTab] = useState<'url' | 'manual'>('url');
  const [analyzingUrl, setAnalyzingUrl] = useState<boolean>(false);
  const [brandFormUrl, setBrandFormUrl] = useState<string>('');
  const [brandForm, setBrandForm] = useState<{
    id?: string;
    name: string;
    industry: string;
    websiteUrl: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontHeading: string;
    fontBody: string;
    tone: string;
    tagline: string;
  }>({
    name: '',
    industry: 'Commercial Retail',
    websiteUrl: '',
    primaryColor: '#6366f1',
    secondaryColor: '#ec4899',
    accentColor: '#10b981',
    fontHeading: 'Canela',
    fontBody: 'Inter',
    tone: 'Sophisticated & Premium',
    tagline: '',
  });

  const [customFontHeading, setCustomFontHeading] = useState(false);
  const [customFontBody, setCustomFontBody] = useState(false);

  // Step 2 & 3: Promptless Strategy States
  const [projectName, setProjectName] = useState('Campaign Post Master');
  const [designType, setDesignType] = useState<'creative' | 'meta_ad'>('creative');
  const [selectedCreativeTypeId, setSelectedCreativeTypeId] = useState<string>('EDITORIAL_PRESTIGE');
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string>('SALES');

  // Optional Content (No Prompt Engineering)
  const [productName, setProductName] = useState('');
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [offer, setOffer] = useState('');
  const [cta, setCta] = useState('Shop Now');

  // Generation execution state
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [progressPct, setProgressPct] = useState(0);
  const [stageLabel, setStageLabel] = useState('Initializing Studio Engine...');
  const [generationResult, setGenerationResult] = useState<CreativeGeneration | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<CreativeVariation | null>(null);
  const [concepts, setConcepts] = useState<DesignConceptItem[]>([]);

  // Refinement & Validation
  const [isRefining, setIsRefining] = useState(false);
  const [validationReport, setValidationReport] = useState<DesignValidationReport | null>(null);
  const [showValidationDrawer, setShowValidationDrawer] = useState(false);

  // Platform Adaptation & Export Modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPlatformId, setExportPlatformId] = useState<string>('instagram_post');
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg' | 'webp'>('png');
  const [exportScale, setExportScale] = useState<number>(2);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Inspirations & Projects
  const [inspirations, setInspirations] = useState<any[]>([]);
  const [inspirationSource, setInspirationSource] = useState<'all' | 'pinterest' | 'behance' | 'internal'>('all');
  const [savedProjects, setSavedProjects] = useState<any[]>([]);

  // Selected brand object
  const activeBrand = brands.find((b) => b.id === selectedBrandId) || brands[0] || null;

  // Load config & brands on mount
  useEffect(() => {
    // 1. Fetch Studio Config from backend
    getStudioConfigApi()
      .then((cfg) => {
        if (cfg) {
          setStudioConfig(cfg);
          if (cfg.metaObjectives && cfg.metaObjectives.length > 0) {
            setSelectedObjectiveId(cfg.metaObjectives[0].id);
          }
          if (cfg.creativeTypes && cfg.creativeTypes.length > 0) {
            setSelectedCreativeTypeId(cfg.creativeTypes[0].id);
          }
        }
      })
      .catch(() => {});

    // 2. Fetch Brands
    getBrandsApi()
      .then((data) => {
        setBrands(data || []);
        if (data && data.length > 0) {
          setSelectedBrandId(data[0].id);
        }
      })
      .catch(() => {});

    // 3. Fetch credit balance
    fetchCreditBalance()
      .then((bal) => setCreditBalance(bal))
      .catch(() => {});

    // 4. Load trending inspirations
    getTrendingDesignInspirationsApi(12)
      .then((res) => setInspirations(res || []))
      .catch(() => {});

    // 5. Load saved projects
    listDesignProjectsApi()
      .then((res) => setSavedProjects(res || []))
      .catch(() => {});
  }, []);

  // Update default CTA when design type or objective changes
  useEffect(() => {
    if (designType === 'creative') {
      const ct = studioConfig.creativeTypes.find((c) => c.id === selectedCreativeTypeId);
      if (ct?.defaultCta) setCta(ct.defaultCta);
    } else {
      const obj = studioConfig.metaObjectives.find((o) => o.id === selectedObjectiveId);
      if (obj?.defaultCta) setCta(obj.defaultCta);
    }
  }, [designType, selectedCreativeTypeId, selectedObjectiveId, studioConfig]);

  // Update validation report when selected variation changes
  useEffect(() => {
    if (selectedVariation?.validationReport) {
      setValidationReport(selectedVariation.validationReport as any);
    }
  }, [selectedVariation]);

  // Handle URL analysis for Brand creation
  const handleAnalyzeBrandUrl = async () => {
    if (!brandFormUrl || !brandFormUrl.startsWith('http')) {
      toast?.error('Please enter a valid website URL starting with http:// or https://', 'Invalid URL');
      return;
    }
    setAnalyzingUrl(true);
    try {
      const res = await analyzeUrlApi(brandFormUrl);
      const jobId = res.jobId;
      toast?.success('Analyzing website colors, typography, and visual identity...', 'Analysis Started');

      // Poll analysis job status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await getAnalysisJobStatusApi(jobId);
          if (statusRes.status === 'COMPLETED') {
            clearInterval(pollInterval);
            setAnalyzingUrl(false);
            const extracted = statusRes.result || statusRes.brand || {};
            setBrandForm({
              name: extracted.name || brandFormUrl.replace(/https?:\/\/(www\.)?/, '').split('.')[0].toUpperCase(),
              industry: extracted.industry || 'Commercial & Lifestyle',
              websiteUrl: brandFormUrl,
              primaryColor: extracted.primaryColor || extracted.colors?.[0] || '#6366f1',
              secondaryColor: extracted.secondaryColor || extracted.colors?.[1] || '#ec4899',
              accentColor: extracted.accentColor || extracted.colors?.[2] || '#10b981',
              fontHeading: extracted.fontHeading || 'Canela',
              fontBody: extracted.fontBody || 'Inter',
              tone: extracted.tone || 'Sophisticated & Premium',
              tagline: extracted.tagline || '',
            });
            setBrandCreationTab('manual');
            toast?.success('Extracted brand identity and colors successfully!', 'Website Analyzed');
          } else if (statusRes.status === 'FAILED') {
            clearInterval(pollInterval);
            setAnalyzingUrl(false);
            toast?.error('Could not extract brand automatically. Please fill in details manually.', 'Analysis Notice');
            setBrandCreationTab('manual');
          }
        } catch {
          clearInterval(pollInterval);
          setAnalyzingUrl(false);
          setBrandCreationTab('manual');
        }
      }, 1500);
    } catch (err: any) {
      setAnalyzingUrl(false);
      toast?.error(err.message || 'Failed to start analysis', 'Error');
    }
  };

  // Handle Save Brand
  const handleSaveBrand = async () => {
    if (!brandForm.name.trim()) {
      toast?.error('Please enter a brand name', 'Validation Error');
      return;
    }

    try {
      if (brandModalMode === 'edit' && brandForm.id) {
        const updated = await updateBrandApi(brandForm.id, {
          name: brandForm.name,
          industry: brandForm.industry,
          websiteUrl: brandForm.websiteUrl,
          primaryColor: brandForm.primaryColor,
          secondaryColor: brandForm.secondaryColor,
          accentColor: brandForm.accentColor,
          fontHeading: brandForm.fontHeading,
          fontBody: brandForm.fontBody,
          tone: brandForm.tone,
        });
        setBrands((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        toast?.success(`Updated brand profile for ${updated.name}.`, 'Brand Updated');
      } else {
        const created = await createBrandApi({
          name: brandForm.name,
          industry: brandForm.industry,
          websiteUrl: brandForm.websiteUrl,
          primaryColor: brandForm.primaryColor,
          secondaryColor: brandForm.secondaryColor,
          accentColor: brandForm.accentColor,
          fontHeading: brandForm.fontHeading,
          fontBody: brandForm.fontBody,
          tone: brandForm.tone,
        });
        setBrands((prev) => [created, ...prev]);
        setSelectedBrandId(created.id);
        toast?.success(`Brand ${created.name} created and selected.`, 'Brand Created');
      }
      setShowBrandModal(false);
    } catch (err: any) {
      toast?.error(err.message || 'Failed to save brand', 'Error');
    }
  };

  // Open Edit Brand modal
  const openEditBrandModal = (brand: BrandProfile) => {
    setBrandModalMode('edit');
    setBrandCreationTab('manual');
    setCustomFontHeading(false);
    setCustomFontBody(false);
    setBrandForm({
      id: brand.id,
      name: brand.name || '',
      industry: brand.industry || 'Commercial Retail',
      websiteUrl: brand.websiteUrl || '',
      primaryColor: brand.primaryColor || '#6366f1',
      secondaryColor: brand.secondaryColor || '#ec4899',
      accentColor: brand.accentColor || '#10b981',
      fontHeading: brand.fontHeading || 'Canela',
      fontBody: brand.fontBody || 'Inter',
      tone: brand.tone || 'Sophisticated & Premium',
      tagline: brand.tagline || '',
    });
    setShowBrandModal(true);
  };

  // Open Add Brand modal
  const openAddBrandModal = () => {
    setBrandModalMode('add');
    setBrandCreationTab('url');
    setCustomFontHeading(false);
    setCustomFontBody(false);
    setBrandFormUrl('');
    setBrandForm({
      name: '',
      industry: 'Commercial Retail',
      websiteUrl: '',
      primaryColor: '#6366f1',
      secondaryColor: '#ec4899',
      accentColor: '#10b981',
      fontHeading: 'Canela',
      fontBody: 'Inter',
      tone: 'Sophisticated & Premium',
      tagline: '',
    });
    setShowBrandModal(true);
  };

  // Launch Master Generation (Promptless Default)
  const handleLaunchGeneration = async () => {
    setIsGenerating(true);
    setProgressPct(5);
    setStageLabel('Analyzing Brand Identity...');
    setGenerationResult(null);
    setSelectedVariation(null);

    const activeCreativeType = studioConfig.creativeTypes.find((c) => c.id === selectedCreativeTypeId);
    const activeObjective = studioConfig.metaObjectives.find((o) => o.id === selectedObjectiveId);

    try {
      const response = await createDesignGenerationApi({
        projectName: projectName || `${activeBrand?.name || 'Brand'} Campaign`,
        brandId: selectedBrandId || undefined,
        designType,
        creativeType: activeCreativeType?.name || selectedCreativeTypeId,
        objective: designType === 'meta_ad' ? (activeObjective?.name || selectedObjectiveId) : 'Promote Product',
        style: designType === 'meta_ad' ? 'Performance' : (activeCreativeType?.style || 'Editorial'),
        composition: 'Split Screen',
        mood: 'Sophisticated & Premium',
        cta,
        platform: 'Master Canvas (1080x1350)',
        headline: headline || undefined,
        subheadline: subheadline || undefined,
        productName: productName || undefined,
        offer: offer || undefined,
      });

      const jobId = response.jobId || response.id;
      setActiveJobId(jobId);

      // Subscribe to real-time 10-stage SSE stream
      subscribeDesignGenerationStream(
        jobId,
        (event) => {
          if (event.progressPct !== undefined) setProgressPct(event.progressPct);
          if (event.stage) setStageLabel(event.stage);
        },
        async () => {
          setIsGenerating(false);
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

          // Fetch full completed generation record
          const fullGen = await getDesignGenerationApi(jobId);
          setGenerationResult(fullGen);
          if (fullGen.variations && fullGen.variations.length > 0) {
            setSelectedVariation(fullGen.variations[0]);
          }

          // Fetch concept archetypes
          try {
            const conceptsRes = await getDesignConceptsApi(jobId);
            setConcepts(conceptsRes.concepts || []);
          } catch {}

          toast?.success(
            'Synthesized 4 professional post variations with deterministic QA checks.',
            'Designs Generated'
          );
        },
        (err) => {
          setIsGenerating(false);
          toast?.error(
            err.message || 'Pipeline encountered an issue. Please try again.',
            'Generation Notice'
          );
        }
      );
    } catch (err: any) {
      setIsGenerating(false);
      toast?.error(err.message || 'Failed to start generation', 'Launch Failed');
    }
  };

  // Handle Promptless AI Edit
  const handleAiEdit = async (action: AiDesignEditAction) => {
    if (!selectedVariation) return;
    setIsRefining(true);
    try {
      const res = await editDesignVariationApi(selectedVariation.id, action);
      if (res.variation) {
        setSelectedVariation(res.variation);
        if (generationResult) {
          setGenerationResult({
            ...generationResult,
            variations: generationResult.variations.map((v) =>
              v.id === res.variation.id ? res.variation : v
            ),
          });
        }
        toast?.success(
          `Applied refinement without manual prompting.`,
          'Design Refined'
        );
      }
    } catch (err: any) {
      toast?.error(err.message || 'Could not apply adjustment', 'Edit Notice');
    } finally {
      setIsRefining(false);
    }
  };

  // Handle Export with Platform Adaptation & Credit Accounting
  const handleExport = async () => {
    if (!selectedVariation) return;
    setIsExporting(true);
    try {
      const res = await exportDesignVariationApi(
        selectedVariation.id,
        exportFormat,
        exportScale,
        exportPlatformId,
        user?.id
      );
      setShowExportModal(false);
      window.open(res.downloadUrl, '_blank');

      // Refresh credits
      const updatedBalance = await fetchCreditBalance().catch(() => null);
      if (updatedBalance !== null) setCreditBalance(updatedBalance);

      toast?.success(
        `Exported ${exportFormat.toUpperCase()} at ${exportScale}x for ${exportPlatformId}.`,
        'Export Ready'
      );
    } catch (err: any) {
      toast?.error(err.message || 'Could not export asset', 'Export Failed');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Flywheel Approval (Section 8)
  const handleApprove = async () => {
    if (!selectedVariation) return;
    try {
      const res = await approveDesignVariationApi(selectedVariation.id);
      setSelectedVariation(res.variation);
      toast?.success(
        'Ingested into SocialYolo design flywheel memory for future generations.',
        'Design Approved'
      );
    } catch (err: any) {
      toast?.error(err.message || 'Notice', 'Approval');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Unified Studio Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white">SocialYolo AI Post Studio</h1>
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  UNIFIED POST ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400">Promptless Visual RAG &bull; Pinterest/Behance Intelligence &bull; Deterministic QA</p>
            </div>
          </div>

          {/* Right Header Controls: Credits & Tabs */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{creditBalance} Credits</span>
              <Link href="/dashboard/billing" className="text-[10px] text-brand-400 hover:text-brand-300 font-bold ml-1 underline">
                Top Up
              </Link>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'create'
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layout className="w-3.5 h-3.5" />
                Post Studio
              </button>
              <button
                onClick={() => setActiveTab('inspiration')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'inspiration'
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                Inspirations
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'projects'
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FolderPlus className="w-3.5 h-3.5" />
                Archive
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Unified Workspace */}
      <main className="max-w-7xl mx-auto p-6 md:p-8">
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 5 Cols: Unified Promptless Configuration Flow */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-brand-400" />
                    Autonomous Post Generation
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Select your brand &amp; creative intent. The AI retrieves visual patterns, handles typography hierarchy, and renders 4 master variations.
                  </p>
                </div>

                {/* Step 1 — Select Brand & Confirm Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-brand-400" />
                      Step 1 &mdash; Select Brand
                    </label>
                    <button
                      type="button"
                      onClick={openAddBrandModal}
                      className="text-[11px] font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Brand
                    </button>
                  </div>

                  {/* Brand Select Dropdown & Actions */}
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedBrandId}
                      onChange={(e) => setSelectedBrandId(e.target.value)}
                      className="flex-1 text-xs font-medium bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-brand-500"
                    >
                      {brands.length === 0 ? (
                        <option value="">Default Brand Profile</option>
                      ) : (
                        brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.industry || 'Lifestyle'})
                          </option>
                        ))
                      )}
                    </select>

                    {activeBrand && (
                      <button
                        type="button"
                        onClick={() => openEditBrandModal(activeBrand)}
                        title="Edit Brand"
                        className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowBrandDetails(!showBrandDetails)}
                      title="Toggle Brand Details"
                      className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white transition"
                    >
                      {showBrandDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Brand Details Confirmation Screen / Card */}
                  {showBrandDetails && activeBrand && (
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            {activeBrand.name}
                            <span className="text-[10px] font-medium text-slate-400">({activeBrand.industry || 'Retail'})</span>
                          </h4>
                          {activeBrand.websiteUrl && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Globe className="w-2.5 h-2.5" /> {activeBrand.websiteUrl}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> Brand Ready
                        </span>
                      </div>

                      {/* Color Palette Confirmation */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Colors</span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-slate-700 shadow-sm"
                              style={{ backgroundColor: activeBrand.primaryColor || '#6366f1' }}
                            />
                            <span className="text-[10px] font-mono text-slate-300">{activeBrand.primaryColor || '#6366f1'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-slate-700 shadow-sm"
                              style={{ backgroundColor: activeBrand.secondaryColor || '#ec4899' }}
                            />
                            <span className="text-[10px] font-mono text-slate-300">{activeBrand.secondaryColor || '#ec4899'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-slate-700 shadow-sm"
                              style={{ backgroundColor: activeBrand.accentColor || '#10b981' }}
                            />
                            <span className="text-[10px] font-mono text-slate-300">{activeBrand.accentColor || '#10b981'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Typography & Tone */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/40">
                        <span>Fonts: <strong className="text-slate-200">{activeBrand.fontHeading || 'Canela'}</strong> / <strong className="text-slate-200">{activeBrand.fontBody || 'Inter'}</strong></span>
                        <span className="truncate max-w-[150px]">Tone: <strong className="text-slate-200">{activeBrand.tone || 'Premium'}</strong></span>
                      </div>
                    </div>
                  )}

                  {/* Project / Campaign Title */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Campaign Title (Optional)</label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="e.g. Summer Drop Master"
                      className="w-full text-xs font-medium bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* Step 2 — Design Mode: Creative Design vs Meta / Social Ad */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-indigo-400" />
                    Step 2 &mdash; Choose Design Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDesignType('creative')}
                      className={`p-3.5 rounded-2xl border text-left transition ${
                        designType === 'creative'
                          ? 'border-brand-500 bg-brand-500/10 text-white ring-1 ring-brand-500'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white">Creative Design</span>
                        <Crown className="w-4 h-4 text-amber-400" />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        Behance / Pinterest visual quality, editorial polish &amp; luxury brand storytelling.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDesignType('meta_ad')}
                      className={`p-3.5 rounded-2xl border text-left transition ${
                        designType === 'meta_ad'
                          ? 'border-brand-500 bg-brand-500/10 text-white ring-1 ring-brand-500'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white">Meta / Social Ad</span>
                        <Zap className="w-4 h-4 text-rose-400" />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        Performance-driven conversion cards engineered for high CTR (&le;20% text rule compliant).
                      </p>
                    </button>
                  </div>
                </div>

                {/* Step 3 — Conditional Strategy */}
                {designType === 'creative' ? (
                  /* Creative Design: NO campaign objective; show Creative Type */
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                      <span>Step 3 &mdash; Creative Mode / Archetype</span>
                      <span className="text-[10px] text-brand-400 font-normal">AI Aesthetics Driven</span>
                    </label>
                    <div className="space-y-2">
                      {studioConfig.creativeTypes.map((ct) => (
                        <button
                          key={ct.id}
                          type="button"
                          onClick={() => setSelectedCreativeTypeId(ct.id)}
                          className={`w-full p-2.5 rounded-xl border text-left transition ${
                            selectedCreativeTypeId === ct.id
                              ? 'border-brand-500 bg-brand-500/10 text-white ring-1 ring-brand-500'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{ct.name}</span>
                            <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                              {ct.style}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{ct.subtitle}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Meta / Social Ad: Show Dynamic Campaign Objectives from Backend */
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                      <span>Step 3 &mdash; Campaign Objective</span>
                      <span className="text-[10px] text-indigo-400 font-normal">Meta Ad Standard</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {studioConfig.metaObjectives.map((obj) => (
                        <button
                          key={obj.id}
                          type="button"
                          onClick={() => setSelectedObjectiveId(obj.id)}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            selectedObjectiveId === obj.id
                              ? 'border-brand-500 bg-brand-500/10 text-white ring-1 ring-brand-500'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-xs font-bold text-white block">{obj.name}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 truncate">{obj.subtitle}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 4 — Optional Content & Copy (Promptless: no prompt engineering required) */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span>Optional Content &amp; Offer</span>
                    <span className="text-[10px] text-slate-500 font-normal">AI will infer if blank</span>
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Product / Service Name (optional)"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                    />

                    {designType === 'meta_ad' && (
                      <input
                        type="text"
                        placeholder="Offer or Discount (e.g. 20% OFF or Free Shipping)"
                        value={offer}
                        onChange={(e) => setOffer(e.target.value)}
                        className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                      />
                    )}

                    <input
                      type="text"
                      placeholder="Headline (leave empty for autonomous AI headline)"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                    />

                    {/* Quick CTA Presets */}
                    <div className="pt-1">
                      <span className="text-[10px] text-slate-400 block mb-1">Call to Action (CTA)</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {CTA_PRESETS.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setCta(p)}
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                              cta === p
                                ? 'border-brand-500 bg-brand-500 text-white'
                                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Note: Target Platform is excluded here and selected at Export */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-[11px] text-slate-400 flex items-center gap-2">
                  <Info className="w-4 h-4 text-brand-400 shrink-0" />
                  <span>
                    Generates 4 flexible master variations (1080&times;1350). Target platforms (Story, Square, Banner) are rescaled at export with safe-zone compliance.
                  </span>
                </div>

                {/* Main Launch Button */}
                <button
                  type="button"
                  onClick={handleLaunchGeneration}
                  disabled={isGenerating}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white font-bold text-sm shadow-xl shadow-brand-500/25 hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating 4 Master Variations...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Professional Post Designs
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right 7 Cols: Results & Promptless AI Studio Controls */}
            <div className="lg:col-span-7 space-y-6">
              {/* Progress Indicator with 10-Stage Pipeline */}
              {isGenerating && (
                <div className="p-6 rounded-3xl bg-slate-900 border border-brand-500/30 shadow-xl space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-400 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      {stageLabel}
                    </span>
                    <span className="text-xs font-mono font-bold text-white">{progressPct}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500 transition-all duration-300 rounded-full"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-2 text-[10px] text-slate-400">
                    <span className={progressPct >= 10 ? 'text-emerald-400 font-medium' : ''}>&bull; 1. Brand Intelligence</span>
                    <span className={progressPct >= 30 ? 'text-emerald-400 font-medium' : ''}>&bull; 3. Visual RAG Search</span>
                    <span className={progressPct >= 50 ? 'text-emerald-400 font-medium' : ''}>&bull; 5. Layout Planning</span>
                    <span className={progressPct >= 65 ? 'text-emerald-400 font-medium' : ''}>&bull; 6. Asset Generation</span>
                    <span className={progressPct >= 80 ? 'text-emerald-400 font-medium' : ''}>&bull; 7. Master Variations</span>
                    <span className={progressPct >= 95 ? 'text-emerald-400 font-medium' : ''}>&bull; 9. Deterministic QA</span>
                  </div>
                </div>
              )}

              {/* Generated Variations Gallery */}
              {generationResult && generationResult.variations && (
                <div className="space-y-6">
                  {/* Archetype Concepts Bar */}
                  {concepts.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-brand-400" />
                        Synthesized 4 Concept Archetypes
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {concepts.map((concept, idx) => (
                          <div
                            key={concept.id}
                            className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-left space-y-1"
                          >
                            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400">
                              {concept.badge || `Concept ${idx + 1}`}
                            </span>
                            <h4 className="text-xs font-bold text-white truncate">{concept.name}</h4>
                            <p className="text-[10px] text-slate-400 line-clamp-2">{concept.direction}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4 Distinct Master Variations Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {generationResult.variations.map((v) => {
                      const isSelected = selectedVariation?.id === v.id;
                      return (
                        <div
                          key={v.id}
                          onClick={() => setSelectedVariation(v)}
                          className={`cursor-pointer rounded-2xl border transition-all overflow-hidden flex flex-col bg-slate-900 ${
                            isSelected
                              ? 'border-brand-500 ring-2 ring-brand-500/40 shadow-xl'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="relative aspect-[4/5] bg-black overflow-hidden flex items-center justify-center">
                            <img
                              src={v.renderUrl}
                              alt={v.label}
                              className="w-full h-full object-contain"
                            />
                            <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/75 backdrop-blur text-white">
                              {v.conceptStyle}
                            </span>
                          </div>
                          <div className="p-2.5 flex items-center justify-between border-t border-slate-800">
                            <span className="text-xs font-bold text-white truncate">{v.label.split('—')[0]}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              QA {v.qualityScore}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Active Selected Variation Detail & 10 Promptless AI Edit Buttons */}
                  {selectedVariation && (
                    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white">{selectedVariation.label}</h3>
                            {selectedVariation.isApproved && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Approved Flywheel
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Canvas: {selectedVariation.width} &times; {selectedVariation.height} px &bull; Text coverage: {selectedVariation.textCoveragePct}% ({selectedVariation.metaPass ? 'Meta Ad Compliant' : 'Creative Format'})
                          </p>
                        </div>

                        {/* Top Action Buttons: QA, Export, Approve */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowValidationDrawer(true)}
                            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-white hover:bg-slate-700 transition flex items-center gap-1.5"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            Validation Report
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowExportModal(true)}
                            className="px-3 py-1.5 rounded-xl bg-brand-600 text-xs font-bold text-white hover:bg-brand-500 transition flex items-center gap-1.5 shadow"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Export Asset
                          </button>

                          {!selectedVariation.isApproved && (
                            <button
                              type="button"
                              onClick={handleApprove}
                              className="px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Main Canvas View */}
                      <div className="relative rounded-2xl bg-black border border-slate-800 p-4 flex items-center justify-center min-h-[380px]">
                        <img
                          src={selectedVariation.renderUrl}
                          alt="Rendered Creative Canvas"
                          className="max-h-[460px] object-contain rounded-lg shadow-2xl"
                        />
                        {isRefining && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-6 h-6 text-brand-400 animate-spin" />
                            <span className="text-xs font-bold text-white">Applying AI Refinement...</span>
                          </div>
                        )}
                      </div>

                      {/* 10 Promptless AI Edit Buttons */}
                      <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                          10 Promptless AI Refinements (1-Click)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          <button
                            type="button"
                            disabled={isRefining}
                            onClick={() => handleAiEdit('improve_design')}
                            className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-300 hover:text-white hover:border-brand-500 transition text-center"
                          >
                            ✨ Improve Design
                          </button>
                          <button
                            type="button"
                            disabled={isRefining}
                            onClick={() => handleAiEdit('make_more_minimal')}
                            className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-300 hover:text-white hover:border-brand-500 transition text-center"
                          >
                            🌿 More Minimal
                          </button>
                          <button
                            type="button"
                            disabled={isRefining}
                            onClick={() => handleAiEdit('make_more_premium')}
                            className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-300 hover:text-white hover:border-brand-500 transition text-center"
                          >
                            👑 More Premium
                          </button>
                          <button
                            type="button"
                            disabled={isRefining}
                            onClick={() => handleAiEdit('make_more_bold')}
                            className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-300 hover:text-white hover:border-brand-500 transition text-center"
                          >
                            ⚡ More Bold
                          </button>
                          <button
                            type="button"
                            disabled={isRefining}
                            onClick={() => handleAiEdit('change_layout')}
                            className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-300 hover:text-white hover:border-brand-500 transition text-center"
                          >
                            📐 Change Layout
                          </button>
                          <button
                            type="button"
                            disabled={isRefining}
                            onClick={() => handleAiEdit('change_typography')}
                            className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-300 hover:text-white hover:border-brand-500 transition text-center"
                          >
                            🔤 Swap Fonts
                          </button>
                          <button
                            type="button"
                            disabled={isRefining}
                            onClick={() => handleAiEdit('improve_contrast')}
                            className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-300 hover:text-white hover:border-brand-500 transition text-center"
                          >
                            ☀️ High Contrast
                          </button>
                          <button
                            type="button"
                            disabled={isRefining}
                            onClick={() => handleAiEdit('use_brand_colors')}
                            className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-300 hover:text-white hover:border-brand-500 transition text-center"
                          >
                            🎨 Brand Palette
                          </button>
                          <button
                            type="button"
                            disabled={isRefining}
                            onClick={() => handleAiEdit('replace_image')}
                            className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-300 hover:text-white hover:border-brand-500 transition text-center"
                          >
                            🖼️ Alt Visual
                          </button>
                          <button
                            type="button"
                            disabled={isRefining}
                            onClick={() => handleAiEdit('generate_variation')}
                            className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-300 hover:text-white hover:border-brand-500 transition text-center"
                          >
                            🎲 New Variation
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Initial State / Empty State */}
              {!isGenerating && !generationResult && (
                <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto border border-brand-500/20">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Unified AI Post Studio</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Select your brand and design mode on the left. The engine autonomously analyzes your brand identity, retrieves Behance &amp; Pinterest inspiration patterns, and delivers 4 distinct master variations.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Inspirations Explorer */}
        {activeTab === 'inspiration' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-brand-400" />
                  Visual Design Reference Explorer
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Inspiration intelligence queried across Pinterest, Behance, and curated high-converting designs.
                </p>
              </div>

              {/* Source Filter */}
              <div className="flex items-center gap-2">
                {(['all', 'pinterest', 'behance', 'internal'] as const).map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => {
                      setInspirationSource(src);
                      searchDesignInspirationsApi({ source: src }).then((res) => setInspirations(res || []));
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border uppercase tracking-wider transition ${
                      inspirationSource === src
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {src}
                  </button>
                ))}
              </div>
            </div>

            {/* Inspirations Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {inspirations.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col group hover:border-brand-500 transition shadow-sm"
                >
                  <div className="relative aspect-[3/4] bg-black overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-2 left-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-black/70 backdrop-blur text-white">
                      {item.source || 'Curated'}
                    </span>
                  </div>
                  <div className="p-3 space-y-1">
                    <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                    <p className="text-[10px] text-slate-400 truncate">{item.style || 'Modern Design'}</p>
                    <button
                      type="button"
                      onClick={() => {
                        saveDesignInspirationToBoardApi(item.id, 'Studio Favorites');
                        toast?.success('Reference pinned to inspiration board.', 'Saved');
                      }}
                      className="w-full mt-2 py-1 rounded-lg border border-slate-800 bg-slate-950 text-[10px] font-bold text-slate-300 hover:text-white hover:border-brand-500 transition"
                    >
                      Pin Reference
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Saved Projects Archive */}
        {activeTab === 'projects' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-brand-400" />
                  Design Projects Archive
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Manage active social campaigns, historical generation runs, and exported assets.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {savedProjects.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl border border-slate-800 bg-slate-900 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400">
                      {p.outputMode || 'creative'}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{p.name}</h4>
                  <p className="text-xs text-slate-400">Brand: {p.brandName || 'Default Brand'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Brand Modal (Add / Edit Brand with URL extraction & manual setup) */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-brand-400" />
                <h3 className="text-base font-bold text-white">
                  {brandModalMode === 'add' ? 'Add New Brand Profile' : 'Edit Brand Profile'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBrandModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Creation Tabs if Add Mode */}
            {brandModalMode === 'add' && (
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setBrandCreationTab('url')}
                  className={`py-2 text-xs font-bold rounded-lg transition ${
                    brandCreationTab === 'url' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Analyze Website (AI)
                </button>
                <button
                  type="button"
                  onClick={() => setBrandCreationTab('manual')}
                  className={`py-2 text-xs font-bold rounded-lg transition ${
                    brandCreationTab === 'manual' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Manual Setup
                </button>
              </div>
            )}

            {/* Option A: Analyze Website */}
            {brandModalMode === 'add' && brandCreationTab === 'url' ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Enter your brand website URL. SocialYolo will extract colors, typography, and brand identity automatically.
                </p>
                <div className="space-y-2">
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={brandFormUrl}
                    onChange={(e) => setBrandFormUrl(e.target.value)}
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={handleAnalyzeBrandUrl}
                    disabled={analyzingUrl}
                    className="w-full py-3 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-500 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {analyzingUrl ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Analyzing Website Assets...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Analyze Website &amp; Extract Brand
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Option B: Manual Setup / Edit Form */
              <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Brand Name *</label>
                  <input
                    type="text"
                    value={brandForm.name}
                    onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                    placeholder="e.g. Apex Studio"
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Industry</label>
                    <input
                      type="text"
                      value={brandForm.industry}
                      onChange={(e) => setBrandForm({ ...brandForm, industry: e.target.value })}
                      placeholder="e.g. Fashion & Retail"
                      className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Website URL</label>
                    <input
                      type="text"
                      value={brandForm.websiteUrl}
                      onChange={(e) => setBrandForm({ ...brandForm, websiteUrl: e.target.value })}
                      placeholder="e.g. https://apex.io"
                      className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* Brand Colors */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Brand Colors (Primary / Secondary / Accent)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
                      <input
                        type="color"
                        value={brandForm.primaryColor}
                        onChange={(e) => setBrandForm({ ...brandForm, primaryColor: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={brandForm.primaryColor}
                        onChange={(e) => setBrandForm({ ...brandForm, primaryColor: e.target.value })}
                        className="w-full text-[10px] font-mono bg-transparent text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
                      <input
                        type="color"
                        value={brandForm.secondaryColor}
                        onChange={(e) => setBrandForm({ ...brandForm, secondaryColor: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={brandForm.secondaryColor}
                        onChange={(e) => setBrandForm({ ...brandForm, secondaryColor: e.target.value })}
                        className="w-full text-[10px] font-mono bg-transparent text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
                      <input
                        type="color"
                        value={brandForm.accentColor}
                        onChange={(e) => setBrandForm({ ...brandForm, accentColor: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={brandForm.accentColor}
                        onChange={(e) => setBrandForm({ ...brandForm, accentColor: e.target.value })}
                        className="w-full text-[10px] font-mono bg-transparent text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Typography with Default List of Fonts */}
                <div className="space-y-3 pt-1 border-t border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-brand-400" />
                      Brand Typography
                    </label>
                    <span className="text-[10px] text-slate-400">Heading &amp; Body Font Pairing</span>
                  </div>

                  {/* Quick Load Default Pairings */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 block font-medium">Quick Load Default Pairings:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {DEFAULT_FONT_PAIRINGS.map((pair) => {
                        const isSelected =
                          brandForm.fontHeading === pair.heading && brandForm.fontBody === pair.body;
                        return (
                          <button
                            key={pair.name}
                            type="button"
                            onClick={() => {
                              setCustomFontHeading(false);
                              setCustomFontBody(false);
                              setBrandForm({
                                ...brandForm,
                                fontHeading: pair.heading,
                                fontBody: pair.body,
                              });
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition flex items-center gap-1 ${
                              isSelected
                                ? 'border-brand-500 bg-brand-500/20 text-brand-300 ring-1 ring-brand-500'
                                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                          >
                            <span>{pair.heading} + {pair.body}</span>
                            <span className="text-[8.5px] px-1 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                              {pair.tag}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Heading & Body Font Selectors from Default Font List */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-400">Heading Font</label>
                        <button
                          type="button"
                          onClick={() => setCustomFontHeading(!customFontHeading)}
                          className="text-[9.5px] text-brand-400 hover:text-brand-300 hover:underline font-medium"
                        >
                          {customFontHeading ? 'Select from List' : 'Custom'}
                        </button>
                      </div>

                      {customFontHeading ? (
                        <input
                          type="text"
                          value={brandForm.fontHeading}
                          onChange={(e) => setBrandForm({ ...brandForm, fontHeading: e.target.value })}
                          placeholder="e.g. Canela, Playfair"
                          className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                        />
                      ) : (
                        <select
                          value={brandForm.fontHeading}
                          onChange={(e) => setBrandForm({ ...brandForm, fontHeading: e.target.value })}
                          className="w-full text-xs font-semibold bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500 cursor-pointer"
                        >
                          {!DEFAULT_FONT_CATEGORIES.some((cat) => cat.fonts.includes(brandForm.fontHeading)) && (
                            <option value={brandForm.fontHeading}>{brandForm.fontHeading} (Active)</option>
                          )}
                          {DEFAULT_FONT_CATEGORIES.map((cat) => (
                            <optgroup key={cat.category} label={cat.category} className="bg-slate-900 text-slate-400 font-bold">
                              {cat.fonts.map((f) => (
                                <option key={f} value={f} className="bg-slate-950 text-white font-normal py-1">
                                  {f}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-400">Body Font</label>
                        <button
                          type="button"
                          onClick={() => setCustomFontBody(!customFontBody)}
                          className="text-[9.5px] text-brand-400 hover:text-brand-300 hover:underline font-medium"
                        >
                          {customFontBody ? 'Select from List' : 'Custom'}
                        </button>
                      </div>

                      {customFontBody ? (
                        <input
                          type="text"
                          value={brandForm.fontBody}
                          onChange={(e) => setBrandForm({ ...brandForm, fontBody: e.target.value })}
                          placeholder="e.g. Inter, Helvetica"
                          className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                        />
                      ) : (
                        <select
                          value={brandForm.fontBody}
                          onChange={(e) => setBrandForm({ ...brandForm, fontBody: e.target.value })}
                          className="w-full text-xs font-semibold bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500 cursor-pointer"
                        >
                          {!DEFAULT_FONT_CATEGORIES.some((cat) => cat.fonts.includes(brandForm.fontBody)) && (
                            <option value={brandForm.fontBody}>{brandForm.fontBody} (Active)</option>
                          )}
                          {DEFAULT_FONT_CATEGORIES.map((cat) => (
                            <optgroup key={cat.category} label={cat.category} className="bg-slate-900 text-slate-400 font-bold">
                              {cat.fonts.map((f) => (
                                <option key={f} value={f} className="bg-slate-950 text-white font-normal py-1">
                                  {f}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Typography Preview */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[9.5px] text-slate-500 block uppercase tracking-wider font-semibold">Active Typography Pairing</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <strong className="text-white text-xs">{brandForm.fontHeading}</strong>
                        <span className="text-slate-500 text-[10px]">&bull;</span>
                        <span className="text-slate-300 text-xs font-medium">{brandForm.fontBody}</span>
                      </div>
                    </div>
                    <span className="text-xs text-brand-400 font-semibold px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">
                      Aa Bb Gg 123
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Brand Voice / Tone</label>
                  <input
                    type="text"
                    value={brandForm.tone}
                    onChange={(e) => setBrandForm({ ...brandForm, tone: e.target.value })}
                    placeholder="e.g. Minimalist, Bold & Direct"
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveBrand}
                  className="w-full py-3 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-500 transition shadow mt-2"
                >
                  Save Brand Profile
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Validation Report Drawer */}
      {showValidationDrawer && validationReport && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Automated QA Validation Report</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowValidationDrawer(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs text-slate-400 block">Overall Quality Score</span>
                <span className="text-2xl font-black text-white">{validationReport.score}/100</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Status</span>
                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-full ${
                    validationReport.status === 'PASS'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {validationReport.status}
                </span>
              </div>
            </div>

            {/* Passed Checks */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Passed Verifications</span>
              {validationReport.passedChecks.map((check, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{check}</span>
                </div>
              ))}
            </div>

            {/* Issues if any */}
            {validationReport.issues && validationReport.issues.length > 0 && (
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Auto-Fix Warnings</span>
                {validationReport.issues.map((issue, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                    <p className="text-xs font-medium text-amber-200">{issue.message}</p>
                    {issue.autoFixRecommendation && (
                      <p className="text-[11px] text-amber-300/80">&bull; Recommendation: {issue.autoFixRecommendation}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export & Platform Adaptation Modal */}
      {showExportModal && selectedVariation && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-brand-400" />
                <h3 className="text-base font-bold text-white">Platform Safe-Zone Export</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Platform Selector (Occurs here at Export as required) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Select Target Platform</span>
                <span className="text-[10px] text-brand-400">Safe-Zone Auto Rescaling</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {studioConfig.exportPlatforms.map((plat) => (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => setExportPlatformId(plat.id)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      exportPlatformId === plat.id
                        ? 'border-brand-500 bg-brand-500/10 text-white ring-1 ring-brand-500'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">{plat.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{plat.aspectRatio}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{plat.width}&times;{plat.height} px</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Format & Scale */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">File Format</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['png', 'jpg', 'webp'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setExportFormat(fmt)}
                      className={`py-2 rounded-xl text-xs font-bold uppercase border transition ${
                        exportFormat === fmt
                          ? 'border-brand-500 bg-brand-500 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Resolution Scale</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { scale: 1, label: '1x' },
                    { scale: 2, label: '2x' },
                    { scale: 4, label: '4x' },
                  ].map((s) => (
                    <button
                      key={s.scale}
                      type="button"
                      onClick={() => setExportScale(s.scale)}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        exportScale === s.scale
                          ? 'border-brand-500 bg-brand-500 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Credit Accounting Notice */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-white font-bold block">Credit Accounting</span>
                  <span className="text-[11px] text-slate-400">
                    Cost: {exportScale > 1 ? '2 Credits (High-Res)' : '1 Credit (Standard)'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[11px] block">Your Balance</span>
                <span className="text-white font-mono font-bold">{creditBalance} Credits</span>
              </div>
            </div>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold text-xs shadow-xl shadow-brand-500/20 hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Rescaling &amp; Exporting Asset...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download High-Resolution Asset
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
