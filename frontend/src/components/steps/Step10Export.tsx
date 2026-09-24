'use client';

import React, { useState } from 'react';
import JSZip from 'jszip';
import { Project, UserAccount } from '../../types';

interface Step10ExportProps {
  project: Project;
  user: UserAccount;
  onBackToReview: () => void;
  onDone: () => void;
  onSignUpRedirect: () => void;
}

export const Step10Export: React.FC<Step10ExportProps> = ({
  project,
  user,
  onBackToReview,
  onDone,
  onSignUpRedirect,
}) => {
  const [format, setFormat] = useState<'png' | 'jpg'>('png');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([
    '1080x1080',
    '1080x1350',
    '1200x628',
    '1000x1500',
  ]);
  const [customWidth, setCustomWidth] = useState('1600');
  const [customHeight, setCustomHeight] = useState('900');
  const [isCustomSelected, setIsCustomSelected] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [exportedZipName, setExportedZipName] = useState('');
  const [exportedZipSize, setExportedZipSize] = useState('');

  const approvedCreatives = (project.creatives || []).filter((c) => c.status === 'approved');
  const isGuest = user.role === 'GUEST';

  const toggleSize = (sizeKey: string) => {
    if (selectedSizes.includes(sizeKey)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== sizeKey));
    } else {
      setSelectedSizes([...selectedSizes, sizeKey]);
    }
  };

  const handleDownloadZip = async () => {
    if (isGuest) {
      onSignUpRedirect();
      return;
    }

    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const folderName = project.name.replace(/\s+/g, '_') || 'SocialYolo_Creatives';
      const folder = zip.folder(folderName) || zip;

      for (let i = 0; i < approvedCreatives.length; i++) {
        const c = approvedCreatives[i];
        if (c.renderUrl) {
          const base64Data = c.renderUrl.split(',')[1];
          if (base64Data) {
            folder.file(`${c.platformName}_${c.width}x${c.height}_${i + 1}.${format}`, base64Data, {
              base64: true,
            });
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const filename = `${folderName}_export.zip`;
      const sizeMb = (zipBlob.size / (1024 * 1024)).toFixed(1);

      // Trigger browser download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setExportedZipName(filename);
      setExportedZipSize(`${approvedCreatives.length} files · ${sizeMb} MB`);
      setDownloadSuccess(true);
    } catch (err) {
      console.error('ZIP generation failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSingle = () => {
    if (isGuest) {
      onSignUpRedirect();
      return;
    }
    const c = approvedCreatives[0];
    if (!c?.renderUrl) return;

    const link = document.createElement('a');
    link.href = c.renderUrl;
    link.download = `${project.name}_${c.platformName}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (downloadSuccess) {
    return (
      <div className="app-body centered" style={{ flexDirection: 'column' }}>
        <div className="success-icon">✓</div>
        <h2 style={{ margin: '0 0 6px', fontSize: '22px' }}>Your creatives are ready</h2>
        <p style={{ color: '#8b8ba3', fontSize: '13px', margin: 0 }}>
          {approvedCreatives.length} approved creatives exported as {(format || 'PNG').toUpperCase()} · saved to {project?.name || 'Project'}
        </p>

        <div className="file-row">
          <div className="fic">📄</div>
          <div style={{ flex: 1 }}>
            <div className="fname">{exportedZipName}</div>
            <div className="fsize">{exportedZipSize}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleDownloadZip}>
            Download again
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={onDone}>
            Back to dashboard
          </button>
          <button className="btn btn-primary" onClick={onDone}>
            Start a new project →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-body split" style={{ gridTemplateColumns: '1fr 340px', padding: 0 }}>
      {/* Left Column: Approved Creatives List */}
      <div style={{ padding: '24px 30px' }}>
        <div className="panel-title">Approved Creatives Ready for Export</div>
        <div className="grid2" style={{ gap: '16px' }}>
          {approvedCreatives.map((c) => (
            <div key={c.id} className="proj-card" style={{ cursor: 'default' }}>
              <div className="proj-thumb" style={{ height: '140px', background: '#1c1828' }}>
                {c.renderUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.renderUrl}
                    alt={c.label}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div className="circle" />
                )}
              </div>
              <div className="proj-body">
                <div style={{ fontSize: '12px', fontWeight: 600 }}>{c.platformName}</div>
                <div style={{ fontSize: '11px', color: '#7a7a92' }}>
                  {c.width}×{c.height} · {c.style}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-secondary" style={{ marginTop: '24px' }} onClick={onBackToReview}>
          ← Back to review
        </button>
      </div>

      {/* Right Column: Export Settings Panel */}
      <div
        className="panel"
        style={{
          borderRadius: 0,
          borderTop: 'none',
          borderBottom: 'none',
          borderRight: 'none',
          minHeight: '520px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Export Settings</h3>
        </div>
        <div className="hint" style={{ marginBottom: '16px' }}>
          {approvedCreatives.length} approved creatives selected
        </div>

        {/* Format Selector */}
        <div className="panel-title">Image Format</div>
        <div className="chip-row" style={{ marginBottom: '16px' }}>
          <div
            className={`chip ${format === 'png' ? 'selected' : ''}`}
            onClick={() => setFormat('png')}
          >
            PNG
          </div>
          <div
            className={`chip ${format === 'jpg' ? 'selected' : ''}`}
            onClick={() => setFormat('jpg')}
          >
            JPG <span style={{ fontSize: '9.5px', color: '#8888a4', marginLeft: '4px' }}>Recommended</span>
          </div>
        </div>

        {/* Sizes Checklist */}
        <div className="panel-title">Included Sizes</div>
        <div
          className={`size-row ${selectedSizes.includes('1080x1080') ? 'checked' : ''}`}
          onClick={() => toggleSize('1080x1080')}
        >
          <span className="dims">1080 × 1080</span>
          <span className="lbl">Feed square</span>
        </div>

        <div
          className={`size-row ${selectedSizes.includes('1080x1350') ? 'checked' : ''}`}
          onClick={() => toggleSize('1080x1350')}
        >
          <span className="dims">1080 × 1350</span>
          <span className="lbl">Feed portrait</span>
        </div>

        <div
          className={`size-row ${selectedSizes.includes('1200x628') ? 'checked' : ''}`}
          onClick={() => toggleSize('1200x628')}
        >
          <span className="dims">1200 × 628</span>
          <span className="lbl">Link ad / landscape</span>
        </div>

        <div
          className={`size-row ${selectedSizes.includes('1000x1500') ? 'checked' : ''}`}
          onClick={() => toggleSize('1000x1500')}
        >
          <span className="dims">1000 × 1500</span>
          <span className="lbl">Pinterest pin</span>
        </div>

        {/* Custom Size Dialog Box */}
        <div
          className="panel"
          style={{
            borderColor: isCustomSelected ? 'var(--purple)' : 'var(--border-soft)',
            background: isCustomSelected ? 'var(--purple-bg)' : 'var(--panel-2)',
            marginTop: '8px',
            padding: '14px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              cursor: 'pointer',
            }}
            onClick={() => setIsCustomSelected(!isCustomSelected)}
          >
            <b style={{ fontSize: '13px' }}>Custom Aspect Ratio / Size</b>
            <div className={`checkbox ${isCustomSelected ? 'checked' : ''}`}>
              {isCustomSelected ? '✓' : ''}
            </div>
          </div>

          {isCustomSelected && (
            <>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                <input
                  style={{
                    width: '70px',
                    background: '#0d0d14',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: '#fff',
                    padding: '6px 8px',
                  }}
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                />
                <span style={{ color: '#6f6f88' }}>×</span>
                <input
                  style={{
                    width: '70px',
                    background: '#0d0d14',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: '#fff',
                    padding: '6px 8px',
                  }}
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                />
                <span style={{ color: '#6f6f88', fontSize: '11px' }}>px</span>
              </div>

              <div className="chip-row">
                <div
                  className="chip"
                  onClick={() => {
                    setCustomWidth('1920');
                    setCustomHeight('1080');
                  }}
                >
                  16:9
                </div>
                <div
                  className="chip"
                  onClick={() => {
                    setCustomWidth('1080');
                    setCustomHeight('1350');
                  }}
                >
                  4:5
                </div>
                <div
                  className="chip"
                  onClick={() => {
                    setCustomWidth('1080');
                    setCustomHeight('1080');
                  }}
                >
                  1:1
                </div>
                <div className="chip selected">Custom</div>
              </div>
            </>
          )}
        </div>

        {/* Download Buttons */}
        <div className="panel-title" style={{ marginTop: '16px' }}>
          Delivery
        </div>

        <button
          className="btn btn-primary btn-block"
          style={{ marginBottom: '8px' }}
          disabled={isDownloading || approvedCreatives.length === 0}
          onClick={handleDownloadZip}
        >
          {isDownloading ? 'Packing ZIP...' : `↓ Download all as ZIP (${approvedCreatives.length} files)`}
        </button>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            className="btn btn-secondary"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={handleDownloadSingle}
          >
            Download first
          </button>
          <button
            className="btn btn-secondary"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={onDone}
          >
            Save to account
          </button>
        </div>

        {isGuest && (
          <div className="credit-note">
            <b>Guest session — create a free account to download</b>
            Your free creative is ready. Sign up to unlock the high-res file.
            <button
              className="btn btn-primary btn-sm"
              style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}
              onClick={onSignUpRedirect}
            >
              Create account →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
