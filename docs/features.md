# Recoverly — Product Features and Functional Requirements

**Document type:** Product requirements specification  
**Primary user:** A person who uses Chrome and wants help fixing compromised, reused, or weak passwords.  
**Primary product:** Chrome desktop extension.  
**Product principle:** Help users change passwords safely in the services they already use; do not become another password vault.

## 1. Product vision

Recoverly turns password-risk findings into a guided, trackable remediation workflow. It helps users understand which accounts need attention, find the legitimate password-change page, generate a unique replacement, complete the change with user control, and save the credential through their existing password manager.

### Product promise

**From at-risk to recovered, one account at a time.**

### Explicit non-goals

- Replacing Google Password Manager or other vaults.
- Directly reading or editing Chrome's private password database.
- Automatically bypassing MFA, CAPTCHA, email verification, or SMS verification.
- Guaranteeing that every website can be automated.
- Claiming an account is secured without evidence.
- Storing users' passwords on Recoverly servers.

## 2. Personas

### Persona A — Non-technical everyday user
Needs clear language, minimal steps, and reassurance. May not understand breach terminology.

### Persona B — Security-conscious individual
Wants prioritization, unique passwords, privacy transparency, and a clear recovery history.

### Persona C — Small-business owner or IT helper
May need to guide users through remediation, but must not receive or view their passwords.

## 3. Navigation and information architecture

Primary navigation:
1. Overview
2. Accounts
3. Recovery queue
4. Activity
5. Settings
6. Help and privacy

The popup should remain compact and direct users to the side panel for full workflows.

## 4. Feature requirements

Priority definitions:
- **P0:** Required for safe MVP.
- **P1:** Important after MVP validation.
- **P2:** Later enhancement.

### F01 — First-run onboarding (P0)

- Explain what Recoverly does and does not do.
- Explain that it cannot directly access the Google Password Manager vault.
- Explain which browser permissions are requested and why.
- Obtain consent for optional breach checks and telemetry separately.
- Offer “Continue without an account”.
- Never ask for the user's Google password.
- Provide a clear uninstall/data deletion explanation.

Acceptance criteria:
- User can finish onboarding without creating a Recoverly account.
- Permissions are requested only when needed.
- Privacy explanation is accessible later in Settings.

### F02 — Security dashboard (P0)

Display:
- Total accounts added.
- Accounts marked compromised.
- Reused-password findings (only if safely and locally established).
- Weak-password findings.
- Recovery completed.
- Recovery requiring manual action.

Requirements:
- Clearly distinguish user-reported risk from verified breach lookup.
- Avoid double-counting one account across risk categories in the headline total.
- Prioritize email, financial, identity, and administrator accounts when the user identifies them as such.
- Do not infer account sensitivity from browsing history.

Acceptance criteria:
- Dashboard values derive from local account records.
- Empty state explains how to add an account.
- Counts update after account and recovery changes.

### F03 — Account management (P0)

Users can:
- Add an account manually.
- Edit its display name and domain.
- Add an optional username hint.
- Assign account category/importance.
- Mark an account as compromised, reused, weak, or user-reported.
- Archive or delete an account.
- Search and filter accounts.

Account fields:
- Display name.
- Website/domain.
- Optional masked username hint.
- Risk categories.
- Importance category.
- Notes that do not contain secrets.

Acceptance criteria:
- Domain is normalized and validated.
- No password field exists in the account model.
- Delete action requires confirmation.

### F04 — Local import (P1; only after security review)

Allow an optional import from a supported CSV export:
- User explicitly selects a local file.
- Parse in memory/local browser context.
- Show a preview of account metadata.
- Do not upload the file.
- Do not persist plaintext passwords.
- Discard password values immediately after extracting permitted metadata.
- Warn users that exported vault files are highly sensitive and should be deleted securely after use.

MVP may omit import entirely and use manual account entry.

### F05 — Risk assessment (P0)

