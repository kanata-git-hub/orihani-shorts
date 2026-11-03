# Security maintenance — 2026-09-20

Existing models, prompts, generated content, page layouts and media workflows are retained. API callers now attach their existing Firebase ID token; the server checks the same access policy used by the app. No production data was changed during verification.

Run `npm ci`, `npm run lint`, `npm run build`, and `npm run test:security`. Firestore tests run against an emulator only: `npx --yes firebase-tools@15.30.2 emulators:exec --project demo-security-check --config firebase.security-test.json --only firestore "npm run test:rules"` (Java 21).

The Firestore rules file is **not automatically deployed by the application Docker build**. Deploy this repository's named database configuration from an authenticated administrator session:

```sh
npx --yes firebase-tools@15.30.2 deploy --project gen-lang-client-0165298283 --config firebase.security-deploy.json --only firestore:rules
```

Refresh open app tabs after the server update so they send ID tokens. Verify one normal signed-in generation and that signed-out generation receives HTTP 401. Keep the server credential in the Cloud Run environment, never Vite client `define` values. Replace potentially exposed Gemini keys through the existing secret configuration, verify the replacement, then revoke the old key; this change does not prove whether a key was previously accessed.

Request limits are per server instance (600 requests/minute and 32 concurrent per UID). They are burst protection, not a distributed billing cap. Existing user access is preserved: Shorts permits verified signed-in users; Translate and Marketing require their existing approval records; Chart accepts existing user/admin roles.


## Shorts runtime release checks

The media container uses official Node 22 binaries and Ubuntu 26.10 (Stonking). Ubuntu supports this interim release through July 2027. Migrate to a supported successor before that date. Node 22 reaches end of life on April 30, 2027. Both image references are pinned to manifest-list digests for amd64 and arm64. Refresh the digests when validating security updates.

For the OS inventory, CI evaluates the official Canonical Stonking OCI CVE and USN OVAL definitions against the actual image's package manifest. It also evaluates an intentionally old package manifest as a positive control. An outstanding notice, an applicable high or critical vulnerability, or an inconclusive assessment fails the check. CI reports lower-severity findings for review. Trivy checks the installed Python renderer separately. Its OS findings cannot establish Stonking coverage when it identifies the image as Debian.

The runtime checks exercise the non-root production entry point, registered fonts, offline FFmpeg editor paths, Pillow native libraries and the copied Node binary. AMD64 is the production architecture. The native ARM64 job checks the caption runtime and Node ABI, TLS and ICU.
