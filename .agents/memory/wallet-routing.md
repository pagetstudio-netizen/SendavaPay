---
name: Wallet routing fix
description: Root cause and fix for Mobile Money deposits crediting wrong country wallet
---

## Rule
Always store `payerCountry: service.countryCode` when creating the pending LeekPay payment record for SoleasPay and PayDunya deposits. Do NOT rely on inferring the country later from paymentMethod string.

## Why
When `payerCountry` was missing from the leekpay_payments record, the fallback used `paymentMethod.trim().split(/\s+/).pop()` (last whitespace-separated word). This worked for `"soleaspay_T-MONEY TG"` → `"TG"` but failed in edge cases (e.g. if paymentMethod had no space, or the last segment wasn't a valid 2-letter country code), causing the credit to fall through to `syncWalletsFromTransactions` which could pick another wallet.

## How to apply
- `storage.createLeekpayPayment(...)` calls in deposit routes must always include `payerCountry: service.countryCode || null`
- Three fixed locations: PayDunya SoftPay (line ~1430), PayDunya checkout (line ~1479), SoleasPay (line ~1533)
- The transaction record created on completion (line ~1613) also gets `payerCountry: existingPayment.payerCountry || null`
- The country code fallback in wallet credit logic now uses segment matching with an explicit allowlist: `["TG","BJ","SN","CI","ML","BF","CM","GN","CG","COD","COG"]`
