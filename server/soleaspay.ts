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
  paymentGateway?: string;
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
  // Sénégal — via OmniPay
  { id: 57, name: "OM SN", description: "Orange Money", country: "Sénégal", countryCode: "SN", currency: "XOF", operator: "Orange", paymentGateway: "omnipay" },
  { id: 58, name: "WAVE SN", description: "Wave", country: "Sénégal", countryCode: "SN", currency: "XOF", operator: "Wave", paymentGateway: "omnipay" },
  { id: 59, name: "MIXX SN", description: "Mixx", country: "Sénégal", countryCode: "SN", currency: "XOF", operator: "Mixx", paymentGateway: "omnipay" },
  // Mali — via OmniPay
  { id: 60, name: "OM ML", description: "Orange Money", country: "Mali", countryCode: "ML", currency: "XOF", operator: "Orange", paymentGateway: "omnipay" },
];

export const SOLEASPAY_COUNTRIES = [
  { code: "BJ", name: "Bénin", flag: "🇧🇯", currency: "XOF" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", currency: "XOF" },
  { code: "CM", name: "Cameroun", flag: "🇨🇲", currency: "XAF" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF" },
  { code: "COG", name: "Congo Brazzaville", flag: "🇨🇬", currency: "XAF" },
  { code: "COD", name: "RDC", flag: "🇨🇩", currency: "CDF" },
  { code: "ML", name: "Mali", flag: "🇲🇱", currency: "XOF" },
  { code: "SN", name: "Sénégal", flag: "🇸🇳", currency: "XOF" },
  { code: "TG", name: "Togo", flag: "🇹🇬", currency: "XOF" },
];

export function formatPhoneForSoleasPay(phone: string, countryCode: string): string {
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

  let cleaned = phone.replace(/[\s\-\(\)\.]/g, "");

  if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
  else if (cleaned.startsWith("00")) cleaned = cleaned.slice(2);

  const prefix = PREFIXES[countryCode.toUpperCase()] || "";

  if (prefix) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.slice(prefix.length);
    }
    while (cleaned.startsWith("0")) cleaned = cleaned.slice(1);
    cleaned = "+" + prefix + cleaned;
  }

  return cleaned;
}

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

export interface WithdrawableService {
  id: number;
  name: string;
  description: string;
  country: string;
  countryCode: string;
  currency: string;
  operator: string;
}

// IMPORTANT: Only services with "withdrawable": true in SoleasPay API are included here
// Based on official SoleasPay documentation mapping
export const WITHDRAWABLE_SERVICES: WithdrawableService[] = [
  // Cameroun - Only MTN supports withdrawal (withdrawable: true)
  { id: 1, name: "MOMO CM", description: "MTN Mobile Money", country: "Cameroun", countryCode: "CM", currency: "XAF", operator: "MTN" },
  // Côte d'Ivoire - Only Wave supports withdrawal (withdrawable: true)
  { id: 32, name: "WAVE CI", description: "Wave", country: "Côte d'Ivoire", countryCode: "CI", currency: "XOF", operator: "Wave" },
  // Bénin - Only MTN supports withdrawal (withdrawable: true)
  { id: 35, name: "MOMO BJ", description: "MTN Money", country: "Bénin", countryCode: "BJ", currency: "XOF", operator: "MTN" },
  // Togo - Only T-Money supports withdrawal (withdrawable: true)
  { id: 37, name: "T-MONEY TG", description: "T-Money", country: "Togo", countryCode: "TG", currency: "XOF", operator: "TMoney" },
  // RDC - All three support withdrawal (withdrawable: true)
  { id: 52, name: "VODACOM COD", description: "Vodacom M-Pesa", country: "RDC", countryCode: "COD", currency: "CDF", operator: "Vodacom" },
  { id: 53, name: "AIRTEL COD", description: "Airtel Money", country: "RDC", countryCode: "COD", currency: "CDF", operator: "Airtel" },
  { id: 54, name: "OM COD", description: "Orange Money", country: "RDC", countryCode: "COD", currency: "CDF", operator: "Orange" },
  // Congo Brazzaville - Both support withdrawal (withdrawable: true)
  { id: 55, name: "AIRTEL COG", description: "Airtel Money", country: "Congo Brazzaville", countryCode: "COG", currency: "XAF", operator: "Airtel" },
  { id: 56, name: "MOMO COG", description: "MTN Money", country: "Congo Brazzaville", countryCode: "COG", currency: "XAF", operator: "MTN" },
];

