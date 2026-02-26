const MAISHAPAY_API_URL = "https://marchand.maishapay.online/api";

export interface MaishaPayCollectParams {
  transactionReference: string;
  amount: number;
  currency: string;
  customerFullName: string;
  customerEmail?: string;
  provider: string;
  walletID: string;
  callbackUrl: string;
}

export interface MaishaPayCollectResponse {
  status_code: number;
  transactionStatus: string;
  transactionId?: number;
  originatingTransactionId?: string;
  order?: {
    customerFullName?: string;
    customerEmailAdress?: string;
    cost?: {
      amount: number;
      frais: number;
      total: number;
      currency: string;
    };
  };
  paymentChannel?: {
    channel?: string;
    provider?: any;
    walletID?: string;
  };
  message?: string;
  error?: string;
}

export interface MaishaPayB2CParams {
  transactionReference: string;
  amount: number;
  currency: string;
  customerFullName?: string;
  customerEmail?: string;
  motif?: string;
  provider: string;
  walletID: string;
  callbackUrl: string;
}

export interface MaishaPayB2CResponse {
  status_code: number;
  transactionStatus: string;
  transactionId?: number;
  originatingTransactionId?: string;
  recipient?: {
    customerFullName?: string;
    customerEmailAdress?: string;
    walletID?: string;
  };
  provider?: {
    libelle?: string;
    picture?: string;
  };
  cost?: {
    amount: number;
    frais: number;
    total: number;
    currency: string;
  };
  motif?: string;
  date?: string;
  message?: string;
  error?: string;
}

export interface MaishaPayCheckResponse {
  transaction_type?: string;
  status_code: number;
  transactionStatus: string;
  transactionId?: number;
  originatingTransactionId?: string;
  order?: any;
  recipient?: any;
  provider?: any;
  cost?: any;
  motif?: string;
  date?: string;
  message?: string;
  error?: string;
}

export const MAISHAPAY_PROVIDERS: Record<string, string> = {
  "Airtel": "AIRTEL",
  "Airtel Money": "AIRTEL",
  "Airtel RDC": "AIRTEL",
  "Airtel COD": "AIRTEL",
  "AIRTEL": "AIRTEL",
  "M-Pesa": "MPESA",
  "MPesa": "MPESA",
  "Vodacom": "MPESA",
  "Vodacom M-Pesa": "MPESA",
  "MPESA": "MPESA",
  "Orange": "ORANGE",
  "Orange Money": "ORANGE",
  "Orange RDC": "ORANGE",
  "Orange COD": "ORANGE",
  "ORANGE": "ORANGE",
  "MTN": "MTN",
  "MTN Mobile Money": "MTN",
  "MOMO": "MTN",
  "MTN CM": "MTN",
  "MTN BJ": "MTN",
  "MTN CI": "MTN",
  "Wave": "WAVE",
  "Wave CI": "WAVE",
  "WAVE": "WAVE",
  "Moov": "MOOV",
  "Moov Money": "MOOV",
  "MOOV": "MOOV",
  "T-Money": "TMONEY",
  "TMoney": "TMONEY",
  "TMONEY": "TMONEY",
};

export function getMaishapayProvider(operatorName: string, countryCode: string): string | null {
  const ccUpper = countryCode.toUpperCase();
  const opLower = operatorName.toLowerCase();

  if (ccUpper === "COD" || ccUpper === "CD") {
    if (opLower.includes("airtel")) return "AIRTEL";
    if (opLower.includes("vodacom") || opLower.includes("mpesa") || opLower.includes("m-pesa")) return "MPESA";
    if (opLower.includes("orange")) return "ORANGE";
  }

  if (ccUpper === "COG" || ccUpper === "CG") {
    if (opLower.includes("airtel")) return "AIRTEL";
    if (opLower.includes("mtn")) return "MTN";
  }

  if (ccUpper === "CM") {
    if (opLower.includes("mtn")) return "MTN";
    if (opLower.includes("orange")) return "ORANGE";
  }

  if (ccUpper === "CI") {
    if (opLower.includes("mtn")) return "MTN";
    if (opLower.includes("orange")) return "ORANGE";
    if (opLower.includes("wave")) return "WAVE";
    if (opLower.includes("moov")) return "MOOV";
  }

  if (ccUpper === "SN") {
    if (opLower.includes("wave")) return "WAVE";
    if (opLower.includes("orange")) return "ORANGE";
  }

  if (ccUpper === "BJ") {
    if (opLower.includes("mtn")) return "MTN";
    if (opLower.includes("moov")) return "MOOV";
  }

  if (ccUpper === "TG") {
    if (opLower.includes("t-money") || opLower.includes("tmoney")) return "TMONEY";
    if (opLower.includes("moov")) return "MOOV";
  }

  if (ccUpper === "BF") {
    if (opLower.includes("orange")) return "ORANGE";
    if (opLower.includes("moov")) return "MOOV";
  }

  if (MAISHAPAY_PROVIDERS[operatorName]) return MAISHAPAY_PROVIDERS[operatorName];

  for (const [key, val] of Object.entries(MAISHAPAY_PROVIDERS)) {
    if (operatorName.toLowerCase().includes(key.toLowerCase())) return val;
  }

  return null;
}

