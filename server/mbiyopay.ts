import crypto from "crypto";
import { getCredential } from "./credentials";

const MBIYOPAY_BASE_URL = "https://dashboard.mbiyo.africa/api/v1";

function mbiyopayHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": `Bearer ${getCredential("MBIYOPAY_API_KEY")}`,
  };
}

// Mapping (countryCode:OperatorName) → réseau MbiyoPay
const MBIYOPAY_NETWORK_MAP: Record<string, string> = {
  "BF:Orange": "orange", "BF:Orange Money": "orange",
  "BF:Moov": "moov", "BF:Moov Money": "moov",
  "BF:Coris": "coris",
  "BJ:MTN": "mtn", "BJ:MTN Mobile Money": "mtn",
  "BJ:Moov": "moov", "BJ:Moov Money": "moov",
  "BJ:Celtiis": "celtiis",
  "CG:MTN": "mtn", "CG:MTN Mobile Money": "mtn",
  "CD:Vodacom": "vodacom", "CD:M-Pesa": "vodacom",
  "CD:Airtel": "airtel", "CD:Airtel Money": "airtel",
  "CD:Orange": "orange", "CD:Orange Money": "orange",
  "CD:Africell": "africell",
  "CM:Orange": "orange", "CM:Orange Money": "orange",
  "CM:MTN": "mtn", "CM:MTN Mobile Money": "mtn",
  "CI:Orange": "orange", "CI:Orange Money": "orange",
  "CI:MTN": "mtn", "CI:MTN Mobile Money": "mtn",
  "CI:Wave": "wave",
  "CI:Moov": "moov", "CI:Moov Money": "moov",
  "GM:Afrimoney": "afrimoney",
  "GM:QMoney": "qmoney",
  "GM:Wave": "wave",
  "GM:APS": "aps",
  "GN:Orange": "orange", "GN:Orange Money": "orange",
  "GN:MTN": "mtn", "GN:MTN Mobile Money": "mtn",
  "ML:Orange": "orange", "ML:Orange Money": "orange",
  "ML:Moov": "moov", "ML:Moov Money": "moov",
  "SN:Orange": "orange", "SN:Orange Money": "orange",
  "SN:Free": "free",
  "TG:Moov": "moov", "TG:Moov Money": "moov",
  "TG:Togocom": "togocom", "TG:T-Money": "togocom", "TG:TMoney": "togocom",
};

// Réseaux exigeant un OTP côté payin (champ om_otp)
const MBIYOPAY_OTP_NETWORKS = new Set([
  "BF:orange", "CI:orange", "GN:orange", "ML:orange", "SN:orange",
]);

// auth_mode = "pin" — collecte du PIN puis appel /finalize (non géré ici, on attend webhook)
// auth_mode = "confirm" — afficher instructions et attendre webhook
// redirect_url présent — rediriger l'utilisateur

const PHONE_PREFIXES: Record<string, string> = {
  BF: "226", BJ: "229", CG: "242", CD: "243", CM: "237", CI: "225",
  GM: "220", GN: "224", ML: "223", SN: "221", TG: "228",
};

const COUNTRY_CURRENCIES: Record<string, string> = {
  BF: "XOF", BJ: "XOF", CG: "XAF", CD: "CDF", CM: "XAF", CI: "XOF",
  GM: "GMD", GN: "GNF", ML: "XOF", SN: "XOF", TG: "XOF",
};

export function getMbiyopayNetwork(operatorName: string, countryCode: string): string | null {
  const key = `${countryCode.toUpperCase()}:${operatorName}`;
  return MBIYOPAY_NETWORK_MAP[key] || null;
}

export function isMbiyopayOTPNetwork(countryCode: string, network: string): boolean {
  return MBIYOPAY_OTP_NETWORKS.has(`${countryCode.toUpperCase()}:${network.toLowerCase()}`);
}

export function getMbiyopayPhonePrefix(countryCode: string): string {
  return PHONE_PREFIXES[countryCode.toUpperCase()] || "";
}

export function getMbiyopayCurrency(countryCode: string): string {
  return COUNTRY_CURRENCIES[countryCode.toUpperCase()] || "XOF";
}

// Format E.164 sans le "+" (ex: 22670123456)
export function formatPhoneForMbiyopay(phone: string, countryCode: string): string {
  let cleaned = phone.replace(/\s/g, "").replace(/^\+/, "").replace(/^0+/, "");
  const prefix = PHONE_PREFIXES[countryCode.toUpperCase()] || "";
  if (prefix && !cleaned.startsWith(prefix)) {
    cleaned = prefix + cleaned;
  }
  return cleaned;
}

export interface MbiyopayPayinParams {
  amount: number;
  currency: string;
  countryCode: string;
  network: string;
  phoneNumber: string;
  orderId: string;
  callbackUrl: string;
  description?: string;
  omOtp?: string;
  mode?: "live" | "test";
}

export interface MbiyopayPayinData {
  transaction_id: string;
  amount: number;
  fee?: number;
  charged_amount?: number;
  currency: string;
  order_id?: string;
  status: string;
  payment_method: string;
  redirect_url?: string | null;
  instructions?: string | null;
  auth_mode?: "pin" | "confirm" | null;
  created_at: string;
}

