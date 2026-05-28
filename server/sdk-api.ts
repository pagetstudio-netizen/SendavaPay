import { Router, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import crypto from "crypto";
import { z } from "zod";
import type { User, ApiKey } from "@shared/schema";
import { getServiceById, getServicesByCountry, SOLEASPAY_SERVICES, formatPhoneForSoleasPay } from "./soleaspay";
import { getSoftPayOperator, SOFTPAY_OPERATORS } from "./paydunya-softpay-map";

const router = Router();

// ─── OTP Store (in-memory, expiry 10 min) ─────────────────────────────────────
interface OtpEntry {
  reference: string;
  serviceId: number;
  payerName: string;
  payerPhone: string;
  payerEmail: string;
  payerCountry: string;
  amount: number;
  description: string;
  gateway: string;
  expiresAt: Date;
}
const otpStore = new Map<string, OtpEntry>();
setInterval(() => {
  const now = new Date();
  for (const [token, entry] of otpStore.entries()) {
    if (entry.expiresAt < now) otpStore.delete(token);
  }
}, 5 * 60 * 1000);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateReference(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString("hex");
  return `sdk_${timestamp}_${random}`;
}

function generatePaymentToken(): string {
  return `pay_tok_${crypto.randomBytes(20).toString("hex")}`;
}

function generateOtpToken(): string {
  return `otp_${crypto.randomBytes(16).toString("hex")}`;
}

function getOperatorSlug(service: typeof SOLEASPAY_SERVICES[0]): string {
  const gateway = service.paymentGateway || "soleaspay";
  if (gateway === "paydunya") {
    const pd = getSoftPayOperator(service.operator, service.countryCode);
    if (pd) return pd.slug;
  }
  return `${service.operator.toLowerCase().replace(/[\s\/]+/g, "-")}-${service.countryCode.toLowerCase()}`;
}

const COUNTRY_CODE_MAP: Record<string, { countryCode: string; currency: string; countryName: string }> = {
  TG:  { countryCode: "TG",  currency: "XOF", countryName: "Togo" },
  BJ:  { countryCode: "BJ",  currency: "XOF", countryName: "Bénin" },
  SN:  { countryCode: "SN",  currency: "XOF", countryName: "Sénégal" },
  CI:  { countryCode: "CI",  currency: "XOF", countryName: "Côte d'Ivoire" },
  ML:  { countryCode: "ML",  currency: "XOF", countryName: "Mali" },
  BF:  { countryCode: "BF",  currency: "XOF", countryName: "Burkina Faso" },
  GN:  { countryCode: "GN",  currency: "GNF", countryName: "Guinée" },
  CM:  { countryCode: "CM",  currency: "XAF", countryName: "Cameroun" },
  CG:  { countryCode: "CG",  currency: "XAF", countryName: "Congo" },
  COD: { countryCode: "COD", currency: "CDF", countryName: "RDC" },
  COG: { countryCode: "COG", currency: "XAF", countryName: "Congo Brazzaville" },
};

function detectCountryFromMethod(paymentMethod: string, payerCountry?: string): string {
  if (payerCountry && COUNTRY_CODE_MAP[payerCountry.toUpperCase()]) return payerCountry.toUpperCase();
  const method = (paymentMethod || "").toLowerCase();
  if (method.includes("tmoney") || method.includes("flooz")) return "TG";
  if (method.includes("mtn_bj") || method.includes("moov_bj")) return "BJ";
  if (method.includes("orange_sn") || method.includes("wave_sn")) return "SN";
  if (method.includes("orange_ci") || method.includes("mtn_ci") || method.includes("wave_ci") || method.includes("moov_ci")) return "CI";
  if (method.includes("orange_ml")) return "ML";
  if (method.includes("orange_bf") || method.includes("moov_bf")) return "BF";
  if (method.includes("orange_cm") || method.includes("mtn_cm")) return "CM";
  return "TG";
}

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
  if (!apiKeyRecord) return res.status(401).json({ success: false, error: "Clé API invalide", code: "INVALID_API_KEY" });
  if (!apiKeyRecord.isActive) return res.status(403).json({ success: false, error: "Clé API inactive", code: "API_KEY_INACTIVE" });
  if (apiKeyRecord.apiType !== "sdk") return res.status(403).json({ success: false, error: "Cette clé n'est pas une clé SDK", code: "NOT_SDK_KEY" });
  const user = await storage.getUser(apiKeyRecord.userId);
  if (!user) return res.status(401).json({ success: false, error: "Utilisateur introuvable", code: "USER_NOT_FOUND" });
  if (!user.isVerified) return res.status(403).json({ success: false, error: "Compte non vérifié. Complétez la vérification KYC.", code: "ACCOUNT_NOT_VERIFIED" });
  if (!(user as any).apiSdkEnabled) return res.status(403).json({ success: false, error: "L'API SDK n'est pas activée sur ce compte", code: "SDK_NOT_ENABLED" });
  await storage.incrementApiKeyRequestCount(apiKeyRecord.id);
  (req as any).sdkUser = user;
  (req as any).sdkKey = apiKeyRecord;
  next();
}

async function checkApiMaintenance(req: Request, res: Response, next: NextFunction) {
  try {
    const m = await storage.getSetting("api_docs_maintenance");
    if (m === "true") return res.status(503).json({ success: false, error: "API en maintenance", code: "API_MAINTENANCE" });
    next();
  } catch { next(); }
}

