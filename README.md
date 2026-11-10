# Recoverly — Guided Account-Security Recovery Assistant

Recoverly is a local-first, privacy-respecting Chrome desktop extension (Manifest V3) that guides users through safe, step-by-step password recovery and remediation for vulnerable or compromised accounts.



## Non-Negotiable Platform & Security Guarantees

1. **Local-First & Zero Password Storage:** Recoverly never persists passwords, hashes, recovery codes, or session tokens in `chrome.storage`, databases, or files. Generated passwords live in ephemeral memory only for the duration of the active step.
2. **Platform Boundary Respect:** Google provides no public API to directly inspect or mutate Google Password Manager's private vault. Recoverly never pretends this API exists; instead, it coordinates with Chrome's native credential-update prompt upon user form submission.
3. **User In Control:** No unattended mass password rotations. The user approves every password fill and submits every website form manually.
4. **Independent Confirmation:** Distinguishes whether the website accepted a change from whether the password manager confirmed saving it.

---

## Monorepo Architecture

```text
recoverly/
├── apps/
│   ├── extension/          # Manifest V3 Chrome Extension (React + Vite + TypeScript)
│   └── api/                # Optional metadata API (Fastify + TypeScript, zero-credential)
├── packages/
│   ├── shared-types/       # Domain models, recovery state definitions, message contracts
│   ├── password-core/      # Web Crypto unbiased generator, strength estimator, k-anonymity HIBP client
│   ├── adapter-contracts/  # PasswordChangeAdapter interface, URL origin validation, registry
│   └── test-fixtures/      # Synthetic test HTML forms and mock datasets
└── docs/
    ├── architecture.md     # System architecture specification
    ├── features.md         # Product requirements and user stories
    ├── rules.md            # Mandatory security and engineering policy
    └── technical-decisions.md # Platform API verification and design records
```

---

## Getting Started

### Prerequisites
- Node.js >= 20.x
- pnpm >= 9.x or 10.x

### Installation & Build
```bash
# Install dependencies
pnpm install

# Build all packages and extension
pnpm build

# Run full test suite across all packages (50+ tests)
pnpm test

# Run strict TypeScript typecheck
pnpm typecheck
```

---

## Loading the Extension in Google Chrome

1. Open Google Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** via the toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select the directory:
   `<workspace>/apps/extension/dist`
5. The Recoverly extension icon will appear in your Chrome toolbar.
6. Click the extension icon to view the status summary or open the persistent **Side Panel** to begin remediation.

---

## Test Verification

The codebase includes comprehensive test layers:
- **Unit Tests:** Unbiased cryptographic generation (`crypto.getRandomValues`), Fisher-Yates distribution, entropy/strength estimation, k-anonymity SHA-1 range checks.
- **Security & Storage Tests:** Prohibited credential rejection in storage, sanitization in export, origin spoofing and lookalike domain rejection.
- **DOM & Adapter Tests:** Synthetic fixture testing against standard RFC 8615, GitHub, Google, and mock sites with fail-closed behavior.
- **E2E Workflows:** State machine invariant validation, user approval checkpoints, and cancellation cleanup.
