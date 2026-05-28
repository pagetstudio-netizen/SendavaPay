import{b as ue,c as xe,r as h,u as I,d as ae,j as e,e as P,L as $,f as re,q as ne}from"./index-CkIePDmp.js";import{D as S}from"./dashboard-layout-Dqss2wPo.js";import{B as p}from"./button-BFfRDJL-.js";import{C as u,b as g,c as f,d as N,a as x}from"./card-BD7ekw76.js";import{I as K}from"./input-D2Twlwv5.js";import{L as q}from"./label-DB3Mq0qz.js";import{C as o,B as d}from"./badge-C4Y_T1QW.js";import{T as he,b as je,c as ie,a as le}from"./tabs-CcQwZ3K5.js";import{A as ge,a as fe,b as ve,c as Ne,d as ye,e as be,f as we,g as Ce}from"./alert-dialog-BY6t7NLl.js";import{W as ke}from"./wrench-KIcsQlNw.js";import{A as W}from"./arrow-left-WecbFZXI.js";import{S as M}from"./shield-WewPGnVO.js";import{K as X}from"./key-vBfmmIxz.js";import{P as Te}from"./plus-DAmdZnfA.js";import{C as R}from"./code-xml-tD5BCrBc.js";import{E as G}from"./external-link-BNsBP0AK.js";import{W as ce}from"./webhook-DkQllzMX.js";import{G as L}from"./globe-PaCeY4On.js";import{B as de,T as Ae}from"./terminal-C-byXIrq.js";import{T as oe}from"./trash-2-1F8Ek265.js";import{C as V}from"./copy-6DA5wfBa.js";import{I as Pe}from"./info-h9ZXL34_.js";import{Z as Se}from"./zap-DQ6ZkYmm.js";import{A as Re}from"./arrow-up-right-DG3kniPW.js";import{B as Ee}from"./bell-CHXHwQyU.js";import{C as Ue}from"./chevron-up-yYmeg9iH.js";import{C as _e}from"./chevron-down-i3RtlQLl.js";import"./avatar-CJVIeHUq.js";import"./dropdown-menu-DmdGgi0k.js";import"./index-BkewHygD.js";import"./index-BVb5Lg_e.js";import"./index-vm7LCfPp.js";import"./menu-DihcqfQi.js";import"./circle-r3gFfByU.js";import"./theme-toggle-jmzbnTzE.js";import"./sun-CYgYIhBt.js";import"./20251211_105226_1765450558306-pbBvZwWp.js";import"./circle-check-big-Dh4AvoqA.js";import"./file-text-Dj5Cci0L.js";import"./credit-card-D0pUuIYL.js";import"./send-CbAXdCTn.js";import"./link-BF4zTV4G.js";import"./clock-D1Nt-NUE.js";import"./key-round-B5owVLrV.js";import"./circle-help-BR3YQ0mX.js";import"./users-Buurxv-a.js";import"./shield-check-BuTl7RBu.js";import"./message-square-B-Mrm3u6.js";import"./trending-up-DwiCCCcL.js";function n({code:a,language:O="bash"}){const[r,c]=h.useState(!1),y=()=>{navigator.clipboard.writeText(a),c(!0),setTimeout(()=>c(!1),2e3)};return e.jsxs("div",{className:"relative group",children:[e.jsx("pre",{className:"bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-xs font-mono leading-relaxed",children:e.jsx("code",{children:a})}),e.jsx(p,{variant:"ghost",size:"sm",className:"absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-white hover:bg-slate-700",onClick:y,children:r?e.jsx(o,{className:"h-3 w-3"}):e.jsx(V,{className:"h-3 w-3"})})]})}function Ke({apiKeys:a}){var T;const r=((T=a.filter(t=>t.apiType==="sdk"&&t.isActive)[0])==null?void 0:T.apiKey)||"sdk_votre_cle_ici",[c,y]=h.useState("intro"),E=t=>y(c===t?null:t),l=({id:t,title:m,icon:j,children:i})=>e.jsxs(u,{className:"overflow-hidden",children:[e.jsxs("button",{className:"w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors",onClick:()=>E(t),children:[e.jsxs("div",{className:"flex items-center gap-2 font-semibold",children:[e.jsx(j,{className:"h-5 w-5 text-primary"}),m]}),c===t?e.jsx(Ue,{className:"h-4 w-4"}):e.jsx(_e,{className:"h-4 w-4"})]}),c===t&&e.jsx(x,{className:"pt-0 space-y-4",children:i})]});return e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center gap-2 p-4 bg-primary/10 rounded-lg border border-primary/20",children:[e.jsx(Pe,{className:"h-5 w-5 text-primary flex-shrink-0"}),e.jsxs("p",{className:"text-sm",children:[e.jsx("strong",{children:"API SDK"})," — Intégration complète pour marchands. Créez des paiements, gérez des retraits automatiques et configurez des webhooks directement depuis votre site."]})]}),e.jsxs(l,{id:"intro",title:"Authentification",icon:M,children:[e.jsxs("p",{className:"text-sm text-muted-foreground",children:["Incluez votre clé API SDK dans l'en-tête ",e.jsx("code",{className:"bg-muted px-1 rounded",children:"Authorization"})," de chaque requête."]}),e.jsx(n,{code:`Authorization: Bearer ${r}`}),e.jsx("div",{className:"p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800",children:e.jsxs("p",{className:"text-sm text-amber-800 dark:text-amber-200",children:[e.jsx("strong",{children:"Base URL :"})," ",e.jsx("code",{children:"https://sendavapay.com/api/sdk/v1"})]})})]}),e.jsxs(l,{id:"wallet-routing",title:"Routage automatique par pays / wallet",icon:L,children:[e.jsx("p",{className:"text-sm text-muted-foreground",children:"SendavaPay détecte automatiquement le pays du payeur et crédite le bon wallet. Chaque paiement est attribué au wallet du pays correspondant."}),e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full text-sm border rounded-lg overflow-hidden",children:[e.jsx("thead",{className:"bg-muted",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-medium",children:"Pays du payeur"}),e.jsx("th",{className:"text-left p-3 font-medium",children:"Wallet crédité"}),e.jsx("th",{className:"text-left p-3 font-medium",children:"Devise"}),e.jsx("th",{className:"text-left p-3 font-medium",children:"Code pays"})]})}),e.jsx("tbody",{children:[["Togo","Wallet Togo","XOF","TG"],["Bénin","Wallet Bénin","XOF","BJ"],["Sénégal","Wallet Sénégal","XOF","SN"],["Côte d'Ivoire","Wallet CI","XOF","CI"],["Mali","Wallet Mali","XOF","ML"],["Burkina Faso","Wallet Burkina","XOF","BF"],["Cameroun","Wallet Cameroun","XAF","CM"],["Guinée","Wallet Guinée","GNF","GN"]].map(([t,m,j,i])=>e.jsxs("tr",{className:"border-t hover:bg-muted/30",children:[e.jsx("td",{className:"p-3",children:t}),e.jsx("td",{className:"p-3 text-primary font-medium",children:m}),e.jsx("td",{className:"p-3 font-mono",children:j}),e.jsx("td",{className:"p-3 font-mono text-muted-foreground",children:i})]},i))})]})}),e.jsxs("div",{className:"p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200",children:[e.jsx("strong",{children:"Exemple :"})," Un client depuis le Togo paie via TMoney → l'argent est crédité sur votre ",e.jsx("strong",{children:"Wallet Togo"}),". Un client depuis le Sénégal paie via Wave → l'argent va sur votre ",e.jsx("strong",{children:"Wallet Sénégal"}),"."]})]}),e.jsxs(l,{id:"create-payment",title:"Créer un paiement",icon:Se,children:[e.jsx("p",{className:"text-sm text-muted-foreground",children:"Génère une URL de paiement que vous redirigez vers votre client."}),e.jsx("div",{className:"space-y-1",children:e.jsx(d,{variant:"outline",className:"font-mono text-xs",children:"POST /api/sdk/v1/create-payment"})}),e.jsx(n,{language:"json",code:`// Corps de la requête
{
  "amount": 5000,
  "currency": "XOF",
  "description": "Commande #1234",
  "customerName": "Jean Dupont",
  "customerEmail": "jean@example.com",
  "customerPhone": "+22890000000",
  "payerCountry": "TG",
  "redirectUrl": "https://monsite.com/succes",
  "webhookUrl": "https://monsite.com/api/webhook",
  "externalReference": "order_1234"
}`}),e.jsx(n,{language:"json",code:`// Réponse
{
  "success": true,
  "data": {
    "reference": "sdk_abc123",
    "amount": 5000,
    "currency": "XOF",
    "status": "pending",
    "paymentUrl": "https://sendavapay.com/pay/api/sdk_abc123",
    "walletRouting": {
      "detectedCountry": "TG",
      "targetWallet": "Togo",
      "note": "Les fonds seront crédités sur le wallet Togo"
    },
    "createdAt": "2024-01-15T10:00:00Z"
  }
}`}),e.jsxs("p",{className:"text-sm text-muted-foreground",children:["Redirigez votre client vers ",e.jsx("code",{className:"bg-muted px-1 rounded",children:"paymentUrl"}),". Après paiement, il est renvoyé vers votre ",e.jsx("code",{className:"bg-muted px-1 rounded",children:"redirectUrl"}),"."]})]}),e.jsxs(l,{id:"verify-payment",title:"Vérifier un paiement",icon:o,children:[e.jsx(d,{variant:"outline",className:"font-mono text-xs",children:"POST /api/sdk/v1/verify-payment"}),e.jsx(n,{code:`// Corps
{ "reference": "sdk_abc123" }

// Réponse
{
  "success": true,
  "data": {
    "reference": "sdk_abc123",
    "amount": "5000.00",
    "status": "completed",   // pending | completed | failed | cancelled
    "paymentMethod": "tmoney",
    "completedAt": "2024-01-15T10:05:00Z"
  }
}`}),e.jsxs("div",{className:"p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-sm text-green-800 dark:text-green-200",children:[e.jsx("strong",{children:"Conseil de sécurité :"})," Vérifiez toujours le statut côté serveur avant de valider une commande. Ne vous fiez pas uniquement à la redirection."]})]}),e.jsxs(l,{id:"withdraw",title:"Retrait automatique (Mobile Money)",icon:Re,children:[e.jsx("p",{className:"text-sm text-muted-foreground",children:"Envoyez de l'argent automatiquement depuis votre wallet vers un numéro Mobile Money. Le wallet du pays spécifié est débité."}),e.jsx(d,{variant:"outline",className:"font-mono text-xs",children:"POST /api/sdk/v1/withdraw"}),e.jsx(n,{code:`// Corps de la requête
{
  "amount": 10000,
  "phoneNumber": "+22890123456",
  "operator": "tmoney",
  "country": "TG",
  "currency": "XOF",
  "description": "Paiement fournisseur",
  "externalReference": "payout_456"
}

// Réponse
{
  "success": true,
  "data": {
    "withdrawalId": 42,
    "reference": "sdk_xyz789",
    "amount": 10000,
    "fee": 100,
    "netAmount": 9900,
    "currency": "XOF",
    "phoneNumber": "+22890123456",
    "operator": "tmoney",
    "country": "TG",
    "countryName": "Togo",
    "walletDebited": "Togo",
    "status": "pending",
    "message": "Demande de retrait créée."
  }
}`}),e.jsxs("div",{className:"p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border text-sm",children:[e.jsx("strong",{children:"Routage wallet :"})," Le montant est prélevé sur votre ",e.jsx("strong",{children:"Wallet Togo"})," si ",e.jsx("code",{children:'country: "TG"'}),", sur votre ",e.jsx("strong",{children:"Wallet Bénin"})," si ",e.jsx("code",{children:'country: "BJ"'}),", etc. Assurez-vous que le wallet du pays a suffisamment de fonds."]}),e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full text-sm border rounded-lg overflow-hidden",children:[e.jsx("thead",{className:"bg-muted",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-2 font-medium",children:"Pays"}),e.jsx("th",{className:"text-left p-2 font-medium",children:"Code"}),e.jsx("th",{className:"text-left p-2 font-medium",children:"Opérateurs supportés"})]})}),e.jsx("tbody",{children:[["Togo","TG","tmoney, flooz, togocel"],["Bénin","BJ","mtn_bj, moov_bj"],["Sénégal","SN","orange_sn, wave_sn, free_sn"],["Côte d'Ivoire","CI","orange_ci, mtn_ci, wave_ci, moov_ci"],["Mali","ML","orange_ml, wave_ml, moov_ml"],["Cameroun","CM","orange_cm, mtn_cm"]].map(([t,m,j])=>e.jsxs("tr",{className:"border-t",children:[e.jsx("td",{className:"p-2",children:t}),e.jsx("td",{className:"p-2 font-mono text-muted-foreground",children:m}),e.jsx("td",{className:"p-2 font-mono text-xs",children:j})]},m))})]})})]}),e.jsxs(l,{id:"balance",title:"Soldes des wallets",icon:X,children:[e.jsx(d,{variant:"outline",className:"font-mono text-xs",children:"GET /api/sdk/v1/balance"}),e.jsx(n,{code:`// Tous les wallets
GET /api/sdk/v1/balance

// Un pays spécifique
GET /api/sdk/v1/balance?country=TG

// Réponse (tous les wallets)
{
  "success": true,
  "data": {
    "wallets": [
      { "country": "TG", "countryName": "Togo", "balance": "25000.00", "currency": "XOF" },
      { "country": "SN", "countryName": "Sénégal", "balance": "8500.00", "currency": "XOF" },
      { "country": "CI", "countryName": "Côte d'Ivoire", "balance": "0.00", "currency": "XOF" }
    ],
    "totalWallets": 9
  }
}`})]}),e.jsxs(l,{id:"transactions",title:"Historique des transactions",icon:de,children:[e.jsx(d,{variant:"outline",className:"font-mono text-xs",children:"GET /api/sdk/v1/transactions"}),e.jsx(n,{code:`// Réponse
{
  "success": true,
  "data": {
    "transactions": [
      {
        "reference": "sdk_abc123",
        "type": "payment",
        "amount": "5000.00",
        "fee": "350.00",
        "currency": "XOF",
        "status": "completed",
        "customerPhone": "+22890000000",
        "paymentMethod": "tmoney",
        "createdAt": "2024-01-15T10:00:00Z",
        "completedAt": "2024-01-15T10:05:00Z"
      }
    ],
    "total": 1
  }
}`})]}),e.jsxs(l,{id:"webhook",title:"Webhooks — Notifications automatiques",icon:ce,children:[e.jsx("p",{className:"text-sm text-muted-foreground",children:"Configurez une URL webhook pour recevoir des notifications en temps réel à chaque paiement complété."}),e.jsx(d,{variant:"outline",className:"font-mono text-xs",children:"PUT /api/sdk/v1/webhook"}),e.jsx(n,{code:`// Corps
{ "webhookUrl": "https://monsite.com/api/webhook/sendavapay" }

// Réponse
{
  "success": true,
  "data": {
    "webhookUrl": "https://monsite.com/api/webhook/sendavapay",
    "webhookSecret": "whsec_abc123...",
    "message": "Webhook configuré avec succès."
  }
}`}),e.jsx("p",{className:"text-sm font-medium mt-2",children:"Payload reçu sur votre serveur :"}),e.jsx(n,{code:`{
  "event": "payment.completed",
  "reference": "sdk_abc123",
  "amount": "5000.00",
  "currency": "XOF",
  "status": "completed",
  "customerPhone": "+22890000000",
  "paymentMethod": "tmoney",
  "timestamp": "2024-01-15T10:05:00Z"
}`}),e.jsx("p",{className:"text-sm font-medium",children:"Vérification de signature (Node.js) :"}),e.jsx(n,{language:"javascript",code:`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return \`sha256=\${expected}\` === signature;
}

// Dans votre route Express
app.post('/api/webhook/sendavapay', (req, res) => {
  const sig = req.headers['x-sendavapay-signature'];
  if (!verifyWebhook(req.body, sig, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Signature invalide');
  }
  const { event, reference, status } = req.body;
  if (event === 'payment.completed' && status === 'completed') {
    // Valider la commande, livrer le produit, etc.
  }
  res.json({ received: true });
});`})]}),e.jsxs(l,{id:"examples",title:"Exemples d'intégration",icon:Ae,children:[e.jsx("p",{className:"text-sm font-medium",children:"JavaScript / Node.js"}),e.jsx(n,{language:"javascript",code:`const API_KEY = '${r}';
const BASE_URL = 'https://sendavapay.com/api/sdk/v1';

async function createPayment(order) {
  const res = await fetch(\`\${BASE_URL}/create-payment\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${API_KEY}\`
    },
    body: JSON.stringify({
      amount: order.total,
      currency: 'XOF',
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      payerCountry: order.country,  // 'TG', 'BJ', 'SN', etc.
      redirectUrl: 'https://monsite.com/merci',
      externalReference: order.id
    })
  });
  const data = await res.json();
  // Rediriger le client vers data.data.paymentUrl
  return data.data.paymentUrl;
}`}),e.jsx("p",{className:"text-sm font-medium",children:"PHP"}),e.jsx(n,{language:"php",code:`<?php
$apiKey = '${r}';
$baseUrl = 'https://sendavapay.com/api/sdk/v1';

function createPayment($amount, $customerEmail, $country) {
  global $apiKey, $baseUrl;
  $ch = curl_init("$baseUrl/create-payment");
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
      "Content-Type: application/json",
      "Authorization: Bearer $apiKey"
    ],
    CURLOPT_POSTFIELDS => json_encode([
      'amount' => $amount,
      'currency' => 'XOF',
      'customerEmail' => $customerEmail,
      'payerCountry' => $country,
      'redirectUrl' => 'https://monsite.com/merci'
    ])
  ]);
  $res = json_decode(curl_exec($ch), true);
  curl_close($ch);
  return $res['data']['paymentUrl'];
}
?>`}),e.jsx("p",{className:"text-sm font-medium",children:"Python"}),e.jsx(n,{language:"python",code:`import requests

API_KEY = '${r}'
BASE_URL = 'https://sendavapay.com/api/sdk/v1'

headers = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {API_KEY}'
}

def create_payment(amount, customer_email, country):
    res = requests.post(f'{BASE_URL}/create-payment', headers=headers, json={
        'amount': amount,
        'currency': 'XOF',
        'customerEmail': customer_email,
        'payerCountry': country,  # 'TG', 'BJ', 'SN', 'CI', etc.
        'redirectUrl': 'https://monsite.com/merci'
    })
    data = res.json()
    return data['data']['paymentUrl']`})]})]})}function Rs(){const{user:a,isLoading:O}=ue(),{toast:r}=xe(),[c,y]=h.useState(""),[E,l]=h.useState(""),[T,t]=h.useState(""),[m,j]=h.useState(""),[i,U]=h.useState(null),[H,J]=h.useState(null),[b,D]=h.useState(null),{data:w,isLoading:me}=I({queryKey:["/api/api-maintenance-status"],refetchInterval:1e4}),{data:C,isLoading:Z}=I({queryKey:["/api/user/api-permissions"],enabled:!!(a!=null&&a.isVerified)}),{data:z=[],isLoading:Y}=I({queryKey:["/api/api-keys"],enabled:!!(a!=null&&a.isVerified)&&!(w!=null&&w.enabled)}),B=ae({mutationFn:async s=>(await re("POST","/api/api-keys",s)).json(),onSuccess:()=>{ne.invalidateQueries({queryKey:["/api/api-keys"]}),y(""),l(""),t(""),j(""),U(null),r({title:"Clé créée",description:"Votre nouvelle clé API a été créée avec succès"})},onError:s=>{r({title:"Erreur",description:s.message||"Impossible de créer la clé",variant:"destructive"})}}),F=ae({mutationFn:async s=>{await re("DELETE",`/api/api-keys/${s}`)},onSuccess:()=>{ne.invalidateQueries({queryKey:["/api/api-keys"]}),r({title:"Clé supprimée"})},onError:()=>{r({title:"Erreur",description:"Impossible de supprimer la clé",variant:"destructive"})}}),Q=s=>{navigator.clipboard.writeText(s),J(s),r({title:"Copié"}),setTimeout(()=>J(null),2e3)},pe=()=>{if(!c.trim()){r({title:"Erreur",description:"Veuillez entrer un nom pour la clé",variant:"destructive"});return}if(!i){r({title:"Erreur",description:"Veuillez sélectionner un type d'API",variant:"destructive"});return}B.mutate({name:c.trim(),appName:E.trim()||void 0,webhookUrl:T.trim()||void 0,redirectUrl:m.trim()||void 0,apiType:i})};if(O||me)return e.jsx(S,{children:e.jsx("div",{className:"flex items-center justify-center min-h-[60vh]",children:e.jsx(P,{className:"h-8 w-8 animate-spin text-primary"})})});if(w!=null&&w.enabled)return e.jsx(S,{children:e.jsx("div",{className:"flex items-center justify-center min-h-[60vh] p-4",children:e.jsxs(u,{className:"max-w-lg w-full text-center",children:[e.jsxs(g,{children:[e.jsx("div",{className:"mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center",children:e.jsx(ke,{className:"h-8 w-8 text-orange-600 dark:text-orange-400"})}),e.jsx(f,{className:"text-2xl",children:"API en maintenance"}),e.jsx(N,{className:"text-base",children:"L'API est temporairement indisponible"})]}),e.jsx(x,{children:e.jsx($,{href:"/dashboard",children:e.jsxs(p,{variant:"outline",children:[e.jsx(W,{className:"h-4 w-4 mr-2"}),"Retour au tableau de bord"]})})})]})})});if(!(a!=null&&a.isVerified))return e.jsx(S,{children:e.jsxs("div",{className:"space-y-6 p-6",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold",children:"API de Paiement"}),e.jsx("p",{className:"text-muted-foreground",children:"Intégrez SendavaPay dans vos applications"})]}),e.jsxs(u,{children:[e.jsxs(g,{children:[e.jsxs(f,{className:"flex items-center gap-2",children:[e.jsx(M,{className:"h-5 w-5 text-yellow-500"}),"Vérification requise"]}),e.jsx(N,{children:"Votre compte doit être vérifié pour accéder à l'API"})]}),e.jsxs(x,{className:"space-y-4",children:[e.jsx("p",{className:"text-muted-foreground",children:"Pour des raisons de sécurité, seuls les comptes vérifiés peuvent accéder à l'API SendavaPay. Complétez votre vérification KYC pour obtenir vos clés API."}),e.jsx("div",{className:"flex flex-col sm:flex-row gap-3",children:e.jsx($,{href:"/dashboard/kyc",children:e.jsxs(p,{children:[e.jsx(M,{className:"h-4 w-4 mr-2"}),"Vérifier mon compte"]})})})]})]})]})});const A=(C==null?void 0:C.apiSdkEnabled)??!1,_=(C==null?void 0:C.apiRedirectEnabled)??!0,ee=A||_;if(!ee&&!Z)return e.jsx(S,{children:e.jsxs("div",{className:"space-y-6 p-6",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold",children:"API de Paiement"}),e.jsx("p",{className:"text-muted-foreground",children:"Intégrez SendavaPay dans vos applications"})]}),e.jsxs(u,{children:[e.jsxs(g,{children:[e.jsxs(f,{className:"flex items-center gap-2",children:[e.jsx(X,{className:"h-5 w-5 text-muted-foreground"}),"Accès API non activé"]}),e.jsx(N,{children:"L'accès à l'API n'est pas encore activé sur votre compte"})]}),e.jsxs(x,{className:"space-y-4",children:[e.jsx("p",{className:"text-muted-foreground",children:"Pour accéder à l'API SendavaPay, contactez l'équipe d'assistance pour demander l'activation sur votre compte."}),e.jsx($,{href:"/dashboard",children:e.jsxs(p,{variant:"outline",children:[e.jsx(W,{className:"h-4 w-4 mr-2"}),"Retour au tableau de bord"]})})]})]})]})});const v=z.filter(s=>s.apiType==="sdk"),k=z.filter(s=>s.apiType==="redirect"),se=({keyItem:s})=>e.jsxs("div",{className:"flex flex-col gap-3 p-4 border rounded-lg","data-testid":`api-key-${s.id}`,children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-start justify-between gap-3",children:[e.jsxs("div",{className:"space-y-1 flex-1 min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[e.jsx("span",{className:"font-medium",children:s.name}),e.jsx(d,{variant:s.isActive?"default":"secondary",children:s.isActive?"Active":"Inactive"}),e.jsx(d,{variant:"outline",className:s.apiType==="sdk"?"border-purple-400 text-purple-700 dark:text-purple-300":"",children:s.apiType==="sdk"?"SDK":"Redirection"})]}),s.appName&&e.jsxs("p",{className:"text-sm text-muted-foreground",children:["Application : ",s.appName]}),e.jsx("code",{className:"text-sm text-muted-foreground font-mono block truncate",children:s.apiKey}),e.jsxs("p",{className:"text-xs text-muted-foreground",children:["Créée le ",new Date(s.createdAt).toLocaleDateString("fr-FR"),s.requestCount>0&&` • ${s.requestCount} requêtes`]})]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx(p,{variant:"outline",size:"sm",onClick:()=>Q(s.apiKey),"data-testid":`button-copy-${s.id}`,children:H===s.apiKey?e.jsx(o,{className:"h-4 w-4"}):e.jsx(V,{className:"h-4 w-4"})}),e.jsx(p,{variant:"outline",size:"sm",onClick:()=>D(s),disabled:F.isPending,"data-testid":`button-delete-${s.id}`,children:e.jsx(oe,{className:"h-4 w-4 text-destructive"})})]})]}),(s.redirectUrl||s.webhookUrl)&&e.jsxs("div",{className:"space-y-2 border-t pt-3",children:[e.jsxs("div",{className:"flex flex-wrap gap-4 text-xs",children:[s.redirectUrl&&e.jsxs("div",{className:"flex items-center gap-1 text-muted-foreground",children:[e.jsx(G,{className:"h-3 w-3"}),e.jsx("span",{children:"Redirection:"}),e.jsx("span",{className:"font-mono truncate max-w-[200px]",children:s.redirectUrl})]}),s.webhookUrl&&e.jsxs("div",{className:"flex items-center gap-1 text-muted-foreground",children:[e.jsx(Ee,{className:"h-3 w-3"}),e.jsx("span",{children:"Webhook:"}),e.jsx("span",{className:"font-mono truncate max-w-[200px]",children:s.webhookUrl})]})]}),s.webhookSecret&&e.jsxs("div",{className:"flex items-center gap-2 text-xs",children:[e.jsx("span",{className:"text-muted-foreground",children:"Webhook Secret:"}),e.jsx("code",{className:"font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded truncate max-w-[200px]",children:s.webhookSecret}),e.jsx(p,{variant:"ghost",size:"sm",className:"h-6 w-6 p-0",onClick:()=>Q(s.webhookSecret),"data-testid":`button-copy-secret-${s.id}`,children:H===s.webhookSecret?e.jsx(o,{className:"h-3 w-3"}):e.jsx(V,{className:"h-3 w-3"})})]})]})]});return e.jsxs(S,{children:[e.jsxs("div",{className:"space-y-6 p-6",children:[e.jsx("div",{className:"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",children:e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold",children:"API de Paiement"}),e.jsx("p",{className:"text-muted-foreground",children:"Gérez vos clés d'intégration SendavaPay"})]})}),!i&&ee&&e.jsxs(u,{children:[e.jsxs(g,{children:[e.jsxs(f,{className:"flex items-center gap-2",children:[e.jsx(Te,{className:"h-5 w-5"}),"Créer une clé API"]}),e.jsx(N,{children:"Choisissez le type d'intégration adapté à votre projet"})]}),e.jsx(x,{children:e.jsxs("div",{className:"grid sm:grid-cols-2 gap-4",children:[A&&e.jsxs("button",{className:"p-5 border-2 rounded-xl text-left hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group",onClick:()=>U("sdk"),children:[e.jsxs("div",{className:"flex items-center gap-3 mb-3",children:[e.jsx("div",{className:"h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors",children:e.jsx(R,{className:"h-5 w-5 text-purple-600 dark:text-purple-400"})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-semibold",children:"API SDK"}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"Intégration complète"})]})]}),e.jsxs("ul",{className:"text-sm text-muted-foreground space-y-1",children:[e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(o,{className:"h-3 w-3 text-green-500 flex-shrink-0"})," Paiements avec routage par pays"]}),e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(o,{className:"h-3 w-3 text-green-500 flex-shrink-0"})," Retrait automatique Mobile Money"]}),e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(o,{className:"h-3 w-3 text-green-500 flex-shrink-0"})," Gestion des wallets par pays"]}),e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(o,{className:"h-3 w-3 text-green-500 flex-shrink-0"})," Webhooks + Documentation complète"]})]})]}),_&&e.jsxs("button",{className:"p-5 border-2 rounded-xl text-left hover:border-primary hover:bg-primary/5 transition-all group",onClick:()=>U("redirect"),children:[e.jsxs("div",{className:"flex items-center gap-3 mb-3",children:[e.jsx("div",{className:"h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors",children:e.jsx(G,{className:"h-5 w-5 text-blue-600 dark:text-blue-400"})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-semibold",children:"API Redirection"}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"Simple et rapide"})]})]}),e.jsxs("ul",{className:"text-sm text-muted-foreground space-y-1",children:[e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(o,{className:"h-3 w-3 text-green-500 flex-shrink-0"})," Liens de paiement générés"]}),e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(o,{className:"h-3 w-3 text-green-500 flex-shrink-0"})," Redirection après paiement"]}),e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(o,{className:"h-3 w-3 text-green-500 flex-shrink-0"})," Notifications webhook"]}),e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(o,{className:"h-3 w-3 text-green-500 flex-shrink-0"})," Intégration sans SDK"]})]})]})]})})]}),i&&e.jsxs(u,{children:[e.jsxs(g,{children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx(f,{className:"flex items-center gap-2",children:i==="sdk"?e.jsxs(e.Fragment,{children:[e.jsx(R,{className:"h-5 w-5 text-purple-600"})," Nouvelle clé API SDK"]}):e.jsxs(e.Fragment,{children:[e.jsx(G,{className:"h-5 w-5 text-blue-600"})," Nouvelle clé API Redirection"]})}),e.jsxs(p,{variant:"ghost",size:"sm",onClick:()=>U(null),children:[e.jsx(W,{className:"h-4 w-4 mr-1"})," Changer"]})]}),e.jsx(N,{children:i==="sdk"?"Clé pour l'intégration SDK complète avec retrait automatique":"Clé pour la création de liens de paiement avec redirection"})]}),e.jsxs(x,{className:"space-y-4",children:[e.jsxs("div",{className:"grid sm:grid-cols-2 gap-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx(q,{htmlFor:"keyName",children:"Nom de la clé *"}),e.jsx(K,{id:"keyName",placeholder:"Ex: Mon site e-commerce",value:c,onChange:s=>y(s.target.value),"data-testid":"input-key-name"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(q,{htmlFor:"appName",children:"Nom de l'application"}),e.jsx(K,{id:"appName",placeholder:"Ex: MaBoutique.com",value:E,onChange:s=>l(s.target.value),"data-testid":"input-app-name"})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(q,{htmlFor:"redirectUrl",children:"URL de redirection (après paiement)"}),e.jsx(K,{id:"redirectUrl",type:"url",placeholder:"https://monsite.com/paiement/succes",value:m,onChange:s=>j(s.target.value),"data-testid":"input-redirect-url"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(q,{htmlFor:"webhookUrl",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(ce,{className:"h-4 w-4"}),"URL de webhook (notifications automatiques)"]})}),e.jsx(K,{id:"webhookUrl",type:"url",placeholder:"https://monsite.com/api/webhook/sendavapay",value:T,onChange:s=>t(s.target.value),"data-testid":"input-webhook-url"}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"SendavaPay enverra une notification POST sécurisée à cette URL lors de chaque paiement"})]}),e.jsxs(p,{onClick:pe,disabled:B.isPending,className:i==="sdk"?"bg-purple-600 hover:bg-purple-700":"","data-testid":"button-create-key",children:[B.isPending?e.jsx(P,{className:"h-4 w-4 mr-2 animate-spin"}):e.jsx(X,{className:"h-4 w-4 mr-2"}),"Générer la clé ",i==="sdk"?"SDK":"Redirection"]})]})]}),!Z&&e.jsxs(he,{defaultValue:A&&v.length>0?"sdk":"redirect",children:[e.jsxs(je,{children:[A&&e.jsxs(ie,{value:"sdk",className:"gap-2",children:[e.jsx(R,{className:"h-4 w-4"}),"Clés SDK",v.length>0&&e.jsx(d,{variant:"secondary",className:"ml-1 h-5 text-xs",children:v.length})]}),_&&e.jsxs(ie,{value:"redirect",className:"gap-2",children:[e.jsx(L,{className:"h-4 w-4"}),"Clés Redirection",k.length>0&&e.jsx(d,{variant:"secondary",className:"ml-1 h-5 text-xs",children:k.length})]})]}),A&&e.jsxs(le,{value:"sdk",className:"space-y-4 mt-4",children:[e.jsxs(u,{children:[e.jsxs(g,{children:[e.jsxs(f,{className:"flex items-center gap-2 text-base",children:[e.jsx(R,{className:"h-4 w-4 text-purple-600"}),"Clés API SDK"]}),e.jsxs(N,{children:[v.length," clé",v.length!==1?"s":""," SDK"]})]}),e.jsx(x,{children:Y?e.jsx("div",{className:"flex justify-center py-8",children:e.jsx(P,{className:"h-6 w-6 animate-spin text-muted-foreground"})}):v.length===0?e.jsxs("div",{className:"text-center py-8 text-muted-foreground",children:[e.jsx(R,{className:"h-12 w-12 mx-auto mb-3 opacity-50"}),e.jsx("p",{children:"Aucune clé SDK créée"}),e.jsx("p",{className:"text-sm",children:'Cliquez sur "Créer une clé API" pour commencer'})]}):e.jsx("div",{className:"space-y-3",children:v.map(s=>e.jsx(se,{keyItem:s},s.id))})})]}),e.jsxs("div",{children:[e.jsxs("h2",{className:"text-xl font-bold mb-4 flex items-center gap-2",children:[e.jsx(de,{className:"h-5 w-5 text-purple-600"}),"Documentation API SDK"]}),e.jsx(Ke,{apiKeys:z})]})]}),_&&e.jsxs(le,{value:"redirect",className:"space-y-4 mt-4",children:[e.jsxs(u,{children:[e.jsxs(g,{children:[e.jsxs(f,{className:"flex items-center gap-2 text-base",children:[e.jsx(L,{className:"h-4 w-4 text-blue-600"}),"Clés API Redirection"]}),e.jsxs(N,{children:[k.length," clé",k.length!==1?"s":""," Redirection"]})]}),e.jsx(x,{children:Y?e.jsx("div",{className:"flex justify-center py-8",children:e.jsx(P,{className:"h-6 w-6 animate-spin text-muted-foreground"})}):k.length===0?e.jsxs("div",{className:"text-center py-8 text-muted-foreground",children:[e.jsx(L,{className:"h-12 w-12 mx-auto mb-3 opacity-50"}),e.jsx("p",{children:"Aucune clé Redirection créée"}),e.jsx("p",{className:"text-sm",children:'Cliquez sur "Créer une clé API" pour commencer'})]}):e.jsx("div",{className:"space-y-3",children:k.map(s=>e.jsx(se,{keyItem:s},s.id))})})]}),e.jsxs(u,{children:[e.jsx(g,{children:e.jsx(f,{children:"Comment utiliser l'API Redirection"})}),e.jsxs(x,{className:"space-y-4",children:[e.jsx("p",{className:"text-muted-foreground",children:"Incluez votre clé API dans l'en-tête de chaque requête :"}),e.jsx(n,{code:"Authorization: Bearer VOTRE_CLE_API"}),e.jsxs("p",{className:"text-sm text-muted-foreground",children:[e.jsx("strong",{children:"Base URL :"})," ",e.jsx("code",{className:"bg-muted px-1 rounded",children:"https://sendavapay.com/api/v1"})]}),e.jsx("div",{className:"grid sm:grid-cols-2 gap-3 text-sm",children:[["POST /api/v1/create-payment","Créer un lien de paiement"],["POST /api/v1/verify-payment","Vérifier le statut"],["GET /api/v1/balance","Consulter le solde"],["GET /api/v1/transactions","Historique des transactions"]].map(([s,te])=>e.jsxs("div",{className:"p-3 bg-muted rounded-lg",children:[e.jsx("code",{className:"text-xs block mb-1",children:s}),e.jsx("p",{className:"text-muted-foreground text-xs",children:te})]},s))})]})]})]})]})]}),e.jsx(ge,{open:!!b,onOpenChange:s=>!s&&D(null),children:e.jsxs(fe,{children:[e.jsxs(ve,{children:[e.jsx(Ne,{children:"Supprimer cette clé API ?"}),e.jsxs(ye,{children:['Êtes-vous sûr de vouloir supprimer la clé "',b==null?void 0:b.name,'" ? Cette action est irréversible et toutes les intégrations utilisant cette clé cesseront de fonctionner.']})]}),e.jsxs(be,{children:[e.jsx(we,{children:"Annuler"}),e.jsxs(Ce,{onClick:()=>{b&&(F.mutate(b.id),D(null))},className:"bg-destructive text-destructive-foreground hover:bg-destructive/90",children:[F.isPending?e.jsx(P,{className:"h-4 w-4 mr-2 animate-spin"}):e.jsx(oe,{className:"h-4 w-4 mr-2"}),"Supprimer"]})]})]})})]})}export{Rs as default};
