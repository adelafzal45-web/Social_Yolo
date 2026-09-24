'use client';

import React from 'react';

export interface PrototypeScreenDef {
  id: string;
  category: string;
  title: string;
  sub: string;
  view: string;
  step?: number;
  isMobile?: boolean;
}

export const PROTOTYPE_SCREENS: PrototypeScreenDef[] = [
  // A. Marketing, Auth & Onboarding
  { id: 'a1', category: 'A. Marketing, Auth & Onboarding', title: 'Guest — Try It Free', sub: 'Unauthenticated entry point into the product', view: 'landing' },
  { id: 'a2', category: 'A. Marketing, Auth & Onboarding', title: 'Sign Up', sub: 'Account creation with free credits', view: 'signup' },
  { id: 'a3', category: 'A. Marketing, Auth & Onboarding', title: 'Verify Email', sub: 'Post-signup email confirmation', view: 'verify_email' },
  { id: 'a4', category: 'A. Marketing, Auth & Onboarding', title: 'Log In', sub: 'Returning-user authentication', view: 'login' },
  { id: 'a5', category: 'A. Marketing, Auth & Onboarding', title: 'Forgot Password', sub: 'Password-reset request', view: 'forgot_password' },
  { id: 'a6', category: 'A. Marketing, Auth & Onboarding', title: 'Onboarding — Welcome', sub: 'First-run niche and category picker', view: 'onboarding' },
  { id: 'a7', category: 'A. Marketing, Auth & Onboarding', title: 'Brand AI Setup', sub: 'Initial brand profile configuration from description', view: 'studio', step: 2 },

  // B. Dashboard & Project Setup
  { id: 'b1', category: 'B. Dashboard & Project Setup', title: 'Dashboard — Empty State', sub: 'New account with no projects yet', view: 'dashboard_empty' },
  { id: 'b2', category: 'B. Dashboard & Project Setup', title: 'New Project Modal', sub: 'Starting a new creative project', view: 'new_project_modal' },
  { id: 'b3', category: 'B. Dashboard & Project Setup', title: 'Dashboard — Populated', sub: 'Returning user with active projects & credit stats', view: 'dashboard' },
  { id: 'b4', category: 'B. Dashboard & Project Setup', title: 'Agency — Client Folders', sub: 'Multi-client workspace organization', view: 'agency_folders' },
  { id: 'b5', category: 'B. Dashboard & Project Setup', title: 'Project Detail', sub: 'Single project overview and exported creatives', view: 'project_detail' },

  // C. 10-Step Creative Generation Flow
  { id: 'c1', category: 'C. 10-Step Creative Generation Flow', title: 'Step 1 — Upload', sub: 'Product image upload and AI enhancement', view: 'studio', step: 1 },
  { id: 'c2', category: 'C. 10-Step Creative Generation Flow', title: 'Step 2 — Brand', sub: 'Brand profile selection & color palette', view: 'studio', step: 2 },
  { id: 'c3', category: 'C. 10-Step Creative Generation Flow', title: 'Step 3 — Copy', sub: 'AI-generated ad copy variations & occasion tags', view: 'studio', step: 3 },
  { id: 'c4', category: 'C. 10-Step Creative Generation Flow', title: 'Review / Edit Copy (Modal)', sub: 'Manual copy editing overlay for a single variant', view: 'edit_copy_modal' },
  { id: 'c5', category: 'C. 10-Step Creative Generation Flow', title: 'Step 4 — Style', sub: 'Visual style direction selection (6 styles + AI recommend)', view: 'studio', step: 4 },
  { id: 'c6', category: 'C. 10-Step Creative Generation Flow', title: 'Style Swap (Modal)', sub: 'Swapping design direction for single creative', view: 'swap_style_modal' },
  { id: 'c7', category: 'C. 10-Step Creative Generation Flow', title: 'Step 5 — Platform', sub: 'Target platform multi-selection & dimension optimization', view: 'studio', step: 5 },
  { id: 'c8', category: 'C. 10-Step Creative Generation Flow', title: 'Step 6 — Mode', sub: 'Creative Design vs Meta Ad (policy compliant)', view: 'studio', step: 6 },
  { id: 'c9', category: 'C. 10-Step Creative Generation Flow', title: 'Meta Compliance Check', sub: 'Ad-policy validation: text <= 20% & CTA margins', view: 'meta_compliance_check' },
  { id: 'c10', category: 'C. 10-Step Creative Generation Flow', title: 'Step 7 — Quantity', sub: 'Content type and live real-time credit calculator', view: 'studio', step: 7 },
  { id: 'c11', category: 'C. 10-Step Creative Generation Flow', title: 'Insufficient Credits (Prompt)', sub: 'Blocking state before generation with shortfall alert', view: 'insufficient_credits' },
  { id: 'c12', category: 'C. 10-Step Creative Generation Flow', title: 'Top-Up Credits (Modal)', sub: 'Resolving credit shortfall with instant top-up packs', view: 'topup_modal' },
  { id: 'c13', category: 'C. 10-Step Creative Generation Flow', title: 'Step 8 — Generating', sub: 'AI multi-phase generation in progress with animated ring', view: 'studio', step: 8 },
  { id: 'c14', category: 'C. 10-Step Creative Generation Flow', title: 'Step 9 — Review', sub: 'Reviewing generated creatives with approve/reject', view: 'studio', step: 9 },
  { id: 'c15', category: 'C. 10-Step Creative Generation Flow', title: 'Adjust Background (Modal)', sub: 'Fine-tuning backdrop hue and alpha edge mask', view: 'adjust_bg_modal' },
  { id: 'c16', category: 'C. 10-Step Creative Generation Flow', title: 'Step 10 — Export', sub: 'Final export drawer with PNG/JPG and ZIP packaging', view: 'studio', step: 10 },
  { id: 'c17', category: 'C. 10-Step Creative Generation Flow', title: 'Custom Size Dialog', sub: 'Defining custom dimensions and aspect ratio presets', view: 'custom_size_dialog' },
  { id: 'c18', category: 'C. 10-Step Creative Generation Flow', title: 'Export Success', sub: 'Confirmation screen with ZIP download again action', view: 'export_success' },

  // D. Account, Team & Billing
  { id: 'd1', category: 'D. Account, Team & Billing', title: 'Account Settings', sub: 'User profile, appearance theme, and password', view: 'settings' },
  { id: 'd2', category: 'D. Account, Team & Billing', title: 'Team & Seats', sub: 'Team member allocation and member invite flow', view: 'team' },
  { id: 'd3', category: 'D. Account, Team & Billing', title: 'Billing & Plans', sub: 'Subscription tiers, credit history, and PDF invoices', view: 'billing' },
  { id: 'd4', category: 'D. Account, Team & Billing', title: 'Cancel Subscription (Modal)', sub: 'Subscription cancellation flow with retention offers', view: 'cancel_sub_modal' },

  // E. System, Utility & Mobile
  { id: 'e1', category: 'E. System, Utility & Mobile', title: 'Notifications Center', sub: 'In-app notification events & alerts', view: 'notifications' },
  { id: 'e2', category: 'E. System, Utility & Mobile', title: 'Session Expired', sub: 'Re-authentication prompt with preserved project draft', view: 'session_expired' },
  { id: 'e3', category: 'E. System, Utility & Mobile', title: 'Mobile Flow View', sub: 'Simplified step-by-step mobile viewport preview', view: 'mobile_flow', isMobile: true },
];

