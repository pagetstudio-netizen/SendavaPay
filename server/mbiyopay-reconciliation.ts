import { getCredential } from "./credentials";
import { sendWithdrawalEmail } from "./email";
import { mbiyopay } from "./mbiyopay";
import { storage } from "./storage";
import { notifyWithdrawalAutoProcessed } from "./telegram";

const SUCCESSFUL_STATUSES = new Set(["success", "successful", "completed"]);
const FAILED_STATUSES = new Set(["failed", "cancelled"]);

/**
 * Recover MbiyoPay payouts whose callback was delayed or lost. Every provider
 * status is fetched from MbiyoPay's authenticated merchant API; no withdrawal
 * is completed from a locally assumed status.
 */
export async function reconcileMbiyoPayWithdrawals(): Promise<{ checked: number; finalized: number }> {
  if (!getCredential("MBIYOPAY_API_KEY")) {
    return { checked: 0, finalized: 0 };
  }

  const processingRequests = await storage.getProcessingWithdrawalRequests();
  const candidates = processingRequests.filter((request) =>
    request.externalReference?.startsWith("mbiyopay_") &&
    !request.transactionReference?.startsWith("sdk_"),
  );

  let finalized = 0;

  for (const request of candidates) {
    try {
      // MbiyoPay accepts either its transaction_id or our own order_id here.
      // The latter recovers a payout if submission timed out before returning
      // the provider transaction ID.
      const providerTransaction = await mbiyopay.getTransaction(
        request.transactionReference || request.externalReference!,
      );
      const providerOrderId = String(providerTransaction.order_id || "").trim();
      const providerTransactionId = String(
        providerTransaction.transaction_id || providerTransaction.id || "",
      ).trim();
      if (
        !providerOrderId ||
        providerOrderId !== request.externalReference ||
        !providerTransactionId ||
        (request.transactionReference && providerTransactionId !== request.transactionReference)
      ) {
        console.error(`❌ MbiyoPay reconciliation: références fournisseur incohérentes pour le retrait #${request.id}`);
        continue;
      }
      if (!request.transactionReference) {
        await storage.updateWithdrawalRequest(request.id, { transactionReference: providerTransactionId });
      }

      const providerStatus = String(providerTransaction.status || "").toLowerCase().trim();
      const user = await storage.getUser(request.userId);
      const amount = parseFloat(request.amount);
      const fee = parseFloat(request.fee || "0");
      const netAmount = parseFloat(request.netAmount || (amount - fee).toString());

      if (SUCCESSFUL_STATUSES.has(providerStatus)) {
        const completed = await storage.completeWithdrawalRequest(
          request.id,
          "processing",
          { status: "approved", processedAt: new Date() },
          {
            userId: request.userId,
            type: "withdrawal",
            amount: amount.toString(),
            fee: fee.toString(),
            netAmount: netAmount.toString(),
            status: "completed",
            description: `Retrait automatique ${request.paymentMethod} - ${request.mobileNumber}`,
            mobileNumber: request.mobileNumber,
            paymentMethod: request.paymentMethod,
          },
        );
        if (!completed) continue;

        if (user?.email) {
          sendWithdrawalEmail(user.email, {
            userName: user.fullName,
            amount: netAmount,
            currency: request.currency || "XOF",
            transactionId: request.id.toString(),
            phone: request.mobileNumber || "",
            operator: request.paymentMethod || "MbiyoPay",
          }).catch(() => {});
        }

        notifyWithdrawalAutoProcessed({
          userName: user?.fullName || "Client",
          userId: request.userId,
          amount: amount.toString(),
          netAmount: netAmount.toString(),
          paymentMethod: request.paymentMethod || "MbiyoPay",
          mobileNumber: request.mobileNumber || "",
          payoutUuid: request.externalReference!,
          status: "success",
          gateway: "MbiyoPay",
        });
        finalized += 1;
        console.log(`✅ MbiyoPay reconciliation: retrait #${request.id} confirmé`);
      } else if (FAILED_STATUSES.has(providerStatus)) {
        const restoredToQueue = await storage.transitionWithdrawalRequest(request.id, "processing", {
          status: "pending",
          rejectionReason: `Échec MbiyoPay (${providerStatus}) — en attente validation admin`,
        });
        if (!restoredToQueue) continue;

        notifyWithdrawalAutoProcessed({
          userName: user?.fullName || "Client",
          userId: request.userId,
          amount: amount.toString(),
          netAmount: netAmount.toString(),
          paymentMethod: request.paymentMethod || "MbiyoPay",
          mobileNumber: request.mobileNumber || "",
          payoutUuid: request.externalReference!,
          status: "failed",
          errorDetail: `Transaction MbiyoPay échouée (${providerStatus})`,
          gateway: "MbiyoPay",
        });
        finalized += 1;
        console.log(`❌ MbiyoPay reconciliation: retrait #${request.id} échoué`);
      }
    } catch (error) {
      console.error(`⚠️ MbiyoPay reconciliation: vérification impossible pour retrait #${request.id}`, error);
    }
  }

  return { checked: candidates.length, finalized };
}