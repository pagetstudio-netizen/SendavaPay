const PAXITY_BASE_URL = "https://transaction.paxity.io/api/v1";

function getPaxityJwt(): string {
  return process.env.PAXITY_JWT_TOKEN || "";
}

function paxityHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${getPaxityJwt()}`,
  };
}

const PAXITY_METHOD_MAP: Record<string, string> = {
  "SN:Wave": "WAVESN",
  "SN:Orange": "OMSN",
  "SN:Orange Money": "OMSN",
  "CI:Orange": "OMCI",
  "CI:Orange Money": "OMCI",
  "CI:Wave": "WAVECI",
  "CI:MTN": "MTNCI",
  "CI:MTN Mobile Money": "MTNCI",
  "BF:Orange": "OMBF",
  "BF:Orange Money": "OMBF",
  "BF:Moov": "MOOVBF",
  "BF:Moov Money": "MOOVBF",
  "BJ:MTN": "MTNBJ",
  "BJ:MTN Mobile Money": "MTNBJ",
  "BJ:Moov": "MOOVBJ",
  "BJ:Moov Money": "MOOVBJ",
  "ML:Orange": "OMML",
  "ML:Orange Money": "OMML",
  "ML:Moov": "MOOVML",
  "ML:Moov Money": "MOOVML",
  "TG:Moov": "MOOVTG",
  "TG:Moov Money": "MOOVTG",
  "TG:T-Money": "TMONEYTG",
  "TG:TMoney": "TMONEYTG",
  "CM:MTN": "MTNCM",
  "CM:MTN Mobile Money": "MTNCM",
  "GH:MTN": "MTNGH",
  "GH:AirtelTigo": "ATGH",
  "GH:Telcel": "TLGH",
  "NG:MTN": "MTNNG",
  "NG:MTN Mobile Money": "MTNNG",
  "NG:Opay": "OPNG",
  "KE:Mpesa": "MPESAKE",
  "KE:M-Pesa": "MPESAKE",
};

const PAXITY_QR_METHODS = new Set(["WAVESN", "OMSN", "OMCI", "WAVECI", "OPNG"]);
const PAXITY_OTP_METHODS = new Set(["OMBF"]);

const PHONE_PREFIXES: Record<string, string> = {
  SN: "221", CI: "225", BF: "226", BJ: "229", ML: "223",
  TG: "228", CM: "237", GH: "233", NG: "234", KE: "254",
};

const COUNTRY_CURRENCIES: Record<string, string> = {
  SN: "XOF", CI: "XOF", BF: "XOF", BJ: "XOF", ML: "XOF",
  TG: "XOF", CM: "XAF", GH: "GHS", NG: "NGN", KE: "KES",
};

export function getPaxityMethodCode(operatorName: string, countryCode: string): string | null {
  const key = `${countryCode.toUpperCase()}:${operatorName}`;
  return PAXITY_METHOD_MAP[key] || null;
}

export function isPaxityQRMethod(methodCode: string): boolean {
  return PAXITY_QR_METHODS.has(methodCode);
}

export function isPaxityOTPMethod(methodCode: string): boolean {
  return PAXITY_OTP_METHODS.has(methodCode);
}

export function getPaxityPhonePrefix(countryCode: string): string {
  return PHONE_PREFIXES[countryCode.toUpperCase()] || "";
}

export function getPaxityCurrency(countryCode: string): string {
  return COUNTRY_CURRENCIES[countryCode.toUpperCase()] || "XOF";
}

export function formatPhoneForPaxity(phone: string, countryCode: string): string {
  let cleaned = phone.replace(/\s/g, "").replace(/^0+/, "");
  const prefix = PHONE_PREFIXES[countryCode.toUpperCase()] || "";
  if (prefix && cleaned.startsWith(prefix)) {
    cleaned = cleaned.slice(prefix.length);
  }
  return cleaned;
}

export interface PaxityPayinParams {
  amount: number;
  country: string;
  currency: string;
  phoneNumber: string;
  prefixPhone: string;
  paymentMethod: string;
  codeOtp?: string;
  description: string;
  idClient: string;
  ipn: string;
}

export interface PaxityPayinResponse {
  code: number;
  message: string;
  data?: {
    idClient: string;
    amount: number;
    realAmount: number;
    currency: string;
    status: string;
    transactionId: string;
    link?: string;
    qrCode?: string;
    createdAt: number;
  };
  errors?: any;
}

export interface PaxityPayoutParams {
  amount: number;
  country: string;
  currency: string;
  prefixPhone: string;
  phoneNumber: string;
  paymentMethod: string;
  ipn: string;
  description: string;
  idClient: string;
  name: string;
  email: string;
}

export interface PaxityPayoutResponse {
  code: number;
  message: string;
  data?: {
    id: string;
    idClient: string;
    amount: number;
    realAmount: number;
    currency: string;
    transactionStatus: string;
    createdAt: number;
  };
  errors?: any;
}

export interface PaxityTransactionResponse {
  code: number;
  message: string;
  data?: {
    amount: number;
    realAmount: string;
    currency: string;
    countryCode: string;
    paymentMethodName: string;
    status: string;
    transactionReference: string;
    createdAt: number;
    modifiedAt: number;
  };
  errors?: any;
}

export const paxity = {
  async createPayin(params: PaxityPayinParams): Promise<PaxityPayinResponse> {
    try {
      const body = {
        amount: params.amount,
        country: params.country.toUpperCase(),
        currency: params.currency,
        phoneNumber: params.phoneNumber,
        prefixPhone: params.prefixPhone,
        paymentMethod: params.paymentMethod,
        codeOtp: params.codeOtp || "",
        description: params.description,
        idClient: params.idClient,
        ipn: params.ipn,
      };
      console.log("[paxity] createPayin →", JSON.stringify(body));
      const res = await fetch(`${PAXITY_BASE_URL}/transaction/pay-in-mobile`, {
        method: "POST",
        headers: paxityHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      console.log("[paxity] createPayin ←", JSON.stringify(data));
      return data;
    } catch (err) {
      console.error("Paxity createPayin error:", err);
      return { code: 500, message: "Erreur de connexion à Paxity", errors: err };
    }
  },

  async getTransaction(transactionReference: string): Promise<PaxityTransactionResponse> {
    try {
      const res = await fetch(`${PAXITY_BASE_URL}/transaction/pay-in-mobile/${transactionReference}`, {
        method: "GET",
        headers: paxityHeaders(),
      });
      return res.json();
    } catch (err) {
      console.error("Paxity getTransaction error:", err);
      return { code: 500, message: "Erreur de connexion à Paxity", errors: err };
    }
  },

  async createPayout(params: PaxityPayoutParams): Promise<PaxityPayoutResponse> {
    try {
      const res = await fetch(`${PAXITY_BASE_URL}/transaction/pay-out-mobile`, {
        method: "POST",
        headers: paxityHeaders(),
        body: JSON.stringify({
          amount: params.amount,
          country: params.country.toUpperCase(),
          currency: params.currency,
          prefixPhone: params.prefixPhone,
          phoneNumber: params.phoneNumber,
          paymentMethod: params.paymentMethod,
          ipn: params.ipn,
          description: params.description,
          idClient: params.idClient,
          name: params.name,
          email: params.email,
        }),
      });
      return res.json();
    } catch (err) {
      console.error("Paxity createPayout error:", err);
      return { code: 500, message: "Erreur de connexion à Paxity", errors: err };
    }
  },
};
