import crypto from "crypto";
import { getCredential } from "./credentials";

const OMNIPAY_API_URL = "https://omnipay.webtechci.com/interface/api2";

export interface OmniPayCollectParams {
  msisdn: string;
  amount: number;
  reference: string;
  firstName: string;
  lastName: string;
  operator?: string;
  otp?: string;
  returnUrl?: string;
  callbackUrl?: string;
}

export interface OmniPayCollectResponse {
  success: string | number;
  code?: number;
  message?: string;
  id?: number;
  reference?: string;
  payment_url?: string;
  first_name?: string;
  last_name?: string;
  msisdn?: string;
  amount?: number;
  fees?: number;
  type?: string;
}

export interface OmniPayTransferParams {
  msisdn: string;
  amount: number;
  reference: string;
  firstName: string;
  lastName: string;
  operator?: string;
}

export interface OmniPayTransferResponse {
  success: string | number;
  code?: number;
  message?: string;
  id?: number;
  reference?: string;
  first_name?: string;
  last_name?: string;
  msisdn?: string;
  amount?: number;
  fees?: number;
  currency?: string;
  type?: string;
}

export interface OmniPayStatusResponse {
  success: string | number;
  id?: number;
  status?: number;
  reference?: string;
  message?: string;
  msisdn?: string;
  amount?: number;
  fees?: number;
  type?: string;
  code?: number;
}

export interface OmniPayWebhookPayload {
  action: string;
  id: string;
  type: string;
  reference: string;
  first_name?: string;
  last_name?: string;
  msisdn?: string;
  amount?: string;
  fees?: string;
  currency?: string;
  status?: string;
  message?: string;
  signature?: string;
}

export const OMNIPAY_OPERATORS: Record<string, string> = {
  "MTN": "mtn",
  "MTN Mobile Money": "mtn",
  "MTN CI": "mtn",
  "Moov": "moov",
  "Moov Money": "moov",
  "Moov CI": "moov",
  "Orange": "orange",
  "Orange Money": "orange",
  "Orange CI": "orange",
  "Wave": "wave",
  "Wave CI": "wave",
  "WAVE": "wave",
  "Mixx": "mixx",
  "MIXX": "mixx",
  "Mixx CI": "mixx",
  "T-Money": "tmoney",
  "TMoney": "tmoney",
  "T Money": "tmoney",
  "Airtel": "airtel",
  "Airtel Money": "airtel",
  "Vodacom": "vodacom",
  "Orange Money Sénégal": "orange",
  "Orange Money Senegal": "orange",
};

export function getOmnipayOperator(operatorName: string): string | null | undefined {
  const normalized = operatorName.trim();

  for (const [key, val] of Object.entries(OMNIPAY_OPERATORS)) {
    if (normalized.toLowerCase() === key.toLowerCase()) {
      return val;
    }
  }

  const lower = normalized.toLowerCase();
  if (lower.includes("wave")) return "wave";
  if (lower.includes("mixx")) return "mixx";
  if (lower.includes("tmoney") || lower.includes("t-money")) return "tmoney";
  if (lower.includes("airtel")) return "airtel";
  if (lower.includes("vodacom")) return "vodacom";
  if (lower.includes("mtn")) return "mtn";
  if (lower.includes("moov")) return "moov";
  if (lower.includes("orange")) return "orange";

  return undefined;
}

export function formatPhoneForOmnipay(phone: string, countryCode: string): string {
  const PREFIXES: Record<string, string> = {
    CI:  "225",
    BJ:  "229",
    TG:  "228",
    BF:  "226",
    SN:  "221",
    CM:  "237",
    ML:  "223",
    GN:  "224",
    COG: "242",
    COD: "243",
  };

  // Longueur attendue de la partie locale (sans indicatif pays)
  // CI : 10 chiffres car les numéros locaux commencent par 0 (07XXXXXXXX, 06XXXXXXXX…)
  // Les autres pays ont des numéros locaux sans 0 initial
  const EXPECTED_LOCAL_LENGTH: Record<string, number> = {
    CI:  10, // 07XXXXXXXX / 06XXXXXXXX — 10 chiffres avec 0 initial légitime
    BJ:  10, // Depuis 2024 : 01XXXXXXXX — 10 chiffres avec 0 initial légitime (anciens 8 chiffres → 0197XXXXXX)
    TG:  8,
    BF:  8,
    SN:  9,
    CM:  9,
    ML:  8,
    GN:  9,
    COG: 9,
    COD: 9,
  };

  // 1. Strip whitespace and common separators
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, "");

  // 2. Strip leading + or 00 to get a pure digit string
  if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
  else if (cleaned.startsWith("00")) cleaned = cleaned.slice(2);

  const cc = countryCode.toUpperCase();
  const prefix = PREFIXES[cc] || "";

  if (prefix) {
    // 3. If country prefix already present, strip it so we can normalise cleanly
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.slice(prefix.length);
    }
    // 4. Strip leading trunk 0 UNIQUEMENT si le numéro local est trop long
    //    (ex: 090123456 pour BJ → strip le 0 → 90123456)
    //    IMPORTANT: pour la CI les numéros locaux commencent légitimement par 0
    //    (07XXXXXXXX) donc on ne supprime le 0 que s'il y a un chiffre en trop
    const expectedLocal = EXPECTED_LOCAL_LENGTH[cc];
    if (expectedLocal && cleaned.length > expectedLocal && cleaned.startsWith("0")) {
      cleaned = cleaned.slice(1);
    }
    // 5. Re-add country prefix
    cleaned = prefix + cleaned;
  }

  console.log(`[formatPhoneForOmnipay] ${phone} (${cc}) → ${cleaned}`);
  return cleaned;
}

