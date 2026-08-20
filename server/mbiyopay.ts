import { getCredential } from "./credentials";

const MBIYOPAY_BASE_URL = "https://dashboard.mbiyo.africa/api/v1";

function mbiyoHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${getCredential("MBIYOPAY_API_KEY")}`,
  };
}

const MBIYOPAY_NETWORK_MAP: Record<string, string> = {
  "MTN": "mtn",
  "MTN Mobile Money": "mtn",
  "Orange": "orange",
  "Orange Money": "orange",
  "Moov": "moov",
  "Moov Money": "moov",
  "Wave": "wave",
  "Free": "free",
  "Free Money": "free",
  "Airtel": "airtel",
  "Airtel Money": "airtel",
  "Vodacom": "vodacom",
  "M-Pesa": "vodacom",
  "Mpesa": "vodacom",
  "Africell": "africell",
  "Togocom": "togocom",
  "TMoney": "togocom",
  "Tmoney": "togocom",
  "T-Money": "togocom",
  "Flooz": "flooz",
  "Flooz TG": "flooz",
  "Coris": "coris",
  "Coris Bank": "coris",
  "Celtiis": "celtiis",
  "Afrimoney": "afrimoney",
  "QMoney": "qmoney",
  "Q-Money": "qmoney",
  "APS": "aps",
  "Tigo": "tigo",
  "Vodafone": "vodafone",
};

const MBIYOPAY_COUNTRY_NETWORK_OVERRIDES: Record<string, Record<string, string>> = {
  TG: {
    "Moov": "flooz",
    "Moov Money": "flooz",
    "Flooz": "flooz",
  },
};

const COUNTRY_CURRENCIES: Record<string, string> = {
  BF: "XOF", CI: "XOF", SN: "XOF", ML: "XOF", BJ: "XOF", TG: "XOF", NE: "XOF",
  CM: "XAF", CG: "XAF", GA: "XAF", CF: "XAF", TD: "XAF",
  CD: "CDF", COD: "CDF",
  GH: "GHS",
  NG: "NGN",
  KE: "KES",
  GM: "GMD",
  GN: "GNF",
};

const PHONE_PREFIXES: Record<string, string> = {
  BF: "226", CI: "225", SN: "221", ML: "223", BJ: "229", TG: "228",
  CM: "237", GH: "233", NG: "234", KE: "254", CD: "243", COD: "243", CG: "242",
  GM: "220", GN: "224",
};

const MBIYO_OTP_NETWORKS = new Set([
  "BF:orange",
  "CI:orange",
  "GN:orange",
  "ML:orange",
  "SN:orange",
]);

const MBIYO_PIN_NETWORKS = new Set([
  "GM:qmoney",
  "GM:aps",
]);

export function getMbiyoNetwork(operatorName: string, countryCode?: string): string | null {
  if (countryCode) {
    const countryOverrides = MBIYOPAY_COUNTRY_NETWORK_OVERRIDES[countryCode.toUpperCase()];
    if (countryOverrides && countryOverrides[operatorName] !== undefined) {
      return countryOverrides[operatorName];
    }
  }
  return MBIYOPAY_NETWORK_MAP[operatorName] || null;
}

export function getMbiyoCurrency(countryCode: string): string {
  return COUNTRY_CURRENCIES[countryCode.toUpperCase()] || "XOF";
}

export function isMbiyoOtpRequired(network: string, countryCode: string): boolean {
  return MBIYO_OTP_NETWORKS.has(`${countryCode.toUpperCase()}:${network.toLowerCase()}`);
}

export function isMbiyoPinRequired(network: string, countryCode: string): boolean {
  return MBIYO_PIN_NETWORKS.has(`${countryCode.toUpperCase()}:${network.toLowerCase()}`);
}

export function formatPhoneForMbiyo(phone: string, countryCode: string): string {
  let cleaned = phone.replace(/\s/g, "").replace(/^\+/, "");
  const prefix = PHONE_PREFIXES[countryCode.toUpperCase()] || "";
  if (prefix) {
    if (!cleaned.startsWith(prefix)) {
      cleaned = `+${prefix}${cleaned.replace(/^0+/, "")}`;
    } else {
      cleaned = `+${cleaned}`;
    }
  } else if (!cleaned.startsWith("+")) {
    cleaned = `+${cleaned}`;
  }
  return cleaned;
}

export interface MbiyoPayinParams {
  amount: number;
  currency: string;
  network: string;
  phoneNumber: string;
  countryCode: string;
  orderId: string;
  callbackUrl: string;
  omOtp?: string;
}

export interface MbiyoPayinResponse {
  status: string;
  message: string;
  data?: {
    transaction_id: string;
    amount: number;
    fee: number;
    charged_amount: number;
    currency: string;
    order_id: string;
    status: string;
    payment_method: string;
    redirect_url: string | null;
    instructions: string | null;
    auth_mode: string | null;
    created_at: string;
  };
}

export interface MbiyoPayoutParams {
  amount: number;
  currency: string;
  network: string;
  phoneNumber: string;
  countryCode: string;
  orderId: string;
  callbackUrl: string;
  beneficiary: string;
}

export interface MbiyoPayoutResponse {
  status: string;
  message: string;
  data?: {
    transaction_id: string;
    amount: number;
    fee: number;
    charged_amount: number;
    currency: string;
    order_id: string;
    status: string;
    payment_method: string;
    created_at: string;
  };
}

export interface MbiyoWebhookPayload {
  transaction_id: string;
  amount: number;
  fee: number;
  currency: string;
  order_id: string;
  status: string;
  charged_amount: number;
  type?: string;
  created_at: string;
  updated_at?: string;
  metadata?: {
    country_code: string;
    phone_number: string;
    network: string;
    beneficiary?: string;
  };
}

export interface MbiyoTransactionDetails {
  id?: string;
  transaction_id?: string;
  order_id?: string;
  amount?: string | number;
  currency?: string;
  status?: string;
}

class MbiyoPayClient {
  async payin(params: MbiyoPayinParams): Promise<MbiyoPayinResponse> {
    const body: Record<string, any> = {
      amount: params.amount,
      currency: params.currency,
      payment_method: "mobile_money",
      order_id: params.orderId,
      callback_url: params.callbackUrl,
      metadata: {
        network: params.network,
        phone_number: params.phoneNumber,
        country_code: params.countryCode,
      },
    };

    if (params.omOtp) {
      body.metadata.om_otp = params.omOtp;
    }

    const response = await fetch(`${MBIYOPAY_BASE_URL}/merchant/payin`, {
      method: "POST",
      headers: mbiyoHeaders(),
      body: JSON.stringify(body),
    });

    const rawText = await response.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error("[MbiyoPay] payin: réponse non-JSON (HTTP", response.status, "):", rawText.slice(0, 300));
      throw new Error(`MbiyoPay a retourné une réponse invalide (HTTP ${response.status})`);
    }
    return data as MbiyoPayinResponse;
  }

  async payout(params: MbiyoPayoutParams): Promise<MbiyoPayoutResponse> {
    const body = {
      amount: params.amount,
      currency: params.currency,
      payment_method: "mobile_money",
      order_id: params.orderId,
      callback_url: params.callbackUrl,
      metadata: {
        network: params.network,
        phone_number: params.phoneNumber,
        country_code: params.countryCode,
        beneficiary: params.beneficiary,
      },
    };

    const response = await fetch(`${MBIYOPAY_BASE_URL}/merchant/payout`, {
      method: "POST",
      headers: mbiyoHeaders(),
      body: JSON.stringify(body),
    });

    const rawText = await response.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error("[MbiyoPay] payout: réponse non-JSON (HTTP", response.status, "):", rawText.slice(0, 300));
      throw new Error(`MbiyoPay a retourné une réponse invalide (HTTP ${response.status})`);
    }
    return data as MbiyoPayoutResponse;
  }

  /**
   * MbiyoPay's public webhook documentation does not define an HMAC header.
   * A callback is therefore authenticated by querying its transaction through
   * the merchant API before it can change any local payment state.
   */
  async getTransaction(transactionId: string): Promise<MbiyoTransactionDetails> {
    const response = await fetch(
      `${MBIYOPAY_BASE_URL}/transactions/${encodeURIComponent(transactionId)}`,
      { headers: mbiyoHeaders() },
    );

    const rawText = await response.text();
    let payload: any;
    try {
      payload = JSON.parse(rawText);
    } catch {
      throw new Error(`MbiyoPay transaction lookup returned invalid JSON (HTTP ${response.status})`);
    }

    if (!response.ok) {
      throw new Error(`MbiyoPay transaction lookup failed (HTTP ${response.status})`);
    }

    const transaction = payload?.data ?? payload;
    if (!transaction || typeof transaction !== "object") {
      throw new Error("MbiyoPay transaction lookup returned no transaction data");
    }

    return transaction as MbiyoTransactionDetails;
  }
}

export const mbiyopay = new MbiyoPayClient();
