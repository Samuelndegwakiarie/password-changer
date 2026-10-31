import React, { useState } from 'react';
import type {
  AccountRecord,
  RiskLevel,
  RiskCategory,
  ImportanceCategory,
} from '@recoverly/shared-types';
import { normalizeDomain, isValidOriginForRecovery } from '@recoverly/adapter-contracts';
import { X, AlertCircle } from 'lucide-react';

interface AddAccountModalProps {
  onClose: () => void;
  onSave: (account: Omit<AccountRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: AccountRecord;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  onClose,
  onSave,
  initialData,
}) => {
  const [displayName, setDisplayName] = useState(initialData?.displayName ?? '');
  const [domainInput, setDomainInput] = useState(initialData?.domain ?? '');
  const [usernameHint, setUsernameHint] = useState(initialData?.usernameHint ?? '');
  const [importance, setImportance] = useState<ImportanceCategory>(initialData?.importance ?? 'other');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(initialData?.riskLevel ?? 'high');
  const [riskCategories, setRiskCategories] = useState<RiskCategory[]>(
    initialData?.riskCategories ?? ['user_reported']
  );
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const toggleRiskCategory = (cat: RiskCategory) => {
    if (riskCategories.includes(cat)) {
      setRiskCategories(riskCategories.filter(c => c !== cat));
    } else {
      setRiskCategories([...riskCategories, cat]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDomain = normalizeDomain(domainInput);

    if (!cleanDomain) {
      setValidationError('Please enter a valid website domain.');
      return;
    }

    if (!isValidOriginForRecovery(`https://${cleanDomain}`)) {
      setValidationError('Invalid domain format or disallowed origin.');
      return;
    }

    if (!displayName.trim()) {
      setValidationError('Display name is required.');
      return;
    }

    if (riskCategories.length === 0) {
      setValidationError('Please select at least one risk category.');
      return;
    }

    onSave({
      displayName: displayName.trim(),
      domain: cleanDomain,
      usernameHint: usernameHint.trim() || undefined,
      importance,
      riskLevel,
      riskCategories,
      source: 'manual',
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '16px',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600 }}>
            {initialData ? 'Edit Account' : 'Add At-Risk Account'}
          </h3>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '4px', borderRadius: '50%' }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {validationError && (
          <div className="notice-banner notice-warning" style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 12px' }}>
            <AlertCircle size={16} />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Service / Website Name
            </label>
            <input
              type="text"
              placeholder="e.g. GitHub, Google, Netflix"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Website Domain
            </label>
            <input
              type="text"
              placeholder="e.g. github.com, google.com"
              value={domainInput}
              onChange={e => setDomainInput(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Username or Email Hint (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. j***@gmail.com or alex99"
              value={usernameHint}
              onChange={e => setUsernameHint(e.target.value)}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Hint for your reference. Never enter a password here.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Account Importance
              </label>
              <select
                value={importance}
                onChange={e => setImportance(e.target.value as ImportanceCategory)}
              >
                <option value="email">Primary Email</option>
                <option value="identity">Identity / Gov</option>
                <option value="financial">Financial / Bank</option>
                <option value="work">Work / Dev</option>
                <option value="social">Social Media</option>
                <option value="shopping">Shopping</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Assessed Risk Level
              </label>
              <select
                value={riskLevel}
                onChange={e => setRiskLevel(e.target.value as RiskLevel)}
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Risk Findings
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={riskCategories.includes('breached')}
                  onChange={() => toggleRiskCategory('breached')}
                />
                Breached Data
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={riskCategories.includes('reused')}
                  onChange={() => toggleRiskCategory('reused')}
                />
                Reused Password
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={riskCategories.includes('weak')}
                  onChange={() => toggleRiskCategory('weak')}
                />
                Weak Password
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={riskCategories.includes('user_reported')}
                  onChange={() => toggleRiskCategory('user_reported')}
                />
                User Flagged
              </label>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Notes (Non-secret)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Flagged in Chrome password checkup"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {initialData ? 'Save Changes' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
