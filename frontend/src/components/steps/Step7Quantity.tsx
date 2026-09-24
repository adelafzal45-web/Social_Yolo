'use client';

import React from 'react';
import { Project, UserAccount } from '../../types';

interface Step7QuantityProps {
  project: Project;
  user: UserAccount;
  onUpdateProject: (updates: Partial<Project>) => void;
  onNext: () => void;
  onBack: () => void;
  onOpenTopUp: () => void;
}

export const Step7Quantity: React.FC<Step7QuantityProps> = ({
  project,
  user,
  onUpdateProject,
  onNext,
  onBack,
  onOpenTopUp,
}) => {
  const costPerPost = project.contentType === 'video' ? 20 : 4;
  const totalCost = project.quantity * costPerPost;
  const remainingCredits = user.credits - totalCost;
  const isInsufficient = remainingCredits < 0;

  const handleQuantityChange = (delta: number) => {
    const nextQty = Math.max(1, Math.min(50, project.quantity + delta));
    onUpdateProject({ quantity: nextQty });
  };

  return (
    <div className="app-body split" style={{ gridTemplateColumns: '1fr 1fr', padding: '0 30px 26px', gap: '24px' }}>
      {/* Left Column: Content Type & Quantity Controls */}
      <div className="panel">
        <div className="panel-title">07 Content Type</div>
        <div className="chip-row" style={{ marginBottom: '20px' }}>
          <div
            className={`chip ${project.contentType === 'static' ? 'selected' : ''}`}
            onClick={() => onUpdateProject({ contentType: 'static' })}
          >
            Static post (4 credits)
          </div>
          <div
            className={`chip ${project.contentType === 'video' ? 'selected' : ''}`}
            onClick={() => onUpdateProject({ contentType: 'video' })}
          >
            Short-form Video (20 credits)
          </div>
        </div>

        <div className="divider" />

        <div style={{ fontSize: '12px', color: '#a5a5ba', marginBottom: '10px' }}>
          Number of Creatives to Generate
        </div>

        <div className="qty-control">
          <button
            className="qty-btn"
            onClick={() => handleQuantityChange(-1)}
            disabled={project.quantity <= 1}
          >
            −
          </button>
          <span className="qty-num">{project.quantity}</span>
          <button className="qty-btn primary" onClick={() => handleQuantityChange(1)}>
            +
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#a5a5ba', marginTop: '14px' }}>
          <span>
            {costPerPost} credits × {project.quantity} {project.contentType === 'video' ? 'videos' : 'posts'}
          </span>
          <b style={{ color: 'var(--amber)' }}>{totalCost} credits</b>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#a5a5ba', marginTop: '6px' }}>
          <span>Balance after generation</span>
          <span style={{ color: isInsufficient ? 'var(--red)' : '#3ecf8e', fontWeight: 600 }}>
            {remainingCredits} credits
          </span>
        </div>

        {isInsufficient && (
          <div className="credit-note warn" style={{ marginTop: '16px' }}>
            ⚠ This batch needs {totalCost} credits, but your account only has {user.credits}.
            Reduce quantity or top up credits to proceed.
          </div>
        )}
      </div>

      {/* Right Column: Live Credit Calculator */}
      <div className="credit-calc">
        <div className="panel-title">Live Credit Calculator</div>

        <div className="credit-hero">
          <div className="coin">✦</div>
          <div>
            <div className="num">{totalCost} credits</div>
            <div className="cap">will be charged for this creative batch</div>
          </div>
        </div>

        <div className="hint" style={{ marginBottom: '12px' }}>
          Updates in real time as quantity or content format changes
        </div>

        <div className="credit-row">
          <span>Current Account Balance</span>
          <b>{user.credits} credits</b>
        </div>

        <div className="credit-row">
          <span>This Batch</span>
          <b style={{ color: '#ff9aa4' }}>−{totalCost} credits</b>
        </div>

        <div className="credit-row">
          <span>Remaining Balance</span>
          <b style={{ color: isInsufficient ? 'var(--red)' : '#3ecf8e' }}>
            {remainingCredits} credits
          </b>
        </div>

        {isInsufficient ? (
          <button
            className="btn btn-amber btn-block"
            style={{ marginTop: '18px' }}
            onClick={onOpenTopUp}
          >
            ⚡ Top Up Credits Now
          </button>
        ) : (
          <div className="credit-note">
            <b>Balance covers this batch comfortably.</b>
            Credits reset in {user.resetDays} days with your {user.plan} plan.
          </div>
        )}
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
          ← Back to Mode
        </button>
        <button
          className="btn btn-primary"
          onClick={onNext}
          disabled={isInsufficient}
        >
          Generate {project.quantity} {project.contentType === 'video' ? 'Videos' : 'Creatives'} →
        </button>
      </div>
    </div>
  );
};
