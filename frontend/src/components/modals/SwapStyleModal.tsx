'use client';

import React, { useState } from 'react';
import { CreativeVariant, DesignStyle } from '../../types';

interface SwapStyleModalProps {
  creative: CreativeVariant;
  onClose: () => void;
  onSwapStyle: (id: string, newStyle: DesignStyle) => void;
}

const STYLES: { key: DesignStyle; name: string; bg: string }[] = [
  { key: 'minimalist', name: 'Minimalist', bg: '#efe9f0' },
  { key: 'bold', name: 'Bold & Vibrant', bg: 'linear-gradient(135deg,#ff7a3d,#ffb648)' },
  { key: 'luxury', name: 'Luxury', bg: '#241d18' },
  { key: 'lifestyle', name: 'Lifestyle', bg: 'linear-gradient(135deg,#d9b686,#8a6f4a)' },
  { key: 'tech', name: 'Tech / Modern', bg: '#141a24' },
  { key: 'playful', name: 'Playful', bg: 'linear-gradient(135deg,#ffc6d9,#a8d4f0)' },
];

export const SwapStyleModal: React.FC<SwapStyleModalProps> = ({
  creative,
  onClose,
  onSwapStyle,
}) => {
  const [selectedStyle, setSelectedStyle] = useState<DesignStyle>(creative.style);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box wide" style={{ width: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>
            Swap Style — {creative.platformName} · {creative.width}×{creative.height}
          </h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-sub">
          Choose a new design direction for this single variant.
        </div>

        <div className="grid3" style={{ gap: '12px' }}>
          {STYLES.map((st) => {
            const isSelected = selectedStyle === st.key;
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
                }}
                onClick={() => setSelectedStyle(st.key)}
              >
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      background: 'var(--purple)',
                      color: '#fff',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ✓
                  </div>
                )}
                <div style={{ height: '70px', background: st.bg }} />
                <div style={{ padding: '8px 10px', fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                  {st.name}
                </div>
              </div>
            );
          })}
        </div>

        <div className="modal-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11.5px', color: 'var(--amber)' }}>
            ● Updates canvas styling instantly
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                onSwapStyle(creative.id, selectedStyle);
                onClose();
              }}
            >
              Apply {selectedStyle}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
