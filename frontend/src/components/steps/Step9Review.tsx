'use client';

import React from 'react';
import { CreativeStatus, CreativeVariant, Project } from '../../types';

interface Step9ReviewProps {
  project: Project;
  onUpdateCreative: (id: string, updates: Partial<CreativeVariant>) => void;
  onRegenerateCreative: (id: string) => void;
  onRegenerateAll: () => void;
  onOpenEditCopyModal: (creative: CreativeVariant) => void;
  onOpenSwapStyleModal: (creative: CreativeVariant) => void;
  onOpenAdjustBgModal: (creative: CreativeVariant) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step9Review: React.FC<Step9ReviewProps> = ({
  project,
  onUpdateCreative,
  onRegenerateCreative,
  onRegenerateAll,
  onOpenEditCopyModal,
  onOpenSwapStyleModal,
  onOpenAdjustBgModal,
  onNext,
  onBack,
}) => {
  const list = project.creatives || [];
  const approvedCount = list.filter((c) => c.status === 'approved').length;
  const totalCount = list.length;

  return (
    <div className="app-body">
      {/* Top Controls Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <div>
          <div className="panel-title" style={{ margin: 0 }}>
            09 Review & Approve Creatives
          </div>
          <div style={{ fontSize: '12.5px', color: '#8b8ba3', marginTop: '2px' }}>
            {approvedCount} of {totalCount} approved · Only approved posts proceed to export
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-ghost btn-sm" onClick={onRegenerateAll}>
            ↻ Regenerate all
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={onNext}
            disabled={approvedCount === 0}
          >
            Proceed to Export ({approvedCount}) →
          </button>
        </div>
      </div>

      {/* Review Grid of Generated Creatives */}
      <div className="review-grid">
        {list.map((c) => {
          return (
            <div key={c.id} className="review-card">
              {/* Creative Canvas Preview */}
              <div className="review-thumb">
                <span
                  className={`status-tag ${
                    c.status === 'approved'
                      ? 'badge-green'
                      : c.status === 'needs_review'
                      ? 'badge-amber'
                      : 'badge-red'
                  }`}
                >
                  {c.status === 'approved'
                    ? 'Approved'
                    : c.status === 'needs_review'
                    ? 'Needs review'
                    : 'Rejected'}
                </span>

                {c.renderUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.renderUrl} alt={c.label} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '16px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#d9a24a', margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '11px', color: '#8b8ba3' }}>{c.headline}</div>
                  </div>
                )}
              </div>

              {/* Action Controls */}
              <div className="review-body">
                <div className="plat">
                  {c.platformName} · {c.width}×{c.height}
                </div>

                <div className="review-actions">
                  <span className="tag-btn" onClick={() => onRegenerateCreative(c.id)}>
                    Regenerate
                  </span>
                  <span className="tag-btn" onClick={() => onOpenEditCopyModal(c)}>
                    Edit copy
                  </span>
                  <span className="tag-btn" onClick={() => onOpenSwapStyleModal(c)}>
                    Swap style
                  </span>
                  <span className="tag-btn" onClick={() => onOpenAdjustBgModal(c)}>
                    Background
                  </span>
                </div>

                <div className="approve-row">
                  <button
                    className={`btn ${c.status === 'approved' ? 'btn-green' : 'btn-secondary'}`}
                    onClick={() => onUpdateCreative(c.id, { status: 'approved' })}
                  >
                    {c.status === 'approved' ? '✓ Approved' : 'Approve'}
                  </button>
                  <button
                    className={`btn ${c.status === 'rejected' ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={() => onUpdateCreative(c.id, { status: 'rejected' })}
                  >
                    {c.status === 'rejected' ? 'Rejected' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Step Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back to Settings
        </button>
        <button
          className="btn btn-primary"
          onClick={onNext}
          disabled={approvedCount === 0}
        >
          Proceed to Export ({approvedCount}) →
        </button>
      </div>
    </div>
  );
};
