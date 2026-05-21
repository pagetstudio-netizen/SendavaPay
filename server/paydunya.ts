import crypto from "crypto";
import { getCredential } from "./credentials";
import { getSoftPayOperator, getSoftPayOperatorBySlug, type SoftPayPayloadParams } from "./paydunya-softpay-map";

// ─── Base URL ─────────────────────────────────────────────────────────────────
// ALWAYS returns only scheme + host (e.g. "https://app.paydunya.com").
// The /api/v1/ or /api/v2/ path is added per-endpoint below.
// This prevents accidental double-paths when admin enters a full URL.
function getBaseUrl(): string {
  const raw = (getCredential("PAYDUNYA_BASE_URL") || "https://app.paydunya.com").trim();
  try {
    const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
    // Strip any path the admin may have typed (e.g. /api/v1/)
    const base = `${u.protocol}//${u.host}`;
    console.log(`[PayDunya] Base URL resolved: ${base} (raw admin value: "${raw}")`);
    return base;
  } catch {
    console.warn(`[PayDunya] PAYDUNYA_BASE_URL invalide ("${raw}"), fallback → https://app.paydunya.com`);
    return "https://app.paydunya.com";
  }
}

// ─── Headers ─────────────────────────────────────────────────────────────────
function buildHeaders(): Record<string, string> {
  const masterKey  = getCredential("PAYDUNYA_MASTER_KEY")  || "";
  const privateKey = getCredential("PAYDUNYA_PRIVATE_KEY") || "";
  const token      = getCredential("PAYDUNYA_TOKEN")       || "";
  // Support separate PAYDUNYA_PUBLIC_KEY if admin set it, else fall back to token
  const publicKey  = getCredential("PAYDUNYA_PUBLIC_KEY")  || token;

  return {
    "Accept":               "application/json",
    "Content-Type":         "application/json",
    "PAYDUNYA-MASTER-KEY":  masterKey,
    "PAYDUNYA-PRIVATE-KEY": privateKey,
    "PAYDUNYA-PUBLIC-KEY":  publicKey,
    "PAYDUNYA-TOKEN":       token,
  };
}

// Validate that required credentials are present
function checkCredentials(): string | null {
  const masterKey  = getCredential("PAYDUNYA_MASTER_KEY");
  const privateKey = getCredential("PAYDUNYA_PRIVATE_KEY");
  const token      = getCredential("PAYDUNYA_TOKEN");
  if (!masterKey)  return "PAYDUNYA_MASTER_KEY manquant";
  if (!privateKey) return "PAYDUNYA_PRIVATE_KEY manquant";
  if (!token)      return "PAYDUNYA_TOKEN manquant";
  return null;
}

