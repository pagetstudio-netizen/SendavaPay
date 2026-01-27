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
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit for database migrations (`drizzle-kit push`)

### Key Database Tables
- `users` - User accounts with roles (user/admin), balance, verification status
- `transactions` - All financial transactions (deposits, withdrawals, transfers)
- `transfers` - Peer-to-peer money transfers
- `paymentLinks` - Shareable payment links with unique codes
- `apiKeys` - Developer API keys for integration
- `kycRequests` - KYC verification requests with document paths
- `commissionSettings` - Configurable fee structures

### Authentication & Authorization
- Session-based authentication stored server-side
- Role-based access control (user vs admin)
- Protected routes on frontend via `ProtectedRoute` and `AdminRoute` components
- KYC verification workflow for user identity verification

### API Structure
- RESTful API endpoints under `/api/` prefix
- Authentication endpoints: `/api/auth/login`, `/api/auth/register`
- User endpoints: `/api/user`
- Payment link endpoints: `/api/pay/:code`
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
- **LeekPay** - Primary payment gateway for deposits and payment links
  - API Endpoint: https://api.leekpay.com/api/v1/checkout
  - Webhook URL: https://smart-glass.fun/api/webhook/leekpay
  - Supported currencies: XOF, XAF, CDF, EUR, USD
  - Flow: Create checkout → User redirected to LeekPay → Webhook notification on completion
- Mobile Money integration: MTN, Moov, Orange Money, TMoney, Airtel, Vodacom
- Currencies: XOF (Togo, Benin, Burkina Faso, Ivory Coast), XAF (Cameroun, Congo Brazzaville), CDF (RDC)

### Third-Party Services
- **LeekPay** - Payment processing (API key in SLACK_LIVE_API_KEY secret)
- **Nodemailer** - Email notifications
- **OpenAI / Google Generative AI** - AI features (listed in dependencies)

### File Storage
- Local filesystem for KYC documents (`uploads/kyc/`)
- Uppy with AWS S3 integration available for file uploads

### Development Tools
- Replit-specific Vite plugins for development
- TypeScript strict mode enabled
- Path aliases: `@/` for client source, `@shared/` for shared code