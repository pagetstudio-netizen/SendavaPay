<?php

/**
 * SendavaPay SDK v2.0 — Intégration côté serveur (PHP)
 *
 * Ce SDK est destiné à votre backend PHP.
 * Pour le paiement intégré côté frontend, utilisez le widget :
 *   <script src="https://sendavapay.com/sdk/sendavapay.js"></script>
 *
 * NOUVEAU FLOW (v2) :
 * ──────────────────
 * 1. Votre backend PHP appelle createPayment() → reçoit { paymentToken, reference }
 * 2. Passez paymentToken à votre frontend :
 *    SendavaPay.init({ token: "<?= $paymentToken ?>", onSuccess: fn, onFailed: fn })
 * 3. Le widget affiche l'UI de paiement directement sur votre site
 * 4. Attendez le webhook (recommandé) ou appelez getPaymentStatus($reference)
 */
class SendavaPay {
    private $apiKey;
    private $apiSecret;
    private $baseUrl;

    public function __construct($apiKey, $apiSecret, $baseUrl = "https://sendavapay.com") {
        $this->apiKey = $apiKey;
        $this->apiSecret = $apiSecret;
        $this->baseUrl = rtrim($baseUrl, "/");
    }

    private function sign($payload, $timestamp) {
        $data = $timestamp . "." . json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return hash_hmac("sha256", $data, $this->apiSecret);
    }

    private function request($method, $path, $payload = []) {
        $timestamp = (string) time();
        $signature = $this->sign($payload, $timestamp);
        $url = $this->baseUrl . $path;

        $headers = [
            "Content-Type: application/json",
            "Authorization: Bearer {$this->apiKey}",
            "x-signature: {$signature}",
            "x-timestamp: {$timestamp}",
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

        if ($method === "POST") {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        } elseif ($method === "PUT") {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            return ["success" => false, "error" => "Erreur cURL: " . $error];
        }

        return json_decode($response, true);
    }

    /**
     * Créer un paiement côté serveur.
     * Retourne un paymentToken à passer au widget frontend.
     *
     * @param array $data
     *   - amount: float (requis) — Montant
     *   - currency: string (optionnel, défaut XOF)
     *   - description: string (optionnel)
     *   - externalReference: string (optionnel) — Votre référence interne (anti-doublon)
     *   - customerName: string (optionnel)
     *   - customerEmail: string (optionnel)
     *   - customerPhone: string (optionnel)
     *   - payerCountry: string (optionnel) — TG, BJ, SN, CI…
     *   - webhookUrl: string (optionnel) — URL de notification
     *   - metadata: array (optionnel)
     * @return array { success, data: { reference, paymentToken, expiresAt, amount, currency } }
     */
    public function createPayment($data) {
        return $this->request("POST", "/api/sdk/v1/create-payment", $data);
    }

    /**
     * Vérifier le statut d'un paiement.
     * Préférez les webhooks pour une intégration robuste.
     *
     * @param string $reference Référence de la transaction
     * @return array { success, data: { reference, status, amount, currency, completedAt } }
     */
    public function getPaymentStatus($reference) {
        return $this->request("GET", "/api/sdk/v1/payment-status/" . urlencode($reference));
    }

    /**
     * Vérification détaillée d'un paiement.
     * @param string $reference
     * @return array
     */
    public function verifyPayment($reference) {
        return $this->request("POST", "/api/sdk/v1/verify-payment", ["reference" => $reference]);
    }

    /**
     * Attendre la confirmation d'un paiement (polling).
     *
     * @param string $reference
     * @param int $intervalSec Intervalle en secondes (défaut: 3)
     * @param int $timeoutSec Délai maximum (défaut: 120)
     * @param callable|null $onStatus Callback à chaque vérification
     * @return array Résultat final
     */
    public function waitForPayment($reference, $intervalSec = 3, $timeoutSec = 120, $onStatus = null) {
        $start = time();
        while (time() - $start < $timeoutSec) {
            $result = $this->getPaymentStatus($reference);
            if ($onStatus) {
                $onStatus($result);
            }
            $status = $result["data"]["status"] ?? $result["status"] ?? "";
            if (in_array($status, ["completed", "failed", "cancelled"])) {
                return $result;
            }
            sleep($intervalSec);
        }
        return ["success" => false, "status" => "TIMEOUT", "reference" => $reference, "message" => "Délai dépassé — paiement non confirmé"];
    }

    /**
     * Demander un retrait vers Mobile Money.
     *
     * @param array $data
     *   - amount: float (requis)
     *   - phoneNumber: string (requis)
     *   - operator: string (requis) — MTN, Moov, Orange, TMoney…
     *   - country: string (requis) — TG, BJ, SN, CI…
     *   - currency: string (optionnel, défaut XOF)
     *   - description: string (optionnel)
     *   - externalReference: string (optionnel)
     * @return array
     */
    public function createWithdraw($data) {
        return $this->request("POST", "/api/sdk/v1/withdraw", $data);
    }

    /**
     * Obtenir le solde des wallets.
     * @param string|null $country Filtrer par pays (TG, BJ…)
     * @return array
     */
    public function getBalance($country = null) {
        $path = "/api/sdk/v1/balance" . ($country ? "?country=" . urlencode($country) : "");
        return $this->request("GET", $path);
    }

    /**
     * Obtenir l'historique des transactions.
     * @return array
     */
    public function getTransactions() {
        return $this->request("GET", "/api/sdk/v1/transactions");
    }

    /**
     * Configurer l'URL de webhook.
     * @param string $webhookUrl
     * @return array
     */
    public function setWebhook($webhookUrl) {
        return $this->request("PUT", "/api/sdk/v1/webhook", ["webhookUrl" => $webhookUrl]);
    }
}
