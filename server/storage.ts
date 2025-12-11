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
  users,
  transactions,
  transfers,
  paymentLinks,
  apiKeys,
  kycRequests,
  commissionSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, or, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByEmailOrPhone(emailOrPhone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  updateUserBalance(id: number, amount: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  getTransactions(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: number, status: string): Promise<Transaction | undefined>;
  getAllTransactions(): Promise<Transaction[]>;
  
  createTransfer(transfer: InsertTransfer): Promise<Transfer>;
  getTransfersByUser(userId: number): Promise<Transfer[]>;
  
  getPaymentLinks(userId: number): Promise<PaymentLink[]>;
  getPaymentLinkByCode(code: string): Promise<PaymentLink | undefined>;
  createPaymentLink(link: InsertPaymentLink): Promise<PaymentLink>;
  updatePaymentLink(id: number, updates: Partial<PaymentLink>): Promise<PaymentLink | undefined>;
  
  getApiKeys(userId: number): Promise<ApiKey[]>;
  getApiKeyByKey(key: string): Promise<ApiKey | undefined>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: number, updates: Partial<ApiKey>): Promise<ApiKey | undefined>;
  deleteApiKey(id: number): Promise<void>;
  incrementApiKeyRequestCount(id: number): Promise<void>;
  
  getKycRequest(userId: number): Promise<KycRequest | undefined>;
  createKycRequest(kyc: InsertKycRequest): Promise<KycRequest>;
  updateKycRequest(id: number, updates: Partial<KycRequest>): Promise<KycRequest | undefined>;
  getPendingKycRequests(): Promise<KycRequest[]>;
  
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
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async getUserByEmailOrPhone(emailOrPhone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      or(eq(users.email, emailOrPhone), eq(users.phone, emailOrPhone))
    );
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updated;
  }

  async updateUserBalance(id: number, amount: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ balance: sql`${users.balance} + ${amount}` })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getTransactions(userId: number): Promise<Transaction[]> {
    return db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async updateTransactionStatus(id: number, status: string): Promise<Transaction | undefined> {
    const [updated] = await db
      .update(transactions)
      .set({ status: status as any })
      .where(eq(transactions.id, id))
      .returning();
    return updated;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  async createTransfer(transfer: InsertTransfer): Promise<Transfer> {
    const [newTransfer] = await db.insert(transfers).values(transfer).returning();
    return newTransfer;
  }

  async getTransfersByUser(userId: number): Promise<Transfer[]> {
    return db
      .select()
      .from(transfers)
      .where(or(eq(transfers.senderId, userId), eq(transfers.receiverId, userId)))
      .orderBy(desc(transfers.createdAt));
  }

  async getPaymentLinks(userId: number): Promise<PaymentLink[]> {
    return db.select().from(paymentLinks).where(eq(paymentLinks.userId, userId)).orderBy(desc(paymentLinks.createdAt));
  }

  async getPaymentLinkByCode(code: string): Promise<PaymentLink | undefined> {
    const [link] = await db.select().from(paymentLinks).where(eq(paymentLinks.linkCode, code));
    return link;
  }

  async createPaymentLink(link: InsertPaymentLink): Promise<PaymentLink> {
    const [newLink] = await db.insert(paymentLinks).values({
      ...link,
      linkCode: generateLinkCode(),
    }).returning();
    return newLink;
  }

  async updatePaymentLink(id: number, updates: Partial<PaymentLink>): Promise<PaymentLink | undefined> {
    const [updated] = await db.update(paymentLinks).set(updates).where(eq(paymentLinks.id, id)).returning();
    return updated;
  }

  async getApiKeys(userId: number): Promise<ApiKey[]> {
    return db.select().from(apiKeys).where(eq(apiKeys.userId, userId)).orderBy(desc(apiKeys.createdAt));
  }

  async getApiKeyByKey(key: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.apiKey, key));
    return apiKey;
  }

  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const [newKey] = await db.insert(apiKeys).values({
      ...apiKey,
      apiKey: generateApiKey(),
    }).returning();
    return newKey;
  }

  async updateApiKey(id: number, updates: Partial<ApiKey>): Promise<ApiKey | undefined> {
    const [updated] = await db.update(apiKeys).set(updates).where(eq(apiKeys.id, id)).returning();
    return updated;
  }

  async deleteApiKey(id: number): Promise<void> {
    await db.delete(apiKeys).where(eq(apiKeys.id, id));
  }

  async incrementApiKeyRequestCount(id: number): Promise<void> {
    await db
      .update(apiKeys)
      .set({
        requestCount: sql`${apiKeys.requestCount} + 1`,
        lastUsedAt: new Date(),
      })
      .where(eq(apiKeys.id, id));
  }

  async getKycRequest(userId: number): Promise<KycRequest | undefined> {
    const [kyc] = await db
      .select()
      .from(kycRequests)
      .where(eq(kycRequests.userId, userId))
      .orderBy(desc(kycRequests.createdAt));
    return kyc;
  }

  async createKycRequest(kyc: InsertKycRequest): Promise<KycRequest> {
    const [newKyc] = await db.insert(kycRequests).values(kyc).returning();
    return newKyc;
  }

  async updateKycRequest(id: number, updates: Partial<KycRequest>): Promise<KycRequest | undefined> {
    const [updated] = await db.update(kycRequests).set(updates).where(eq(kycRequests.id, id)).returning();
    return updated;
  }

  async getPendingKycRequests(): Promise<KycRequest[]> {
    return db.select().from(kycRequests).where(eq(kycRequests.status, "pending")).orderBy(desc(kycRequests.createdAt));
  }

  async getCommissionSettings(): Promise<CommissionSettings | undefined> {
    const [settings] = await db.select().from(commissionSettings).orderBy(desc(commissionSettings.updatedAt)).limit(1);
    return settings;
  }

  async updateCommissionSettings(depositRate: string, withdrawalRate: string, updatedBy: number): Promise<CommissionSettings> {
    const [updated] = await db.insert(commissionSettings).values({
      depositRate,
      withdrawalRate,
      updatedBy,
      updatedAt: new Date(),
    }).returning();
    return updated;
  }

  async getStats() {
    const allUsers = await db.select().from(users);
    const verifiedUsers = allUsers.filter(u => u.isVerified);
    
    const allTransactions = await db.select().from(transactions).where(eq(transactions.status, "completed"));
    const deposits = allTransactions.filter(t => t.type === "deposit");
    const withdrawals = allTransactions.filter(t => t.type === "withdrawal");
    
    const totalDeposits = deposits.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalWithdrawals = withdrawals.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalCommissions = allTransactions.reduce((sum, t) => sum + parseFloat(t.fee), 0);
    
    const pendingKyc = await db.select().from(kycRequests).where(eq(kycRequests.status, "pending"));
    const activeApiKeysCount = await db.select().from(apiKeys).where(eq(apiKeys.isActive, true));
    
    const settings = await this.getCommissionSettings();
    
    return {
      totalUsers: allUsers.length,
      verifiedUsers: verifiedUsers.length,
      totalDeposits: totalDeposits.toString(),
      totalWithdrawals: totalWithdrawals.toString(),
      totalCommissions: totalCommissions.toString(),
      pendingKyc: pendingKyc.length,
      activeApiKeys: activeApiKeysCount.length,
      commissionRate: settings?.depositRate || "7",
    };
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
