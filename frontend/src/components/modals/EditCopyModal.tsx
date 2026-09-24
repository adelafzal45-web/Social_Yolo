'use client';

import React, { useState } from 'react';
import { CreativeVariant } from '../../types';

interface EditCopyModalProps {
  creative: CreativeVariant;
  onClose: () => void;
  onSave: (id: string, headline: string, body: string) => void;
}

export const EditCopyModal: React.FC<EditCopyModalProps> = ({ creative, onClose, onSave }) => {
  const [headline, setHeadline] = useState(creative.headline);
  const [body, setBody] = useState(creative.body);

  const sampleVariations = [
    'Roasted this morning. Ready for yours.',
    'Small-batch. Big flavor.',
    'Your new morning ritual starts here.',
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>
            Edit Copy — {creative.platformName} · {creative.width}×{creative.height}
          </h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '20px', marginTop: '16px' }}>
          <div
            style={{
              background: '#efe9f6',
              borderRadius: '12px',
              aspectRatio: `${creative.width}/${creative.height}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '10px',
              padding: '14px',
              overflow: 'hidden',
            }}
          >
            {creative.renderUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={creative.renderUrl}
                alt="preview"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#d9a24a' }} />
            )}
          </div>

          <div>
            <div className="field">
              <label>
                Headline <span className="count">{headline.length}/60</span>
              </label>
              <input
                value={headline}
                maxLength={60}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </div>

            <div className="field">
              <label>
                Body Copy <span className="count">{body.length}/150</span>
              </label>
              <textarea
                value={body}
                maxLength={150}
                rows={3}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Quick AI Suggestions</label>
              {sampleVariations.map((v) => (
                <div
                  key={v}
                  className={`chip ${headline === v ? 'selected' : ''}`}
                  style={{ display: 'block', marginBottom: '6px', cursor: 'pointer' }}
                  onClick={() => setHeadline(v)}
                >
                  &ldquo;{v}&rdquo;
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="link" style={{ fontSize: '11px' }}>
            Applies to this creative variant
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                onSave(creative.id, headline, body);
                onClose();
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