// ─── INFO ─────────────────────────────────────────────────────────────────────
router.get("/v1", (_req, res) => {
  res.json({
    success: true,
    data: {
      name: "SendavaPay SDK API",
      version: "3.0.0",
      status: "operational",
      documentation: "/docs",
      endpoints: {
        createPayment:    "POST /api/sdk/v1/create-payment",
        initiatePayment:  "POST /api/sdk/v1/initiate-payment",
        submitOtp:        "POST /api/sdk/v1/submit-otp",
        verifyPayment:    "POST /api/sdk/v1/verify-payment",
        paymentToken:     "GET  /api/sdk/v1/payment-token/:paymentToken",
        paymentStatus:    "GET  /api/sdk/v1/payment-status/:reference",
        operators:        "GET  /api/sdk/v1/operators/:countryCode",
        operatorsStatus:  "GET  /api/sdk/v1/operators-status",
        retryPayment:     "POST /api/sdk/v1/retry-payment",
        withdraw:         "POST /api/sdk/v1/withdraw",
        balance:          "GET  /api/sdk/v1/balance",
        transactions:     "GET  /api/sdk/v1/transactions",
        updateWebhook:    "PUT  /api/sdk/v1/webhook",
        health:           "GET  /api/sdk/v1/health",
      },
    },
  });
});

