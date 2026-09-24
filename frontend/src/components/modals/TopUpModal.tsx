'use client';

import React, { useState } from 'react';
import { TopUpPack } from '../../types';

interface TopUpModalProps {
  onClose: () => void;
  onConfirmTopUp: (credits: number, priceFormatted: string) => void;
}

const PACKS: TopUpPack[] = [
  { id: 'pack_50', credits: 50, price: 5, priceFormatted: '$5' },
  { id: 'pack_150', credits: 150, price: 13, priceFormatted: '$13', popular: true },
  { id: 'pack_400', credits: 400, price: 30, priceFormatted: '$30' },
];

export const TopUpModal: React.FC<TopUpModalProps> = ({ onClose, onConfirmTopUp }) => {
  const [selectedPack, setSelectedPack] = useState<TopUpPack>(PACKS[1]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Top Up Credits</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-sub">
          Top-up credits are added instantly to your balance, never expire within your active subscription, and are consumed before monthly credits.
        </div>

        <div className="grid3" style={{ gap: '12px' }}>
          {PACKS.map((pack) => {
            const isSelected = selectedPack.id === pack.id;
            return (
              <div
                key={pack.id}
                className="panel"
                style={{
                  textAlign: 'center',
                  padding: '16px 8px',
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--purple)' : 'var(--border-soft)',
                  position: 'relative',
                  background: isSelected ? 'var(--purple-bg)' : 'var(--panel)',
                }}
                onClick={() => setSelectedPack(pack)}
              >
                {pack.popular && (
                  <span
                    className="badge badge-purple"
                    style={{
                      position: 'absolute',
                      top: '-9px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '8.5px',
                    }}
                  >
                    POPULAR
                  </span>
                )}
                <div style={{ fontSize: '20px', fontWeight: 700 }}>{pack.credits}</div>
                <div style={{ fontSize: '10px', color: '#7d7d93', letterSpacing: '0.05em' }}>
                  CREDITS
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '8px', color: 'var(--amber)' }}>
                  {pack.priceFormatted}
                </div>
              </div>
            );
          })}
        </div>

        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: '20px' }}
          onClick={() => {
            onConfirmTopUp(selectedPack.credits, selectedPack.priceFormatted);
            onClose();
          }}
        >
          Buy {selectedPack.credits} credits — {selectedPack.priceFormatted}
        </button>

        <div className="hint" style={{ textAlign: 'center', marginTop: '12px' }}>
          Charged securely via Stripe. Instant automated balance update.
        </div>
      </div>
    </div>
  );
};
