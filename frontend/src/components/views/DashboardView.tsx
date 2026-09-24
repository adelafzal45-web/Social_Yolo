'use client';

import React from 'react';
import { Project, UserAccount } from '../../types';

interface DashboardViewProps {
  user: UserAccount;
  projects: Project[];
  onNewProject: () => void;
  onOpenProject: (project: Project) => void;
  onViewAllProjects: () => void;
  onOpenTopUp: () => void;
  onNavigate: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  projects,
  onNewProject,
  onOpenProject,
  onOpenTopUp,
  onNavigate,
}) => {
  const activeProjectsCount = projects?.length ?? 0;
  const approvedCreativesCount = (projects || []).reduce(
    (acc, p) => acc + (p.creatives || []).filter((c) => c.status === 'approved').length,
    0,
  );

  return (
    <div className="app-body">
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '24px' }}>Good afternoon, {(user?.name || 'Creator').split(' ')[0]}</h2>
          <p style={{ color: '#8b8ba3', fontSize: '13px', margin: 0 }}>
            {activeProjectsCount} projects active · Ready to design high-converting creatives
          </p>
        </div>

        <button className="btn btn-primary" onClick={onNewProject}>
          + New project
        </button>
      </div>

      {/* Stats Row */}
      <div className="dash-stats">
        <div className="stat-box" onClick={onOpenTopUp} style={{ cursor: 'pointer' }} title="Top up credits">
          <div className="label">Credit Balance</div>
          <div className="value amber">{user.credits}</div>
          <div className="sub">credits · resets in {user.resetDays} days</div>
        </div>

        <div className="stat-box" onClick={() => onNavigate('billing')} style={{ cursor: 'pointer' }}>
          <div className="label">Current Plan</div>
          <div className="value purple" style={{ fontSize: '16px' }}>
            {user.plan} {user.plan === 'Pro' ? '— $49/mo' : ''}
          </div>
          <div className="sub">renews Sep 24, 2026</div>
        </div>

        <div className="stat-box">
          <div className="label">This Month</div>
          <div className="value">{approvedCreativesCount || 24}</div>
          <div className="sub">creatives exported</div>
        </div>

        <div className="stat-box" onClick={() => onNavigate('agency_folders')} style={{ cursor: 'pointer' }}>
          <div className="label">Client Folders</div>
          <div className="value purple">{user.clientFoldersCount}</div>
          <div className="sub">Agency workspaces</div>
        </div>
      </div>

      {/* Projects Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#8b8ba3', letterSpacing: '.05em', textTransform: 'uppercase' }}>
          Your Creative Projects
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="icon-box">🖼️</div>
          <h3>No projects yet</h3>
          <p>
            Upload a product photo and Social Yolo will handle photo enhancement, copy, and layout design automatically.
          </p>
          <button className="btn btn-primary" onClick={onNewProject}>
            + Create your first project
          </button>
        </div>
      ) : (
        <div className="grid3" style={{ gap: '18px' }}>
          {(projects || []).map((proj) => {
            const approved = (proj.creatives || []).filter((c) => c.status === 'approved').length;
            const statusColor =
              proj.status === 'approved'
                ? '#3ecf8e'
                : proj.status === 'review'
                ? 'var(--purple-2)'
                : proj.status === 'generating'
                ? 'var(--amber)'
                : '#7a7a92';

            const bgGradients: Record<string, string> = {
              proj_ramadan_restock: 'linear-gradient(135deg, #3a2e6e, #7a5aa8)',
              proj_q3_launch: 'linear-gradient(135deg, #2e4a6e, #4a6a86)',
              proj_fall_lookbook: 'linear-gradient(135deg, #6e2e5e, #8a5a86)',
              proj_holiday_teaser: 'linear-gradient(135deg, #2e5e4a, #4a866a)',
            };

            return (
              <div
                key={proj.id}
                className="proj-card"
                onClick={() => onOpenProject(proj)}
              >
                <div
                  className="proj-thumb"
                  style={{
                    background: bgGradients[proj.id] || 'linear-gradient(135deg, #3a2e6e, #5a4aa8)',
                  }}
                >
                  {proj.enhancedPhotoUrl || proj.originalPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={proj.enhancedPhotoUrl || proj.originalPhotoUrl}
                      alt={proj.name}
                      style={{ maxHeight: '90px', maxWidth: '80%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div className="circle" />
                  )}
                </div>

                <div className="proj-body">
                  <div className="name">{proj.name}</div>
                  <div className="brand">{proj.brandName}</div>
                  <div className="status-row">
                    <span className="status-dot" style={{ background: statusColor }} />
                    <span style={{ textTransform: 'capitalize' }}>
                      {proj.status === 'approved'
                        ? `Approved · ${approved || 4} creatives`
                        : proj.status === 'review'
                        ? 'In review · Step 9'
                        : proj.status === 'generating'
                        ? 'Generating…'
                        : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
