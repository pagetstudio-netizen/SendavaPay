<?php

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
        $data = $timestamp . "." . json_encode($payload);
        return hash_hmac("sha256", $data, $this->apiSecret);
    }

    private function request($method, $path, $payload = []) {
        $timestamp = (string) time();
        $signature = $this->sign($payload, $timestamp);
        $url = $this->baseUrl . $path;

        $headers = [
            "Content-Type: application/json",
            "x-api-key: {$this->apiKey}",
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
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            return ["success" => false, "status" => "ERROR", "message" => "Erreur cURL: " . $error];
        }

        return json_decode($response, true);
    }

    /**
     * Initiate a Mobile Money payment.
     *
     * SUPPORTED COUNTRIES, OPERATORS & OTP REQUIREMENTS
     * ─────────────────────────────────────────────────
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
     * ★ OTP FLOW (Orange Money — BF, CI, GN, ML, SN)
     * ────────────────────────────────────────────────
     * 1. Appelez createPayment() → la réponse contient { "otpRequired": true, "reference": "..." }
     * 2. Affichez un champ de saisie OTP dans votre interface
     * 3. Le client reçoit un code SMS à usage unique — collectez-le
     * 4. Appelez confirmOtp($reference, $otp) pour soumettre le code
     * 5. Vérifiez le statut final avec verifyPayment() ou attendez le webhook
     *
     * @param array $data
     *   - amount: float (requis) - Montant à débiter
     *   - phoneNumber: string (requis) - Numéro mobile du client
     *   - operator: string (requis) - MTN, Moov, Orange, TMoney, Wave, Vodacom, Airtel
     *   - country: string (requis) - TG, BJ, BF, CM, CI, GN, ML, SN, COD, COG
     *   - currency: string (optionnel) - Détectée automatiquement selon le pays
     *   - customerName: string (optionnel)
     *   - customerEmail: string (optionnel)
     *   - description: string (optionnel)
     *   - callbackUrl: string (optionnel) - Webhook de notification de statut
     *   - redirectUrl: string (optionnel) - Redirection après paiement
     *   - metadata: array (optionnel)
     *   - otp: string (optionnel) - Code OTP pour Orange CI / Orange BF avec PayDunya
     *   - provider: string (optionnel) - "soleaspay" (défaut, USSD) | "winipayer" (checkout) | "paydunya" (SoftPay direct USSD/redirect)
     * @return array Résultat du paiement — inclut otpRequired:true pour les opérateurs Orange Money
     */
    public function createPayment($data) {
        return $this->request("POST", "/api/sdk/payment", $data);
    }

    /**
     * Confirmer un code OTP pour les paiements Orange Money (BF, CI, GN, ML, SN).
     * À appeler après createPayment() lorsque la réponse contient { "otpRequired": true }.
     * Le client reçoit un code SMS — collectez-le et passez-le ici.
     *
     * @param string $reference Référence de la transaction (depuis createPayment)
     * @param string $otp Code OTP saisi par le client
     * @return array Résultat de la confirmation avec le statut mis à jour
     */
    public function confirmOtp($reference, $otp) {
        return $this->request("POST", "/api/sdk/confirm-otp", [
            "reference" => $reference,
            "otp" => $otp,
        ]);
    }

    /**
     * Initiate a payment via WiniPayer (checkout redirect)
     * Creates a checkout link - redirect the customer to checkoutUrl
     *
     * @param array $data Required: amount
     *   - amount: float - Amount to charge
     *   - description: string (optional)
     *   - customerName: string (optional)
     *   - customerEmail: string (optional)
     *   - phoneNumber: string (optional)
     *   - callbackUrl: string (optional) - Webhook for status updates
     *   - redirectUrl: string (optional) - Return URL after payment
     *   - metadata: array (optional)
     * @return array Result with checkoutUrl to redirect customer
     */
    public function createWiniPayerPayment($data) {
        $data["provider"] = "winipayer";
        return $this->request("POST", "/api/sdk/payment", $data);
    }

    /**
     * Request a withdrawal to a mobile money account
     */
    public function createWithdraw($data) {
        return $this->request("POST", "/api/sdk/withdraw", $data);
    }

    /**
     * Verify payment status - checks with payment provider (SoleasPay or WiniPayer)
     */
    public function verifyPayment($reference) {
        return $this->request("POST", "/api/sdk/verify", ["reference" => $reference]);
    }

    /**
     * Poll payment status until completed or timeout
     * Works with both SoleasPay and WiniPayer transactions
     *
     * @param string $reference Transaction reference
     * @param int $intervalSec Polling interval in seconds (default: 3)
     * @param int $timeoutSec Maximum wait time in seconds (default: 120)
     * @param callable|null $onStatus Callback for each status check
     * @return array Final payment result
     */
    public function waitForPayment($reference, $intervalSec = 3, $timeoutSec = 120, $onStatus = null) {
        $start = time();
        while (time() - $start < $timeoutSec) {
            $result = $this->verifyPayment($reference);
            if ($onStatus) {
                $onStatus($result);
            }
            if (in_array($result["status"] ?? "", ["SUCCESS", "FAILED", "CANCELLED", "EXPIRED"])) {
                return $result;
            }
            sleep($intervalSec);
        }
        return ["success" => false, "status" => "TIMEOUT", "reference" => $reference, "message" => "Timeout - le client n'a pas confirmé"];
    }

    public function getTransaction($reference) {
        return $this->request("GET", "/api/sdk/transaction/" . urlencode($reference));
    }

    public function getTransactions() {
        return $this->request("GET", "/api/sdk/transactions");
    }

    public function getBalance() {
        return $this->request("GET", "/api/sdk/balance");
    }
}
