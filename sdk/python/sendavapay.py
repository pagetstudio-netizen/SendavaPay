import json
import hmac
import hashlib
import time
import requests


class SendavaPay:
    def __init__(self, api_key, api_secret, base_url="https://sendavapay.com"):
        self.api_key = api_key
        self.api_secret = api_secret.encode("utf-8")
        self.base_url = base_url.rstrip("/")

    def sign(self, payload, timestamp):
        data = f"{timestamp}.{json.dumps(payload, separators=(',', ':'))}"
        return hmac.new(
            self.api_secret,
            data.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    def request(self, method, path, payload=None):
        if payload is None:
            payload = {}

        timestamp = str(int(time.time()))
        signature = self.sign(payload, timestamp)
        url = f"{self.base_url}{path}"

        headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
            "x-signature": signature,
            "x-timestamp": timestamp,
        }

        try:
            if method == "POST":
                res = requests.post(url, json=payload, headers=headers, timeout=30)
            else:
                res = requests.get(url, headers=headers, timeout=30)
            return res.json()
        except requests.exceptions.RequestException as e:
            return {"success": False, "status": "ERROR", "message": str(e)}

    def create_payment(self, amount, phone_number=None, operator=None, country=None,
                       currency=None, customer_name=None,
                       customer_email=None, description=None,
                       callback_url=None, redirect_url=None, metadata=None,
                       provider=None):
        """
        Initiate a payment via SoleasPay (USSD) or WiniPayer (checkout redirect).

        Args:
            amount: Amount to charge
            phone_number: Customer's mobile number (required for SoleasPay, optional for WiniPayer)
            operator: Mobile operator - MTN, Moov, Orange, TMoney, Wave, Vodacom, Airtel (required for SoleasPay)
            country: Country code - TG, BJ, BF, CM, CI, COD, COG (required for SoleasPay)
            currency: Currency (auto-detected from country if not set)
            customer_name: Customer name (optional)
            customer_email: Customer email (optional)
            description: Payment description (optional)
            callback_url: Webhook URL for status updates (optional)
            redirect_url: Redirect URL after payment (optional)
            metadata: Additional data dict (optional)
            provider: "soleaspay" (default, USSD) or "winipayer" (checkout redirect)

        Returns:
            dict: Payment result with reference for verification.
                  For WiniPayer, includes checkoutUrl to redirect customer.
        """
        payload = {"amount": amount}
        if phone_number:
            payload["phoneNumber"] = phone_number
        if operator:
            payload["operator"] = operator
        if country:
            payload["country"] = country
        if currency:
            payload["currency"] = currency
        if customer_name:
            payload["customerName"] = customer_name
        if customer_email:
            payload["customerEmail"] = customer_email
        if description:
            payload["description"] = description
        if callback_url:
            payload["callbackUrl"] = callback_url
        if redirect_url:
            payload["redirectUrl"] = redirect_url
        if metadata:
            payload["metadata"] = metadata
        if provider:
            payload["provider"] = provider
        return self.request("POST", "/api/sdk/payment", payload)

    def create_winipayer_payment(self, amount, description=None,
                                 customer_name=None, customer_email=None,
                                 phone_number=None, callback_url=None,
                                 redirect_url=None, metadata=None):
        """
        Initiate a payment via WiniPayer (checkout redirect).
        Returns a checkout URL to redirect the customer.

        Args:
            amount: Amount to charge
            description: Payment description (optional)
            customer_name: Customer name (optional)
            customer_email: Customer email (optional)
            phone_number: Customer phone number (optional)
            callback_url: Webhook URL for status updates (optional)
            redirect_url: Return URL after successful payment (optional)
            metadata: Additional data dict (optional)

        Returns:
            dict: Result with checkoutUrl to redirect customer
        """
        return self.create_payment(
            amount=amount,
            phone_number=phone_number,
            description=description,
            customer_name=customer_name,
            customer_email=customer_email,
            callback_url=callback_url,
            redirect_url=redirect_url,
            metadata=metadata,
            provider="winipayer",
        )

    def create_withdraw(self, amount, phone_number, operator=None,
                        country=None, currency="XOF", description=None):
        """Request a withdrawal to a mobile money account."""
        return self.request("POST", "/api/sdk/withdraw", {
            "amount": amount,
            "phoneNumber": phone_number,
            "operator": operator,
            "country": country,
            "currency": currency,
            "description": description,
        })

    def verify_payment(self, reference):
        """Verify payment status - checks with payment provider (SoleasPay or WiniPayer)."""
        return self.request("POST", "/api/sdk/verify", {"reference": reference})

    def wait_for_payment(self, reference, interval_sec=3, timeout_sec=120, on_status=None):
        """
        Poll payment status until completed or timeout.
        Works with both SoleasPay and WiniPayer transactions.

        Args:
            reference: Transaction reference from create_payment
            interval_sec: Polling interval in seconds (default: 3)
            timeout_sec: Maximum wait time (default: 120)
            on_status: Callback function for each status check (optional)

        Returns:
            dict: Final payment result
        """
        start = time.time()
        while time.time() - start < timeout_sec:
            result = self.verify_payment(reference)
            if on_status:
                on_status(result)
            status = result.get("status", "")
            if status in ("SUCCESS", "FAILED", "CANCELLED", "EXPIRED"):
                return result
            time.sleep(interval_sec)
        return {
            "success": False,
            "status": "TIMEOUT",
            "reference": reference,
            "message": "Timeout - le client n'a pas confirmé",
        }

    def get_transaction(self, reference):
        return self.request("GET", f"/api/sdk/transaction/{reference}")

    def get_transactions(self):
        return self.request("GET", "/api/sdk/transactions")

    def get_balance(self):
        return self.request("GET", "/api/sdk/balance")
