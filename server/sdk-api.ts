import { Router, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import crypto from "crypto";
import { z } from "zod";
import type { User, ApiKey } from "@shared/schema";
import { getServiceById, getServicesByCountry, SOLEASPAY_SERVICES, formatPhoneForSoleasPay, getServiceByOperator, resolveConfiguredOperator } from "./soleaspay";
import { getSoftPayOperator, SOFTPAY_OPERATORS } from "./paydunya-softpay-map";

const router = Router();

// ─── OTP Store (in-memory, expiry 10 min) ─────────────────────────────────────
interface OtpEntry {
  reference: string;
  serviceId: number;
  payerName: string;
  payerPhone: string;
  payerEmail: string;
  payerCountry: string;
  amount: number;
  description: string;
  gateway: string;
  expiresAt: Date;
}
const otpStore = new Map<string, OtpEntry>();
setInterval(() => {
  const now = new Date();
  for (const [token, entry] of otpStore.entries()) {
    if (entry.expiresAt < now) otpStore.delete(token);
  }
}, 5 * 60 * 1000);

// ─── Webhook Retry Queue ───────────────────────────────────────────────────────
// Retry schedule: 1 min → 5 min → 15 min → 1 h
const WEBHOOK_RETRY_DELAYS = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000];

interface WebhookRetryEntry {
  id: string;
  webhookUrl: string;
  payload: Record<string, any>;
  headers: Record<string, string>;
  transactionRef: string;
  transactionId?: number;
  attempts: number;
  nextRetry: number;
}

const webhookRetryQueue = new Map<string, WebhookRetryEntry>();

// ─── Helper : envoyer un webhook pour une api_transaction ─────────────────────
// Utilisé dans initiate-payment (public) qui n'a pas sdkKey en contexte.
async function sendTransactionWebhook(
  transaction: any,
  event: string,
  extraData: Record<string, any> = {}
): Promise<void> {
  const cbUrl = (transaction as any).callbackUrl ?? (transaction as any).callback_url ?? null;
  if (!cbUrl) return;
  let webhookSecret: string | null = null;
  try {
    const apiKeyId = (transaction as any).apiKeyId ?? (transaction as any).api_key_id;
    if (apiKeyId) {
      const apiKey = await storage.getApiKeyById(Number(apiKeyId));
      webhookSecret = (apiKey as any)?.webhookSecret ?? null;
    }
  } catch (_) {}
  const txRef = (transaction as any).reference;
  const txId  = (transaction as any).id;
  await sendWebhookWithRetry(cbUrl, {
    event,
    reference:     txRef,
    status:        extraData.status ?? event.replace("payment.", "").replace("payout.", ""),
    amount:        (transaction as any).amount,
    fee:           extraData.fee ?? (transaction as any).fee ?? "0",
    currency:      (transaction as any).currency ?? "XOF",
    customerPhone: (transaction as any).customerPhone ?? null,
    customerName:  (transaction as any).customerName  ?? null,
    paymentMethod: (transaction as any).paymentMethod ?? null,
    ...extraData,
    timestamp:     new Date().toISOString(),
  }, webhookSecret, txRef, txId);
}

async function sendWebhookWithRetry(
  webhookUrl: string,
  payload: Record<string, any>,
  webhookSecret: string | null | undefined,
  transactionRef: string,
  transactionId?: number,
): Promise<void> {
  const payloadStr = JSON.stringify(payload);
  const ts = Math.floor(Date.now() / 1000).toString();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-SendavaPay-Event": payload.event || "payment.update",
    "X-SendavaPay-Timestamp": ts,
    "User-Agent": "SendavaPay-Webhook/1.0",
  };
  if (webhookSecret) {
    const sig = crypto.createHmac("sha256", webhookSecret).update(`${ts}.${payloadStr}`).digest("hex");
    headers["X-SendavaPay-Signature"] = `t=${ts},v1=${sig}`;
  }
  const retryId = `wh_${transactionRef}_${Date.now()}`;
  webhookRetryQueue.set(retryId, {
    id: retryId, webhookUrl, payload, headers,
    transactionRef, transactionId, attempts: 0, nextRetry: Date.now(),
  });
}

async function processWebhookQueue(): Promise<void> {
  const now = Date.now();
  for (const [key, entry] of webhookRetryQueue.entries()) {
    if (entry.nextRetry > now) continue;
    webhookRetryQueue.delete(key);
    try {
      const ctrl = new AbortController();
      const tId = setTimeout(() => ctrl.abort(), 10_000);
      const response = await fetch(entry.webhookUrl, {
        method: "POST", headers: entry.headers,
        body: JSON.stringify(entry.payload), signal: ctrl.signal,
      });
      clearTimeout(tId);
      if (entry.transactionId) {
        await storage.updateApiTransaction(entry.transactionId, {
          webhookSent: response.ok,
          webhookAttempts: entry.attempts + 1,
          webhookLastAttempt: new Date(),
        }).catch(() => {});
      }
      if (!response.ok && entry.attempts < WEBHOOK_RETRY_DELAYS.length) {
        const next: WebhookRetryEntry = { ...entry, id: `${key}_r${entry.attempts + 1}`, attempts: entry.attempts + 1, nextRetry: now + WEBHOOK_RETRY_DELAYS[entry.attempts] };
        webhookRetryQueue.set(next.id, next);
        console.warn(`[sdk-webhook] retry ${entry.attempts + 1}/${WEBHOOK_RETRY_DELAYS.length} in ${WEBHOOK_RETRY_DELAYS[entry.attempts] / 1000}s → ${entry.webhookUrl}`);
      }
    } catch {
      if (entry.transactionId) {
        await storage.updateApiTransaction(entry.transactionId, { webhookAttempts: entry.attempts + 1, webhookLastAttempt: new Date() }).catch(() => {});
      }
      if (entry.attempts < WEBHOOK_RETRY_DELAYS.length) {
        const next: WebhookRetryEntry = { ...entry, id: `${key}_r${entry.attempts + 1}`, attempts: entry.attempts + 1, nextRetry: now + WEBHOOK_RETRY_DELAYS[entry.attempts] };
        webhookRetryQueue.set(next.id, next);
      }
    }
  }
}
setInterval(processWebhookQueue, 30_000);

// ─── Withdrawal Processing Queue ──────────────────────────────────────────────
export interface WithdrawalQueueEntry {
  sdkTransactionRef: string;
  withdrawalRequestId: number;
  webhookUrl: string | null;
  webhookSecret: string | null;
  auditLogId?: number;
  // PayDunya polling support
  paydunyaDisburseToken?: string;
  paydunyaDispatchedAt?: number; // timestamp ms
  paydunyaPollingCount?: number;
}
const withdrawalQueue: WithdrawalQueueEntry[] = [];

// Mark SDK withdrawal as completed: update DB + admin history + send webhook
export async function markSdkWithdrawalCompleted(entry: WithdrawalQueueEntry, txn: any, gatewayRef?: string, gatewayRaw?: string): Promise<void> {
  if (txn.status === "completed") return; // idempotency
  await storage.updateApiTransaction(txn.id, { status: "completed", completedAt: new Date() });
  if (entry.auditLogId) {
    storage.updateSdkWithdrawalLog(entry.auditLogId, {
      status: "completed",
      gateway: (txn.paymentMethod || "").split("_")[0] || undefined,
      gatewayReference: gatewayRef || undefined,
      gatewayRawResponse: gatewayRaw || undefined,
    }).catch(() => {});
  }
  try {
    const txAmt = parseFloat(txn.amount);
    const txFee = parseFloat(txn.fee || "0");
    const totalDebited = parseFloat((txAmt + txFee).toFixed(2));
    // Chercher la transaction de débit créée au moment du retrait et la mettre à jour
    const existingTxn = await storage.getTransactionByExternalRef(txn.reference);
    if (existingTxn) {
      await storage.updateTransaction(existingTxn.id, {
        status: "completed" as any,
        adminNote: `Retrait complété. Montant envoyé: ${txAmt}, Frais: ${txFee}, Total débité: ${totalDebited}`,
      });
      console.log(`[sdk-withdrawal] ✅ Transaction admin #${existingTxn.id} mise à jour → completed`);
    } else {
      // Fallback: créer la transaction si elle n'existe pas (ex: migration)
      await storage.createTransaction({
        userId:        txn.userId,
        type:          "withdrawal",
        amount:        txAmt.toString(),
        fee:           txFee.toString(),
        netAmount:     totalDebited.toString(),
        status:        "completed",
        description:   txn.description || `Retrait API SDK vers ${txn.customerPhone || ""}`,
        externalRef:   txn.reference,
        paymentMethod: txn.paymentMethod || "sdk_payout",
        mobileNumber:  txn.customerPhone || undefined,
        payerCountry:  (txn.paymentMethod || "").split("_").pop() || undefined,
      });
      console.log(`[sdk-withdrawal] ✅ Transaction admin créée (fallback) pour ref ${txn.reference}`);
    }
  } catch (e) { console.error("[sdk-withdrawal] Erreur mise à jour transaction admin (completed):", e); }
  if (entry.webhookUrl) {
    await sendWebhookWithRetry(entry.webhookUrl, {
      event: "payout.completed", reference: txn.reference, status: "completed",
      amount: txn.amount, currency: txn.currency, phoneNumber: txn.customerPhone,
      completedAt: new Date().toISOString(),
    }, entry.webhookSecret, txn.reference, txn.id);
  }
  console.log(`✅ [sdk-withdrawal] Retrait ${txn.reference} complété — ${txn.amount} ${txn.currency} → ${txn.customerPhone}`);

  // Notification Telegram pour retrait SDK complété
  try {
    const { notifyPartnerWithdrawal } = await import("./telegram");
    const sdkUser = await storage.getUser(Number(txn.userId || txn.user_id)).catch(() => null);
    notifyPartnerWithdrawal({
      partnerName: sdkUser?.fullName || `Marchand #${txn.userId || txn.user_id}`,
      partnerId: Number(txn.userId || txn.user_id),
      amount: String(txn.amount || "0"),
      fee: String(txn.fee || "0"),
      netAmount: String(txn.amount || "0"),
      paymentMethod: txn.paymentMethod || txn.payment_method || "sdk_payout",
      mobileNumber: txn.customerPhone || txn.customer_phone || "",
      country: txn.currency || "XOF",
    });
  } catch (e) {
    console.error("[sdk-withdrawal] Erreur notification Telegram retrait:", e);
  }
}

// Mark SDK withdrawal as failed: update DB + admin history + refund wallet + send webhook
export async function markSdkWithdrawalFailed(entry: WithdrawalQueueEntry, wr: any, txn: any, reason: string, gatewayRaw?: string): Promise<void> {
  if (txn.status === "failed") return; // idempotency
  await storage.updateApiTransaction(txn.id, { status: "failed" });
  await storage.updateWithdrawalRequest(wr.id, { status: "failed", rejectionReason: reason }).catch(() => {});
  if (entry.auditLogId) {
    storage.updateSdkWithdrawalLog(entry.auditLogId, {
      status: "failed",
      errorMessage: reason,
      gatewayRawResponse: gatewayRaw || undefined,
    }).catch(() => {});
  }

  // ── 1. Mettre à jour ou créer la transaction dans l'historique ──────────────
  const txAmt = parseFloat(txn.amount);
  const txFee = parseFloat(txn.fee || "0");
  const totalDebited = parseFloat((txAmt + txFee).toFixed(2));
  try {
    const existingTxn = await storage.getTransactionByExternalRef(txn.reference);
    if (existingTxn) {
      await storage.updateTransaction(existingTxn.id, {
        status: "failed" as any,
        adminNote: `Retrait échoué. Raison: ${reason}. Remboursement en cours.`,
      });
      console.log(`[sdk-withdrawal] ℹ️ Transaction admin #${existingTxn.id} mise à jour → failed`);
    } else {
      await storage.createTransaction({
        userId:        txn.userId,
        type:          "withdrawal",
        amount:        txAmt.toString(),
        fee:           txFee.toString(),
        netAmount:     totalDebited.toString(),
        status:        "failed",
        description:   txn.description || `Retrait API SDK échoué vers ${txn.customerPhone || ""}`,
        externalRef:   txn.reference,
        paymentMethod: txn.paymentMethod || "sdk_payout",
        mobileNumber:  txn.customerPhone || undefined,
        payerCountry:  (txn.paymentMethod || "").split("_").pop() || undefined,
        adminNote:     `Raison: ${reason}`,
      });
    }
  } catch (e) { console.error("[sdk-withdrawal] Erreur mise à jour transaction admin (failed):", e); }

  // ── 2. Rembourser le wallet (montant + frais) ───────────────────────────────
  const walletId = wr.walletId ?? null;
  if (walletId) {
    try {
      const walletBefore = await storage.getWalletById(walletId).catch(() => null);
      const balanceBefore = walletBefore ? parseFloat(walletBefore.balance) : null;
      await storage.creditWalletById(walletId, totalDebited.toString());
      const walletAfter = await storage.getWalletById(walletId).catch(() => null);
      const balanceAfter = walletAfter ? parseFloat(walletAfter.balance) : null;
      console.log(
        `[sdk-withdrawal] 🔄 REMBOURSEMENT WALLET — Ref: ${txn.reference} | ` +
        `WalletId: ${walletId} | Montant remboursé: ${totalDebited} | ` +
        `Solde avant: ${balanceBefore ?? "?"} | Solde après: ${balanceAfter ?? "?"}`
      );
      // Synchroniser users.balance après remboursement wallet
      try {
        const refundUser = await storage.getUser(txn.userId);
        if (refundUser) {
          const refundUserBal = parseFloat(refundUser.balance || "0");
          const newRefundBal  = parseFloat((refundUserBal + totalDebited).toFixed(2));
          await storage.setUserBalance(txn.userId, newRefundBal.toString());
          console.log(`[sdk-withdrawal] 💰 users.balance REMBOURSÉ — userId: ${txn.userId} | Avant: ${refundUserBal} | Après: ${newRefundBal} | Réf: ${txn.reference}`);
        }
      } catch (ube) {
        console.error(`[sdk-withdrawal] ⚠️ Erreur sync users.balance remboursement:`, ube);
      }
      // Créer une transaction de remboursement dans l'historique
      await storage.createTransaction({
        userId:        txn.userId,
        type:          "deposit",
        amount:        totalDebited.toString(),
        fee:           "0",
        netAmount:     totalDebited.toString(),
        status:        "completed",
        description:   `Remboursement retrait SDK annulé — Réf: ${txn.reference}. Raison: ${reason}`,
        externalRef:   `REFUND-${txn.reference}`,
        paymentMethod: txn.paymentMethod || "sdk_payout",
        mobileNumber:  txn.customerPhone || undefined,
      }).catch(e => console.error("[sdk-withdrawal] Erreur création transaction remboursement:", e));
    } catch (refundErr) {
      console.error(
        `[sdk-withdrawal] ❌ ERREUR REMBOURSEMENT WALLET — Ref: ${txn.reference} | ` +
        `WalletId: ${walletId} | Montant: ${totalDebited} | Erreur:`, refundErr
      );
    }
  } else {
    console.error(
      `[sdk-withdrawal] ❌ IMPOSSIBLE DE REMBOURSER — walletId manquant | ` +
      `Ref: ${txn.reference} | Montant à rembourser: ${totalDebited}`
    );
  }

  if (entry.webhookUrl) {
    await sendWebhookWithRetry(entry.webhookUrl, {
      event: "payout.failed", reference: txn.reference, status: "failed",
      amount: txn.amount, fee: txFee, currency: txn.currency, reason,
      failedAt: new Date().toISOString(),
    }, entry.webhookSecret, txn.reference, txn.id);
  }
  console.warn(`❌ [sdk-withdrawal] Retrait ${txn.reference} échoué — raison: ${reason} | Montant remboursé: ${totalDebited}`);
}

