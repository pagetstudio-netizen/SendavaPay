import { Router, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import crypto from "crypto";
import { z } from "zod";
import type { User, ApiKey } from "@shared/schema";

const router = Router();

function generateReference(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString("hex");
  return `sdk_${timestamp}_${random}`;
}

function generatePaymentToken(): string {
  return `pay_tok_${crypto.randomBytes(20).toString("hex")}`;
}

const COUNTRY_CODE_MAP: Record<string, { countryCode: string; currency: string; countryName: string }> = {
  TG: { countryCode: "TG", currency: "XOF", countryName: "Togo" },
  BJ: { countryCode: "BJ", currency: "XOF", countryName: "Bénin" },
  SN: { countryCode: "SN", currency: "XOF", countryName: "Sénégal" },
  CI: { countryCode: "CI", currency: "XOF", countryName: "Côte d'Ivoire" },
  ML: { countryCode: "ML", currency: "XOF", countryName: "Mali" },
  BF: { countryCode: "BF", currency: "XOF", countryName: "Burkina Faso" },
  GN: { countryCode: "GN", currency: "GNF", countryName: "Guinée" },
  CM: { countryCode: "CM", currency: "XAF", countryName: "Cameroun" },
  CG: { countryCode: "CG", currency: "XAF", countryName: "Congo" },
};

function detectCountryFromMethod(paymentMethod: string, payerCountry?: string): string {
  if (payerCountry && COUNTRY_CODE_MAP[payerCountry.toUpperCase()]) {
    return payerCountry.toUpperCase();
  }
  const method = (paymentMethod || "").toLowerCase();
  if (method.includes("togocel") || method.includes("tmoney") || method.includes("flooz")) return "TG";
  if (method.includes("mtn_bj") || method.includes("moov_bj")) return "BJ";
  if (method.includes("orange_sn") || method.includes("wave_sn") || method.includes("free_sn")) return "SN";
  if (method.includes("orange_ci") || method.includes("mtn_ci") || method.includes("wave_ci") || method.includes("moov_ci")) return "CI";
  if (method.includes("orange_ml") || method.includes("wave_ml") || method.includes("moov_ml")) return "ML";
  if (method.includes("orange_bf") || method.includes("moov_bf") || method.includes("coris")) return "BF";
  if (method.includes("orange_cm") || method.includes("mtn_cm")) return "CM";
  if (method.includes("orange_cg") || method.includes("airtel_cg")) return "CG";
  if (method.includes("orange_gn") || method.includes("mtn_gn") || method.includes("cellcom")) return "GN";
  return "TG";
}

// CORS pour les endpoints widget (appelés depuis le site du marchand)
function widgetCors(req: Request, res: Response, next: NextFunction) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
}

async function authenticateSdkKey(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Clé API SDK requise", code: "UNAUTHORIZED" });
  }

  const apiKeyValue = authHeader.substring(7);
  const apiKeyRecord = await storage.getApiKeyByKey(apiKeyValue);

  if (!apiKeyRecord) {
    return res.status(401).json({ success: false, error: "Clé API invalide", code: "INVALID_API_KEY" });
  }
  if (!apiKeyRecord.isActive) {
    return res.status(403).json({ success: false, error: "Clé API inactive", code: "API_KEY_INACTIVE" });
  }
  if (apiKeyRecord.apiType !== "sdk") {
    return res.status(403).json({ success: false, error: "Cette clé n'est pas une clé SDK", code: "NOT_SDK_KEY" });
  }

  const user = await storage.getUser(apiKeyRecord.userId);
  if (!user) {
    return res.status(401).json({ success: false, error: "Utilisateur introuvable", code: "USER_NOT_FOUND" });
  }
  if (!user.isVerified) {
    return res.status(403).json({ success: false, error: "Compte non vérifié. Complétez la vérification KYC.", code: "ACCOUNT_NOT_VERIFIED" });
  }
  if (!(user as any).apiSdkEnabled) {
    return res.status(403).json({ success: false, error: "L'API SDK n'est pas activée sur ce compte", code: "SDK_NOT_ENABLED" });
  }

  await storage.incrementApiKeyRequestCount(apiKeyRecord.id);
  (req as any).sdkUser = user;
  (req as any).sdkKey = apiKeyRecord;
  next();
}

async function checkApiMaintenance(req: Request, res: Response, next: NextFunction) {
  try {
    const m = await storage.getSetting("api_docs_maintenance");
    if (m === "true") {
      return res.status(503).json({ success: false, error: "API en maintenance", code: "API_MAINTENANCE" });
    }
    next();
  } catch {
    next();
  }
}

