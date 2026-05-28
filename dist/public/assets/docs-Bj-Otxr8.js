import{g as $,c as q,r as j,u as I,j as e,e as U}from"./index-ChuFtjJZ.js";import{C as t,b as i,c,d,a}from"./card-DQ4r5vD6.js";import{B as m}from"./button-SF4K3tAT.js";import{B as n,C as R}from"./badge-CHfXqyBO.js";import{T as D,b as M,c as u,a as h}from"./tabs-xjRa6O2l.js";import{W as z}from"./wrench-C2VORlYb.js";import{A as y}from"./arrow-left-BYB3397A.js";import{K as x}from"./key-BhdYAYc3.js";import{Z as g}from"./zap-CdNzLZE_.js";import{S as L}from"./shield-B3huvdWR.js";import{W as N}from"./webhook-BlyyZfwd.js";import{S as F}from"./sparkles-BgOG7E2u.js";import{M as B}from"./mail-CFbHeBjb.js";import{M as v}from"./message-circle-DMDk9Fqz.js";import{C as X}from"./code-xml-Bu0-U4fy.js";import{C as V}from"./credit-card-B_MYsrFd.js";import{C as K}from"./copy-DM__J8FA.js";import"./index-BILVbOkH.js";import"./index-BAyalmMV.js";/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=$("FileCode",[["path",{d:"M10 12.5 8 15l2 2.5",key:"1tg20x"}],["path",{d:"m14 12.5 2 2.5-2 2.5",key:"yinavb"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z",key:"1mlx9k"}]]);function pe(){const{toast:P}=q(),[S,f]=j.useState(null),{data:p,isLoading:C}=I({queryKey:["/api/api-maintenance-status"],refetchInterval:1e4});j.useEffect(()=>{document.title="Documentation API - SendavaPay";const s=document.querySelector('meta[name="description"]');s&&s.setAttribute("content","Documentation complète de l'API SendavaPay pour intégrer les paiements Mobile Money dans vos applications. Exemples de code en JavaScript, PHP et Python.")},[]);const _=(s,l)=>{navigator.clipboard.writeText(s),f(l),P({title:"Code copié"}),setTimeout(()=>f(null),2e3)},r=({code:s,language:l,id:o})=>e.jsxs("div",{className:"relative",children:[e.jsx("div",{className:"absolute right-2 top-2",children:e.jsx(m,{variant:"ghost",size:"sm",onClick:()=>_(s,o),"data-testid":`button-copy-${o}`,children:S===o?e.jsx(R,{className:"h-4 w-4"}):e.jsx(K,{className:"h-4 w-4"})})}),e.jsx("pre",{className:"bg-muted p-4 rounded-lg overflow-x-auto text-sm",children:e.jsx("code",{children:s})})]}),w=[{method:"POST",path:"/api/v1/create-payment",description:"Créer un nouveau lien de paiement",params:[{name:"amount",type:"number",required:!0,description:"Montant du paiement"},{name:"currency",type:"string",required:!1,description:"Devise (défaut: XOF)"},{name:"description",type:"string",required:!1,description:"Description du paiement"},{name:"externalReference",type:"string",required:!1,description:"Référence externe"},{name:"customerEmail",type:"string",required:!1,description:"Email du client"},{name:"customerPhone",type:"string",required:!1,description:"Téléphone du client"},{name:"customerName",type:"string",required:!1,description:"Nom du client"},{name:"redirectUrl",type:"string",required:!1,description:"URL de redirection après paiement"},{name:"metadata",type:"object",required:!1,description:"Données personnalisées"}],response:`{
  "success": true,
  "data": {
    "reference": "pay_abc123_xyz789",
    "amount": 5000,
    "currency": "XOF",
    "status": "pending",
    "paymentUrl": "https://sendavapay.com/pay/pay_abc123_xyz789",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}`},{method:"POST",path:"/api/v1/verify-payment",description:"Vérifier le statut d'un paiement",params:[{name:"reference",type:"string",required:!0,description:"Référence du paiement"}],response:`{
  "success": true,
  "data": {
    "reference": "pay_abc123_xyz789",
    "externalReference": "ORDER-123",
    "amount": "5000",
    "fee": "350",
    "currency": "XOF",
    "status": "completed",
    "customerEmail": "client@email.com",
    "customerPhone": "+22890123456",
    "customerName": "Jean Dupont",
    "paymentMethod": "mtn_tg",
    "createdAt": "2024-01-15T10:30:00Z",
    "completedAt": "2024-01-15T10:35:00Z"
  }
}`},{method:"POST",path:"/api/v1/credit-account",description:"Créditer un compte utilisateur SendavaPay",params:[{name:"phone",type:"string",required:!0,description:"Numéro de téléphone du compte"},{name:"amount",type:"number",required:!0,description:"Montant à créditer"},{name:"description",type:"string",required:!1,description:"Description du crédit"},{name:"externalReference",type:"string",required:!1,description:"Référence externe"}],response:`{
  "success": true,
  "data": {
    "reference": "pay_def456_uvw123",
    "amount": 10000,
    "phone": "+22890123456",
    "userName": "Jean Dupont",
    "status": "completed",
    "createdAt": "2024-01-15T11:00:00Z"
  }
}`},{method:"GET",path:"/api/v1/balance",description:"Consulter le solde d'un compte utilisateur",params:[{name:"phone",type:"string",required:!0,description:"Numéro de téléphone (query param)"}],response:`{
  "success": true,
  "data": {
    "phone": "+22890123456",
    "balance": "150000",
    "currency": "XOF",
    "name": "Jean Dupont",
    "isVerified": true
  }
}`},{method:"GET",path:"/api/v1/transactions",description:"Lister toutes vos transactions API",params:[],response:`{
  "success": true,
  "data": {
    "transactions": [...],
    "total": 50
  }
}`}],T=`// Installation: npm install axios
const axios = require('axios');

const API_KEY = 'sk_live_votre_cle_api';
const BASE_URL = 'https://sendavapay.com/api/v1';

// Créer un paiement
async function createPayment(amount, description) {
  try {
    const response = await axios.post(
      \`\${BASE_URL}/v1/create-payment\`,
      {
        amount,
        description,
        currency: 'XOF',
        customerEmail: 'client@email.com'
      },
      {
        headers: {
          'Authorization': \`Bearer \${API_KEY}\`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Paiement créé:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur:', error.response?.data);
    throw error;
  }
}

// Vérifier un paiement
async function verifyPayment(reference) {
  const response = await axios.post(
    \`\${BASE_URL}/v1/verify-payment\`,
    { reference },
    {
      headers: {
        'Authorization': \`Bearer \${API_KEY}\`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
}

// Créditer un compte
async function creditAccount(phone, amount, description) {
  const response = await axios.post(
    \`\${BASE_URL}/v1/credit-account\`,
    { phone, amount, description },
    {
      headers: {
        'Authorization': \`Bearer \${API_KEY}\`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
}

// Consulter le solde
async function getBalance(phone) {
  const response = await axios.get(
    \`\${BASE_URL}/v1/balance?phone=\${encodeURIComponent(phone)}\`,
    {
      headers: {
        'Authorization': \`Bearer \${API_KEY}\`
      }
    }
  );
  
  return response.data;
}`,A=`<?php
// Configuration
$apiKey = 'sk_live_votre_cle_api';
$baseUrl = 'https://sendavapay.com/api/v1';

// Fonction pour faire les requêtes API
function sendRequest($method, $endpoint, $data = null) {
    global $apiKey, $baseUrl;
    
    $ch = curl_init();
    $url = $baseUrl . $endpoint;
    
    $headers = [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json'
    ];
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'status' => $httpCode,
        'data' => json_decode($response, true)
    ];
}

// Créer un paiement
function createPayment($amount, $description, $customerEmail = null) {
    $data = [
        'amount' => $amount,
        'description' => $description,
        'currency' => 'XOF'
    ];
    
    if ($customerEmail) {
        $data['customerEmail'] = $customerEmail;
    }
    
    return sendRequest('POST', '/v1/create-payment', $data);
}

// Vérifier un paiement
function verifyPayment($reference) {
    return sendRequest('POST', '/v1/verify-payment', [
        'reference' => $reference
    ]);
}

// Créditer un compte
function creditAccount($phone, $amount, $description = null) {
    $data = [
        'phone' => $phone,
        'amount' => $amount
    ];
    
    if ($description) {
        $data['description'] = $description;
    }
    
    return sendRequest('POST', '/v1/credit-account', $data);
}

// Consulter le solde
function getBalance($phone) {
    return sendRequest('GET', '/v1/balance?phone=' . urlencode($phone));
}

// Exemple d'utilisation
$result = createPayment(5000, 'Achat produit XYZ');
print_r($result);
?>`,O=`import requests
import json

# Configuration
API_KEY = 'sk_live_votre_cle_api'
BASE_URL = 'https://sendavapay.com/api/v1'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

def create_payment(amount, description, customer_email=None):
    """Créer un nouveau paiement"""
    data = {
        'amount': amount,
        'description': description,
        'currency': 'XOF'
    }
    
    if customer_email:
        data['customerEmail'] = customer_email
    
    response = requests.post(
        f'{BASE_URL}/v1/create-payment',
        headers=headers,
        json=data
    )
    
    return response.json()

def verify_payment(reference):
    """Vérifier le statut d'un paiement"""
    response = requests.post(
        f'{BASE_URL}/v1/verify-payment',
        headers=headers,
        json={'reference': reference}
    )
    
    return response.json()

def credit_account(phone, amount, description=None):
    """Créditer un compte utilisateur"""
    data = {
        'phone': phone,
        'amount': amount
    }
    
    if description:
        data['description'] = description
    
    response = requests.post(
        f'{BASE_URL}/v1/credit-account',
        headers=headers,
        json=data
    )
    
    return response.json()

def get_balance(phone):
    """Consulter le solde d'un compte"""
    response = requests.get(
        f'{BASE_URL}/v1/balance',
        headers=headers,
        params={'phone': phone}
    )
    
    return response.json()

# Exemple d'utilisation
if __name__ == '__main__':
    # Créer un paiement
    result = create_payment(5000, 'Achat produit XYZ')
    print('Paiement créé:', json.dumps(result, indent=2))
    
    # Vérifier le paiement
    if result.get('success'):
        reference = result['data']['reference']
        status = verify_payment(reference)
        print('Statut:', json.dumps(status, indent=2))`,E=`// Exemple de réception de webhook (Node.js/Express)
const crypto = require('crypto');
const express = require('express');
const app = express();

app.use(express.json());

const WEBHOOK_SECRET = 'whsec_votre_secret_webhook';

// Vérifier la signature du webhook
function verifyWebhookSignature(payload, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === expectedSignature;
}

app.post('/webhook/sendavapay', (req, res) => {
  const signature = req.headers['x-sendavapay-signature'];
  const event = req.headers['x-sendavapay-event'];
  
  // Vérifier la signature
  if (!verifyWebhookSignature(req.body, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const { data, timestamp } = req.body;
  
  // Traiter l'événement
  switch (event) {
    case 'payment.completed':
      console.log('Paiement reçu:', data);
      // Mettre à jour votre base de données
      // Envoyer un email de confirmation
      break;
      
    case 'payment.failed':
      console.log('Paiement échoué:', data);
      // Gérer l'échec
      break;
      
    case 'credit.completed':
      console.log('Crédit effectué:', data);
      break;
      
    default:
      console.log('Event inconnu:', event);
  }
  
  res.json({ received: true });
});

app.listen(3000);`;return C?e.jsx("div",{className:"min-h-screen flex items-center justify-center bg-background",children:e.jsx(U,{className:"h-8 w-8 animate-spin text-primary"})}):p!=null&&p.enabled?e.jsx("div",{className:"min-h-screen flex items-center justify-center bg-background p-4",children:e.jsxs(t,{className:"max-w-lg w-full text-center",children:[e.jsxs(i,{children:[e.jsx("div",{className:"mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center",children:e.jsx(z,{className:"h-8 w-8 text-orange-600 dark:text-orange-400"})}),e.jsx(c,{className:"text-2xl",children:"API en maintenance"}),e.jsx(d,{className:"text-base",children:"L'API et la documentation sont temporairement indisponibles"})]}),e.jsxs(a,{className:"space-y-4",children:[e.jsx("p",{className:"text-muted-foreground",children:"Nous effectuons actuellement des travaux de maintenance sur notre API. Veuillez réessayer dans quelques instants."}),e.jsx("div",{className:"bg-muted/50 p-4 rounded-lg",children:e.jsx("p",{className:"text-sm text-muted-foreground",children:"Les paiements via liens de paiement restent fonctionnels. Seule l'API développeur est temporairement désactivée."})}),e.jsxs(m,{onClick:()=>window.location.href="/",variant:"outline","data-testid":"button-go-home",children:[e.jsx(y,{className:"h-4 w-4 mr-2"}),"Retour à l'accueil"]})]})]})}):e.jsxs("div",{className:"min-h-screen bg-background",children:[e.jsx("header",{className:"border-b bg-card sticky top-0 z-50",children:e.jsxs("div",{className:"container mx-auto px-4 py-3 flex items-center justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-2 md:gap-4 min-w-0",children:[e.jsxs("a",{href:"/",className:"flex items-center gap-1 text-muted-foreground hover:text-foreground shrink-0",children:[e.jsx(y,{className:"h-4 w-4"}),e.jsx("span",{className:"hidden sm:inline",children:"Accueil"})]}),e.jsxs("div",{className:"flex items-center gap-2 min-w-0",children:[e.jsx(b,{className:"h-5 w-5 text-primary shrink-0"}),e.jsx("h1",{className:"font-bold text-base md:text-xl truncate",children:"Documentation API"})]})]}),e.jsx("a",{href:"/dashboard/api-keys",className:"shrink-0",children:e.jsxs(m,{size:"sm","data-testid":"button-api-keys-portal",className:"text-xs md:text-sm",children:[e.jsx("span",{className:"hidden sm:inline",children:"Gérer mes clés API"}),e.jsx("span",{className:"sm:hidden",children:"Clés API"}),e.jsx(x,{className:"h-3 w-3 ml-1 md:h-4 md:w-4 md:ml-2"})]})})]})}),e.jsx("main",{className:"container mx-auto px-4 py-8",children:e.jsxs("div",{className:"max-w-4xl mx-auto space-y-12",children:[e.jsxs("section",{className:"text-center space-y-4",children:[e.jsx("h2",{className:"text-3xl font-bold",children:"API SendavaPay"}),e.jsx("p",{className:"text-lg text-muted-foreground",children:"Intégrez facilement les paiements Mobile Money dans vos applications"}),e.jsxs("div",{className:"flex flex-wrap justify-center gap-2 md:gap-4",children:[e.jsxs(n,{variant:"outline",className:"text-sm py-1 px-3",children:[e.jsx(g,{className:"h-3 w-3 mr-1"}),"API RESTful"]}),e.jsxs(n,{variant:"outline",className:"text-sm py-1 px-3",children:[e.jsx(L,{className:"h-3 w-3 mr-1"}),"Sécurisé SSL"]}),e.jsxs(n,{variant:"outline",className:"text-sm py-1 px-3",children:[e.jsx(N,{className:"h-3 w-3 mr-1"}),"Webhooks"]})]})]}),e.jsxs("div",{className:"grid sm:grid-cols-2 gap-4",children:[e.jsx(t,{className:"border-primary/30 bg-primary/5",children:e.jsxs(a,{className:"p-6 flex flex-col gap-4 h-full",children:[e.jsxs("div",{className:"flex items-center gap-2 text-primary font-semibold",children:[e.jsx(F,{className:"h-5 w-5"}),"Mode white-label"]}),e.jsx("p",{className:"text-sm text-muted-foreground flex-1",children:"Intégrez SendavaPay directement sur votre site web en mode white-label. Vos clients paient sans quitter votre plateforme, sous votre marque."}),e.jsx("a",{href:"mailto:contact@sendavapay.com?subject=Demande accès API white-label SendavaPay",className:"block",children:e.jsxs(m,{className:"w-full","data-testid":"button-request-api",children:[e.jsx(B,{className:"h-4 w-4 mr-2"}),"Demander l'API"]})})]})}),e.jsx(t,{className:"border-muted",children:e.jsxs(a,{className:"p-6 flex flex-col gap-4 h-full",children:[e.jsxs("div",{className:"flex items-center gap-2 font-semibold",children:[e.jsx(v,{className:"h-5 w-5 text-muted-foreground"}),"Besoin d'aide ?"]}),e.jsx("p",{className:"text-sm text-muted-foreground flex-1",children:"Notre équipe technique est disponible pour vous accompagner dans l'intégration de l'API et répondre à vos questions."}),e.jsx("a",{href:"mailto:support@sendavapay.com?subject=Support technique API SendavaPay",className:"block",children:e.jsxs(m,{variant:"outline",className:"w-full","data-testid":"button-contact-support",children:[e.jsx(v,{className:"h-4 w-4 mr-2"}),"Contacter le support"]})})]})})]}),e.jsxs(t,{id:"getting-started",children:[e.jsx(i,{children:e.jsxs(c,{className:"flex items-center gap-2",children:[e.jsx(g,{className:"h-5 w-5"}),"Démarrage rapide"]})}),e.jsx(a,{className:"space-y-4",children:e.jsxs("ol",{className:"list-decimal list-inside space-y-3 text-muted-foreground",children:[e.jsxs("li",{children:[e.jsx("strong",{className:"text-foreground",children:"Créez un compte SendavaPay"})," - Inscrivez-vous sur"," ",e.jsx("a",{href:"/register",className:"text-primary hover:underline",children:"SendavaPay"})," et complétez la vérification KYC"]}),e.jsxs("li",{children:[e.jsx("strong",{className:"text-foreground",children:"Générez votre clé API"})," - Dans votre"," ",e.jsx("a",{href:"/dashboard/api-keys",className:"text-primary hover:underline",children:"tableau de bord"}),", créez et copiez votre clé API"]}),e.jsxs("li",{children:[e.jsx("strong",{className:"text-foreground",children:"Intégrez l'API"})," - Utilisez les exemples ci-dessous pour commencer"]})]})})]}),e.jsxs(t,{id:"authentication",children:[e.jsxs(i,{children:[e.jsxs(c,{className:"flex items-center gap-2",children:[e.jsx(x,{className:"h-5 w-5"}),"Authentification"]}),e.jsx(d,{children:"Toutes les requêtes API doivent être authentifiées avec votre clé API"})]}),e.jsxs(a,{className:"space-y-4",children:[e.jsxs("p",{className:"text-muted-foreground",children:["Incluez votre clé API dans l'en-tête ",e.jsx("code",{className:"bg-muted px-2 py-1 rounded",children:"Authorization"})," de chaque requête:"]}),e.jsx(r,{id:"auth-header",language:"bash",code:"Authorization: Bearer sk_live_votre_cle_api"}),e.jsx("div",{className:"bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4",children:e.jsxs("p",{className:"text-sm",children:[e.jsx("strong",{children:"Important:"})," Ne partagez jamais votre clé API. Gardez-la côté serveur uniquement."]})})]})]}),e.jsxs(t,{id:"endpoints",children:[e.jsxs(i,{children:[e.jsxs(c,{className:"flex items-center gap-2",children:[e.jsx(X,{className:"h-5 w-5"}),"Endpoints API"]}),e.jsxs(d,{children:["Base URL: ",e.jsx("code",{className:"bg-muted px-2 py-1 rounded",children:"https://sendavapay.com/api/v1"})]})]}),e.jsx(a,{className:"space-y-8",children:w.map((s,l)=>e.jsxs("div",{className:"border-b pb-6 last:border-0 last:pb-0",children:[e.jsxs("div",{className:"flex items-center gap-3 mb-3 flex-wrap",children:[e.jsx(n,{className:s.method==="GET"?"bg-blue-500 shrink-0":"bg-green-500 shrink-0",children:s.method}),e.jsx("code",{className:"text-sm font-mono break-all",children:s.path})]}),e.jsx("p",{className:"text-muted-foreground mb-4",children:s.description}),s.params.length>0&&e.jsxs("div",{className:"mb-4",children:[e.jsx("h4",{className:"font-medium mb-2",children:"Paramètres"}),e.jsx("div",{className:"bg-muted rounded-lg overflow-x-auto",children:e.jsxs("table",{className:"w-full text-sm min-w-[500px]",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b",children:[e.jsx("th",{className:"text-left p-3",children:"Nom"}),e.jsx("th",{className:"text-left p-3",children:"Type"}),e.jsx("th",{className:"text-left p-3",children:"Requis"}),e.jsx("th",{className:"text-left p-3",children:"Description"})]})}),e.jsx("tbody",{children:s.params.map((o,k)=>e.jsxs("tr",{className:"border-b last:border-0",children:[e.jsx("td",{className:"p-3 font-mono",children:o.name}),e.jsx("td",{className:"p-3",children:o.type}),e.jsx("td",{className:"p-3",children:o.required?e.jsx(n,{className:"bg-red-500",children:"Oui"}):e.jsx(n,{variant:"outline",children:"Non"})}),e.jsx("td",{className:"p-3 text-muted-foreground",children:o.description})]},k))})]})})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"Réponse"}),e.jsx(r,{id:`response-${l}`,language:"json",code:s.response})]})]},l))})]}),e.jsxs(t,{id:"countries-operators",children:[e.jsxs(i,{children:[e.jsxs(c,{className:"flex items-center gap-2",children:[e.jsx(V,{className:"h-5 w-5"}),"Pays, opérateurs & code OTP"]}),e.jsx(d,{children:"Liste des pays et opérateurs supportés — certains opérateurs exigent un code OTP pour valider le paiement"})]}),e.jsxs(a,{className:"space-y-6",children:[e.jsxs("div",{className:"grid md:grid-cols-2 gap-4",children:[e.jsxs("div",{className:"bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 space-y-2",children:[e.jsx("p",{className:"text-sm font-semibold flex items-center gap-2",children:"📱 Code USSD — composé par le client"}),e.jsxs("p",{className:"text-sm text-muted-foreground",children:["Le ",e.jsx("strong",{children:"client"})," ouvre le clavier de son téléphone et compose un code USSD (ex : ",e.jsx("code",{className:"bg-muted px-1 py-0.5 rounded",children:"*144*4*6*5000#"}),"). Orange Money traite alors la demande et envoie automatiquement un code OTP par SMS au client."]}),e.jsx("p",{className:"text-xs text-orange-700 dark:text-orange-400 font-medium",children:"✦ Ce code est composé par le client — pas par votre application"})]}),e.jsxs("div",{className:"bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-2",children:[e.jsx("p",{className:"text-sm font-semibold flex items-center gap-2",children:"🔐 Code OTP — saisi dans votre interface"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Après avoir composé le code USSD, le client reçoit un code OTP (6 chiffres) par SMS. Votre interface affiche un champ de saisie. Le client entre ce code pour finaliser le paiement."}),e.jsx("p",{className:"text-xs text-blue-700 dark:text-blue-400 font-medium",children:"✦ Ce code est entré dans votre application — vous l'envoyez à l'API"})]})]}),e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full text-sm min-w-[640px] border rounded-lg overflow-hidden",children:[e.jsx("thead",{className:"bg-muted",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold",children:"Pays"}),e.jsx("th",{className:"text-left p-3 font-semibold",children:"Opérateur"}),e.jsx("th",{className:"text-left p-3 font-semibold",children:"Devise"}),e.jsx("th",{className:"text-left p-3 font-semibold",children:"Code USSD client ①"}),e.jsx("th",{className:"text-left p-3 font-semibold",children:"OTP requis ②"}),e.jsx("th",{className:"text-left p-3 font-semibold",children:"Flux"})]})}),e.jsx("tbody",{children:[{country:"🇹🇬 Togo",operators:"TMoney, Moov",currency:"XOF",ussd:"—",otp:!1,flow:"USSD push auto"},{country:"🇧🇯 Bénin",operators:"MTN, Moov",currency:"XOF",ussd:"—",otp:!1,flow:"USSD push auto"},{country:"🇨🇲 Cameroun",operators:"MTN, Orange",currency:"XAF",ussd:"—",otp:!1,flow:"USSD push auto"},{country:"🇧🇫 Burkina Faso",operators:"Orange Money",currency:"XOF",ussd:"*144*4*6*[MONTANT]#",otp:!0,flow:"USSD → OTP"},{country:"🇨🇮 Côte d'Ivoire",operators:"Orange Money",currency:"XOF",ussd:"#144*82#",otp:!0,flow:"USSD → OTP"},{country:"🇨🇮 Côte d'Ivoire",operators:"MTN, Moov, Wave",currency:"XOF",ussd:"—",otp:!1,flow:"USSD push / checkout"},{country:"🇬🇳 Guinée",operators:"Orange Money",currency:"GNF",ussd:"#144#",otp:!0,flow:"USSD → OTP"},{country:"🇲🇱 Mali",operators:"Orange Money",currency:"XOF",ussd:"#144#77#",otp:!0,flow:"USSD → OTP"},{country:"🇸🇳 Sénégal",operators:"Orange Money",currency:"XOF",ussd:"#144#391#",otp:!0,flow:"USSD → OTP"},{country:"🇸🇳 Sénégal",operators:"Wave",currency:"XOF",ussd:"—",otp:!1,flow:"Checkout redirect"},{country:"🇨🇩 RD Congo",operators:"Vodacom, Airtel, Orange",currency:"CDF",ussd:"—",otp:!1,flow:"Checkout redirect"},{country:"🇨🇬 Congo",operators:"MTN",currency:"XAF",ussd:"—",otp:!1,flow:"USSD push auto"}].map((s,l)=>e.jsxs("tr",{className:`border-t ${s.otp?"bg-orange-500/5":""}`,children:[e.jsx("td",{className:"p-3 text-sm",children:s.country}),e.jsx("td",{className:"p-3",children:s.operators}),e.jsx("td",{className:"p-3 font-mono text-xs",children:s.currency}),e.jsx("td",{className:"p-3 font-mono text-xs",children:s.ussd!=="—"?e.jsx("span",{className:"bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-2 py-0.5 rounded font-semibold",children:s.ussd}):e.jsx("span",{className:"text-muted-foreground",children:"—"})}),e.jsx("td",{className:"p-3",children:s.otp?e.jsx(n,{className:"bg-orange-500 text-white",children:"Oui ②"}):e.jsx(n,{variant:"outline",className:"text-green-600 border-green-500",children:"Non"})}),e.jsx("td",{className:"p-3 text-muted-foreground text-xs",children:s.flow})]},l))})]})}),e.jsx("div",{className:"bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3",children:e.jsxs("p",{className:"text-sm",children:[e.jsx("strong",{children:"Note Burkina Faso :"})," le code ",e.jsx("code",{className:"bg-muted px-1 py-0.5 rounded",children:"*144*4*6*[MONTANT]#"})," doit être composé avec le montant réel de la transaction. Exemple pour 5 000 XOF : ",e.jsx("code",{className:"bg-muted px-1 py-0.5 rounded",children:"*144*4*6*5000#"}),". SendavaPay affiche automatiquement le bon code au client sur la page de paiement."]})}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-semibold mb-3",children:"Flux complet pour Orange Money (BF, CI, GN, ML, SN)"}),e.jsx("div",{className:"space-y-3",children:[{who:"Votre serveur",step:"1",label:"Initier le paiement",detail:"Appelez POST /api/sdk/payment avec le numéro et l'opérateur Orange du client. Réponse : { otpRequired: true, reference, ussdCode }"},{who:"Votre interface",step:"2",label:"Afficher le code USSD",detail:"Montrez au client le code USSD à composer (ex : #144*82#). Ce code est dans la réponse API sous ussdCode."},{who:"Le client",step:"3",label:"Composer le code USSD",detail:"Le client ouvre son clavier téléphonique et compose le code USSD. Orange Money lui envoie ensuite un SMS avec un code OTP."},{who:"Votre interface",step:"4",label:"Afficher un champ OTP",detail:"Affichez un champ de saisie pour que le client entre le code OTP reçu par SMS."},{who:"Votre serveur",step:"5",label:"Confirmer l'OTP",detail:"Envoyez POST /api/sdk/confirm-otp avec { reference, otp }. Le paiement est validé."},{who:"Votre serveur",step:"6",label:"Vérifier le statut final",detail:"Utilisez POST /api/sdk/verify ou attendez le webhook payment.completed."}].map(s=>e.jsxs("div",{className:"flex gap-3 items-start",children:[e.jsx("div",{className:"shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold",children:s.step}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[e.jsx("span",{className:"text-sm font-semibold",children:s.label}),e.jsx(n,{variant:"outline",className:"text-xs",children:s.who})]}),e.jsx("p",{className:"text-xs text-muted-foreground mt-0.5",children:s.detail})]})]},s.step))})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-semibold mb-2",children:"Endpoint de confirmation OTP"}),e.jsx(r,{id:"otp-endpoint",language:"json",code:`// POST /api/sdk/confirm-otp
// Corps de la requête :
{
  "reference": "pay_abc123_xyz789",  // référence obtenue à l'étape 1
  "otp": "123456"                    // code OTP saisi par le client
}

// Réponse :
{
  "success": true,
  "status": "PROCESSING",
  "reference": "pay_abc123_xyz789",
  "message": "Paiement en cours de traitement"
}`})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-semibold mb-2",children:"Exemple complet — Orange Money CI (JavaScript)"}),e.jsx(r,{id:"otp-example-js",language:"javascript",code:`const sdk = new SendavaPay('sk_live_...', 'votre_secret');

// Étape 1 : Initier le paiement Orange Money
const payment = await sdk.createPayment({
  amount: 5000,
  phoneNumber: '+2250700000000',
  operator: 'Orange',
  country: 'CI',
  description: 'Achat article #123',
  callbackUrl: 'https://votre-site.com/webhook'
});

if (payment.otpRequired) {
  // Étape 2 : Afficher un champ OTP à l'utilisateur
  const otp = await demander_otp_au_client(); // votre logique UI

  // Étape 3 : Confirmer avec l'OTP
  const confirmation = await sdk.confirmOtp(payment.reference, otp);
  console.log('Confirmation OTP :', confirmation);
}

// Étape 4 : Attendre la finalisation (webhook ou polling)
const final = await sdk.waitForPayment(payment.reference);
console.log('Résultat final :', final.status); // SUCCESS / FAILED`})]})]})]}),e.jsxs(t,{id:"code-examples",children:[e.jsxs(i,{children:[e.jsxs(c,{className:"flex items-center gap-2",children:[e.jsx(b,{className:"h-5 w-5"}),"Exemples de code"]}),e.jsx(d,{children:"Exemples d'intégration dans différents langages"})]}),e.jsx(a,{children:e.jsxs(D,{defaultValue:"javascript",children:[e.jsxs(M,{className:"mb-4",children:[e.jsx(u,{value:"javascript","data-testid":"tab-js",children:"JavaScript"}),e.jsx(u,{value:"php","data-testid":"tab-php",children:"PHP"}),e.jsx(u,{value:"python","data-testid":"tab-python",children:"Python"})]}),e.jsx(h,{value:"javascript",children:e.jsx(r,{id:"js-example",language:"javascript",code:T})}),e.jsx(h,{value:"php",children:e.jsx(r,{id:"php-example",language:"php",code:A})}),e.jsx(h,{value:"python",children:e.jsx(r,{id:"python-example",language:"python",code:O})})]})})]}),e.jsxs(t,{id:"webhooks",children:[e.jsxs(i,{children:[e.jsxs(c,{className:"flex items-center gap-2",children:[e.jsx(N,{className:"h-5 w-5"}),"Webhooks"]}),e.jsx(d,{children:"Recevez des notifications en temps réel pour les événements de paiement"})]}),e.jsxs(a,{className:"space-y-6",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"Événements disponibles"}),e.jsxs("ul",{className:"space-y-2 text-muted-foreground",children:[e.jsxs("li",{children:[e.jsx("code",{className:"bg-muted px-2 py-1 rounded",children:"payment.completed"})," - Paiement réussi"]}),e.jsxs("li",{children:[e.jsx("code",{className:"bg-muted px-2 py-1 rounded",children:"payment.failed"})," - Paiement échoué"]}),e.jsxs("li",{children:[e.jsx("code",{className:"bg-muted px-2 py-1 rounded",children:"credit.completed"})," - Crédit effectué"]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"Structure du webhook"}),e.jsx(r,{id:"webhook-structure",language:"json",code:`{
  "event": "payment.completed",
  "data": {
    "reference": "pay_abc123_xyz789",
    "amount": 5000,
    "currency": "XOF",
    "customerPhone": "+22890123456"
  },
  "timestamp": "2024-01-15T10:35:00Z"
}`})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"En-têtes de la requête"}),e.jsxs("ul",{className:"space-y-2 text-muted-foreground",children:[e.jsxs("li",{children:[e.jsx("code",{className:"bg-muted px-2 py-1 rounded",children:"X-SendavaPay-Signature"})," - Signature HMAC-SHA256"]}),e.jsxs("li",{children:[e.jsx("code",{className:"bg-muted px-2 py-1 rounded",children:"X-SendavaPay-Event"})," - Type d'événement"]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"Exemple de réception"}),e.jsx(r,{id:"webhook-example",language:"javascript",code:E})]})]})]}),e.jsxs(t,{id:"errors",children:[e.jsx(i,{children:e.jsx(c,{children:"Codes d'erreur"})}),e.jsx(a,{children:e.jsx("div",{className:"bg-muted rounded-lg overflow-x-auto",children:e.jsxs("table",{className:"w-full text-sm min-w-[400px]",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b",children:[e.jsx("th",{className:"text-left p-3",children:"Code HTTP"}),e.jsx("th",{className:"text-left p-3",children:"Code"}),e.jsx("th",{className:"text-left p-3",children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{className:"border-b",children:[e.jsx("td",{className:"p-3",children:"401"}),e.jsx("td",{className:"p-3 font-mono",children:"UNAUTHORIZED"}),e.jsx("td",{className:"p-3 text-muted-foreground",children:"Clé API manquante"})]}),e.jsxs("tr",{className:"border-b",children:[e.jsx("td",{className:"p-3",children:"401"}),e.jsx("td",{className:"p-3 font-mono",children:"INVALID_API_KEY"}),e.jsx("td",{className:"p-3 text-muted-foreground",children:"Clé API invalide"})]}),e.jsxs("tr",{className:"border-b",children:[e.jsx("td",{className:"p-3",children:"403"}),e.jsx("td",{className:"p-3 font-mono",children:"ACCOUNT_SUSPENDED"}),e.jsx("td",{className:"p-3 text-muted-foreground",children:"Compte suspendu ou non vérifié"})]}),e.jsxs("tr",{className:"border-b",children:[e.jsx("td",{className:"p-3",children:"404"}),e.jsx("td",{className:"p-3 font-mono",children:"PAYMENT_NOT_FOUND"}),e.jsx("td",{className:"p-3 text-muted-foreground",children:"Paiement non trouvé"})]}),e.jsxs("tr",{children:[e.jsx("td",{className:"p-3",children:"404"}),e.jsx("td",{className:"p-3 font-mono",children:"USER_NOT_FOUND"}),e.jsx("td",{className:"p-3 text-muted-foreground",children:"Utilisateur non trouvé"})]})]})]})})})]}),e.jsxs("div",{className:"text-center py-8",children:[e.jsx("p",{className:"text-muted-foreground mb-4",children:"Besoin d'aide ? Contactez notre support technique"}),e.jsx("a",{href:"/dashboard/api-keys",children:e.jsxs(m,{size:"lg","data-testid":"button-start-integration",children:[e.jsx(x,{className:"h-5 w-5 mr-2"}),"Générer ma clé API"]})})]})]})})]})}export{pe as default};