// Dispatch SDK withdrawal to the appropriate payment gateway
export async function autoDispatchSdkWithdrawal(
  entry: WithdrawalQueueEntry,
  wr: any,
  txn: any,
): Promise<void> {
  // Guard: only dispatch pending withdrawals
  if (wr.status !== "pending") return;

  // Toujours envoyer le montant COMPLET demandé par le marchand au destinataire.
  // Les frais ont déjà été débités du wallet marchand au moment de la création du retrait.
  // Ne jamais utiliser wr.netAmount qui peut contenir amount-fee (ancienne logique).
  const netAmount   = parseFloat(txn.amount);
  const mobileNumber = wr.mobileNumber;
  const currency    = txn.currency || "XOF";
  const countryCode = (wr.country || "").toUpperCase();

  // The database is the source of truth for the gateway. Static services only
  // help identify the operator requested by the merchant.
  let gateway = "";
  let operatorName = wr.paymentMethod || "";
  let isOperatorActive = false;
  try {
    const countries = await storage.getCountries();
    const operators = await storage.getOperators();
    const service = getServiceByOperator(countryCode, operatorName);
    const selectedOperator = service
      ? resolveConfiguredOperator(service, operators, countries)
      : undefined;
    if (selectedOperator?.paymentGateway) gateway = selectedOperator.paymentGateway;
    if (selectedOperator?.name) operatorName = selectedOperator.name;
    isOperatorActive = selectedOperator?.isActive !== false;
  } catch (e) {
    console.warn("[sdk-withdrawal] Erreur lookup opérateur DB:", e);
  }

  if (!gateway || !isOperatorActive) {
    await markSdkWithdrawalFailed(
      entry,
      wr,
      txn,
      !gateway
        ? `Opérateur ${operatorName}/${countryCode} non configuré dans l’administration`
        : `Opérateur ${operatorName}/${countryCode} désactivé dans l’administration`,
    );
    return;
  }

  console.log(`[sdk-withdrawal] Dispatch ref=${txn.reference} opérateur="${operatorName}" pays=${countryCode} gateway="${gateway}" montant=${netAmount} ${currency} → ${mobileNumber}`);

  // Mark as dispatching (prevents double-dispatch on concurrent queue runs)
  await storage.updateWithdrawalRequest(wr.id, { status: "processing" }).catch(() => {});
  await storage.updateApiTransaction(txn.id, { status: "processing" }).catch(() => {});

  // Webhook payout.processing — informer le marchand que le retrait est en cours
  if (entry.webhookUrl) {
    await sendWebhookWithRetry(entry.webhookUrl, {
      event: "payout.processing", reference: txn.reference, status: "processing",
      amount: txn.amount, fee: txn.fee ?? "0", currency: txn.currency,
      phoneNumber: mobileNumber, operator: operatorName, country: countryCode,
      gateway, timestamp: new Date().toISOString(),
    }, entry.webhookSecret, txn.reference, txn.id).catch(() => {});
  }

  // ─── PayDunya ──────────────────────────────────────────────────────────────
  if (gateway === "paydunya") {
    try {
      const {
        payDunyaDisburse,
        formatPhoneForPayDunya,
        getPayDunyaWithdrawMode,
        getPayDunyaDisbursementCallbackUrl,
      } = await import("./paydunya");
      const withdrawMode = getPayDunyaWithdrawMode(operatorName, countryCode);
      if (!withdrawMode) {
        await markSdkWithdrawalFailed(entry, wr, txn, `Mode retrait PayDunya introuvable pour ${operatorName}/${countryCode}`);
        return;
      }
      const cleanPhone = formatPhoneForPayDunya(mobileNumber, countryCode);
      const pdRef = `PD-WD-SDK-${wr.id}-${Date.now()}`;
      console.log("[sdk-withdrawal] PayDunya transfer initiated");
      const pdResult = await payDunyaDisburse({
        accountAlias: cleanPhone,
        amount:       netAmount,
        withdrawMode,
        callbackUrl:  getPayDunyaDisbursementCallbackUrl(),
        disburseId:   pdRef,
      });
      const pdRaw = JSON.stringify({ success: pdResult.success, status: pdResult.status, transactionId: pdResult.transactionId, error: pdResult.error });
      console.log(`[sdk-withdrawal] PayDunya response received: ${pdResult.success ? "success" : "failure"}`);
      if (entry.auditLogId) storage.updateSdkWithdrawalLog(entry.auditLogId, { gateway: "paydunya", gatewayReference: pdRef, gatewayRawResponse: pdRaw }).catch(() => {});
      if (!pdResult.success) {
        await markSdkWithdrawalFailed(entry, wr, txn, pdResult.error || "Échec PayDunya disburse", pdRaw);
        return;
      }
      // NE PAS écraser transactionReference — il contient la ref SDK (sdk_...)
      // indispensable pour que le webhook PayDunya détecte ce retrait comme un payout SDK.
      await storage.updateWithdrawalRequest(wr.id, {
        externalReference: pdRef,
        status:            pdResult.status === "success" ? "approved" : "processing",
      }).catch(() => {});
      if (pdResult.status === "success") {
        await markSdkWithdrawalCompleted(entry, txn, pdResult.transactionId || pdRef, pdRaw);
      } else {
        // En attente du webhook PayDunya — on enrichit l'entrée pour le polling actif
        const enrichedEntry: WithdrawalQueueEntry = {
          ...entry,
          paydunyaDisburseToken: pdResult.disburseToken,
          paydunyaDispatchedAt:  Date.now(),
          paydunyaPollingCount:  0,
        };
        withdrawalQueue.push(enrichedEntry);
        console.log(`[sdk-withdrawal] ⏳ PayDunya retrait en attente callback — token=${pdResult.disburseToken || pdRef} ref=${txn.reference}`);
      }
    } catch (e: any) {
      console.error(`[sdk-withdrawal] ❌ PayDunya exception ref=${txn.reference}:`, e?.message || e);
      await markSdkWithdrawalFailed(entry, wr, txn, `Erreur PayDunya: ${e?.message || e}`);
    }
    return;
  }

  // ─── OmniPay ───────────────────────────────────────────────────────────────
  if (gateway === "omnipay") {
    try {
      const { omnipay: opClient, getOmnipayOperator, formatPhoneForOmnipay } = await import("./omnipay");
      const opOperator = getOmnipayOperator(operatorName);
      const cleanPhone = formatPhoneForOmnipay(mobileNumber, countryCode);
      const opRef = `WD-SDK-${wr.id}-${Date.now()}`;
      const nameParts = (wr.walletName || "Client").split(" ");
      console.log(`[sdk-withdrawal] 📤 OmniPay — Envoi retrait ref=${txn.reference} phone=${cleanPhone} montant=${netAmount} opérateur=${opOperator}`);
      const opResult = await opClient.transfer({
        msisdn:    cleanPhone,
        amount:    netAmount,
        reference: opRef,
        firstName: nameParts[0],
        lastName:  nameParts.slice(1).join(" ") || nameParts[0],
        operator:  opOperator ?? undefined,
      });
      console.log(`[sdk-withdrawal] 📥 OmniPay — Réponse ref=${txn.reference}: success=${opResult.success} id=${opResult.id} message=${opResult.message || "aucun"}`);
      await storage.updateWithdrawalRequest(wr.id, {
        externalReference:    opRef,
        transactionReference: opResult.id?.toString() || null,
      }).catch(() => {});
      if (String(opResult.success) === "1") {
        withdrawalQueue.push(entry); // En attente du webhook OmniPay
      } else {
        await markSdkWithdrawalFailed(entry, wr, txn, opResult.message || "Échec OmniPay transfer");
      }
    } catch (e: any) {
      console.error(`[sdk-withdrawal] ❌ OmniPay exception ref=${txn.reference}:`, e?.message || e);
      await markSdkWithdrawalFailed(entry, wr, txn, `Erreur OmniPay: ${e?.message || e}`);
    }
    return;
  }

  // ─── MbiyoPay ──────────────────────────────────────────────────────────────
  if (gateway === "mbiyopay") {
    try {
      const { mbiyopay: mbClient, getMbiyoNetwork, getMbiyoCurrency, formatPhoneForMbiyo } = await import("./mbiyopay");
      const network  = getMbiyoNetwork(operatorName, countryCode);
      if (!network) {
        await markSdkWithdrawalFailed(entry, wr, txn, `Réseau MbiyoPay introuvable pour ${operatorName}/${countryCode}`);
        return;
      }
      const mbCurrency     = getMbiyoCurrency(countryCode);
      const formattedPhone = formatPhoneForMbiyo(mobileNumber, countryCode);
      const mbRef = `mb-wd-sdk-${wr.id}-${Date.now()}`;
      console.log(`[sdk-withdrawal] 📤 MbiyoPay — Envoi retrait ref=${txn.reference} phone=${formattedPhone} montant=${netAmount} réseau=${network}`);
      const mbResult = await mbClient.payout({
        amount:      netAmount,
        currency:    mbCurrency,
        network,
        phoneNumber: formattedPhone,
        countryCode,
        orderId:     mbRef,
        callbackUrl: `${appUrl}/api/webhook/mbiyopay`,
        beneficiary: wr.walletName || "Client",
      });
      console.log(`[sdk-withdrawal] 📥 MbiyoPay — Réponse ref=${txn.reference}: status=${mbResult.status} txId=${mbResult.data?.transaction_id || "?"} message=${mbResult.message || "aucun"}`);
      if (mbResult.status === "success" && mbResult.data) {
        await storage.updateWithdrawalRequest(wr.id, {
          externalReference:    mbRef,
          transactionReference: mbResult.data.transaction_id || null,
        }).catch(() => {});
        withdrawalQueue.push(entry); // En attente du webhook MbiyoPay
      } else {
        await markSdkWithdrawalFailed(entry, wr, txn, mbResult.message || "Échec MbiyoPay payout");
      }
    } catch (e: any) {
      console.error(`[sdk-withdrawal] ❌ MbiyoPay exception ref=${txn.reference}:`, e?.message || e);
      await markSdkWithdrawalFailed(entry, wr, txn, `Erreur MbiyoPay: ${e?.message || e}`);
    }
    return;
  }

  // ─── SoleasPay (défaut) ────────────────────────────────────────────────────
  try {
    const { soleaspay, getWithdrawableServiceByCountryAndOperator } = await import("./soleaspay");
    const service = getWithdrawableServiceByCountryAndOperator(countryCode, operatorName);
    if (!service) {
      await markSdkWithdrawalFailed(entry, wr, txn, `Opérateur SoleasPay introuvable pour ${operatorName}/${countryCode}`);
      return;
    }
    console.log(`[sdk-withdrawal] 📤 SoleasPay — Envoi retrait ref=${txn.reference} phone=${mobileNumber} montant=${netAmount} serviceId=${service.id}`);
    const spResult = await soleaspay.withdraw({
      wallet:    mobileNumber,
      amount:    netAmount,
      currency,
      serviceId: service.id,
    });
    console.log(`[sdk-withdrawal] 📥 SoleasPay — Réponse ref=${txn.reference}: success=${spResult.success} extRef=${spResult.data?.external_reference || spResult.data?.reference || "?"} message=${spResult.message || "aucun"}`);
    if (!spResult.success) {
      await markSdkWithdrawalFailed(entry, wr, txn, spResult.message || "Échec SoleasPay withdraw");
      return;
    }
    const extRef = spResult.data?.external_reference || spResult.data?.reference || `SP-WD-SDK-${wr.id}`;
    await storage.updateWithdrawalRequest(wr.id, { externalReference: extRef }).catch(() => {});
    withdrawalQueue.push(entry); // En attente du webhook SoleasPay
  } catch (e: any) {
    console.error(`[sdk-withdrawal] ❌ SoleasPay exception ref=${txn.reference}:`, e?.message || e);
    await markSdkWithdrawalFailed(entry, wr, txn, `Erreur SoleasPay: ${e?.message || e}`);
  }
}

