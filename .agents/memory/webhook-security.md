---
name: Webhook security
description: Rules for authenticating payment and Telegram webhook callbacks.
---

All payment and Telegram webhook routes must fail closed: no secret or invalid signature means no business processing and no balance change.

**Why:** An unverified callback can otherwise forge a successful payment, change a withdrawal status, or execute an administrative Telegram action.

**How to apply:** Keep provider signature verification before any response or storage mutation. New providers need an explicit secret/signature scheme and a production configuration path before their webhook is enabled.