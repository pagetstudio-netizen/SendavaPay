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
  "Airtel": "airtel",
  "Airtel Money": "airtel",
  "Vodacom": "mpesa",
  "M-Pesa": "mpesa",
  "Mpesa": "mpesa",
  "TMoney": "tmoney",
  "T-Money": "tmoney",
  "Mixx": "mixx",
  "Afrimoney": "afrimoney",
  "Tigo": "tigo",
  "Vodafone": "vodafone",
};

const COUNTRY_CURRENCIES: Record<string, string> = {
  BF: "XOF", CI: "XOF", SN: "XOF", ML: "XOF", BJ: "XOF", TG: "XOF", NE: "XOF",
  CM: "XAF", CG: "XAF", GA: "XAF", CF: "XAF", TD: "XAF",
  CD: "CDF",
  GH: "GHS",
  NG: "NGN",
  KE: "KES",
  GM: "GMD",
};

export function getMbiyoNetwork(operatorName: string): string | null {
  return MBIYOPAY_NETWORK_MAP[operatorName] || null;
}

export function getMbiyoCurrency(countryCode: string): string {
  return COUNTRY_CURRENCIES[countryCode.toUpperCase()] || "XOF";
}

export function formatPhoneForMbiyo(phone: string, countryCode: string): string {
  let cleaned = phone.replace(/\s/g, "").replace(/^\+/, "");
  const prefixes: Record<string, string> = {
    BF: "226", CI: "225", SN: "221", ML: "223", BJ: "229", TG: "228",
    CM: "237", GH: "233", NG: "234", KE: "254", CD: "243", CG: "242",
    GM: "220",
  };
  const prefix = prefixes[countryCode.toUpperCase()] || "";
  if (prefix && !cleaned.startsWith("+")) {
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

    const data = await response.json();
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

    const data = await response.json();
    return data as MbiyoPayoutResponse;
  }
}

export const mbiyopay = new MbiyoPayClient();
