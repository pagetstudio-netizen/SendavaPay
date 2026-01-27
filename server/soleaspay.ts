import crypto from "crypto";

const SOLEASPAY_API_URL = "https://soleaspay.com";

export interface SoleasPayService {
  id: number;
  name: string;
  description: string;
  country: string;
  countryCode: string;
  currency: string;
  operator: string;
}

export const SOLEASPAY_SERVICES: SoleasPayService[] = [
  { id: 1, name: "MOMO CM", description: "MTN Mobile Money", country: "Cameroun", countryCode: "CM", currency: "XAF", operator: "MTN" },
  { id: 2, name: "OM CM", description: "Orange Money", country: "Cameroun", countryCode: "CM", currency: "XAF", operator: "Orange" },
  { id: 29, name: "OM CI", description: "Orange Money", country: "Côte d'Ivoire", countryCode: "CI", currency: "XOF", operator: "Orange" },
  { id: 30, name: "MOMO CI", description: "MTN Money", country: "Côte d'Ivoire", countryCode: "CI", currency: "XOF", operator: "MTN" },
  { id: 31, name: "MOOV CI", description: "Moov Money", country: "Côte d'Ivoire", countryCode: "CI", currency: "XOF", operator: "Moov" },
  { id: 32, name: "WAVE CI", description: "Wave", country: "Côte d'Ivoire", countryCode: "CI", currency: "XOF", operator: "Wave" },
  { id: 33, name: "MOOV BF", description: "Moov Money", country: "Burkina Faso", countryCode: "BF", currency: "XOF", operator: "Moov" },
  { id: 34, name: "OM BF", description: "Orange Money", country: "Burkina Faso", countryCode: "BF", currency: "XOF", operator: "Orange" },
  { id: 35, name: "MOMO BJ", description: "MTN Money", country: "Bénin", countryCode: "BJ", currency: "XOF", operator: "MTN" },
  { id: 36, name: "MOOV BJ", description: "Moov Money", country: "Bénin", countryCode: "BJ", currency: "XOF", operator: "Moov" },
  { id: 37, name: "T-MONEY TG", description: "T-Money", country: "Togo", countryCode: "TG", currency: "XOF", operator: "TMoney" },
  { id: 38, name: "MOOV TG", description: "Moov Money", country: "Togo", countryCode: "TG", currency: "XOF", operator: "Moov" },
  { id: 52, name: "VODACOM COD", description: "Vodacom M-Pesa", country: "RDC", countryCode: "COD", currency: "CDF", operator: "Vodacom" },
  { id: 53, name: "AIRTEL COD", description: "Airtel Money", country: "RDC", countryCode: "COD", currency: "CDF", operator: "Airtel" },
  { id: 54, name: "OM COD", description: "Orange Money", country: "RDC", countryCode: "COD", currency: "CDF", operator: "Orange" },
  { id: 55, name: "AIRTEL COG", description: "Airtel Money", country: "Congo Brazzaville", countryCode: "COG", currency: "XAF", operator: "Airtel" },
  { id: 56, name: "MOMO COG", description: "MTN Money", country: "Congo Brazzaville", countryCode: "COG", currency: "XAF", operator: "MTN" },
];

