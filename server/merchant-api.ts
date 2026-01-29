import { Router, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import crypto from "crypto";
import { z } from "zod";
import type { User, ApiKey } from "@shared/schema";

const router = Router();

declare global {
  namespace Express {
    interface Request {
      apiUser?: User;
      apiKeyRecord?: ApiKey;
    }
  }
}

function generateReference(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString('hex');
  return `pay_${timestamp}_${random}`;
}

async function logApiRequest(
  userId: number | null,
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
      merchantId: userId, // Using userId in merchantId field for backwards compatibility
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

  const apiKeyValue = authHeader.substring(7);
  
  // Find user API key
  const apiKeyRecord = await storage.getApiKeyByKey(apiKeyValue);
  
  if (!apiKeyRecord) {
    const response = { success: false, error: "Invalid API key", code: "INVALID_API_KEY" };
    await logApiRequest(null, req.path, req.method, req.body, response, 401, req.ip, req.get('User-Agent'), Date.now() - startTime);
    return res.status(401).json(response);
  }

  if (!apiKeyRecord.isActive) {
    const response = { success: false, error: "API key is inactive", code: "API_KEY_INACTIVE" };
    await logApiRequest(null, req.path, req.method, req.body, response, 403, req.ip, req.get('User-Agent'), Date.now() - startTime);
    return res.status(403).json(response);
  }

  const user = await storage.getUser(apiKeyRecord.userId);
  if (!user) {
    const response = { success: false, error: "User not found", code: "USER_NOT_FOUND" };
    await logApiRequest(null, req.path, req.method, req.body, response, 401, req.ip, req.get('User-Agent'), Date.now() - startTime);
    return res.status(401).json(response);
  }

  if (!user.isVerified) {
    const response = { success: false, error: "User account not verified. Complete KYC verification to use the API.", code: "ACCOUNT_NOT_VERIFIED" };
    await logApiRequest(null, req.path, req.method, req.body, response, 403, req.ip, req.get('User-Agent'), Date.now() - startTime);
    return res.status(403).json(response);
  }

  // Increment API key request count
  await storage.incrementApiKeyRequestCount(apiKeyRecord.id);
  
  req.apiUser = user;
  req.apiKeyRecord = apiKeyRecord;
  next();
}

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
  const apiUser = req.apiUser!;

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
      userId: apiUser.id,
      reference,
      externalReference: data.externalReference || null,
      type: "payment",
      amount: data.amount.toString(),
      currency: data.currency,
      description: data.description || null,
      customerEmail: data.customerEmail || null,
      customerPhone: data.customerPhone || null,
      customerName: data.customerName || null,
      callbackUrl: data.redirectUrl || null,
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

    await logApiRequest(apiUser.id, req.path, req.method, req.body, response, 201, req.ip, req.get('User-Agent'), Date.now() - startTime);
    res.status(201).json(response);
  } catch (error: any) {
    const response = { success: false, error: error.message || "Failed to create payment" };
    await logApiRequest(apiUser.id, req.path, req.method, req.body, response, 400, req.ip, req.get('User-Agent'), Date.now() - startTime);
    res.status(400).json(response);
  }
});

router.post("/v1/verify-payment", checkApiMaintenance, authenticateApiKey, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const apiUser = req.apiUser!;

  try {
    const schema = z.object({
      reference: z.string(),
    });

    const data = schema.parse(req.body);
    const transaction = await storage.getApiTransactionByReference(data.reference);

    if (!transaction) {
      const response = { success: false, error: "Payment not found", code: "PAYMENT_NOT_FOUND" };
      await logApiRequest(apiUser.id, req.path, req.method, req.body, response, 404, req.ip, req.get('User-Agent'), Date.now() - startTime);
      return res.status(404).json(response);
    }

    // Check ownership
    if (transaction.merchantId !== apiUser.id) {
      const response = { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
      await logApiRequest(apiUser.id, req.path, req.method, req.body, response, 403, req.ip, req.get('User-Agent'), Date.now() - startTime);
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

    await logApiRequest(apiUser.id, req.path, req.method, req.body, response, 200, req.ip, req.get('User-Agent'), Date.now() - startTime);
    res.json(response);
  } catch (error: any) {
    const response = { success: false, error: error.message || "Verification failed" };
    await logApiRequest(apiUser.id, req.path, req.method, req.body, response, 400, req.ip, req.get('User-Agent'), Date.now() - startTime);
    res.status(400).json(response);
  }
});

router.post("/v1/credit-account", checkApiMaintenance, authenticateApiKey, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const apiUser = req.apiUser!;

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
      await logApiRequest(apiUser.id, req.path, req.method, req.body, response, 404, req.ip, req.get('User-Agent'), Date.now() - startTime);
      return res.status(404).json(response);
    }

    const reference = generateReference();

    const transaction = await storage.createApiTransaction({
      userId: apiUser.id,
      reference,
      externalReference: data.externalReference || null,
      type: "credit",
      amount: data.amount.toString(),
      status: "completed",
      description: data.description || `Credit from ${apiUser.fullName}`,
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
      description: data.description || `Credit via API - ${apiUser.fullName}`,
      externalRef: reference,
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

    await logApiRequest(apiUser.id, req.path, req.method, req.body, response, 200, req.ip, req.get('User-Agent'), Date.now() - startTime);
    res.json(response);
  } catch (error: any) {
    const response = { success: false, error: error.message || "Credit failed" };
    await logApiRequest(apiUser.id, req.path, req.method, req.body, response, 400, req.ip, req.get('User-Agent'), Date.now() - startTime);
    res.status(400).json(response);
  }
});

router.get("/v1/balance", checkApiMaintenance, authenticateApiKey, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const apiUser = req.apiUser!;

  try {
    const schema = z.object({
      phone: z.string(),
    });

    const data = schema.parse(req.query);
    const user = await storage.getUserByPhone(data.phone);

    if (!user) {
      const response = { success: false, error: "User not found", code: "USER_NOT_FOUND" };
      await logApiRequest(apiUser.id, req.path, req.method, req.query, response, 404, req.ip, req.get('User-Agent'), Date.now() - startTime);
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

    await logApiRequest(apiUser.id, req.path, req.method, req.query, response, 200, req.ip, req.get('User-Agent'), Date.now() - startTime);
    res.json(response);
  } catch (error: any) {
    const response = { success: false, error: error.message || "Failed to get balance" };
    await logApiRequest(apiUser.id, req.path, req.method, req.query, response, 400, req.ip, req.get('User-Agent'), Date.now() - startTime);
    res.status(400).json(response);
  }
});

router.get("/v1/transactions", checkApiMaintenance, authenticateApiKey, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const apiUser = req.apiUser!;

  try {
    const transactions = await storage.getApiTransactionsByMerchant(apiUser.id);

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

    await logApiRequest(apiUser.id, req.path, req.method, req.query, response, 200, req.ip, req.get('User-Agent'), Date.now() - startTime);
    res.json(response);
  } catch (error: any) {
    const response = { success: false, error: error.message || "Failed to get transactions" };
    await logApiRequest(apiUser.id, req.path, req.method, req.query, response, 400, req.ip, req.get('User-Agent'), Date.now() - startTime);
    res.status(400).json(response);
  }
});

export default router;
