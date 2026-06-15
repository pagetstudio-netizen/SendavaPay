import { getCredential } from "./credentials";

async function sendTelegramMessage(text: string): Promise<boolean> {
  const TELEGRAM_BOT_TOKEN = getCredential("TELEGRAM_BOT_TOKEN");
  const TELEGRAM_CHAT_ID = getCredential("TELEGRAM_CHAT_ID");
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

// Send a message with optional inline buttons (IP block + custom buttons)
async function sendTelegramAlert(
  text: string,
  ip?: string,
  extraButtons?: Array<{ text: string; callback_data: string }>
): Promise<boolean> {
  const TELEGRAM_BOT_TOKEN = getCredential("TELEGRAM_BOT_TOKEN");
  const TELEGRAM_CHAT_ID = getCredential("TELEGRAM_CHAT_ID");
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return false;
  try {
    const body: Record<string, any> = {
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    };

    const rows: Array<Array<{ text: string; callback_data: string }>> = [];
    if (extraButtons && extraButtons.length > 0) rows.push(extraButtons);
    if (ip) rows.push([{ text: "🚫 Bloquer cette IP", callback_data: `block_ip:${ip}` }]);
    if (rows.length > 0) body.reply_markup = { inline_keyboard: rows };

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    return response.ok;
  } catch {
    return false;
  }
}

// Answer a Telegram callback_query (button press acknowledgment)
export async function answerCallbackQuery(callbackQueryId: string, text: string, showAlert = false): Promise<void> {
  const TELEGRAM_BOT_TOKEN = getCredential("TELEGRAM_BOT_TOKEN");
  if (!TELEGRAM_BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: showAlert }),
    });
  } catch {}
}

// Edit message to remove inline button after action is taken
export async function editMessageRemoveButton(chatId: number | string, messageId: number, newText: string): Promise<void> {
  const TELEGRAM_BOT_TOKEN = getCredential("TELEGRAM_BOT_TOKEN");
  if (!TELEGRAM_BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: newText,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [] },
      }),
    });
  } catch {}
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
  gateway?: string;
}) {
  const statusLabel = data.status === "success" ? "REUSSI" : data.status === "failed" ? "ECHOUE" : "EN COURS";
  const emoji = data.status === "success" ? "✅" : data.status === "failed" ? "❌" : "⏳";
  const gatewayLabel = data.gateway || "Passerelle";
  const msg =
    `<b>${emoji} RETRAIT AUTOMATIQUE ${statusLabel}</b>\n\n` +
    `<b>Utilisateur:</b> ${data.userName} (#${data.userId})\n` +
    `<b>Montant:</b> ${formatAmount(data.amount)} XOF\n` +
    `<b>Net envoye:</b> ${formatAmount(data.netAmount)} XOF\n` +
    `<b>Operateur:</b> ${data.paymentMethod}\n` +
    (data.payoutOperator ? `<b>Slug ${gatewayLabel}:</b> <code>${data.payoutOperator}</code>\n` : "") +
    `<b>Numero:</b> ${data.mobileNumber}\n` +
    `<b>Ref Payout:</b> ${data.payoutUuid}\n` +
    (data.errorDetail ? `<b>Erreur ${gatewayLabel}:</b> <code>${data.errorDetail}</code>\n` : "") +
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
  const TELEGRAM_BOT_TOKEN = getCredential("TELEGRAM_BOT_TOKEN");
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
    `<b>✅ CONNEXION ADMINISTRATEUR RÉUSSIE</b>\n\n` +
    `<b>Admin:</b> ${data.userName} (#${data.userId})\n` +
    `<b>IP:</b> <code>${data.ip}</code>\n` +
    `<b>Date:</b> ${formatDate()}`;

  sendTelegramAlert(msg, data.ip).catch(err =>
    console.error("[Telegram] Admin login notification error:", err)
  );
}

