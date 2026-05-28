import crypto from "crypto";

/**
 * SendavaPay SDK v2.0 — Intégration côté serveur (Node.js)
 *
 * Ce SDK est destiné à votre backend (Node.js).
 * Pour le paiement intégré côté frontend, utilisez le widget navigateur :
 *   <script src="https://sendavapay.com/sdk/sendavapay.js"></script>
 *
 * NOUVEAU FLOW (v2) :
 * ──────────────────
 * 1. Votre backend appelle createPayment() → reçoit { paymentToken, reference }
 * 2. Votre frontend passe le paymentToken au widget :
 *    SendavaPay.init({ token: paymentToken, onSuccess: fn, onFailed: fn })
 * 3. Le widget affiche l'UI de paiement directement sur votre site
 * 4. Votre backend vérifie le statut via getPaymentStatus(reference)
 * 5. Ou attendez le webhook (recommandé)
 *
 * PAYS ET OPÉRATEURS SUPPORTÉS
 * ─────────────────────────────
 * | Pays              | Code | Opérateur(s)             | Devise | OTP requis |
 * |-------------------|------|--------------------------|--------|------------|
 * | Togo              | TG   | TMoney, Moov             | XOF    | Non        |
 * | Bénin             | BJ   | MTN, Moov                | XOF    | Non        |
 * | Cameroun          | CM   | MTN, Orange              | XAF    | Non        |
 * | Burkina Faso      | BF   | Orange Money             | XOF    | OUI ★      |
 * | Côte d'Ivoire     | CI   | Orange Money             | XOF    | OUI ★      |
 * | Côte d'Ivoire     | CI   | MTN, Moov, Wave          | XOF    | Non        |
 * | Guinée            | GN   | Orange Money             | GNF    | OUI ★      |
 * | Mali              | ML   | Orange Money             | XOF    | OUI ★      |
 * | Sénégal           | SN   | Orange Money             | XOF    | OUI ★      |
 * | Sénégal           | SN   | Wave                     | XOF    | Non        |
 * | RD Congo          | COD  | Vodacom, Airtel, Orange  | CDF    | Non        |
 * | Congo             | COG  | MTN                      | XAF    | Non        |
 *
 * ★ OTP FLOW — géré automatiquement par le widget
 */
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
        "Authorization": `Bearer ${this.apiKey}`,
        "x-signature": signature,
        "x-timestamp": timestamp,
      },
    };

    if (method === "POST" || method === "PUT") {
      options.body = JSON.stringify(payload);
    }

    const res = await fetch(url, options);
    return res.json();
  }

  /**
   * Créer un paiement côté serveur.
   * Retourne un paymentToken à passer au widget frontend.
   *
   * @param {Object} params
   * @param {number} params.amount - Montant (requis)
   * @param {string} [params.currency] - Devise (défaut: XOF)
   * @param {string} [params.description] - Description
   * @param {string} [params.externalReference] - Votre référence interne (anti-doublon)
   * @param {string} [params.customerName] - Nom du client
   * @param {string} [params.customerEmail] - Email du client
   * @param {string} [params.customerPhone] - Téléphone du client
   * @param {string} [params.payerCountry] - Pays préféré (TG, BJ, SN, CI…)
   * @param {string} [params.webhookUrl] - URL de notification webhook
   * @param {Object} [params.metadata] - Données supplémentaires
   * @returns {Promise<{success: boolean, data: {reference, paymentToken, expiresAt, amount, currency, widget}}>}
   */
  async createPayment({ amount, currency, description, externalReference, customerName, customerEmail, customerPhone, payerCountry, webhookUrl, metadata }) {
    return this.request("POST", "/api/sdk/v1/create-payment", {
      amount,
      currency,
      description,
      externalReference,
      customerName,
      customerEmail,
      customerPhone,
      payerCountry,
      webhookUrl,
      metadata,
    });
  }

  /**
   * Vérifier le statut d'un paiement (polling).
   * Préférez les webhooks pour une intégration robuste.
   *
   * @param {string} reference - Référence de la transaction
   * @returns {Promise<{success: boolean, data: {reference, status, amount, currency, completedAt}}>}
   */
  async getPaymentStatus(reference) {
    return this.request("GET", `/api/sdk/v1/payment-status/${reference}`);
  }

  /**
   * Vérification détaillée d'un paiement (avec toutes les infos client).
   * @param {string} reference
   */
  async verifyPayment(reference) {
    return this.request("POST", "/api/sdk/v1/verify-payment", { reference });
  }

  /**
   * Attendre la confirmation d'un paiement (polling).
   *
   * @param {string} reference
   * @param {number} [intervalMs=3000] - Intervalle en ms
   * @param {number} [timeoutMs=120000] - Délai maximum (2 min par défaut)
   * @param {Function} [onStatus] - Callback à chaque vérification
   * @returns {Promise<Object>} Résultat final
   */
  async waitForPayment(reference, intervalMs = 3000, timeoutMs = 120000, onStatus) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const result = await this.getPaymentStatus(reference);
      if (onStatus) onStatus(result);
      const status = result?.data?.status || result?.status;
      if (status === "completed" || status === "failed" || status === "cancelled") {
        return result;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    return { success: false, status: "TIMEOUT", reference, message: "Délai dépassé — paiement non confirmé" };
  }

  /**
   * Demander un retrait vers Mobile Money.
   *
   * @param {Object} params
   * @param {number} params.amount
   * @param {string} params.phoneNumber
   * @param {string} params.operator - MTN, Moov, Orange, TMoney…
   * @param {string} params.country - TG, BJ, SN, CI…
   * @param {string} [params.currency]
   * @param {string} [params.description]
   * @param {string} [params.externalReference]
   */
  async createWithdraw({ amount, phoneNumber, operator, country, currency = "XOF", description, externalReference }) {
    return this.request("POST", "/api/sdk/v1/withdraw", {
      amount, phoneNumber, operator, country, currency, description, externalReference,
    });
  }

  /**
   * Obtenir le solde des wallets.
   * @param {string} [country] - Filtrer par pays (TG, BJ…)
   */
  async getBalance(country) {
    const path = country ? `/api/sdk/v1/balance?country=${country}` : "/api/sdk/v1/balance";
    return this.request("GET", path);
  }

  /**
   * Obtenir l'historique des transactions.
   */
  async getTransactions() {
    return this.request("GET", "/api/sdk/v1/transactions");
  }

  /**
   * Configurer l'URL de webhook.
   * @param {string} webhookUrl
   */
  async setWebhook(webhookUrl) {
    return this.request("PUT", "/api/sdk/v1/webhook", { webhookUrl });
  }
}

export default SendavaPay;
