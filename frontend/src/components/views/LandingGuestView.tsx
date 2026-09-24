'use client';

import React, { useRef } from 'react';
import { useBrand } from '@/context/BrandContext';

interface LandingGuestViewProps {
  onStartFree: (file?: File) => void;
  onLogin: () => void;
  onSignUp: () => void;
}

export const LandingGuestView: React.FC<LandingGuestViewProps> = ({
  onStartFree,
  onLogin,
  onSignUp,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { brand } = useBrand();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onStartFree(file);
    }
  };

  return (
    <div>
      {/* Guest Topbar */}
      <div className="app-topbar">
        <div className="app-brand">
          <div className="logo">{brand.shortName ? brand.shortName.slice(0, 2).toUpperCase() : 'SY'}</div>
          <span className="name">{brand.name.toUpperCase()}</span>
        </div>
        <div className="app-right">
          <span className="pill" style={{ color: '#a5a5ba', background: 'transparent' }}>
            Guest mode · 1 free creative
          </span>
          <button className="btn btn-ghost btn-sm" onClick={onLogin}>
            Log in
          </button>
          <button className="btn btn-primary btn-sm" onClick={onSignUp}>
            Sign up free
          </button>
        </div>
      </div>

      {/* Hero Body */}
      <div className="app-body centered" style={{ flexDirection: 'column', gap: '24px', padding: '60px 20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '.08em',
              color: '#a78bfa',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            Try it free · No account needed
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '36px',
              margin: '0 0 12px',
              lineHeight: 1.15,
            }}
          >
            Turn one product photo into a scroll-stopping post
          </h1>

          <p style={{ color: '#8b8ba3', fontSize: '15px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
            Upload a photo below. We&apos;ll enhance the lighting, remove or replace the background, generate compelling copy, and design platform-ready posts — in seconds.
          </p>
        </div>

        {/* Upload Dropzone */}
        <div
          className="upload-box"
          style={{ width: '520px', maxWidth: '100%' }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="up-icon">⭱</div>
          <h4>Drag &amp; drop a product photo</h4>
          <p>or click to browse · JPG, PNG, WEBP</p>
          <button className="btn btn-primary btn-sm">Choose photo</button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
          />
        </div>

        <div className="trust-row">
          <span>
            <span className="d" /> No credit card required
          </span>
          <span>
            <span className="d" /> Studio-grade Behance/Pinterest aesthetics
          </span>
          <span>
            <span className="d" /> Free 1-click test
          </span>
        </div>
      </div>
    </div>
  );
};
