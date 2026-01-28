import { 
  type User, 
  type InsertUser, 
  type Transaction, 
  type InsertTransaction,
  type Transfer,
  type InsertTransfer,
  type PaymentLink,
  type InsertPaymentLink,
  type ApiKey,
  type InsertApiKey,
  type KycRequest,
  type InsertKycRequest,
  type CommissionSettings,
  type SocialLink,
  type WithdrawalRequest,
  type InsertWithdrawalRequest,
  type LeekpayPayment,
  type WithdrawalNumber,
  type Country,
  type Operator,
  type GlobalMessage,
  type AdminNotification,
  type UserNotification,
  type AuditLog,
  users,
  transactions,
  transfers,
  paymentLinks,
  apiKeys,
  kycRequests,
  commissionSettings,
  socialLinks,
  siteSettings,
  withdrawalRequests,
  leekpayPayments,
  withdrawalNumbers,
  countries,
  operators,
  globalMessages,
  adminNotifications,
  userNotifications,
  auditLogs,
} from "@shared/schema";
import { db as dbInstance } from "./db";
import { eq, or, and, desc, sql } from "drizzle-orm";

function getDb() {
  if (!dbInstance) {
    throw new Error("Database not initialized - SUPABASE_DATABASE_URL may be missing");
  }
  return dbInstance;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByEmailOrPhone(emailOrPhone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  updateUserBalance(id: number, amount: string): Promise<User | undefined>;
  setUserBalance(id: number, newBalance: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  getTransactions(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: number, status: string): Promise<Transaction | undefined>;
  getAllTransactions(): Promise<Transaction[]>;
  
  createTransfer(transfer: InsertTransfer): Promise<Transfer>;
  getTransfersByUser(userId: number): Promise<Transfer[]>;
  
  getPaymentLinks(userId: number): Promise<PaymentLink[]>;
  getPaymentLink(id: number): Promise<PaymentLink | undefined>;
  getPaymentLinkByCode(code: string): Promise<PaymentLink | undefined>;
  createPaymentLink(link: InsertPaymentLink): Promise<PaymentLink>;
  updatePaymentLink(id: number, updates: Partial<PaymentLink>): Promise<PaymentLink | undefined>;
  deletePaymentLink(id: number): Promise<void>;
  
  getApiKeys(userId: number): Promise<ApiKey[]>;
  getAllApiKeys(): Promise<ApiKey[]>;
  getApiKeyByKey(key: string): Promise<ApiKey | undefined>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: number, updates: Partial<ApiKey>): Promise<ApiKey | undefined>;
  deleteApiKey(id: number): Promise<void>;
  incrementApiKeyRequestCount(id: number): Promise<void>;
  
  getPendingWithdrawals(): Promise<Transaction[]>;
  getAllWithdrawals(): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  
  getKycRequest(userId: number): Promise<KycRequest | undefined>;
  createKycRequest(kyc: InsertKycRequest): Promise<KycRequest>;
  updateKycRequest(id: number, updates: Partial<KycRequest>): Promise<KycRequest | undefined>;
  getPendingKycRequests(): Promise<KycRequest[]>;
  getAllKycRequests(): Promise<(KycRequest & { user?: User })[]>;
  
  getCommissionSettings(): Promise<CommissionSettings | undefined>;
  updateCommissionSettings(depositRate: string, withdrawalRate: string, updatedBy: number): Promise<CommissionSettings>;
  
  getStats(): Promise<{
    totalUsers: number;
    verifiedUsers: number;
    totalDeposits: string;
    totalWithdrawals: string;
    totalCommissions: string;
    pendingKyc: number;
    activeApiKeys: number;
    commissionRate: string;
  }>;
  
  getSocialLinks(): Promise<SocialLink[]>;
  updateSocialLink(platform: string, url: string | null, isActive: boolean): Promise<SocialLink>;
  initializeSocialLinks(): Promise<void>;
  
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
  
  createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest>;
  getWithdrawalRequests(userId: number): Promise<WithdrawalRequest[]>;
  getWithdrawalRequest(id: number): Promise<WithdrawalRequest | undefined>;
  getPendingWithdrawalRequests(): Promise<(WithdrawalRequest & { user?: User })[]>;
  getAllWithdrawalRequests(): Promise<(WithdrawalRequest & { user?: User })[]>;
  updateWithdrawalRequest(id: number, updates: Partial<WithdrawalRequest>): Promise<WithdrawalRequest | undefined>;
  
  createLeekpayPayment(payment: Partial<LeekpayPayment>): Promise<LeekpayPayment>;
  getLeekpayPaymentById(leekpayPaymentId: string): Promise<LeekpayPayment | undefined>;
  updateLeekpayPayment(leekpayPaymentId: string, updates: Partial<LeekpayPayment>): Promise<LeekpayPayment | undefined>;
  getLeekpayPaymentsByUser(userId: number): Promise<LeekpayPayment[]>;
  getPendingLeekpayPayments(): Promise<LeekpayPayment[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await getDb().select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await getDb().select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await getDb().select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async getUserByEmailOrPhone(emailOrPhone: string): Promise<User | undefined> {
    const [user] = await getDb().select().from(users).where(
      or(eq(users.email, emailOrPhone), eq(users.phone, emailOrPhone))
    );
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await getDb().insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updated] = await getDb().update(users).set(updates).where(eq(users.id, id)).returning();
    return updated;
  }

  async updateUserBalance(id: number, amount: string): Promise<User | undefined> {
    const [updated] = await getDb()
      .update(users)
      .set({ balance: sql`${users.balance} + ${amount}` })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async setUserBalance(id: number, newBalance: string): Promise<User | undefined> {
    const [updated] = await getDb()
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    return getDb().select().from(users).orderBy(desc(users.createdAt));
  }

  async getTransactions(userId: number): Promise<Transaction[]> {
    return getDb().select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await getDb().insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async updateTransactionStatus(id: number, status: string): Promise<Transaction | undefined> {
    const [updated] = await getDb()
      .update(transactions)
      .set({ status: status as any })
      .where(eq(transactions.id, id))
      .returning();
    return updated;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return getDb().select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  async createTransfer(transfer: InsertTransfer): Promise<Transfer> {
    const [newTransfer] = await getDb().insert(transfers).values(transfer).returning();
    return newTransfer;
  }

  async getTransfersByUser(userId: number): Promise<Transfer[]> {
    return getDb()
      .select()
      .from(transfers)
      .where(or(eq(transfers.senderId, userId), eq(transfers.receiverId, userId)))
      .orderBy(desc(transfers.createdAt));
  }

  async getPaymentLinks(userId: number): Promise<PaymentLink[]> {
    return getDb().select().from(paymentLinks).where(eq(paymentLinks.userId, userId)).orderBy(desc(paymentLinks.createdAt));
  }

  async getPaymentLinkByCode(code: string): Promise<PaymentLink | undefined> {
    const [link] = await getDb().select().from(paymentLinks).where(eq(paymentLinks.linkCode, code));
    return link;
  }

  async createPaymentLink(link: InsertPaymentLink): Promise<PaymentLink> {
    const [newLink] = await getDb().insert(paymentLinks).values({
      ...link,
      linkCode: generateLinkCode(),
    }).returning();
    return newLink;
  }

  async updatePaymentLink(id: number, updates: Partial<PaymentLink>): Promise<PaymentLink | undefined> {
    const [updated] = await getDb().update(paymentLinks).set(updates).where(eq(paymentLinks.id, id)).returning();
    return updated;
  }

  async getPaymentLink(id: number): Promise<PaymentLink | undefined> {
    const [link] = await getDb().select().from(paymentLinks).where(eq(paymentLinks.id, id));
    return link;
  }

  async deletePaymentLink(id: number): Promise<void> {
    await getDb().delete(paymentLinks).where(eq(paymentLinks.id, id));
  }

  async getApiKeys(userId: number): Promise<ApiKey[]> {
    return getDb().select().from(apiKeys).where(eq(apiKeys.userId, userId)).orderBy(desc(apiKeys.createdAt));
  }

  async getApiKeyByKey(key: string): Promise<ApiKey | undefined> {
    const [apiKey] = await getDb().select().from(apiKeys).where(eq(apiKeys.apiKey, key));
    return apiKey;
  }

  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const [newKey] = await getDb().insert(apiKeys).values({
      ...apiKey,
      apiKey: generateApiKey(),
    }).returning();
    return newKey;
  }

  async updateApiKey(id: number, updates: Partial<ApiKey>): Promise<ApiKey | undefined> {
    const [updated] = await getDb().update(apiKeys).set(updates).where(eq(apiKeys.id, id)).returning();
    return updated;
  }

  async deleteApiKey(id: number): Promise<void> {
    await getDb().delete(apiKeys).where(eq(apiKeys.id, id));
  }

  async getAllApiKeys(): Promise<ApiKey[]> {
    return getDb().select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
  }

  async getPendingWithdrawals(): Promise<Transaction[]> {
    return getDb().select().from(transactions)
      .where(and(eq(transactions.type, "withdrawal"), eq(transactions.status, "pending")))
      .orderBy(desc(transactions.createdAt));
  }

  async getAllWithdrawals(): Promise<Transaction[]> {
    return getDb().select().from(transactions)
      .where(eq(transactions.type, "withdrawal"))
      .orderBy(desc(transactions.createdAt));
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await getDb().select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async incrementApiKeyRequestCount(id: number): Promise<void> {
    await getDb()
      .update(apiKeys)
      .set({
        requestCount: sql`${apiKeys.requestCount} + 1`,
        lastUsedAt: new Date(),
      })
      .where(eq(apiKeys.id, id));
  }

  async getKycRequest(userId: number): Promise<KycRequest | undefined> {
    const [kyc] = await getDb()
      .select()
      .from(kycRequests)
      .where(eq(kycRequests.userId, userId))
      .orderBy(desc(kycRequests.createdAt));
    return kyc;
  }

  async createKycRequest(kyc: InsertKycRequest): Promise<KycRequest> {
    const [newKyc] = await getDb().insert(kycRequests).values(kyc).returning();
    return newKyc;
  }

  async updateKycRequest(id: number, updates: Partial<KycRequest>): Promise<KycRequest | undefined> {
    const [updated] = await getDb().update(kycRequests).set(updates).where(eq(kycRequests.id, id)).returning();
    return updated;
  }

  async getPendingKycRequests(): Promise<KycRequest[]> {
    return getDb().select().from(kycRequests).where(eq(kycRequests.status, "pending")).orderBy(desc(kycRequests.createdAt));
  }

  async getAllKycRequests(): Promise<(KycRequest & { user?: User })[]> {
    const allKyc = await getDb().select().from(kycRequests).orderBy(desc(kycRequests.createdAt));
    const enrichedKyc = await Promise.all(
      allKyc.map(async (kyc) => {
        const user = await this.getUser(kyc.userId);
        return { ...kyc, user };
      })
    );
    return enrichedKyc;
  }

  async getCommissionSettings(): Promise<CommissionSettings | undefined> {
    const [settings] = await getDb().select().from(commissionSettings).orderBy(desc(commissionSettings.updatedAt)).limit(1);
    return settings;
  }

  async updateCommissionSettings(depositRate: string, withdrawalRate: string, updatedBy: number): Promise<CommissionSettings> {
    const [updated] = await getDb().insert(commissionSettings).values({
      depositRate,
      withdrawalRate,
      updatedBy,
      updatedAt: new Date(),
    }).returning();
    return updated;
  }

  async getStats() {
    const allUsers = await getDb().select().from(users);
    const verifiedUsers = allUsers.filter(u => u.isVerified);
    
    const allTransactions = await getDb().select().from(transactions).where(eq(transactions.status, "completed"));
    const deposits = allTransactions.filter(t => t.type === "deposit");
    const withdrawals = allTransactions.filter(t => t.type === "withdrawal");
    
    const totalDeposits = deposits.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalWithdrawals = withdrawals.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalCommissions = allTransactions.reduce((sum, t) => sum + parseFloat(t.fee), 0);

    // Calculate today's commissions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCommissions = allTransactions
      .filter(t => new Date(t.createdAt) >= today)
      .reduce((sum, t) => sum + parseFloat(t.fee), 0);

    const pendingKyc = await getDb().select().from(kycRequests).where(eq(kycRequests.status, "pending"));
    const activeApiKeysCount = await getDb().select().from(apiKeys).where(eq(apiKeys.isActive, true));

    const settings = await this.getCommissionSettings();

    return {
      totalUsers: allUsers.length,
      verifiedUsers: verifiedUsers.length,
      totalDeposits: totalDeposits.toString(),
      totalWithdrawals: totalWithdrawals.toString(),
      totalCommissions: totalCommissions.toString(),
      todayCommissions: todayCommissions.toString(),
      pendingKyc: pendingKyc.length,
      activeApiKeys: activeApiKeysCount.length,
      commissionRate: settings?.depositRate || "7",
    };
  }

  async getSocialLinks(): Promise<SocialLink[]> {
    return getDb().select().from(socialLinks).orderBy(socialLinks.platform);
  }

  async updateSocialLink(platform: string, url: string | null, isActive: boolean): Promise<SocialLink> {
    const existing = await getDb().select().from(socialLinks).where(eq(socialLinks.platform, platform));
    
    if (existing.length > 0) {
      const [updated] = await getDb().update(socialLinks)
        .set({ url, isActive, updatedAt: new Date() })
        .where(eq(socialLinks.platform, platform))
        .returning();
      return updated;
    } else {
      const [created] = await getDb().insert(socialLinks)
        .values({ platform, url, isActive, updatedAt: new Date() })
        .returning();
      return created;
    }
  }

  async initializeSocialLinks(): Promise<void> {
    const platforms = ['facebook', 'instagram', 'whatsapp', 'telegram', 'youtube', 'tiktok', 'twitter'];
    const existing = await getDb().select().from(socialLinks);
    const existingPlatforms = existing.map(l => l.platform);
    
    for (const platform of platforms) {
      if (!existingPlatforms.includes(platform)) {
        await getDb().insert(socialLinks).values({
          platform,
          url: null,
          isActive: false,
          updatedAt: new Date(),
        });
      }
    }
  }

  async getSetting(key: string): Promise<string | null> {
    const [setting] = await getDb().select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting?.value || null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const existing = await getDb().select().from(siteSettings).where(eq(siteSettings.key, key));
    if (existing.length > 0) {
      await getDb().update(siteSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(siteSettings.key, key));
    } else {
      await getDb().insert(siteSettings).values({ key, value, updatedAt: new Date() });
    }
  }

  async createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest> {
    const [newRequest] = await getDb().insert(withdrawalRequests).values(request).returning();
    return newRequest;
  }

  async getWithdrawalRequests(userId: number): Promise<WithdrawalRequest[]> {
    return getDb().select().from(withdrawalRequests).where(eq(withdrawalRequests.userId, userId)).orderBy(desc(withdrawalRequests.createdAt));
  }

  async getWithdrawalRequest(id: number): Promise<WithdrawalRequest | undefined> {
    const [request] = await getDb().select().from(withdrawalRequests).where(eq(withdrawalRequests.id, id));
    return request;
  }

  async getPendingWithdrawalRequests(): Promise<(WithdrawalRequest & { user?: User })[]> {
    const requests = await getDb().select().from(withdrawalRequests).where(eq(withdrawalRequests.status, "pending")).orderBy(desc(withdrawalRequests.createdAt));
    const result: (WithdrawalRequest & { user?: User })[] = [];
    for (const request of requests) {
      const user = await this.getUser(request.userId);
      result.push({ ...request, user });
    }
    return result;
  }

  async getAllWithdrawalRequests(): Promise<(WithdrawalRequest & { user?: User })[]> {
    const requests = await getDb().select().from(withdrawalRequests).orderBy(desc(withdrawalRequests.createdAt));
    const result: (WithdrawalRequest & { user?: User })[] = [];
    for (const request of requests) {
      const user = await this.getUser(request.userId);
      result.push({ ...request, user });
    }
    return result;
  }

  async updateWithdrawalRequest(id: number, updates: Partial<WithdrawalRequest>): Promise<WithdrawalRequest | undefined> {
    const [updated] = await getDb().update(withdrawalRequests).set(updates).where(eq(withdrawalRequests.id, id)).returning();
    return updated;
  }

  async createLeekpayPayment(payment: Partial<LeekpayPayment>): Promise<LeekpayPayment> {
    const [newPayment] = await getDb().insert(leekpayPayments).values(payment as any).returning();
    return newPayment;
  }

  async getLeekpayPaymentById(leekpayPaymentId: string): Promise<LeekpayPayment | undefined> {
    const [payment] = await getDb().select().from(leekpayPayments).where(eq(leekpayPayments.leekpayPaymentId, leekpayPaymentId));
    return payment;
  }

  async updateLeekpayPayment(leekpayPaymentId: string, updates: Partial<LeekpayPayment>): Promise<LeekpayPayment | undefined> {
    const [updated] = await getDb().update(leekpayPayments).set(updates as any).where(eq(leekpayPayments.leekpayPaymentId, leekpayPaymentId)).returning();
    return updated;
  }

  async getLeekpayPaymentsByUser(userId: number): Promise<LeekpayPayment[]> {
    return getDb().select().from(leekpayPayments).where(eq(leekpayPayments.userId, userId)).orderBy(desc(leekpayPayments.createdAt));
  }

  async getPendingLeekpayPayments(): Promise<LeekpayPayment[]> {
    return getDb().select().from(leekpayPayments).where(eq(leekpayPayments.status, "pending")).orderBy(desc(leekpayPayments.createdAt));
  }

  async getWithdrawalNumbers(): Promise<WithdrawalNumber[]> {
    return getDb().select().from(withdrawalNumbers).orderBy(desc(withdrawalNumbers.createdAt));
  }

  async createWithdrawalNumber(data: Partial<WithdrawalNumber>): Promise<WithdrawalNumber> {
    const [newNumber] = await getDb().insert(withdrawalNumbers).values(data as any).returning();
    return newNumber;
  }

  async updateWithdrawalNumber(id: number, updates: Partial<WithdrawalNumber>): Promise<WithdrawalNumber | undefined> {
    const [updated] = await getDb().update(withdrawalNumbers).set({ ...updates, updatedAt: new Date() }).where(eq(withdrawalNumbers.id, id)).returning();
    return updated;
  }

  async deleteWithdrawalNumber(id: number): Promise<void> {
    await getDb().delete(withdrawalNumbers).where(eq(withdrawalNumbers.id, id));
  }

  async getCountries(): Promise<Country[]> {
    return getDb().select().from(countries).orderBy(countries.name);
  }

  async createCountry(data: Partial<Country>): Promise<Country> {
    const [newCountry] = await getDb().insert(countries).values(data as any).returning();
    return newCountry;
  }

  async updateCountry(id: number, updates: Partial<Country>): Promise<Country | undefined> {
    const [updated] = await getDb().update(countries).set(updates).where(eq(countries.id, id)).returning();
    return updated;
  }

  async deleteCountry(id: number): Promise<void> {
    await getDb().delete(countries).where(eq(countries.id, id));
  }

  async getOperators(): Promise<Operator[]> {
    return getDb().select().from(operators).orderBy(operators.name);
  }

  async getOperatorsByCountry(countryId: number): Promise<Operator[]> {
    return getDb().select().from(operators).where(eq(operators.countryId, countryId)).orderBy(operators.name);
  }

  async createOperator(data: Partial<Operator>): Promise<Operator> {
    const [newOperator] = await getDb().insert(operators).values(data as any).returning();
    return newOperator;
  }

  async updateOperator(id: number, updates: Partial<Operator>): Promise<Operator | undefined> {
    const [updated] = await getDb().update(operators).set(updates).where(eq(operators.id, id)).returning();
    return updated;
  }

  async deleteOperator(id: number): Promise<void> {
    await getDb().delete(operators).where(eq(operators.id, id));
  }

  async getGlobalMessages(): Promise<GlobalMessage[]> {
    return getDb().select().from(globalMessages).orderBy(desc(globalMessages.createdAt));
  }

  async createGlobalMessage(data: Partial<GlobalMessage>): Promise<GlobalMessage> {
    const [newMessage] = await getDb().insert(globalMessages).values(data as any).returning();
    return newMessage;
  }

  async getAdminNotifications(): Promise<AdminNotification[]> {
    return getDb().select().from(adminNotifications).orderBy(desc(adminNotifications.createdAt)).limit(50);
  }

  async getUnreadAdminNotificationsCount(): Promise<number> {
    const result = await getDb().select().from(adminNotifications).where(eq(adminNotifications.isRead, false));
    return result.length;
  }

  async createAdminNotification(data: Partial<AdminNotification>): Promise<AdminNotification> {
    const [newNotification] = await getDb().insert(adminNotifications).values(data as any).returning();
    return newNotification;
  }

  async markAdminNotificationRead(id: number): Promise<void> {
    await getDb().update(adminNotifications).set({ isRead: true }).where(eq(adminNotifications.id, id));
  }

  async markAllAdminNotificationsRead(): Promise<void> {
    await getDb().update(adminNotifications).set({ isRead: true });
  }

  async getUserNotifications(userId: number): Promise<UserNotification[]> {
    return getDb().select().from(userNotifications).where(eq(userNotifications.userId, userId)).orderBy(desc(userNotifications.createdAt)).limit(50);
  }

  async createUserNotification(data: Partial<UserNotification>): Promise<UserNotification> {
    const [newNotification] = await getDb().insert(userNotifications).values(data as any).returning();
    return newNotification;
  }

  async markUserNotificationRead(id: number): Promise<void> {
    await getDb().update(userNotifications).set({ isRead: true }).where(eq(userNotifications.id, id));
  }

  async getAuditLogs(): Promise<(AuditLog & { user?: User })[]> {
    const logs = await getDb().select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(500);
    const result: (AuditLog & { user?: User })[] = [];
    for (const log of logs) {
      const user = log.userId ? await this.getUser(log.userId) : undefined;
      result.push({ ...log, user });
    }
    return result;
  }

  async createAuditLog(data: { userId?: number; action: string; details?: string; ipAddress?: string }): Promise<AuditLog> {
    const [newLog] = await getDb().insert(auditLogs).values(data as any).returning();
    return newLog;
  }

  async getAllPaymentLinks(): Promise<(PaymentLink & { user?: User })[]> {
    const links = await getDb().select().from(paymentLinks).orderBy(desc(paymentLinks.createdAt));
    const result: (PaymentLink & { user?: User })[] = [];
    for (const link of links) {
      const user = await this.getUser(link.userId);
      result.push({ ...link, user });
    }
    return result;
  }

  async deleteUser(id: number): Promise<void> {
    await getDb().delete(transactions).where(eq(transactions.userId, id));
    await getDb().delete(paymentLinks).where(eq(paymentLinks.userId, id));
    await getDb().delete(apiKeys).where(eq(apiKeys.userId, id));
    await getDb().delete(kycRequests).where(eq(kycRequests.userId, id));
    await getDb().delete(withdrawalRequests).where(eq(withdrawalRequests.userId, id));
    await getDb().delete(userNotifications).where(eq(userNotifications.userId, id));
    await getDb().delete(users).where(eq(users.id, id));
  }
}

function generateLinkCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "SPY";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateApiKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "sk_live_";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const storage = new DatabaseStorage();
