import type { PasswordFieldMap } from '@recoverly/shared-types';

export interface PasswordChangeAdapter {
  readonly id: string;
  readonly name: string;
  readonly version: number;
  readonly domains: readonly string[]; // Normalized registrable domains (e.g. ['github.com'])

  /**
   * Determine the target password change URL for this origin.
   */
  getChangePasswordUrl(origin: string): URL | null;

  /**
   * Inspect the document to see if a valid password change form is loaded.
   */
  detectForm(doc: Document): boolean;

  /**
   * Retrieve reliable CSS selectors for password fields.
   * Never inspect or return the value of current password!
   */
  getFieldMap(doc: Document): PasswordFieldMap | null;

  /**
   * Detect if a successful change banner or redirect occurred.
   */
  detectSuccess(doc: Document): boolean;

  /**
   * Safe step-by-step instructions for when automation or selectors fail.
   */
  getManualInstructions(): string[];
}
