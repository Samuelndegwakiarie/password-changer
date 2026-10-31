import { describe, it, expect, beforeEach } from 'vitest';
import { storage, INITIAL_STATE } from '../src/storage/chrome-storage';
import type { AccountRecord, RecoverlyStorageState } from '@recoverly/shared-types';

describe('Storage & Secret Protection Security Controls', () => {
  beforeEach(async () => {
    await storage.purgeAll();
  });

  it('successfully stores and retrieves clean account metadata', async () => {
    const acc: AccountRecord = {
      id: 'acc-1234',
      domain: 'example.com',
      displayName: 'Example Service',
      usernameHint: 'user@example.test',
      riskCategories: ['breached'],
      riskLevel: 'high',
      importance: 'work',
      source: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await storage.saveAccount(acc);
    const state = await storage.getState();
    expect(state.accounts['acc-1234']?.displayName).toBe('Example Service');
  });

  it('throws a critical security error if password field is passed in state', async () => {
    const maliciousState = {
      ...INITIAL_STATE,
      prohibitedData: {
        password: 'PlainTextPassword123!',
      },
    };

    await expect(storage.setState(maliciousState as unknown as RecoverlyStorageState)).rejects.toThrow(
      /CRITICAL SECURITY VIOLATION/i
    );
  });

  it('throws if password_hash or secret or cookie is injected', async () => {
    const stateWithSecret = {
      ...INITIAL_STATE,
      vault: {
        password_hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      },
    };

    await expect(storage.setState(stateWithSecret as unknown as RecoverlyStorageState)).rejects.toThrow(
      /CRITICAL SECURITY VIOLATION/i
    );
  });

  it('exported JSON never contains passwords and conforms to sanitized schema', async () => {
    await storage.saveAccount({
      id: 'acc-safe',
      domain: 'github.com',
      displayName: 'GitHub',
      riskCategories: ['reused'],
      riskLevel: 'medium',
      importance: 'work',
      source: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const exported = await storage.exportData();
    const parsed = JSON.parse(exported);

    expect(parsed.accounts).toHaveLength(1);
    expect(exported.toLowerCase()).not.toContain('"password"');
    expect(exported.toLowerCase()).not.toContain('"password_hash"');
    expect(exported.toLowerCase()).not.toContain('"cookie"');
  });

  it('purgeAll clears all local accounts, recoveries, and activities', async () => {
    await storage.saveAccount({
      id: 'acc-to-delete',
      domain: 'test.com',
      displayName: 'Test',
      riskCategories: ['weak'],
      riskLevel: 'low',
      importance: 'other',
      source: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    let state = await storage.getState();
    expect(Object.keys(state.accounts)).toHaveLength(1);

    await storage.purgeAll();
    state = await storage.getState();
    expect(Object.keys(state.accounts)).toHaveLength(0);
    expect(state.activities).toHaveLength(0);
  });
});
