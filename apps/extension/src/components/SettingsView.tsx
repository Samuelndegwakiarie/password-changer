import React, { useState } from 'react';
import type { UserSettings } from '@recoverly/shared-types';
import { Download, Trash2, Shield, AlertTriangle, Check } from 'lucide-react';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
  onExportData: () => Promise<string>;
  onPurgeAll: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onExportData,
  onPurgeAll,
}) => {
  const [confirmPurge, setConfirmPurge] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);

  const handleExport = async () => {
    const data = await onExportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recoverly-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 3000);
  };

  const handleSaveDefaultLength = (length: number) => {
    onUpdateSettings({ defaultPasswordLength: length });
    setSavedSettingsNotice(true);
    setTimeout(() => setSavedSettingsNotice(false), 2000);
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Settings & Privacy</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Local-first security and data controls</p>
      </div>

      {savedSettingsNotice && (
        <div className="notice-banner notice-success" style={{ padding: '8px 12px', fontSize: '12px' }}>
          <Check size={14} /> Settings updated successfully!
        </div>
      )}

      {/* Password Generator Defaults */}
      <div className="card">
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>Password Generator Defaults</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label>Default Length: <strong>{settings.defaultPasswordLength}</strong></label>
            <input
              type="range"
              min="16"
              max="64"
              value={settings.defaultPasswordLength}
              onChange={e => handleSaveDefaultLength(parseInt(e.target.value, 10))}
              style={{ width: '140px' }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              style={{ width: 'auto' }}
              checked={settings.avoidAmbiguous}
              onChange={e => onUpdateSettings({ avoidAmbiguous: e.target.checked })}
            />
            Avoid ambiguous characters by default (e.g. O, 0, l, 1, |)
          </label>
        </div>
      </div>

      {/* Network & Privacy Controls */}
      <div className="card">
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>Network & Privacy Toggles</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
          <label style={{ display: 'flex', gap: '8px', cursor: 'pointer', alignItems: 'flex-start' }}>
            <input
              type="checkbox"
              style={{ width: 'auto', marginTop: '3px' }}
              checked={settings.breachCheckConsent}
              onChange={e => onUpdateSettings({ breachCheckConsent: e.target.checked })}
            />
            <div>
              <strong>Have I Been Pwned Range Check</strong>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                Sends only the first 5 characters of a SHA-1 hash to HIBP. Your password or full hash never leaves your device.
              </p>
            </div>
          </label>

          <label style={{ display: 'flex', gap: '8px', cursor: 'pointer', alignItems: 'flex-start' }}>
            <input
              type="checkbox"
              style={{ width: 'auto', marginTop: '3px' }}
              checked={settings.telemetryConsent}
              onChange={e => onUpdateSettings({ telemetryConsent: e.target.checked })}
            />
            <div>
              <strong>Privacy-Preserving Diagnostics</strong>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                Allows anonymous error codes to be sent when a website layout breaks an adapter. Zero URLs or credentials.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Data Management */}
      <div className="card">
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>Data Management</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Your data is stored strictly in your browser's local extension storage.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button className="btn-secondary" onClick={handleExport} style={{ justifyContent: 'flex-start' }}>
            <Download size={15} /> Export Metadata & History (JSON)
          </button>
          {copiedExport && (
            <span style={{ fontSize: '11px', color: 'var(--status-success-text)' }}>
              ✓ Export downloaded! (Contains zero passwords)
            </span>
          )}

          {!confirmPurge ? (
            <button
              className="btn-secondary"
              onClick={() => setConfirmPurge(true)}
              style={{ justifyContent: 'flex-start', color: '#ef4444' }}
            >
              <Trash2 size={15} /> Erase All Local Data...
            </button>
          ) : (
            <div style={{ background: '#fef2f2', border: '1px solid #f87171', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: '#991b1b', fontSize: '13px', fontWeight: 600 }}>
                <AlertTriangle size={16} /> Are you absolutely sure?
              </div>
              <p style={{ fontSize: '12px', color: '#7f1d1d', margin: '4px 0 10px 0' }}>
                This permanently erases all accounts, settings, and recovery logs from Recoverly.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-secondary" onClick={() => setConfirmPurge(false)} style={{ fontSize: '12px', padding: '4px 8px' }}>
                  Cancel
                </button>
                <button
                  className="btn-danger"
                  onClick={async () => {
                    await onPurgeAll();
                    setConfirmPurge(false);
                  }}
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                >
                  Yes, Erase Everything
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Security Boundary Notice */}
      <div className="card" style={{ background: 'var(--bg-secondary)', fontSize: '12px', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
          <Shield size={14} color="var(--accent-primary)" /> Platform Boundary Transparency
        </div>
        Recoverly deliberately does not access Google Password Manager's internal databases or Chrome internal pages. We never pretend an unverified API exists, and we never touch your password vault directly.
      </div>
    </div>
  );
};
