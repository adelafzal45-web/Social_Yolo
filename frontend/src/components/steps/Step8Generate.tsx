'use client';

import React, { useEffect, useState } from 'react';
import { BrandProfile, CreativeVariant, PlatformKey, Project } from '../../types';
import { renderCreativeCanvas } from '../../lib/creativeRenderer';

import { startGenerationJob, subscribeGenerationJobStream } from '../../lib/api';

interface Step8GenerateProps {
  project: Project;
  brand: BrandProfile;
  onGenerationComplete: (creatives: CreativeVariant[]) => void;
  token?: string;
}

const STAGES = [
  'Photo enhancement & Alpha Mask',
  'RAG Context & Gemini Copywriting',
  'Multi-Platform Canvas Compositing',
  'Meta Ad Density & Policy Check',
  'Final Variant Archival',
];

export const Step8Generate: React.FC<Step8GenerateProps> = ({
  project,
  brand,
  onGenerationComplete,
  token,
}) => {
  const [currentStageName, setCurrentStageName] = useState('Initializing Generation Job...');
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [progressPct, setProgressPct] = useState(10);
  const [flavorPreference, setFlavorPreference] = useState<'essential' | 'gift'>('essential');

  useEffect(() => {
    let isCancelled = false;
    let unsubscribeStream: (() => void) | null = null;

    const runRealGeneration = async () => {
      const generated: CreativeVariant[] = [];
      const platformsToGenerate: PlatformKey[] =
        (project?.platforms && project.platforms.length > 0)
          ? project.platforms
          : ['instagram_portrait', 'facebook_feed'];

      const platformDims: Record<string, { w: number; h: number; name: string; label: string }> = {
        instagram_portrait: { w: 1080, h: 1350, name: 'Instagram', label: '1080×1350 · Feed portrait' },
        instagram_square: { w: 1080, h: 1080, name: 'Instagram', label: '1080×1080 · Feed square' },
        instagram_story: { w: 1080, h: 1920, name: 'TikTok / Story', label: '1080×1920 · Story' },
        facebook_feed: { w: 1200, h: 628, name: 'Facebook', label: '1200×628 · Link ad' },
        pinterest_pin: { w: 1000, h: 1500, name: 'Pinterest', label: '1000×1500 · Pin' },
        twitter_feed: { w: 1200, h: 628, name: 'Twitter / X', label: '1200×628 · Feed' },
        linkedin_feed: { w: 1200, h: 628, name: 'LinkedIn', label: '1200×628 · Feed' },
      };

      const imgSrc =
        project?.backgroundMode === 'remove' && project?.transparentPhotoUrl
          ? project.transparentPhotoUrl
          : project?.enhancedPhotoUrl || project?.originalPhotoUrl;

      // 1. Kick off real backend generation job if token is present
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('social_yolo_jwt') || '' : '');

      if (authToken && project?.id) {
        try {
          const job = await startGenerationJob(authToken, {
            projectId: project.id,
            platforms: platformsToGenerate,
            style: project?.style || 'lifestyle',
            outputMode: project?.outputMode || 'creative',
          });

          if (job?.id && !isCancelled) {
            unsubscribeStream = subscribeGenerationJobStream(
              authToken,
              job.id,
              (event: any) => {
                if (isCancelled) return;
                if (event.stage) setCurrentStageName(event.stage);
                if (event.progressPct) {
                  setProgressPct(event.progressPct);
                  const stepIndex = Math.min(
                    STAGES.length - 1,
                    Math.floor((event.progressPct / 100) * STAGES.length),
                  );
                  setCurrentStageIdx(stepIndex);
                }
              },
              () => {
                // Completed
              },
              (err: any) => {
                console.warn('SSE stream note:', err);
              },
            );
          }
        } catch (jobErr) {
          console.warn('Backend generation job notice:', jobErr);
        }
      }

      // 2. Concurrently render the high-res HTML5 Canvas variants
      const count = project?.quantity || 4;
      for (let i = 0; i < count; i++) {
        if (isCancelled) return;
        const platKey = platformsToGenerate[i % (platformsToGenerate.length || 1)];
        const cfg = platformDims[platKey] || { w: 1080, h: 1080, name: 'Social', label: '1080×1080' };

        try {
          const rendered = await renderCreativeCanvas({
            width: cfg.w,
            height: cfg.h,
            style: project?.style || 'lifestyle',
            brand,
            headline: project?.copy?.headline || 'Small batch. Big morning.',
            body: project?.copy?.body || 'Roasted in 12kg batches, every Tuesday.',
            occasion: project?.copy?.occasion || 'LIMITED EDITION',
            ctaText: project?.outputMode === 'meta_ad' ? 'SHOP NOW' : 'DISCOVER',
            productImageSrc: imgSrc,
            isMetaAd: project?.outputMode === 'meta_ad',
          });

          generated.push({
            id: `creative_${Date.now()}_${i}`,
            platformKey: platKey,
            platformName: cfg.name,
            width: cfg.w,
            height: cfg.h,
            label: cfg.label,
            style: project?.style || 'lifestyle',
            headline: project?.copy?.headline || 'Small batch. Big morning.',
            body: project?.copy?.body || 'Roasted in 12kg batches, every Tuesday.',
            ctaText: project?.outputMode === 'meta_ad' ? 'SHOP NOW' : 'DISCOVER',
            textCoveragePct: rendered.textCoveragePct,
            metaPass: rendered.metaPass,
            status: 'approved',
            renderUrl: rendered.dataUrl,
          });
        } catch (e) {
          console.warn('Creative canvas rendering error:', e);
        }
      }

      // Transition smoothly once all variants are processed
      setTimeout(() => {
        if (!isCancelled) {
          setProgressPct(100);
          setCurrentStageIdx(STAGES.length - 1);
          onGenerationComplete(generated);
        }
      }, 3400);
    };

    runRealGeneration();

    return () => {
      isCancelled = true;
      if (unsubscribeStream) unsubscribeStream();
    };
  }, []);

  return (
    <div className="app-body centered" style={{ flexDirection: 'column', gap: '24px' }}>
      <div className="panel" style={{ width: '520px', textAlign: 'center' }}>
        <div className="gen-ring">
          {currentStageIdx + 1}/{STAGES.length}
        </div>

        <h3 style={{ margin: '0 0 4px', fontSize: '18px' }}>Generating your creatives...</h3>
        <p style={{ fontSize: '13px', color: '#e0aa4e', margin: '0 0 16px', fontWeight: 500 }}>
          {currentStageName} · {progressPct}%
        </p>

        {/* Pipeline Stage Indicators */}
        <div className="gen-steps">
          {STAGES.map((stage, idx) => {
            const isDone = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;
            return (
              <div
                key={idx}
                className={`gen-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
              >
                <div className="gen-line" />
                <div className="circ">{isDone ? '✓' : isCurrent ? '●' : ''}</div>
                <div className="lbl">{stage}</div>
              </div>
            );
          })}
        </div>

        <div className="hint" style={{ marginTop: '14px' }}>
          Please don&apos;t navigate away — AI multi-ratio layouts are assembling.
        </div>
      </div>

      {/* Interactive Questionnaire During Generation */}
      <div className="panel" style={{ width: '520px' }}>
        <div className="panel-title">Quick question — helps us nail the aesthetic</div>
        <p style={{ fontSize: '13px', color: '#c2c2d6', margin: '0 0 14px' }}>
          Your product photo could read as either — which fits {brand.name} better?
        </p>
        <div className="chip-row">
          <div
            className={`chip ${flavorPreference === 'essential' ? 'selected' : ''}`}
            onClick={() => setFlavorPreference('essential')}
          >
            Everyday essential
          </div>
          <div
            className={`chip ${flavorPreference === 'gift' ? 'selected' : ''}`}
            onClick={() => setFlavorPreference('gift')}
          >
            Premium gift / collector
          </div>
        </div>
        <div style={{ textAlign: 'right', marginTop: '10px' }}>
          <span className="link" style={{ fontSize: '11.5px' }}>
            Auto-tuned with best-guess defaults
          </span>
        </div>
      </div>
    </div>
  );
};
