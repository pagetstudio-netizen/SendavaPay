import { Router, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { z } from "zod";
import type { Merchant } from "@shared/schema";

const router = Router();

declare global {
  namespace Express {
    interface Request {
      merchant?: Merchant;
    }
  }
}

function generateApiKey(): string {
  return `pk_live_${crypto.randomBytes(24).toString('hex')}`;
}

function generateApiSecret(): string {
  return `sk_live_${crypto.randomBytes(32).toString('hex')}`;
}

function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString('hex')}`;
}

function generateReference(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString('hex');
  return `pay_${timestamp}_${random}`;
}

async function logApiRequest(
  merchantId: number | null,
  endpoint: string,
  method: string,
  requestBody: any,
  responseBody: any,
  statusCode: number,
  ipAddress: string | undefined,
  userAgent: string | undefined,
  duration: number
) {
  try {
    await storage.createApiLog({
      merchantId,
      endpoint,
      method,
      requestBody: JSON.stringify(requestBody),
      responseBody: JSON.stringify(responseBody),
      statusCode,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      duration,
    });
  } catch (error) {
    console.error("Failed to log API request:", error);
  }
}

async function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const response = { success: false, error: "API key required", code: "UNAUTHORIZED" };
    await logApiRequest(null, req.path, req.method, req.body, response, 401, req.ip, req.get('User-Agent'), Date.now() - startTime);
    return res.status(401).json(response);
  }

  const apiKey = authHeader.substring(7);
  const merchant = await storage.getMerchantByApiKey(apiKey);

  if (!merchant) {
    const response = { success: false, error: "Invalid API key", code: "INVALID_API_KEY" };
    await logApiRequest(null, req.path, req.method, req.body, response, 401, req.ip, req.get('User-Agent'), Date.now() - startTime);
    return res.status(401).json(response);
  }

  if (merchant.status !== 'active') {
    const response = { success: false, error: "Merchant account suspended", code: "ACCOUNT_SUSPENDED" };
    await logApiRequest(merchant.id, req.path, req.method, req.body, response, 403, req.ip, req.get('User-Agent'), Date.now() - startTime);
    return res.status(403).json(response);
  }

  req.merchant = merchant;
  next();
}

async function sendWebhook(merchant: Merchant, event: string, data: any) {
  if (!merchant.webhookUrl) return;

  const webhooks = await storage.getMerchantWebhooks(merchant.id);
  const activeWebhooks = webhooks.filter(w => w.isActive && w.events.includes(event));

  for (const webhook of activeWebhooks) {
    try {
      const payload = JSON.stringify({
        event,
        data,
        timestamp: new Date().toISOString(),
      });

      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(payload)
        .digest('hex');

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sendavapay-Signature': signature,
          'X-Sendavapay-Event': event,
        },
        body: payload,
      });

      if (response.ok) {
        await storage.updateMerchantWebhook(webhook.id, {
          lastTriggered: new Date(),
          failureCount: 0,
        });
      } else {
        await storage.updateMerchantWebhook(webhook.id, {
          failureCount: webhook.failureCount + 1,
        });
      }
    } catch (error) {
      console.error(`Webhook failed for ${webhook.url}:`, error);
      await storage.updateMerchantWebhook(webhook.id, {
        failureCount: webhook.failureCount + 1,
      });
    }
  }
}

// ==================== MERCHANT ROUTES (Using User Authentication) ====================

// Helper: Get or create merchant record for verified user
async function getOrCreateMerchantForUser(userId: number): Promise<Merchant | null> {
  const user = await storage.getUser(userId);
  if (!user || !user.isVerified) {
    return null;
  }

  const userEmail = user.email || `${user.phone}@sendavapay.com`;
  let merchant = await storage.getMerchantByEmail(userEmail);
  
  if (!merchant) {
    const apiKey = generateApiKey();
    const apiSecret = generateApiSecret();
    const webhookSecret = generateWebhookSecret();

    merchant = await storage.createMerchant({
      name: user.fullName || user.phone,
      email: userEmail,
      password: user.password,
      apiKey,
      apiSecret,
      webhookSecret,
      companyName: null,
      website: null,
      description: null,
    });
  }

  return merchant;
}

// Get merchant info for current user (uses user session)
router.get("/merchant/me", async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Veuillez vous connecter", requireAuth: true });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "Utilisateur non trouvé" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ 
        success: false, 
        error: "Votre compte doit être vérifié pour accéder à l'API marchand", 
        requireVerification: true 
      });
    }

    const merchant = await getOrCreateMerchantForUser(userId);
    if (!merchant) {
      return res.status(500).json({ success: false, error: "Erreur lors de la création du compte API" });
    }

    res.json({
      success: true,
      merchant: {
        id: merchant.id,
        name: merchant.name,
        email: merchant.email,
        companyName: merchant.companyName,
        website: merchant.website,
        description: merchant.description,
        balance: merchant.balance,
        status: merchant.status,
        isVerified: merchant.isVerified,
        apiKey: merchant.apiKey,
        webhookUrl: merchant.webhookUrl,
        createdAt: merchant.createdAt,
      },
      user: {
        fullName: user.fullName,
        phone: user.phone,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Error in /merchant/me:", error);
    return res.status(500).json({ 
      success: false, 
      error: "L'API marchand n'est pas encore configurée. Veuillez contacter l'administrateur.",
      notConfigured: true
    });
  }
});

router.get("/merchant/transactions", async (req: Request, res: Response) => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Non authentifi\u00e9" });
  }

  const merchant = await getOrCreateMerchantForUser(userId);
  if (!merchant) {
    return res.status(403).json({ success: false, error: "Compte non v\u00e9rifi\u00e9" });
  }

  const transactions = await storage.getApiTransactionsByMerchant(merchant.id);
  res.json({ success: true, transactions });
});

router.get("/merchant/webhooks", async (req: Request, res: Response) => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Non authentifi\u00e9" });
  }

  const merchant = await getOrCreateMerchantForUser(userId);
  if (!merchant) {
    return res.status(403).json({ success: false, error: "Compte non v\u00e9rifi\u00e9" });
  }

  const webhooks = await storage.getMerchantWebhooks(merchant.id);
  res.json({ success: true, webhooks });
});

router.post("/merchant/webhooks", async (req: Request, res: Response) => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Non authentifi\u00e9" });
  }

  const merchant = await getOrCreateMerchantForUser(userId);
  if (!merchant) {
    return res.status(403).json({ success: false, error: "Compte non v\u00e9rifi\u00e9" });
  }

  try {
    const schema = z.object({
      url: z.string().url(),
      events: z.string(),
    });

    const data = schema.parse(req.body);
    const secret = generateWebhookSecret();

    const webhook = await storage.createMerchantWebhook({
      merchantId: merchant.id,
      url: data.url,
      events: data.events,
      secret,
    });

    res.status(201).json({ success: true, webhook });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete("/merchant/webhooks/:id", async (req: Request, res: Response) => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Non authentifi\u00e9" });
  }

  const merchant = await getOrCreateMerchantForUser(userId);
  if (!merchant) {
    return res.status(403).json({ success: false, error: "Compte non v\u00e9rifi\u00e9" });
  }

  await storage.deleteMerchantWebhook(parseInt(req.params.id));
  res.json({ success: true });
});

router.post("/merchant/regenerate-keys", async (req: Request, res: Response) => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Non authentifi\u00e9" });
  }

  const merchant = await getOrCreateMerchantForUser(userId);
  if (!merchant) {
    return res.status(403).json({ success: false, error: "Compte non v\u00e9rifi\u00e9" });
  }

  const newApiKey = generateApiKey();
  const newApiSecret = generateApiSecret();

  const updatedMerchant = await storage.updateMerchant(merchant.id, {
    apiKey: newApiKey,
    apiSecret: newApiSecret,
  });

  res.json({
    success: true,
    apiKey: updatedMerchant?.apiKey,
  });
});

router.put("/merchant/webhook-url", async (req: Request, res: Response) => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Non authentifi\u00e9" });
  }

  const merchant = await getOrCreateMerchantForUser(userId);
  if (!merchant) {
    return res.status(403).json({ success: false, error: "Compte non v\u00e9rifi\u00e9" });
  }

  const { webhookUrl } = req.body;
  await storage.updateMerchant(merchant.id, { webhookUrl });
  res.json({ success: true });
});

// ==================== PUBLIC API ENDPOINTS (v1) ====================

// API Info endpoint
router.get("/v1", async (req: Request, res: Response) => {
  try {
    // Check maintenance mode
    const maintenanceMode = await storage.getSetting("api_docs_maintenance");
    if (maintenanceMode === "true") {
      return res.status(503).json({
        success: false,
        error: "API en maintenance",
        message: "L'API est temporairement indisponible pour maintenance. Veuillez réessayer plus tard.",
        code: "API_MAINTENANCE"
      });
    }

    res.json({
      success: true,
      data: {
        name: "SendavaPay API",
        version: "1.0.0",
        status: "operational",
        documentation: "https://sendavapay.com/docs",
        endpoints: {
          createPayment: "POST /api/v1/create-payment",
          verifyPayment: "POST /api/v1/verify-payment",
          creditAccount: "POST /api/v1/credit-account",
          getBalance: "GET /api/v1/balance",
          getTransactions: "GET /api/v1/transactions"
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// Middleware to check API maintenance mode
async function checkApiMaintenance(req: Request, res: Response, next: NextFunction) {
  try {
    const maintenanceMode = await storage.getSetting("api_docs_maintenance");
    if (maintenanceMode === "true") {
      return res.status(503).json({
        success: false,
        error: "API en maintenance",
        message: "L'API est temporairement indisponible pour maintenance. Veuillez réessayer plus tard.",
        code: "API_MAINTENANCE"
      });
    }
    next();
  } catch (error) {
    next();
  }
}

router.post("/v1/create-payment", checkApiMaintenance, authenticateApiKey, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const merchant = req.merchant!;

  try {
    const schema = z.object({
      amount: z.number().positive(),
      currency: z.string().default("XOF"),
      description: z.string().optional(),
      externalReference: z.string().optional(),
      customerEmail: z.string().email().optional(),
      customerPhone: z.string().optional(),
      customerName: z.string().optional(),
      redirectUrl: z.string().url().optional(),
      metadata: z.record(z.any()).optional(),
    });

    const data = schema.parse(req.body);
    const reference = generateReference();

    const transaction = await storage.createApiTransaction({
      merchantId: merchant.id,
      reference,
      externalReference: data.externalReference || null,
      type: "payment",
      amount: data.amount.toString(),
      currency: data.currency,
      description: data.description || null,
      customerEmail: data.customerEmail || null,
      customerPhone: data.customerPhone || null,
      customerName: data.customerName || null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      ipAddress: req.ip || null,
      userAgent: req.get('User-Agent') || null,
    });

    const paymentUrl = `${req.protocol}://${req.get('host')}/pay/api/${reference}`;

    const response = {
      success: true,
      data: {
        reference: transaction.reference,
        amount: data.amount,
        currency: data.currency,
        status: transaction.status,
        paymentUrl,
        createdAt: transaction.createdAt,
      },
    };

    await logApiRequest(merchant.id, req.path, req.method, req.body, response, 201, req.ip, req.get('User-Agent'), Date.now() - startTime);
    res.status(201).json(response);
  } catch (error: any) {
    const response = { success: false, error: error.message || "Failed to create payment" };
    await logApiRequest(merchant.id, req.path, req.method, req.body, response, 400, req.ip, req.get('User-Agent'), Date.now() - startTime);
    res.status(400).json(response);
  }
});

