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

  async createPayment({ amount, currency = "XOF", customerName, customerEmail, customerPhone, description, callbackUrl, redirectUrl, metadata }) {
    return this.request("POST", "/api/sdk/payment", {
      amount,
      currency,
      customerName,
      customerEmail,
      customerPhone,
      description,
      callbackUrl,
      redirectUrl,
      metadata,
    });
  }

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

  async verifyPayment(reference) {
    return this.request("POST", "/api/sdk/verify", { reference });
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
