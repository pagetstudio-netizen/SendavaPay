ALTER TYPE "public"."api_transaction_status" ADD VALUE 'queued' BEFORE 'processing';--> statement-breakpoint
ALTER TYPE "public"."api_transaction_status" ADD VALUE 'provider_pending' BEFORE 'completed';--> statement-breakpoint
ALTER TYPE "public"."api_transaction_status" ADD VALUE 'reversed' BEFORE 'cancelled';--> statement-breakpoint
CREATE TABLE "blocked_ips" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "blocked_ips_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"ip_address" text NOT NULL,
	"reason" text,
	"blocked_by" integer,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blocked_ips_ip_address_unique" UNIQUE("ip_address")
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "login_attempts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email_or_phone" text NOT NULL,
	"ip_address" text,
	"success" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "otp_codes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"code" text NOT NULL,
	"type" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"ip_address" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "otp_codes_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "security_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "security_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer,
	"type" text NOT NULL,
	"details" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "api_type" text DEFAULT 'redirect' NOT NULL;--> statement-breakpoint
ALTER TABLE "api_transactions" ADD COLUMN "payment_token" text;--> statement-breakpoint
ALTER TABLE "api_transactions" ADD COLUMN "token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "partner_wallet_exchanges" ADD COLUMN "fee_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "partner_wallet_exchanges" ADD COLUMN "fee_amount" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "partner_wallet_exchanges" ADD COLUMN "net_amount" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "api_sdk_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "api_redirect_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "custom_deposit_fee_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "custom_withdrawal_fee_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "custom_api_payment_fee_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "custom_api_sdk_fee_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "custom_personal_fee_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "wallet_exchanges" ADD COLUMN "fee" numeric(15, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD COLUMN "wallet_id" integer;--> statement-breakpoint
ALTER TABLE "blocked_ips" ADD CONSTRAINT "blocked_ips_blocked_by_users_id_fk" FOREIGN KEY ("blocked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_transactions" ADD CONSTRAINT "api_transactions_payment_token_unique" UNIQUE("payment_token");