async function processWithdrawalQueue(): Promise<void> {
  // ── Traiter les entrées en mémoire ───────────────────────────────────────
  const entries = withdrawalQueue.splice(0, 10);
  for (const entry of entries) {
    try {
      const txn = await storage.getApiTransactionByReference(entry.sdkTransactionRef);
      if (!txn || txn.status === "completed" || txn.status === "failed") continue;

      const wr = await storage.getWithdrawalRequest(entry.withdrawalRequestId);
      if (!wr) { await storage.updateApiTransaction(txn.id, { status: "failed" }); continue; }

      if (wr.status === "pending") {
        await autoDispatchSdkWithdrawal(entry, wr, txn);
      } else if (wr.status === "processing") {
        if (txn.status !== "processing") await storage.updateApiTransaction(txn.id, { status: "processing" });

        // ── Polling actif PayDunya : si webhook non reçu après 10 min, on interroge l'API ──
        const POLL_START_DELAY_MS  = 10 * 60_000;  // 1ère tentative après 10 min
        const POLL_INTERVAL_MS     = 10 * 60_000;  // puis toutes les 10 min
        const MAX_POLL_COUNT       = 18;            // 3h max (18 × 10 min)
        const PAYDUNYA_STUCK_MS    = 3 * 60 * 60_000; // échec forcé après 3h

        const hasPaydunyaToken = !!entry.paydunyaDisburseToken;
        const dispatchedAt     = entry.paydunyaDispatchedAt || 0;
        const pollingCount     = entry.paydunyaPollingCount || 0;
        const elapsedMs        = Date.now() - dispatchedAt;

        if (hasPaydunyaToken && elapsedMs > PAYDUNYA_STUCK_MS && pollingCount >= MAX_POLL_COUNT) {
          // Trop longtemps en attente → on considère que le retrait a échoué
          console.warn(`[sdk-withdrawal] ⏰ PayDunya timeout définitif (3h) pour ref=${txn.reference} — abandon`);
          await markSdkWithdrawalFailed(entry, wr, txn, "Délai PayDunya dépassé (3h) — aucun callback reçu");
          continue;
        }

        const shouldPoll = hasPaydunyaToken
          && elapsedMs > POLL_START_DELAY_MS
          && (pollingCount === 0 || elapsedMs > POLL_START_DELAY_MS + pollingCount * POLL_INTERVAL_MS);

        if (shouldPoll) {
          console.log(`[sdk-withdrawal] 🔍 Polling PayDunya statut — ref=${txn.reference} token=${entry.paydunyaDisburseToken} tentative=${pollingCount + 1}`);
          try {
            const { checkPayDunyaDisburseStatus } = await import("./paydunya");
            const pollResult = await checkPayDunyaDisburseStatus(entry.paydunyaDisburseToken!);
            console.log(`[sdk-withdrawal] 📊 PayDunya poll status=${pollResult.status} ref=${txn.reference}`);

            if (pollResult.status === "success") {
              await storage.updateWithdrawalRequest(wr.id, { status: "approved", processedAt: new Date() }).catch(() => {});
              await markSdkWithdrawalCompleted(entry, txn, pollResult.transactionId, undefined);
              continue; // ne pas re-queuer
            } else if (pollResult.status === "failed") {
              await markSdkWithdrawalFailed(entry, wr, txn, "PayDunya disbursement échoué (polling)");
              continue;
            }
            // unknown ou pending → on continue à attendre
          } catch (pollErr) {
            console.warn(`[sdk-withdrawal] ⚠️ Polling PayDunya erreur (non bloquant):`, pollErr);
          }
          withdrawalQueue.push({ ...entry, paydunyaPollingCount: pollingCount + 1 });
        } else {
          withdrawalQueue.push(entry);
        }
      } else if (wr.status === "completed" || wr.status === "approved") {
        await markSdkWithdrawalCompleted(entry, txn);
      } else if (wr.status === "rejected" || wr.status === "failed") {
        await markSdkWithdrawalFailed(entry, wr, txn, (wr as any).rejectionReason || "Retrait rejeté");
      }
    } catch (err) {
      console.error("[sdk-withdrawal-queue]", err);
    }
  }

  // ── Recovery : récupérer les retraits SDK orphelins après redémarrage ────
  // (api_transactions type=payout, status=processing, pas déjà dans la queue)
  try {
    const queuedRefs = new Set(withdrawalQueue.map(e => e.sdkTransactionRef));
    const allSdkTxns = await storage.getApiTransactionsByType?.("payout").catch(() => null);
    if (allSdkTxns) {
      const orphans = allSdkTxns.filter((t: any) =>
        (t.status === "processing" || t.status === "pending") && !queuedRefs.has(t.reference)
      );
      for (const orphan of orphans.slice(0, 5)) {
        // Find linked withdrawal_request via transactionReference
        const allWrs = await storage.getAllWithdrawalRequests().catch(() => []);
        const linkedWr = allWrs.find((r: any) => r.transactionReference === orphan.reference);
        if (!linkedWr) continue;

        const apiKey = orphan.apiKeyId ? await storage.getApiKeyById(Number(orphan.apiKeyId)).catch(() => null) : null;
        const recoveredEntry: WithdrawalQueueEntry = {
          sdkTransactionRef:   orphan.reference,
          withdrawalRequestId: linkedWr.id,
          webhookUrl:          (apiKey as any)?.webhookUrl || null,
          webhookSecret:       (apiKey as any)?.webhookSecret || null,
        };

        if (linkedWr.status === "approved" || linkedWr.status === "completed") {
          console.log(`🔄 [sdk-recovery] Retrait orphelin ${orphan.reference} → complétion`);
          await markSdkWithdrawalCompleted(recoveredEntry, orphan);
        } else if (linkedWr.status === "pending" && orphan.status === "pending") {
          console.log(`🔄 [sdk-recovery] Retrait orphelin ${orphan.reference} → re-dispatch`);
          withdrawalQueue.push(recoveredEntry);
        } else {
          // Processing → re-queue en attente du webhook passerelle
          withdrawalQueue.push(recoveredEntry);
        }
      }
    }
  } catch (recoveryErr) {
    // Recovery optionnel — ne pas crasher la queue principale
  }
}
setInterval(processWithdrawalQueue, 60_000);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateReference(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString("hex");
  return `sdk_${timestamp}_${random}`;
}

function generatePaymentToken(): string {
  return `pay_tok_${crypto.randomBytes(20).toString("hex")}`;
}

function generateOtpToken(): string {
  return `otp_${crypto.randomBytes(16).toString("hex")}`;
}

function getOperatorSlug(service: typeof SOLEASPAY_SERVICES[0]): string {
  const gateway = service.paymentGateway || "soleaspay";
  if (gateway === "paydunya") {
    const pd = getSoftPayOperator(service.operator, service.countryCode);
    if (pd) return pd.slug;
  }
  return `${service.operator.toLowerCase().replace(/[\s\/]+/g, "-")}-${service.countryCode.toLowerCase()}`;
}

const COUNTRY_CODE_MAP: Record<string, { countryCode: string; currency: string; countryName: string }> = {
  TG:  { countryCode: "TG",  currency: "XOF", countryName: "Togo" },
  BJ:  { countryCode: "BJ",  currency: "XOF", countryName: "Bénin" },
  SN:  { countryCode: "SN",  currency: "XOF", countryName: "Sénégal" },
  CI:  { countryCode: "CI",  currency: "XOF", countryName: "Côte d'Ivoire" },
  ML:  { countryCode: "ML",  currency: "XOF", countryName: "Mali" },
  BF:  { countryCode: "BF",  currency: "XOF", countryName: "Burkina Faso" },
  GN:  { countryCode: "GN",  currency: "GNF", countryName: "Guinée" },
  CM:  { countryCode: "CM",  currency: "XAF", countryName: "Cameroun" },
  CG:  { countryCode: "CG",  currency: "XAF", countryName: "Congo" },
  COD: { countryCode: "COD", currency: "CDF", countryName: "RDC" },
  COG: { countryCode: "COG", currency: "XAF", countryName: "Congo Brazzaville" },
};

function detectCountryFromMethod(paymentMethod: string, payerCountry?: string): string | null {
  if (payerCountry && COUNTRY_CODE_MAP[payerCountry.toUpperCase()]) return payerCountry.toUpperCase();
  const method = (paymentMethod || "").toLowerCase();
  if (method.includes("tmoney") || method.includes("flooz")) return "TG";
  if (method.includes("mtn_bj") || method.includes("moov_bj")) return "BJ";
  if (method.includes("orange_sn") || method.includes("wave_sn")) return "SN";
  if (method.includes("orange_ci") || method.includes("mtn_ci") || method.includes("wave_ci") || method.includes("moov_ci")) return "CI";
  if (method.includes("orange_ml")) return "ML";
  if (method.includes("orange_bf") || method.includes("moov_bf")) return "BF";
  if (method.includes("orange_cm") || method.includes("mtn_cm")) return "CM";
  return null;
}

// ─── SDK CORS ─────────────────────────────────────────────────────────────────
// Public SDK endpoints must allow any origin: merchant frontends live on arbitrary domains.
// Security is enforced by single-use paymentTokens, API-key auth, and rate limiting.
function sdkCors(req: Request, res: Response, next: NextFunction) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
}

// ─── Structured SDK logging ────────────────────────────────────────────────────
function sdkLog(opts: {
  req: Request;
  endpoint: string;
  statusCode: number;
  responseTimeMs: number;
  operator?: string;
  country?: string;
  reference?: string;
  error?: string;
}): void {
  const ip = ((opts.req.headers["x-forwarded-for"] as string) || opts.req.ip || "unknown").split(",")[0].trim();
  console.log(JSON.stringify({
    ts:       new Date().toISOString(),
    api:      "sdk/v1",
    endpoint: opts.endpoint,
    method:   opts.req.method,
    ip,
    status:   opts.statusCode,
    ms:       opts.responseTimeMs,
    ...(opts.operator  && { op:  opts.operator }),
    ...(opts.country   && { cc:  opts.country }),
    ...(opts.reference && { ref: opts.reference }),
    ...(opts.error     && { err: opts.error }),
    ua: (opts.req.get("User-Agent") || "").substring(0, 80),
  }));
}

// ─── Authentication ────────────────────────────────────────────────────────────
async function authenticateSdkKey(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Clé API SDK requise", code: "UNAUTHORIZED" });
  }
  const apiKeyValue = authHeader.substring(7);
  const apiKeyRecord = await storage.getApiKeyByKey(apiKeyValue);
  if (!apiKeyRecord) return res.status(401).json({ success: false, error: "Clé API invalide", code: "INVALID_API_KEY" });
  if (!apiKeyRecord.isActive) return res.status(403).json({ success: false, error: "Clé API inactive", code: "API_KEY_INACTIVE" });
  if (apiKeyRecord.apiType !== "sdk") return res.status(403).json({ success: false, error: "Cette clé n'est pas une clé SDK", code: "NOT_SDK_KEY" });
  const user = await storage.getUser(apiKeyRecord.userId);
  if (!user) return res.status(401).json({ success: false, error: "Utilisateur introuvable", code: "USER_NOT_FOUND" });
  if (!user.isVerified) return res.status(403).json({ success: false, error: "Compte non vérifié. Complétez la vérification KYC.", code: "ACCOUNT_NOT_VERIFIED" });
  if (!(user as any).apiSdkEnabled) return res.status(403).json({ success: false, error: "L'API SDK n'est pas activée sur ce compte", code: "SDK_NOT_ENABLED" });
  await storage.incrementApiKeyRequestCount(apiKeyRecord.id);
  (req as any).sdkUser = user;
  (req as any).sdkKey = apiKeyRecord;
  next();
}

async function checkApiMaintenance(req: Request, res: Response, next: NextFunction) {
  try {
    const m = await storage.getSetting("api_docs_maintenance");
    if (m === "true") return res.status(503).json({ success: false, error: "API en maintenance", code: "API_MAINTENANCE" });
    next();
  } catch { next(); }
}

// ─── INFO ─────────────────────────────────────────────────────────────────────
router.get("/v1", (_req, res) => {
  res.json({
    success: true,
    data: {
      name:          "SendavaPay SDK API",
      version:       "3.0.0",
      status:        "operational",
      documentation: "/docs",
      architecture:  "pure-api | no-widget | no-iframe | no-redirect | merchant-controls-frontend",
      endpoints: {
        createPayment:      "POST /api/sdk/v1/create-payment",
        countries:          "GET  /api/sdk/v1/countries",
        operators:          "GET  /api/sdk/v1/operators/:countryCode",
        paymentToken:       "GET  /api/sdk/v1/payment-token/:token",
        initiatePayment:    "POST /api/sdk/v1/initiate-payment",
        submitOtp:          "POST /api/sdk/v1/submit-otp",
        retryPayment:       "POST /api/sdk/v1/retry-payment",
        paymentStatus:      "GET  /api/sdk/v1/payment-status/:reference",
        verifyPayment:      "POST /api/sdk/v1/verify-payment",
        validateWithdrawal: "POST /api/sdk/v1/validate-withdrawal",
        withdraw:           "POST /api/sdk/v1/withdraw",
        withdrawalStatus:   "GET  /api/sdk/v1/withdrawal-status/:reference",
        withdrawals:        "GET  /api/sdk/v1/withdrawals",
        balance:            "GET  /api/sdk/v1/balance",
        transactions:       "GET  /api/sdk/v1/transactions",
        updateWebhook:      "PUT  /api/sdk/v1/webhook",
        testWebhook:        "POST /api/sdk/v1/test-webhook",
        operatorsStatus:    "GET  /api/sdk/v1/operators-status",
        payoutStatus:       "GET  /api/sdk/v1/payout-status",
        health:             "GET  /api/sdk/v1/health",
      },
    },
  });
});

