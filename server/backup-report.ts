import PDFDocument from "pdfkit";
import { storage } from "./storage";
import { getCredential } from "./credentials";
import { log } from "./index";

async function generateBackupPDF(): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const allUsers = await storage.getAllUsers();
      const normalUsers = allUsers.filter((u) => u.role !== "admin");
      const allCountries = await storage.getCountries();

      const countryBalances: Record<string, { name: string; currency: string; total: number }> = {};
      for (const country of allCountries) {
        countryBalances[country.code] = { name: country.name, currency: country.currency, total: 0 };
      }

      const usersData: Array<{ user: typeof normalUsers[0]; totalBalance: number }> = [];

      for (const user of normalUsers) {
        const userWallets = await storage.getUserWallets(user.id);
        const totalBalance = parseFloat(user.balance || "0");
        for (const wallet of userWallets) {
          const country = allCountries.find((c) => c.id === wallet.countryId);
          if (country && countryBalances[country.code] !== undefined) {
            countryBalances[country.code].total += parseFloat(wallet.balance || "0");
          }
        }
        usersData.push({ user, totalBalance });
      }

      const now = new Date();
      const lopts: Intl.DateTimeFormatOptions = { timeZone: "Africa/Lome", year: "numeric", month: "long", day: "numeric" };
      const dateStr = now.toLocaleDateString("fr-FR", lopts);
      const timeStr = now.toLocaleTimeString("fr-FR", { timeZone: "Africa/Lome" });
      const totalPlatform = usersData.reduce((s, { totalBalance }) => s + totalBalance, 0);

      // ── HEADER ──────────────────────────────────────────────────────────────
      const W = doc.page.width;
      doc.rect(0, 0, W, 75).fill("#0f172a");
      doc.fillColor("#f8fafc").fontSize(20).font("Helvetica-Bold").text("SendavaPay", 40, 16);
      doc.fontSize(10).font("Helvetica").fillColor("#94a3b8")
        .text(`Rapport de sauvegarde quotidien — ${dateStr} à ${timeStr}`, 40, 44);
      doc.fillColor("#3b82f6").rect(0, 72, W, 3).fill("#3b82f6");
      doc.moveDown(3.5);

      // ── RÉSUMÉ ──────────────────────────────────────────────────────────────
      const summaryY = doc.y;
      doc.rect(40, summaryY, W - 80, 80).fill("#f1f5f9");
      doc.rect(40, summaryY, 4, 80).fill("#3b82f6");

      doc.fillColor("#1e293b").fontSize(13).font("Helvetica-Bold")
        .text("Résumé de la plateforme", 55, summaryY + 12);
      doc.fontSize(10).font("Helvetica").fillColor("#475569");
      doc.text(`Utilisateurs actifs : ${normalUsers.length}`, 55, summaryY + 32);
      doc.text(`Solde total plateforme : ${totalPlatform.toLocaleString("fr-FR")} XOF`, 55, summaryY + 48);
      doc.text(`Date de génération : ${dateStr} à ${timeStr}`, 55, summaryY + 64);
      doc.y = summaryY + 90;
      doc.moveDown(0.8);

      // ── SOLDES PAR PAYS ──────────────────────────────────────────────────────
      doc.fillColor("#0f172a").fontSize(13).font("Helvetica-Bold").text("Soldes par pays");
      doc.moveDown(0.4);

      const validCountries = Object.entries(countryBalances).filter(([, d]) => d.total > 0);
      if (validCountries.length === 0) {
        doc.fontSize(10).font("Helvetica").fillColor("#64748b").text("Aucun solde enregistré par pays.");
      } else {
        let colY = doc.y;
        const half = Math.ceil(validCountries.length / 2);
        const colW = (W - 80) / 2 - 10;

        for (let i = 0; i < validCountries.length; i++) {
          const [code, data] = validCountries[i];
          const isLeft = i < half;
          const x = isLeft ? 40 : 40 + colW + 20;
          const y = isLeft ? colY + i * 22 : colY + (i - half) * 22;
          if (y > doc.page.height - 80) { doc.addPage(); colY = 40; }
          doc.rect(x, y, colW, 18).fill("#f8fafc");
          doc.rect(x, y, 3, 18).fill("#10b981");
          doc.fillColor("#1e293b").fontSize(9).font("Helvetica-Bold")
            .text(`${data.name} (${code})`, x + 8, y + 4, { width: colW - 90 });
          doc.fillColor("#059669").font("Helvetica-Bold")
            .text(`${data.total.toLocaleString("fr-FR")} ${data.currency}`, x + colW - 85, y + 4, { width: 82, align: "right" });
        }
        doc.y = colY + Math.ceil(validCountries.length / 2) * 22 + 10;
      }

      doc.moveDown(1.2);

      // ── TABLEAU UTILISATEURS ─────────────────────────────────────────────────
      doc.fillColor("#0f172a").fontSize(13).font("Helvetica-Bold").text("Comptes utilisateurs");
      doc.moveDown(0.4);

      const C = { email: 40, name: 195, phone: 340, balance: 450 };
      const CW = { email: 150, name: 140, phone: 105, balance: W - 80 - 410 };

      function drawTableHeader(yPos: number) {
        doc.rect(40, yPos, W - 80, 20).fill("#0f172a");
        doc.fillColor("#f8fafc").fontSize(8).font("Helvetica-Bold");
        doc.text("Email", C.email + 4, yPos + 5, { width: CW.email });
        doc.text("Nom complet", C.name + 4, yPos + 5, { width: CW.name });
        doc.text("Téléphone", C.phone + 4, yPos + 5, { width: CW.phone });
        doc.text("Solde (XOF)", C.balance + 4, yPos + 5, { width: CW.balance, align: "right" });
        return yPos + 22;
      }

      let rowY = drawTableHeader(doc.y);

      for (let i = 0; i < usersData.length; i++) {
        if (rowY > doc.page.height - 50) {
          doc.addPage();
          rowY = 40;
          rowY = drawTableHeader(rowY);
        }
        const { user, totalBalance } = usersData[i];
        const bg = i % 2 === 0 ? "#f8fafc" : "#ffffff";
        doc.rect(40, rowY, W - 80, 17).fill(bg);

        doc.fillColor("#334155").fontSize(7.5).font("Helvetica");
        doc.text(user.email || "—", C.email + 4, rowY + 4, { width: CW.email - 4, ellipsis: true });
        doc.text(`${user.firstName || ""} ${user.lastName || ""}`.trim() || "—", C.name + 4, rowY + 4, { width: CW.name - 4, ellipsis: true });
        doc.text(user.phone || "—", C.phone + 4, rowY + 4, { width: CW.phone - 4, ellipsis: true });

        const balColor = totalBalance > 0 ? "#16a34a" : "#64748b";
        doc.fillColor(balColor).font("Helvetica-Bold")
          .text(`${totalBalance.toLocaleString("fr-FR")}`, C.balance + 4, rowY + 4, { width: CW.balance - 8, align: "right" });

        rowY += 17;
      }

      // ── FOOTER ───────────────────────────────────────────────────────────────
      const pages = (doc as any)._pageCount || 1;
      doc.fillColor("#94a3b8").fontSize(7).font("Helvetica")
        .text(
          `Document confidentiel — SendavaPay © ${now.getFullYear()} — Généré automatiquement le ${dateStr}`,
          40, doc.page.height - 25, { align: "center", width: W - 80 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export async function sendDailyBackupReport(): Promise<void> {
  const token = getCredential("TELEGRAM_BOT_TOKEN");
  const chatId = getCredential("TELEGRAM_CHAT_ID");

  if (!token || !chatId) {
    log("Backup PDF: TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID non configuré — rapport ignoré", "backup");
    return;
  }

  try {
    log("Génération du rapport PDF quotidien...", "backup");
    const pdfBuffer = await generateBackupPDF();

    const now = new Date();
    const dateTag = now.toLocaleDateString("fr-FR", { timeZone: "Africa/Lome" }).replace(/\//g, "-");
    const filename = `sendavapay-backup-${dateTag}.pdf`;

    const allUsers = await storage.getAllUsers();
    const normalUsers = allUsers.filter((u) => u.role !== "admin");
    const total = normalUsers.reduce((s, u) => s + parseFloat(u.balance || "0"), 0);

    const caption =
      `📊 *Rapport quotidien SendavaPay*\n` +
      `📅 ${now.toLocaleDateString("fr-FR", { timeZone: "Africa/Lome", year: "numeric", month: "long", day: "numeric" })}\n\n` +
      `👥 Utilisateurs : *${normalUsers.length}*\n` +
      `💰 Solde total : *${total.toLocaleString("fr-FR")} XOF*\n\n` +
      `_Ce fichier contient la liste complète des comptes, soldes individuels et soldes par pays._`;

    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("caption", caption);
    formData.append("parse_mode", "Markdown");
    formData.append("document", new Blob([pdfBuffer], { type: "application/pdf" }), filename);

    const response = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json() as { ok: boolean; description?: string };
    if (result.ok) {
      log(`Rapport PDF "${filename}" envoyé sur Telegram avec succès`, "backup");
    } else {
      log(`Erreur envoi PDF Telegram: ${result.description}`, "backup");
    }
  } catch (error) {
    log(`Erreur génération rapport PDF: ${(error as Error).message}`, "backup");
  }
}