// ─── Safe fetch wrapper ───────────────────────────────────────────────────────
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
  const hdrs    = buildHeaders();

  // Log full URL (without credential values)
  console.log(`[PayDunya] ══════════════════════════════════`);
  console.log(`[PayDunya] → ${method} ${url}`);
  console.log(`[PayDunya]   headers présents: ${Object.keys(hdrs).join(", ")}`);
  console.log(`[PayDunya]   MASTER-KEY présent: ${hdrs["PAYDUNYA-MASTER-KEY"] ? "oui" : "NON ⚠️"}`);
  console.log(`[PayDunya]   PRIVATE-KEY présent: ${hdrs["PAYDUNYA-PRIVATE-KEY"] ? "oui" : "NON ⚠️"}`);
  console.log(`[PayDunya]   TOKEN présent: ${hdrs["PAYDUNYA-TOKEN"] ? "oui" : "NON ⚠️"}`);
  if (payload) console.log(`[PayDunya]   payload: ${payload.slice(0, 800)}`);

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
      const msg = isTimeout
        ? `PayDunya timeout (${timeoutMs}ms) — URL: ${url}`
        : `Erreur réseau PayDunya: ${err.message} — URL: ${url}`;
      console.error(`[PayDunya] ✗ ${msg}`);
      lastResult = { ok: false, status: 0, contentType: "", data: null, rawText: "", error: msg };
      if (isTimeout && attempt <= MAX_RETRIES) continue;
      return lastResult;
    }

    const status      = res.status;
    const contentType = res.headers.get("content-type") || "";
    console.log(`[PayDunya] ← HTTP ${status}  content-type: ${contentType}`);

    let rawText = "";
    try { rawText = await res.text(); } catch { rawText = ""; }

    // Retry on gateway errors
    if (RETRY_STATUSES.has(status) && attempt <= MAX_RETRIES) {
      console.warn(`[PayDunya]   statut ${status}, on réessaie…`);
      lastResult = { ok: false, status, contentType, data: null, rawText, error: `HTTP ${status}` };
      continue;
    }

    // Detect HTML (Nginx 404, Cloudflare page, PayDunya redirect)
    const isHtml = contentType.includes("text/html")
      || rawText.trimStart().startsWith("<!DOCTYPE")
      || rawText.trimStart().startsWith("<html");

    if (isHtml) {
      console.error(`[PayDunya] ✗ Réponse HTML reçue (HTTP ${status})`);
      console.error(`[PayDunya]   URL appelée:   ${url}`);
      console.error(`[PayDunya]   Base URL:       ${getBaseUrl()}`);
      console.error(`[PayDunya]   Causes possibles:`);
      console.error(`[PayDunya]     1) PAYDUNYA_BASE_URL contient un chemin (ex: .../api/v1/)`);
      console.error(`[PayDunya]     2) Slug opérateur invalide`);
      console.error(`[PayDunya]     3) Clés API incorrectes ou expirées`);
      console.error(`[PayDunya]     4) Compte PayDunya suspendu / non activé LIVE`);
      console.error(`[PayDunya]   Début réponse HTML: ${rawText.slice(0, 500)}`);
      return {
        ok: false,
        status,
        contentType,
        data: null,
        rawText,
        error: `PayDunya a retourné une page HTML (HTTP ${status}). URL: ${url} — Vérifiez PAYDUNYA_BASE_URL (doit être uniquement "https://app.paydunya.com", sans /api/v1/).`,
      };
    }

    // Parse JSON
    let data: any = null;
    if (rawText.trim().length > 0) {
      try {
        data = JSON.parse(rawText);
      } catch {
        console.error(`[PayDunya] ✗ Réponse non-JSON (HTTP ${status}) — URL: ${url}`);
        console.error(`[PayDunya]   Réponse brute: ${rawText.slice(0, 400)}`);
        return {
          ok: false, status, contentType, data: null, rawText,
          error: `Réponse inattendue de PayDunya (non-JSON, HTTP ${status}) — URL: ${url}`,
        };
      }
    }

    console.log(`[PayDunya]   body JSON: ${JSON.stringify(data)?.slice(0, 600)}`);
    console.log(`[PayDunya] ══════════════════════════════════`);

    return { ok: res.ok, status, contentType, data, rawText };
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
  "orange money sn":      "orange-money-senegal",
  "orange money senegal": "orange-money-senegal",
  "orange sn":            "orange-money-senegal",
  "free money":           "free-money-senegal",
  "free money sn":        "free-money-senegal",
  "expresso":             "expresso-senegal",
  "expresso sn":          "expresso-senegal",
  "wave sn":              "wave-senegal",
  "wave senegal":         "wave-senegal",
  "wizall":               "wizall-senegal",
  "wizall sn":            "wizall-senegal",
  "djamo sn":             "djamo-sn",
  "orange money ml":      "orange-money-mali",
  "orange money mali":    "orange-money-mali",
  "moov ml":              "moov-mali",
  "moov mali":            "moov-mali",
  "orange money bf":      "orange-money-burkina",
  "orange money burkina": "orange-money-burkina",
  "moov bf":              "moov-burkina-faso",
  "moov burkina":         "moov-burkina-faso",
  "orange money ci":      "orange-money-ci",
  "orange ci":            "orange-money-ci",
  "mtn ci":               "mtn-ci",
  "moov ci":              "moov-ci",
  "wave ci":              "wave-ci",
  "djamo ci":             "djamo-ci",
  "mtn benin":            "mtn-benin",
  "mtn bj":               "mtn-benin",
  "moov benin":           "moov-benin",
  "moov bj":              "moov-benin",
  "t-money":              "t-money-togo",
  "t money":              "t-money-togo",
  "tmoney":               "t-money-togo",
  "moov tg":              "moov-togo",
  "moov togo":            "moov-togo",
  "mtn cameroun":         "mtn-cameroun",
  "mtn cm":               "mtn-cameroun",
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

// ─── Connectivity test (for admin diagnostics) ─────────────────────────────────
export async function testPayDunyaConnectivity(): Promise<{
  ok: boolean;
  baseUrl: string;
  credentialsPresent: { masterKey: boolean; privateKey: boolean; token: boolean };
  httpStatus?: number;
  error?: string;
  hint?: string;
}> {
  const credErr = checkCredentials();
  const baseUrl = getBaseUrl();
  const creds = {
    masterKey:  !!getCredential("PAYDUNYA_MASTER_KEY"),
    privateKey: !!getCredential("PAYDUNYA_PRIVATE_KEY"),
    token:      !!getCredential("PAYDUNYA_TOKEN"),
  };

  if (credErr) {
    return { ok: false, baseUrl, credentialsPresent: creds, error: credErr, hint: "Configurez les clés PayDunya dans le panneau admin." };
  }

  // Do a lightweight GET to confirm the base URL is reachable
  const testUrl = `${baseUrl}/api/v1/checkout-invoice/confirm/test-ping`;
  const result  = await safePayDunyaFetch(testUrl, { method: "GET" }, 10000);

  if (result.status === 404 && result.rawText.includes("{")) {
    // JSON 404 means URL structure is correct, token might be wrong
    return { ok: true, baseUrl, credentialsPresent: creds, httpStatus: 404, hint: "URL correcte. Si paiements échouent, vérifiez les clés API." };
  }
  if (result.error && result.error.includes("HTML")) {
    return {
      ok: false, baseUrl, credentialsPresent: creds, httpStatus: result.status,
      error: result.error,
      hint: `PAYDUNYA_BASE_URL doit être exactement "https://app.paydunya.com" (sans /api/v1/ ni slash final).`,
    };
  }

  return { ok: !result.error, baseUrl, credentialsPresent: creds, httpStatus: result.status, error: result.error };
}