export function getWithdrawableServiceByCountryAndOperator(countryCode: string, operatorOrId: string): WithdrawableService | undefined {
  const countryUpper = countryCode.toUpperCase();
  const operatorLower = operatorOrId.toLowerCase();
  
  // First try to match by service ID
  const serviceId = parseInt(operatorOrId);
  if (!isNaN(serviceId)) {
    const byId = WITHDRAWABLE_SERVICES.find(s => s.id === serviceId && s.countryCode === countryUpper);
    if (byId) return byId;
  }
  
  // Then try to match by operator name
  return WITHDRAWABLE_SERVICES.find(s => 
    s.countryCode === countryUpper && 
    (s.operator.toLowerCase() === operatorLower || 
     s.name.toLowerCase().includes(operatorLower) ||
     operatorLower.includes(s.operator.toLowerCase()))
  );
}

export function getWithdrawableServicesByCountry(countryCode: string): WithdrawableService[] {
  const countryUpper = countryCode.toUpperCase();
  return WITHDRAWABLE_SERVICES.filter(s => s.countryCode === countryUpper);
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
  otp?: string;
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
    wave_launch_url?: string;
    payment_url?: string;
    redirect_url?: string;
  };
  message?: string;
  wave_launch_url?: string;
  payment_url?: string;
  redirect_url?: string;
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

interface AuthResponse {
  token: string;
  data?: {
    expireAt: string;
  };
}

interface WithdrawParams {
  wallet: string;
  amount: number;
  currency?: string;
  serviceId: number;
}

interface WithdrawResponse {
  success: boolean;
  code?: number;
  status?: string;
  created_at?: string;
  data?: {
    reference: string;
    external_reference: string;
    transaction_reference: string;
    amount: number;
    currency: string;
    operation: string;
  };
  message?: string;
}

interface TransactionDetailsResponse {
  ext_id: string;
  amount: number;
  wallet: string;
  currency: string;
  operation: {
    id: number;
    name: string;
    description: string;
  };
  service: {
    id: number;
    name: string;
    type: string;
    is_active: boolean;
  };
  status: string;
  short_description: string | null;
  proceed_at: string;
  is_verif: boolean;
  other: string;
}

export class SoleasPayClient {
  private apiKey: string;
  private secretKey: string;
  private bearerToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.apiKey = process.env.SOLEASPAY_API_KEY || "";
    this.secretKey = process.env.SOLEASPAY_SECRET_KEY || "";
    