// ─── CREATE PAYMENT ───────────────────────────────────────────────────────────
router.post("/v1/create-payment", checkApiMaintenance, authenticateSdkKey, async (req: Request, res: Response) => {
  const t0 = Date.now();
  const sdkUser = (req as any).sdkUser as User;
  const sdkKey  = (req as any).sdkKey  as ApiKey;

  try {
    const schema = z.object({
      amount:            z.number().positive(),
      currency:          z.string().default("XOF"),
      description:       z.string().optional(),
      externalReference: z.string().optional(),
      customerEmail:     z.string().email().optional(),
      customerPhone:     z.string().optional(),
      customerName:      z.string().optional(),
      payerCountry:      z.string().min(2).max(3).optional(),
      webhookUrl:        z.string().url().optional(),
      metadata:          z.record(z.any()).optional(),
    });

    const data = schema.parse(req.body);
    const reference     = generateReference();
    const paymentToken  = generatePaymentToken();
    const tokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

    if (data.externalReference) {
      const existing = await storage.getApiTransactionsByUser(sdkUser.id);
      const dup = existing.find(
        t => t.externalReference === data.externalReference &&
             (t.status === "pending" || t.status === "processing" || t.status === "completed")
      );
      if (dup) {
        sdkLog({ req, endpoint: "create-payment", statusCode: 409, responseTimeMs: Date.now() - t0, error: "DUPLICATE_REFERENCE" });
        return res.status(409).json({
          success: false,
          error: "Un paiement avec cette référence existe déjà",
          code: "DUPLICATE_REFERENCE",
          data: { reference: dup.reference, status: dup.status },
        });
      }
    }

    const transaction = await storage.createApiTransaction({
      userId:            sdkUser.id,
      apiKeyId:          sdkKey.id,
      reference,
      externalReference: data.externalReference || null,
      type:              "payment",
      amount:            data.amount.toString(),
      currency:          data.currency,
      description:       data.description || null,
      customerEmail:     data.customerEmail || null,
      customerPhone:     data.customerPhone || null,
      customerName:      data.customerName  || null,
      callbackUrl:       data.webhookUrl || sdkKey.webhookUrl || null,
      metadata:          data.metadata ? JSON.stringify(data.metadata) : null,
      paymentToken,
      tokenExpiresAt,
      ipAddress:         req.ip || null,
      userAgent:         req.get("User-Agent") || null,
    } as any);

    sdkLog({ req, endpoint: "create-payment", statusCode: 201, responseTimeMs: Date.now() - t0, reference });
    res.status(201).json({
      success: true,
      data: {
        reference,
        paymentToken,
        expiresAt:   tokenExpiresAt.toISOString(),
        amount:      data.amount,
        currency:    data.currency,
        status:      "pending",
        nextStep:    "GET /api/sdk/v1/operators/:countryCode — puis POST /api/sdk/v1/initiate-payment",
        createdAt:   transaction.createdAt,
      },
    });
  } catch (error: any) {
    sdkLog({ req, endpoint: "create-payment", statusCode: 400, responseTimeMs: Date.now() - t0, error: error.message });
    res.status(400).json({ success: false, error: error.message || "Erreur lors de la création du paiement" });
  }
});

// ─── COUNTRIES (public, CORS) ─────────────────────────────────────────────────
router.options("/v1/countries", sdkCors);
router.get("/v1/countries", sdkCors, async (_req: Request, res: Response) => {
  try {
    const dbCountries = await storage.getCountries();
    const inactiveSet = new Set(dbCountries.filter(c => c.isActive === false).map(c => c.code.toUpperCase()));
    const data = Object.values(COUNTRY_CODE_MAP)
      .filter(c => !inactiveSet.has(c.countryCode))
      .map(c => ({
        code:      c.countryCode,
        name:      c.countryName,
        currency:  c.currency,
        operators: getServicesByCountry(c.countryCode).length,
      }));
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: "Erreur serveur", code: "SERVER_ERROR" });
  }
});

// ─── GET OPERATORS FOR A COUNTRY (public, CORS) ───────────────────────────────
router.options("/v1/operators/:countryCode", sdkCors);
router.get("/v1/operators/:countryCode", sdkCors, async (req: Request, res: Response) => {
  try {
    const countryCode = req.params.countryCode.toUpperCase();
    const services    = getServicesByCountry(countryCode);

    if (!services.length) {
      return res.json({ success: true, data: [] });
    }

    const [dbOperators, dbCountries] = await Promise.all([
      storage.getOperators(),
      storage.getCountries(),
    ]);

    const data = services.flatMap(service => {
      const dbOp = resolveConfiguredOperator(service, dbOperators, dbCountries);
      if (!dbOp?.paymentGateway) return [];
      const gateway       = dbOp.paymentGateway;
      const inMaintenance = dbOp.isActive === false || (dbOp.inMaintenance || dbOp.maintenanceApi) || false;
      const pdOp          = gateway === "paydunya" ? getSoftPayOperator(service.operator, service.countryCode) : null;
      const requiresOtp   = pdOp?.requiresOtp ?? false;
      const slug          = getOperatorSlug({ ...service, paymentGateway: gateway });

      return [{
        id:          String(service.id),
        name:        service.description,
        operator:    service.operator,
        slug,
        currency:    service.currency,
        country:     service.countryCode,
        gateway,
        requiresOtp,
        status:      inMaintenance ? "offline" : "online",
        available:   !inMaintenance,
      }];
    });

    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: "Erreur serveur", code: "SERVER_ERROR" });
  }
});

// ─── OPERATORS STATUS (public, CORS) ─────────────────────────────────────────
router.options("/v1/operators-status", sdkCors);
router.get("/v1/operators-status", sdkCors, async (_req: Request, res: Response) => {
  try {
    const [dbOperators, dbCountries] = await Promise.all([
      storage.getOperators(),
      storage.getCountries(),
    ]);

    const data = SOLEASPAY_SERVICES.flatMap(service => {
      const dbOp = resolveConfiguredOperator(service, dbOperators, dbCountries);
      if (!dbOp?.paymentGateway) return [];
      const inMaintenance = dbOp.isActive === false || (dbOp.inMaintenance || dbOp.maintenanceApi) || false;
      const gateway       = dbOp.paymentGateway;
      const slug          = getOperatorSlug({ ...service, paymentGateway: gateway });

      return [{
        id:            String(service.id),
        slug,
        operator:      service.operator,
        country:       service.countryCode,
        currency:      service.currency,
        gateway,
        depositStatus: inMaintenance ? "offline" : "online",
        payoutStatus:  (dbOp.inMaintenance || dbOp.maintenanceWithdraw) ? "offline" : "online",
      }];
    });

    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: "Erreur serveur", code: "SERVER_ERROR" });
  }
});

// ─── GET PAYMENT INFO BY TOKEN (public, CORS) ─────────────────────────────────
router.options("/v1/payment-token/:token", sdkCors);
router.get("/v1/payment-token/:token", sdkCors, async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const transaction = await storage.getApiTransactionByToken(token);

    if (!transaction) {
      return res.status(404).json({ success: false, error: "Token invalide ou expiré", code: "INVALID_TOKEN" });
    }
    if (transaction.tokenExpiresAt && new Date() > new Date(transaction.tokenExpiresAt)) {
      return res.status(410).json({ success: false, error: "Ce token de paiement a expiré", code: "TOKEN_EXPIRED" });
    }

    const user = await storage.getUser(transaction.userId);
    let merchantName = user?.fullName || "SendavaPay";
    if (transaction.apiKeyId) {
      const apiKey = await storage.getApiKeyById(transaction.apiKeyId);
      if (apiKey?.appName) merchantName = apiKey.appName;
    }

    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.json({
      success: true,
      data: {
        reference:     transaction.reference,
        amount:        transaction.amount,
        currency:      transaction.currency,
        description:   transaction.description,
        status:        transaction.status,
        merchantName,
        customerName:  transaction.customerName  || null,
        customerPhone: transaction.customerPhone || null,
        expiresAt:     transaction.tokenExpiresAt,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: "Erreur serveur", code: "SERVER_ERROR" });
  }
});