// ─── Checkout invoice (Dépôt) ─────────────────────────────────────────────────
// Official endpoint: POST https://app.paydunya.com/api/v1/checkout-invoice/create
export async function createPayDunyaCheckout(params: PayDunyaCheckoutParams): Promise<PayDunyaCheckoutResponse> {
  const credErr = checkCredentials();
  if (credErr) return { success: false, error: credErr };

  const url  = `${getBaseUrl()}/api/v1/checkout-invoice/create`;
  console.log(`[PayDunya] createPayDunyaCheckout → URL finale: ${url}`);

  const body: Record<string, any> = {
    invoice: {
      total_amount: params.totalAmount,
      description:  params.description,
    },
    store: { name: params.storeName },
    actions: {
      callback_url: params.callbackUrl,
      ...(params.returnUrl ? { return_url: params.returnUrl } : {}),
      ...(params.cancelUrl ? { cancel_url:  params.cancelUrl } : {}),
    },
  };
  if (params.customData) body.custom_data = params.customData;

  const result = await safePayDunyaFetch(url, { method: "POST", body: JSON.stringify(body) }, 20000);
  if (result.error) return { success: false, error: result.error };

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

// ─── Confirm invoice status ────────────────────────────────────────────────────
// Official endpoint: GET https://app.paydunya.com/api/v1/checkout-invoice/confirm/{token}
export async function confirmPayDunyaInvoice(token: string): Promise<{ status: string; amount?: number }> {
  const url    = `${getBaseUrl()}/api/v1/checkout-invoice/confirm/${token}`;
  console.log(`[PayDunya] confirmPayDunyaInvoice → URL finale: ${url}`);
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
// Official endpoint: POST https://app.paydunya.com/api/v1/softpay/{operator-slug}
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
  const url = `${getBaseUrl()}/api/v1/softpay/${slug}`;
  console.log(`[PayDunya] callPayDunySoftPayEndpoint → URL finale: ${url}`);
  console.log(`[PayDunya]   slug: "${slug}"`);

  const result = await safePayDunyaFetch(url, { method: "POST", body: JSON.stringify(payload) }, 30000);
  if (result.error) return { success: false, error: result.error };

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

// ─── Disbursement (Retrait) ────────────────────────────────────────────────────
// Official endpoints:
//   Step 1: POST https://app.paydunya.com/api/v2/disburse/get-invoice
//   Step 2: POST https://app.paydunya.com/api/v2/disburse/submit-invoice
export async function payDunyaDisburse(params: PayDunyaDisburseParams): Promise<PayDunyaDisburseResponse> {
  const credErr = checkCredentials();
  if (credErr) return { success: false, error: credErr };

  const base = getBaseUrl();

  // Step 1 — get-invoice
  const url1 = `${base}/api/v2/disburse/get-invoice`;
  console.log(`[PayDunya] payDunyaDisburse step 1 → URL finale: ${url1}`);
  console.log(`[PayDunya]   mode: ${params.withdrawMode} | montant: ${params.amount} | alias: ${params.accountAlias}`);

  const body1: Record<string, any> = {
    account_alias: params.accountAlias,
    amount:        Math.round(params.amount),
    withdraw_mode: params.withdrawMode,
    callback_url:  params.callbackUrl,
  };

  const res1 = await safePayDunyaFetch(url1, { method: "POST", body: JSON.stringify(body1) }, 25000);
  if (res1.error) return { success: false, error: res1.error };

  const data1 = res1.data;
  if (data1?.response_code !== "00" || !data1?.disburse_token) {
    return {
      success: false,
      error: data1?.response_text || data1?.description || data1?.message || "Erreur get-invoice PayDunya",
    };
  }

  const disburseToken = data1.disburse_token;
  console.log(`[PayDunya] ✓ disburse_token obtenu: ${disburseToken}`);

  // Step 2 — submit-invoice
  const url2 = `${base}/api/v2/disburse/submit-invoice`;
  console.log(`[PayDunya] payDunyaDisburse step 2 → URL finale: ${url2}`);

  const body2: Record<string, any> = { disburse_invoice: disburseToken };
  if (params.disburseId) body2.disburse_id = params.disburseId;

  const res2 = await safePayDunyaFetch(url2, { method: "POST", body: JSON.stringify(body2) }, 25000);
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
    error: data2?.response_text || data2?.description || data2?.message || "Erreur submit-invoice PayDunya",
  };
}
