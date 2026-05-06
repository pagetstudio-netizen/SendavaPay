# SendavaPay

A fintech payment platform for West and Central African markets enabling Mobile Money deposits, withdrawals, transfers, and payment links.

## Run & Operate

- **Dev**: `npm run dev` (uses `npx tsx server/index.ts`)
- **Build**: `npm run build`
- **Start (prod)**: `npm start`
- **DB push**: `npm run db:push`
- **Typecheck**: `npm run check`

Required env vars: `SUPABASE_DATABASE_URL`, `SOLEASPAY_API_KEY`, `SOLEASPAY_SECRET_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `WINIPAYER_MERCHANT_APPLY`, `WINIPAYER_MERCHANT_TOKEN`, `WINIPAYER_PRIVATE_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui, Wouter routing, TanStack React Query
- **Backend**: Node.js, Express.js, TypeScript (ESM)
- **Auth**: Session-based (express-session + bcrypt) — no external auth provider
- **Database**: Supabase PostgreSQL via Drizzle ORM
- **Email**: Resend via Replit connector integration
- **File storage**: Replit Object Storage + Supabase Storage for KYC docs
- **Build**: Vite (frontend), esbuild (backend)

## Where things live

- `client/src/` — React app (pages/, components/, hooks/, lib/)
- `server/` — Express backend (routes.ts, storage.ts, db.ts, credentials.ts)
- `shared/schema.ts` — Drizzle DB schema (source of truth)
- `server/replit_integrations/object_storage/` — Replit Object Storage integration
- `server/soleaspay.ts`, `server/leekpay.ts`, `server/maishapay.ts`, `server/omnipay.ts`, `server/paxity.ts` — payment gateway clients
- `server/partner-routes.ts` — partner sub-system routes
- `sdk/` — JS, PHP, Python merchant SDK clients

## Architecture decisions

- Credentials (API keys) are stored in the DB `site_settings` table under `cred_*` keys and loaded at startup, allowing admin-managed configuration without redeployment
- App starts even when DB is unavailable (degraded mode) with background reconnection every 15s
- Partner system is a separate auth realm (`req.session.partnerId`) with own tables (`partners`, `partner_logs`, `partner_transactions`)
- Email uses Resend via Replit's connector API (`REPLIT_CONNECTORS_HOSTNAME`) — not a hardcoded API key
- Payment gateway selection is dynamic per country/operator combination

## Product

- User registration, login, KYC identity verification
- Mobile Money deposits (SoleasPay USSD, MaishaPay, OmniPay, Paxity, LeekPay checkout)
- Instant withdrawals (WiniPayer auto-payout for supported operators, admin-approved for others)
- Peer-to-peer transfers between SendavaPay accounts
- Shareable payment links with unique codes
- Partner system with SDK for merchant API integration
- Admin dashboard: user management, transaction oversight, KYC approval, fee settings, partner management, Telegram notifications

## User Preferences

- Simple, everyday language preferred
- App is in French (fr-FR locale)

## Gotchas

- `tsx` is a devDependency; workflow uses `npx tsx` (not bare `tsx`) to ensure it resolves from `node_modules/.bin`
- DB uses only `SUPABASE_DATABASE_URL` — Replit's built-in PostgreSQL module is present but not connected
- `drizzle.config.ts` falls back to `DATABASE_URL` if `SUPABASE_DATABASE_URL` is missing
- Telegram webhook is hardcoded to `https://sendavapay.com/api/webhook/telegram` — update for Replit deployment domain
- SoleasPay API endpoint uses lowercase `v3` in path

## Pointers

- Replit Object Storage skill: `.local/skills/environment-secrets/SKILL.md`
- Drizzle schema: `shared/schema.ts`
- Session setup: `server/routes.ts` lines ~176+
