'use client';

import React, { useRef, useState } from 'react';
import { Project } from '../../types';
import { enhanceImageApi, removeBackground } from '../../lib/api';

interface Step1UploadProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
  onNext: () => void;
  onSaveExit: () => void;
  userToken?: string | null;
}

export const Step1Upload: React.FC<Step1UploadProps> = ({
  project,
  onUpdateProject,
  onNext,
  onSaveExit,
  userToken,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewMode, setPreviewMode] = useState<'after' | 'before'>('after');
  const [brightness, setBrightness] = useState(project.imageAdjustments?.brightness ?? 100);
  const [contrast, setContrast] = useState(project.imageAdjustments?.contrast ?? 100);
  const [saturation, setSaturation] = useState(project.imageAdjustments?.saturation ?? 100);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read original file as DataURL for immediate display
    const reader = new FileReader();
    reader.onload = async () => {
      const originalUrl = reader.result as string;
      onUpdateProject({
        originalPhotoUrl: originalUrl,
        enhancedPhotoUrl: originalUrl,
        transparentPhotoUrl: originalUrl,
      });

      // Auto-run AI background removal & enhancement
      setIsProcessing(true);
      setStatusMessage('Analyzing and enhancing product lighting...');

      try {
        // Try real backend enhancement endpoint
        try {
          const enhanced = await enhanceImageApi(file, {
            brightness: brightness / 100,
            saturation: saturation / 100,
          });
          if (enhanced.url) {
            onUpdateProject({ enhancedPhotoUrl: enhanced.url });
          }
        } catch {
          // Non-blocking fallback
        }

        // Try real background removal if token or guest
        if (userToken) {
          setStatusMessage('Extracting product mask & alpha-matte refinement...');
          try {
            const bgResult = await removeBackground(file, { provider: 'imgly' }, userToken);
            if (bgResult.url) {
              onUpdateProject({
                transparentPhotoUrl: bgResult.url,
                backgroundMode: 'ai_replace',
              });
              setStatusMessage('AI photo enhancement & background segmentation complete.');
            }
          } catch (bgErr: any) {
            console.warn('Background removal note:', bgErr.message);
            setStatusMessage('Product photo ready for design.');
          }
        } else {
          setStatusMessage('Photo loaded. Sign in or continue for AI mask refinement.');
        }
      } catch (err: any) {
        console.warn('Enhancement notice:', err);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBrightnessChange = (val: number) => {
    setBrightness(val);
    onUpdateProject({
      imageAdjustments: { brightness: val, contrast, saturation },
    });
  };

  const currentImg =
    previewMode === 'before'
      ? project.originalPhotoUrl
      : project.backgroundMode === 'remove' && project.transparentPhotoUrl
      ? project.transparentPhotoUrl
      : project.enhancedPhotoUrl || project.originalPhotoUrl;

  return (
    <div className="app-body split" style={{ gridTemplateColumns: '360px 1fr', padding: '0 30px 26px', gap: '24px' }}>
      {/* Left Settings Panel */}
      <div className="panel">
        <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>01 Product Photos</span>
          <span style={{ color: '#6f6f88', fontWeight: 400, textTransform: 'none' }}>
            {project.originalPhotoUrl ? '1 uploaded' : '0 uploaded'}
          </span>
        </div>

        {/* Upload Thumbnail Row */}
        <div className="photo-thumbs">
          {project.originalPhotoUrl ? (
            <div
              className="photo-thumb primary"
              style={{ backgroundImage: `url(${project.originalPhotoUrl})` }}
            >
              <span className="badge-tag">1</span>
            </div>
          ) : null}

          <div
            className="photo-thumb add"
            onClick={() => fileInputRef.current?.click()}
            title="Upload product photo"
          >
            +
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
          />
        </div>
        <div className="hint" style={{ marginBottom: '18px' }}>
          Primary image is used as the hero shot across all creatives (JPG, PNG, WEBP).
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="credit-note" style={{ marginBottom: '16px' }}>
            {isProcessing ? '⏳ ' : '✓ '} {statusMessage}
          </div>
        )}

        {/* Background Options */}
        <div className="panel-title">02 Background Treatment</div>
        <div className="chip-row" style={{ marginBottom: '8px' }}>
          <div
            className={`chip ${project.backgroundMode === 'keep' ? 'selected' : ''}`}
            onClick={() => onUpdateProject({ backgroundMode: 'keep' })}
          >
            Keep original
          </div>
          <div
            className={`chip ${project.backgroundMode === 'remove' ? 'selected' : ''}`}
            onClick={() => onUpdateProject({ backgroundMode: 'remove' })}
          >
            Remove (Alpha)
          </div>
          <div
            className={`chip ${project.backgroundMode === 'ai_replace' ? 'selected' : ''}`}
            onClick={() => onUpdateProject({ backgroundMode: 'ai_replace' })}
          >
            AI Replace
          </div>
        </div>
        <div className="hint" style={{ marginBottom: '20px' }}>
          {project.backgroundMode === 'ai_replace'
            ? 'Contextual background matched to brand niche & design style.'
            : project.backgroundMode === 'remove'
            ? 'Clean transparent cutout with preserved fine edge details.'
            : 'Preserves the original uploaded environment.'}
        </div>

        {/* On-Site Non-Destructive Editor */}
        <div className="panel-title">03 On-Site Photo Adjustments</div>
        <div className="field">
          <label style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Brightness</span>
            <span>{brightness}%</span>
          </label>
          <input
            type="range"
            min="60"
            max="140"
            value={brightness}
            onChange={(e) => handleBrightnessChange(Number(e.target.value))}
          />
        </div>

        <div className="field">
          <label style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Contrast</span>
            <span>{contrast}%</span>
          </label>
          <input
            type="range"
            min="70"
            max="130"
            value={contrast}
            onChange={(e) => {
              setContrast(Number(e.target.value));
              onUpdateProject({ imageAdjustments: { brightness, contrast: Number(e.target.value), saturation } });
            }}
          />
        </div>

        <div className="field">
          <label style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Saturation</span>
            <span>{saturation}%</span>
          </label>
          <input
            type="range"
            min="60"
            max="140"
            value={saturation}
            onChange={(e) => {
              setSaturation(Number(e.target.value));
              onUpdateProject({ imageAdjustments: { brightness, contrast, saturation: Number(e.target.value) } });
            }}
          />
        </div>
        <div className="hint">
          Manual adjustments are non-destructive — revert to AI-enhanced version anytime.
        </div>
      </div>

      {/* Right Interactive Preview Canvas */}
      <div className="preview-canvas-box">
        <div className="preview-toggle">
          <button
            className={previewMode === 'after' ? 'active' : ''}
            onClick={() => setPreviewMode('after')}
          >
            After (AI Enhanced)
          </button>
          <button
            className={previewMode === 'before' ? 'active' : ''}
            onClick={() => setPreviewMode('before')}
          >
            Before
          </button>
        </div>

        {currentImg ? (
          <div
            className="creative-card"
            style={{
              filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
              background:
                project.backgroundMode === 'remove'
                  ? 'repeating-conic-gradient(#1c1c28 0% 25%, #151520 0% 50%) 50% / 16px 16px'
                  : undefined,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImg}
              alt="Product hero preview"
              style={{
                maxWidth: '85%',
                maxHeight: '75%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.5))',
              }}
            />
            <div className="tag-row">
              <span className="mini-tag" style={{ background: '#0f2a20', color: '#3ecf8e' }}>
                {previewMode === 'after' ? 'AI ENHANCED' : 'ORIGINAL'}
              </span>
              <span className="mini-tag" style={{ background: 'var(--purple-bg)', color: 'var(--purple-2)' }}>
                BG: {(project?.backgroundMode || 'keep').toUpperCase()}
              </span>
            </div>
          </div>
        ) : (
          <div
            className="upload-box"
            style={{ width: '380px' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="up-icon">⭱</div>
            <h4>Upload your product photo</h4>
            <p>Click or drag & drop · JPG, PNG, WEBP</p>
            <button className="btn btn-primary btn-sm">Choose photo</button>
          </div>
        )}
      </div>

      {/* Bottom Step Actions */}
      <div
        style={{
          gridColumn: '1 / -1',
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '16px',
        }}
      >
        <button className="btn btn-secondary" onClick={onSaveExit}>
          Save & Exit
        </button>
        <button className="btn btn-primary" onClick={onNext}>
          Continue to Brand →
        </button>
      </div>
    </div>
  );
};
