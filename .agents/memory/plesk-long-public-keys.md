---
name: Plesk long public keys
description: Deployment pattern for provider public keys that exceed Plesk environment-variable limits
---

## Rule
When Plesk rejects a public key because an environment variable exceeds its length limit, keep the key in a protected file outside the repository and configure only its filesystem path as the environment variable.

**Why:** Some provider public keys are PEM or long token values and cannot fit in Plesk's 255-character environment-variable field, while the application still needs the complete value at runtime.

**How to apply:** Prefer `GOMBOPLUS_PUBLIC_KEY_PATH` pointing to a private Plesk file; keep private credentials such as `GOMBOPLUS_PRIVATE_KEY` in the secret/environment-variable store.