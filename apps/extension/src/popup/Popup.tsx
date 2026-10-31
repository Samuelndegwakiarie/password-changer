import React from 'react';
import { useRecoverlyState } from '../hooks/useRecoverlyState';
import { Shield, ShieldAlert, CheckCircle, Settings, ArrowRight } from 'lucide-react';

export const Popup: React.FC = () => {
  const { state, loading } = useRecoverlyState();

  const handleOpenSidePanel = async () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.sidePanel) {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab?.id) {
        chrome.sidePanel.open({ tabId: activeTab.id }).catch(() => {
          // If tabId isn't accepted, try windowId
          if (activeTab.windowId) {
            chrome.sidePanel.open({ windowId: activeTab.windowId });
          }
        });
      }
    } else {
      window.open('/sidepanel.html', '_blank');
    }
  };

  const handleOpenOptions = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('/options.html', '_blank');
    }
  };

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>;
  }

  const accounts = Object.values(state.accounts);
  const atRiskCount = accounts.filter(a => {
    const rec = Object.values(state.recoveries).find(r => r.accountId === a.id);
    return !rec || rec.status !== 'completed';
  }).length;

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ padding: '6px', background: 'var(--accent-primary)', borderRadius: '6px', color: '#fff', display: 'flex' }}>
            <Shield size={16} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '15px' }}>Recoverly</span>
        </div>
        <button
          className="btn-secondary"
          onClick={handleOpenOptions}
          style={{ padding: '4px', borderRadius: '50%' }}
          title="Settings"
        >
          <Settings size={15} />
        </button>
      </div>

      {/* Status card */}
      <div className="card" style={{ padding: '14px', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {atRiskCount > 0 ? (
            <div style={{ padding: '8px', background: 'var(--risk-critical-bg)', color: 'var(--risk-critical-text)', borderRadius: '50%' }}>
              <ShieldAlert size={20} />
            </div>
          ) : (
            <div style={{ padding: '8px', background: 'var(--status-success-bg)', color: 'var(--status-success-text)', borderRadius: '50%' }}>
              <CheckCircle size={20} />
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>
              {atRiskCount > 0 ? `${atRiskCount} Account(s) At Risk` : 'All Accounts Up to Date'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {atRiskCount > 0 ? 'Remediation pending' : 'No vulnerable passwords recorded'}
            </div>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <button className="btn-primary" onClick={handleOpenSidePanel} style={{ width: '100%', padding: '10px' }}>
        Open Guided Side Panel <ArrowRight size={16} />
      </button>

      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
        Zero passwords stored. All actions require your approval.
      </div>
    </div>
  );
};