interface PrototypeRailProps {
  currentScreenIdx: number;
  onSelectScreen: (index: number) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const PrototypeRail: React.FC<PrototypeRailProps> = ({
  currentScreenIdx,
  onSelectScreen,
  isOpen,
  onToggleOpen,
}) => {
  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          background: '#151522',
          border: '1px solid #33334e',
          color: '#c9b8ff',
          borderRadius: '999px',
          padding: '8px 16px',
          fontSize: '12px',
          fontWeight: 600,
          boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
          zIndex: 80,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span>📑 PRD Navigator</span>
        <span style={{ fontSize: '10px', background: 'var(--purple)', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
          38 Screens
        </span>
      </button>
    );
  }

  // Group screens by category
  const categories: Record<string, { idx: number; screen: PrototypeScreenDef }[]> = {};
  PROTOTYPE_SCREENS.forEach((sc, idx) => {
    if (!categories[sc.category]) {
      categories[sc.category] = [];
    }
    categories[sc.category].push({ idx, screen: sc });
  });

  return (
    <nav className="proto-rail">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 8px 14px',
          borderBottom: '1px solid #17171f',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="mark" style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'linear-gradient(135deg,#8a6bff,#5a3fd6)' }} />
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#e8e8f0' }}>SOCIAL YOLO</div>
            <div style={{ fontSize: '10px', color: '#6d6d82' }}>PRD v1.0 Screen Matrix</div>
          </div>
        </div>
        <button
          onClick={onToggleOpen}
          style={{
            background: 'none',
            border: 'none',
            color: '#777790',
            fontSize: '16px',
            cursor: 'pointer',
          }}
          title="Minimize Navigator"
        >
          ✕
        </button>
      </div>

      {Object.entries(categories).map(([catName, items]) => (
        <div key={catName}>
          <div className="proto-section-label">{catName}</div>
          {items.map(({ idx, screen }) => {
            const isActive = currentScreenIdx === idx;
            return (
              <div
                key={screen.id}
                className={`proto-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectScreen(idx)}
              >
                <span className="num">{idx + 1}</span>
                <span>{screen.title}</span>
              </div>
            );
          })}
        </div>
      ))}
    </nav>
  );
};
