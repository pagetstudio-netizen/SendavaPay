import{b as pe,c as ue,r as u,u as X,d as te,j as e,e as A,L as q,f as ae,q as re}from"./index-BXGtxekw.js";import{D as L}from"./dashboard-layout-C4UBeDog.js";import{B as i}from"./button-oJtBcpW8.js";import{C as x,b as f,c as N,d as y,a as p}from"./card-C-HmCxwU.js";import{I as D}from"./input-A4W73Wgf.js";import{L as O}from"./label-B9ISoTda.js";import{C as o,B as h}from"./badge-2Yh4Tqwh.js";import{T as he,b as je,c as ne,a as ie}from"./tabs-CIAm6Rau.js";import{A as ge,a as fe,b as Ne,c as ve,d as ye,e as be,f as we,g as Ce}from"./alert-dialog-63MHi2C0.js";import{W as ke}from"./wrench-dwSKykNF.js";import{A as V}from"./arrow-left-TmLJ54wj.js";import{S as H}from"./shield-D5dNWXCp.js";import{P as J}from"./plus-C4OexuvC.js";import{C as R}from"./code-xml-2sXO2xAV.js";import{E as le}from"./external-link-CDo9Xto5.js";import{K as _}from"./key-CUSM56zy.js";import{W as oe}from"./webhook-4AZQapBj.js";import{G as F}from"./globe-DcIPgFmJ.js";import{B as P,T as Te}from"./terminal-C1Iy56vT.js";import{T as ce}from"./trash-2-Dn_tab8e.js";import{I as Se}from"./info-niCPQMrM.js";import{Z as Ae}from"./zap-Csqtyi4_.js";import{A as Pe}from"./arrow-up-right-Dq41tdoM.js";import{C as Z}from"./copy-CQTXc6Go.js";import{B as Ue}from"./bell-BkWApWCt.js";import{C as Re}from"./chevron-up-DX_IQK-k.js";import{C as _e}from"./chevron-down-B00rsxUZ.js";import"./avatar-BiHqs09P.js";import"./dropdown-menu-Bp77AQoi.js";import"./index-DiBC2V01.js";import"./index-BxF08sxa.js";import"./index-D7qEMVol.js";import"./menu-B3P8Q6KC.js";import"./circle-C7_rdz7G.js";import"./theme-toggle-CxgP_t-1.js";import"./sun-BRYu9Kjo.js";import"./20251211_105226_1765450558306-pbBvZwWp.js";import"./circle-check-big-DMdGkX49.js";import"./file-text-BYsis74V.js";import"./credit-card-CbIRF-lw.js";import"./send-BolVJHAa.js";import"./link-CJ9_7oM5.js";import"./clock-DTUVpUi_.js";import"./key-round-DFjlbP6p.js";import"./circle-help-DAt2wQQC.js";import"./users-By6CTR_O.js";import"./shield-check-C3eAAunJ.js";import"./message-square-abBsTHmc.js";import"./trending-up-CEC9wYjP.js";function n({code:a,language:z="bash"}){const[r,d]=u.useState(!1),b=()=>{navigator.clipboard.writeText(a),d(!0),setTimeout(()=>d(!1),2e3)};return e.jsxs("div",{className:"relative group",children:[e.jsx("pre",{className:"bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-xs font-mono leading-relaxed",children:e.jsx("code",{children:a})}),e.jsx(i,{variant:"ghost",size:"sm",className:"absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-white hover:bg-slate-700",onClick:b,children:r?e.jsx(o,{className:"h-3 w-3"}):e.jsx(Z,{className:"h-3 w-3"})})]})}function Ee({apiKeys:a}){var U;const r=((U=a.filter(t=>t.apiType==="sdk"&&t.isActive)[0])==null?void 0:U.apiKey)||"sdk_votre_cle_ici",[d,b]=u.useState("intro"),E=t=>b(d===t?null:t),l=({id:t,title:j,icon:g,children:c})=>e.jsxs(x,{className:"overflow-hidden",children:[e.jsxs("button",{className:"w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors",onClick:()=>E(t),children:[e.jsxs("div",{className:"flex items-center gap-2 font-semibold",children:[e.jsx(g,{className:"h-5 w-5 text-primary"}),j]}),d===t?e.jsx(Re,{className:"h-4 w-4"}):e.jsx(_e,{className:"h-4 w-4"})]}),d===t&&e.jsx(p,{className:"pt-0 space-y-4",children:c})]});return e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center gap-2 p-4 bg-primary/10 rounded-lg border border-primary/20",children:[e.jsx(Se,{className:"h-5 w-5 text-primary flex-shrink-0"}),e.jsxs("p",{className:"text-sm",children:[e.jsx("strong",{children:"API SDK"})," — Intégration complète pour marchands. Créez des paiements, gérez des retraits automatiques et configurez des webhooks directement depuis votre site."]})]}),e.jsxs(l,{id:"intro",title:"Authentification",icon:H,children:[e.jsxs("p",{className:"text-sm text-muted-foreground",children:["Incluez votre clé API SDK dans l'en-tête ",e.jsx("code",{className:"bg-muted px-1 rounded",children:"Authorization"})," de chaque requête."]}),e.jsx(n,{code:`Authorization: Bearer ${r}`}),e.jsx("div",{className:"p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800",children:e.jsxs("p",{className:"text-sm text-amber-800 dark:text-amber-200",children:[e.jsx("strong",{children:"Base URL :"})," ",e.jsx("code",{children:"https://sendavapay.com/api/sdk/v1"})]})})]}),e.jsxs(l,{id:"wallet-routing",title:"Routage automatique par pays / wallet",icon:F,children:[e.jsx("p",{className:"text-sm text-muted-foreground",children:"SendavaPay détecte automatiquement le pays du payeur et crédite le bon wallet. Chaque paiement est attribué au wallet du pays correspondant."}),e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full text-sm border rounded-lg overflow-hidden",children:[e.jsx("thead",{className:"bg-muted",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-medium",children:"Pays du payeur"}),e.jsx("th",{className:"text-left p-3 font-medium",children:"Wallet crédité"}),e.jsx("th",{className:"text-left p-3 font-medium",children:"Devise"}),e.jsx("th",{className:"text-left p-3 font-medium",children:"Code pays"})]})}),e.jsx("tbody",{children:[["Togo","Wallet Togo","XOF","TG"],["Bénin","Wallet Bénin","XOF","BJ"],["Sénégal","Wallet Sénégal","XOF","SN"],["Côte d'Ivoire","Wallet CI","XOF","CI"],["Mali","Wallet Mali","XOF","ML"],["Burkina Faso","Wallet Burkina","XOF","BF"],["Cameroun","Wallet Cameroun","XAF","CM"],["Guinée","Wallet Guinée","GNF","GN"]].map(([t,j,g,c])=>e.jsxs("tr",{className:"border-t hover:bg-muted/30",children:[e.jsx("td",{className:"p-3",children:t}),e.jsx("td",{className:"p-3 text-primary font-medium",children:j}),e.jsx("td",{className:"p-3 font-mono",children:g}),e.jsx("td",{className:"p-3 font-mono text-muted-foreground",children:c})]},c))})]})}),e.jsxs("div",{className:"p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200",children:[e.jsx("strong",{children:"Exemple :"})," Un client depuis le Togo paie via TMoney → l'argent est crédité sur votre ",e.jsx("strong",{children:"Wallet Togo"}),". Un client depuis le Sénégal paie via Wave → l'argent va sur votre ",e.jsx("strong",{children:"Wallet Sénégal"}),"."]})]}),e.jsxs(l,{id:"create-payment",title:"Créer un paiement",icon:Ae,children:[e.jsx("p",{className:"text-sm text-muted-foreground",children:"Génère une URL de paiement que vous redirigez vers votre client."}),e.jsx("div",{className:"space-y-1",children:e.jsx(h,{variant:"outline",className:"font-mono text-xs",children:"POST /api/sdk/v1/create-payment"})}),e.jsx(n,{language:"json",code:`// Corps de la requête
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
}`}),e.jsxs("p",{className:"text-sm text-muted-foreground",children:["Redirigez votre client vers ",e.jsx("code",{className:"bg-muted px-1 rounded",children:"paymentUrl"}),". Après paiement, il est renvoyé vers votre ",e.jsx("code",{className:"bg-muted px-1 rounded",children:"redirectUrl"}),"."]})]}),e.jsxs(l,{id:"verify-payment",title:"Vérifier un paiement",icon:o,children:[e.jsx(h,{variant:"outline",className:"font-mono text-xs",children:"POST /api/sdk/v1/verify-payment"}),e.jsx(n,{code:`// Corps
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
}`}),e.jsxs("div",{className:"p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-sm text-green-800 dark:text-green-200",children:[e.jsx("strong",{children:"Conseil de sécurité :"})," Vérifiez toujours le statut côté serveur avant de valider une commande. Ne vous fiez pas uniquement à la redirection."]})]}),e.jsxs(l,{id:"withdraw",title:"Retrait automatique (Mobile Money)",icon:Pe,children:[e.jsx("p",{className:"text-sm text-muted-foreground",children:"Envoyez de l'argent automatiquement depuis votre wallet vers un numéro Mobile Money. Le wallet du pays spécifié est débité."}),e.jsx(h,{variant:"outline",className:"font-mono text-xs",children:"POST /api/sdk/v1/withdraw"}),e.jsx(n,{code:`// Corps de la requête
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
}`}),e.jsxs("div",{className:"p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border text-sm",children:[e.jsx("strong",{children:"Routage wallet :"})," Le montant est prélevé sur votre ",e.jsx("strong",{children:"Wallet Togo"})," si ",e.jsx("code",{children:'country: "TG"'}),", sur votre ",e.jsx("strong",{children:"Wallet Bénin"})," si ",e.jsx("code",{children:'country: "BJ"'}),", etc. Assurez-vous que le wallet du pays a suffisamment de fonds."]}),e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full text-sm border rounded-lg overflow-hidden",children:[e.jsx("thead",{className:"bg-muted",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-2 font-medium",children:"Pays"}),e.jsx("th",{className:"text-left p-2 font-medium",children:"Code"}),e.jsx("th",{className:"text-left p-2 font-medium",children:"Opérateurs supportés"})]})}),e.jsx("tbody",{children:[["Togo","TG","tmoney, flooz, togocel"],["Bénin","BJ","mtn_bj, moov_bj"],["Sénégal","SN","orange_sn, wave_sn, free_sn"],["Côte d'Ivoire","CI","orange_ci, mtn_ci, wave_ci, moov_ci"],["Mali","ML","orange_ml, wave_ml, moov_ml"],["Cameroun","CM","orange_cm, mtn_cm"]].map(([t,j,g])=>e.jsxs("tr",{className:"border-t",children:[e.jsx("td",{className:"p-2",children:t}),e.jsx("td",{className:"p-2 font-mono text-muted-foreground",children:j}),e.jsx("td",{className:"p-2 font-mono text-xs",children:g})]},j))})]})})]}),e.jsxs(l,{id:"balance",title:"Soldes des wallets",icon:_,children:[e.jsx(h,{variant:"outline",className:"font-mono text-xs",children:"GET /api/sdk/v1/balance"}),e.jsx(n,{code:`// Tous les wallets
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
}`})]}),e.jsxs(l,{id:"transactions",title:"Historique des transactions",icon:P,children:[e.jsx(h,{variant:"outline",className:"font-mono text-xs",children:"GET /api/sdk/v1/transactions"}),e.jsx(n,{code:`// Réponse
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
}`})]}),e.jsxs(l,{id:"webhook",title:"Webhooks — Notifications automatiques",icon:oe,children:[e.jsx("p",{className:"text-sm text-muted-foreground",children:"Configurez une URL webhook pour recevoir des notifications en temps réel à chaque paiement complété."}),e.jsx(h,{variant:"outline",className:"font-mono text-xs",children:"PUT /api/sdk/v1/webhook"}),e.jsx(n,{code:`// Corps
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
});`})]}),e.jsxs(l,{id:"examples",title:"Exemples d'intégration",icon:Te,children:[e.jsx("p",{className:"text-sm font-medium",children:"JavaScript / Node.js"}),e.jsx(n,{language:"javascript",code:`const API_KEY = '${r}';
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
    return data['data']['paymentUrl']`})]})]})}function Us(){const{user:a,isLoading:z}=pe(),{toast:r}=ue(),[d,b]=u.useState(""),[E,l]=u.useState(""),[U,t]=u.useState(""),[j,g]=u.useState(""),[c,w]=u.useState(null),[Y,Q]=u.useState(null),[C,B]=u.useState(null),[ee,K]=u.useState(!1),{data:k,isLoading:de}=X({queryKey:["/api/api-maintenance-status"],refetchInterval:1e4}),{data:T,isLoading:me}=X({queryKey:["/api/user/api-permissions"],enabled:!!(a!=null&&a.isVerified)}),{data:$=[],isLoading:W}=X({queryKey:["/api/api-keys"],enabled:!!(a!=null&&a.isVerified)&&!(k!=null&&k.enabled)}),I=te({mutationFn:async s=>(await ae("POST","/api/api-keys",s)).json(),onSuccess:()=>{re.invalidateQueries({queryKey:["/api/api-keys"]}),b(""),l(""),t(""),g(""),w(null),K(!1),r({title:"Clé créée",description:"Votre nouvelle clé API a été créée avec succès"})},onError:s=>{r({title:"Erreur",description:s.message||"Impossible de créer la clé",variant:"destructive"})}}),G=te({mutationFn:async s=>{await ae("DELETE",`/api/api-keys/${s}`)},onSuccess:()=>{re.invalidateQueries({queryKey:["/api/api-keys"]}),r({title:"Clé supprimée"})},onError:()=>{r({title:"Erreur",description:"Impossible de supprimer la clé",variant:"destructive"})}}),se=s=>{navigator.clipboard.writeText(s),Q(s),r({title:"Copié"}),setTimeout(()=>Q(null),2e3)},xe=()=>{if(!d.trim()){r({title:"Erreur",description:"Veuillez entrer un nom pour la clé",variant:"destructive"});return}if(!c){r({title:"Erreur",description:"Veuillez sélectionner un type d'API",variant:"destructive"});return}I.mutate({name:d.trim(),appName:E.trim()||void 0,webhookUrl:U.trim()||void 0,redirectUrl:j.trim()||void 0,apiType:c})};if(z||de)return e.jsx(L,{children:e.jsx("div",{className:"flex items-center justify-center min-h-[60vh]",children:e.jsx(A,{className:"h-8 w-8 animate-spin text-primary"})})});if(k!=null&&k.enabled)return e.jsx(L,{children:e.jsx("div",{className:"flex items-center justify-center min-h-[60vh] p-4",children:e.jsxs(x,{className:"max-w-lg w-full text-center",children:[e.jsxs(f,{children:[e.jsx("div",{className:"mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center",children:e.jsx(ke,{className:"h-8 w-8 text-orange-600 dark:text-orange-400"})}),e.jsx(N,{className:"text-2xl",children:"API en maintenance"}),e.jsx(y,{className:"text-base",children:"L'API est temporairement indisponible"})]}),e.jsx(p,{children:e.jsx(q,{href:"/dashboard",children:e.jsxs(i,{variant:"outline",children:[e.jsx(V,{className:"h-4 w-4 mr-2"}),"Retour au tableau de bord"]})})})]})})});if(!(a!=null&&a.isVerified))return e.jsx(L,{children:e.jsxs("div",{className:"space-y-6 p-6",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold",children:"API de Paiement"}),e.jsx("p",{className:"text-muted-foreground",children:"Intégrez SendavaPay dans vos applications"})]}),e.jsxs(x,{children:[e.jsxs(f,{children:[e.jsxs(N,{className:"flex items-center gap-2",children:[e.jsx(H,{className:"h-5 w-5 text-yellow-500"}),"Vérification requise"]}),e.jsx(y,{children:"Votre compte doit être vérifié pour accéder à l'API"})]}),e.jsxs(p,{className:"space-y-4",children:[e.jsx("p",{className:"text-muted-foreground",children:"Pour des raisons de sécurité, seuls les comptes vérifiés peuvent accéder à l'API SendavaPay. Complétez votre vérification KYC pour obtenir vos clés API."}),e.jsx("div",{className:"flex flex-col sm:flex-row gap-3",children:e.jsx(q,{href:"/dashboard/kyc",children:e.jsxs(i,{children:[e.jsx(H,{className:"h-4 w-4 mr-2"}),"Vérifier mon compte"]})})})]})]})]})});const S=(T==null?void 0:T.apiSdkEnabled)??!1;T==null||T.apiRedirectEnabled;const v=$.filter(s=>s.apiType==="sdk"),m=$.filter(s=>s.apiType==="redirect"),M=({keyItem:s})=>e.jsxs("div",{className:"flex flex-col gap-3 p-4 border rounded-lg","data-testid":`api-key-${s.id}`,children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-start justify-between gap-3",children:[e.jsxs("div",{className:"space-y-1 flex-1 min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[e.jsx("span",{className:"font-medium",children:s.name}),e.jsx(h,{variant:s.isActive?"default":"secondary",children:s.isActive?"Active":"Inactive"}),e.jsx(h,{variant:"outline",className:s.apiType==="sdk"?"border-purple-400 text-purple-700 dark:text-purple-300":"",children:s.apiType==="sdk"?"SDK":"Redirection"})]}),s.appName&&e.jsxs("p",{className:"text-sm text-muted-foreground",children:["Application : ",s.appName]}),e.jsx("code",{className:"text-sm text-muted-foreground font-mono block truncate",children:s.apiKey}),e.jsxs("p",{className:"text-xs text-muted-foreground",children:["Créée le ",new Date(s.createdAt).toLocaleDateString("fr-FR"),s.requestCount>0&&` • ${s.requestCount} requêtes`]})]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx(i,{variant:"outline",size:"sm",onClick:()=>se(s.apiKey),"data-testid":`button-copy-${s.id}`,children:Y===s.apiKey?e.jsx(o,{className:"h-4 w-4"}):e.jsx(Z,{className:"h-4 w-4"})}),e.jsx(i,{variant:"outline",size:"sm",onClick:()=>B(s),disabled:G.isPending,"data-testid":`button-delete-${s.id}`,children:e.jsx(ce,{className:"h-4 w-4 text-destructive"})})]})]}),(s.redirectUrl||s.webhookUrl)&&e.jsxs("div",{className:"space-y-2 border-t pt-3",children:[e.jsxs("div",{className:"flex flex-wrap gap-4 text-xs",children:[s.redirectUrl&&e.jsxs("div",{className:"flex items-center gap-1 text-muted-foreground",children:[e.jsx(le,{className:"h-3 w-3"}),e.jsx("span",{children:"Redirection:"}),e.jsx("span",{className:"font-mono truncate max-w-[200px]",children:s.redirectUrl})]}),s.webhookUrl&&e.jsxs("div",{className:"flex items-center gap-1 text-muted-foreground",children:[e.jsx(Ue,{className:"h-3 w-3"}),e.jsx("span",{children:"Webhook:"}),e.jsx("span",{className:"font-mono truncate max-w-[200px]",children:s.webhookUrl})]})]}),s.webhookSecret&&e.jsxs("div",{className:"flex items-center gap-2 text-xs",children:[e.jsx("span",{className:"text-muted-foreground",children:"Webhook Secret:"}),e.jsx("code",{className:"font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded truncate max-w-[200px]",children:s.webhookSecret}),e.jsx(i,{variant:"ghost",size:"sm",className:"h-6 w-6 p-0",onClick:()=>se(s.webhookSecret),"data-testid":`button-copy-secret-${s.id}`,children:Y===s.webhookSecret?e.jsx(o,{className:"h-3 w-3"}):e.jsx(Z,{className:"h-3 w-3"})})]})]})]});return e.jsxs(L,{children:[e.jsxs("div",{className:"space-y-6 p-6",children:[e.jsx("div",{className:"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",children:e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold",children:"API de Paiement"}),e.jsx("p",{className:"text-muted-foreground",children:"Gérez vos clés d'intégration SendavaPay"})]})}),S&&!c&&e.jsxs(x,{children:[e.jsxs(f,{children:[e.jsxs(N,{className:"flex items-center gap-2",children:[e.jsx(J,{className:"h-5 w-5"}),"Créer une clé API"]}),e.jsx(y,{children:"Choisissez le type d'intégration adapté à votre projet"})]}),e.jsx(p,{children:e.jsxs("div",{className:"grid sm:grid-cols-2 gap-4",children:[e.jsxs("button",{className:"p-5 border-2 rounded-xl text-left hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group",onClick:()=>w("sdk"),children:[e.jsxs("div",{className:"flex items-center gap-3 mb-3",children:[e.jsx("div",{className:"h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors",children:e.jsx(R,{className:"h-5 w-5 text-purple-600 dark:text-purple-400"})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-semibold",children:"API SDK"}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"Intégration complète"})]})]}),e.jsxs("ul",{className:"text-sm text-muted-foreground space-y-1",children:[e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(o,{className:"h-3 w-3 text-green-500 flex-shrink-0"})," Paiements avec routage par pays"]}),e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(o,{className:"h-3 w-3 text-green-500 flex-shrink-0"})," Retrait automatique Mobile Money"]}),e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(o,{className:"h-3 w-3 text-green-500 flex-shrink-0"})," Gestion des wallets par pays"]}),e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(o,{className:"h-3 w-3 text-green-500 flex-shrink-0"})," Webhooks + Documentation complète"]})]})]}),e.jsxs("button",{className:"p-5 border-2 rounded-xl text-left hover:border-primary hover:bg-primary/5 transition-all group",onClick:()=>w("redirect"),children:[e.jsxs("div",{className:"flex items-center gap-3 mb-3",children:[e.jsx("div",{className:"h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors",children:e.jsx(le,{className:"h-5 w-5 text-blue-600 dark:text-blue-400"})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-semibold",children:"API Redirection"}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"Simple et rapide"})]})]}),e.jsxs("ul",{className:"text-sm text-muted-foreground space-y-1",children:[e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(o,{className:"h-3 w-3 text-green-500 flex-shrink-0"})," Liens de paiement générés"]}),e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(o,{className:"h-3 w-3 text-green-500 flex-shrink-0"})," Redirection après paiement"]}),e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(o,{className:"h-3 w-3 text-green-500 flex-shrink-0"})," Notifications webhook"]}),e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(o,{className:"h-3 w-3 text-green-500 flex-shrink-0"})," Intégration sans SDK"]})]})]})]})})]}),(S&&c||!S&&ee)&&e.jsxs(x,{children:[e.jsxs(f,{children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx(N,{className:"flex items-center gap-2",children:c==="sdk"?e.jsxs(e.Fragment,{children:[e.jsx(R,{className:"h-5 w-5 text-purple-600"})," Nouvelle clé API SDK"]}):e.jsxs(e.Fragment,{children:[e.jsx(_,{className:"h-5 w-5 text-primary"})," Nouvelle clé API"]})}),S&&e.jsxs(i,{variant:"ghost",size:"sm",onClick:()=>w(null),"data-testid":"button-back-type",children:[e.jsx(V,{className:"h-4 w-4 mr-1"})," Changer"]}),!S&&e.jsxs(i,{variant:"ghost",size:"sm",onClick:()=>K(!1),"data-testid":"button-cancel-create",children:[e.jsx(V,{className:"h-4 w-4 mr-1"})," Annuler"]})]}),e.jsx(y,{children:c==="sdk"?"Clé pour l'intégration SDK complète avec retrait automatique":"Clé pour la création de liens de paiement avec redirection"})]}),e.jsxs(p,{className:"space-y-4",children:[e.jsxs("div",{className:"grid sm:grid-cols-2 gap-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx(O,{htmlFor:"keyName",children:"Nom de la clé *"}),e.jsx(D,{id:"keyName",placeholder:"Ex: Mon site e-commerce",value:d,onChange:s=>b(s.target.value),"data-testid":"input-key-name"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(O,{htmlFor:"appName",children:"Nom de l'application"}),e.jsx(D,{id:"appName",placeholder:"Ex: MaBoutique.com",value:E,onChange:s=>l(s.target.value),"data-testid":"input-app-name"})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(O,{htmlFor:"redirectUrl",children:"URL de redirection (après paiement)"}),e.jsx(D,{id:"redirectUrl",type:"url",placeholder:"https://monsite.com/paiement/succes",value:j,onChange:s=>g(s.target.value),"data-testid":"input-redirect-url"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(O,{htmlFor:"webhookUrl",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(oe,{className:"h-4 w-4"}),"URL de webhook (notifications automatiques)"]})}),e.jsx(D,{id:"webhookUrl",type:"url",placeholder:"https://monsite.com/api/webhook/sendavapay",value:U,onChange:s=>t(s.target.value),"data-testid":"input-webhook-url"}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"SendavaPay enverra une notification POST sécurisée à cette URL lors de chaque paiement"})]}),e.jsxs(i,{onClick:xe,disabled:I.isPending,className:c==="sdk"?"bg-purple-600 hover:bg-purple-700":"","data-testid":"button-create-key",children:[I.isPending?e.jsx(A,{className:"h-4 w-4 mr-2 animate-spin"}):e.jsx(_,{className:"h-4 w-4 mr-2"}),"Générer la clé"]})]})]}),!me&&e.jsx(e.Fragment,{children:S?e.jsxs(he,{defaultValue:v.length>0?"sdk":"redirect",children:[e.jsxs(je,{children:[e.jsxs(ne,{value:"sdk",className:"gap-2",children:[e.jsx(R,{className:"h-4 w-4"}),"Clés SDK",v.length>0&&e.jsx(h,{variant:"secondary",className:"ml-1 h-5 text-xs",children:v.length})]}),e.jsxs(ne,{value:"redirect",className:"gap-2",children:[e.jsx(F,{className:"h-4 w-4"}),"Clés Redirection",m.length>0&&e.jsx(h,{variant:"secondary",className:"ml-1 h-5 text-xs",children:m.length})]})]}),e.jsxs(ie,{value:"sdk",className:"space-y-4 mt-4",children:[e.jsxs(x,{children:[e.jsxs(f,{children:[e.jsxs(N,{className:"flex items-center gap-2 text-base",children:[e.jsx(R,{className:"h-4 w-4 text-purple-600"}),"Clés API SDK"]}),e.jsxs(y,{children:[v.length," clé",v.length!==1?"s":""," SDK"]})]}),e.jsx(p,{children:W?e.jsx("div",{className:"flex justify-center py-8",children:e.jsx(A,{className:"h-6 w-6 animate-spin text-muted-foreground"})}):v.length===0?e.jsxs("div",{className:"text-center py-8 text-muted-foreground",children:[e.jsx(R,{className:"h-12 w-12 mx-auto mb-3 opacity-50"}),e.jsx("p",{children:"Aucune clé SDK créée"}),e.jsx("p",{className:"text-sm",children:'Cliquez sur "Créer une clé API" pour commencer'})]}):e.jsx("div",{className:"space-y-3",children:v.map(s=>e.jsx(M,{keyItem:s},s.id))})})]}),e.jsxs("div",{children:[e.jsxs("h2",{className:"text-xl font-bold mb-4 flex items-center gap-2",children:[e.jsx(P,{className:"h-5 w-5 text-purple-600"}),"Documentation API SDK"]}),e.jsx(Ee,{apiKeys:$})]})]}),e.jsxs(ie,{value:"redirect",className:"space-y-4 mt-4",children:[e.jsxs(x,{children:[e.jsxs(f,{children:[e.jsxs(N,{className:"flex items-center gap-2 text-base",children:[e.jsx(F,{className:"h-4 w-4 text-blue-600"}),"Clés API Redirection"]}),e.jsxs(y,{children:[m.length," clé",m.length!==1?"s":""," Redirection"]})]}),e.jsx(p,{children:W?e.jsx("div",{className:"flex justify-center py-8",children:e.jsx(A,{className:"h-6 w-6 animate-spin text-muted-foreground"})}):m.length===0?e.jsxs("div",{className:"text-center py-8 text-muted-foreground",children:[e.jsx(F,{className:"h-12 w-12 mx-auto mb-3 opacity-50"}),e.jsx("p",{children:"Aucune clé créée"}),e.jsx("p",{className:"text-sm",children:'Cliquez sur "Créer une clé API" pour commencer'})]}):e.jsx("div",{className:"space-y-3",children:m.map(s=>e.jsx(M,{keyItem:s},s.id))})})]}),e.jsxs(x,{children:[e.jsx(f,{children:e.jsxs(N,{className:"flex items-center gap-2 text-base",children:[e.jsx(P,{className:"h-4 w-4"}),"Documentation"]})}),e.jsx(p,{children:e.jsx(q,{href:"/docs",children:e.jsxs(i,{variant:"outline","data-testid":"button-docs-redirect",children:[e.jsx(P,{className:"h-4 w-4 mr-2"}),"Voir la documentation"]})})})]})]})]}):e.jsxs("div",{className:"space-y-4",children:[e.jsxs(x,{children:[e.jsx(f,{children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsxs(N,{className:"flex items-center gap-2 text-base",children:[e.jsx(_,{className:"h-4 w-4 text-primary"}),"Mes clés API"]}),e.jsxs(y,{children:[m.length," clé",m.length!==1?"s":""]})]}),!ee&&e.jsxs(i,{size:"sm",onClick:()=>{K(!0),w("redirect")},"data-testid":"button-new-key",children:[e.jsx(J,{className:"h-4 w-4 mr-2"}),"Nouvelle clé"]})]})}),e.jsx(p,{children:W?e.jsx("div",{className:"flex justify-center py-8",children:e.jsx(A,{className:"h-6 w-6 animate-spin text-muted-foreground"})}):m.length===0?e.jsxs("div",{className:"text-center py-8 text-muted-foreground",children:[e.jsx(_,{className:"h-12 w-12 mx-auto mb-3 opacity-50"}),e.jsx("p",{children:"Aucune clé créée"}),e.jsxs(i,{className:"mt-3",size:"sm",onClick:()=>{K(!0),w("redirect")},"data-testid":"button-create-first-key",children:[e.jsx(J,{className:"h-4 w-4 mr-2"}),"Créer ma première clé"]})]}):e.jsx("div",{className:"space-y-3",children:m.map(s=>e.jsx(M,{keyItem:s},s.id))})})]}),e.jsx(x,{children:e.jsx(p,{className:"pt-6",children:e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("div",{className:"h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0",children:e.jsx(P,{className:"h-5 w-5 text-primary"})}),e.jsxs("div",{className:"flex-1",children:[e.jsx("p",{className:"font-medium",children:"Documentation API"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Consultez la documentation pour intégrer SendavaPay dans votre application"})]}),e.jsx(q,{href:"/docs",children:e.jsxs(i,{variant:"outline","data-testid":"button-docs",children:[e.jsx(P,{className:"h-4 w-4 mr-2"}),"Voir la documentation"]})})]})})})]})})]}),e.jsx(ge,{open:!!C,onOpenChange:s=>!s&&B(null),children:e.jsxs(fe,{children:[e.jsxs(Ne,{children:[e.jsx(ve,{children:"Supprimer cette clé API ?"}),e.jsxs(ye,{children:['Êtes-vous sûr de vouloir supprimer la clé "',C==null?void 0:C.name,'" ? Cette action est irréversible et toutes les intégrations utilisant cette clé cesseront de fonctionner.']})]}),e.jsxs(be,{children:[e.jsx(we,{children:"Annuler"}),e.jsxs(Ce,{onClick:()=>{C&&(G.mutate(C.id),B(null))},className:"bg-destructive text-destructive-foreground hover:bg-destructive/90",children:[G.isPending?e.jsx(A,{className:"h-4 w-4 mr-2 animate-spin"}):e.jsx(ce,{className:"h-4 w-4 mr-2"}),"Supprimer"]})]})]})})]})}export{Us as default};
