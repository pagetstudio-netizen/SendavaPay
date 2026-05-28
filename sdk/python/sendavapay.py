"""
SendavaPay SDK v2.0 — Intégration côté serveur (Python)

Ce SDK est destiné à votre backend Python.
Pour le paiement intégré côté frontend, utilisez le widget :
  <script src="https://sendavapay.com/sdk/sendavapay.js"></script>

NOUVEAU FLOW (v2) :
──────────────────
1. Votre backend Python appelle create_payment() → reçoit { paymentToken, reference }
2. Passez paymentToken à votre frontend :
   SendavaPay.init({ token: payment_token, onSuccess: fn, onFailed: fn })
3. Le widget affiche l'UI de paiement directement sur votre site
4. Attendez le webhook (recommandé) ou appelez get_payment_status(reference)

PAYS ET OPÉRATEURS SUPPORTÉS
─────────────────────────────
Pays              | Code | Opérateur(s)             | Devise
─────────────────────────────────────────────────────────────
Togo              | TG   | TMoney, Moov             | XOF
Bénin             | BJ   | MTN, Moov                | XOF
Cameroun          | CM   | MTN, Orange              | XAF
Burkina Faso      | BF   | Orange Money             | XOF
Côte d'Ivoire     | CI   | Orange Money, MTN, Moov  | XOF
Guinée            | GN   | Orange Money             | GNF
Mali              | ML   | Orange Money             | XOF
Sénégal           | SN   | Orange Money, Wave       | XOF
RD Congo          | COD  | Vodacom, Airtel, Orange  | CDF
Congo             | COG  | MTN                      | XAF
"""

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
        data = f"{timestamp}.{json.dumps(payload, separators=(',', ':'), ensure_ascii=False)}"
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
            "Authorization": f"Bearer {self.api_key}",
            "x-signature": signature,
            "x-timestamp": timestamp,
        }

        try:
            if method == "POST":
                res = requests.post(url, json=payload, headers=headers, timeout=30)
            elif method == "PUT":
                res = requests.put(url, json=payload, headers=headers, timeout=30)
            else:
                res = requests.get(url, headers=headers, timeout=30)
            return res.json()
        except requests.exceptions.RequestException as e:
            return {"success": False, "error": str(e)}

    def create_payment(self, amount, currency=None, description=None,
                       external_reference=None, customer_name=None,
                       customer_email=None, customer_phone=None,
                       payer_country=None, webhook_url=None, metadata=None):
        """
        Créer un paiement côté serveur.
        Retourne un paymentToken à passer au widget frontend.

        Args:
            amount: Montant (requis)
            currency: Devise (défaut XOF)
            description: Description du paiement
            external_reference: Votre référence interne (anti-doublon)
            customer_name: Nom du client
            customer_email: Email du client
            customer_phone: Téléphone du client
            payer_country: Pays préféré — TG, BJ, SN, CI…
            webhook_url: URL de notification webhook
            metadata: Données supplémentaires (dict)

        Returns:
            dict: { success, data: { reference, paymentToken, expiresAt, amount, currency } }
        """
        payload = {"amount": amount}
        if currency:
            payload["currency"] = currency
        if description:
            payload["description"] = description
        if external_reference:
            payload["externalReference"] = external_reference
        if customer_name:
            payload["customerName"] = customer_name
        if customer_email:
            payload["customerEmail"] = customer_email
        if customer_phone:
            payload["customerPhone"] = customer_phone
        if payer_country:
            payload["payerCountry"] = payer_country
        if webhook_url:
            payload["webhookUrl"] = webhook_url
        if metadata:
            payload["metadata"] = metadata
        return self.request("POST", "/api/sdk/v1/create-payment", payload)

    def get_payment_status(self, reference):
        """
        Vérifier le statut d'un paiement.
        Préférez les webhooks pour une intégration robuste.

        Args:
            reference: Référence de la transaction

        Returns:
            dict: { success, data: { reference, status, amount, currency, completedAt } }
        """
        return self.request("GET", f"/api/sdk/v1/payment-status/{reference}")

    def verify_payment(self, reference):
        """Vérification détaillée d'un paiement (avec toutes les infos client)."""
        return self.request("POST", "/api/sdk/v1/verify-payment", {"reference": reference})

    def wait_for_payment(self, reference, interval_sec=3, timeout_sec=120, on_status=None):
        """
        Attendre la confirmation d'un paiement (polling).
        Préférez les webhooks pour une intégration en production.

        Args:
            reference: Référence de la transaction
            interval_sec: Intervalle de vérification en secondes (défaut: 3)
            timeout_sec: Délai maximum (défaut: 120)
            on_status: Callback à chaque vérification (optionnel)

        Returns:
            dict: Résultat final du paiement
        """
        start = time.time()
        while time.time() - start < timeout_sec:
            result = self.get_payment_status(reference)
            if on_status:
                on_status(result)
            status = (result.get("data") or {}).get("status") or result.get("status", "")
            if status in ("completed", "failed", "cancelled"):
                return result
            time.sleep(interval_sec)
        return {
            "success": False,
            "status": "TIMEOUT",
            "reference": reference,
            "message": "Délai dépassé — paiement non confirmé",
        }

    def create_withdraw(self, amount, phone_number, operator=None,
                        country=None, currency="XOF", description=None,
                        external_reference=None):
        """
        Demander un retrait vers Mobile Money.

        Args:
            amount: Montant (requis)
            phone_number: Numéro de téléphone (requis)
            operator: Opérateur — MTN, Moov, Orange, TMoney…
            country: Code pays — TG, BJ, SN, CI…
            currency: Devise (défaut XOF)
            description: Description (optionnel)
            external_reference: Votre référence interne (optionnel)
        """
        return self.request("POST", "/api/sdk/v1/withdraw", {
            "amount": amount,
            "phoneNumber": phone_number,
            "operator": operator,
            "country": country,
            "currency": currency,
            "description": description,
            "externalReference": external_reference,
        })

    def get_balance(self, country=None):
        """
        Obtenir le solde des wallets.

        Args:
            country: Filtrer par pays (TG, BJ…) ou None pour tous
        """
        path = f"/api/sdk/v1/balance?country={country}" if country else "/api/sdk/v1/balance"
        return self.request("GET", path)

    def get_transactions(self):
        """Obtenir l'historique des transactions."""
        return self.request("GET", "/api/sdk/v1/transactions")

    def set_webhook(self, webhook_url):
        """
        Configurer l'URL de webhook.

        Args:
            webhook_url: URL de notification (HTTPS requis)
        """
        return self.request("PUT", "/api/sdk/v1/webhook", {"webhookUrl": webhook_url})
