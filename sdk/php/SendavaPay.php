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

    public function createPayment($data) {
        return $this->request("POST", "/api/sdk/payment", $data);
    }

    public function createWithdraw($data) {
        return $this->request("POST", "/api/sdk/withdraw", $data);
    }

    public function verifyPayment($reference) {
        return $this->request("POST", "/api/sdk/verify", ["reference" => $reference]);
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
