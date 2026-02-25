import crypto from "crypto";

const WINIPAYER_API_URL = "https://api-v2.winipayer.com";

export interface WiniPayerCreateParams {
  amount: number;
  description: string;
  cancelUrl: string;
  returnUrl: string;
  callbackUrl: string;
  env?: "test" | "prod";
  customData?: Record<string, any>;
  clientPayFee?: boolean;
  items?: Array<{
    name: string;
    quantity: number;
    price_unit: number;
    description?: string;
    price_total: number;
  }>;
  channel?: string[];
  reference?: {
    identifier?: string;
    name?: string;
    phone?: string;
    email?: string;
  };
}

export interface WiniPayerCreateResponse {
  success: boolean;
  results?: {
    uuid: string;
    crypto: string;
    env: string;
    amount: number;
    currency: string;
    operator: string | null;
    operator_process: string | null;
    operator_message: string | null;
    checkout_process: string;
    expired_at: string;
  };
  errors: any;
  messages: any[];
}

export interface WiniPayerVerifyResponse {
  success: boolean;
  results?: {
    invoice?: {
      uuid: string;
      crypto: string;
      hash: string;
      env: string;
      state: string;
      state_date: string;
      amount_init: number;
      amount: number;
      client_pay_fee: boolean;
      commission_amount: number;
      commission_rate: number;
      amount_available: number;
      currency: string;
      description: string;
      operator: string;
      operator_ref: string;
      customer_pay: {
        name: string;
        phone: string;
        email: string | null;
      };
      custom_data: Record<string, any> | null;
      cancel_url: string;
      return_url: string;
      callback_url: string;
      checkout_link: string;
      created_at: string;
      expired_at: string;
    };
  };
  errors: any;
  messages: any[];
}

export class WiniPayerClient {
  private merchantApply: string;
  private merchantToken: string;
  private privateKey: string;
  private env: "test" | "prod";

  constructor() {
    this.merchantApply = process.env.WINIPAYER_MERCHANT_APPLY || "";
    this.merchantToken = process.env.WINIPAYER_MERCHANT_TOKEN || "";
    this.privateKey = process.env.WINIPAYER_PRIVATE_KEY || "";
    this.env = (process.env.WINIPAYER_ENV as "test" | "prod") || "prod";

    if (!this.merchantApply) {
      console.warn("WiniPayer: X-Merchant-Apply non configuré (WINIPAYER_MERCHANT_APPLY)");
    }
    if (!this.merchantToken) {
      console.warn("WiniPayer: X-Merchant-Token non configuré (WINIPAYER_MERCHANT_TOKEN)");
    }
    if (!this.privateKey) {
      console.warn("WiniPayer: Clé privée non configurée (WINIPAYER_PRIVATE_KEY)");
    }
  }

