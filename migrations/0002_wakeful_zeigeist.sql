CREATE TABLE "blacklist_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "blacklist_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"action" text NOT NULL,
	"phone_number" text NOT NULL,
	"admin_id" integer,
	"admin_name" text,
	"ip_address" text,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phone_blacklist" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "phone_blacklist_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"phone_number" text NOT NULL,
	"reason" text,
	"added_by" integer,
	"added_by_name" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "phone_blacklist_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "sdk_withdrawal_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sdk_withdrawal_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"reference" text NOT NULL,
	"merchant_id" integer,
	"merchant_email" text NOT NULL,
	"wallet_id" integer,
	"wallet_country" text,
	"balance_before" numeric(15, 2),
	"amount_requested" numeric(15, 2) NOT NULL,
	"fee_applied" numeric(15, 2),
	"total_debited" numeric(15, 2),
	"balance_after" numeric(15, 2),
	"user_balance_before" numeric(15, 2),
	"user_balance_after" numeric(15, 2),
	"debit_success" boolean DEFAULT false,
	"phone_number" text,
	"operator" text,
	"gateway" text,
	"gateway_reference" text,
	"gateway_raw_response" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "api_transactions" ADD COLUMN "payer_country" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "phone_blacklist" ADD CONSTRAINT "phone_blacklist_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sdk_withdrawal_logs" ADD CONSTRAINT "sdk_withdrawal_logs_merchant_id_users_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;