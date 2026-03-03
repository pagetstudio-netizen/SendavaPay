import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import session from "express-session";
import { v4 as uuidv4 } from "uuid";
import { registerSchema, loginSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { leekpay } from "./leekpay";
import { soleaspay, SOLEASPAY_SERVICES, SOLEASPAY_COUNTRIES, getServicesByCountry, getCurrencyByCountry, getServiceById } from "./soleaspay";
import { isDatabaseConnected } from "./db";
import merchantApi from "./merchant-api";
import { registerPartnerRoutes } from "./partner-routes";
import { registerObjectStorageRoutes, ObjectStorageService } from "./replit_integrations/object_storage";
import { uploadKycFile, uploadProductImage, getKycSignedUrl, isSupabaseStorageConfigured } from "./supabase-storage";
import { 
  sendWelcomeEmail, 
  sendPaymentReceivedEmail, 
  sendWithdrawalEmail,
  sendKycApprovedEmail,
  sendKycRejectedEmail,
  sendTransferReceivedEmail,
  sendDepositEmail
} from "./email";
import {
  notifyDeposit,
  notifyPaymentReceived,
  notifyWithdrawalRequest,
  notifyWithdrawalApproved,
  notifyWithdrawalRejected,
  notifyWithdrawalAutoProcessed,
  notifyNewUser,
  notifyIpChanged,
  notifyKycSubmitted,
  notifyAdminLogin,
  notifyLargeAmount,
  sendBotReply,
} from "./telegram";

function getCommissionRate(settings: any, transactionType: string, countryOverride?: string | number | null): number {
  if (countryOverride !== null && countryOverride !== undefined) {
    const rate = parseFloat(countryOverride.toString());
    if (!isNaN(rate)) return rate;
  }
  if (transactionType === "withdrawal") {
    return parseFloat(settings?.withdrawalRate || "7");
  }
  if (transactionType === "payment_received") {
    return parseFloat(settings?.encaissementRate || "7");
  }
  return parseFloat(settings?.depositRate || "7");
}

async function getEffectiveFeeRate(
  userId: number,
  transactionType: "deposit" | "withdrawal" | "payment_received",
  settings: any
): Promise<number> {
  try {
    const [user, allCountries] = await Promise.all([
      storage.getUser(userId),
      storage.getCountries(),
    ]);
    if (user?.country) {
      const countryRecord = (allCountries as any[]).find(
        (c) => c.name?.toLowerCase() === user.country!.toLowerCase() && c.isActive
      );
      if (countryRecord) {
        if (transactionType === "deposit" && countryRecord.depositFeeRate !== null) {
          const r = parseFloat(countryRecord.depositFeeRate);
          if (!isNaN(r)) return r;
        }
        if (transactionType === "withdrawal" && countryRecord.withdrawFeeRate !== null) {
          const r = parseFloat(countryRecord.withdrawFeeRate);
          if (!isNaN(r)) return r;
        }
        if (transactionType === "payment_received" && countryRecord.encaissementFeeRate !== null) {
          const r = parseFloat(countryRecord.encaissementFeeRate);
          if (!isNaN(r)) return r;
        }
      }
    }
  } catch (e) {
    console.error("[getEffectiveFeeRate] Erreur lookup pays:", e);
  }
  return getCommissionRate(settings, transactionType);
}

function requireDatabase(req: Request, res: Response, next: NextFunction) {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ 
      message: "Service temporairement indisponible. La base de données n'est pas accessible.",
      code: "DATABASE_UNAVAILABLE"
    });
  }
  next();
}

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = "uploads/kyc";
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Seules les images sont autorisées"));
  }
});

const productImageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = "uploads/products";
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /image\/(jpeg|jpg|png|gif|webp)/.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Seules les images sont autorisées (JPG, PNG, GIF, WebP)"));
  }
});

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Accès refusé" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.set("trust proxy", 1);
  
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "sendavapay-secret-key-2024",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      },
    })
  );

  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || "replit-objstore-8601a2a0-2388-4798-b92e-bceaf2065567";
  app.use(`/object-storage/${bucketId}`, express.static(`/${bucketId}`));
  app.use("/uploads", express.static("uploads"));
  app.use("/sdk", express.static("sdk"));

  // Register object storage routes for permanent file storage
  registerObjectStorageRoutes(app);

  // Register partner routes
  registerPartnerRoutes(app);

  app.use("/api", (req, res, next) => {
    if (req.path === "/health") {
      return next();
    }
    requireDatabase(req, res, next);
  });

  // Mount Public API (v1 endpoints)
  app.use("/api", merchantApi);

  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }

      const { fullName, email, phone, password } = result.data;

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Cet email est déjà utilisé" });
      }

      const existingPhone = await storage.getUserByPhone(phone);
      if (existingPhone) {
        return res.status(400).json({ message: "Ce numéro de téléphone est déjà utilisé" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        fullName,
        email,
        phone,
        password: hashedPassword,
      });

      req.session.userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      
      // Send welcome email (non-blocking)
      sendWelcomeEmail(email, fullName).catch(err => 
        console.error("Failed to send welcome email:", err)
      );

      notifyNewUser({
        userName: fullName,
        userId: user.id,
        email,
        phone,
      });
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Erreur lors de l'inscription" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }

      const { emailOrPhone, password } = result.data;
      const user = await storage.getUserByEmailOrPhone(emailOrPhone);

      if (!user) {
        return res.status(401).json({ message: "Identifiants invalides" });
      }

      if (user.isBlocked) {
        return res.status(403).json({ message: "Votre compte a été bloqué" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Identifiants invalides" });
      }

      req.session.userId = user.id;

      if (user.role === "admin") {
        notifyAdminLogin({
          userName: user.fullName,
          userId: user.id,
          ip: req.ip || req.socket?.remoteAddress || "inconnu",
        });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Erreur lors de la connexion" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erreur lors de la déconnexion" });
      }
      res.json({ message: "Déconnecté" });
    });
  });

  app.get("/api/commission-rates", requireAuth, async (req, res) => {
    try {
      const [settings, user, allCountries] = await Promise.all([
        storage.getCommissionSettings(),
        storage.getUser(req.session.userId!),
        storage.getCountries(),
      ]);

      const globalDeposit = parseFloat(settings?.depositRate || "7");
      const globalWithdraw = parseFloat(settings?.withdrawalRate || "7");
      const globalEncaissement = parseFloat(settings?.encaissementRate || "7");

      let depositRate = globalDeposit;
      let withdrawalRate = globalWithdraw;
      let encaissementRate = globalEncaissement;

      if (user?.country) {
        const countryRecord = (allCountries as any[]).find(
          (c) => c.name?.toLowerCase() === user.country!.toLowerCase() && c.isActive
        );
        if (countryRecord) {
          if (countryRecord.depositFeeRate !== null) {
            const r = parseFloat(countryRecord.depositFeeRate);
            if (!isNaN(r)) depositRate = r;
          }
          if (countryRecord.withdrawFeeRate !== null) {
            const r = parseFloat(countryRecord.withdrawFeeRate);
            if (!isNaN(r)) withdrawalRate = r;
          }
          if (countryRecord.encaissementFeeRate !== null) {
            const r = parseFloat(countryRecord.encaissementFeeRate);
            if (!isNaN(r)) encaissementRate = r;
          }
        }
      }

      res.json({ depositRate, encaissementRate, withdrawalRate });
    } catch (error) {
      console.error("Get commission rates error:", error);
      res.json({ depositRate: 7, encaissementRate: 7, withdrawalRate: 7 });
    }
  });

  app.get("/api/user", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.put("/api/user/password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await storage.getUser(req.session.userId!);

      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Mot de passe actuel incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { password: hashedPassword });
      res.json({ message: "Mot de passe mis à jour" });
    } catch (error) {
      console.error("Update password error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.put("/api/user/merchant-name", requireAuth, async (req, res) => {
    try {
      const { merchantName } = req.body;
      if (!merchantName || typeof merchantName !== "string" || merchantName.trim().length === 0) {
        return res.status(400).json({ message: "Le nom marchand est requis" });
      }
      if (merchantName.trim().length > 100) {
        return res.status(400).json({ message: "Le nom marchand ne peut pas dépasser 100 caractères" });
      }
      const user = await storage.updateUser(req.session.userId!, { merchantName: merchantName.trim() });
      res.json({ message: "Nom marchand mis à jour", merchantName: user?.merchantName });
    } catch (error) {
      console.error("Update merchant name error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getTransactions(req.session.userId!);
      res.json(transactions);
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/deposit", requireAuth, async (req, res) => {
    try {
      const { amount, paymentMethod, country } = req.body;
      const numericAmount = parseFloat(amount);

      if (isNaN(numericAmount) || numericAmount < 100) {
        return res.status(400).json({ message: "Montant minimum: 100 XOF" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      const currency = country === "rdc" ? "CDF" : (country === "cm" || country === "cg") ? "XAF" : "XOF";
      // Toujours utiliser l'URL de production pour les redirections LeekPay
      const baseUrl = "https://sendavapay.com";
      
      // Créer le checkout LeekPay - l'ID sera retourné par LeekPay
      const checkoutResult = await leekpay.createCheckout({
        amount: numericAmount,
        currency: currency as "XOF" | "XAF" | "CDF" | "EUR" | "USD",
        description: `Dépôt SendavaPay - ${user.fullName}`,
        return_url: `${baseUrl}/success`,
        customer_email: user.email,
      });

      if (!checkoutResult.success || !checkoutResult.data) {
        console.error("LeekPay checkout error:", checkoutResult.error);
        return res.status(500).json({ message: checkoutResult.error || "Erreur lors de la création du paiement" });
      }

      // Stocker avec l'ID LeekPay comme référence principale
      const leekpayId = checkoutResult.data.id;
      
      await storage.createLeekpayPayment({
        leekpayPaymentId: leekpayId,
        userId: req.session.userId!,
        amount: numericAmount.toString(),
        currency,
        type: "deposit",
        status: "pending",
        description: `Dépôt via ${paymentMethod}`,
        customerEmail: user.email,
        paymentMethod,
        returnUrl: `${baseUrl}/success?reference=${leekpayId}`,
        paymentUrl: checkoutResult.data.payment_url,
      });

      console.log(`📤 Dépôt initié: utilisateur=${req.session.userId}, montant=${numericAmount} ${currency}, ref=${leekpayId}`);

      // Retourner l'ID LeekPay au frontend pour qu'il puisse vérifier le paiement
      res.json({ 
        paymentUrl: checkoutResult.data.payment_url,
        paymentId: leekpayId,
      });
    } catch (error) {
      console.error("Deposit error:", error);
      res.status(500).json({ message: "Erreur lors du dépôt" });
    }
  });

  // ========== SOLEASPAY ROUTES ==========
  
  // Obtenir les pays et opérateurs disponibles
  app.get("/api/soleaspay/countries", (req, res) => {
    res.json(SOLEASPAY_COUNTRIES);
  });

  app.get("/api/soleaspay/services/:countryCode", async (req, res) => {
    try {
      const { countryCode } = req.params;
      const services = getServicesByCountry(countryCode);
      
      // Get operators from database to check maintenance status
      const operators = await storage.getOperators();
      
      const availableServices = services.map(service => {
        const operator = operators.find(op => op.code === service.id.toString());
        const inMaintenance = operator?.inMaintenance ?? false;
        const maintenanceDeposit = operator?.maintenanceDeposit ?? false;
        const maintenanceWithdraw = operator?.maintenanceWithdraw ?? false;
        const maintenancePaymentLink = operator?.maintenancePaymentLink ?? false;
        const maintenanceApi = operator?.maintenanceApi ?? false;
        const paymentGateway = operator?.paymentGateway || service.paymentGateway || "soleaspay";
        return {
          ...service,
          inMaintenance: inMaintenance || maintenanceDeposit,
          maintenanceDeposit: inMaintenance || maintenanceDeposit,
          maintenanceWithdraw: inMaintenance || maintenanceWithdraw,
          maintenancePaymentLink: inMaintenance || maintenancePaymentLink,
          maintenanceApi: inMaintenance || maintenanceApi,
          paymentGateway,
        };
      });
      
      res.json(availableServices);
    } catch (error) {
      console.error("Get services error:", error);
      const { countryCode } = req.params;
      const services = getServicesByCountry(countryCode);
      res.json(services);
    }
  });

  // Get operators for withdraw - same countries as deposit (all require admin approval)
  app.get("/api/withdraw/operators", async (req, res) => {
    try {
      const operators = await storage.getOperators();
      const countries = await storage.getCountries();
      
      // Build country list with same operators as deposit
      const countryOperators = countries.map(country => {
        const countryOps = operators
          .filter(op => op.countryId === country.id)
          .map(op => ({
            id: op.code || op.id.toString(),
            name: op.name,
            inMaintenance: (op.inMaintenance || op.maintenanceWithdraw) ?? false,
          }));
        
        return {
          id: country.code.toLowerCase(),
          name: country.name,
          currency: country.currency,
          methods: countryOps,
        };
      }).filter(c => c.methods.length > 0);
      
      res.json(countryOperators);
    } catch (error) {
      console.error("Get withdraw operators error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/deposit-soleaspay", requireAuth, async (req, res) => {
    try {
      const { amount, serviceId, phoneNumber, otp } = req.body;
      const numericAmount = parseFloat(amount);

      if (isNaN(numericAmount) || numericAmount < 100) {
        return res.status(400).json({ message: "Montant minimum: 100" });
      }

      if (!serviceId) {
        return res.status(400).json({ message: "Service requis" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      const service = getServiceById(parseInt(serviceId));
      if (!service) {
        return res.status(400).json({ message: "Service non trouvé" });
      }

      const operators = await storage.getOperators();
      const operator = operators.find(op => op.code === serviceId.toString());
      if (operator?.inMaintenance || operator?.maintenanceDeposit) {
        return res.status(400).json({ message: "Ce moyen de paiement est actuellement en maintenance pour les dépôts" });
      }

      const paymentGateway = operator?.paymentGateway || service.paymentGateway || "soleaspay";
      const orderId = `DEP-${Date.now()}-${req.session.userId}`;
      const baseUrl = "https://sendavapay.com";

      if (paymentGateway === "winipayer") {
        console.log(`📤 WiniPayer: Initiation dépôt REDIRECT utilisateur=${req.session.userId}, montant=${numericAmount} ${service.currency}`);

        const { winipayer } = await import("./winipayer");

        const winiResult = await winipayer.createCheckout({
          amount: numericAmount,
          description: `Dépôt SendavaPay - ${user.fullName} via ${service.operator} (${service.country})`,
          cancelUrl: `${baseUrl}/deposit`,
          returnUrl: `${baseUrl}/success?reference=${orderId}`,
          callbackUrl: `${baseUrl}/api/webhook/winipayer-deposit`,
          customData: {
            orderId,
            userId: req.session.userId,
            serviceId: serviceId,
            type: "deposit",
          },
          reference: {
            identifier: orderId,
            name: user.fullName,
            phone: phoneNumber || undefined,
            email: user.email,
          },
        });

        if (!winiResult.success || !winiResult.results) {
          console.error("❌ WiniPayer create error:", winiResult.errors);
          return res.status(500).json({ message: "Erreur lors de la création du paiement WiniPayer" });
        }

        const winiUuid = winiResult.results.uuid;
        const checkoutUrl = winiResult.results.checkout_process;

        await storage.createLeekpayPayment({
          leekpayPaymentId: winiUuid,
          userId: req.session.userId!,
          amount: numericAmount.toString(),
          currency: service.currency,
          type: "deposit",
          status: "pending",
          description: `Dépôt via ${service.operator} (${service.country}) - WiniPayer`,
          customerEmail: user.email,
          payerPhone: phoneNumber || null,
          paymentMethod: `winipayer_${service.name}`,
          returnUrl: `${baseUrl}/success?reference=${orderId}`,
          paymentUrl: checkoutUrl,
        });

        console.log(`📤 WiniPayer: Checkout créé uuid=${winiUuid}, checkout=${checkoutUrl}`);

        return res.json({
          success: true,
          payId: winiUuid,
          orderId,
          status: "PENDING",
          provider: "winipayer",
          checkoutUrl,
          message: "Vous allez être redirigé vers la page de paiement WiniPayer.",
        });
      }

      if (paymentGateway === "maishapay") {
        if (!phoneNumber) {
          return res.status(400).json({ message: "Numéro de téléphone requis pour MaishaPay" });
        }

        console.log(`📤 MaishaPay: Initiation dépôt utilisateur=${req.session.userId}, montant=${numericAmount} ${service.currency}`);

        const { maishapay: mpClient, getMaishapayProvider, formatPhoneForMaishapay } = await import("./maishapay");
        const mpProvider = getMaishapayProvider(operator?.name || service.operator, service.countryCode);

        if (!mpProvider) {
          return res.status(400).json({ message: "Opérateur non supporté par MaishaPay" });
        }

        const cleanPhone = formatPhoneForMaishapay(phoneNumber, service.countryCode);

        const mpResult = await mpClient.collectPayment({
          transactionReference: orderId,
          amount: numericAmount,
          currency: service.currency,
          customerFullName: user.fullName,
          customerEmail: user.email,
          provider: mpProvider,
          walletID: cleanPhone,
          callbackUrl: `${baseUrl}/api/webhook/maishapay`,
        });

        if (mpResult.status_code !== 202 || mpResult.transactionStatus?.trim().toUpperCase() === "FAILED") {
          console.error("❌ MaishaPay collect error:", mpResult);
          const { extractMaishaPayError: extractErr } = await import("./maishapay");
          return res.status(500).json({ message: extractErr(mpResult) });
        }

        await storage.createLeekpayPayment({
          leekpayPaymentId: orderId,
          userId: req.session.userId!,
          amount: numericAmount.toString(),
          currency: service.currency,
          type: "deposit",
          status: "pending",
          description: `Dépôt via ${service.operator} (${service.country}) - MaishaPay`,
          customerEmail: user.email,
          payerPhone: cleanPhone,
          paymentMethod: `maishapay_${service.name}`,
          returnUrl: `${baseUrl}/success`,
        });

        console.log(`📤 MaishaPay: Collecte initiée ref=${orderId}, transactionId=${mpResult.transactionId}`);

        return res.json({
          success: true,
          payId: orderId,
          orderId,
          status: "PENDING",
          provider: "maishapay",
          message: "Paiement initié. Veuillez confirmer sur votre téléphone.",
        });
      }

      if (paymentGateway === "omnipay") {
        if (!phoneNumber) {
          return res.status(400).json({ message: "Numéro de téléphone requis pour OmniPay" });
        }

        console.log(`📤 OmniPay: Initiation dépôt utilisateur=${req.session.userId}, montant=${numericAmount} ${service.currency}`);

        const { omnipay: opClient, getOmnipayOperator, formatPhoneForOmnipay } = await import("./omnipay");
        const opOperator = getOmnipayOperator(operator?.name || service.operator);

        if (opOperator === undefined) {
          return res.status(400).json({ message: "Opérateur non supporté par OmniPay" });
        }

        const cleanPhone = formatPhoneForOmnipay(phoneNumber, service.countryCode);
        const isWave = opOperator === "wave";
        const baseUrl = "https://sendavapay.com";

        const nameParts = user.fullName?.split(" ") || ["Client"];
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || nameParts[0];

        const autoOtp = otp || (service.operator === "Orange" ? String(Math.floor(100000 + Math.random() * 900000)) : undefined);

        const opResult = await opClient.requestPayment({
          msisdn: cleanPhone,
          amount: numericAmount,
          reference: orderId,
          firstName,
          lastName,
          operator: opOperator ?? undefined,
          otp: autoOtp,
          returnUrl: isWave ? `${baseUrl}/success?reference=${orderId}` : undefined,
          callbackUrl: `${baseUrl}/api/webhook/omnipay`,
        });

        if (String(opResult.success) !== "1") {
          console.error("❌ OmniPay requestPayment error:", opResult);
          return res.status(500).json({ message: opResult.message || "Erreur lors de l'initiation du paiement OmniPay" });
        }

        await storage.createLeekpayPayment({
          leekpayPaymentId: orderId,
          userId: req.session.userId!,
          amount: numericAmount.toString(),
          currency: service.currency,
          type: "deposit",
          status: "pending",
          description: `Dépôt via ${service.operator} (${service.country}) - OmniPay`,
          customerEmail: user.email,
          payerPhone: cleanPhone,
          paymentMethod: `omnipay_${service.name}`,
          returnUrl: `${baseUrl}/success`,
          paymentUrl: opResult.payment_url || null,
        });

        console.log(`📤 OmniPay: Paiement initié ref=${orderId}, id=${opResult.id}`);

        if (isWave && opResult.payment_url) {
          return res.json({
            success: true,
            payId: orderId,
            orderId,
            status: "PENDING",
            provider: "omnipay",
            checkoutUrl: opResult.payment_url,
            message: "Vous allez être redirigé vers la page de paiement Wave.",
          });
        }

        return res.json({
          success: true,
          payId: orderId,
          orderId,
          status: "PENDING",
          provider: "omnipay",
          message: "Paiement initié. Veuillez confirmer sur votre téléphone.",
        });
      }

      if (!phoneNumber) {
        return res.status(400).json({ message: "Numéro de téléphone requis pour SoleasPay" });
      }

      console.log(`📤 SoleasPay: Initiation dépôt utilisateur=${req.session.userId}, montant=${numericAmount} ${service.currency}`);

      const result = await soleaspay.collectPayment({
        wallet: phoneNumber,
        amount: numericAmount,
        currency: service.currency,
        orderId,
        description: `Dépôt SendavaPay - ${user.fullName}`,
        payer: user.fullName,
        payerEmail: user.email,
        serviceId: service.id,
        successUrl: `${baseUrl}/success`,
        failureUrl: `${baseUrl}/deposit`,
        otp: otp || (service.operator === "Orange" ? String(Math.floor(100000 + Math.random() * 900000)) : undefined),
      });

      if (!result.success) {
        console.error("❌ SoleasPay error:", result.message);
        return res.status(500).json({ message: result.message || "Erreur lors du paiement" });
      }

      const payId = result.data?.reference || orderId;

      await storage.createLeekpayPayment({
        leekpayPaymentId: payId,
        userId: req.session.userId!,
        amount: numericAmount.toString(),
        currency: service.currency,
        type: "deposit",
        status: "pending",
        description: `Dépôt via ${service.operator} (${service.country})`,
        customerEmail: user.email,
        paymentMethod: `soleaspay_${service.name}`,
        returnUrl: `${baseUrl}/success`,
      });

      console.log(`📤 SoleasPay: Paiement initié ref=${payId}, status=${result.status}`);

      const waveUrl = result.wave_launch_url || result.payment_url || result.redirect_url || 
                      result.data?.wave_launch_url || result.data?.payment_url || result.data?.redirect_url;
      
      const isWaveOperator = service.operator === "Wave" || service.id === 32;

      res.json({ 
        success: true,
        payId,
        orderId,
        status: result.status,
        provider: "soleaspay",
        message: isWaveOperator && waveUrl 
          ? "Redirection vers Wave pour confirmer le paiement..." 
          : (result.message || "Paiement initié. Veuillez confirmer sur votre téléphone."),
        waveUrl: waveUrl || null,
        isWave: isWaveOperator,
      });
    } catch (error) {
      console.error("Deposit error:", error);
      res.status(500).json({ message: "Erreur lors du dépôt" });
    }
  });

  // Vérifier le statut d'un paiement SoleasPay
  app.get("/api/verify-soleaspay/:orderId/:payId", requireAuth, async (req, res) => {
    try {
      const { orderId, payId } = req.params;

      console.log(`🔍 SoleasPay: Vérification paiement orderId=${orderId}, payId=${payId}`);

      const result = await soleaspay.verifyPayment(orderId, payId);

      console.log(`🔍 SoleasPay: Résultat vérification:`, JSON.stringify(result));

      // Vérifier si déjà traité
      const existingPayment = await storage.getLeekpayPaymentById(payId);
      if (existingPayment?.status === "completed") {
        return res.json({ 
          status: "SUCCESS", 
          message: "Paiement déjà traité",
          amount: existingPayment.amount
        });
      }

      if (result.success && result.status === "SUCCESS") {
        const amount = result.data?.amount || (existingPayment ? parseFloat(existingPayment.amount) : 0);
        
        if (existingPayment && existingPayment.userId) {
          const claimed = await storage.claimLeekpayPayment(payId);
          if (!claimed) {
            console.log("⚠️ Transaction déjà traitée, pas de double crédit");
            return res.json({ status: "SUCCESS", message: "Paiement déjà traité", amount });
          }

          const settings = await storage.getCommissionSettings();
          const commissionRate = await getEffectiveFeeRate(existingPayment.userId, "deposit", settings);
          const fee = Math.round(amount * (commissionRate / 100));
          const netAmount = amount - fee;

          await storage.createTransaction({
            userId: existingPayment.userId,
            type: "deposit",
            amount: amount.toString(),
            fee: fee.toString(),
            netAmount: netAmount.toString(),
            status: "completed",
            description: existingPayment.description || "Dépôt via SoleasPay",
            externalRef: payId,
            paymentMethod: existingPayment.paymentMethod || "soleaspay",
          });

          await storage.updateUserBalance(existingPayment.userId, netAmount.toString());

          console.log(`✅ SoleasPay: Dépôt confirmé pour utilisateur #${existingPayment.userId}: ${netAmount} ${existingPayment.currency}`);

          const depositUser = await storage.getUser(existingPayment.userId);
          if (depositUser?.email) {
            sendDepositEmail(depositUser.email, {
              userName: depositUser.fullName,
              amount: netAmount,
              currency: existingPayment.currency || "XOF",
              transactionId: payId,
              phone: existingPayment.payerPhone || "",
              operator: existingPayment.paymentMethod || "Mobile Money"
            }).catch(err => console.error("Failed to send deposit email:", err));
          }

          notifyDeposit({
            userName: depositUser?.fullName || "Inconnu",
            userId: existingPayment.userId,
            amount,
            fee,
            netAmount,
            currency: existingPayment.currency || "XOF",
            phone: existingPayment.payerPhone || undefined,
            operator: existingPayment.paymentMethod || undefined,
            reference: payId,
          });

          if (amount >= 500000) {
            notifyLargeAmount({
              type: "deposit",
              userName: depositUser?.fullName || "Inconnu",
              userId: existingPayment.userId,
              amount,
              currency: existingPayment.currency || "XOF",
              operator: existingPayment.paymentMethod || undefined,
              reference: payId,
            });
          }

          return res.json({ 
            status: "SUCCESS", 
            message: `Paiement confirmé! ${netAmount} ${existingPayment.currency} crédités sur votre compte.`,
            amount: netAmount
          });
        }
      }

      // Retourner le statut actuel
      res.json({ 
        status: result.status || "PENDING",
        message: result.message || "Paiement en cours de traitement",
      });
    } catch (error) {
      console.error("SoleasPay verify error:", error);
      res.status(500).json({ message: "Erreur lors de la vérification" });
    }
  });

  // Paiement de lien via SoleasPay (pour les clients payant un vendeur)
  app.post("/api/pay-link-soleaspay", async (req, res) => {
    try {
      const { linkCode, amount, serviceId, phoneNumber, payerName, payerEmail, otp } = req.body;
      const numericAmount = parseFloat(amount);

      if (!linkCode || !serviceId || !payerName) {
        return res.status(400).json({ message: "Tous les champs sont requis" });
      }

      const link = await storage.getPaymentLinkByCode(linkCode);
      if (!link) {
        return res.status(404).json({ message: "Lien de paiement non trouvé" });
      }

      const service = getServiceById(parseInt(serviceId));
      if (!service) {
        return res.status(400).json({ message: "Service non trouvé" });
      }

      const vendeur = await storage.getUser(link.userId);
      if (!vendeur) {
        return res.status(404).json({ message: "Vendeur non trouvé" });
      }

      const operators = await storage.getOperators();
      const operator = operators.find(op => op.code === serviceId.toString());
      if (operator?.inMaintenance || operator?.maintenancePaymentLink) {
        return res.status(400).json({ message: "Ce moyen de paiement est actuellement en maintenance pour les liens de paiement" });
      }
      const paymentGateway = operator?.paymentGateway || service.paymentGateway || "soleaspay";

      const orderId = `PAY-${linkCode}-${Date.now()}`;
      const baseUrl = "https://sendavapay.com";

      if (paymentGateway === "winipayer") {
        console.log(`📤 WiniPayer: Paiement lien REDIRECT ${linkCode} montant=${numericAmount} ${service.currency}`);

        const { winipayer } = await import("./winipayer");

        const winiResult = await winipayer.createCheckout({
          amount: numericAmount,
          description: `Paiement à ${vendeur.fullName} - ${link.title}`,
          cancelUrl: `${baseUrl}/pay/${linkCode}`,
          returnUrl: `${baseUrl}/payment-success?vendeur_id=${link.userId}&reference=${orderId}`,
          callbackUrl: `${baseUrl}/api/webhook/winipayer-deposit`,
          customData: {
            orderId,
            linkCode,
            linkId: link.id,
            type: "payment_link",
          },
          reference: {
            identifier: orderId,
            name: payerName,
            phone: phoneNumber || undefined,
            email: payerEmail || undefined,
          },
        });

        if (!winiResult.success || !winiResult.results) {
          console.error("❌ WiniPayer pay-link error:", winiResult.errors);
          return res.status(500).json({ message: "Erreur lors de la création du paiement WiniPayer" });
        }

        const winiUuid = winiResult.results.uuid;
        const checkoutUrl = winiResult.results.checkout_process;

        await storage.createLeekpayPayment({
          leekpayPaymentId: winiUuid,
          userId: null,
          paymentLinkId: link.id,
          amount: numericAmount.toString(),
          currency: service.currency,
          type: "payment_link",
          status: "pending",
          description: `Paiement ${link.title}`,
          customerEmail: payerEmail,
          payerName,
          payerPhone: phoneNumber || null,
          payerCountry: service.countryCode,
          paymentMethod: `winipayer_${service.name}`,
          returnUrl: `${baseUrl}/payment-success?vendeur_id=${link.userId}&reference=${orderId}`,
          paymentUrl: checkoutUrl,
        });

        console.log(`📤 WiniPayer: Checkout lien créé uuid=${winiUuid}, checkout=${checkoutUrl}`);

        return res.json({
          success: true,
          payId: winiUuid,
          orderId,
          status: "PENDING",
          provider: "winipayer",
          checkoutUrl,
          message: "Vous allez être redirigé vers la page de paiement WiniPayer.",
        });
      }

      if (paymentGateway === "maishapay") {
        if (!phoneNumber) {
          return res.status(400).json({ message: "Numéro de téléphone requis pour MaishaPay" });
        }

        console.log(`📤 MaishaPay: Paiement lien ${linkCode} montant=${numericAmount} ${service.currency}`);

        const { maishapay: mpClient, getMaishapayProvider, formatPhoneForMaishapay } = await import("./maishapay");
        const mpProvider = getMaishapayProvider(operator?.name || service.operator, service.countryCode);

        if (!mpProvider) {
          return res.status(400).json({ message: "Opérateur non supporté par MaishaPay" });
        }

        const cleanPhone = formatPhoneForMaishapay(phoneNumber, service.countryCode);

        const mpResult = await mpClient.collectPayment({
          transactionReference: orderId,
          amount: numericAmount,
          currency: service.currency,
          customerFullName: payerName,
          customerEmail: payerEmail || "",
          provider: mpProvider,
          walletID: cleanPhone,
          callbackUrl: `${baseUrl}/api/webhook/maishapay`,
        });

        if (mpResult.status_code !== 202 || mpResult.transactionStatus?.trim().toUpperCase() === "FAILED") {
          console.error("❌ MaishaPay pay-link error:", mpResult);
          const { extractMaishaPayError: extractErr } = await import("./maishapay");
          return res.status(500).json({ message: extractErr(mpResult) });
        }

        await storage.createLeekpayPayment({
          leekpayPaymentId: orderId,
          userId: null,
          paymentLinkId: link.id,
          amount: numericAmount.toString(),
          currency: service.currency,
          type: "payment_link",
          status: "pending",
          description: `Paiement ${link.title} - MaishaPay`,
          customerEmail: payerEmail,
          payerName,
          payerPhone: cleanPhone,
          payerCountry: service.countryCode,
          paymentMethod: `maishapay_${service.name}`,
          returnUrl: `${baseUrl}/payment-success?vendeur_id=${link.userId}&reference=${orderId}`,
        });

        console.log(`📤 MaishaPay: Paiement lien initié ref=${orderId}, transactionId=${mpResult.transactionId}`);

        return res.json({
          success: true,
          payId: orderId,
          orderId,
          status: "PENDING",
          provider: "maishapay",
          message: "Paiement initié. Veuillez confirmer sur votre téléphone.",
        });
      }

      if (paymentGateway === "omnipay") {
        if (!phoneNumber) {
          return res.status(400).json({ message: "Numéro de téléphone requis pour OmniPay" });
        }

        if (service.operator === "Orange" && !otp) {
          return res.status(400).json({ message: "OTP requis pour Orange Money. Composez le code USSD sur votre téléphone pour générer votre OTP." });
        }

        console.log(`📤 OmniPay: Paiement lien ${linkCode} montant=${numericAmount} ${service.currency}`);

        const { omnipay: opClient, getOmnipayOperator, formatPhoneForOmnipay } = await import("./omnipay");
        const opOperator = getOmnipayOperator(operator?.name || service.operator);

        if (opOperator === undefined) {
          return res.status(400).json({ message: "Opérateur non supporté par OmniPay" });
        }

        const cleanPhone = formatPhoneForOmnipay(phoneNumber, service.countryCode);
        const isWave = opOperator === "wave";
        const baseUrl = "https://sendavapay.com";

        const nameParts = (payerName || "Client").split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || nameParts[0];

        const opResult = await opClient.requestPayment({
          msisdn: cleanPhone,
          amount: numericAmount,
          reference: orderId,
          firstName,
          lastName,
          operator: opOperator ?? undefined,
          otp: otp || undefined,
          returnUrl: isWave ? `${baseUrl}/payment-success?vendeur_id=${link.userId}&reference=${orderId}` : undefined,
          callbackUrl: `${baseUrl}/api/webhook/omnipay`,
        });

        if (String(opResult.success) !== "1") {
          console.error("❌ OmniPay pay-link error:", opResult);
          return res.status(500).json({ message: opResult.message || "Erreur lors de l'initiation du paiement OmniPay" });
        }

        await storage.createLeekpayPayment({
          leekpayPaymentId: orderId,
          userId: null,
          paymentLinkId: link.id,
          amount: numericAmount.toString(),
          currency: service.currency,
          type: "payment_link",
          status: "pending",
          description: `Paiement ${link.title} - OmniPay`,
          customerEmail: payerEmail,
          payerName,
          payerPhone: cleanPhone,
          payerCountry: service.countryCode,
          paymentMethod: `omnipay_${service.name}`,
          returnUrl: `${baseUrl}/payment-success?vendeur_id=${link.userId}&reference=${orderId}`,
          paymentUrl: opResult.payment_url || null,
        });

        console.log(`📤 OmniPay: Paiement lien initié ref=${orderId}, id=${opResult.id}`);

        if (isWave && opResult.payment_url) {
          return res.json({
            success: true,
            payId: orderId,
            orderId,
            status: "PENDING",
            provider: "omnipay",
            checkoutUrl: opResult.payment_url,
            message: "Vous allez être redirigé vers la page de paiement Wave.",
          });
        }

        return res.json({
          success: true,
          payId: orderId,
          orderId,
          status: "PENDING",
          provider: "omnipay",
          message: "Paiement initié. Veuillez confirmer sur votre téléphone.",
        });
      }

      if (!phoneNumber) {
        return res.status(400).json({ message: "Numéro de téléphone requis" });
      }

      if (service.operator === "Orange" && !otp) {
        return res.status(400).json({ message: "OTP requis pour Orange Money. Composez le code USSD sur votre téléphone pour générer votre OTP." });
      }

      console.log(`📤 SoleasPay: Paiement lien ${linkCode} montant=${numericAmount} ${service.currency}`);

      const result = await soleaspay.collectPayment({
        wallet: phoneNumber,
        amount: numericAmount,
        currency: service.currency,
        orderId,
        description: `Paiement à ${vendeur.fullName} - ${link.title}`,
        payer: payerName,
        payerEmail: payerEmail || "",
        serviceId: service.id,
        successUrl: `${baseUrl}/payment-success?vendeur_id=${link.userId}`,
        failureUrl: `${baseUrl}/pay/${linkCode}`,
        otp: otp || undefined,
      });

      if (!result.success) {
        console.error("❌ SoleasPay pay-link error:", result.message);
        return res.status(500).json({ message: result.message || "Erreur lors du paiement" });
      }

      const payId = result.data?.reference || orderId;

      await storage.createLeekpayPayment({
        leekpayPaymentId: payId,
        userId: null,
        paymentLinkId: link.id,
        amount: numericAmount.toString(),
        currency: service.currency,
        type: "payment_link",
        status: "pending",
        description: `Paiement ${link.title}`,
        customerEmail: payerEmail,
        payerName,
        payerPhone: phoneNumber,
        payerCountry: service.countryCode,
        paymentMethod: `soleaspay_${service.name}`,
        returnUrl: `${baseUrl}/payment-success?vendeur_id=${link.userId}`,
      });

      console.log(`📤 SoleasPay: Paiement lien initié ref=${payId}`);

      const waveUrl = result.wave_launch_url || result.payment_url || result.redirect_url || 
                      result.data?.wave_launch_url || result.data?.payment_url || result.data?.redirect_url;
      
      const isWaveOperator = service.operator === "Wave" || service.id === 32;

      res.json({ 
        success: true,
        payId,
        orderId,
        status: result.status,
        provider: "soleaspay",
        message: isWaveOperator && waveUrl 
          ? "Redirection vers Wave pour confirmer le paiement..." 
          : (result.message || "Paiement initié. Veuillez confirmer sur votre téléphone."),
        waveUrl: waveUrl || null,
        isWave: isWaveOperator,
      });
    } catch (error) {
      console.error("Pay-link error:", error);
      res.status(500).json({ message: "Erreur lors du paiement" });
    }
  });

  // Vérifier paiement de lien (SoleasPay ou WiniPayer - auto-detect)
  app.get("/api/verify-link-soleaspay/:orderId/:payId", async (req, res) => {
    try {
      const { orderId, payId } = req.params;

      const existingPayment = await storage.getLeekpayPaymentById(payId);
      if (existingPayment?.status === "completed") {
        return res.json({ 
          status: "SUCCESS", 
          message: "Paiement déjà traité",
          amount: existingPayment.amount
        });
      }

      const isWiniPayerPayment = existingPayment?.paymentMethod?.startsWith("winipayer");

      if (isWiniPayerPayment) {
        console.log(`🔍 WiniPayer: Vérification paiement lien uuid=${payId}`);
        const { winipayer } = await import("./winipayer");
        const verifyResult = await winipayer.verifyPayment(payId);

        if (verifyResult.success && verifyResult.results?.invoice) {
          const invoice = verifyResult.results.invoice;
          const state = invoice.state?.toLowerCase();

          if (state === "success" || state === "completed") {
            const hashValid = winipayer.validateHash({
              uuid: invoice.uuid,
              crypto: invoice.crypto,
              amount: invoice.amount,
              created_at: invoice.created_at,
              hash: invoice.hash,
            });

            if (!hashValid) {
              return res.json({ status: "PENDING", message: "Vérification de sécurité en cours..." });
            }

            if (existingPayment && existingPayment.paymentLinkId) {
              const claimed = await storage.claimLeekpayPayment(payId);
              if (claimed) {
                const link = await storage.getPaymentLink(existingPayment.paymentLinkId);
                if (link) {
                  const numAmount = parseFloat(invoice.amount.toString()) || parseFloat(claimed.amount);
                  const settings = await storage.getCommissionSettings();
                  const commissionRate = getCommissionRate(settings, "payment_received");
                  const fee = Math.round(numAmount * (commissionRate / 100));
                  const netAmount = numAmount - fee;

                  await storage.updatePaymentLink(link.id, {
                    paidAt: new Date(),
                    paidAmount: numAmount.toString(),
                  });

                  await storage.createTransaction({
                    userId: link.userId,
                    type: "payment_received",
                    amount: numAmount.toString(),
                    fee: fee.toString(),
                    netAmount: netAmount.toString(),
                    status: "completed",
                    description: `Paiement reçu - ${link.title}`,
                    externalRef: payId,
                    paymentMethod: claimed.paymentMethod || "winipayer",
                    mobileNumber: invoice.customer_pay?.phone || claimed.payerPhone,
                    payerName: invoice.customer_pay?.name || claimed.payerName,
                    payerEmail: invoice.customer_pay?.email || claimed.customerEmail,
                    payerCountry: claimed.payerCountry,
                    paymentLinkId: link.id,
                  });

                  await storage.updateUserBalance(link.userId, netAmount.toString());
                  console.log(`✅ WiniPayer lien: Paiement confirmé vendeur #${link.userId}: ${netAmount}`);
                }
              }
            }

            return res.json({ status: "SUCCESS", message: "Paiement confirmé avec succès", amount: invoice.amount });
          } else if (state === "failed" || state === "cancelled" || state === "expired") {
            if (existingPayment && existingPayment.status !== "completed") {
              await storage.updateLeekpayPayment(payId, { status: "failed" });
            }
            return res.json({ status: "FAILURE", message: "Le paiement a échoué ou a été annulé." });
          }
        }

        return res.json({ status: "PENDING", message: "Paiement en attente de confirmation..." });
      }

      console.log(`🔍 SoleasPay: Vérification paiement lien orderId=${orderId}, payId=${payId}`);
      const result = await soleaspay.verifyPayment(orderId, payId);

      if (result.success && result.status === "SUCCESS") {
        const amount = result.data?.amount || (existingPayment ? parseFloat(existingPayment.amount) : 0);
        
        if (existingPayment && existingPayment.paymentLinkId) {
          const claimed = await storage.claimLeekpayPayment(payId);
          if (!claimed) {
            console.log("⚠️ Transaction déjà traitée");
            return res.json({ status: "SUCCESS", message: "Paiement déjà traité", amount });
          }

          const link = await storage.getPaymentLink(existingPayment.paymentLinkId);
          if (!link) {
            return res.status(404).json({ message: "Lien de paiement non trouvé" });
          }

          const settings = await storage.getCommissionSettings();
          const commissionRate = getCommissionRate(settings, "payment_received");
          const fee = Math.round(amount * (commissionRate / 100));
          const netAmount = amount - fee;

          await storage.updatePaymentLink(link.id, {
            paidAt: new Date(),
            paidAmount: amount.toString(),
          });

          await storage.createTransaction({
            userId: link.userId,
            type: "payment_received",
            amount: amount.toString(),
            fee: fee.toString(),
            netAmount: netAmount.toString(),
            status: "completed",
            description: `Paiement reçu - ${link.title}`,
            externalRef: payId,
            paymentMethod: claimed.paymentMethod || "soleaspay",
            mobileNumber: claimed.payerPhone,
            payerName: claimed.payerName,
            payerEmail: claimed.customerEmail,
            payerCountry: claimed.payerCountry,
            paymentLinkId: link.id,
          });

          await storage.updateUserBalance(link.userId, netAmount.toString());

          console.log(`✅ SoleasPay: Paiement lien confirmé pour vendeur #${link.userId}: ${netAmount} ${existingPayment.currency}`);

          // Envoyer email de paiement reçu au vendeur
          const merchant = await storage.getUser(link.userId);
          if (merchant?.email) {
            sendPaymentReceivedEmail(merchant.email, {
              merchantName: merchant.fullName,
              amount: netAmount,
              currency: existingPayment.currency || "XOF",
              transactionId: payId,
              payerPhone: existingPayment.payerPhone || "",
              paymentLinkTitle: link.title
            }).catch(err => console.error("Failed to send payment received email:", err));
          }

          notifyPaymentReceived({
            merchantName: merchant?.fullName || "Inconnu",
            merchantId: link.userId,
            amount,
            fee,
            netAmount,
            currency: existingPayment.currency || "XOF",
            payerPhone: existingPayment.payerPhone || undefined,
            payerName: existingPayment.payerName || undefined,
            paymentLinkTitle: link.title,
            reference: payId,
            source: "link",
          });

          if (amount >= 500000) {
            notifyLargeAmount({
              type: "payment",
              userName: merchant?.fullName || "Inconnu",
              userId: link.userId,
              amount,
              currency: existingPayment.currency || "XOF",
              operator: existingPayment.paymentMethod || undefined,
              reference: payId,
            });
          }

          return res.json({ 
            status: "SUCCESS", 
            message: `Paiement confirmé! Le vendeur a reçu ${netAmount} ${existingPayment.currency}.`,
            amount: netAmount,
            vendeurId: link.userId
          });
        }
      }

      res.json({ 
        status: result.status || "PENDING",
        message: result.message || "Paiement en cours de traitement",
      });
    } catch (error) {
      console.error("SoleasPay verify-link error:", error);
      res.status(500).json({ message: "Erreur lors de la vérification" });
    }
  });

  // Callback webhook SoleasPay
  app.post("/api/webhook/soleaspay", async (req, res) => {
    try {
      const privateKey = req.headers["x-private-key"] as string;
      const data = req.body;

      console.log("📥 === SoleasPay Webhook reçu ===");
      console.log("📥 Data:", JSON.stringify(data));

      if (!data || !data.data) {
        console.error("❌ SoleasPay webhook: Données invalides");
        return res.status(400).json({ message: "Invalid data" });
      }

      const { reference, external_reference, amount, currency } = data.data;
      const status = data.status;
      const success = data.success;

      console.log(`📥 SoleasPay: ref=${reference}, ext_ref=${external_reference}, status=${status}, amount=${amount}`);

      // Chercher le paiement
      const payment = await storage.getLeekpayPaymentById(reference);
      
      if (!payment) {
        console.log("⚠️ SoleasPay webhook: Paiement non trouvé");
        return res.json({ received: true });
      }

      if (payment.status === "completed") {
        console.log("⚠️ SoleasPay webhook: Paiement déjà traité");
        return res.json({ received: true });
      }

      if (success && status === "SUCCESS") {
        const claimed = await storage.claimLeekpayPayment(reference);
        if (!claimed) {
          console.log("⚠️ SoleasPay webhook: Paiement déjà réclamé par un autre processus");
          return res.json({ received: true });
        }

        const numAmount = parseFloat(amount) || parseFloat(claimed.amount);
        const settings = await storage.getCommissionSettings();

        if (claimed.type === "deposit" && claimed.userId) {
          const commissionRate = await getEffectiveFeeRate(claimed.userId, "deposit", settings);
          const fee = Math.round(numAmount * (commissionRate / 100));
          const netAmount = numAmount - fee;

          await storage.createTransaction({
            userId: claimed.userId,
            type: "deposit",
            amount: numAmount.toString(),
            fee: fee.toString(),
            netAmount: netAmount.toString(),
            status: "completed",
            description: claimed.description || "Dépôt via SoleasPay",
            externalRef: reference,
            paymentMethod: claimed.paymentMethod || "soleaspay",
          });

          await storage.updateUserBalance(claimed.userId, netAmount.toString());
          console.log(`✅ SoleasPay webhook: Dépôt confirmé utilisateur #${claimed.userId}: ${netAmount}`);
        } else if (claimed.type === "payment_link" && claimed.paymentLinkId) {
          const commissionRate = getCommissionRate(settings, "payment_received");
          const fee = Math.round(numAmount * (commissionRate / 100));
          const netAmount = numAmount - fee;

          const link = await storage.getPaymentLink(claimed.paymentLinkId);
          if (link) {
            await storage.updatePaymentLink(link.id, {
              paidAt: new Date(),
              paidAmount: numAmount.toString(),
            });

            await storage.createTransaction({
              userId: link.userId,
              type: "payment_received",
              amount: numAmount.toString(),
              fee: fee.toString(),
              netAmount: netAmount.toString(),
              status: "completed",
              description: `Paiement reçu - ${link.title}`,
              externalRef: reference,
              paymentMethod: claimed.paymentMethod || "soleaspay",
              mobileNumber: claimed.payerPhone,
              payerName: claimed.payerName,
              payerEmail: claimed.customerEmail,
              payerCountry: claimed.payerCountry,
              paymentLinkId: link.id,
            });

            await storage.updateUserBalance(link.userId, netAmount.toString());
            console.log(`✅ SoleasPay webhook: Paiement lien confirmé vendeur #${link.userId}: ${netAmount}`);
          }
        }
      } else if (status === "FAILURE" || status === "REFUND") {
        await storage.updateLeekpayPayment(reference, { status: "failed" });
        console.log(`❌ SoleasPay webhook: Paiement échoué ref=${reference}`);
      }

      // Vérifier si c'est un callback de retrait
      const operation = data.data?.operation;
      if (operation === "WITHDRAW") {
        console.log("💸 SoleasPay webhook: Traitement callback retrait");
        
        const withdrawalRequest = await storage.getWithdrawalRequestByExternalRef(reference);
        
        if (withdrawalRequest && withdrawalRequest.status === "processing") {
          if (success && status === "SUCCESS") {
            // Débiter le solde maintenant
            const user = await storage.getUser(withdrawalRequest.userId);
            if (user) {
              const balance = parseFloat(user.balance);
              const withdrawAmount = parseFloat(withdrawalRequest.amount);
              const newBalance = balance - withdrawAmount;
              await storage.setUserBalance(withdrawalRequest.userId, newBalance.toString());
            }
            
            // Mettre à jour le statut
            await storage.updateWithdrawalRequest(withdrawalRequest.id, {
              status: "approved",
              processedAt: new Date(),
            });

            // Créer la transaction
            await storage.createTransaction({
              userId: withdrawalRequest.userId,
              type: "withdrawal",
              amount: withdrawalRequest.amount,
              fee: withdrawalRequest.fee,
              netAmount: withdrawalRequest.netAmount,
              status: "completed",
              description: `Retrait ${withdrawalRequest.paymentMethod} - ${withdrawalRequest.mobileNumber}`,
              externalRef: reference,
            });

            console.log(`✅ SoleasPay webhook: Retrait confirmé utilisateur #${withdrawalRequest.userId}`);
          } else if (status === "FAILED" || status === "FAILURE") {
            // Marquer comme échec sans débiter
            await storage.updateWithdrawalRequest(withdrawalRequest.id, {
              status: "failed",
              rejectionReason: "Le retrait a échoué auprès du service de paiement",
            });
            console.log(`❌ SoleasPay webhook: Retrait échoué ref=${reference}`);
          }
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("SoleasPay webhook error:", error);
      res.status(500).json({ message: "Erreur webhook" });
    }
  });

  app.post("/api/webhook/winipayer-deposit", async (req, res) => {
    try {
      const data = req.body;
      console.log("📥 === WiniPayer Deposit Webhook reçu ===");
      console.log("📥 Data:", JSON.stringify(data));

      const invoice = data?.results?.invoice || data?.invoice || data;
      if (!invoice || !invoice.uuid) {
        console.error("❌ WiniPayer deposit webhook: Données invalides");
        return res.status(200).json({ message: "OK" });
      }

      const state = (invoice.state || "").toLowerCase();
      const uuid = invoice.uuid;

      const payment = await storage.getLeekpayPaymentById(uuid);
      if (!payment) {
        console.log("⚠️ WiniPayer deposit webhook: Paiement non trouvé uuid=" + uuid);
        return res.status(200).json({ message: "OK" });
      }

      if (payment.status === "completed") {
        console.log("⚠️ WiniPayer deposit webhook: Paiement déjà traité");
        return res.status(200).json({ message: "OK" });
      }

      if (state === "success" || state === "completed") {
        const { winipayer } = await import("./winipayer");
        const hashValid = winipayer.validateHash({
          uuid: invoice.uuid,
          crypto: invoice.crypto,
          amount: invoice.amount || invoice.amount_init,
          created_at: invoice.created_at,
          hash: invoice.hash,
        });

        if (!hashValid) {
          console.error(`❌ WiniPayer deposit webhook: Hash invalide pour ${uuid} - rejeté`);
          return res.status(200).json({ message: "OK" });
        }

        const claimed = await storage.claimLeekpayPayment(uuid);
        if (!claimed) {
          console.log("⚠️ WiniPayer deposit webhook: Paiement déjà réclamé par un autre processus");
          return res.status(200).json({ message: "OK" });
        }

        const numAmount = parseFloat(invoice.amount) || parseFloat(claimed.amount);
        const settings = await storage.getCommissionSettings();

        if (claimed.type === "deposit" && claimed.userId) {
          const commissionRate = await getEffectiveFeeRate(claimed.userId, "deposit", settings);
          const fee = Math.round(numAmount * (commissionRate / 100));
          const netAmount = numAmount - fee;

          await storage.createTransaction({
            userId: claimed.userId,
            type: "deposit",
            amount: numAmount.toString(),
            fee: fee.toString(),
            netAmount: netAmount.toString(),
            status: "completed",
            description: claimed.description || "Dépôt via WiniPayer",
            externalRef: uuid,
            paymentMethod: claimed.paymentMethod || "winipayer",
          });

          await storage.updateUserBalance(claimed.userId, netAmount.toString());
          console.log(`✅ WiniPayer deposit webhook: Dépôt confirmé utilisateur #${claimed.userId}: ${netAmount}`);
        } else if (claimed.type === "payment_link" && claimed.paymentLinkId) {
          const commissionRate = getCommissionRate(settings, "payment_received");
          const fee = Math.round(numAmount * (commissionRate / 100));
          const netAmount = numAmount - fee;

          const link = await storage.getPaymentLink(claimed.paymentLinkId);
          if (link) {
            await storage.updatePaymentLink(link.id, {
              paidAt: new Date(),
              paidAmount: numAmount.toString(),
            });

            await storage.createTransaction({
              userId: link.userId,
              type: "payment_received",
              amount: numAmount.toString(),
              fee: fee.toString(),
              netAmount: netAmount.toString(),
              status: "completed",
              description: `Paiement reçu - ${link.title}`,
              externalRef: uuid,
              paymentMethod: claimed.paymentMethod || "winipayer",
              mobileNumber: invoice.customer_pay?.phone,
              payerName: invoice.customer_pay?.name || claimed.payerName,
              payerEmail: invoice.customer_pay?.email || claimed.customerEmail,
              payerCountry: claimed.payerCountry,
              paymentLinkId: link.id,
            });

            await storage.updateUserBalance(link.userId, netAmount.toString());
            console.log(`✅ WiniPayer deposit webhook: Paiement lien confirmé vendeur #${link.userId}: ${netAmount}`);
          }
        }
      } else if (state === "failed" || state === "cancelled" || state === "expired") {
        await storage.updateLeekpayPayment(uuid, { status: "failed" });
        console.log(`❌ WiniPayer deposit webhook: Paiement échoué uuid=${uuid}`);
      }

      res.status(200).json({ message: "OK" });
    } catch (error) {
      console.error("WiniPayer deposit webhook error:", error);
      res.status(200).json({ message: "OK" });
    }
  });

  app.post("/api/webhook/winipayer-payout", async (req, res) => {
    try {
      const data = req.body;
      console.log("📥 === WiniPayer Payout Webhook reçu ===");
      console.log("📥 Data:", JSON.stringify(data));

      const uuid = data?.uuid;
      if (!uuid) {
        console.error("❌ WiniPayer payout webhook: UUID manquant");
        return res.status(200).json({ message: "OK" });
      }

      const withdrawalRequest = await storage.getWithdrawalRequestByExternalRef(uuid);
      if (!withdrawalRequest) {
        console.log("⚠️ WiniPayer payout webhook: Demande de retrait non trouvée uuid=" + uuid);
        return res.status(200).json({ message: "OK" });
      }

      if (withdrawalRequest.status === "approved" || withdrawalRequest.status === "rejected" || withdrawalRequest.status === "failed") {
        console.log("⚠️ WiniPayer payout webhook: Retrait déjà traité (status=" + withdrawalRequest.status + ")");
        return res.status(200).json({ message: "OK" });
      }

      const state = (data.state || "").toLowerCase();
      const isPartnerWithdrawal = withdrawalRequest.userId === 0 && withdrawalRequest.walletName?.startsWith("PARTENAIRE:");
      const user = isPartnerWithdrawal ? null : await storage.getUser(withdrawalRequest.userId);
      const displayName = isPartnerWithdrawal ? (withdrawalRequest.walletName?.replace("PARTENAIRE:", "").split(" - ")[0] || "Partenaire") : (user?.fullName || "Inconnu");

      if (state === "success") {
        await storage.updateWithdrawalRequest(withdrawalRequest.id, {
          status: "approved",
          processedAt: new Date(),
        });

        if (!isPartnerWithdrawal) {
          await storage.createTransaction({
            userId: withdrawalRequest.userId,
            type: "withdrawal",
            amount: withdrawalRequest.amount,
            fee: withdrawalRequest.fee,
            netAmount: withdrawalRequest.netAmount,
            status: "completed",
            description: `Retrait automatique ${withdrawalRequest.paymentMethod} - ${withdrawalRequest.mobileNumber}`,
            mobileNumber: withdrawalRequest.mobileNumber,
            paymentMethod: withdrawalRequest.paymentMethod,
          });

          if (user?.email) {
            sendWithdrawalEmail(user.email, {
              userName: user.fullName,
              amount: parseFloat(withdrawalRequest.netAmount),
              currency: "XOF",
              transactionId: withdrawalRequest.id.toString(),
              phone: withdrawalRequest.mobileNumber,
              operator: withdrawalRequest.paymentMethod || "Mobile Money",
            }).catch(err => console.error("Failed to send withdrawal email:", err));
          }
        }

        notifyWithdrawalAutoProcessed({
          userName: displayName,
          userId: withdrawalRequest.userId,
          amount: withdrawalRequest.amount,
          netAmount: withdrawalRequest.netAmount,
          paymentMethod: withdrawalRequest.paymentMethod,
          mobileNumber: withdrawalRequest.mobileNumber,
          payoutUuid: uuid,
          status: "success",
        });

        console.log(`✅ WiniPayer payout webhook: Retrait confirmé ${isPartnerWithdrawal ? "partenaire" : "utilisateur"} #${withdrawalRequest.userId}`);
      } else if (state === "failed" || state === "cancelled") {
        if (isPartnerWithdrawal) {
          const partnerName = withdrawalRequest.walletName?.replace("PARTENAIRE:", "").split(" - ")[0] || "";
          const partners = await storage.getAllPartners();
          const partner = partners.find((p: any) => p.name === partnerName.trim());
          if (partner) {
            await storage.updatePartnerBalance(partner.id, parseFloat(withdrawalRequest.amount).toString());
            console.log(`💰 WiniPayer payout webhook: Solde partenaire ${partner.name} restauré +${withdrawalRequest.amount}`);
          }
        } else {
          await storage.setUserBalance(
            withdrawalRequest.userId,
            (parseFloat(user?.balance || "0") + parseFloat(withdrawalRequest.amount)).toString()
          );
        }

        await storage.updateWithdrawalRequest(withdrawalRequest.id, {
          status: "failed",
          rejectionReason: "Le transfert a échoué auprès du fournisseur de paiement",
        });

        notifyWithdrawalAutoProcessed({
          userName: displayName,
          userId: withdrawalRequest.userId,
          amount: withdrawalRequest.amount,
          netAmount: withdrawalRequest.netAmount,
          paymentMethod: withdrawalRequest.paymentMethod,
          mobileNumber: withdrawalRequest.mobileNumber,
          payoutUuid: uuid,
          status: "failed",
        });

        console.log(`❌ WiniPayer payout webhook: Retrait échoué ${isPartnerWithdrawal ? "partenaire" : "utilisateur"}, solde restauré`);
      }

      res.status(200).json({ message: "OK" });
    } catch (error) {
      console.error("WiniPayer payout webhook error:", error);
      res.status(200).json({ message: "OK" });
    }
  });

  app.get("/api/verify-winipayer/:payId", requireAuth, async (req, res) => {
    try {
      const { payId } = req.params;

      const existingPayment = await storage.getLeekpayPaymentById(payId);
      if (existingPayment?.status === "completed") {
        return res.json({ status: "SUCCESS", message: "Paiement confirmé", amount: existingPayment.amount });
      }

      const { winipayer } = await import("./winipayer");
      const verifyResult = await winipayer.verifyPayment(payId);

      if (verifyResult.success && verifyResult.results?.invoice) {
        const invoice = verifyResult.results.invoice;
        const state = invoice.state?.toLowerCase();

        if (state === "success" || state === "completed") {
          const hashValid = winipayer.validateHash({
            uuid: invoice.uuid,
            crypto: invoice.crypto,
            amount: invoice.amount,
            created_at: invoice.created_at,
            hash: invoice.hash,
          });

          if (!hashValid) {
            return res.json({ status: "PENDING", message: "Vérification de sécurité en cours..." });
          }

          if (existingPayment) {
            const claimed = await storage.claimLeekpayPayment(payId);
            if (claimed && claimed.type === "deposit" && claimed.userId) {
              const numAmount = parseFloat(invoice.amount.toString()) || parseFloat(claimed.amount);
              const settings = await storage.getCommissionSettings();
              const commissionRate = await getEffectiveFeeRate(claimed.userId, "deposit", settings);
              const fee = Math.round(numAmount * (commissionRate / 100));
              const netAmount = numAmount - fee;

              await storage.createTransaction({
                userId: claimed.userId,
                type: "deposit",
                amount: numAmount.toString(),
                fee: fee.toString(),
                netAmount: netAmount.toString(),
                status: "completed",
                description: claimed.description || "Dépôt via WiniPayer",
                externalRef: payId,
                paymentMethod: claimed.paymentMethod || "winipayer",
              });

              await storage.updateUserBalance(claimed.userId, netAmount.toString());
              console.log(`✅ WiniPayer: Dépôt confirmé utilisateur #${claimed.userId}: ${netAmount}`);
            }
          }

          return res.json({ status: "SUCCESS", message: "Paiement confirmé avec succès", amount: invoice.amount });
        } else if (state === "failed" || state === "cancelled" || state === "expired") {
          if (existingPayment) {
            await storage.updateLeekpayPayment(payId, { status: "failed" });
          }
          return res.json({ status: "FAILURE", message: "Paiement échoué ou annulé" });
        }
      }

      return res.json({ status: "PENDING", message: "Paiement en attente de confirmation" });
    } catch (error) {
      console.error("WiniPayer verify error:", error);
      return res.json({ status: "PENDING", message: "Vérification en cours..." });
    }
  });

  // Vérification manuelle d'un paiement OmniPay
  app.get("/api/verify-omnipay/:reference", requireAuth, async (req, res) => {
    try {
      const { reference } = req.params;
      console.log(`🔍 OmniPay: Vérification manuelle ref=${reference}`);

      const existingPayment = await storage.getLeekpayPaymentById(reference);
      if (existingPayment?.status === "completed") {
        return res.json({ status: "SUCCESS", message: "Paiement déjà traité", amount: existingPayment.amount });
      }

      if (!existingPayment) {
        return res.status(404).json({ status: "NOT_FOUND", message: "Paiement non trouvé" });
      }

      const { omnipay: opClient } = await import("./omnipay");
      const checkResult = await opClient.getStatus(reference);

      if (String(checkResult.success) === "1" && checkResult.status === 3) {
        const claimed = await storage.claimLeekpayPayment(reference);
        if (!claimed) {
          return res.json({ status: "SUCCESS", message: "Paiement déjà traité", amount: existingPayment?.amount });
        }

        const amount = parseFloat(claimed.amount);
        const settings = await storage.getCommissionSettings();

        if (claimed.type === "deposit" && claimed.userId) {
          const commissionRate = await getEffectiveFeeRate(claimed.userId, "deposit", settings);
          const fee = Math.round(amount * (commissionRate / 100));
          const netAmount = amount - fee;

          await storage.createTransaction({
            userId: claimed.userId,
            type: "deposit",
            amount: amount.toString(),
            fee: fee.toString(),
            netAmount: netAmount.toString(),
            status: "completed",
            description: claimed.description || "Dépôt via OmniPay",
            externalRef: reference,
            paymentMethod: claimed.paymentMethod || "omnipay",
          });

          await storage.updateUserBalance(claimed.userId, netAmount.toString());

          const depositUser = await storage.getUser(claimed.userId);
          if (depositUser?.email) {
            sendDepositEmail(depositUser.email, {
              userName: depositUser.fullName,
              amount: netAmount,
              currency: claimed.currency || "XOF",
              transactionId: reference,
              phone: claimed.payerPhone || "",
              operator: claimed.paymentMethod?.replace("omnipay_", "") || "OmniPay",
            }).catch(err => console.error("Failed to send deposit email:", err));
          }

          console.log(`✅ OmniPay verify: Dépôt confirmé utilisateur #${claimed.userId}: ${netAmount}`);
          return res.json({ status: "SUCCESS", message: "Paiement confirmé avec succès", amount: netAmount });
        } else if (claimed.type === "payment_link" && claimed.paymentLinkId) {
          const commissionRate = getCommissionRate(settings, "payment_received");
          const fee = Math.round(amount * (commissionRate / 100));
          const netAmount = amount - fee;

          const link = await storage.getPaymentLink(claimed.paymentLinkId);
          if (link) {
            await storage.updatePaymentLink(link.id, { paidAt: new Date(), paidAmount: amount.toString() });
            await storage.createTransaction({
              userId: link.userId,
              type: "payment_received",
              amount: amount.toString(),
              fee: fee.toString(),
              netAmount: netAmount.toString(),
              status: "completed",
              description: `Paiement reçu - ${link.title}`,
              externalRef: reference,
              paymentMethod: claimed.paymentMethod || "omnipay",
              mobileNumber: claimed.payerPhone,
              payerName: claimed.payerName,
              payerEmail: claimed.customerEmail,
              payerCountry: claimed.payerCountry,
              paymentLinkId: link.id,
            });
            await storage.updateUserBalance(link.userId, netAmount.toString());
          }
          return res.json({ status: "SUCCESS", message: "Paiement confirmé", amount: netAmount });
        }
      } else if (checkResult.status === 4) {
        await storage.updateLeekpayPayment(reference, { status: "failed" });
        return res.json({ status: "FAILURE", message: "Le paiement a échoué" });
      }

      return res.json({ status: "PENDING", message: "Paiement en attente de confirmation" });
    } catch (error) {
      console.error("OmniPay verify error:", error);
      return res.json({ status: "PENDING", message: "Vérification en cours..." });
    }
  });

  // Vérification manuelle d'un paiement MaishaPay
  app.get("/api/verify-maishapay/:reference", requireAuth, async (req, res) => {
    try {
      const { reference } = req.params;
      console.log(`🔍 MaishaPay: Vérification manuelle ref=${reference}`);

      const existingPayment = await storage.getLeekpayPaymentById(reference);
      if (existingPayment?.status === "completed") {
        return res.json({ status: "SUCCESS", message: "Paiement déjà traité", amount: existingPayment.amount });
      }

      if (!existingPayment) {
        return res.status(404).json({ status: "NOT_FOUND", message: "Paiement non trouvé" });
      }

      const { maishapay: mpClient } = await import("./maishapay");
      const checkResult = await mpClient.checkTransaction(reference);

      if (checkResult.status_code === 200 && checkResult.transactionStatus?.trim().toUpperCase() === "SUCCESS") {
        const claimed = await storage.claimLeekpayPayment(reference);
        if (!claimed) {
          return res.json({ status: "SUCCESS", message: "Paiement déjà traité", amount: existingPayment?.amount });
        }

        const amount = parseFloat(claimed.amount);
        const settings = await storage.getCommissionSettings();

        if (claimed.type === "deposit" && claimed.userId) {
          const commissionRate = await getEffectiveFeeRate(claimed.userId, "deposit", settings);
          const fee = Math.round(amount * (commissionRate / 100));
          const netAmount = amount - fee;

          await storage.createTransaction({
            userId: claimed.userId,
            type: "deposit",
            amount: amount.toString(),
            fee: fee.toString(),
            netAmount: netAmount.toString(),
            status: "completed",
            description: claimed.description || "Dépôt via MaishaPay",
            externalRef: reference,
            paymentMethod: claimed.paymentMethod || "maishapay",
          });

          await storage.updateUserBalance(claimed.userId, netAmount.toString());

          const depositUser = await storage.getUser(claimed.userId);
          if (depositUser?.email) {
            sendDepositEmail(depositUser.email, {
              userName: depositUser.fullName,
              amount: netAmount,
              currency: claimed.currency || "CDF",
              transactionId: reference,
              phone: claimed.payerPhone || "",
              operator: claimed.paymentMethod?.replace("maishapay_", "") || "MaishaPay",
            }).catch(err => console.error("Failed to send deposit email:", err));
          }

          console.log(`✅ MaishaPay verify: Dépôt confirmé utilisateur #${claimed.userId}: ${netAmount}`);
          return res.json({ status: "SUCCESS", message: "Paiement confirmé avec succès", amount: netAmount });
        } else if (claimed.type === "payment_link" && claimed.paymentLinkId) {
          const commissionRate = getCommissionRate(settings, "payment_received");
          const fee = Math.round(amount * (commissionRate / 100));
          const netAmount = amount - fee;

          const link = await storage.getPaymentLink(claimed.paymentLinkId);
          if (link) {
            await storage.updatePaymentLink(link.id, { paidAt: new Date(), paidAmount: amount.toString() });
            await storage.createTransaction({
              userId: link.userId,
              type: "payment_received",
              amount: amount.toString(),
              fee: fee.toString(),
              netAmount: netAmount.toString(),
              status: "completed",
              description: `Paiement reçu - ${link.title}`,
              externalRef: reference,
              paymentMethod: claimed.paymentMethod || "maishapay",
              mobileNumber: claimed.payerPhone,
              payerName: claimed.payerName,
              payerEmail: claimed.customerEmail,
              payerCountry: claimed.payerCountry,
              paymentLinkId: link.id,
            });
            await storage.updateUserBalance(link.userId, netAmount.toString());
            console.log(`✅ MaishaPay verify: Paiement lien confirmé vendeur #${link.userId}: ${netAmount}`);
          }
          return res.json({ status: "SUCCESS", message: "Paiement confirmé", amount: netAmount });
        }
      } else if (checkResult.transactionStatus?.trim().toUpperCase() === "FAILED") {
        await storage.updateLeekpayPayment(reference, { status: "failed" });
        return res.json({ status: "FAILURE", message: "Le paiement a échoué" });
      }

      return res.json({ status: "PENDING", message: "Paiement en attente de confirmation" });
    } catch (error) {
      console.error("MaishaPay verify error:", error);
      return res.json({ status: "PENDING", message: "Vérification en cours..." });
    }
  });

  // Callback webhook MaishaPay
  app.post("/api/webhook/maishapay", async (req, res) => {
    try {
      const data = req.body;
      console.log("📥 === MaishaPay Webhook reçu ===");
      console.log("📥 Data:", JSON.stringify(data));

      res.status(200).json({ received: true });

      const transactionStatus = (data?.transactionStatus || "").trim().toUpperCase();
      const originatingTransactionId = data?.originatingTransactionId;

      if (!originatingTransactionId) {
        console.error("❌ MaishaPay webhook: originatingTransactionId manquant");
        return;
      }

      const payment = await storage.getLeekpayPaymentById(originatingTransactionId);
      if (!payment) {
        console.log("⚠️ MaishaPay webhook: Paiement non trouvé ref=" + originatingTransactionId);
        return;
      }

      if (payment.status === "completed") {
        console.log("⚠️ MaishaPay webhook: Paiement déjà traité ref=" + originatingTransactionId);
        return;
      }

      if (transactionStatus === "SUCCESS") {
        const claimed = await storage.claimLeekpayPayment(originatingTransactionId);
        if (!claimed) {
          console.log("⚠️ MaishaPay webhook: Paiement déjà réclamé ref=" + originatingTransactionId);
          return;
        }

        const amount = parseFloat(claimed.amount);
        const settings = await storage.getCommissionSettings();

        if (claimed.type === "deposit" && claimed.userId) {
          const commissionRate = await getEffectiveFeeRate(claimed.userId, "deposit", settings);
          const fee = Math.round(amount * (commissionRate / 100));
          const netAmount = amount - fee;

          await storage.createTransaction({
            userId: claimed.userId,
            type: "deposit",
            amount: amount.toString(),
            fee: fee.toString(),
            netAmount: netAmount.toString(),
            status: "completed",
            description: claimed.description || "Dépôt via MaishaPay",
            externalRef: originatingTransactionId,
            paymentMethod: claimed.paymentMethod || "maishapay",
          });

          await storage.updateUserBalance(claimed.userId, netAmount.toString());

          const depositUser = await storage.getUser(claimed.userId);
          if (depositUser?.email) {
            sendDepositEmail(depositUser.email, {
              userName: depositUser.fullName,
              amount: netAmount,
              currency: claimed.currency || "CDF",
              transactionId: originatingTransactionId,
              phone: claimed.payerPhone || "",
              operator: claimed.paymentMethod?.replace("maishapay_", "") || "MaishaPay",
            }).catch(err => console.error("Failed to send deposit email:", err));
          }

          const { notifyDeposit } = await import("./telegram");
          notifyDeposit({
            userName: depositUser?.fullName || "Inconnu",
            userId: claimed.userId,
            amount,
            fee: amount - netAmount,
            netAmount,
            currency: claimed.currency || "CDF",
            phone: claimed.payerPhone || "",
            operator: claimed.paymentMethod?.replace("maishapay_", "") || "MaishaPay",
            reference: originatingTransactionId,
          });

          console.log(`✅ MaishaPay webhook: Dépôt confirmé utilisateur #${claimed.userId}: ${netAmount}`);
        } else if (claimed.type === "payment_link" && claimed.paymentLinkId) {
          const commissionRate = getCommissionRate(settings, "payment_received");
          const fee = Math.round(amount * (commissionRate / 100));
          const netAmount = amount - fee;

          const link = await storage.getPaymentLink(claimed.paymentLinkId);
          if (link) {
            await storage.updatePaymentLink(link.id, { paidAt: new Date(), paidAmount: amount.toString() });
            await storage.createTransaction({
              userId: link.userId,
              type: "payment_received",
              amount: amount.toString(),
              fee: fee.toString(),
              netAmount: netAmount.toString(),
              status: "completed",
              description: `Paiement reçu - ${link.title}`,
              externalRef: originatingTransactionId,
              paymentMethod: claimed.paymentMethod || "maishapay",
              mobileNumber: claimed.payerPhone,
              payerName: claimed.payerName,
              payerEmail: claimed.customerEmail,
              payerCountry: claimed.payerCountry,
              paymentLinkId: link.id,
            });
            await storage.updateUserBalance(link.userId, netAmount.toString());
            console.log(`✅ MaishaPay webhook: Paiement lien confirmé vendeur #${link.userId}: ${netAmount}`);
          }
        }
      } else if (transactionStatus === "FAILED") {
        await storage.updateLeekpayPayment(originatingTransactionId, { status: "failed" });
        console.log(`❌ MaishaPay webhook: Paiement échoué ref=${originatingTransactionId}`);
      }
    } catch (error) {
      console.error("MaishaPay webhook error:", error);
    }
  });

  // Callback webhook OmniPay
  app.post("/api/webhook/omnipay", async (req, res) => {
    try {
      const data = req.body as import("./omnipay").OmniPayWebhookPayload;
      console.log("📥 === OmniPay Webhook reçu ===");
      console.log("📥 Data:", JSON.stringify(data));

      res.status(200).json({ received: true });

      const { verifyOmnipaySignature } = await import("./omnipay");
      const callbackKey = process.env.OMNIPAY_CALLBACK_KEY || "";

      if (callbackKey && data.signature) {
        const valid = verifyOmnipaySignature(data, callbackKey);
        if (!valid) {
          console.error("❌ OmniPay webhook: Signature invalide");
          return;
        }
      }

      const status = String(data.status);
      const reference = data.reference;

      if (!reference) {
        console.error("❌ OmniPay webhook: reference manquant");
        return;
      }

      const payment = await storage.getLeekpayPaymentById(reference);
      if (!payment) {
        console.log("⚠️ OmniPay webhook: Paiement non trouvé ref=" + reference);
        return;
      }

      if (payment.status === "completed") {
        console.log("⚠️ OmniPay webhook: Paiement déjà traité ref=" + reference);
        return;
      }

      if (status === "3") {
        const claimed = await storage.claimLeekpayPayment(reference);
        if (!claimed) {
          console.log("⚠️ OmniPay webhook: Paiement déjà réclamé ref=" + reference);
          return;
        }

        const amount = parseFloat(claimed.amount);
        const settings = await storage.getCommissionSettings();

        if (claimed.type === "deposit" && claimed.userId) {
          const commissionRate = await getEffectiveFeeRate(claimed.userId, "deposit", settings);
          const fee = Math.round(amount * (commissionRate / 100));
          const netAmount = amount - fee;

          await storage.createTransaction({
            userId: claimed.userId,
            type: "deposit",
            amount: amount.toString(),
            fee: fee.toString(),
            netAmount: netAmount.toString(),
            status: "completed",
            description: claimed.description || "Dépôt via OmniPay",
            externalRef: reference,
            paymentMethod: claimed.paymentMethod || "omnipay",
          });

          await storage.updateUserBalance(claimed.userId, netAmount.toString());

          const depositUser = await storage.getUser(claimed.userId);
          if (depositUser?.email) {
            sendDepositEmail(depositUser.email, {
              userName: depositUser.fullName,
              amount: netAmount,
              currency: claimed.currency || "XOF",
              transactionId: reference,
              phone: claimed.payerPhone || "",
              operator: claimed.paymentMethod?.replace("omnipay_", "") || "OmniPay",
            }).catch(err => console.error("Failed to send deposit email:", err));
          }

          const { notifyDeposit } = await import("./telegram");
          notifyDeposit({
            userName: depositUser?.fullName || "Inconnu",
            userId: claimed.userId,
            amount,
            fee: amount - netAmount,
            netAmount,
            currency: claimed.currency || "XOF",
            phone: claimed.payerPhone || "",
            operator: claimed.paymentMethod?.replace("omnipay_", "") || "OmniPay",
            reference,
          });

          console.log(`✅ OmniPay webhook: Dépôt confirmé utilisateur #${claimed.userId}: ${netAmount}`);
        } else if (claimed.type === "payment_link" && claimed.paymentLinkId) {
          const commissionRate = getCommissionRate(settings, "payment_received");
          const fee = Math.round(amount * (commissionRate / 100));
          const netAmount = amount - fee;

          const link = await storage.getPaymentLink(claimed.paymentLinkId);
          if (link) {
            await storage.updatePaymentLink(link.id, { paidAt: new Date(), paidAmount: amount.toString() });
            await storage.createTransaction({
              userId: link.userId,
              type: "payment_received",
              amount: amount.toString(),
              fee: fee.toString(),
              netAmount: netAmount.toString(),
              status: "completed",
              description: `Paiement reçu - ${link.title}`,
              externalRef: reference,
              paymentMethod: claimed.paymentMethod || "omnipay",
              mobileNumber: claimed.payerPhone,
              payerName: claimed.payerName,
              payerEmail: claimed.customerEmail,
              payerCountry: claimed.payerCountry,
              paymentLinkId: link.id,
            });
            await storage.updateUserBalance(link.userId, netAmount.toString());
            console.log(`✅ OmniPay webhook: Paiement lien confirmé vendeur #${link.userId}: ${netAmount}`);
          }
        }
      } else if (status === "4") {
        await storage.updateLeekpayPayment(reference, { status: "failed" });
        console.log(`❌ OmniPay webhook: Paiement échoué ref=${reference}, message=${data.message}`);
      }
    } catch (error) {
      console.error("OmniPay webhook error:", error);
    }
  });

  // ========== FIN SOLEASPAY ROUTES ==========

  // Vérifier et créditer un paiement LeekPay (appelé au retour de LeekPay)
  app.post("/api/verify-payment", requireAuth, async (req, res) => {
    try {
      const { paymentId } = req.body;
      
      if (!paymentId) {
        return res.status(400).json({ message: "paymentId requis" });
      }

      console.log("Verifying payment with LeekPay for:", paymentId);

      const leekpayPayment = await storage.getLeekpayPaymentById(paymentId);
      
      if (!leekpayPayment) {
        return res.status(404).json({ message: "Paiement non trouvé" });
      }

      // Si déjà complété, retourner le statut
      if (leekpayPayment.status === "completed") {
        return res.json({ status: "completed", message: "Paiement déjà traité" });
      }

      // IMPORTANT: Vérifier le statut auprès de LeekPay pour éviter les fraudes
      console.log("Checking payment status with LeekPay API...");
      const statusResult = await leekpay.getPaymentStatus(paymentId);
      console.log("LeekPay API response:", JSON.stringify(statusResult));
      
      if (!statusResult.success) {
        console.log("LeekPay API error, payment not verified");
        return res.json({ status: "pending", message: "Paiement en cours de vérification. Veuillez patienter." });
      }

      const leekpayStatus = statusResult.data?.status;
      console.log("LeekPay payment status:", leekpayStatus);
      
      // Ne créditer que si LeekPay confirme que le paiement est complété
      if (leekpayStatus !== "completed") {
        // Mettre à jour le statut local si différent
        if (leekpayStatus && leekpayStatus !== leekpayPayment.status) {
          await storage.updateLeekpayPayment(paymentId, { status: leekpayStatus as any });
        }
        return res.json({ 
          status: leekpayStatus || "pending", 
          message: leekpayStatus === "failed" ? "Le paiement a échoué." : "Paiement en cours de traitement. Veuillez patienter." 
        });
      }

      console.log("LeekPay confirmed payment completed, crediting user...");
      
      const claimed = await storage.claimLeekpayPayment(paymentId);
      if (!claimed) {
        return res.json({ status: "completed", message: "Paiement déjà traité" });
      }

      const settings = await storage.getCommissionSettings();
      const commissionRate = await getEffectiveFeeRate(claimed.userId || leekpayPayment.userId, "deposit", settings);
      const amount = parseFloat(claimed.amount);
      const fee = Math.round(amount * (commissionRate / 100));
      const netAmount = amount - fee;

      if (claimed.type === "deposit" && claimed.userId) {
        // Créer la transaction
        await storage.createTransaction({
          userId: leekpayPayment.userId,
          type: "deposit",
          amount: amount.toString(),
          fee: fee.toString(),
          netAmount: netAmount.toString(),
          status: "completed",
          description: leekpayPayment.description || "Dépôt via LeekPay",
          externalRef: paymentId,
          paymentMethod: leekpayPayment.paymentMethod || "leekpay",
        });

        // Mettre à jour le solde
        await storage.updateUserBalance(leekpayPayment.userId, netAmount.toString());
        
        console.log(`Payment verified and credited: user ${leekpayPayment.userId}, amount: ${netAmount}`);
        return res.json({ status: "completed", message: `Dépôt de ${netAmount} ${leekpayPayment.currency} crédité avec succès!` });
      } else if (leekpayPayment.type === "payment_link" && leekpayPayment.paymentLinkId) {
        const link = await storage.getPaymentLink(leekpayPayment.paymentLinkId);
        if (link) {
          await storage.updatePaymentLink(link.id, {
            paidAt: new Date(),
            payerName: leekpayPayment.payerName,
            payerEmail: leekpayPayment.customerEmail || null,
            payerPhone: leekpayPayment.payerPhone,
            payerCountry: leekpayPayment.payerCountry,
            paidAmount: amount.toString(),
          });

          await storage.createTransaction({
            userId: link.userId,
            type: "payment_received",
            amount: amount.toString(),
            fee: fee.toString(),
            netAmount: netAmount.toString(),
            status: "completed",
            description: `Paiement reçu: ${link.title}`,
            externalRef: paymentId,
            paymentMethod: leekpayPayment.paymentMethod || "leekpay",
            mobileNumber: leekpayPayment.payerPhone,
            payerName: leekpayPayment.payerName,
            payerEmail: leekpayPayment.customerEmail,
            payerCountry: leekpayPayment.payerCountry,
            paymentLinkId: link.id,
          });

          await storage.updateUserBalance(link.userId, netAmount.toString());
          
          console.log(`Payment link verified and credited: user ${link.userId}, amount: ${netAmount}`);
          return res.json({ status: "completed", message: `Paiement de ${netAmount} ${leekpayPayment.currency} crédité avec succès!` });
        }
      }

      res.json({ status: "completed", message: "Paiement crédité avec succès!" });
    } catch (error) {
      console.error("Verify payment error:", error);
      res.status(500).json({ message: "Erreur lors de la vérification" });
    }
  });

  // Vérification de paiement par référence (pour pages de succès après redirection LeekPay)
  // Utilisé par /success et /payment-success
  app.get("/api/verify-payment-by-reference/:reference", async (req, res) => {
    try {
      const { reference } = req.params;
      const vendeurId = req.query.vendeur_id as string | undefined;
      
      console.log("🔍 Vérification paiement par référence:", reference);
      console.log("🔍 Vendeur ID (si lien):", vendeurId || "N/A");
      
      if (!reference) {
        return res.status(400).json({ status: "error", message: "Référence requise" });
      }

      // 1. Chercher dans notre base de données (par leekpayPaymentId ou par orderId dans returnUrl)
      let leekpayPayment = await storage.getLeekpayPaymentById(reference);
      
      if (!leekpayPayment) {
        const { db } = await import("./db");
        const { sql } = await import("drizzle-orm");
        const { leekpayPayments } = await import("@shared/schema");
        const results = await db!.select().from(leekpayPayments).where(
          sql`${leekpayPayments.returnUrl} LIKE ${'%reference=' + reference + '%'}`
        ).limit(1);
        if (results.length > 0) {
          leekpayPayment = results[0];
        }
      }
      
      // 2. Si déjà complété, retourner le statut
      if (leekpayPayment?.status === "completed") {
        console.log("✅ Paiement déjà traité:", reference);
        let redirectUrl = null;
        if (leekpayPayment.paymentLinkId) {
          const link = await storage.getPaymentLink(leekpayPayment.paymentLinkId);
          redirectUrl = link?.redirectUrl || null;
        }
        return res.json({ 
          status: "completed", 
          message: "Paiement confirmé!",
          amount: leekpayPayment.amount,
          userId: leekpayPayment.userId,
          redirectUrl
        });
      }

      // 3. Vérifier le statut auprès de l'API appropriée
      const isWiniPayerRef = leekpayPayment?.paymentMethod?.startsWith("winipayer");
      
      let leekpayStatus: string | undefined;
      let leekpayAmount: number | undefined;

      if (isWiniPayerRef && leekpayPayment) {
        console.log("📡 Appel API WiniPayer pour vérifier:", leekpayPayment.leekpayPaymentId);
        const { winipayer } = await import("./winipayer");
        const winiVerify = await winipayer.verifyPayment(leekpayPayment.leekpayPaymentId);
        
        if (winiVerify.success && winiVerify.results?.invoice) {
          const invoice = winiVerify.results.invoice;
          const state = invoice.state?.toLowerCase();
          
          if (state === "success" || state === "completed") {
            const hashValid = winipayer.validateHash({
              uuid: invoice.uuid,
              crypto: invoice.crypto,
              amount: invoice.amount,
              created_at: invoice.created_at,
              hash: invoice.hash,
            });
            if (hashValid) {
              leekpayStatus = "completed";
              leekpayAmount = invoice.amount;
            } else {
              return res.json({ status: "pending", message: "Vérification de sécurité en cours..." });
            }
          } else if (state === "failed" || state === "cancelled" || state === "expired") {
            leekpayStatus = "failed";
          } else {
            leekpayStatus = "pending";
          }
        } else {
          return res.json({ status: "pending", message: "Vérification en cours. Veuillez patienter..." });
        }
      } else {
        console.log("📡 Appel API LeekPay pour vérifier:", reference);
        const statusResult = await leekpay.getPaymentStatus(reference);
        console.log("📡 Réponse LeekPay:", JSON.stringify(statusResult));
        
        if (!statusResult.success) {
          console.log("⚠️ API LeekPay indisponible ou référence inconnue");
          return res.json({ status: "pending", message: "Vérification en cours. Veuillez patienter..." });
        }
        
        leekpayStatus = statusResult.data?.status;
        leekpayAmount = statusResult.data?.amount;
      }
      
      console.log("📊 Statut:", leekpayStatus, "Montant:", leekpayAmount);
      
      // 4. Si le paiement n'est pas encore complété
      const paymentKey = leekpayPayment?.leekpayPaymentId || reference;
      
      if (leekpayStatus !== "completed") {
        if (leekpayPayment && leekpayStatus && leekpayStatus !== leekpayPayment.status) {
          await storage.updateLeekpayPayment(paymentKey, { status: leekpayStatus as any });
        }
        return res.json({ 
          status: leekpayStatus || "pending", 
          message: leekpayStatus === "failed" ? "Le paiement a échoué." : "Paiement en cours de traitement..." 
        });
      }

      // 5. Paiement confirmé - créditer le compte
      console.log("✅ Paiement confirmé, traitement en cours...");
      
      const settings = await storage.getCommissionSettings();
      const commissionRate = await getEffectiveFeeRate(leekpayPayment?.userId || 0, "deposit", settings);
      const amount = leekpayAmount || (leekpayPayment ? parseFloat(leekpayPayment.amount) : 0);
      const fee = Math.round(amount * (commissionRate / 100));
      const netAmount = amount - fee;

      // Si on a un paiement dans notre base
      if (leekpayPayment) {
        // Idempotence: Mettre à jour le statut immédiatement avant de créditer
        await storage.updateLeekpayPayment(paymentKey, {
          status: "completed",
          webhookReceived: true,
          completedAt: new Date(),
        });

        // Vérifier si une transaction existe déjà avec cette référence
        const existingTransactions = await storage.getTransactions(
          leekpayPayment.userId || 0
        );
        const alreadyProcessed = existingTransactions.some(
          (t: { externalRef: string | null; status: string }) => (t.externalRef === reference || t.externalRef === paymentKey) && t.status === "completed"
        );

        if (alreadyProcessed) {
          console.log("⚠️ Transaction déjà traitée, pas de double crédit");
          let redirectUrl = null;
          if (leekpayPayment.paymentLinkId) {
            const link = await storage.getPaymentLink(leekpayPayment.paymentLinkId);
            redirectUrl = link?.redirectUrl || null;
          }
          return res.json({ 
            status: "completed", 
            message: "Paiement déjà traité!",
            amount: netAmount,
            redirectUrl
          });
        }

        if (leekpayPayment.type === "deposit" && leekpayPayment.userId) {
          // Créer la transaction
          await storage.createTransaction({
            userId: leekpayPayment.userId,
            type: "deposit",
            amount: amount.toString(),
            fee: fee.toString(),
            netAmount: netAmount.toString(),
            status: "completed",
            description: leekpayPayment.description || "Dépôt via LeekPay",
            externalRef: paymentKey,
            paymentMethod: leekpayPayment.paymentMethod || "leekpay",
          });

          await storage.updateUserBalance(leekpayPayment.userId, netAmount.toString());
          console.log(`✅ Dépôt confirmé pour utilisateur #${leekpayPayment.userId}: ${netAmount} XOF`);
          
          return res.json({ 
            status: "completed", 
            message: `Paiement confirmé! ${netAmount} XOF ont été crédités sur votre compte.`,
            amount: netAmount,
            userId: leekpayPayment.userId
          });
        } else if (leekpayPayment.type === "payment_link" && leekpayPayment.paymentLinkId) {
          const link = await storage.getPaymentLink(leekpayPayment.paymentLinkId);
          if (link) {
            await storage.updatePaymentLink(link.id, {
              paidAt: new Date(),
              paidAmount: amount.toString(),
            });

            await storage.updateUserBalance(link.userId, netAmount.toString());

            await storage.createTransaction({
              userId: link.userId,
              type: "payment_received",
              amount: amount.toString(),
              fee: fee.toString(),
              netAmount: netAmount.toString(),
              status: "completed",
              description: `Paiement reçu: ${link.title}`,
              paymentMethod: leekpayPayment.paymentMethod || "leekpay",
              paymentLinkId: link.id,
              externalRef: paymentKey,
              mobileNumber: leekpayPayment.payerPhone,
              payerName: leekpayPayment.payerName,
              payerEmail: leekpayPayment.customerEmail,
              payerCountry: leekpayPayment.payerCountry,
            });

            console.log(`✅ Paiement lien confirmé pour vendeur #${link.userId}: ${netAmount} XOF`);
            
            return res.json({ 
              status: "completed", 
              message: `Paiement confirmé! Le vendeur a reçu ${netAmount} XOF.`,
              amount: netAmount,
              vendeurId: link.userId,
              redirectUrl: link.redirectUrl || null
            });
          }
        }
      }
      
      // Sécurité: Ne jamais créditer sans avoir un enregistrement de paiement valide
      // Le cas de secours avec vendeur_id a été supprimé pour éviter les fraudes
      console.log("⚠️ Paiement confirmé par LeekPay mais aucun enregistrement local trouvé");
      return res.json({ 
        status: "completed", 
        message: "Paiement confirmé!",
        amount: netAmount
      });
      
    } catch (error) {
      console.error("❌ Erreur vérification par référence:", error);
      res.status(500).json({ status: "error", message: "Erreur lors de la vérification" });
    }
  });

  // All withdrawals require admin approval - balance is debited immediately
  app.post("/api/withdraw", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.isVerified) {
        return res.status(403).json({ message: "Compte non vérifié. Veuillez compléter la vérification KYC." });
      }

      const { amount, paymentMethod, mobileNumber, country, walletName } = req.body;
      const numericAmount = parseFloat(amount);
      const balance = parseFloat(user.balance);

      if (isNaN(numericAmount) || numericAmount < 200) {
        return res.status(400).json({ message: "Montant minimum: 200 XOF" });
      }

      if (numericAmount > balance) {
        return res.status(400).json({ message: "Solde insuffisant" });
      }

      // Validate country and payment method using database operators
      const countries = await storage.getCountries();
      const operators = await storage.getOperators();
      
      const selectedCountry = countries.find(c => c.code.toLowerCase() === country.toLowerCase());
      if (!selectedCountry) {
        return res.status(400).json({ message: "Pays invalide" });
      }
      
      const countryOperators = operators.filter(op => op.countryId === selectedCountry.id);
      const selectedOperator = countryOperators.find(op => 
        op.code === paymentMethod || 
        op.id.toString() === paymentMethod ||
        op.name.toLowerCase() === paymentMethod.toLowerCase()
      );
      
      if (!selectedOperator) {
        return res.status(400).json({ message: "Moyen de paiement invalide pour ce pays" });
      }
      
      if (selectedOperator.inMaintenance || selectedOperator.maintenanceWithdraw) {
        return res.status(400).json({ message: "Ce moyen de paiement est actuellement en maintenance pour les retraits" });
      }

      if (!mobileNumber) {
        return res.status(400).json({ message: "Veuillez entrer un numéro de téléphone" });
      }

      const settings = await storage.getCommissionSettings();
      const commissionRate = getCommissionRate(settings, "withdrawal", (selectedCountry as any).withdrawFeeRate);
      const fee = Math.round(numericAmount * (commissionRate / 100));
      const netAmount = numericAmount - fee;

      // Débiter le solde immédiatement (en attente de validation admin)
      const newBalance = balance - numericAmount;
      await storage.setUserBalance(req.session.userId!, newBalance.toString());
      
      console.log("💸 Withdrawal request - Country:", selectedCountry.code, "Operator:", paymentMethod);
      console.log("💸 Balance debited immediately:", numericAmount, "New balance:", newBalance);

      const isWiniPayerOperator = selectedOperator.paymentGateway === "winipayer";

      if (isWiniPayerOperator) {
        const { createPayout, getWiniPayerPayoutOperator } = await import("./winipayer");
        const payoutOperator = getWiniPayerPayoutOperator(selectedOperator.name, country);

        if (!payoutOperator) {
          const newBalance2 = balance;
          await storage.setUserBalance(req.session.userId!, newBalance2.toString());
          return res.status(400).json({ message: "Opérateur non supporté pour le retrait automatique" });
        }

        const withdrawalRequest = await storage.createWithdrawalRequest({
          userId: req.session.userId!,
          amount: numericAmount.toString(),
          fee: fee.toString(),
          netAmount: netAmount.toString(),
          paymentMethod: selectedOperator.name,
          mobileNumber,
          country,
          walletName: walletName || null,
        });

        await storage.updateWithdrawalRequest(withdrawalRequest.id, { status: "processing" });

        console.log("💸 WiniPayer auto-withdrawal: operator=", payoutOperator, "amount=", netAmount, "phone=", mobileNumber);

        try {
          const payoutResult = await createPayout({
            operator: payoutOperator,
            recipients: [{
              name: walletName || user.fullName || "Client",
              account: mobileNumber.replace(/\s/g, ""),
              amount: netAmount,
            }],
            description: `Retrait SendavaPay #${withdrawalRequest.id}`,
            customData: { withdrawalId: withdrawalRequest.id, userId: req.session.userId },
            callbackUrl: "https://sendavapay.com/api/webhook/winipayer-payout",
          });

          if (payoutResult.uuid) {
            await storage.updateWithdrawalRequest(withdrawalRequest.id, {
              externalReference: payoutResult.uuid,
              transactionReference: payoutResult.crypto || null,
            });

            const payoutState = payoutResult.state?.toLowerCase();

            if (payoutState === "success") {
              await storage.updateWithdrawalRequest(withdrawalRequest.id, {
                status: "approved",
                processedAt: new Date(),
              });

              await storage.createTransaction({
                userId: req.session.userId!,
                type: "withdrawal",
                amount: numericAmount.toString(),
                fee: fee.toString(),
                netAmount: netAmount.toString(),
                status: "completed",
                description: `Retrait automatique ${selectedOperator.name} - ${mobileNumber}`,
                mobileNumber,
                paymentMethod: selectedOperator.name,
              });

              if (user?.email) {
                sendWithdrawalEmail(user.email, {
                  userName: user.fullName,
                  amount: netAmount,
                  currency: "XOF",
                  transactionId: withdrawalRequest.id.toString(),
                  phone: mobileNumber,
                  operator: selectedOperator.name,
                }).catch(err => console.error("Failed to send withdrawal email:", err));
              }

              notifyWithdrawalAutoProcessed({
                userName: user.fullName,
                userId: req.session.userId!,
                amount: numericAmount.toString(),
                netAmount: netAmount.toString(),
                paymentMethod: selectedOperator.name,
                mobileNumber,
                payoutUuid: payoutResult.uuid,
                status: "success",
              });

              return res.json({
                message: "Retrait effectué avec succès! L'argent a été envoyé sur votre compte mobile.",
                request: { ...withdrawalRequest, status: "approved" },
                autoProcessed: true,
              });
            } else {
              notifyWithdrawalAutoProcessed({
                userName: user.fullName,
                userId: req.session.userId!,
                amount: numericAmount.toString(),
                netAmount: netAmount.toString(),
                paymentMethod: selectedOperator.name,
                mobileNumber,
                payoutUuid: payoutResult.uuid,
                status: "processing",
              });

              return res.json({
                message: "Votre retrait est en cours de traitement. Vous recevrez l'argent dans quelques instants.",
                request: { ...withdrawalRequest, status: "processing" },
                autoProcessed: true,
                payoutUuid: payoutResult.uuid,
              });
            }
          } else {
            const winiError = payoutResult.errors?.msg || payoutResult.errors?.key || JSON.stringify(payoutResult.errors) || "Erreur inconnue";
            console.error("❌ WiniPayer payout failed:", payoutResult.errors);
            console.error("❌ WiniPayer payout error detail:", winiError);
            console.error("❌ WiniPayer payout operator used:", payoutOperator);
            await storage.setUserBalance(req.session.userId!, balance.toString());
            await storage.updateWithdrawalRequest(withdrawalRequest.id, {
              status: "failed",
              rejectionReason: winiError,
            });

            notifyWithdrawalAutoProcessed({
              userName: user.fullName,
              userId: req.session.userId!,
              amount: numericAmount.toString(),
              netAmount: netAmount.toString(),
              paymentMethod: selectedOperator.name,
              mobileNumber,
              payoutUuid: "N/A",
              status: "failed",
              errorDetail: winiError,
              payoutOperator,
            });

            const errorMsg = winiError.toLowerCase();
            if (errorMsg.includes("operator") || errorMsg.includes("invalid") || errorMsg.includes("unauthorized") || errorMsg.includes("auth") || errorMsg.includes("ip")) {
              fetch("https://api.ipify.org")
                .then(r => r.text())
                .then(ip => notifyIpChanged(ip.trim()))
                .catch(err => console.error("❌ IP check error:", err));
            }

            return res.status(500).json({
              message: `Le retrait automatique a échoué (${winiError}). Votre solde a été restauré.`,
            });
          }
        } catch (payoutError) {
          console.error("❌ WiniPayer payout exception:", payoutError);
          await storage.setUserBalance(req.session.userId!, balance.toString());
          await storage.updateWithdrawalRequest(withdrawalRequest.id, {
            status: "failed",
            rejectionReason: "Erreur technique lors du transfert automatique",
          });

          return res.status(500).json({
            message: "Erreur technique lors du retrait. Votre solde a été restauré.",
          });
        }
      }

      if (selectedOperator.paymentGateway === "maishapay") {
        const { maishapay: mpClient, getMaishapayProvider, formatPhoneForMaishapay } = await import("./maishapay");
        const mpProvider = getMaishapayProvider(selectedOperator.name, selectedCountry.code);

        if (!mpProvider) {
          await storage.setUserBalance(req.session.userId!, balance.toString());
          return res.status(400).json({ message: "Opérateur non supporté pour le retrait automatique MaishaPay" });
        }

        const currency = selectedCountry.currency || "XOF";
        const withdrawalRequest = await storage.createWithdrawalRequest({
          userId: req.session.userId!,
          amount: numericAmount.toString(),
          fee: fee.toString(),
          netAmount: netAmount.toString(),
          paymentMethod: selectedOperator.name,
          mobileNumber,
          country,
          walletName: walletName || null,
        });

        await storage.updateWithdrawalRequest(withdrawalRequest.id, { status: "processing" });

        const cleanPhone = formatPhoneForMaishapay(mobileNumber, selectedCountry.code);

        console.log("💸 MaishaPay B2C auto-withdrawal: provider=", mpProvider, "amount=", netAmount, "phone=", cleanPhone, "currency=", currency);

        try {
          const b2cRef = `WD-${withdrawalRequest.id}-${Date.now()}`;
          const b2cResult = await mpClient.b2cTransfer({
            transactionReference: b2cRef,
            amount: netAmount,
            currency,
            customerFullName: walletName || user.fullName || "Client",
            customerEmail: user.email,
            motif: `Retrait SendavaPay #${withdrawalRequest.id}`,
            provider: mpProvider,
            walletID: cleanPhone,
            callbackUrl: "https://sendavapay.com/api/webhook/maishapay-payout",
          });

          await storage.updateWithdrawalRequest(withdrawalRequest.id, {
            externalReference: b2cRef,
            transactionReference: b2cResult.transactionId?.toString() || null,
          });

          if (b2cResult.status_code === 200 && b2cResult.transactionStatus?.trim().toUpperCase() === "SUCCESS") {
            await storage.updateWithdrawalRequest(withdrawalRequest.id, {
              status: "approved",
              processedAt: new Date(),
            });

            await storage.createTransaction({
              userId: req.session.userId!,
              type: "withdrawal",
              amount: numericAmount.toString(),
              fee: fee.toString(),
              netAmount: netAmount.toString(),
              status: "completed",
              description: `Retrait automatique ${selectedOperator.name} - ${mobileNumber}`,
              mobileNumber,
              paymentMethod: selectedOperator.name,
            });

            if (user?.email) {
              sendWithdrawalEmail(user.email, {
                userName: user.fullName,
                amount: netAmount,
                currency,
                transactionId: withdrawalRequest.id.toString(),
                phone: mobileNumber,
                operator: selectedOperator.name,
              }).catch(err => console.error("Failed to send withdrawal email:", err));
            }

            notifyWithdrawalAutoProcessed({
              userName: user.fullName,
              userId: req.session.userId!,
              amount: numericAmount.toString(),
              netAmount: netAmount.toString(),
              paymentMethod: selectedOperator.name,
              mobileNumber,
              payoutUuid: b2cRef,
              status: "success",
            });

            return res.json({
              message: "Retrait effectué avec succès! L'argent a été envoyé sur votre compte mobile.",
              request: { ...withdrawalRequest, status: "approved" },
              autoProcessed: true,
            });
          } else {
            const mpError = b2cResult.message || b2cResult.error || "Erreur MaishaPay inconnue";
            console.error("❌ MaishaPay B2C failed:", b2cResult);
            await storage.setUserBalance(req.session.userId!, balance.toString());
            await storage.updateWithdrawalRequest(withdrawalRequest.id, {
              status: "failed",
              rejectionReason: mpError,
            });

            notifyWithdrawalAutoProcessed({
              userName: user.fullName,
              userId: req.session.userId!,
              amount: numericAmount.toString(),
              netAmount: netAmount.toString(),
              paymentMethod: selectedOperator.name,
              mobileNumber,
              payoutUuid: "N/A",
              status: "failed",
              errorDetail: mpError,
              payoutOperator: mpProvider,
            });

            return res.status(500).json({
              message: `Le retrait automatique a échoué (${mpError}). Votre solde a été restauré.`,
            });
          }
        } catch (mpError) {
          console.error("❌ MaishaPay B2C exception:", mpError);
          await storage.setUserBalance(req.session.userId!, balance.toString());
          await storage.updateWithdrawalRequest(withdrawalRequest.id, {
            status: "failed",
            rejectionReason: "Erreur technique lors du transfert automatique MaishaPay",
          });

          return res.status(500).json({
            message: "Erreur technique lors du retrait. Votre solde a été restauré.",
          });
        }
      }

      if (selectedOperator.paymentGateway === "omnipay") {
        const { omnipay: opClient, getOmnipayOperator, formatPhoneForOmnipay } = await import("./omnipay");
        const opOperator = getOmnipayOperator(selectedOperator.name);

        if (opOperator === undefined) {
          await storage.setUserBalance(req.session.userId!, balance.toString());
          return res.status(400).json({ message: "Opérateur non supporté pour le retrait automatique OmniPay" });
        }

        const currency = selectedCountry.currency || "XOF";
        const withdrawalRequest = await storage.createWithdrawalRequest({
          userId: req.session.userId!,
          amount: numericAmount.toString(),
          fee: fee.toString(),
          netAmount: netAmount.toString(),
          paymentMethod: selectedOperator.name,
          mobileNumber,
          country,
          walletName: walletName || null,
        });

        await storage.updateWithdrawalRequest(withdrawalRequest.id, { status: "processing" });

        const cleanPhone = formatPhoneForOmnipay(mobileNumber, selectedCountry.code);
        const nameParts = (walletName || user.fullName || "Client").split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || nameParts[0];

        console.log("💸 OmniPay transfer: operator=", opOperator, "amount=", netAmount, "phone=", cleanPhone, "currency=", currency);

        try {
          const opRef = `WD-${withdrawalRequest.id}-${Date.now()}`;
          const opResult = await opClient.transfer({
            msisdn: cleanPhone,
            amount: netAmount,
            reference: opRef,
            firstName,
            lastName,
            operator: opOperator ?? undefined,
          });

          await storage.updateWithdrawalRequest(withdrawalRequest.id, {
            externalReference: opRef,
            transactionReference: opResult.id?.toString() || null,
          });

          if (String(opResult.success) === "1") {
            await storage.updateWithdrawalRequest(withdrawalRequest.id, {
              status: "approved",
              processedAt: new Date(),
            });

            await storage.createTransaction({
              userId: req.session.userId!,
              type: "withdrawal",
              amount: numericAmount.toString(),
              fee: fee.toString(),
              netAmount: netAmount.toString(),
              status: "completed",
              description: `Retrait automatique ${selectedOperator.name} - ${mobileNumber}`,
              mobileNumber,
              paymentMethod: selectedOperator.name,
            });

            if (user?.email) {
              sendWithdrawalEmail(user.email, {
                userName: user.fullName,
                amount: netAmount,
                currency,
                transactionId: withdrawalRequest.id.toString(),
                phone: mobileNumber,
                operator: selectedOperator.name,
              }).catch(err => console.error("Failed to send withdrawal email:", err));
            }

            notifyWithdrawalAutoProcessed({
              userName: user.fullName,
              userId: req.session.userId!,
              amount: numericAmount.toString(),
              netAmount: netAmount.toString(),
              paymentMethod: selectedOperator.name,
              mobileNumber,
              payoutUuid: opRef,
              status: "success",
            });

            return res.json({
              message: "Retrait effectué avec succès! L'argent a été envoyé sur votre compte mobile.",
              request: { ...withdrawalRequest, status: "approved" },
              autoProcessed: true,
            });
          } else {
            const opError = opResult.message || "Erreur OmniPay inconnue";
            console.error("❌ OmniPay transfer failed:", opResult);
            await storage.setUserBalance(req.session.userId!, balance.toString());
            await storage.updateWithdrawalRequest(withdrawalRequest.id, {
              status: "failed",
              rejectionReason: opError,
            });

            notifyWithdrawalAutoProcessed({
              userName: user.fullName,
              userId: req.session.userId!,
              amount: numericAmount.toString(),
              netAmount: netAmount.toString(),
              paymentMethod: selectedOperator.name,
              mobileNumber,
              payoutUuid: "N/A",
              status: "failed",
              errorDetail: opError,
              payoutOperator: opOperator ?? selectedOperator.name,
            });

            return res.status(500).json({
              message: `Le retrait automatique a échoué (${opError}). Votre solde a été restauré.`,
            });
          }
        } catch (opErr) {
          console.error("❌ OmniPay transfer exception:", opErr);
          await storage.setUserBalance(req.session.userId!, balance.toString());
          await storage.updateWithdrawalRequest(withdrawalRequest.id, {
            status: "failed",
            rejectionReason: "Erreur technique lors du transfert automatique OmniPay",
          });

          return res.status(500).json({
            message: "Erreur technique lors du retrait. Votre solde a été restauré.",
          });
        }
      }

      const withdrawalRequest = await storage.createWithdrawalRequest({
        userId: req.session.userId!,
        amount: numericAmount.toString(),
        fee: fee.toString(),
        netAmount: netAmount.toString(),
        paymentMethod: selectedOperator.name,
        mobileNumber,
        country,
        walletName: walletName || null,
      });

      notifyWithdrawalRequest({
        userName: user.fullName,
        userId: req.session.userId!,
        amount: numericAmount.toString(),
        fee: fee.toString(),
        netAmount: netAmount.toString(),
        paymentMethod: selectedOperator.name,
        mobileNumber,
        country,
        walletName: walletName || null,
      });

      res.json({ 
        message: "Votre demande de retrait a été soumise et sera traitée instantanément.",
        request: withdrawalRequest
      });
    } catch (error) {
      console.error("Withdraw request error:", error);
      res.status(500).json({ message: "Erreur lors de la demande de retrait" });
    }
  });

  app.get("/api/withdrawal-requests", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getWithdrawalRequests(req.session.userId!);
      res.json(requests);
    } catch (error) {
      console.error("Get withdrawal requests error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Vérifier le statut d'un retrait en cours
  app.get("/api/verify-withdrawal/:id", requireAuth, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const withdrawalRequest = await storage.getWithdrawalRequest(requestId);
      
      if (!withdrawalRequest) {
        return res.status(404).json({ message: "Demande introuvable" });
      }

      // Vérifier que l'utilisateur est le propriétaire
      if (withdrawalRequest.userId !== req.session.userId) {
        return res.status(403).json({ message: "Accès non autorisé" });
      }

      // Si déjà traité, retourner le statut actuel
      if (withdrawalRequest.status === "approved" || withdrawalRequest.status === "rejected" || withdrawalRequest.status === "failed") {
        return res.json({
          status: withdrawalRequest.status,
          message: withdrawalRequest.status === "approved" ? "Retrait effectué avec succès" : 
                   withdrawalRequest.status === "failed" ? (withdrawalRequest.rejectionReason || "Le retrait a échoué") :
                   (withdrawalRequest.rejectionReason || "Retrait rejeté"),
          request: withdrawalRequest,
        });
      }

      if (withdrawalRequest.status === "processing" && withdrawalRequest.externalReference) {
        console.log("🔍 Vérification du statut de retrait:", withdrawalRequest.externalReference);

        const isWiniPayerPayout = withdrawalRequest.transactionReference?.startsWith("payout_") || false;
        
        if (isWiniPayerPayout) {
          const { verifyPayout } = await import("./winipayer");
          const payoutResult = await verifyPayout(withdrawalRequest.externalReference);

          if (payoutResult.state) {
            const payoutState = payoutResult.state.toLowerCase();

            if (payoutState === "success") {
              await storage.updateWithdrawalRequest(requestId, {
                status: "approved",
                processedAt: new Date(),
              });

              await storage.createTransaction({
                userId: withdrawalRequest.userId,
                type: "withdrawal",
                amount: withdrawalRequest.amount,
                fee: withdrawalRequest.fee,
                netAmount: withdrawalRequest.netAmount,
                status: "completed",
                description: `Retrait automatique ${withdrawalRequest.paymentMethod} - ${withdrawalRequest.mobileNumber}`,
                externalRef: withdrawalRequest.externalReference,
              });

              const user = await storage.getUser(withdrawalRequest.userId);
              if (user?.email) {
                sendWithdrawalEmail(user.email, {
                  userName: user.fullName,
                  amount: parseFloat(withdrawalRequest.netAmount),
                  currency: "XOF",
                  transactionId: withdrawalRequest.id.toString(),
                  phone: withdrawalRequest.mobileNumber,
                  operator: withdrawalRequest.paymentMethod || "Mobile Money",
                }).catch(err => console.error("Failed to send withdrawal email:", err));
              }

              return res.json({
                status: "approved",
                message: "Retrait effectué avec succès!",
                request: { ...withdrawalRequest, status: "approved" },
              });
            } else if (payoutState === "failed" || payoutState === "cancelled") {
              await storage.setUserBalance(
                withdrawalRequest.userId,
                (parseFloat((await storage.getUser(withdrawalRequest.userId))?.balance || "0") + parseFloat(withdrawalRequest.amount)).toString()
              );

              await storage.updateWithdrawalRequest(requestId, {
                status: "failed",
                rejectionReason: "Le transfert automatique a échoué",
              });

              return res.json({
                status: "failed",
                message: "Le retrait a échoué. Votre solde a été restauré.",
                request: { ...withdrawalRequest, status: "failed" },
              });
            }

            return res.json({
              status: "processing",
              message: "Retrait en cours de traitement...",
              request: withdrawalRequest,
            });
          }
        } else {
          const transactionDetails = await soleaspay.getTransactionDetails(withdrawalRequest.externalReference);
          
          if (transactionDetails) {
            console.log("📊 Statut SoleasPay:", transactionDetails.status);
            
            if (transactionDetails.status === "SUCCESS") {
              const user = await storage.getUser(withdrawalRequest.userId);
              if (user) {
                const balance = parseFloat(user.balance);
                const amount = parseFloat(withdrawalRequest.amount);
                const newBalance = balance - amount;
                await storage.setUserBalance(withdrawalRequest.userId, newBalance.toString());
              }
              
              await storage.updateWithdrawalRequest(requestId, {
                status: "approved",
                processedAt: new Date(),
              });

              await storage.createTransaction({
                userId: withdrawalRequest.userId,
                type: "withdrawal",
                amount: withdrawalRequest.amount,
                fee: withdrawalRequest.fee,
                netAmount: withdrawalRequest.netAmount,
                status: "completed",
                description: `Retrait ${withdrawalRequest.paymentMethod} - ${withdrawalRequest.mobileNumber}`,
                externalRef: withdrawalRequest.externalReference,
              });

              return res.json({
                status: "approved",
                message: "Retrait effectué avec succès!",
                request: { ...withdrawalRequest, status: "approved" },
              });
            } else if (transactionDetails.status === "FAILED" || transactionDetails.status === "REJECTED") {
              await storage.updateWithdrawalRequest(requestId, {
                status: "failed",
                rejectionReason: "Le retrait a échoué auprès du service de paiement",
              });

              return res.json({
                status: "failed",
                message: "Le retrait a échoué. Votre solde n'a pas été débité.",
                request: { ...withdrawalRequest, status: "failed" },
              });
            }
            
            return res.json({
              status: "processing",
              message: "Retrait en cours de traitement...",
              request: withdrawalRequest,
            });
          }
        }
      }

      // Statut pending ou pas de référence
      res.json({
        status: withdrawalRequest.status,
        message: "En attente de traitement...",
        request: withdrawalRequest,
      });
    } catch (error) {
      console.error("Verify withdrawal error:", error);
      res.status(500).json({ message: "Erreur lors de la vérification" });
    }
  });

  app.get("/api/admin/withdrawal-requests", requireAuth, requireAdmin, async (req, res) => {
    try {
      const requests = await storage.getAllWithdrawalRequests();
      res.json(requests);
    } catch (error) {
      console.error("Get all withdrawal requests error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/admin/withdrawal-requests/pending", requireAuth, requireAdmin, async (req, res) => {
    try {
      const requests = await storage.getPendingWithdrawalRequests();
      res.json(requests);
    } catch (error) {
      console.error("Get pending withdrawal requests error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Admin approve: Balance was already debited when user requested withdrawal
  app.post("/api/admin/withdrawal-requests/:id/approve", requireAuth, requireAdmin, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const withdrawalRequest = await storage.getWithdrawalRequest(requestId);
      
      if (!withdrawalRequest) {
        return res.status(404).json({ message: "Demande introuvable" });
      }
      
      // Seuls les retraits "pending" peuvent être approuvés
      if (withdrawalRequest.status !== "pending") {
        return res.status(400).json({ message: "Cette demande a déjà été traitée" });
      }
      
      // Le solde a déjà été débité lors de la demande de retrait
      // Créer la transaction pour l'historique
      await storage.createTransaction({
        userId: withdrawalRequest.userId,
        type: "withdrawal",
        amount: withdrawalRequest.amount,
        fee: withdrawalRequest.fee,
        netAmount: withdrawalRequest.netAmount,
        status: "completed",
        description: `Retrait vers ${withdrawalRequest.paymentMethod} - ${withdrawalRequest.mobileNumber}`,
        mobileNumber: withdrawalRequest.mobileNumber,
        paymentMethod: withdrawalRequest.paymentMethod,
      });
      
      await storage.updateWithdrawalRequest(requestId, {
        status: "approved",
        reviewedBy: req.session.userId,
        reviewedAt: new Date(),
        processedAt: new Date(),
      });
      
      // Send withdrawal confirmation email
      const user = await storage.getUser(withdrawalRequest.userId);
      if (user?.email) {
        sendWithdrawalEmail(user.email, {
          userName: user.fullName,
          amount: parseFloat(withdrawalRequest.netAmount),
          currency: "XOF",
          transactionId: requestId.toString(),
          phone: withdrawalRequest.mobileNumber,
          operator: withdrawalRequest.paymentMethod || "Mobile Money"
        }).catch(err => console.error("Failed to send withdrawal email:", err));
      }

      notifyWithdrawalApproved({
        userName: user?.fullName || "Inconnu",
        userId: withdrawalRequest.userId,
        amount: withdrawalRequest.amount,
        netAmount: withdrawalRequest.netAmount,
        paymentMethod: withdrawalRequest.paymentMethod || "Mobile Money",
        mobileNumber: withdrawalRequest.mobileNumber,
      });
      
      console.log("✅ Withdrawal approved for user", withdrawalRequest.userId, "Amount:", withdrawalRequest.amount);
      res.json({ message: "Retrait approuvé et traité avec succès" });
    } catch (error) {
      console.error("Approve withdrawal error:", error);
      res.status(500).json({ message: "Erreur lors de l'approbation" });
    }
  });

  // Admin reject: Refund the balance since it was debited when user requested
  app.post("/api/admin/withdrawal-requests/:id/reject", requireAuth, requireAdmin, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { reason } = req.body;
      
      const withdrawalRequest = await storage.getWithdrawalRequest(requestId);
      
      if (!withdrawalRequest) {
        return res.status(404).json({ message: "Demande introuvable" });
      }
      
      // Seuls les retraits "pending" peuvent être rejetés
      if (withdrawalRequest.status !== "pending") {
        return res.status(400).json({ message: "Cette demande a déjà été traitée" });
      }
      
      if (!reason) {
        return res.status(400).json({ message: "Veuillez fournir une raison de rejet" });
      }
      
      // Rembourser le solde car il a été débité lors de la demande
      const user = await storage.getUser(withdrawalRequest.userId);
      if (user) {
        const currentBalance = parseFloat(user.balance);
        const refundAmount = parseFloat(withdrawalRequest.amount);
        const newBalance = currentBalance + refundAmount;
        await storage.setUserBalance(withdrawalRequest.userId, newBalance.toString());
        console.log("💰 Balance refunded for user", withdrawalRequest.userId, "Amount:", refundAmount, "New balance:", newBalance);
      }
      
      await storage.updateWithdrawalRequest(requestId, {
        status: "rejected",
        rejectionReason: reason,
        reviewedBy: req.session.userId,
        reviewedAt: new Date(),
      });

      notifyWithdrawalRejected({
        userName: user?.fullName || "Inconnu",
        userId: withdrawalRequest.userId,
        amount: withdrawalRequest.amount,
        paymentMethod: withdrawalRequest.paymentMethod || "Mobile Money",
        mobileNumber: withdrawalRequest.mobileNumber,
        reason,
      });
      
      res.json({ message: "Demande de retrait rejetée et solde remboursé" });
    } catch (error) {
      console.error("Reject withdrawal error:", error);
      res.status(500).json({ message: "Erreur lors du rejet" });
    }
  });

  // Transfer feature disabled
  // app.post("/api/transfer", requireAuth, async (req, res) => { ... });

  app.get("/api/payment-links", requireAuth, async (req, res) => {
    try {
      const links = await storage.getPaymentLinks(req.session.userId!);
      res.json(links);
    } catch (error) {
      console.error("Get payment links error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/upload/product-image", requireAuth, productImageUpload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Aucune image fournie" });
      }

      const imageUrl = await uploadProductImage(req.file.path, req.file.mimetype);
      res.json({ imageUrl });
    } catch (error: any) {
      console.error("Upload product image error:", error?.message || error);
      res.status(500).json({ message: error?.message || "Erreur lors de l'upload" });
    }
  });

  app.post("/api/payment-links", requireAuth, async (req, res) => {
    try {
      const { title, description, amount, productImage, allowCustomAmount, minimumAmount, redirectUrl } = req.body;
      const numericAmount = parseFloat(amount);
      const numericMinAmount = minimumAmount ? parseFloat(minimumAmount) : null;

      if (!title || isNaN(numericAmount) || numericAmount < 100) {
        return res.status(400).json({ message: "Données invalides" });
      }

      if (allowCustomAmount && numericMinAmount !== null && numericMinAmount < 100) {
        return res.status(400).json({ message: "Le montant minimum doit être d'au moins 100 XOF" });
      }

      const link = await storage.createPaymentLink({
        userId: req.session.userId!,
        title,
        description,
        amount: numericAmount.toString(),
        productImage: productImage || null,
        allowCustomAmount: allowCustomAmount || false,
        minimumAmount: numericMinAmount ? numericMinAmount.toString() : null,
        redirectUrl: redirectUrl || null,
      });

      res.json(link);
    } catch (error) {
      console.error("Create payment link error:", error);
      res.status(500).json({ message: "Erreur lors de la création" });
    }
  });

  app.put("/api/payment-links/:id", requireAuth, async (req, res) => {
    try {
      const linkId = parseInt(req.params.id);
      const link = await storage.getPaymentLink(linkId);
      
      if (!link) {
        return res.status(404).json({ message: "Lien introuvable" });
      }
      
      if (link.userId !== req.session.userId) {
        return res.status(403).json({ message: "Non autorisé" });
      }
      
      if (link.status !== "active") {
        return res.status(400).json({ message: "Ce lien ne peut plus être modifié" });
      }
      
      const { title, description, amount, productImage, allowCustomAmount, minimumAmount, redirectUrl } = req.body;
      const numericAmount = parseFloat(amount);
      const numericMinAmount = minimumAmount ? parseFloat(minimumAmount) : null;

      if (!title || isNaN(numericAmount) || numericAmount < 100) {
        return res.status(400).json({ message: "Données invalides" });
      }

      const updated = await storage.updatePaymentLink(linkId, {
        title,
        description,
        amount: numericAmount.toString(),
        productImage: productImage || null,
        allowCustomAmount: allowCustomAmount || false,
        minimumAmount: numericMinAmount ? numericMinAmount.toString() : null,
        redirectUrl: redirectUrl || null,
      });

      res.json(updated);
    } catch (error) {
      console.error("Update payment link error:", error);
      res.status(500).json({ message: "Erreur lors de la modification" });
    }
  });

  app.delete("/api/payment-links/:id", requireAuth, async (req, res) => {
    try {
      const linkId = parseInt(req.params.id);
      const link = await storage.getPaymentLink(linkId);
      
      if (!link) {
        return res.status(404).json({ message: "Lien introuvable" });
      }
      
      if (link.userId !== req.session.userId) {
        return res.status(403).json({ message: "Non autorisé" });
      }
      
      await storage.deletePaymentLink(linkId);
      res.json({ message: "Lien supprimé" });
    } catch (error) {
      console.error("Delete payment link error:", error);
      res.status(500).json({ message: "Erreur lors de la suppression" });
    }
  });

  // Get API transaction details for payment page
  app.get("/api/pay-api/:reference", async (req, res) => {
    try {
      const transaction = await storage.getApiTransactionByReference(req.params.reference);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction introuvable" });
      }
      const user = await storage.getUser(transaction.userId);
      let displayName = user?.fullName || "SendavaPay";
      if (transaction.apiKeyId) {
        const apiKey = await storage.getApiKeyById(transaction.apiKeyId);
        if (apiKey?.appName) {
          displayName = apiKey.appName;
        }
      }
      res.json({
        ...transaction,
        ownerName: displayName,
      });
    } catch (error) {
      console.error("Get API transaction error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Process API payment with SoleasPay
  app.post("/api/pay-api/:reference", async (req, res) => {
    try {
      const { payerName, payerPhone, payerEmail, payerCountry, serviceId } = req.body;
      const transaction = await storage.getApiTransactionByReference(req.params.reference);

      if (!transaction) {
        return res.status(404).json({ message: "Transaction introuvable" });
      }

      if (transaction.status !== "pending") {
        return res.status(400).json({ message: "Cette transaction n'est plus valide" });
      }

      const amount = parseFloat(transaction.amount);
      const currency = getCurrencyByCountry(payerCountry) || "XOF";
      const service = getServiceById(parseInt(serviceId));

      if (!service) {
        return res.status(400).json({ message: "Service de paiement invalide" });
      }

      const operators = await storage.getOperators();
      const operator = operators.find(op => op.code === serviceId.toString());
      if (operator?.inMaintenance || operator?.maintenanceApi) {
        return res.status(400).json({ message: "Ce moyen de paiement est actuellement en maintenance pour les paiements API" });
      }
      const paymentGateway = operator?.paymentGateway || service.paymentGateway || "soleaspay";

      const orderId = `API_${transaction.reference}_${Date.now()}`;
      const baseUrl = "https://sendavapay.com";

      // Update transaction with customer info (mark gateway in paymentMethod prefix)
      await storage.updateApiTransaction(transaction.id, {
        customerName: payerName,
        customerPhone: payerPhone,
        customerEmail: payerEmail,
        paymentMethod: paymentGateway === "omnipay" ? `omnipay_${service.operator}` : service.operator,
        status: "processing",
      });

      // ── OmniPay ─────────────────────────────────────────────────────────
      if (paymentGateway === "omnipay") {
        if (!payerPhone) {
          return res.status(400).json({ message: "Numéro de téléphone requis pour OmniPay" });
        }

        console.log(`📤 OmniPay API: paiement référence=${req.params.reference}, montant=${amount} ${service.currency}`);

        const { omnipay: opClient, getOmnipayOperator, formatPhoneForOmnipay } = await import("./omnipay");
        const opOperator = getOmnipayOperator(operator?.name || service.operator);

        if (opOperator === undefined) {
          await storage.updateApiTransaction(transaction.id, { status: "failed" });
          return res.status(400).json({ message: "Opérateur non supporté par OmniPay" });
        }

        const cleanPhone = formatPhoneForOmnipay(payerPhone, service.countryCode);
        const isWave = opOperator === "wave";

        const nameParts = payerName?.split(" ") || ["Client"];
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || nameParts[0];

        const autoOtp = service.operator === "Orange" ? String(Math.floor(100000 + Math.random() * 900000)) : undefined;

        const opResult = await opClient.requestPayment({
          msisdn: cleanPhone,
          amount,
          reference: orderId,
          firstName,
          lastName,
          operator: opOperator ?? undefined,
          otp: autoOtp,
          returnUrl: isWave ? `${baseUrl}/success?reference=${orderId}` : undefined,
          callbackUrl: `${baseUrl}/api/webhook/omnipay`,
        });

        if (String(opResult.success) !== "1") {
          console.error("❌ OmniPay API payment error:", opResult);
          await storage.updateApiTransaction(transaction.id, { status: "failed" });
          return res.status(500).json({ message: opResult.message || "Erreur lors de l'initiation du paiement OmniPay" });
        }

        const payId = opResult.transaction_id || opResult.reference || orderId;

        await storage.updateApiTransaction(transaction.id, {
          externalReference: `${orderId}|${payId}`,
        });

        const waveUrl = opResult.payment_url || opResult.wave_launch_url || opResult.redirect_url;

        return res.json({
          success: true,
          payId,
          orderId,
          provider: "omnipay",
          message: isWave && waveUrl
            ? "Redirection vers Wave pour confirmer le paiement..."
            : "Veuillez confirmer le paiement sur votre téléphone",
          waveUrl: waveUrl || null,
          isWave: isWave && !!waveUrl,
        });
      }

      // ── SoleasPay (défaut) ───────────────────────────────────────────────
      if (!payerPhone) {
        return res.status(400).json({ message: "Numéro de téléphone requis pour SoleasPay" });
      }

      const payResult = await soleaspay.collectPayment({
        wallet: payerPhone,
        amount,
        currency,
        orderId,
        description: transaction.description || `Paiement API ${transaction.reference}`,
        payer: payerName,
        payerEmail: payerEmail || "",
        serviceId: parseInt(serviceId),
        otp: service.operator === "Orange" ? String(Math.floor(100000 + Math.random() * 900000)) : undefined,
      });

      if (!payResult.success || !payResult.data) {
        await storage.updateApiTransaction(transaction.id, { status: "failed" });
        return res.status(400).json({ message: payResult.message || "Erreur de paiement" });
      }

      const payId = payResult.data.reference || payResult.data.external_reference || "";

      if (!payId) {
        await storage.updateApiTransaction(transaction.id, { status: "failed" });
        return res.status(400).json({ message: "Réponse invalide du service de paiement" });
      }

      await storage.updateApiTransaction(transaction.id, {
        externalReference: `${orderId}|${payId}`,
      });

      const waveUrl = payResult.wave_launch_url || payResult.payment_url || payResult.redirect_url ||
                      payResult.data?.wave_launch_url || payResult.data?.payment_url || payResult.data?.redirect_url;
      const isWaveOperator = service.operator === "Wave" || service.id === 32;

      res.json({
        success: true,
        payId,
        orderId,
        message: isWaveOperator && waveUrl
          ? "Redirection vers Wave pour confirmer le paiement..."
          : "Veuillez confirmer le paiement sur votre téléphone",
        waveUrl: waveUrl || null,
        isWave: isWaveOperator,
      });
    } catch (error) {
      console.error("Process API payment error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Verify API payment status
  app.post("/api/pay-api/:reference/verify", async (req, res) => {
    try {
      const { payId, orderId } = req.body;
      const transaction = await storage.getApiTransactionByReference(req.params.reference);

      if (!transaction) {
        return res.status(404).json({ message: "Transaction introuvable" });
      }

      const isOmniPay = transaction.paymentMethod?.startsWith("omnipay_");

      let verifyResult: { success: boolean; status?: string; data?: { amount?: number }; message?: string };

      if (isOmniPay) {
        const { omnipay: opClient } = await import("./omnipay");
        console.log(`🔍 OmniPay API verify: orderId=${orderId}, payId=${payId}`);
        const opVerify = await opClient.verifyPayment(payId || orderId);
        verifyResult = {
          success: String(opVerify.success) === "1",
          status: String(opVerify.success) === "1" ? "SUCCESS" : "PENDING",
          data: { amount: opVerify.amount ? parseFloat(String(opVerify.amount)) : undefined },
          message: opVerify.message,
        };
      } else {
        verifyResult = await soleaspay.verifyPayment(orderId, payId);
        console.log(`🔍 SoleasPay API verify: orderId=${orderId}, payId=${payId}, result=`, JSON.stringify(verifyResult));
      }

      if (verifyResult.success && verifyResult.status === "SUCCESS") {
        if (transaction.status === "completed") {
          const apiKeyConfig = transaction.apiKeyId ? await storage.getApiKeyById(transaction.apiKeyId) : null;
          const redirectUrlToUse = transaction.redirectUrl || apiKeyConfig?.redirectUrl || null;
          return res.json({ status: "completed", message: "Paiement déjà traité", redirectUrl: redirectUrlToUse, reference: transaction.reference, amount: parseFloat(transaction.amount) });
        }

        const amount = verifyResult.data?.amount || parseFloat(transaction.amount);
        const commissionSettings = await storage.getCommissionSettings();
        const feeRate = getCommissionRate(commissionSettings, "payment_received");
        const fee = (amount * feeRate) / 100;
        const netAmount = amount - fee;

        const claimed = await storage.claimApiTransaction(transaction.id, {
          externalReference: payId,
          fee: fee.toString(),
        });
        if (!claimed) {
          const apiKeyConfig = transaction.apiKeyId ? await storage.getApiKeyById(transaction.apiKeyId) : null;
          const redirectUrlToUse = transaction.redirectUrl || apiKeyConfig?.redirectUrl || null;
          return res.json({ status: "completed", message: "Paiement déjà traité", redirectUrl: redirectUrlToUse, reference: transaction.reference, amount: netAmount });
        }

        try {
          await storage.updateUserBalance(transaction.userId, netAmount.toString());

          await storage.createTransaction({
            userId: transaction.userId,
            type: "payment_received",
            amount: amount.toString(),
            fee: fee.toString(),
            netAmount: netAmount.toString(),
            status: "completed",
            description: transaction.description || `Paiement API reçu`,
            externalRef: transaction.reference,
            payerName: transaction.customerName,
            payerEmail: transaction.customerEmail,
            payerCountry: req.body.payerCountry,
            paymentMethod: transaction.paymentMethod,
            mobileNumber: transaction.customerPhone,
          });
        } catch (creditError) {
          console.error(`❌ CRITICAL: Claimed API transaction ${transaction.id} but failed to credit:`, creditError);
          await storage.updateApiTransaction(transaction.id, { status: "pending" });
          return res.status(500).json({ status: "error", message: "Erreur lors du crédit, veuillez réessayer" });
        }

        console.log(`✅ SoleasPay API: Paiement confirmé pour utilisateur #${transaction.userId}: ${netAmount}`);

        // Envoyer email de paiement reçu au marchand API
        const apiMerchant = await storage.getUser(transaction.userId);
        if (apiMerchant?.email) {
          sendPaymentReceivedEmail(apiMerchant.email, {
            merchantName: apiMerchant.fullName,
            amount: netAmount,
            currency: transaction.currency || "XOF",
            transactionId: transaction.reference,
            payerPhone: transaction.customerPhone || "",
            paymentLinkTitle: transaction.description || "Paiement API"
          }).catch(err => console.error("Failed to send API payment received email:", err));
        }

        notifyPaymentReceived({
          merchantName: apiMerchant?.fullName || "Inconnu",
          merchantId: transaction.userId,
          amount,
          fee,
          netAmount,
          currency: transaction.currency || "XOF",
          payerPhone: transaction.customerPhone || undefined,
          payerName: transaction.customerName || undefined,
          paymentLinkTitle: transaction.description || "Paiement API",
          reference: transaction.reference,
          source: "api",
        });

        // Get API key configuration using the apiKeyId stored in the transaction
        let apiKeyConfig = null;
        if (transaction.apiKeyId) {
          apiKeyConfig = await storage.getApiKeyById(transaction.apiKeyId);
        }
        
        // Use transaction-level URLs first, then fall back to API key URLs
        const webhookUrlToUse = transaction.callbackUrl || apiKeyConfig?.webhookUrl;
        const redirectUrlToUse = transaction.redirectUrl || apiKeyConfig?.redirectUrl || null;

        // Send webhook callback to merchant if webhook URL is configured
        if (webhookUrlToUse) {
          try {
            // Validate URL for security (prevent SSRF)
            const callbackUrl = new URL(webhookUrlToUse);
            const isValidProtocol = callbackUrl.protocol === 'https:' || 
                              (process.env.NODE_ENV === 'development' && callbackUrl.protocol === 'http:');
            
            // Block private/localhost IPs to prevent SSRF
            const hostname = callbackUrl.hostname.toLowerCase();
            const blockedPatterns = [
              /^localhost$/i,
              /^127\./,
              /^10\./,
              /^172\.(1[6-9]|2[0-9]|3[01])\./,
              /^192\.168\./,
              /^0\.0\.0\.0$/,
              /^::1$/,
              /^\[::1\]$/,
              /^169\.254\./,
              /\.local$/,
              /\.internal$/,
            ];
            const isBlockedHost = blockedPatterns.some(pattern => pattern.test(hostname));
            
            if (!isValidProtocol) {
              console.warn(`⚠️ Skipping webhook: Invalid URL protocol for ${webhookUrlToUse}`);
            } else if (isBlockedHost) {
              console.warn(`⚠️ Skipping webhook: Blocked host ${hostname} (private/internal IP)`);
            } else {
              const webhookPayload = {
                event: "payment.completed",
                reference: transaction.reference,
                externalReference: transaction.externalReference,
                amount: amount,
                fee: fee,
                netAmount: netAmount,
                currency: transaction.currency,
                status: "completed",
                customerName: transaction.customerName,
                customerEmail: transaction.customerEmail,
                customerPhone: transaction.customerPhone,
                paymentMethod: transaction.paymentMethod,
                completedAt: new Date().toISOString(),
              };

              console.log(`📡 Sending webhook callback to: ${webhookUrlToUse}`);
              
              const payloadString = JSON.stringify(webhookPayload);
              const timestamp = Math.floor(Date.now() / 1000).toString();
              
              // Create HMAC signature only if webhook secret exists
              const headers: Record<string, string> = {
                "Content-Type": "application/json",
                "X-SendavaPay-Event": "payment.completed",
                "X-SendavaPay-Timestamp": timestamp,
              };
              
              if (apiKeyConfig?.webhookSecret) {
                const crypto = await import("crypto");
                const signaturePayload = `${timestamp}.${payloadString}`;
                const signature = crypto.createHmac("sha256", apiKeyConfig.webhookSecret)
                  .update(signaturePayload)
                  .digest("hex");
                headers["X-SendavaPay-Signature"] = `t=${timestamp},v1=${signature}`;
              }
              
              fetch(webhookUrlToUse, {
                method: "POST",
                headers,
                body: payloadString,
              }).then(response => {
                console.log(`📡 Webhook callback response: ${response.status}`);
                storage.updateApiTransaction(transaction.id, {
                  webhookSent: true,
                  webhookAttempts: (transaction.webhookAttempts || 0) + 1,
                  webhookLastAttempt: new Date(),
                });
              }).catch(error => {
                console.error(`❌ Webhook callback failed:`, error);
                storage.updateApiTransaction(transaction.id, {
                  webhookAttempts: (transaction.webhookAttempts || 0) + 1,
                  webhookLastAttempt: new Date(),
                });
              });
            }
          } catch (webhookError) {
            console.error(`❌ Webhook callback error:`, webhookError);
          }
        }

        return res.json({ 
          status: "completed", 
          message: "Paiement réussi!",
          redirectUrl: redirectUrlToUse,
          reference: transaction.reference,
          amount: netAmount,
        });
      } else if (verifyResult.status === "FAILURE") {
        await storage.updateApiTransaction(transaction.id, { status: "failed" });
        
        // Get redirect URL from the specific API key used for this transaction
        let failedApiKeyConfig = null;
        if (transaction.apiKeyId) {
          failedApiKeyConfig = await storage.getApiKeyById(transaction.apiKeyId);
        }
        
        return res.json({ 
          status: "failed", 
          message: "Le paiement a échoué",
          redirectUrl: transaction.redirectUrl || failedApiKeyConfig?.redirectUrl || null,
        });
      }

      res.json({ status: "pending", message: verifyResult.message || "En attente de confirmation" });
    } catch (error) {
      console.error("Verify API payment error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/pay/:code", async (req, res) => {
    try {
      const link = await storage.getPaymentLinkByCode(req.params.code);
      if (!link) {
        return res.status(404).json({ message: "Lien introuvable" });
      }
      const owner = await storage.getUser(link.userId);
      const merchantDisplayName = owner?.merchantName || owner?.fullName || "SendavaPay";
      res.json({ ...link, merchantName: merchantDisplayName });
    } catch (error) {
      console.error("Get payment link error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/pay/:code", async (req, res) => {
    try {
      const { payerName, payerPhone, payerEmail, payerCountry, paymentMethod, paidAmount } = req.body;
      const link = await storage.getPaymentLinkByCode(req.params.code);

      if (!link) {
        return res.status(404).json({ message: "Lien introuvable" });
      }

      if (link.status !== "active") {
        return res.status(400).json({ message: "Ce lien n'est plus valide" });
      }

      let amount = parseFloat(link.amount);
      
      if (link.allowCustomAmount && paidAmount) {
        amount = parseFloat(paidAmount);
        const minAmount = parseFloat(link.minimumAmount || "100");
        if (amount < minAmount) {
          return res.status(400).json({ message: `Le montant minimum est de ${minAmount} XOF` });
        }
      }
      
      // Get link owner details
      const linkOwner = await storage.getUser(link.userId);
      if (!linkOwner) {
        return res.status(404).json({ message: "Propriétaire du lien introuvable" });
      }

      const currency = payerCountry === "CD" ? "CDF" : (payerCountry === "CM" || payerCountry === "CG") ? "XAF" : "XOF";
      // Toujours utiliser l'URL de production pour les redirections LeekPay
      const baseUrl = "https://sendavapay.com";

      // Create LeekPay checkout - l'URL de retour inclut le vendeur_id
      const checkoutResult = await leekpay.createCheckout({
        amount,
        currency: currency as "XOF" | "XAF" | "CDF" | "EUR" | "USD",
        description: `Paiement: ${link.title}`,
        return_url: `${baseUrl}/payment-success?vendeur_id=${link.userId}`,
        customer_email: payerEmail,
      });

      if (!checkoutResult.success || !checkoutResult.data) {
        console.error("LeekPay checkout error:", checkoutResult.error);
        return res.status(500).json({ message: checkoutResult.error || "Erreur lors de la création du paiement" });
      }

      const leekpayId = checkoutResult.data.id;
      const returnUrl = `${baseUrl}/payment-success?vendeur_id=${link.userId}&reference=${leekpayId}`;

      // Store LeekPay payment record
      await storage.createLeekpayPayment({
        leekpayPaymentId: leekpayId,
        paymentLinkId: link.id,
        amount: amount.toString(),
        currency,
        type: "payment_link",
        status: "pending",
        description: `Paiement: ${link.title}`,
        customerEmail: payerEmail,
        payerName,
        payerPhone,
        payerCountry,
        paymentMethod,
        returnUrl,
        paymentUrl: checkoutResult.data.payment_url,
      });

      console.log(`📤 Paiement lien initié: vendeur=${link.userId}, montant=${amount} ${currency}, ref=${leekpayId}`);

      res.json({ 
        paymentUrl: checkoutResult.data.payment_url,
        paymentId: leekpayId,
      });
    } catch (error) {
      console.error("Process payment error:", error);
      res.status(500).json({ message: "Erreur lors du paiement" });
    }
  });

  // Vérifier et créditer un paiement par lien (public - pour les payeurs non authentifiés)
  app.post("/api/verify-link-payment", async (req, res) => {
    try {
      const { paymentId } = req.body;
      
      if (!paymentId) {
        return res.status(400).json({ message: "paymentId requis" });
      }

      console.log("Verifying link payment with LeekPay for:", paymentId);

      const leekpayPayment = await storage.getLeekpayPaymentById(paymentId);
      
      if (!leekpayPayment) {
        return res.status(404).json({ message: "Paiement non trouvé" });
      }

      if (leekpayPayment.status === "completed") {
        return res.json({ status: "completed", message: "Paiement effectué avec succès!" });
      }

      // IMPORTANT: Vérifier le statut auprès de LeekPay pour éviter les fraudes
      console.log("Checking link payment status with LeekPay API...");
      const statusResult = await leekpay.getPaymentStatus(paymentId);
      console.log("LeekPay API response:", JSON.stringify(statusResult));
      
      if (!statusResult.success) {
        console.log("LeekPay API error, payment not verified");
        return res.json({ status: "pending", message: "Paiement en cours de vérification. Veuillez patienter." });
      }

      const leekpayStatus = statusResult.data?.status;
      console.log("LeekPay payment status:", leekpayStatus);
      
      // Ne créditer que si LeekPay confirme que le paiement est complété
      if (leekpayStatus !== "completed") {
        if (leekpayStatus && leekpayStatus !== leekpayPayment.status) {
          await storage.updateLeekpayPayment(paymentId, { status: leekpayStatus as any });
        }
        return res.json({ 
          status: leekpayStatus || "pending", 
          message: leekpayStatus === "failed" ? "Le paiement a échoué." : "Paiement en cours de traitement. Veuillez patienter." 
        });
      }

      // LeekPay confirme que le paiement est complété - on peut créditer
      console.log("LeekPay confirmed link payment completed, crediting user...");
      
      const settings = await storage.getCommissionSettings();
      const commissionRate = getCommissionRate(settings, "payment_received");
      const amount = parseFloat(leekpayPayment.amount);
      const fee = Math.round(amount * (commissionRate / 100));
      const netAmount = amount - fee;

      await storage.updateLeekpayPayment(paymentId, {
        status: "completed",
        webhookReceived: true,
        completedAt: new Date(),
      });

      if (leekpayPayment.paymentLinkId) {
        const link = await storage.getPaymentLink(leekpayPayment.paymentLinkId);
        if (link) {
          await storage.updatePaymentLink(link.id, {
            paidAt: new Date(),
            payerName: leekpayPayment.payerName,
            payerEmail: leekpayPayment.customerEmail || null,
            payerPhone: leekpayPayment.payerPhone,
            payerCountry: leekpayPayment.payerCountry,
            paidAmount: amount.toString(),
          });

          await storage.createTransaction({
            userId: link.userId,
            type: "payment_received",
            amount: amount.toString(),
            fee: fee.toString(),
            netAmount: netAmount.toString(),
            status: "completed",
            description: `Paiement reçu: ${link.title}`,
            externalRef: paymentId,
            paymentMethod: leekpayPayment.paymentMethod || "leekpay",
            mobileNumber: leekpayPayment.payerPhone,
            payerName: leekpayPayment.payerName,
            payerEmail: leekpayPayment.customerEmail,
            payerCountry: leekpayPayment.payerCountry,
            paymentLinkId: link.id,
          });

          await storage.updateUserBalance(link.userId, netAmount.toString());
          
          console.log(`Link payment verified and credited: user ${link.userId}, amount: ${netAmount}`);
          return res.json({ status: "completed", message: "Paiement effectué avec succès!" });
        }
      }

      res.json({ status: "completed", message: "Paiement effectué avec succès!" });
    } catch (error) {
      console.error("Verify link payment error:", error);
      res.status(500).json({ message: "Erreur lors de la vérification" });
    }
  });

  app.get("/api/api-keys", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.isVerified) {
        return res.status(403).json({ message: "Compte non vérifié" });
      }
      const keys = await storage.getApiKeys(req.session.userId!);
      res.json(keys);
    } catch (error) {
      console.error("Get API keys error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/api-keys", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.isVerified) {
        return res.status(403).json({ message: "Compte non vérifié" });
      }

      const { name, appName, webhookUrl, redirectUrl } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Nom requis" });
      }

      const crypto = await import("crypto");
      const webhookSecret = webhookUrl ? `whsec_${crypto.randomBytes(24).toString("hex")}` : undefined;

      const key = await storage.createApiKey({
        userId: req.session.userId!,
        name,
        appName: appName || null,
        redirectUrl: redirectUrl || null,
        webhookUrl: webhookUrl || null,
        webhookSecret: webhookSecret || null,
      });

      res.json(key);
    } catch (error) {
      console.error("Create API key error:", error);
      res.status(500).json({ message: "Erreur lors de la création" });
    }
  });

  app.delete("/api/api-keys/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteApiKey(parseInt(req.params.id));
      res.json({ message: "Clé supprimée" });
    } catch (error) {
      console.error("Delete API key error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/kyc", requireAuth, async (req, res) => {
    try {
      const kyc = await storage.getKycRequest(req.session.userId!);
      res.json(kyc || null);
    } catch (error) {
      console.error("Get KYC error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/kyc", requireAuth, upload.fields([
    { name: "documentFront", maxCount: 1 },
    { name: "documentBack", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files.documentFront || !files.documentBack || !files.selfie) {
        return res.status(400).json({ message: "Tous les documents sont requis" });
      }

      const { fullName, email, phone, country, documentType, documentNumber } = req.body;

      // Upload all KYC files to Supabase Storage (permanent, résiste aux redéploiements)
      const userId = req.session.userId!;
      const [documentFrontPath, documentBackPath, selfiePath] = await Promise.all([
        uploadKycFile(files.documentFront[0].path, files.documentFront[0].mimetype, userId, "front"),
        uploadKycFile(files.documentBack[0].path, files.documentBack[0].mimetype, userId, "back"),
        uploadKycFile(files.selfie[0].path, files.selfie[0].mimetype, userId, "selfie"),
      ]);

      const kyc = await storage.createKycRequest({
        userId: req.session.userId!,
        fullName,
        email,
        phone,
        country,
        documentType,
        documentNumber: documentNumber || null,
        documentFrontPath,
        documentBackPath,
        selfiePath,
      });

      const kycUser = await storage.getUser(req.session.userId!);
      notifyKycSubmitted({
        userName: kycUser?.fullName || fullName || "Inconnu",
        userId: req.session.userId!,
        documentType,
        country,
      });

      res.json(kyc);
    } catch (error: any) {
      console.error("Submit KYC error:", error);
      const message = error?.message || "Erreur lors de la soumission";
      res.status(500).json({ message });
    }
  });

  app.post("/api/admin/test-maishapay", requireAdmin, async (req, res) => {
    try {
      const { currency = "CDF", provider = "AIRTEL", walletID = "+243999999999", amount = 500 } = req.body;
      const { maishapay: mpClient } = await import("./maishapay");
      const testRef = `TEST-${Date.now()}`;
      const result = await mpClient.collectPayment({
        transactionReference: testRef,
        amount: Number(amount),
        currency,
        customerFullName: "Test SendavaPay",
        customerEmail: "test@sendavapay.com",
        provider,
        walletID,
        callbackUrl: "https://sendavapay.com/api/webhook/maishapay",
      });
      return res.json({ testRef, sent: { currency, provider, walletID, amount }, result });
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Get admin stats error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/stats/reset", requireAdmin, async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Non autorisé" });
      }
      await storage.resetAmountStats(userId);
      res.json({ message: "Statistiques de montants réinitialisées avec succès" });
    } catch (error) {
      console.error("Reset stats error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Platform balance endpoint - total balance across all users
  app.get("/api/admin/platform-balance", requireAdmin, async (req, res) => {
    try {
      const balance = await storage.getPlatformBalance();
      res.json(balance);
    } catch (error) {
      console.error("Get platform balance error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // API usage by domain endpoint - shows which sites are using the API
  app.get("/api/admin/api-usage-stats", requireAdmin, async (req, res) => {
    try {
      const usageStats = await storage.getApiUsageByDomain();
      
      // Get API key details for enriched response
      const allApiKeys = await storage.getAllApiKeys();
      const enrichedStats = usageStats.map(stat => {
        const relatedKeys = allApiKeys.filter(k => stat.apiKeyIds.includes(k.id));
        return {
          ...stat,
          apiKeys: relatedKeys.map(k => ({
            id: k.id,
            name: k.name,
            userId: k.userId,
            isActive: k.isActive,
            webhookUrl: k.webhookUrl,
            redirectUrl: k.redirectUrl,
          })),
        };
      });
      
      res.json(enrichedStats);
    } catch (error) {
      console.error("Get API usage stats error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(u => {
        const { password: _, ...rest } = u;
        return rest;
      }));
    } catch (error) {
      console.error("Get admin users error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/admin/kyc", requireAdmin, async (req, res) => {
    try {
      const requests = await storage.getAllKycRequests();
      res.json(requests);
    } catch (error) {
      console.error("Get admin KYC error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/admin/kyc/:id/signed-urls", requireAdmin, async (req, res) => {
    try {
      const kycId = parseInt(req.params.id);
      const allKyc = await storage.getAllKycRequests();
      const kyc = allKyc.find((k: any) => k.id === kycId);
      if (!kyc) return res.status(404).json({ message: "KYC introuvable" });
      const [frontUrl, backUrl, selfieUrl] = await Promise.all([
        getKycSignedUrl(kyc.documentFrontPath || ""),
        getKycSignedUrl(kyc.documentBackPath || ""),
        getKycSignedUrl(kyc.selfiePath || ""),
      ]);
      res.json({ frontUrl, backUrl, selfieUrl });
    } catch (error) {
      console.error("KYC signed URLs error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/admin/kyc/check-duplicate/:documentNumber", requireAdmin, async (req, res) => {
    try {
      const { documentNumber } = req.params;
      if (!documentNumber) return res.status(400).json({ message: "Numéro de document requis" });
      const matches = await storage.getKycByDocumentNumber(documentNumber);
      res.json(matches);
    } catch (error) {
      console.error("KYC duplicate check error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/kyc/:id/approve", requireAdmin, async (req, res) => {
    try {
      const kycId = parseInt(req.params.id);
      const kyc = await storage.updateKycRequest(kycId, {
        status: "approved",
        reviewedBy: req.session.userId!,
        reviewedAt: new Date(),
      });

      if (kyc) {
        await storage.updateUser(kyc.userId, { isVerified: true });
        
        // Send KYC approved email
        const user = await storage.getUser(kyc.userId);
        if (user?.email) {
          sendKycApprovedEmail(user.email, user.fullName).catch(err =>
            console.error("Failed to send KYC approved email:", err)
          );
        }
      }

      res.json(kyc);
    } catch (error) {
      console.error("Approve KYC error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/kyc/:id/reject", requireAdmin, async (req, res) => {
    try {
      const { reason } = req.body;
      const kycId = parseInt(req.params.id);
      const kyc = await storage.updateKycRequest(kycId, {
        status: "rejected",
        rejectionReason: reason,
        reviewedBy: req.session.userId!,
        reviewedAt: new Date(),
      });

      if (kyc) {
        // Send KYC rejected email
        const user = await storage.getUser(kyc.userId);
        if (user?.email) {
          sendKycRejectedEmail(user.email, user.fullName, reason).catch(err =>
            console.error("Failed to send KYC rejected email:", err)
          );
        }
      }

      res.json(kyc);
    } catch (error) {
      console.error("Reject KYC error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/users/:id/block", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.updateUser(userId, { isBlocked: true });
      res.json(user);
    } catch (error) {
      console.error("Block user error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/users/:id/unblock", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.updateUser(userId, { isBlocked: false });
      res.json(user);
    } catch (error) {
      console.error("Unblock user error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/admin/commissions", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getCommissionSettings();
      res.json(settings || { depositRate: "7", encaissementRate: "7", withdrawalRate: "7" });
    } catch (error) {
      console.error("Get commissions error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.put("/api/admin/commissions", requireAdmin, async (req, res) => {
    try {
      const { depositRate, withdrawalRate, encaissementRate } = req.body;
      const currentSettings = await storage.getCommissionSettings();
      const newDeposit = depositRate !== undefined ? parseFloat(depositRate).toFixed(2) : (currentSettings?.depositRate || "7.00");
      const newEncaissement = encaissementRate !== undefined ? parseFloat(encaissementRate).toFixed(2) : (currentSettings?.encaissementRate || "7.00");
      const newWithdrawal = withdrawalRate !== undefined ? parseFloat(withdrawalRate).toFixed(2) : (currentSettings?.withdrawalRate || "7.00");
      for (const [key, val] of Object.entries({ depositRate: newDeposit, encaissementRate: newEncaissement, withdrawalRate: newWithdrawal })) {
        const numVal = parseFloat(val);
        if (isNaN(numVal) || numVal < 0 || numVal > 20) {
          return res.status(400).json({ message: `Le taux ${key} doit être entre 0 et 20%` });
        }
      }
      const settings = await storage.updateCommissionSettings(
        newDeposit,
        newEncaissement,
        newWithdrawal,
        req.session.userId!
      );
      res.json(settings);
    } catch (error) {
      console.error("Update commissions error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/admin/transactions", requireAdmin, async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Get admin transactions error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/admin/withdrawals", requireAdmin, async (req, res) => {
    try {
      const withdrawals = await storage.getAllWithdrawals();
      res.json(withdrawals);
    } catch (error) {
      console.error("Get admin withdrawals error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/withdrawals/:id/approve", requireAdmin, async (req, res) => {
    try {
      const withdrawalId = parseInt(req.params.id);
      const transaction = await storage.getTransaction(withdrawalId);
      
      if (!transaction) {
        return res.status(404).json({ message: "Retrait non trouvé" });
      }

      const updated = await storage.updateTransactionStatus(withdrawalId, "completed");
      res.json(updated);
    } catch (error) {
      console.error("Approve withdrawal error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/withdrawals/:id/reject", requireAdmin, async (req, res) => {
    try {
      const withdrawalId = parseInt(req.params.id);
      const transaction = await storage.getTransaction(withdrawalId);
      
      if (!transaction) {
        return res.status(404).json({ message: "Retrait non trouvé" });
      }

      const user = await storage.getUser(transaction.userId);
      if (user) {
        const refundAmount = parseFloat(transaction.amount);
        await storage.updateUserBalance(user.id, refundAmount.toString());
      }

      const updated = await storage.updateTransactionStatus(withdrawalId, "rejected");
      res.json(updated);
    } catch (error) {
      console.error("Reject withdrawal error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/admin/api-keys", requireAdmin, async (req, res) => {
    try {
      const keys = await storage.getAllApiKeys();
      const users = await storage.getAllUsers();
      const userMap = new Map(users.map(u => [u.id, u]));
      
      res.json(keys.map(k => {
        const user = userMap.get(k.userId);
        return {
          ...k,
          apiKey: undefined,
          keyPrefix: k.apiKey.substring(0, 12),
          user: user ? {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone
          } : null
        };
      }));
    } catch (error) {
      console.error("Get admin API keys error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/admin/api-keys/:id", requireAdmin, async (req, res) => {
    try {
      const keyId = parseInt(req.params.id);
      await storage.updateApiKey(keyId, { isActive: false });
      res.json({ message: "Clé API révoquée" });
    } catch (error) {
      console.error("Revoke API key error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/admin/api-transactions", requireAdmin, async (req, res) => {
    try {
      const apiTransactions = await storage.getAllApiTransactions();
      res.json(apiTransactions);
    } catch (error) {
      console.error("Get admin API transactions error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/admin/api-logs", requireAdmin, async (req, res) => {
    try {
      const logs = await storage.getAllApiLogs();
      const users = await storage.getAllUsers();
      const userMap = new Map(users.map(u => [u.id, u]));
      
      // Group logs by user and extract unique sources
      const sourcesByUser = new Map<number, Set<string>>();
      const logsByUser = new Map<number, any[]>();
      
      logs.forEach(log => {
        if (log.merchantId) {
          if (!sourcesByUser.has(log.merchantId)) {
            sourcesByUser.set(log.merchantId, new Set());
            logsByUser.set(log.merchantId, []);
          }
          
          // Extract origin from user agent or IP
          const source = log.ipAddress || 'Unknown';
          sourcesByUser.get(log.merchantId)!.add(source);
          logsByUser.get(log.merchantId)!.push({
            id: log.id,
            endpoint: log.endpoint,
            method: log.method,
            statusCode: log.statusCode,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            createdAt: log.createdAt,
          });
        }
      });
      
      const result: any[] = [];
      sourcesByUser.forEach((sources, userId) => {
        const user = userMap.get(userId);
        result.push({
          userId,
          user: user ? { id: user.id, fullName: user.fullName, email: user.email } : null,
          sources: Array.from(sources),
          requestCount: logsByUser.get(userId)?.length || 0,
          recentLogs: logsByUser.get(userId)?.slice(0, 20) || [],
        });
      });
      
      res.json(result);
    } catch (error) {
      console.error("Get admin API logs error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getCommissionSettings();
      res.json(settings || { depositRate: "7", encaissementRate: "7", withdrawalRate: "7" });
    } catch (error) {
      console.error("Get admin settings error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const { depositRate, withdrawalRate, encaissementRate } = req.body;
      const currentSettings = await storage.getCommissionSettings();
      const newDeposit = depositRate !== undefined ? parseFloat(depositRate).toFixed(2) : (currentSettings?.depositRate || "7.00");
      const newEncaissement = encaissementRate !== undefined ? parseFloat(encaissementRate).toFixed(2) : (currentSettings?.encaissementRate || "7.00");
      const newWithdrawal = withdrawalRate !== undefined ? parseFloat(withdrawalRate).toFixed(2) : (currentSettings?.withdrawalRate || "7.00");
      for (const [key, val] of Object.entries({ depositRate: newDeposit, encaissementRate: newEncaissement, withdrawalRate: newWithdrawal })) {
        const numVal = parseFloat(val);
        if (isNaN(numVal) || numVal < 0 || numVal > 20) {
          return res.status(400).json({ message: `Le taux ${key} doit être entre 0 et 20%` });
        }
      }
      const settings = await storage.updateCommissionSettings(
        newDeposit,
        newEncaissement,
        newWithdrawal,
        req.session.userId!
      );
      res.json(settings);
    } catch (error) {
      console.error("Update admin settings error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/fees/update", requireAdmin, async (req, res) => {
    try {
      const { depositRate, encaissementRate, withdrawalRate, reason } = req.body;
      
      const rates = { depositRate, encaissementRate, withdrawalRate };
      for (const [key, value] of Object.entries(rates)) {
        if (value !== undefined) {
          const numVal = parseFloat(value as string);
          if (isNaN(numVal) || numVal < 0 || numVal > 20) {
            return res.status(400).json({ message: `Le taux ${key} doit être entre 0 et 20%` });
          }
        }
      }

      const currentSettings = await storage.getCommissionSettings();
      const currentDeposit = currentSettings?.depositRate || "7.00";
      const currentEncaissement = currentSettings?.encaissementRate || "7.00";
      const currentWithdrawal = currentSettings?.withdrawalRate || "7.00";

      const newDeposit = depositRate !== undefined ? parseFloat(depositRate).toFixed(2) : currentDeposit;
      const newEncaissement = encaissementRate !== undefined ? parseFloat(encaissementRate).toFixed(2) : currentEncaissement;
      const newWithdrawal = withdrawalRate !== undefined ? parseFloat(withdrawalRate).toFixed(2) : currentWithdrawal;

      if (depositRate !== undefined && parseFloat(depositRate) !== parseFloat(currentDeposit)) {
        await storage.createFeeChange(req.session.userId!, "deposit", currentDeposit, newDeposit, reason);
      }
      if (encaissementRate !== undefined && parseFloat(encaissementRate) !== parseFloat(currentEncaissement)) {
        await storage.createFeeChange(req.session.userId!, "encaissement", currentEncaissement, newEncaissement, reason);
      }
      if (withdrawalRate !== undefined && parseFloat(withdrawalRate) !== parseFloat(currentWithdrawal)) {
        await storage.createFeeChange(req.session.userId!, "withdraw", currentWithdrawal, newWithdrawal, reason);
      }

      console.log(`Fee update: deposit=${newDeposit}, encaissement=${newEncaissement}, withdrawal=${newWithdrawal}`);
      const settings = await storage.updateCommissionSettings(
        newDeposit,
        newEncaissement,
        newWithdrawal,
        req.session.userId!
      );

      console.log("Fee update result:", JSON.stringify(settings));
      res.json(settings);
    } catch (error) {
      console.error("Update fees error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/admin/fee-changes", requireAdmin, async (req, res) => {
    try {
      const changes = await storage.getFeeChanges();
      res.json(changes);
    } catch (error) {
      console.error("Get fee changes error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Public fees endpoint — countries + operators + rates
  app.get("/api/public/fees", async (req, res) => {
    try {
      const [countries, operators, settings] = await Promise.all([
        storage.getCountries(),
        storage.getOperators(),
        storage.getCommissionSettings(),
      ]);
      const globalDeposit = parseFloat(settings?.depositRate || "7");
      const globalWithdraw = parseFloat(settings?.withdrawalRate || "7");
      const globalEncaissement = parseFloat(settings?.encaissementRate || "7");

      const activeCountries = countries
        .filter((c: any) => c.isActive)
        .map((c: any) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          currency: c.currency,
          depositFee: c.depositFeeRate !== null ? parseFloat(c.depositFeeRate) : globalDeposit,
          withdrawFee: c.withdrawFeeRate !== null ? parseFloat(c.withdrawFeeRate) : globalWithdraw,
          encaissementFee: c.encaissementFeeRate !== null ? parseFloat(c.encaissementFeeRate) : globalEncaissement,
          operators: operators
            .filter((op: any) => op.countryId === c.id && op.isActive)
            .map((op: any) => ({ id: op.id, name: op.name, logo: op.logo, inMaintenance: op.inMaintenance })),
        }))
        .filter((c: any) => c.operators.length > 0);

      res.json({ countries: activeCountries, global: { depositFee: globalDeposit, withdrawFee: globalWithdraw, encaissementFee: globalEncaissement } });
    } catch (error) {
      console.error("Public fees error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Social Links - Public endpoint
  app.get("/api/social-links", async (req, res) => {
    try {
      const links = await storage.getSocialLinks();
      res.json(links);
    } catch (error) {
      console.error("Get social links error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Social Links - Admin endpoints
  app.get("/api/admin/social-links", requireAdmin, async (req, res) => {
    try {
      const links = await storage.getSocialLinks();
      res.json(links);
    } catch (error) {
      console.error("Get admin social links error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.put("/api/admin/social-links/:platform", requireAdmin, async (req, res) => {
    try {
      const { platform } = req.params;
      const { url, isActive } = req.body;
      const updated = await storage.updateSocialLink(platform, url || null, isActive ?? false);
      res.json(updated);
    } catch (error) {
      console.error("Update social link error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ========== GLOBAL NOTIFICATIONS ==========
  app.get("/api/admin/global-notifications", requireAdmin, async (req, res) => {
    try {
      const notifications = await storage.getAllGlobalNotifications();
      res.json(notifications);
    } catch (error) {
      console.error("Get global notifications error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/global-notifications", requireAdmin, async (req, res) => {
    try {
      const { message, color, buttonText, buttonUrl, isActive } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Le message est requis" });
      }
      const notification = await storage.createGlobalNotification({
        message,
        color: color || "blue",
        buttonText: buttonText || null,
        buttonUrl: buttonUrl || null,
        isActive: isActive !== false,
        createdBy: req.session.userId,
      });
      res.json(notification);
    } catch (error) {
      console.error("Create global notification error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.put("/api/admin/global-notifications/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { message, color, buttonText, buttonUrl, isActive } = req.body;
      const notification = await storage.updateGlobalNotification(id, {
        message,
        color,
        buttonText,
        buttonUrl,
        isActive,
      });
      if (!notification) {
        return res.status(404).json({ message: "Notification non trouvée" });
      }
      res.json(notification);
    } catch (error) {
      console.error("Update global notification error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/admin/global-notifications/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGlobalNotification(id);
      res.json({ message: "Notification supprimée" });
    } catch (error) {
      console.error("Delete global notification error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Public endpoint for users to fetch active notifications
  app.get("/api/global-notifications/active", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getActiveGlobalNotifications();
      res.json(notifications);
    } catch (error) {
      console.error("Get active notifications error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ========== MAINTENANCE MODE ==========
  app.get("/api/admin/maintenance", requireAdmin, async (req, res) => {
    try {
      const value = await storage.getSetting("maintenance_mode");
      res.json({ enabled: value === "true" });
    } catch (error) {
      console.error("Get maintenance mode error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.put("/api/admin/maintenance", requireAdmin, async (req, res) => {
    try {
      const { enabled } = req.body;
      await storage.setSetting("maintenance_mode", enabled ? "true" : "false");
      await storage.createAuditLog({
        userId: req.session.userId,
        action: enabled ? "maintenance_enabled" : "maintenance_disabled",
        details: `Mode maintenance ${enabled ? "activé" : "désactivé"}`,
        ipAddress: req.ip,
      });
      res.json({ enabled, message: `Mode maintenance ${enabled ? "activé" : "désactivé"}` });
    } catch (error) {
      console.error("Update maintenance mode error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ========== API & DOCS MAINTENANCE ==========
  app.get("/api/admin/api-maintenance", requireAdmin, async (req, res) => {
    try {
      const value = await storage.getSetting("api_docs_maintenance");
      res.json({ enabled: value === "true" });
    } catch (error) {
      console.error("Get API maintenance mode error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.put("/api/admin/api-maintenance", requireAdmin, async (req, res) => {
    try {
      const { enabled } = req.body;
      await storage.setSetting("api_docs_maintenance", enabled ? "true" : "false");
      await storage.createAuditLog({
        userId: req.session.userId,
        action: enabled ? "api_maintenance_enabled" : "api_maintenance_disabled",
        details: `Mode maintenance API/Docs ${enabled ? "activé" : "désactivé"}`,
        ipAddress: req.ip,
      });
      res.json({ enabled, message: `Mode maintenance API/Docs ${enabled ? "activé" : "désactivé"}` });
    } catch (error) {
      console.error("Update API maintenance mode error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Public endpoint to check API/Docs maintenance status
  app.get("/api/api-maintenance-status", async (req, res) => {
    try {
      const value = await storage.getSetting("api_docs_maintenance");
      res.json({ enabled: value === "true" });
    } catch (error) {
      res.json({ enabled: false });
    }
  });

  app.get("/api/site-settings", async (req, res) => {
    try {
      const supportEmail = await storage.getSetting("support_email") || "support@sendavapay.com";
      const supportPhone = await storage.getSetting("support_phone") || "+228 92 29 97 72";
      const platformName = await storage.getSetting("platform_name") || "SendavaPay";
      res.json({ supportEmail, supportPhone, platformName });
    } catch (error) {
      console.error("Get site settings error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/admin/site-settings", requireAdmin, async (req, res) => {
    try {
      const supportEmail = await storage.getSetting("support_email") || "support@sendavapay.com";
      const supportPhone = await storage.getSetting("support_phone") || "+228 92 29 97 72";
      const platformName = await storage.getSetting("platform_name") || "SendavaPay";
      res.json({ supportEmail, supportPhone, platformName });
    } catch (error) {
      console.error("Get admin site settings error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.put("/api/admin/site-settings", requireAdmin, async (req, res) => {
    try {
      const { supportEmail, supportPhone, platformName } = req.body;
      
      if (supportEmail) await storage.setSetting("support_email", supportEmail);
      if (supportPhone) await storage.setSetting("support_phone", supportPhone);
      if (platformName) await storage.setSetting("platform_name", platformName);
      
      await storage.createAuditLog({
        userId: req.session.userId,
        action: "site_settings_updated",
        details: "Paramètres du site mis à jour",
        ipAddress: req.ip,
      });
      
      res.json({ message: "Paramètres enregistrés avec succès", supportEmail, supportPhone, platformName });
    } catch (error) {
      console.error("Update site settings error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // LeekPay Webhook - Route GET pour test uniquement
  app.get("/api/webhook/leekpay", (req, res) => {
    console.log("=== LeekPay Webhook GET request received ===");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Query params:", JSON.stringify(req.query));
    console.log("Headers:", JSON.stringify(req.headers));
    res.json({ 
      status: "ok", 
      message: "LeekPay webhook endpoint is accessible. Use POST method to send payment notifications.", 
      timestamp: new Date().toISOString(),
      method: "GET"
    });
  });

  // Admin endpoint to manually process pending LeekPay payments
  app.post("/api/admin/process-leekpay-payment", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Non authentifié" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Accès refusé" });
    }

    try {
      const { leekpayPaymentId } = req.body;
      
      if (!leekpayPaymentId) {
        return res.status(400).json({ message: "leekpayPaymentId requis" });
      }

      const leekpayPayment = await storage.getLeekpayPaymentById(leekpayPaymentId);
      
      if (!leekpayPayment) {
        return res.status(404).json({ message: "Paiement non trouvé" });
      }

      if (leekpayPayment.status === "completed") {
        return res.status(400).json({ message: "Ce paiement a déjà été traité" });
      }

      const settings = await storage.getCommissionSettings();
      const amount = parseFloat(leekpayPayment.amount);

      // Update LeekPay payment status
      await storage.updateLeekpayPayment(leekpayPaymentId, {
        status: "completed",
        webhookReceived: true,
        completedAt: new Date(),
      });

      if (leekpayPayment.type === "deposit" && leekpayPayment.userId) {
        const commissionRate = await getEffectiveFeeRate(leekpayPayment.userId, "deposit", settings);
        const fee = Math.round(amount * (commissionRate / 100));
        const netAmount = amount - fee;

        // Create transaction
        await storage.createTransaction({
          userId: leekpayPayment.userId,
          type: "deposit",
          amount: amount.toString(),
          fee: fee.toString(),
          netAmount: netAmount.toString(),
          status: "completed",
          description: leekpayPayment.description || "Dépôt via LeekPay",
          externalRef: leekpayPaymentId,
          paymentMethod: leekpayPayment.paymentMethod || "leekpay",
        });

        // Update user balance
        await storage.updateUserBalance(leekpayPayment.userId, netAmount.toString());
        
        console.log(`Admin: Manually processed deposit for user ${leekpayPayment.userId}, amount: ${netAmount}`);
        res.json({ success: true, message: `Dépôt de ${netAmount} ${leekpayPayment.currency} crédité` });
      } else if (leekpayPayment.type === "payment_link" && leekpayPayment.paymentLinkId) {
        const commissionRate = getCommissionRate(settings, "payment_received");
        const fee = Math.round(amount * (commissionRate / 100));
        const netAmount = amount - fee;

        const link = await storage.getPaymentLink(leekpayPayment.paymentLinkId);
        if (link) {
          await storage.updatePaymentLink(link.id, {
            paidAt: new Date(),
            payerName: leekpayPayment.payerName,
            payerEmail: leekpayPayment.customerEmail || null,
            payerPhone: leekpayPayment.payerPhone,
            payerCountry: leekpayPayment.payerCountry,
            paidAmount: amount.toString(),
          });

          // Create transaction for user with payer info
          await storage.createTransaction({
            userId: link.userId,
            type: "payment_received",
            amount: amount.toString(),
            fee: fee.toString(),
            netAmount: netAmount.toString(),
            status: "completed",
            description: `Paiement reçu: ${link.title}`,
            externalRef: leekpayPaymentId,
            paymentMethod: leekpayPayment.paymentMethod || "leekpay",
            mobileNumber: leekpayPayment.payerPhone,
            payerName: leekpayPayment.payerName,
            payerEmail: leekpayPayment.customerEmail,
            payerCountry: leekpayPayment.payerCountry,
            paymentLinkId: link.id,
          });

          await storage.updateUserBalance(link.userId, netAmount.toString());
          
          console.log(`Admin: Manually processed payment link for user ${link.userId}, amount: ${netAmount}`);
          res.json({ success: true, message: `Paiement de ${netAmount} ${leekpayPayment.currency} crédité` });
        } else {
          res.status(404).json({ message: "Lien de paiement non trouvé" });
        }
      } else {
        res.status(400).json({ message: "Type de paiement non pris en charge" });
      }
    } catch (error) {
      console.error("Error processing LeekPay payment manually:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Admin endpoint to list pending LeekPay payments
  app.get("/api/admin/pending-leekpay-payments", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Non authentifié" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Accès refusé" });
    }

    try {
      const payments = await storage.getPendingLeekpayPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching pending payments:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // LeekPay Webhook - Supporte plusieurs formats de données
  app.post("/api/webhook/leekpay", async (req, res) => {
    console.log("🔔🔔🔔 WEBHOOK LEEKPAY REÇU 🔔🔔🔔");
    console.log("Webhook reçu:", JSON.stringify(req.body, null, 2));
    
    try {
      const signature = req.headers["x-leekpay-signature"] as string;
      const data = req.body;
      
      console.log("📥 === LeekPay Webhook received ===");
      console.log("📅 Timestamp:", new Date().toISOString());
      console.log("🔐 Signature:", signature ? "present" : "missing");
      console.log("📦 Data:", JSON.stringify(data, null, 2));
      console.log("📋 Headers:", JSON.stringify(req.headers));
      
      // Vérifier que les données ne sont pas vides ou malformées
      if (!data || Object.keys(data).length === 0) {
        console.error("❌ LeekPay webhook: Empty or malformed request");
        return res.status(400).json({ status: "error", message: "Requête vide ou malformée" });
      }

      // Vérifier la signature si présente
      if (signature) {
        const isValid = leekpay.verifyWebhookSignature(JSON.stringify(data), signature);
        console.log("🔐 Signature verification:", isValid ? "✅ VALID" : "❌ INVALID");
      } else {
        console.warn("⚠️ LeekPay webhook: No signature provided");
      }

      // Extraire les données selon le format reçu
      let paymentReference: string | null = null;
      let paymentStatus: string | null = null;
      let paymentAmount: number | null = null;
      let paymentCurrency: string | null = null;
      let userId: number | null = null;
      let eventType: string = data.event || "";

      // Format avec "data" (nouveau format)
      if (data.data) {
        paymentReference = data.data.reference || data.data.id || null;
        paymentStatus = data.data.status || null;
        paymentAmount = parseFloat(data.data.amount) || null;
        paymentCurrency = data.data.currency || "XOF";
        
        if (data.data.metadata && data.data.metadata.user_id) {
          userId = parseInt(data.data.metadata.user_id);
        }
      }
      
      // Format avec "transaction" (ancien format)
      if (data.transaction) {
        paymentReference = data.transaction.id?.toString() || data.transaction.reference || null;
        paymentStatus = data.transaction.status || null;
        paymentAmount = parseFloat(data.transaction.amount) || null;
        paymentCurrency = data.transaction.currency || "XOF";
      }

      // Support direct des champs à la racine (au cas où)
      if (!paymentReference && data.reference) paymentReference = data.reference;
      if (!paymentStatus && data.status) paymentStatus = data.status;
      if (!paymentAmount && data.amount) paymentAmount = parseFloat(data.amount);
      if (!userId && data.user_id) userId = parseInt(data.user_id);

      console.log("📊 Parsed data:", { paymentReference, paymentStatus, paymentAmount, eventType, userId });

      // Déterminer si le paiement est réussi
      const isSuccess = 
        eventType === "payment_successful" || 
        eventType === "payment.success" || 
        paymentStatus === "success" || 
        paymentStatus === "completed";

      const isFailed = 
        eventType === "payment_failed" || 
        eventType === "payment.failed" || 
        paymentStatus === "failed" || 
        paymentStatus === "error";

      console.log("🔍 isSuccess:", isSuccess, "isFailed:", isFailed);

      // Chercher le paiement dans notre base de données
      let leekpayPayment = paymentReference ? await storage.getLeekpayPaymentById(paymentReference) : null;
      
      console.log("🗄️ Payment found in DB:", leekpayPayment ? "YES" : "NO");

      if (leekpayPayment) {
        // Mapper le statut
        let status: "pending" | "processing" | "completed" | "failed" | "cancelled" | "expired" = "pending";
        if (isSuccess) {
          status = "completed";
        } else if (isFailed) {
          status = "failed";
        } else if (paymentStatus === "cancelled") {
          status = "cancelled";
        } else if (paymentStatus === "expired") {
          status = "expired";
        } else if (paymentStatus === "processing") {
          status = "processing";
        }

        // Vérifier si déjà traité
        if (leekpayPayment.status === "completed") {
          console.log("⚠️ Payment already processed, skipping");
          return res.status(200).json({ status: "ok", message: "Paiement déjà traité" });
        }

        // Mettre à jour le paiement LeekPay
        await storage.updateLeekpayPayment(paymentReference!, {
          status,
          webhookReceived: true,
          webhookData: JSON.stringify(data),
          completedAt: status === "completed" ? new Date() : undefined,
        });

        // Si le paiement est réussi, créditer le compte
        if (status === "completed") {
          const settings = await storage.getCommissionSettings();
          const amount = paymentAmount || parseFloat(leekpayPayment.amount);

          if (leekpayPayment.type === "deposit" && leekpayPayment.userId) {
            const commissionRate = await getEffectiveFeeRate(leekpayPayment.userId, "deposit", settings);
            const fee = Math.round(amount * (commissionRate / 100));
            const netAmount = amount - fee;

            // Créer la transaction
            await storage.createTransaction({
              userId: leekpayPayment.userId,
              type: "deposit",
              amount: amount.toString(),
              fee: fee.toString(),
              netAmount: netAmount.toString(),
              status: "completed",
              description: leekpayPayment.description || "Dépôt via LeekPay",
              externalRef: paymentReference!,
              paymentMethod: leekpayPayment.paymentMethod || "leekpay",
            });

            // Créditer le solde de l'utilisateur
            await storage.updateUserBalance(leekpayPayment.userId, netAmount.toString());
            
            // Send deposit confirmation email
            const depositUser = await storage.getUser(leekpayPayment.userId);
            if (depositUser?.email) {
              sendDepositEmail(depositUser.email, {
                userName: depositUser.fullName,
                amount: netAmount,
                currency: paymentCurrency || "XOF",
                transactionId: paymentReference!,
                phone: leekpayPayment.payerPhone || "",
                operator: leekpayPayment.paymentMethod || "Mobile Money"
              }).catch(err => console.error("Failed to send deposit email:", err));
            }

            notifyDeposit({
              userName: depositUser?.fullName || "Inconnu",
              userId: leekpayPayment.userId,
              amount,
              fee,
              netAmount,
              currency: paymentCurrency || "XOF",
              phone: leekpayPayment.payerPhone || undefined,
              operator: leekpayPayment.paymentMethod || undefined,
              reference: paymentReference!,
            });

            if (amount >= 500000) {
              notifyLargeAmount({
                type: "deposit",
                userName: depositUser?.fullName || "Inconnu",
                userId: leekpayPayment.userId,
                amount,
                currency: paymentCurrency || "XOF",
                operator: leekpayPayment.paymentMethod || undefined,
                reference: paymentReference!,
              });
            }
            
            console.log(`✅ Paiement confirmé pour utilisateur #${leekpayPayment.userId}: référence=${paymentReference}, montant=${netAmount} ${paymentCurrency}`);
          } else if (leekpayPayment.type === "payment_link" && leekpayPayment.paymentLinkId) {
            const commissionRate = getCommissionRate(settings, "payment_received");
            const fee = Math.round(amount * (commissionRate / 100));
            const netAmount = amount - fee;

            const link = await storage.getPaymentLink(leekpayPayment.paymentLinkId);
            if (link) {
              await storage.updatePaymentLink(link.id, {
                paidAt: new Date(),
                payerName: leekpayPayment.payerName,
                payerEmail: leekpayPayment.customerEmail || null,
                payerPhone: leekpayPayment.payerPhone,
                payerCountry: leekpayPayment.payerCountry,
                paidAmount: amount.toString(),
              });

              // Créditer le solde du marchand
              await storage.updateUserBalance(link.userId, netAmount.toString());

              const transaction = await storage.createTransaction({
                userId: link.userId,
                type: "payment_received",
                amount: amount.toString(),
                fee: fee.toString(),
                netAmount: netAmount.toString(),
                status: "completed",
                description: `Paiement reçu: ${link.title}`,
                mobileNumber: leekpayPayment.payerPhone,
                payerName: leekpayPayment.payerName,
                payerEmail: leekpayPayment.customerEmail,
                payerCountry: leekpayPayment.payerCountry,
                paymentMethod: leekpayPayment.paymentMethod || "leekpay",
                paymentLinkId: link.id,
                externalRef: paymentReference,
              });
              
              // Send payment received email to merchant
              const merchant = await storage.getUser(link.userId);
              if (merchant?.email) {
                sendPaymentReceivedEmail(merchant.email, {
                  merchantName: merchant.fullName,
                  amount: netAmount,
                  currency: paymentCurrency || "XOF",
                  transactionId: transaction?.id?.toString() || paymentReference!,
                  payerPhone: leekpayPayment.payerPhone || "",
                  paymentLinkTitle: link.title
                }).catch(err => console.error("Failed to send payment received email:", err));
              }

              notifyPaymentReceived({
                merchantName: merchant?.fullName || "Inconnu",
                merchantId: link.userId,
                amount,
                fee,
                netAmount,
                currency: paymentCurrency || "XOF",
                payerPhone: leekpayPayment.payerPhone || undefined,
                payerName: leekpayPayment.payerName || undefined,
                paymentLinkTitle: link.title,
                reference: paymentReference!,
                source: "link",
              });

              if (amount >= 500000) {
                notifyLargeAmount({
                  type: "payment",
                  userName: merchant?.fullName || "Inconnu",
                  userId: link.userId,
                  amount,
                  currency: paymentCurrency || "XOF",
                  operator: leekpayPayment.paymentMethod || undefined,
                  reference: paymentReference!,
                });
              }
              
              console.log(`✅ Paiement confirmé pour marchand #${link.userId}: référence=${paymentReference}, montant=${netAmount} ${paymentCurrency}`);
            }
          }
        } else if (status === "failed") {
          console.log(`❌ Paiement échoué: référence=${paymentReference}`);
        }

        console.log("✅ Webhook traité avec succès");
        return res.status(200).json({ status: "ok", message: "Paiement traité" });
      } else {
        // Paiement non trouvé mais on peut quand même créditer si on a le user_id
        console.log("⚠️ Paiement non trouvé dans la base, tentative de crédit direct avec user_id");
        
        if (isSuccess && userId && paymentAmount) {
          const settings = await storage.getCommissionSettings();
          const commissionRate = await getEffectiveFeeRate(userId, "deposit", settings);
          const fee = Math.round(paymentAmount * (commissionRate / 100));
          const netAmount = paymentAmount - fee;

          // Vérifier que l'utilisateur existe
          const user = await storage.getUser(userId);
          if (user) {
            console.log(`👤 Utilisateur trouvé: ${user.email}`);
            
            await storage.createTransaction({
              userId: userId,
              type: "deposit",
              amount: paymentAmount.toString(),
              fee: fee.toString(),
              netAmount: netAmount.toString(),
              status: "completed",
              description: "Dépôt via LeekPay (webhook direct)",
              externalRef: paymentReference || `webhook_${Date.now()}`,
              paymentMethod: "leekpay",
            });

            await storage.updateUserBalance(userId, netAmount.toString());
            
            console.log(`✅ Paiement confirmé pour utilisateur #${userId}: référence=${paymentReference}, montant=${netAmount} ${paymentCurrency}`);
            return res.status(200).json({ status: "ok", message: "Paiement traité" });
          } else {
            console.log(`❌ Utilisateur #${userId} non trouvé`);
          }
        }

        console.warn(`⚠️ LeekPay webhook: Payment reference ${paymentReference} not found in database, no user_id provided`);
        return res.status(200).json({ status: "ok", message: "Webhook reçu" });
      }
    } catch (error) {
      console.error("❌ LeekPay webhook error:", error);
      return res.status(500).json({ status: "error", message: "Erreur lors du traitement du webhook" });
    }
  });

  // Check LeekPay payment status
  app.get("/api/leekpay/status/:paymentId", requireAuth, async (req, res) => {
    try {
      const { paymentId } = req.params;
      
      // First check our database
      const payment = await storage.getLeekpayPaymentById(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Paiement introuvable" });
      }

      // If already completed, return from database
      if (payment.status === "completed") {
        return res.json({ status: payment.status, payment });
      }

      // Otherwise, check with LeekPay API
      const statusResult = await leekpay.getPaymentStatus(paymentId);
      if (statusResult.success && statusResult.data) {
        // Update our record if status changed
        if (statusResult.data.status !== payment.status) {
          await storage.updateLeekpayPayment(paymentId, {
            status: statusResult.data.status,
          });
        }
        return res.json({ status: statusResult.data.status, payment: { ...payment, status: statusResult.data.status } });
      }

      res.json({ status: payment.status, payment });
    } catch (error) {
      console.error("Check LeekPay status error:", error);
      res.status(500).json({ message: "Erreur lors de la vérification" });
    }
  });

  // ========== WITHDRAWAL NUMBERS ==========
  app.get("/api/admin/withdrawal-numbers", requireAdmin, async (req, res) => {
    try {
      const numbers = await storage.getWithdrawalNumbers();
      res.json(numbers);
    } catch (error) {
      console.error("Get withdrawal numbers error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/withdrawal-numbers", requireAdmin, async (req, res) => {
    try {
      const { phoneNumber, operator, country, walletName, isActive } = req.body;
      if (!phoneNumber || !operator || !country) {
        return res.status(400).json({ message: "Champs requis manquants" });
      }
      const number = await storage.createWithdrawalNumber({
        phoneNumber,
        operator,
        country,
        walletName: walletName || null,
        isActive: isActive ?? true,
      });
      await storage.createAuditLog({
        userId: req.session.userId,
        action: "withdrawal_number_created",
        details: `Numéro de retrait créé: ${phoneNumber} (${operator})`,
        ipAddress: req.ip,
      });
      res.json(number);
    } catch (error) {
      console.error("Create withdrawal number error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.put("/api/admin/withdrawal-numbers/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { phoneNumber, operator, country, walletName, isActive } = req.body;
      const number = await storage.updateWithdrawalNumber(id, {
        phoneNumber,
        operator,
        country,
        walletName,
        isActive,
      });
      res.json(number);
    } catch (error) {
      console.error("Update withdrawal number error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/admin/withdrawal-numbers/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWithdrawalNumber(id);
      res.json({ message: "Numéro supprimé" });
    } catch (error) {
      console.error("Delete withdrawal number error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ========== COUNTRIES ==========
  app.get("/api/admin/countries", requireAdmin, async (req, res) => {
    try {
      const countries = await storage.getCountries();
      res.json(countries);
    } catch (error) {
      console.error("Get countries error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/countries", requireAdmin, async (req, res) => {
    try {
      const { code, name, currency, isActive } = req.body;
      if (!code || !name) {
        return res.status(400).json({ message: "Code et nom requis" });
      }
      const country = await storage.createCountry({
        code,
        name,
        currency: currency || "XOF",
        isActive: isActive ?? true,
      });
      res.json(country);
    } catch (error) {
      console.error("Create country error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.put("/api/admin/countries/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const country = await storage.updateCountry(id, req.body);
      res.json(country);
    } catch (error) {
      console.error("Update country error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.put("/api/admin/countries/:id/fees", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { depositFeeRate, withdrawFeeRate, encaissementFeeRate, apiFeeRate } = req.body;
      const toVal = (v: any) => (v === "" || v === null || v === undefined) ? null : parseFloat(v);
      const updates: Record<string, any> = {};
      if (depositFeeRate !== undefined) updates.depositFeeRate = toVal(depositFeeRate);
      if (withdrawFeeRate !== undefined) updates.withdrawFeeRate = toVal(withdrawFeeRate);
      if (encaissementFeeRate !== undefined) updates.encaissementFeeRate = toVal(encaissementFeeRate);
      if (apiFeeRate !== undefined) updates.apiFeeRate = toVal(apiFeeRate);
      const country = await storage.updateCountry(id, updates);
      res.json(country);
    } catch (error) {
      console.error("Update country fees error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/admin/countries/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCountry(id);
      res.json({ message: "Pays supprimé" });
    } catch (error) {
      console.error("Delete country error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ========== OPERATORS ==========
  app.get("/api/admin/operators", requireAdmin, async (req, res) => {
    try {
      const operators = await storage.getOperators();
      res.json(operators);
    } catch (error) {
      console.error("Get operators error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Returns static services (defined in code) that are NOT managed via the DB operators table
  app.get("/api/admin/static-services", requireAdmin, async (req, res) => {
    try {
      const operators = await storage.getOperators();
      const dbCodes = new Set(operators.map(op => op.code));
      const staticOnly = SOLEASPAY_SERVICES.filter(s => !dbCodes.has(s.id.toString()));
      res.json(staticOnly);
    } catch (error) {
      console.error("Get static services error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/operators", requireAdmin, async (req, res) => {
    try {
      const { countryId, name, code, isActive, type, dailyLimit, paymentGateway, inMaintenance, maintenanceDeposit, maintenanceWithdraw, maintenancePaymentLink, maintenanceApi } = req.body;
      if (!countryId || !name || !code) {
        return res.status(400).json({ message: "Champs requis manquants" });
      }
      const operator = await storage.createOperator({
        countryId,
        name,
        code,
        isActive: isActive ?? true,
        type: type || "mobile_money",
        dailyLimit: dailyLimit || "1000000",
        paymentGateway: paymentGateway || "soleaspay",
        inMaintenance: inMaintenance ?? false,
        maintenanceDeposit: maintenanceDeposit ?? false,
        maintenanceWithdraw: maintenanceWithdraw ?? false,
        maintenancePaymentLink: maintenancePaymentLink ?? false,
        maintenanceApi: maintenanceApi ?? false,
      });
      res.json(operator);
    } catch (error) {
      console.error("Create operator error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.put("/api/admin/operators/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const operator = await storage.updateOperator(id, req.body);
      res.json(operator);
    } catch (error) {
      console.error("Update operator error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/admin/operators/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteOperator(id);
      res.json({ message: "Opérateur supprimé" });
    } catch (error) {
      console.error("Delete operator error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ========== GLOBAL MESSAGES ==========
  app.get("/api/admin/global-messages", requireAdmin, async (req, res) => {
    try {
      const messages = await storage.getGlobalMessages();
      res.json(messages);
    } catch (error) {
      console.error("Get global messages error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/global-messages", requireAdmin, async (req, res) => {
    try {
      const { title, content, targetAudience } = req.body;
      if (!title || !content) {
        return res.status(400).json({ message: "Titre et contenu requis" });
      }
      const globalMessage = await storage.createGlobalMessage({
        title,
        content,
        targetAudience: targetAudience || "all",
        sentBy: req.session.userId,
      });
      await storage.createAuditLog({
        userId: req.session.userId,
        action: "global_message_created",
        details: `Message global créé: ${title}`,
        ipAddress: req.ip,
      });
      res.json(globalMessage);
    } catch (error) {
      console.error("Create global message error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ========== ADMIN NOTIFICATIONS ==========
  app.get("/api/admin/notifications", requireAdmin, async (req, res) => {
    try {
      const notifications = await storage.getAdminNotifications();
      res.json(notifications);
    } catch (error) {
      console.error("Get admin notifications error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/admin/notifications/unread-count", requireAdmin, async (req, res) => {
    try {
      const count = await storage.getUnreadAdminNotificationsCount();
      res.json({ count });
    } catch (error) {
      console.error("Get unread notifications count error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/notifications/:id/read", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markAdminNotificationRead(id);
      res.json({ message: "Notification marquée comme lue" });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/notifications/read-all", requireAdmin, async (req, res) => {
    try {
      await storage.markAllAdminNotificationsRead();
      res.json({ message: "Toutes les notifications marquées comme lues" });
    } catch (error) {
      console.error("Mark all notifications read error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ========== AUDIT LOGS ==========
  app.get("/api/admin/audit-logs", requireAdmin, async (req, res) => {
    try {
      const logs = await storage.getAuditLogs();
      res.json(logs);
    } catch (error) {
      console.error("Get audit logs error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ========== PAYMENT LINKS (ADMIN) ==========
  app.get("/api/admin/payment-links", requireAdmin, async (req, res) => {
    try {
      const links = await storage.getAllPaymentLinks();
      res.json(links);
    } catch (error) {
      console.error("Get admin payment links error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ========== USER MANAGEMENT (ADMIN) ==========
  app.put("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { fullName, email, phone, adminNote, role, isVerified } = req.body;
      
      const updates: any = {};
      if (fullName !== undefined) updates.fullName = fullName;
      if (email !== undefined) updates.email = email;
      if (phone !== undefined) updates.phone = phone;
      if (adminNote !== undefined) updates.adminNote = adminNote;
      if (role !== undefined) updates.role = role;
      if (isVerified !== undefined) updates.isVerified = isVerified;
      
      const user = await storage.updateUser(userId, updates);
      
      await storage.createAuditLog({
        userId: req.session.userId,
        action: "user_updated",
        details: `Utilisateur #${userId} mis à jour: ${JSON.stringify(updates)}`,
        ipAddress: req.ip,
      });
      
      res.json(user);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/users/:id/reset-password", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(userId, { password: hashedPassword });
      
      await storage.createAuditLog({
        userId: req.session.userId,
        action: "password_reset",
        details: `Mot de passe réinitialisé pour l'utilisateur #${userId}`,
        ipAddress: req.ip,
      });
      
      res.json({ message: "Mot de passe mis à jour avec succès" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/users/:id/modify-balance", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount, operation, reason } = req.body;
      
      if (!amount || !operation || !reason) {
        return res.status(400).json({ message: "Montant, opération et raison requis" });
      }
      
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ message: "Montant invalide" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      const currentBalance = parseFloat(user.balance);
      let newBalance: number;
      
      if (operation === "add") {
        newBalance = currentBalance + numericAmount;
      } else if (operation === "subtract") {
        if (numericAmount > currentBalance) {
          return res.status(400).json({ message: "Solde insuffisant" });
        }
        newBalance = currentBalance - numericAmount;
      } else {
        return res.status(400).json({ message: "Opération invalide" });
      }
      
      await storage.setUserBalance(userId, newBalance.toString());
      
      await storage.createTransaction({
        userId,
        type: operation === "add" ? "deposit" : "withdrawal",
        amount: numericAmount.toString(),
        fee: "0",
        netAmount: numericAmount.toString(),
        status: "completed",
        description: `Ajustement admin: ${reason}`,
      });
      
      await storage.createAuditLog({
        userId: req.session.userId,
        action: operation === "add" ? "balance_credit" : "balance_debit",
        details: `Solde ${operation === "add" ? "crédité" : "débité"} de ${numericAmount} pour utilisateur #${userId}: ${reason}`,
        ipAddress: req.ip,
      });
      
      const highAmount = numericAmount >= 60000;
      if (highAmount) {
        await storage.createAdminNotification({
          title: "Transaction importante",
          message: `${operation === "add" ? "Crédit" : "Débit"} admin de ${numericAmount.toLocaleString()} F pour ${user.fullName}`,
          type: "transaction",
          relatedId: userId,
        });
      }
      
      res.json({ message: "Solde modifié avec succès", newBalance });
    } catch (error) {
      console.error("Modify balance error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      if (user.role === "admin") {
        return res.status(400).json({ message: "Impossible de supprimer un administrateur" });
      }
      
      await storage.deleteUser(userId);
      
      await storage.createAuditLog({
        userId: req.session.userId,
        action: "user_deleted",
        details: `Utilisateur supprimé: ${user.email} (${user.fullName})`,
        ipAddress: req.ip,
      });
      
      res.json({ message: "Utilisateur supprimé" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Create admin notification for high-value transactions
  app.use(async (req, res, next) => {
    const originalSend = res.send.bind(res);
    res.send = function(body) {
      if (req.path.includes('/withdraw') && res.statusCode === 200) {
        try {
          const data = JSON.parse(body);
          if (data.request && parseFloat(data.request.amount) >= 60000) {
            storage.createAdminNotification({
              title: "Demande de retrait importante",
              message: `Retrait de ${parseFloat(data.request.amount).toLocaleString()} F demandé`,
              type: "withdrawal",
              relatedId: data.request.userId,
            });
          }
        } catch (e) {}
      }
      return originalSend(body);
    };
    next();
  });

  // Test email endpoint (admin only)
  app.post("/api/admin/test-email", requireAdmin, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email requis" });
      }
      
      const result = await sendWelcomeEmail(email, "Test User");
      
      if (result.success) {
        res.json({ message: "Email de test envoyé avec succès", success: true });
      } else {
        res.status(500).json({ message: result.error || "Échec de l'envoi", success: false });
      }
    } catch (error: any) {
      console.error("Test email error:", error);
      res.status(500).json({ message: error.message || "Erreur lors de l'envoi de l'email de test" });
    }
  });

  // ========== TELEGRAM BOT WEBHOOK ==========
  app.post("/api/webhook/telegram", async (req, res) => {
    try {
      const update = req.body;
      const message = update?.message || update?.edited_message;
      if (!message || !message.text) return res.json({ ok: true });

      const chatId = message.chat.id;
      const text = (message.text as string).trim();
      const command = text.split(" ")[0].toLowerCase().split("@")[0];

      if (command === "/stats") {
        try {
          const stats = await storage.getStats();
          const platformBalance = await storage.getPlatformBalance();
          const reply =
            `<b>📊 STATISTIQUES SENDAVAPAY</b>\n\n` +
            `<b>👥 Utilisateurs:</b> ${stats.totalUsers.toLocaleString("fr-FR")}\n` +
            `<b>💰 Depots:</b> ${parseFloat(stats.totalDeposits || "0").toLocaleString("fr-FR")} FCFA\n` +
            `<b>💸 Retraits:</b> ${parseFloat(stats.totalWithdrawals || "0").toLocaleString("fr-FR")} FCFA\n` +
            `<b>📈 Transactions:</b> ${stats.totalTransactionsCount} | ${parseFloat(stats.totalTransactionsAmount || "0").toLocaleString("fr-FR")} FCFA\n` +
            `<b>💼 Commissions:</b> ${parseFloat(stats.totalCommissions || "0").toLocaleString("fr-FR")} FCFA\n` +
            `<b>🏦 Solde plateforme:</b> ${parseFloat(platformBalance?.totalBalance || "0").toLocaleString("fr-FR")} FCFA`;
          await sendBotReply(chatId, reply);
        } catch {
          await sendBotReply(chatId, "❌ Impossible de récupérer les statistiques.");
        }

      } else if (command === "/ip") {
        try {
          const ipRes = await fetch("https://api.ipify.org");
          const ip = await ipRes.text();
          await sendBotReply(chatId, `<b>🌐 IP Serveur actuelle:</b> <code>${ip.trim()}</code>\n\nAjouter sur manager.winipayer.com → IPs whitelist (Payout)`);
        } catch {
          await sendBotReply(chatId, "❌ Impossible de récupérer l'IP du serveur.");
        }

      } else if (command === "/help") {
        const help =
          `<b>🤖 Commandes SendavaPay Bot</b>\n\n` +
          `/stats — Statistiques en temps réel\n` +
          `/ip — IP actuelle du serveur\n` +
          `/help — Liste des commandes\n\n` +
          `Alertes automatiques actives:\n` +
          `• Nouveaux utilisateurs\n` +
          `• Dépôts\n` +
          `• Paiements reçus\n` +
          `• Demandes & traitements de retrait\n` +
          `• KYC soumis\n` +
          `• Retrait partenaire\n` +
          `• Gros montants (≥500 000 FCFA)\n` +
          `• Connexion admin\n` +
          `• Erreurs système critiques\n` +
          `• Rapport quotidien (minuit)`;
        await sendBotReply(chatId, help);
      }

      res.json({ ok: true });
    } catch (error) {
      console.error("Telegram webhook error:", error);
      res.json({ ok: true });
    }
  });

  return httpServer;
}
