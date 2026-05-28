---
name: Custom fee priority
description: How per-user custom fees override country and global rates
---

## Rule
Fee resolution order (highest priority first):
1. User-level override (nullable decimals on `users` table)
2. Country-level rate (`countries` table)
3. Global rate (`commission_settings` table)

## Fields on users table
- `custom_deposit_fee_rate` DECIMAL(5,2) — deposits
- `custom_withdrawal_fee_rate` DECIMAL(5,2) — withdrawals
- `custom_api_payment_fee_rate` DECIMAL(5,2) — API/payment links received
- `custom_api_sdk_fee_rate` DECIMAL(5,2) — SDK withdrawals (default 1%)
- `custom_personal_fee_rate` DECIMAL(5,2) — personal transactions

## How to apply
- `getEffectiveFeeRate(userId, type, settings)` in `server/routes.ts` checks user overrides first
- SDK withdrawal fee in `server/sdk-api.ts` reads `(sdkUser as any).customApiSdkFeeRate` before defaulting to 1%
- Admin sets fees via `PUT /api/admin/users/:id/custom-fees`
- Null/empty value = inherit from country/global
