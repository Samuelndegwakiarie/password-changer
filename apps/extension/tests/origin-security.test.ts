import { describe, it, expect } from 'vitest';
import {
  normalizeDomain,
  isValidOriginForRecovery,
  isSameOrSubdomain,
  defaultAdapterRegistry,
} from '@recoverly/adapter-contracts';

describe('Origin Security & Phishing Prevention', () => {
  it('blocks non-HTTPS destinations except local testing environments', () => {
    expect(isValidOriginForRecovery('http://bank.example.com')).toBe(false);
    expect(isValidOriginForRecovery('http://paypal.com/security')).toBe(false);
    expect(isValidOriginForRecovery('https://paypal.com/security')).toBe(true);
    expect(isValidOriginForRecovery('http://localhost:3000')).toBe(true);
    expect(isValidOriginForRecovery('http://127.0.0.1:8080')).toBe(true);
  });

  it('rejects credential embedded in URL spoofing', () => {
    // Attack vector: https://google.com:evil@attacker.com
    expect(isValidOriginForRecovery('https://admin:pass@attacker.com')).toBe(false);
    expect(isValidOriginForRecovery('https://google.com@attacker.com')).toBe(false);
  });

  it('strictly validates registrable domains and rejects lookalikes', () => {
    expect(isSameOrSubdomain('github.com', 'github.com')).toBe(true);
    expect(isSameOrSubdomain('gist.github.com', 'github.com')).toBe(true);
    expect(isSameOrSubdomain('auth.github.com', 'github.com')).toBe(true);

    // Lookalike attacks
    expect(isSameOrSubdomain('github.com.attacker.com', 'github.com')).toBe(false);
    expect(isSameOrSubdomain('fake-github.com', 'github.com')).toBe(false);
    expect(isSameOrSubdomain('githvb.com', 'github.com')).toBe(false);
    expect(isSameOrSubdomain('google.com.security-update.net', 'google.com')).toBe(false);
  });

  it('normalizes complex URL strings correctly without path or query confusion', () => {
    expect(normalizeDomain('https://ACCOUNT.GOOGLE.COM/settings?foo=bar#hash')).toBe('account.google.com');
    expect(normalizeDomain('https://github.com:443/settings')).toBe('github.com');
  });

  it('does not route lookalike domain to trusted adapter', () => {
    const maliciousUrl = 'https://fake-github.com/settings/security';
    const adapter = defaultAdapterRegistry.findAdapterForUrl(maliciousUrl);
    // Must NOT be the specialized GitHub adapter!
    expect(adapter.id).not.toBe('github');
    expect(adapter.id).toBe('well-known-change-password');
  });
});
