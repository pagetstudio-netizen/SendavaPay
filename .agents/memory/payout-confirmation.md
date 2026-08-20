---
name: Payout confirmation
description: Reliable and secure confirmation rules for asynchronous payout providers.
---

For asynchronous payouts, persist the merchant-generated order ID before calling the provider. Treat an accepted submission as processing, not success. Resolve a final state only after an authenticated provider lookup confirms both the local order ID and the provider transaction ID.

**Why:** A provider callback can arrive before the submission response, be delayed, or be lost after a network timeout. Without a stored local correlation key and a safe reconciliation path, completed payouts remain stuck in processing; prematurely re-queuing ambiguous submissions can risk a duplicate payout.

**How to apply:** Reconcile stuck payouts using the provider's authenticated lookup by transaction ID or merchant order ID. Use compare-and-set state transitions, and make the final status change and ledger entry atomic so webhook retries and background reconciliation cannot duplicate accounting.