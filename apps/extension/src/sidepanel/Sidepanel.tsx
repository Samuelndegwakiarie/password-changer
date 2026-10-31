import React, { useState } from 'react';
import { useRecoverlyState } from '../hooks/useRecoverlyState';
import { Onboarding } from '../components/Onboarding';
import { Dashboard } from '../components/Dashboard';
import { AccountList } from '../components/AccountList';
import { AddAccountModal } from '../components/AddAccountModal';
import { RecoveryWorkflow } from '../components/RecoveryWorkflow';
import { SettingsView } from '../components/SettingsView';
import { ActivityView } from '../components/ActivityView';
import type { AccountRecord } from '@recoverly/shared-types';
import { Shield, ShieldAlert, List, History, Settings as SettingsIcon } from 'lucide-react';

export const Sidepanel: React.FC = () => {
  const {
    state,
    loading,
    error,
    addAccount,
    updateAccount,
    deleteAccount,
    startRecovery,
    transitionRecoveryState,
    cancelRecovery,
    confirmStorage,
    updateSettings,
    purgeAllData,
    activeRecovery,
  } = useRecoverlyState();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'activity' | 'settings'>('dashboard');
  const [modalMode, setModalMode] = useState<'none' | 'add' | 'edit'>('none');
  const [editingAccount, setEditingAccount] = useState<AccountRecord | undefined>(undefined);

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Recoverly...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--risk-critical-text)' }}>
        Error loading state: {error}
      </div>
    );
  }

  // Show onboarding if not yet completed
  if (!state.settings.onboardingCompleted) {
    return (
      <Onboarding
        onComplete={async newSettings => {
          await updateSettings(newSettings);
        }}
      />
    );
  }

  // If there is an active recovery in progress, display the workflow
  if (activeRecovery) {
    const targetAccount = state.accounts[activeRecovery.accountId];
    if (targetAccount) {
      return (
        <RecoveryWorkflow
          account={targetAccount}
          recovery={activeRecovery}
          onTransition={(next, meta) => transitionRecoveryState(activeRecovery.id, next, meta)}
          onCancel={() => cancelRecovery(activeRecovery.id)}
          onConfirmStorage={confirmed => confirmStorage(activeRecovery.id, confirmed)}
          breachConsent={state.settings.breachCheckConsent}
        />
      );
    }
  }

  const accountsList = Object.values(state.accounts);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Header */}
      <header className="header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ padding: '6px', background: 'var(--accent-primary)', borderRadius: '6px', color: '#fff', display: 'flex' }}>
            <Shield size={18} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '15px' }}>Recoverly</span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: '9999px' }}>
          Local-First
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <button
          className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <ShieldAlert size={14} /> Overview
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'accounts' ? 'active' : ''}`}
          onClick={() => setActiveTab('accounts')}
        >
          <List size={14} /> Accounts ({accountsList.length})
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <History size={14} /> Activity
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <SettingsIcon size={14} /> Settings
        </button>
      </nav>

      {/* Main View Area */}
      <main style={{ flex: 1 }}>
        {activeTab === 'dashboard' && (
          <Dashboard
            accounts={accountsList}
            recoveries={state.recoveries}
            onStartRecovery={startRecovery}
            onAddAccount={() => setModalMode('add')}
            onViewAccounts={() => setActiveTab('accounts')}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountList
            accounts={accountsList}
            recoveries={state.recoveries}
            onStartRecovery={startRecovery}
            onAddNew={() => setModalMode('add')}
            onEditAccount={acc => {
              setEditingAccount(acc);
              setModalMode('edit');
            }}
            onDeleteAccount={deleteAccount}
          />
        )}

        {activeTab === 'activity' && <ActivityView activities={state.activities} />}

        {activeTab === 'settings' && (
          <SettingsView
            settings={state.settings}
            onUpdateSettings={updateSettings}
            onExportData={async () => {
              const res = await chrome.runtime.sendMessage({ type: 'EXPORT_DATA' });
              return res.data;
            }}
            onPurgeAll={purgeAllData}
          />
        )}
      </main>

      {/* Modal for Add / Edit Account */}
      {modalMode !== 'none' && (
        <AddAccountModal
          initialData={modalMode === 'edit' ? editingAccount : undefined}
          onClose={() => {
            setModalMode('none');
            setEditingAccount(undefined);
          }}
          onSave={async acc => {
            if (modalMode === 'edit' && editingAccount) {
              await updateAccount(editingAccount.id, acc);
            } else {
              await addAccount(acc);
            }
            setModalMode('none');
            setEditingAccount(undefined);
          }}
        />
      )}
    </div>
  );
};
