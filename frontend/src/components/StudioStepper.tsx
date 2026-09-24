'use client';

import React from 'react';

interface StudioStepperProps {
  currentStep: number; // 1 to 10
  onStepClick: (step: number) => void;
}

const STEP_LABELS = [
  '01 Upload',
  '02 Brand',
  '03 Copy',
  '04 Style',
  '05 Platform',
  '06 Mode',
  '07 Quantity',
  '08 Generate',
  '09 Review',
  '10 Export',
];

export const StudioStepper: React.FC<StudioStepperProps> = ({ currentStep, onStepClick }) => {
  return (
    <div style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border-soft)' }}>
      <div className="stepper">
        {STEP_LABELS.map((_, idx) => {
          const stepNum = idx + 1;
          const isDone = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          return (
            <div
              key={idx}
              className={`seg ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
              style={{ cursor: stepNum <= currentStep ? 'pointer' : 'default' }}
              onClick={() => {
                if (stepNum <= currentStep) {
                  onStepClick(stepNum);
                }
              }}
              title={STEP_LABELS[idx]}
            />
          );
        })}
      </div>
      <div className="stepper-nums">
        {STEP_LABELS.map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum === currentStep;
          return (
            <span
              key={idx}
              className={isActive ? 'active' : ''}
              style={{
                cursor: stepNum <= currentStep ? 'pointer' : 'default',
                fontWeight: isActive ? 700 : 500,
              }}
              onClick={() => {
                if (stepNum <= currentStep) {
                  onStepClick(stepNum);
                }
              }}
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
};