router.post("/v1/verify-payment", checkApiMaintenance, authenticateApiKey, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const merchant = req.merchant!;

  try {
    const schema = z.object({
      reference: z.string(),
    });

    const data = schema.parse(req.body);
    const transaction = await storage.getApiTransactionByReference(data.reference);

    if (!transaction) {
      const response = { success: false, error: "Payment not found", code: "PAYMENT_NOT_FOUND" };
      await logApiRequest(merchant.id, req.path, req.method, req.body, response, 404, req.ip, req.get('User-Agent'), Date.now() - startTime);
      return res.status(404).json(response);
    }

    if (transaction.merchantId !== merchant.id) {
      const response = { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
      await logApiRequest(merchant.id, req.path, req.method, req.body, response, 403, req.ip, req.get('User-Agent'), Date.now() - startTime);
      return res.status(403).json(response);
    }

    const response = {
      success: true,
      data: {
        reference: transaction.reference,
        externalReference: transaction.externalReference,
        amount: transaction.amount,
        fee: transaction.fee,
        currency: transaction.currency,
        status: transaction.status,
        customerEmail: transaction.customerEmail,
        customerPhone: transaction.customerPhone,
        customerName: transaction.customerName,
        paymentMethod: transaction.paymentMethod,
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt,
      },
    };

    await logApiRequest(merchant.id, req.path, req.method, req.body, response, 200, req.ip, req.get('User-Agent'), Date.now() - startTime);
    res.json(response);
  } catch (error: any) {
    const response = { success: false, error: error.message || "Verification failed" };
    await logApiRequest(merchant.id, req.path, req.method, req.body, response, 400, req.ip, req.get('User-Agent'), Date.now() - startTime);
    res.status(400).json(response);
  }
});