Support:
- User-reported compromised account.
- Local password-strength assessment when a user explicitly enters a candidate password into a one-time local check; do not persist it.
- Optional Pwned Passwords k-anonymity check.
- Reuse detection only where the user explicitly supplies/imports the relevant data and local processing can compare it safely.

Important:
- Do not claim Recoverly can automatically read Google Password Manager's Password Checkup results.
- Do not infer that a password is compromised merely because a website appears in a breach.
- Explain the difference between a breached website and a confirmed exposed password.

Acceptance criteria:
- Risk source is displayed.
- API failure results in “Could not check”, not “Safe”.
- Password checks happen locally except the documented five-character hash-prefix request.

### F06 — Password generator (P0)

Controls:
- Length (default 20, range 16–64).
- Uppercase.
- Lowercase.
- Numbers.
- Symbols.
- Avoid ambiguous characters.
- Generate button.
- Copy/reveal controls with clear warnings.
- Strength estimate.
- Regenerate.

Requirements:
- Web Crypto secure randomness.
- No password logging or analytics.
- No reuse of generated values across accounts.
- Password kept in memory only for the active recovery step.
- Clear value on cancel, completion, timeout, or tab/workflow change.

Acceptance criteria:
- Unit tests verify length and selected character classes.
- Tests verify generation uses cryptographic randomness.
- UI never displays a generated password in activity history.

### F07 — Password-change destination discovery (P0)

Discovery order:
1. User-provided URL after origin validation.
2. `/.well-known/change-password` on the exact account origin.
3. A vetted, built-in site adapter.
4. Manual instructions/search guidance.

Requirements:
- HTTPS required except local development fixtures.
- Validate final destination origin and redirect chain.
- Show the destination domain before opening.
- Do not use untrusted URL suggestions from a backend.
- Never open a lookalike domain.

Acceptance criteria:
- Redirect to a different registrable domain requires a clear warning and user approval.
- Invalid or suspicious destinations are blocked.

### F08 — Guided password-change workflow (P0)

- Open the destination in a tab.
- Explain that user authentication is required.
- Detect whether a supported new-password form is present.
- Never read the current password value.
- Generate a replacement.
- Fill new-password and confirmation fields only after user clicks “Fill password”.
- Do not automatically submit the website form.
- Pause for MFA, OTP, CAPTCHA, email verification, or recovery steps.
- Offer manual instructions if detection is uncertain.

Acceptance criteria:
- User must explicitly approve fill.
- User must submit the website form.
- Unsupported form returns a safe manual path.
- No credential value is transmitted to Recoverly backend.

### F09 — Website adapters (P0 for framework; small number of adapters for beta)

Each adapter must define:
- Stable adapter ID and version.
- Exact supported domains/origins.
- Password-change destination.
- New-password field detection.
- Optional confirmation-field detection.
- Success detection.
- Known limitations and manual fallback.

Acceptance criteria:
- Adapter has unit and end-to-end tests.
- Adapter fails closed if the DOM does not match expectations.
- No adapter can execute code fetched remotely.
- Adapter updates are released through reviewed extension releases.

### F10 — Completion and storage confirmation (P0)

Track separate statuses:
- Password generated.
- Website accepted password change.
- Password manager save/update confirmed by user.
- Fully completed.

UI copy:
- “Password changed — saving not confirmed.”
- “Confirm that your password manager saved the new password.”
- “Completed — website change and password storage confirmed.”

Requirements:
- Do not claim to detect Chrome's native save prompt programmatically.
- Provide instructions for Chrome's native save/update prompt.
- Provide manual Password Manager instructions if prompt does not appear.
- Support alternative managers through documented user-driven handoff only.

Acceptance criteria:
- Website success alone cannot set storage-confirmed.
- User can mark storage confirmed.
- Recovery history retains evidence type.

### F11 — Recovery queue and prioritization (P0)

- Queue accounts by risk and user-defined importance.
- Allow one-at-a-time recovery.
- Pause and resume.
- Cancel safely.
- Show progress and next action.
- Never run unattended batch password changes.

Acceptance criteria:
- User chooses every account to remediate.
- No automatic submission or mass password rotation.

