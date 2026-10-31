# Recoverly — AI Coding Agent Rules

**Purpose:** Mandatory implementation rules for any AI coding agent, developer, or contributor working on Recoverly.

These rules take precedence over convenience, speed, or assumptions made by the agent.

## 1. Read before coding

Before implementation:
1. Read `architecture.md`.
2. Read `features.md`.
3. Read this file completely.
4. Inspect the existing repository and preserve working conventions.
5. Produce a concise implementation plan and identify unknowns.
6. Do not silently invent unsupported browser APIs or integrations.

If documentation conflicts, security constraints in this file take precedence. Ask for clarification when a product decision materially changes security or data handling.

## 2. Truthfulness about browser capabilities

- Never claim a public API exists unless verified in official documentation.
- Never claim direct Google Password Manager vault read/write access.
- Never scrape Chrome internal pages or profile files.
- Never attempt to force or inspect Chrome's native password-save prompt using unsupported mechanisms.
- Never mark a credential as saved based solely on a successful website form submission.
- Do not promise universal website automation.
- Use official Chrome Extension APIs and documented web standards only.
- Record the source URL and date for any newly relied-upon platform capability in `docs/technical-decisions.md`.

## 3. Secret-handling rules

**The following data must never be sent to the Recoverly backend, analytics, crash reporting, logs, or support tooling:**
- Current passwords.
- Generated passwords.
- Password hashes or password-derived secrets, except the five-character SHA-1 prefix used for the documented Pwned Passwords range request.
- OTPs, MFA codes, recovery codes, security-question answers.
- Session cookies, authentication tokens belonging to other websites.
- Password form values.
- Raw password-manager exports.

Additional rules:
- Do not store passwords in `chrome.storage`, IndexedDB, localStorage, sessionStorage, database tables, or files.
- Keep a generated password in memory only for the active user-approved step.
- Clear password values on cancel, completion, timeout, navigation away, and workflow reset.
- Do not put secrets in URLs, query parameters, error messages, React state persisted to disk, Redux devtools, or telemetry.
- Never log DOM field values.
- Never include real credentials in fixtures or tests.
- Use synthetic credentials only.

## 4. User consent and automation boundaries

- The user initiates every recovery.
- Show the target website's domain before navigation.
- Ask for explicit approval before filling any new-password field.
- The user must submit the password-change form themselves in the MVP.
- Never bypass MFA, CAPTCHA, OTP, email verification, SMS verification, or identity checks.
- Never automate account recovery or security-question answers.
- Pause and hand control back to the user when verification is required.
- Do not run mass or unattended password rotations.
- Provide cancel and manual fallback at every appropriate stage.

## 5. Extension permissions

- Follow least privilege.
- Prefer `activeTab` and user-initiated access.
- Do not use `<all_urls>` unless a documented, reviewed requirement proves it necessary.
- Do not add permissions “just in case”.
- Explain each permission in the UI.
- Request optional permissions contextually.
- Do not use `webRequest`, debugger, native messaging, clipboard, downloads, or identity APIs without a documented requirement and security review.
- Content scripts must only operate on the intended tab and validated origin.

## 6. Website and DOM safety

- Require HTTPS except local test fixtures.
- Validate exact origins; never use loose hostname substring matching.
- Reject suspicious redirects and unexpected registrable-domain changes.
- Never inject remotely hosted JavaScript.
- Never execute code returned by the backend.
- Do not use `eval`, `new Function`, inline script execution, or unsafe HTML injection.
- Use `textContent` rather than `innerHTML` for untrusted text.
- Treat website DOM as untrusted input.
- If selectors or form structure are ambiguous, fail closed and provide manual instructions.
- Never read current-password field values.
- Only identify the current-password field selector if needed; do not inspect its value.
- Do not automatically click a final submit button in the MVP.

## 7. Password generation rules

- Use Web Crypto (`crypto.getRandomValues`).
- Never use `Math.random`.
- Avoid biased character selection.
- Enforce configured length and character classes.
- Default to unique 20-character passwords.
- Do not derive passwords from personal data or website names.
- Do not reuse generated passwords across accounts.
- Strength estimates are advisory, not proof of security.
- Do not call a password “unhackable”.

## 8. Breach-check rules

- For Pwned Passwords, use the documented range API and k-anonymity approach.
- Calculate the hash locally.
- Send only the first five hexadecimal characters.
- Compare suffixes locally.
- Do not send plaintext or full password hashes.
- Do not interpret an API failure as a clean result.
- Explain that absence from the breach corpus does not prove a password is safe.
- Make remote breach checking optional and disclose the request.

## 9. Data model rules

- Account and recovery records contain metadata only.
- Do not add a password, password_hash, secret, otp, cookie, or recovery_code column.
- Use UUIDs for internal record identifiers.
- Normalize and validate domains.
- Store timestamps in ISO 8601/UTC.
- Separate risk status, website-change status, and password-storage status.
- Validate every state transition through one domain service.
- Do not let UI components directly mutate persisted workflow state without validation.

## 10. Backend rules

