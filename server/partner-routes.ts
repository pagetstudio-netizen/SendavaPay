import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { partnerLoginSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

declare module "express-session" {
  interface SessionData {
    partnerId?: number;
  }
}

const partnerLogoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = "uploads/partners";
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
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error("Seules les images sont autorisées"));
  }
});

function generatePartnerApiKey(): string {
  return "pk_" + crypto.randomBytes(24).toString("hex");
}

function generatePartnerSecret(): string {
  return "ps_" + crypto.randomBytes(32).toString("hex");
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .substring(0, 30);
}

function requirePartnerAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.partnerId) {
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

export function registerPartnerRoutes(app: Express) {

  // ==========================================
  // PARTNER AUTH ROUTES
  // ==========================================

  app.post("/api/partner/login", async (req: Request, res: Response) => {
    try {
      const parsed = partnerLoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Données invalides" });
      }

      const partner = await storage.getPartnerByEmail(parsed.data.email);
      if (!partner) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }

      if (partner.status !== "active") {
        return res.status(403).json({ message: "Votre compte partenaire est désactivé" });
      }

      const validPassword = await bcrypt.compare(parsed.data.password, partner.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }

      req.session.partnerId = partner.id;

      await storage.updatePartner(partner.id, { lastLoginAt: new Date() });
      await storage.createPartnerLog({
        partnerId: partner.id,
        action: "login",
        details: "Connexion réussie",
        ipAddress: req.ip || req.socket.remoteAddress,
      });

      const { password, apiSecret, ...safePartner } = partner;
      res.json(safePartner);
    } catch (error: any) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/partner/logout", requirePartnerAuth, async (req: Request, res: Response) => {
    const partnerId = req.session.partnerId!;
    await storage.createPartnerLog({
      partnerId,
      action: "logout",
      details: "Déconnexion",
      ipAddress: req.ip || req.socket.remoteAddress,
    });
    req.session.partnerId = undefined;
    res.json({ message: "Déconnecté" });
  });

  app.get("/api/partner/me", requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const partner = await storage.getPartner(req.session.partnerId!);
      if (!partner) {
        return res.status(404).json({ message: "Partenaire introuvable" });
      }
      const { password, apiSecret, ...safePartner } = partner;
      res.json(safePartner);
    } catch (error: any) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/partner/profile", requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const partner = await storage.getPartner(req.session.partnerId!);
      if (!partner) {
        return res.status(404).json({ message: "Partenaire introuvable" });
      }
      const { password, ...partnerData } = partner;
      res.json(partnerData);
    } catch (error: any) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.patch("/api/partner/update-profile", requirePartnerAuth, partnerLogoUpload.single("logo"), async (req: Request, res: Response) => {
    try {
      const partnerId = req.session.partnerId!;
      const { name, phone, description, website, webhookUrl, callbackUrl, primaryColor } = req.body;
      
      const updates: any = {};
      if (name) updates.name = name;
      if (phone !== undefined) updates.phone = phone;
      if (description !== undefined) updates.description = description;
      if (website !== undefined) updates.website = website;
      if (webhookUrl !== undefined) updates.webhookUrl = webhookUrl;
      if (callbackUrl !== undefined) updates.callbackUrl = callbackUrl;
      if (primaryColor !== undefined) updates.primaryColor = primaryColor;
      if (req.file) {
        updates.logo = `/uploads/partners/${req.file.filename}`;
      }

      const updated = await storage.updatePartner(partnerId, updates);
      if (!updated) {
        return res.status(404).json({ message: "Partenaire introuvable" });
      }

      await storage.createPartnerLog({
        partnerId,
        action: "profile_update",
        details: `Profil mis à jour: ${Object.keys(updates).join(", ")}`,
        ipAddress: req.ip || req.socket.remoteAddress,
      });

      const { password, apiSecret, ...safePartner } = updated;
      res.json(safePartner);
    } catch (error: any) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/partner/change-password", requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const partnerId = req.session.partnerId!;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Mot de passe actuel et nouveau requis" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 6 caractères" });
      }

      const partner = await storage.getPartner(partnerId);
      if (!partner) return res.status(404).json({ message: "Partenaire non trouvé" });

      const validPassword = await bcrypt.compare(currentPassword, partner.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Mot de passe actuel incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updatePartner(partnerId, { password: hashedPassword });

      await storage.createPartnerLog({
        partnerId,
        action: "profile_update",
        details: "Mot de passe modifié",
        ipAddress: req.ip || req.socket.remoteAddress,
      });

      res.json({ message: "Mot de passe modifié avec succès" });
    } catch (error) {
      console.error("Partner change password error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/partner/stats", requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const partnerId = req.session.partnerId!;
      const transactions = await storage.getPartnerTransactions(partnerId);
      const logs = await storage.getPartnerLogs(partnerId);

      const completedTransactions = transactions.filter(t => t.status === "completed");
      const totalRevenue = completedTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const totalFees = completedTransactions.reduce((sum, t) => sum + parseFloat(t.fee), 0);
      const pendingCount = transactions.filter(t => t.status === "pending").length;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTransactions = completedTransactions.filter(t => new Date(t.createdAt) >= today);
      const todayRevenue = todayTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

      res.json({
        totalTransactions: transactions.length,
        completedTransactions: completedTransactions.length,
        pendingTransactions: pendingCount,
        totalRevenue: totalRevenue.toFixed(2),
        totalFees: totalFees.toFixed(2),
        todayRevenue: todayRevenue.toFixed(2),
        todayTransactions: todayTransactions.length,
        totalLogs: logs.length,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/partner/transactions", requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const transactions = await storage.getPartnerTransactions(req.session.partnerId!);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/partner/logs", requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const logs = await storage.getPartnerLogs(req.session.partnerId!);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/partner/regenerate-keys", requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const partnerId = req.session.partnerId!;
      const newApiKey = generatePartnerApiKey();
      const newApiSecret = generatePartnerSecret();
      
      const updated = await storage.updatePartner(partnerId, {
        apiKey: newApiKey,
        apiSecret: newApiSecret,
      });

      await storage.createPartnerLog({
        partnerId,
        action: "profile_update",
        details: "Clés API régénérées",
        ipAddress: req.ip || req.socket.remoteAddress,
      });

      res.json({ apiKey: newApiKey, apiSecret: newApiSecret });
    } catch (error: any) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ==========================================
  // SUPER ADMIN - PARTNER MANAGEMENT
  // ==========================================

  app.get("/api/admin/partners", requireAdmin, async (req: Request, res: Response) => {
    try {
      const allPartners = await storage.getAllPartners();
      const safePartners = allPartners.map(({ password, apiSecret, ...p }) => p);
      res.json(safePartners);
    } catch (error: any) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/admin/partners/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const partner = await storage.getPartner(parseInt(req.params.id));
      if (!partner) {
        return res.status(404).json({ message: "Partenaire introuvable" });
      }
      const { password, ...partnerData } = partner;
      res.json(partnerData);
    } catch (error: any) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/create-partner", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { name, email, password, phone, description, website, commissionRate, slug: customSlug } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: "Nom, email et mot de passe requis" });
      }

      const existing = await storage.getPartnerByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "Un partenaire avec cet email existe déjà" });
      }

      let slug = customSlug || generateSlug(name);
      const existingSlug = await storage.getPartnerBySlug(slug);
      if (existingSlug) {
        slug = slug + "_" + Date.now().toString(36);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const apiKey = generatePartnerApiKey();
      const apiSecret = generatePartnerSecret();

      const partner = await storage.createPartner({
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        slug,
        description: description || null,
        website: website || null,
        apiKey,
        apiSecret,
        commissionRate: commissionRate || "5",
        status: "active",
      });

      await storage.createPartnerLog({
        partnerId: partner.id,
        action: "system",
        details: "Compte partenaire créé par l'administrateur",
        ipAddress: req.ip || req.socket.remoteAddress,
      });

      const { password: _, apiSecret: __, ...safePartner } = partner;
      res.json({ ...safePartner, apiKey, apiSecret });
    } catch (error: any) {
      console.error("Error creating partner:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.patch("/api/admin/partners/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const partnerId = parseInt(req.params.id);
      const { name, email, phone, description, website, commissionRate, slug, status, password } = req.body;

      const updates: any = {};
      if (name) updates.name = name;
      if (email) updates.email = email;
      if (phone !== undefined) updates.phone = phone;
      if (description !== undefined) updates.description = description;
      if (website !== undefined) updates.website = website;
      if (commissionRate) updates.commissionRate = commissionRate;
      if (slug) {
        const existingSlug = await storage.getPartnerBySlug(slug);
        if (existingSlug && existingSlug.id !== partnerId) {
          return res.status(400).json({ message: "Ce slug est déjà utilisé" });
        }
        updates.slug = slug;
      }
      if (status) updates.status = status;
      if (password) {
        updates.password = await bcrypt.hash(password, 10);
      }

      const updated = await storage.updatePartner(partnerId, updates);
      if (!updated) {
        return res.status(404).json({ message: "Partenaire introuvable" });
      }

      const { password: _, apiSecret, ...safePartner } = updated;
      res.json(safePartner);
    } catch (error: any) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/partners/:id/toggle", requireAdmin, async (req: Request, res: Response) => {
    try {
      const partnerId = parseInt(req.params.id);
      const partner = await storage.getPartner(partnerId);
      if (!partner) {
        return res.status(404).json({ message: "Partenaire introuvable" });
      }

      const newStatus = partner.status === "active" ? "inactive" : "active";
      const updated = await storage.updatePartner(partnerId, { status: newStatus });

      await storage.createPartnerLog({
        partnerId,
        action: "system",
        details: `Statut changé à ${newStatus} par l'administrateur`,
        ipAddress: req.ip || req.socket.remoteAddress,
      });

      const { password, apiSecret, ...safePartner } = updated!;
      res.json(safePartner);
    } catch (error: any) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/admin/partners/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const partnerId = parseInt(req.params.id);
      await storage.deletePartner(partnerId);
      res.json({ message: "Partenaire supprimé" });
    } catch (error: any) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/admin/partners/:id/logs", requireAdmin, async (req: Request, res: Response) => {
    try {
      const logs = await storage.getPartnerLogs(parseInt(req.params.id));
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/admin/partners/:id/transactions", requireAdmin, async (req: Request, res: Response) => {
    try {
      const transactions = await storage.getPartnerTransactions(parseInt(req.params.id));
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ==========================================
  // PUBLIC PARTNER PAGE
  // ==========================================

  app.get("/api/partner-page/:slug", async (req: Request, res: Response) => {
    try {
      const partner = await storage.getPartnerBySlug(req.params.slug);
      if (!partner || partner.status !== "active") {
        return res.status(403).json({ message: "Accès non autorisé" });
      }

      res.json({
        name: partner.name,
        slug: partner.slug,
        logo: partner.logo,
        description: partner.description,
        website: partner.website,
        primaryColor: partner.primaryColor,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ==========================================
  // PARTNER SDK API (for external integrations)
  // ==========================================

  async function requirePartnerApiKey(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers["x-api-key"] as string || req.headers["x-partner-key"] as string || req.query.api_key as string;
    const signature = req.headers["x-signature"] as string;
    const apiSecret = req.headers["x-partner-secret"] as string || req.query.api_secret as string;

    if (!apiKey) {
      return res.status(401).json({ success: false, message: "Clé API manquante (x-api-key)" });
    }

    const partner = await storage.getPartnerByApiKey(apiKey);
    if (!partner) {
      await storage.createPartnerLog({
        partnerId: 0,
        action: "error",
        details: `Tentative d'accès SDK avec clé invalide: ${apiKey}`,
        ipAddress: req.ip || req.socket.remoteAddress,
      }).catch(() => {});
      return res.status(401).json({ success: false, message: "Clé API invalide" });
    }

    if (signature) {
      const timestamp = req.headers["x-timestamp"] as string;
      if (timestamp) {
        const requestTime = parseInt(timestamp, 10);
        const now = Math.floor(Date.now() / 1000);
        if (isNaN(requestTime) || Math.abs(now - requestTime) > 300) {
          return res.status(401).json({ success: false, message: "Requête expirée (timestamp invalide ou trop ancien)" });
        }
      }

      const payload = req.method === "GET" ? JSON.stringify(req.query || {}) : JSON.stringify(req.body || {});
      const signatureData = timestamp ? `${timestamp}.${payload}` : payload;
      const expectedSignature = crypto.createHmac("sha256", partner.apiSecret).update(signatureData).digest("hex");
      if (signature !== expectedSignature) {
        await storage.createPartnerLog({
          partnerId: partner.id,
          action: "error",
          details: `Signature HMAC invalide sur ${req.method} ${req.path}`,
          ipAddress: req.ip || req.socket.remoteAddress,
        });
        return res.status(401).json({ success: false, message: "Signature HMAC invalide" });
      }
    } else if (apiSecret) {
      if (partner.apiSecret !== apiSecret) {
        return res.status(401).json({ success: false, message: "Secret API invalide" });
      }
    } else {
      return res.status(401).json({ success: false, message: "Authentification requise (x-signature ou x-partner-secret)" });
    }

    if (partner.status !== "active") {
      return res.status(403).json({ success: false, message: "Compte partenaire désactivé" });
    }

    (req as any).partner = partner;
    next();
  }

  app.post("/api/sdk/create-payment", requirePartnerApiKey, async (req: Request, res: Response) => {
    try {
      const partner = (req as any).partner;
      const { amount, currency, customerName, customerEmail, customerPhone, description, callbackUrl, redirectUrl, metadata } = req.body;

      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ success: false, message: "Montant invalide" });
      }

      const reference = "PTR_" + uuidv4().replace(/-/g, "").substring(0, 16).toUpperCase();
      const fee = (parseFloat(amount) * parseFloat(partner.commissionRate) / 100).toFixed(2);

      const transaction = await storage.createPartnerTransaction({
        partnerId: partner.id,
        reference,
        amount: amount.toString(),
        fee,
        currency: currency || "XOF",
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        description: description || null,
        callbackUrl: callbackUrl || partner.callbackUrl || null,
        redirectUrl: redirectUrl || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      });

      await storage.createPartnerLog({
        partnerId: partner.id,
        action: "api_call",
        details: `Paiement créé: ${reference} - ${amount} ${currency || "XOF"}`,
        ipAddress: req.ip || req.socket.remoteAddress,
      });

      res.json({
        success: true,
        status: "PENDING",
        txid: transaction.reference,
        reference: transaction.reference,
        amount: transaction.amount,
        fee: transaction.fee,
        currency: transaction.currency,
        message: "Paiement créé avec succès",
        paymentUrl: `/pay/partner/${transaction.reference}`,
      });
    } catch (error: any) {
      console.error("SDK create payment error:", error);
      res.status(500).json({ success: false, status: "ERROR", message: "Erreur serveur" });
    }
  });

  app.post("/api/sdk/payment", requirePartnerApiKey, async (req: Request, res: Response) => {
    try {
      const partner = (req as any).partner;
      const { amount, currency, customerName, customerEmail, customerPhone, description, callbackUrl, redirectUrl, metadata } = req.body;

      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ success: false, status: "ERROR", message: "Montant invalide" });
      }

      const reference = "PTR_" + uuidv4().replace(/-/g, "").substring(0, 16).toUpperCase();
      const fee = (parseFloat(amount) * parseFloat(partner.commissionRate) / 100).toFixed(2);

      const transaction = await storage.createPartnerTransaction({
        partnerId: partner.id,
        reference,
        amount: amount.toString(),
        fee,
        currency: currency || "XOF",
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        description: description || null,
        callbackUrl: callbackUrl || partner.callbackUrl || null,
        redirectUrl: redirectUrl || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      });

      await storage.createPartnerLog({
        partnerId: partner.id,
        action: "api_call",
        details: `SDK Paiement: ${reference} - ${amount} ${currency || "XOF"}`,
        ipAddress: req.ip || req.socket.remoteAddress,
      });

      res.json({
        success: true,
        status: "PENDING",
        txid: transaction.reference,
        reference: transaction.reference,
        amount: transaction.amount,
        fee: transaction.fee,
        currency: transaction.currency,
        message: "Paiement créé avec succès",
        paymentUrl: `/pay/partner/${transaction.reference}`,
      });
    } catch (error: any) {
      console.error("SDK payment error:", error);
      res.status(500).json({ success: false, status: "ERROR", message: "Erreur serveur" });
    }
  });

  app.post("/api/sdk/withdraw", requirePartnerApiKey, async (req: Request, res: Response) => {
    try {
      const partner = (req as any).partner;
      const { amount, phoneNumber, operator, country, currency, description } = req.body;

      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ success: false, status: "ERROR", message: "Montant invalide" });
      }
      if (!phoneNumber) {
        return res.status(400).json({ success: false, status: "ERROR", message: "Numéro de téléphone requis" });
      }

      const numericAmount = parseFloat(amount);
      const settings = await storage.getCommissionSettings();
      const withdrawalRate = parseFloat(settings?.withdrawalRate || "7");
      const feeAmount = (numericAmount * withdrawalRate) / 100;
      const totalDebit = numericAmount + feeAmount;

      if (parseFloat(partner.balance) < totalDebit) {
        return res.status(400).json({ success: false, status: "ERROR", message: "Solde insuffisant" });
      }

      const reference = "WDR_" + uuidv4().replace(/-/g, "").substring(0, 16).toUpperCase();

      const { db } = await import("./db");
      const { sql } = await import("drizzle-orm");
      await db.execute(sql`UPDATE partners SET balance = balance - ${totalDebit.toString()} WHERE id = ${partner.id}`);

      const transaction = await storage.createPartnerTransaction({
        partnerId: partner.id,
        reference,
        amount: numericAmount.toString(),
        fee: feeAmount.toFixed(2),
        currency: currency || "XOF",
        customerName: null,
        customerEmail: null,
        customerPhone: phoneNumber,
        description: description || `Retrait SDK vers ${phoneNumber}`,
        callbackUrl: partner.callbackUrl || null,
        redirectUrl: null,
        metadata: JSON.stringify({ type: "withdrawal", operator: operator || null, country: country || null }),
      });

      await storage.createPartnerLog({
        partnerId: partner.id,
        action: "api_call",
        details: `SDK Retrait: ${reference} - ${numericAmount} ${currency || "XOF"} vers ${phoneNumber}`,
        ipAddress: req.ip || req.socket.remoteAddress,
      });

      res.json({
        success: true,
        status: "PENDING",
        txid: reference,
        reference,
        amount: numericAmount.toString(),
        fee: feeAmount.toFixed(2),
        netAmount: (numericAmount - feeAmount).toFixed(2),
        currency: currency || "XOF",
        message: "Demande de retrait soumise avec succès",
      });
    } catch (error: any) {
      console.error("SDK withdraw error:", error);
      res.status(500).json({ success: false, status: "ERROR", message: "Erreur serveur" });
    }
  });

  app.post("/api/sdk/verify", requirePartnerApiKey, async (req: Request, res: Response) => {
    try {
      const partner = (req as any).partner;
      const { reference, txid } = req.body;
      const ref = reference || txid;

      if (!ref) {
        return res.status(400).json({ success: false, status: "ERROR", message: "Référence requise (reference ou txid)" });
      }

      const transaction = await storage.getPartnerTransactionByReference(ref);
      if (!transaction || transaction.partnerId !== partner.id) {
        return res.status(404).json({ success: false, status: "NOT_FOUND", message: "Transaction introuvable" });
      }

      const statusMap: Record<string, string> = {
        pending: "PENDING",
        processing: "PROCESSING",
        completed: "SUCCESS",
        failed: "FAILED",
        cancelled: "CANCELLED",
      };

      await storage.createPartnerLog({
        partnerId: partner.id,
        action: "api_call",
        details: `SDK Vérification: ${ref} → ${transaction.status}`,
        ipAddress: req.ip || req.socket.remoteAddress,
      });

      res.json({
        success: transaction.status === "completed",
        status: statusMap[transaction.status] || transaction.status.toUpperCase(),
        txid: transaction.reference,
        reference: transaction.reference,
        amount: transaction.amount,
        fee: transaction.fee,
        currency: transaction.currency,
        message: transaction.status === "completed" ? "Paiement validé" :
                 transaction.status === "pending" ? "Paiement en attente" :
                 transaction.status === "processing" ? "Paiement en cours de traitement" :
                 transaction.status === "failed" ? "Paiement échoué" : "Paiement annulé",
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt,
      });
    } catch (error: any) {
      console.error("SDK verify error:", error);
      res.status(500).json({ success: false, status: "ERROR", message: "Erreur serveur" });
    }
  });

  app.get("/api/sdk/transaction/:id", requirePartnerApiKey, async (req: Request, res: Response) => {
    try {
      const partner = (req as any).partner;
      const transaction = await storage.getPartnerTransactionByReference(req.params.id);
      
      if (!transaction || transaction.partnerId !== partner.id) {
        return res.status(404).json({ success: false, status: "NOT_FOUND", message: "Transaction introuvable" });
      }

      const statusMap: Record<string, string> = {
        pending: "PENDING",
        processing: "PROCESSING",
        completed: "SUCCESS",
        failed: "FAILED",
        cancelled: "CANCELLED",
      };

      res.json({
        success: true,
        status: statusMap[transaction.status] || transaction.status.toUpperCase(),
        txid: transaction.reference,
        reference: transaction.reference,
        amount: transaction.amount,
        fee: transaction.fee,
        currency: transaction.currency,
        customerName: transaction.customerName,
        customerEmail: transaction.customerEmail,
        customerPhone: transaction.customerPhone,
        description: transaction.description,
        message: transaction.status === "completed" ? "Transaction validée" : "Transaction en cours",
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, status: "ERROR", message: "Erreur serveur" });
    }
  });

  app.get("/api/sdk/payment/:reference", requirePartnerApiKey, async (req: Request, res: Response) => {
    try {
      const partner = (req as any).partner;
      const transaction = await storage.getPartnerTransactionByReference(req.params.reference);
      
      if (!transaction || transaction.partnerId !== partner.id) {
        return res.status(404).json({ success: false, message: "Transaction introuvable" });
      }

      res.json({
        success: true,
        status: transaction.status === "completed" ? "SUCCESS" : transaction.status.toUpperCase(),
        txid: transaction.reference,
        reference: transaction.reference,
        amount: transaction.amount,
        fee: transaction.fee,
        currency: transaction.currency,
        customerName: transaction.customerName,
        customerEmail: transaction.customerEmail,
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  });

  app.get("/api/sdk/transactions", requirePartnerApiKey, async (req: Request, res: Response) => {
    try {
      const partner = (req as any).partner;
      const transactions = await storage.getPartnerTransactions(partner.id);
      res.json({
        success: true,
        transactions: transactions.map(t => ({
          txid: t.reference,
          reference: t.reference,
          amount: t.amount,
          fee: t.fee,
          currency: t.currency,
          status: t.status === "completed" ? "SUCCESS" : t.status.toUpperCase(),
          customerName: t.customerName,
          createdAt: t.createdAt,
          completedAt: t.completedAt,
        })),
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  });

  app.get("/api/sdk/balance", requirePartnerApiKey, async (req: Request, res: Response) => {
    try {
      const partner = (req as any).partner;
      res.json({
        success: true,
        balance: partner.balance,
        currency: "XOF",
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  });

  // ========== PARTNER DEPOSIT ROUTES ==========

  app.get("/api/partner/deposit/countries", requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const { SOLEASPAY_COUNTRIES } = await import("./soleaspay");
      res.json(SOLEASPAY_COUNTRIES);
    } catch (error) {
      console.error("Partner get countries error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/partner/deposit/services/:countryCode", requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const { getServicesByCountry } = await import("./soleaspay");
      const { countryCode } = req.params;
      const services = getServicesByCountry(countryCode);
      const operators = await storage.getOperators();
      const availableServices = services.map((service: any) => {
        const operator = operators.find((op: any) => op.code === service.id.toString());
        return { ...service, inMaintenance: operator?.inMaintenance ?? false };
      });
      res.json(availableServices);
    } catch (error) {
      console.error("Partner get services error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/partner/deposit", requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const { amount, serviceId, phoneNumber } = req.body;
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount < 100) {
        return res.status(400).json({ message: "Montant minimum: 100" });
      }
      if (!serviceId || !phoneNumber) {
        return res.status(400).json({ message: "Service et numéro de téléphone requis" });
      }
      const partner = await storage.getPartner(req.session.partnerId!);
      if (!partner) return res.status(404).json({ message: "Partenaire non trouvé" });

      const { getServiceById, soleaspay } = await import("./soleaspay");
      const service = getServiceById(parseInt(serviceId));
      if (!service) return res.status(400).json({ message: "Service non trouvé" });

      const operators = await storage.getOperators();
      const operator = operators.find((op: any) => op.code === serviceId.toString());
      if (operator?.inMaintenance) {
        return res.status(400).json({ message: "Ce moyen de paiement est actuellement en maintenance" });
      }

      const orderId = `PDEP-${Date.now()}-P${req.session.partnerId}`;
      const baseUrl = "https://sendavapay.com";

      const result = await soleaspay.collectPayment({
        wallet: phoneNumber,
        amount: numericAmount,
        currency: service.currency,
        orderId,
        description: `Dépôt Partenaire - ${partner.name}`,
        payer: partner.name,
        payerEmail: partner.email,
        serviceId: service.id,
        successUrl: `${baseUrl}/partner/dashboard`,
        failureUrl: `${baseUrl}/partner/dashboard`,
      });

      if (!result.success) {
        return res.status(500).json({ message: result.message || "Erreur lors du paiement" });
      }

      const payId = result.data?.reference || orderId;
      const waveUrl = result.wave_launch_url || result.payment_url || result.redirect_url || 
                      result.data?.wave_launch_url || result.data?.payment_url || result.data?.redirect_url;
      const isWaveOperator = service.operator === "Wave" || service.id === 32;

      await storage.createPartnerLog({
        partnerId: req.session.partnerId!,
        action: "api_call",
        details: `Dépôt initié: ${numericAmount} ${service.currency} via ${service.operator}`,
        ipAddress: req.ip || req.socket.remoteAddress,
      });

      res.json({ 
        success: true, payId, orderId, status: result.status,
        message: isWaveOperator && waveUrl 
          ? "Redirection vers Wave..." 
          : (result.message || "Veuillez confirmer sur votre téléphone."),
        waveUrl: waveUrl || null, isWave: isWaveOperator,
      });
    } catch (error) {
      console.error("Partner deposit error:", error);
      res.status(500).json({ message: "Erreur lors du dépôt" });
    }
  });

  app.get("/api/partner/verify-deposit/:orderId/:payId", requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const { orderId, payId } = req.params;
      const { soleaspay } = await import("./soleaspay");
      const result = await soleaspay.verifyPayment(orderId, payId);
      
      if (result.success && (result.status === "SUCCESSFUL" || result.status === "completed" || result.status === "SUCCESS")) {
        res.json({ status: "completed", message: "Paiement confirmé" });
      } else if (result.status === "FAILED" || result.status === "failed") {
        res.json({ status: "failed", message: "Paiement échoué" });
      } else {
        res.json({ status: "pending", message: "En attente de confirmation" });
      }
    } catch (error) {
      res.json({ status: "pending", message: "Vérification en cours..." });
    }
  });

  // ========== PARTNER WITHDRAWAL ROUTES ==========

  app.get("/api/partner/withdraw/operators", requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const operators = await storage.getOperators();
      const countries = await storage.getCountries();
      const countryOperators = countries.map((country: any) => {
        const countryOps = operators
          .filter((op: any) => op.countryId === country.id)
          .map((op: any) => ({ id: op.code || op.id.toString(), name: op.name, inMaintenance: op.inMaintenance ?? false }));
        return { id: country.code.toLowerCase(), name: country.name, currency: country.currency, methods: countryOps };
      }).filter((c: any) => c.methods.length > 0);
      res.json(countryOperators);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/partner/withdraw", requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const partner = await storage.getPartner(req.session.partnerId!);
      if (!partner) return res.status(404).json({ message: "Partenaire non trouvé" });

      const { amount, paymentMethod, mobileNumber, country, walletName } = req.body;
      const numericAmount = parseFloat(amount);
      const balance = parseFloat(partner.balance);

      if (isNaN(numericAmount) || numericAmount < 500) {
        return res.status(400).json({ message: "Montant minimum: 500" });
      }
      if (numericAmount > balance) {
        return res.status(400).json({ message: "Solde insuffisant" });
      }
      if (!mobileNumber) {
        return res.status(400).json({ message: "Numéro de téléphone requis" });
      }

      const countries = await storage.getCountries();
      const operators = await storage.getOperators();
      const selectedCountry = countries.find((c: any) => c.code.toLowerCase() === country.toLowerCase());
      if (!selectedCountry) return res.status(400).json({ message: "Pays invalide" });

      const countryOperators = operators.filter((op: any) => op.countryId === selectedCountry.id);
      const selectedOperator = countryOperators.find((op: any) => 
        op.code === paymentMethod || op.id.toString() === paymentMethod || op.name.toLowerCase() === paymentMethod.toLowerCase()
      );
      if (!selectedOperator) return res.status(400).json({ message: "Moyen de paiement invalide" });
      if (selectedOperator.inMaintenance) return res.status(400).json({ message: "Ce moyen de paiement est en maintenance" });

      const settings = await storage.getCommissionSettings();
      const commissionRate = parseFloat(settings?.withdrawalRate || "7");
      const fee = Math.round(numericAmount * (commissionRate / 100));
      const netAmount = numericAmount - fee;

      await storage.updatePartnerBalance(req.session.partnerId!, (-numericAmount).toString());

      await storage.createPartnerLog({
        partnerId: req.session.partnerId!,
        action: "api_call",
        details: `Retrait demandé: ${numericAmount} FCFA via ${selectedOperator.name} (${mobileNumber}). Frais: ${fee}, Net: ${netAmount}`,
        ipAddress: req.ip || req.socket.remoteAddress,
      });

      const withdrawalRequest = await storage.createWithdrawalRequest({
        userId: 0,
        amount: numericAmount.toString(),
        fee: fee.toString(),
        netAmount: netAmount.toString(),
        paymentMethod: selectedOperator.name,
        mobileNumber,
        country,
        walletName: `PARTENAIRE:${partner.name}` + (walletName ? ` - ${walletName}` : ""),
      });

      res.json({ 
        message: "Votre demande de retrait a été soumise. Elle sera traitée dans les plus brefs délais.",
        request: withdrawalRequest
      });
    } catch (error) {
      console.error("Partner withdraw error:", error);
      res.status(500).json({ message: "Erreur lors du retrait" });
    }
  });

  app.get("/api/partner/withdrawal-requests", requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ========== PARTNER PAYMENT LINK ROUTES ==========

  app.get("/api/partner/payment-links", requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { sql } = await import("drizzle-orm");
      const result = await db.execute(sql`SELECT * FROM payment_links WHERE partner_id = ${req.session.partnerId} ORDER BY created_at DESC`);
      res.json(result.rows || []);
    } catch (error) {
      console.error("Partner get payment links error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/partner/payment-links", requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const partner = await storage.getPartner(req.session.partnerId!);
      if (!partner) return res.status(404).json({ message: "Partenaire non trouvé" });

      const { title, description, amount, allowCustomAmount, minimumAmount, redirectUrl } = req.body;
      const numericAmount = parseFloat(amount);
      if (!title || isNaN(numericAmount) || numericAmount < 100) {
        return res.status(400).json({ message: "Titre requis et montant minimum 100" });
      }
      const numericMinAmount = minimumAmount ? parseFloat(minimumAmount) : null;
      if (allowCustomAmount && numericMinAmount !== null && numericMinAmount < 100) {
        return res.status(400).json({ message: "Le montant minimum doit être d'au moins 100" });
      }

      const linkCode = crypto.randomBytes(6).toString("hex");
      const { db } = await import("./db");
      const { sql } = await import("drizzle-orm");
      
      const result = await db.execute(sql`
        INSERT INTO payment_links (user_id, link_code, title, description, amount, product_image, allow_custom_amount, minimum_amount, redirect_url, partner_id)
        VALUES (NULL, ${linkCode}, ${title}, ${description || null}, ${numericAmount.toString()}, ${null}, ${allowCustomAmount || false}, ${numericMinAmount ? numericMinAmount.toString() : null}, ${redirectUrl || null}, ${req.session.partnerId})
        RETURNING *
      `);

      await storage.createPartnerLog({
        partnerId: req.session.partnerId!,
        action: "api_call",
        details: `Lien de paiement créé: ${title} - ${numericAmount} FCFA`,
        ipAddress: req.ip || req.socket.remoteAddress,
      });

      res.json(result.rows?.[0] || { linkCode, title, amount: numericAmount });
    } catch (error) {
      console.error("Partner create payment link error:", error);
      res.status(500).json({ message: "Erreur lors de la création du lien" });
    }
  });

  app.get("/api/partner/commission-rates", requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const settings = await storage.getCommissionSettings();
      res.json({
        depositRate: parseFloat(settings?.depositRate || "7"),
        withdrawalRate: parseFloat(settings?.withdrawalRate || "7"),
        encaissementRate: parseFloat(settings?.encaissementRate || "7"),
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });
}
