'use client';

import React, { useState } from 'react';
import { TeamMember } from '../../types';

interface TeamSeatsViewProps {
  teamMembers: TeamMember[];
  onInviteMember: (email: string, role: TeamMember['role']) => void;
}

export const TeamSeatsView: React.FC<TeamSeatsViewProps> = ({ teamMembers, onInviteMember }) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('Editor');

  const handleSend = () => {
    if (!inviteEmail.trim()) return;
    onInviteMember(inviteEmail, inviteRole);
    setInviteEmail('');
  };

  const seatsUsed = (teamMembers || []).length;
  const totalSeats = 5;

  return (
    <div className="app-body">
      <h2 style={{ margin: '0 0 4px', fontSize: '24px' }}>Team Seats &amp; Collaboration</h2>
      <p style={{ color: '#8b8ba3', fontSize: '13px', margin: '0 0 20px' }}>
        Agency plan · {seatsUsed} of {totalSeats} seats allocated
      </p>

      {/* Invite Row */}
      <div className="panel" style={{ marginBottom: '22px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          style={{
            flex: 1,
            minWidth: '220px',
            background: '#0d0d14',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: '#fff',
            padding: '10px 12px',
          }}
          placeholder="teammate@agency.com"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
        />
        <div className="chip-row">
          <div
            className={`chip ${inviteRole === 'Editor' ? 'selected' : ''}`}
            onClick={() => setInviteRole('Editor')}
          >
            Editor
          </div>
          <div
            className={`chip ${inviteRole === 'Viewer' ? 'selected' : ''}`}
            onClick={() => setInviteRole('Viewer')}
          >
            Viewer
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSend} disabled={!inviteEmail}>
          Send invite
        </button>
      </div>

      {/* Members List */}
      <div className="panel">
        <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6f6f88', marginBottom: '8px' }}>
          Active Workspace Members
        </div>

        {(teamMembers || []).map((m) => (
          <div key={m.id} className="team-row">
            <div className="avatar">{m.avatarLetter || m.name?.[0] || 'U'}</div>
            <div>
              <div className="tname">{m.name}</div>
              <div className="temail">{m.email}</div>
            </div>
            <div className="role" style={{ color: '#a5a5ba' }}>
              {m.role}
            </div>
            <div
              className="stat"
              style={{
                color: m.status === 'Active' ? '#3ecf8e' : 'var(--amber)',
                fontWeight: 600,
              }}
            >
              ● {m.status}
            </div>
          </div>
        ))}
      </div>

      <div className="hint" style={{ marginTop: '14px' }}>
        {totalSeats - seatsUsed} seats remaining on your Agency workspace plan.{' '}
        <span className="link">Upgrade for unlimited seats</span>
      </div>
    </div>
  );
};
