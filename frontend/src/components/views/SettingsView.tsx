'use client';

import React, { useState } from 'react';
import { UserAccount } from '../../types';

interface SettingsViewProps {
  user: UserAccount;
  onUpdateUser: (updates: Partial<UserAccount>) => void;
  onNavigate: (view: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onUpdateUser,
  onNavigate,
}) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = () => {
    onUpdateUser({ name, email });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="app-body" style={{ maxWidth: '840px', margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 4px', fontSize: '24px' }}>Account Settings</h2>
      <p style={{ color: '#8b8ba3', fontSize: '13px', margin: '0 0 24px' }}>
        Manage your profile, visual appearance, and security credentials.
      </p>

      {/* Profile Panel */}
      <div className="panel" style={{ marginBottom: '22px' }}>
        <div className="panel-title">User Profile</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div className="avatar" style={{ width: '52px', height: '52px', fontSize: '20px' }}>
            {user.avatarLetter}
          </div>
          <div>
            <button className="btn btn-secondary btn-sm">Change photo</button>
            <div className="hint" style={{ marginTop: 4 }}>
              JPG, GIF or PNG. Max size 2MB
            </div>
          </div>
        </div>

        <div className="grid2">
          <div className="field">
            <label>Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Email Address</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
          <button className="btn btn-primary btn-sm" onClick={handleSaveProfile}>
            Save profile changes
          </button>
          {saveSuccess && (
            <span style={{ fontSize: '12px', color: '#3ecf8e', fontWeight: 600 }}>
              ✓ Profile saved successfully!
            </span>
          )}
        </div>
      </div>

      {/* Appearance Panel */}
      <div
        className="panel"
        style={{
          marginBottom: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <b style={{ fontSize: '14px', color: '#fff' }}>Theme Preference</b>
          <div style={{ fontSize: '11.5px', color: '#7d7d93', marginTop: '2px' }}>
            Dark mode is default; switch anytime to suit your environment.
          </div>
        </div>

        <div className="chip-row">
          <button
            className={`chip ${user.theme === 'dark' ? 'selected' : ''}`}
            onClick={() => onUpdateUser({ theme: 'dark' })}
          >
            🌙 Dark
          </button>
          <button
            className={`chip ${user.theme === 'light' ? 'selected' : ''}`}
            onClick={() => onUpdateUser({ theme: 'light' })}
          >
            ☀️ Light
          </button>
        </div>
      </div>

      {/* Security Panel */}
      <div className="panel">
        <div className="panel-title">Security &amp; Password</div>
        <div className="grid2">
          <div className="field">
            <label>Current Password</label>
            <input type="password" defaultValue="••••••••••" />
          </div>
          <div className="field">
            <label>New Password</label>
            <input type="password" placeholder="At least 8 characters" />
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => alert('Password updated successfully.')}>
          Update password
        </button>
      </div>
    </div>
  );
};
