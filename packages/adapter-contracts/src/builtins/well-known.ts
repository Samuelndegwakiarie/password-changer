import type { PasswordFieldMap } from '@recoverly/shared-types';
import type { PasswordChangeAdapter } from '../adapter';
import { isValidOriginForRecovery } from '../url-validator';

export class WellKnownChangePasswordAdapter implements PasswordChangeAdapter {
  public readonly id = 'well-known-change-password';
  public readonly name = 'RFC 8615 Well-Known Change Password';
  public readonly version = 1;
  public readonly domains = [] as const; // Matches as fallback for any valid domain

  public getChangePasswordUrl(origin: string): URL | null {
    if (!isValidOriginForRecovery(origin)) return null;
    try {
      const base = new URL(origin);
      return new URL('/.well-known/change-password', base.origin);
    } catch {
      return null;
    }
  }

  public detectForm(doc: Document): boolean {
    return this.getFieldMap(doc) !== null;
  }

  public getFieldMap(doc: Document): PasswordFieldMap | null {
    // Look for new password field with autocomplete="new-password" or standard names
    const newPwInput = doc.querySelector<HTMLInputElement>(
      'input[type="password"][autocomplete="new-password"], input[type="password"][name*="new"], input[type="password"][id*="new"]'
    );

    const confirmPwInput = doc.querySelector<HTMLInputElement>(
      'input[type="password"][name*="confirm"], input[type="password"][id*="confirm"], input[type="password"][name*="repeat"]'
    );

    const currentPwInput = doc.querySelector<HTMLInputElement>(
      'input[type="password"][autocomplete="current-password"], input[type="password"][name*="current"], input[type="password"][name*="old"]'
    );

    if (newPwInput) {
      // Build unique or stable selector
      const newSel = newPwInput.id ? `#${newPwInput.id}` : (newPwInput.name ? `input[name="${newPwInput.name}"]` : 'input[type="password"]');
      const confirmSel = confirmPwInput ? (confirmPwInput.id ? `#${confirmPwInput.id}` : `input[name="${confirmPwInput.name}"]`) : undefined;
      const currentSel = currentPwInput ? (currentPwInput.id ? `#${currentPwInput.id}` : `input[name="${currentPwInput.name}"]`) : undefined;

      return {
        newPasswordSelector: newSel,
        confirmPasswordSelector: confirmSel,
        currentPasswordSelector: currentSel,
      };
    }

    // Fallback: If page has at least 2 password inputs and first might be current, second new
    const allPasswordInputs = Array.from(doc.querySelectorAll<HTMLInputElement>('input[type="password"]'));
    if (allPasswordInputs.length >= 2) {
      const isCurrentFirst = allPasswordInputs.length === 3;
      const newField = isCurrentFirst ? allPasswordInputs[1]! : allPasswordInputs[0]!;
      const confirmField = isCurrentFirst ? allPasswordInputs[2] : allPasswordInputs[1];
      const currentField = isCurrentFirst ? allPasswordInputs[0] : undefined;

      return {
        newPasswordSelector: newField.id ? `#${newField.id}` : `input[name="${newField.name}"]`,
        confirmPasswordSelector: confirmField ? (confirmField.id ? `#${confirmField.id}` : `input[name="${confirmField.name}"]`) : undefined,
        currentPasswordSelector: currentField ? (currentField.id ? `#${currentField.id}` : `input[name="${currentField.name}"]`) : undefined,
      };
    }

    return null;
  }

  public detectSuccess(doc: Document): boolean {
    const successBanners = doc.querySelectorAll('.alert-success, [role="alert"], .flash-success, .banner-success, .success-message');
    for (const banner of Array.from(successBanners)) {
      const text = banner.textContent?.toLowerCase() ?? '';
      if (text.includes('password') && (text.includes('updated') || text.includes('changed') || text.includes('saved') || text.includes('success'))) {
        return true;
      }
    }
    return false;
  }

  public getManualInstructions(): string[] {
    return [
      'Navigate to the website account or security settings page.',
      'Log into your account if prompted.',
      'Complete any multi-factor authentication (MFA or SMS) requested by the website.',
      'Locate the "Change Password" or "Security" section.',
      'Copy the generated password from Recoverly and paste it into the new password field.',
      'Submit the password change form manually.',
      'Confirm whether your browser or password manager offers to save the new credential.',
    ];
  }
}
