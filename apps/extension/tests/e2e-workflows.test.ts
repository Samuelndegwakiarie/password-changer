import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../src/storage/chrome-storage';
import { transitionRecovery } from '../src/domain/state-machine';
import { generatePassword, estimatePasswordStrength, EphemeralSecretHolder } from '@recoverly/password-core';
import { defaultAdapterRegistry } from '@recoverly/adapter-contracts';
import type { AccountRecord, RecoveryRecord } from '@recoverly/shared-types';

describe('E2E Remediation Workflows & Invariant Testing', () => {
  beforeEach(async () => {
    await storage.purgeAll();
  });

  it('completes onboarding without requiring a third-party or Recoverly account', async () => {
    let state = await storage.getState();
    expect(state.settings.onboardingCompleted).toBe(false);

    await storage.updateSettings({
      onboardingCompleted: true,
      breachCheckConsent: false,
      telemetryConsent: false,
    });

    state = await storage.getState();
    expect(state.settings.onboardingCompleted).toBe(true);
    expect(state.settings.breachCheckConsent).toBe(false);
  });

  it('executes full guided remediation workflow from risk discovery to completed storage', async () => {
    // 1. User adds at-risk account
    const account: AccountRecord = {
      id: crypto.randomUUID(),
      domain: 'github.com',
      displayName: 'GitHub Work Account',
      usernameHint: 'coder-bob',
      riskCategories: ['breached', 'reused'],
      riskLevel: 'critical',
      importance: 'work',
      source: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await storage.saveAccount(account);

    // 2. Discover destination using adapter
    const adapter = defaultAdapterRegistry.findAdapterForUrl(`https://${account.domain}`);
    expect(adapter.id).toBe('github');
    const destinationUrl = adapter.getChangePasswordUrl(`https://${account.domain}`);
    expect(destinationUrl?.toString()).toBe('https://github.com/settings/security');

    // 3. Initiate recovery
    const recovery: RecoveryRecord = {
      id: crypto.randomUUID(),
      accountId: account.id,
      status: 'destination_found',
      destinationUrl: destinationUrl?.toString(),
      adapterId: adapter.id,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await storage.saveRecovery(recovery);

    // 4. User completes MFA and arrives at password change form
    let currentRec = transitionRecovery(recovery, 'waiting_for_user_auth');
    currentRec = transitionRecovery(currentRec, 'ready_to_generate');
    expect(currentRec.status).toBe('ready_to_generate');

    // 5. Generate secure password locally in ephemeral holder
    const secretHolder = new EphemeralSecretHolder();
    const newPassword = generatePassword({ length: 22, symbols: true });
    secretHolder.setSecret(newPassword);

    expect(secretHolder.hasSecret()).toBe(true);
    expect(estimatePasswordStrength(newPassword).score).toBe(4);

    currentRec = transitionRecovery(currentRec, 'password_generated');
    expect(currentRec.status).toBe('password_generated');

    // Invariant: Cannot jump from password_generated to completed
    expect(() => transitionRecovery(currentRec, 'completed')).toThrow();

    // 6. User approves filling
    currentRec = transitionRecovery(currentRec, 'fields_filled');
    expect(currentRec.status).toBe('fields_filled');

    // 7. Awaiting user submission (User submits the form on the website themselves)
    currentRec = transitionRecovery(currentRec, 'awaiting_user_submission');
    expect(currentRec.status).toBe('awaiting_user_submission');

    // 8. Website accepts password change
    currentRec = transitionRecovery(currentRec, 'website_change_confirmed', {
      websiteChangeEvidence: 'user_confirmed',
    });
    expect(currentRec.status).toBe('website_change_confirmed');

    // 9. Independent check: Password manager save confirmation
    currentRec = transitionRecovery(currentRec, 'storage_pending');
    expect(currentRec.status).toBe('storage_pending');

    // User confirms Chrome/vault saved the new password
    currentRec = transitionRecovery(currentRec, 'storage_user_confirmed', {
      storageEvidence: 'user_confirmed',
    });
    currentRec = transitionRecovery(currentRec, 'completed');
    expect(currentRec.status).toBe('completed');
    expect(currentRec.storageEvidence).toBe('user_confirmed');

    // 10. Ephemeral secret must be wiped on completion
    secretHolder.clear();
    expect(secretHolder.hasSecret()).toBe(false);

    // Persist final recovery record and log activity
    await storage.saveRecovery(currentRec);
    await storage.addActivity({
      id: crypto.randomUUID(),
      accountId: account.id,
      domain: account.domain,
      status: currentRec.status,
      timestamp: new Date().toISOString(),
      adapterId: adapter.id,
      evidenceType: 'user_confirmed',
      details: 'Remediation completed and password storage confirmed by user.',
    });

    // 11. Security Audit: Check entire storage state to ensure ZERO passwords were saved
    const state = await storage.getState();
    const rawStorage = JSON.stringify(state);
    expect(rawStorage).not.toContain(newPassword);
    expect(rawStorage.toLowerCase()).not.toContain('"password"');
    expect(rawStorage.toLowerCase()).not.toContain('"password_hash"');
  });

  it('handles user cancellation safely and wipes secrets immediately', async () => {
    const account: AccountRecord = {
      id: 'acc-cancel-test',
      domain: 'dropbox.com',
      displayName: 'Dropbox',
      riskCategories: ['weak'],
      riskLevel: 'high',
      importance: 'work',
      source: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const recovery: RecoveryRecord = {
      id: 'rec-cancel-test',
      accountId: account.id,
      status: 'password_generated',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const secretHolder = new EphemeralSecretHolder();
    secretHolder.setSecret(generatePassword());
    expect(secretHolder.hasSecret()).toBe(true);

    // User clicks Cancel
    const cancelledRec = transitionRecovery(recovery, 'cancelled');
    secretHolder.clear();

    expect(cancelledRec.status).toBe('cancelled');
    expect(secretHolder.hasSecret()).toBe(false);
  });

  it('supports safe manual fallback on unautomated websites', async () => {
    const unknownDomain = 'custom-corp-intranet.net';
    const adapter = defaultAdapterRegistry.findAdapterForUrl(`https://${unknownDomain}`);
    // Falls back to well-known / manual instructions
    expect(adapter.id).toBe('well-known-change-password');
    const instructions = adapter.getManualInstructions();
    expect(instructions.length).toBeGreaterThan(0);
    expect(instructions.some(i => i.toLowerCase().includes('manual'))).toBe(true);
  });
});
