'use client';

import React, { useState } from 'react';
import { AppNotification, UserAccount } from '../types';
import { useBrand } from '@/context/BrandContext';

interface AppHeaderProps {
  user: UserAccount;
  activeView: string;
  onNavigate: (view: string) => void;
  onOpenTopUp: () => void;
  notifications: AppNotification[];
  onMarkNotificationsRead: () => void;
  onToggleTheme: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  user,
  activeView,
  onNavigate,
  onOpenTopUp,
  notifications,
  onMarkNotificationsRead,
  onToggleTheme,
}) => {
  const { brand } = useBrand();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = (notifications || []).filter((n) => !n.read).length;

  return (
    <header className="app-topbar">
      <div className="app-brand cursor-pointer" onClick={() => onNavigate('dashboard')}>
        <div className="logo">
          {brand.shortName ? brand.shortName.slice(0, 2).toUpperCase() : 'SY'}
        </div>
        <div>
          <span className="name">{brand.name.toUpperCase()}</span>
          <div className="step-tag">
            {activeView === 'studio' ? '10-Step Creative Studio' : brand.description || 'AI-Powered Creative Platform'}
          </div>
        </div>
      </div>

      <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button
          className={`btn btn-ghost btn-sm ${activeView === 'dashboard' ? 'active' : ''}`}
          style={{
            borderColor: activeView === 'dashboard' ? 'var(--purple)' : 'transparent',
            color: activeView === 'dashboard' ? '#fff' : 'var(--text-dim)',
          }}
          onClick={() => onNavigate('dashboard')}
        >
          Dashboard
        </button>

        <button
          className={`btn btn-ghost btn-sm ${activeView === 'studio' ? 'active' : ''}`}
          style={{
            borderColor: activeView === 'studio' ? 'var(--purple)' : 'transparent',
            color: activeView === 'studio' ? '#fff' : 'var(--text-dim)',
          }}
          onClick={() => onNavigate('studio')}
        >
          + Studio
        </button>

        <button
          className={`btn btn-ghost btn-sm ${activeView === 'agency_folders' ? 'active' : ''}`}
          style={{
            borderColor: activeView === 'agency_folders' ? 'var(--purple)' : 'transparent',
            color: activeView === 'agency_folders' ? '#fff' : 'var(--text-dim)',
          }}
          onClick={() => onNavigate('agency_folders')}
        >
          Clients
        </button>

        <button
          className={`btn btn-ghost btn-sm ${activeView === 'billing' ? 'active' : ''}`}
          style={{
            borderColor: activeView === 'billing' ? 'var(--purple)' : 'transparent',
            color: activeView === 'billing' ? '#fff' : 'var(--text-dim)',
          }}
          onClick={() => onNavigate('billing')}
        >
          Billing
        </button>
      </nav>

      <div className="app-right">
        {/* Credits Counter Pill */}
        <div
          className="pill pill-credits"
          onClick={onOpenTopUp}
          title="Click to view or top up credits"
        >
          <span className="dot"></span>
          <span>{user?.credits ?? 0} CREDITS</span>
        </div>

        {/* Plan Pill */}
        <span
          className="pill pill-plan"
          onClick={() => onNavigate('billing')}
          style={{ cursor: 'pointer' }}
          title="Current subscription plan"
        >
          {(user?.plan || 'Pro').toUpperCase()}
        </span>

        {/* Notifications Icon */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px 9px', borderRadius: '50%', position: 'relative' }}
            onClick={() => {
              setShowNotifs(!showNotifs);
              setShowUserMenu(false);
              if (!showNotifs && unreadCount > 0) {
                onMarkNotificationsRead();
              }
            }}
            aria-label="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  background: 'var(--red)',
                  color: '#fff',
                  fontSize: '9px',
                  fontWeight: 700,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="notif-panel">
              <div className="notif-head">
                <span>Notifications</span>
                <span
                  className="link"
                  style={{ fontSize: '11px' }}
                  onClick={onMarkNotificationsRead}
                >
                  Mark all read
                </span>
              </div>
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {(notifications || []).map((n) => (
                  <div key={n.id} className="notif-item">
                    <div className="notif-ic">
                      {n.type === 'warning' ? '⚠️' : n.type === 'success' ? '✓' : n.type === 'payment' ? '💳' : '✉️'}
                    </div>
                    <div>
                      <div className="nt">{n.title}</div>
                      <div className="nd">{n.message}</div>
                      <div className="ntime">{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="notif-footer">
                <span
                  className="link"
                  style={{ fontSize: '12px' }}
                  onClick={() => {
                    setShowNotifs(false);
                    onNavigate('notifications');
                  }}
                >
                  View full notifications center →
                </span>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div style={{ position: 'relative' }}>
          <div
            className="avatar"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifs(false);
            }}
            title={user?.name || 'User'}
          >
            {user?.avatarLetter || (user?.name ? user.name.charAt(0).toUpperCase() : 'U')}
          </div>

          {showUserMenu && (
            <div
              style={{
                position: 'absolute',
                top: 42,
                right: 0,
                width: 220,
                background: '#151521',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '12px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                zIndex: 60,
              }}
            >
              <div style={{ paddingBottom: 8, borderBottom: '1px solid var(--border-soft)', marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: '13px' }}>{user?.name || 'User'}</div>
                <div style={{ fontSize: '11px', color: '#7a7a92' }}>{user?.email || ''}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--purple-2)', marginTop: 2 }}>
                  Role: {user?.role || 'USER'} · {user?.plan || 'Pro'}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button
                  className="btn btn-ghost btn-sm btn-block"
                  style={{ justifyContent: 'flex-start', border: 'none' }}
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigate('settings');
                  }}
                >
                  ⚙️ Account Settings
                </button>
                <button
                  className="btn btn-ghost btn-sm btn-block"
                  style={{ justifyContent: 'flex-start', border: 'none' }}
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigate('team');
                  }}
                >
                  👥 Team Seats (3/5)
                </button>
                <button
                  className="btn btn-ghost btn-sm btn-block"
                  style={{ justifyContent: 'flex-start', border: 'none' }}
                  onClick={() => {
                    setShowUserMenu(false);
                    onToggleTheme();
                  }}
                >
                  🌓 Toggle Theme ({user.theme})
                </button>
                {/* Sign out ends the Supabase session server-side (POST →
                    /auth/signout clears the session cookies, then redirects to
                    /login). No client-side token handling. */}
                <form
                  action="/auth/signout"
                  method="post"
                  style={{ borderTop: '1px solid var(--border-soft)', marginTop: 4, paddingTop: 6 }}
                >
                  <button
                    type="submit"
                    className="btn btn-ghost btn-sm btn-block"
                    style={{ justifyContent: 'flex-start', border: 'none', color: 'var(--red)' }}
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
