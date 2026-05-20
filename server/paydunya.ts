import crypto from "crypto";
import { getCredential } from "./credentials";
import { getSoftPayOperator, getSoftPayOperatorBySlug, type SoftPayPayloadParams } from "./paydunya-softpay-map";

// ─── Base URL ─────────────────────────────────────────────────────────────────

function getBaseUrl(): string {
  return (getCredential("PAYDUNYA_BASE_URL") || "https://app.paydunya.com").replace(/\/$/, "");
}

// ─── Headers ─────────────────────────────────────────────────────────────────

function buildHeaders(): Record<string, string> {
  const masterKey  = getCredential("PAYDUNYA_MASTER_KEY")  || "";
  const privateKey = getCredential("PAYDUNYA_PRIVATE_KEY") || "";
  const token      = getCredential("PAYDUNYA_TOKEN")        || "";
  return {
    "Accept":               "application/json",
    "Content-Type":         "application/json",
    "PAYDUNYA-MASTER-KEY":  masterKey,
    "PAYDUNYA-PRIVATE-KEY": privateKey,
    "PAYDUNYA-PUBLIC-KEY":  token,
    "PAYDUNYA-TOKEN":       token,
  };
}

// ─── Safe fetch wrapper ───────────────────────────────────────────────────────
// Never crashes, never calls .json() on HTML, always logs.

interface SafeFetchResult {
  ok: boolean;
  status: number;
  contentType: string;
  data: any;
  rawText: string;
  error?: string;
}

const RETRY_STATUSES = new Set([502, 503, 504]);
const MAX_RETRIES    = 2;
const RETRY_DELAY_MS = 1500;

