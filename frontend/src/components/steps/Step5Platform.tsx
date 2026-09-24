'use client';

import React from 'react';
import { PlatformKey, Project } from '../../types';

interface Step5PlatformProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface PlatformItem {
  key: PlatformKey;
  name: string;
  code: string;
  dims: string;
  label: string;
  aspect: string;
}

const AVAILABLE_PLATFORMS: PlatformItem[] = [
  {
    key: 'instagram_portrait',
    name: 'Instagram Portrait',
    code: 'IG',
    dims: '1080×1350',
    label: 'Feed portrait (4:5)',
    aspect: '4/5',
  },
  {
    key: 'instagram_square',
    name: 'Instagram Square',
    code: 'IG',
    dims: '1080×1080',
    label: 'Feed square (1:1)',
    aspect: '1/1',
  },
  {
    key: 'facebook_feed',
    name: 'Facebook Link Ad',
    code: 'FB',
    dims: '1200×628',
    label: 'Feed & Link ad (1.91:1)',
    aspect: '1200/628',
  },
  {
    key: 'pinterest_pin',
    name: 'Pinterest Pin',
    code: 'P',
    dims: '1000×1500',
    label: 'Standard Pin (2:3)',
    aspect: '2/3',
  },
  {
    key: 'twitter_feed',
    name: 'Twitter / X',
    code: 'X',
    dims: '1200×628',
    label: 'Timeline card (1.91:1)',
    aspect: '1200/628',
  },
  {
    key: 'instagram_story',
    name: 'TikTok / Story / Reel',
    code: 'TT',
    dims: '1080×1920',
    label: 'Full-screen Story (9:16)',
    aspect: '9/16',
  },
  {
    key: 'linkedin_feed',
    name: 'LinkedIn Feed',
    code: 'LI',
    dims: '1200×628',
    label: 'Sponsored Post (1.91:1)',
    aspect: '1200/628',
  },
];

export const Step5Platform: React.FC<Step5PlatformProps> = ({
  project,
  onUpdateProject,
  onNext,
  onBack,
}) => {
  const currentPlatforms = project?.platforms || [];

  const togglePlatform = (key: PlatformKey) => {
    const current = project?.platforms || [];
    const exists = current.includes(key);
    let updated: PlatformKey[];
    if (exists) {
      if (current.length === 1) return; // Must have at least 1
      updated = current.filter((k) => k !== key);
    } else {
      updated = [...current, key];
    }
    onUpdateProject({ platforms: updated });
  };

  return (
    <div className="app-body split" style={{ gridTemplateColumns: '360px 1fr', padding: '0 30px 26px', gap: '24px' }}>
      {/* Left Column: Platform List */}
      <div className="panel">
        <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>05 Select Target Platforms</span>
          <span style={{ color: '#6f6f88', fontWeight: 400, textTransform: 'none' }}>
            {currentPlatforms.length} selected
          </span>
        </div>

        <div className="platform-list">
          {AVAILABLE_PLATFORMS.map((plat) => {
            const isChecked = currentPlatforms.includes(plat.key);
            return (
              <div
                key={plat.key}
                className={`platform-row ${isChecked ? 'checked' : ''}`}
                onClick={() => togglePlatform(plat.key)}
              >
                <div className="platform-icon">{plat.code}</div>
                <div>
                  <div className="name">{plat.name}</div>
                  <div className="dims">
                    {plat.dims} · {plat.label}
                  </div>
                </div>
                <div className={`checkbox ${isChecked ? 'checked' : ''}`}>
                  {isChecked ? '✓' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Platform Variant Aspect Previews */}
      <div className="panel">
        <div className="panel-title">Dimension-Optimized Variants</div>
        <p style={{ fontSize: '12px', color: '#8b8ba3', marginTop: 0, marginBottom: '20px' }}>
          Each selected platform receives its own tailored layout with typography and focal points adapted to the aspect ratio.
        </p>

        <div
          style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            minHeight: '260px',
            background: 'var(--panel-2)',
            padding: '24px',
            borderRadius: '12px',
          }}
        >
          {AVAILABLE_PLATFORMS.filter((p) => currentPlatforms.includes(p.key)).map((plat) => {
            // Visual mockup sizes
            let w = 90;
            let h = 110;
            if (plat.key === 'instagram_portrait') {
              w = 90;
              h = 112;
            } else if (plat.key === 'instagram_square') {
              w = 90;
              h = 90;
            } else if (plat.key === 'facebook_feed' || plat.key === 'twitter_feed' || plat.key === 'linkedin_feed') {
              w = 120;
              h = 63;
            } else if (plat.key === 'pinterest_pin') {
              w = 85;
              h = 128;
            } else if (plat.key === 'instagram_story') {
              w = 75;
              h = 133;
            }

            return (
              <div
                key={plat.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    width: `${w}px`,
                    height: `${h}px`,
                    background: '#efe9f6',
                    borderRadius: '8px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '6px',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(w * 0.4, 28)}px`,
                      height: `${Math.min(w * 0.4, 28)}px`,
                      borderRadius: '50%',
                      background: '#d9a24a',
                    }}
                  />
                  <div
                    style={{
                      width: '65%',
                      height: '8px',
                      borderRadius: '3px',
                      background: '#2a2050',
                    }}
                  />
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#e8e8f2', textAlign: 'center' }}>
                  {plat.code}
                </div>
                <div style={{ fontSize: '9.5px', color: '#7a7a92', textAlign: 'center' }}>
                  {plat.dims}
                </div>
              </div>
            );
          })}
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
          ← Back to Style
        </button>
        <button className="btn btn-primary" onClick={onNext}>
          Continue to Mode →
        </button>
      </div>
    </div>
  );
};
