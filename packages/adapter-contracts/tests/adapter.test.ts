import { describe, it, expect } from 'vitest';
import { normalizeDomain, isValidOriginForRecovery, isSameOrSubdomain } from '../src/url-validator';
import { AdapterRegistry } from '../src/registry';
import { WellKnownChangePasswordAdapter } from '../src/builtins/well-known';
import { GitHubChangePasswordAdapter } from '../src/builtins/github';
import { GoogleAccountChangePasswordAdapter } from '../src/builtins/google';
import { MockSiteChangePasswordAdapter } from '../src/builtins/standard-mock';

describe('URL & Origin Validator', () => {
  it('normalizes domains properly', () => {
    expect(normalizeDomain('https://GitHub.com/settings')).toBe('github.com');
    expect(normalizeDomain('http://sub.domain.com:8080/path')).toBe('sub.domain.com');
    expect(normalizeDomain('  MYACCOUNT.GOOGLE.COM ')).toBe('myaccount.google.com');
  });

  it('enforces HTTPS except for localhost / 127.0.0.1', () => {
    expect(isValidOriginForRecovery('https://github.com/login')).toBe(true);
    expect(isValidOriginForRecovery('http://github.com/login')).toBe(false); // HTTP rejected
    expect(isValidOriginForRecovery('http://localhost:3000/test')).toBe(true); // localhost allowed
    expect(isValidOriginForRecovery('http://127.0.0.1:8080/test')).toBe(true); // 127.0.0.1 allowed
  });

  it('rejects credential embedding in URL spoofing', () => {
    expect(isValidOriginForRecovery('https://user:pass@github.com')).toBe(false);
  });

  it('checks subdomain matching accurately', () => {
    expect(isSameOrSubdomain('settings.github.com', 'github.com')).toBe(true);
    expect(isSameOrSubdomain('github.com', 'github.com')).toBe(true);
    expect(isSameOrSubdomain('notgithub.com', 'github.com')).toBe(false);
    expect(isSameOrSubdomain('fake-github.com', 'github.com')).toBe(false);
  });
});

describe('Adapter Registry', () => {
  const registry = new AdapterRegistry();

  it('finds GitHub adapter for github.com URLs', () => {
    const adapter = registry.findAdapterForUrl('https://github.com/settings/security');
    expect(adapter).toBeInstanceOf(GitHubChangePasswordAdapter);
    expect(adapter.id).toBe('github');
  });

  it('finds Google adapter for myaccount.google.com', () => {
    const adapter = registry.findAdapterForUrl('https://myaccount.google.com/signinoptions/password');
    expect(adapter).toBeInstanceOf(GoogleAccountChangePasswordAdapter);
    expect(adapter.id).toBe('google');
  });

  it('finds MockSite adapter for localhost', () => {
    const adapter = registry.findAdapterForUrl('http://localhost:3000/change-password');
    expect(adapter).toBeInstanceOf(MockSiteChangePasswordAdapter);
  });

  it('falls back to WellKnownChangePasswordAdapter for other domains', () => {
    const adapter = registry.findAdapterForUrl('https://example.com/account');
    expect(adapter).toBeInstanceOf(WellKnownChangePasswordAdapter);
    expect(adapter.id).toBe('well-known-change-password');
  });

  it('generates well-known change password URL according to RFC 8615', () => {
    const wellKnown = new WellKnownChangePasswordAdapter();
    const url = wellKnown.getChangePasswordUrl('https://example.com/settings');
    expect(url?.toString()).toBe('https://example.com/.well-known/change-password');
  });
});
