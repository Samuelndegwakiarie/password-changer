import React, { useState } from 'react';
import type { UserSettings } from '@recoverly/shared-types';
import { Shield, Lock, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: (settings: Partial<UserSettings>) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [breachConsent, setBreachConsent] = useState(false);
  const [telemetryConsent, setTelemetryConsent] = useState(false);

  return (
    <div style={{ padding: '24px', maxWidth: '520px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', padding: '12px', background: 'var(--accent-primary)', borderRadius: '50%', color: '#fff', marginBottom: '12px' }}>
          <Shield size={32} />
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Welcome to Recoverly</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
          From at-risk to recovered, one account at a time.
        </p>
      </div>

      {step === 1 && (
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>How Recoverly Protects You</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <CheckCircle size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Local-First & Private:</strong> Generated passwords and account metadata remain on your device. We never store or transmit your passwords.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <CheckCircle size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>User In Control:</strong> You approve every password fill, and you submit every password form yourself.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <AlertTriangle size={18} color="#ea580c" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Important Platform Boundary:</strong> Google does not provide a public API for extensions to directly view or edit Google Password Manager's vault. Recoverly guides you to let Chrome or your vault save the change natively.
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-primary" onClick={() => setStep(2)}>
              Next: Permissions <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Minimal Permissions</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Recoverly uses the principle of least privilege. We do not request broad browsing access:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', marginBottom: '20px' }}>
            <div style={{ background: 'var(--bg-elevated)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
              <strong>storage:</strong> Stores your account list and recovery progress locally on your computer.
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
              <strong>activeTab & scripting:</strong> Allows Recoverly to assist with password fields only on the specific tab you are actively remediating.
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
              <strong>sidePanel:</strong> Displays the step-by-step assistant beside your web page.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button className="btn-primary" onClick={() => setStep(3)}>
              Next: Privacy Choices <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Privacy & Optional Checks</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            You can use Recoverly completely offline without an account. Choose whether to enable optional privacy-preserving network features:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px', fontSize: '13px' }}>
            <label style={{ display: 'flex', gap: '10px', cursor: 'pointer', alignItems: 'flex-start' }}>
              <input
                type="checkbox"
                checked={breachConsent}
                onChange={e => setBreachConsent(e.target.checked)}
                style={{ width: 'auto', marginTop: '3px' }}
              />
              <div>
                <strong>Optional Have I Been Pwned Check:</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                  Uses k-anonymity. Only the first 5 characters of a local SHA-1 hash are sent. Full hashes and passwords are never transmitted.
                </p>
              </div>
            </label>

            <label style={{ display: 'flex', gap: '10px', cursor: 'pointer', alignItems: 'flex-start' }}>
              <input
                type="checkbox"
                checked={telemetryConsent}
                onChange={e => setTelemetryConsent(e.target.checked)}
                style={{ width: 'auto', marginTop: '3px' }}
              />
              <div>
                <strong>Anonymous Diagnostic Metrics:</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                  Sends coarse success/failure error codes to help fix broken site adapters. Zero personal data or URLs.
                </p>
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
            <button
              className="btn-primary"
              onClick={() => {
                onComplete({
                  onboardingCompleted: true,
                  breachCheckConsent: breachConsent,
                  telemetryConsent: telemetryConsent,
                });
              }}
            >
              Get Started <Lock size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
