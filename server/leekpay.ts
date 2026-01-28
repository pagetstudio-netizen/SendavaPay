import crypto from "crypto";

const LEEKPAY_API_URL = "https://leekpay.fr/api/v1";

// Clé publique pour vérifier les signatures webhook
const LEEKPAY_PUBLIC_KEY = "pk_live_FhkRT29oZFuAr4WnhMqKFvmT3bwPyYrb";

interface CheckoutParams {
  amount: number;
  currency: "XOF" | "XAF" | "CDF" | "EUR" | "USD";
  description: string;
  return_url: string;
  customer_email?: string;
}

interface CheckoutResponse {
  success: boolean;
  data?: {
    id: string;
    payment_url: string;
    status: string;
    amount: number;
    currency: string;
    expires_at?: string;
    return_url?: string;
  };
  error?: string;
}

interface PaymentStatusResponse {
  success: boolean;
  data?: {
    id: string;
    amount: number;
    currency: string;
    status: "pending" | "processing" | "completed" | "failed" | "cancelled" | "expired";
    customer_email?: string;
    description?: string;
    created_at: string;
  };
  error?: string;
}

// Format du webhook LeekPay
export interface LeekPayWebhookPayload {
  event: "payment.success" | "payment.failed" | "payment.cancelled" | "payment.expired";
  transaction: {
    id: number;
    amount: number;
    currency: string;
    status: string;
    customer_email?: string;
    description?: string;
    created_at: string;
  };
}

export class LeekPayService {
  private secretKey: string;
  private publicKey: string;

  constructor() {
    // Clé secrète pour l'authentification API (Bearer token)
    this.secretKey = process.env.LEEKPAY_SECRET_KEY || process.env.SK_LIVE || "";
    // Clé publique pour vérifier les signatures webhook
    this.publicKey = LEEKPAY_PUBLIC_KEY;
    // Note: LeekPay n'est plus utilisé - SoleasPay est le fournisseur principal
  }

  async createCheckout(params: CheckoutParams): Promise<CheckoutResponse> {
    try {
      console.log("LeekPay: Creating checkout with params:", JSON.stringify(params));
      console.log("LeekPay: API URL:", `${LEEKPAY_API_URL}/checkout`);
      console.log("LeekPay: Secret key configured:", this.secretKey ? "Yes (length: " + this.secretKey.length + ")" : "No");
      
      const response = await fetch(`${LEEKPAY_API_URL}/checkout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      const responseText = await response.text();
      console.log("LeekPay: Response status:", response.status);
      console.log("LeekPay: Response body:", responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("LeekPay: Failed to parse response as JSON");
        return {
          success: false,
          error: "Réponse invalide de LeekPay",
        };
      }
      
      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || "Erreur lors de la création du paiement",
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      console.error("LeekPay createCheckout error:", error);
      return {
        success: false,
        error: "Erreur de connexion à LeekPay",
      };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    try {
      const response = await fetch(`${LEEKPAY_API_URL}/checkout/${paymentId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.secretKey}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || "Erreur lors de la vérification du statut",
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      console.error("LeekPay getPaymentStatus error:", error);
      return {
        success: false,
        error: "Erreur de connexion à LeekPay",
      };
    }
  }

  // Vérifier la signature du webhook avec la clé publique
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      // Selon la documentation, la signature est calculée avec la clé publique
      const expectedSignature = crypto
        .createHmac("sha256", this.publicKey)
        .update(payload)
        .digest("hex");
      
      console.log("LeekPay: Verifying webhook signature");
      console.log("LeekPay: Received signature:", signature);
      console.log("LeekPay: Expected signature:", expectedSignature);
      
      // Comparaison sécurisée des signatures
      if (signature.length !== expectedSignature.length) {
        console.log("LeekPay: Signature length mismatch");
        return false;
      }
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error("LeekPay signature verification error:", error);
      return false;
    }
  }
}

export const leekpay = new LeekPayService();