export function verifyOmnipaySignature(payload: OmniPayWebhookPayload, callbackKey: string): boolean {
  try {
    const { id, type, reference, msisdn, amount, fees, status, message } = payload;
    const toSign = [id, type, reference, msisdn, amount, fees, status, message].join("|");
    const computed = crypto.createHmac("sha3-512", callbackKey).update(toSign).digest("hex");
    return computed === payload.signature;
  } catch (e) {
    console.error("OmniPay signature verification error:", e);
    return false;
  }
}

export class OmniPayClient {
  constructor() {
    if (!getCredential("OMNIPAY_API_KEY")) {
      console.warn("OmniPay: Clé API non configurée (OMNIPAY_API_KEY)");
    }
  }

  async requestPayment(params: OmniPayCollectParams): Promise<OmniPayCollectResponse> {
    try {
      console.log("📡 OmniPay: Initiation paiement Mobile Money...");
      console.log("📡 OmniPay: Ref:", params.reference, "Montant:", params.amount, "MSISDN:", params.msisdn);

      const body: Record<string, string> = {
        action: "paymentrequest",
        apikey: getCredential("OMNIPAY_API_KEY"),
        msisdn: params.msisdn,
        amount: String(Math.round(params.amount)),
        reference: params.reference,
        first_name: params.firstName,
        last_name: params.lastName,
      };

      if (params.operator !== undefined && params.operator !== null) {
        body.operator = params.operator;
      }
      if (params.otp) body.otp = params.otp;
      if (params.returnUrl) body.return_url = params.returnUrl;
      if (params.callbackUrl) body.callback_url = params.callbackUrl;

      console.log("📡 OmniPay REQUÊTE:", JSON.stringify({ ...body, apikey: "***" }, null, 2));

      const response = await fetch(OMNIPAY_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      console.log("📡 OmniPay requestPayment HTTP status:", response.status);
      console.log("📡 OmniPay requestPayment response:", responseText);

      try {
        return JSON.parse(responseText);
      } catch {
        console.error("❌ OmniPay: Réponse JSON invalide (requestPayment)");
        return { success: 0, message: "Réponse invalide de OmniPay" };
      }
    } catch (error) {
      console.error("❌ OmniPay requestPayment error:", error);
      return { success: 0, message: "Erreur de connexion à OmniPay" };
    }
  }

  async transfer(params: OmniPayTransferParams): Promise<OmniPayTransferResponse> {
    try {
      const amountStr = String(Math.round(params.amount));

      console.log("💸 OmniPay TRANSFER — Paramètres envoyés:");
      console.log("   URL     :", OMNIPAY_API_URL);
      console.log("   action  : transfer");
      console.log("   msisdn  :", params.msisdn, `(${params.msisdn.length} chiffres)`);
      console.log("   amount  :", amountStr);
      console.log("   reference:", params.reference);
      console.log("   first_name:", params.firstName);
      console.log("   last_name :", params.lastName);
      console.log("   operator  :", params.operator ?? "(non envoyé — auto-détection)");

      const body: Record<string, string> = {
        action: "transfer",
        apikey: getCredential("OMNIPAY_API_KEY"),
        msisdn: params.msisdn,
        amount: amountStr,
        reference: params.reference,
        first_name: params.firstName,
        last_name: params.lastName,
      };

      if (params.operator) body.operator = params.operator;

      console.log("💸 OmniPay TRANSFER REQUÊTE (masquée):", JSON.stringify({ ...body, apikey: "***" }));

      const response = await fetch(OMNIPAY_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      console.log("💸 OmniPay transfer HTTP status:", response.status);
      console.log("💸 OmniPay transfer response:", responseText);

      try {
        return JSON.parse(responseText);
      } catch {
        console.error("❌ OmniPay: Réponse JSON invalide (transfer)");
        return { success: 0, message: "Réponse invalide de OmniPay" };
      }
    } catch (error) {
      console.error("❌ OmniPay transfer error:", error);
      return { success: 0, message: "Erreur de connexion à OmniPay" };
    }
  }

  async cancelTransfer(reference: string): Promise<{ success: number; message?: string; code?: number }> {
    try {
      console.log(`🚫 OmniPay cancelTransfer: tentative annulation ref=${reference}`);
      const body: Record<string, string> = {
        action: "cancel",
        apikey: getCredential("OMNIPAY_API_KEY"),
        reference,
      };

      const response = await fetch(OMNIPAY_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      console.log(`🚫 OmniPay cancelTransfer HTTP ${response.status}: ${responseText}`);

      try {
        return JSON.parse(responseText);
      } catch {
        return { success: 0, message: "Réponse invalide" };
      }
    } catch (error) {
      console.error("❌ OmniPay cancelTransfer error:", error);
      return { success: 0, message: "Erreur de connexion" };
    }
  }

  async getStatus(reference: string): Promise<OmniPayStatusResponse> {
    try {
      console.log("🔍 OmniPay: Vérification statut ref:", reference);

      const body = {
        action: "getstatus",
        apikey: getCredential("OMNIPAY_API_KEY"),
        reference,
      };

      const response = await fetch(OMNIPAY_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      console.log("🔍 OmniPay getStatus HTTP status:", response.status);
      console.log("🔍 OmniPay getStatus response:", responseText);

      try {
        return JSON.parse(responseText);
      } catch {
        console.error("❌ OmniPay: Réponse JSON invalide (getStatus)");
        return { success: 0, message: "Réponse invalide de OmniPay" };
      }
    } catch (error) {
      console.error("❌ OmniPay getStatus error:", error);
      return { success: 0, message: "Erreur de connexion à OmniPay" };
    }
  }

  async getWalletBalance(currency?: string, countryCode?: string): Promise<{ success: number; balance?: number; pending?: number; currency?: string; message?: string }> {
    // Mapping ISO 3166-1 alpha-2 → alpha-3 (codes retournés par OmniPay)
    const ALPHA2_TO_ALPHA3: Record<string, string> = {
      CI: "CIV", BJ: "BEN", TG: "TGO", BF: "BFA",
      SN: "SEN", CM: "CMR", ML: "MLI", GN: "GIN",
      COG: "COG", COD: "COD",
    };
    const targetAlpha3 = countryCode ? ALPHA2_TO_ALPHA3[countryCode.toUpperCase()] : undefined;

    try {
      const body: Record<string, string> = {
        action: "getbalance",
        apikey: getCredential("OMNIPAY_API_KEY"),
      };

      const logLabel = countryCode ? `${currency ?? ""} (${countryCode})` : (currency ?? "");
      console.log(`💼 OmniPay: Vérification solde wallet${logLabel ? " " + logLabel : ""}...`);

      const response = await fetch(OMNIPAY_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      console.log("💼 OmniPay getWalletBalance response:", responseText);

      try {
        const parsed = JSON.parse(responseText);

        // OmniPay returns balance as an array of country objects:
        // { success:1, balance: [{countryCode, amount, pending, currency}] }
        if (parsed.success === 1 && Array.isArray(parsed.balance)) {
          if (currency) {
            // Préférence : trouver l'entrée correspondant au pays exact (alpha-3)
            // Sinon : prendre le premier wallet avec la devise demandée
            let entry: any;
            if (targetAlpha3) {
              entry = parsed.balance.find((b: any) =>
                b.currency === currency && b.countryCode?.toUpperCase() === targetAlpha3
              );
            }
            if (!entry) {
              entry = parsed.balance.find((b: any) => b.currency === currency);
            }
            if (entry) {
              console.log(`💼 OmniPay wallet ${currency}${targetAlpha3 ? " (" + targetAlpha3 + ")" : ""}: disponible=${entry.amount} en_attente=${entry.pending}`);
              return { success: 1, balance: entry.amount, pending: entry.pending, currency };
            }
            return { success: 0, message: `Devise ${currency} non trouvée dans le wallet` };
          }
          // No currency specified — return first entry
          const first = parsed.balance[0];
          return { success: 1, balance: first?.amount, currency: first?.currency };
        }

        // Fallback: scalar balance field (older format)
        if (parsed.success === 1 && typeof parsed.balance === "number") {
          return { success: 1, balance: parsed.balance, currency };
        }

        return { success: 0, message: parsed.message || "Format de réponse inattendu" };
      } catch {
        return { success: 0, message: "Réponse invalide" };
      }
    } catch (error) {
      console.error("❌ OmniPay getWalletBalance error:", error);
      return { success: 0, message: "Erreur connexion" };
    }
  }

  getCallbackKey(): string {
    return getCredential("OMNIPAY_CALLBACK_KEY");
  }
}

export const omnipay = new OmniPayClient();