// ─── INITIATE PAYMENT (public, CORS) ──────────────────────────────────────────
// Le marchand contrôle son propre frontend. Il passe le paymentToken + opérateur choisi.
router.options("/v1/initiate-payment", sdkCors);
router.post("/v1/initiate-payment", sdkCors, async (req: Request, res: Response) => {
  const t0 = Date.now();
  try {
    const schema = z.object({
      paymentToken: z.string(),
      payerName:    z.string().min(1),
      payerPhone:   z.string().min(6),
      payerEmail:   z.string().email().optional().or(z.literal("")).transform(v => v || undefined),
      payerCountry: z.string().min(2).max(3),
      operatorId:   z.union([z.number(), z.string()]).transform(v => parseInt(String(v), 10)),
      otp:          z.string().optional(),
      address:      z.string().optional(),
      successUrl:   z.string().url().optional(), // URL de redirection marchant après paiement Wave
    });

    const data = schema.parse(req.body);

    const transaction = await storage.getApiTransactionByToken(data.paymentToken);
    if (!transaction) {
      return res.status(404).json({ success: false, error: "Token de paiement invalide ou expiré", code: "INVALID_TOKEN" });
    }
    if (transaction.tokenExpiresAt && new Date() > new Date(transaction.tokenExpiresAt)) {
      // Fire payment.expired webhook
      const apiKey = transaction.apiKeyId ? await storage.getApiKeyById(transaction.apiKeyId) : null;
      const cbUrl  = transaction.callbackUrl || (apiKey as any)?.webhookUrl;
      if (cbUrl) {
        await sendWebhookWithRetry(cbUrl, {
          event: "payment.expired", reference: transaction.reference,
          status: "cancelled", expiredAt: new Date().toISOString(),
        }, (apiKey as any)?.webhookSecret, transaction.reference, transaction.id);
      }
      await storage.updateApiTransaction(transaction.id, { status: "cancelled" });
      return res.status(410).json({ success: false, error: "Ce token de paiement a expiré", code: "TOKEN_EXPIRED" });
    }
    if (transaction.status === "completed") {
      return res.status(409).json({ success: false, error: "Ce paiement a déjà été complété", code: "ALREADY_COMPLETED" });
    }
    if (transaction.status === "processing") {
      return res.status(409).json({ success: false, error: "Un paiement est déjà en cours", code: "PAYMENT_IN_PROGRESS" });
    }
    if (transaction.status !== "pending") {
      return res.status(400).json({ success: false, error: "Ce paiement ne peut plus être traité", code: "INVALID_STATUS" });
    }

    const service = getServiceById(data.operatorId);
    if (!service) {
      return res.status(400).json({ success: false, error: "Opérateur invalide", code: "INVALID_OPERATOR" });
    }

    const payerCountry = data.payerCountry.toUpperCase();
    if (service.countryCode.toUpperCase() !== payerCountry) {
      return res.status(400).json({
        success: false,
        error: `Cet opérateur n'est pas disponible pour le pays ${payerCountry}`,
        code: "COUNTRY_MISMATCH",
      });
    }

    const [dbOperators, dbCountries] = await Promise.all([
      storage.getOperators(),
      storage.getCountries(),
    ]);
    const dbOp = resolveConfiguredOperator(service, dbOperators, dbCountries);
    if (!dbOp?.paymentGateway) {
      return res.status(400).json({
        success: false,
        error: "Cet opérateur doit être configuré dans l’administration avant de recevoir des paiements",
        code: "OPERATOR_NOT_CONFIGURED",
      });
    }
    if (dbOp.isActive === false) {
      return res.status(503).json({
        success: false,
        error: "Cet opérateur est désactivé dans l’administration",
        code: "OPERATOR_UNAVAILABLE",
      });
    }
    const paymentGateway = dbOp.paymentGateway;

    if (dbOp?.inMaintenance || dbOp?.maintenanceApi) {
      sdkLog({ req, endpoint: "initiate-payment", statusCode: 503, responseTimeMs: Date.now() - t0, operator: service.operator, country: payerCountry });
      return res.status(503).json({ success: false, error: "Opérateur temporairement indisponible", code: "OPERATOR_UNAVAILABLE" });
    }

    const amount      = parseFloat(transaction.amount);
    const description = transaction.description || `Paiement ${transaction.reference}`;
    const orderId     = `API_${transaction.reference}_${Date.now()}`;
    const _replitDomain1 = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0].trim()}`
      : process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null;
    const baseUrl = process.env.APP_URL || process.env.SITE_URL || _replitDomain1 || "https://sendavapay.com";

    // ── Calcul du fee payin SDK ──────────────────────────────────────────────
    // Priorité : customApiPaymentFeeRate (utilisateur) → encaissementRate (global)
    let payinFeeRate = 5; // fallback ultime
    try {
      const [txUser, commSettings] = await Promise.all([
        storage.getUser(transaction.userId!),
        storage.getCommissionSettings(),
      ]);
      if ((txUser as any)?.customApiPaymentFeeRate != null) {
        payinFeeRate = parseFloat((txUser as any).customApiPaymentFeeRate);
      } else {
        payinFeeRate = parseFloat((commSettings as any)?.encaissementRate || "5");
      }
    } catch (_) {}
    const payinFee = parseFloat((amount * payinFeeRate / 100).toFixed(2));

    await storage.updateApiTransaction(transaction.id, {
      customerName:  data.payerName,
      customerPhone: data.payerPhone,
      customerEmail: data.payerEmail || null,
      fee:           payinFee.toString(),
      paymentMethod: paymentGateway === "omnipay"
        ? `omnipay_${service.operator}`
        : paymentGateway === "paydunya"
          ? `paydunya_${service.operator}`
          : service.operator,
      payerCountry:  payerCountry,
      status: "processing",
    });

    // ── PayDunya ────────────────────────────────────────────────────────────
    if (paymentGateway === "paydunya") {
      const { initiatePayDunySoftPay, formatPhoneForPayDunya, createPayDunyaCheckout } = await import("./paydunya");
      const pdOp = getSoftPayOperator(service.operator, service.countryCode);

      if (pdOp?.requiresOtp && !data.otp) {
        const otpToken = generateOtpToken();
        otpStore.set(otpToken, {
          reference: transaction.reference, serviceId: data.operatorId,
          payerName: data.payerName, payerPhone: data.payerPhone,
          payerEmail: data.payerEmail || "", payerCountry,
          amount, description, gateway: "paydunya",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });
        await storage.updateApiTransaction(transaction.id, { status: "pending" });
        sdkLog({ req, endpoint: "initiate-payment", statusCode: 200, responseTimeMs: Date.now() - t0, operator: service.operator, country: payerCountry });
        return res.json({
          success:     true,
          requiresOtp: true,
          otpToken,
          reference:   transaction.reference,
          message:     "Demandez au client de composer *144# sur son téléphone pour obtenir son OTP, puis soumettez-le via /submit-otp",
          nextStep:    "POST /api/sdk/v1/submit-otp",
        });
      }

      // URL de retour après paiement PayDunya : URL marchant si fournie, sinon page résultat SDK
      const pdReturnUrl = data.successUrl || `${baseUrl}/sdk-payment-result?reference=${transaction.reference}`;

      const phone    = formatPhoneForPayDunya(data.payerPhone, payerCountry);
      const pdResult = await initiatePayDunySoftPay({
        operatorName: service.operator,
        countryCode:  service.countryCode,
        phone,
        name:  data.payerName,
        email: data.payerEmail || "client@sendavapay.com",
        otp:   data.otp || undefined,
        invoiceParams: {
          totalAmount:  amount,
          description,
          storeName:    "SendavaPay",
          callbackUrl:  `${baseUrl}/api/webhook/paydunya`,
          returnUrl:    pdReturnUrl,
          cancelUrl:    `${baseUrl}/pay/api/${transaction.reference}`,
          customData:   { reference: transaction.reference, sdk: "1" },
        },
      });

      if (!pdResult.success) {
        try {
          const checkout = await createPayDunyaCheckout({
            totalAmount: amount, description, storeName: "SendavaPay",
            callbackUrl: `${baseUrl}/api/webhook/paydunya`,
            returnUrl:   pdReturnUrl,
            cancelUrl:   `${baseUrl}/pay/api/${transaction.reference}`,
          });
          if (checkout.success && checkout.checkoutUrl) {
            await storage.updateApiTransaction(transaction.id, { externalReference: checkout.token || orderId });
            sdkLog({ req, endpoint: "initiate-payment", statusCode: 200, responseTimeMs: Date.now() - t0, operator: service.operator, country: payerCountry });
            return res.json({ success: true, requiresOtp: false, requiresRedirect: true, redirectUrl: checkout.checkoutUrl, reference: transaction.reference, message: "Redirigez le client vers cette URL pour compléter le paiement" });
          }
        } catch (_) {}
        await storage.updateApiTransaction(transaction.id, { status: "failed" });
        sendTransactionWebhook(transaction, "payment.failed", { fee: payinFee, reason: pdResult.error || "Échec initiation PayDunya", status: "failed" }).catch(() => {});
        sdkLog({ req, endpoint: "initiate-payment", statusCode: 500, responseTimeMs: Date.now() - t0, operator: service.operator, country: payerCountry, error: pdResult.error });
        return res.status(500).json({ success: false, error: pdResult.error || "Échec de l'initiation du paiement", code: "PAYMENT_INITIATION_FAILED" });
      }

      // Rediriger uniquement pour Wave (redirect) et Orange SN (qr) — PAS pour les opérateurs USSD push
      if (pdResult.redirectUrl && (pdResult.responseType === "redirect" || pdResult.responseType === "qr")) {
        await storage.updateApiTransaction(transaction.id, { externalReference: `${orderId}|${pdResult.redirectUrl}` });
        sendTransactionWebhook(transaction, "payment.processing", { fee: payinFee, requiresRedirect: true, redirectUrl: pdResult.redirectUrl, status: "processing" }).catch(() => {});
        sdkLog({ req, endpoint: "initiate-payment", statusCode: 200, responseTimeMs: Date.now() - t0, operator: service.operator, country: payerCountry });
        return res.json({ success: true, requiresOtp: false, requiresRedirect: true, redirectUrl: pdResult.redirectUrl, reference: transaction.reference, message: "Redirigez le client vers cette URL pour compléter le paiement" });
      }

      const invoiceToken = (pdResult as any).invoiceToken || orderId;
      await storage.updateApiTransaction(transaction.id, { externalReference: `${orderId}|${invoiceToken}` });
      sendTransactionWebhook(transaction, "payment.processing", { fee: payinFee, status: "processing" }).catch(() => {});
      sdkLog({ req, endpoint: "initiate-payment", statusCode: 200, responseTimeMs: Date.now() - t0, operator: service.operator, country: payerCountry, reference: transaction.reference });
      return res.json({
        success:     true,
        requiresOtp: false,
        reference:   transaction.reference,
        message:     "Paiement initié. Le client va recevoir une demande de confirmation sur son téléphone.",
      });
    }

    // ── OmniPay ─────────────────────────────────────────────────────────────
    if (paymentGateway === "omnipay") {
      const { omnipay: opClient, getOmnipayOperator, formatPhoneForOmnipay } = await import("./omnipay");
      const opOperator = getOmnipayOperator(dbOp?.name || service.operator);

      if (opOperator === undefined) {
        await storage.updateApiTransaction(transaction.id, { status: "failed" });
        sendTransactionWebhook(transaction, "payment.failed", { fee: payinFee, reason: "Opérateur non supporté", status: "failed" }).catch(() => {});
        sdkLog({ req, endpoint: "initiate-payment", statusCode: 400, responseTimeMs: Date.now() - t0, operator: service.operator, country: payerCountry });
        return res.status(400).json({ success: false, error: "Opérateur non supporté", code: "OPERATOR_UNAVAILABLE" });
      }

      const cleanPhone = formatPhoneForOmnipay(data.payerPhone, payerCountry);
      const isWave     = opOperator === "wave";
      const nameParts  = data.payerName.split(" ");
      const autoOtp    = service.operator === "Orange" ? String(Math.floor(100000 + Math.random() * 900000)) : undefined;

      // Pour Wave : utiliser l'URL marchant si fournie, sinon page résultat SDK dédiée
      // On passe transaction.reference (pas orderId) pour que la page de résultat puisse vérifier
      const waveReturnUrl = isWave
        ? (data.successUrl || `${baseUrl}/sdk-payment-result?reference=${transaction.reference}`)
        : undefined;

      const opResult = await opClient.requestPayment({
        msisdn: cleanPhone, amount, reference: orderId,
        firstName: nameParts[0], lastName: nameParts.slice(1).join(" ") || nameParts[0],
        operator: opOperator ?? undefined, otp: autoOtp,
        returnUrl:   waveReturnUrl,
        callbackUrl: `${baseUrl}/api/webhook/omnipay`,
      });

      if (String(opResult.success) !== "1") {
        await storage.updateApiTransaction(transaction.id, { status: "failed" });
        sendTransactionWebhook(transaction, "payment.failed", { fee: payinFee, reason: opResult.message || "Échec initiation OmniPay", status: "failed" }).catch(() => {});
        sdkLog({ req, endpoint: "initiate-payment", statusCode: 500, responseTimeMs: Date.now() - t0, operator: service.operator, country: payerCountry, error: opResult.message });
        return res.status(500).json({ success: false, error: opResult.message || "Échec de l'initiation du paiement", code: "PAYMENT_INITIATION_FAILED" });
      }

      const waveUrl = opResult.payment_url || opResult.wave_launch_url || opResult.redirect_url;
      await storage.updateApiTransaction(transaction.id, { externalReference: `${orderId}|${opResult.transaction_id || orderId}` });
      sendTransactionWebhook(transaction, "payment.processing", { fee: payinFee, requiresRedirect: isWave && !!waveUrl, redirectUrl: waveUrl || null, status: "processing" }).catch(() => {});

      sdkLog({ req, endpoint: "initiate-payment", statusCode: 200, responseTimeMs: Date.now() - t0, operator: service.operator, country: payerCountry, reference: transaction.reference });
      return res.json({
        success:          true,
        requiresOtp:      false,
        requiresRedirect: isWave && !!waveUrl,
        redirectUrl:      waveUrl || null,
        reference:        transaction.reference,
        message: isWave && waveUrl
          ? "Redirigez le client vers l'application Wave pour confirmer le paiement"
          : "Le client va recevoir une demande de confirmation sur son téléphone",
      });
    }

    // ── SoleasPay (fallback) ─────────────────────────────────────────────────
    const { soleaspay, formatPhoneForSoleasPay: fmtPhone } = await import("./soleaspay");
    const cleanPhone = fmtPhone(data.payerPhone, payerCountry);

    const spResult = await (soleaspay as any).initiatePayment?.({
      phone: cleanPhone, amount, orderId, serviceId: data.operatorId,
      callbackUrl: `${baseUrl}/api/webhook/soleaspay`,
    });

    if (!spResult?.success) {
      await storage.updateApiTransaction(transaction.id, { status: "failed" });
      sendTransactionWebhook(transaction, "payment.failed", { fee: payinFee, reason: spResult?.message || "Échec initiation SoleasPay", status: "failed" }).catch(() => {});
      sdkLog({ req, endpoint: "initiate-payment", statusCode: 500, responseTimeMs: Date.now() - t0, operator: service.operator, country: payerCountry, error: spResult?.message });
      return res.status(500).json({ success: false, error: spResult?.message || "Échec de l'initiation du paiement", code: "PAYMENT_INITIATION_FAILED" });
    }

    await storage.updateApiTransaction(transaction.id, { externalReference: `${orderId}|${spResult.payId || orderId}` });
    sendTransactionWebhook(transaction, "payment.processing", { fee: payinFee, status: "processing" }).catch(() => {});

    sdkLog({ req, endpoint: "initiate-payment", statusCode: 200, responseTimeMs: Date.now() - t0, operator: service.operator, country: payerCountry, reference: transaction.reference });
    return res.json({
      success:     true,
      requiresOtp: false,
      reference:   transaction.reference,
      message:     "Le client va recevoir une demande de confirmation sur son téléphone",
    });
  } catch (error: any) {
    console.error("[initiate-payment]", error);
    sdkLog({ req, endpoint: "initiate-payment", statusCode: 500, responseTimeMs: Date.now() - t0, error: error.message });
    // Webhook payment.failed sur erreur inattendue (si transaction créée et callback_url configuré)
    try {
      if (req.body?.paymentToken) {
        const failedTxn = await storage.getApiTransactionByToken(req.body.paymentToken).catch(() => null);
        if (failedTxn && failedTxn.status !== "completed") {
          await storage.updateApiTransaction(failedTxn.id, { status: "failed" }).catch(() => {});
          sendTransactionWebhook(failedTxn, "payment.failed", { reason: error.message || "Erreur serveur", status: "failed" }).catch(() => {});
        }
      }
    } catch (_) {}
    res.status(500).json({ success: false, error: error.message || "Erreur serveur", code: "SERVER_ERROR" });
  }
});

// ─── SUBMIT OTP (public, CORS) ────────────────────────────────────────────────
router.options("/v1/submit-otp", sdkCors);
router.post("/v1/submit-otp", sdkCors, async (req: Request, res: Response) => {
  const t0 = Date.now();
  try {
    const schema = z.object({
      otpToken: z.string().startsWith("otp_"),
      otp:      z.string().min(4).max(8),
    });

    const { otpToken, otp } = schema.parse(req.body);

    const entry = otpStore.get(otpToken);
    if (!entry) {
      return res.status(404).json({ success: false, error: "Token OTP invalide ou expiré", code: "INVALID_OTP_TOKEN" });
    }
    if (new Date() > entry.expiresAt) {
      otpStore.delete(otpToken);
      return res.status(410).json({ success: false, error: "Token OTP expiré", code: "OTP_TOKEN_EXPIRED" });
    }

    const transaction = await storage.getApiTransactionByReference(entry.reference);
    if (!transaction || transaction.status !== "pending") {
      otpStore.delete(otpToken);
      return res.status(400).json({ success: false, error: "Transaction introuvable ou déjà traitée", code: "INVALID_TRANSACTION" });
    }

    const service = getServiceById(entry.serviceId);
    if (!service) {
      return res.status(400).json({ success: false, error: "Opérateur invalide", code: "INVALID_OPERATOR" });
    }

    await storage.updateApiTransaction(transaction.id, { status: "processing" });

    const { initiatePayDunySoftPay, formatPhoneForPayDunya } = await import("./paydunya");
    const phone   = formatPhoneForPayDunya(entry.payerPhone, entry.payerCountry);
    const orderId = `API_${entry.reference}_${Date.now()}`;
    const _replitDomain2 = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0].trim()}`
      : process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null;
    const baseUrl = process.env.APP_URL || process.env.SITE_URL || _replitDomain2 || "https://sendavapay.com";

    const pdResult = await initiatePayDunySoftPay({
      operatorName: service.operator,
      countryCode:  service.countryCode,
      phone,
      name:  entry.payerName,
      email: entry.payerEmail || "client@sendavapay.com",
      otp:   otp || undefined,
      invoiceParams: {
        totalAmount:  entry.amount,
        description:  entry.description,
        storeName:    "SendavaPay",
        callbackUrl:  `${baseUrl}/api/webhook/paydunya`,
        returnUrl:    `${baseUrl}/success?reference=${entry.reference}`,
        cancelUrl:    `${baseUrl}/pay/api/${entry.reference}`,
        customData:   { reference: entry.reference, sdk: "1" },
      },
    });

    otpStore.delete(otpToken);

    if (!pdResult.success) {
      await storage.updateApiTransaction(transaction.id, { status: "failed" });
      sendTransactionWebhook(transaction, "payment.failed", {
        reason: pdResult.error || "Code OTP invalide ou paiement refusé",
        status: "failed",
      }).catch(() => {});
      sdkLog({ req, endpoint: "submit-otp", statusCode: 400, responseTimeMs: Date.now() - t0, operator: service.operator, country: entry.payerCountry, error: pdResult.error });
      return res.status(400).json({ success: false, error: pdResult.error || "Code OTP invalide ou paiement refusé", code: "OTP_FAILED" });
    }

    const invoiceToken = (pdResult as any).invoiceToken || orderId;
    await storage.updateApiTransaction(transaction.id, { externalReference: `${orderId}|${invoiceToken}` });

    sdkLog({ req, endpoint: "submit-otp", statusCode: 200, responseTimeMs: Date.now() - t0, operator: service.operator, country: entry.payerCountry, reference: entry.reference });
    res.json({
      success:   true,
      reference: entry.reference,
      message:   "OTP accepté. Le paiement est en cours de traitement.",
    });
  } catch (error: any) {
    sdkLog({ req, endpoint: "submit-otp", statusCode: 400, responseTimeMs: Date.now() - t0, error: error.message });
    res.status(400).json({ success: false, error: error.message || "Erreur OTP", code: "OTP_ERROR" });
  }
});