router.post("/v1/credit-account", checkApiMaintenance, authenticateApiKey, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const merchant = req.merchant!;

  try {
    const schema = z.object({
      phone: z.string(),
      amount: z.number().positive(),
      description: z.string().optional(),
      externalReference: z.string().optional(),
    });

    const data = schema.parse(req.body);

    const user = await storage.getUserByPhone(data.phone);
    if (!user) {
      const response = { success: false, error: "User not found", code: "USER_NOT_FOUND" };
      await logApiRequest(merchant.id, req.path, req.method, req.body, response, 404, req.ip, req.get('User-Agent'), Date.now() - startTime);
      return res.status(404).json(response);
    }

    const reference = generateReference();

    const transaction = await storage.createApiTransaction({
      merchantId: merchant.id,
      reference,
      externalReference: data.externalReference || null,
      type: "credit",
      amount: data.amount.toString(),
      status: "completed",
      description: data.description || `Credit from ${merchant.name}`,
      customerPhone: data.phone,
      customerName: user.fullName,
      customerEmail: user.email,
      ipAddress: req.ip || null,
      userAgent: req.get('User-Agent') || null,
      completedAt: new Date(),
    });

    await storage.updateUserBalance(user.id, data.amount.toString());

    await storage.createTransaction({
      userId: user.id,
      type: "deposit",
      amount: data.amount.toString(),
      fee: "0",
      netAmount: data.amount.toString(),
      status: "completed",
      description: data.description || `Credit via API - ${merchant.name}`,
      externalRef: reference,
    });

    await sendWebhook(merchant, "credit.completed", {
      reference: transaction.reference,
      amount: data.amount,
      phone: data.phone,
      userName: user.fullName,
    });

    const response = {
      success: true,
      data: {
        reference: transaction.reference,
        amount: data.amount,
        phone: data.phone,
        userName: user.fullName,
        status: "completed",
        createdAt: transaction.createdAt,
      },
    };

    await logApiRequest(merchant.id, req.path, req.method, req.body, response, 200, req.ip, req.get('User-Agent'), Date.now() - startTime);
    res.json(response);
  } catch (error: any) {
    const response = { success: false, error: error.message || "Credit failed" };
    await logApiRequest(merchant.id, req.path, req.method, req.body, response, 400, req.ip, req.get('User-Agent'), Date.now() - startTime);
    res.status(400).json(response);
  }
});

