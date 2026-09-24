'use client';

import React, { useEffect, useState } from 'react';

interface ProcessingPanelProps {
  provider: string;
}

export const ProcessingPanel: React.FC<ProcessingPanelProps> = ({ provider }) => {
  const [elapsed, setElapsed] = useState('0.0');
  const [statusText, setStatusText] = useState('Sharp validating magic bytes & dimensions...');

  useEffect(() => {
    const t0 = performance.now();
    const interval = setInterval(() => {
      const sec = (performance.now() - t0) / 1000;
      setElapsed(sec.toFixed(1));

      if (sec > 1.5 && sec < 4.0) {
        setStatusText(
          `Executing AI matting inference (${provider === 'bria' ? 'BRIA RMBG Cloud' : '@imgly/background-removal-node'})...`,
        );
      } else if (sec >= 4.0 && sec < 7.0) {
        setStatusText('In-memory alpha refinement: BFS edge color decontamination...');
      } else if (sec >= 7.0) {
        setStatusText('Applying smoothstep alpha curve & PNG compression level 9...');
      }
    }, 100);

    return () => clearInterval(interval);
  }, [provider]);

  return (
    <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
      <div
        className="spinner"
        style={{ width: '40px', height: '40px', margin: '0 auto 20px', borderWidth: '4px' }}
      />
      <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Processing Image Pipeline...</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
        {statusText}
      </p>
      <div style={{ fontSize: '28px', fontWeight: 700, color: '#a78bfa' }}>{elapsed}s</div>
    </div>
  );
};