// ─── RETRY PAYMENT (public, CORS) ────────────────────────────────────────────
router.options("/v1/retry-payment", sdkCors);
router.post("/v1/retry-payment", sdkCors, async (req: Request, res: Response) => {
  try {
    const schema = z.object({ paymentToken: z.string() });
    const { paymentToken } = schema.parse(req.body);

    const transaction = await storage.getApiTransactionByToken(paymentToken);
    if (!transaction) return res.status(404).json({ success: false, error: "Token invalide", code: "INVALID_TOKEN" });
    if (transaction.status !== "failed") return res.status(400).json({ success: false, error: "Seuls les paiements échoués peuvent être relancés", code: "INVALID_STATUS" });
    if (transaction.tokenExpiresAt && new Date() > new Date(transaction.tokenExpiresAt)) {
      return res.status(410).json({ success: false, error: "Ce token de paiement a expiré", code: "TOKEN_EXPIRED" });
    }

    await storage.updateApiTransaction(transaction.id, { status: "pending" });

    res.json({
      success:   true,
      reference: transaction.reference,
      status:    "pending",
      message:   "Transaction réinitialisée. Relancez le paiement via /initiate-payment.",
      nextStep:  "POST /api/sdk/v1/initiate-payment",
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || "Erreur serveur", code: "SERVER_ERROR" });
  }
});

