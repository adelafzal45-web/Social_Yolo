'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Sliders,
  FolderPlus,
  Target,
  Palette,
  FileText,
  AlertCircle,
} from 'lucide-react';
import {
  BrandProfile,
  CreativeGeneration,
  CreativeVariation,
  SmartDefaultsResult,
} from '@/lib/types';
import {
  startStudioGenerationApi,
  getStudioGenerationApi,
  subscribeStudioProgressStream,
  refineStudioVariationApi,
  getBrandSmartDefaultsApi,
} from '@/lib/api';

// Step components
import { StepBrandIntelligence } from './StepBrandIntelligence';
import { StepDesignTypeObjective } from './StepDesignTypeObjective';
import { StepCreativeStyleConfig } from './StepCreativeStyleConfig';
import { StepPlatformDimensions } from './StepPlatformDimensions';
import { StepContentOptional } from './StepContentOptional';
import { GenerationProgressModal } from './GenerationProgressModal';
import { VariationsGalleryView } from './VariationsGalleryView';
import { DesignReferenceAdminView } from './DesignReferenceAdminView';

interface CreativeStudioWorkspaceProps {
  brands: BrandProfile[];
  initialBrandId?: string;
  onBrandCreatedOrUpdated?: (brand: BrandProfile) => void;
}

