# SendavaPay

A fintech payment platform for West and Central African markets enabling Mobile Money deposits, withdrawals, transfers, and payment links.

## Run & Operate

- **Replit preview**: the `Start application` workflow runs `npm run dev` on port 5000.
- **Dev**: `npm run dev` (uses the local `tsx` executable to serve the app on port 5000)
- **Build**: `npm run build`
- **Start (prod)**: `npm start`
- **DB push**: `npm run db:push`
- **Typecheck**: `npm run check`

Required env vars (Plesk uniquement — jamais en base): `SUPABASE_DATABASE_URL`, `SUPABASE_URL`, `SESSION_SECRET`, `SOLEASPAY_API_KEY`, `SOLEASPAY_SECRET_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_ADMIN_CHAT_IDS`, `SUPABASE_SERVICE_ROLE_KEY`, `OMNIPAY_API_KEY`, `OMNIPAY_CALLBACK_KEY`, `MAISHAPAY_PUBLIC_KEY`, `MAISHAPAY_SECRET_KEY`, `MAISHAPAY_WEBHOOK_SECRET`, `PAXITY_API_KEY`, `PAXITY_WEBHOOK_SECRET`, `MBIYOPAY_API_KEY`, `PAYDUNYA_MASTER_KEY`, `PAYDUNYA_PRIVATE_KEY`, `PAYDUNYA_TOKEN`, `LEEKPAY_SECRET_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
Optional KYC storage: `SUPABASE_KYC_URL`, `SUPABASE_KYC_SERVICE_ROLE_KEY` (compte Supabase dédié aux documents KYC)

## Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui, Wouter routing, TanStack React Query
- **Backend**: Node.js, Express.js, TypeScript (ESM)
- **Auth**: Session-based (express-session + bcrypt) — no external auth provider
- **Database**: Supabase PostgreSQL via Drizzle ORM (SUPABASE_DATABASE_URL)
- **Email**: Resend via Replit connector integration
- **File storage**: Replit Object Storage + Supabase Storage for KYC docs
- **Build**: Vite (frontend), esbuild (backend)

## Where things live

- `client/src/` — React app (pages/, components/, hooks/, lib/)
- `server/` — Express backend (routes.ts, storage.ts, db.ts, credentials.ts)
- `shared/schema.ts` — Drizzle DB schema (source of truth)
- `server/replit_integrations/object_storage/` — Replit Object Storage integration
- `server/soleaspay.ts`, `server/leekpay.ts`, `server/maishapay.ts`, `server/omnipay.ts`, `server/paxity.ts`, `server/mbiyopay.ts` — payment gateway clients
- `server/partner-routes.ts` — partner sub-system routes
- `sdk/` — JS, PHP, Python merchant SDK clients

## Architecture decisions

- Credentials and webhook secrets are read from Plesk/Replit environment variables and are never written to the database.
- App starts even when DB is unavailable (degraded mode) with background reconnection every 15s
- Partner system is a separate auth realm (`req.session.partnerId`) with own tables (`partners`, `partner_logs`, `partner_transactions`)
- Email uses Resend via Replit's connector API (`REPLIT_CONNECTORS_HOSTNAME`) — not a hardcoded API key
- Payment gateway selection is dynamic per country/operator combination

## Product

- User registration, login, KYC identity verification
- Mobile Money deposits (SoleasPay USSD, MaishaPay, OmniPay, Paxity, MbiyoPay, LeekPay checkout)
- Instant withdrawals (auto-payout for supported operators, admin-approved for others)
- Peer-to-peer transfers between SendavaPay accounts
- Shareable payment links with unique codes
- Partner system with SDK for merchant API integration
- Admin dashboard: user management, transaction oversight, KYC approval, fee settings, partner management, Telegram notifications

## User Preferences

- Simple, everyday language preferred
- App is in French (fr-FR locale)

## Gotchas

- `tsx` is a devDependency; workflow uses `npx tsx` (not bare `tsx`) to ensure it resolves from `node_modules/.bin`
- DB uses only `SUPABASE_DATABASE_URL` — Replit's built-in PostgreSQL env vars are present but not used by the app
- `drizzle.config.ts` falls back to `DATABASE_URL` if `SUPABASE_DATABASE_URL` is missing
- Telegram webhook is hardcoded to `https://sendavapay.com/api/webhook/telegram` — update for Replit deployment domain
- SoleasPay API endpoint uses lowercase `v3` in path
- Admin bootstrap is disabled unless explicit `ADMIN_EMAIL_*`, `ADMIN_PHONE_*`, and `ADMIN_DEFAULT_PASSWORD` variables are configured.

## Pointers

- Replit Object Storage skill: `.local/skills/environment-secrets/SKILL.md`
- Drizzle schema: `shared/schema.ts`
- Session setup: `server/routes.ts` lines ~176+
