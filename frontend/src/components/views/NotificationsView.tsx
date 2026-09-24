'use client';

import React from 'react';
import { AppNotification } from '../../types';

interface NotificationsViewProps {
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onBack: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onMarkAllRead,
  onBack,
}) => {
  return (
    <div className="app-body" style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '24px' }}>Notification Center</h2>
          <p style={{ color: '#8b8ba3', fontSize: '13px', margin: 0 }}>
            Recent updates on creative renders, credits, team activity, and billing.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={onMarkAllRead}>
          Mark all as read
        </button>
      </div>

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {(notifications || []).map((n) => (
          <div
            key={n.id}
            className="notif-item"
            style={{
              background: n.read ? 'transparent' : 'rgba(124, 92, 255, 0.05)',
              padding: '16px 20px',
            }}
          >
            <div className="notif-ic" style={{ width: '36px', height: '36px', fontSize: '15px' }}>
              {n.type === 'warning' ? '⚠️' : n.type === 'success' ? '✓' : n.type === 'payment' ? '💳' : '✉️'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{n.title}</span>
                <span style={{ fontSize: '11px', color: '#6f6f88' }}>{n.time}</span>
              </div>
              <div style={{ fontSize: '12.5px', color: '#a5a5ba', marginTop: '4px', lineHeight: 1.5 }}>
                {n.message}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-secondary" style={{ marginTop: '20px' }} onClick={onBack}>
        ← Back
      </button>
    </div>
  );
};
