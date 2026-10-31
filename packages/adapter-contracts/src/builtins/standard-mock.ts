import type { PasswordFieldMap } from '@recoverly/shared-types';
import type { PasswordChangeAdapter } from '../adapter';

/**
 * Local Test Mock Site Adapter
 * Used exclusively for local test fixtures and E2E synthetic testing.
 */
export class MockSiteChangePasswordAdapter implements PasswordChangeAdapter {
  public readonly id = 'mock-site';
  public readonly name = 'Local Mock Site';
  public readonly version = 1;
  public readonly domains = ['localhost', '127.0.0.1'] as const;

  public getChangePasswordUrl(origin: string): URL | null {
    try {
      const base = new URL(origin);
      return new URL('/change-password', base.origin);
    } catch {
      return null;
    }
  }

  public detectForm(doc: Document): boolean {
    return this.getFieldMap(doc) !== null;
  }

  public getFieldMap(doc: Document): PasswordFieldMap | null {
    const newPw = doc.querySelector<HTMLInputElement>('#new-password, input[name="new_password"]');
    const confirmPw = doc.querySelector<HTMLInputElement>('#confirm-password, input[name="confirm_password"]');
    const currentPw = doc.querySelector<HTMLInputElement>('#current-password, input[name="current_password"]');

    if (newPw) {
      return {
        newPasswordSelector: newPw.id ? `#${newPw.id}` : `input[name="${newPw.name}"]`,
        confirmPasswordSelector: confirmPw ? (confirmPw.id ? `#${confirmPw.id}` : `input[name="${confirmPw.name}"]`) : undefined,
        currentPasswordSelector: currentPw ? (currentPw.id ? `#${currentPw.id}` : `input[name="${currentPw.name}"]`) : undefined,
      };
    }
    return null;
  }

  public detectSuccess(doc: Document): boolean {
    const msg = doc.querySelector('#success-message, .status-success');
    return msg !== null && (msg.textContent?.toLowerCase().includes('success') ?? false);
  }

  public getManualInstructions(): string[] {
    return [
      'Enter current password in test mock form.',
      'Paste generated new password into new password field.',
      'Submit test form.',
    ];
  }
}
