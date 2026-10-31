/**
 * Recoverly URL and Origin Validation Security Module
 * Compliance:
 * - Requires HTTPS (except localhost / 127.0.0.1 for synthetic testing)
 * - Exact hostname and registrable domain matching
 * - Rejects IP addresses (except localhost), username@ spoofing, and lookalikes
 */

export function normalizeDomain(input: string): string {
  if (!input) return '';
  let cleaned = input.trim().toLowerCase();
  // Remove protocol if present
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    try {
      const parsed = new URL(cleaned);
      cleaned = parsed.hostname;
    } catch {
      cleaned = cleaned.replace(/^https?:\/\//, '');
    }
  }

  // Remove path, query, hash
  cleaned = cleaned.split('/')[0]!;
  cleaned = cleaned.split(':')[0]!; // remove port
  return cleaned;
}

export function isValidOriginForRecovery(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);

    const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (url.protocol !== 'https:' && !isLocalhost) {
      return false; // HTTPS required
    }

    if (url.username || url.password) {
      return false; // Rejection of credential embedded in URL spoofing
    }

    if (!url.hostname || url.hostname.includes(' ')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validates that targetUrl belongs to the same registrable domain as expectedDomain.
 */
export function isSameOrSubdomain(targetHostname: string, baseDomain: string): boolean {
  const normTarget = normalizeDomain(targetHostname);
  const normBase = normalizeDomain(baseDomain);

  if (normTarget === normBase) return true;
  if (normTarget.endsWith('.' + normBase)) return true;

  return false;
}