export class MaishaPayClient {
  private publicApiKey: string;
  private secretApiKey: string;

  constructor() {
    this.publicApiKey = process.env.MAISHAPAY_PUBLIC_KEY || "";
    this.secretApiKey = process.env.MAISHAPAY_SECRET_KEY || "";

    if (!this.publicApiKey) {
      console.warn("MaishaPay: Clé publique non configurée (MAISHAPAY_PUBLIC_KEY)");
    }
    if (!this.secretApiKey) {
      console.warn("MaishaPay: Clé secrète non configurée (MAISHAPAY_SECRET_KEY)");
    }
  }

  async collectPayment(params: MaishaPayCollectParams): Promise<MaishaPayCollectResponse> {
    try {
      console.log("📡 MaishaPay: Initialisation collecte Mobile Money...");
      console.log("📡 MaishaPay: Ref:", params.transactionReference, "Montant:", params.amount, params.currency);
      console.log("📡 MaishaPay: Provider:", params.provider, "WalletID:", params.walletID);

      const body = {
        transactionReference: params.transactionReference,
        gatewayMode: "1",
        publicApiKey: this.publicApiKey,
        secretApiKey: this.secretApiKey,
        order: {
          amount: params.amount.toString(),
          currency: params.currency,
          customerFullName: params.customerFullName,
          customerEmailAdress: params.customerEmail || "",
        },
        paymentChannel: {
          channel: "MOBILEMONEY",
          provider: params.provider,
          walletID: params.walletID,
          callbackUrl: params.callbackUrl,
        },
      };

      const response = await fetch(`${MAISHAPAY_API_URL}/collect/v2/store/mobileMoney`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      console.log("📡 MaishaPay collect response status:", response.status);
      console.log("📡 MaishaPay collect response body:", responseText);

      try {
        return JSON.parse(responseText);
      } catch {
        console.error("❌ MaishaPay: Réponse JSON invalide (collect)");
        return { status_code: 500, transactionStatus: "FAILED", message: "Réponse invalide de MaishaPay" };
      }
    } catch (error) {
      console.error("❌ MaishaPay collectPayment error:", error);
      return { status_code: 500, transactionStatus: "FAILED", message: "Erreur de connexion à MaishaPay" };
    }
  }

  async b2cTransfer(params: MaishaPayB2CParams): Promise<MaishaPayB2CResponse> {
    try {
      console.log("💸 MaishaPay B2C: Initialisation transfert...");
      console.log("💸 MaishaPay B2C: Ref:", params.transactionReference, "Montant:", params.amount, params.currency);
      console.log("💸 MaishaPay B2C: Provider:", params.provider, "WalletID:", params.walletID);

      const body = {
        transactionReference: params.transactionReference,
        gatewayMode: "1",
        publicApiKey: this.publicApiKey,
        secretApiKey: this.secretApiKey,
        order: {
          motif: params.motif || "Retrait SendavaPay",
          amount: params.amount.toString(),
          currency: params.currency,
          customerFullName: params.customerFullName || "",
          customerEmailAdress: params.customerEmail || "",
        },
        paymentChannel: {
          provider: params.provider,
          walletID: params.walletID,
          callbackUrl: params.callbackUrl,
        },
      };

      const response = await fetch(`${MAISHAPAY_API_URL}/b2c/store/transfert/mobilemoney`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      console.log("💸 MaishaPay B2C response status:", response.status);
      console.log("💸 MaishaPay B2C response body:", responseText);

      try {
        return JSON.parse(responseText);
      } catch {
        console.error("❌ MaishaPay: Réponse JSON invalide (B2C)");
        return { status_code: 500, transactionStatus: "FAILED", message: "Réponse invalide de MaishaPay" };
      }
    } catch (error) {
      console.error("❌ MaishaPay b2cTransfer error:", error);
      return { status_code: 500, transactionStatus: "FAILED", message: "Erreur de connexion à MaishaPay" };
    }
  }

  async checkTransaction(transactionId: string): Promise<MaishaPayCheckResponse> {
    try {
      console.log("🔍 MaishaPay: Vérification transaction:", transactionId);

      const body = {
        gatewayMode: 1,
        publicApiKey: this.publicApiKey,
        secretApiKey: this.secretApiKey,
        transactionId,
      };

      const response = await fetch(`${MAISHAPAY_API_URL}/transaction/rest/v2/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      console.log("🔍 MaishaPay check response status:", response.status);
      console.log("🔍 MaishaPay check response body:", responseText);

      try {
        return JSON.parse(responseText);
      } catch {
        console.error("❌ MaishaPay: Réponse JSON invalide (check)");
        return { status_code: 500, transactionStatus: "FAILED", message: "Réponse invalide de MaishaPay" };
      }
    } catch (error) {
      console.error("❌ MaishaPay checkTransaction error:", error);
      return { status_code: 500, transactionStatus: "FAILED", message: "Erreur de connexion à MaishaPay" };
    }
  }
}

export const maishapay = new MaishaPayClient();
