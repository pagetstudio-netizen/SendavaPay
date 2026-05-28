-- ============================================================
-- SendavaPay — Migration idempotente (safe to run multiple times)
-- Exécuté automatiquement par deploy.sh à chaque déploiement
-- ============================================================

-- ── ENUMS (créer si absents) ──────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'payment_received');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_link_status AS ENUM ('active', 'completed', 'expired', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE withdrawal_request_status AS ENUM ('pending', 'processing', 'approved', 'rejected', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE withdrawal_request_status ADD VALUE IF NOT EXISTS 'processing';
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE withdrawal_request_status ADD VALUE IF NOT EXISTS 'failed';
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE api_transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE api_transaction_type AS ENUM ('payment', 'credit', 'refund', 'payout');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE leekpay_payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE merchant_status AS ENUM ('active', 'suspended', 'pending');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE admin_notification_type AS ENUM ('transaction', 'kyc', 'withdrawal', 'user', 'system');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE wallet_exchange_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE partner_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE partner_log_action AS ENUM ('login', 'logout', 'profile_update', 'api_call', 'payment_received', 'error', 'system');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── TABLE: users ──────────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS api_sdk_enabled        BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS api_redirect_enabled   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_deposit_fee_rate    DECIMAL(5,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_withdrawal_fee_rate DECIMAL(5,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_api_payment_fee_rate DECIMAL(5,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_api_sdk_fee_rate    DECIMAL(5,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_personal_fee_rate   DECIMAL(5,2);

-- ── TABLE: transactions ───────────────────────────────────────────────────────
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS admin_note    TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payer_country TEXT;

-- ── TABLE: api_keys ───────────────────────────────────────────────────────────
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS api_type      TEXT NOT NULL DEFAULT 'redirect';
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS app_name      TEXT;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

-- ── TABLE: api_transactions ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_transactions (
  id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id             INTEGER NOT NULL REFERENCES users(id),
  api_key_id          INTEGER REFERENCES api_keys(id),
  reference           TEXT NOT NULL UNIQUE,
  external_reference  TEXT,
  type                api_transaction_type NOT NULL,
  amount              DECIMAL(15,2) NOT NULL,
  fee                 DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency            TEXT NOT NULL DEFAULT 'XOF',
  status              api_transaction_status NOT NULL DEFAULT 'pending',
  description         TEXT,
  customer_email      TEXT,
  customer_phone      TEXT,
  customer_name       TEXT,
  payment_method      TEXT,
  callback_url        TEXT,
  redirect_url        TEXT,
  metadata            TEXT,
  webhook_sent        BOOLEAN NOT NULL DEFAULT FALSE,
  webhook_attempts    INTEGER NOT NULL DEFAULT 0,
  webhook_last_attempt TIMESTAMP,
  payment_token       TEXT UNIQUE,
  token_expires_at    TIMESTAMP,
  ip_address          TEXT,
  user_agent          TEXT,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE api_transactions ADD COLUMN IF NOT EXISTS payment_token        TEXT UNIQUE;
ALTER TABLE api_transactions ADD COLUMN IF NOT EXISTS token_expires_at     TIMESTAMP;
ALTER TABLE api_transactions ADD COLUMN IF NOT EXISTS ip_address           TEXT;
ALTER TABLE api_transactions ADD COLUMN IF NOT EXISTS user_agent           TEXT;
ALTER TABLE api_transactions ADD COLUMN IF NOT EXISTS webhook_attempts     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE api_transactions ADD COLUMN IF NOT EXISTS webhook_last_attempt TIMESTAMP;
ALTER TABLE api_transactions ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMP NOT NULL DEFAULT NOW();

-- ── TABLE: leekpay_payments ───────────────────────────────────────────────────
ALTER TABLE leekpay_payments ADD COLUMN IF NOT EXISTS payer_country TEXT;

-- ── TABLE: payment_links ──────────────────────────────────────────────────────
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS partner_id INTEGER;
ALTER TABLE payment_links ALTER COLUMN user_id DROP NOT NULL;

-- ── TABLE: wallets ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallets (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  currency     TEXT NOT NULL,
  balance      DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── TABLE: wallet_exchanges ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallet_exchanges (
  id                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(id),
  from_wallet_id    INTEGER NOT NULL REFERENCES wallets(id),
  to_wallet_id      INTEGER NOT NULL REFERENCES wallets(id),
  from_country_code TEXT NOT NULL,
  to_country_code   TEXT NOT NULL,
  currency          TEXT NOT NULL,
  amount            DECIMAL(15,2) NOT NULL,
  fee               DECIMAL(15,2) NOT NULL DEFAULT 0,
  status            wallet_exchange_status NOT NULL DEFAULT 'pending',
  admin_note        TEXT,
  reviewed_by       INTEGER REFERENCES users(id),
  reviewed_at       TIMESTAMP,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── TABLE: withdrawal_requests ────────────────────────────────────────────────
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS wallet_name           TEXT;
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS wallet_id             INTEGER;
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS external_reference    TEXT;
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS transaction_reference TEXT;
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS processed_at          TIMESTAMP;

-- ── TABLE: withdrawal_numbers ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS withdrawal_numbers (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  phone_number TEXT NOT NULL,
  operator     TEXT NOT NULL,
  country      TEXT NOT NULL,
  wallet_name  TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── TABLE: countries ──────────────────────────────────────────────────────────
ALTER TABLE countries ADD COLUMN IF NOT EXISTS encaissement_fee_rate DECIMAL(5,2);
ALTER TABLE countries ADD COLUMN IF NOT EXISTS api_fee_rate          DECIMAL(5,2);

-- ── TABLE: operators ──────────────────────────────────────────────────────────
ALTER TABLE operators ADD COLUMN IF NOT EXISTS maintenance_deposit       BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE operators ADD COLUMN IF NOT EXISTS maintenance_withdraw      BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE operators ADD COLUMN IF NOT EXISTS maintenance_payment_link  BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE operators ADD COLUMN IF NOT EXISTS maintenance_api           BOOLEAN NOT NULL DEFAULT FALSE;

-- ── TABLE: partners ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partners (
  id               INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL UNIQUE,
  password         TEXT NOT NULL,
  phone            TEXT,
  slug             TEXT NOT NULL UNIQUE,
  logo             TEXT,
  description      TEXT,
  website          TEXT,
  api_key          TEXT NOT NULL UNIQUE,
  api_secret       TEXT NOT NULL,
  commission_rate  DECIMAL(5,2) NOT NULL DEFAULT 5,
  balance          DECIMAL(15,2) NOT NULL DEFAULT 0,
  status           partner_status NOT NULL DEFAULT 'active',
  webhook_url      TEXT,
  callback_url     TEXT,
  primary_color    TEXT DEFAULT '#0070F3',
  allowed_countries TEXT,
  allowed_operators TEXT,
  enable_deposit       BOOLEAN NOT NULL DEFAULT TRUE,
  enable_withdrawal    BOOLEAN NOT NULL DEFAULT TRUE,
  enable_payment_links BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login_at    TIMESTAMP
);

ALTER TABLE partners ADD COLUMN IF NOT EXISTS allowed_countries  TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS allowed_operators  TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS enable_deposit     BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS enable_withdrawal  BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS enable_payment_links BOOLEAN NOT NULL DEFAULT TRUE;

-- ── TABLE: partner_logs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partner_logs (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  partner_id INTEGER NOT NULL REFERENCES partners(id),
  action     partner_log_action NOT NULL,
  details    TEXT,
  ip_address TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── TABLE: partner_transactions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partner_transactions (
  id               INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  partner_id       INTEGER NOT NULL REFERENCES partners(id),
  reference        TEXT NOT NULL UNIQUE,
  amount           DECIMAL(15,2) NOT NULL,
  fee              DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency         TEXT NOT NULL DEFAULT 'XOF',
  status           api_transaction_status NOT NULL DEFAULT 'pending',
  customer_name    TEXT,
  customer_email   TEXT,
  customer_phone   TEXT,
  payment_method   TEXT,
  description      TEXT,
  callback_url     TEXT,
  redirect_url     TEXT,
  metadata         TEXT,
  webhook_sent     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMP
);

-- ── TABLE: partner_wallets ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partner_wallets (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  partner_id   INTEGER NOT NULL REFERENCES partners(id),
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  currency     TEXT NOT NULL,
  balance      DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── TABLE: security tables ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocked_ips (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  reason     TEXT,
  blocked_by INTEGER,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email_or_phone TEXT NOT NULL,
  ip_address     TEXT,
  success        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_events (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    INTEGER,
  type       TEXT NOT NULL,
  details    TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_codes_v2 (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  code       TEXT NOT NULL,
  type       TEXT NOT NULL,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at    TIMESTAMP,
  ip_address TEXT,
  metadata   TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otpv2_token   ON otp_codes_v2(token);
CREATE INDEX IF NOT EXISTS idx_otpv2_expires ON otp_codes_v2(expires_at);

-- ── TABLE: password_reset_tokens ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  token      TEXT NOT NULL UNIQUE,
  code       TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at    TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Done ──────────────────────────────────────────────────────────────────────
SELECT 'Migration terminee avec succes' AS status;
