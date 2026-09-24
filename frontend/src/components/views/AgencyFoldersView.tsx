'use client';

import React, { useState } from 'react';
import { Project } from '../../types';

interface AgencyFoldersViewProps {
  projects: Project[];
  onOpenProject: (project: Project) => void;
  onNewProject: () => void;
}

interface ClientFolder {
  id: string;
  name: string;
  projectsCount: number;
  gradient: string;
  badge?: string;
}

const FOLDERS: ClientFolder[] = [
  {
    id: 'meridian',
    name: 'Meridian Coffee Co.',
    projectsCount: 6,
    gradient: 'linear-gradient(135deg, #c98a3f, #8a5623)',
    badge: 'Active',
  },
  {
    id: 'aster',
    name: 'Aster & Co.',
    projectsCount: 3,
    gradient: 'linear-gradient(135deg, #a86fae, #6e3e78)',
  },
  {
    id: 'northridge',
    name: 'North Ridge Outdoors',
    projectsCount: 4,
    gradient: 'linear-gradient(135deg, #4e9e6e, #2e6e4a)',
  },
  {
    id: 'founders',
    name: 'Founders Edition',
    projectsCount: 2,
    gradient: 'linear-gradient(135deg, #4e7ea8, #2e4e78)',
  },
];

export const AgencyFoldersView: React.FC<AgencyFoldersViewProps> = ({
  projects,
  onOpenProject,
  onNewProject,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>('meridian');

  const activeFolder = FOLDERS.find((f) => f.id === selectedFolder) || FOLDERS[0];
  const folderKeyword = (activeFolder?.name || '').toLowerCase().split(' ')[0] || '';
  const clientProjects = (projects || []).filter(
    (p) =>
      (folderKeyword && p.clientFolder?.toLowerCase().includes(folderKeyword)) ||
      (folderKeyword && p.brandName?.toLowerCase().includes(folderKeyword)),
  );

  return (
    <div className="app-body">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '24px' }}>Client Workspaces</h2>
          <p style={{ color: '#8b8ba3', fontSize: '13px', margin: 0 }}>
            Agency plan · {FOLDERS.length} of 10 client workspaces used
          </p>
        </div>

        <button className="btn btn-primary" onClick={onNewProject}>
          + Add client folder
        </button>
      </div>

      {/* Client Folders Row */}
      <div className="grid4" style={{ marginBottom: '28px' }}>
        {FOLDERS.map((f) => {
          const isSelected = selectedFolder === f.id;
          return (
            <div
              key={f.id}
              className="panel"
              style={{
                borderColor: isSelected ? 'var(--purple)' : 'var(--border-soft)',
                background: isSelected ? 'var(--purple-bg)' : 'var(--panel)',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onClick={() => setSelectedFolder(f.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '9px',
                    background: f.gradient,
                  }}
                />
                {f.badge && <span className="badge badge-purple">{f.badge}</span>}
              </div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>{f.name}</div>
              <div style={{ fontSize: '11.5px', color: '#7d7d93', marginTop: '2px' }}>
                {f.projectsCount} projects · 1 brand profile
              </div>
            </div>
          );
        })}
      </div>

      {/* Projects of Selected Client */}
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#8b8ba3', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: '14px' }}>
        {activeFolder.name} · Projects
      </div>

      <div className="grid3">
        {clientProjects.map((p) => (
          <div key={p.id} className="proj-card" onClick={() => onOpenProject(p)}>
            <div className="proj-thumb" style={{ background: 'linear-gradient(135deg, #e6def0, #d8c9ea)' }}>
              <div className="circle" />
            </div>
            <div className="proj-body">
              <div className="name">{p.name}</div>
              <div className="status-row">
                <span className="status-dot" style={{ background: '#3ecf8e' }} />
                <span>Approved · 4 creatives</span>
              </div>
            </div>
          </div>
        ))}

        <div
          className="proj-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '180px',
            borderStyle: 'dashed',
            color: '#8b8ba3',
            fontSize: '13px',
            cursor: 'pointer',
          }}
          onClick={onNewProject}
        >
          + New project for this client
        </div>
      </div>
    </div>
  );
};