export function CreativeStudioWorkspace({
  brands,
  initialBrandId,
  onBrandCreatedOrUpdated,
}: CreativeStudioWorkspaceProps) {
  // Top-level tab: Studio or Reference Library
  const [activeTab, setActiveTab] = useState<'studio' | 'rag_library'>('studio');

  // Wizard Step (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State: Step 1
  const [projectName, setProjectName] = useState<string>('Spring Brand Campaign');
  const [campaign, setCampaign] = useState<string>('Q1 Growth');
  const [platform, setPlatform] = useState<string>('Instagram Post');

  // Form State: Step 2
  const [selectedBrandId, setSelectedBrandId] = useState<string>(
    initialBrandId || (brands[0]?.id ?? '')
  );
  const [brandColors, setBrandColors] = useState<string[]>([
    '#7C5CFF',
    '#E0AA4E',
    '#1E1B4B',
  ]);
  const [fontHeading, setFontHeading] = useState<string>('Playfair Display');
  const [fontBody, setFontBody] = useState<string>('Inter');
  const [brandTone, setBrandTone] = useState<string>('Luxury, modern, confident');

  // Form State: Step 3
  const [designType, setDesignType] = useState<'creative' | 'meta_ad'>('creative');
  const [objective, setObjective] = useState<string>('conversion');

  // Form State: Step 4
  const [style, setStyle] = useState<string>('Minimalist Modern');
  const [composition, setComposition] = useState<string>('Split Screen');
  const [mood, setMood] = useState<string>('Sophisticated & Calm');
  const [cta, setCta] = useState<string>('Shop Now');

  // Form State: Step 5
  const [productName, setProductName] = useState<string>('');
  const [headline, setHeadline] = useState<string>('');
  const [subheadline, setSubheadline] = useState<string>('');
  const [offer, setOffer] = useState<string>('');
  const [customCta, setCustomCta] = useState<string>('');

  // AI Smart Defaults
  const [smartDefaults, setSmartDefaults] = useState<SmartDefaultsResult | null>(null);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState<boolean>(false);

  // Generation / Job execution state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [currentStage, setCurrentStage] = useState<string>('ANALYZING_BRAND');
  const [stageMessage, setStageMessage] = useState<string>('');
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Result state
  const [completedGeneration, setCompletedGeneration] = useState<CreativeGeneration | null>(null);
  const [variations, setVariations] = useState<CreativeVariation[]>([]);
  const [isRefining, setIsRefining] = useState<boolean>(false);

  // Fetch Smart Defaults when Brand or Objective changes
  useEffect(() => {
    if (!selectedBrandId) return;

    let isMounted = true;
    setIsLoadingDefaults(true);

    getBrandSmartDefaultsApi(selectedBrandId, {
      platform,
      designType,
      objective,
    })
      .then((res) => {
        if (isMounted && res) {
          setSmartDefaults(res);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingDefaults(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBrandId, platform, designType, objective]);

  // Handle Launch Generation
  const handleLaunchGeneration = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setProgressPct(5);
    setCurrentStage('ANALYZING_BRAND');
    setStageMessage('Initializing AI Creative Intelligence pipeline...');

    try {
      const response = await startStudioGenerationApi({
        brandId: selectedBrandId || undefined,
        projectName: projectName.trim() || 'SocialYolo Project',
        designType,
        objective,
        style,
        composition,
        mood,
        cta: customCta.trim() || cta,
        platform,
        productName: productName.trim() || undefined,
        headline: headline.trim() || undefined,
        subheadline: subheadline.trim() || undefined,
        offer: offer.trim() || undefined,
      });

      const jobId = response.jobId;
      setActiveJobId(jobId);

      // Subscribe to real-time SSE stream
      subscribeStudioProgressStream(
        jobId,
        (event) => {
          if (event.progressPct !== undefined) {
            setProgressPct(event.progressPct);
          }
          if (event.stage) {
            setCurrentStage(event.stage);
          }
          if (event.message) {
            setStageMessage(event.message);
          }
        },
        async (incomingVariations) => {
          // Finished!
          try {
            const finalData = await getStudioGenerationApi(jobId);
            setCompletedGeneration(finalData);
            setVariations(
              incomingVariations && incomingVariations.length > 0
                ? incomingVariations
                : finalData.variations || []
            );
          } catch {
            if (incomingVariations) {
              setVariations(incomingVariations);
            }
          } finally {
            setIsGenerating(false);
          }
        },
        (err) => {
          console.warn('SSE stream notice:', err);
        }
      );
    } catch (err: any) {
      setGenerationError(err.message || 'Failed to start creative generation pipeline.');
      setIsGenerating(false);
    }
  };

  // Handle Variation Refinement
  const handleRefineVariation = async (
    variationId: string,
    action: string,
    customCtaInput?: string
  ) => {
    setIsRefining(true);
    try {
      const updated = await refineStudioVariationApi(variationId, action, customCtaInput);
      setVariations((prev) =>
        prev.map((v) => (v.id === updated.id ? { ...v, ...updated } : v))
      );
    } catch (err: any) {
      alert(`Refinement failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsRefining(false);
    }
  };

  // Steps definition for visual indicator (matching master specification: Project & Brand -> Design Type -> Style -> Platform -> Generate)
  const STEPS_NAV = [
    { num: 1, label: 'Project & Brand', icon: Palette },
    { num: 2, label: 'Design Type', icon: Target },
    { num: 3, label: 'Style & Mood', icon: Sliders },
    { num: 4, label: 'Platform', icon: Layers },
    { num: 5, label: 'Generate', icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </span>
            <span>AI Creative Design Studio</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Autonomous high-end social media design generator driven by Visual RAG and Deterministic Typography. No prompts required.
          </p>
        </div>

        {/* View Switcher: Studio Generator vs Visual RAG Library */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'studio'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Studio Generator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rag_library')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'rag_library'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Visual RAG Library</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'rag_library' ? (
        <DesignReferenceAdminView />
      ) : variations.length > 0 && completedGeneration ? (
        /* Variations Gallery View */
        <VariationsGalleryView
          generation={completedGeneration}
          variations={variations}
          onRefineVariation={handleRefineVariation}
          onBackToConfig={() => {
            setCompletedGeneration(null);
            setVariations([]);
          }}
          isRefining={isRefining}
        />
      ) : (
        /* 5-Step Generator Wizard */
        <div className="space-y-8">
          {/* Stepper Progress Bar with Linear Completion Track */}
          <div className="p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            {/* Slim gradient progress indicator */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
              {STEPS_NAV.map((s) => {
                const Icon = s.icon;
                const isPassed = currentStep > s.num;
                const isCurrent = currentStep === s.num;

                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => setCurrentStep(s.num)}
                    className={`flex items-center gap-2 sm:gap-2.5 p-2 sm:p-3 rounded-2xl text-left transition-all duration-200 group cursor-pointer ${
                      isCurrent
                        ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold border border-brand-500/30 shadow-xs'
                        : isPassed
                        ? 'text-slate-800 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                        isCurrent
                          ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-500/30'
                          : isPassed
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                    </div>
                    <div className="hidden md:block min-w-0">
                      <p className="text-[10px] uppercase font-bold text-slate-400 truncate">
                        Step {s.num}
                      </p>
                      <p className="text-xs font-bold truncate">{s.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Banner */}
          {generationError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{generationError}</span>
            </div>
          )}

          {/* Active Step Content */}
          <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            {currentStep === 1 && (
              <StepBrandIntelligence
                brands={brands}
                selectedBrandId={selectedBrandId}
                setSelectedBrandId={setSelectedBrandId}
                brandColors={brandColors}
                setBrandColors={setBrandColors}
                fontHeading={fontHeading}
                setFontHeading={setFontHeading}
                fontBody={fontBody}
                setFontBody={setFontBody}
                brandTone={brandTone}
                setBrandTone={setBrandTone}
                projectName={projectName}
                setProjectName={setProjectName}
                campaign={campaign}
                setCampaign={setCampaign}
                onBrandCreatedOrUpdated={onBrandCreatedOrUpdated}
              />
            )}

            {currentStep === 2 && (
              <StepDesignTypeObjective
                designType={designType}
                setDesignType={setDesignType}
                objective={objective}
                setObjective={setObjective}
              />
            )}

            {currentStep === 3 && (
              <StepCreativeStyleConfig
                style={style}
                setStyle={setStyle}
                composition={composition}
                setComposition={setComposition}
                mood={mood}
                setMood={setMood}
                cta={cta}
                setCta={setCta}
                smartDefaults={smartDefaults}
                isLoadingDefaults={isLoadingDefaults}
              />
            )}

            {currentStep === 4 && (
              <StepPlatformDimensions
                platform={platform}
                setPlatform={setPlatform}
                onContinue={() => setCurrentStep(5)}
              />
            )}

            {currentStep === 5 && (
              <StepContentOptional
                productName={productName}
                setProductName={setProductName}
                headline={headline}
                setHeadline={setHeadline}
                subheadline={subheadline}
                setSubheadline={setSubheadline}
                offer={offer}
                setOffer={setOffer}
                customCta={customCta}
                setCustomCta={setCustomCta}
                projectName={projectName}
                platform={platform}
                designType={designType}
                objective={objective}
                style={style}
                composition={composition}
                onGenerate={handleLaunchGeneration}
                isGenerating={isGenerating}
              />
            )}

            {/* Stepper Navigation Footer */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back: {STEPS_NAV[currentStep - 2]?.label}</span>
                </button>
              ) : (
                <div />
              )}

              {currentStep < 5 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <span>Continue: {STEPS_NAV[currentStep]?.label}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generation Progress Modal */}
      <GenerationProgressModal
        isOpen={isGenerating}
        progressPct={progressPct}
        currentStage={currentStage}
        stageMessage={stageMessage}
        onCancel={() => setIsGenerating(false)}
      />
    </div>
  );
}
