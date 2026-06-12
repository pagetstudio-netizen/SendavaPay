import{g as _,c as E,r as C,j as e}from"./index-BI7KtBpk.js";import{C as r,b as n,c as i,a as o,d as l}from"./card-1jFmXNaF.js";import{B as p}from"./button-dlFqbM0-.js";import{B as c,C as $}from"./badge-0XpMXc0M.js";import{T as P,b as A,c as m,a as u}from"./tabs-B061JXjV.js";import{A as T}from"./arrow-left-DH6wQFvL.js";import{E as R}from"./external-link-Btc2Mtky.js";import{Z as x}from"./zap-DlUFwj70.js";import{S}from"./shield-CJObguig.js";import{W as j}from"./webhook-BthCXjUG.js";import{K as q}from"./key-BD6LDaEI.js";import{C as w}from"./code-xml-Dm8c3esX.js";import{C as I}from"./credit-card-DcsMD6fh.js";import{C as O}from"./copy-BppN2raY.js";import"./index-BoJ94Nkb.js";import"./index-D7p7gNwF.js";/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=_("FileCode",[["path",{d:"M10 12.5 8 15l2 2.5",key:"1tg20x"}],["path",{d:"m14 12.5 2 2.5-2 2.5",key:"yinavb"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z",key:"1mlx9k"}]]);function te(){const{toast:y}=E(),[g,h]=C.useState(null),N=(s,d)=>{navigator.clipboard.writeText(s),h(d),y({title:"Code copié"}),setTimeout(()=>h(null),2e3)},a=({code:s,language:d,id:t})=>e.jsxs("div",{className:"relative",children:[e.jsx("div",{className:"absolute right-2 top-2",children:e.jsx(p,{variant:"ghost",size:"sm",onClick:()=>N(s,t),"data-testid":`button-copy-${t}`,children:g===t?e.jsx($,{className:"h-4 w-4"}):e.jsx(O,{className:"h-4 w-4"})})}),e.jsx("pre",{className:"bg-muted p-4 rounded-lg overflow-x-auto text-sm",children:e.jsx("code",{children:s})})]}),v=[{method:"POST",path:"/api/v1/create-payment",description:"Créer un nouveau lien de paiement",params:[{name:"amount",type:"number",required:!0,description:"Montant du paiement"},{name:"currency",type:"string",required:!1,description:"Devise (défaut: XOF)"},{name:"description",type:"string",required:!1,description:"Description du paiement"},{name:"externalReference",type:"string",required:!1,description:"Référence externe"},{name:"customerEmail",type:"string",required:!1,description:"Email du client"},{name:"customerPhone",type:"string",required:!1,description:"Téléphone du client"},{name:"customerName",type:"string",required:!1,description:"Nom du client"},{name:"redirectUrl",type:"string",required:!1,description:"URL de redirection après paiement"},{name:"metadata",type:"object",required:!1,description:"Données personnalisées"}],response:`{
  "success": true,
  "data": {
    "reference": "pay_abc123_xyz789",
    "amount": 5000,
    "currency": "XOF",
    "status": "pending",
    "paymentUrl": "https://sendavapay.com/pay/api/pay_abc123_xyz789",
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
}`}];return e.jsxs("div",{className:"min-h-screen bg-background",children:[e.jsx("header",{className:"border-b bg-card sticky top-0 z-50",children:e.jsxs("div",{className:"container mx-auto px-4 py-4 flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs("a",{href:"/",className:"flex items-center gap-2 text-muted-foreground hover:text-foreground",children:[e.jsx(T,{className:"h-4 w-4"}),"Accueil"]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(f,{className:"h-6 w-6 text-primary"}),e.jsx("h1",{className:"font-bold text-xl",children:"Documentation API"})]})]}),e.jsx("a",{href:"/merchant",children:e.jsxs(p,{"data-testid":"button-merchant-portal",children:["Espace Marchand",e.jsx(R,{className:"h-4 w-4 ml-2"})]})})]})}),e.jsx("main",{className:"container mx-auto px-4 py-8",children:e.jsxs("div",{className:"max-w-4xl mx-auto space-y-12",children:[e.jsxs("section",{className:"text-center space-y-4",children:[e.jsx("h2",{className:"text-3xl font-bold",children:"API SendavaPay"}),e.jsx("p",{className:"text-lg text-muted-foreground",children:"Intégrez facilement les paiements Mobile Money dans vos applications"}),e.jsxs("div",{className:"flex justify-center gap-4",children:[e.jsxs(c,{variant:"outline",className:"text-sm py-1 px-3",children:[e.jsx(x,{className:"h-3 w-3 mr-1"}),"API RESTful"]}),e.jsxs(c,{variant:"outline",className:"text-sm py-1 px-3",children:[e.jsx(S,{className:"h-3 w-3 mr-1"}),"Sécurisé SSL"]}),e.jsxs(c,{variant:"outline",className:"text-sm py-1 px-3",children:[e.jsx(j,{className:"h-3 w-3 mr-1"}),"Webhooks"]})]})]}),e.jsxs(r,{id:"getting-started",children:[e.jsx(n,{children:e.jsxs(i,{className:"flex items-center gap-2",children:[e.jsx(x,{className:"h-5 w-5"}),"Démarrage rapide"]})}),e.jsx(o,{className:"space-y-4",children:e.jsxs("ol",{className:"list-decimal list-inside space-y-3 text-muted-foreground",children:[e.jsxs("li",{children:[e.jsx("strong",{className:"text-foreground",children:"Créez un compte marchand"})," - Inscrivez-vous sur"," ",e.jsx("a",{href:"/merchant",className:"text-primary hover:underline",children:"l'espace marchand"})]}),e.jsxs("li",{children:[e.jsx("strong",{className:"text-foreground",children:"Récupérez votre clé API"})," - Dans votre tableau de bord, copiez votre clé API"]}),e.jsxs("li",{children:[e.jsx("strong",{className:"text-foreground",children:"Configurez vos webhooks"})," - Ajoutez l'URL de votre serveur pour recevoir les notifications"]}),e.jsxs("li",{children:[e.jsx("strong",{className:"text-foreground",children:"Intégrez l'API"})," - Utilisez les exemples ci-dessous pour commencer"]})]})})]}),e.jsxs(r,{id:"authentication",children:[e.jsxs(n,{children:[e.jsxs(i,{className:"flex items-center gap-2",children:[e.jsx(q,{className:"h-5 w-5"}),"Authentification"]}),e.jsx(l,{children:"Toutes les requêtes API doivent être authentifiées avec votre clé API"})]}),e.jsxs(o,{className:"space-y-4",children:[e.jsxs("p",{className:"text-muted-foreground",children:["Incluez votre clé API dans l'en-tête ",e.jsx("code",{className:"bg-muted px-2 py-1 rounded",children:"Authorization"})," de chaque requête:"]}),e.jsx(a,{id:"auth-header",language:"bash",code:"Authorization: Bearer pk_live_votre_cle_api"}),e.jsx("div",{className:"bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4",children:e.jsxs("p",{className:"text-sm",children:[e.jsx("strong",{children:"Important:"})," Ne partagez jamais votre clé API. Gardez-la côté serveur uniquement."]})})]})]}),e.jsxs(r,{id:"endpoints",children:[e.jsxs(n,{children:[e.jsxs(i,{className:"flex items-center gap-2",children:[e.jsx(w,{className:"h-5 w-5"}),"Endpoints API"]}),e.jsxs(l,{children:["Base URL: ",e.jsx("code",{className:"bg-muted px-2 py-1 rounded",children:"https://sendavapay.com/api"})]})]}),e.jsx(o,{className:"space-y-8",children:v.map((s,d)=>e.jsxs("div",{className:"border-b pb-6 last:border-0 last:pb-0",children:[e.jsxs("div",{className:"flex items-center gap-3 mb-3",children:[e.jsx(c,{className:s.method==="GET"?"bg-blue-500":"bg-green-500",children:s.method}),e.jsx("code",{className:"text-sm font-mono",children:s.path})]}),e.jsx("p",{className:"text-muted-foreground mb-4",children:s.description}),s.params.length>0&&e.jsxs("div",{className:"mb-4",children:[e.jsx("h4",{className:"font-medium mb-2",children:"Paramètres"}),e.jsx("div",{className:"bg-muted rounded-lg overflow-hidden",children:e.jsxs("table",{className:"w-full text-sm",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b",children:[e.jsx("th",{className:"text-left p-3",children:"Nom"}),e.jsx("th",{className:"text-left p-3",children:"Type"}),e.jsx("th",{className:"text-left p-3",children:"Requis"}),e.jsx("th",{className:"text-left p-3",children:"Description"})]})}),e.jsx("tbody",{children:s.params.map((t,b)=>e.jsxs("tr",{className:"border-b last:border-0",children:[e.jsx("td",{className:"p-3 font-mono",children:t.name}),e.jsx("td",{className:"p-3",children:t.type}),e.jsx("td",{className:"p-3",children:t.required?e.jsx(c,{className:"bg-red-500",children:"Oui"}):e.jsx(c,{variant:"outline",children:"Non"})}),e.jsx("td",{className:"p-3 text-muted-foreground",children:t.description})]},b))})]})})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"Réponse"}),e.jsx(a,{id:`response-${d}`,language:"json",code:s.response})]})]},d))})]}),e.jsxs(r,{id:"code-examples",children:[e.jsxs(n,{children:[e.jsxs(i,{className:"flex items-center gap-2",children:[e.jsx(f,{className:"h-5 w-5"}),"Exemples de code"]}),e.jsx(l,{children:"Exemples d'intégration dans différents langages"})]}),e.jsx(o,{children:e.jsxs(P,{defaultValue:"javascript",children:[e.jsxs(A,{className:"mb-4",children:[e.jsx(m,{value:"javascript","data-testid":"tab-js",children:"JavaScript"}),e.jsx(m,{value:"php","data-testid":"tab-php",children:"PHP"}),e.jsx(m,{value:"python","data-testid":"tab-python",children:"Python"})]}),e.jsx(u,{value:"javascript",children:e.jsx(a,{id:"js-example",language:"javascript",code:`// Installation: npm install axios
const axios = require('axios');

const API_KEY = 'pk_live_votre_cle_api';
const BASE_URL = 'https://sendavapay.com/api';

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
}`})}),e.jsx(u,{value:"php",children:e.jsx(a,{id:"php-example",language:"php",code:`<?php
// Configuration
$apiKey = 'pk_live_votre_cle_api';
$baseUrl = 'https://sendavapay.com/api';

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
?>`})}),e.jsx(u,{value:"python",children:e.jsx(a,{id:"python-example",language:"python",code:`import requests
import json

# Configuration
API_KEY = 'pk_live_votre_cle_api'
BASE_URL = 'https://sendavapay.com/api'

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
        print('Statut:', json.dumps(status, indent=2))`})})]})})]}),e.jsxs(r,{id:"webhooks",children:[e.jsxs(n,{children:[e.jsxs(i,{className:"flex items-center gap-2",children:[e.jsx(j,{className:"h-5 w-5"}),"Webhooks"]}),e.jsx(l,{children:"Recevez des notifications en temps réel pour les événements de paiement"})]}),e.jsxs(o,{className:"space-y-6",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"Événements disponibles"}),e.jsxs("ul",{className:"space-y-2 text-muted-foreground",children:[e.jsxs("li",{children:[e.jsx("code",{className:"bg-muted px-2 py-1 rounded",children:"payment.completed"})," - Paiement réussi"]}),e.jsxs("li",{children:[e.jsx("code",{className:"bg-muted px-2 py-1 rounded",children:"payment.failed"})," - Paiement échoué"]}),e.jsxs("li",{children:[e.jsx("code",{className:"bg-muted px-2 py-1 rounded",children:"credit.completed"})," - Crédit effectué"]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"Structure du webhook"}),e.jsx(a,{id:"webhook-structure",language:"json",code:`{
  "event": "payment.completed",
  "data": {
    "reference": "pay_abc123_xyz789",
    "amount": 5000,
    "currency": "XOF",
    "customerPhone": "+22890123456"
  },
  "timestamp": "2024-01-15T10:35:00Z"
}`})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"En-têtes de la requête"}),e.jsxs("ul",{className:"space-y-2 text-muted-foreground",children:[e.jsxs("li",{children:[e.jsx("code",{className:"bg-muted px-2 py-1 rounded",children:"X-SendavaPay-Signature"})," - Signature HMAC-SHA256"]}),e.jsxs("li",{children:[e.jsx("code",{className:"bg-muted px-2 py-1 rounded",children:"X-SendavaPay-Event"})," - Type d'événement"]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"Exemple de réception"}),e.jsx(a,{id:"webhook-example",language:"javascript",code:`// Exemple de réception de webhook (Node.js/Express)
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

app.listen(3000);`})]})]})]}),e.jsxs(r,{id:"errors",children:[e.jsx(n,{children:e.jsx(i,{children:"Codes d'erreur"})}),e.jsx(o,{children:e.jsx("div",{className:"bg-muted rounded-lg overflow-hidden",children:e.jsxs("table",{className:"w-full text-sm",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b",children:[e.jsx("th",{className:"text-left p-3",children:"Code HTTP"}),e.jsx("th",{className:"text-left p-3",children:"Code"}),e.jsx("th",{className:"text-left p-3",children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{className:"border-b",children:[e.jsx("td",{className:"p-3",children:"401"}),e.jsx("td",{className:"p-3 font-mono",children:"UNAUTHORIZED"}),e.jsx("td",{className:"p-3 text-muted-foreground",children:"Clé API manquante"})]}),e.jsxs("tr",{className:"border-b",children:[e.jsx("td",{className:"p-3",children:"401"}),e.jsx("td",{className:"p-3 font-mono",children:"INVALID_API_KEY"}),e.jsx("td",{className:"p-3 text-muted-foreground",children:"Clé API invalide"})]}),e.jsxs("tr",{className:"border-b",children:[e.jsx("td",{className:"p-3",children:"403"}),e.jsx("td",{className:"p-3 font-mono",children:"ACCOUNT_SUSPENDED"}),e.jsx("td",{className:"p-3 text-muted-foreground",children:"Compte marchand suspendu"})]}),e.jsxs("tr",{className:"border-b",children:[e.jsx("td",{className:"p-3",children:"404"}),e.jsx("td",{className:"p-3 font-mono",children:"PAYMENT_NOT_FOUND"}),e.jsx("td",{className:"p-3 text-muted-foreground",children:"Paiement non trouvé"})]}),e.jsxs("tr",{children:[e.jsx("td",{className:"p-3",children:"404"}),e.jsx("td",{className:"p-3 font-mono",children:"USER_NOT_FOUND"}),e.jsx("td",{className:"p-3 text-muted-foreground",children:"Utilisateur non trouvé"})]})]})]})})})]}),e.jsxs("div",{className:"text-center py-8",children:[e.jsx("p",{className:"text-muted-foreground mb-4",children:"Besoin d'aide ? Contactez notre support technique"}),e.jsx("a",{href:"/merchant",children:e.jsxs(p,{size:"lg","data-testid":"button-start-integration",children:[e.jsx(I,{className:"h-5 w-5 mr-2"}),"Commencer l'intégration"]})})]})]})})]})}export{te as default};
