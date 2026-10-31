/**
 * Recoverly Pwned Passwords Client (k-Anonymity Model)
 * Compliance:
 * - Computes SHA-1 hash locally in browser / runtime
 * - Sends ONLY the first 5 hexadecimal characters to HIBP API
 * - Evaluates the returned suffixes locally
 * - Plaintext or full hashes are NEVER transmitted
 * - API failure returns an explicit error state, never a false "Clean" result
 * - Discloses that absence from breach database does not guarantee safety
 */

export interface BreachCheckResult {
  checked: boolean;
  breached: boolean;
  count: number;
  advisory: string;
}

/**
 * Local SHA-1 calculation using Web Crypto API
 */
export async function computeSha1Hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * Check if a candidate password appears in HaveIBeenPwned via k-anonymity range API.
 * @param password Candidate password
 * @param consentGranted Must be true; otherwise throws error
 * @param fetchFn Optional injected fetch implementation (useful for tests)
 */
export async function checkPasswordBreach(
  password: string,
  consentGranted: boolean,
  fetchFn: typeof fetch = fetch
): Promise<BreachCheckResult> {
  if (!consentGranted) {
    throw new Error('User consent for remote breach checking is required before making requests.');
  }

  if (!password) {
    return {
      checked: true,
      breached: false,
      count: 0,
      advisory: 'No password provided.',
    };
  }

  try {
    const fullHash = await computeSha1Hex(password);
    const prefix = fullHash.slice(0, 5);
    const suffix = fullHash.slice(5);

    const url = `https://api.pwnedpasswords.com/range/${prefix}`;
    const response = await fetchFn(url, {
      method: 'GET',
      headers: {
        'Add-Padding': 'true', // Recommended by HIBP to prevent response-length side channels
        'User-Agent': 'Recoverly-Extension',
      },
    });

    if (!response.ok) {
      throw new Error(`HIBP API returned HTTP ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split('\r\n');

    let breachCount = 0;
    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(':');
      if (hashSuffix && hashSuffix.trim().toUpperCase() === suffix) {
        breachCount = parseInt(countStr ?? '0', 10);
        break;
      }
    }

    if (breachCount > 0) {
      return {
        checked: true,
        breached: true,
        count: breachCount,
        advisory: `This password was found in compromised data sets (${breachCount.toLocaleString()} times). Do not use it.`,
      };
    }

    return {
      checked: true,
      breached: false,
      count: 0,
      advisory: 'Password not found in known breach records. Note: Absence does not guarantee safety from targeted attacks.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Breach check service unavailable: ${msg}. Cannot verify safety.`);
  }
}
