import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const kycStatusEnum = pgEnum("kyc_status", ["pending", "approved", "rejected"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["deposit", "withdrawal", "transfer_in", "transfer_out", "payment_received"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "failed", "cancelled"]);
export const paymentLinkStatusEnum = pgEnum("payment_link_status", ["active", "completed", "expired", "cancelled"]);

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").default("user").notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0").notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  isBlocked: boolean("is_blocked").default(false).notNull(),
  country: text("country"),
  merchantName: text("merchant_name"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const kycRequests = pgTable("kyc_requests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  country: text("country").notNull(),
  documentType: text("document_type").notNull(),
  documentNumber: text("document_number"),
  documentFrontPath: text("document_front_path").notNull(),
  documentBackPath: text("document_back_path").notNull(),
  selfiePath: text("selfie_path").notNull(),
  status: kycStatusEnum("status").default("pending").notNull(),
  rejectionReason: text("rejection_reason"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  fee: decimal("fee", { precision: 15, scale: 2 }).default("0").notNull(),
  netAmount: decimal("net_amount", { precision: 15, scale: 2 }).notNull(),
  status: transactionStatusEnum("status").default("pending").notNull(),
  description: text("description"),
  externalRef: text("external_ref"),
  mobileNumber: text("mobile_number"),
  payerName: text("payer_name"),
  payerEmail: text("payer_email"),
  payerCountry: text("payer_country"),
  paymentMethod: text("payment_method"),
  paymentLinkId: integer("payment_link_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transfers = pgTable("transfers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  status: transactionStatusEnum("status").default("completed").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const paymentLinks = pgTable("payment_links", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  linkCode: text("link_code").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  productImage: text("product_image"),
  allowCustomAmount: boolean("allow_custom_amount").default(false).notNull(),
  minimumAmount: decimal("minimum_amount", { precision: 15, scale: 2 }),
  redirectUrl: text("redirect_url"),
  status: paymentLinkStatusEnum("status").default("active").notNull(),
  paidAt: timestamp("paid_at"),
  payerName: text("payer_name"),
  payerEmail: text("payer_email"),
  payerPhone: text("payer_phone"),
  payerCountry: text("payer_country"),
  paidAmount: decimal("paid_amount", { precision: 15, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const apiKeys = pgTable("api_keys", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  apiKey: text("api_key").notNull().unique(),
  name: text("name").notNull(),
  appName: text("app_name"),
  redirectUrl: text("redirect_url"),
  webhookUrl: text("webhook_url"),
  webhookSecret: text("webhook_secret"),
  isActive: boolean("is_active").default(true).notNull(),
  lastUsedAt: timestamp("last_used_at"),
  requestCount: integer("request_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commissionSettings = pgTable("commission_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  depositRate: decimal("deposit_rate", { precision: 5, scale: 2 }).default("7").notNull(),
  encaissementRate: decimal("encaissement_rate", { precision: 5, scale: 2 }).default("7").notNull(),
  withdrawalRate: decimal("withdrawal_rate", { precision: 5, scale: 2 }).default("7").notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const feeChanges = pgTable("fee_changes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  adminId: integer("admin_id").references(() => users.id),
  fieldChanged: text("field_changed").notNull(),
  oldValue: decimal("old_value", { precision: 5, scale: 2 }).notNull(),
  newValue: decimal("new_value", { precision: 5, scale: 2 }).notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const socialLinks = pgTable("social_links", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  platform: text("platform").notNull().unique(),
  url: text("url"),
  isActive: boolean("is_active").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const withdrawalRequestStatusEnum = pgEnum("withdrawal_request_status", ["pending", "processing", "approved", "rejected", "failed"]);

export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  fee: decimal("fee", { precision: 15, scale: 2 }).notNull(),
  netAmount: decimal("net_amount", { precision: 15, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  mobileNumber: text("mobile_number").notNull(),
  country: text("country").notNull(),
  walletName: text("wallet_name"),
  status: withdrawalRequestStatusEnum("status").default("pending").notNull(),
  externalReference: text("external_reference"),
  transactionReference: text("transaction_reference"),
  rejectionReason: text("rejection_reason"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leekpayPaymentStatusEnum = pgEnum("leekpay_payment_status", ["pending", "processing", "completed", "failed", "cancelled", "expired"]);

export const leekpayPayments = pgTable("leekpay_payments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  leekpayPaymentId: text("leekpay_payment_id").notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  paymentLinkId: integer("payment_link_id").references(() => paymentLinks.id),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").default("XOF").notNull(),
  type: text("type").notNull(),
  status: leekpayPaymentStatusEnum("status").default("pending").notNull(),
  description: text("description"),
  customerEmail: text("customer_email"),
  payerName: text("payer_name"),
  payerPhone: text("payer_phone"),
  payerCountry: text("payer_country"),
  paymentMethod: text("payment_method"),
  returnUrl: text("return_url"),
  paymentUrl: text("payment_url"),
  webhookReceived: boolean("webhook_received").default(false).notNull(),
  webhookData: text("webhook_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const withdrawalNumbers = pgTable("withdrawal_numbers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  phoneNumber: text("phone_number").notNull(),
  operator: text("operator").notNull(),
  country: text("country").notNull(),
  walletName: text("wallet_name"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const countries = pgTable("countries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  currency: text("currency").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const operators = pgTable("operators", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  countryId: integer("country_id").notNull().references(() => countries.id),
  logo: text("logo"),
  type: text("type").default("mobile_money").notNull(),
  dailyLimit: text("daily_limit").default("1000000"),
  paymentGateway: text("payment_gateway").default("soleaspay"),
  inMaintenance: boolean("in_maintenance").default(false).notNull(),
  maintenanceDeposit: boolean("maintenance_deposit").default(false).notNull(),
  maintenanceWithdraw: boolean("maintenance_withdraw").default(false).notNull(),
  maintenancePaymentLink: boolean("maintenance_payment_link").default(false).notNull(),
  maintenanceApi: boolean("maintenance_api").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const globalMessages = pgTable("global_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  sentBy: integer("sent_by").notNull().references(() => users.id),
  targetAudience: text("target_audience").default("all").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminNotificationTypeEnum = pgEnum("admin_notification_type", ["transaction", "kyc", "withdrawal", "user", "system"]);

export const adminNotifications = pgTable("admin_notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  type: adminNotificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  relatedId: integer("related_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userNotifications = pgTable("user_notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  globalMessageId: integer("global_message_id").references(() => globalMessages.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const merchantStatusEnum = pgEnum("merchant_status", ["active", "suspended", "pending"]);

export const merchants = pgTable("merchants", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  apiKey: text("api_key").notNull().unique(),
  apiSecret: text("api_secret").notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0").notNull(),
  webhookUrl: text("webhook_url"),
  webhookSecret: text("webhook_secret"),
  status: merchantStatusEnum("status").default("active").notNull(),
  companyName: text("company_name"),
  website: text("website"),
  description: text("description"),
  logoUrl: text("logo_url"),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

export const apiTransactionStatusEnum = pgEnum("api_transaction_status", ["pending", "processing", "completed", "failed", "cancelled"]);
export const apiTransactionTypeEnum = pgEnum("api_transaction_type", ["payment", "credit", "refund", "payout"]);

export const apiTransactions = pgTable("api_transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  apiKeyId: integer("api_key_id").references(() => apiKeys.id),
  reference: text("reference").notNull().unique(),
  externalReference: text("external_reference"),
  type: apiTransactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  fee: decimal("fee", { precision: 15, scale: 2 }).default("0").notNull(),
  currency: text("currency").default("XOF").notNull(),
  status: apiTransactionStatusEnum("status").default("pending").notNull(),
  description: text("description"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  customerName: text("customer_name"),
  paymentMethod: text("payment_method"),
  callbackUrl: text("callback_url"),
  redirectUrl: text("redirect_url"),
  metadata: text("metadata"),
  webhookSent: boolean("webhook_sent").default(false).notNull(),
  webhookAttempts: integer("webhook_attempts").default(0).notNull(),
  webhookLastAttempt: timestamp("webhook_last_attempt"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const merchantWebhooks = pgTable("merchant_webhooks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id),
  url: text("url").notNull(),
  events: text("events").notNull(),
  secret: text("secret").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastTriggered: timestamp("last_triggered"),
  failureCount: integer("failure_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const apiLogs = pgTable("api_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  merchantId: integer("merchant_id").references(() => merchants.id),
  apiKeyId: integer("api_key_id").references(() => apiKeys.id),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  requestBody: text("request_body"),
  responseBody: text("response_body"),
  statusCode: integer("status_code"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  originDomain: text("origin_domain"),
  refererUrl: text("referer_url"),
  duration: integer("duration"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  transfers: many(transfers, { relationName: "sender" }),
  receivedTransfers: many(transfers, { relationName: "receiver" }),
  paymentLinks: many(paymentLinks),
  apiKeys: many(apiKeys),
  kycRequests: many(kycRequests),
  auditLogs: many(auditLogs),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const transfersRelations = relations(transfers, ({ one }) => ({
  sender: one(users, {
    fields: [transfers.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [transfers.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const paymentLinksRelations = relations(paymentLinks, ({ one }) => ({
  user: one(users, {
    fields: [paymentLinks.userId],
    references: [users.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

export const kycRequestsRelations = relations(kycRequests, ({ one }) => ({
  user: one(users, {
    fields: [kycRequests.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [kycRequests.reviewedBy],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  balance: true,
  isVerified: true,
  isBlocked: true,
  role: true,
});

export const loginSchema = z.object({
  emailOrPhone: z.string().min(1, "Email ou téléphone requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, "Nom complet requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  password: z.string().min(6, "Mot de passe minimum 6 caractères"),
  confirmPassword: z.string().min(6, "Confirmation requise"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export const insertKycRequestSchema = createInsertSchema(kycRequests).omit({
  id: true,
  createdAt: true,
  status: true,
  reviewedBy: true,
  reviewedAt: true,
  rejectionReason: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertTransferSchema = createInsertSchema(transfers).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertPaymentLinkSchema = createInsertSchema(paymentLinks).omit({
  id: true,
  createdAt: true,
  status: true,
  paidAt: true,
  payerName: true,
  payerEmail: true,
  linkCode: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  apiKey: true,
  lastUsedAt: true,
  requestCount: true,
  isActive: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests).omit({
  id: true,
  createdAt: true,
  status: true,
  rejectionReason: true,
  reviewedBy: true,
  reviewedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type KycRequest = typeof kycRequests.$inferSelect;
export type InsertKycRequest = z.infer<typeof insertKycRequestSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transfer = typeof transfers.$inferSelect;
export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type PaymentLink = typeof paymentLinks.$inferSelect;
export type InsertPaymentLink = z.infer<typeof insertPaymentLinkSchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type CommissionSettings = typeof commissionSettings.$inferSelect;
export type FeeChange = typeof feeChanges.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type SocialLink = typeof socialLinks.$inferSelect;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;
export type LeekpayPayment = typeof leekpayPayments.$inferSelect;
export type WithdrawalNumber = typeof withdrawalNumbers.$inferSelect;
export type Country = typeof countries.$inferSelect;
export type Operator = typeof operators.$inferSelect;
export type GlobalMessage = typeof globalMessages.$inferSelect;
export type AdminNotification = typeof adminNotifications.$inferSelect;
export type UserNotification = typeof userNotifications.$inferSelect;
export type SiteSetting = typeof siteSettings.$inferSelect;

export const insertMerchantSchema = createInsertSchema(merchants).omit({
  id: true,
  createdAt: true,
  apiKey: true,
  apiSecret: true,
  balance: true,
  status: true,
  isVerified: true,
  lastLoginAt: true,
  webhookSecret: true,
});

export const merchantLoginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const merchantRegisterSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe minimum 6 caractères"),
  confirmPassword: z.string().min(6, "Confirmation requise"),
  companyName: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export const insertApiTransactionSchema = createInsertSchema(apiTransactions).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  webhookSent: true,
  webhookAttempts: true,
  webhookLastAttempt: true,
});

export const insertMerchantWebhookSchema = createInsertSchema(merchantWebhooks).omit({
  id: true,
  createdAt: true,
  lastTriggered: true,
  failureCount: true,
});

export const insertApiLogSchema = createInsertSchema(apiLogs).omit({
  id: true,
  createdAt: true,
});

// Stats offsets table for reset functionality
export const statsOffsets = pgTable("stats_offsets", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  totalDepositsOffset: decimal("total_deposits_offset", { precision: 15, scale: 2 }).default("0").notNull(),
  totalWithdrawalsOffset: decimal("total_withdrawals_offset", { precision: 15, scale: 2 }).default("0").notNull(),
  totalCommissionsOffset: decimal("total_commissions_offset", { precision: 15, scale: 2 }).default("0").notNull(),
  apiCommissionsOffset: decimal("api_commissions_offset", { precision: 15, scale: 2 }).default("0").notNull(),
  totalApiPaymentsOffset: decimal("total_api_payments_offset", { precision: 15, scale: 2 }).default("0").notNull(),
  totalTransactionsAmountOffset: decimal("total_transactions_amount_offset", { precision: 15, scale: 2 }).default("0").notNull(),
  paymentLinkTransactionsAmountOffset: decimal("payment_link_transactions_amount_offset", { precision: 15, scale: 2 }).default("0").notNull(),
  todayCommissionsOffset: decimal("today_commissions_offset", { precision: 15, scale: 2 }).default("0").notNull(),
  lastResetAt: timestamp("last_reset_at").defaultNow().notNull(),
  resetBy: integer("reset_by").references(() => users.id),
});

export type StatsOffset = typeof statsOffsets.$inferSelect;

export type Merchant = typeof merchants.$inferSelect;
export type InsertMerchant = z.infer<typeof insertMerchantSchema>;
export type ApiTransaction = typeof apiTransactions.$inferSelect;
export type InsertApiTransaction = z.infer<typeof insertApiTransactionSchema>;
export type MerchantWebhook = typeof merchantWebhooks.$inferSelect;
export type InsertMerchantWebhook = z.infer<typeof insertMerchantWebhookSchema>;
export type ApiLog = typeof apiLogs.$inferSelect;
export type InsertApiLog = z.infer<typeof insertApiLogSchema>;

export const globalNotifications = pgTable("global_notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  message: text("message").notNull(),
  color: text("color").notNull().default("blue"),
  buttonText: text("button_text"),
  buttonUrl: text("button_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGlobalNotificationSchema = createInsertSchema(globalNotifications).omit({
  id: true,
  createdAt: true,
});

export type GlobalNotification = typeof globalNotifications.$inferSelect;
export type InsertGlobalNotification = z.infer<typeof insertGlobalNotificationSchema>;

export const partnerStatusEnum = pgEnum("partner_status", ["active", "inactive", "suspended"]);

export const partners = pgTable("partners", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  description: text("description"),
  website: text("website"),
  apiKey: text("api_key").notNull().unique(),
  apiSecret: text("api_secret").notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("5").notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0").notNull(),
  status: partnerStatusEnum("status").default("active").notNull(),
  webhookUrl: text("webhook_url"),
  callbackUrl: text("callback_url"),
  primaryColor: text("primary_color").default("#0070F3"),
  allowedCountries: text("allowed_countries"),
  allowedOperators: text("allowed_operators"),
  enableDeposit: boolean("enable_deposit").default(true).notNull(),
  enableWithdrawal: boolean("enable_withdrawal").default(true).notNull(),
  enablePaymentLinks: boolean("enable_payment_links").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

export const partnerLogActionEnum = pgEnum("partner_log_action", ["login", "logout", "profile_update", "api_call", "payment_received", "error", "system"]);

export const partnerLogs = pgTable("partner_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  partnerId: integer("partner_id").notNull().references(() => partners.id),
  action: partnerLogActionEnum("action").notNull(),
  details: text("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const partnerTransactions = pgTable("partner_transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  partnerId: integer("partner_id").notNull().references(() => partners.id),
  reference: text("reference").notNull().unique(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  fee: decimal("fee", { precision: 15, scale: 2 }).default("0").notNull(),
  currency: text("currency").default("XOF").notNull(),
  status: apiTransactionStatusEnum("status").default("pending").notNull(),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  paymentMethod: text("payment_method"),
  description: text("description"),
  callbackUrl: text("callback_url"),
  redirectUrl: text("redirect_url"),
  metadata: text("metadata"),
  webhookSent: boolean("webhook_sent").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const partnersRelations = relations(partners, ({ many }) => ({
  logs: many(partnerLogs),
  transactions: many(partnerTransactions),
}));

export const partnerLogsRelations = relations(partnerLogs, ({ one }) => ({
  partner: one(partners, {
    fields: [partnerLogs.partnerId],
    references: [partners.id],
  }),
}));

export const partnerTransactionsRelations = relations(partnerTransactions, ({ one }) => ({
  partner: one(partners, {
    fields: [partnerTransactions.partnerId],
    references: [partners.id],
  }),
}));

export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  createdAt: true,
  apiKey: true,
  apiSecret: true,
  balance: true,
  status: true,
  lastLoginAt: true,
});

export const partnerLoginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const insertPartnerLogSchema = createInsertSchema(partnerLogs).omit({
  id: true,
  createdAt: true,
});

export const insertPartnerTransactionSchema = createInsertSchema(partnerTransactions).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  webhookSent: true,
});

export type Partner = typeof partners.$inferSelect;
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type PartnerLog = typeof partnerLogs.$inferSelect;
export type InsertPartnerLog = z.infer<typeof insertPartnerLogSchema>;
export type PartnerTransaction = typeof partnerTransactions.$inferSelect;
export type InsertPartnerTransaction = z.infer<typeof insertPartnerTransactionSchema>;
