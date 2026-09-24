'use client';

import React from 'react';
import { Project } from '../../types';

interface ProjectDetailViewProps {
  project: Project;
  onBackToDashboard: () => void;
  onOpenInStudio: (project: Project) => void;
  onDuplicate: (project: Project) => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  onBackToDashboard,
  onOpenInStudio,
  onDuplicate,
}) => {
  return (
    <div className="app-body">
      <div style={{ fontSize: '11.5px', color: '#7d7d93', marginBottom: '8px' }}>
        <span className="link" onClick={onBackToDashboard}>
          Projects
        </span>{' '}
        / {project.name}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '24px' }}>{project.name}</h2>
          <p style={{ color: '#8b8ba3', fontSize: '13px', margin: 0 }}>
            {project.brandName} · {project.outputMode === 'meta_ad' ? 'Meta Ad Mode' : 'Creative Design Mode'} ·{' '}
            {(project.creatives || []).length || 4} creatives · Created Aug 12, 2026
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => onDuplicate(project)}>
            Duplicate project
          </button>
          <button className="btn btn-primary" onClick={() => onOpenInStudio(project)}>
            Open in editor →
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="dash-stats">
        <div className="stat-box">
          <div className="label">Status</div>
          <div className="value" style={{ fontSize: '15px', color: '#3ecf8e' }}>
            ● {(project.status || 'draft').toUpperCase()}
          </div>
        </div>

        <div className="stat-box">
          <div className="label">Platforms</div>
          <div className="value" style={{ fontSize: '13px', fontWeight: 600 }}>
            Instagram, Facebook, Pinterest, Twitter/X
          </div>
        </div>

        <div className="stat-box">
          <div className="label">Credits Used</div>
          <div className="value amber">{project.creditsUsed || 16} credits</div>
        </div>

        <div className="stat-box">
          <div className="label">Style</div>
          <div className="value" style={{ fontSize: '15px', textTransform: 'capitalize' }}>
            {project.style}
          </div>
        </div>
      </div>

      {/* Exported Creatives Thumbnails */}
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#8b8ba3', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: '14px' }}>
        Exported Creatives Gallery
      </div>

      <div className="grid4" style={{ marginBottom: '24px' }}>
        {(project.creatives || []).length > 0
          ? (project.creatives || []).map((c) => (
              <div key={c.id} className="proj-card">
                <div className="proj-thumb" style={{ height: '140px', background: '#1c1828' }}>
                  {c.renderUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.renderUrl}
                      alt={c.label}
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div className="circle" />
                  )}
                </div>
                <div className="proj-body" style={{ padding: '8px 10px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 600 }}>{c.platformName}</div>
                  <div style={{ fontSize: '10.5px', color: '#7d7d93' }}>
                    {c.width}×{c.height}
                  </div>
                </div>
              </div>
            ))
          : [
              { name: 'Instagram', dims: '1080×1350' },
              { name: 'Facebook', dims: '1200×628' },
              { name: 'Pinterest', dims: '1000×1500' },
              { name: 'Twitter/X', dims: '1200×628' },
            ].map((d, i) => (
              <div key={i} className="proj-card">
                <div className="proj-thumb" style={{ height: '140px', background: '#e6def0' }}>
                  <div className="circle" style={{ background: '#e0aa4e' }} />
                </div>
                <div className="proj-body" style={{ padding: '8px 10px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 600 }}>{d.name}</div>
                  <div style={{ fontSize: '10.5px', color: '#7d7d93' }}>{d.dims}</div>
                </div>
              </div>
            ))}
      </div>

      {/* Activity Timeline */}
      <div className="panel">
        <div className="panel-title">Project Activity History</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--border-soft)', fontSize: '12.5px' }}>
          <span>All creatives reviewed and approved for delivery</span>
          <span style={{ color: '#6f6f88' }}>Aug 12, 4:41 PM</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--border-soft)', fontSize: '12.5px' }}>
          <span>Exported as high-res ZIP package (4 files)</span>
          <span style={{ color: '#6f6f88' }}>Aug 12, 4:44 PM</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--border-soft)', fontSize: '12.5px' }}>
          <span>Project created from Meridian Coffee Co. brand profile</span>
          <span style={{ color: '#6f6f88' }}>Aug 12, 4:02 PM</span>
        </div>
      </div>
    </div>
  );
};
