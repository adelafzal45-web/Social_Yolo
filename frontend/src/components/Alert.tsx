'use client';

import React from 'react';

export interface AlertMessage {
  type: 'danger' | 'success' | 'info';
  text: string;
}

interface AlertProps {
  alert: AlertMessage | null;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ alert, onDismiss }) => {
  if (!alert) return null;

  return (
    <div
      className={`alert alert-${alert.type}`}
      style={{ cursor: onDismiss ? 'pointer' : 'default' }}
      onClick={onDismiss}
    >
      <span>
        {alert.type === 'danger' && '⚠️ '}
        {alert.type === 'success' && '✅ '}
        {alert.type === 'info' && 'ℹ️ '}
        {alert.text}
      </span>
    </div>
  );
};
