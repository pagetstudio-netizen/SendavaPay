/**
 * user-report.ts — Génération du rapport PDF complet des utilisateurs
 * Contient : statistiques globales, soldes par pays, détail par utilisateur
 * (sans mots de passe). Protégé par OTP admin.
 */

import PDFDocument from "pdfkit";
import { storage } from "./storage";
import { pool } from "./db";

export async function generateUserReportPDF(): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const chunks: Buffer[] = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ── Collecte des données ────────────────────────────────────────────────
      const allUsers    = await storage.getAllUsers();
      const normalUsers = allUsers.filter((u) => u.role !== "admin");
      const allCountries = await storage.getCountries();

      // KYC status par userId (dernière demande)
      const kycMap: Record<number, string> = {};
      if (pool) {
        const client = await pool.connect();
        try {
          const res = await client.query(`
            SELECT DISTINCT ON (user_id) user_id, status
            FROM kyc_requests
            ORDER BY user_id, created_at DESC
          `);
          for (const row of res.rows) kycMap[row.user_id] = row.status;
        } catch { /* table inexistante : on ignore */ }
        finally { client.release(); }
      }

      // Wallets par userId
      const walletsMap: Record<number, Awaited<ReturnType<typeof storage.getUserWallets>>> = {};
      for (const u of normalUsers) {
        try { walletsMap[u.id] = await storage.getUserWallets(u.id); } catch { walletsMap[u.id] = []; }
      }

      // Statistiques globales
      const totalBalance   = normalUsers.reduce((s, u) => s + parseFloat(u.balance || "0"), 0);
      const verified       = normalUsers.filter((u) => u.isVerified).length;
      const emailVerified  = normalUsers.filter((u) => u.emailVerified).length;
      const blocked        = normalUsers.filter((u) => u.isBlocked).length;
      const kycApproved    = Object.values(kycMap).filter((s) => s === "approved").length;
      const kycPending     = Object.values(kycMap).filter((s) => s === "pending").length;
      const kycRejected    = Object.values(kycMap).filter((s) => s === "rejected").length;

      // Soldes par pays (depuis les wallets)
      const countryBalances: Record<string, { name: string; currency: string; total: number; users: number }> = {};
      for (const c of allCountries) {
        countryBalances[c.code] = { name: c.name, currency: c.currency, total: 0, users: 0 };
      }
      for (const u of normalUsers) {
        const wallets = walletsMap[u.id] || [];
        const seen = new Set<string>();
        for (const w of wallets) {
          const country = allCountries.find((c) => c.id === w.countryId);
          if (country && countryBalances[country.code] !== undefined) {
            countryBalances[country.code].total += parseFloat(w.balance || "0");
            if (!seen.has(country.code)) {
              countryBalances[country.code].users++;
              seen.add(country.code);
            }
          }
        }
      }

      // ── Métadonnées ─────────────────────────────────────────────────────────
      const now     = new Date();
      const lopts: Intl.DateTimeFormatOptions = { timeZone: "Africa/Lome", year: "numeric", month: "long", day: "numeric" };
      const dateStr = now.toLocaleDateString("fr-FR", lopts);
      const timeStr = now.toLocaleTimeString("fr-FR", { timeZone: "Africa/Lome" });

      const W = doc.page.width;

      // ── HEADER ──────────────────────────────────────────────────────────────
      doc.rect(0, 0, W, 80).fill("#0f172a");
      doc.fillColor("#f8fafc").fontSize(22).font("Helvetica-Bold").text("SendavaPay", 40, 18);
      doc.fontSize(10).font("Helvetica").fillColor("#94a3b8")
        .text("Rapport complet des utilisateurs — CONFIDENTIEL", 40, 46);
      doc.fontSize(9).fillColor("#64748b")
        .text(`Généré le ${dateStr} à ${timeStr} (UTC+0 Lomé)`, 40, 62);
      doc.rect(0, 78, W, 3).fill("#3b82f6");
      doc.moveDown(3.5);

      // ── RÉSUMÉ PLATEFORME ────────────────────────────────────────────────────
      const sy = doc.y;
      doc.rect(40, sy, W - 80, 100).fill("#f1f5f9");
      doc.rect(40, sy, 4, 100).fill("#3b82f6");
      doc.fillColor("#1e293b").fontSize(13).font("Helvetica-Bold")
        .text("Résumé de la plateforme", 55, sy + 12);
      doc.fontSize(9).font("Helvetica").fillColor("#475569");

      const col1x = 55, col2x = W / 2;
      doc.text(`Utilisateurs totaux : ${normalUsers.length}`,          col1x, sy + 30);
      doc.text(`Comptes vérifiés (KYC) : ${verified}`,                  col1x, sy + 44);
      doc.text(`Email confirmé : ${emailVerified}`,                     col1x, sy + 58);
      doc.text(`Comptes bloqués : ${blocked}`,                          col1x, sy + 72);
      doc.text(`Solde total plateforme : ${totalBalance.toLocaleString("fr-FR")} XOF`, col2x, sy + 30);
      doc.text(`KYC approuvés : ${kycApproved}`,                        col2x, sy + 44);
      doc.text(`KYC en attente : ${kycPending}`,                        col2x, sy + 58);
      doc.text(`KYC rejetés : ${kycRejected}`,                          col2x, sy + 72);
      doc.y = sy + 110;

      // ── SOLDES PAR PAYS ──────────────────────────────────────────────────────
      doc.moveDown(0.6);
      doc.fillColor("#0f172a").fontSize(13).font("Helvetica-Bold").text("Soldes par pays / wallet");
      doc.moveDown(0.4);

      const validCountries = Object.entries(countryBalances).filter(([, d]) => d.total > 0 || d.users > 0);
      if (validCountries.length === 0) {
        doc.fontSize(9).font("Helvetica").fillColor("#64748b").text("Aucun solde enregistré.");
      } else {
        // En-tête tableau pays
        const cy = doc.y;
        const CW_pays = { pays: 160, utilisateurs: 80, total: W - 80 - 160 - 80 };
        doc.rect(40, cy, W - 80, 18).fill("#0f172a");
        doc.fillColor("#f8fafc").fontSize(8).font("Helvetica-Bold");
        doc.text("Pays", 44, cy + 4);
        doc.text("Utilisateurs", 44 + CW_pays.pays, cy + 4);
        doc.text("Solde total", 44 + CW_pays.pays + CW_pays.utilisateurs, cy + 4, { width: CW_pays.total, align: "right" });

        let ry = cy + 20;
        for (let i = 0; i < validCountries.length; i++) {
          if (ry > doc.page.height - 50) { doc.addPage(); ry = 40; }
          const [, d] = validCountries[i];
          doc.rect(40, ry, W - 80, 16).fill(i % 2 === 0 ? "#f8fafc" : "#ffffff");
          doc.fillColor("#334155").fontSize(8).font("Helvetica");
          doc.text(`${d.name}`, 44, ry + 3, { width: CW_pays.pays - 4, ellipsis: true });
          doc.text(`${d.users}`, 44 + CW_pays.pays, ry + 3, { width: CW_pays.utilisateurs - 4 });
          doc.fillColor(d.total > 0 ? "#059669" : "#94a3b8").font("Helvetica-Bold")
            .text(`${d.total.toLocaleString("fr-FR")} ${d.currency}`, 44 + CW_pays.pays + CW_pays.utilisateurs, ry + 3, { width: CW_pays.total - 4, align: "right" });
          ry += 16;
        }
        doc.y = ry + 8;
      }

      // ── TABLEAU UTILISATEURS ─────────────────────────────────────────────────
      doc.moveDown(1);
      doc.fillColor("#0f172a").fontSize(13).font("Helvetica-Bold").text("Détail des comptes utilisateurs");
      doc.moveDown(0.4);

      // Colonnes
      const C = {
        num:     40,
        name:    60,
        email:   180,
        phone:   330,
        country: 410,
        balance: 460,
        status:  510,
      };
      const CW = {
        num:     18,
        name:    118,
        email:   148,
        phone:   78,
        country: 48,
        balance: 48,
        status:  W - 80 - 470,
      };

      function drawHeader(yPos: number) {
        doc.rect(40, yPos, W - 80, 18).fill("#0f172a");
        doc.fillColor("#f8fafc").fontSize(7).font("Helvetica-Bold");
        doc.text("#",         C.num,     yPos + 4, { width: CW.num });
        doc.text("Nom",       C.name,    yPos + 4, { width: CW.name });
        doc.text("Email",     C.email,   yPos + 4, { width: CW.email });
        doc.text("Téléphone", C.phone,   yPos + 4, { width: CW.phone });
        doc.text("Pays",      C.country, yPos + 4, { width: CW.country });
        doc.text("Solde",     C.balance, yPos + 4, { width: CW.balance, align: "right" });
        doc.text("Statut",    C.status,  yPos + 4, { width: CW.status });
        return yPos + 20;
      }

      let rowY = drawHeader(doc.y);

      for (let i = 0; i < normalUsers.length; i++) {
        if (rowY > doc.page.height - 50) {
          doc.addPage();
          rowY = 40;
          rowY = drawHeader(rowY);
        }

        const u = normalUsers[i];
        const bal = parseFloat(u.balance || "0");
        const kyc = kycMap[u.id];
        const bg  = i % 2 === 0 ? "#f8fafc" : "#ffffff";
        doc.rect(40, rowY, W - 80, 16).fill(bg);

        // Indicateur couleur côté gauche selon statut
        const sideColor = u.isBlocked ? "#dc2626" : u.isVerified ? "#16a34a" : "#f59e0b";
        doc.rect(40, rowY, 3, 16).fill(sideColor);

        doc.fillColor("#334155").fontSize(7).font("Helvetica");
        doc.text(String(i + 1), C.num + 2, rowY + 3, { width: CW.num });
        doc.text(u.fullName || "—", C.name + 2, rowY + 3, { width: CW.name - 4, ellipsis: true });
        doc.text(u.email || "—",   C.email + 2, rowY + 3, { width: CW.email - 4, ellipsis: true });
        doc.text(u.phone || "—",   C.phone + 2, rowY + 3, { width: CW.phone - 4, ellipsis: true });
        doc.text((u.country || "—").toUpperCase(), C.country + 2, rowY + 3, { width: CW.country - 2 });

        // Solde
        doc.fillColor(bal > 0 ? "#16a34a" : "#64748b").font("Helvetica-Bold")
          .text(`${bal.toLocaleString("fr-FR")}`, C.balance + 2, rowY + 3, { width: CW.balance - 4, align: "right" });

        // Statut combiné
        const parts: string[] = [];
        if (u.isBlocked)         parts.push("🚫Bloqué");
        else if (u.isVerified)   parts.push("✓KYC");
        else                     parts.push("?KYC");
        if (u.emailVerified)     parts.push("✉✓");
        if (kyc === "pending")   parts.push("⏳");
        if (kyc === "rejected")  parts.push("✗KYC");

        doc.fillColor(u.isBlocked ? "#dc2626" : u.isVerified ? "#16a34a" : "#92400e")
          .fontSize(6.5).font("Helvetica")
          .text(parts.join(" "), C.status + 2, rowY + 4, { width: CW.status - 4, ellipsis: true });

        rowY += 16;
      }

      // ── NOTE LÉGALE / FOOTER ─────────────────────────────────────────────────
      if (doc.y > doc.page.height - 60) doc.addPage();
      doc.moveDown(1.5);
      doc.rect(40, doc.y, W - 80, 1).fill("#e2e8f0");
      doc.moveDown(0.5);
      doc.fillColor("#94a3b8").fontSize(7).font("Helvetica")
        .text(
          `⚠️  DOCUMENT STRICTEMENT CONFIDENTIEL — USAGE ADMINISTRATEUR UNIQUEMENT\n` +
          `Ce fichier contient des données personnelles protégées. Toute diffusion non autorisée est interdite.\n` +
          `SendavaPay © ${now.getFullYear()} — Généré le ${dateStr} à ${timeStr}`,
          40, doc.y, { align: "center", width: W - 80 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
