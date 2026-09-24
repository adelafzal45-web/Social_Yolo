'use client';

import React, { useState } from 'react';
import { CreativeVariant } from '../../types';

interface AdjustBgModalProps {
  creative: CreativeVariant;
  onClose: () => void;
  onApply: (id: string) => void;
}

export const AdjustBgModal: React.FC<AdjustBgModalProps> = ({
  creative,
  onClose,
  onApply,
}) => {
  const [bgMode, setBgMode] = useState<'ai' | 'remove' | 'keep'>('ai');
  const [selectedColor, setSelectedColor] = useState('#4a6a4e');

  const swatches = ['#4a6a4e', '#c9a24e', '#8ac4e6', '#e6a8c4', '#1f293d', '#2e1830'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box wide" style={{ width: '560px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>
            Adjust Background — {creative.platformName} · {creative.width}×{creative.height}
          </h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '20px', marginTop: '16px' }}>
          <div
            style={{
              background: selectedColor,
              borderRadius: '12px',
              aspectRatio: `${creative.width}/${creative.height}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '8px',
              overflow: 'hidden',
              padding: '10px',
            }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#e0aa4e' }} />
            <div style={{ width: '52px', height: '14px', borderRadius: '4px', background: '#2a2050' }} />
          </div>

          <div>
            <div className="panel-title" style={{ marginBottom: '8px' }}>
              Background Treatment
            </div>
            <div className="chip-row" style={{ marginBottom: '16px' }}>
              <div
                className={`chip ${bgMode === 'keep' ? 'selected' : ''}`}
                onClick={() => setBgMode('keep')}
              >
                Keep original
              </div>
              <div
                className={`chip ${bgMode === 'remove' ? 'selected' : ''}`}
                onClick={() => setBgMode('remove')}
              >
                Remove (Alpha)
              </div>
              <div
                className={`chip ${bgMode === 'ai' ? 'selected' : ''}`}
                onClick={() => setBgMode('ai')}
              >
                AI replace
              </div>
            </div>

            <div className="panel-title" style={{ marginBottom: '8px' }}>
              Backdrop Ambient Hue
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {swatches.map((color) => (
                <div
                  key={color}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '7px',
                    background: color,
                    border: selectedColor === color ? '2px solid #fff' : '1px solid transparent',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>

            <div className="panel-title" style={{ marginBottom: '8px' }}>
              Edge Refinement
            </div>
            <div className="chip-row">
              <div className="chip selected">Decontaminate Halo</div>
              <div className="chip">Feather Edge</div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onApply(creative.id);
              onClose();
            }}
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};
