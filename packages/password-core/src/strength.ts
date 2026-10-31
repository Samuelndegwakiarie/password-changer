/**
 * Recoverly Password Strength & Entropy Estimator
 * Note: Strength estimates are strictly advisory, not proof of security.
 */

export interface StrengthEstimate {
  score: 0 | 1 | 2 | 3 | 4; // 0 = very weak, 4 = very strong
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  entropyBits: number;
  advisory: string;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumbers: boolean;
  hasSymbols: boolean;
}

export function estimatePasswordStrength(password: string): StrengthEstimate {
  if (!password) {
    return {
      score: 0,
      label: 'Very Weak',
      entropyBits: 0,
      advisory: 'Password is empty.',
      hasMinLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumbers: false,
      hasSymbols: false,
    };
  }

  const length = password.length;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[^A-Za-z0-9]/.test(password);

  let poolSize = 0;
  if (hasLowercase) poolSize += 26;
  if (hasUppercase) poolSize += 26;
  if (hasNumbers) poolSize += 10;
  if (hasSymbols) poolSize += 33;

  if (poolSize === 0) poolSize = 1;

  // Information entropy = length * log2(poolSize)
  const entropyBits = Math.round(length * Math.log2(poolSize));

  // Determine advisory score based on length, entropy, and complexity
  let score: 0 | 1 | 2 | 3 | 4 = 0;
  if (length >= 20 && entropyBits >= 100) {
    score = 4;
  } else if (length >= 16 && entropyBits >= 80) {
    score = 3;
  } else if (length >= 12 && entropyBits >= 60) {
    score = 2;
  } else if (length >= 8 && entropyBits >= 40) {
    score = 1;
  } else {
    score = 0;
  }

  const labels: Record<number, StrengthEstimate['label']> = {
    0: 'Very Weak',
    1: 'Weak',
    2: 'Fair',
    3: 'Strong',
    4: 'Very Strong',
  };

  let advisory = 'Advisory estimate based on length and entropy. Does not guarantee resistance to targeted attacks.';
  if (score < 2) {
    advisory = 'Password length or character diversity is low. Consider using at least 16-20 characters.';
  } else if (score < 4) {
    advisory = 'Good password length. Increasing to 20+ characters with symbols provides stronger resistance.';
  }

  return {
    score,
    label: labels[score] ?? 'Fair',
    entropyBits,
    advisory,
    hasMinLength: length >= 16,
    hasUppercase,
    hasLowercase,
    hasNumbers,
    hasSymbols,
  };
}