- Backend is optional for the core MVP.
- The extension must continue to work if the backend is down.
- Backend must never receive credentials or vault exports.
- Use TLS, schema validation, rate limiting, secure headers, and safe error handling.
- Never log request bodies indiscriminately.
- Verify billing webhook signatures if billing exists.
- Keep secrets in environment/secret management, never source control.
- Implement account deletion and consent revocation if user accounts are introduced.
- Document data retention and deletion behavior.
- Do not add user tracking without explicit consent.

## 11. Frontend and UX rules

- Use TypeScript strict mode.
- Prefer small, typed, testable components.
- Keep business logic out of presentation components.
- Use clear loading, empty, success, and error states.
- Never use a green success state when the operation is not confirmed.
- Use exact wording:
  - “Password generated”
  - “Password change submitted”
  - “Website accepted the new password” only when supported by evidence
  - “Password manager save not confirmed” when unknown
  - “Storage confirmed by you” when the user confirms it
- Do not claim “Account secured” until completion criteria are satisfied.
- Support keyboard navigation and screen readers.
- Do not rely on color alone to communicate risk.
- Avoid dark patterns, fake urgency, or manipulative upsells.

## 12. Engineering standards

- TypeScript strict mode; avoid `any`.
- Validate external input at runtime.
- Keep modules cohesive and interfaces explicit.
- Use dependency injection where it improves testing.
- Avoid premature abstraction.
- No dead code, placeholder implementations, or fake API success responses in production paths.
- Do not suppress TypeScript or lint errors without explanation.
- Pin dependencies and review new packages.
- Keep dependencies minimal.
- Use semantic versioning for adapters and extension releases.
- Document non-obvious security decisions.

## 13. Testing rules

Every feature must include tests appropriate to its risk.

Required test layers:
- Unit tests for password generation, validation, domain normalization, state transitions, and adapter matching.
- Integration tests for local storage, message passing, and service-worker recovery.
- E2E tests for onboarding, account creation, recovery, cancel, unsupported site, and manual fallback.
- Security tests for malicious redirects, origin spoofing, DOM injection, and secret leakage.
- Regression tests for every adapter.
- Accessibility checks for main workflows.

Tests must use local mock websites and synthetic data. Never test against real user accounts or real passwords.

## 14. Definition of done for every task

A task is not complete until:
1. The implementation matches the documented requirement.
2. Type checking passes.
3. Linting passes.
4. Relevant unit/integration/E2E tests pass.
5. No secrets are logged or persisted.
6. Permissions remain minimal.
7. Errors and manual fallback are handled.
8. UI states accurately represent evidence.
9. Documentation is updated.
10. The agent reports files changed, tests run, test results, known limitations, and remaining work.

## 15. AI agent workflow

For each milestone:
1. Inspect current code and docs.
2. State the intended changes.
3. Implement a small vertical slice.
4. Run formatting, lint, type checking, and tests.
5. Inspect the diff for security and permission changes.
6. Update documentation.
7. Summarize outcomes and blockers.

Do not generate the entire application in one unreviewed code dump. Build in milestones and keep the repository runnable after each milestone.

### Required milestone order

**M0 — Repository foundation**
- Monorepo or clearly separated extension/API structure.
- TypeScript, lint, formatting, tests, CI.
- Manifest V3 loads unpacked in Chrome.

**M1 — UI shell and local data**
- Onboarding.
- Side panel.
- Dashboard.
- Account CRUD.
- Local persistence.

**M2 — Password core**
- Secure generator.
- Strength estimation.
- Secret lifecycle tests.
- Optional breach-check client.

**M3 — Recovery workflow**
- State machine.
- Destination discovery.
- User approval.
- Manual recovery flow.
- Accurate status display.

**M4 — Site adapters**
- Adapter contract.
- Local mock sites.
- First small adapter set.
- Fail-closed behavior.

**M5 — Optional backend**
- Only implement if required by validated product needs.
- Auth, subscriptions, compatibility metadata, consent.
- No credential endpoints.

**M6 — Hardening and beta**
- Security review.
- Accessibility.
- E2E suite.
- Privacy review.
- Chrome Web Store readiness.

## 16. Required agent completion report

At the end of each milestone, provide:

```text
Milestone:
Implemented:
Files created/modified:
Architecture decisions:
Permissions added/changed:
Data collected or transmitted:
Security controls:
Tests executed:
Test results:
Known limitations:
Open risks:
Next milestone:
```

## 17. Stop conditions

Stop implementation and ask for human review if:
- A requested feature requires direct access to Chrome's private password vault.
- A feature would transmit passwords or password-manager exports.
- A workflow requires bypassing MFA/CAPTCHA or identity checks.
- An implementation needs broad browser permissions without a clear justification.
- A third-party API's privacy or security behavior is unclear.
- A website adapter cannot confidently identify the intended origin and fields.
- A product requirement conflicts with these security rules.

**Final principle:** Recoverly assists the account owner. It must never take control away from them, weaken the browser's security boundaries, or pretend that an unverified action succeeded.
