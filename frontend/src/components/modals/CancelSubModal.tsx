'use client';

import React from 'react';

interface CancelSubModalProps {
  renewalDate: string;
  onClose: () => void;
  onConfirmCancel: () => void;
}

export const CancelSubModal: React.FC<CancelSubModalProps> = ({
  renewalDate,
  onClose,
  onConfirmCancel,
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div
          className="icon-circle"
          style={{
            background: 'var(--red-bg)',
            color: 'var(--red)',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            fontSize: '20px',
          }}
        >
          ⚠️
        </div>

        <h3 style={{ margin: '0 0 8px', textAlign: 'center', fontSize: '18px' }}>
          Cancel your Pro subscription?
        </h3>

        <p style={{ fontSize: '12.5px', color: '#a5a5ba', lineHeight: 1.6, margin: '0 0 14px', textAlign: 'center' }}>
          You&apos;ll keep full Pro access until <b style={{ color: '#fff' }}>{renewalDate}</b>, then move to the Free Trial plan. Unused credits won&apos;t roll over. Your saved brand profiles and past projects will remain safe.
        </p>

        <div className="credit-note" style={{ marginBottom: '18px' }}>
          <b style={{ display: 'inline' }}>Consider instead: </b>
          Pause auto-renewal for 1 month, or switch to Starter ($19/mo) to keep core export features.
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Never mind
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              onConfirmCancel();
              onClose();
            }}
          >
            Cancel Subscription
          </button>
        </div>
      </div>
    </div>
  );
};
