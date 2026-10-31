import type { AccountRecord } from '@recoverly/shared-types';

export const SYNTHETIC_ACCOUNTS: AccountRecord[] = [
  {
    id: 'e1d2c3b4-a5b6-4c7d-8e9f-0a1b2c3d4e5f',
    domain: 'github.com',
    displayName: 'GitHub Personal',
    usernameHint: 'dev-tester@synthetic-example.test',
    riskCategories: ['breached', 'reused'],
    riskLevel: 'critical',
    importance: 'work',
    source: 'manual',
    notes: 'Used across multiple legacy development setups',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'f2a3b4c5-d6e7-48f9-90a1-1b2c3d4e5f6a',
    domain: 'google.com',
    displayName: 'Primary Google Account',
    usernameHint: 'alex.smith@synthetic-test.com',
    riskCategories: ['weak'],
    riskLevel: 'high',
    importance: 'identity',
    source: 'manual',
    notes: 'Primary recovery email for multiple personal services',
    createdAt: '2026-10-05T12:00:00.000Z',
    updatedAt: '2026-10-05T12:00:00.000Z',
  },
  {
    id: 'a9b8c7d6-e5f4-4321-8765-43210fedcba9',
    domain: 'dropbox.com',
    displayName: 'Dropbox Storage',
    usernameHint: 'cloud-user@synthetic-box.org',
    riskCategories: ['reused'],
    riskLevel: 'medium',
    importance: 'shopping',
    source: 'manual',
    createdAt: '2026-10-10T14:30:00.000Z',
    updatedAt: '2026-10-10T14:30:00.000Z',
  },
];

export const SYNTHETIC_HTML_FORMS = {
  standardMockForm: `
    <!DOCTYPE html>
    <html lang="en">
    <head><title>Account Security - Change Password</title></head>
    <body>
      <main>
        <h1>Update Your Password</h1>
        <form id="change-pw-form" action="/submit-change" method="POST">
          <div>
            <label for="current-password">Current Password</label>
            <input type="password" id="current-password" name="current_password" autocomplete="current-password" />
          </div>
          <div>
            <label for="new-password">New Password</label>
            <input type="password" id="new-password" name="new_password" autocomplete="new-password" />
          </div>
          <div>
            <label for="confirm-password">Confirm Password</label>
            <input type="password" id="confirm-password" name="confirm_password" autocomplete="new-password" />
          </div>
          <button type="submit" id="submit-btn">Save Changes</button>
        </form>
      </main>
    </body>
    </html>
  `,

  githubMockForm: `
    <!DOCTYPE html>
    <html lang="en">
    <head><title>GitHub Settings - Security</title></head>
    <body>
      <form action="/settings/password" method="post">
        <label for="old_password">Old password</label>
        <input type="password" name="old_password" id="old_password" />
        <label for="password">New password</label>
        <input type="password" name="password" id="password" />
        <label for="confirmation">Confirm new password</label>
        <input type="password" name="confirmation" id="confirmation" />
        <button type="submit">Update password</button>
      </form>
    </body>
    </html>
  `,

  successConfirmationPage: `
    <!DOCTYPE html>
    <html lang="en">
    <head><title>Settings Saved</title></head>
    <body>
      <div class="flash-messages">
        <div class="flash-success">Your password has been successfully updated.</div>
      </div>
    </body>
    </html>
  `,

  mfaChallengePage: `
    <!DOCTYPE html>
    <html lang="en">
    <head><title>Two-Factor Authentication Required</title></head>
    <body>
      <h1>Two-Step Verification</h1>
      <p>Enter the 6-digit code from your authenticator app</p>
      <input type="text" id="otp-code" maxlength="6" />
      <button type="button" id="verify-mfa">Verify</button>
    </body>
    </html>
  `,
};
