import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  Copy, Check, Code2, Key, Webhook, CreditCard,
  ArrowLeft, Zap, Shield, FileCode,
  Wrench, Loader2, Sparkles, MessageCircle, Mail,
  Globe, ArrowRight, Terminal, CheckCircle2, AlertTriangle,
  RefreshCw, Server, List
} from "lucide-react";

export default function ApiDocs() {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: maintenanceStatus, isLoading: maintenanceLoading } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/api-maintenance-status"],
    refetchInterval: 10000,
  });

  useEffect(() => {
    document.title = "Documentation API SDK v3 - SendavaPay";
    const metaDescription = document.querySelector("meta[name=\"description\"]");
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Documentation de l'API SDK SendavaPay v3 — intégration pure API, sans widget, sans redirection. Paiements Mobile Money pour l'Afrique de l'Ouest et Centrale."
      );
    }
  }, []);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast({ title: "Code copié" });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div className="relative">
      <div className="absolute right-2 top-2 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyCode(code, id)}
          data-testid={`button-copy-${id}`}
        >
          {copiedCode === id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm pr-12">
        <code>{code}</code>
      </pre>
    </div>
  );

  const jsExample = `// ─── API SDK SendavaPay v3 — Exemple JavaScript complet ──────────────────────
const API_KEY = 'sdk_live_VOTRE_CLE_API';
const BASE    = 'https://sendavapay.com/api/sdk/v1';
const hdrs    = { 'Authorization': \`Bearer \${API_KEY}\`, 'Content-Type': 'application/json' };

// ═══ FLUX PAIEMENT ════════════════════════════════════════════════════════════

// ÉTAPE 1 — Créer le paiement (appel serveur→serveur, clé API côté serveur)
const r1   = await fetch(\`\${BASE}/create-payment\`, {
  method: 'POST', headers: hdrs,
  body: JSON.stringify({ amount: 5000, currency: 'XOF', description: 'Commande #123',
                          externalReference: 'ORDER-' + Date.now() })
});
const { data: { reference, paymentToken, expiresAt } } = await r1.json();
// → paymentToken est transmis à votre frontend (jamais dans l'URL !)

// ÉTAPE 2 — Lister les opérateurs (frontend, AUCUNE auth requise)
const r2 = await fetch(\`\${BASE}/operators/TG\`);          // TG, BJ, SN, CI, ML…
const { data: operators } = await r2.json();
// → operators[].id, operators[].name, operators[].requiresOtp, operators[].status

// ÉTAPE 3 — Initier le paiement (frontend, AUCUNE auth)
const r3 = await fetch(\`\${BASE}/initiate-payment\`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    paymentToken,
    payerName:    'Jean Dupont',
    payerPhone:   '+22890123456',
    payerCountry: 'TG',
    operatorId:   operators[0].id
  })
});
const init = await r3.json();
// init.requiresOtp        → true  : demandez le code OTP → ÉTAPE 4
// init.requiresRedirect   → true  : redirigez vers init.redirectUrl
// sinon                           : paiement initié, attendez le webhook

// ÉTAPE 4 (si init.requiresOtp === true) — Soumettre le code OTP
if (init.requiresOtp) {
  const otp = await demanderOtpAuClient();   // votre propre UI
  await fetch(\`\${BASE}/submit-otp\`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ otpToken: init.otpToken, otp })
  });
}

// ─── Vérifier le statut (côté serveur) ───────────────────────────────────────
const st = await fetch(\`\${BASE}/payment-status/\${reference}\`, { headers: hdrs });
const { data: status } = await st.json();
// status.status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

// ═══ FLUX RETRAIT ═════════════════════════════════════════════════════════════

// Valider d'abord (dry-run)
const va = await fetch(\`\${BASE}/validate-withdrawal\`, {
  method: 'POST', headers: hdrs,
  body: JSON.stringify({ amount: 10000, phoneNumber: '+22890123456',
                          operator: 'Flooz', country: 'TG', currency: 'XOF' })
});
const { data: validation } = await va.json();
if (validation.valid) {
  // Lancer le retrait
  const wr = await fetch(\`\${BASE}/withdraw\`, {
    method: 'POST', headers: hdrs,
    body: JSON.stringify({ amount: 10000, phoneNumber: '+22890123456',
                            operator: 'Flooz', country: 'TG', currency: 'XOF',
                            externalReference: 'PAYOUT-' + Date.now() })
  });
  const { data: withdrawal } = await wr.json();
  // withdrawal.status === 'queued'
  // withdrawal.trackingUrl → pour suivre l'état
}`;

  const phpExample = `<?php
// ─── API SDK SendavaPay v3 — Exemple PHP ─────────────────────────────────────
$apiKey = 'sdk_live_VOTRE_CLE_API';
$base   = 'https://sendavapay.com/api/sdk/v1';

function sdkCall(string $method, string $path, ?array $body = null): array {
    global $apiKey, $base;
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $base . $path,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    $raw = curl_exec($ch);
    curl_close($ch);
    return json_decode($raw, true);
}

// ═══ FLUX PAIEMENT ════════════════════════════════════════════════════════════

// ÉTAPE 1 — Créer le paiement (serveur)
$p1 = sdkCall('POST', '/create-payment', [
    'amount'            => 5000,
    'currency'          => 'XOF',
    'description'       => 'Commande #123',
    'externalReference' => 'ORDER-' . time(),
]);
$reference    = $p1['data']['reference'];
$paymentToken = $p1['data']['paymentToken'];
// → transmettre $paymentToken à votre frontend

// ÉTAPE 2 — Opérateurs disponibles (frontend / sans auth)
$operators = sdkCall('GET', '/operators/TG');

// ÉTAPE 3 — Initier (frontend)
$p3 = sdkCall('POST', '/initiate-payment', [
    'paymentToken' => $paymentToken,
    'payerName'    => 'Jean Dupont',
    'payerPhone'   => '+22890123456',
    'payerCountry' => 'TG',
    'operatorId'   => $operators['data'][0]['id'],
]);

// ÉTAPE 4 — OTP si requis
if (!empty($p3['requiresOtp'])) {
    $otp = $_POST['otp'] ?? ''; // saisi par le client dans votre formulaire
    sdkCall('POST', '/submit-otp', [
        'otpToken' => $p3['otpToken'],
        'otp'      => $otp,
    ]);
}

// Vérifier le statut (serveur)
$status = sdkCall('GET', '/payment-status/' . $reference);
echo $status['data']['status']; // completed, failed, processing…

// ═══ FLUX RETRAIT ═════════════════════════════════════════════════════════════
$validation = sdkCall('POST', '/validate-withdrawal', [
    'amount'      => 10000,
    'phoneNumber' => '+22890123456',
    'operator'    => 'Flooz',
    'country'     => 'TG',
    'currency'    => 'XOF',
]);
if ($validation['data']['valid']) {
    $wr = sdkCall('POST', '/withdraw', [
        'amount'            => 10000,
        'phoneNumber'       => '+22890123456',
        'operator'          => 'Flooz',
        'country'           => 'TG',
        'currency'          => 'XOF',
        'externalReference' => 'PAYOUT-' . time(),
    ]);
    echo $wr['data']['status']; // queued
}
?>`;

  const pythonExample = `# ─── API SDK SendavaPay v3 — Exemple Python ──────────────────────────────────
import requests

API_KEY = 'sdk_live_VOTRE_CLE_API'
BASE    = 'https://sendavapay.com/api/sdk/v1'
AHDRS   = {'Authorization': f'Bearer {API_KEY}', 'Content-Type': 'application/json'}

# ═══ FLUX PAIEMENT ════════════════════════════════════════════════════════════

# ÉTAPE 1 — Créer le paiement (serveur)
r1 = requests.post(f'{BASE}/create-payment', json={
    'amount': 5000, 'currency': 'XOF',
    'description': 'Commande #123', 'externalReference': 'ORDER-1',
}, headers=AHDRS)
data          = r1.json()['data']
reference     = data['reference']
payment_token = data['paymentToken']

# ÉTAPE 2 — Opérateurs (frontend / sans auth)
operators = requests.get(f'{BASE}/operators/TG').json()['data']

# ÉTAPE 3 — Initier (frontend / sans auth)
r3 = requests.post(f'{BASE}/initiate-payment', json={
    'paymentToken': payment_token,
    'payerName':    'Jean Dupont',
    'payerPhone':   '+22890123456',
    'payerCountry': 'TG',
    'operatorId':   operators[0]['id'],
})
init = r3.json()

# ÉTAPE 4 — OTP si requis
if init.get('requiresOtp'):
    otp = input('Code OTP reçu par le client : ')
    requests.post(f'{BASE}/submit-otp', json={
        'otpToken': init['otpToken'],
        'otp': otp,
    })

# Statut
status = requests.get(f'{BASE}/payment-status/{reference}', headers=AHDRS).json()
print(status['data']['status'])

# ═══ FLUX RETRAIT ═════════════════════════════════════════════════════════════
v = requests.post(f'{BASE}/validate-withdrawal', json={
    'amount': 10000, 'phoneNumber': '+22890123456',
    'operator': 'Flooz', 'country': 'TG', 'currency': 'XOF',
}, headers=AHDRS).json()

if v['data']['valid']:
    wr = requests.post(f'{BASE}/withdraw', json={
        'amount': 10000, 'phoneNumber': '+22890123456',
        'operator': 'Flooz', 'country': 'TG', 'currency': 'XOF',
        'externalReference': 'PAYOUT-1',
    }, headers=AHDRS).json()
    print(wr['data']['status'])   # queued`;

  const webhookExample = `// ─── Réception & vérification webhook SendavaPay (Node.js / Express) ─────────
const crypto  = require('crypto');
const express = require('express');
const app     = express();

// IMPORTANT: utiliser express.raw pour accéder au corps brut (pour la signature)
app.post('/webhooks/sendavapay',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const signature = req.headers['x-sendavapay-signature'];  // "t=...,v1=..."
    const rawBody   = req.body.toString();

    if (!verifySignature(rawBody, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(rawBody);

    // ─── Répondre IMMÉDIATEMENT HTTP 200 ──────────────────────────────────────
    // Si votre serveur ne répond pas, SendavaPay retentera :
    //   1 min → 5 min → 15 min → 1 heure
    res.json({ received: true });

    // ─── Traiter l'événement en arrière-plan ──────────────────────────────────
    setImmediate(() => handleEvent(event));
  }
);

function verifySignature(rawBody, signature) {
  const parts = Object.fromEntries(
    signature.split(',').map(p => { const [k,v] = p.split('='); return [k, v]; })
  );
  const ts  = parts['t'];
  const sig = parts['v1'];

  // Rejeter si le webhook est plus vieux que 5 minutes (protection replay)
  if (Math.abs(Date.now() / 1000 - parseInt(ts)) > 300) return false;

  const WEBHOOK_SECRET = process.env.SENDAVAPAY_WEBHOOK_SECRET; // whsec_xxx
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(\`\${ts}.\${rawBody}\`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(sig,      'hex'),
    Buffer.from(expected, 'hex')
  );
}

async function handleEvent(event) {
  switch (event.event) {

    case 'payment.completed':
      // Valider la commande, envoyer email de confirmation, etc.
      console.log('✅ Paiement reçu:', event.reference, event.amount, event.currency);
      await db.orders.markPaid(event.reference);
      break;

    case 'payment.failed':
      console.log('❌ Paiement échoué:', event.reference);
      break;

    case 'payment.expired':
      console.log('⏱ Token expiré:', event.reference);
      break;

    case 'payout.queued':
      console.log('⏳ Retrait en file:', event.reference);
      break;

    case 'payout.completed':
      console.log('✅ Retrait effectué:', event.reference);
      break;

    case 'payout.failed':
      console.log('❌ Retrait échoué:', event.reference);
      // Notifier l'utilisateur, vérifier le solde
      break;
  }
}`;

  if (maintenanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (maintenanceStatus?.enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-lg w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Wrench className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <CardTitle className="text-2xl">API en maintenance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              L'API est temporairement indisponible. Veuillez réessayer dans quelques instants.
            </p>
            <Button onClick={() => (window.location.href = "/")} variant="outline" data-testid="button-go-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <a href="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground shrink-0">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Accueil</span>
            </a>
            <div className="flex items-center gap-2 min-w-0">
              <FileCode className="h-5 w-5 text-primary shrink-0" />
              <h1 className="font-bold text-base md:text-xl truncate">Documentation API SDK v3</h1>
              <Badge variant="outline" className="hidden sm:flex text-xs">Pure API</Badge>
            </div>
          </div>
          <a href="/dashboard/api-keys" className="shrink-0">
            <Button size="sm" data-testid="button-api-keys-portal" className="text-xs md:text-sm">
              <span className="hidden sm:inline">Gérer mes clés API</span>
              <span className="sm:hidden">Clés API</span>
              <Key className="h-3 w-3 ml-1 md:h-4 md:w-4 md:ml-2" />
            </Button>
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-10">

          {/* Hero */}
          <section className="text-center space-y-4">
            <h2 className="text-3xl font-bold">API SDK SendavaPay v3</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Intégrez les paiements Mobile Money dans votre propre frontend.
              <strong className="text-foreground"> Zéro widget. Zéro iframe. Zéro redirection vers SendavaPay.</strong>
            </p>
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
              <Badge variant="outline" className="text-sm py-1 px-3">
                <Terminal className="h-3 w-3 mr-1" /> API RESTful
              </Badge>
              <Badge variant="outline" className="text-sm py-1 px-3">
                <Shield className="h-3 w-3 mr-1" /> SSL + HMAC-SHA256
              </Badge>
              <Badge variant="outline" className="text-sm py-1 px-3">
                <Webhook className="h-3 w-3 mr-1" /> Webhooks + retry
              </Badge>
              <Badge variant="outline" className="text-sm py-1 px-3">
                <Globe className="h-3 w-3 mr-1" /> 11 pays supportés
              </Badge>
            </div>
          </section>

          {/* CTA cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-6 flex flex-col gap-4 h-full">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <Sparkles className="h-5 w-5" />
                  API SDK privée
                </div>
                <p className="text-sm text-muted-foreground flex-1">
                  Votre frontend, vos règles. Vos clients ne quittent jamais votre plateforme. 
                  L'API SDK s'intègre dans n'importe quelle stack : React, Vue, PHP, Python, mobile…
                </p>
                <a href="mailto:contact@sendavapay.com?subject=Demande accès API SDK SendavaPay" className="block">
                  <Button className="w-full" data-testid="button-request-api">
                    <Mail className="h-4 w-4 mr-2" />
                    Demander l'accès SDK
                  </Button>
                </a>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex flex-col gap-4 h-full">
                <div className="flex items-center gap-2 font-semibold">
                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  Support technique
                </div>
                <p className="text-sm text-muted-foreground flex-1">
                  Notre équipe est disponible pour vous aider à intégrer l'API et déboguer votre intégration.
                </p>
                <a href="mailto:support@sendavapay.com?subject=Support technique API SDK" className="block">
                  <Button variant="outline" className="w-full" data-testid="button-contact-support">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contacter le support
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started */}
          <Card id="getting-started">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Démarrage rapide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Créez un compte SendavaPay</strong> et complétez la vérification KYC
                </li>
                <li>
                  <strong className="text-foreground">Générez une clé API de type SDK</strong> dans votre{" "}
                  <a href="/dashboard/api-keys" className="text-primary hover:underline">tableau de bord → Clés API</a>
                </li>
                <li>
                  <strong className="text-foreground">Configurez votre webhook</strong> via{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">PUT /api/sdk/v1/webhook</code>
                </li>
                <li>
                  <strong className="text-foreground">Testez</strong> avec{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">POST /api/sdk/v1/test-webhook</code>
                </li>
                <li>
                  <strong className="text-foreground">Intégrez</strong> le flux 4 étapes ci-dessous
                </li>
              </ol>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Base URL :</strong>{" "}
                  <code className="bg-muted px-2 py-0.5 rounded">https://sendavapay.com/api/sdk/v1</code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Authentication */}
          <Card id="authentication">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Authentification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Passez votre clé API SDK dans le header <code className="bg-muted px-2 py-0.5 rounded">Authorization</code> de chaque appel <strong>serveur→serveur</strong>.
                Les endpoints publics (opérateurs, initiation, OTP) n'ont pas besoin d'authentification.
              </p>
              <CodeBlock id="auth-header" code={`Authorization: Bearer sdk_live_VOTRE_CLE_API`} />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>🔴 Côté serveur uniquement</strong><br />
                    Ne jamais exposer votre clé API dans le code frontend ou les URLs.
                  </p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>🟢 Endpoints publics (CORS *)</strong><br />
                    <code className="text-xs">/operators/:cc</code>, <code className="text-xs">/countries</code>, <code className="text-xs">/initiate-payment</code>, <code className="text-xs">/submit-otp</code>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Flow */}
          <Card id="payment-flow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Flux de paiement — 4 étapes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Steps */}
              <div className="space-y-4">
                {[
                  {
                    step: "1",
                    title: "Créer le paiement",
                    badge: "Serveur→Serveur",
                    color: "bg-blue-500",
                    endpoint: "POST /api/sdk/v1/create-payment",
                    desc: "Votre backend appelle l'API avec votre clé secrète. Vous obtenez un paymentToken (valable 30 min) que vous passez à votre frontend.",
                    response: `{ "reference": "sdk_lp8x_abc123", "paymentToken": "pay_tok_xxx", "expiresAt": "...", "amount": 5000, "status": "pending" }`,
                  },
                  {
                    step: "2",
                    title: "Récupérer les opérateurs",
                    badge: "Frontend (public)",
                    color: "bg-purple-500",
                    endpoint: "GET /api/sdk/v1/operators/:countryCode",
                    desc: "Votre frontend appelle cet endpoint sans auth (CORS ouvert). Afficher les opérateurs disponibles pour le pays du client.",
                    response: `{ "data": [{ "id": "12", "name": "Flooz", "requiresOtp": false, "status": "online" }, ...] }`,
                  },
                  {
                    step: "3",
                    title: "Initier le paiement",
                    badge: "Frontend (public)",
                    color: "bg-orange-500",
                    endpoint: "POST /api/sdk/v1/initiate-payment",
                    desc: "Passez le paymentToken, les infos du client, et l'opérateur choisi. La réponse indique si un OTP est requis ou si un redirect est nécessaire.",
                    response: `{ "requiresOtp": true, "otpToken": "otp_xxx", "reference": "sdk_lp8x_abc123" }
// OU
{ "requiresOtp": false, "reference": "sdk_lp8x_abc123" }
// OU
{ "requiresRedirect": true, "redirectUrl": "https://wave.com/..." }`,
                  },
                  {
                    step: "4",
                    title: "Soumettre l'OTP (si requis)",
                    badge: "Frontend (public)",
                    color: "bg-green-500",
                    endpoint: "POST /api/sdk/v1/submit-otp",
                    desc: "Si l'étape 3 retourne requiresOtp=true, afficher un champ OTP à votre client. Soumettre l'otpToken + le code saisi.",
                    response: `{ "success": true, "reference": "sdk_lp8x_abc123", "message": "OTP accepté. Le paiement est en cours." }`,
                  },
                ].map(({ step, title, badge, color, endpoint, desc, response }) => (
                  <div key={step} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`${color} text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0`}>
                        {step}
                      </span>
                      <span className="font-semibold">{title}</span>
                      <Badge variant="outline" className="text-xs">{badge}</Badge>
                    </div>
                    <code className="text-xs bg-muted px-2 py-1 rounded block w-fit">{endpoint}</code>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Réponse :</p>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">{response}</pre>
                    </div>
                  </div>
                ))}
              </div>

              {/* Retry */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Paiement échoué ? Relancer sans nouveau token</span>
                </div>
                <code className="text-xs bg-muted px-2 py-1 rounded">POST /api/sdk/v1/retry-payment</code>
                <p className="text-xs text-muted-foreground mt-2">
                  Passez le même <code className="bg-muted px-1 rounded">paymentToken</code>. Le statut repasse à <code className="bg-muted px-1 rounded">pending</code>.
                </p>
              </div>

              {/* Status check */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Vérifier le statut</span>
                </div>
                <div className="flex flex-col gap-1">
                  <code className="text-xs bg-muted px-2 py-1 rounded w-fit">GET /api/sdk/v1/payment-status/:reference  ← polling</code>
                  <code className="text-xs bg-muted px-2 py-1 rounded w-fit">POST /api/sdk/v1/verify-payment  ← vérification ponctuelle</code>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Statuts possibles : <code className="bg-muted px-1 rounded">pending</code> → <code className="bg-muted px-1 rounded">processing</code> → <code className="bg-muted px-1 rounded">completed</code> | <code className="bg-muted px-1 rounded">failed</code> | <code className="bg-muted px-1 rounded">cancelled</code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Countries & Operators */}
          <Card id="countries-operators">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Pays & opérateurs supportés
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg overflow-x-auto">
                <table className="w-full text-sm min-w-[450px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Pays</th>
                      <th className="text-left p-3">Code</th>
                      <th className="text-left p-3">Devise</th>
                      <th className="text-left p-3">Opérateurs typiques</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "Togo",         code: "TG", cur: "XOF", ops: "TMoney, Flooz" },
                      { name: "Bénin",         code: "BJ", cur: "XOF", ops: "MTN, Moov" },
                      { name: "Sénégal",       code: "SN", cur: "XOF", ops: "Orange, Wave, Free" },
                      { name: "Côte d'Ivoire", code: "CI", cur: "XOF", ops: "Orange, MTN, Wave, Moov" },
                      { name: "Mali",          code: "ML", cur: "XOF", ops: "Orange" },
                      { name: "Burkina Faso",  code: "BF", cur: "XOF", ops: "Orange, Moov" },
                      { name: "Guinée",        code: "GN", cur: "GNF", ops: "MTN, Orange, Cellcom" },
                      { name: "Cameroun",      code: "CM", cur: "XAF", ops: "Orange, MTN" },
                      { name: "Congo",         code: "CG", cur: "XAF", ops: "MTN, Airtel" },
                      { name: "RDC",           code: "COD", cur: "CDF", ops: "Vodacom, Airtel, Orange" },
                    ].map(r => (
                      <tr key={r.code} className="border-b last:border-0">
                        <td className="p-3">{r.name}</td>
                        <td className="p-3 font-mono">{r.code}</td>
                        <td className="p-3">{r.cur}</td>
                        <td className="p-3 text-muted-foreground text-xs">{r.ops}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold">📱 Code OTP — Orange Money Togo / certains opérateurs</p>
                <p className="text-sm text-muted-foreground">
                  Lorsque <code className="bg-muted px-1 rounded">requiresOtp: true</code>, le client compose <code className="bg-muted px-1 rounded">*144#</code> sur son téléphone pour obtenir un code OTP, puis le saisit dans votre formulaire.
                  Vous soumettez ce code via <code className="bg-muted px-1 rounded">/submit-otp</code>.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Récupérez la liste complète et les statuts en temps réel via :
              </p>
              <div className="flex flex-col gap-1">
                <code className="text-xs bg-muted px-2 py-1 rounded w-fit">GET /api/sdk/v1/countries — liste des pays actifs</code>
                <code className="text-xs bg-muted px-2 py-1 rounded w-fit">GET /api/sdk/v1/operators/:cc — opérateurs par pays avec statut online/offline</code>
                <code className="text-xs bg-muted px-2 py-1 rounded w-fit">GET /api/sdk/v1/operators-status — tous les opérateurs dépôt+retrait</code>
                <code className="text-xs bg-muted px-2 py-1 rounded w-fit">GET /api/sdk/v1/payout-status?country=TG — disponibilité retraits (filtre pays optionnel)</code>
              </div>
            </CardContent>
          </Card>

          {/* Withdrawal Flow */}
          <Card id="withdrawal-flow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Flux de retrait (payout)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Les retraits sont traités de manière asynchrone. La demande est mise en file d'attente et traitée dès que possible.
              </p>

              <div className="space-y-3">
                {[
                  {
                    step: "1", endpoint: "POST /api/sdk/v1/validate-withdrawal",
                    desc: "Dry-run : vérifie le solde, l'opérateur, le format du numéro et calcule les frais. Aucun mouvement de fonds.",
                  },
                  {
                    step: "2", endpoint: "POST /api/sdk/v1/withdraw",
                    desc: "Lance le retrait. Le solde est débité immédiatement. Retourne status=queued et une trackingUrl.",
                  },
                  {
                    step: "3", endpoint: "GET /api/sdk/v1/withdrawal-status/:reference",
                    desc: "Suivez l'avancement : queued → processing → completed | failed | reversed",
                  },
                ].map(({ step, endpoint, desc }) => (
                  <div key={step} className="border rounded-lg p-3 flex gap-3">
                    <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {step}
                    </span>
                    <div>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">{endpoint}</code>
                      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-muted rounded-lg overflow-x-auto">
                <table className="w-full text-sm min-w-[400px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Statut</th>
                      <th className="text-left p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { s: "queued",           d: "En file d'attente, sera traité prochainement" },
                      { s: "processing",       d: "En cours de traitement chez l'opérateur" },
                      { s: "provider_pending", d: "En attente de confirmation fournisseur" },
                      { s: "completed",        d: "Retrait effectué avec succès" },
                      { s: "failed",           d: "Retrait échoué — contactez le support" },
                      { s: "reversed",         d: "Fonds retournés au portefeuille" },
                    ].map(({ s, d }) => (
                      <tr key={s} className="border-b last:border-0">
                        <td className="p-3 font-mono text-xs">{s}</td>
                        <td className="p-3 text-muted-foreground text-xs">{d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-1">
                <code className="text-xs bg-muted px-2 py-1 rounded w-fit">GET /api/sdk/v1/withdrawals?page=1&limit=20&status=completed&country=TG</code>
                <p className="text-xs text-muted-foreground">Lister vos retraits avec pagination et filtres (statut, pays, dates)</p>
              </div>
            </CardContent>
          </Card>

          {/* Webhooks */}
          <Card id="webhooks">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhooks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              <div className="space-y-2">
                <h4 className="font-medium">Configuration</h4>
                <CodeBlock
                  id="webhook-setup"
                  code={`// 1. Configurer votre URL de webhook
PUT /api/sdk/v1/webhook
{ "webhookUrl": "https://votre-serveur.com/webhooks/sendavapay" }

// → Retourne votre webhookSecret à conserver en sécurité
{ "webhookSecret": "whsec_xxx", "retryPolicy": "1 min → 5 min → 15 min → 1 heure", "events": [...] }

// 2. Tester la livraison
POST /api/sdk/v1/test-webhook
// → Envoie un webhook.test à votre URL et retourne le résultat`}
                />
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Événements disponibles</h4>
                <div className="bg-muted rounded-lg overflow-x-auto">
                  <table className="w-full text-sm min-w-[400px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Événement</th>
                        <th className="text-left p-3">Déclencheur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { e: "payment.completed",  t: "Paiement confirmé et solde crédité" },
                        { e: "payment.failed",     t: "Paiement refusé ou timeout" },
                        { e: "payment.expired",    t: "Token de paiement expiré (30 min)" },
                        { e: "payout.queued",      t: "Demande de retrait enregistrée" },
                        { e: "payout.processing",  t: "Retrait en cours de traitement" },
                        { e: "payout.completed",   t: "Retrait effectué avec succès" },
                        { e: "payout.failed",      t: "Retrait échoué, fonds disponibles" },
                        { e: "webhook.test",       t: "Test manuel via /test-webhook" },
                      ].map(({ e, t }) => (
                        <tr key={e} className="border-b last:border-0">
                          <td className="p-3 font-mono text-xs">{e}</td>
                          <td className="p-3 text-muted-foreground text-xs">{t}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Retry automatique</h4>
                <p className="text-sm text-muted-foreground">
                  Si votre serveur ne répond pas avec HTTP 2xx, SendavaPay retentera automatiquement :
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Immédiat", "+1 min", "+5 min", "+15 min", "+1 heure"].map((d, i) => (
                    <Badge key={i} variant="outline">{d}</Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Vérification de signature (HMAC-SHA256)</h4>
                <p className="text-sm text-muted-foreground">
                  Chaque webhook contient le header <code className="bg-muted px-1 rounded">X-SendavaPay-Signature: t=&#123;ts&#125;,v1=&#123;hex&#125;</code>.
                  Vérifiez-le pour rejeter les fausses requêtes.
                </p>
                <CodeBlock id="webhook-verify" code={webhookExample} />
              </div>
            </CardContent>
          </Card>

          {/* Endpoint Reference */}
          <Card id="endpoints">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Référence complète des endpoints
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Base URL : <code className="bg-muted px-2 py-0.5 rounded">https://sendavapay.com/api/sdk/v1</code>
              </p>

              {[
                {
                  section: "Paiements",
                  items: [
                    { m: "POST", p: "/create-payment", auth: true, desc: "Créer une transaction + paymentToken" },
                    { m: "GET",  p: "/payment-token/:token", auth: false, desc: "Infos de paiement par token (pour votre frontend)" },
                    { m: "POST", p: "/initiate-payment", auth: false, desc: "Lancer le débit Mobile Money" },
                    { m: "POST", p: "/submit-otp", auth: false, desc: "Soumettre le code OTP (Orange Money)" },
                    { m: "POST", p: "/retry-payment", auth: false, desc: "Relancer un paiement échoué avec le même token" },
                    { m: "GET",  p: "/payment-status/:ref", auth: true, desc: "Statut en temps réel" },
                    { m: "POST", p: "/verify-payment", auth: true, desc: "Vérification ponctuelle" },
                  ],
                },
                {
                  section: "Opérateurs & pays",
                  items: [
                    { m: "GET", p: "/countries",           auth: false, desc: "Liste des pays actifs" },
                    { m: "GET", p: "/operators/:cc",       auth: false, desc: "Opérateurs disponibles pour un pays" },
                    { m: "GET", p: "/operators-status",    auth: false, desc: "Statut dépôt+retrait de tous les opérateurs" },
                    { m: "GET", p: "/payout-status",       auth: true,  desc: "Disponibilité retraits (filtre ?country=TG)" },
                  ],
                },
                {
                  section: "Retraits",
                  items: [
                    { m: "POST", p: "/validate-withdrawal",      auth: true, desc: "Simulation dry-run (frais, solde, opérateur)" },
                    { m: "POST", p: "/withdraw",                  auth: true, desc: "Lancer le retrait (retourne queued)" },
                    { m: "GET",  p: "/withdrawal-status/:ref",    auth: true, desc: "Statut d'un retrait" },
                    { m: "GET",  p: "/withdrawals",               auth: true, desc: "Liste paginée des retraits (filtres: status, country, from, to)" },
                  ],
                },
                {
                  section: "Compte",
                  items: [
                    { m: "GET", p: "/balance",      auth: true, desc: "Solde par portefeuille (filtre ?country=TG)" },
                    { m: "GET", p: "/transactions", auth: true, desc: "Historique paginé (filtres: type, status)" },
                  ],
                },
                {
                  section: "Configuration & santé",
                  items: [
                    { m: "PUT",  p: "/webhook",       auth: true,  desc: "Configurer le webhook URL + secret" },
                    { m: "POST", p: "/test-webhook",  auth: true,  desc: "Tester la livraison webhook" },
                    { m: "GET",  p: "/health",        auth: false, desc: "Statut de l'API + taille des queues" },
                    { m: "GET",  p: "/v1",            auth: false, desc: "Liste de tous les endpoints" },
                  ],
                },
              ].map(({ section, items }) => (
                <div key={section}>
                  <h4 className="font-medium text-sm mb-2 text-muted-foreground uppercase tracking-wide">{section}</h4>
                  <div className="bg-muted rounded-lg overflow-x-auto mb-4">
                    <table className="w-full text-sm min-w-[450px]">
                      <tbody>
                        {items.map(({ m, p, auth, desc }) => (
                          <tr key={p} className="border-b last:border-0">
                            <td className="p-2 pl-3 w-14">
                              <Badge className={m === "GET" ? "bg-blue-500 text-xs" : m === "PUT" ? "bg-yellow-600 text-xs" : "bg-green-600 text-xs"}>
                                {m}
                              </Badge>
                            </td>
                            <td className="p-2 font-mono text-xs w-64">{p}</td>
                            <td className="p-2 w-8">
                              {auth ? <Shield className="h-3 w-3 text-orange-500" /> : <Globe className="h-3 w-3 text-green-500" />}
                            </td>
                            <td className="p-2 pr-3 text-muted-foreground text-xs">{desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3 text-orange-500" /> = Authentification requise &nbsp;
                <Globe className="h-3 w-3 text-green-500" /> = Public (CORS ouvert)
              </p>
            </CardContent>
          </Card>

          {/* Code Examples */}
          <Card id="examples">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Exemples de code complets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="js">
                <TabsList className="mb-4">
                  <TabsTrigger value="js" data-testid="tab-js">JavaScript</TabsTrigger>
                  <TabsTrigger value="php" data-testid="tab-php">PHP</TabsTrigger>
                  <TabsTrigger value="python" data-testid="tab-python">Python</TabsTrigger>
                </TabsList>
                <TabsContent value="js">
                  <CodeBlock id="example-js" code={jsExample} />
                </TabsContent>
                <TabsContent value="php">
                  <CodeBlock id="example-php" code={phpExample} />
                </TabsContent>
                <TabsContent value="python">
                  <CodeBlock id="example-python" code={pythonExample} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Error Codes */}
          <Card id="errors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Codes d'erreur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">HTTP</th>
                      <th className="text-left p-3">Code</th>
                      <th className="text-left p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { h: 401, c: "UNAUTHORIZED",          d: "Header Authorization manquant" },
                      { h: 401, c: "INVALID_API_KEY",       d: "Clé API invalide ou révoquée" },
                      { h: 403, c: "NOT_SDK_KEY",           d: "Cette clé n'est pas de type SDK" },
                      { h: 403, c: "ACCOUNT_NOT_VERIFIED",  d: "Compte non vérifié (KYC requis)" },
                      { h: 403, c: "SDK_NOT_ENABLED",       d: "L'API SDK n'est pas activée sur ce compte" },
                      { h: 404, c: "INVALID_TOKEN",         d: "paymentToken invalide ou inexistant" },
                      { h: 410, c: "TOKEN_EXPIRED",         d: "Token expiré (30 min pour paiement, 10 min pour OTP)" },
                      { h: 409, c: "ALREADY_COMPLETED",     d: "Ce paiement a déjà été complété" },
                      { h: 409, c: "PAYMENT_IN_PROGRESS",   d: "Un paiement est déjà en cours" },
                      { h: 409, c: "DUPLICATE_REFERENCE",   d: "externalReference déjà utilisée" },
                      { h: 409, c: "DUPLICATE_WITHDRAWAL",  d: "externalReference de retrait déjà utilisée" },
                      { h: 400, c: "COUNTRY_MISMATCH",      d: "Opérateur non disponible pour ce pays" },
                      { h: 400, c: "INVALID_OPERATOR",      d: "Identifiant d'opérateur invalide" },
                      { h: 400, c: "OPERATOR_COUNTRY_MISMATCH", d: "Opérateur incompatible avec le pays indiqué" },
                      { h: 400, c: "INVALID_PHONE_FORMAT",  d: "Format E.164 requis (+22890000000)" },
                      { h: 400, c: "AMOUNT_TOO_LOW",        d: "Montant minimum: 100" },
                      { h: 400, c: "AMOUNT_TOO_HIGH",       d: "Montant maximum: 5 000 000" },
                      { h: 400, c: "INSUFFICIENT_BALANCE",  d: "Solde insuffisant dans ce portefeuille" },
                      { h: 400, c: "WALLET_NOT_FOUND",      d: "Portefeuille inexistant pour ce pays" },
                      { h: 400, c: "OTP_FAILED",            d: "Code OTP invalide ou refusé" },
                      { h: 400, c: "INVALID_OTP_TOKEN",     d: "otpToken invalide ou expiré" },
                      { h: 500, c: "PAYMENT_INITIATION_FAILED", d: "Erreur lors de l'initiation chez l'opérateur" },
                      { h: 503, c: "OPERATOR_UNAVAILABLE",  d: "Opérateur en maintenance" },
                      { h: 503, c: "API_MAINTENANCE",       d: "API en maintenance générale" },
                    ].map(({ h, c, d }) => (
                      <tr key={c} className="border-b last:border-0">
                        <td className="p-3 text-muted-foreground">{h}</td>
                        <td className="p-3 font-mono text-xs">{c}</td>
                        <td className="p-3 text-muted-foreground text-xs">{d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Footer CTA */}
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Prêt à intégrer l'API SDK SendavaPay ?
            </p>
            <a href="/dashboard/api-keys">
              <Button size="lg" data-testid="button-start-integration">
                <Key className="h-5 w-5 mr-2" />
                Générer ma clé SDK
              </Button>
            </a>
          </div>

        </div>
      </main>
    </div>
  );
}
