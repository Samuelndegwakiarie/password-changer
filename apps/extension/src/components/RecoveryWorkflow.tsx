import React, { useState, useEffect } from 'react';
import type {
  AccountRecord,
  RecoveryRecord,
  RecoveryStatus,
} from '@recoverly/shared-types';
import {
  generatePassword,
  estimatePasswordStrength,
  checkPasswordBreach,
} from '@recoverly/password-core';
import { defaultAdapterRegistry } from '@recoverly/adapter-contracts';
import {
  Shield,
  Key,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  ArrowRight,
  XCircle,
  HelpCircle,
} from 'lucide-react';

interface RecoveryWorkflowProps {
  account: AccountRecord;
  recovery: RecoveryRecord;
  onTransition: (nextStatus: RecoveryStatus, metadata?: Record<string, unknown>) => Promise<RecoveryRecord>;
  onCancel: () => void;
  onConfirmStorage: (confirmed: boolean) => Promise<void>;
  breachConsent: boolean;
}

export const RecoveryWorkflow: React.FC<RecoveryWorkflowProps> = ({
  account,
  recovery,
  onTransition,
  onCancel,
  onConfirmStorage,
  breachConsent,
}) => {
  // Ephemeral in-memory state: cleared on unmount/cancel
  const [generatedPw, setGeneratedPw] = useState<string>('');
  const [revealPw, setRevealPw] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [pwLength, setPwLength] = useState<number>(20);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [avoidAmbiguous, setAvoidAmbiguous] = useState<boolean>(false);
  const [breachResult, setBreachResult] = useState<string | null>(null);
  const [checkingBreach, setCheckingBreach] = useState<boolean>(false);
  const [fillStatusMessage, setFillStatusMessage] = useState<string | null>(null);
  const [showManualInstructions, setShowManualInstructions] = useState<boolean>(false);

  // Adapter information
  const adapter = defaultAdapterRegistry.findAdapterForUrl(`https://${account.domain}`);
  const manualSteps = adapter.getManualInstructions();

  // Generate initial password when entering generator step
  const handleGenerate = () => {
    const pw = generatePassword({
      length: pwLength,
      symbols: includeSymbols,
      avoidAmbiguous,
    });
    setGeneratedPw(pw);
    setBreachResult(null);

    // If user consented to breach checking, do k-anonymity check
    if (breachConsent) {
      setCheckingBreach(true);
      checkPasswordBreach(pw, true)
        .then(res => {
          setBreachResult(res.breached ? `⚠️ Found in known breach: ${res.count} times` : '✓ Not in known breach databases');
        })
        .catch(err => {
          setBreachResult(`Could not verify breach status: ${err.message}`);
        })
        .finally(() => setCheckingBreach(false));
    }
  };

  useEffect(() => {
    if (recovery.status === 'ready_to_generate' || recovery.status === 'password_generated') {
      if (!generatedPw) {
        handleGenerate();
      }
    }
  }, [recovery.status]);

  // Clean up ephemeral password on unmount
  useEffect(() => {
    return () => {
      setGeneratedPw('');
    };
  }, []);

  const strength = estimatePasswordStrength(generatedPw);

  const handleCopy = () => {
    if (!generatedPw) return;
    navigator.clipboard.writeText(generatedPw).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleApproveFill = async () => {
    if (!generatedPw) return;
    setFillStatusMessage('Sending approved password to active tab...');

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, async tabs => {
        const activeTab = tabs[0];
        if (activeTab?.id) {
          chrome.tabs.sendMessage(
            activeTab.id,
            { type: 'FILL_DOM_FIELDS', password: generatedPw },
            res => {
              if (chrome.runtime.lastError || !res?.success) {
                setFillStatusMessage('Could not automatically fill fields on this page. Please copy and paste manually.');
                setShowManualInstructions(true);
              } else {
                setFillStatusMessage('Fields filled successfully! Now submit the form yourself.');
              }
            }
          );
        }
      });
    } else {
      setFillStatusMessage('Password ready. Copy and paste into the form.');
    }

    await onTransition('fields_filled');
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Target summary banner */}
      <div className="card" style={{ background: 'var(--bg-secondary)', borderLeft: '4px solid var(--accent-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              Active Recovery
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: 700 }}>{account.displayName}</h2>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Target Domain: <strong>{account.domain}</strong>
            </div>
          </div>
          <button className="btn-secondary" onClick={onCancel} style={{ fontSize: '12px', padding: '4px 8px' }}>
            <XCircle size={14} /> Cancel
          </button>
        </div>
      </div>

      {/* STEP 1: Destination and Auth */}
      {(recovery.status === 'destination_found' || recovery.status === 'waiting_for_user_auth') && (
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>Step 1: Sign In & Authentication</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Recoverly opened <strong>{account.domain}</strong> in your browser.
          </p>

          <div className="notice-banner notice-warning">
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Action Required by You:</strong>
              <p style={{ marginTop: '2px' }}>
                Complete your account sign-in and any Two-Factor Authentication (2FA), SMS, or CAPTCHA challenges on the website. Recoverly will never attempt to bypass your security verification.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Once you see the "Change Password" form on the web page, click below:
            </p>
            <button
              className="btn-primary"
              onClick={async () => {
                await onTransition('ready_to_generate');
                handleGenerate();
              }}
            >
              I am on the Password Change Form <ArrowRight size={16} />
            </button>

            <button
              className="btn-secondary"
              onClick={() => setShowManualInstructions(!showManualInstructions)}
              style={{ fontSize: '12px' }}
            >
              <HelpCircle size={14} /> {showManualInstructions ? 'Hide Instructions' : 'View Step-by-Step Guide'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Password Generation & User Approval */}
      {(recovery.status === 'ready_to_generate' ||
        recovery.status === 'password_generated' ||
        recovery.status === 'fields_filled') && (
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>Step 2: Generate & Approve Password</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            A unique cryptographic password has been generated locally in memory.
          </p>

          {/* Generated Password Box */}
          <div
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '15px',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  overflowX: 'auto',
                  whiteSpace: 'nowrap',
                }}
              >
                {revealPw ? generatedPw : '•'.repeat(generatedPw.length || 20)}
              </div>
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setRevealPw(!revealPw)}
                  style={{ padding: '4px 6px' }}
                  title={revealPw ? 'Hide password' : 'Show password'}
                >
                  {revealPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCopy}
                  style={{ padding: '4px 6px' }}
                  title="Copy password"
                >
                  <Copy size={14} />
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleGenerate}
                  style={{ padding: '4px 6px' }}
                  title="Regenerate"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {copied && (
              <div style={{ fontSize: '11px', color: 'var(--status-success-text)', marginTop: '4px' }}>
                ✓ Copied to clipboard! (Remember not to leave it in public clipboards)
              </div>
            )}

            {/* Strength meter */}
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>Advisory Strength: <strong>{strength.label}</strong></span>
                <span>Entropy: ~{strength.entropyBits} bits</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {strength.advisory}
              </div>
              {checkingBreach && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Checking k-anonymity breach database...
                </div>
              )}
              {breachResult && (
                <div style={{ fontSize: '11px', marginTop: '4px', color: breachResult.includes('⚠️') ? 'var(--risk-critical-text)' : 'var(--status-success-text)' }}>
                  {breachResult}
                </div>
              )}
            </div>
          </div>

          {/* Generator Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label>Password Length: <strong>{pwLength}</strong></label>
              <input
                type="range"
                min="16"
                max="64"
                value={pwLength}
                onChange={e => {
                  setPwLength(parseInt(e.target.value, 10));
                }}
                style={{ width: '140px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={includeSymbols}
                  onChange={e => setIncludeSymbols(e.target.checked)}
                />
                Symbols (!@#$)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={avoidAmbiguous}
                  onChange={e => setAvoidAmbiguous(e.target.checked)}
                />
                Avoid Ambiguous (O, 0, l, 1)
              </label>
            </div>
          </div>

          {fillStatusMessage && (
            <div className="notice-banner notice-info" style={{ fontSize: '12px', padding: '8px 12px' }}>
              {fillStatusMessage}
            </div>
          )}

          {/* User Approval Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="btn-primary" onClick={handleApproveFill}>
              <Key size={15} /> Fill Password Fields (User Approval Required)
            </button>

            <button
              className="btn-secondary"
              onClick={async () => {
                await onTransition('awaiting_user_submission');
              }}
              style={{ fontSize: '13px' }}
            >
              Fields Are Filled → Ready to Submit <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: User Submission on the Website */}
      {(recovery.status === 'awaiting_user_submission' || recovery.status === 'website_change_confirmed') && (
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>Step 3: Submit Form on Website</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            For maximum security, Recoverly will <strong>never</strong> click the final "Save" or "Update Password" button automatically.
          </p>

          <div className="notice-banner notice-warning">
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Please click the Submit/Save button on {account.domain} now.</strong>
              <p style={{ marginTop: '2px' }}>
                If current password is required by the website, fill your existing password first.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
            <button
              className="btn-primary"
              onClick={async () => {
                await onTransition('website_change_confirmed', { websiteChangeEvidence: 'user_confirmed' });
                await onTransition('storage_pending');
              }}
            >
              <CheckCircle size={15} /> Website Accepted New Password
            </button>

            <button
              className="btn-secondary"
              onClick={() => {
                onTransition('manual_action_required', { failureMessage: 'Form submission encountered an issue' });
              }}
              style={{ fontSize: '12px', color: '#dc2626' }}
            >
              Website Rejected / Form Error
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Password Manager Storage Confirmation */}
      {recovery.status === 'storage_pending' && (
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>Step 4: Password Manager Save Check</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Chrome or your third-party password manager typically displays a native popup asking: <em>"Update password for {account.domain}?"</em>
          </p>

          <div className="notice-banner notice-info">
            <Shield size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Independent Confirmation:</strong>
              <p style={{ marginTop: '2px' }}>
                Extensions cannot directly inspect or confirm your private password vault. Please verify that your password manager successfully saved the new password.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
            <button
              className="btn-primary"
              onClick={() => onConfirmStorage(true)}
              style={{ background: '#16a34a' }}
            >
              <CheckCircle size={15} /> Yes, Password Manager Saved It
            </button>

            <button
              className="btn-secondary"
              onClick={() => onConfirmStorage(false)}
            >
              Save Prompt Did Not Appear / Saved Manually
            </button>
          </div>
        </div>
      )}

      {/* Manual Instructions Accordion */}
      {showManualInstructions && (
        <div className="card" style={{ background: 'var(--bg-elevated)', fontSize: '13px' }}>
          <h4 style={{ fontWeight: 600, marginBottom: '8px' }}>Manual Remediation Guide for {account.domain}</h4>
          <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {manualSteps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};
