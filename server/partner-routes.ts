import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { partnerLoginSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { notifyPartnerWithdrawal } from "./telegram";

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
      console.error("Partner login error:", error);
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

  app.patch("/api/partner/config", requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const partnerId = req.session.partnerId!;
      const partner = await storage.getPartner(partnerId);
      if (!partner) return res.status(404).json({ message: "Partenaire introuvable" });

      const { allowedCountries, allowedOperators } = req.body;
      const updates: any = {};
      if (allowedCountries !== undefined) updates.allowedCountries = JSON.stringify(allowedCountries);
      if (allowedOperators !== undefined) updates.allowedOperators = JSON.stringify(allowedOperators);

      const updated = await storage.updatePartner(partnerId, updates);
      await storage.createPartnerLog({
        partnerId,
        action: "profile_update",
        details: "Configuration pays/opérateurs mise à jour",
        ipAddress: req.ip || req.socket.remoteAddress,
      });

      const { password, apiSecret, ...safePartner } = updated!;
      res.json(safePartner);
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
      if (req.body.enableDeposit !== undefined) updates.enableDeposit = req.body.enableDeposit;
      if (req.body.enableWithdrawal !== undefined) updates.enableWithdrawal = req.body.enableWithdrawal;
      if (req.body.enablePaymentLinks !== undefined) updates.enablePaymentLinks = req.body.enablePaymentLinks;

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

      if (!partner.enableDeposit) {
        return res.status(403).json({ success: false, status: "ERROR", message: "La fonction de paiement/encaissement est désactivée pour ce partenaire" });
      }

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

      if (!partner.enableDeposit) {
        return res.status(403).json({ success: false, status: "ERROR", message: "La fonction de paiement/encaissement est désactivée pour ce partenaire" });
      }

      const { amount, currency, customerName, customerEmail, customerPhone, phoneNumber, operator, country, description, callbackUrl, redirectUrl, metadata, provider } = req.body;
      const phone = phoneNumber || customerPhone;

      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ success: false, status: "ERROR", message: "Montant invalide" });
      }

      const numericAmount = parseFloat(amount);
      const reference = "PTR_" + uuidv4().replace(/-/g, "").substring(0, 16).toUpperCase();
      const fee = (numericAmount * parseFloat(partner.commissionRate) / 100).toFixed(2);

      let paymentProvider = (provider || "").toLowerCase();
      if (!paymentProvider && operator && country) {
        const { SOLEASPAY_SERVICES } = await import("./soleaspay");
        const countryUp = country.toUpperCase();
        const opLower = operator.toLowerCase();
        const svc = SOLEASPAY_SERVICES.find(s =>
          s.countryCode === countryUp &&
          (s.operator.toLowerCase() === opLower || s.name.toLowerCase().includes(opLower))
        );
        if (svc) {
          const operators = await storage.getOperators();
          const dbOp = operators.find(op => op.code === svc.id.toString());
          if (dbOp?.paymentGateway === "winipayer") {
            paymentProvider = "winipayer";
          } else {
            paymentProvider = "soleaspay";
          }
        } else {
          paymentProvider = "soleaspay";
        }
      }
      if (!paymentProvider) paymentProvider = "soleaspay";

      if (paymentProvider === "winipayer") {
        const { winipayer } = await import("./winipayer");

        const baseUrl = process.env.BASE_URL || "https://sendavapay.com";
        const finalCallbackUrl = callbackUrl || partner.callbackUrl || `${baseUrl}/api/webhook/winipayer`;
        const finalReturnUrl = redirectUrl || `${baseUrl}/pay/partner/${reference}/success`;
        const cancelUrl = `${baseUrl}/pay/partner/${reference}/cancel`;

        const transaction = await storage.createPartnerTransaction({
          partnerId: partner.id,
          reference,
          amount: numericAmount.toString(),
          fee,
          currency: currency || "XOF",
          customerName: customerName || null,
          customerEmail: customerEmail || null,
          customerPhone: phone || null,
          description: description || null,
          callbackUrl: finalCallbackUrl,
          redirectUrl: finalReturnUrl,
          metadata: JSON.stringify({ ...(metadata || {}), provider: "winipayer", country: country || null, operator: operator || null }),
        });

        console.log(`📤 WiniPayer SDK: Paiement REDIRECT ${reference} montant=${numericAmount}`);

        const winiResult = await winipayer.createCheckout({
          amount: numericAmount,
          description: description || `Paiement ${partner.name} - ${reference}`,
          cancelUrl,
          returnUrl: finalReturnUrl,
          callbackUrl: `${baseUrl}/api/webhook/winipayer`,
          customData: { reference, partnerId: partner.id, ...(metadata || {}) },
          clientPayFee: false,
          reference: {
            identifier: reference,
            name: customerName || undefined,
            phone: phone || undefined,
            email: customerEmail || undefined,
          },
        });

        console.log(`SDK Payment WiniPayer result for ${reference}:`, JSON.stringify(winiResult));

        if (winiResult.success && winiResult.results) {
          const { db } = await import("./db");
          const { sql } = await import("drizzle-orm");
          await db.execute(sql`UPDATE partner_transactions SET status = 'processing', metadata = ${JSON.stringify({
            ...(metadata || {}),
            provider: "winipayer",
            winiUuid: winiResult.results.uuid,
            winiCrypto: winiResult.results.crypto,
            checkoutUrl: winiResult.results.checkout_process,
            expiredAt: winiResult.results.expired_at,
            country: country || null,
            operator: operator || null,
          })} WHERE reference = ${reference}`);

          await storage.createPartnerLog({
            partnerId: partner.id,
            action: "api_call",
            details: `SDK Paiement WiniPayer créé: ${reference} - ${numericAmount} ${currency || "XOF"} - Checkout: ${winiResult.results.checkout_process}`,
            ipAddress: req.ip || req.socket.remoteAddress,
          });

          return res.json({
            success: true,
            status: "PROCESSING",
            txid: reference,
            reference,
            provider: "winipayer",
            checkoutUrl: winiResult.results.checkout_process,
            uuid: winiResult.results.uuid,
            amount: numericAmount.toString(),
            fee,
            currency: winiResult.results.currency || currency || "XOF",
            expiredAt: winiResult.results.expired_at,
            message: "Redirigez le client vers checkoutUrl pour finaliser le paiement.",
          });
        } else {
          const { db } = await import("./db");
          const { sql } = await import("drizzle-orm");
          await db.execute(sql`UPDATE partner_transactions SET status = 'failed', metadata = ${JSON.stringify({ provider: "winipayer", error: winiResult.errors?.msg || "Erreur WiniPayer" })} WHERE reference = ${reference}`);

          await storage.createPartnerLog({
            partnerId: partner.id,
            action: "api_call",
            details: `SDK Paiement WiniPayer échoué: ${reference} - ${winiResult.errors?.msg || "Erreur WiniPayer"}`,
            ipAddress: req.ip || req.socket.remoteAddress,
          });

          return res.status(400).json({
            success: false,
            status: "FAILED",
            reference,
            provider: "winipayer",
            message: winiResult.errors?.msg || "Échec de la création du checkout WiniPayer.",
          });
        }
      }

      if (!phone) {
        return res.status(400).json({ success: false, status: "ERROR", message: "Numéro de téléphone requis (phoneNumber)" });
      }
      if (!operator) {
        return res.status(400).json({ success: false, status: "ERROR", message: "Opérateur requis (operator: MTN, Moov, Orange, TMoney, Wave, Vodacom, Airtel)" });
      }
      if (!country) {
        return res.status(400).json({ success: false, status: "ERROR", message: "Code pays requis (country: TG, BJ, BF, CM, CI, COD, COG)" });
      }

      const { SOLEASPAY_SERVICES, soleaspay, getCurrencyByCountry } = await import("./soleaspay");
      const countryUpper = country.toUpperCase();
      const operatorLower = operator.toLowerCase();

      let partnerAllowedCountries: string[] = [];
      let partnerAllowedOperators: string[] = [];
      try {
        if (partner.allowedCountries) partnerAllowedCountries = JSON.parse(partner.allowedCountries);
      } catch {}
      try {
        if (partner.allowedOperators) partnerAllowedOperators = JSON.parse(partner.allowedOperators);
      } catch {}

      if (partnerAllowedCountries.length > 0 && !partnerAllowedCountries.includes(countryUpper)) {
        return res.status(400).json({ success: false, status: "ERROR", message: `Le pays '${country}' n'est pas activé pour ce partenaire` });
      }

      const operatorCode = operator.charAt(0).toUpperCase() + operator.slice(1).toLowerCase();
      if (partnerAllowedOperators.length > 0 && !partnerAllowedOperators.some(o => o.toLowerCase() === operatorLower)) {
        return res.status(400).json({ success: false, status: "ERROR", message: `L'opérateur '${operator}' n'est pas activé pour ce partenaire` });
      }

      const service = SOLEASPAY_SERVICES.find(s =>
        s.countryCode === countryUpper &&
        (s.operator.toLowerCase() === operatorLower ||
         s.name.toLowerCase().includes(operatorLower) ||
         operatorLower.includes(s.operator.toLowerCase()))
      );

      if (!service) {
        return res.status(400).json({ success: false, status: "ERROR", message: `Opérateur '${operator}' non disponible pour le pays '${country}'` });
      }

      const txCurrency = currency || getCurrencyByCountry(countryUpper);

      const allOperators = await storage.getOperators();
      const dbOperator = allOperators.find(op => op.code === service.id.toString());
      const paymentGateway = dbOperator?.paymentGateway || "soleaspay";

      console.log(`📡 SDK Payment: opérateur=${service.operator} (${countryUpper}), gateway configuré=${paymentGateway}, ref=${reference}`);

      if (paymentGateway === "omnipay") {
        const { omnipay: opClient, getOmnipayOperator, formatPhoneForOmnipay } = await import("./omnipay");
        const opOperator = getOmnipayOperator(service.operator);
        if (opOperator === undefined) {
          return res.status(400).json({ success: false, status: "ERROR", message: `Opérateur '${service.operator}' non supporté par OmniPay` });
        }
        const cleanPhone = formatPhoneForOmnipay(phone, countryUpper);
        const nameParts = (customerName || "Client").split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || nameParts[0];
        const baseUrl = process.env.BASE_URL || "https://sendavapay.com";

        await storage.createPartnerTransaction({
          partnerId: partner.id,
          reference,
          amount: numericAmount.toString(),
          fee,
          currency: txCurrency,
          customerName: customerName || null,
          customerEmail: customerEmail || null,
          customerPhone: cleanPhone,
          description: description || null,
          callbackUrl: callbackUrl || partner.callbackUrl || null,
          redirectUrl: redirectUrl || null,
          metadata: JSON.stringify({ ...(metadata || {}), provider: "omnipay", operator: service.operator, country: countryUpper, serviceId: service.id }),
        });

        const opResult = await opClient.requestPayment({
          msisdn: cleanPhone,
          amount: numericAmount,
          reference,
          firstName,
          lastName,
          operator: opOperator ?? undefined,
          callbackUrl: `${baseUrl}/api/webhook/omnipay`,
        });

        console.log(`SDK Payment OmniPay result for ${reference}:`, JSON.stringify(opResult));

        const { db } = await import("./db");
        const { sql } = await import("drizzle-orm");

        if (String(opResult.success) !== "1") {
          await db.execute(sql`UPDATE partner_transactions SET status = 'failed', metadata = ${JSON.stringify({ provider: "omnipay", operator: service.operator, country: countryUpper, error: opResult.message })} WHERE reference = ${reference}`);
          await storage.createPartnerLog({ partnerId: partner.id, action: "api_call", details: `SDK Paiement OmniPay échoué: ${reference} - ${opResult.message}`, ipAddress: req.ip || req.socket.remoteAddress });
          return res.status(400).json({ success: false, status: "FAILED", reference, provider: "omnipay", message: opResult.message || "Échec OmniPay" });
        }

        await db.execute(sql`UPDATE partner_transactions SET status = 'processing', metadata = ${JSON.stringify({ provider: "omnipay", operator: service.operator, country: countryUpper, serviceId: service.id, omnipayId: opResult.id })} WHERE reference = ${reference}`);
        await storage.createPartnerLog({ partnerId: partner.id, action: "api_call", details: `SDK Paiement OmniPay USSD envoyé: ${reference} - ${numericAmount} ${txCurrency} via ${service.operator} au ${cleanPhone}`, ipAddress: req.ip || req.socket.remoteAddress });

        return res.json({
          success: true,
          status: "PROCESSING",
          txid: reference,
          reference,
          provider: "omnipay",
          amount: numericAmount.toString(),
          fee,
          currency: txCurrency,
          operator: service.operator,
          country: service.countryCode,
          message: "Notification USSD envoyée au client. Vérifiez le statut avec /api/sdk/verify",
        });
      }

      if (paymentGateway === "maishapay") {
        const { maishapay: mpClient, getMaishapayProvider, formatPhoneForMaishapay } = await import("./maishapay");
        const mpProvider = getMaishapayProvider(service.operator, countryUpper);
        if (!mpProvider) {
          return res.status(400).json({ success: false, status: "ERROR", message: `Opérateur '${service.operator}' non supporté par MaishaPay` });
        }
        const cleanPhone = formatPhoneForMaishapay(phone, countryUpper);
        const baseUrl = process.env.BASE_URL || "https://sendavapay.com";

        await storage.createPartnerTransaction({
          partnerId: partner.id,
          reference,
          amount: numericAmount.toString(),
          fee,
          currency: txCurrency,
          customerName: customerName || null,
          customerEmail: customerEmail || null,
          customerPhone: cleanPhone,
          description: description || null,
          callbackUrl: callbackUrl || partner.callbackUrl || null,
          redirectUrl: redirectUrl || null,
          metadata: JSON.stringify({ ...(metadata || {}), provider: "maishapay", operator: service.operator, country: countryUpper, serviceId: service.id }),
        });

        const mpResult = await mpClient.collectPayment({
          transactionReference: reference,
          amount: numericAmount,
          currency: txCurrency,
          customerFullName: customerName || "Client",
          customerEmail: customerEmail || `${cleanPhone}@sendavapay.com`,
          provider: mpProvider,
          walletID: cleanPhone,
          callbackUrl: `${baseUrl}/api/webhook/maishapay`,
        });

        console.log(`SDK Payment MaishaPay result for ${reference}:`, JSON.stringify(mpResult));

        const { db } = await import("./db");
        const { sql } = await import("drizzle-orm");

        if (mpResult.status_code !== 202 || mpResult.transactionStatus?.trim().toUpperCase() === "FAILED") {
          const { extractMaishaPayError } = await import("./maishapay");
          const errMsg = extractMaishaPayError(mpResult);
          await db.execute(sql`UPDATE partner_transactions SET status = 'failed', metadata = ${JSON.stringify({ provider: "maishapay", operator: service.operator, country: countryUpper, error: errMsg })} WHERE reference = ${reference}`);
          await storage.createPartnerLog({ partnerId: partner.id, action: "api_call", details: `SDK Paiement MaishaPay échoué: ${reference} - ${errMsg}`, ipAddress: req.ip || req.socket.remoteAddress });
          return res.status(400).json({ success: false, status: "FAILED", reference, provider: "maishapay", message: errMsg });
        }

        await db.execute(sql`UPDATE partner_transactions SET status = 'processing', metadata = ${JSON.stringify({ provider: "maishapay", operator: service.operator, country: countryUpper, serviceId: service.id, maishapayId: mpResult.transactionId })} WHERE reference = ${reference}`);
        await storage.createPartnerLog({ partnerId: partner.id, action: "api_call", details: `SDK Paiement MaishaPay USSD envoyé: ${reference} - ${numericAmount} ${txCurrency} via ${service.operator} au ${cleanPhone}`, ipAddress: req.ip || req.socket.remoteAddress });

        return res.json({
          success: true,
          status: "PROCESSING",
          txid: reference,
          reference,
          provider: "maishapay",
          amount: numericAmount.toString(),
          fee,
          currency: txCurrency,
          operator: service.operator,
          country: service.countryCode,
          message: "Notification USSD envoyée au client. Vérifiez le statut avec /api/sdk/verify",
        });
      }

      await storage.createPartnerTransaction({
        partnerId: partner.id,
        reference,
        amount: numericAmount.toString(),
        fee,
        currency: txCurrency,
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        customerPhone: phone,
        description: description || null,
        callbackUrl: callbackUrl || partner.callbackUrl || null,
        redirectUrl: redirectUrl || null,
        metadata: metadata ? JSON.stringify({ ...metadata, provider: "soleaspay", operator, country: countryUpper, serviceId: service.id }) : JSON.stringify({ provider: "soleaspay", operator, country: countryUpper, serviceId: service.id }),
      });

      const soleasResult = await soleaspay.collectPayment({
        wallet: phone,
        amount: numericAmount,
        currency: txCurrency,
        orderId: reference,
        description: description || `Paiement ${partner.name}`,
        payer: customerName || phone,
        payerEmail: customerEmail || `${phone}@sendavapay.com`,
        serviceId: service.id,
        successUrl: redirectUrl || undefined,
        failureUrl: redirectUrl || undefined,
      });

      console.log(`SDK Payment SoleasPay result for ${reference}:`, JSON.stringify(soleasResult));

      let soleasRef = "";
      if (soleasResult.data?.reference) {
        soleasRef = soleasResult.data.reference;
      }

      if (soleasResult.code === 200 || soleasResult.status === "success" || soleasResult.data) {
        const { db } = await import("./db");
        const { sql } = await import("drizzle-orm");
        await db.execute(sql`UPDATE partner_transactions SET status = 'processing', metadata = ${JSON.stringify({ provider: "soleaspay", operator, country: countryUpper, serviceId: service.id, soleasRef })} WHERE reference = ${reference}`);

        await storage.createPartnerLog({
          partnerId: partner.id,
          action: "api_call",
          details: `SDK Paiement USSD envoyé: ${reference} - ${numericAmount} ${txCurrency} via ${service.operator} (${service.countryCode}) au ${phone}`,
          ipAddress: req.ip || req.socket.remoteAddress,
        });

        res.json({
          success: true,
          status: "PROCESSING",
          txid: reference,
          reference,
          provider: "soleaspay",
          soleasReference: soleasRef,
          amount: numericAmount.toString(),
          fee,
          currency: txCurrency,
          operator: service.operator,
          country: service.countryCode,
          message: "Notification USSD envoyée au client. Vérifiez le statut avec /api/sdk/verify",
        });
      } else {
        const { db } = await import("./db");
        const { sql } = await import("drizzle-orm");
        await db.execute(sql`UPDATE partner_transactions SET status = 'failed', metadata = ${JSON.stringify({ provider: "soleaspay", operator, country: countryUpper, serviceId: service.id, error: soleasResult.message })} WHERE reference = ${reference}`);

        await storage.createPartnerLog({
          partnerId: partner.id,
          action: "api_call",
          details: `SDK Paiement échoué: ${reference} - ${soleasResult.message || "Erreur SoleasPay"}`,
          ipAddress: req.ip || req.socket.remoteAddress,
        });

        res.status(400).json({
          success: false,
          status: "FAILED",
          reference,
          provider: "soleaspay",
          message: soleasResult.message || "Échec de l'envoi USSD. Vérifiez le numéro et l'opérateur.",
        });
      }
    } catch (error: any) {
      console.error("SDK payment error:", error);
      res.status(500).json({ success: false, status: "ERROR", message: "Erreur serveur" });
    }
  });

  app.post("/api/sdk/withdraw", requirePartnerApiKey, async (req: Request, res: Response) => {
    try {
      const partner = (req as any).partner;

      if (!partner.enableWithdrawal) {
        return res.status(403).json({ success: false, status: "ERROR", message: "La fonction de retrait est désactivée pour ce partenaire" });
      }

      const { amount, phoneNumber, operator, country, currency, description } = req.body;

      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ success: false, status: "ERROR", message: "Montant invalide" });
      }
      if (!phoneNumber) {
        return res.status(400).json({ success: false, status: "ERROR", message: "Numéro de téléphone requis" });
      }

      if (country) {
        let partnerAllowedCountries: string[] = [];
        try {
          if (partner.allowedCountries) partnerAllowedCountries = JSON.parse(partner.allowedCountries);
        } catch {}
        if (partnerAllowedCountries.length > 0 && !partnerAllowedCountries.includes(country.toUpperCase())) {
          return res.status(400).json({ success: false, status: "ERROR", message: `Le pays '${country}' n'est pas activé pour ce partenaire` });
        }
      }
      if (operator) {
        let partnerAllowedOperators: string[] = [];
        try {
          if (partner.allowedOperators) partnerAllowedOperators = JSON.parse(partner.allowedOperators);
        } catch {}
        if (partnerAllowedOperators.length > 0 && !partnerAllowedOperators.some((o: string) => o.toLowerCase() === operator.toLowerCase())) {
          return res.status(400).json({ success: false, status: "ERROR", message: `L'opérateur '${operator}' n'est pas activé pour ce partenaire` });
        }
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

      if (transaction.status === "processing" || transaction.status === "pending") {
        let txProvider = "soleaspay";
        let txMeta: any = {};
        try {
          txMeta = JSON.parse(transaction.metadata || "{}");
          txProvider = txMeta.provider || "soleaspay";
        } catch {}

        if (txProvider === "winipayer") {
          try {
            const { winipayer } = await import("./winipayer");
            const winiUuid = txMeta.winiUuid;
            if (winiUuid) {
              const verifyResult = await winipayer.verifyPayment(winiUuid);
              console.log(`SDK Verify WiniPayer for ${ref} (uuid: ${winiUuid}):`, JSON.stringify(verifyResult));

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
                    console.error(`❌ WiniPayer verify: Hash invalide pour ${ref} - données potentiellement falsifiées`);
                    await storage.createPartnerLog({
                      partnerId: partner.id,
                      action: "error",
                      details: `SDK Verify WiniPayer: Hash invalide pour ${ref} - transaction non confirmée`,
                      ipAddress: req.ip || req.socket.remoteAddress,
                    });
                    return res.json({
                      success: false,
                      status: "PROCESSING",
                      txid: transaction.reference,
                      reference: transaction.reference,
                      provider: "winipayer",
                      amount: transaction.amount,
                      fee: transaction.fee,
                      currency: transaction.currency,
                      message: "Vérification de sécurité échouée - hash invalide",
                      createdAt: transaction.createdAt,
                    });
                  }

                  const { db } = await import("./db");
                  const { sql } = await import("drizzle-orm");
                  const updateResult = await db.execute(sql`UPDATE partner_transactions SET status = 'completed', completed_at = NOW(), metadata = ${JSON.stringify({
                    ...txMeta,
                    winiState: state,
                    winiOperator: invoice.operator,
                    winiOperatorRef: invoice.operator_ref,
                    winiAmountAvailable: invoice.amount_available,
                    winiCommission: invoice.commission_amount,
                    winiHashValid: hashValid,
                    winiCustomerName: invoice.customer_pay?.name,
                    winiCustomerPhone: invoice.customer_pay?.phone,
                  })} WHERE reference = ${ref} AND status IN ('processing', 'pending')`);

                  const rowsAffected = (updateResult as any)?.rowCount || (updateResult as any)?.length || 0;
                  if (rowsAffected > 0) {
                    const netAmount = parseFloat(transaction.amount as string) - parseFloat(transaction.fee as string);
                    await db.execute(sql`UPDATE partners SET balance = balance + ${netAmount.toString()} WHERE id = ${partner.id}`);
                  }

                  await storage.createPartnerLog({
                    partnerId: partner.id,
                    action: "api_call",
                    details: `SDK Paiement WiniPayer confirmé: ${ref} - ${transaction.amount} ${transaction.currency} via ${invoice.operator || "N/A"}`,
                    ipAddress: req.ip || req.socket.remoteAddress,
                  });

                  return res.json({
                    success: true,
                    status: "SUCCESS",
                    txid: transaction.reference,
                    reference: transaction.reference,
                    provider: "winipayer",
                    amount: transaction.amount,
                    fee: transaction.fee,
                    currency: transaction.currency,
                    operator: invoice.operator,
                    customerName: invoice.customer_pay?.name,
                    customerPhone: invoice.customer_pay?.phone,
                    message: "Paiement confirmé avec succès via WiniPayer",
                    createdAt: transaction.createdAt,
                    completedAt: new Date().toISOString(),
                  });
                } else if (state === "failed" || state === "cancelled" || state === "expired") {
                  const { db } = await import("./db");
                  const { sql } = await import("drizzle-orm");
                  await db.execute(sql`UPDATE partner_transactions SET status = 'failed', metadata = ${JSON.stringify({ ...txMeta, winiState: state })} WHERE reference = ${ref} AND status IN ('processing', 'pending')`);

                  return res.json({
                    success: false,
                    status: state === "expired" ? "EXPIRED" : "FAILED",
                    txid: transaction.reference,
                    reference: transaction.reference,
                    provider: "winipayer",
                    amount: transaction.amount,
                    fee: transaction.fee,
                    currency: transaction.currency,
                    message: state === "expired" ? "Le lien de paiement a expiré" : "Paiement échoué ou annulé",
                    createdAt: transaction.createdAt,
                  });
                }
              }
            }
          } catch (verifyError) {
            console.error("SDK verify WiniPayer check error:", verifyError);
          }
        } else {
          try {
            const { soleaspay } = await import("./soleaspay");
            const soleasRef = txMeta.soleasRef || "";

            const verifyResult = await soleaspay.verifyPayment(ref, soleasRef || ref);
            console.log(`SDK Verify SoleasPay for ${ref}:`, JSON.stringify(verifyResult));

            if (verifyResult.code === 200 || verifyResult.status === "success") {
              const { db } = await import("./db");
              const { sql } = await import("drizzle-orm");
              const updateResult = await db.execute(sql`UPDATE partner_transactions SET status = 'completed', completed_at = NOW() WHERE reference = ${ref} AND status IN ('processing', 'pending')`);

              const rowsAffected = (updateResult as any)?.rowCount || (updateResult as any)?.length || 0;
              if (rowsAffected > 0) {
                const netAmount = parseFloat(transaction.amount as string) - parseFloat(transaction.fee as string);
                await db.execute(sql`UPDATE partners SET balance = balance + ${netAmount.toString()} WHERE id = ${partner.id}`);
              }

              await storage.createPartnerLog({
                partnerId: partner.id,
                action: "api_call",
                details: `SDK Paiement confirmé: ${ref} - ${transaction.amount} ${transaction.currency}`,
                ipAddress: req.ip || req.socket.remoteAddress,
              });

              return res.json({
                success: true,
                status: "SUCCESS",
                txid: transaction.reference,
                reference: transaction.reference,
                provider: "soleaspay",
                amount: transaction.amount,
                fee: transaction.fee,
                currency: transaction.currency,
                message: "Paiement confirmé avec succès",
                createdAt: transaction.createdAt,
                completedAt: new Date().toISOString(),
              });
            }
          } catch (verifyError) {
            console.error("SDK verify SoleasPay check error:", verifyError);
          }
        }
      }

      let txProvider = "soleaspay";
      try {
        const meta = JSON.parse(transaction.metadata || "{}");
        txProvider = meta.provider || "soleaspay";
      } catch {}

      const statusMap: Record<string, string> = {
        pending: "PENDING",
        processing: "PROCESSING",
        completed: "SUCCESS",
        failed: "FAILED",
        cancelled: "CANCELLED",
      };

      res.json({
        success: transaction.status === "completed",
        status: statusMap[transaction.status] || transaction.status.toUpperCase(),
        txid: transaction.reference,
        reference: transaction.reference,
        provider: txProvider,
        amount: transaction.amount,
        fee: transaction.fee,
        currency: transaction.currency,
        message: transaction.status === "completed" ? "Paiement validé" :
                 transaction.status === "pending" ? "En attente de confirmation du client" :
                 transaction.status === "processing" ? (txProvider === "winipayer" ? "En attente du paiement sur le portail WiniPayer" : "Le client n'a pas encore confirmé sur son téléphone") :
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
      const partner = await storage.getPartner(req.session.partnerId!);
      let allowedCountries: string[] = [];
      try {
        if (partner?.allowedCountries) allowedCountries = JSON.parse(partner.allowedCountries);
      } catch {}

      const filtered = allowedCountries.length > 0
        ? SOLEASPAY_COUNTRIES.filter((c: any) => allowedCountries.includes(c.code))
        : SOLEASPAY_COUNTRIES;
      res.json(filtered);
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

      const partner = await storage.getPartner(req.session.partnerId!);
      let allowedOperators: string[] = [];
      try {
        if (partner?.allowedOperators) allowedOperators = JSON.parse(partner.allowedOperators);
      } catch {}

      let availableServices = services.map((service: any) => {
        const operator = operators.find((op: any) => op.code === service.id.toString());
        return {
          ...service,
          inMaintenance: operator?.inMaintenance ?? false,
          paymentGateway: operator?.paymentGateway || "soleaspay",
        };
      });

      if (allowedOperators.length > 0) {
        availableServices = availableServices.filter((s: any) =>
          allowedOperators.some(o => o.toLowerCase() === s.operator.toLowerCase())
        );
      }

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

      const paymentGateway = operator?.paymentGateway || "soleaspay";
      const baseUrl = "https://sendavapay.com";

      console.log(`📡 Partner Deposit: opérateur=${service.operator} (${service.countryCode}), gateway=${paymentGateway}, partner=${partner.name}`);

      if (paymentGateway === "winipayer") {
        const orderId = `PDEP-WP-${Date.now()}-P${req.session.partnerId}`;
        const { winipayer } = await import("./winipayer");
        const winiResult = await winipayer.createCheckout({
          amount: numericAmount,
          description: `Dépôt Partenaire - ${partner.name}`,
          cancelUrl: `${baseUrl}/partner/dashboard`,
          returnUrl: `${baseUrl}/partner/dashboard`,
          callbackUrl: `${baseUrl}/api/webhook/winipayer`,
          customData: { partnerId: req.session.partnerId, orderId },
          clientPayFee: false,
          reference: { identifier: orderId, name: partner.name, email: partner.email },
        });
        if (!winiResult.success || !winiResult.results) {
          return res.status(500).json({ message: winiResult.errors?.msg || "Erreur WiniPayer" });
        }
        await storage.createPartnerLog({ partnerId: req.session.partnerId!, action: "api_call", details: `Dépôt WiniPayer initié: ${numericAmount} ${service.currency}`, ipAddress: req.ip || req.socket.remoteAddress });
        return res.json({ success: true, payId: winiResult.results.uuid, orderId, status: "PENDING", isWinipayer: true, checkoutUrl: winiResult.results.checkout_process, message: "Redirection vers le portail de paiement WiniPayer..." });
      }

      if (paymentGateway === "omnipay") {
        const orderId = `PDEP-OP-${Date.now()}-P${req.session.partnerId}`;
        const { omnipay: opClient, getOmnipayOperator, formatPhoneForOmnipay } = await import("./omnipay");
        const opOperator = getOmnipayOperator(service.operator);
        if (opOperator === undefined) {
          return res.status(400).json({ message: `Opérateur '${service.operator}' non supporté par OmniPay` });
        }
        const cleanPhone = formatPhoneForOmnipay(phoneNumber, service.countryCode);
        const nameParts = partner.name.split(" ");
        const opResult = await opClient.requestPayment({
          msisdn: cleanPhone,
          amount: numericAmount,
          reference: orderId,
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(" ") || nameParts[0],
          operator: opOperator ?? undefined,
          callbackUrl: `${baseUrl}/api/webhook/omnipay`,
        });
        if (String(opResult.success) !== "1") {
          return res.status(500).json({ message: opResult.message || "Erreur OmniPay" });
        }
        await storage.createPartnerLog({ partnerId: req.session.partnerId!, action: "api_call", details: `Dépôt OmniPay initié: ${numericAmount} ${service.currency} via ${service.operator} au ${cleanPhone}`, ipAddress: req.ip || req.socket.remoteAddress });
        return res.json({ success: true, payId: orderId, orderId, status: "PENDING", provider: "omnipay", message: "Veuillez confirmer le paiement sur votre téléphone." });
      }

      if (paymentGateway === "maishapay") {
        const orderId = `PDEP-MP-${Date.now()}-P${req.session.partnerId}`;
        const { maishapay: mpClient, getMaishapayProvider, formatPhoneForMaishapay } = await import("./maishapay");
        const mpProvider = getMaishapayProvider(service.operator, service.countryCode);
        if (!mpProvider) {
          return res.status(400).json({ message: `Opérateur '${service.operator}' non supporté par MaishaPay` });
        }
        const cleanPhone = formatPhoneForMaishapay(phoneNumber, service.countryCode);
        const mpResult = await mpClient.collectPayment({
          transactionReference: orderId,
          amount: numericAmount,
          currency: service.currency,
          customerFullName: partner.name,
          customerEmail: partner.email,
          provider: mpProvider,
          walletID: cleanPhone,
          callbackUrl: `${baseUrl}/api/webhook/maishapay`,
        });
        if (mpResult.status_code !== 202 || mpResult.transactionStatus?.trim().toUpperCase() === "FAILED") {
          const { extractMaishaPayError } = await import("./maishapay");
          return res.status(500).json({ message: extractMaishaPayError(mpResult) });
        }
        await storage.createPartnerLog({ partnerId: req.session.partnerId!, action: "api_call", details: `Dépôt MaishaPay initié: ${numericAmount} ${service.currency} via ${service.operator} au ${cleanPhone}`, ipAddress: req.ip || req.socket.remoteAddress });
        return res.json({ success: true, payId: orderId, orderId, status: "PENDING", provider: "maishapay", message: "Veuillez confirmer le paiement sur votre téléphone." });
      }

      const orderId = `PDEP-${Date.now()}-P${req.session.partnerId}`;

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
        details: `Dépôt SoleasPay initié: ${numericAmount} ${service.currency} via ${service.operator}`,
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

      if (orderId.includes("PDEP-OP-")) {
        res.json({ status: "pending", message: "En attente de confirmation OmniPay..." });
        return;
      }
      if (orderId.includes("PDEP-MP-")) {
        res.json({ status: "pending", message: "En attente de confirmation MaishaPay..." });
        return;
      }
      if (orderId.includes("PDEP-WP-")) {
        res.json({ status: "pending", message: "En attente de confirmation WiniPayer..." });
        return;
      }

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
      const partner = await storage.getPartner(req.session.partnerId!);

      let allowedCountries: string[] = [];
      let allowedOperatorsList: string[] = [];
      try {
        if (partner?.allowedCountries) allowedCountries = JSON.parse(partner.allowedCountries);
      } catch {}
      try {
        if (partner?.allowedOperators) allowedOperatorsList = JSON.parse(partner.allowedOperators);
      } catch {}

      let countryOperators = countries.map((country: any) => {
        let countryOps = operators
          .filter((op: any) => op.countryId === country.id)
          .map((op: any) => ({ id: op.code || op.id.toString(), name: op.name, inMaintenance: op.inMaintenance ?? false }));

        if (allowedOperatorsList.length > 0) {
          countryOps = countryOps.filter((op: any) =>
            allowedOperatorsList.some(o => o.toLowerCase() === op.name.toLowerCase() || o.toLowerCase() === (op.id || "").toLowerCase())
          );
        }

        return { id: country.code.toLowerCase(), name: country.name, currency: country.currency, methods: countryOps };
      }).filter((c: any) => c.methods.length > 0);

      if (allowedCountries.length > 0) {
        countryOperators = countryOperators.filter((c: any) =>
          allowedCountries.some(ac => ac.toLowerCase() === c.id.toLowerCase())
        );
      }

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

      const isWiniPayerOperator = selectedOperator.paymentGateway === "winipayer";

      if (isWiniPayerOperator) {
        const { createPayout, getWiniPayerPayoutOperator } = await import("./winipayer");
        const payoutOperator = getWiniPayerPayoutOperator(selectedOperator.name, country);

        if (!payoutOperator) {
          await storage.updatePartnerBalance(req.session.partnerId!, numericAmount.toString());
          return res.status(400).json({ message: "Opérateur non supporté pour le retrait automatique" });
        }

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

        await storage.updateWithdrawalRequest(withdrawalRequest.id, { status: "processing" });

        notifyPartnerWithdrawal({
          partnerName: partner.name,
          partnerId: req.session.partnerId!,
          amount: numericAmount.toString(),
          fee: fee.toString(),
          netAmount: netAmount.toString(),
          paymentMethod: selectedOperator.name,
          mobileNumber,
          country,
        });

        try {
          const payoutResult = await createPayout({
            operator: payoutOperator,
            recipients: [{
              name: walletName || partner.name || "Partenaire",
              account: mobileNumber.replace(/\s/g, ""),
              amount: netAmount,
            }],
            description: `Retrait Partenaire SendavaPay #${withdrawalRequest.id}`,
            customData: { withdrawalId: withdrawalRequest.id, partnerId: req.session.partnerId },
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
              return res.json({
                message: "Retrait effectué avec succès!",
                request: { ...withdrawalRequest, status: "approved" },
                autoProcessed: true,
              });
            } else {
              return res.json({
                message: "Votre retrait est en cours de traitement automatique.",
                request: { ...withdrawalRequest, status: "processing" },
                autoProcessed: true,
              });
            }
          } else {
            const winiError = payoutResult.errors?.msg || payoutResult.errors?.key || JSON.stringify(payoutResult.errors) || "Erreur inconnue";
            console.error("❌ WiniPayer partner payout failed:", winiError, "| operator:", payoutOperator);
            await storage.updatePartnerBalance(req.session.partnerId!, numericAmount.toString());
            await storage.updateWithdrawalRequest(withdrawalRequest.id, {
              status: "failed",
              rejectionReason: winiError,
            });
            return res.status(500).json({ message: `Le retrait automatique a échoué (${winiError}). Votre solde a été restauré.` });
          }
        } catch (payoutError) {
          console.error("Partner WiniPayer payout error:", payoutError);
          await storage.updatePartnerBalance(req.session.partnerId!, numericAmount.toString());
          await storage.updateWithdrawalRequest(withdrawalRequest.id, {
            status: "failed",
            rejectionReason: "Erreur technique",
          });
          return res.status(500).json({ message: "Erreur technique lors du retrait. Votre solde a été restauré." });
        }
      }

      if (selectedOperator.paymentGateway === "maishapay") {
        const { maishapay: mpClient, getMaishapayProvider, formatPhoneForMaishapay } = await import("./maishapay");
        const mpProvider = getMaishapayProvider(selectedOperator.name, selectedCountry.code);

        if (!mpProvider) {
          await storage.updatePartnerBalance(req.session.partnerId!, numericAmount.toString());
          return res.status(400).json({ message: "Opérateur non supporté pour le retrait automatique MaishaPay" });
        }

        const currency = selectedCountry.currency || "XOF";
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

        await storage.updateWithdrawalRequest(withdrawalRequest.id, { status: "processing" });

        notifyPartnerWithdrawal({
          partnerName: partner.name,
          partnerId: req.session.partnerId!,
          amount: numericAmount.toString(),
          fee: fee.toString(),
          netAmount: netAmount.toString(),
          paymentMethod: selectedOperator.name,
          mobileNumber,
          country,
        });

        const cleanPhone = formatPhoneForMaishapay(mobileNumber, selectedCountry.code);

        try {
          const b2cRef = `PWD-${withdrawalRequest.id}-${Date.now()}`;
          const b2cResult = await mpClient.b2cTransfer({
            transactionReference: b2cRef,
            amount: netAmount,
            currency,
            customerFullName: walletName || partner.name || "Partenaire",
            motif: `Retrait Partenaire SendavaPay #${withdrawalRequest.id}`,
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
            return res.json({
              message: "Retrait effectué avec succès!",
              request: { ...withdrawalRequest, status: "approved" },
              autoProcessed: true,
            });
          } else {
            const mpError = b2cResult.message || b2cResult.error || "Erreur MaishaPay inconnue";
            console.error("❌ MaishaPay partner B2C failed:", mpError, "| provider:", mpProvider);
            await storage.updatePartnerBalance(req.session.partnerId!, numericAmount.toString());
            await storage.updateWithdrawalRequest(withdrawalRequest.id, {
              status: "failed",
              rejectionReason: mpError,
            });
            return res.status(500).json({ message: `Le retrait automatique a échoué (${mpError}). Votre solde a été restauré.` });
          }
        } catch (mpError) {
          console.error("Partner MaishaPay B2C error:", mpError);
          await storage.updatePartnerBalance(req.session.partnerId!, numericAmount.toString());
          await storage.updateWithdrawalRequest(withdrawalRequest.id, {
            status: "failed",
            rejectionReason: "Erreur technique MaishaPay",
          });
          return res.status(500).json({ message: "Erreur technique lors du retrait. Votre solde a été restauré." });
        }
      }

      if (selectedOperator.paymentGateway === "omnipay") {
        const { omnipay: opClient, getOmnipayOperator, formatPhoneForOmnipay } = await import("./omnipay");
        const opOperator = getOmnipayOperator(selectedOperator.name);
        if (opOperator === undefined) {
          await storage.updatePartnerBalance(req.session.partnerId!, numericAmount.toString());
          return res.status(400).json({ message: "Opérateur non supporté pour le retrait automatique OmniPay" });
        }

        const currency = selectedCountry.currency || "XOF";
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
        await storage.updateWithdrawalRequest(withdrawalRequest.id, { status: "processing" });

        notifyPartnerWithdrawal({ partnerName: partner.name, partnerId: req.session.partnerId!, amount: numericAmount.toString(), fee: fee.toString(), netAmount: netAmount.toString(), paymentMethod: selectedOperator.name, mobileNumber, country });

        const cleanPhone = formatPhoneForOmnipay(mobileNumber, selectedCountry.code);
        const nameParts = (walletName || partner.name || "Partenaire").split(" ");

        try {
          const opRef = `PWD-OP-${withdrawalRequest.id}-${Date.now()}`;
          const opResult = await opClient.transfer({
            msisdn: cleanPhone,
            amount: netAmount,
            reference: opRef,
            firstName: nameParts[0],
            lastName: nameParts.slice(1).join(" ") || nameParts[0],
            operator: opOperator ?? undefined,
          });

          await storage.updateWithdrawalRequest(withdrawalRequest.id, { externalReference: opRef, transactionReference: opResult.id?.toString() || null });

          if (String(opResult.success) === "1") {
            await storage.updateWithdrawalRequest(withdrawalRequest.id, { status: "approved", processedAt: new Date() });
            return res.json({ message: "Retrait effectué avec succès!", request: { ...withdrawalRequest, status: "approved" }, autoProcessed: true });
          } else {
            const opError = opResult.message || "Erreur OmniPay inconnue";
            console.error("❌ OmniPay partner transfer failed:", opError);
            await storage.updatePartnerBalance(req.session.partnerId!, numericAmount.toString());
            await storage.updateWithdrawalRequest(withdrawalRequest.id, { status: "failed", rejectionReason: opError });
            return res.status(500).json({ message: `Le retrait automatique a échoué (${opError}). Votre solde a été restauré.` });
          }
        } catch (opErr) {
          console.error("Partner OmniPay transfer error:", opErr);
          await storage.updatePartnerBalance(req.session.partnerId!, numericAmount.toString());
          await storage.updateWithdrawalRequest(withdrawalRequest.id, { status: "failed", rejectionReason: "Erreur technique OmniPay" });
          return res.status(500).json({ message: "Erreur technique lors du retrait. Votre solde a été restauré." });
        }
      }

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

      notifyPartnerWithdrawal({
        partnerName: partner.name,
        partnerId: req.session.partnerId!,
        amount: numericAmount.toString(),
        fee: fee.toString(),
        netAmount: netAmount.toString(),
        paymentMethod: selectedOperator.name,
        mobileNumber,
        country,
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

      if (!partner.enablePaymentLinks) {
        return res.status(403).json({ message: "La fonction de liens de paiement est désactivée pour votre compte" });
      }

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

  app.post("/api/webhook/winipayer", async (req: Request, res: Response) => {
    try {
      const data = req.body;
      console.log("📥 === WiniPayer Webhook reçu ===");
      console.log("📥 Data:", JSON.stringify(data));

      const invoice = data?.results?.invoice || data?.invoice || data;
      const customData = invoice?.custom_data || {};
      const reference = customData.reference;
      const state = invoice?.state?.toLowerCase();

      if (!reference) {
        console.error("❌ WiniPayer webhook: Pas de référence dans custom_data");
        return res.status(200).json({ message: "OK" });
      }

      const transaction = await storage.getPartnerTransactionByReference(reference);
      if (!transaction) {
        console.error("❌ WiniPayer webhook: Transaction introuvable:", reference);
        return res.status(200).json({ message: "OK" });
      }

      if (transaction.status === "completed") {
        console.log("ℹ️ WiniPayer webhook: Transaction déjà complétée:", reference);
        return res.status(200).json({ message: "OK" });
      }

      const { db } = await import("./db");
      const { sql } = await import("drizzle-orm");

      if (state === "success" || state === "completed") {
        let hashValid = false;
        try {
          const { winipayer } = await import("./winipayer");
          hashValid = winipayer.validateHash({
            uuid: invoice.uuid,
            crypto: invoice.crypto,
            amount: invoice.amount || invoice.amount_init,
            created_at: invoice.created_at,
            hash: invoice.hash,
          });
        } catch {}

        if (!hashValid) {
          console.error(`❌ WiniPayer webhook: Hash invalide pour ${reference} - webhook rejeté`);
          await storage.createPartnerLog({
            partnerId: transaction.partnerId,
            action: "error",
            details: `WiniPayer webhook: Hash invalide pour ${reference} - paiement non confirmé (possible tentative de fraude)`,
            ipAddress: req.ip || req.socket.remoteAddress,
          });
          return res.status(200).json({ message: "OK" });
        }

        const updateResult = await db.execute(sql`UPDATE partner_transactions SET status = 'completed', completed_at = NOW(), metadata = ${JSON.stringify({
          provider: "winipayer",
          winiUuid: invoice.uuid,
          winiState: state,
          winiOperator: invoice.operator,
          winiOperatorRef: invoice.operator_ref,
          winiAmountAvailable: invoice.amount_available,
          winiCommission: invoice.commission_amount,
          winiHashValid: hashValid,
          winiCustomerName: invoice.customer_pay?.name,
          winiCustomerPhone: invoice.customer_pay?.phone,
        })} WHERE reference = ${reference} AND status IN ('processing', 'pending')`);

        const rowsAffected = (updateResult as any)?.rowCount || (updateResult as any)?.length || 0;
        if (rowsAffected > 0) {
          const netAmount = parseFloat(transaction.amount as string) - parseFloat(transaction.fee as string);
          await db.execute(sql`UPDATE partners SET balance = balance + ${netAmount.toString()} WHERE id = ${transaction.partnerId}`);

          await storage.createPartnerLog({
            partnerId: transaction.partnerId,
            action: "payment_received",
            details: `WiniPayer webhook: Paiement confirmé ${reference} - ${transaction.amount} ${transaction.currency} via ${invoice.operator || "N/A"}`,
            ipAddress: req.ip || req.socket.remoteAddress,
          });
        }

        console.log(`✅ WiniPayer webhook: Transaction ${reference} complétée`);
      } else if (state === "failed" || state === "cancelled" || state === "expired") {
        await db.execute(sql`UPDATE partner_transactions SET status = 'failed', metadata = ${JSON.stringify({
          provider: "winipayer",
          winiUuid: invoice.uuid,
          winiState: state,
        })} WHERE reference = ${reference} AND status IN ('processing', 'pending')`);

        await storage.createPartnerLog({
          partnerId: transaction.partnerId,
          action: "api_call",
          details: `WiniPayer webhook: Paiement ${state}: ${reference}`,
          ipAddress: req.ip || req.socket.remoteAddress,
        });

        console.log(`❌ WiniPayer webhook: Transaction ${reference} ${state}`);
      }

      if (transaction.callbackUrl) {
        try {
          await fetch(transaction.callbackUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reference,
              status: state === "success" || state === "completed" ? "SUCCESS" : "FAILED",
              amount: transaction.amount,
              currency: transaction.currency,
              provider: "winipayer",
              operator: invoice.operator,
            }),
          });
        } catch (callbackErr) {
          console.error("WiniPayer webhook: Callback error:", callbackErr);
        }
      }

      res.status(200).json({ message: "OK" });
    } catch (error) {
      console.error("WiniPayer webhook error:", error);
      res.status(200).json({ message: "OK" });
    }
  });

  app.get("/api/partner/commission-rates", requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const [settings, partner] = await Promise.all([
        storage.getCommissionSettings(),
        storage.getPartner(req.session.partnerId!),
      ]);
      res.json({
        depositRate: parseFloat(settings?.depositRate || "7"),
        withdrawalRate: parseFloat(settings?.withdrawalRate || "7"),
        encaissementRate: partner?.commissionRate
          ? parseFloat(partner.commissionRate)
          : parseFloat(settings?.encaissementRate || "7"),
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });
}
