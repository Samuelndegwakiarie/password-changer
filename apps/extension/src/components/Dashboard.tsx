import React from 'react';
import type { AccountRecord, RecoveryRecord } from '@recoverly/shared-types';
import { ShieldAlert, AlertTriangle, CheckCircle, Clock, Plus, ArrowRight } from 'lucide-react';

interface DashboardProps {
  accounts: AccountRecord[];
  recoveries: Record<string, RecoveryRecord>;
  onStartRecovery: (accountId: string) => void;
  onAddAccount: () => void;
  onViewAccounts: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  accounts,
  recoveries,
  onStartRecovery,
  onAddAccount,
  onViewAccounts,
}) => {
  const totalAccounts = accounts.length;

  const compromisedCount = accounts.filter(a => a.riskCategories.includes('breached')).length;
  const reusedCount = accounts.filter(a => a.riskCategories.includes('reused')).length;
  const weakCount = accounts.filter(a => a.riskCategories.includes('weak')).length;
  const userReportedCount = accounts.filter(a => a.riskCategories.includes('user_reported')).length;

  // Completed recoveries
  const completedCount = Object.values(recoveries).filter(r => r.status === 'completed').length;
  const manualCount = Object.values(recoveries).filter(r => r.status === 'manual_action_required').length;

  // Prioritization: Email, financial, identity first, then highest risk level
  const priorityOrder: Record<string, number> = {
    email: 4,
    identity: 3,
    financial: 3,
    work: 2,
    social: 1,
    shopping: 1,
    other: 0,
  };

  const riskOrder: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
    unknown: 0,
  };

  const sortedPendingAccounts = [...accounts]
    .filter(a => {
      const rec = Object.values(recoveries).find(r => r.accountId === a.id);
      return !rec || rec.status !== 'completed';
    })
    .sort((a, b) => {
      const pDiff = (priorityOrder[b.importance] ?? 0) - (priorityOrder[a.importance] ?? 0);
      if (pDiff !== 0) return pDiff;
      return (riskOrder[b.riskLevel] ?? 0) - (riskOrder[a.riskLevel] ?? 0);
    });

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Security Dashboard</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Remediate vulnerable accounts one-by-one</p>
        </div>
        <button className="btn-primary" onClick={onAddAccount} style={{ fontSize: '13px', padding: '6px 10px' }}>
          <Plus size={14} /> Add Account
        </button>
      </div>

      {totalAccounts === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
          <ShieldAlert size={40} color="var(--accent-primary)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>No Accounts Added Yet</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Add an at-risk account flagged by Chrome or your password manager to begin guided remediation.
          </p>
          <button className="btn-primary" onClick={onAddAccount}>
            <Plus size={16} /> Add Your First Account
          </button>
        </div>
      ) : (
        <>
          {/* Summary metrics grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div className="card" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--risk-critical-text)', fontSize: '12px', fontWeight: 600 }}>
                <ShieldAlert size={14} /> Compromised
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px' }}>{compromisedCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Found in known breaches</div>
            </div>

            <div className="card" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--risk-high-text)', fontSize: '12px', fontWeight: 600 }}>
                <AlertTriangle size={14} /> Reused / Weak
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px' }}>{reusedCount + weakCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{reusedCount} reused · {weakCount} weak</div>
            </div>

            <div className="card" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-success-text)', fontSize: '12px', fontWeight: 600 }}>
                <CheckCircle size={14} /> Recovered
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px' }}>{completedCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Password changed & saved</div>
            </div>

            <div className="card" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>
                <Clock size={14} /> In Queue
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px' }}>{sortedPendingAccounts.length}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{manualCount} requiring manual step</div>
            </div>
          </div>

          {/* User-reported vs verified breach note */}
          {userReportedCount > 0 && (
            <div className="notice-banner notice-info" style={{ margin: 0 }}>
              <span>ℹ️ <strong>{userReportedCount}</strong> account(s) have user-reported risk tags separate from third-party breach verifications.</span>
            </div>
          )}

          {/* Recommended Next Remediation */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Priority Remediation Queue</h3>
              <button
                className="btn-secondary"
                onClick={onViewAccounts}
                style={{ fontSize: '11px', padding: '4px 8px' }}
              >
                View All ({totalAccounts})
              </button>
            </div>

            {sortedPendingAccounts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--status-success-text)' }}>
                <CheckCircle size={28} style={{ margin: '0 auto 6px' }} />
                <p style={{ fontWeight: 600, fontSize: '13px' }}>All queued accounts have been remediated!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sortedPendingAccounts.slice(0, 3).map(account => {
                  const badgeClass =
                    account.riskLevel === 'critical'
                      ? 'badge-critical'
                      : account.riskLevel === 'high'
                      ? 'badge-high'
                      : account.riskLevel === 'medium'
                      ? 'badge-medium'
                      : 'badge-low';

                  return (
                    <div
                      key={account.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, fontSize: '13px' }}>{account.displayName}</span>
                          <span className={`badge ${badgeClass}`}>{account.riskLevel}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {account.domain} {account.usernameHint ? `(${account.usernameHint})` : ''} · Category: {account.importance}
                        </div>
                      </div>

                      <button
                        className="btn-primary"
                        onClick={() => onStartRecovery(account.id)}
                        style={{ fontSize: '12px', padding: '6px 10px', flexShrink: 0 }}
                      >
                        Fix Now <ArrowRight size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
