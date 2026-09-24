'use client';

import React from 'react';
import { AuthUser } from '../lib/api';
import { useBrand } from '@/context/BrandContext';

interface HeaderProps {
  user: AuthUser | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const { brand } = useBrand();

  return (
    <header>
      <div className="logo-group">
        <div className="logo-badge">✨</div>
        <div>
          <div className="logo-title">{brand.name}</div>
          <div className="logo-subtitle">{brand.description || 'Production Background Removal Studio'}</div>
        </div>
      </div>

      {user && (
        <div className="nav-user">
          <div className="user-badge">
            <span>{user.name || user.email}</span>
            <span className="role-tag">{(user as any).roles?.[0] || user.role || 'USER'}</span>
          </div>
          <button
            className="btn-outline"
            style={{ padding: '6px 14px', fontSize: '13px' }}
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
};
