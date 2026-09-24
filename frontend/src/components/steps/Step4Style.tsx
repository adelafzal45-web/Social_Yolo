'use client';

import React from 'react';
import { BrandProfile, DesignStyle, Project } from '../../types';
import { recommendStyle } from '../../lib/aiEngine';

interface Step4StyleProps {
  project: Project;
  brand: BrandProfile;
  onUpdateProject: (updates: Partial<Project>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface StyleOption {
  key: DesignStyle;
  name: string;
  desc: string;
  gradient: string;
  accent: string;
  badge?: string;
}

const STYLES: StyleOption[] = [
  {
    key: 'minimalist',
    name: 'Minimalist',
    desc: 'Clean white space, restrained type & editorial poise',
    gradient: 'linear-gradient(135deg, #f8f6f4, #ede8e3)',
    accent: '#222',
  },
  {
    key: 'bold',
    name: 'Bold & Vibrant',
    desc: 'High-contrast color, punchy fonts & full-bleed energy',
    gradient: 'linear-gradient(135deg, #ff7a3d, #ffb648)',
    accent: '#1a0d00',
    badge: 'YOLO',
  },
  {
    key: 'luxury',
    name: 'Luxury',
    desc: 'Deep moody tones, gold hairlines & sophisticated serif',
    gradient: 'linear-gradient(135deg, #241d18, #0e0a08)',
    accent: '#c9a24e',
  },
  {
    key: 'lifestyle',
    name: 'Lifestyle',
    desc: 'Warm organic light, human-centric tone & candid vibe',
    gradient: 'linear-gradient(135deg, #3a2c5a, #1a1428)',
    accent: '#e0aa4e',
  },
  {
    key: 'tech',
    name: 'Tech / Modern',
    desc: 'Geometric grid, monospace accents & dark sleek aesthetics',
    gradient: 'linear-gradient(135deg, #141a24, #080d14)',
    accent: '#4ec9ff',
  },
  {
    key: 'playful',
    name: 'Playful',
    desc: 'Rounded cheerful shapes, soft pastels & lively rhythm',
    gradient: 'linear-gradient(135deg, #ffc6d9, #a8d4f0)',
    accent: '#ff6b8b',
  },
];

export const Step4Style: React.FC<Step4StyleProps> = ({
  project,
  brand,
  onUpdateProject,
  onNext,
  onBack,
}) => {
  const handleAiRecommend = () => {
    const recommended = recommendStyle(brand.niche);
    onUpdateProject({ style: recommended });
  };

  return (
    <div className="app-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <div className="panel-title" style={{ margin: 0 }}>04 Choose a Design Direction</div>
          <div style={{ fontSize: '13px', color: '#8b8ba3', marginTop: '4px' }}>
            Visual thumbnails calibrated to platform aspect ratios.
          </div>
        </div>

        <button className="btn btn-ghost btn-sm" onClick={handleAiRecommend}>
          ✨ AI Recommend (for {brand?.nicheLabel || brand?.niche || 'Food & Beverage'})
        </button>
      </div>

      <div className="grid3" style={{ gap: '18px' }}>
        {STYLES.map((st) => {
          const isSelected = project.style === st.key;
          return (
            <div
              key={st.key}
              className="panel"
              style={{
                padding: 0,
                overflow: 'hidden',
                cursor: 'pointer',
                borderColor: isSelected ? 'var(--purple)' : 'var(--border-soft)',
                position: 'relative',
                transition: 'all 0.15s ease',
              }}
              onClick={() => onUpdateProject({ style: st.key })}
            >
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '6px',
                    background: 'var(--purple)',
                    color: '#fff',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 3,
                  }}
                >
                  ✓
                </div>
              )}

              {/* Graphic Banner Mockup */}
              <div
                style={{
                  height: '118px',
                  background: st.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {st.badge ? (
                  <span style={{ fontWeight: 900, fontSize: '24px', color: st.accent, letterSpacing: '-0.02em' }}>
                    {st.badge}
                  </span>
                ) : (
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: st.key === 'playful' ? '50%' : '8px',
                      border: `2px solid ${st.accent}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: st.accent,
                      fontFamily: st.key === 'luxury' ? 'var(--font-display)' : 'inherit',
                      fontWeight: 700,
                    }}
                  >
                    {st.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div style={{ padding: '14px 16px' }}>
                <b style={{ fontSize: '13.5px', color: '#fff', display: 'block', marginBottom: '3px' }}>
                  {st.name}
                </b>
                <div style={{ fontSize: '11.5px', color: '#7d7d93', lineHeight: 1.4 }}>
                  {st.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Step Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back to Copy
        </button>
        <button className="btn btn-primary" onClick={onNext}>
          Continue to Platform →
        </button>
      </div>
    </div>
  );
};
