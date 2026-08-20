---
name: Webhook security
description: Rules for authenticating payment and Telegram webhook callbacks.
---

All payment and Telegram webhook routes must fail closed: no provider authentication means no business processing and no balance change.

**Why:** An unverified callback can otherwise forge a successful payment, change a withdrawal status, or execute an administrative Telegram action. MbiyoPay's public merchant callback documentation (checked August 2026) provides no signature header; requiring a generic HMAC rejects legitimate callbacks.

**How to apply:** Keep provider signature verification before any response or storage mutation when the provider documents a signature scheme. PayDunya checkout callbacks are form-encoded and JSON-wrap their payload under `data`; unwrap that payload before validating its SHA-512 master-key hash. For MbiyoPay, confirm the callback's transaction through the authenticated merchant API and require the returned provider transaction ID to match the locally stored payment, partner transaction, or withdrawal reference before mutation. Telegram command webhooks must be registered with the same `secret_token` that the route validates, or every incoming command will be rejected. New providers need an explicit authentication scheme and a production configuration path before their webhook is enabled.