# SendavaPay

## Overview

SendavaPay is a fintech payment platform designed for West African markets (Togo, Benin, Burkina Faso, etc.). The application enables users to create payment links, transfer money, make deposits, and perform instant withdrawals via Mobile Money providers (MTN, Moov, Orange, TMoney). The platform includes both user-facing dashboards and an admin panel for managing users, transactions, KYC verification, and commission settings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens following Stripe/Revolut-inspired fintech aesthetics
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **Session Management**: express-session with memory store
- **File Uploads**: Multer for KYC document uploads
- **Authentication**: Session-based auth with bcrypt password hashing

### Data Storage
- **Database**: Supabase PostgreSQL (SUPABASE_DATABASE_URL)
  - The application connects EXCLUSIVELY to Supabase - no Replit database connection
  - Connection configured in `server/db.ts` using only `SUPABASE_DATABASE_URL`
  - Note: `drizzle.config.ts` uses `DATABASE_URL` for migrations only (cannot be edited)
  - For schema changes, use direct SQL commands to Supabase via psql
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Direct SQL to Supabase (drizzle-kit uses separate DATABASE_URL)

### Key Database Tables
- `users` - User accounts with roles (user/admin), balance, verification status
- `transactions` - All financial transactions (deposits, withdrawals, transfers)
- `transfers` - Peer-to-peer money transfers
- `paymentLinks` - Shareable payment links with unique codes (has optional `partner_id` column for partner-created links)
- `apiKeys` - Developer API keys for integration
- `kycRequests` - KYC verification requests with document paths
- `commissionSettings` - Configurable fee structures (deposit, encaissement, withdrawal rates)
- `feeChanges` - Audit trail for fee rate modifications
- `partners` - Partner accounts with separate auth, API keys, slugs, commission rates
- `partnerLogs` - Activity logs for partner actions (login, API calls, profile updates)
- `partnerTransactions` - Transactions processed through partner SDK/API

### Authentication & Authorization
- Session-based authentication stored server-side
- Role-based access control (user vs admin)
- Partner authentication: separate session-based login (`req.session.partnerId`)
- Partner API SDK: API key + secret authentication for external integrations
- Protected routes on frontend via `ProtectedRoute` and `AdminRoute` components
- KYC verification workflow for user identity verification

### Partner System
- **Two admin levels**: Super Admin (full access via admin dashboard) and Partner Admin (restricted to own account)
- **Partner routes**: `server/partner-routes.ts` - auth, profile, stats, transactions, logs, API SDK, deposit, withdraw, payment links
- **Partner dashboard**: `/partner/dashboard` with sidebar (stats, deposit, withdraw, payment links, profile, transactions, logs, API keys, support)
- **Partner financial operations**: Partners can make deposits (SoleasPay), request withdrawals, and create payment links from their dashboard
- **Partner login**: `/partner/login` - separate from main user/admin auth
- **Public partner pages**: `/partner.by_<slug>` - shows partner info or "Accès non autorisé" if inactive
- **Admin management**: `/admin/partners` tab for creating, editing, toggling, deleting partners
- **SDK API endpoints**: `/api/sdk/create-payment`, `/api/sdk/payment/:reference`, `/api/sdk/transactions`, `/api/sdk/balance`
- **SDK authentication**: `X-Partner-Key` and `X-Partner-Secret` headers

### API Structure
- RESTful API endpoints under `/api/` prefix
- Authentication endpoints: `/api/auth/login`, `/api/auth/register`
- Partner auth endpoints: `/api/partner/login`, `/api/partner/logout`, `/api/partner/me`
- Partner SDK endpoints: `/api/sdk/create-payment`, `/api/sdk/payment/:reference`
- Admin partner endpoints: `/api/admin/partners`, `/api/admin/create-partner`
- User endpoints: `/api/user`
- Payment link endpoints: `/api/pay/:code`
- Public partner page: `/api/partner-page/:slug`
- All API responses are JSON

### Project Structure
```
client/           # React frontend
  src/
    components/   # Reusable UI components
    pages/        # Route pages (dashboard, admin, auth)
    lib/          # Utilities, auth context, query client
    hooks/        # Custom React hooks
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API route definitions
  storage.ts      # Database access layer
  db.ts           # Database connection
shared/           # Shared code between client/server
  schema.ts       # Drizzle database schema
```

## External Dependencies

### Payment Providers
- **SoleasPay** - Primary payment gateway for deposits and payment links (replaced LeekPay)
  - API Endpoint: https://soleaspay.com/api/agent/bills/V3
  - Verification: https://soleaspay.com/api/agent/verif-pay
  - Webhook URL: https://sendavapay.com/api/webhook/soleaspay
  - Supported currencies: XOF, XAF, CDF
  - Flow: Direct API call with wallet number → User confirms on phone → Polling verification every 3 seconds
  - Service IDs by country/operator defined in server/soleaspay.ts
- **Supported Countries/Operators**:
  - Bénin (BJ): MTN (35), Moov (36)
  - Burkina Faso (BF): Moov (33), Orange (34)
  - Togo (TG): T-Money (37), Moov (38)
  - Cameroun (CM): MTN (1), Orange (2)
  - Côte d'Ivoire (CI): Orange (29), MTN (30), Moov (31), Wave (32)
  - RDC (COD): Vodacom (52), Airtel (53), Orange (54)
  - Congo Brazzaville (COG): Airtel (55), MTN (56)
- Currencies: XOF (Togo, Benin, Burkina Faso, Ivory Coast), XAF (Cameroun, Congo Brazzaville), CDF (RDC)

### Third-Party Services
- **SoleasPay** - Payment processing (API key in SOLEASPAY_API_KEY secret)
- **Nodemailer** - Email notifications
- **Telegram Bot** - Real-time admin notifications for all transactions (server/telegram.ts)
  - Sends alerts for: new users, deposits, payment link payments, API payments, withdrawal requests, withdrawal approvals/rejections
  - Uses TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID secrets
  - Bot username: @SendavaPaybot
- **OpenAI / Google Generative AI** - AI features (listed in dependencies)

### File Storage
- Local filesystem for KYC documents (`uploads/kyc/`)
- Uppy with AWS S3 integration available for file uploads

### Development Tools
- Replit-specific Vite plugins for development
- TypeScript strict mode enabled
- Path aliases: `@/` for client source, `@shared/` for shared code

## Deployment Requirements

### Required Secrets
The following secrets must be configured in deployment environment:
- **SUPABASE_DATABASE_URL** - PostgreSQL connection string for Supabase database
- **SOLEASPAY_API_KEY** - SoleasPay payment gateway API key
- **TELEGRAM_BOT_TOKEN** - Telegram bot token for admin notifications
- **TELEGRAM_CHAT_ID** - Telegram chat ID to receive notifications

### Server Configuration
- The server includes connection retry logic (3 attempts with exponential backoff)
- Database connection pooling with 10 max connections
- Health check endpoint available at `/api/health`
- Server will start even if database connection fails (degraded mode)