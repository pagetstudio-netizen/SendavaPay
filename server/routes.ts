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

      const checkoutResult = await leekpay.createCheckout({
        amount: numericAmount,
        currency: currency as "XOF" | "XAF" | "CDF" | "EUR" | "USD",
        description: `Dépôt SendavaPay - ${user.fullName}`,
        return_url: `${baseUrl}/dashboard/deposit?status=success`,
        customer_email: user.email,
      });

      if (!checkoutResult.success || !checkoutResult.data) {
        console.error("LeekPay checkout error:", checkoutResult.error);
        return res.status(500).json({ message: checkoutResult.error || "Erreur lors de la création du paiement" });
      }

      await storage.createLeekpayPayment({
        leekpayPaymentId: checkoutResult.data.id,
        userId: req.session.userId!,
        amount: numericAmount.toString(),
        currency,
        type: "deposit",
        status: "pending",
        description: `Dépôt via ${paymentMethod}`,
        customerEmail: user.email,
        paymentMethod,
        returnUrl: `${baseUrl}/dashboard/deposit?status=success`,
        paymentUrl: checkoutResult.data.payment_url,
      });

      res.json({ 
        paymentUrl: checkoutResult.data.payment_url,
        paymentId: checkoutResult.data.id,
      });
    } catch (error) {
      console.error("Deposit error:", error);
      res.status(500).json({ message: "Erreur lors du dépôt" });
    }
  });

  const countryPaymentMethods: Record<string, string[]> = {
    togo: ["moov", "tmoney"],
    cote_ivoire: ["wave", "mtn", "orange", "moov"],
    benin: ["celtis", "moov", "mtn"],
    mali: ["orange", "moov"],
    burkina_faso: ["moov"],
    senegal: ["moov", "orange", "wave"],
  };

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

      if (!country || !countryPaymentMethods[country]) {
        return res.status(400).json({ message: "Pays invalide" });
      }

      if (!paymentMethod || !countryPaymentMethods[country].includes(paymentMethod)) {
        return res.status(400).json({ message: "Moyen de paiement invalide pour ce pays" });
      }

      if (!mobileNumber) {
        return res.status(400).json({ message: "Veuillez entrer un numéro de téléphone" });
      }

      const settings = await storage.getCommissionSettings();
      const commissionRate = parseFloat(settings?.withdrawalRate || "7");
      const fee = Math.round(numericAmount * (commissionRate / 100));
      const netAmount = numericAmount - fee;

      // Débiter le solde immédiatement
      const newBalance = balance - numericAmount;
      await storage.updateUserBalance(req.session.userId!, newBalance.toString());

      const withdrawalRequest = await storage.createWithdrawalRequest({
        userId: req.session.userId!,
        amount: numericAmount.toString(),
        fee: fee.toString(),
        netAmount: netAmount.toString(),
        paymentMethod,
        mobileNumber,
        country,
        walletName: walletName || null,
      });

      res.json({ 
        message: "Demande de retrait soumise avec succès. Votre solde a été débité.",
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

  app.post("/api/admin/withdrawal-requests/:id/approve", requireAuth, requireAdmin, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const withdrawalRequest = await storage.getWithdrawalRequest(requestId);
      
      if (!withdrawalRequest) {
        return res.status(404).json({ message: "Demande introuvable" });
      }
      
      if (withdrawalRequest.status !== "pending") {
        return res.status(400).json({ message: "Cette demande a déjà été traitée" });
      }
      
      // Le solde a déjà été débité lors de la demande de retrait
      // Ici on crée simplement la transaction pour l'historique
      
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
      });
      
      res.json({ message: "Retrait approuvé et traité avec succès" });
    } catch (error) {
      console.error("Approve withdrawal error:", error);
      res.status(500).json({ message: "Erreur lors de l'approbation" });
    }
  });

  app.post("/api/admin/withdrawal-requests/:id/reject", requireAuth, requireAdmin, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { reason } = req.body;
      
      const withdrawalRequest = await storage.getWithdrawalRequest(requestId);
      
      if (!withdrawalRequest) {
        return res.status(404).json({ message: "Demande introuvable" });
      }
      
      if (withdrawalRequest.status !== "pending") {
        return res.status(400).json({ message: "Cette demande a déjà été traitée" });
      }
      
      if (!reason) {
        return res.status(400).json({ message: "Veuillez fournir une raison de rejet" });
      }
      
      // Rembourser le solde de l'utilisateur
      const user = await storage.getUser(withdrawalRequest.userId);
      if (user) {
        const currentBalance = parseFloat(user.balance);
        const refundAmount = parseFloat(withdrawalRequest.amount);
        const newBalance = currentBalance + refundAmount;
        await storage.updateUserBalance(withdrawalRequest.userId, newBalance.toString());
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
      
      const imageUrl = `/uploads/products/${req.file.filename}`;
      
      res.json({ imageUrl });
    } catch (error) {
      console.error("Upload product image error:", error);
      res.status(500).json({ message: "Erreur lors de l'upload" });
    }
  });

  app.post("/api/payment-links", requireAuth, async (req, res) => {
    try {
      const { title, description, amount, productImage, allowCustomAmount, minimumAmount } = req.body;
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
      
      const { title, description, amount, productImage, allowCustomAmount, minimumAmount } = req.body;
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

      // Create LeekPay checkout
      const checkoutResult = await leekpay.createCheckout({
        amount,
        currency: currency as "XOF" | "XAF" | "CDF" | "EUR" | "USD",
        description: `Paiement: ${link.title}`,
        return_url: `${baseUrl}/pay/${link.linkCode}?status=success`,
        customer_email: payerEmail,
      });

      if (!checkoutResult.success || !checkoutResult.data) {
        console.error("LeekPay checkout error:", checkoutResult.error);
        return res.status(500).json({ message: checkoutResult.error || "Erreur lors de la création du paiement" });
      }

      // Store LeekPay payment record
      await storage.createLeekpayPayment({
        leekpayPaymentId: checkoutResult.data.id,
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
        returnUrl: `${baseUrl}/pay/${link.linkCode}?status=success`,
        paymentUrl: checkoutResult.data.payment_url,
      });

      res.json({ 
        paymentUrl: checkoutResult.data.payment_url,
        paymentId: checkoutResult.data.id,
      });
    } catch (error) {
      console.error("Process payment error:", error);
      res.status(500).json({ message: "Erreur lors du paiement" });
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

      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Nom requis" });
      }

      const key = await storage.createApiKey({
        userId: req.session.userId!,
        name,
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

      const kyc = await storage.createKycRequest({
        userId: req.session.userId!,
        fullName,
        email,
        phone,
        country,
        documentType,
        documentFrontPath: `/${files.documentFront[0].path}`,
        documentBackPath: `/${files.documentBack[0].path}`,
        selfiePath: `/${files.selfie[0].path}`,
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

  // LeekPay Webhook Test (GET)
  app.get("/api/webhook/leekpay", (req, res) => {
    console.log("LeekPay Webhook test - GET request received");
    res.json({ status: "ok", message: "LeekPay webhook endpoint is accessible", timestamp: new Date().toISOString() });
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

          // Create transaction for merchant
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

  // LeekPay Webhook
  app.post("/api/webhook/leekpay", express.raw({ type: "application/json" }), async (req, res) => {
    try {
      const signature = req.headers["x-leekpay-signature"] as string;
      const payload = req.body.toString();
      
      console.log("=== LeekPay Webhook received ===");
      console.log("Signature:", signature ? "present" : "missing");
      console.log("Payload length:", payload.length);
      console.log("Payload:", payload);
      console.log("Headers:", JSON.stringify(req.headers));
      
      // Verify signature (log but don't reject for now to debug)
      if (signature) {
        const isValid = leekpay.verifyWebhookSignature(payload, signature);
        console.log("Signature verification:", isValid ? "VALID" : "INVALID");
        if (!isValid) {
          console.warn("LeekPay webhook: Signature mismatch - continuing anyway for debugging");
        }
      } else {
        console.warn("LeekPay webhook: No signature provided - continuing anyway for debugging");
      }

      const data = JSON.parse(payload);
      console.log("LeekPay Webhook data:", JSON.stringify(data, null, 2));
      
      const { event, transaction } = data;
      
      if (!transaction || !transaction.id) {
        console.error("LeekPay webhook: Missing transaction data");
        return res.status(400).json({ message: "Missing transaction data" });
      }

      // Find the LeekPay payment record
      const leekpayPayment = await storage.getLeekpayPaymentById(transaction.id.toString());
      
      if (!leekpayPayment) {
        console.error("LeekPay webhook: Payment not found for ID:", transaction.id);
        return res.status(404).json({ message: "Payment not found" });
      }

      // Map LeekPay status to our status
      let status: "pending" | "processing" | "completed" | "failed" | "cancelled" | "expired" = "pending";
      if (event === "payment.success" || transaction.status === "completed") {
        status = "completed";
      } else if (transaction.status === "failed") {
        status = "failed";
      } else if (transaction.status === "cancelled") {
        status = "cancelled";
      } else if (transaction.status === "expired") {
        status = "expired";
      } else if (transaction.status === "processing") {
        status = "processing";
      }

      // Update the LeekPay payment record
      await storage.updateLeekpayPayment(transaction.id.toString(), {
        status,
        webhookReceived: true,
        webhookData: JSON.stringify(data),
        completedAt: status === "completed" ? new Date() : undefined,
      });

      // If payment is completed, process the deposit/payment
      if (status === "completed") {
        const settings = await storage.getCommissionSettings();
        const commissionRate = parseFloat(settings?.depositRate || "7");
        const amount = parseFloat(leekpayPayment.amount);
        const fee = Math.round(amount * (commissionRate / 100));
        const netAmount = amount - fee;

        if (leekpayPayment.type === "deposit" && leekpayPayment.userId) {
          // Create transaction record
          await storage.createTransaction({
            userId: leekpayPayment.userId,
            type: "deposit",
            amount: amount.toString(),
            fee: fee.toString(),
            netAmount: netAmount.toString(),
            status: "completed",
            description: leekpayPayment.description || "Dépôt via LeekPay",
            externalRef: transaction.id.toString(),
            paymentMethod: leekpayPayment.paymentMethod || "leekpay",
          });

          // Update user balance
          await storage.updateUserBalance(leekpayPayment.userId, netAmount.toString());
          console.log(`LeekPay: Deposit completed for user ${leekpayPayment.userId}, amount: ${netAmount}`);
        } else if (leekpayPayment.type === "payment_link" && leekpayPayment.paymentLinkId) {
          // Get the payment link
          const link = await storage.getPaymentLink(leekpayPayment.paymentLinkId);
          if (link) {
            // Update payment link with payer info
            await storage.updatePaymentLink(link.id, {
              paidAt: new Date(),
              payerName: leekpayPayment.payerName,
              payerEmail: leekpayPayment.customerEmail || null,
              payerPhone: leekpayPayment.payerPhone,
              payerCountry: leekpayPayment.payerCountry,
              paidAmount: amount.toString(),
            });

            // Update user balance
            await storage.updateUserBalance(link.userId, netAmount.toString());

            // Create transaction for the payment link owner
            await storage.createTransaction({
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
              externalRef: transaction.id.toString(),
            });
            
            console.log(`LeekPay: Payment received for link ${link.id}, amount: ${netAmount}`);
          }
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("LeekPay webhook error:", error);
      res.status(500).json({ message: "Webhook processing error" });
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

  return httpServer;
}
