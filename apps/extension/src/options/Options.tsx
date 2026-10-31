import React from 'react';
import { useRecoverlyState } from '../hooks/useRecoverlyState';
import { SettingsView } from '../components/SettingsView';
import { Shield } from 'lucide-react';

export const Options: React.FC = () => {
  const { state, loading, updateSettings, purgeAllData } = useRecoverlyState();

  if (loading) {
    return <div style={{ padding: '32px', textAlign: 'center' }}>Loading Settings...</div>;
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{ padding: '8px', background: 'var(--accent-primary)', borderRadius: '8px', color: '#fff', display: 'flex' }}>
          <Shield size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Recoverly Settings</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Configure recovery defaults and manage your local data
          </p>
        </div>
      </div>

      <SettingsView
        settings={state.settings}
        onUpdateSettings={updateSettings}
        onExportData={async () => {
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            const res = await chrome.runtime.sendMessage({ type: 'EXPORT_DATA' });
            return res.data;
          }
          return JSON.stringify(state, null, 2);
        }}
        onPurgeAll={purgeAllData}
      />
    </div>
  );
};
