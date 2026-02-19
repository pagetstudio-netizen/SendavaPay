import crypto from "crypto";

class SendavaPay {
  constructor(apiKey, apiSecret, baseUrl = "https://sendavapay.com") {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  sign(payload, timestamp) {
    const data = `${timestamp}.${JSON.stringify(payload)}`;
    return crypto
      .createHmac("sha256", this.apiSecret)
      .update(data)
      .digest("hex");
  }

  async request(method, path, payload = {}) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = this.sign(payload, timestamp);
    const url = `${this.baseUrl}${path}`;
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "x-signature": signature,
        "x-timestamp": timestamp,
      },
    };

    if (method === "POST") {
      options.body = JSON.stringify(payload);
    }

    const res = await fetch(url, options);
    return res.json();
  }

  /**
   * Initiate a payment - sends USSD push directly to customer's phone
   * @param {Object} params
   * @param {number} params.amount - Amount to charge
   * @param {string} params.phoneNumber - Customer's phone number
   * @param {string} params.operator - Mobile operator (MTN, Moov, Orange, TMoney, Wave, Vodacom, Airtel)
   * @param {string} params.country - Country code (TG, BJ, BF, CM, CI, COD, COG)
   * @param {string} [params.currency] - Currency (auto-detected from country if not set)
   * @param {string} [params.customerName] - Customer name
   * @param {string} [params.customerEmail] - Customer email
   * @param {string} [params.description] - Payment description
   * @param {string} [params.callbackUrl] - Webhook URL for payment status updates
   * @param {Object} [params.metadata] - Additional metadata
   * @returns {Promise<Object>} Payment result with reference for verification
   */
  async createPayment({ amount, phoneNumber, operator, country, currency, customerName, customerEmail, description, callbackUrl, redirectUrl, metadata }) {
    return this.request("POST", "/api/sdk/payment", {
      amount,
      phoneNumber,
      operator,
      country,
      currency,
      customerName,
      customerEmail,
      description,
      callbackUrl,
      redirectUrl,
      metadata,
    });
  }

  /**
   * Request a withdrawal to a mobile money account
   */
  async createWithdraw({ amount, phoneNumber, operator, country, currency = "XOF", description }) {
    return this.request("POST", "/api/sdk/withdraw", {
      amount,
      phoneNumber,
      operator,
      country,
      currency,
      description,
    });
  }

  /**
   * Verify payment status - checks with payment provider
   * @param {string} reference - Transaction reference from createPayment
   * @returns {Promise<Object>} Payment status (PROCESSING, SUCCESS, FAILED)
   */
  async verifyPayment(reference) {
    return this.request("POST", "/api/sdk/verify", { reference });
  }

  /**
   * Poll payment status until completed or timeout
   * @param {string} reference - Transaction reference
   * @param {number} [intervalMs=3000] - Polling interval in milliseconds
   * @param {number} [timeoutMs=120000] - Maximum wait time (default 2 minutes)
   * @param {Function} [onStatus] - Callback for each status check
   * @returns {Promise<Object>} Final payment result
   */
  async waitForPayment(reference, intervalMs = 3000, timeoutMs = 120000, onStatus) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const result = await this.verifyPayment(reference);
      if (onStatus) onStatus(result);
      if (result.status === "SUCCESS" || result.status === "FAILED" || result.status === "CANCELLED") {
        return result;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    return { success: false, status: "TIMEOUT", reference, message: "Timeout - le client n'a pas confirmé" };
  }

  async getTransaction(reference) {
    return this.request("GET", `/api/sdk/transaction/${reference}`);
  }

  async getTransactions() {
    return this.request("GET", "/api/sdk/transactions");
  }

  async getBalance() {
    return this.request("GET", "/api/sdk/balance");
  }
}

export default SendavaPay;