export const SOLEASPAY_COUNTRIES = [
  { code: "BJ", name: "Bénin", flag: "🇧🇯", currency: "XOF" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", currency: "XOF" },
  { code: "CM", name: "Cameroun", flag: "🇨🇲", currency: "XAF" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF" },
  { code: "COG", name: "Congo Brazzaville", flag: "🇨🇬", currency: "XAF" },
  { code: "COD", name: "RDC", flag: "🇨🇩", currency: "CDF" },
  { code: "TG", name: "Togo", flag: "🇹🇬", currency: "XOF" },
];

export function getServicesByCountry(countryCode: string): SoleasPayService[] {
  return SOLEASPAY_SERVICES.filter(s => s.countryCode === countryCode);
}

export function getServiceById(id: number): SoleasPayService | undefined {
  return SOLEASPAY_SERVICES.find(s => s.id === id);
}

export function getCurrencyByCountry(countryCode: string): string {
  const country = SOLEASPAY_COUNTRIES.find(c => c.code === countryCode);
  return country?.currency || "XOF";
}

interface CollectPaymentParams {
  wallet: string;
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  payer: string;
  payerEmail: string;
  serviceId: number;
  successUrl?: string;
  failureUrl?: string;
}

interface CollectPaymentResponse {
  success: boolean;
  code?: number;
  status?: string;
  created_at?: string;
  data?: {
    operation: string;
    reference: string;
    external_reference: string;
    transaction_reference: string | null;
    transaction_category: string;
    transaction_channel: string;
    amount: string;
    currency: string;
  };
  message?: string;
}

interface VerifyPaymentResponse {
  success: boolean;
  code?: number;
  status?: string;
  created_at?: string;
  data?: {
    operation: string;
    reference: string;
    external_reference: string;
    transaction_reference: string;
    amount: number;
    currency: string;
  };
  message?: string;
}

export class SoleasPayClient {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.SOLEASPAY_API_KEY || "";
    
    if (!this.apiKey) {
      console.warn("SoleasPay: Clé API non configurée (SOLEASPAY_API_KEY)");
    }
  }

  async collectPayment(params: CollectPaymentParams): Promise<CollectPaymentResponse> {
    try {
      console.log("📡 SoleasPay: Initialisation du paiement...");
      console.log("📡 SoleasPay: Service ID:", params.serviceId);
      console.log("📡 SoleasPay: Wallet:", params.wallet);
      console.log("📡 SoleasPay: Amount:", params.amount, params.currency);
      console.log("📡 SoleasPay: Order ID:", params.orderId);

      const response = await fetch(`${SOLEASPAY_API_URL}/api/agent/bills/v3`, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "operation": "2",
          "service": params.serviceId.toString(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: params.wallet,
          amount: params.amount,
          currency: params.currency,
          order_id: params.orderId,
          description: params.description,
          payer: params.payer,
          payerEmail: params.payerEmail,
          successUrl: params.successUrl,
          failureUrl: params.failureUrl,
        }),
      });

      const responseText = await response.text();
      console.log("📡 SoleasPay: Response status:", response.status);
      console.log("📡 SoleasPay: Response body:", responseText);

      let data: CollectPaymentResponse;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("❌ SoleasPay: Réponse JSON invalide");
        return {
          success: false,
          message: "Réponse invalide de SoleasPay",
        };
      }

      return data;
    } catch (error) {
      console.error("❌ SoleasPay collectPayment error:", error);
      return {
        success: false,
        message: "Erreur de connexion à SoleasPay",
      };
    }
  }

  async verifyPayment(orderId: string, payId: string): Promise<VerifyPaymentResponse> {
    try {
      console.log("🔍 SoleasPay: Vérification du paiement...");
      console.log("🔍 SoleasPay: Order ID:", orderId);
      console.log("🔍 SoleasPay: Pay ID:", payId);

      const url = `${SOLEASPAY_API_URL}/api/agent/verif-pay?orderId=${encodeURIComponent(orderId)}&payId=${encodeURIComponent(payId)}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "x-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      const responseText = await response.text();
      console.log("🔍 SoleasPay: Verify response status:", response.status);
      console.log("🔍 SoleasPay: Verify response body:", responseText);

      let data: VerifyPaymentResponse;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("❌ SoleasPay: Réponse JSON invalide");
        return {
          success: false,
          message: "Réponse invalide de SoleasPay",
        };
      }

      return data;
    } catch (error) {
      console.error("❌ SoleasPay verifyPayment error:", error);
      return {
        success: false,
        message: "Erreur de connexion à SoleasPay",
      };
    }
  }

  verifyWebhookSignature(secretHash: string, receivedPrivateKey: string): boolean {
    try {
      const expectedHash = crypto
        .createHash("sha512")
        .update(secretHash)
        .digest("hex");
      
      return expectedHash === receivedPrivateKey;
    } catch (error) {
      console.error("❌ SoleasPay signature verification error:", error);
      return false;
    }
  }
}

export const soleaspay = new SoleasPayClient();
