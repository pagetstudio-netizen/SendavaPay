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
import { registerObjectStorageRoutes, ObjectStorageService } from "./replit_integrations/object_storage";
import { 
  sendWelcomeEmail, 
  sendPaymentReceivedEmail, 
  sendWithdrawalEmail,
  sendKycApprovedEmail,
  sendKycRejectedEmail,
  sendTransferReceivedEmail,
  sendDepositEmail
} from "./email";

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

  // Register object storage routes for permanent file storage
  registerObjectStorageRoutes(app);

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
      const baseUrl = "https://smart-glass.fun";
      
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
      
      // Filter out services that are in maintenance
      const availableServices = services.map(service => {
        const operator = operators.find(op => op.code === service.id.toString());
        const inMaintenance = operator?.inMaintenance ?? false;
        return {
          ...service,
          inMaintenance,
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
            inMaintenance: op.inMaintenance ?? false,
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

  // Dépôt via SoleasPay
  app.post("/api/deposit-soleaspay", requireAuth, async (req, res) => {
    try {
      const { amount, serviceId, phoneNumber } = req.body;
      const numericAmount = parseFloat(amount);

      if (isNaN(numericAmount) || numericAmount < 100) {
        return res.status(400).json({ message: "Montant minimum: 100" });
      }

      if (!serviceId || !phoneNumber) {
        return res.status(400).json({ message: "Service et numéro de téléphone requis" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      const service = getServiceById(parseInt(serviceId));
      if (!service) {
        return res.status(400).json({ message: "Service non trouvé" });
      }

      // Check if operator is in maintenance
      const operators = await storage.getOperators();
      const operator = operators.find(op => op.code === serviceId.toString());
      if (operator?.inMaintenance) {
        return res.status(400).json({ message: "Ce moyen de paiement est actuellement en maintenance" });
      }

      const orderId = `DEP-${Date.now()}-${req.session.userId}`;
      const baseUrl = "https://smart-glass.fun";

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
      });

      if (!result.success) {
        console.error("❌ SoleasPay error:", result.message);
        return res.status(500).json({ message: result.message || "Erreur lors du paiement" });
      }

      const payId = result.data?.reference || orderId;

      // Stocker le paiement en attente
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

      res.json({ 
        success: true,
        payId,
        orderId,
        status: result.status,
        message: result.message || "Paiement initié. Veuillez confirmer sur votre téléphone.",
      });
    } catch (error) {
      console.error("SoleasPay deposit error:", error);
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
        // Paiement confirmé - créditer le compte
        const amount = result.data?.amount || (existingPayment ? parseFloat(existingPayment.amount) : 0);
        
        if (existingPayment && existingPayment.userId) {
          // Vérifier idempotence
          const existingTransactions = await storage.getTransactions(existingPayment.userId);
          const alreadyProcessed = existingTransactions.some(
            (t: { externalRef: string | null; status: string }) => t.externalRef === payId && t.status === "completed"
          );

          if (alreadyProcessed) {
            console.log("⚠️ Transaction déjà traitée, pas de double crédit");
            return res.json({ 
              status: "SUCCESS", 
              message: "Paiement déjà traité",
              amount
            });
          }

          // Calculer les frais
          const settings = await storage.getCommissionSettings();
          const commissionRate = parseFloat(settings?.depositRate || "7");
          const fee = Math.round(amount * (commissionRate / 100));
          const netAmount = amount - fee;

          // Mettre à jour le paiement
          await storage.updateLeekpayPayment(payId, {
            status: "completed",
            webhookReceived: true,
            completedAt: new Date(),
          });

          // Créer la transaction
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

          // Envoyer email de confirmation de dépôt
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
      const { linkCode, amount, serviceId, phoneNumber, payerName, payerEmail } = req.body;
      const numericAmount = parseFloat(amount);

      if (!linkCode || !serviceId || !phoneNumber || !payerName) {
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

      const orderId = `PAY-${linkCode}-${Date.now()}`;
      const baseUrl = "https://smart-glass.fun";

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
      });

      if (!result.success) {
        console.error("❌ SoleasPay pay-link error:", result.message);
        return res.status(500).json({ message: result.message || "Erreur lors du paiement" });
      }

      const payId = result.data?.reference || orderId;

      // Stocker le paiement en attente
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

      res.json({ 
        success: true,
        payId,
        orderId,
        status: result.status,
        message: result.message || "Paiement initié. Veuillez confirmer sur votre téléphone.",
      });
    } catch (error) {
      console.error("SoleasPay pay-link error:", error);
      res.status(500).json({ message: "Erreur lors du paiement" });
    }
  });

  // Vérifier paiement de lien SoleasPay (pour créditer le vendeur)
  app.get("/api/verify-link-soleaspay/:orderId/:payId", async (req, res) => {
    try {
      const { orderId, payId } = req.params;

      console.log(`🔍 SoleasPay: Vérification paiement lien orderId=${orderId}, payId=${payId}`);

      const result = await soleaspay.verifyPayment(orderId, payId);

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
        
        if (existingPayment && existingPayment.paymentLinkId) {
          const link = await storage.getPaymentLink(existingPayment.paymentLinkId);
          if (!link) {
            return res.status(404).json({ message: "Lien de paiement non trouvé" });
          }

          // Vérifier idempotence
          const existingTransactions = await storage.getTransactions(link.userId);
          const alreadyProcessed = existingTransactions.some(
            (t: { externalRef: string | null; status: string }) => t.externalRef === payId && t.status === "completed"
          );

          if (alreadyProcessed) {
            console.log("⚠️ Transaction déjà traitée");
            return res.json({ 
              status: "SUCCESS", 
              message: "Paiement déjà traité",
              amount
            });
          }

          // Calculer les frais
          const settings = await storage.getCommissionSettings();
          const commissionRate = parseFloat(settings?.depositRate || "7");
          const fee = Math.round(amount * (commissionRate / 100));
          const netAmount = amount - fee;

          // Mettre à jour le paiement et le lien
          await storage.updateLeekpayPayment(payId, {
            status: "completed",
            webhookReceived: true,
            completedAt: new Date(),
          });

          await storage.updatePaymentLink(link.id, {
            paidAt: new Date(),
            paidAmount: amount.toString(),
          });

          // Créer la transaction avec les informations du payeur
          await storage.createTransaction({
            userId: link.userId,
            type: "payment_received",
            amount: amount.toString(),
            fee: fee.toString(),
            netAmount: netAmount.toString(),
            status: "completed",
            description: `Paiement reçu - ${link.title}`,
            externalRef: payId,
            paymentMethod: existingPayment.paymentMethod || "soleaspay",
            mobileNumber: existingPayment.payerPhone,
            payerName: existingPayment.payerName,
            payerEmail: existingPayment.customerEmail,
            payerCountry: existingPayment.payerCountry,
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
        const numAmount = parseFloat(amount) || parseFloat(payment.amount);
        
        // Calculer les frais
        const settings = await storage.getCommissionSettings();
        const commissionRate = parseFloat(settings?.depositRate || "7");
        const fee = Math.round(numAmount * (commissionRate / 100));
        const netAmount = numAmount - fee;

        await storage.updateLeekpayPayment(reference, {
          status: "completed",
          webhookReceived: true,
          completedAt: new Date(),
        });

        if (payment.type === "deposit" && payment.userId) {
          await storage.createTransaction({
            userId: payment.userId,
            type: "deposit",
            amount: numAmount.toString(),
            fee: fee.toString(),
            netAmount: netAmount.toString(),
            status: "completed",
            description: payment.description || "Dépôt via SoleasPay",
            externalRef: reference,
            paymentMethod: payment.paymentMethod || "soleaspay",
          });

          await storage.updateUserBalance(payment.userId, netAmount.toString());
          console.log(`✅ SoleasPay webhook: Dépôt confirmé utilisateur #${payment.userId}: ${netAmount}`);
        } else if (payment.type === "payment_link" && payment.paymentLinkId) {
          const link = await storage.getPaymentLink(payment.paymentLinkId);
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
              paymentMethod: payment.paymentMethod || "soleaspay",
              mobileNumber: payment.payerPhone,
              payerName: payment.payerName,
              payerEmail: payment.customerEmail,
              payerCountry: payment.payerCountry,
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

      // LeekPay confirme que le paiement est complété - on peut créditer
      console.log("LeekPay confirmed payment completed, crediting user...");
      
      const settings = await storage.getCommissionSettings();
      const commissionRate = parseFloat(settings?.depositRate || "7");
      const amount = parseFloat(leekpayPayment.amount);
      const fee = Math.round(amount * (commissionRate / 100));
      const netAmount = amount - fee;

      // Mettre à jour le paiement LeekPay
      await storage.updateLeekpayPayment(paymentId, {
        status: "completed",
        webhookReceived: true,
        completedAt: new Date(),
      });

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

      // 1. Chercher dans notre base de données
      let leekpayPayment = await storage.getLeekpayPaymentById(reference);
      
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

      // 3. Vérifier le statut auprès de LeekPay API
      console.log("📡 Appel API LeekPay pour vérifier:", reference);
      const statusResult = await leekpay.getPaymentStatus(reference);
      console.log("📡 Réponse LeekPay:", JSON.stringify(statusResult));
      
      if (!statusResult.success) {
        console.log("⚠️ API LeekPay indisponible ou référence inconnue");
        return res.json({ 
          status: "pending", 
          message: "Vérification en cours. Veuillez patienter..." 
        });
      }

      const leekpayStatus = statusResult.data?.status;
      const leekpayAmount = statusResult.data?.amount;
      console.log("📊 Statut LeekPay:", leekpayStatus, "Montant:", leekpayAmount);
      
      // 4. Si le paiement n'est pas encore complété
      if (leekpayStatus !== "completed") {
        if (leekpayPayment && leekpayStatus && leekpayStatus !== leekpayPayment.status) {
          await storage.updateLeekpayPayment(reference, { status: leekpayStatus as any });
        }
        return res.json({ 
          status: leekpayStatus || "pending", 
          message: leekpayStatus === "failed" ? "Le paiement a échoué." : "Paiement en cours de traitement..." 
        });
      }

      // 5. LeekPay confirme le paiement - créditer le compte
      console.log("✅ LeekPay confirme le paiement, traitement en cours...");
      
      const settings = await storage.getCommissionSettings();
      const commissionRate = parseFloat(settings?.depositRate || "7");
      const amount = leekpayAmount || (leekpayPayment ? parseFloat(leekpayPayment.amount) : 0);
      const fee = Math.round(amount * (commissionRate / 100));
      const netAmount = amount - fee;

      // Si on a un paiement dans notre base
      if (leekpayPayment) {
        // Idempotence: Mettre à jour le statut immédiatement avant de créditer
        // Si le statut était déjà "completed", on ne crédite pas à nouveau
        await storage.updateLeekpayPayment(reference, {
          status: "completed",
          webhookReceived: true,
          completedAt: new Date(),
        });

        // Vérifier si une transaction existe déjà avec cette référence
        const existingTransactions = await storage.getTransactions(
          leekpayPayment.userId || 0
        );
        const alreadyProcessed = existingTransactions.some(
          (t: { externalRef: string | null; status: string }) => t.externalRef === reference && t.status === "completed"
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
            externalRef: reference,
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
              externalRef: reference,
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

      if (isNaN(numericAmount) || numericAmount < 500) {
        return res.status(400).json({ message: "Montant minimum: 500 XOF" });
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
      
      if (selectedOperator.inMaintenance) {
        return res.status(400).json({ message: "Ce moyen de paiement est actuellement en maintenance" });
      }

      if (!mobileNumber) {
        return res.status(400).json({ message: "Veuillez entrer un numéro de téléphone" });
      }

      const settings = await storage.getCommissionSettings();
      const commissionRate = parseFloat(settings?.withdrawalRate || "7");
      const fee = Math.round(numericAmount * (commissionRate / 100));
      const netAmount = numericAmount - fee;

      // Débiter le solde immédiatement (en attente de validation admin)
      const newBalance = balance - numericAmount;
      await storage.setUserBalance(req.session.userId!, newBalance.toString());
      
      console.log("💸 Withdrawal request - Country:", selectedCountry.code, "Operator:", paymentMethod);
      console.log("💸 Balance debited immediately:", numericAmount, "New balance:", newBalance);

      // Créer la demande de retrait avec statut "pending" pour validation admin
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

      res.json({ 
        message: "Votre demande de retrait a été soumise. Un administrateur la traitera dans les plus brefs délais.",
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

      // Si en cours de traitement et qu'on a une référence externe, vérifier le statut
      if (withdrawalRequest.status === "processing" && withdrawalRequest.externalReference) {
        console.log("🔍 Vérification du statut de retrait:", withdrawalRequest.externalReference);
        
        const transactionDetails = await soleaspay.getTransactionDetails(withdrawalRequest.externalReference);
        
        if (transactionDetails) {
          console.log("📊 Statut SoleasPay:", transactionDetails.status);
          
          if (transactionDetails.status === "SUCCESS") {
            // Débiter le solde maintenant
            const user = await storage.getUser(withdrawalRequest.userId);
            if (user) {
              const balance = parseFloat(user.balance);
              const amount = parseFloat(withdrawalRequest.amount);
              const newBalance = balance - amount;
              await storage.setUserBalance(withdrawalRequest.userId, newBalance.toString());
            }
            
            // Mettre à jour le statut
            await storage.updateWithdrawalRequest(requestId, {
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
              externalRef: withdrawalRequest.externalReference,
            });

            return res.json({
              status: "approved",
              message: "Retrait effectué avec succès!",
              request: { ...withdrawalRequest, status: "approved" },
            });
          } else if (transactionDetails.status === "FAILED" || transactionDetails.status === "REJECTED") {
            // Marquer comme échec sans débiter
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
          
          // Toujours en cours
          return res.json({
            status: "processing",
            message: "Retrait en cours de traitement...",
            request: withdrawalRequest,
          });
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
      
      // Upload to Object Storage for permanent storage
      const objectStorageService = new ObjectStorageService();
      try {
        const { uploadURL, objectPath } = await objectStorageService.getObjectEntityUploadURLWithPath();
        const fileBuffer = fs.readFileSync(req.file.path);
        
        const uploadResponse = await fetch(uploadURL, {
          method: "PUT",
          body: fileBuffer,
          headers: { "Content-Type": req.file.mimetype },
        });
        
        if (uploadResponse.ok) {
          // Clean up local file
          fs.unlinkSync(req.file.path);
          console.log("Product image uploaded to Object Storage:", objectPath);
          res.json({ imageUrl: objectPath });
          return;
        } else {
          const errorText = await uploadResponse.text();
          console.error("Object storage upload failed:", uploadResponse.status, errorText);
        }
      } catch (storageError: any) {
        console.error("Object storage error:", storageError?.message || storageError);
      }
      
      // Fallback to local storage if Object Storage fails
      console.log("Using local storage fallback for product image");
      const imageUrl = `/uploads/products/${req.file.filename}`;
      res.json({ imageUrl, fallback: true });
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
      // Get the user who created this API transaction
      const user = await storage.getUser(transaction.userId);
      res.json({
        ...transaction,
        ownerName: user?.fullName || "SendavaPay",
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

      // Update transaction with customer info
      await storage.updateApiTransaction(transaction.id, {
        customerName: payerName,
        customerPhone: payerPhone,
        customerEmail: payerEmail,
        paymentMethod: service.operator,
        status: "processing",
      });

      // Generate unique order ID for this payment
      const orderId = `API_${transaction.reference}_${Date.now()}`;

      // Initiate SoleasPay payment
      const payResult = await soleaspay.collectPayment({
        wallet: payerPhone,
        amount,
        currency,
        orderId,
        description: transaction.description || `Paiement API ${transaction.reference}`,
        payer: payerName,
        payerEmail: payerEmail || "",
        serviceId: parseInt(serviceId),
      });

      if (!payResult.success || !payResult.data) {
        await storage.updateApiTransaction(transaction.id, { status: "failed" });
        return res.status(400).json({ message: payResult.message || "Erreur de paiement" });
      }

      // Extract payId from response data
      const payId = payResult.data.reference || payResult.data.external_reference || "";
      
      if (!payId) {
        await storage.updateApiTransaction(transaction.id, { status: "failed" });
        return res.status(400).json({ message: "Réponse invalide du service de paiement" });
      }

      // Persist orderId and payId to the transaction for verification
      await storage.updateApiTransaction(transaction.id, {
        externalReference: `${orderId}|${payId}`,
      });

      res.json({
        success: true,
        payId: payId,
        orderId: orderId,
        message: "Veuillez confirmer le paiement sur votre téléphone",
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

      const verifyResult = await soleaspay.verifyPayment(orderId, payId);

      console.log(`🔍 SoleasPay API verify: orderId=${orderId}, payId=${payId}, result=`, JSON.stringify(verifyResult));

      if (verifyResult.success && verifyResult.status === "SUCCESS") {
        // Credit the API owner's balance
        const amount = verifyResult.data?.amount || parseFloat(transaction.amount);
        const commissionSettings = await storage.getCommissionSettings();
        const feeRate = parseFloat(commissionSettings?.depositRate || "7");
        const fee = (amount * feeRate) / 100;
        const netAmount = amount - fee;

        // Update transaction status with fee
        await storage.updateApiTransaction(transaction.id, {
          status: "completed",
          completedAt: new Date(),
          externalReference: payId,
          fee: fee.toString(),
        });

        await storage.updateUserBalance(transaction.userId, netAmount.toString());

        // Create transaction record for the user
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
      res.json(link);
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
      const baseUrl = "https://smart-glass.fun";

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
      const commissionRate = parseFloat(settings?.depositRate || "7");
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

      const { name, webhookUrl } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Nom requis" });
      }

      const crypto = await import("crypto");
      const webhookSecret = webhookUrl ? `whsec_${crypto.randomBytes(24).toString("hex")}` : undefined;

      const key = await storage.createApiKey({
        userId: req.session.userId!,
        name,
        redirectUrl: null,
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

      const { fullName, email, phone, country, documentType } = req.body;

      // Helper function to upload file to Object Storage with local fallback
      const uploadToStorage = async (file: Express.Multer.File): Promise<string> => {
        try {
          const objectStorageService = new ObjectStorageService();
          const { uploadURL, objectPath } = await objectStorageService.getObjectEntityUploadURLWithPath();
          const fileBuffer = fs.readFileSync(file.path);
          
          const uploadResponse = await fetch(uploadURL, {
            method: "PUT",
            body: fileBuffer,
            headers: { "Content-Type": file.mimetype },
          });
          
          if (uploadResponse.ok) {
            fs.unlinkSync(file.path);
            console.log("KYC file uploaded to Object Storage:", objectPath);
            return objectPath;
          }
          
          const errorText = await uploadResponse.text();
          console.error("Object storage upload failed:", uploadResponse.status, errorText);
        } catch (storageError: any) {
          console.error("Object storage error:", storageError?.message || storageError);
        }
        
        // Fallback to local storage - use consistent URL format
        console.log("Using local storage fallback for KYC file:", file.filename);
        return `/uploads/kyc/${file.filename}`;
      };

      // Upload all files to Object Storage (with local fallback)
      const [documentFrontPath, documentBackPath, selfiePath] = await Promise.all([
        uploadToStorage(files.documentFront[0]),
        uploadToStorage(files.documentBack[0]),
        uploadToStorage(files.selfie[0]),
      ]);

      const kyc = await storage.createKycRequest({
        userId: req.session.userId!,
        fullName,
        email,
        phone,
        country,
        documentType,
        documentFrontPath,
        documentBackPath,
        selfiePath,
      });

      res.json(kyc);
    } catch (error) {
      console.error("Submit KYC error:", error);
      res.status(500).json({ message: "Erreur lors de la soumission" });
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
      res.json(settings || { depositRate: "7", withdrawalRate: "7" });
    } catch (error) {
      console.error("Get commissions error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.put("/api/admin/commissions", requireAdmin, async (req, res) => {
    try {
      const { depositRate, withdrawalRate } = req.body;
      const settings = await storage.updateCommissionSettings(
        depositRate,
        withdrawalRate,
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
      res.json(keys.map(k => ({
        ...k,
        apiKey: undefined,
        keyPrefix: k.apiKey.substring(0, 12),
      })));
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

  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getCommissionSettings();
      res.json(settings || { depositRate: "7", withdrawalRate: "7" });
    } catch (error) {
      console.error("Get admin settings error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const { depositRate, withdrawalRate } = req.body;
      const settings = await storage.updateCommissionSettings(
        depositRate || "7",
        withdrawalRate || "7",
        req.session.userId!
      );
      res.json(settings);
    } catch (error) {
      console.error("Update admin settings error:", error);
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
      const commissionRate = parseFloat(settings?.depositRate || "7");
      const amount = parseFloat(leekpayPayment.amount);
      const fee = Math.round(amount * (commissionRate / 100));
      const netAmount = amount - fee;

      // Update LeekPay payment status
      await storage.updateLeekpayPayment(leekpayPaymentId, {
        status: "completed",
        webhookReceived: true,
        completedAt: new Date(),
      });

      if (leekpayPayment.type === "deposit" && leekpayPayment.userId) {
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
          const commissionRate = parseFloat(settings?.depositRate || "7");
          const amount = paymentAmount || parseFloat(leekpayPayment.amount);
          const fee = Math.round(amount * (commissionRate / 100));
          const netAmount = amount - fee;

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
            
            console.log(`✅ Paiement confirmé pour utilisateur #${leekpayPayment.userId}: référence=${paymentReference}, montant=${netAmount} ${paymentCurrency}`);
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
          const commissionRate = parseFloat(settings?.depositRate || "7");
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

  app.post("/api/admin/operators", requireAdmin, async (req, res) => {
    try {
      const { countryId, name, code, isActive, type, dailyLimit, paymentGateway, inMaintenance } = req.body;
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

  return httpServer;
}