// ─── CREATE PAYMENT ───────────────────────────────────────────────────────────
router.post("/v1/create-payment", checkApiMaintenance, authenticateSdkKey, async (req: Request, res: Response) => {
  const sdkUser = (req as any).sdkUser as User;
  const sdkKey  = (req as any).sdkKey  as ApiKey;

  try {
    const schema = z.object({
      amount:            z.number().positive(),
      currency:          z.string().default("XOF"),
      description:       z.string().optional(),
      externalReference: z.string().optional(),
      customerEmail:     z.string().email().optional(),
      customerPhone:     z.string().optional(),
      customerName:      z.string().optional(),
      payerCountry:      z.string().length(2).optional(),
      paymentMethod:     z.string().optional(),
      webhookUrl:        z.string().url().optional(),
      metadata:          z.record(z.any()).optional(),
    });

    const data = schema.parse(req.body);
    const reference     = generateReference();
    const paymentToken  = generatePaymentToken();
    const tokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

    if (data.externalReference) {
      const existing = await storage.getApiTransactionsByUser(sdkUser.id);
      const dup = existing.find(
        t => t.externalReference === data.externalReference &&
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
      userId:            sdkUser.id,
      apiKeyId:          sdkKey.id,
      reference,
      externalReference: data.externalReference || null,
      type:              "payment",
      amount:            data.amount.toString(),
      currency:          data.currency,
      description:       data.description || null,
      customerEmail:     data.customerEmail || null,
      customerPhone:     data.customerPhone || null,
      customerName:      data.customerName  || null,
      callbackUrl:       data.webhookUrl || sdkKey.webhookUrl || null,
      metadata:          data.metadata ? JSON.stringify(data.metadata) : null,
      paymentToken,
      tokenExpiresAt,
      ipAddress:         req.ip || null,
      userAgent:         req.get("User-Agent") || null,
    } as any);

    res.status(201).json({
      success: true,
      data: {
        reference:    transaction.reference,
        paymentToken,
        expiresAt:    tokenExpiresAt.toISOString(),
        amount:       data.amount,
        currency:     data.currency,
        status:       "pending",
        nextStep:     "POST /api/sdk/v1/initiate-payment",
        createdAt:    transaction.createdAt,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || "Erreur lors de la création du paiement" });
  }
});

// ─── GET OPERATORS FOR A COUNTRY (public, CORS) ───────────────────────────────
router.options("/v1/operators/:countryCode", widgetCors);
router.get("/v1/operators/:countryCode", widgetCors, async (req: Request, res: Response) => {
  try {
    const countryCode = req.params.countryCode.toUpperCase();
    const services    = getServicesByCountry(countryCode);

    if (!services.length) {
      return res.json({ success: true, data: [] });
    }

    const dbOperators = await storage.getOperators();

    const data = services.map(service => {
      const dbOp           = dbOperators.find(op => op.code === service.id.toString());
      const gateway        = dbOp?.paymentGateway || service.paymentGateway || "soleaspay";
      const inMaintenance  = (dbOp?.inMaintenance || dbOp?.maintenanceApi) ?? false;
      const pdOp           = gateway === "paydunya" ? getSoftPayOperator(service.operator, service.countryCode) : null;
      const requiresOtp    = pdOp?.requiresOtp ?? false;
      const slug           = getOperatorSlug({ ...service, paymentGateway: gateway });

      return {
        id:          String(service.id),
        name:        service.description,
        operator:    service.operator,
        slug,
        currency:    service.currency,
        gateway,
        requiresOtp,
        available:   !inMaintenance,
      };
    });

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Erreur serveur", code: "SERVER_ERROR" });
  }
});

// ─── OPERATORS STATUS (public, CORS) ─────────────────────────────────────────
router.options("/v1/operators-status", widgetCors);
router.get("/v1/operators-status", widgetCors, async (_req: Request, res: Response) => {
  try {
    const dbOperators = await storage.getOperators();

    const data = SOLEASPAY_SERVICES.map(service => {
      const dbOp          = dbOperators.find(op => op.code === service.id.toString());
      const inMaintenance = (dbOp?.inMaintenance || dbOp?.maintenanceApi) ?? false;
      const gateway       = dbOp?.paymentGateway || service.paymentGateway || "soleaspay";
      const slug          = getOperatorSlug({ ...service, paymentGateway: gateway });

      return {
        id:       String(service.id),
        slug,
        operator: service.operator,
        country:  service.countryCode,
        currency: service.currency,
        gateway,
        status:   inMaintenance ? "maintenance" : "online",
      };
    });

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Erreur serveur", code: "SERVER_ERROR" });
  }
});

// ─── GET PAYMENT INFO BY TOKEN (public, CORS) ─────────────────────────────────
router.options("/v1/payment-token/:token", widgetCors);
router.get("/v1/payment-token/:token", widgetCors, async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const transaction = await storage.getApiTransactionByToken(token);

    if (!transaction) {
      return res.status(404).json({ success: false, error: "Token invalide ou expiré", code: "INVALID_TOKEN" });
    }
    if (transaction.tokenExpiresAt && new Date() > new Date(transaction.tokenExpiresAt)) {
      return res.status(410).json({ success: false, error: "Ce token de paiement a expiré", code: "TOKEN_EXPIRED" });
    }

    const user = await storage.getUser(transaction.userId);
    let merchantName = user?.fullName || "SendavaPay";
    if (transaction.apiKeyId) {
      const apiKey = await storage.getApiKeyById(transaction.apiKeyId);
      if (apiKey?.appName) merchantName = apiKey.appName;
    }

    res.json({
      success: true,
      data: {
        reference:    transaction.reference,
        amount:       transaction.amount,
        currency:     transaction.currency,
        description:  transaction.description,
        status:       transaction.status,
        merchantName,
        customerName:  transaction.customerName  || null,
        customerPhone: transaction.customerPhone || null,
        expiresAt:    transaction.tokenExpiresAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Erreur serveur", code: "SERVER_ERROR" });
  }
});

// ─── INITIATE PAYMENT (public, CORS) ──────────────────────────────────────────
// Le marchand contrôle son propre frontend. Il passe le paymentToken + opérateur choisi.
router.options("/v1/initiate-payment", widgetCors);
router.post("/v1/initiate-payment", widgetCors, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      paymentToken: z.string(),
      payerName:    z.string().min(1),
      payerPhone:   z.string().min(6),
      payerEmail:   z.string().email().optional().or(z.literal("")).transform(v => v || undefined),
      payerCountry: z.string().min(2).max(3),
      operatorId:   z.union([z.number(), z.string()]).transform(v => parseInt(String(v), 10)),
      otp:          z.string().optional(),
      address:      z.string().optional(),
    });

    const data = schema.parse(req.body);

    const transaction = await storage.getApiTransactionByToken(data.paymentToken);
    if (!transaction) {
      return res.status(404).json({ success: false, error: "Token de paiement invalide ou expiré", code: "INVALID_TOKEN" });
    }
    if (transaction.tokenExpiresAt && new Date() > new Date(transaction.tokenExpiresAt)) {
      return res.status(410).json({ success: false, error: "Ce token de paiement a expiré", code: "TOKEN_EXPIRED" });
    }
    if (transaction.status === "completed") {
      return res.status(409).json({ success: false, error: "Ce paiement a déjà été complété", code: "ALREADY_COMPLETED" });
    }
    if (transaction.status === "processing") {
      return res.status(409).json({ success: false, error: "Un paiement est déjà en cours", code: "PAYMENT_IN_PROGRESS" });
    }
    if (transaction.status !== "pending") {
      return res.status(400).json({ success: false, error: "Ce paiement ne peut plus être traité", code: "INVALID_STATUS" });
    }

    const service = getServiceById(data.operatorId);
    if (!service) {
      return res.status(400).json({ success: false, error: "Opérateur invalide", code: "INVALID_OPERATOR" });
    }

    const payerCountry = data.payerCountry.toUpperCase();
    if (service.countryCode.toUpperCase() !== payerCountry) {
      return res.status(400).json({
        success: false,
        error: `Cet opérateur n'est pas disponible pour le pays ${payerCountry}`,
        code: "COUNTRY_MISMATCH",
      });
    }

    const dbOperators   = await storage.getOperators();
    const dbOp          = dbOperators.find(op => op.code === String(data.operatorId));
    const paymentGateway = dbOp?.paymentGateway || service.paymentGateway || "soleaspay";

    if (dbOp?.inMaintenance || dbOp?.maintenanceApi) {
      return res.status(503).json({
        success: false,
        error:   "Opérateur temporairement indisponible",
        code:    "OPERATOR_UNAVAILABLE",
      });
    }

    const amount      = parseFloat(transaction.amount);
    const description = transaction.description || `Paiement ${transaction.reference}`;
    const orderId     = `API_${transaction.reference}_${Date.now()}`;
    const baseUrl     = "https://sendavapay.com";

    await storage.updateApiTransaction(transaction.id, {
      customerName:  data.payerName,
      customerPhone: data.payerPhone,
      customerEmail: data.payerEmail || null,
      paymentMethod: paymentGateway === "omnipay"
        ? `omnipay_${service.operator}`
        : paymentGateway === "paydunya"
          ? `paydunya_${service.operator}`
          : service.operator,
      status: "processing",
    });

    // ── PayDunya ────────────────────────────────────────────────────────────
    if (paymentGateway === "paydunya") {
      const { initiatePayDunySoftPay, formatPhoneForPayDunya, createPayDunyaCheckout } = await import("./paydunya");
      const pdOp = getSoftPayOperator(service.operator, service.countryCode);

      if (pdOp?.requiresOtp && !data.otp) {
        // OTP requis — stocker les infos et retourner otpToken
        const otpToken = generateOtpToken();
        otpStore.set(otpToken, {
          reference:    transaction.reference,
          serviceId:    data.operatorId,
          payerName:    data.payerName,
          payerPhone:   data.payerPhone,
          payerEmail:   data.payerEmail || "",
          payerCountry: payerCountry,
          amount,
          description,
          gateway:      "paydunya",
          expiresAt:    new Date(Date.now() + 10 * 60 * 1000),
        });
        await storage.updateApiTransaction(transaction.id, { status: "pending" });
        return res.json({
          success:    true,
          requiresOtp: true,
          otpToken,
          message:    "Demandez au client de composer *144# sur son téléphone pour obtenir son OTP, puis soumettez-le via /submit-otp",
          nextStep:   "POST /api/sdk/v1/submit-otp",
        });
      }

      const phone = formatPhoneForPayDunya(data.payerPhone, payerCountry);
      const pdResult = await initiatePayDunySoftPay(
        service,
        phone,
        data.payerName,
        data.payerEmail || "client@sendavapay.com",
        amount,
        description,
        baseUrl,
        data.otp,
        data.address,
      );

      if (!pdResult.success) {
        // Fallback checkout URL
        try {
          const checkout = await createPayDunyaCheckout({
            totalAmount:  amount,
            description,
            storeName:    "SendavaPay",
            callbackUrl:  `${baseUrl}/api/webhook/paydunya`,
            returnUrl:    `${baseUrl}/success?reference=${transaction.reference}`,
            cancelUrl:    `${baseUrl}/pay/api/${transaction.reference}`,
          });
          if (checkout.success && checkout.checkoutUrl) {
            await storage.updateApiTransaction(transaction.id, {
              externalReference: checkout.token || orderId,
            });
            return res.json({
              success:       true,
              requiresOtp:   false,
              requiresRedirect: true,
              redirectUrl:   checkout.checkoutUrl,
              reference:     transaction.reference,
              message:       "Redirigez le client vers cette URL pour compléter le paiement",
            });
          }
        } catch (_) {}

        await storage.updateApiTransaction(transaction.id, { status: "failed" });
        return res.status(500).json({
          success: false,
          error:   pdResult.error || "Échec de l'initiation du paiement",
          code:    "PAYMENT_INITIATION_FAILED",
        });
      }

      if (pdResult.redirectUrl) {
        await storage.updateApiTransaction(transaction.id, {
          externalReference: `${orderId}|${pdResult.redirectUrl}`,
        });
        return res.json({
          success:          true,
          requiresOtp:      false,
          requiresRedirect: true,
          redirectUrl:      pdResult.redirectUrl,
          reference:        transaction.reference,
          message:          "Redirigez le client vers cette URL pour compléter le paiement",
        });
      }

      const invoiceToken = (pdResult as any).invoiceToken || orderId;
      await storage.updateApiTransaction(transaction.id, {
        externalReference: `${orderId}|${invoiceToken}`,
      });

      return res.json({
        success:     true,
        requiresOtp: false,
        reference:   transaction.reference,
        payId:       invoiceToken,
        provider:    "paydunya",
        message:     "Paiement initié. Le client va recevoir une demande de confirmation sur son téléphone.",
      });
    }

    // ── OmniPay ─────────────────────────────────────────────────────────────
    if (paymentGateway === "omnipay") {
      const { omnipay: opClient, getOmnipayOperator, formatPhoneForOmnipay } = await import("./omnipay");
      const opOperator = getOmnipayOperator(dbOp?.name || service.operator);

      if (opOperator === undefined) {
        await storage.updateApiTransaction(transaction.id, { status: "failed" });
        return res.status(400).json({
          success: false,
          error:   "Opérateur non supporté",
          code:    "OPERATOR_UNAVAILABLE",
        });
      }

      const cleanPhone  = formatPhoneForOmnipay(data.payerPhone, payerCountry);
      const isWave      = opOperator === "wave";
      const nameParts   = data.payerName.split(" ");
      const firstName   = nameParts[0];
      const lastName    = nameParts.slice(1).join(" ") || nameParts[0];
      const autoOtp     = service.operator === "Orange"
        ? String(Math.floor(100000 + Math.random() * 900000))
        : undefined;

      const opResult = await opClient.requestPayment({
        msisdn:      cleanPhone,
        amount,
        reference:   orderId,
        firstName,
        lastName,
        operator:    opOperator ?? undefined,
        otp:         autoOtp,
        returnUrl:   isWave ? `${baseUrl}/success?reference=${orderId}` : undefined,
        callbackUrl: `${baseUrl}/api/webhook/omnipay`,
      });

      if (String(opResult.success) !== "1") {
        await storage.updateApiTransaction(transaction.id, { status: "failed" });
        return res.status(500).json({
          success: false,
          error:   opResult.message || "Échec de l'initiation du paiement",
          code:    "PAYMENT_INITIATION_FAILED",
        });
      }

      const payId   = opResult.transaction_id || opResult.reference || orderId;
      const waveUrl = opResult.payment_url || opResult.wave_launch_url || opResult.redirect_url;

      await storage.updateApiTransaction(transaction.id, {
        externalReference: `${orderId}|${payId}`,
      });

      return res.json({
        success:          true,
        requiresOtp:      false,
        requiresRedirect: isWave && !!waveUrl,
        redirectUrl:      waveUrl || null,
        reference:        transaction.reference,
        payId,
        provider:         "omnipay",
        message:          isWave && waveUrl
          ? "Redirigez le client vers l'application Wave pour confirmer le paiement"
          : "Le client va recevoir une demande de confirmation sur son téléphone",
      });
    }

    // ── SoleasPay (fallback) ─────────────────────────────────────────────────
    const { soleaspay, formatPhoneForSoleasPay: fmtPhone } = await import("./soleaspay");
    const cleanPhone = fmtPhone(data.payerPhone, payerCountry);

    const spResult = await (soleaspay as any).initiatePayment?.({
      phone:     cleanPhone,
      amount,
      orderId,
      serviceId: data.operatorId,
      callbackUrl: `${baseUrl}/api/webhook/soleaspay`,
    });

    if (!spResult?.success) {
      await storage.updateApiTransaction(transaction.id, { status: "failed" });
      return res.status(500).json({
        success: false,
        error:   spResult?.message || "Échec de l'initiation du paiement",
        code:    "PAYMENT_INITIATION_FAILED",
      });
    }

    const payId = spResult.payId || orderId;
    await storage.updateApiTransaction(transaction.id, {
      externalReference: `${orderId}|${payId}`,
    });

    return res.json({
      success:     true,
      requiresOtp: false,
      reference:   transaction.reference,
      payId,
      orderId,
      provider:    "soleaspay",
      message:     "Le client va recevoir une demande de confirmation sur son téléphone",
    });
  } catch (error: any) {
    console.error("[initiate-payment]", error);
    res.status(500).json({ success: false, error: error.message || "Erreur serveur", code: "SERVER_ERROR" });
  }
});

