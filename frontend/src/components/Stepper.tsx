'use client';

import React from 'react';

export type StepKey = 'auth' | 'upload' | 'process' | 'result';

interface StepperProps {
  currentStep: StepKey;
}

const STEPS: { key: StepKey; number: number; label: string }[] = [
  { key: 'auth', number: 1, label: 'Authentication' },
  { key: 'upload', number: 2, label: 'Upload Image' },
  { key: 'process', number: 3, label: 'AI Matting' },
  { key: 'result', number: 4, label: 'Transparent Result' },
];

export const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="stepper">
      {STEPS.map((step, idx) => {
        let stateClass = '';
        if (idx === currentIndex) {
          stateClass = ' active';
        } else if (idx < currentIndex) {
          stateClass = ' completed';
        }

        return (
          <div key={step.key} className={`step-item${stateClass}`}>
            <div className="step-circle">{step.number}</div>
            <span>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
};