    if (!this.apiKey) {
      console.warn("SoleasPay: Clé API non configurée (SOLEASPAY_API_KEY)");
    }
    if (!this.secretKey) {
      console.warn("SoleasPay: Clé secrète non configurée (SOLEASPAY_SECRET_KEY)");
    }
  }

  async getAuthToken(): Promise<string | null> {
    if (this.bearerToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.bearerToken;
    }

    try {
      console.log("🔐 SoleasPay: Obtention du token d'authentification...");
      
      const response = await fetch(`${SOLEASPAY_API_URL}/api/action/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          public_apikey: this.apiKey,
          private_secretkey: this.secretKey,
        }),
      });

      const responseText = await response.text();
      console.log("🔐 SoleasPay: Auth response status:", response.status);
      
      let data: AuthResponse;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("❌ SoleasPay: Réponse JSON d'auth invalide");
        return null;
      }

      if (data.token) {
        this.bearerToken = data.token;
        this.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);
        console.log("✅ SoleasPay: Token obtenu, expire à:", this.tokenExpiry);
        return this.bearerToken;
      }

      console.error("❌ SoleasPay: Token non reçu");
      return null;
    } catch (error) {
      console.error("❌ SoleasPay auth error:", error);
      return null;
    }
  }

  async collectPayment(params: CollectPaymentParams): Promise<CollectPaymentResponse> {
    try {
      console.log("📡 SoleasPay: Initialisation du paiement...");
      console.log("📡 SoleasPay: Service ID:", params.serviceId);
      console.log("📡 SoleasPay: Wallet:", params.wallet);
      console.log("📡 SoleasPay: Amount:", params.amount, params.currency);
      console.log("📡 SoleasPay: Order ID:", params.orderId);

      let cleanWallet = params.wallet.replace(/[\s\-\(\)]/g, '');
      if (cleanWallet.startsWith('+')) cleanWallet = cleanWallet.substring(1);
      console.log("📡 SoleasPay: Clean wallet:", cleanWallet);

      const response = await fetch(`${SOLEASPAY_API_URL}/api/agent/bills/v3`, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "operation": "2",
          "service": params.serviceId.toString(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: cleanWallet,
          amount: params.amount,
          currency: params.currency,
          order_id: params.orderId,
          description: params.description,
          payer: params.payer,
          payerEmail: params.payerEmail,
          successUrl: params.successUrl,
          failureUrl: params.failureUrl,
          ...(params.otp ? { otp: params.otp } : {}),
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

  async withdraw(params: WithdrawParams): Promise<WithdrawResponse> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return {
          success: false,
          message: "Impossible d'obtenir le token d'authentification SoleasPay",
        };
      }

      console.log("💸 SoleasPay: Initialisation du retrait...");
      console.log("💸 SoleasPay: Service ID:", params.serviceId);
      console.log("💸 SoleasPay: Wallet:", params.wallet);
      console.log("💸 SoleasPay: Amount:", params.amount, params.currency || "XOF");

      const response = await fetch(`${SOLEASPAY_API_URL}/api/action/account/withdraw`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "operation": "4",
          "service": params.serviceId.toString(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: params.wallet,
          amount: params.amount,
          currency: params.currency || "XOF",
        }),
      });

      const responseText = await response.text();
      console.log("💸 SoleasPay: Withdraw response status:", response.status);
      console.log("💸 SoleasPay: Withdraw response body:", responseText);

      let data: WithdrawResponse;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("❌ SoleasPay: Réponse JSON de retrait invalide");
        return {
          success: false,
          message: "Réponse invalide de SoleasPay",
        };
      }

      return data;
    } catch (error) {
      console.error("❌ SoleasPay withdraw error:", error);
      return {
        success: false,
        message: "Erreur de connexion à SoleasPay",
      };
    }
  }

  async getTransactionDetails(reference: string): Promise<TransactionDetailsResponse | null> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.error("❌ SoleasPay: Impossible d'obtenir le token");
        return null;
      }

      console.log("🔍 SoleasPay: Récupération des détails de transaction:", reference);

      const response = await fetch(`${SOLEASPAY_API_URL}/api/user/history/${reference}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      const responseText = await response.text();
      console.log("🔍 SoleasPay: Transaction details response status:", response.status);
      console.log("🔍 SoleasPay: Transaction details response body:", responseText);

      if (!response.ok) {
        console.error("❌ SoleasPay: Erreur lors de la récupération des détails");
        return null;
      }

      let data: TransactionDetailsResponse;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("❌ SoleasPay: Réponse JSON invalide");
        return null;
      }

      return data;
    } catch (error) {
      console.error("❌ SoleasPay getTransactionDetails error:", error);
      return null;
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
