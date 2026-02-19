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
    const apiKey = req.headers["x-partner-key"] as string || req.query.api_key as string;
    const apiSecret = req.headers["x-partner-secret"] as string || req.query.api_secret as string;

    if (!apiKey || !apiSecret) {
      return res.status(401).json({ success: false, message: "Clés API manquantes" });
    }

    const partner = await storage.getPartnerByApiKey(apiKey);
    if (!partner || partner.apiSecret !== apiSecret) {
      return res.status(401).json({ success: false, message: "Clés API invalides" });
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
        reference: transaction.reference,
        amount: transaction.amount,
        fee: transaction.fee,
        currency: transaction.currency,
        status: transaction.status,
        paymentUrl: `/pay/partner/${transaction.reference}`,
      });
    } catch (error: any) {
      console.error("SDK create payment error:", error);
      res.status(500).json({ success: false, message: "Erreur serveur" });
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
        reference: transaction.reference,
        amount: transaction.amount,
        fee: transaction.fee,
        currency: transaction.currency,
        status: transaction.status,
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
          reference: t.reference,
          amount: t.amount,
          fee: t.fee,
          currency: t.currency,
          status: t.status,
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
}
