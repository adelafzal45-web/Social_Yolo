'use client';

import React, { useState } from 'react';
import { BrandProfile } from '../../types';

interface NewProjectModalProps {
  brands: BrandProfile[];
  onClose: () => void;
  onCreateProject: (projectName: string, brandId: string, clientFolder: string) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  brands,
  onClose,
  onCreateProject,
}) => {
  const [projectName, setProjectName] = useState('Fall Lookbook — Reels teaser');
  const [selectedBrandId, setSelectedBrandId] = useState(brands[0]?.id || 'brand_meridian');
  const [clientFolder, setClientFolder] = useState('Meridian workspace');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>New Project</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-sub">
          Start the 10-step creative generation pipeline tailored to your brand.
        </div>

        <div className="field">
          <label>Project Name</label>
          <input
            placeholder="e.g. Ramadan Restock — Multi-platform"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Brand Profile</label>
          <div className="chip-row">
            {brands.map((b) => (
              <div
                key={b.id}
                className={`chip ${selectedBrandId === b.id ? 'selected' : ''}`}
                onClick={() => setSelectedBrandId(b.id)}
              >
                {b.name}
              </div>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Client Folder (Agency Workspace)</label>
          <div className="chip-row">
            {['No folder', 'Meridian workspace', 'Aster workspace', 'North Ridge workspace'].map(
              (f) => (
                <div
                  key={f}
                  className={`chip ${clientFolder === f ? 'selected' : ''}`}
                  onClick={() => setClientFolder(f)}
                >
                  {f}
                </div>
              ),
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onCreateProject(projectName, selectedBrandId, clientFolder);
              onClose();
            }}
          >
            Start Project →
          </button>
        </div>
      </div>
    </div>
  );
};
