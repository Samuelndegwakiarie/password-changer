# Recoverly — Technical Decisions & Platform Capabilities

**Date of Record:** 2026-10-31  
**Project:** Recoverly  

## Platform Capabilities & Constraints

### 1. Chrome Manifest V3 Extensions
- **Chrome Side Panel API (`chrome.sidePanel`):**
  - Official Documentation: https://developer.chrome.com/docs/extensions/reference/api/sidePanel
  - Purpose: Provides the primary persistent user interface for Recoverly's guided recovery workflow, dashboard, and account management, co-existing with active browser tabs without obscuring web page forms.
- **Chrome Storage API (`chrome.storage.local`):**
  - Official Documentation: https://developer.chrome.com/docs/extensions/reference/api/storage
  - Purpose: Local-first persistence for account metadata and recovery state history.
  - Security Constraint: **Never** used to store passwords, secrets, hashes, or credentials.
- **Chrome Scripting API (`chrome.scripting`) & `activeTab`:**
  - Official Documentation: https://developer.chrome.com/docs/extensions/reference/api/scripting
  - Official Documentation: https://developer.chrome.com/docs/extensions/develop/concepts/activeTab
  - Purpose: Injects lightweight content script / adapter functions only on user-approved tabs when initiating recovery on supported domains.
  - Security Constraint: Requires explicit user action; no `<all_urls>` permission.
- **Google Password Manager Boundary:**
  - Fact: No public Chrome Extension API exists to read, search, or edit Google's internal password vault.
  - Decision: Recoverly never pretends to directly inspect or mutate Google Password Manager. We guide the user to let Chrome's native save/update prompt trigger after form submission, or guide manual entry if the prompt does not appear.

### 2. Cryptography & Password Generation
- **Web Crypto API (`crypto.getRandomValues`):**
  - Web Standard: https://www.w3.org/TR/WebCryptoAPI/
  - Purpose: Cryptographically secure, unbiased generation of random characters across configured charsets.
- **Web Crypto SHA-1 (`crypto.subtle.digest`):**
  - Purpose: Strictly for computing the 40-character hex hash locally for the Have I Been Pwned (HIBP) k-anonymity range check.
  - Security Constraint: Only the first 5 hexadecimal characters are transmitted via HTTPS. Suffix comparison occurs purely client-side.

### 3. Architecture & Monorepo Setup
- **Workspaces:** pnpm workspaces.
- **Packages:**
  - `packages/shared-types`: Canonical domain models (`AccountRecord`, `RecoveryRecord`, etc.).
  - `packages/password-core`: Unbiased generator, zxcvbn strength estimation, and k-anonymity breach client.
  - `packages/adapter-contracts`: Interfaces, URL patterns, field maps, and built-in site adapters.
  - `packages/test-fixtures`: Synthetic HTML test environments and mock datasets.
- **Apps:**
  - `apps/extension`: React + Vite + TypeScript Manifest V3 extension (Popup, Sidepanel, Options, Background Service Worker, Content Scripts).
  - `apps/api`: Node.js Fastify/TypeScript optional API for adapter catalogs, health, and metadata (strictly zero-credential).

### 4. Non-Negotiable Security Policies
- Zero password persistence in storage or telemetry.
- Ephemeral in-memory password lifecycle: cleared immediately upon completion, cancellation, navigation, or tab switch.
- User submits all forms. Recoverly never auto-submits.
- Independent verification states: `website_change_confirmed` vs `storage_user_confirmed`.
