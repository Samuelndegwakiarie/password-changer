import { describe, it, expect } from 'vitest';
import { Window } from 'happy-dom';
import { SYNTHETIC_HTML_FORMS } from '@recoverly/test-fixtures';
import {
  GitHubChangePasswordAdapter,
  MockSiteChangePasswordAdapter,
  WellKnownChangePasswordAdapter,
} from '@recoverly/adapter-contracts';

describe('Adapter DOM Fixtures & Fail-Closed Detection', () => {
  it('correctly maps GitHub password form fields from fixture', () => {
    const window = new Window();
    const document = window.document;
    document.write(SYNTHETIC_HTML_FORMS.githubMockForm);

    const adapter = new GitHubChangePasswordAdapter();
    expect(adapter.detectForm(document as unknown as Document)).toBe(true);

    const fieldMap = adapter.getFieldMap(document as unknown as Document);
    expect(fieldMap).not.toBeNull();
    expect(fieldMap?.newPasswordSelector).toBe('#password');
    expect(fieldMap?.confirmPasswordSelector).toBe('#confirmation');
    expect(fieldMap?.currentPasswordSelector).toBe('#old_password');
  });

  it('correctly maps Mock Site password form fields from fixture', () => {
    const window = new Window();
    const document = window.document;
    document.write(SYNTHETIC_HTML_FORMS.standardMockForm);

    const adapter = new MockSiteChangePasswordAdapter();
    expect(adapter.detectForm(document as unknown as Document)).toBe(true);

    const fieldMap = adapter.getFieldMap(document as unknown as Document);
    expect(fieldMap).not.toBeNull();
    expect(fieldMap?.newPasswordSelector).toBe('#new-password');
    expect(fieldMap?.confirmPasswordSelector).toBe('#confirm-password');
    expect(fieldMap?.currentPasswordSelector).toBe('#current-password');
  });

  it('detects success confirmation flash banner', () => {
    const window = new Window();
    const document = window.document;
    document.write(SYNTHETIC_HTML_FORMS.successConfirmationPage);

    const githubAdapter = new GitHubChangePasswordAdapter();
    expect(githubAdapter.detectSuccess(document as unknown as Document)).toBe(true);

    const wellKnownAdapter = new WellKnownChangePasswordAdapter();
    expect(wellKnownAdapter.detectSuccess(document as unknown as Document)).toBe(true);
  });

  it('fails closed when form is not present or is an MFA challenge', () => {
    const window = new Window();
    const document = window.document;
    document.write(SYNTHETIC_HTML_FORMS.mfaChallengePage);

    const githubAdapter = new GitHubChangePasswordAdapter();
    expect(githubAdapter.detectForm(document as unknown as Document)).toBe(false);
    expect(githubAdapter.getFieldMap(document as unknown as Document)).toBeNull();

    // Verify manual instructions are provided when detection fails closed
    const instructions = githubAdapter.getManualInstructions();
    expect(instructions.length).toBeGreaterThan(0);
    expect(instructions[0]).toContain('GitHub');
  });
});
