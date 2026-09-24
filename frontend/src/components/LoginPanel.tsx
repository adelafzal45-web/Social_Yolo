'use client';

import React, { useState } from 'react';
import { login, LoginResponse } from '../lib/api';

interface LoginPanelProps {
  onLoginSuccess: (res: LoginResponse) => void;
  onError: (msg: string) => void;
}

export const LoginPanel: React.FC<LoginPanelProps> = ({ onLoginSuccess, onError }) => {
  const [email, setEmail] = useState('creator@socialyolo.local');
  const [password, setPassword] = useState('Creator@123');
  const [loading, setLoading] = useState(false);

  const setQuickUser = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await login(email, password);
      onLoginSuccess(res);
    } catch (err: any) {
      onError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>🔐 Studio Authentication & RBAC</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
        Sign in with an authenticated account. Role-Based Access Control (RBAC) enforces that only
        accounts with the <code>image:remove-background</code> permission can execute background removal.
      </p>

      <div
        style={{
          fontSize: '13px',
          fontWeight: 600,
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: '8px',
        }}
      >
        Quick Switch (Test Accounts)
      </div>

      <div className="quick-accounts">
        <div
          className="account-btn"
          onClick={() => setQuickUser('admin@socialyolo.local', 'Admin@123')}
        >
          <div className="account-name">👑 Administrator</div>
          <div className="account-role">admin@socialyolo.local (Full Access)</div>
        </div>
        <div
          className="account-btn"
          onClick={() => setQuickUser('creator@socialyolo.local', 'Creator@123')}
        >
          <div className="account-name">🎨 Content Creator</div>
          <div className="account-role">creator@socialyolo.local (Authorized)</div>
        </div>
        <div
          className="account-btn"
          onClick={() => setQuickUser('restricted@socialyolo.local', 'User@123')}
        >
          <div className="account-name">🚫 Restricted User</div>
          <div className="account-role">restricted@socialyolo.local (RBAC Denial Test)</div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <label style={{ fontSize: '14px', fontWeight: 500 }}>Email Address</label>
        <input
          type="email"
          className="input-field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label style={{ fontSize: '14px', fontWeight: 500 }}>Password</label>
        <input
          type="password"
          className="input-field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? (
            <>
              <div className="spinner" />
              <span>Authenticating...</span>
            </>
          ) : (
            <span>Sign In to Studio</span>
          )}
        </button>
      </form>
    </div>
  );
};