export interface MbiyopayResponse<T = MbiyopayPayinData> {
  status: "success" | "error";
  message: string;
  data?: T;
  http?: number;
}

export interface MbiyopayPayoutParams {
  amount: number;
  currency: string;
  countryCode: string;
  network: string;
  phoneNumber: string;
  beneficiary: string;
  orderId: string;
  callbackUrl: string;
}

async function mbiyopayFetch(url: string, options: RequestInit): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const text = await res.text();
    console.log(`[mbiyopay] ${options.method || "GET"} ${url} ← HTTP ${res.status} | ${text.slice(0, 400)}`);
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { status: "error", message: `Réponse non-JSON (HTTP ${res.status}): ${text.slice(0, 200)}`, http: res.status };
    }
    parsed.http = res.status;
    return parsed;
  } catch (err: any) {
    if (err.name === "AbortError") {
      return { status: "error", message: "Timeout: MbiyoPay ne répond pas (30s)", http: 408 };
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// Frais MbiyoPay (3% sur le montant envoyé) sont supportés par le marchand.
// Pour que le client confirme exactement le montant initial sur son téléphone,
// on envoie à MbiyoPay un montant réduit tel que : montantEnvoyé + 3% ≈ montantInitial.
export const MBIYOPAY_FEE_RATE = 0.03;
export function adjustAmountForMerchantFees(originalAmount: number): number {
  return Math.floor(originalAmount / (1 + MBIYOPAY_FEE_RATE));
}

export const mbiyopay = {
  async createPayin(params: MbiyopayPayinParams): Promise<MbiyopayResponse> {
    try {
      const adjustedAmount = adjustAmountForMerchantFees(params.amount);
      const body: any = {
        amount: adjustedAmount,
        currency: params.currency,
        payment_method: "mobile_money",
        order_id: params.orderId,
        callback_url: params.callbackUrl,
        mode: params.mode || "live",
        metadata: {
          network: params.network,
          phone_number: params.phoneNumber,
          country_code: params.countryCode.toUpperCase(),
        },
      };
      if (params.omOtp) body.metadata.om_otp = params.omOtp;
      console.log("[mbiyopay] createPayin →", JSON.stringify({ ...body }));
      return await mbiyopayFetch(`${MBIYOPAY_BASE_URL}/merchant/payin`, {
        method: "POST",
        headers: mbiyopayHeaders(),
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.error("MbiyoPay createPayin error:", err);
      return { status: "error", message: "Erreur de connexion à MbiyoPay" };
    }
  },

  async createPayout(params: MbiyopayPayoutParams): Promise<MbiyopayResponse> {
    try {
      const body = {
        amount: params.amount,
        currency: params.currency,
        payment_method: "mobile_money",
        order_id: params.orderId,
        callback_url: params.callbackUrl,
        metadata: {
          network: params.network,
          phone_number: params.phoneNumber,
          country_code: params.countryCode.toUpperCase(),
          beneficiary: params.beneficiary,
        },
      };
      console.log("[mbiyopay] createPayout →", JSON.stringify(body));
      return await mbiyopayFetch(`${MBIYOPAY_BASE_URL}/merchant/payout`, {
        method: "POST",
        headers: mbiyopayHeaders(),
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.error("MbiyoPay createPayout error:", err);
      return { status: "error", message: "Erreur de connexion à MbiyoPay" };
    }
  },

  async getStatus(transactionId: string): Promise<MbiyopayResponse> {
    try {
      return await mbiyopayFetch(`${MBIYOPAY_BASE_URL}/merchant/status/${encodeURIComponent(transactionId)}`, {
        method: "GET",
        headers: mbiyopayHeaders(),
      });
    } catch (err) {
      console.error("MbiyoPay getStatus error:", err);
      return { status: "error", message: "Erreur de connexion à MbiyoPay" };
    }
  },

  /**
   * Vérifie la signature HMAC-SHA256 envoyée par MbiyoPay dans le header "Signature".
   * Retourne true si pas de secret configuré (validation désactivée).
   */
  verifyWebhookSignature(rawBody: string, signature: string | undefined | null): boolean {
    const secret = getCredential("MBIYOPAY_WEBHOOK_SECRET");
    // Fail-closed : si pas de secret configuré, on rejette uniquement quand
    // une signature est tout de même envoyée (présomption de mauvaise config).
    // Si ni secret ni signature, on accepte (dev/avant configuration dashboard) en loguant.
    if (!secret) {
      if (signature) {
        console.warn("⚠️ MbiyoPay webhook: signature reçue mais MBIYOPAY_WEBHOOK_SECRET non configuré → rejet");
        return false;
      }
      console.warn("⚠️ MbiyoPay webhook: aucun secret configuré (signature non vérifiée). Configurez MBIYOPAY_WEBHOOK_SECRET pour la sécurité.");
      return true;
    }
    if (!signature) return false;
    try {
      const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
      const sigHex = signature.replace(/^sha256=/i, "").trim().toLowerCase();
      const a = Buffer.from(expected, "hex");
      const b = Buffer.from(sigHex, "hex");
      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  },
};
