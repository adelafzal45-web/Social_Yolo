'use client';

import React, { useState } from 'react';
import { BrandProfile, Project } from '../../types';
import { CopyVariation, generateCopyVariations } from '../../lib/aiEngine';

interface Step3CopyProps {
  project: Project;
  brand: BrandProfile;
  onUpdateProject: (updates: Partial<Project>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step3Copy: React.FC<Step3CopyProps> = ({
  project,
  brand,
  onUpdateProject,
  onNext,
  onBack,
}) => {
  const [headline, setHeadline] = useState(project?.copy?.headline || 'Small batch. Big morning.');
  const [body, setBody] = useState(
    project?.copy?.body ||
      'Roasted in 12kg batches, every Tuesday. Restocking this Friday — set a reminder.',
  );
  const [occasion, setOccasion] = useState(project?.copy?.occasion || 'Limited edition');
  const [customNote, setCustomNote] = useState(project?.copy?.customNote || 'Ramadan restock — 20% off');
  const [variations, setVariations] = useState<CopyVariation[]>(() =>
    generateCopyVariations(project?.name || 'Creative', project?.copy?.body || '', occasion, brand?.tone, brand?.niche),
  );

  const handleSelectVariation = (v: CopyVariation) => {
    setHeadline(v.headline);
    setBody(v.body);
    onUpdateProject({
      copy: {
        headline: v.headline,
        body: v.body,
        occasion,
        customNote,
      },
    });
  };

  const handleRegenerate = () => {
    const fresh = generateCopyVariations(
      project?.name || 'Creative',
      project?.copy?.body || '',
      occasion,
      brand?.tone,
      brand?.niche,
    );
    setVariations(fresh);
  };

  const handleHeadlineChange = (text: string) => {
    setHeadline(text);
    onUpdateProject({
      copy: {
        headline: text,
        body,
        occasion,
        customNote,
      },
    });
  };

  const handleBodyChange = (text: string) => {
    setBody(text);
    onUpdateProject({
      copy: {
        headline,
        body: text,
        occasion,
        customNote,
      },
    });
  };

  const occasions = ['Sale', 'New arrival', 'Limited edition', 'Seasonal', 'Restock'];

  return (
    <div className="app-body split" style={{ gridTemplateColumns: '1.1fr 0.9fr', padding: '0 30px 26px', gap: '24px' }}>
      {/* Left Column: Copy Input & AI Variations */}
      <div className="panel">
        <div className="panel-title">03 Your Own Ad Copy</div>

        <div className="field">
          <label>
            Headline <span className="count">{headline.length}/60</span>
          </label>
          <input
            value={headline}
            maxLength={60}
            onChange={(e) => handleHeadlineChange(e.target.value)}
          />
        </div>

        <div className="field">
          <label>
            Body Caption <span className="count">{body.length}/200</span>
          </label>
          <textarea
            value={body}
            maxLength={200}
            rows={3}
            onChange={(e) => handleBodyChange(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Occasion / Campaign Theme</label>
          <div className="chip-row">
            {occasions.map((occ) => (
              <div
                key={occ}
                className={`chip ${occasion === occ ? 'selected' : ''}`}
                onClick={() => {
                  setOccasion(occ);
                  onUpdateProject({
                    copy: { headline, body, occasion: occ, customNote },
                  });
                }}
              >
                {occ}
              </div>
            ))}
          </div>
        </div>

        <div className="field">
          <input
            placeholder="e.g. Ramadan sale — 30% off, holiday restock"
            value={customNote}
            onChange={(e) => {
              setCustomNote(e.target.value);
              onUpdateProject({
                copy: { headline, body, occasion, customNote: e.target.value },
              });
            }}
          />
          <div className="hint">Custom hook details used to steer AI copy variations.</div>
        </div>

        {/* AI Variations */}
        <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <span>04 AI Variations</span>
          <span className="link" style={{ fontSize: '11px' }} onClick={handleRegenerate}>
            ↻ Regenerate
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {variations.map((v) => {
            const isSelected = headline === v.headline;
            return (
              <div
                key={v.id}
                className="panel"
                style={{
                  padding: '12px 14px',
                  borderColor: isSelected ? 'var(--purple)' : 'var(--border-soft)',
                  background: isSelected ? 'var(--purple-bg)' : 'var(--panel)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => handleSelectVariation(v)}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <input
                    type="radio"
                    checked={isSelected}
                    readOnly
                    style={{ marginTop: '3px', cursor: 'pointer', accentColor: 'var(--purple)' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                      {v.headline}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#8b8ba3', marginTop: '3px' }}>
                      {v.body}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Live Card Preview */}
      <div className="preview-canvas-box" style={{ borderRadius: '16px', flexDirection: 'column' }}>
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '20px',
            fontSize: '10.5px',
            color: '#8b8ba3',
            letterSpacing: '.05em',
            textTransform: 'uppercase',
          }}
        >
          Live Preview — Applies across selected platforms
        </div>

        <div
          className="creative-card"
          style={{
            width: '280px',
            padding: '28px 22px',
            textAlign: 'center',
            background: '#efe9f6',
            borderRadius: '16px',
          }}
        >
          {project.enhancedPhotoUrl || project.originalPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.enhancedPhotoUrl || project.originalPhotoUrl}
              alt="Product"
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'contain',
                margin: '0 auto 12px',
                filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.35))',
              }}
            />
          ) : (
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: brand?.colors?.accent || '#e0aa4e',
                margin: '0 auto 16px',
              }}
            />
          )}

          <h3 style={{ color: '#1a1425', fontSize: '18px', margin: '0 0 8px', lineHeight: 1.25 }}>
            {headline}
          </h3>

          <p style={{ color: '#5a5270', fontSize: '11.5px', margin: '0 0 14px', lineHeight: 1.4 }}>
            {body}
          </p>

          <span
            className="mini-tag"
            style={{
              background: '#2a2008',
              color: 'var(--amber)',
              padding: '4px 10px',
              fontSize: '9.5px',
              borderRadius: '6px',
            }}
          >
            {(occasion || '').toUpperCase()}
          </span>
        </div>
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
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back to Brand
        </button>
        <button className="btn btn-primary" onClick={onNext}>
          Continue to Style →
        </button>
      </div>
    </div>
  );
};
