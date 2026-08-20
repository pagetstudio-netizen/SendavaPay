---
name: PayDunya disbursement status
description: Official status-check contract for PayDunya API PUSH withdrawals.
---

Use PayDunya's `POST /api/v2/disburse/check-status` with the `disburse_invoice`
token returned when the disbursement is initiated. The merchant-provided
`disburse_id` is a correlation value and is not accepted as a status token.

**Why:** A status lookup with the merchant `disburse_id` returns a not-found
response, leaving a payout ambiguous and inviting an unsafe duplicate retry.

**How to apply:** Persist the provider's `disburse_token` before a withdrawal
can be considered submitted, then poll it with the documented POST endpoint
after timeouts or missing callbacks. Treat the merchant `disburse_id` only as
the callback-to-local-request correlation key.