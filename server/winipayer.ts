import crypto from "crypto";

const WINIPAYER_API_URL = "https://api-v2.winipayer.com";

const WINIPAYER_OPERATOR_MAP: Record<string, Record<string, string>> = {
  CI: {
    "MTN": "mtn-cote-divoire",
    "Orange": "orange-cote-divoire",
    "Moov": "moov-cote-divoire",
    "Wave": "wave-cote-divoire",
  },
  BJ: {
    "MTN": "mtn-benin",
    "Moov": "moov-benin",
  },
  TG: {
    "TMoney": "tmoney-togo",
    "Moov": "moov-togo",
  },
  BF: {
    "Moov": "moov-burkina-faso",
    "Orange": "orange-burkina-faso",
  },
  SN: {
    "Orange": "orange-senegal",
    "Wave": "wave-senegal",
    "Free": "free-senegal",
  },
  ML: {
    "Orange": "orange-mali",
    "Moov": "moov-mali",
  },
  NE: {
    "Moov": "moov-niger",
    "Airtel": "airtel-niger",
  },
};

export function getWiniPayerOperator(countryCode: string, operator: string): string | null {
  const country = WINIPAYER_OPERATOR_MAP[countryCode];
  if (!country) return null;
  return country[operator] || null;
}

export interface WiniPayerCreateParams {
  amount: number;
  description: string;
  cancelUrl: string;
  returnUrl: string;
  callbackUrl: string;
  env?: "test" | "prod";
  customData?: Record<string, any>;
  clientPayFee?: boolean;
  channel?: string[];
  reference?: {
    identifier?: string;
    name?: string;
    phone?: string;
    email?: string;
  };
  operator?: string;
  operatorInput?: { phone: string };
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
      if (params.operator) {
        console.log("📡 WiniPayer: Operator (direct):", params.operator);
      }

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
      if (params.channel && params.channel.length > 0) {
        formData.append("channel", JSON.stringify(params.channel));
      }
      if (params.reference) {
        formData.append("reference", JSON.stringify(params.reference));
      }
      if (params.operator) {
        formData.append("operator", params.operator);
      }
      if (params.operatorInput) {
        formData.append("operator_input", JSON.stringify(params.operatorInput));
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

export const winipayer = new WiniPayerClient();