// ─── INFO ────────────────────────────────────────────────────────────────────
router.get("/v1", (_req, res) => {
  res.json({
    success: true,
    data: {
      name: "SendavaPay SDK API",
      version: "2.0.0",
      status: "operational",
      documentation: "/docs",
      endpoints: {
        createPayment: "POST /api/sdk/v1/create-payment",
        verifyPayment: "POST /api/sdk/v1/verify-payment",
        verifyOtp: "POST /api/sdk/v1/verify-otp",
        paymentStatus: "GET /api/sdk/v1/payment-status/:reference",
        withdraw: "POST /api/sdk/v1/withdraw",
        balance: "GET /api/sdk/v1/balance",
        transactions: "GET /api/sdk/v1/transactions",
        updateWebhook: "PUT /api/sdk/v1/webhook",
      },
      widget: {
        embed: '<script src="https://sendavapay.com/sdk/sendavapay.js"></script>',
        usage: 'SendavaPay.init({ token: "pay_tok_xxx", onSuccess: fn, onFailed: fn })',
      },
    },
  });
});

// ─── CREATE PAYMENT (marchand backend → retourne paymentToken) ────────────────
router.post("/v1/create-payment", checkApiMaintenance, authenticateSdkKey, async (req: Request, res: Response) => {
  const sdkUser = (req as any).sdkUser as User;
  const sdkKey = (req as any).sdkKey as ApiKey;

  try {
    const schema = z.object({
      amount: z.number().positive(),
      currency: z.string().default("XOF"),
      description: z.string().optional(),
      externalReference: z.string().optional(),
      customerEmail: z.string().email().optional(),
      customerPhone: z.string().optional(),
      customerName: z.string().optional(),
      payerCountry: z.string().length(2).optional(),
      paymentMethod: z.string().optional(),
      webhookUrl: z.string().url().optional(),
      metadata: z.record(z.any()).optional(),
    });

    const data = schema.parse(req.body);
    const reference = generateReference();
    const paymentToken = generatePaymentToken();
    const tokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Anti-double paiement : si même externalReference déjà pending/completed → rejeter
    if (data.externalReference) {
      const existing = await storage.getApiTransactionsByUser(sdkUser.id);
      const dup = existing.find(
        (t) =>
          t.externalReference === data.externalReference &&
          (t.status === "pending" || t.status === "completed")
      );
      if (dup) {
        return res.status(409).json({
          success: false,
          error: "Un paiement avec cette référence existe déjà",
          code: "DUPLICATE_REFERENCE",
          data: { reference: dup.reference, status: dup.status },
        });
      }
    }

    const countryCode = data.payerCountry
      ? data.payerCountry.toUpperCase()
      : data.paymentMethod
      ? detectCountryFromMethod(data.paymentMethod, data.payerCountry)
      : null;

    const transaction = await storage.createApiTransaction({
      userId: sdkUser.id,
      apiKeyId: sdkKey.id,
      reference,
      externalReference: data.externalReference || null,
      type: "payment",
      amount: data.amount.toString(),
      currency: data.currency,
      description: data.description || null,
      customerEmail: data.customerEmail || null,
      customerPhone: data.customerPhone || null,
      customerName: data.customerName || null,
      callbackUrl: data.webhookUrl || sdkKey.webhookUrl || null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      paymentToken,
      tokenExpiresAt,
      ipAddress: req.ip || null,
      userAgent: req.get("User-Agent") || null,
    } as any);

    res.status(201).json({
      success: true,
      data: {
        reference: transaction.reference,
        paymentToken,
        expiresAt: tokenExpiresAt.toISOString(),
        amount: data.amount,
        currency: data.currency,
        status: "pending",
        walletRouting: countryCode
          ? {
              detectedCountry: countryCode,
              targetWallet: COUNTRY_CODE_MAP[countryCode]?.countryName || countryCode,
            }
          : null,
        widget: {
          embed: '<script src="https://sendavapay.com/sdk/sendavapay.js"></script>',
          init: `SendavaPay.init({ token: "${paymentToken}", onSuccess: fn, onFailed: fn })`,
        },
        createdAt: transaction.createdAt,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || "Erreur lors de la création du paiement" });
  }
});

// ─── VERIFY PAYMENT (marchand backend) ───────────────────────────────────────
router.post("/v1/verify-payment", checkApiMaintenance, authenticateSdkKey, async (req: Request, res: Response) => {
  const sdkUser = (req as any).sdkUser as User;

  try {
    const schema = z.object({ reference: z.string() });
    const { reference } = schema.parse(req.body);

    const transaction = await storage.getApiTransactionByReference(reference);
    if (!transaction) {
      return res.status(404).json({ success: false, error: "Paiement introuvable", code: "NOT_FOUND" });
    }
    if (transaction.userId !== sdkUser.id) {
      return res.status(403).json({ success: false, error: "Non autorisé", code: "UNAUTHORIZED" });
    }

    res.json({
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
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || "Erreur de vérification" });
  }
});

// ─── PAYMENT STATUS (GET — polling marchand backend) ─────────────────────────
router.get("/v1/payment-status/:reference", checkApiMaintenance, authenticateSdkKey, async (req: Request, res: Response) => {
  const sdkUser = (req as any).sdkUser as User;

  try {
    const transaction = await storage.getApiTransactionByReference(req.params.reference);
    if (!transaction) {
      return res.status(404).json({ success: false, error: "Paiement introuvable", code: "NOT_FOUND" });
    }
    if (transaction.userId !== sdkUser.id) {
      return res.status(403).json({ success: false, error: "Non autorisé", code: "UNAUTHORIZED" });
    }

    res.json({
      success: true,
      data: {
        reference: transaction.reference,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        completedAt: transaction.completedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Erreur serveur" });
  }
});

// ─── VERIFY OTP (widget → backend) ───────────────────────────────────────────
router.options("/v1/verify-otp", widgetCors);
router.post("/v1/verify-otp", widgetCors, async (req: Request, res: Response) => {
  try {
    const schema = z.object({ reference: z.string(), otp: z.string().min(4) });
    const { reference, otp } = schema.parse(req.body);

    const transaction = await storage.getApiTransactionByReference(reference);
    if (!transaction) {
      return res.status(404).json({ success: false, error: "Transaction introuvable" });
    }
    if (transaction.status !== "processing") {
      return res.status(400).json({ success: false, error: "Transaction non en attente d'OTP" });
    }

    // Soumettre l'OTP via SoleasPay (si applicable)
    const { soleaspay } = await import("./soleaspay");
    const extRef = transaction.externalReference || "";
    const parts = extRef.split("|");
    const orderId = parts[0] || extRef;
    const payId = parts[1] || extRef;

    const otpResult = await (soleaspay as any).submitOtp?.({ orderId, payId, otp });

    if (otpResult && !otpResult.success) {
      return res.status(400).json({ success: false, error: otpResult.message || "OTP invalide" });
    }

    res.json({ success: true, message: "OTP soumis, vérification en cours" });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || "Erreur OTP" });
  }
});

// ─── WIDGET TOKEN (widget → backend, CORS) ────────────────────────────────────
router.options("/widget/token/:token", widgetCors);
router.get("/widget/token/:token", widgetCors, async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const transaction = await storage.getApiTransactionByToken(token);

    if (!transaction) {
      return res.status(404).json({ success: false, error: "Token invalide ou expiré" });
    }

    // Vérifier expiration
    if (transaction.tokenExpiresAt && new Date() > new Date(transaction.tokenExpiresAt)) {
      return res.status(410).json({ success: false, error: "Ce lien de paiement a expiré" });
    }

    // Récupérer le nom du marchand
    const user = await storage.getUser(transaction.userId);
    let ownerName = user?.fullName || "SendavaPay";
    if (transaction.apiKeyId) {
      const apiKey = await storage.getApiKeyById(transaction.apiKeyId);
      if (apiKey?.appName) ownerName = apiKey.appName;
    }

    res.json({
      success: true,
      data: {
        reference: transaction.reference,
        amount: transaction.amount,
        currency: transaction.currency,
        description: transaction.description,
        status: transaction.status,
        ownerName,
        customerName: transaction.customerName,
        customerPhone: transaction.customerPhone,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// ─── WITHDRAW ────────────────────────────────────────────────────────────────
router.post("/v1/withdraw", checkApiMaintenance, authenticateSdkKey, async (req: Request, res: Response) => {
  const sdkUser = (req as any).sdkUser as User;
  const sdkKey = (req as any).sdkKey as ApiKey;

  try {
    const schema = z.object({
      amount: z.number().positive(),
      phoneNumber: z.string().min(8),
      operator: z.string(),
      country: z.string().length(2),
      currency: z.string().default("XOF"),
      description: z.string().optional(),
      externalReference: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const countryUpper = data.country.toUpperCase();
    const countryInfo = COUNTRY_CODE_MAP[countryUpper];

    if (!countryInfo) {
      return res.status(400).json({
        success: false,
        error: `Pays non supporté: ${data.country}. Pays supportés: ${Object.keys(COUNTRY_CODE_MAP).join(", ")}`,
        code: "UNSUPPORTED_COUNTRY",
      });
    }

    const userWallets = await storage.getUserWallets(sdkUser.id);
    const targetWallet = userWallets.find((w) => w.countryCode === countryUpper);

    if (!targetWallet) {
      return res.status(400).json({
        success: false,
        error: `Wallet ${countryInfo.countryName} introuvable sur votre compte`,
        code: "WALLET_NOT_FOUND",
      });
    }

    const walletBalance = parseFloat(targetWallet.balance);
    if (walletBalance < data.amount) {
      return res.status(400).json({
        success: false,
        error: `Solde insuffisant sur le wallet ${countryInfo.countryName}. Disponible: ${walletBalance} ${countryInfo.currency}`,
        code: "INSUFFICIENT_BALANCE",
      });
    }

    const reference = generateReference();
    const sdkFeeRate =
      (sdkUser as any).customApiSdkFeeRate != null ? parseFloat((sdkUser as any).customApiSdkFeeRate) : 1;
    const fee = parseFloat((data.amount * sdkFeeRate / 100).toFixed(2));
    const netAmount = data.amount - fee;

    const withdrawalRequest = await storage.createWithdrawalRequest({
      userId: sdkUser.id,
      amount: data.amount.toString(),
      fee: fee.toString(),
      netAmount: netAmount.toString(),
      paymentMethod: data.operator,
      mobileNumber: data.phoneNumber,
      country: countryUpper,
      walletName: countryInfo.countryName,
      walletId: targetWallet.id,
    });

    await storage.createApiTransaction({
      userId: sdkUser.id,
      apiKeyId: sdkKey.id,
      reference,
      externalReference: data.externalReference || null,
      type: "withdrawal",
      amount: data.amount.toString(),
      currency: data.currency,
      description: data.description || `Retrait API SDK vers ${data.phoneNumber}`,
      customerPhone: data.phoneNumber,
      callbackUrl: sdkKey.webhookUrl || null,
      ipAddress: req.ip || null,
      userAgent: req.get("User-Agent") || null,
    } as any);

    res.status(201).json({
      success: true,
      data: {
        withdrawalId: withdrawalRequest.id,
        reference,
        amount: data.amount,
        fee,
        netAmount,
        currency: data.currency,
        phoneNumber: data.phoneNumber,
        operator: data.operator,
        country: countryUpper,
        countryName: countryInfo.countryName,
        status: "pending",
        message: "Demande de retrait créée. Elle sera traitée par l'administrateur.",
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || "Erreur lors du retrait" });
  }
});

// ─── BALANCE ─────────────────────────────────────────────────────────────────
router.get("/v1/balance", checkApiMaintenance, authenticateSdkKey, async (req: Request, res: Response) => {
  const sdkUser = (req as any).sdkUser as User;

  try {
    const wallets = await storage.getUserWallets(sdkUser.id);
    const country = (req.query.country as string | undefined)?.toUpperCase();

    if (country) {
      const w = wallets.find((w) => w.countryCode === country);
      if (!w) {
        return res.status(404).json({ success: false, error: `Wallet ${country} introuvable`, code: "WALLET_NOT_FOUND" });
      }
      return res.json({ success: true, data: { country: w.countryCode, countryName: w.countryName, balance: w.balance, currency: w.currency } });
    }

    res.json({
      success: true,
      data: {
        wallets: wallets.map((w) => ({ country: w.countryCode, countryName: w.countryName, balance: w.balance, currency: w.currency })),
        totalWallets: wallets.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Erreur serveur" });
  }
});

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
router.get("/v1/transactions", checkApiMaintenance, authenticateSdkKey, async (req: Request, res: Response) => {
  const sdkUser = (req as any).sdkUser as User;

  try {
    const transactions = await storage.getApiTransactionsByUser(sdkUser.id);
    res.json({
      success: true,
      data: {
        transactions: transactions.map((t) => ({
          reference: t.reference,
          externalReference: t.externalReference,
          type: t.type,
          amount: t.amount,
          fee: t.fee,
          currency: t.currency,
          status: t.status,
          customerPhone: t.customerPhone,
          customerName: t.customerName,
          paymentMethod: t.paymentMethod,
          createdAt: t.createdAt,
          completedAt: t.completedAt,
        })),
        total: transactions.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Erreur serveur" });
  }
});

// ─── WEBHOOK ──────────────────────────────────────────────────────────────────
router.put("/v1/webhook", authenticateSdkKey, async (req: Request, res: Response) => {
  const sdkKey = (req as any).sdkKey as ApiKey;

  try {
    const schema = z.object({ webhookUrl: z.string().url() });
    const { webhookUrl } = schema.parse(req.body);

    const cryptoMod = await import("crypto");
    const webhookSecret = `whsec_${cryptoMod.randomBytes(24).toString("hex")}`;

    await storage.updateApiKey(sdkKey.id, { webhookUrl, webhookSecret });

    res.json({
      success: true,
      data: { webhookUrl, webhookSecret, message: "Webhook configuré avec succès." },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || "Erreur de configuration webhook" });
  }
});

export default router;
