'use client';

import React from 'react';
import { Invoice, UserAccount } from '../../types';

interface BillingViewProps {
  user: UserAccount;
  invoices: Invoice[];
  onOpenTopUp: () => void;
  onOpenCancelModal: () => void;
  onUpgradePlan: (plan: UserAccount['plan']) => void;
}

export const BillingView: React.FC<BillingViewProps> = ({
  user,
  invoices,
  onOpenTopUp,
  onOpenCancelModal,
  onUpgradePlan,
}) => {
  const plans: {
    key: UserAccount['plan'];
    name: string;
    price: string;
    credits: string;
    features: string[];
  }[] = [
    {
      key: 'Free Trial',
      name: 'Free Trial',
      price: '$0',
      credits: '4 credits/mo',
      features: ['1 creative post · no login required', 'Account required to download', 'Community support'],
    },
    {
      key: 'Starter',
      name: 'Starter',
      price: '$19/mo',
      credits: '100 credits/mo',
      features: ['All 6 platforms & sizes', 'Visual style selector', 'PNG/JPG high-res export', 'Save up to 10 projects'],
    },
    {
      key: 'Pro',
      name: 'Pro',
      price: '$49/mo',
      credits: '350 credits/mo',
      features: [
        'All Starter features',
        'Priority AI generation & matting',
        'Custom aspect ratios & dimensions',
        'Multi-brand profiles library',
        'Meta ad policy compliance checker',
      ],
    },
    {
      key: 'Agency',
      name: 'Agency',
      price: '$99/mo',
      credits: '1,000 credits/mo',
      features: [
        'All Pro features',
        '5 included team seats',
        '10 client folders & workspaces',
        'White-label clean exports',
        'Dedicated VIP render worker',
      ],
    },
  ];

  return (
    <div className="app-body">
      <h2 style={{ margin: '0 0 4px', fontSize: '24px' }}>Plans &amp; Billing</h2>
      <p style={{ color: '#8b8ba3', fontSize: '13px', margin: '0 0 20px' }}>
        Manage your subscription plan, credit reserves, and billing invoices.
      </p>

      {/* Current Plan Summary Card */}
      <div
        className="panel"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '26px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div className="label" style={{ fontSize: '10px', color: '#7b7b92', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Current Active Plan
          </div>
          <b style={{ fontSize: '18px', color: '#fff' }}>{user?.plan || 'Pro'}</b>
          <div style={{ fontSize: '11.5px', color: '#7b7b92', marginTop: '2px' }}>
            {user?.plan === 'Pro' ? '$49/mo · renews Sep 24, 2026' : 'Active subscription'}
          </div>
        </div>

        <div>
          <div className="label" style={{ fontSize: '10px', color: '#7b7b92', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Credit Balance
          </div>
          <b style={{ fontSize: '20px', color: 'var(--amber)' }}>{user?.credits ?? 0}</b>
          <div style={{ fontSize: '11.5px', color: '#7b7b92', marginTop: '2px' }}>
            {user?.maxCredits ?? 350}/mo · resets in {user?.resetDays ?? 30} days
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={onOpenCancelModal}>
            Manage plan
          </button>
          <button className="btn btn-amber" onClick={onOpenTopUp}>
            ⚡ Top up credits
          </button>
        </div>
      </div>

      {/* Available Plans Grid */}
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#8b8ba3', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: '14px' }}>
        Available Subscription Tiers
      </div>

      <div className="grid4" style={{ marginBottom: '28px' }}>
        {plans.map((p) => {
          const isCurrent = (user?.plan || 'Pro') === p.key;
          return (
            <div key={p.key} className={`plan-card ${isCurrent ? 'current' : ''}`}>
              {isCurrent && <span className="cur-badge">CURRENT PLAN</span>}
              <div className="pname">{p.name}</div>
              <div className="pprice">{p.price}</div>
              <div className="pcred">{p.credits}</div>
              <ul>
                {p.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <button
                className={`btn btn-block ${isCurrent ? 'btn-secondary' : 'btn-primary'}`}
                disabled={isCurrent}
                onClick={() => onUpgradePlan(p.key)}
              >
                {isCurrent ? 'Active Plan' : p.key === 'Free Trial' ? 'Downgrade' : 'Upgrade'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Invoices Table */}
      <div className="panel">
        <div className="panel-title">Recent Invoices &amp; Receipts</div>
        <table className="invoice-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {(invoices || []).map((inv) => (
              <tr key={inv.id}>
                <td>{inv.date}</td>
                <td>{inv.description}</td>
                <td style={{ fontWeight: 600 }}>{inv.amount}</td>
                <td>
                  <span className="badge badge-green">{inv.status}</span>
                </td>
                <td>
                  <span
                    className="link"
                    style={{ fontSize: '12px', cursor: 'pointer' }}
                    onClick={async () => {
                      const token = typeof window !== 'undefined' ? localStorage.getItem('social_yolo_jwt') || '' : '';
                      try {
                        const res = await fetch(`/api/billing/invoices/${inv.id}/pdf`, {
                          headers: token ? { Authorization: `Bearer ${token}` } : {},
                        });
                        if (res.ok) {
                          const blob = await res.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `invoice-${inv.id.slice(0, 8)}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                        } else {
                          alert('Invoice PDF download failed.');
                        }
                      } catch (e) {
                        alert('Could not download PDF invoice.');
                      }
                    }}
                  >
                    Download PDF ↓
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