export function notifyPartnerPayment(data: {
  partnerName: string;
  partnerId: number;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  reference: string;
  customerPhone?: string;
  customerName?: string;
  operator?: string;
  provider?: string;
}) {
  const providerLabel = (data.provider || "API").toUpperCase();
  const msg =
    `<b>💳 PAIEMENT PARTENAIRE SDK</b>\n\n` +
    `<b>Partenaire:</b> ${data.partnerName} (#${data.partnerId})\n` +
    `<b>Montant:</b> ${formatAmount(data.amount)} ${data.currency}\n` +
    `<b>Frais:</b> ${formatAmount(data.fee)} ${data.currency}\n` +
    `<b>Net crédité:</b> ${formatAmount(data.netAmount)} ${data.currency}\n` +
    (data.customerName ? `<b>Client:</b> ${data.customerName}\n` : "") +
    (data.customerPhone ? `<b>Tél client:</b> ${data.customerPhone}\n` : "") +
    (data.operator ? `<b>Opérateur:</b> ${data.operator}\n` : "") +
    `<b>Passerelle:</b> ${providerLabel}\n` +
    `<b>Référence:</b> <code>${data.reference}</code>\n` +
    `<b>Date:</b> ${formatDate()}`;

  sendTelegramMessage(msg).catch((err) =>
    console.error("[Telegram] Partner payment notification error:", err)
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

export function notifyLiquidityEmpty(data: {
  currency: string;
  countryFlag: string;
  countryName: string;
  pendingCount: number;
  pendingAmount: number;
  walletBalance: number | null;
}) {
  const walletLine = data.walletBalance !== null
    ? `<b>💼 Solde wallet OmniPay ${data.currency}:</b> ${data.walletBalance.toLocaleString("fr-FR")} ${data.currency}\n`
    : "";
  const msg =
    `<b>💧 ALERTE LIQUIDITÉ OMNIPAY</b>\n\n` +
    `Le wallet OmniPay ${data.countryFlag} <b>${data.countryName}</b> (${data.currency}) est insuffisant.\n\n` +
    walletLine +
    `<b>📋 File d'attente:</b> ${data.pendingCount} retrait(s) en attente\n` +
    `<b>💸 Montant total:</b> ${data.pendingAmount.toLocaleString("fr-FR")} ${data.currency}\n\n` +
    `<b>Actions disponibles:</b>\n` +
    `• Réapprovisionner le wallet OmniPay\n` +
    `• Puis taper <code>/liquidite ${data.currency}</code> pour traiter la file\n` +
    `• Ou valider manuellement depuis le panneau admin → Retraits en attente\n\n` +
    `<b>Date:</b> ${formatDate()}`;

  sendTelegramMessage(msg).catch(err =>
    console.error("[Telegram] Liquidity notification error:", err)
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

export async function notifyBlacklistUnblockAttempt(data: {
  phoneNumber: string;
  adminName: string;
  adminId: number;
  ip: string;
  action: string;
}): Promise<void> {
  const msg =
    `⚠️ <b>TENTATIVE DE SUPPRESSION D'UN NUMÉRO BLACKLISTÉ</b>\n\n` +
    `<b>Numéro :</b> <code>${data.phoneNumber}</code>\n` +
    `<b>Administrateur :</b> ${data.adminName} (#${data.adminId})\n` +
    `<b>IP :</b> <code>${data.ip}</code>\n` +
    `<b>Action :</b> ${data.action}\n` +
    `<b>Date :</b> ${formatDate()}\n\n` +
    `Un code de sécurité a été envoyé dans ce groupe pour confirmer le déblocage.`;
  await sendTelegramMessage(msg);
}

export async function notifyBlacklistOtp(data: {
  phoneNumber: string;
  adminName: string;
  code: string;
}): Promise<void> {
  const msg =
    `🔐 <b>CODE DE DÉBLOCAGE BLACKLIST</b>\n\n` +
    `<b>Numéro à débloquer :</b> <code>${data.phoneNumber}</code>\n` +
    `<b>Demandé par :</b> ${data.adminName}\n` +
    `<b>Date :</b> ${formatDate()}\n\n` +
    `<b>Code de sécurité :</b>\n<code>${data.code}</code>\n\n` +
    `⚠️ Ce code expire dans 15 minutes. Ne partagez jamais ce code.`;
  await sendTelegramMessage(msg);
}

export function notifyKycReset(data: {
  adminName: string;
  adminId: number;
  userName: string;
  userId: number;
  ip: string;
}): void {
  const msg =
    `🔄 <b>RÉINITIALISATION KYC</b>\n\n` +
    `<b>Utilisateur :</b> ${data.userName} (#${data.userId})\n` +
    `<b>Administrateur :</b> ${data.adminName} (#${data.adminId})\n` +
    `<b>IP :</b> <code>${data.ip}</code>\n` +
    `<b>Date :</b> ${formatDate()}\n\n` +
    `Le statut KYC a été réinitialisé. L'utilisateur devra soumettre à nouveau ses documents.`;
  sendTelegramMessage(msg).catch(err =>
    console.error("[Telegram] KYC reset notification error:", err)
  );
}

export function notifyPartnerWalletExchange(data: {
  partnerName: string;
  partnerId: number;
  fromCountry: string;
  toCountry: string;
  currency: string;
  amount: string;
  exchangeId: number;
}) {
  const msg =
    `<b>🔄 ÉCHANGE WALLET PARTENAIRE</b>\n\n` +
    `<b>Partenaire:</b> ${data.partnerName} (#${data.partnerId})\n` +
    `<b>De:</b> ${data.fromCountry}\n` +
    `<b>Vers:</b> ${data.toCountry}\n` +
    `<b>Devise:</b> ${data.currency}\n` +
    `<b>Montant:</b> ${formatAmount(data.amount)} ${data.currency}\n` +
    `<b>ID Échange:</b> #${data.exchangeId}\n` +
    `<b>Date:</b> ${formatDate()}\n\n` +
    `✅ Échange effectué instantanément.`;

  sendTelegramMessage(msg).catch(err =>
    console.error("[Telegram] Partner wallet exchange notification error:", err)
  );
}

export function notifyWalletExchangeRequest(data: {
  userName: string;
  userId: number;
  fromCountry: string;
  toCountry: string;
  currency: string;
  amount: string;
  exchangeId: number;
}) {
  const msg =
    `<b>🔄 DEMANDE D'ÉCHANGE WALLET</b>\n\n` +
    `<b>Utilisateur:</b> ${data.userName} (#${data.userId})\n` +
    `<b>De:</b> ${data.fromCountry}\n` +
    `<b>Vers:</b> ${data.toCountry}\n` +
    `<b>Devise:</b> ${data.currency}\n` +
    `<b>Montant:</b> ${formatAmount(data.amount)} ${data.currency}\n` +
    `<b>ID Échange:</b> #${data.exchangeId}\n` +
    `<b>Date:</b> ${formatDate()}\n\n` +
    `⏳ En attente de validation — panneau admin → Échanges Wallets.`;

  sendTelegramMessage(msg).catch(err =>
    console.error("[Telegram] Wallet exchange request notification error:", err)
  );
}

export function notifyWalletExchangeApproved(data: {
  userName: string;
  userId: number;
  fromCountry: string;
  toCountry: string;
  currency: string;
  amount: string;
  exchangeId: number;
  adminNote?: string;
}) {
  const msg =
    `<b>✅ ÉCHANGE WALLET APPROUVÉ</b>\n\n` +
    `<b>Utilisateur:</b> ${data.userName} (#${data.userId})\n` +
    `<b>De:</b> ${data.fromCountry}\n` +
    `<b>Vers:</b> ${data.toCountry}\n` +
    `<b>Montant:</b> ${formatAmount(data.amount)} ${data.currency}\n` +
    `<b>ID Échange:</b> #${data.exchangeId}\n` +
    (data.adminNote ? `<b>Note admin:</b> ${data.adminNote}\n` : "") +
    `<b>Date:</b> ${formatDate()}`;

  sendTelegramMessage(msg).catch(err =>
    console.error("[Telegram] Wallet exchange approved notification error:", err)
  );
}

export function notifyWalletExchangeRejected(data: {
  userName: string;
  userId: number;
  fromCountry: string;
  toCountry: string;
  currency: string;
  amount: string;
  exchangeId: number;
  adminNote?: string;
}) {
  const msg =
    `<b>❌ ÉCHANGE WALLET REJETÉ</b>\n\n` +
    `<b>Utilisateur:</b> ${data.userName} (#${data.userId})\n` +
    `<b>De:</b> ${data.fromCountry}\n` +
    `<b>Vers:</b> ${data.toCountry}\n` +
    `<b>Montant:</b> ${formatAmount(data.amount)} ${data.currency}\n` +
    `<b>ID Échange:</b> #${data.exchangeId}\n` +
    (data.adminNote ? `<b>Raison:</b> ${data.adminNote}\n` : "") +
    `<b>Date:</b> ${formatDate()}\n\n` +
    `Les fonds ont été recrédités dans le portefeuille source.`;

  sendTelegramMessage(msg).catch(err =>
    console.error("[Telegram] Wallet exchange rejected notification error:", err)
  );
}

export function notifyAdminLoginAttempt(data: {
  emailOrPhone: string;
  ip: string;
  success: boolean;
  adminName?: string;
  adminId?: number;
}) {
  const emoji = data.success ? "⚠️" : "🚨";
  const label = data.success ? "TENTATIVE CONNEXION ADMIN (MDP CORRECT)" : "TENTATIVE CONNEXION ADMIN ECHOUEE";
  const msg =
    `<b>${emoji} ${label}</b>\n\n` +
    (data.adminName ? `<b>Compte:</b> ${data.adminName}\n` : `<b>Identifiant:</b> <code>${data.emailOrPhone}</code>\n`) +
    `<b>IP:</b> <code>${data.ip}</code>\n` +
    `<b>Date:</b> ${formatDate()}`;

  sendTelegramAlert(msg, data.ip).catch(err =>
    console.error("[Telegram] Admin login attempt notification error:", err)
  );
}

// Admin balance adjustment notification with undo button
export function notifyAdminBalanceAdjustment(data: {
  adminName: string;
  targetName: string;
  targetId: number;
  targetType: "user" | "partner";
  walletId?: number;
  amount: number;
  currency?: string;
  operation: "add" | "subtract";
  reason: string;
}) {
  const isCredit = data.operation === "add";
  const emoji = isCredit ? "💰" : "💸";
  const label = isCredit ? "CRÉDIT ADMIN" : "DÉBIT ADMIN";
  const undoLabel = isCredit ? "↩️ Annuler (débiter)" : "↩️ Annuler (recréditer)";

  // Compact callback_data (Telegram limit: 64 bytes)
  // uua = undo user adjustment, upa = undo partner adjustment
  const undoCallback =
    data.targetType === "user"
      ? `uua:${data.targetId}:${data.walletId ?? 0}:${data.amount}:${data.operation}`
      : `upa:${data.targetId}:${data.amount}:${data.operation}`;

  const msg =
    `<b>${emoji} ${label}</b>\n\n` +
    `<b>Admin:</b> ${data.adminName}\n` +
    `<b>${data.targetType === "user" ? "Utilisateur" : "Partenaire"}:</b> ${data.targetName} (#${data.targetId})\n` +
    `<b>Montant:</b> ${data.amount.toLocaleString("fr-FR")}${data.currency ? " " + data.currency : " FCFA"}\n` +
    (data.walletId ? `<b>Portefeuille:</b> #${data.walletId}\n` : "") +
    `<b>Raison:</b> ${data.reason}\n` +
    `<b>Date:</b> ${formatDate()}`;

  sendTelegramAlert(msg, undefined, [{ text: undoLabel, callback_data: undoCallback }]).catch(err =>
    console.error("[Telegram] Admin balance adjustment notification error:", err)
  );
}

export function notifyGeoBlocked(data: {
  ip: string;
  countryCode: string;
  isVpn: boolean;
  path: string;
}) {
  const label = data.isVpn ? "🔍 VPN/PROXY BLOQUÉ AUTOMATIQUEMENT" : "🌍 IP HORS-AFRIQUE BLOQUÉE AUTOMATIQUEMENT";
  const msg =
    `<b>${label}</b>\n\n` +
    `<b>IP:</b> <code>${data.ip}</code>\n` +
    `<b>Pays:</b> ${data.countryCode}\n` +
    `<b>Type:</b> ${data.isVpn ? "VPN / Proxy / Hébergeur" : "Hors Afrique"}\n` +
    `<b>Chemin:</b> ${data.path}\n` +
    `<b>Date:</b> ${formatDate()}\n\n` +
    `L'IP a été bloquée définitivement en base de données.`;

  sendTelegramAlert(msg, data.ip).catch(err =>
    console.error("[Telegram] Geo blocked notification error:", err)
  );
}

export function notifyAdminOtp(data: {
  userName: string;
  userId: number;
  code: string;
  ip: string;
}) {
  const msg =
    `<b>🔐 CODE OTP CONNEXION ADMIN</b>\n\n` +
    `<b>Admin:</b> ${data.userName} (#${data.userId})\n` +
    `<b>Code:</b> <code>${data.code}</code>\n` +
    `<b>IP:</b> <code>${data.ip}</code>\n` +
    `<b>Expire dans:</b> 10 minutes\n` +
    `<b>Date:</b> ${formatDate()}`;

  sendTelegramAlert(msg, data.ip).catch(err =>
    console.error("[Telegram] Admin OTP notification error:", err)
  );
}

export function notifyCredentialOtp(data: {
  userName: string;
  userId: number;
  code: string;
  keyName: string;
  ip: string;
}) {
  const msg =
    `<b>🔑 CODE OTP MODIFICATION CLÉ API</b>\n\n` +
    `<b>Admin:</b> ${data.userName} (#${data.userId})\n` +
    `<b>Clé modifiée:</b> <code>${data.keyName}</code>\n` +
    `<b>Code:</b> <code>${data.code}</code>\n` +
    `<b>IP:</b> <code>${data.ip}</code>\n` +
    `<b>Expire dans:</b> 10 minutes\n` +
    `<b>Date:</b> ${formatDate()}`;

  sendTelegramAlert(msg, data.ip).catch(err =>
    console.error("[Telegram] Credential OTP notification error:", err)
  );
}

export async function notifyIpChanged(newIp: string) {
  const msg =
    `<b>⚠️ ALERTE IP SERVEUR CHANGEE</b>\n\n` +
    `L'adresse IP du serveur a change.\n\n` +
    `<b>Nouvelle IP:</b> <code>${newIp}</code>\n\n` +
    `<b>Date:</b> ${formatDate()}`;

  return sendTelegramMessage(msg);
}

// ── Geolocation helper (ip-api.com — free, no key required) ──────────────────
interface GeoInfo {
  city: string;
  country: string;
  isp: string;
}

async function getGeoLocation(ip: string): Promise<GeoInfo | null> {
  if (!ip || ip === "::1" || ip.startsWith("127.") || ip.startsWith("192.168.") || ip.startsWith("10.") || /^172\.(1[6-9]|2\d|3[01])\./.test(ip)) {
    return null;
  }
  try {
    const resp = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,isp`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!resp.ok) return null;
    const data = await resp.json() as any;
    if (data.status !== "success") return null;
    return { city: data.city || "", country: data.country || "", isp: data.isp || "" };
  } catch {
    return null;
  }
}

// ── User-Agent parser ─────────────────────────────────────────────────────────
interface UaInfo {
  browser: string;
  device: string;
  deviceEmoji: string;
}

function parseUserAgent(ua?: string): UaInfo {
  if (!ua) return { browser: "Inconnu", device: "Inconnu", deviceEmoji: "❓" };

  let device: string;
  let deviceEmoji: string;
  if (/ipad/i.test(ua)) {
    device = "Tablette"; deviceEmoji = "📱";
  } else if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    device = "Mobile"; deviceEmoji = "📱";
  } else {
    device = "Bureau"; deviceEmoji = "💻";
  }

  let osHint = "";
  if (/android/i.test(ua)) osHint = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) osHint = "iOS";
  else if (/windows nt/i.test(ua)) osHint = "Windows";
  else if (/macintosh|mac os x/i.test(ua)) osHint = "Mac";
  else if (/linux/i.test(ua)) osHint = "Linux";

  let browserName: string;
  if (/edg\//i.test(ua)) browserName = "Edge";
  else if (/opr\/|opera/i.test(ua)) browserName = "Opera";
  else if (/firefox\//i.test(ua)) browserName = "Firefox";
  else if (/chrome\//i.test(ua)) browserName = "Chrome";
  else if (/safari\//i.test(ua)) browserName = "Safari";
  else browserName = "Autre";

  const browser = osHint ? `${browserName} (${osHint})` : `${browserName} (Autre)`;
  return { browser, device, deviceEmoji };
}

// ── Login notification — Utilisateur / Administrateur ────────────────────────
export async function notifyUserLogin(data: {
  accountType: "user" | "admin";
  email: string;
  ip: string;
  userAgent?: string;
  success: boolean;
  isNewIp?: boolean;
}): Promise<void> {
  const typeLabel = data.accountType === "admin" ? "Administrateur" : "Utilisateur";
  const prefix = data.isNewIp && data.success
    ? `🆕 Nouvelle IP — Connexion ${typeLabel}`
    : `${data.success ? "✅" : "⚠️"} Connexion ${typeLabel}`;

  const [geo, ua] = await Promise.all([
    getGeoLocation(data.ip),
    Promise.resolve(parseUserAgent(data.userAgent)),
  ]);

  const statusLine = data.success
    ? `🔐 Statut : ✅ Connexion réussie`
    : `🔐 Statut : ❌ Tentative échouée`;

  const ipLabel = data.isNewIp ? "Nouvelle IP" : "IP";

  let msg = `<b>${prefix}</b>\n\n` +
    `👤 Email : ${data.email}\n` +
    `${statusLine}\n` +
    `🌐 ${ipLabel} : <code>${data.ip}</code>\n`;

  if (geo) {
    msg += `📍 Localisation : ${geo.city}, ${geo.country}\n`;
    if (data.isNewIp) msg += `🏢 FAI : ${geo.isp}\n`;
  }

  msg += `💻 Navigateur : ${ua.browser}\n` +
    `📱 Appareil : ${ua.deviceEmoji} ${ua.device}\n` +
    `🕒 Date : ${formatDate()} UTC`;

  if (data.isNewIp && data.success) {
    msg += `\n\n⚠️ Cette IP n'a jamais été utilisée pour ce compte.`;
  }

  sendTelegramAlert(msg, data.ip).catch(err =>
    console.error("[Telegram] User login notification error:", err)
  );
}

// ── Login notification — Marchand / Partenaire ────────────────────────────────
export async function notifyPartnerLogin(data: {
  partnerName: string;
  email: string;
  ip: string;
  userAgent?: string;
  success: boolean;
  isNewIp?: boolean;
}): Promise<void> {
  const prefix = data.isNewIp && data.success
    ? `🆕 Nouvelle IP — Connexion Marchand`
    : `${data.success ? "✅" : "⚠️"} Connexion Marchand`;

  const [geo, ua] = await Promise.all([
    getGeoLocation(data.ip),
    Promise.resolve(parseUserAgent(data.userAgent)),
  ]);

  const statusLine = data.success
    ? `🔐 Statut : ✅ Connexion réussie`
    : `🔐 Statut : ❌ Tentative échouée`;

  const ipLabel = data.isNewIp ? "Nouvelle IP" : "IP";

  let msg = `<b>${prefix}</b>\n\n` +
    `🏪 Marchand : ${data.partnerName}\n` +
    `👤 Email : ${data.email}\n` +
    `${statusLine}\n` +
    `🌐 ${ipLabel} : <code>${data.ip}</code>\n`;

  if (geo) {
    msg += `📍 Localisation : ${geo.city}, ${geo.country}\n`;
    if (data.isNewIp) msg += `🏢 FAI : ${geo.isp}\n`;
  }

  msg += `💻 Navigateur : ${ua.browser}\n` +
    `📱 Appareil : ${ua.deviceEmoji} ${ua.device}\n` +
    `🕒 Date : ${formatDate()} UTC`;

  if (data.isNewIp && data.success) {
    msg += `\n\n⚠️ Cette IP n'a jamais été utilisée pour ce compte.`;
  }

  sendTelegramAlert(msg, data.ip).catch(err =>
    console.error("[Telegram] Partner login notification error:", err)
  );
}

// ── Brute-force multi-comptes détecté par IP ─────────────────────────────────
export function notifyBruteForceDetected(data: {
  ip: string;
  distinctAccounts: number;
  windowMinutes: number;
}): void {
  const msg =
    `<b>🤖 BRUTE FORCE MULTI-COMPTES DÉTECTÉ</b>\n\n` +
    `<b>IP :</b> <code>${data.ip}</code>\n` +
    `<b>Comptes ciblés :</b> ${data.distinctAccounts} comptes différents\n` +
    `<b>Fenêtre :</b> ${data.windowMinutes} dernières minutes\n` +
    `<b>Action :</b> IP bloquée définitivement\n` +
    `<b>Date :</b> ${formatDate()}\n\n` +
    `⚠️ Attaque par credential stuffing — IP bannie automatiquement.`;

  sendTelegramAlert(msg, data.ip).catch(err =>
    console.error("[Telegram] Brute force notification error:", err)
  );
}

// ── Webhook rejeté — signature invalide ───────────────────────────────────────
export function notifyWebhookRejected(data: {
  gateway: string;
  ip: string;
  reason: string;
  path?: string;
}): void {
  const msg =
    `<b>🚨 WEBHOOK REJETÉ — SIGNATURE INVALIDE</b>\n\n` +
    `<b>Passerelle :</b> ${data.gateway}\n` +
    `<b>Raison :</b> ${data.reason}\n` +
    `<b>IP :</b> <code>${data.ip}</code>\n` +
    (data.path ? `<b>Chemin :</b> ${data.path}\n` : "") +
    `<b>Date :</b> ${formatDate()}\n\n` +
    `⚠️ Possible tentative d'intrusion. Vérifiez vos journaux.`;

  sendTelegramAlert(msg, data.ip).catch(err =>
    console.error("[Telegram] Webhook rejected notification error:", err)
  );
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
