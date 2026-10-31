/**
 * Recoverly Secure Password Generator
 * Compliance:
 * - Uses Web Crypto API (crypto.getRandomValues)
 * - Zero Math.random()
 * - Unbiased character selection (rejection sampling to eliminate modulo bias)
 * - Guarantees inclusion of required character sets
 * - Supports ambiguous character avoidance
 * - Strict length boundaries (16 - 64, default 20)
 */

export interface GeneratorOptions {
  length?: number; // 16 to 64, default 20
  uppercase?: boolean; // default true
  lowercase?: boolean; // default true
  numbers?: boolean; // default true
  symbols?: boolean; // default true
  avoidAmbiguous?: boolean; // default false
}

const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const UPPERCASE_AMBIGUOUS = 'IO';
const LOWERCASE = 'abcdefghijkmnopqrstuvwxyz';
const LOWERCASE_AMBIGUOUS = 'l';
const NUMBERS = '23456789';
const NUMBERS_AMBIGUOUS = '01';
const SYMBOLS = '!@#$%^&*()_+-=[]{};:,.<>?';
const SYMBOLS_AMBIGUOUS = '|';

/**
 * Rejection sampling to select a uniformly distributed random index < length
 * Eliminates modulo bias completely.
 */
export function getSecureRandomIndex(max: number): number {
  if (max <= 0) throw new Error('Max must be greater than 0');
  if (max === 1) return 0;
  if (max > 256) {
    // For values up to 65536
    const limit = 65536 - (65536 % max);
    const buffer = new Uint16Array(1);
    while (true) {
      crypto.getRandomValues(buffer);
      const val = buffer[0]!;
      if (val < limit) {
        return val % max;
      }
    }
  } else {
    // For values up to 256
    const limit = 256 - (256 % max);
    const buffer = new Uint8Array(1);
    while (true) {
      crypto.getRandomValues(buffer);
      const val = buffer[0]!;
      if (val < limit) {
        return val % max;
      }
    }
  }
}

/**
 * Securely pick a character from a string using unbiased random sampling.
 */
function pickSecureChar(charset: string): string {
  const index = getSecureRandomIndex(charset.length);
  return charset.charAt(index);
}

/**
 * Fisher-Yates shuffle using cryptographically secure random values.
 */
function secureShuffle(array: string[]): string[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = getSecureRandomIndex(i + 1);
    const temp = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }
  return result;
}

export function generatePassword(options: GeneratorOptions = {}): string {
  const length = Math.max(16, Math.min(64, options.length ?? 20));
  const includeUpper = options.uppercase ?? true;
  const includeLower = options.lowercase ?? true;
  const includeNumbers = options.numbers ?? true;
  const includeSymbols = options.symbols ?? true;
  const avoidAmbiguous = options.avoidAmbiguous ?? false;

  const charsets: string[] = [];

  let upperSet = UPPERCASE + (avoidAmbiguous ? '' : UPPERCASE_AMBIGUOUS);
  let lowerSet = LOWERCASE + (avoidAmbiguous ? '' : LOWERCASE_AMBIGUOUS);
  let numberSet = NUMBERS + (avoidAmbiguous ? '' : NUMBERS_AMBIGUOUS);
  let symbolSet = SYMBOLS + (avoidAmbiguous ? '' : SYMBOLS_AMBIGUOUS);

  if (includeUpper) charsets.push(upperSet);
  if (includeLower) charsets.push(lowerSet);
  if (includeNumbers) charsets.push(numberSet);
  if (includeSymbols) charsets.push(symbolSet);

  if (charsets.length === 0) {
    // Fallback to full lowercase and uppercase if everything was toggled off
    charsets.push(upperSet, lowerSet);
  }

  const combinedCharset = charsets.join('');
  const passwordChars: string[] = [];

  // Guarantee at least one character from each selected charset
  for (const set of charsets) {
    passwordChars.push(pickSecureChar(set));
  }

  // Fill the remainder with uniformly chosen characters from the combined pool
  while (passwordChars.length < length) {
    passwordChars.push(pickSecureChar(combinedCharset));
  }

  // Shuffle to prevent predictable positions for guaranteed characters
  const shuffled = secureShuffle(passwordChars);
  return shuffled.join('');
}