router.get("/v1/balance", checkApiMaintenance, authenticateApiKey, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const merchant = req.merchant!;

  try {
    const schema = z.object({
      phone: z.string(),
    });

    const data = schema.parse(req.query);
    const user = await storage.getUserByPhone(data.phone);

    if (!user) {
      const response = { success: false, error: "User not found", code: "USER_NOT_FOUND" };
      await logApiRequest(merchant.id, req.path, req.method, req.query, response, 404, req.ip, req.get('User-Agent'), Date.now() - startTime);
      return res.status(404).json(response);
    }

    const response = {
      success: true,
      data: {
        phone: user.phone,
        balance: user.balance,
        currency: "XOF",
        name: user.fullName,
        isVerified: user.isVerified,
      },
    };

    await logApiRequest(merchant.id, req.path, req.method, req.query, response, 200, req.ip, req.get('User-Agent'), Date.now() - startTime);
    res.json(response);
  } catch (error: any) {
    const response = { success: false, error: error.message || "Failed to get balance" };
    await logApiRequest(merchant.id, req.path, req.method, req.query, response, 400, req.ip, req.get('User-Agent'), Date.now() - startTime);
    res.status(400).json(response);
  }
});

router.get("/v1/transactions", checkApiMaintenance, authenticateApiKey, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const merchant = req.merchant!;

  try {
    const transactions = await storage.getApiTransactionsByMerchant(merchant.id);

    const response = {
      success: true,
      data: {
        transactions: transactions.map(t => ({
          reference: t.reference,
          externalReference: t.externalReference,
          type: t.type,
          amount: t.amount,
          fee: t.fee,
          currency: t.currency,
          status: t.status,
          customerEmail: t.customerEmail,
          customerPhone: t.customerPhone,
          customerName: t.customerName,
          createdAt: t.createdAt,
          completedAt: t.completedAt,
        })),
        total: transactions.length,
      },
    };

    await logApiRequest(merchant.id, req.path, req.method, req.query, response, 200, req.ip, req.get('User-Agent'), Date.now() - startTime);
    res.json(response);
  } catch (error: any) {
    const response = { success: false, error: error.message || "Failed to get transactions" };
    await logApiRequest(merchant.id, req.path, req.method, req.query, response, 400, req.ip, req.get('User-Agent'), Date.now() - startTime);
    res.status(400).json(response);
  }
});

export default router;