async function safePayDunyaFetch(
  url: string,
  options: RequestInit,
  timeoutMs = 30000,
): Promise<SafeFetchResult> {
  const method  = (options.method || "GET").toUpperCase();
  const payload = options.body ? String(options.body) : undefined;

  // Log only key names (never values) for security
  const hdrs = buildHeaders();
  const headerKeys = Object.keys(hdrs).join(", ");
  console.log(`[PayDunya] → ${method} ${url}`);
  console.log(`[PayDunya]   headers: ${headerKeys}`);
  if (payload) console.log(`[PayDunya]   payload: ${payload.slice(0, 500)}`);

  let lastResult: SafeFetchResult = {
    ok: false, status: 0, contentType: "", data: null, rawText: "",
    error: "Requête non effectuée",
  };

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    if (attempt > 1) {
      console.log(`[PayDunya]   retry ${attempt - 1}/${MAX_RETRIES} après ${RETRY_DELAY_MS}ms…`);
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    }

    let res: Response;
    try {
      res = await fetch(url, {
        ...options,
        headers: hdrs,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err: any) {
      const isTimeout = err?.name === "TimeoutError" || err?.message?.includes("timeout") || err?.message?.includes("abort");
      const msg = isTimeout ? `PayDunya timeout (${timeoutMs}ms)` : `Erreur réseau PayDunya: ${err.message}`;
      console.error(`[PayDunya] ✗ ${msg}`);
      lastResult = { ok: false, status: 0, contentType: "", data: null, rawText: "", error: msg };
      // Only retry on timeout
      if (isTimeout && attempt <= MAX_RETRIES) continue;
      return lastResult;
    }

    const status      = res.status;
    const contentType = res.headers.get("content-type") || "";
    console.log(`[PayDunya] ← HTTP ${status}  content-type: ${contentType}`);

    // Read raw body once
    let rawText = "";
    try {
      rawText = await res.text();
    } catch {
      rawText = "";
    }

    // Retry on gateway errors
    if (RETRY_STATUSES.has(status) && attempt <= MAX_RETRIES) {
      console.warn(`[PayDunya]   statut ${status}, on réessaie…`);
      lastResult = { ok: false, status, contentType, data: null, rawText, error: `HTTP ${status}` };
      continue;
    }

    // Detect HTML (login page / nginx error / Cloudflare)
    const isHtml = contentType.includes("text/html") || rawText.trimStart().startsWith("<!DOCTYPE") || rawText.trimStart().startsWith("<html");
    if (isHtml) {
      console.error(`[PayDunya] ✗ Réponse HTML reçue (HTTP ${status}). URL: ${url}`);
      console.error(`[PayDunya]   Causes possibles: slug invalide, clés API incorrectes, URL erronée, token expiré.`);
      console.error(`[PayDunya]   Début réponse: ${rawText.slice(0, 400)}`);
      return {
        ok: false,
        status,
        contentType,
        data: null,
        rawText,
        error: `PayDunya a retourné une page HTML (HTTP ${status}). Vérifiez les clés API et l'URL de base.`,
      };
    }

    // Parse JSON
    let data: any = null;
    if (rawText.trim().length > 0) {
      try {
        data = JSON.parse(rawText);
      } catch {
        console.error(`[PayDunya] ✗ Réponse non-JSON (HTTP ${status}): ${rawText.slice(0, 300)}`);
        return {
          ok: false,
          status,
          contentType,
          data: null,
          rawText,
          error: `Réponse inattendue de PayDunya (non-JSON, HTTP ${status})`,
        };
      }
    }

    console.log(`[PayDunya]   body: ${JSON.stringify(data)?.slice(0, 500)}`);

    return {
      ok: res.ok,
      status,
      contentType,
      data,
      rawText,
    };
  }

  return lastResult;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PayDunyaCheckoutParams {
  totalAmount:  number;
  description:  string;
  storeName:    string;
  callbackUrl:  string;
  returnUrl?:   string;
  cancelUrl?:   string;
  customData?:  Record<string, string | number>;
}

export interface PayDunyaCheckoutResponse {
  success:      boolean;
  checkoutUrl?: string;
  token?:       string;
  error?:       string;
}

export interface PayDunyaDisburseParams {
  accountAlias: string;
  amount:       number;
  withdrawMode: string;
  callbackUrl:  string;
  disburseId?:  string;
}

export interface PayDunyaDisburseResponse {
  success:        boolean;
  disburseToken?: string;
  status?:        string;
  transactionId?: string;
  error?:         string;
}

export interface PayDunyaWebhookPayload {
  data: {
    response_code?: string;
    response_text?: string;
    hash?:          string;
    invoice?: {
      token?:        string;
      total_amount?: string | number;
      description?:  string;
    };
    custom_data?: Record<string, any>;
    actions?:     { callback_url?: string };
    mode?:        string;
    status?:      string;
    customer?:    { name?: string; phone?: string; email?: string };
    receipt_url?: string;
  };
}

// ─── Withdraw mode map ────────────────────────────────────────────────────────

const WITHDRAW_MODE_MAP: Record<string, string> = {
  "orange money sn":       "orange-money-senegal",
  "orange money senegal":  "orange-money-senegal",
  "orange sn":             "orange-money-senegal",
  "free money":            "free-money-senegal",
  "free money sn":         "free-money-senegal",
  "expresso":              "expresso-senegal",
  "expresso sn":           "expresso-senegal",
  "wave sn":               "wave-senegal",
  "wave senegal":          "wave-senegal",
  "wizall":                "wizall-senegal",
  "wizall sn":             "wizall-senegal",
  "djamo sn":              "djamo-sn",
  "orange money ml":       "orange-money-mali",
  "orange money mali":     "orange-money-mali",
  "moov ml":               "moov-mali",
  "moov mali":             "moov-mali",
  "orange money bf":       "orange-money-burkina",
  "orange money burkina":  "orange-money-burkina",
  "moov bf":               "moov-burkina-faso",
  "moov burkina":          "moov-burkina-faso",
  "orange money ci":       "orange-money-ci",
  "orange ci":             "orange-money-ci",
  "mtn ci":                "mtn-ci",
  "moov ci":               "moov-ci",
  "wave ci":               "wave-ci",
  "djamo ci":              "djamo-ci",
  "mtn benin":             "mtn-benin",
  "mtn bj":                "mtn-benin",
  "moov benin":            "moov-benin",
  "moov bj":               "moov-benin",
  "t-money":               "t-money-togo",
  "t money":               "t-money-togo",
  "moov tg":               "moov-togo",
  "moov togo":             "moov-togo",
  "mtn cameroun":          "mtn-cameroun",
  "mtn cm":                "mtn-cameroun",
};

export function getPayDunyaWithdrawMode(operatorName: string, countryCode: string): string | null {
  const key      = `${operatorName} ${countryCode}`.toLowerCase().trim();
  if (WITHDRAW_MODE_MAP[key]) return WITHDRAW_MODE_MAP[key];
  const nameOnly = operatorName.toLowerCase().trim();
  if (WITHDRAW_MODE_MAP[nameOnly]) return WITHDRAW_MODE_MAP[nameOnly];
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
  if (nameOnly.includes("free"))     return "free-money-senegal";
  if (nameOnly.includes("expresso")) return "expresso-senegal";
  if (nameOnly.includes("t-money") || nameOnly === "tmoney") return "t-money-togo";
  if (nameOnly.includes("wizall"))   return "wizall-senegal";
  return null;
}

export function formatPhoneForPayDunya(phone: string, countryCode: string): string {
  let clean = phone.replace(/\D/g, "");
  const prefixes: Record<string, string> = {
    sn: "221", ml: "223", bf: "226", ci: "225",
    bj: "229", tg: "228", cm: "237",
  };
  const prefix = prefixes[countryCode.toLowerCase()] || "";
  if (prefix && clean.startsWith(prefix)) clean = clean.slice(prefix.length);
  return clean;
}

// ─── Webhook verification ─────────────────────────────────────────────────────

export function verifyPayDunyaWebhook(hash: string): boolean {
  const masterKey = getCredential("PAYDUNYA_MASTER_KEY");
  if (!masterKey || !hash) return false;
  const expected = crypto.createHash("sha512").update(masterKey).digest("hex");
  return expected === hash;
}

// ─── Checkout invoice (Dépôt) ─────────────────────────────────────────────────

export async function createPayDunyaCheckout(params: PayDunyaCheckoutParams): Promise<PayDunyaCheckoutResponse> {
  const url  = `${getBaseUrl()}/api/v1/checkout-invoice/create`;
  const body: Record<string, any> = {
    invoice: {
      total_amount: params.totalAmount,
      description:  params.description,
    },
    store: { name: params.storeName },
    actions: {
      callback_url: params.callbackUrl,
      ...(params.returnUrl  ? { return_url:  params.returnUrl  } : {}),
      ...(params.cancelUrl  ? { cancel_url:  params.cancelUrl  } : {}),
    },
  };
  if (params.customData) body.custom_data = params.customData;

  const result = await safePayDunyaFetch(url, { method: "POST", body: JSON.stringify(body) }, 20000);

  if (result.error) {
    return { success: false, error: result.error };
  }

  const data = result.data;
  if (data?.response_code === "00" && data?.response_text) {
    return { success: true, checkoutUrl: data.response_text, token: data.token };
  }
  return {
    success: false,
    error: data?.response_text || data?.description || data?.message || `Erreur PayDunya (HTTP ${result.status})`,
  };
}

export async function createPayDunyaInvoice(params: PayDunyaCheckoutParams): Promise<PayDunyaCheckoutResponse> {
  return createPayDunyaCheckout(params);
}

// ─── Confirm invoice status ───────────────────────────────────────────────────

export async function confirmPayDunyaInvoice(token: string): Promise<{ status: string; amount?: number }> {
  const url    = `${getBaseUrl()}/api/v1/checkout-invoice/confirm/${token}`;
  const result = await safePayDunyaFetch(url, { method: "GET" }, 15000);

  if (result.error || !result.data) return { status: "unknown" };

  const data = result.data;
  return {
    status: data?.status || data?.invoice_data?.invoice?.status || "unknown",
    amount: data?.invoice_data?.invoice?.total_amount
      ? parseFloat(String(data.invoice_data.invoice.total_amount))
      : undefined,
  };
}

// ─── SoftPay direct endpoint ──────────────────────────────────────────────────

export interface SoftPayParams {
  operatorName: string;
  countryCode:  string;
  phone:        string;
  name:         string;
  email:        string;
  otp?:         string;
  paymentToken: string;
}

export interface SoftPayResult {
  success:       boolean;
  message?:      string;
  redirectUrl?:  string;
  omUrl?:        string;
  requiresOtp?:  boolean;
  responseType?: "direct" | "redirect" | "qr";
  rawResponse?:  unknown;
  error?:        string;
}

export async function callPayDunySoftPayEndpoint(
  slug:    string,
  payload: Record<string, string>,
): Promise<SoftPayResult> {
  const url    = `${getBaseUrl()}/api/v1/softpay/${slug}`;
  const result = await safePayDunyaFetch(url, { method: "POST", body: JSON.stringify(payload) }, 30000);

  if (result.error) {
    return { success: false, error: result.error };
  }

  const data = result.data;

  if (!result.ok) {
    const msg = data?.message || data?.description || data?.error || `HTTP ${result.status}`;
    return { success: false, error: msg, rawResponse: data };
  }

  if (data?.success === false) {
    return { success: false, error: data?.message || "Échec PayDunya SoftPay", rawResponse: data };
  }

  if (data?.url || data?.other_url?.om_url) {
    const op = getSoftPayOperatorBySlug(slug);
    return {
      success:      true,
      message:      data?.message || "Redirection en cours…",
      redirectUrl:  data?.url || data?.other_url?.om_url,
      omUrl:        data?.other_url?.om_url,
      responseType: op?.responseType || "redirect",
      rawResponse:  data,
    };
  }

  return {
    success:      true,
    message:      data?.message || "Paiement initié avec succès.",
    responseType: "direct",
    rawResponse:  data,
  };
}

// ─── Full SoftPay flow ────────────────────────────────────────────────────────

export async function initiatePayDunySoftPay(
  softPayParams: Omit<SoftPayParams, "paymentToken"> & { invoiceParams: PayDunyaCheckoutParams },
): Promise<SoftPayResult & { invoiceToken?: string }> {
  const { operatorName, countryCode, phone, name, email, otp, invoiceParams } = softPayParams;

  const op = getSoftPayOperator(operatorName, countryCode);
  if (!op) {
    return {
      success: false,
      error:   `Opérateur "${operatorName}" (${countryCode}) non supporté par PayDunya SoftPay`,
    };
  }

  if (op.requiresOtp && !otp) {
    return { success: false, requiresOtp: true, error: "Code OTP requis pour cet opérateur" };
  }

  const invoiceRes = await createPayDunyaCheckout(invoiceParams);
  if (!invoiceRes.success || !invoiceRes.token) {
    return { success: false, error: invoiceRes.error || "Impossible de créer la facture PayDunya" };
  }

  const token = invoiceRes.token;
  console.log(`[PayDunya] ✓ Invoice créée token=${token} opérateur=${op.slug}`);

  const payloadParams: SoftPayPayloadParams = { phone, name, email, token, otp };
  const payload = op.buildPayload(payloadParams);

  const result = await callPayDunySoftPayEndpoint(op.slug, payload);
  return { ...result, invoiceToken: token };
}

// ─── Disbursement (Retrait) ───────────────────────────────────────────────────

export async function payDunyaDisburse(params: PayDunyaDisburseParams): Promise<PayDunyaDisburseResponse> {
  // Step 1 — get-invoice
  const body1: Record<string, any> = {
    account_alias: params.accountAlias,
    amount:        Math.round(params.amount),
    withdraw_mode: params.withdrawMode,
    callback_url:  params.callbackUrl,
  };

  const res1 = await safePayDunyaFetch(
    `${getBaseUrl()}/api/v2/disburse/get-invoice`,
    { method: "POST", body: JSON.stringify(body1) },
    25000,
  );

  if (res1.error) return { success: false, error: res1.error };

  const data1 = res1.data;
  if (data1?.response_code !== "00" || !data1?.disburse_token) {
    return {
      success: false,
      error:   data1?.response_text || data1?.description || data1?.message || "Erreur get-invoice PayDunya",
    };
  }

  const disburseToken = data1.disburse_token;

  // Step 2 — submit-invoice
  const body2: Record<string, any> = { disburse_invoice: disburseToken };
  if (params.disburseId) body2.disburse_id = params.disburseId;

  const res2 = await safePayDunyaFetch(
    `${getBaseUrl()}/api/v2/disburse/submit-invoice`,
    { method: "POST", body: JSON.stringify(body2) },
    25000,
  );

  if (res2.error) return { success: false, error: res2.error };

  const data2 = res2.data;
  if (data2?.response_code === "00") {
    return {
      success:       true,
      disburseToken,
      status:        data2.status || "pending",
      transactionId: data2.transaction_id || undefined,
    };
  }

  return {
    success: false,
    error:   data2?.response_text || data2?.description || data2?.message || "Erreur submit-invoice PayDunya",
  };
}