### F12 — Activity history (P0)

Store:
- Account ID.
- Domain.
- Timestamp.
- Workflow status.
- Adapter ID/version.
- Failure reason code.
- User-confirmation evidence.

Never store:
- Old or new password.
- Full page contents.
- OTP or recovery code.
- Session cookie.
- Sensitive query parameters.

### F13 — Privacy and data controls (P0)

- Local-first data storage.
- Export account metadata and recovery history.
- Delete all local Recoverly data.
- Optional telemetry toggle.
- Clear explanation of every network request.
- Optional cloud account must not be required for core functionality.

### F14 — Help and education (P0)

Include:
- What “compromised” means.
- Difference between weak, reused, and breached.
- How to use Chrome's password-saving prompt.
- Why MFA matters.
- What to do if a site is unsupported.
- How to identify a legitimate password-change domain.
- What Recoverly can and cannot see.

### F15 — Optional backend and subscription (P2)

Only after product validation:
- Account registration.
- Subscription plans.
- Billing portal.
- Adapter compatibility catalog.
- Organization licensing.
- Aggregate product analytics.

No password vault or password synchronization service.

## 5. User stories

1. As a user, I want to add an account flagged by Google Password Manager so I can track its remediation in Recoverly.
2. As a user, I want to see why an account is risky so I can decide what to fix first.
3. As a user, I want a strong unique password generated locally.
4. As a user, I want Recoverly to find the legitimate change-password page.
5. As a user, I want help filling the new password fields without surrendering control of the account.
6. As a user, I want to complete MFA and CAPTCHA myself.
7. As a user, I want Chrome to offer to save the new password.
8. As a user, I want to know whether the website change succeeded and whether storage was confirmed.
9. As a user, I want to remove all Recoverly data.
10. As a user, I want a manual path when automation is not supported.

## 6. UX requirements

- Use plain language, not security jargon.
- One primary action per screen.
- Show domain and account label before opening a site.
- Show progress with explicit next steps.
- Provide cancel, back, and manual fallback.
- Never hide an error behind a generic success state.
- Use accessible color contrast, keyboard navigation, visible focus, and screen-reader labels.
- Do not rely on color alone for risk indicators.
- Confirm destructive actions.
- Avoid displaying passwords unless the user explicitly chooses reveal.

## 7. MVP scope and release gates

### MVP must include
- Chrome Manifest V3 extension.
- Onboarding and permission explanations.
- Local account list and dashboard.
- Manual account/risk entry.
- Secure password generator.
- Change-password URL discovery.
- Guided form detection and user-approved fill.
- User-controlled submission.
- Separate website-change and storage-confirmation states.
- Recovery history.
- Manual fallback.
- Unit, integration, security, and E2E tests.

### MVP must not include
- Direct Google Password Manager vault access.
- Unattended password changes.
- CAPTCHA/MFA bypass.
- Central password vault.
- Automatic credential import from Chrome internals.
- Remote executable scripts.
- Cloud storage of passwords.

### Beta launch gates
- No known critical/high security findings.
- No secret values in logs or telemetry.
- Permission audit completed.
- Privacy policy and store listing reviewed.
- At least 10 site adapters tested against fixtures if adapter automation is marketed.
- Manual fallback verified.
- Clear disclosure of limitations.

## 8. Success metrics

Measure:
- Onboarding completion rate.
- Account-addition completion.
- Recovery workflow start rate.
- Website-change confirmation rate.
- Storage-confirmation rate.
- Manual-fallback rate.
- Adapter failure rate.
- Median time to complete a supported recovery.
- User-reported trust and clarity.

Do not use “number of passwords collected” or “number of credentials scanned” as success metrics.

## 9. Product acceptance definition

A user can add an at-risk account, understand the risk, open a validated destination, generate a strong unique password, fill supported new-password fields after explicit approval, submit the website form themselves, and accurately record whether the website accepted the change and whether the password manager saved it. Unsupported websites remain usable through a safe manual workflow.
