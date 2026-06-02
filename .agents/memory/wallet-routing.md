---
name: Wallet routing fix
description: Root cause and fix for Mobile Money deposits crediting wrong country wallet
---

## Rule
`payerCountry` must be stored explicitly at payment initiation. Never rely solely on inferring the country from `paymentMethod` string at webhook time.

## Why
Two separate bugs caused wrong wallet credits:

### Bug 1 — LeekPay/regular deposits (fixed earlier)
When `payerCountry` was missing from the `leekpay_payments` record, the fallback used `paymentMethod.trim().split(/\s+/).pop()` (last whitespace-separated word). This failed in edge cases, causing credits to the wrong wallet.

### Bug 2 — SDK payments via `completeApiTransactionFromWebhook` (fixed 2026-06-02)
- `initiate-payment` endpoint called `updateApiTransaction(...)` WITHOUT saving `payerCountry` → `payer_country` stayed NULL in `api_transactions`
- `completeApiTransactionFromWebhook` ignored `row.payer_country` entirely and tried to detect the country by parsing `payment_method` string
- `detectCountryFromMethod()` had `return "TG"` as default fallback → ALL unrecognized payment methods were credited to TG wallet
- Example: CI payment using XOF → payment_method didn't match any CI pattern → defaulted to TG wallet

## How to apply

### SDK payments (sdk-api.ts)
- `updateApiTransaction(transaction.id, { ..., payerCountry: payerCountry })` must always be called in `initiate-payment` after computing `payerCountry`
- `detectCountryFromMethod()` must return `null` (not `"TG"`) when nothing matches — never assume a default country

### completeApiTransactionFromWebhook (routes.ts)
- Primary source: `row.payer_country` (stored at initiation) — use `?.toUpperCase()` directly
- Fallback: keyword-based detection on `payment_method` only when `payer_country` is null
- No "default country" fallback — if country cannot be determined, log a warning and skip wallet credit rather than crediting the wrong wallet
- Log every credit as: `[PAYMENT CREDIT ROUTING] reference=... | payerCountry_db=... | walletSélectionné=... | montant=... | soldeAvant=... → soldeAprès=...`

### Regular deposits (leekpay_payments)
- `storage.createLeekpayPayment(...)` must include `payerCountry: service.countryCode || null`
- Fixed locations: PayDunya SoftPay, PayDunya checkout, SoleasPay