// ─── VERIFY PAYMENT ───────────────────────────────────────────────────────────
router.post("/v1/verify-payment", checkApiMaintenance, authenticateSdkKey, async (req: Request, res: Response) => {
  const sdkUser = (req as any).sdkUser as User;
  try {
    const schema = z.object({ reference: z.string() });
    const { reference } = schema.parse(req.body);

    const transaction = await storage.getApiTransactionByReference(reference);
    if (!transaction) return res.status(404).json({ success: false, error: "Paiement introuvable", code: "NOT_FOUND" });
    if (transaction.userId !== sdkUser.id) return res.status(403).json({ success: false, error: "Non autorisé", code: "UNAUTHORIZED" });

    res.json({
      success: true,
      data: {
        reference:         transaction.reference,
        externalReference: transaction.externalReference,
        status:            transaction.status,
        amount:            transaction.amount,
        fee:               transaction.fee,
        currency:          transaction.currency,
        customerPhone:     transaction.customerPhone,
        customerName:      transaction.customerName,
        paymentMethod:     transaction.paymentMethod,
        createdAt:         transaction.createdAt,
        completedAt:       transaction.completedAt,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || "Erreur serveur" });
  }
});

// ─── PAYMENT STATUS ───────────────────────────────────────────────────────────
router.get("/v1/payment-status/:reference", checkApiMaintenance, authenticateSdkKey, async (req: Request, res: Response) => {
  const sdkUser = (req as any).sdkUser as User;
  try {
    let transaction = await storage.getApiTransactionByReference(req.params.reference);
    if (!transaction) return res.status(404).json({ success: false, error: "Paiement introuvable", code: "NOT_FOUND" });
    if (transaction.userId !== sdkUser.id) return res.status(403).json({ success: false, error: "Non autorisé", code: "UNAUTHORIZED" });

    // ─── Auto-vérification PayDunya pour transactions bloquées en processing ────
    // Si le paiement est toujours en processing et que c'est PayDunya,
    // on interroge directement l'API PayDunya pour connaitre l'état réel.
    if (
      transaction.status === "processing" &&
      (transaction.paymentMethod || "").toLowerCase().includes("paydunya")
    ) {
      try {
        const extRef = (transaction as any).externalReference || (transaction as any).external_reference || "";
        // Format: "API_sdk_xxx_ts|pd_invoice_token"  — le token est après le "|"
        const parts = extRef.split("|");
        const pdToken = parts.length >= 2 ? parts[parts.length - 1] : "";
        // S'assurer que c'est bien un token PayDunya (pas un orderId API_xxx)
        if (pdToken && !pdToken.startsWith("API_") && !pdToken.startsWith("api_")) {
          const { confirmPayDunyaInvoice } = await import("./paydunya");
          const pdStatus = await confirmPayDunyaInvoice(pdToken);
          console.log(`[payment-status] Auto-check PayDunya ref=${transaction.reference} token=${pdToken} → status="${pdStatus.status}"`);

          if (pdStatus.status === "completed" || pdStatus.status === "success") {
            const { completeApiTransactionFromWebhook } = await import("./routes");
            // Adapter en snake_case pour completeApiTransactionFromWebhook
            const rawRow: Record<string, any> = {
              id:               transaction.id,
              user_id:          (transaction as any).userId       ?? (transaction as any).user_id,
              api_key_id:       (transaction as any).apiKeyId     ?? (transaction as any).api_key_id,
              reference:        transaction.reference,
              amount:           transaction.amount,
              fee:              (transaction as any).fee          ?? "0",
              currency:         transaction.currency,
              payment_method:   (transaction as any).paymentMethod  ?? (transaction as any).payment_method,
              payer_country:    (transaction as any).payerCountry  ?? (transaction as any).payer_country ?? null,
              external_reference: extRef,
              callback_url:     (transaction as any).callbackUrl  ?? (transaction as any).callback_url ?? (transaction as any).webhookUrl ?? null,
              customer_name:    (transaction as any).payerName    ?? (transaction as any).customer_name ?? null,
              customer_phone:   (transaction as any).payerPhone   ?? (transaction as any).customer_phone ?? null,
              description:      (transaction as any).description  ?? null,
              status:           transaction.status,
            };
            await completeApiTransactionFromWebhook(rawRow, "paydunya_autocheck");
            // Refetch après complétion
            transaction = await storage.getApiTransactionByReference(req.params.reference) ?? transaction;
          }
        }
      } catch (autoCheckErr: any) {
        console.warn(`[payment-status] Erreur auto-check PayDunya ref=${transaction.reference}:`, autoCheckErr?.message || autoCheckErr);
      }
    }

    res.json({
      success: true,
      data: {
        reference:     transaction.reference,
        status:        transaction.status,
        amount:        transaction.amount,
        currency:      transaction.currency,
        paymentMethod: transaction.paymentMethod,
        createdAt:     transaction.createdAt,
        completedAt:   (transaction as any).completedAt ?? null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Erreur serveur" });
  }
});

// ─── HEALTH CHECK (public) ────────────────────────────────────────────────────
router.get("/v1/health", async (req: Request, res: Response) => {
  const t0 = Date.now();
  try {
    let dbStatus = "ok";
    try { await storage.getCountries(); } catch { dbStatus = "error"; }

    const dbOperators  = await storage.getOperators().catch(() => []);
    const online       = dbOperators.filter(op => !op.inMaintenance && !op.maintenanceApi).length;
    const payoutOnline = dbOperators.filter(op => !op.inMaintenance && !op.maintenanceWithdraw).length;
    const totalOps     = SOLEASPAY_SERVICES.length;
    const maintenance  = await storage.getSetting("api_docs_maintenance").catch(() => null);

    res.json({
      success: true,
      data: {
        api:      maintenance === "true" ? "maintenance" : "operational",
        database: dbStatus,
        operators: {
          total:         totalOps,
          depositOnline: online,
          payoutOnline,
          maintenance:   totalOps - online,
        },
        webhookQueueSize:    webhookRetryQueue.size,
        withdrawalQueueSize: withdrawalQueue.length,
        timestamp:           new Date().toISOString(),
        responseTimeMs:      Date.now() - t0,
      },
    });
  } catch {
    res.status(500).json({ success: false, data: { api: "degraded", database: "error" } });
  }
});

// ─── Helpers retrait ──────────────────────────────────────────────────────────
function isE164Phone(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone.trim());
}

interface WithdrawValidation {
  ok: boolean;
  code?: string;
  error?: string;
  countryInfo?: typeof COUNTRY_CODE_MAP[string];
  wallet?: any;
  fee?: number;
  netAmount?: number;
  totalToDebit?: number;
  operatorStatus?: string;
}

async function validateWithdrawal(
  sdkUser: User,
  data: { amount: number; phoneNumber: string; operator: string; country: string; currency: string }
): Promise<WithdrawValidation> {
  const countryUpper = data.country.toUpperCase();
  const countryInfo  = COUNTRY_CODE_MAP[countryUpper];

  if (!countryInfo) {
    return { ok: false, code: "UNSUPPORTED_COUNTRY", error: `Pays non supporté: ${data.country}. Supportés: ${Object.keys(COUNTRY_CODE_MAP).join(", ")}` };
  }
  if (!isE164Phone(data.phoneNumber)) {
    return { ok: false, code: "INVALID_PHONE_FORMAT", error: "Format téléphone invalide. Utilisez le format E.164 (ex: +22890000000)" };
  }

  const countryServices = getServicesByCountry(countryUpper);
  const compatibleOp = countryServices.find(
    s => s.operator.toLowerCase() === data.operator.toLowerCase() ||
         s.name.toLowerCase().includes(data.operator.toLowerCase())
  );
  if (countryServices.length > 0 && !compatibleOp) {
    const opList = countryServices.map(s => s.operator).join(", ");
    return { ok: false, code: "OPERATOR_COUNTRY_MISMATCH", error: `Opérateur '${data.operator}' non disponible pour ${countryInfo.countryName}. Disponibles: ${opList}` };
  }

  let operatorStatus = "online";
  try {
    const [dbOperators, dbCountries] = await Promise.all([
      storage.getOperators(),
      storage.getCountries(),
    ]);
    if (compatibleOp) {
      const dbOp = resolveConfiguredOperator(compatibleOp, dbOperators, dbCountries);
      if (!dbOp?.paymentGateway) {
        return { ok: false, code: "OPERATOR_NOT_CONFIGURED", error: "Cet opérateur doit être configuré dans l’administration avant les retraits" };
      }
      if (dbOp.isActive === false) {
        return { ok: false, code: "PAYOUT_OPERATOR_OFFLINE", error: "Cet opérateur est désactivé dans l’administration" };
      }
      if (dbOp.inMaintenance || dbOp.maintenanceWithdraw) {
        operatorStatus = "maintenance";
        return { ok: false, code: "PAYOUT_OPERATOR_OFFLINE", error: "Cet opérateur est temporairement indisponible pour les retraits" };
      }
    }
  } catch (_) {}

  if (data.amount < 100)       return { ok: false, code: "AMOUNT_TOO_LOW",  error: "Montant minimum: 100" };
  if (data.amount > 5_000_000) return { ok: false, code: "AMOUNT_TOO_HIGH", error: "Montant maximum par retrait: 5 000 000" };

  const userWallets  = await storage.getUserWallets(sdkUser.id);
  const targetWallet = userWallets.find(w => w.countryCode === countryUpper);
  if (!targetWallet) {
    return { ok: false, code: "WALLET_NOT_FOUND", error: `Wallet ${countryInfo.countryName} introuvable sur votre compte` };
  }

  const walletBalance = parseFloat(targetWallet.balance);

  // Priorité fee payout : customApiSdkFeeRate (utilisateur) → withdrawalRate (global)
  // Les retraits doivent utiliser withdrawalRate, pas encaissementRate (qui est pour les dépôts).
  let sdkFeeRate = 2; // fallback ultime pour les retraits
  if ((sdkUser as any).customApiSdkFeeRate != null) {
    sdkFeeRate = parseFloat((sdkUser as any).customApiSdkFeeRate);
  } else {
    try {
      const commSettings = await storage.getCommissionSettings();
      sdkFeeRate = parseFloat((commSettings as any)?.withdrawalRate || "2");
    } catch (_) {}
  }

  const fee          = parseFloat((data.amount * sdkFeeRate / 100).toFixed(2));
  const netAmount    = data.amount; // Le destinataire reçoit le montant exact demandé
  const totalToDebit = parseFloat((data.amount + fee).toFixed(2)); // Montant + frais débités du wallet marchand

  if (walletBalance < totalToDebit) {
    return { ok: false, code: "INSUFFICIENT_BALANCE", error: `Solde insuffisant. Disponible: ${walletBalance} ${countryInfo.currency}, requis: ${totalToDebit} ${countryInfo.currency} (${data.amount} + ${fee} de frais)` };
  }

  return { ok: true, countryInfo, wallet: targetWallet, fee, netAmount, totalToDebit, operatorStatus };
}

// ─── VALIDATE WITHDRAWAL (dry-run) ────────────────────────────────────────────
router.post("/v1/validate-withdrawal", checkApiMaintenance, authenticateSdkKey, async (req: Request, res: Response) => {
  const sdkUser = (req as any).sdkUser as User;
  try {
    const schema = z.object({
      amount:      z.number().positive(),
      phoneNumber: z.string().min(6),
      operator:    z.string(),
      country:     z.string().min(2).max(3),
      currency:    z.string().default("XOF"),
    });

    const data = schema.parse(req.body);
    const v    = await validateWithdrawal(sdkUser, data);

    if (!v.ok) return res.status(400).json({ success: false, error: v.error, code: v.code });

    const userWallets = await storage.getUserWallets(sdkUser.id);
    const wallet      = userWallets.find(w => w.countryCode === data.country.toUpperCase());

    res.json({
      success: true,
      data: {
        valid:          true,
        amount:         data.amount,
        currency:       v.countryInfo!.currency,
        fee:            v.fee,
        netAmount:      v.netAmount,       // Montant reçu par le destinataire (= amount)
        totalToDebit:   v.totalToDebit,    // Montant total débité du wallet marchand (amount + fee)
        walletBalance:  parseFloat(wallet?.balance || "0"),
        operatorStatus: v.operatorStatus,
        country:        data.country.toUpperCase(),
        countryName:    v.countryInfo?.countryName,
        message:        "Retrait valide. Vous pouvez procéder.",
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || "Erreur de validation" });
  }
});

// ─── WITHDRAWAL STATUS ────────────────────────────────────────────────────────
const WITHDRAWAL_STATUS_LABELS: Record<string, string> = {
  queued:           "En file d'attente",
  pending:          "En attente de traitement",
  processing:       "En cours de traitement opérateur",
  provider_pending: "En attente fournisseur",
  completed:        "Retrait effectué avec succès",
  failed:           "Retrait échoué",
  reversed:         "Fonds retournés au portefeuille",
  cancelled:        "Annulé",
};

router.get("/v1/withdrawal-status/:reference", checkApiMaintenance, authenticateSdkKey, async (req: Request, res: Response) => {
  const sdkUser = (req as any).sdkUser as User;
  try {
    const transaction = await storage.getApiTransactionByReference(req.params.reference);

    if (!transaction || transaction.type !== "payout") {
      return res.status(404).json({ success: false, error: "Retrait introuvable", code: "NOT_FOUND" });
    }
    if (transaction.userId !== sdkUser.id) {
      return res.status(403).json({ success: false, error: "Non autorisé", code: "UNAUTHORIZED" });
    }

    res.json({
      success: true,
      data: {
        reference:         transaction.reference,
        externalReference: transaction.externalReference,
        status:            transaction.status,
        statusLabel:       WITHDRAWAL_STATUS_LABELS[transaction.status] || transaction.status,
        amount:            transaction.amount,
        fee:               transaction.fee,
        netAmount:         transaction.amount, // Le destinataire reçoit le montant complet
        currency:          transaction.currency,
        phoneNumber:       transaction.customerPhone,
        paymentMethod:     transaction.paymentMethod,
        createdAt:         transaction.createdAt,
        completedAt:       transaction.completedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Erreur serveur", code: "SERVER_ERROR" });
  }
});

// ─── PAYOUT STATUS (avec filtre pays optionnel) ────────────────────────────────
router.get("/v1/payout-status", checkApiMaintenance, authenticateSdkKey, async (req: Request, res: Response) => {
  try {
    const countryFilter = (req.query.country as string | undefined)?.toUpperCase();
    const [dbOperators, dbCountries] = await Promise.all([
      storage.getOperators(),
      storage.getCountries(),
    ]);

    let services = SOLEASPAY_SERVICES;
    if (countryFilter) services = services.filter(s => s.countryCode.toUpperCase() === countryFilter);

    const data = services.flatMap(service => {
      const dbOp = resolveConfiguredOperator(service, dbOperators, dbCountries);
      if (!dbOp?.paymentGateway) return [];
      const payoutMaint  = dbOp.isActive === false || dbOp.inMaintenance || dbOp.maintenanceWithdraw || false;
      const depositMaint = dbOp.isActive === false || dbOp.inMaintenance || dbOp.maintenanceDeposit  || false;
      const gateway      = dbOp.paymentGateway;

      return [{
        id:                    String(service.id),
        operator:              service.operator,
        country:               service.countryCode,
        currency:              service.currency,
        gateway,
        payoutStatus:          payoutMaint  ? "offline" : "online",
        depositStatus:         depositMaint ? "offline" : "online",
        maintenanceReason:     payoutMaint  ? ((dbOp as any).maintenanceReason || "Maintenance temporaire") : null,
        estimatedRecoveryTime: null,
      }];
    });

    const online  = data.filter(d => d.payoutStatus === "online").length;
    const offline = data.filter(d => d.payoutStatus === "offline").length;

    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.json({
      success: true,
      data: {
        filter:    countryFilter || "all",
        summary:   { online, offline, total: data.length },
        operators: data,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: "Erreur serveur", code: "SERVER_ERROR" });
  }
});

// ─── WITHDRAWALS LIST ─────────────────────────────────────────────────────────
router.get("/v1/withdrawals", checkApiMaintenance, authenticateSdkKey, async (req: Request, res: Response) => {
  const sdkUser = (req as any).sdkUser as User;
  try {
    const page     = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const limit    = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || "20", 10)));
    const country  = (req.query.country as string | undefined)?.toUpperCase();
    const status   = req.query.status as string | undefined;
    const fromDate = req.query.from as string | undefined;
    const toDate   = req.query.to   as string | undefined;

    let transactions = await storage.getApiTransactionsByUser(sdkUser.id);
    transactions = transactions.filter(t => t.type === "payout");

    if (country) transactions = transactions.filter(t => (t.paymentMethod || "").toUpperCase().includes(country) || t.currency === (COUNTRY_CODE_MAP[country]?.currency || ""));
    if (status)  transactions = transactions.filter(t => t.status === status);
    if (fromDate) { const from = new Date(fromDate); transactions = transactions.filter(t => new Date(t.createdAt) >= from); }
    if (toDate)   { const to = new Date(toDate); to.setHours(23, 59, 59, 999); transactions = transactions.filter(t => new Date(t.createdAt) <= to); }

    const total  = transactions.length;
    const offset = (page - 1) * limit;
    const paged  = transactions.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        withdrawals: paged.map(t => ({
          reference:         t.reference,
          externalReference: t.externalReference,
          status:            t.status,
          statusLabel:       WITHDRAWAL_STATUS_LABELS[t.status] || t.status,
          amount:            t.amount,
          fee:               t.fee,
          netAmount:         t.amount, // Le destinataire reçoit le montant complet
          currency:          t.currency,
          phoneNumber:       t.customerPhone,
          paymentMethod:     t.paymentMethod,
          createdAt:         t.createdAt,
          completedAt:       t.completedAt,
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit), hasMore: offset + paged.length < total },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Erreur serveur" });
  }
});

// ─── WITHDRAW ─────────────────────────────────────────────────────────────────
router.post("/v1/withdraw", checkApiMaintenance, authenticateSdkKey, async (req: Request, res: Response) => {
  const t0 = Date.now();
  const sdkUser = (req as any).sdkUser as User;
  const sdkKey  = (req as any).sdkKey  as ApiKey;

  try {
    const schema = z.object({
      amount:            z.number().positive(),
      phoneNumber:       z.string().min(6),
      operator:          z.string(),
      country:           z.string().min(2).max(3),
      currency:          z.string().default("XOF"),
      description:       z.string().optional(),
      externalReference: z.string().optional(),
    });

    const data         = schema.parse(req.body);
    const countryUpper = data.country.toUpperCase();

    if (data.externalReference) {
      const existing = await storage.getApiTransactionsByUser(sdkUser.id);
      const dup = existing.find(
        t => t.type === "payout" &&
             t.externalReference === data.externalReference &&
             (t.status === "queued" || t.status === "pending" || t.status === "processing" || t.status === "completed")
      );
      if (dup) {
        return res.status(409).json({ success: false, error: "Un retrait avec cette référence existe déjà", code: "DUPLICATE_WITHDRAWAL", data: { reference: dup.reference, status: dup.status } });
      }
    }

    const v = await validateWithdrawal(sdkUser, data);
    if (!v.ok) {
      sdkLog({ req, endpoint: "withdraw", statusCode: 400, responseTimeMs: Date.now() - t0, operator: data.operator, country: countryUpper, error: v.code });
      return res.status(400).json({ success: false, error: v.error, code: v.code });
    }

    const { countryInfo, wallet: targetWallet, fee, netAmount, totalToDebit } = v;
    const reference = generateReference();

    // ── DÉBIT IMMÉDIAT DU WALLET — atomique, AVANT tout appel opérateur ────
    // Un seul UPDATE SQL avec WHERE balance >= totalToDebit garantit qu'aucun
    // double-retrait n'est possible même en cas de requêtes concurrentes.
    console.log(
      `[sdk-withdraw] 💳 TENTATIVE DÉBIT — Marchand: ${sdkUser.email} (id=${sdkUser.id}) | ` +
      `WalletId: ${targetWallet.id} | Pays: ${countryUpper} | Réf: ${reference} | ` +
      `Montant: ${data.amount} | Frais: ${fee!} (taux: ${v.operatorStatus}) | ` +
      `Total à débiter: ${totalToDebit!} | Solde actuel (cache): ${targetWallet.balance}`
    );

    const debitResult = await storage.debitWallet(targetWallet.id, totalToDebit!.toString());

    if (!debitResult) {
      // Le WHERE balance >= totalToDebit n'a pas matché → solde réellement insuffisant en base.
      console.error(
        `[sdk-withdraw] ❌ DÉBIT REFUSÉ (solde insuffisant en base) — ` +
        `Marchand: ${sdkUser.email} | WalletId: ${targetWallet.id} | ` +
        `Réf: ${reference} | Requis: ${totalToDebit!} ${countryInfo!.currency}`
      );
      sdkLog({ req, endpoint: "withdraw", statusCode: 400, responseTimeMs: Date.now() - t0, operator: data.operator, country: countryUpper, error: "INSUFFICIENT_BALANCE" });
      return res.status(400).json({
        success: false,
        error: `Solde insuffisant. Requis: ${totalToDebit!.toFixed(2)} ${countryInfo!.currency} (${data.amount} + ${fee!} frais)`,
        code: "INSUFFICIENT_BALANCE",
      });
    }

    // Soldes réels lus depuis la base de données après débit atomique
    const balanceBefore = debitResult.balanceBefore;
    const balanceAfter  = debitResult.balanceAfter;

    console.log(
      `[sdk-withdraw] ✅ DÉBIT CONFIRMÉ EN BASE — Marchand: ${sdkUser.email} | ` +
      `WalletId: ${targetWallet.id} | Réf: ${reference} | ` +
      `Solde avant débit: ${balanceBefore} ${countryInfo!.currency} | ` +
      `Montant débité: ${data.amount} | Frais: ${fee!} | ` +
      `Total débité: ${totalToDebit!} | Solde après débit: ${balanceAfter} ${countryInfo!.currency} | ` +
      `Opérateur: ${data.operator}/${countryUpper} → ${data.phoneNumber}`
    );

    // ── SYNCHRONISER users.balance ───────────────────────────────────────────
    // CRITIQUE : sans cette mise à jour, l'API /api/wallets détecte un écart
    // entre users.balance (non modifié) et la somme des wallets (débité) et
    // re-crédite automatiquement le wallet via syncWalletsFromTransactions —
    // ce qui annule silencieusement le débit à chaque rafraîchissement.
    try {
      const currentUser = await storage.getUser(sdkUser.id);
      if (currentUser) {
        const currentUserBalance = parseFloat(currentUser.balance || "0");
        const newUserBalance     = Math.max(0, parseFloat((currentUserBalance - totalToDebit!).toFixed(2)));
        await storage.setUserBalance(sdkUser.id, newUserBalance.toString());
        console.log(
          `[sdk-withdraw] 💰 users.balance MIS À JOUR — Marchand: ${sdkUser.email} | ` +
          `Avant: ${currentUserBalance} | Après: ${newUserBalance} | Réf: ${reference}`
        );
      }
    } catch (syncErr) {
      console.error(`[sdk-withdraw] ⚠️ Erreur sync users.balance (non bloquant) — Réf: ${reference}:`, syncErr);
    }

    // ── Créer l'entrée d'audit dans le journal des retraits SDK ─────────────────
    let auditLogId: number | undefined;
    try {
      const currentUserForLog = await storage.getUser(sdkUser.id);
      const userBalBefore = parseFloat(currentUserForLog?.balance || "0") + totalToDebit!;
      const userBalAfter  = parseFloat(currentUserForLog?.balance || "0");
      const auditLog = await storage.createSdkWithdrawalLog({
        reference,
        merchantId:       sdkUser.id,
        merchantEmail:    sdkUser.email,
        walletId:         targetWallet.id,
        walletCountry:    countryUpper,
        balanceBefore:    balanceBefore.toString(),
        amountRequested:  data.amount.toString(),
        feeApplied:       fee!.toString(),
        totalDebited:     totalToDebit!.toString(),
        balanceAfter:     balanceAfter.toString(),
        userBalanceBefore: userBalBefore.toFixed(2),
        userBalanceAfter:  userBalAfter.toFixed(2),
        debitSuccess:     true,
        phoneNumber:      data.phoneNumber,
        operator:         data.operator,
        status:           "pending",
      });
      auditLogId = auditLog.id;
      console.log(`[sdk-withdraw] 📒 Audit log #${auditLogId} créé — Réf: ${reference}`);
    } catch (auditErr) {
      console.error(`[sdk-withdraw] ⚠️ Erreur création audit log (non bloquant) — Réf: ${reference}:`, auditErr);
    }

    // ── Créer la transaction de débit dans l'historique (traçabilité complète) ─
    // Statut "pending" : sera mis à jour "completed" ou "failed" via webhook opérateur.
    const adminTxnRef = reference;
    storage.createTransaction({
      userId:        sdkUser.id,
      type:          "withdrawal",
      amount:        data.amount.toString(),
      fee:           fee!.toString(),
      netAmount:     totalToDebit!.toString(),
      status:        "pending",
      description:   `Retrait SDK vers ${data.phoneNumber} (${data.operator}/${countryUpper})`,
      externalRef:   adminTxnRef,
      paymentMethod: `${data.operator}_${countryUpper}`,
      mobileNumber:  data.phoneNumber,
      payerCountry:  countryUpper,
      adminNote:     `Solde avant débit: ${balanceBefore} ${countryInfo!.currency} | Montant: ${data.amount} | Frais: ${fee!} | Total débité: ${totalToDebit!} | Solde après débit: ${balanceAfter} ${countryInfo!.currency}`,
    }).then(t => {
      console.log(`[sdk-withdraw] 📋 Transaction admin #${t.id} créée (pending) | réf: ${reference} | walletId: ${targetWallet.id}`);
    }).catch(e => {
      console.error(`[sdk-withdraw] ⚠️ Erreur création transaction admin (non bloquant):`, e);
    });

    const withdrawalRequest = await storage.createWithdrawalRequest({
      userId:        sdkUser.id,
      amount:        data.amount.toString(),
      fee:           fee!.toString(),
      netAmount:     netAmount!.toString(),
      paymentMethod: data.operator,
      mobileNumber:  data.phoneNumber,
      country:       countryUpper,
      walletName:    countryInfo!.countryName,
      walletId:      targetWallet.id,
    });

    const sdkTxn = await storage.createApiTransaction({
      userId:            sdkUser.id,
      apiKeyId:          sdkKey.id,
      reference,
      externalReference: data.externalReference || null,
      type:              "payout",
      amount:            data.amount.toString(),
      fee:               fee!.toString(),
      currency:          data.currency,
      description:       data.description || `Retrait SDK vers ${data.phoneNumber} (${data.operator})`,
      customerPhone:     data.phoneNumber,
      paymentMethod:     `${data.operator}_${countryUpper}`,
      callbackUrl:       sdkKey.webhookUrl || null,
      ipAddress:         req.ip || null,
      userAgent:         req.get("User-Agent") || null,
    } as any);

    // Lier withdrawal_request ↔ api_transaction pour la récupération après redémarrage
    await storage.updateWithdrawalRequest(withdrawalRequest.id, {
      transactionReference: reference,
    }).catch(() => {});

    // Enqueue pour traitement asynchrone (et retry)
    const queueEntry: WithdrawalQueueEntry = {
      sdkTransactionRef:   reference,
      withdrawalRequestId: withdrawalRequest.id,
      webhookUrl:          (sdkKey as any).webhookUrl || null,
      webhookSecret:       (sdkKey as any).webhookSecret || null,
      auditLogId,
    };
    withdrawalQueue.push(queueEntry);

    // Déclenchement immédiat vers la passerelle (sans attendre les 60s de la queue)
    setImmediate(() => {
      autoDispatchSdkWithdrawal(queueEntry, withdrawalRequest, sdkTxn).catch(err =>
        console.error("[sdk-withdrawal] Erreur dispatch immédiat:", err)
      );
    });

    // Webhook immédiat : payout.queued
    if ((sdkKey as any).webhookUrl) {
      await sendWebhookWithRetry((sdkKey as any).webhookUrl, {
        event: "payout.queued", reference, status: "queued",
        amount: data.amount,
        fee: fee!,
        netAmount: netAmount!,       // Montant reçu par le destinataire (= amount)
        totalToDebit: totalToDebit!, // Montant total débité du wallet marchand (amount + fee)
        currency: data.currency,
        phoneNumber: data.phoneNumber, operator: data.operator, country: countryUpper,
        createdAt: new Date().toISOString(),
      }, (sdkKey as any).webhookSecret, reference, sdkTxn.id);
    }

    sdkLog({ req, endpoint: "withdraw", statusCode: 201, responseTimeMs: Date.now() - t0, operator: data.operator, country: countryUpper, reference });
    res.status(201).json({
      success: true,
      data: {
        reference,
        externalReference: data.externalReference || null,
        amount:        data.amount,
        fee:           fee!,
        netAmount:     netAmount!,         // Montant reçu par le destinataire (= amount)
        totalToDebit:  totalToDebit!,      // Montant total débité du wallet marchand (amount + fee)
        currency:      data.currency,
        phoneNumber:   data.phoneNumber,
        operator:      data.operator,
        country:       countryUpper,
        countryName:   countryInfo!.countryName,
        status:        "queued",
        statusLabel:   "En file d'attente",
        walletBalance: balanceAfter,
        trackingUrl:   `GET /api/sdk/v1/withdrawal-status/${reference}`,
        message:       "Retrait mis en file d'attente. Utilisez trackingUrl pour suivre l'avancement.",
        createdAt:     new Date().toISOString(),
      },
    });
  } catch (error: any) {
    sdkLog({ req, endpoint: "withdraw", statusCode: 400, responseTimeMs: Date.now() - t0, error: error.message });
    res.status(400).json({ success: false, error: error.message || "Erreur lors du retrait", code: "SERVER_ERROR" });
  }
});

// ─── BALANCE ──────────────────────────────────────────────────────────────────
router.get("/v1/balance", checkApiMaintenance, authenticateSdkKey, async (req: Request, res: Response) => {
  const sdkUser = (req as any).sdkUser as User;
  try {
    const wallets = await storage.getUserWallets(sdkUser.id);
    const country = (req.query.country as string | undefined)?.toUpperCase();

    if (country) {
      const w = wallets.find(w => w.countryCode === country);
      if (!w) return res.status(404).json({ success: false, error: `Wallet ${country} introuvable`, code: "WALLET_NOT_FOUND" });
      return res.json({ success: true, data: { country: w.countryCode, countryName: w.countryName, balance: w.balance, currency: w.currency } });
    }

    res.json({
      success: true,
      data: {
        wallets:      wallets.map(w => ({ country: w.countryCode, countryName: w.countryName, balance: w.balance, currency: w.currency })),
        totalWallets: wallets.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Erreur serveur" });
  }
});

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
router.get("/v1/transactions", checkApiMaintenance, authenticateSdkKey, async (req: Request, res: Response) => {
  const sdkUser = (req as any).sdkUser as User;
  try {
    const page   = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const limit  = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || "50", 10)));
    const type   = req.query.type   as string | undefined;
    const status = req.query.status as string | undefined;

    let transactions = await storage.getApiTransactionsByUser(sdkUser.id);
    if (type)   transactions = transactions.filter(t => t.type   === type);
    if (status) transactions = transactions.filter(t => t.status === status);

    const total  = transactions.length;
    const offset = (page - 1) * limit;
    const paged  = transactions.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        transactions: paged.map(t => ({
          reference:         t.reference,
          externalReference: t.externalReference,
          type:              t.type,
          amount:            t.amount,
          fee:               t.fee,
          currency:          t.currency,
          status:            t.status,
          customerPhone:     t.customerPhone,
          customerName:      t.customerName,
          paymentMethod:     t.paymentMethod,
          createdAt:         t.createdAt,
          completedAt:       t.completedAt,
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit), hasMore: offset + paged.length < total },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Erreur serveur" });
  }
});

// ─── WEBHOOK CONFIGURATION ────────────────────────────────────────────────────
router.put("/v1/webhook", authenticateSdkKey, async (req: Request, res: Response) => {
  const sdkKey = (req as any).sdkKey as ApiKey;
  try {
    const schema = z.object({ webhookUrl: z.string().url() });
    const { webhookUrl } = schema.parse(req.body);

    const webhookSecret = `whsec_${crypto.randomBytes(24).toString("hex")}`;
    await storage.updateApiKey(sdkKey.id, { webhookUrl, webhookSecret });

    res.json({
      success: true,
      data: {
        webhookUrl,
        webhookSecret,
        events: [
          "payment.completed",
          "payment.failed",
          "payment.expired",
          "payout.queued",
          "payout.processing",
          "payout.completed",
          "payout.failed",
          "webhook.test",
        ],
        retryPolicy: "1 min → 5 min → 15 min → 1 heure",
        signature:   "HMAC-SHA256 | header: X-SendavaPay-Signature: t={ts},v1={hex} | payload: `{ts}.{jsonBody}`",
        message:     "Webhook configuré. Conservez le webhookSecret pour vérifier les signatures.",
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || "Erreur de configuration webhook" });
  }
});

// ─── TEST WEBHOOK ─────────────────────────────────────────────────────────────
router.post("/v1/test-webhook", authenticateSdkKey, async (req: Request, res: Response) => {
  const sdkKey = (req as any).sdkKey as ApiKey;
  try {
    const webhookUrl = (sdkKey as any).webhookUrl;
    if (!webhookUrl) {
      return res.status(400).json({ success: false, error: "Aucun webhook URL configuré. Utilisez PUT /api/sdk/v1/webhook d'abord.", code: "WEBHOOK_NOT_CONFIGURED" });
    }

    const parsedUrl = new URL(webhookUrl);
    const hostname  = parsedUrl.hostname.toLowerCase();
    const blocked   = [/^localhost$/i, /^127\./, /^10\./, /^172\.(1[6-9]|2[0-9]|3[01])\./, /^192\.168\./, /^0\.0\.0\.0$/];
    if (blocked.some(p => p.test(hostname)) && process.env.NODE_ENV === "production") {
      return res.status(400).json({ success: false, error: "URL webhook bloquée (IP privée non autorisée en production)", code: "BLOCKED_WEBHOOK_URL" });
    }

    const ts = Math.floor(Date.now() / 1000).toString();
    const testPayload = {
      event:     "webhook.test",
      reference: `test_${crypto.randomBytes(8).toString("hex")}`,
      message:   "Ceci est un test de webhook SendavaPay",
      timestamp: new Date().toISOString(),
    };
    const payloadStr = JSON.stringify(testPayload);
    const headers: Record<string, string> = {
      "Content-Type":           "application/json",
      "X-SendavaPay-Event":     "webhook.test",
      "X-SendavaPay-Timestamp": ts,
      "User-Agent":             "SendavaPay-Webhook/1.0",
    };
    if ((sdkKey as any).webhookSecret) {
      const sig = crypto.createHmac("sha256", (sdkKey as any).webhookSecret).update(`${ts}.${payloadStr}`).digest("hex");
      headers["X-SendavaPay-Signature"] = `t=${ts},v1=${sig}`;
    }

    const startMs = Date.now();
    let responseStatus: number | null = null;
    let responseBody: string | null   = null;
    let delivered = false;

    try {
      const ctrl = new AbortController();
      const tid  = setTimeout(() => ctrl.abort(), 10_000);
      const resp = await fetch(webhookUrl, { method: "POST", headers, body: payloadStr, signal: ctrl.signal });
      clearTimeout(tid);
      responseStatus = resp.status;
      responseBody   = (await resp.text()).substring(0, 500);
      delivered      = resp.ok;
    } catch (err: any) {
      responseBody = err.message || "Connection failed";
    }

    res.json({
      success: true,
      data: {
        webhookUrl,
        delivered,
        responseStatus,
        responseBody,
        responseTimeMs: Date.now() - startMs,
        payload:        testPayload,
        message: delivered
          ? "Webhook livré avec succès. Votre serveur a répondu HTTP 2xx."
          : "Webhook non livré. Vérifiez l'URL et que votre serveur est accessible.",
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Erreur lors du test webhook" });
  }
});

export { sendWebhookWithRetry };
export default router;
