import type { PasswordFieldMap } from '@recoverly/shared-types';
import type { PasswordChangeAdapter } from '../adapter';

export class GitHubChangePasswordAdapter implements PasswordChangeAdapter {
  public readonly id = 'github';
  public readonly name = 'GitHub Security Settings';
  public readonly version = 1;
  public readonly domains = ['github.com'] as const;

  public getChangePasswordUrl(origin: string): URL | null {
    try {
      const url = new URL(origin);
      if (url.hostname === 'github.com') {
        return new URL('https://github.com/settings/security');
      }
    } catch {
      // ignore
    }
    return new URL('https://github.com/settings/security');
  }

  public detectForm(doc: Document): boolean {
    return this.getFieldMap(doc) !== null;
  }

  public getFieldMap(doc: Document): PasswordFieldMap | null {
    // GitHub uses explicit IDs: #old_password, #password, #confirmation
    const newPw = doc.querySelector<HTMLInputElement>('#password, input[name="password"]');
    const confirmPw = doc.querySelector<HTMLInputElement>('#confirmation, input[name="confirmation"]');
    const currentPw = doc.querySelector<HTMLInputElement>('#old_password, input[name="old_password"]');

    if (newPw && confirmPw) {
      return {
        newPasswordSelector: '#password',
        confirmPasswordSelector: '#confirmation',
        currentPasswordSelector: currentPw ? '#old_password' : undefined,
      };
    }
    return null;
  }

  public detectSuccess(doc: Document): boolean {
    const flash = doc.querySelector('.flash-messages .flash-success, .flash-success');
    if (flash) {
      const text = flash.textContent?.toLowerCase() ?? '';
      return text.includes('password') || text.includes('updated');
    }
    return false;
  }

  public getManualInstructions(): string[] {
    return [
      'Open your GitHub Settings -> Password and authentication.',
      'Sign in and complete any 2FA/SUDO prompt if required.',
      'Enter your old password in the "Old password" field.',
      'Paste the new generated password into "New password" and "Confirm new password".',
      'Click "Update password" yourself.',
      'Ensure Chrome or your password manager prompts to update the credential.',
    ];
  }
}
