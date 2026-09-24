'use client';

import React from 'react';
import { OutputMode, Project } from '../../types';

interface Step6ModeProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step6Mode: React.FC<Step6ModeProps> = ({
  project,
  onUpdateProject,
  onNext,
  onBack,
}) => {
  return (
    <div className="app-body">
      <div className="panel-title">06 Choose Output Mode</div>

      <div className="option-cards" style={{ marginBottom: '24px' }}>
        {/* Creative Design Card */}
        <div
          className={`option-card ${project.outputMode === 'creative' ? 'selected' : ''}`}
          onClick={() => onUpdateProject({ outputMode: 'creative' })}
        >
          {project.outputMode === 'creative' && <div className="check">✓</div>}
          <h4>Creative Design (Organic)</h4>
          <div className="desc">Full creative freedom · High-end visual storytelling</div>
          <ul>
            <li>No platform ad-policy or text constraints</li>
            <li>Unrestricted layout, experimental crops & full-bleed type</li>
            <li>Best for organic feed, Pinterest pins & editorial stories</li>
            <li>Style freedom across all 6 design directions</li>
          </ul>
          <div className="mini-preview">
            Small batch.
            <div style={{ fontSize: '11px', fontWeight: 400, marginTop: '6px' }}>
              Big morning. Full-bleed text welcome.
            </div>
          </div>
        </div>

        {/* Static Ad (Meta Design) Card */}
        <div
          className={`option-card ${project.outputMode === 'meta_ad' ? 'selected' : ''}`}
          onClick={() => onUpdateProject({ outputMode: 'meta_ad' })}
        >
          {project.outputMode === 'meta_ad' && <div className="check">✓</div>}
          <h4>Static Ad (Meta Design)</h4>
          <div className="desc">Meta ad-policy compliant · High ROAS placement ready</div>
          <ul>
            <li>On-image text strictly capped at ≤ 20% of canvas area</li>
            <li>Automated prohibited claims & brand badge scan before Approve</li>
            <li>CTA placement safe zones verified for Instagram & Facebook feeds</li>
            <li>Auto-calibrates typography sizing across all placement ratios</li>
          </ul>
          <div className="mini-preview" style={{ alignItems: 'flex-start' }}>
            <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
              Small batch. Big morning.
            </div>
            <div style={{ width: '100%', height: '5px', background: '#4ec9ff', borderRadius: '3px', marginBottom: '8px' }} />
            <div style={{ display: 'flex', gap: '6px' }}>
              <span className="mini-tag" style={{ background: '#0f2a20', color: '#3ecf8e' }}>
                CTA: SHOP NOW
              </span>
              <span className="mini-tag" style={{ background: '#0f2a20', color: '#3ecf8e' }}>
                POLICY: PASS (14%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Meta Ad Policy Inspection Panel */}
      {project.outputMode === 'meta_ad' && (
        <div className="panel" style={{ marginTop: '16px' }}>
          <div className="panel-title">Meta Ad Compliance Pre-Flight Inspection</div>
          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '24px', alignItems: 'center' }}>
            <div
              style={{
                background: '#efe9f6',
                borderRadius: '12px',
                aspectRatio: '4/5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '8px',
                padding: '12px',
              }}
            >
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#e0aa4e' }} />
              <div style={{ width: '60px', height: '16px', borderRadius: '4px', background: '#2a2050' }} />
            </div>

            <div>
              <div className="check-item">
                <div className="check-ic pass">✓</div>
                <div>
                  <div className="t">On-Image Text Density Guard</div>
                  <div className="d">14% estimated text footprint · Safely under Meta&apos;s 20% threshold</div>
                </div>
              </div>

              <div className="check-item">
                <div className="check-ic pass">✓</div>
                <div>
                  <div className="t">Restricted Content Scan</div>
                  <div className="d">No misleading promises, prohibited claims, or unverified symbols detected</div>
                </div>
              </div>

              <div className="check-item">
                <div className="check-ic warn">!</div>
                <div>
                  <div className="t">CTA Safe-Zone Margin</div>
                  <div className="d">Button positioned 42px from bottom margin · Meets standard safe-area limits</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Step Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back to Platform
        </button>
        <button className="btn btn-primary" onClick={onNext}>
          Continue to Quantity →
        </button>
      </div>
    </div>
  );
};
