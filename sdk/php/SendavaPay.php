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
     * Initiate a payment via SoleasPay (USSD push) or WiniPayer (checkout redirect)
     *
     * For SoleasPay (default): sends USSD push to customer's phone
     * For WiniPayer: returns a checkout URL to redirect the customer
     *
     * @param array $data Required: amount, phoneNumber, operator, country
     *   - amount: float - Amount to charge
     *   - phoneNumber: string - Customer's mobile number (required for SoleasPay, optional for WiniPayer)
     *   - operator: string - MTN, Moov, Orange, TMoney, Wave, Vodacom, Airtel (required for SoleasPay)
     *   - country: string - Country code: TG, BJ, BF, CM, CI, COD, COG (required for SoleasPay)
     *   - currency: string (optional) - Auto-detected from country
     *   - customerName: string (optional)
     *   - customerEmail: string (optional)
     *   - description: string (optional)
     *   - callbackUrl: string (optional) - Webhook for status updates
     *   - redirectUrl: string (optional) - Redirect after payment
     *   - metadata: array (optional)
     *   - provider: string (optional) - "soleaspay" (default) or "winipayer"
     * @return array Payment result with reference for verification
     */
    public function createPayment($data) {
        return $this->request("POST", "/api/sdk/payment", $data);
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