// ─── SUBMIT OTP (public, CORS) ────────────────────────────────────────────────
router.options("/v1/submit-otp", widgetCors);
router.post("/v1/submit-otp", widgetCors, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      otpToken: z.string().startsWith("otp_"),
      otp:      z.string().min(4).max(8),
    });

    const { otpToken, otp } = schema.parse(req.body);

    const entry = otpStore.get(otpToken);
    if (!entry) {
      return res.status(404).json({ success: false, error: "Token OTP invalide ou expiré", code: "INVALID_OTP_TOKEN" });
    }
    if (new Date() > entry.expiresAt) {
      otpStore.delete(otpToken);
      return res.status(410).json({ success: false, error: "Token OTP expiré", code: "OTP_TOKEN_EXPIRED" });
    }

    const transaction = await storage.getApiTransactionByReference(entry.reference);
    if (!transaction || transaction.status !== "pending") {
      otpStore.delete(otpToken);
      return res.status(400).json({ success: false, error: "Transaction introuvable ou déjà traitée", code: "INVALID_TRANSACTION" });
    }

    const service = getServiceById(entry.serviceId);
    if (!service) {
      return res.status(400).json({ success: false, error: "Opérateur invalide", code: "INVALID_OPERATOR" });
    }

    await storage.updateApiTransaction(transaction.id, { status: "processing" });

    const { initiatePayDunySoftPay, formatPhoneForPayDunya } = await import("./paydunya");
    const phone    = formatPhoneForPayDunya(entry.payerPhone, entry.payerCountry);
    const orderId  = `API_${entry.reference}_${Date.now()}`;
    const baseUrl  = "https://sendavapay.com";

    const pdResult = await initiatePayDunySoftPay(
      service,
      phone,
      entry.payerName,
      entry.payerEmail || "client@sendavapay.com",
      entry.amount,
      entry.description,
      baseUrl,
      otp,
    );

    otpStore.delete(otpToken);

    if (!pdResult.success) {
      await storage.updateApiTransaction(transaction.id, { status: "failed" });
      return res.status(400).json({
        success: false,
        error:   pdResult.error || "Code OTP invalide ou paiement refusé",
        code:    "OTP_FAILED",
      });
    }

    const invoiceToken = (pdResult as any).invoiceToken || orderId;
    await storage.updateApiTransaction(transaction.id, {
      externalReference: `${orderId}|${invoiceToken}`,
    });

    res.json({
      success:   true,
      reference: entry.reference,
      payId:     invoiceToken,
      provider:  "paydunya",
      message:   "OTP accepté. Le paiement est en cours de traitement.",
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || "Erreur OTP", code: "OTP_ERROR" });
  }
});

