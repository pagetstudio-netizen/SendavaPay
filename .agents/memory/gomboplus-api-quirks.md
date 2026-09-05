---
name: GomboPlus API quirks
description: Non-obvious request and status-shape requirements for GomboPlus mobile services
---

## Rule
Send the recipient phone in the `number` field for both mobile deposit and mobile withdrawal requests. When checking status, trust the nested transaction status in `content.status` over a generic outer response message or outer status.

**Why:** GomboPlus rejected requests using `recipient_number` with a validation error, and returned an outer success response message while the nested transaction status was `failed`.

**How to apply:** Keep request payloads and status normalization aligned with these provider shapes; never mark a payment successful from the top-level message alone.