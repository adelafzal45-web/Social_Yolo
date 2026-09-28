'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import {
  createGuidedPost,
  removeBackground,
  getBrandsApi,
  ratePost,
  toggleFavoritePost,
  extractBrandFromUrlApi,
} from '@/lib/api';
import { BrandProfile } from '@/lib/types';

// Wizard Step Components
import { StepIndicator } from './wizard/StepIndicator';
import { BrandStep } from './wizard/BrandStep';
import { PostTypeStep, POST_TYPES } from './wizard/PostTypeStep';
import { IdeaStep } from './wizard/IdeaStep';
import { AudienceStep } from './wizard/AudienceStep';
import { StyleStep } from './wizard/StyleStep';
import { PlatformStep, PLATFORMS } from './wizard/PlatformStep';
import { VisualDirectionStep } from './wizard/VisualDirectionStep';
import { ReviewStep } from './wizard/ReviewStep';
import { GenerationState } from './wizard/GenerationState';
import { PostResult } from './wizard/PostResult';
import { WizardFormData, FinalPostResult, UploadedProductImage } from './wizard/types';

interface PostGeneratorProps {
  initialPrompt?: string;
  onPostGenerated?: (post: any) => void;
}

export function PostGenerator({ initialPrompt = '', onPostGenerated }: PostGeneratorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();
  const { toast, refreshNotifications } = useNotification();

  // Active view: 'wizard' (steps 1-8) | 'generating' | 'result'
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'wizard' | 'generating' | 'result'>('wizard');

  // Saved brands
  const [brands, setBrands] = useState<BrandProfile[]>([]);

  // Master Wizard State
  const [formData, setFormData] = useState<WizardFormData>({
    brand: {
      brandProfileId: '',
      websiteUrl: '',
      brandName: '',
      niche: '',
      tagline: '',
      description: '',
      primaryColor: '#7c5cff',
      secondaryColor: '#e0aa4e',
      accentColor: '#ffffff',
      fontHeading: 'Playfair Display',
      fontBody: 'Inter',
      tone: 'Luxury & Elegant',
      logoFile: null,
      logoUrl: null,
    },
    postType: 'promotional',
    customPostType: '',
    idea: initialPrompt || '',
    audiences: ['Customers'],
    customAudience: '',
    style: 'luxury',
    platform: 'instagram',
    aspectRatio: '1:1',
    visualDirection: 'ai_decide',
    productImages: [],
    productFile: null,
    rawOriginalUrl: null,
    cutoutUrl: null,
    modelFile: null,
    modelRawUrl: null,
    modelCutoutUrl: null,
    backgroundMode: 'ai_replace',
    variationsCount: 1,
  });

  // Asset processing state
  const [isProcessingAsset, setIsProcessingAsset] = useState<boolean>(false);
  const [isProcessingModel, setIsProcessingModel] = useState<boolean>(false);

  // Generation progress state
  const [genStageIndex, setGenStageIndex] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(25);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Result state
  const [generatedPost, setGeneratedPost] = useState<FinalPostResult | null>(null);

  const userCredits = user?.credits ?? 50;

  // Load saved brand profiles on mount
  useEffect(() => {
    getBrandsApi()
      .then((items) => {
        setBrands(items);
        if (items.length > 0) {
          const def = items.find((b) => b.isDefault) || items[0];
          setFormData((prev) => ({
            ...prev,
            brand: {
              ...prev.brand,
              brandProfileId: def.id,
              brandName: def.brandName || prev.brand.brandName || 'My Brand',
              websiteUrl: def.websiteUrl || prev.brand.websiteUrl,
              niche: def.niche || prev.brand.niche,
              tagline: def.tagline || prev.brand.tagline,
              description: def.description || prev.brand.description,
              primaryColor: def.primaryColor || prev.brand.primaryColor,
              secondaryColor: def.secondaryColor || prev.brand.secondaryColor,
              accentColor: def.accentColor || prev.brand.accentColor,
              tone: def.tone || prev.brand.tone,
              fontHeading: def.fontHeading || prev.brand.fontHeading,
              fontBody: def.fontBody || prev.brand.fontBody,
              logoUrl: def.logoUrl || prev.brand.logoUrl,
            },
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Sync query parameters (?url=https://... and ?platform=...)
  useEffect(() => {
    const qUrl = searchParams.get('url');
    if (qUrl) {
      setFormData((prev) => ({
        ...prev,
        brand: { ...prev.brand, websiteUrl: qUrl },
      }));
      extractBrandFromUrlApi(qUrl)
        .then((b) => {
          if (b && (b.brandName || b.url)) {
            setFormData((prev) => ({
              ...prev,
              brand: {
                ...prev.brand,
                brandName: b.brandName || prev.brand.brandName,
                niche: b.niche || prev.brand.niche,
                tagline: b.tagline || prev.brand.tagline,
                description: b.description || prev.brand.description,
                primaryColor: b.primaryColor || prev.brand.primaryColor,
                secondaryColor: b.secondaryColor || prev.brand.secondaryColor,
                accentColor: b.accentColor || prev.brand.accentColor,
                fontHeading: b.fontHeading || prev.brand.fontHeading,
                fontBody: b.fontBody || prev.brand.fontBody,
                tone: b.tone || prev.brand.tone,
                logoUrl: b.logoUrl || prev.brand.logoUrl,
              },
            }));
            toast.success(`Brand identity loaded for ${b.brandName || qUrl}!`, 'Brand DNA Ready');
          }
        })
        .catch(() => {});
    }

    const qPlatform = searchParams.get('platform');
    if (qPlatform) {
      const platKey = qPlatform.toLowerCase().trim();
      const platObj = PLATFORMS.find((p) => p.id === platKey);
      if (platObj) {
        setFormData((prev) => ({
          ...prev,
          platform: platKey,
          aspectRatio: platObj.defaultRatio,
        }));
      }
    }
  }, [searchParams]);

  // Handle multi-product photo upload & background removal
  const handleAddProductImages = async (newFiles: File[]) => {
    if (!newFiles.length) return;
    const newItems: UploadedProductImage[] = newFiles.map((f) => ({
      id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file: f,
      rawUrl: URL.createObjectURL(f),
      cutoutUrl: null,
      isProcessing: true,
    }));

    setFormData((prev) => {
      const updated = [...prev.productImages, ...newItems];
      return {
        ...prev,
        productImages: updated,
        productFile: updated[0]?.file || null,
        rawOriginalUrl: updated[0]?.rawUrl || null,
        cutoutUrl: updated[0]?.cutoutUrl || null,
      };
    });

    // Process background removal for each newly added file
    for (const item of newItems) {
      try {
        const res = await removeBackground(item.file, {
          model: 'u2net_human_seg',
          preserveText: true,
        });
        setFormData((prev) => {
          const updated = prev.productImages.map((p) =>
            p.id === item.id ? { ...p, cutoutUrl: res.url, isProcessing: false } : p
          );
          return {
            ...prev,
            productImages: updated,
            cutoutUrl: updated[0]?.cutoutUrl || null,
          };
        });
      } catch {
        setFormData((prev) => {
          const updated = prev.productImages.map((p) =>
            p.id === item.id ? { ...p, cutoutUrl: item.rawUrl, isProcessing: false } : p
          );
          return {
            ...prev,
            productImages: updated,
            cutoutUrl: updated[0]?.cutoutUrl || null,
          };
        });
      }
    }
  };

  const handleRemoveProductImage = (id: string) => {
    setFormData((prev) => {
      const updated = prev.productImages.filter((p) => p.id !== id);
      return {
        ...prev,
        productImages: updated,
        productFile: updated[0]?.file || null,
        rawOriginalUrl: updated[0]?.rawUrl || null,
        cutoutUrl: updated[0]?.cutoutUrl || null,
      };
    });
  };

  const handleClearAllProductImages = () => {
    setFormData((prev) => ({
      ...prev,
      productImages: [],
      productFile: null,
      rawOriginalUrl: null,
      cutoutUrl: null,
    }));
  };

  // Backwards compatibility for single product upload
  const handleUploadProductFile = async (f: File) => {
    await handleAddProductImages([f]);
  };

  const handleRemoveProductFile = () => {
    handleClearAllProductImages();
  };

  // Handle model picture upload & background isolation
  const handleUploadModelFile = async (f: File) => {
    const rawUrl = URL.createObjectURL(f);
    setFormData((prev) => ({
      ...prev,
      modelFile: f,
      modelRawUrl: rawUrl,
      modelCutoutUrl: null,
    }));
    setIsProcessingModel(true);

    try {
      const res = await removeBackground(f, {
        model: 'u2net_human_seg',
        preserveText: true,
      });
      setFormData((prev) => ({ ...prev, modelCutoutUrl: res.url }));
    } catch {
      setFormData((prev) => ({ ...prev, modelCutoutUrl: rawUrl }));
    } finally {
      setIsProcessingModel(false);
    }
  };

  const handleRemoveModelFile = () => {
    setFormData((prev) => ({
      ...prev,
      modelFile: null,
      modelRawUrl: null,
      modelCutoutUrl: null,
    }));
  };

  // Step validation
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        // Step 1: Brand (website URL or brand name)
        return Boolean(formData.brand.brandName.trim() || formData.brand.websiteUrl.trim());
      case 2:
        // Step 2: Post type
        if (formData.postType === 'custom') {
          return Boolean(formData.customPostType.trim());
        }
        return Boolean(formData.postType);
      case 3:
        // Step 3: Idea / Description
        return Boolean(formData.idea.trim().length >= 3);
      case 4:
        // Step 4: Audience (can have at least one or default)
        return true;
      case 5:
        // Step 5: Style
        return Boolean(formData.style);
      case 6:
        // Step 6: Platform & Aspect ratio
        return Boolean(formData.platform && formData.aspectRatio);
      case 7:
        // Step 7: Visual Direction
        return Boolean(formData.visualDirection);
      case 8:
        // Step 8: Review
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < 8 && canProceed()) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Jump to specific step from Review
  const handleEditStep = (stepNum: number) => {
    setCurrentStep(stepNum);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Trigger Real AI Generation
  const handleGenerate = async () => {
    setViewMode('generating');
    setGenerationError(null);
    setTimeRemaining(25);
    setGenStageIndex(0);

    const countdownTimer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);

    const stageTimer = setInterval(() => {
      setGenStageIndex((prev) => (prev < 4 ? prev + 1 : 4));
    }, 4500);

    try {
      // Map friendly visual direction and type to backend fields
      const postTypeLabel =
        formData.postType === 'custom'
          ? formData.customPostType
          : formData.postType;

      const audienceString =
        formData.audiences.length > 0
          ? formData.audiences.join(', ') +
            (formData.customAudience ? `, ${formData.customAudience}` : '')
          : formData.customAudience || undefined;

      const productFilesList = formData.productImages.map((p) => p.file);
      const heroSubjectFile = productFilesList[0] || formData.productFile || null;

      const creativePost = await createGuidedPost({
        productName: formData.brand.brandName || 'Brand',
        prompt: formData.idea,
        platform: formData.platform,
        aspectRatio: formData.aspectRatio,
        style: formData.style,
        occasion: postTypeLabel,
        backgroundMode: formData.backgroundMode,
        targetAudience: audienceString,
        keyMessage: formData.idea,
        tone: formData.brand.tone || formData.style,
        fontHeading: formData.brand.fontHeading || undefined,
        fontBody: formData.brand.fontBody || undefined,
        primaryColor: formData.brand.primaryColor || undefined,
        secondaryColor: formData.brand.secondaryColor || undefined,
        accentColor: formData.brand.accentColor || undefined,
        brandProfileId: formData.brand.brandProfileId || undefined,
        brandName: formData.brand.brandName || undefined,
        niche: formData.brand.niche || undefined,
        layoutPreference: formData.visualDirection,
        variationsCount: formData.variationsCount,
        file: heroSubjectFile,
        files: productFilesList.length > 0 ? productFilesList : (formData.productFile ? [formData.productFile] : null),
        model: formData.modelFile || null,
        logo: formData.brand.logoFile || null,
        additionalInstructions: [
          formData.brand.description ? `Brand Context: ${formData.brand.description}` : '',
          formData.brand.tagline ? `Tagline: ${formData.brand.tagline}` : '',
          `Visual Focus: ${formData.visualDirection}`,
          formData.productImages.length > 1
            ? `Product Reference Photos: Exactly ${formData.productImages.length} product photos are attached for visual reference and deep product understanding. In the final post, showcase ONE single hero product presentation with maximum clarity and impact (do NOT paste or collage all photos into one post; use all photos as reference to accurately represent the single hero product).`
            : '',
          formData.modelFile
            ? 'Hero Model Reference: CRITICAL - The uploaded model photo depicts the exact person who must be the model in the post. Replicate this exact individual with 100% identity fidelity (facial structure, eyes, nose, lips, hair, skin tone, and authentic human features). Staged elegantly interacting with or showcasing the featured product.'
            : '',
        ]
          .filter(Boolean)
          .join('\n') || undefined,
      });

      const imgUrl =
        creativePost.imageUrl ||
        formData.cutoutUrl ||
        formData.modelCutoutUrl ||
        formData.rawOriginalUrl ||
        formData.modelRawUrl ||
        '';

      const mappedVariants: FinalPostResult[] | undefined = Array.isArray(creativePost.variants)
        ? creativePost.variants.map((v) => ({
            id: v.id,
            postId: v.id,
            platform: v.platform || formData.platform,
            aspectRatio: v.aspectRatio || formData.aspectRatio,
            imageUrl: v.imageUrl || imgUrl,
            headline: v.headline || 'Elevate Your Standard',
            bodyCopy:
              v.bodyCopy ||
              formData.idea ||
              'Designed with precision to captivate your audience.',
            cta: v.cta || 'Shop Now',
            rating: v.rating || null,
            isFavorite: v.isFavorite || false,
          }))
        : undefined;

      const finalResult: FinalPostResult = {
        id: creativePost.id,
        postId: creativePost.id,
        platform: formData.platform,
        aspectRatio: formData.aspectRatio,
        imageUrl: imgUrl,
        headline: creativePost.headline || 'Elevate Your Standard',
        bodyCopy:
          creativePost.bodyCopy ||
          formData.idea ||
          'Designed with precision to captivate your audience.',
        cta: creativePost.cta || 'Shop Now',
        rating: creativePost.rating || null,
        isFavorite: creativePost.isFavorite || false,
        variants: mappedVariants,
      };

      setGeneratedPost(finalResult);
      refreshUser();
      refreshNotifications();

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7c5cff', '#f0ad4e', '#3ecf8e', '#a78bfa'],
      });

      toast.success('Your post has been successfully generated in high definition!', 'Creative Generated');
      setViewMode('result');
      if (onPostGenerated) onPostGenerated(creativePost);
    } catch (err: any) {
      console.error('Generation failed:', err);
      const msg = err?.message || 'Generation failed. Any deducted credits have been refunded.';
      setGenerationError(msg);
      toast.error(msg, 'Generation Error');
      setViewMode('wizard');
      setCurrentStep(8);
    } finally {
      clearInterval(countdownTimer);
      clearInterval(stageTimer);
    }
  };

  // Result Callbacks
  const handleRate = async (postId: string, rating: number) => {
    try {
      await ratePost(postId, rating);
      toast.success('Rating saved! This tunes your personalized AI aesthetic.', 'Rating Recorded');
      if (generatedPost) {
        const updatedVariants = generatedPost.variants?.map((v) =>
          v.postId === postId || v.id === postId ? { ...v, rating } : v
        );
        setGeneratedPost({
          ...generatedPost,
          rating: generatedPost.postId === postId || generatedPost.id === postId ? rating : generatedPost.rating,
          variants: updatedVariants,
        });
      }
    } catch (err) {
      console.error('Rating failed', err);
    }
  };

  const handleToggleFavorite = async (postId: string) => {
    try {
      await toggleFavoritePost(postId);
      if (generatedPost) {
        const target = generatedPost.postId === postId || generatedPost.id === postId
          ? generatedPost
          : generatedPost.variants?.find((v) => v.postId === postId || v.id === postId);
        const newFav = target ? !target.isFavorite : !generatedPost.isFavorite;
        const updatedVariants = generatedPost.variants?.map((v) =>
          v.postId === postId || v.id === postId ? { ...v, isFavorite: newFav } : v
        );
        setGeneratedPost({
          ...generatedPost,
          isFavorite: generatedPost.postId === postId || generatedPost.id === postId ? newFav : generatedPost.isFavorite,
          variants: updatedVariants,
        });
      }
    } catch (err) {
      console.error('Favorite toggle failed', err);
    }
  };

  const handleUpdatePostCopy = (postId: string, headline: string, bodyCopy: string, cta: string) => {
    if (generatedPost) {
      const updatedVariants = generatedPost.variants?.map((v) =>
        v.postId === postId || v.id === postId ? { ...v, headline, bodyCopy, cta } : v
      );
      setGeneratedPost({
        ...generatedPost,
        ...(generatedPost.postId === postId || generatedPost.id === postId ? { headline, bodyCopy, cta } : {}),
        variants: updatedVariants,
      });
    }
  };

  const handleCreateAnother = () => {
    setViewMode('wizard');
    setCurrentStep(2); // Go to post type to quickly start new idea
    setFormData((prev) => ({
      ...prev,
      idea: '',
      productFile: null,
      rawOriginalUrl: null,
      cutoutUrl: null,
      modelFile: null,
      modelRawUrl: null,
      modelCutoutUrl: null,
    }));
    setGeneratedPost(null);
  };

  const handleChangeStyleAndRegenerate = (newStyle: string) => {
    setFormData((prev) => ({ ...prev, style: newStyle }));
    handleGenerate();
  };

  const handleResizeAndRegenerate = (newRatio: string) => {
    setFormData((prev) => ({ ...prev, aspectRatio: newRatio }));
    handleGenerate();
  };

  return (
    <div className="w-full space-y-6">
      {/* 8-Step Interactive Progress Stepper (Only in wizard view) */}
      {viewMode === 'wizard' && (
        <StepIndicator
          currentStep={currentStep}
          onSelectStep={(stepNum) => setCurrentStep(stepNum)}
        />
      )}

      {/* Main Wizard Canvas / Content Card */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl dark:shadow-2xl backdrop-blur-md transition-colors duration-200">
        {/* Error Alert (if generation failed) */}
        {generationError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <p className="text-xs text-rose-800 dark:text-rose-300 font-medium">
                {generationError}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setGenerationError(null)}
              className="text-xs text-rose-600 font-bold hover:underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* VIEW 1: Step-by-Step Guided Wizard */}
        {viewMode === 'wizard' && (
          <div>
            {/* STEP 1: Brand Data & Website URL */}
            {currentStep === 1 && (
              <BrandStep
                data={formData.brand}
                onChange={(fields) =>
                  setFormData((prev) => ({
                    ...prev,
                    brand: { ...prev.brand, ...fields },
                  }))
                }
                brands={brands}
                onSkip={() => setCurrentStep(2)}
              />
            )}

            {/* STEP 2: Post Type */}
            {currentStep === 2 && (
              <PostTypeStep
                selectedType={formData.postType}
                customType={formData.customPostType}
                onSelect={(typeId) =>
                  setFormData((prev) => ({ ...prev, postType: typeId }))
                }
                onChangeCustomType={(val) =>
                  setFormData((prev) => ({ ...prev, customPostType: val }))
                }
              />
            )}

            {/* STEP 3: Idea & Topic */}
            {currentStep === 3 && (
              <IdeaStep
                idea={formData.idea}
                onChangeIdea={(val) =>
                  setFormData((prev) => ({ ...prev, idea: val }))
                }
              />
            )}

            {/* STEP 4: Target Audience */}
            {currentStep === 4 && (
              <AudienceStep
                selectedAudiences={formData.audiences}
                customAudience={formData.customAudience}
                onToggleAudience={(audId) =>
                  setFormData((prev) => {
                    const exists = prev.audiences.includes(audId);
                    const updated = exists
                      ? prev.audiences.filter((a) => a !== audId)
                      : [...prev.audiences, audId];
                    return { ...prev, audiences: updated };
                  })
                }
                onChangeCustomAudience={(val) =>
                  setFormData((prev) => ({ ...prev, customAudience: val }))
                }
              />
            )}

            {/* STEP 5: Visual Style */}
            {currentStep === 5 && (
              <StyleStep
                selectedStyle={formData.style}
                onSelectStyle={(styleId) =>
                  setFormData((prev) => ({ ...prev, style: styleId }))
                }
              />
            )}

            {/* STEP 6: Platform & Dimensions */}
            {currentStep === 6 && (
              <PlatformStep
                selectedPlatform={formData.platform}
                selectedRatio={formData.aspectRatio}
                onSelectPlatform={(platId, defaultRatio) =>
                  setFormData((prev) => ({
                    ...prev,
                    platform: platId,
                    aspectRatio: defaultRatio,
                  }))
                }
                onSelectRatio={(ratio) =>
                  setFormData((prev) => ({ ...prev, aspectRatio: ratio }))
                }
              />
            )}

            {/* STEP 7: Visual Direction */}
            {currentStep === 7 && (
              <VisualDirectionStep
                selectedDirection={formData.visualDirection}
                onSelectDirection={(dirId) =>
                  setFormData((prev) => ({ ...prev, visualDirection: dirId }))
                }
                productImages={formData.productImages}
                onAddProductImages={handleAddProductImages}
                onRemoveProductImage={handleRemoveProductImage}
                onClearAllProductImages={handleClearAllProductImages}
                productFile={formData.productFile}
                rawOriginalUrl={formData.rawOriginalUrl}
                cutoutUrl={formData.cutoutUrl}
                isProcessingAsset={isProcessingAsset}
                modelFile={formData.modelFile}
                modelRawUrl={formData.modelRawUrl}
                modelCutoutUrl={formData.modelCutoutUrl}
                isProcessingModel={isProcessingModel}
                backgroundMode={formData.backgroundMode}
                onUploadProductFile={handleUploadProductFile}
                onRemoveProductFile={handleRemoveProductFile}
                onUploadModelFile={handleUploadModelFile}
                onRemoveModelFile={handleRemoveModelFile}
                onChangeBackgroundMode={(mode) =>
                  setFormData((prev) => ({ ...prev, backgroundMode: mode }))
                }
              />
            )}

            {/* STEP 8: Review & Build */}
            {currentStep === 8 && (
              <ReviewStep
                formData={formData}
                userCredits={userCredits}
                onEditStep={handleEditStep}
                onGenerate={handleGenerate}
                isGenerating={false}
                onChangeVariationsCount={(count) =>
                  setFormData((prev) => ({ ...prev, variationsCount: count }))
                }
              />
            )}

            {/* Bottom Step Navigation Bar */}
            <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-200 dark:border-slate-800">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-900 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                >
                  Exit to Dashboard
                </button>
              )}

              {currentStep < 8 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition disabled:opacity-40 disabled:pointer-events-none"
                >
                  <span>Continue to Step {currentStep + 1}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          </div>
        )}

        {/* VIEW 2: Generation Loading State (Step 9) */}
        {viewMode === 'generating' && (
          <GenerationState
            currentStageIndex={genStageIndex}
            timeRemaining={timeRemaining}
            platformName={formData.platform.toUpperCase()}
          />
        )}

        {/* VIEW 3: Result & Editor (Step 10) */}
        {viewMode === 'result' && generatedPost && (
          <PostResult
            post={generatedPost}
            onRatePost={handleRate}
            onToggleFavorite={handleToggleFavorite}
            onRegenerate={handleGenerate}
            onUpdatePostCopy={handleUpdatePostCopy}
            onCreateAnother={handleCreateAnother}
            onChangeStyle={handleChangeStyleAndRegenerate}
            onResize={handleResizeAndRegenerate}
          />
        )}
      </div>
    </div>
  );
}
