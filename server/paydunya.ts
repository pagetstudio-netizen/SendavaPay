import crypto from "crypto";
import { getCredential } from "./credentials";
import { getSoftPayOperator, getSoftPayOperatorBySlug, type SoftPayPayloadParams } from "./paydunya-softpay-map";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getBaseUrl(): string {
  return getCredential("PAYDUNYA_BASE_URL") || "https://app.paydunya.com";
}

function headers() {
  const token = getCredential("PAYDUNYA_TOKEN");
  return {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "PAYDUNYA-MASTER-KEY": getCredential("PAYDUNYA_MASTER_KEY"),
    "PAYDUNYA-PRIVATE-KEY": getCredential("PAYDUNYA_PRIVATE_KEY"),
    "PAYDUNYA-PUBLIC-KEY": token,
    "PAYDUNYA-TOKEN": token,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PayDunyaCheckoutParams {
  totalAmount: number;
  description: string;
  storeName: string;
  callbackUrl: string;
  returnUrl?: string;
  cancelUrl?: string;
  customData?: Record<string, string | number>;
}

export interface PayDunyaCheckoutResponse {
  success: boolean;
  checkoutUrl?: string;
  token?: string;
  error?: string;
}

export interface PayDunyaDisburseParams {
  accountAlias: string;
  amount: number;
  withdrawMode: string;
  callbackUrl: string;
  disburseId?: string;
}

export interface PayDunyaDisburseResponse {
  success: boolean;
  disburseToken?: string;
  status?: string;
  transactionId?: string;
  error?: string;
}

export interface PayDunyaWebhookPayload {
  data: {
    response_code?: string;
    response_text?: string;
    hash?: string;
    invoice?: {
      token?: string;
      total_amount?: string | number;
      description?: string;
    };
    custom_data?: Record<string, any>;
    actions?: {
      callback_url?: string;
    };
    mode?: string;
    status?: string;
    customer?: {
      name?: string;
      phone?: string;
      email?: string;
    };
    receipt_url?: string;
  };
}

// Mapping operator name / country → PayDunya withdraw_mode
const WITHDRAW_MODE_MAP: Record<string, string> = {
  // Sénégal
  "orange money sn": "orange-money-senegal",
  "orange money senegal": "orange-money-senegal",
  "orange sn": "orange-money-senegal",
  "free money": "free-money-senegal",
  "free money sn": "free-money-senegal",
  "expresso": "expresso-senegal",
  "expresso sn": "expresso-senegal",
  "wave sn": "wave-senegal",
  "wave senegal": "wave-senegal",
  "wizall": "wizall-senegal",
  "wizall sn": "wizall-senegal",
  "djamo sn": "djamo-sn",
  // Mali
  "orange money ml": "orange-money-mali",
  "orange money mali": "orange-money-mali",
  "moov ml": "moov-mali",
  "moov mali": "moov-mali",
  // Burkina
  "orange money bf": "orange-money-burkina",
  "orange money burkina": "orange-money-burkina",
  "moov bf": "moov-burkina-faso",
  "moov burkina": "moov-burkina-faso",
  // Côte d'Ivoire
  "orange money ci": "orange-money-ci",
  "orange ci": "orange-money-ci",
  "mtn ci": "mtn-ci",
  "moov ci": "moov-ci",
  "wave ci": "wave-ci",
  "djamo ci": "djamo-ci",
  // Bénin
  "mtn benin": "mtn-benin",
  "mtn bj": "mtn-benin",
  "moov benin": "moov-benin",
  "moov bj": "moov-benin",
  // Togo
  "t-money": "t-money-togo",
  "t money": "t-money-togo",
  "moov tg": "moov-togo",
  "moov togo": "moov-togo",
  // Cameroun
  "mtn cameroun": "mtn-cameroun",
  "mtn cm": "mtn-cameroun",
};

export function getPayDunyaWithdrawMode(operatorName: string, countryCode: string): string | null {
  const key = `${operatorName} ${countryCode}`.toLowerCase().trim();
  if (WITHDRAW_MODE_MAP[key]) return WITHDRAW_MODE_MAP[key];

  const nameOnly = operatorName.toLowerCase().trim();
  if (WITHDRAW_MODE_MAP[nameOnly]) return WITHDRAW_MODE_MAP[nameOnly];

  // Pattern-based fallback
  const cc = countryCode.toLowerCase();
  if (nameOnly.includes("orange")) {
    if (cc === "sn") return "orange-money-senegal";
    if (cc === "ml") return "orange-money-mali";
    if (cc === "bf") return "orange-money-burkina";
    if (cc === "ci") return "orange-money-ci";
  }
  if (nameOnly.includes("mtn")) {
    if (cc === "bj") return "mtn-benin";
    if (cc === "ci") return "mtn-ci";
    if (cc === "cm") return "mtn-cameroun";
  }
  if (nameOnly.includes("moov")) {
    if (cc === "bj") return "moov-benin";
    if (cc === "ci") return "moov-ci";
    if (cc === "tg") return "moov-togo";
    if (cc === "bf") return "moov-burkina-faso";
    if (cc === "ml") return "moov-mali";
  }
  if (nameOnly.includes("wave")) {
    if (cc === "sn") return "wave-senegal";
    if (cc === "ci") return "wave-ci";
  }
  if (nameOnly.includes("free")) return "free-money-senegal";
  if (nameOnly.includes("expresso")) return "expresso-senegal";
  if (nameOnly.includes("t-money") || nameOnly === "tmoney") return "t-money-togo";
  if (nameOnly.includes("wizall")) return "wizall-senegal";

  return null;
}

export function formatPhoneForPayDunya(phone: string, countryCode: string): string {
  let clean = phone.replace(/\D/g, "");
  const prefixes: Record<string, string> = {
    sn: "221", ml: "223", bf: "226", ci: "225",
    bj: "229", tg: "228", cm: "237",
  };
  const prefix = prefixes[countryCode.toLowerCase()] || "";
  if (prefix && clean.startsWith(prefix)) {
    clean = clean.slice(prefix.length);
  }
  return clean;
}

// ─── Webhook verification ─────────────────────────────────────────────────────

export function verifyPayDunyaWebhook(hash: string): boolean {
  const masterKey = getCredential("PAYDUNYA_MASTER_KEY");
  if (!masterKey || !hash) return false;
  const expected = crypto.createHash("sha512").update(masterKey).digest("hex");
  return expected === hash;
}

// ─── SoftPay Checkout (Dépôt) ─────────────────────────────────────────────────

export async function createPayDunyaCheckout(params: PayDunyaCheckoutParams): Promise<PayDunyaCheckoutResponse> {
  try {
    const body: Record<string, any> = {
      invoice: {
        total_amount: params.totalAmount,
        description: params.description,
      },
      store: {
        name: params.storeName,
      },
      actions: {
        callback_url: params.callbackUrl,
        ...(params.returnUrl ? { return_url: params.returnUrl } : {}),
        ...(params.cancelUrl ? { cancel_url: params.cancelUrl } : {}),
      },
    };
    if (params.customData) {
      body.custom_data = params.customData;
    }

    const res = await fetch(`${getBaseUrl()}/api/v1/checkout-invoice/create`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json();
    console.log("📤 PayDunya checkout response:", JSON.stringify(data));

    if (data.response_code === "00" && data.response_text) {
      return {
        success: true,
        checkoutUrl: data.response_text,
        token: data.token,
      };
    }
    return { success: false, error: data.response_text || data.description || "Erreur PayDunya" };
  } catch (err: any) {
    console.error("PayDunya createCheckout error:", err);
    return { success: false, error: err.message || "Erreur de connexion à PayDunya" };
  }
}

// ─── SoftPay Direct (2-step USSD/redirect) ────────────────────────────────────

export interface SoftPayParams {
  /** Operator name (e.g. "T-Money") and country code (e.g. "TG") OR a known slug */
  operatorName: string;
  countryCode: string;
  phone: string;
  name: string;
  email: string;
  otp?: string;
  /** Forwarded from the invoice-create step */
  paymentToken: string;
}

export interface SoftPayResult {
  success: boolean;
  /** For "direct" operators: confirmation message */
  message?: string;
  /** For Wave/Orange SN: the URL to redirect the user to */
  redirectUrl?: string;
  /** Orange Money SN QR: deep-link for OM app */
  omUrl?: string;
  /** True when OTP is needed but not yet provided */
  requiresOtp?: boolean;
  responseType?: "direct" | "redirect" | "qr";
  rawResponse?: unknown;
  error?: string;
}

/**
 * Step 1 — create a checkout invoice and return its token.
 * (public so it can be called independently from routes)
 */
export async function createPayDunyaInvoice(params: PayDunyaCheckoutParams): Promise<PayDunyaCheckoutResponse> {
  return createPayDunyaCheckout(params);
}

/**
 * Step 2 — call the operator-specific SoftPay endpoint.
 * Expects a payment token obtained from createPayDunyaInvoice().
 */
export async function callPayDunySoftPayEndpoint(
  slug: string,
  payload: Record<string, string>,
): Promise<SoftPayResult> {
  const baseUrl = getBaseUrl();
  const endpoint = `${baseUrl}/api/v1/softpay/${slug}`;
  const hdrs = headers() as Record<string, string>;

  console.log(`📤 PayDunya SoftPay → ${endpoint}`);
  console.log(`📤 Payload: ${JSON.stringify(payload)}`);

  const start = Date.now();
  let statusCode = 0;
  let contentType = "";

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: hdrs,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    statusCode = res.status;
    contentType = res.headers.get("content-type") || "";
    const elapsed = Date.now() - start;

    console.log(`📥 PayDunya SoftPay HTTP ${statusCode} (${elapsed}ms) content-type: ${contentType}`);

    // Detect HTML login page
    if (contentType.includes("text/html")) {
      const html = await res.text();
      console.error(`❌ PayDunya SoftPay returned HTML (HTTP ${statusCode}). Endpoint: ${endpoint}`);
      console.error("   → Possible causes: invalid endpoint slug, expired token, or wrong credentials.");
      console.error("   → First 300 chars:", html.slice(0, 300));
      return {
        success: false,
        error: "PayDunya a retourné une page HTML au lieu de JSON. Vérifiez le slug opérateur et les clés API.",
      };
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      const raw = await res.text();
      console.error(`❌ PayDunya SoftPay: réponse non-JSON: ${raw.slice(0, 300)}`);
      return { success: false, error: "Réponse inattendue de PayDunya (non-JSON)" };
    }

    console.log(`📥 PayDunya SoftPay réponse: ${JSON.stringify(data)}`);

    if (!res.ok) {
      const msg = data?.message || data?.description || data?.error || `HTTP ${statusCode}`;
      return { success: false, error: msg, rawResponse: data };
    }

    if (data?.success === false) {
      return { success: false, error: data?.message || "Echec PayDunya SoftPay", rawResponse: data };
    }

    // Detect response type
    if (data?.url || data?.other_url?.om_url) {
      const op = getSoftPayOperatorBySlug(slug);
      return {
        success: true,
        message: data?.message || "Redirection en cours…",
        redirectUrl: data?.url || data?.other_url?.om_url,
        omUrl: data?.other_url?.om_url,
        responseType: op?.responseType || "redirect",
        rawResponse: data,
      };
    }

    return {
      success: true,
      message: data?.message || "Paiement initié avec succès.",
      responseType: "direct",
      rawResponse: data,
    };
  } catch (err: any) {
    const isTimeout = err?.name === "TimeoutError" || err?.message?.includes("timeout");
    console.error(`❌ PayDunya SoftPay ${isTimeout ? "timeout" : "erreur réseau"}: ${err.message}`);
    return {
      success: false,
      error: isTimeout
        ? "PayDunya ne répond pas (timeout). Réessayez."
        : err.message || "Erreur de connexion à PayDunya",
    };
  }
}

/**
 * Full SoftPay flow: create invoice → submit to operator endpoint.
 * Returns SoftPayResult with redirectUrl (Wave) or success message (USSD operators).
 */
export async function initiatePayDunySoftPay(
  softPayParams: Omit<SoftPayParams, "paymentToken"> & { invoiceParams: PayDunyaCheckoutParams },
): Promise<SoftPayResult & { invoiceToken?: string }> {
  const { operatorName, countryCode, phone, name, email, otp, invoiceParams } = softPayParams;

  // 1 — Resolve operator
  const op = getSoftPayOperator(operatorName, countryCode);
  if (!op) {
    return {
      success: false,
      error: `Opérateur "${operatorName}" (${countryCode}) non supporté par PayDunya SoftPay`,
    };
  }

  if (op.requiresOtp && !otp) {
    return {
      success: false,
      requiresOtp: true,
      error: "Code OTP requis pour cet opérateur",
    };
  }

  // 2 — Create invoice
  const invoiceRes = await createPayDunyaCheckout(invoiceParams);
  if (!invoiceRes.success || !invoiceRes.token) {
    return { success: false, error: invoiceRes.error || "Impossible de créer la facture PayDunya" };
  }

  const token = invoiceRes.token;
  console.log(`✅ PayDunya invoice créée token=${token} pour ${op.slug}`);

  // 3 — Build operator payload
  const payloadParams: SoftPayPayloadParams = { phone, name, email, token, otp };
  const payload = op.buildPayload(payloadParams);

  // 4 — Call SoftPay endpoint
  const result = await callPayDunySoftPayEndpoint(op.slug, payload);
  return { ...result, invoiceToken: token };
}

// ─── Check invoice status ─────────────────────────────────────────────────────

export async function confirmPayDunyaInvoice(token: string): Promise<{ status: string; amount?: number }> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/v1/checkout-invoice/confirm/${token}`, {
      method: "GET",
      headers: headers(),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    return {
      status: data?.status || data?.invoice_data?.invoice?.status || "unknown",
      amount: data?.invoice_data?.invoice?.total_amount ? parseFloat(String(data.invoice_data.invoice.total_amount)) : undefined,
    };
  } catch (err) {
    console.error("PayDunya confirmInvoice error:", err);
    return { status: "unknown" };
  }
}

// ─── PUSH API Disbursement (Retrait) ─────────────────────────────────────────

export async function payDunyaDisburse(params: PayDunyaDisburseParams): Promise<PayDunyaDisburseResponse> {
  try {
    // Step 1 — get-invoice
    const body1: Record<string, any> = {
      account_alias: params.accountAlias,
      amount: Math.round(params.amount),
      withdraw_mode: params.withdrawMode,
      callback_url: params.callbackUrl,
    };

    const res1 = await fetch(`${getBaseUrl()}/api/v2/disburse/get-invoice`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body1),
      signal: AbortSignal.timeout(20000),
    });

    const data1 = await res1.json();
    console.log("📤 PayDunya disburse get-invoice:", JSON.stringify(data1));

    if (data1.response_code !== "00" || !data1.disburse_token) {
      return { success: false, error: data1.response_text || data1.description || "Erreur get-invoice PayDunya" };
    }

    const disburseToken = data1.disburse_token;

    // Step 2 — submit-invoice
    const body2: Record<string, any> = { disburse_invoice: disburseToken };
    if (params.disburseId) body2.disburse_id = params.disburseId;

    const res2 = await fetch(`${getBaseUrl()}/api/v2/disburse/submit-invoice`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body2),
      signal: AbortSignal.timeout(20000),
    });

    const data2 = await res2.json();
    console.log("📤 PayDunya disburse submit-invoice:", JSON.stringify(data2));

    if (data2.response_code === "00") {
      return {
        success: true,
        disburseToken,
        status: data2.status || "pending",
        transactionId: data2.transaction_id || null,
      };
    }

    return { success: false, error: data2.response_text || data2.description || "Erreur submit-invoice PayDunya" };
  } catch (err: any) {
    console.error("PayDunya disburse error:", err);
    return { success: false, error: err.message || "Erreur de connexion à PayDunya" };
  }
}
