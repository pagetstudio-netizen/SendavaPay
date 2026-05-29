import{g as P,c as q,r as g,u as L,j as e,e as D}from"./index-CjNguLBH.js";import{C as a,b as n,c as o,a as r}from"./card-CxkBJRTW.js";import{B as l}from"./button-Dj8j8ecM.js";import{B as d,C as M}from"./badge-8zflc5ra.js";import{T as F,b as $,c as f,a as j}from"./tabs-CGqRMaPM.js";import{W as U}from"./wrench-GGXlVupa.js";import{A as b}from"./arrow-left-Bz8ox9by.js";import{K as N}from"./key-T2Iqwi95.js";import{T as G}from"./terminal-CvuaoeSs.js";import{S as y}from"./shield-Cpuf1nNF.js";import{W as T}from"./webhook-BTzrmxaq.js";import{G as m}from"./globe-WzYEte0j.js";import{S as z}from"./sparkles-Lf2MBweo.js";import{M as B}from"./mail-BG4Y8zL6.js";import{M as w}from"./message-circle-BbLuNs6Z.js";import{Z as K}from"./zap-CYtnf8pj.js";import{C as H}from"./credit-card-Cd_ip4MR.js";import{R as V}from"./refresh-cw-DWGZsoRr.js";import{C as X}from"./circle-check-BzCF3dWS.js";import{A as Y}from"./arrow-right-cPDkqeDt.js";import{C as W}from"./code-xml-li7T3MHn.js";import{T as J}from"./triangle-alert-BVGO6Wh3.js";import{C as Z}from"./copy-T5cVUGdN.js";import"./index-BqV_HPtu.js";import"./index-CQTqTehf.js";/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Q=P("FileCode",[["path",{d:"M10 12.5 8 15l2 2.5",key:"1tg20x"}],["path",{d:"m14 12.5 2 2.5-2 2.5",key:"yinavb"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z",key:"1mlx9k"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ee=P("List",[["path",{d:"M3 12h.01",key:"nlz23k"}],["path",{d:"M3 18h.01",key:"1tta3j"}],["path",{d:"M3 6h.01",key:"1rqtza"}],["path",{d:"M8 12h13",key:"1za7za"}],["path",{d:"M8 18h13",key:"1lx6n3"}],["path",{d:"M8 6h13",key:"ik3vkj"}]]);function ke(){const{toast:k}=q(),[A,v]=g.useState(null),{data:u,isLoading:E}=L({queryKey:["/api/api-maintenance-status"],refetchInterval:1e4});g.useEffect(()=>{document.title="Documentation API SDK v3 - SendavaPay";const s=document.querySelector('meta[name="description"]');s&&s.setAttribute("content","Documentation de l'API SDK SendavaPay v3 — intégration pure API, sans widget, sans redirection. Paiements Mobile Money pour l'Afrique de l'Ouest et Centrale.")},[]);const O=(s,t)=>{navigator.clipboard.writeText(s),v(t),k({title:"Code copié"}),setTimeout(()=>v(null),2e3)},c=({code:s,id:t})=>e.jsxs("div",{className:"relative",children:[e.jsx("div",{className:"absolute right-2 top-2 z-10",children:e.jsx(l,{variant:"ghost",size:"sm",onClick:()=>O(s,t),"data-testid":`button-copy-${t}`,children:A===t?e.jsx(M,{className:"h-4 w-4"}):e.jsx(Z,{className:"h-4 w-4"})})}),e.jsx("pre",{className:"bg-muted p-4 rounded-lg overflow-x-auto text-sm pr-12",children:e.jsx("code",{children:s})})]}),S=`// ─── API SDK SendavaPay v3 — Exemple JavaScript complet ──────────────────────
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
}`,C=`<?php
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
?>`,R=`# ─── API SDK SendavaPay v3 — Exemple Python ──────────────────────────────────
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
    print(wr['data']['status'])   # queued`,I=`// ─── Réception & vérification webhook SendavaPay (Node.js / Express) ─────────
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
}`;return E?e.jsx("div",{className:"min-h-screen flex items-center justify-center bg-background",children:e.jsx(D,{className:"h-8 w-8 animate-spin text-primary"})}):u!=null&&u.enabled?e.jsx("div",{className:"min-h-screen flex items-center justify-center bg-background p-4",children:e.jsxs(a,{className:"max-w-lg w-full text-center",children:[e.jsxs(n,{children:[e.jsx("div",{className:"mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center",children:e.jsx(U,{className:"h-8 w-8 text-orange-600 dark:text-orange-400"})}),e.jsx(o,{className:"text-2xl",children:"API en maintenance"})]}),e.jsxs(r,{className:"space-y-4",children:[e.jsx("p",{className:"text-muted-foreground",children:"L'API est temporairement indisponible. Veuillez réessayer dans quelques instants."}),e.jsxs(l,{onClick:()=>window.location.href="/",variant:"outline","data-testid":"button-go-home",children:[e.jsx(b,{className:"h-4 w-4 mr-2"}),"Retour à l'accueil"]})]})]})}):e.jsxs("div",{className:"min-h-screen bg-background",children:[e.jsx("header",{className:"border-b bg-card sticky top-0 z-50",children:e.jsxs("div",{className:"container mx-auto px-4 py-3 flex items-center justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-2 md:gap-4 min-w-0",children:[e.jsxs("a",{href:"/",className:"flex items-center gap-1 text-muted-foreground hover:text-foreground shrink-0",children:[e.jsx(b,{className:"h-4 w-4"}),e.jsx("span",{className:"hidden sm:inline",children:"Accueil"})]}),e.jsxs("div",{className:"flex items-center gap-2 min-w-0",children:[e.jsx(Q,{className:"h-5 w-5 text-primary shrink-0"}),e.jsx("h1",{className:"font-bold text-base md:text-xl truncate",children:"Documentation API SDK v3"}),e.jsx(d,{variant:"outline",className:"hidden sm:flex text-xs",children:"Pure API"})]})]}),e.jsx("a",{href:"/dashboard/api-keys",className:"shrink-0",children:e.jsxs(l,{size:"sm","data-testid":"button-api-keys-portal",className:"text-xs md:text-sm",children:[e.jsx("span",{className:"hidden sm:inline",children:"Gérer mes clés API"}),e.jsx("span",{className:"sm:hidden",children:"Clés API"}),e.jsx(N,{className:"h-3 w-3 ml-1 md:h-4 md:w-4 md:ml-2"})]})})]})}),e.jsx("main",{className:"container mx-auto px-4 py-8",children:e.jsxs("div",{className:"max-w-4xl mx-auto space-y-10",children:[e.jsxs("section",{className:"text-center space-y-4",children:[e.jsx("h2",{className:"text-3xl font-bold",children:"API SDK SendavaPay v3"}),e.jsxs("p",{className:"text-lg text-muted-foreground max-w-2xl mx-auto",children:["Intégrez les paiements Mobile Money dans votre propre frontend.",e.jsx("strong",{className:"text-foreground",children:" Zéro widget. Zéro iframe. Zéro redirection vers SendavaPay."})]}),e.jsxs("div",{className:"flex flex-wrap justify-center gap-2 md:gap-3",children:[e.jsxs(d,{variant:"outline",className:"text-sm py-1 px-3",children:[e.jsx(G,{className:"h-3 w-3 mr-1"})," API RESTful"]}),e.jsxs(d,{variant:"outline",className:"text-sm py-1 px-3",children:[e.jsx(y,{className:"h-3 w-3 mr-1"})," SSL + HMAC-SHA256"]}),e.jsxs(d,{variant:"outline",className:"text-sm py-1 px-3",children:[e.jsx(T,{className:"h-3 w-3 mr-1"})," Webhooks + retry"]}),e.jsxs(d,{variant:"outline",className:"text-sm py-1 px-3",children:[e.jsx(m,{className:"h-3 w-3 mr-1"})," 11 pays supportés"]})]})]}),e.jsxs("div",{className:"grid sm:grid-cols-2 gap-4",children:[e.jsx(a,{className:"border-primary/30 bg-primary/5",children:e.jsxs(r,{className:"p-6 flex flex-col gap-4 h-full",children:[e.jsxs("div",{className:"flex items-center gap-2 text-primary font-semibold",children:[e.jsx(z,{className:"h-5 w-5"}),"API SDK privée"]}),e.jsx("p",{className:"text-sm text-muted-foreground flex-1",children:"Votre frontend, vos règles. Vos clients ne quittent jamais votre plateforme. L'API SDK s'intègre dans n'importe quelle stack : React, Vue, PHP, Python, mobile…"}),e.jsx("a",{href:"mailto:contact@sendavapay.com?subject=Demande accès API SDK SendavaPay",className:"block",children:e.jsxs(l,{className:"w-full","data-testid":"button-request-api",children:[e.jsx(B,{className:"h-4 w-4 mr-2"}),"Demander l'accès SDK"]})})]})}),e.jsx(a,{children:e.jsxs(r,{className:"p-6 flex flex-col gap-4 h-full",children:[e.jsxs("div",{className:"flex items-center gap-2 font-semibold",children:[e.jsx(w,{className:"h-5 w-5 text-muted-foreground"}),"Support technique"]}),e.jsx("p",{className:"text-sm text-muted-foreground flex-1",children:"Notre équipe est disponible pour vous aider à intégrer l'API et déboguer votre intégration."}),e.jsx("a",{href:"mailto:support@sendavapay.com?subject=Support technique API SDK",className:"block",children:e.jsxs(l,{variant:"outline",className:"w-full","data-testid":"button-contact-support",children:[e.jsx(w,{className:"h-4 w-4 mr-2"}),"Contacter le support"]})})]})})]}),e.jsxs(a,{id:"getting-started",children:[e.jsx(n,{children:e.jsxs(o,{className:"flex items-center gap-2",children:[e.jsx(K,{className:"h-5 w-5"}),"Démarrage rapide"]})}),e.jsxs(r,{className:"space-y-4",children:[e.jsxs("ol",{className:"list-decimal list-inside space-y-3 text-muted-foreground",children:[e.jsxs("li",{children:[e.jsx("strong",{className:"text-foreground",children:"Créez un compte SendavaPay"})," et complétez la vérification KYC"]}),e.jsxs("li",{children:[e.jsx("strong",{className:"text-foreground",children:"Générez une clé API de type SDK"})," dans votre"," ",e.jsx("a",{href:"/dashboard/api-keys",className:"text-primary hover:underline",children:"tableau de bord → Clés API"})]}),e.jsxs("li",{children:[e.jsx("strong",{className:"text-foreground",children:"Configurez votre webhook"})," via"," ",e.jsx("code",{className:"bg-muted px-1.5 py-0.5 rounded text-xs",children:"PUT /api/sdk/v1/webhook"})]}),e.jsxs("li",{children:[e.jsx("strong",{className:"text-foreground",children:"Testez"})," avec"," ",e.jsx("code",{className:"bg-muted px-1.5 py-0.5 rounded text-xs",children:"POST /api/sdk/v1/test-webhook"})]}),e.jsxs("li",{children:[e.jsx("strong",{className:"text-foreground",children:"Intégrez"})," le flux 4 étapes ci-dessous"]})]}),e.jsx("div",{className:"bg-blue-500/10 border border-blue-500/20 rounded-lg p-4",children:e.jsxs("p",{className:"text-sm",children:[e.jsx("strong",{children:"Base URL :"})," ",e.jsx("code",{className:"bg-muted px-2 py-0.5 rounded",children:"https://sendavapay.com/api/sdk/v1"})]})})]})]}),e.jsxs(a,{id:"authentication",children:[e.jsx(n,{children:e.jsxs(o,{className:"flex items-center gap-2",children:[e.jsx(N,{className:"h-5 w-5"}),"Authentification"]})}),e.jsxs(r,{className:"space-y-4",children:[e.jsxs("p",{className:"text-muted-foreground",children:["Passez votre clé API SDK dans le header ",e.jsx("code",{className:"bg-muted px-2 py-0.5 rounded",children:"Authorization"})," de chaque appel ",e.jsx("strong",{children:"serveur→serveur"}),". Les endpoints publics (opérateurs, initiation, OTP) n'ont pas besoin d'authentification."]}),e.jsx(c,{id:"auth-header",code:"Authorization: Bearer sdk_live_VOTRE_CLE_API"}),e.jsxs("div",{className:"grid sm:grid-cols-2 gap-4",children:[e.jsx("div",{className:"bg-red-500/10 border border-red-500/20 rounded-lg p-4",children:e.jsxs("p",{className:"text-sm",children:[e.jsx("strong",{children:"🔴 Côté serveur uniquement"}),e.jsx("br",{}),"Ne jamais exposer votre clé API dans le code frontend ou les URLs."]})}),e.jsx("div",{className:"bg-green-500/10 border border-green-500/20 rounded-lg p-4",children:e.jsxs("p",{className:"text-sm",children:[e.jsx("strong",{children:"🟢 Endpoints publics (CORS *)"}),e.jsx("br",{}),e.jsx("code",{className:"text-xs",children:"/operators/:cc"}),", ",e.jsx("code",{className:"text-xs",children:"/countries"}),", ",e.jsx("code",{className:"text-xs",children:"/initiate-payment"}),", ",e.jsx("code",{className:"text-xs",children:"/submit-otp"})]})})]})]})]}),e.jsxs(a,{id:"payment-flow",children:[e.jsx(n,{children:e.jsxs(o,{className:"flex items-center gap-2",children:[e.jsx(H,{className:"h-5 w-5"}),"Flux de paiement — 4 étapes"]})}),e.jsxs(r,{className:"space-y-6",children:[e.jsx("div",{className:"space-y-4",children:[{step:"1",title:"Créer le paiement",badge:"Serveur→Serveur",color:"bg-blue-500",endpoint:"POST /api/sdk/v1/create-payment",desc:"Votre backend appelle l'API avec votre clé secrète. Vous obtenez un paymentToken (valable 30 min) que vous passez à votre frontend.",response:'{ "reference": "sdk_lp8x_abc123", "paymentToken": "pay_tok_xxx", "expiresAt": "...", "amount": 5000, "status": "pending" }'},{step:"2",title:"Récupérer les opérateurs",badge:"Frontend (public)",color:"bg-purple-500",endpoint:"GET /api/sdk/v1/operators/:countryCode",desc:"Votre frontend appelle cet endpoint sans auth (CORS ouvert). Afficher les opérateurs disponibles pour le pays du client.",response:'{ "data": [{ "id": "12", "name": "Flooz", "requiresOtp": false, "status": "online" }, ...] }'},{step:"3",title:"Initier le paiement",badge:"Frontend (public)",color:"bg-orange-500",endpoint:"POST /api/sdk/v1/initiate-payment",desc:"Passez le paymentToken, les infos du client, et l'opérateur choisi. La réponse indique si un OTP est requis ou si un redirect est nécessaire.",response:`{ "requiresOtp": true, "otpToken": "otp_xxx", "reference": "sdk_lp8x_abc123" }
// OU
{ "requiresOtp": false, "reference": "sdk_lp8x_abc123" }
// OU
{ "requiresRedirect": true, "redirectUrl": "https://wave.com/..." }`},{step:"4",title:"Soumettre l'OTP (si requis)",badge:"Frontend (public)",color:"bg-green-500",endpoint:"POST /api/sdk/v1/submit-otp",desc:"Si l'étape 3 retourne requiresOtp=true, afficher un champ OTP à votre client. Soumettre l'otpToken + le code saisi.",response:'{ "success": true, "reference": "sdk_lp8x_abc123", "message": "OTP accepté. Le paiement est en cours." }'}].map(({step:s,title:t,badge:i,color:p,endpoint:x,desc:h,response:_})=>e.jsxs("div",{className:"border rounded-lg p-4 space-y-3",children:[e.jsxs("div",{className:"flex items-center gap-3 flex-wrap",children:[e.jsx("span",{className:`${p} text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0`,children:s}),e.jsx("span",{className:"font-semibold",children:t}),e.jsx(d,{variant:"outline",className:"text-xs",children:i})]}),e.jsx("code",{className:"text-xs bg-muted px-2 py-1 rounded block w-fit",children:x}),e.jsx("p",{className:"text-sm text-muted-foreground",children:h}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-muted-foreground mb-1",children:"Réponse :"}),e.jsx("pre",{className:"bg-muted p-3 rounded text-xs overflow-x-auto",children:_})]})]},s))}),e.jsxs("div",{className:"border rounded-lg p-4",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[e.jsx(V,{className:"h-4 w-4 text-muted-foreground"}),e.jsx("span",{className:"font-medium text-sm",children:"Paiement échoué ? Relancer sans nouveau token"})]}),e.jsx("code",{className:"text-xs bg-muted px-2 py-1 rounded",children:"POST /api/sdk/v1/retry-payment"}),e.jsxs("p",{className:"text-xs text-muted-foreground mt-2",children:["Passez le même ",e.jsx("code",{className:"bg-muted px-1 rounded",children:"paymentToken"}),". Le statut repasse à ",e.jsx("code",{className:"bg-muted px-1 rounded",children:"pending"}),"."]})]}),e.jsxs("div",{className:"border rounded-lg p-4",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[e.jsx(X,{className:"h-4 w-4 text-muted-foreground"}),e.jsx("span",{className:"font-medium text-sm",children:"Vérifier le statut"})]}),e.jsxs("div",{className:"flex flex-col gap-1",children:[e.jsx("code",{className:"text-xs bg-muted px-2 py-1 rounded w-fit",children:"GET /api/sdk/v1/payment-status/:reference  ← polling"}),e.jsx("code",{className:"text-xs bg-muted px-2 py-1 rounded w-fit",children:"POST /api/sdk/v1/verify-payment  ← vérification ponctuelle"})]}),e.jsxs("p",{className:"text-xs text-muted-foreground mt-2",children:["Statuts possibles : ",e.jsx("code",{className:"bg-muted px-1 rounded",children:"pending"})," → ",e.jsx("code",{className:"bg-muted px-1 rounded",children:"processing"})," → ",e.jsx("code",{className:"bg-muted px-1 rounded",children:"completed"})," | ",e.jsx("code",{className:"bg-muted px-1 rounded",children:"failed"})," | ",e.jsx("code",{className:"bg-muted px-1 rounded",children:"cancelled"})]})]})]})]}),e.jsxs(a,{id:"countries-operators",children:[e.jsx(n,{children:e.jsxs(o,{className:"flex items-center gap-2",children:[e.jsx(m,{className:"h-5 w-5"}),"Pays & opérateurs supportés"]})}),e.jsxs(r,{className:"space-y-4",children:[e.jsx("div",{className:"bg-muted rounded-lg overflow-x-auto",children:e.jsxs("table",{className:"w-full text-sm min-w-[450px]",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b",children:[e.jsx("th",{className:"text-left p-3",children:"Pays"}),e.jsx("th",{className:"text-left p-3",children:"Code"}),e.jsx("th",{className:"text-left p-3",children:"Devise"}),e.jsx("th",{className:"text-left p-3",children:"Opérateurs typiques"})]})}),e.jsx("tbody",{children:[{name:"Togo",code:"TG",cur:"XOF",ops:"TMoney, Flooz"},{name:"Bénin",code:"BJ",cur:"XOF",ops:"MTN, Moov"},{name:"Sénégal",code:"SN",cur:"XOF",ops:"Orange, Wave, Free"},{name:"Côte d'Ivoire",code:"CI",cur:"XOF",ops:"Orange, MTN, Wave, Moov"},{name:"Mali",code:"ML",cur:"XOF",ops:"Orange"},{name:"Burkina Faso",code:"BF",cur:"XOF",ops:"Orange, Moov"},{name:"Guinée",code:"GN",cur:"GNF",ops:"MTN, Orange, Cellcom"},{name:"Cameroun",code:"CM",cur:"XAF",ops:"Orange, MTN"},{name:"Congo",code:"CG",cur:"XAF",ops:"MTN, Airtel"},{name:"RDC",code:"COD",cur:"CDF",ops:"Vodacom, Airtel, Orange"}].map(s=>e.jsxs("tr",{className:"border-b last:border-0",children:[e.jsx("td",{className:"p-3",children:s.name}),e.jsx("td",{className:"p-3 font-mono",children:s.code}),e.jsx("td",{className:"p-3",children:s.cur}),e.jsx("td",{className:"p-3 text-muted-foreground text-xs",children:s.ops})]},s.code))})]})}),e.jsxs("div",{className:"bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 space-y-2",children:[e.jsx("p",{className:"text-sm font-semibold",children:"📱 Code OTP — Orange Money Togo / certains opérateurs"}),e.jsxs("p",{className:"text-sm text-muted-foreground",children:["Lorsque ",e.jsx("code",{className:"bg-muted px-1 rounded",children:"requiresOtp: true"}),", le client compose ",e.jsx("code",{className:"bg-muted px-1 rounded",children:"*144#"})," sur son téléphone pour obtenir un code OTP, puis le saisit dans votre formulaire. Vous soumettez ce code via ",e.jsx("code",{className:"bg-muted px-1 rounded",children:"/submit-otp"}),"."]})]}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Récupérez la liste complète et les statuts en temps réel via :"}),e.jsxs("div",{className:"flex flex-col gap-1",children:[e.jsx("code",{className:"text-xs bg-muted px-2 py-1 rounded w-fit",children:"GET /api/sdk/v1/countries — liste des pays actifs"}),e.jsx("code",{className:"text-xs bg-muted px-2 py-1 rounded w-fit",children:"GET /api/sdk/v1/operators/:cc — opérateurs par pays avec statut online/offline"}),e.jsx("code",{className:"text-xs bg-muted px-2 py-1 rounded w-fit",children:"GET /api/sdk/v1/operators-status — tous les opérateurs dépôt+retrait"}),e.jsx("code",{className:"text-xs bg-muted px-2 py-1 rounded w-fit",children:"GET /api/sdk/v1/payout-status?country=TG — disponibilité retraits (filtre pays optionnel)"})]})]})]}),e.jsxs(a,{id:"withdrawal-flow",children:[e.jsx(n,{children:e.jsxs(o,{className:"flex items-center gap-2",children:[e.jsx(Y,{className:"h-5 w-5"}),"Flux de retrait (payout)"]})}),e.jsxs(r,{className:"space-y-4",children:[e.jsx("p",{className:"text-muted-foreground text-sm",children:"Les retraits sont traités de manière asynchrone. La demande est mise en file d'attente et traitée dès que possible."}),e.jsx("div",{className:"space-y-3",children:[{step:"1",endpoint:"POST /api/sdk/v1/validate-withdrawal",desc:"Dry-run : vérifie le solde, l'opérateur, le format du numéro et calcule les frais. Aucun mouvement de fonds."},{step:"2",endpoint:"POST /api/sdk/v1/withdraw",desc:"Lance le retrait. Le solde est débité immédiatement. Retourne status=queued et une trackingUrl."},{step:"3",endpoint:"GET /api/sdk/v1/withdrawal-status/:reference",desc:"Suivez l'avancement : queued → processing → completed | failed | reversed"}].map(({step:s,endpoint:t,desc:i})=>e.jsxs("div",{className:"border rounded-lg p-3 flex gap-3",children:[e.jsx("span",{className:"bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5",children:s}),e.jsxs("div",{children:[e.jsx("code",{className:"text-xs bg-muted px-2 py-0.5 rounded",children:t}),e.jsx("p",{className:"text-xs text-muted-foreground mt-1",children:i})]})]},s))}),e.jsx("div",{className:"bg-muted rounded-lg overflow-x-auto",children:e.jsxs("table",{className:"w-full text-sm min-w-[400px]",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b",children:[e.jsx("th",{className:"text-left p-3",children:"Statut"}),e.jsx("th",{className:"text-left p-3",children:"Description"})]})}),e.jsx("tbody",{children:[{s:"queued",d:"En file d'attente, sera traité prochainement"},{s:"processing",d:"En cours de traitement chez l'opérateur"},{s:"provider_pending",d:"En attente de confirmation fournisseur"},{s:"completed",d:"Retrait effectué avec succès"},{s:"failed",d:"Retrait échoué — contactez le support"},{s:"reversed",d:"Fonds retournés au portefeuille"}].map(({s,d:t})=>e.jsxs("tr",{className:"border-b last:border-0",children:[e.jsx("td",{className:"p-3 font-mono text-xs",children:s}),e.jsx("td",{className:"p-3 text-muted-foreground text-xs",children:t})]},s))})]})}),e.jsxs("div",{className:"flex flex-col gap-1",children:[e.jsx("code",{className:"text-xs bg-muted px-2 py-1 rounded w-fit",children:"GET /api/sdk/v1/withdrawals?page=1&limit=20&status=completed&country=TG"}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"Lister vos retraits avec pagination et filtres (statut, pays, dates)"})]})]})]}),e.jsxs(a,{id:"webhooks",children:[e.jsx(n,{children:e.jsxs(o,{className:"flex items-center gap-2",children:[e.jsx(T,{className:"h-5 w-5"}),"Webhooks"]})}),e.jsxs(r,{className:"space-y-6",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx("h4",{className:"font-medium",children:"Configuration"}),e.jsx(c,{id:"webhook-setup",code:`// 1. Configurer votre URL de webhook
PUT /api/sdk/v1/webhook
{ "webhookUrl": "https://votre-serveur.com/webhooks/sendavapay" }

// → Retourne votre webhookSecret à conserver en sécurité
{ "webhookSecret": "whsec_xxx", "retryPolicy": "1 min → 5 min → 15 min → 1 heure", "events": [...] }

// 2. Tester la livraison
POST /api/sdk/v1/test-webhook
// → Envoie un webhook.test à votre URL et retourne le résultat`})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("h4",{className:"font-medium",children:"Événements disponibles"}),e.jsx("div",{className:"bg-muted rounded-lg overflow-x-auto",children:e.jsxs("table",{className:"w-full text-sm min-w-[400px]",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b",children:[e.jsx("th",{className:"text-left p-3",children:"Événement"}),e.jsx("th",{className:"text-left p-3",children:"Déclencheur"})]})}),e.jsx("tbody",{children:[{e:"payment.completed",t:"Paiement confirmé et solde crédité"},{e:"payment.failed",t:"Paiement refusé ou timeout"},{e:"payment.expired",t:"Token de paiement expiré (30 min)"},{e:"payout.queued",t:"Demande de retrait enregistrée"},{e:"payout.processing",t:"Retrait en cours de traitement"},{e:"payout.completed",t:"Retrait effectué avec succès"},{e:"payout.failed",t:"Retrait échoué, fonds disponibles"},{e:"webhook.test",t:"Test manuel via /test-webhook"}].map(({e:s,t})=>e.jsxs("tr",{className:"border-b last:border-0",children:[e.jsx("td",{className:"p-3 font-mono text-xs",children:s}),e.jsx("td",{className:"p-3 text-muted-foreground text-xs",children:t})]},s))})]})})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("h4",{className:"font-medium",children:"Retry automatique"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Si votre serveur ne répond pas avec HTTP 2xx, SendavaPay retentera automatiquement :"}),e.jsx("div",{className:"flex flex-wrap gap-2",children:["Immédiat","+1 min","+5 min","+15 min","+1 heure"].map((s,t)=>e.jsx(d,{variant:"outline",children:s},t))})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("h4",{className:"font-medium",children:"Vérification de signature (HMAC-SHA256)"}),e.jsxs("p",{className:"text-sm text-muted-foreground",children:["Chaque webhook contient le header ",e.jsx("code",{className:"bg-muted px-1 rounded",children:"X-SendavaPay-Signature: t={ts},v1={hex}"}),". Vérifiez-le pour rejeter les fausses requêtes."]}),e.jsx(c,{id:"webhook-verify",code:I})]})]})]}),e.jsxs(a,{id:"endpoints",children:[e.jsx(n,{children:e.jsxs(o,{className:"flex items-center gap-2",children:[e.jsx(ee,{className:"h-5 w-5"}),"Référence complète des endpoints"]})}),e.jsxs(r,{className:"space-y-4",children:[e.jsxs("p",{className:"text-sm text-muted-foreground",children:["Base URL : ",e.jsx("code",{className:"bg-muted px-2 py-0.5 rounded",children:"https://sendavapay.com/api/sdk/v1"})]}),[{section:"Paiements",items:[{m:"POST",p:"/create-payment",auth:!0,desc:"Créer une transaction + paymentToken"},{m:"GET",p:"/payment-token/:token",auth:!1,desc:"Infos de paiement par token (pour votre frontend)"},{m:"POST",p:"/initiate-payment",auth:!1,desc:"Lancer le débit Mobile Money"},{m:"POST",p:"/submit-otp",auth:!1,desc:"Soumettre le code OTP (Orange Money)"},{m:"POST",p:"/retry-payment",auth:!1,desc:"Relancer un paiement échoué avec le même token"},{m:"GET",p:"/payment-status/:ref",auth:!0,desc:"Statut en temps réel"},{m:"POST",p:"/verify-payment",auth:!0,desc:"Vérification ponctuelle"}]},{section:"Opérateurs & pays",items:[{m:"GET",p:"/countries",auth:!1,desc:"Liste des pays actifs"},{m:"GET",p:"/operators/:cc",auth:!1,desc:"Opérateurs disponibles pour un pays"},{m:"GET",p:"/operators-status",auth:!1,desc:"Statut dépôt+retrait de tous les opérateurs"},{m:"GET",p:"/payout-status",auth:!0,desc:"Disponibilité retraits (filtre ?country=TG)"}]},{section:"Retraits",items:[{m:"POST",p:"/validate-withdrawal",auth:!0,desc:"Simulation dry-run (frais, solde, opérateur)"},{m:"POST",p:"/withdraw",auth:!0,desc:"Lancer le retrait (retourne queued)"},{m:"GET",p:"/withdrawal-status/:ref",auth:!0,desc:"Statut d'un retrait"},{m:"GET",p:"/withdrawals",auth:!0,desc:"Liste paginée des retraits (filtres: status, country, from, to)"}]},{section:"Compte",items:[{m:"GET",p:"/balance",auth:!0,desc:"Solde par portefeuille (filtre ?country=TG)"},{m:"GET",p:"/transactions",auth:!0,desc:"Historique paginé (filtres: type, status)"}]},{section:"Configuration & santé",items:[{m:"PUT",p:"/webhook",auth:!0,desc:"Configurer le webhook URL + secret"},{m:"POST",p:"/test-webhook",auth:!0,desc:"Tester la livraison webhook"},{m:"GET",p:"/health",auth:!1,desc:"Statut de l'API + taille des queues"},{m:"GET",p:"/v1",auth:!1,desc:"Liste de tous les endpoints"}]}].map(({section:s,items:t})=>e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium text-sm mb-2 text-muted-foreground uppercase tracking-wide",children:s}),e.jsx("div",{className:"bg-muted rounded-lg overflow-x-auto mb-4",children:e.jsx("table",{className:"w-full text-sm min-w-[450px]",children:e.jsx("tbody",{children:t.map(({m:i,p,auth:x,desc:h})=>e.jsxs("tr",{className:"border-b last:border-0",children:[e.jsx("td",{className:"p-2 pl-3 w-14",children:e.jsx(d,{className:i==="GET"?"bg-blue-500 text-xs":i==="PUT"?"bg-yellow-600 text-xs":"bg-green-600 text-xs",children:i})}),e.jsx("td",{className:"p-2 font-mono text-xs w-64",children:p}),e.jsx("td",{className:"p-2 w-8",children:x?e.jsx(y,{className:"h-3 w-3 text-orange-500"}):e.jsx(m,{className:"h-3 w-3 text-green-500"})}),e.jsx("td",{className:"p-2 pr-3 text-muted-foreground text-xs",children:h})]},p))})})})]},s)),e.jsxs("p",{className:"text-xs text-muted-foreground flex items-center gap-1",children:[e.jsx(y,{className:"h-3 w-3 text-orange-500"})," = Authentification requise  ",e.jsx(m,{className:"h-3 w-3 text-green-500"})," = Public (CORS ouvert)"]})]})]}),e.jsxs(a,{id:"examples",children:[e.jsx(n,{children:e.jsxs(o,{className:"flex items-center gap-2",children:[e.jsx(W,{className:"h-5 w-5"}),"Exemples de code complets"]})}),e.jsx(r,{children:e.jsxs(F,{defaultValue:"js",children:[e.jsxs($,{className:"mb-4",children:[e.jsx(f,{value:"js","data-testid":"tab-js",children:"JavaScript"}),e.jsx(f,{value:"php","data-testid":"tab-php",children:"PHP"}),e.jsx(f,{value:"python","data-testid":"tab-python",children:"Python"})]}),e.jsx(j,{value:"js",children:e.jsx(c,{id:"example-js",code:S})}),e.jsx(j,{value:"php",children:e.jsx(c,{id:"example-php",code:C})}),e.jsx(j,{value:"python",children:e.jsx(c,{id:"example-python",code:R})})]})})]}),e.jsxs(a,{id:"errors",children:[e.jsx(n,{children:e.jsxs(o,{className:"flex items-center gap-2",children:[e.jsx(J,{className:"h-5 w-5"}),"Codes d'erreur"]})}),e.jsx(r,{children:e.jsx("div",{className:"bg-muted rounded-lg overflow-x-auto",children:e.jsxs("table",{className:"w-full text-sm min-w-[500px]",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b",children:[e.jsx("th",{className:"text-left p-3",children:"HTTP"}),e.jsx("th",{className:"text-left p-3",children:"Code"}),e.jsx("th",{className:"text-left p-3",children:"Description"})]})}),e.jsx("tbody",{children:[{h:401,c:"UNAUTHORIZED",d:"Header Authorization manquant"},{h:401,c:"INVALID_API_KEY",d:"Clé API invalide ou révoquée"},{h:403,c:"NOT_SDK_KEY",d:"Cette clé n'est pas de type SDK"},{h:403,c:"ACCOUNT_NOT_VERIFIED",d:"Compte non vérifié (KYC requis)"},{h:403,c:"SDK_NOT_ENABLED",d:"L'API SDK n'est pas activée sur ce compte"},{h:404,c:"INVALID_TOKEN",d:"paymentToken invalide ou inexistant"},{h:410,c:"TOKEN_EXPIRED",d:"Token expiré (30 min pour paiement, 10 min pour OTP)"},{h:409,c:"ALREADY_COMPLETED",d:"Ce paiement a déjà été complété"},{h:409,c:"PAYMENT_IN_PROGRESS",d:"Un paiement est déjà en cours"},{h:409,c:"DUPLICATE_REFERENCE",d:"externalReference déjà utilisée"},{h:409,c:"DUPLICATE_WITHDRAWAL",d:"externalReference de retrait déjà utilisée"},{h:400,c:"COUNTRY_MISMATCH",d:"Opérateur non disponible pour ce pays"},{h:400,c:"INVALID_OPERATOR",d:"Identifiant d'opérateur invalide"},{h:400,c:"OPERATOR_COUNTRY_MISMATCH",d:"Opérateur incompatible avec le pays indiqué"},{h:400,c:"INVALID_PHONE_FORMAT",d:"Format E.164 requis (+22890000000)"},{h:400,c:"AMOUNT_TOO_LOW",d:"Montant minimum: 100"},{h:400,c:"AMOUNT_TOO_HIGH",d:"Montant maximum: 5 000 000"},{h:400,c:"INSUFFICIENT_BALANCE",d:"Solde insuffisant dans ce portefeuille"},{h:400,c:"WALLET_NOT_FOUND",d:"Portefeuille inexistant pour ce pays"},{h:400,c:"OTP_FAILED",d:"Code OTP invalide ou refusé"},{h:400,c:"INVALID_OTP_TOKEN",d:"otpToken invalide ou expiré"},{h:500,c:"PAYMENT_INITIATION_FAILED",d:"Erreur lors de l'initiation chez l'opérateur"},{h:503,c:"OPERATOR_UNAVAILABLE",d:"Opérateur en maintenance"},{h:503,c:"API_MAINTENANCE",d:"API en maintenance générale"}].map(({h:s,c:t,d:i})=>e.jsxs("tr",{className:"border-b last:border-0",children:[e.jsx("td",{className:"p-3 text-muted-foreground",children:s}),e.jsx("td",{className:"p-3 font-mono text-xs",children:t}),e.jsx("td",{className:"p-3 text-muted-foreground text-xs",children:i})]},t))})]})})})]}),e.jsxs("div",{className:"text-center py-8",children:[e.jsx("p",{className:"text-muted-foreground mb-4",children:"Prêt à intégrer l'API SDK SendavaPay ?"}),e.jsx("a",{href:"/dashboard/api-keys",children:e.jsxs(l,{size:"lg","data-testid":"button-start-integration",children:[e.jsx(N,{className:"h-5 w-5 mr-2"}),"Générer ma clé SDK"]})})]})]})})]})}export{ke as default};
