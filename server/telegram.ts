const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramMessage(text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log("[Telegram] Bot token or chat ID not configured, skipping notification");
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[Telegram] Failed to send message:", errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Telegram] Error sending message:", error);
    return false;
  }
}

function formatAmount(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toLocaleString("fr-FR");
}

function formatDate(date?: Date | string | null): string {
  const d = date ? new Date(date) : new Date();
  return d.toLocaleString("fr-FR", {
    timeZone: "Africa/Lome",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function notifyDeposit(data: {
  userName: string;
  userId: number;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  phone?: string;
  operator?: string;
  reference?: string;
}) {
  const msg =
    `<b>DEPOT</b>\n\n` +
    `<b>Utilisateur:</b> ${data.userName} (#${data.userId})\n` +
    `<b>Montant:</b> ${formatAmount(data.amount)} ${data.currency}\n` +
    `<b>Frais:</b> ${formatAmount(data.fee)} ${data.currency}\n` +
    `<b>Net credite:</b> ${formatAmount(data.netAmount)} ${data.currency}\n` +
    (data.phone ? `<b>Telephone:</b> ${data.phone}\n` : "") +
    (data.operator ? `<b>Operateur:</b> ${data.operator}\n` : "") +
    (data.reference ? `<b>Reference:</b> ${data.reference}\n` : "") +
    `<b>Date:</b> ${formatDate()}`;

  sendTelegramMessage(msg).catch((err) =>
    console.error("[Telegram] Deposit notification error:", err)
  );
}

export function notifyPaymentReceived(data: {
  merchantName: string;
  merchantId: number;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  payerPhone?: string;
  payerName?: string;
  paymentLinkTitle?: string;
  reference?: string;
  source?: string;
}) {
  const sourceLabel = data.source === "api" ? "PAIEMENT API" : "PAIEMENT LIEN";
  const msg =
    `<b>${sourceLabel}</b>\n\n` +
    `<b>Marchand:</b> ${data.merchantName} (#${data.merchantId})\n` +
    (data.paymentLinkTitle ? `<b>Lien:</b> ${data.paymentLinkTitle}\n` : "") +
    `<b>Montant:</b> ${formatAmount(data.amount)} ${data.currency}\n` +
    `<b>Frais:</b> ${formatAmount(data.fee)} ${data.currency}\n` +
    `<b>Net credite:</b> ${formatAmount(data.netAmount)} ${data.currency}\n` +
    (data.payerName ? `<b>Payeur:</b> ${data.payerName}\n` : "") +
    (data.payerPhone ? `<b>Tel payeur:</b> ${data.payerPhone}\n` : "") +
    (data.reference ? `<b>Reference:</b> ${data.reference}\n` : "") +
    `<b>Date:</b> ${formatDate()}`;

  sendTelegramMessage(msg).catch((err) =>
    console.error("[Telegram] Payment received notification error:", err)
  );
}

export function notifyWithdrawalRequest(data: {
  userName: string;
  userId: number;
  amount: string;
  fee: string;
  netAmount: string;
  paymentMethod: string;
  mobileNumber: string;
  country: string;
  walletName?: string | null;
}) {
  const msg =
    `<b>DEMANDE DE RETRAIT</b>\n\n` +
    `<b>Utilisateur:</b> ${data.userName} (#${data.userId})\n` +
    `<b>Montant:</b> ${formatAmount(data.amount)} XOF\n` +
    `<b>Frais:</b> ${formatAmount(data.fee)} XOF\n` +
    `<b>Net a envoyer:</b> ${formatAmount(data.netAmount)} XOF\n` +
    `<b>Operateur:</b> ${data.paymentMethod}\n` +
    `<b>Numero:</b> ${data.mobileNumber}\n` +
    `<b>Pays:</b> ${data.country}\n` +
    (data.walletName ? `<b>Nom wallet:</b> ${data.walletName}\n` : "") +
    `<b>Date:</b> ${formatDate()}\n\n` +
    `Action requise dans le panneau admin.`;

  sendTelegramMessage(msg).catch((err) =>
    console.error("[Telegram] Withdrawal request notification error:", err)
  );
}

export function notifyWithdrawalApproved(data: {
  userName: string;
  userId: number;
  amount: string;
  netAmount: string;
  paymentMethod: string;
  mobileNumber: string;
}) {
  const msg =
    `<b>RETRAIT APPROUVE</b>\n\n` +
    `<b>Utilisateur:</b> ${data.userName} (#${data.userId})\n` +
    `<b>Montant:</b> ${formatAmount(data.amount)} XOF\n` +
    `<b>Net envoye:</b> ${formatAmount(data.netAmount)} XOF\n` +
    `<b>Operateur:</b> ${data.paymentMethod}\n` +
    `<b>Numero:</b> ${data.mobileNumber}\n` +
    `<b>Date:</b> ${formatDate()}`;

  sendTelegramMessage(msg).catch((err) =>
    console.error("[Telegram] Withdrawal approved notification error:", err)
  );
}

export function notifyWithdrawalAutoProcessed(data: {
  userName: string;
  userId: number;
  amount: string;
  netAmount: string;
  paymentMethod: string;
  mobileNumber: string;
  payoutUuid: string;
  status: string;
  errorDetail?: string;
  payoutOperator?: string;
}) {
  const statusLabel = data.status === "success" ? "REUSSI" : data.status === "failed" ? "ECHOUE" : "EN COURS";
  const emoji = data.status === "success" ? "✅" : data.status === "failed" ? "❌" : "⏳";
  const msg =
    `<b>${emoji} RETRAIT AUTOMATIQUE ${statusLabel}</b>\n\n` +
    `<b>Utilisateur:</b> ${data.userName} (#${data.userId})\n` +
    `<b>Montant:</b> ${formatAmount(data.amount)} XOF\n` +
    `<b>Net envoye:</b> ${formatAmount(data.netAmount)} XOF\n` +
    `<b>Operateur:</b> ${data.paymentMethod}\n` +
    (data.payoutOperator ? `<b>Slug WiniPayer:</b> <code>${data.payoutOperator}</code>\n` : "") +
    `<b>Numero:</b> ${data.mobileNumber}\n` +
    `<b>Ref Payout:</b> ${data.payoutUuid}\n` +
    (data.errorDetail ? `<b>Erreur WiniPayer:</b> <code>${data.errorDetail}</code>\n` : "") +
    `<b>Date:</b> ${formatDate()}`;

  sendTelegramMessage(msg).catch((err) =>
    console.error("[Telegram] Auto withdrawal notification error:", err)
  );
}

export function notifyWithdrawalRejected(data: {
  userName: string;
  userId: number;
  amount: string;
  paymentMethod: string;
  mobileNumber: string;
  reason: string;
}) {
  const msg =
    `<b>RETRAIT REJETE</b>\n\n` +
    `<b>Utilisateur:</b> ${data.userName} (#${data.userId})\n` +
    `<b>Montant:</b> ${formatAmount(data.amount)} XOF\n` +
    `<b>Operateur:</b> ${data.paymentMethod}\n` +
    `<b>Numero:</b> ${data.mobileNumber}\n` +
    `<b>Raison:</b> ${data.reason}\n` +
    `<b>Date:</b> ${formatDate()}`;

  sendTelegramMessage(msg).catch((err) =>
    console.error("[Telegram] Withdrawal rejected notification error:", err)
  );
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const masked = local.length > 2 ? local[0] + "***" + local[local.length - 1] : "***";
  return `${masked}@${domain}`;
}

function maskPhone(phone: string): string {
  if (phone.length <= 4) return "****";
  return phone.slice(0, -4).replace(/./g, "*") + phone.slice(-4);
}

export function notifyNewUser(data: {
  userName: string;
  userId: number;
  email: string;
  phone: string;
}) {
  const msg =
    `<b>NOUVEL UTILISATEUR</b>\n\n` +
    `<b>Nom:</b> ${data.userName}\n` +
    `<b>ID:</b> #${data.userId}\n` +
    `<b>Email:</b> ${maskEmail(data.email)}\n` +
    `<b>Telephone:</b> ${maskPhone(data.phone)}\n` +
    `<b>Date:</b> ${formatDate()}`;

  sendTelegramMessage(msg).catch((err) =>
    console.error("[Telegram] New user notification error:", err)
  );
}

export async function sendBotReply(chatId: string | number, text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) return false;
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function notifyKycSubmitted(data: {
  userName: string;
  userId: number;
  documentType: string;
  country: string;
}) {
  const msg =
    `<b>📋 NOUVEAU DOSSIER KYC</b>\n\n` +
    `<b>Utilisateur:</b> ${data.userName} (#${data.userId})\n` +
    `<b>Type de document:</b> ${data.documentType}\n` +
    `<b>Pays:</b> ${data.country}\n` +
    `<b>Date:</b> ${formatDate()}\n\n` +
    `Action requise dans le panneau admin → KYC.`;

  sendTelegramMessage(msg).catch(err =>
    console.error("[Telegram] KYC notification error:", err)
  );
}

export function notifyAdminLogin(data: {
  userName: string;
  userId: number;
  ip: string;
}) {
  const msg =
    `<b>🔐 CONNEXION ADMINISTRATEUR</b>\n\n` +
    `<b>Admin:</b> ${data.userName} (#${data.userId})\n` +
    `<b>IP:</b> <code>${data.ip}</code>\n` +
    `<b>Date:</b> ${formatDate()}`;

  sendTelegramMessage(msg).catch(err =>
    console.error("[Telegram] Admin login notification error:", err)
  );
}

export function notifyPartnerWithdrawal(data: {
  partnerName: string;
  partnerId: number;
  amount: string;
  fee: string;
  netAmount: string;
  paymentMethod: string;
  mobileNumber: string;
  country: string;
}) {
  const msg =
    `<b>🏢 RETRAIT PARTENAIRE</b>\n\n` +
    `<b>Partenaire:</b> ${data.partnerName} (#${data.partnerId})\n` +
    `<b>Montant:</b> ${formatAmount(data.amount)} FCFA\n` +
    `<b>Frais:</b> ${formatAmount(data.fee)} FCFA\n` +
    `<b>Net a envoyer:</b> ${formatAmount(data.netAmount)} FCFA\n` +
    `<b>Operateur:</b> ${data.paymentMethod}\n` +
    `<b>Numero:</b> ${data.mobileNumber}\n` +
    `<b>Pays:</b> ${data.country}\n` +
    `<b>Date:</b> ${formatDate()}\n\n` +
    `Action requise dans le panneau admin.`;

  sendTelegramMessage(msg).catch(err =>
    console.error("[Telegram] Partner withdrawal notification error:", err)
  );
}

export function notifyLargeAmount(data: {
  type: string;
  userName: string;
  userId: number;
  amount: number;
  currency: string;
  operator?: string;
  reference?: string;
}) {
  const typeLabel = data.type === "deposit" ? "DEPOT" : data.type === "payment" ? "PAIEMENT" : data.type.toUpperCase();
  const msg =
    `<b>🚨 ALERTE GROS MONTANT</b>\n\n` +
    `<b>Type:</b> ${typeLabel}\n` +
    `<b>Utilisateur:</b> ${data.userName} (#${data.userId})\n` +
    `<b>Montant:</b> ${formatAmount(data.amount)} ${data.currency}\n` +
    (data.operator ? `<b>Operateur:</b> ${data.operator}\n` : "") +
    (data.reference ? `<b>Reference:</b> ${data.reference}\n` : "") +
    `<b>Date:</b> ${formatDate()}\n\n` +
    `Verifiez cette transaction dans le panneau admin.`;

  sendTelegramMessage(msg).catch(err =>
    console.error("[Telegram] Large amount notification error:", err)
  );
}

export function notifySystemError(errorType: string, message: string) {
  const msg =
    `<b>🔴 ERREUR SYSTEME CRITIQUE</b>\n\n` +
    `<b>Type:</b> ${errorType}\n` +
    `<b>Message:</b> ${message.substring(0, 500)}\n` +
    `<b>Date:</b> ${formatDate()}`;

  sendTelegramMessage(msg).catch(err =>
    console.error("[Telegram] System error notification error:", err)
  );
}

export async function notifyDailyReport(stats: {
  totalUsers: number;
  totalDeposits: string;
  totalWithdrawals: string;
  totalTransactionsCount: number;
  totalTransactionsAmount: string;
  totalCommissions: string;
  platformBalance?: string;
}) {
  const msg =
    `<b>📊 RAPPORT QUOTIDIEN - ${new Date().toLocaleDateString("fr-FR", { timeZone: "Africa/Lome", day: "2-digit", month: "2-digit", year: "numeric" })}</b>\n\n` +
    `<b>👥 Utilisateurs:</b> ${stats.totalUsers.toLocaleString("fr-FR")}\n\n` +
    `<b>💰 Volume depots:</b> ${formatAmount(stats.totalDeposits)} FCFA\n` +
    `<b>💸 Volume retraits:</b> ${formatAmount(stats.totalWithdrawals)} FCFA\n\n` +
    `<b>📈 Total transactions:</b> ${stats.totalTransactionsCount.toLocaleString("fr-FR")}\n` +
    `<b>Volume total:</b> ${formatAmount(stats.totalTransactionsAmount)} FCFA\n\n` +
    `<b>💼 Commissions:</b> ${formatAmount(stats.totalCommissions)} FCFA\n` +
    (stats.platformBalance ? `<b>🏦 Solde plateforme:</b> ${formatAmount(stats.platformBalance)} FCFA\n` : "") +
    `\n<b>Heure:</b> ${formatDate()}`;

  return sendTelegramMessage(msg);
}

export async function notifyIpChanged(newIp: string) {
  const msg =
    `<b>⚠️ ALERTE IP SERVEUR CHANGEE</b>\n\n` +
    `L'adresse IP du serveur a change. Les retraits automatiques WiniPayer sont bloques.\n\n` +
    `<b>Nouvelle IP:</b> <code>${newIp}</code>\n\n` +
    `<b>Action requise:</b>\n` +
    `1. Connectez-vous sur manager.winipayer.com\n` +
    `2. Allez dans "IPs whitelist (Payout)"\n` +
    `3. Ajoutez l'IP: <code>${newIp}</code>\n\n` +
    `<b>Date:</b> ${formatDate()}`;

  return sendTelegramMessage(msg);
}

export async function notifyStartup() {
  const msg =
    `<b>🚀 SendavaPay Bot Active</b>\n\n` +
    `Le serveur a demarré. Alertes actives :\n` +
    `• Nouveaux utilisateurs\n` +
    `• Dépôts\n` +
    `• Paiements reçus (liens + API)\n` +
    `• Demandes & traitements de retrait\n` +
    `• KYC soumis\n` +
    `• Retrait partenaire\n` +
    `• Gros montants (≥500 000 FCFA)\n` +
    `• Connexion admin\n` +
    `• Erreurs système critiques\n` +
    `• Rapport quotidien (minuit Lome)\n\n` +
    `Commandes: /stats | /ip | /help\n\n` +
    `<b>Date:</b> ${formatDate()}`;

  return sendTelegramMessage(msg);
}