// ─── RETRY PAYMENT (public, CORS) ────────────────────────────────────────────
router.options("/v1/retry-payment", widgetCors);
router.post("/v1/retry-payment", widgetCors, async (req: Request, res: Response) => {
  try {
    const schema = z.object({ paymentToken: z.string() });
    const { paymentToken } = schema.parse(req.body);

    const transaction = await storage.getApiTransactionByToken(paymentToken);
    if (!transaction) {
      return res.status(404).json({ success: false, error: "Token invalide", code: "INVALID_TOKEN" });
    }
    if (transaction.status !== "failed") {
      return res.status(400).json({
        success: false,
        error:   "Seuls les paiements échoués peuvent être relancés",
        code:    "INVALID_STATUS",
      });
    }
    if (transaction.tokenExpiresAt && new Date() > new Date(transaction.tokenExpiresAt)) {
      return res.status(410).json({ success: false, error: "Ce token de paiement a expiré", code: "TOKEN_EXPIRED" });
    }

    await storage.updateApiTransaction(transaction.id, { status: "pending" });

    res.json({
      success:  true,
      reference: transaction.reference,
      status:   "pending",
      message:  "Transaction réinitialisée. Relancez le paiement via /initiate-payment.",
      nextStep: "POST /api/sdk/v1/initiate-payment",
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || "Erreur serveur", code: "SERVER_ERROR" });
  }
});