  async createCheckout(params: WiniPayerCreateParams): Promise<WiniPayerCreateResponse> {
    try {
      console.log("📡 WiniPayer: Création du checkout...");
      console.log("📡 WiniPayer: Amount:", params.amount);
      console.log("📡 WiniPayer: Description:", params.description);

      const formData = new URLSearchParams();
      formData.append("env", params.env || this.env);
      formData.append("amount", params.amount.toString());
      formData.append("description", params.description);
      formData.append("cancel_url", params.cancelUrl);
      formData.append("return_url", params.returnUrl);
      formData.append("callback_url", params.callbackUrl);

      if (params.customData) {
        formData.append("custom_data", JSON.stringify(params.customData));
      }
      if (params.clientPayFee !== undefined) {
        formData.append("client_pay_fee", params.clientPayFee.toString());
      }
      if (params.items && params.items.length > 0) {
        formData.append("items", JSON.stringify(params.items));
      }
      if (params.channel && params.channel.length > 0) {
        formData.append("channel", JSON.stringify(params.channel));
      }
      if (params.reference) {
        formData.append("reference", JSON.stringify(params.reference));
      }

      const response = await fetch(`${WINIPAYER_API_URL}/checkout/standard/create`, {
        method: "POST",
        headers: {
          "X-Merchant-Apply": this.merchantApply,
          "X-Merchant-Token": this.merchantToken,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const responseText = await response.text();
      console.log("📡 WiniPayer: Create response status:", response.status);
      console.log("📡 WiniPayer: Create response body:", responseText);

      let data: WiniPayerCreateResponse;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("❌ WiniPayer: Réponse JSON invalide");
        return {
          success: false,
          errors: { code: 0, key: "parse", msg: "Réponse invalide de WiniPayer" },
          messages: [],
        };
      }

      return data;
    } catch (error) {
      console.error("❌ WiniPayer createCheckout error:", error);
      return {
        success: false,
        errors: { code: 0, key: "network", msg: "Erreur de connexion à WiniPayer" },
        messages: [],
      };
    }
  }

  async verifyPayment(uuid: string, env?: string): Promise<WiniPayerVerifyResponse> {
    try {
      console.log("🔍 WiniPayer: Vérification du paiement UUID:", uuid);

      const formData = new URLSearchParams();
      formData.append("env", env || this.env);

      const response = await fetch(`${WINIPAYER_API_URL}/checkout/standard/detail/${uuid}`, {
        method: "POST",
        headers: {
          "X-Merchant-Apply": this.merchantApply,
          "X-Merchant-Token": this.merchantToken,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const responseText = await response.text();
      console.log("🔍 WiniPayer: Verify response status:", response.status);
      console.log("🔍 WiniPayer: Verify response body:", responseText);

      let data: WiniPayerVerifyResponse;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("❌ WiniPayer: Réponse JSON de vérification invalide");
        return {
          success: false,
          errors: { code: 0, key: "parse", msg: "Réponse invalide de WiniPayer" },
          messages: [],
        };
      }

      return data;
    } catch (error) {
      console.error("❌ WiniPayer verifyPayment error:", error);
      return {
        success: false,
        errors: { code: 0, key: "network", msg: "Erreur de connexion à WiniPayer" },
        messages: [],
      };
    }
  }

  validateHash(invoice: {
    uuid: string;
    crypto: string;
    amount: number;
    created_at: string;
    hash: string;
  }): boolean {
    try {
      const generatedHash = crypto
        .createHash("sha256")
        .update(this.privateKey + invoice.uuid + invoice.crypto + invoice.amount + invoice.created_at)
        .digest("hex");

      const isValid = generatedHash === invoice.hash;
      console.log("🔐 WiniPayer: Hash validation:", isValid ? "VALID" : "INVALID");
      return isValid;
    } catch (error) {
      console.error("❌ WiniPayer hash validation error:", error);
      return false;
    }
  }
}

export const WINIPAYER_PAYOUT_OPERATORS: Record<string, string> = {
  "MTN": "mtn-cote-divoire",
  "Wave": "wave-cote-divoire",
  "Orange": "orange-cote-divoire",
  "Moov": "moov-cote-divoire",
  "MTN CI": "mtn-cote-divoire",
  "Wave CI": "wave-cote-divoire",
  "Orange CI": "orange-cote-divoire",
  "Moov CI": "moov-cote-divoire",
  "Mobile Money BJ": "mobile-money-benin",
  "MTN BJ": "mobile-money-benin",
  "Moov BJ": "mobile-money-benin",
  "Mobile Money TG": "mobile-money-togo",
  "T-Money": "mobile-money-togo",
  "TMoney": "mobile-money-togo",
  "Moov TG": "mobile-money-togo",
  "Mobile Money BF": "mobile-money-burkina-faso",
  "Moov BF": "mobile-money-burkina-faso",
  "Orange BF": "mobile-money-burkina-faso",
  "Mobile Money SN": "mobile-money-senegal",
  "Mobile Money ML": "mobile-money-mali",
  "Mobile Money NE": "mobile-money-niger",
};

export function getWiniPayerPayoutOperator(operatorName: string, countryCode: string): string | null {
  const countryMap: Record<string, string> = {
    "ci": "cote-divoire",
    "bj": "benin",
    "tg": "togo",
    "bf": "burkina-faso",
    "sn": "senegal",
    "ml": "mali",
    "ne": "niger",
    "cm": "cameroun",
    "cg": "congo-brazzaville",
    "cd": "congo",
  };

  // 1. Try exact country-specific key first (e.g. "Moov TG")
  const key1 = `${operatorName} ${countryCode.toUpperCase()}`;
  if (WINIPAYER_PAYOUT_OPERATORS[key1]) return WINIPAYER_PAYOUT_OPERATORS[key1];

  // 2. Use country-based slug logic (country-aware, always checked before generic name)
  const countrySlug = countryMap[countryCode.toLowerCase()];
  if (countrySlug) {
    const opLower = operatorName.toLowerCase();
    if (opLower.includes("wave")) return `wave-${countrySlug}`;
    if (opLower.includes("mtn")) return `mtn-${countrySlug}`;
    if (opLower.includes("orange")) return `orange-${countrySlug}`;
    if (opLower.includes("moov")) return `moov-${countrySlug}`;
    if (opLower.includes("flooz")) return `moov-${countrySlug}`;
    if (opLower.includes("t-money") || opLower.includes("tmoney")) return `mobile-money-${countrySlug}`;
    return `mobile-money-${countrySlug}`;
  }

  // 3. Last resort: generic name lookup (may be wrong for multi-country operators)
  if (WINIPAYER_PAYOUT_OPERATORS[operatorName]) return WINIPAYER_PAYOUT_OPERATORS[operatorName];

  return null;
}

export interface WiniPayerPayoutParams {
  operator: string;
  recipients: Array<{
    name: string;
    account: string;
    amount: number;
  }>;
  description?: string;
  customData?: Record<string, any>;
  callbackUrl?: string;
}

export interface WiniPayerPayoutResponse {
  uuid?: string;
  crypto?: string;
  env?: string;
  operator?: string;
  currency?: string;
  amount?: number;
  commission_rate?: number;
  commission_fee?: number;
  commission_amount?: number;
  amount_total?: number;
  description?: string;
  recipients?: Array<{
    uuid: string;
    name: string;
    account: string;
    amount: number;
    commission_amount: number;
    amount_total: number;
    operator_ref: string | null;
    state: string;
    state_at: string | null;
  }>;
  custom_data?: any;
  callback_url?: string | null;
  state?: string;
  state_at?: string | null;
  created_at?: string;
  success?: boolean;
  errors?: any;
  messages?: any[];
}

export const winipayer = new WiniPayerClient();

export async function createPayout(params: WiniPayerPayoutParams): Promise<WiniPayerPayoutResponse> {
  try {
    console.log("💸 WiniPayer Payout: Création du transfert...");
    console.log("💸 WiniPayer Payout: Operator:", params.operator);
    console.log("💸 WiniPayer Payout: Recipients:", JSON.stringify(params.recipients));

    const formData = new URLSearchParams();
    formData.append("env", "prod");
    formData.append("operator", params.operator);
    formData.append("recipients", JSON.stringify(params.recipients));

    if (params.description) {
      formData.append("description", params.description);
    }
    if (params.customData) {
      formData.append("custom_data", JSON.stringify(params.customData));
    }
    if (params.callbackUrl) {
      formData.append("callback_url", params.callbackUrl);
    }

    const merchantApply = process.env.WINIPAYER_MERCHANT_APPLY || "";
    const merchantToken = process.env.WINIPAYER_MERCHANT_TOKEN || "";

    const response = await fetch(`${WINIPAYER_API_URL}/payout/standard/create`, {
      method: "POST",
      headers: {
        "X-Merchant-Apply": merchantApply,
        "X-Merchant-Token": merchantToken,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const responseText = await response.text();
    console.log("💸 WiniPayer Payout: Response status:", response.status);
    console.log("💸 WiniPayer Payout: Response body:", responseText);

    let data: WiniPayerPayoutResponse;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("❌ WiniPayer Payout: Réponse JSON invalide");
      return {
        success: false,
        errors: { code: 0, key: "parse", msg: "Réponse invalide de WiniPayer Payout" },
        messages: [],
      };
    }

    return data;
  } catch (error) {
    console.error("❌ WiniPayer Payout error:", error);
    return {
      success: false,
      errors: { code: 0, key: "network", msg: "Erreur de connexion à WiniPayer Payout" },
      messages: [],
    };
  }
}

export async function verifyPayout(uuid: string): Promise<WiniPayerPayoutResponse> {
  try {
    console.log("🔍 WiniPayer Payout: Vérification transfert UUID:", uuid);

    const formData = new URLSearchParams();
    formData.append("env", "prod");

    const merchantApply = process.env.WINIPAYER_MERCHANT_APPLY || "";
    const merchantToken = process.env.WINIPAYER_MERCHANT_TOKEN || "";

    const response = await fetch(`${WINIPAYER_API_URL}/payout/standard/detail/${uuid}`, {
      method: "POST",
      headers: {
        "X-Merchant-Apply": merchantApply,
        "X-Merchant-Token": merchantToken,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const responseText = await response.text();
    console.log("🔍 WiniPayer Payout: Verify response status:", response.status);
    console.log("🔍 WiniPayer Payout: Verify response body:", responseText);

    let data: WiniPayerPayoutResponse;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("❌ WiniPayer Payout: Réponse JSON de vérification invalide");
      return {
        success: false,
        errors: { code: 0, key: "parse", msg: "Réponse invalide" },
        messages: [],
      };
    }

    return data;
  } catch (error) {
    console.error("❌ WiniPayer Payout verify error:", error);
    return {
      success: false,
      errors: { code: 0, key: "network", msg: "Erreur de connexion" },
      messages: [],
    };
  }
}
