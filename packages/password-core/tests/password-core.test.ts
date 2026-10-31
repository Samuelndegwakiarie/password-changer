import { describe, it, expect, vi } from 'vitest';
import { generatePassword, getSecureRandomIndex } from '../src/generator';
import { estimatePasswordStrength } from '../src/strength';
import { checkPasswordBreach, computeSha1Hex } from '../src/breach';
import { EphemeralSecretHolder } from '../src/ephemeral';

describe('Password Generator', () => {
  it('generates passwords of default length 20', () => {
    const pw = generatePassword();
    expect(pw).toHaveLength(20);
  });

  it('respects custom length within bounds [16, 64]', () => {
    const short = generatePassword({ length: 10 }); // clamped to 16
    expect(short).toHaveLength(16);

    const long = generatePassword({ length: 80 }); // clamped to 64
    expect(long).toHaveLength(64);

    const custom = generatePassword({ length: 28 });
    expect(custom).toHaveLength(28);
  });

  it('contains characters from all required classes', () => {
    const pw = generatePassword({
      length: 24,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
    });
    expect(/[A-Z]/.test(pw)).toBe(true);
    expect(/[a-z]/.test(pw)).toBe(true);
    expect(/[0-9]/.test(pw)).toBe(true);
    expect(/[^A-Za-z0-9]/.test(pw)).toBe(true);
  });

  it('avoids ambiguous characters when requested', () => {
    for (let i = 0; i < 50; i++) {
      const pw = generatePassword({
        length: 32,
        avoidAmbiguous: true,
      });
      expect(/[IOl01|]/.test(pw)).toBe(false);
    }
  });

  it('does not produce modulo bias in getSecureRandomIndex', () => {
    const counts = new Array(5).fill(0);
    for (let i = 0; i < 5000; i++) {
      const idx = getSecureRandomIndex(5);
      counts[idx]++;
    }
    // Each of the 5 buckets should have roughly 1000 items (e.g. between 800 and 1200)
    for (const c of counts) {
      expect(c).toBeGreaterThan(700);
      expect(c).toBeLessThan(1300);
    }
  });
});

describe('Strength Estimation', () => {
  it('identifies weak passwords correctly', () => {
    const result = estimatePasswordStrength('password123');
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.label).toMatch(/Weak/);
  });

  it('identifies strong generated passwords with high entropy', () => {
    const pw = generatePassword({ length: 24 });
    const result = estimatePasswordStrength(pw);
    expect(result.score).toBe(4);
    expect(result.label).toBe('Very Strong');
    expect(result.entropyBits).toBeGreaterThan(100);
  });

  it('never labels password as unhackable', () => {
    const pw = generatePassword({ length: 64 });
    const result = estimatePasswordStrength(pw);
    expect(result.advisory.toLowerCase()).not.toContain('unhackable');
    expect(result.advisory.toLowerCase()).toContain('advisory');
  });
});

describe('Breach Check (k-Anonymity HIBP)', () => {
  it('computes correct SHA-1 hash locally', async () => {
    // SHA-1 of 'password' is '5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8'
    const hash = await computeSha1Hex('password');
    expect(hash).toBe('5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8');
  });

  it('throws error if user consent was not granted', async () => {
    await expect(checkPasswordBreach('test', false)).rejects.toThrow(/consent/i);
  });

  it('only sends 5-character prefix to remote endpoint and detects match locally', async () => {
    const candidate = 'mySecretCredential987!';
    const fullHash = await computeSha1Hex(candidate);
    const prefix = fullHash.slice(0, 5);
    const suffix = fullHash.slice(5);

    const requestedUrls: string[] = [];
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      requestedUrls.push(url);
      const mockResponseText = `${suffix}:42\r\nABCDEF01234567890123456789012345678:12\r\n`;
      return {
        ok: true,
        status: 200,
        text: async () => mockResponseText,
      };
    });

    const result = await checkPasswordBreach(candidate, true, mockFetch as unknown as typeof fetch);
    expect(requestedUrls[0]).toBe(`https://api.pwnedpasswords.com/range/${prefix}`);
    // Ensure the raw candidate password or full suffix is NEVER in the URL
    expect(requestedUrls[0]).not.toContain(candidate);
    expect(requestedUrls[0]).not.toContain(suffix);
    expect(result.breached).toBe(true);
    expect(result.count).toBe(42);
  });

  it('does not claim clean if API errors', async () => {
    const mockFetch = vi.fn().mockImplementation(async () => {
      return {
        ok: false,
        status: 503,
      };
    });

    await expect(checkPasswordBreach('somepw', true, mockFetch as unknown as typeof fetch)).rejects.toThrow(/unavailable/i);
  });
});

describe('Ephemeral Secret Holder', () => {
  it('stores and clears secret explicitly', () => {
    const holder = new EphemeralSecretHolder();
    holder.setSecret('secret-xyz');
    expect(holder.hasSecret()).toBe(true);
    expect(holder.getSecret()).toBe('secret-xyz');

    holder.clear();
    expect(holder.hasSecret()).toBe(false);
    expect(holder.getSecret()).toBeNull();
  });

  it('auto-wipes secret on TTL expiration', async () => {
    vi.useFakeTimers();
    const holder = new EphemeralSecretHolder(1000); // 1s TTL
    holder.setSecret('expiring-secret');

    expect(holder.getSecret()).toBe('expiring-secret');
    vi.advanceTimersByTime(1100);

    expect(holder.hasSecret()).toBe(false);
    expect(holder.getSecret()).toBeNull();
    vi.useRealTimers();
  });
});
