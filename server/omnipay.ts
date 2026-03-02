import crypto from "crypto";

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

export const OMNIPAY_OPERATORS: Record<string, string | null> = {
  "MTN": null,
  "MTN Mobile Money": null,
  "MTN CI": null,
  "Moov": null,
  "Moov Money": null,
  "Moov CI": null,
  "Orange": null,
  "Orange Money": null,
  "Orange CI": null,
  "Wave": "wave",
  "Wave CI": "wave",
  "WAVE": "wave",
  "Mixx": "mixx",
  "MIXX": "mixx",
  "Mixx CI": "mixx",
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
  if (lower.includes("mtn") || lower.includes("moov") || lower.includes("orange")) return null;

  return undefined;
}

export function formatPhoneForOmnipay(phone: string, countryCode: string): string {
  const PREFIXES: Record<string, string> = {
    CI: "225",
    BJ: "229",
    TG: "228",
    BF: "226",
    SN: "221",
    CM: "237",
    ML: "223",
    GN: "224",
  };

  let cleaned = phone.replace(/[\s\-\(\)\.]/g, "");

  if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
  else if (cleaned.startsWith("00")) cleaned = cleaned.slice(2);
  else {
    const prefix = PREFIXES[countryCode.toUpperCase()] || "";
    if (prefix && cleaned.startsWith("0")) cleaned = cleaned.slice(1);
    if (prefix && !cleaned.startsWith(prefix)) cleaned = prefix + cleaned;
  }

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
  private apiKey: string;
  private callbackKey: string;

  constructor() {
    this.apiKey = process.env.OMNIPAY_API_KEY || "";
    this.callbackKey = process.env.OMNIPAY_CALLBACK_KEY || "";

    if (!this.apiKey) {
      console.warn("OmniPay: Clé API non configurée (OMNIPAY_API_KEY)");
    }
  }

  async requestPayment(params: OmniPayCollectParams): Promise<OmniPayCollectResponse> {
    try {
      console.log("📡 OmniPay: Initiation paiement Mobile Money...");
      console.log("📡 OmniPay: Ref:", params.reference, "Montant:", params.amount, "MSISDN:", params.msisdn);

      const body: Record<string, string> = {
        action: "paymentrequest",
        apikey: this.apiKey,
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
      console.log("💸 OmniPay: Initiation transfert...");
      console.log("💸 OmniPay: Ref:", params.reference, "Montant:", params.amount, "MSISDN:", params.msisdn);

      const body: Record<string, string> = {
        action: "transfer",
        apikey: this.apiKey,
        msisdn: params.msisdn,
        amount: String(Math.round(params.amount)),
        reference: params.reference,
        first_name: params.firstName,
        last_name: params.lastName,
      };

      if (params.operator) body.operator = params.operator;

      console.log("💸 OmniPay TRANSFER REQUÊTE:", JSON.stringify({ ...body, apikey: "***" }, null, 2));

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

  async getStatus(reference: string): Promise<OmniPayStatusResponse> {
    try {
      console.log("🔍 OmniPay: Vérification statut ref:", reference);

      const body = {
        action: "getstatus",
        apikey: this.apiKey,
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

  getCallbackKey(): string {
    return this.callbackKey;
  }
}

export const omnipay = new OmniPayClient();
