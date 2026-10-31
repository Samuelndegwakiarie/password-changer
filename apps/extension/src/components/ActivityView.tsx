import React from 'react';
import type { ActivityRecord } from '@recoverly/shared-types';
import { getStatusDisplayLabel } from '../domain/state-machine';
import { Clock, ShieldCheck, AlertCircle, FileText } from 'lucide-react';

interface ActivityViewProps {
  activities: ActivityRecord[];
}

export const ActivityView: React.FC<ActivityViewProps> = ({ activities }) => {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Activity History</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Audit trail of recovery steps. Contains non-sensitive metadata only.
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
          <Clock size={32} style={{ margin: '0 auto 8px', opacity: 0.6 }} />
          <p style={{ fontSize: '14px' }}>No recovery activity recorded yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activities.map(act => {
            const dateStr = new Date(act.timestamp).toLocaleString();
            const statusLabel = getStatusDisplayLabel(act.status, act.evidenceType === 'user_confirmed' ? 'user_confirmed' : undefined);

            const isSuccess = act.status === 'completed';
            const isFailure = act.status === 'failed' || act.status === 'manual_action_required';

            return (
              <div
                key={act.id}
                className="card"
                style={{
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <div style={{ marginTop: '2px' }}>
                  {isSuccess ? (
                    <ShieldCheck size={18} color="#16a34a" />
                  ) : isFailure ? (
                    <AlertCircle size={18} color="#dc2626" />
                  ) : (
                    <FileText size={18} color="var(--accent-primary)" />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{act.domain}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{dateStr}</span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Status: <strong>{statusLabel}</strong>
                  </div>

                  {act.details && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {act.details}
                    </div>
                  )}

                  {act.evidenceType && (
                    <div style={{ marginTop: '4px' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                        Evidence: {act.evidenceType.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
