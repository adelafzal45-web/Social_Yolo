'use client';

import React, { useState } from 'react';
import { BrandProfile, NicheCategory, Project } from '../../types';
import { generateBrandIdentity } from '../../lib/aiEngine';

interface Step2BrandProps {
  project: Project;
  brand: BrandProfile;
  onUpdateBrand: (brand: BrandProfile) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step2Brand: React.FC<Step2BrandProps> = ({
  project,
  brand,
  onUpdateBrand,
  onNext,
  onBack,
}) => {
  const [mode, setMode] = useState<'ai' | 'upload'>('ai');
  const [websiteUrl, setWebsiteUrl] = useState(brand.websiteUrl || '');
  const [description, setDescription] = useState(brand.description || '');
  const [niche, setNiche] = useState<NicheCategory>(brand.niche || 'food_beverage');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAI = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateBrandIdentity(websiteUrl, description, niche);
      onUpdateBrand({
        ...brand,
        ...generated,
      });
      setIsGenerating(false);
    }, 450);
  };

  const handleColorChange = (key: keyof BrandProfile['colors'], val: string) => {
    onUpdateBrand({
      ...brand,
      colors: {
        ...brand.colors,
        [key]: val,
      },
    });
  };

  return (
    <div className="app-body split" style={{ gridTemplateColumns: '1fr 1fr', padding: '0 30px 26px', gap: '24px' }}>
      {/* Left Column: Brand Configuration */}
      <div className="panel">
        <div className="panel-title">02 Brand Profile Setup</div>
        <div className="chip-row" style={{ marginBottom: '20px' }}>
          <div
            className={`chip ${mode === 'upload' ? 'selected' : ''}`}
            onClick={() => setMode('upload')}
          >
            Upload assets
          </div>
          <div
            className={`chip ${mode === 'ai' ? 'selected' : ''}`}
            onClick={() => setMode('ai')}
          >
            AI-driven setup
          </div>
        </div>

        {mode === 'ai' ? (
          <>
            <p style={{ fontSize: '12.5px', color: '#a5a5ba', marginTop: 0, marginBottom: '16px' }}>
              No logo or colors yet? We&apos;ll infer a cohesive brand identity from your website or a short description.
            </p>

            <div className="field">
              <label>Website URL (optional)</label>
              <input
                placeholder="e.g. www.meridiancoffeeco.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Product / Business description</label>
              <textarea
                placeholder="e.g. Small-batch specialty coffee roaster, warm and premium feel, single-origin beans."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Niche / Category</label>
              <div className="chip-row">
                <div
                  className={`chip ${niche === 'food_beverage' ? 'selected' : ''}`}
                  onClick={() => setNiche('food_beverage')}
                >
                  ☕ Food & Beverage
                </div>
                <div
                  className={`chip ${niche === 'beauty_wellness' ? 'selected' : ''}`}
                  onClick={() => setNiche('beauty_wellness')}
                >
                  💄 Beauty & Wellness
                </div>
                <div
                  className={`chip ${niche === 'fashion_apparel' ? 'selected' : ''}`}
                  onClick={() => setNiche('fashion_apparel')}
                >
                  👗 Fashion & Apparel
                </div>
                <div
                  className={`chip ${niche === 'tech_gadgets' ? 'selected' : ''}`}
                  onClick={() => setNiche('tech_gadgets')}
                >
                  💻 Tech & Gadgets
                </div>
                <div
                  className={`chip ${niche === 'home_lifestyle' ? 'selected' : ''}`}
                  onClick={() => setNiche('home_lifestyle')}
                >
                  🏡 Home & Lifestyle
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleGenerateAI}
              disabled={isGenerating}
              style={{ marginTop: '8px' }}
            >
              {isGenerating ? '✨ Synthesizing Brand DNA...' : '✨ Generate brand identity'}
            </button>
          </>
        ) : (
          <>
            <div className="field">
              <label>Brand Name</label>
              <input
                value={brand?.name || ''}
                onChange={(e) => onUpdateBrand({ ...brand, name: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Brand Colors</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={brand?.colors?.primary || '#c98a3f'}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  style={{ width: '40px', height: '40px', padding: 2, cursor: 'pointer' }}
                  title="Primary Color"
                />
                <input
                  type="color"
                  value={brand?.colors?.accent || '#e0aa4e'}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  style={{ width: '40px', height: '40px', padding: 2, cursor: 'pointer' }}
                  title="Accent Color"
                />
                <input
                  type="color"
                  value={brand?.colors?.secondary || '#3a2c5a'}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  style={{ width: '40px', height: '40px', padding: 2, cursor: 'pointer' }}
                  title="Secondary Color"
                />
              </div>
              <div className="hint" style={{ marginTop: 6 }}>
                Primary: {brand?.colors?.primary || '#c98a3f'} · Accent: {brand?.colors?.accent || '#e0aa4e'}
              </div>
            </div>

            <div className="field">
              <label>Tone of Voice</label>
              <div className="chip-row">
                {(['Warm', 'Playful', 'Premium', 'Direct', 'Bold'] as const).map((t) => (
                  <div
                    key={t}
                    className={`chip ${(brand?.tone || 'Warm') === t ? 'selected' : ''}`}
                    onClick={() => onUpdateBrand({ ...brand, tone: t })}
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right Column: Live Brand DNA Preview */}
      <div className="panel">
        <div className="panel-title">Brand DNA Preview</div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '18px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${brand?.colors?.primary || '#c98a3f'}, ${brand?.colors?.secondary || '#3a2c5a'})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '18px',
            }}
          >
            {(brand?.name || 'B').charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>{brand?.name || 'Brand'}</div>
            <div style={{ fontSize: '11.5px', color: '#8b8ba3' }}>
              {brand?.tagline || 'Artisanal high-craft essentials'}
            </div>
          </div>
        </div>

        <div className="panel-title">Active Color Palette</div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
          <div
            style={{
              flex: 1,
              height: '38px',
              borderRadius: '8px',
              background: brand?.colors?.primary || '#c98a3f',
            }}
            title="Primary"
          />
          <div
            style={{
              flex: 1,
              height: '38px',
              borderRadius: '8px',
              background: brand?.colors?.accent || '#e0aa4e',
            }}
            title="Accent"
          />
          <div
            style={{
              flex: 1,
              height: '38px',
              borderRadius: '8px',
              background: brand?.colors?.secondary || '#3a2c5a',
            }}
            title="Secondary"
          />
          <div
            style={{
              flex: 1,
              height: '38px',
              borderRadius: '8px',
              background: '#ffffff',
            }}
            title="Light Neutral"
          />
        </div>

        <div className="panel-title">Typography System</div>
        <div style={{ background: '#0d0d14', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', color: '#fff', marginBottom: '4px' }}>
            {(brand?.fonts?.display || 'Fraktion Serif, Georgia').split(',')[0]} (Headline Display)
          </div>
          <div style={{ fontSize: '12px', color: '#7d7d93' }}>
            {(brand?.fonts?.body || 'Inter, sans-serif').split(',')[0]} (Body & Specifications)
          </div>
        </div>

        <div className="credit-note">
          ✓ Saved automatically to your Brand Library — reused across all future projects.
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
          ← Back to Upload
        </button>
        <button className="btn btn-primary" onClick={onNext}>
          Continue to Copy →
        </button>
      </div>
    </div>
  );
};
