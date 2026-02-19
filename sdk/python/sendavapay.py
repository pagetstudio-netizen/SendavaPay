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

    def create_payment(self, amount, currency="XOF", customer_name=None,
                       customer_email=None, customer_phone=None,
                       description=None, callback_url=None,
                       redirect_url=None, metadata=None):
        return self.request("POST", "/api/sdk/payment", {
            "amount": amount,
            "currency": currency,
            "customerName": customer_name,
            "customerEmail": customer_email,
            "customerPhone": customer_phone,
            "description": description,
            "callbackUrl": callback_url,
            "redirectUrl": redirect_url,
            "metadata": metadata,
        })

    def create_withdraw(self, amount, phone_number, operator=None,
                        country=None, currency="XOF", description=None):
        return self.request("POST", "/api/sdk/withdraw", {
            "amount": amount,
            "phoneNumber": phone_number,
            "operator": operator,
            "country": country,
            "currency": currency,
            "description": description,
        })

    def verify_payment(self, reference):
        return self.request("POST", "/api/sdk/verify", {"reference": reference})

    def get_transaction(self, reference):
        return self.request("GET", f"/api/sdk/transaction/{reference}")

    def get_transactions(self):
        return self.request("GET", "/api/sdk/transactions")

    def get_balance(self):
        return self.request("GET", "/api/sdk/balance")