// ─── VERIFY PAYMENT ───────────────────────────────────────────────────────────
router.post("/v1/verify-payment", checkApiMaintenance, authenticateSdkKey, async (req: Request, res: Response) => {
  const sdkUser = (req as any).sdkUser as User;

  try {
    const schema = z.object({ reference: z.string() });
    const { reference } = schema.parse(req.body);

    const transaction = await storage.getApiTransactionByReference(reference);
    if (!transaction) return res.status(404).json({ success: false, error: "Paiement introuvable", code: "NOT_FOUND" });
    if (transaction.userId !== sdkUser.id) return res.status(403).json({ success: false, error: "Non autorisé", code: "UNAUTHORIZED" });

    res.json({
      success: true,
      data: {
        reference:         transaction.reference,
        externalReference: transaction.externalReference,
        status:            transaction.status,
        amount:            transaction.amount,
        fee:               transaction.fee,
        currency:          transaction.currency,
        customerPhone:     transaction.customerPhone,
        customerName:      transaction.customerName,
        paymentMethod:     transaction.paymentMethod,
        createdAt:         transaction.createdAt,
        completedAt:       transaction.completedAt,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || "Erreur serveur" });
  }
});

// ─── PAYMENT STATUS ───────────────────────────────────────────────────────────
router.get("/v1/payment-status/:reference", checkApiMaintenance, authenticateSdkKey, async (req: Request, res: Response) => {
  const sdkUser = (req as any).sdkUser as User;

  try {
    const transaction = await storage.getApiTransactionByReference(req.params.reference);
    if (!transaction) return res.status(404).json({ success: false, error: "Paiement introuvable", code: "NOT_FOUND" });
    if (transaction.userId !== sdkUser.id) return res.status(403).json({ success: false, error: "Non autorisé", code: "UNAUTHORIZED" });

    res.json({
      success: true,
      data: {
        reference:     transaction.reference,
        status:        transaction.status,
        amount:        transaction.amount,
        currency:      transaction.currency,
        paymentMethod: transaction.paymentMethod,
        createdAt:     transaction.createdAt,
        completedAt:   transaction.completedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Erreur serveur" });
  }
});

// ─── HEALTH CHECK (public) ────────────────────────────────────────────────────
router.get("/v1/health", async (_req: Request, res: Response) => {
  try {
    let dbStatus = "ok";
    try { await storage.getCountries(); } catch { dbStatus = "error"; }

    const dbOperators  = await storage.getOperators().catch(() => []);
    const onlineCount  = dbOperators.filter(op => !op.inMaintenance).length;
    const totalCount   = SOLEASPAY_SERVICES.length;

    res.json({
      success: true,
      data: {
        api:      "operational",
        database: dbStatus,
        operators: {
          total:       totalCount,
          online:      onlineCount,
          maintenance: totalCount - onlineCount,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, data: { api: "degraded", database: "error" } });
  }
});

// ─── Helpers retrait ──────────────────────────────────────────────────────────
function isE164Phone(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone.trim());
}

interface WithdrawValidation {
  ok: boolean;
  code?: string;
  error?: string;
  countryInfo?: typeof COUNTRY_CODE_MAP[string];
  wallet?: any;
  fee?: number;
  netAmount?: number;
  operatorStatus?: string;
}

async function validateWithdrawal(
  sdkUser: User,
  data: { amount: number; phoneNumber: string; operator: string; country: string; currency: string }
): Promise<WithdrawValidation> {
  const countryUpper = data.country.toUpperCase();
  const countryInfo  = COUNTRY_CODE_MAP[countryUpper];

  if (!countryInfo) {
    return { ok: false, code: "UNSUPPORTED_COUNTRY", error: `Pays non supporté: ${data.country}. Supportés: ${Object.keys(COUNTRY_CODE_MAP).join(", ")}` };
  }

  // Vérification format téléphone E.164
  if (!isE164Phone(data.phoneNumber)) {
    return { ok: false, code: "INVALID_PHONE_FORMAT", error: `Format téléphone invalide. Utilisez le format E.164 (ex: +22890000000)` };
  }

  // Vérification opérateur compatible avec le pays
  const countryServices = getServicesByCountry(countryUpper);
  const compatibleOp = countryServices.find(
    s => s.operator.toLowerCase() === data.operator.toLowerCase() ||
         s.name.toLowerCase().includes(data.operator.toLowerCase())
  );
  if (countryServices.length > 0 && !compatibleOp) {
    const opList = countryServices.map(s => s.operator).join(", ");
    return { ok: false, code: "OPERATOR_COUNTRY_MISMATCH", error: `Opérateur '${data.operator}' non disponible pour ${countryInfo.countryName}. Disponibles: ${opList}` };
  }

  // Vérification statut opérateur (maintenance)
  let operatorStatus = "online";
  try {
    const dbOperators = await storage.getOperators();
    if (compatibleOp) {
      const dbOp = dbOperators.find(op => op.code === String(compatibleOp.id));
      if (dbOp?.inMaintenance || dbOp?.maintenanceWithdraw) {
        operatorStatus = "maintenance";
        return { ok: false, code: "PAYOUT_OPERATOR_OFFLINE", error: "Cet opérateur est temporairement indisponible pour les retraits" };
      }
    }
  } catch (_) {}

  // Limites montant
  if (data.amount < 100) {
    return { ok: false, code: "AMOUNT_TOO_LOW", error: "Montant minimum: 100" };
  }
  if (data.amount > 5_000_000) {
    return { ok: false, code: "AMOUNT_TOO_HIGH", error: "Montant maximum par retrait: 5 000 000" };
  }

  // Wallet
  const userWallets  = await storage.getUserWallets(sdkUser.id);
  const targetWallet = userWallets.find(w => w.countryCode === countryUpper);
  if (!targetWallet) {
    return { ok: false, code: "WALLET_NOT_FOUND", error: `Wallet ${countryInfo.countryName} introuvable sur votre compte` };
  }

  // Solde
  const walletBalance = parseFloat(targetWallet.balance);
  const sdkFeeRate    = (sdkUser as any).customApiSdkFeeRate != null
    ? parseFloat((sdkUser as any).customApiSdkFeeRate) : 1;
  const fee      = parseFloat((data.amount * sdkFeeRate / 100).toFixed(2));
  const netAmount = data.amount - fee;

  if (walletBalance < data.amount) {
    return {
      ok: false, code: "INSUFFICIENT_BALANCE",
      error: `Solde insuffisant. Disponible: ${walletBalance} ${countryInfo.currency}, requis: ${data.amount} ${countryInfo.currency}`,
    };
  }

  return { ok: true, countryInfo, wallet: targetWallet, fee, netAmount, operatorStatus };
}

// ─── VALIDATE WITHDRAWAL (dry-run) ────────────────────────────────────────────
router.post("/v1/validate-withdrawal", checkApiMaintenance, authenticateSdkKey, async (req: Request, res: Response) => {
  const sdkUser = (req as any).sdkUser as User;

  try {
    const schema = z.object({
      amount:      z.number().positive(),
      phoneNumber: z.string().min(6),
      operator:    z.string(),
      country:     z.string().min(2).max(3),
      currency:    z.string().default("XOF"),
    });

    const data = schema.parse(req.body);
    const v    = await validateWithdrawal(sdkUser, data);

    if (!v.ok) {
      return res.status(400).json({ success: false, error: v.error, code: v.code });
    }

    const userWallets = await storage.getUserWallets(sdkUser.id);
    const wallet      = userWallets.find(w => w.countryCode === data.country.toUpperCase());

    res.json({
      success: true,
      data: {
        valid:          true,
        amount:         data.amount,
        currency:       data.currency,
        fee:            v.fee,
        netAmount:      v.netAmount,
        walletBalance:  parseFloat(wallet?.balance || "0"),
        operatorStatus: v.operatorStatus,
        country:        data.country.toUpperCase(),
        countryName:    v.countryInfo?.countryName,
        message:        "Retrait valide. Vous pouvez procéder.",
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || "Erreur de validation" });
  }
});

// ─── WITHDRAWAL STATUS ────────────────────────────────────────────────────────
router.get("/v1/withdrawal-status/:reference", checkApiMaintenance, authenticateSdkKey, async (req: Request, res: Response) => {
  const sdkUser = (req as any).sdkUser as User;

  try {
    const transaction = await storage.getApiTransactionByReference(req.params.reference);

    if (!transaction || transaction.type !== "withdrawal") {
      return res.status(404).json({ success: false, error: "Retrait introuvable", code: "NOT_FOUND" });
    }
    if (transaction.userId !== sdkUser.id) {
      return res.status(403).json({ success: false, error: "Non autorisé", code: "UNAUTHORIZED" });
    }

    // Map statut lisible
    const statusLabel: Record<string, string> = {
      pending:    "En attente de traitement",
      processing: "En cours de traitement",
      completed:  "Retrait effectué avec succès",
      failed:     "Retrait échoué",
    };

    res.json({
      success: true,
      data: {
        reference:         transaction.reference,
        externalReference: transaction.externalReference,
        status:            transaction.status,
        statusLabel:       statusLabel[transaction.status] || transaction.status,
        amount:            transaction.amount,
        fee:               transaction.fee,
        netAmount:         transaction.netAmount,
        currency:          transaction.currency,
        phoneNumber:       transaction.customerPhone,
        paymentMethod:     transaction.paymentMethod,
        createdAt:         transaction.createdAt,
        completedAt:       transaction.completedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Erreur serveur", code: "SERVER_ERROR" });
  }
});

// ─── PAYOUT STATUS (disponibilité retraits par opérateur) ─────────────────────
router.get("/v1/payout-status", checkApiMaintenance, authenticateSdkKey, async (_req: Request, res: Response) => {
  try {
    const dbOperators = await storage.getOperators();

    const data = SOLEASPAY_SERVICES.map(service => {
      const dbOp          = dbOperators.find(op => op.code === String(service.id));
      const inMaintenance = dbOp?.inMaintenance || dbOp?.maintenanceWithdraw || false;
      const gateway       = dbOp?.paymentGateway || service.paymentGateway || "soleaspay";

      return {
        id:       String(service.id),
        operator: service.operator,
        country:  service.countryCode,
        currency: service.currency,
        gateway,
        payoutStatus:   inMaintenance ? "offline" : "online",
        depositStatus:  (dbOp?.inMaintenance || dbOp?.maintenanceDeposit) ? "offline" : "online",
      };
    });

    const online     = data.filter(d => d.payoutStatus === "online").length;
    const offline    = data.filter(d => d.payoutStatus === "offline").length;

    res.json({
      success: true,
      data: {
        summary:   { online, offline, total: data.length },
        operators: data,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Erreur serveur", code: "SERVER_ERROR" });
  }
});

// ─── WITHDRAW ─────────────────────────────────────────────────────────────────
router.post("/v1/withdraw", checkApiMaintenance, authenticateSdkKey, async (req: Request, res: Response) => {
  const sdkUser = (req as any).sdkUser as User;
  const sdkKey  = (req as any).sdkKey  as ApiKey;

  try {
    const schema = z.object({
      amount:            z.number().positive(),
      phoneNumber:       z.string().min(6),
      operator:          z.string(),
      country:           z.string().min(2).max(3),
      currency:          z.string().default("XOF"),
      description:       z.string().optional(),
      externalReference: z.string().optional(),
    });

    const data         = schema.parse(req.body);
    const countryUpper = data.country.toUpperCase();

    // ── Protection double retrait par externalReference ──
    if (data.externalReference) {
      const existing = await storage.getApiTransactionsByUser(sdkUser.id);
      const dup = existing.find(
        t => t.type === "withdrawal" &&
             t.externalReference === data.externalReference &&
             (t.status === "pending" || t.status === "processing" || t.status === "completed")
      );
      if (dup) {
        return res.status(409).json({
          success: false,
          error:   "Un retrait avec cette référence existe déjà",
          code:    "DUPLICATE_WITHDRAWAL",
          data:    { reference: dup.reference, status: dup.status },
        });
      }
    }

    // ── Validation complète ──
    const v = await validateWithdrawal(sdkUser, data);
    if (!v.ok) {
      return res.status(400).json({ success: false, error: v.error, code: v.code });
    }

    const { countryInfo, wallet: targetWallet, fee, netAmount } = v;
    const reference = generateReference();

    const withdrawalRequest = await storage.createWithdrawalRequest({
      userId:        sdkUser.id,
      amount:        data.amount.toString(),
      fee:           fee!.toString(),
      netAmount:     netAmount!.toString(),
      paymentMethod: data.operator,
      mobileNumber:  data.phoneNumber,
      country:       countryUpper,
      walletName:    countryInfo!.countryName,
      walletId:      targetWallet.id,
    });

    await storage.createApiTransaction({
      userId:            sdkUser.id,
      apiKeyId:          sdkKey.id,
      reference,
      externalReference: data.externalReference || null,
      type:              "withdrawal",
      amount:            data.amount.toString(),
      currency:          data.currency,
      description:       data.description || `Retrait SDK vers ${data.phoneNumber} (${data.operator})`,
      customerPhone:     data.phoneNumber,
      paymentMethod:     data.operator,
      callbackUrl:       sdkKey.webhookUrl || null,
      ipAddress:         req.ip || null,
      userAgent:         req.get("User-Agent") || null,
    } as any);

    res.status(201).json({
      success: true,
      data: {
        withdrawalId:  withdrawalRequest.id,
        reference,
        externalReference: data.externalReference || null,
        amount:        data.amount,
        fee:           fee!,
        netAmount:     netAmount!,
        currency:      data.currency,
        phoneNumber:   data.phoneNumber,
        operator:      data.operator,
        country:       countryUpper,
        countryName:   countryInfo!.countryName,
        status:        "pending",
        statusLabel:   "En attente de traitement",
        walletBalance: parseFloat(targetWallet.balance),
        trackingUrl:   `GET /api/sdk/v1/withdrawal-status/${reference}`,
        message:       "Demande de retrait enregistrée et en cours de traitement.",
        createdAt:     new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || "Erreur lors du retrait", code: "SERVER_ERROR" });
  }
});

// ─── BALANCE ──────────────────────────────────────────────────────────────────
router.get("/v1/balance", checkApiMaintenance, authenticateSdkKey, async (req: Request, res: Response) => {
  const sdkUser = (req as any).sdkUser as User;

  try {
    const wallets = await storage.getUserWallets(sdkUser.id);
    const country = (req.query.country as string | undefined)?.toUpperCase();

    if (country) {
      const w = wallets.find(w => w.countryCode === country);
      if (!w) return res.status(404).json({ success: false, error: `Wallet ${country} introuvable`, code: "WALLET_NOT_FOUND" });
      return res.json({ success: true, data: { country: w.countryCode, countryName: w.countryName, balance: w.balance, currency: w.currency } });
    }

    res.json({
      success: true,
      data: {
        wallets:      wallets.map(w => ({ country: w.countryCode, countryName: w.countryName, balance: w.balance, currency: w.currency })),
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
        transactions: transactions.map(t => ({
          reference:         t.reference,
          externalReference: t.externalReference,
          type:              t.type,
          amount:            t.amount,
          fee:               t.fee,
          currency:          t.currency,
          status:            t.status,
          customerPhone:     t.customerPhone,
          customerName:      t.customerName,
          paymentMethod:     t.paymentMethod,
          createdAt:         t.createdAt,
          completedAt:       t.completedAt,
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

    const cryptoMod     = await import("crypto");
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
