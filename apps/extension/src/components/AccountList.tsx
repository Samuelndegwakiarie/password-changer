import React, { useState } from 'react';
import type { AccountRecord, RecoveryRecord } from '@recoverly/shared-types';
import { Search, Plus, Trash2, Edit2, Play, AlertTriangle } from 'lucide-react';

interface AccountListProps {
  accounts: AccountRecord[];
  recoveries: Record<string, RecoveryRecord>;
  onStartRecovery: (accountId: string) => void;
  onEditAccount: (account: AccountRecord) => void;
  onDeleteAccount: (accountId: string) => void;
  onAddNew: () => void;
}

export const AccountList: React.FC<AccountListProps> = ({
  accounts,
  recoveries,
  onStartRecovery,
  onEditAccount,
  onDeleteAccount,
  onAddNew,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = accounts.filter(acc => {
    const matchesSearch =
      acc.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (acc.usernameHint?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesRisk = riskFilter === 'all' || acc.riskLevel === riskFilter;

    return matchesSearch && matchesRisk;
  });

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Managed Accounts</h2>
        <button className="btn-primary" onClick={onAddNew} style={{ fontSize: '13px', padding: '6px 10px' }}>
          <Plus size={14} /> Add Account
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search accounts or domains..."
            style={{ paddingLeft: '30px' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={riskFilter}
          onChange={e => setRiskFilter(e.target.value)}
          style={{ width: '130px', flexShrink: 0 }}
        >
          <option value="all">All Risks</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Accounts List */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
          No accounts found matching your filters.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(acc => {
            const recovery = Object.values(recoveries).find(r => r.accountId === acc.id);
            const isCompleted = recovery?.status === 'completed';

            const badgeClass =
              acc.riskLevel === 'critical'
                ? 'badge-critical'
                : acc.riskLevel === 'high'
                ? 'badge-high'
                : acc.riskLevel === 'medium'
                ? 'badge-medium'
                : 'badge-low';

            return (
              <div key={acc.id} className="card" style={{ padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{acc.displayName}</span>
                      <span className={`badge ${badgeClass}`}>{acc.riskLevel}</span>
                      {isCompleted && (
                        <span className="badge badge-low" style={{ background: 'var(--status-success-bg)', color: 'var(--status-success-text)' }}>
                          ✓ Recovered
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {acc.domain} {acc.usernameHint ? `· ${acc.usernameHint}` : ''}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      className="btn-secondary"
                      onClick={() => onEditAccount(acc)}
                      style={{ padding: '4px 6px' }}
                      title="Edit Account"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setConfirmDeleteId(acc.id)}
                      style={{ padding: '4px 6px', color: '#ef4444' }}
                      title="Delete Account"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '6px 0 10px 0' }}>
                  {acc.riskCategories.map(cat => (
                    <span key={cat} className="badge badge-neutral" style={{ fontSize: '11px' }}>
                      {cat.replace('_', ' ')}
                    </span>
                  ))}
                  <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                    Category: {acc.importance}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    className="btn-primary"
                    onClick={() => onStartRecovery(acc.id)}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    <Play size={13} /> {isCompleted ? 'Change Again' : 'Start Recovery'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '16px',
          }}
        >
          <div className="card" style={{ maxWidth: '360px', width: '100%', padding: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#ef4444', marginBottom: '12px' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Confirm Deletion</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Are you sure you want to remove this account record? All associated local recovery history will be deleted.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn-secondary" onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={() => {
                  onDeleteAccount(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
