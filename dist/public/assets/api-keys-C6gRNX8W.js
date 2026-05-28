import{b as fe,c as ge,r as u,u as J,d as re,j as e,e as E,L as _,f as ne,q as oe}from"./index-CkiKSWYl.js";import{D as q}from"./dashboard-layout-D9ZJTXfe.js";import{B as c}from"./button-CA0ICfBA.js";import{C as g,b,c as v,d as C,a as j}from"./card-CPQTrQfR.js";import{I as F}from"./input-DNIFdREC.js";import{L as K}from"./label-CjkLQXCx.js";import{C as m,B as L}from"./badge-n3CezoZQ.js";import{T as je,b as be,c as ie,a as le}from"./tabs-BG5sS60X.js";import{A as ve,a as ye,b as Ne,c as we,d as ke,e as Ce,f as Te,g as Se}from"./alert-dialog-CduU2oO-.js";import{W as Pe}from"./wrench-BaoGdUs9.js";import{A as Y}from"./arrow-left-BOLW8nbX.js";import{S as de}from"./shield-B8mR1UmT.js";import{P as Z}from"./plus-DPPdLAkE.js";import{C as M}from"./code-xml-gJFyhoBs.js";import{E as ce}from"./external-link-BAvRj1e3.js";import{K as z}from"./key-nD_z4Nsh.js";import{W as Ae}from"./webhook-Cq0ZtFgu.js";import{G as Q}from"./globe-BBYxSe_T.js";import{B as D}from"./book-open-BsRQuSoX.js";import{T as me}from"./trash-2-DXU9B0yK.js";import{C as X}from"./copy-DfxgtO7m.js";import{B as Oe}from"./bell-P9-vPvos.js";import"./avatar-DRdoZDNk.js";import"./dropdown-menu-heatPVnX.js";import"./index-sYxfupsE.js";import"./index-D9RsXiJp.js";import"./index-cp48AoBc.js";import"./menu-Dp19Ziqv.js";import"./theme-toggle-D7NWXIsJ.js";import"./sun-hhYhUxvv.js";import"./20251211_105226_1765450558306-pbBvZwWp.js";import"./circle-check-big-CzqLSINj.js";import"./file-text-C1ck_ag7.js";import"./credit-card-XM9Ncuos.js";import"./send-DA6G5uRX.js";import"./link-BBhO36Xe.js";import"./clock-BAWN1o61.js";import"./key-round-DQf5uzHb.js";import"./circle-help-ClSMFMVE.js";import"./users-DFnEucVw.js";import"./shield-check-X48129uU.js";import"./message-square-CKFINSqz.js";import"./trending-up-axn6Xjmg.js";function o({code:n,language:l="bash"}){const[a,d]=u.useState(!1),h=()=>{navigator.clipboard.writeText(n),d(!0),setTimeout(()=>d(!1),2e3)};return e.jsxs("div",{className:"rounded-lg overflow-hidden border border-slate-700 my-3",children:[e.jsxs("div",{className:"flex items-center justify-between bg-slate-800 px-3 py-1.5",children:[e.jsx("span",{className:"text-xs text-slate-400 font-mono",children:l}),e.jsx("button",{onClick:h,className:"text-slate-400 hover:text-white transition-colors p-1",children:a?e.jsx(m,{className:"h-3 w-3"}):e.jsx(X,{className:"h-3 w-3"})})]}),e.jsx("pre",{className:"bg-slate-900 text-slate-100 p-4 overflow-x-auto text-xs font-mono leading-relaxed",children:e.jsx("code",{children:n})})]})}function U({tabs:n}){const[l,a]=u.useState(0),[d,h]=u.useState(!1),N=()=>{navigator.clipboard.writeText(n[l].code),h(!0),setTimeout(()=>h(!1),2e3)};return e.jsxs("div",{className:"rounded-lg overflow-hidden border border-slate-700 my-3",children:[e.jsxs("div",{className:"flex items-center justify-between bg-slate-800 px-3 py-1.5",children:[e.jsx("div",{className:"flex gap-1",children:n.map((s,r)=>e.jsx("button",{onClick:()=>a(r),className:`px-3 py-1 rounded text-xs font-medium transition-colors ${l===r?"bg-slate-600 text-white":"text-slate-400 hover:text-slate-200"}`,children:s.label},r))}),e.jsx("button",{onClick:N,className:"text-slate-400 hover:text-white transition-colors p-1",children:d?e.jsx(m,{className:"h-3 w-3"}):e.jsx(X,{className:"h-3 w-3"})})]}),e.jsx("pre",{className:"bg-slate-900 text-slate-100 p-4 overflow-x-auto text-xs font-mono leading-relaxed",children:e.jsx("code",{children:n[l].code})})]})}function y({method:n,path:l}){const a={POST:"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",GET:"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",PUT:"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",DELETE:"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"};return e.jsxs("div",{className:"flex items-center gap-3 my-4 p-3 bg-muted/40 rounded-lg border",children:[e.jsx("span",{className:`inline-flex px-2 py-0.5 rounded text-xs font-bold font-mono ${a[n]||"bg-muted text-muted-foreground"}`,children:n}),e.jsx("code",{className:"text-sm text-foreground",children:l})]})}function x({type:n,title:l,children:a}){const d={info:"bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300",warning:"bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300",tip:"bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300",danger:"bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"};return e.jsxs("div",{className:`p-4 rounded-lg border ${d[n]} text-sm my-4`,children:[l&&e.jsx("p",{className:"font-semibold mb-1",children:l}),e.jsx("div",{children:a})]})}function xe({params:n}){return e.jsx("div",{className:"overflow-x-auto my-4 rounded-lg border text-sm",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Paramètre"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Type"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Description"})]})}),e.jsx("tbody",{children:n.map((l,a)=>e.jsxs("tr",{className:"border-t hover:bg-muted/20",children:[e.jsxs("td",{className:"p-3 font-mono text-xs whitespace-nowrap",children:[l.name,l.required&&e.jsx("span",{className:"text-red-500 ml-0.5",children:"*"})]}),e.jsx("td",{className:"p-3 font-mono text-xs text-muted-foreground whitespace-nowrap",children:l.type}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:l.description})]},a))})]})})}function Ee({apiKeys:n}){var N;const a=((N=n.filter(s=>s.apiType==="sdk"&&s.isActive)[0])==null?void 0:N.apiKey)||"sdk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",d=s=>{var r;(r=document.getElementById(s))==null||r.scrollIntoView({behavior:"smooth",block:"start"})},h=[{id:"s-intro",label:"Introduction"},{id:"s-arch",label:"Architecture"},{id:"s-auth",label:"Authentification"},{label:"Pay-in — Encaissement",children:[{id:"s-create",label:"Créer un paiement"},{id:"s-sdk",label:"SDK navigateur"},{id:"s-initiate",label:"Initier le paiement"},{id:"s-otp",label:"Flux OTP"},{id:"s-status",label:"Statut & polling"},{id:"s-list",label:"Liste transactions"}]},{id:"s-payout",label:"Pay-out — Retrait"},{id:"s-balance",label:"Soldes wallets"},{label:"Webhooks",children:[{id:"s-wh-config",label:"Configuration"},{id:"s-wh-events",label:"Événements"},{id:"s-wh-hmac",label:"Vérification HMAC"}]},{id:"s-countries",label:"Pays & Opérateurs"},{id:"s-statuses",label:"Statuts"},{id:"s-errors",label:"Codes d'erreur"},{id:"s-rate",label:"Rate Limiting"}];return e.jsxs("div",{className:"flex -mx-6 border-t min-h-screen",children:[e.jsxs("nav",{className:"hidden xl:flex flex-col w-52 flex-shrink-0 border-r bg-muted/20 sticky top-0 max-h-screen overflow-y-auto py-5 gap-0.5",children:[e.jsx("p",{className:"text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 mb-2",children:"SDK API v2.0"}),h.map((s,r)=>{var i;return s.id?e.jsx("button",{onClick:()=>d(s.id),className:"text-left px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors rounded-sm mx-1",children:s.label},r):e.jsxs("div",{className:"mt-3",children:[e.jsx("p",{className:"px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground",children:s.label}),(i=s.children)==null?void 0:i.map((f,I)=>e.jsx("button",{onClick:()=>d(f.id),className:"w-full text-left pl-6 pr-4 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors rounded-sm mx-1",children:f.label},I))]},r)})]}),e.jsxs("div",{className:"flex-1 px-6 xl:px-12 py-8 max-w-4xl space-y-14 overflow-x-hidden",children:[e.jsxs("section",{id:"s-intro",children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-6",children:"Introduction"}),e.jsxs("p",{className:"text-sm text-muted-foreground leading-relaxed mb-6",children:["L'API SDK SendavaPay vous permet d'encaisser des paiements Mobile Money et d'effectuer des retraits automatisés directement depuis votre site ou application — ",e.jsx("strong",{children:"sans redirection, sans iframe, sans page externe"}),". Votre client reste sur votre interface du début à la fin."]}),e.jsx("div",{className:"grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8",children:[["Aucune redirection","100 % sur votre interface"],["10 pays","XOF · XAF · GNF · CDF"],["HMAC webhooks","Signés & vérifiables"],["Retrait auto","Pay-out Mobile Money"]].map(([s,r])=>e.jsxs("div",{className:"p-3 rounded-lg border bg-muted/30 text-center",children:[e.jsx("p",{className:"text-sm font-semibold",children:s}),e.jsx("p",{className:"text-xs text-muted-foreground",children:r})]},s))}),e.jsx("h3",{className:"text-base font-semibold mb-3",children:"Flux de paiement complet"}),e.jsx("div",{className:"space-y-2.5",children:[["1","Le client saisit son téléphone et son opérateur sur votre site",""],["2","Votre backend crée un paiement","POST /api/sdk/v1/create-payment → reference + paymentToken"],["3","Votre page initie le paiement Mobile Money","Via le SDK navigateur — l'opérateur envoie une invite sur le téléphone"],["4","OTP si requis (Orange Money)","Le client reçoit un SMS et entre le code sur votre page"],["5","Confirmation par polling ou webhook","GET /api/sdk/v1/payment-status/:reference"],["6","Votre backend valide et livre la commande","Toujours vérifier le statut côté serveur avant livraison"]].map(([s,r,i])=>e.jsxs("div",{className:"flex gap-3 items-start",children:[e.jsx("div",{className:"flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5",children:s}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium",children:r}),i&&e.jsx("p",{className:"text-xs text-muted-foreground font-mono mt-0.5",children:i})]})]},s))}),e.jsx(x,{type:"info",title:"Tarifs",children:"Des frais s'appliquent selon votre type de compte et le pays. Le montant net est crédité sur votre wallet pays correspondant immédiatement après confirmation du paiement."})]}),e.jsxs("section",{id:"s-arch",children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-6",children:"Architecture"}),e.jsxs(x,{type:"danger",title:"Ne jamais exposer votre clé SDK dans le navigateur",children:["Votre clé ",e.jsx("code",{children:"sdk_…"})," doit uniquement exister sur votre serveur. Une clé exposée dans le code frontend peut être volée et utilisée pour vider votre wallet."]}),e.jsxs("div",{className:"rounded-lg border bg-muted/20 p-5 font-mono text-xs leading-relaxed text-muted-foreground space-y-1.5",children:[e.jsx("p",{className:"text-foreground font-semibold text-sm mb-3",children:"Flux de données"}),e.jsxs("p",{children:[e.jsx("span",{className:"text-foreground",children:"Navigateur client"}),"  →  ",e.jsx("span",{className:"text-foreground",children:"Votre backend"}),"  (formulaire soumis)"]}),e.jsxs("p",{children:[e.jsx("span",{className:"text-foreground",children:"Votre backend"}),"  →  ",e.jsx("span",{className:"text-primary",children:"SendavaPay API"}),"  (Authorization: Bearer sdk_…)"]}),e.jsxs("p",{children:[e.jsx("span",{className:"text-primary",children:"SendavaPay API"}),"  →  ",e.jsx("span",{className:"text-foreground",children:"Opérateur Mobile Money"}),"  (invite de paiement)"]}),e.jsxs("p",{children:[e.jsx("span",{className:"text-foreground",children:"Opérateur"}),"  →  ",e.jsx("span",{className:"text-foreground",children:"Téléphone client"}),"  (confirmation)"]}),e.jsxs("p",{children:[e.jsx("span",{className:"text-primary",children:"SendavaPay API"}),"  →  ",e.jsx("span",{className:"text-foreground",children:"Votre webhook"}),"  (X-SendavaPay-Signature)"]}),e.jsx("div",{className:"mt-3 pt-3 border-t",children:e.jsxs("p",{children:[e.jsx("span",{className:"text-foreground",children:"Votre frontend"}),"  →  poll  ",e.jsx("span",{className:"text-foreground",children:"votre propre backend"}),"  (jamais SendavaPay directement)"]})})]}),e.jsxs(x,{type:"tip",children:["Votre frontend interroge votre propre endpoint (ex. ",e.jsx("code",{children:"/api/check-payment?ref=xxx"}),") qui lui-même questionne SendavaPay. Votre clé ne touche jamais le navigateur."]})]}),e.jsxs("section",{id:"s-auth",children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-6",children:"Authentification"}),e.jsxs("p",{className:"text-sm text-muted-foreground mb-4",children:["Toutes les requêtes backend utilisent votre clé SDK dans le header ",e.jsx("code",{className:"bg-muted px-1 rounded",children:"Authorization"}),"."]}),e.jsx(o,{language:"http",code:`Authorization: Bearer ${a}
Content-Type: application/json`}),e.jsx("div",{className:"overflow-x-auto rounded-lg border my-4 text-sm",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Environnement"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Préfixe clé"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"URL de base"})]})}),e.jsx("tbody",{children:e.jsxs("tr",{className:"border-t",children:[e.jsx("td",{className:"p-3 text-xs font-medium",children:"Production"}),e.jsx("td",{className:"p-3 font-mono text-xs",children:"sdk_"}),e.jsx("td",{className:"p-3 font-mono text-xs",children:"https://sendavapay.com/api/sdk/v1"})]})})]})}),e.jsx(x,{type:"warning",title:"Prérequis",children:"Votre compte doit être vérifié (KYC validé) et l'accès SDK activé par l'administrateur pour utiliser ces endpoints."})]}),e.jsxs("section",{children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-2",children:"Pay-in — Encaissement"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-10",children:"Collectez des paiements Mobile Money sans aucune redirection."}),e.jsxs("div",{id:"s-create",className:"scroll-mt-4",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Étape 1 — Créer un paiement"}),e.jsxs("p",{className:"text-sm text-muted-foreground mb-3",children:["Depuis votre backend lors d'une commande. Retourne un ",e.jsx("code",{className:"bg-muted px-1 rounded text-xs",children:"paymentToken"})," (valable 30 min) à transmettre à votre page de paiement."]}),e.jsx(y,{method:"POST",path:"/api/sdk/v1/create-payment"}),e.jsx(xe,{params:[{name:"amount",type:"number",required:!0,description:"Montant en unité de la devise (ex. 5000 = 5 000 XOF)"},{name:"currency",type:"string",required:!0,description:"XOF · XAF · GNF · CDF"},{name:"description",type:"string",description:"Description visible sur le reçu (max 255 car.)"},{name:"customerName",type:"string",description:"Nom complet du client"},{name:"customerEmail",type:"string",description:"Email du client"},{name:"customerPhone",type:"string",description:"Téléphone du client en format E.164 (+22890000000)"},{name:"payerCountry",type:"string",description:"Code pays ISO 2 lettres (TG, SN, CM…) pour le routage wallet"},{name:"webhookUrl",type:"string",description:"URL HTTPS pour recevoir les notifications de paiement"},{name:"externalReference",type:"string",description:"Votre référence commande pour l'idempotence (max 128 car.)"},{name:"metadata",type:"object",description:"Données personnalisées attachées à la transaction"}]}),e.jsx(U,{tabs:[{label:"curl",code:`curl -X POST https://sendavapay.com/api/sdk/v1/create-payment \\
  -H "Authorization: Bearer ${a}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 5000,
    "currency": "XOF",
    "description": "Commande #1234",
    "customerName": "Jean Dupont",
    "customerEmail": "jean@example.com",
    "customerPhone": "+22890000000",
    "payerCountry": "TG",
    "webhookUrl": "https://monsite.com/api/webhook/sendavapay",
    "externalReference": "order_1234"
  }'`},{label:"node.js",code:`const response = await fetch('https://sendavapay.com/api/sdk/v1/create-payment', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${a}',
    'Content-Type':  'application/json',
  },
  body: JSON.stringify({
    amount:            5000,
    currency:          'XOF',
    description:       'Commande #1234',
    customerName:      'Jean Dupont',
    customerEmail:     'jean@example.com',
    customerPhone:     '+22890000000',
    payerCountry:      'TG',
    webhookUrl:        'https://monsite.com/api/webhook/sendavapay',
    externalReference: 'order_1234',
  }),
});
const { data } = await response.json();
// data.paymentToken → à passer à votre page de paiement
// data.reference   → à stocker en base de données`},{label:"php",code:`$response = Http::withHeaders([
  'Authorization' => 'Bearer ${a}',
  'Content-Type'  => 'application/json',
])->post('https://sendavapay.com/api/sdk/v1/create-payment', [
  'amount'            => 5000,
  'currency'          => 'XOF',
  'description'       => 'Commande #1234',
  'customerName'      => 'Jean Dupont',
  'payerCountry'      => 'TG',
  'webhookUrl'        => 'https://monsite.com/api/webhook/sendavapay',
  'externalReference' => 'order_1234',
]);
$data = $response->json('data');
// $data['paymentToken'] → à passer à votre page de paiement`}]}),e.jsx(o,{language:"json — réponse 201 Created",code:`{
  "success": true,
  "data": {
    "reference":    "sdk_lcy0u4wx_a1b2c3d4e5f6g7h8",
    "paymentToken": "pay_tok_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "expiresAt":    "2026-05-28T10:30:00.000Z",
    "amount":       5000,
    "currency":     "XOF",
    "status":       "pending",
    "walletRouting": {
      "detectedCountry": "TG",
      "targetWallet":    "Togo"
    }
  }
}`}),e.jsxs(x,{type:"warning",title:"Idempotence",children:["Passez un ",e.jsx("code",{children:"externalReference"})," unique par commande. Si vous relancez le même ",e.jsx("code",{children:"externalReference"})," alors qu'un paiement est déjà ",e.jsx("code",{children:"pending"})," ou ",e.jsx("code",{children:"completed"}),", vous recevrez une erreur ",e.jsx("code",{children:"409 DUPLICATE_REFERENCE"})," — aucun doublon créé."]})]}),e.jsxs("div",{id:"s-sdk",className:"scroll-mt-4 mt-12",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Étape 2 — SDK navigateur"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"Chargez le SDK léger sur votre page de paiement. Il expose des méthodes API pures — aucune interface intégrée, vous construisez votre propre formulaire et votre propre design."}),e.jsx(o,{language:"html",code:'<script src="https://sendavapay.com/sdk/sendavapay.js"><\/script>'}),e.jsx(o,{language:"javascript",code:`// Récupérez le token depuis votre backend (URL param, session, etc.)
const token = new URLSearchParams(location.search).get('token');
const sp    = new SendavaPay({ token });

// Récupère les détails de la transaction (montant, description…)
const details = await sp.getDetails();
// → { reference, amount, currency, description, ownerName, status }

// Récupère les pays disponibles
const countries = await sp.getCountries();
// → [{ id: 'TG', name: 'Togo', currency: 'XOF' }, …]

// Récupère les opérateurs pour un pays
const operators = await sp.getServices('SN');
// → [{ id: '12', name: 'Orange Money', slug: 'orange_sn' }, …]`})]}),e.jsxs("div",{id:"s-initiate",className:"scroll-mt-4 mt-12",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Étape 3 — Initier le paiement Mobile Money"}),e.jsxs("p",{className:"text-sm text-muted-foreground mb-3",children:["Lorsque le client soumet votre formulaire. Le SDK appelle ",e.jsx("code",{className:"bg-muted px-1 rounded text-xs",children:"POST /api/pay-api/:reference"}),"(CORS autorisé depuis votre domaine)."]}),e.jsx(y,{method:"POST",path:"/api/pay-api/:reference"}),e.jsx(o,{language:"javascript",code:`document.getElementById('pay-btn').addEventListener('click', async () => {
  const result = await sp.initiatePayment({
    payerName:    document.getElementById('name').value,
    payerPhone:   document.getElementById('phone').value,    // E.164: +22890000000
    payerEmail:   document.getElementById('email').value,
    payerCountry: selectedCountry,    // 'TG', 'SN', 'CM'…
    serviceId:    selectedOperator.id,
  });

  if (result.success) {
    if (result.requiresOtp) {
      // Orange Money → afficher le champ OTP
      showOtpSection(result.payId, result.orderId);
    } else {
      // Lancer le polling de statut
      startPolling();
    }
  } else {
    showError(result.message || 'Erreur lors du paiement');
  }
});`}),e.jsx(o,{language:"json — réponse sans OTP",code:`{
  "success":     true,
  "status":      "processing",
  "requiresOtp": false,
  "reference":   "sdk_lcy0u4wx_a1b2c3d4e5f6g7h8",
  "message":     "Invite de paiement envoyée sur le téléphone du client"
}`}),e.jsx(o,{language:"json — réponse avec OTP requis",code:`{
  "success":     true,
  "status":      "processing",
  "requiresOtp": true,
  "payId":       "PAY-XXXXXXXX",
  "orderId":     "ORD-XXXXXXXX",
  "message":     "Code OTP envoyé par SMS au client"
}`})]}),e.jsxs("div",{id:"s-otp",className:"scroll-mt-4 mt-12",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Étape 4 — Vérification OTP"}),e.jsxs("p",{className:"text-sm text-muted-foreground mb-3",children:["Certains opérateurs demandent un code OTP envoyé par SMS avant de débiter. Affichez un champ de saisie sur votre page lorsque ",e.jsx("code",{className:"bg-muted px-1 rounded text-xs",children:"requiresOtp: true"}),"."]}),e.jsx("div",{className:"overflow-x-auto rounded-lg border my-4 text-xs",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold uppercase tracking-wide text-muted-foreground",children:"Opérateur"}),e.jsx("th",{className:"text-left p-3 font-semibold uppercase tracking-wide text-muted-foreground",children:"Pays"}),e.jsx("th",{className:"text-left p-3 font-semibold uppercase tracking-wide text-muted-foreground",children:"OTP requis"})]})}),e.jsx("tbody",{children:[["Orange Money","BF, CI, ML, SN, GN",!0],["TMoney / Flooz","TG",!1],["MTN MoMo","CM, BJ",!1],["Wave","SN, CI, ML",!1],["Vodacom M-Pesa","COD",!1],["Airtel Money","COD, COG",!1],["MTN Money","COG",!1]].map(([s,r,i])=>e.jsxs("tr",{className:"border-t hover:bg-muted/20",children:[e.jsx("td",{className:"p-3 font-medium",children:s}),e.jsx("td",{className:"p-3 text-muted-foreground",children:r}),e.jsx("td",{className:"p-3",children:e.jsx("span",{className:`px-2 py-0.5 rounded text-xs font-medium ${i?"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400":"bg-muted text-muted-foreground"}`,children:i?"Oui":"Non"})})]},String(s)))})]})}),e.jsx(y,{method:"POST",path:"/api/pay-api/:reference/verify"}),e.jsx(o,{language:"javascript",code:`document.getElementById('otp-btn').addEventListener('click', async () => {
  const result = await sp.verifyOtp({
    payId:   savedPayId,     // reçu dans la réponse initiatePayment
    orderId: savedOrderId,
    otp:     document.getElementById('otp-input').value,
  });

  if (result.success) {
    showMessage('OTP validé — vérification en cours…');
    startPolling();
  } else {
    showError('Code OTP invalide, réessayez.');
  }
});`})]}),e.jsxs("div",{id:"s-status",className:"scroll-mt-4 mt-12",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Étape 5 — Statut & confirmation"}),e.jsxs("p",{className:"text-sm text-muted-foreground mb-3",children:["Interrogez le statut depuis votre backend jusqu'à confirmation. Votre frontend interroge ",e.jsx("em",{children:"votre"})," propre endpoint — jamais SendavaPay directement."]}),e.jsx(y,{method:"GET",path:"/api/sdk/v1/payment-status/:reference"}),e.jsx(U,{tabs:[{label:"polling SDK",code:`// Option A — polling automatique via le SDK navigateur
const poller = sp.pollStatus({
  interval:    3,   // toutes les 3 secondes
  maxAttempts: 60,  // 3 minutes max
  onSuccess: (data) => {
    window.location.href = '/success?ref=' + data.reference;
  },
  onFailed: (data) => {
    showError(data.message || 'Paiement échoué');
  },
});

// Option B — vérification manuelle
const status = await sp.getStatus();
// status.status : 'pending' | 'completed' | 'failed' | 'cancelled'`},{label:"curl",code:`curl https://sendavapay.com/api/sdk/v1/payment-status/sdk_lcy0u4wx_a1b2c3d4e5f6g7h8 \\
  -H "Authorization: Bearer ${a}"`},{label:"node.js",code:`async function checkPaymentStatus(reference) {
  const res = await fetch(
    \`https://sendavapay.com/api/sdk/v1/payment-status/\${reference}\`,
    { headers: { 'Authorization': 'Bearer ${a}' } }
  );
  const { data } = await res.json();
  return data;
  // → { reference, status, amount, currency, completedAt }
}`}]}),e.jsx(o,{language:"json — réponse 200",code:`{
  "success": true,
  "data": {
    "reference":   "sdk_lcy0u4wx_a1b2c3d4e5f6g7h8",
    "status":      "completed",
    "amount":      "5000.00",
    "currency":    "XOF",
    "completedAt": "2026-05-28T10:05:32.000Z"
  }
}`}),e.jsxs(x,{type:"danger",title:"Toujours valider côté serveur",children:["Ne marquez pas une commande comme payée sur la seule base du frontend. Vérifiez le statut via ",e.jsx("code",{children:"GET /api/sdk/v1/payment-status/:reference"})," depuis votre backend avant de livrer la commande."]}),e.jsx("div",{className:"overflow-x-auto rounded-lg border my-4 text-xs",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold uppercase tracking-wide text-muted-foreground",children:"Statut"}),e.jsx("th",{className:"text-left p-3 font-semibold uppercase tracking-wide text-muted-foreground",children:"Afficher au client"}),e.jsx("th",{className:"text-left p-3 font-semibold uppercase tracking-wide text-muted-foreground",children:"Action"})]})}),e.jsx("tbody",{children:[["pending","Paiement en attente…","Afficher spinner"],["processing","Confirmez sur votre téléphone","Afficher invite téléphone"],["completed","✓ Paiement confirmé","Livrer la commande, rediriger"],["failed","✗ Paiement échoué","Afficher erreur, proposer retry"],["cancelled","Paiement annulé","Proposer nouveau paiement"]].map(([s,r,i])=>e.jsxs("tr",{className:"border-t hover:bg-muted/20",children:[e.jsx("td",{className:"p-3",children:e.jsx("span",{className:`px-2 py-0.5 rounded font-mono font-medium ${s==="completed"?"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400":s==="failed"||s==="cancelled"?"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400":"bg-muted text-muted-foreground"}`,children:s})}),e.jsx("td",{className:"p-3 text-muted-foreground",children:r}),e.jsx("td",{className:"p-3 text-muted-foreground",children:i})]},s))})]})})]}),e.jsxs("div",{id:"s-list",className:"scroll-mt-4 mt-12",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Liste des transactions"}),e.jsx(y,{method:"GET",path:"/api/sdk/v1/transactions"}),e.jsx(o,{language:"curl",code:`curl https://sendavapay.com/api/sdk/v1/transactions \\
  -H "Authorization: Bearer ${a}"`}),e.jsx(o,{language:"json — réponse 200",code:`{
  "success": true,
  "data": {
    "transactions": [
      {
        "reference":         "sdk_lcy0u4wx_a1b2c3d4e5f6g7h8",
        "externalReference": "order_1234",
        "type":              "payment",
        "amount":            "5000.00",
        "fee":               "150.00",
        "currency":          "XOF",
        "status":            "completed",
        "customerPhone":     "+22890000000",
        "paymentMethod":     "tmoney",
        "createdAt":         "2026-05-28T10:00:00.000Z",
        "completedAt":       "2026-05-28T10:05:32.000Z"
      }
    ],
    "total": 42
  }
}`})]})]}),e.jsxs("section",{id:"s-payout",children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-6",children:"Pay-out — Retrait automatique"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-4",children:"Envoyez de l'argent depuis votre wallet vers un numéro Mobile Money. Uniquement depuis votre backend. Les fonds sont débités immédiatement sur votre wallet pays."}),e.jsx(y,{method:"POST",path:"/api/sdk/v1/withdraw"}),e.jsx(xe,{params:[{name:"amount",type:"number",required:!0,description:"Montant à envoyer"},{name:"phoneNumber",type:"string",required:!0,description:"Numéro Mobile Money du bénéficiaire en E.164"},{name:"operator",type:"string",required:!0,description:"Slug opérateur : tmoney, moov, mtn, orange, wave, vodacom, airtel…"},{name:"country",type:"string",required:!0,description:"Code pays ISO 2 lettres (TG, CM, COD, COG…)"},{name:"currency",type:"string",required:!0,description:"Devise : XOF · XAF · GNF · CDF"},{name:"description",type:"string",description:"Motif du transfert"},{name:"externalReference",type:"string",description:"Votre référence paiement fournisseur"}]}),e.jsx(U,{tabs:[{label:"curl",code:`curl -X POST https://sendavapay.com/api/sdk/v1/withdraw \\
  -H "Authorization: Bearer ${a}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount":            10000,
    "phoneNumber":       "+22890123456",
    "operator":          "tmoney",
    "country":           "TG",
    "currency":          "XOF",
    "description":       "Paiement fournisseur",
    "externalReference": "payout_456"
  }'`},{label:"node.js",code:`const res = await fetch('https://sendavapay.com/api/sdk/v1/withdraw', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${a}',
    'Content-Type':  'application/json',
  },
  body: JSON.stringify({
    amount:            10000,
    phoneNumber:       '+22890123456',
    operator:          'tmoney',
    country:           'TG',
    currency:          'XOF',
    description:       'Paiement fournisseur',
    externalReference: 'payout_456',
  }),
});
const { data } = await res.json();`},{label:"php",code:`$response = Http::withHeaders([
  'Authorization' => 'Bearer ${a}',
  'Content-Type'  => 'application/json',
])->post('https://sendavapay.com/api/sdk/v1/withdraw', [
  'amount'            => 10000,
  'phoneNumber'       => '+22890123456',
  'operator'          => 'tmoney',
  'country'           => 'TG',
  'currency'          => 'XOF',
  'description'       => 'Paiement fournisseur',
  'externalReference' => 'payout_456',
]);
$data = $response->json('data');`}]}),e.jsx(o,{language:"json — réponse 201 Created",code:`{
  "success": true,
  "data": {
    "withdrawalId": 87,
    "reference":    "sdk_lcy1a3bx_z9y8w7v6u5t4s3r2",
    "amount":       10000,
    "fee":          100,
    "netAmount":    9900,
    "currency":     "XOF",
    "phoneNumber":  "+22890123456",
    "operator":     "tmoney",
    "country":      "TG",
    "countryName":  "Togo",
    "status":       "pending",
    "message":      "Demande de retrait créée. En cours de traitement.",
    "createdAt":    "2026-05-28T11:00:00.000Z"
  }
}`}),e.jsxs(x,{type:"info",title:"Traitement",children:["Les retraits sont traités automatiquement pour les opérateurs pris en charge. Un webhook ",e.jsx("code",{children:"withdrawal.completed"})," est envoyé à votre URL dès que le virement est effectué."]})]}),e.jsxs("section",{id:"s-balance",children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-6",children:"Soldes wallets"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-4",children:"Consultez le solde de vos wallets. Un wallet par pays, crédité automatiquement à chaque paiement confirmé."}),e.jsx(y,{method:"GET",path:"/api/sdk/v1/balance"}),e.jsx(o,{language:"curl",code:`# Tous les wallets
curl https://sendavapay.com/api/sdk/v1/balance \\
  -H "Authorization: Bearer ${a}"

# Un seul pays
curl "https://sendavapay.com/api/sdk/v1/balance?country=TG" \\
  -H "Authorization: Bearer ${a}"`}),e.jsx(o,{language:"json — réponse 200",code:`{
  "success": true,
  "data": {
    "wallets": [
      { "country": "TG",  "countryName": "Togo",     "balance": "25000.00", "currency": "XOF" },
      { "country": "SN",  "countryName": "Sénégal",  "balance": "8500.00",  "currency": "XOF" },
      { "country": "CM",  "countryName": "Cameroun", "balance": "12000.00", "currency": "XAF" },
      { "country": "COD", "countryName": "RD Congo", "balance": "150000.00","currency": "CDF" }
    ],
    "totalWallets": 4
  }
}`})]}),e.jsxs("section",{children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-2",children:"Webhooks"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-10",children:"SendavaPay envoie un POST signé sur votre URL dès qu'un événement survient sur une transaction."}),e.jsxs("div",{id:"s-wh-config",className:"scroll-mt-4",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Configuration"}),e.jsxs("p",{className:"text-sm text-muted-foreground mb-3",children:["Passez ",e.jsx("code",{className:"bg-muted px-1 rounded text-xs",children:"webhookUrl"})," à la création du paiement, ou configurez une URL globale pour votre clé SDK."]}),e.jsx(y,{method:"PUT",path:"/api/sdk/v1/webhook"}),e.jsx(o,{language:"curl",code:`curl -X PUT https://sendavapay.com/api/sdk/v1/webhook \\
  -H "Authorization: Bearer ${a}" \\
  -H "Content-Type: application/json" \\
  -d '{ "webhookUrl": "https://monsite.com/api/webhook/sendavapay" }'`}),e.jsx(o,{language:"json — réponse 200",code:`{
  "success": true,
  "data": {
    "webhookUrl":    "https://monsite.com/api/webhook/sendavapay",
    "webhookSecret": "whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "message":       "Webhook configuré avec succès."
  }
}`}),e.jsxs(x,{type:"warning",title:"Conservez votre webhookSecret",children:["Le ",e.jsx("code",{children:"webhookSecret"})," est affiché une seule fois. Stockez-le dans une variable d'environnement sur votre serveur — il sert à vérifier la signature HMAC de chaque notification."]})]}),e.jsxs("div",{id:"s-wh-events",className:"scroll-mt-4 mt-12",children:[e.jsx("h3",{className:"text-lg font-semibold mb-3",children:"Types d'événements"}),e.jsx("div",{className:"overflow-x-auto rounded-lg border text-sm",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Événement"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Déclenché quand"})]})}),e.jsx("tbody",{children:[["payment.completed","Paiement confirmé, fonds crédités sur votre wallet"],["payment.failed","Paiement refusé, annulé par le client, ou erreur opérateur"],["payment.expired","Le client n'a pas confirmé avant l'expiration"],["withdrawal.completed","Retrait traité avec succès, argent envoyé"],["withdrawal.failed","Retrait échoué (solde insuffisant, numéro invalide…)"]].map(([s,r])=>e.jsxs("tr",{className:"border-t hover:bg-muted/20",children:[e.jsx("td",{className:"p-3 font-mono text-xs text-primary",children:s}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:r})]},s))})]})}),e.jsx(o,{language:"json — payload reçu sur votre webhook",code:`{
  "event":             "payment.completed",
  "reference":         "sdk_lcy0u4wx_a1b2c3d4e5f6g7h8",
  "externalReference": "order_1234",
  "status":            "completed",
  "amount":            "5000.00",
  "fee":               "150.00",
  "currency":          "XOF",
  "customerPhone":     "+22890000000",
  "paymentMethod":     "tmoney",
  "timestamp":         "2026-05-28T10:05:32.000Z"
}`}),e.jsx(o,{language:"http — headers envoyés par SendavaPay",code:`POST https://monsite.com/api/webhook/sendavapay
Content-Type: application/json
X-SendavaPay-Signature: sha256=a3f4b5c6d7e8f9...sha256hex...
X-SendavaPay-Event:     payment.completed
X-SendavaPay-Timestamp: 1748426732`})]}),e.jsxs("div",{id:"s-wh-hmac",className:"scroll-mt-4 mt-12",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Vérification de signature HMAC"}),e.jsx(x,{type:"danger",title:"Toujours vérifier les signatures",children:"Ne traitez jamais un webhook sans vérifier sa signature HMAC. Un webhook non vérifié peut être forgé par un attaquant pour simuler des paiements réussis."}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"La signature est calculée ainsi :"}),e.jsx(o,{language:"bash",code:`HMAC_SHA256(key=WEBHOOK_SECRET, data=JSON.stringify(body))
# Envoyée dans: X-SendavaPay-Signature: sha256={hex}`}),e.jsx(U,{tabs:[{label:"node.js",code:`const crypto = require('crypto');

// Important: utiliser express.raw() pour accéder au body brut
app.post('/api/webhook/sendavapay', express.raw({ type: 'application/json' }), (req, res) => {
  const sig      = req.headers['x-sendavapay-signature'];
  const expected = 'sha256=' + crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(req.body)   // Buffer brut, PAS parsé
    .digest('hex');

  if (sig !== expected) {
    return res.status(401).json({ error: 'Signature invalide' });
  }

  const payload = JSON.parse(req.body);
  const { event, reference, status } = payload;

  if (event === 'payment.completed' && status === 'completed') {
    await markOrderAsPaid(reference);
  }

  res.json({ received: true });
});`},{label:"php",code:`<?php
$secret   = getenv('WEBHOOK_SECRET');
$body     = file_get_contents('php://input');
$sig      = $_SERVER['HTTP_X_SENDAVAPAY_SIGNATURE'] ?? '';
$expected = 'sha256=' . hash_hmac('sha256', $body, $secret);

if (!hash_equals($expected, $sig)) {
    http_response_code(401);
    die('Signature invalide');
}

$payload = json_decode($body, true);
if ($payload['event'] === 'payment.completed') {
    markOrderAsPaid($payload['reference']);
}
echo json_encode(['received' => true]);`},{label:"python",code:`import hmac, hashlib, os
from flask import Flask, request

app = Flask(__name__)
WEBHOOK_SECRET = os.environ['WEBHOOK_SECRET']

@app.route('/webhook/sendavapay', methods=['POST'])
def webhook():
    sig      = request.headers.get('X-SendavaPay-Signature', '')
    expected = 'sha256=' + hmac.new(
        WEBHOOK_SECRET.encode(), request.data, hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(sig, expected):
        return 'Signature invalide', 401

    payload = request.json
    if payload['event'] == 'payment.completed':
        mark_order_as_paid(payload['reference'])

    return {'received': True}`}]}),e.jsxs(x,{type:"tip",title:"Idempotence webhook",children:["SendavaPay peut renvoyer le même événement plusieurs fois en cas d'échec de votre endpoint. Vérifiez toujours via votre base de données si la ",e.jsx("code",{children:"reference"})," a déjà été traitée avant d'agir."]})]})]}),e.jsxs("section",{id:"s-countries",children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-6",children:"Pays & Opérateurs"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-4",children:"Chaque paiement est crédité sur le wallet correspondant au pays du payeur. Les fonds d'un pays ne peuvent pas être retirés via le wallet d'un autre pays."}),e.jsx("div",{className:"overflow-x-auto rounded-lg border text-sm",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Pays"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Code"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Devise"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Opérateurs"})]})}),e.jsx("tbody",{children:[["🇹🇬 Togo","TG","XOF","TMoney, Moov Money (Flooz)"],["🇧🇯 Bénin","BJ","XOF","MTN MoMo, Moov Money"],["🇸🇳 Sénégal","SN","XOF","Orange Money, Wave, Free Money, Wizall"],["🇨🇮 Côte d'Ivoire","CI","XOF","MTN MoMo, Orange Money, Wave, Moov Money"],["🇲🇱 Mali","ML","XOF","Orange Money, Wave, Moov Money"],["🇧🇫 Burkina Faso","BF","XOF","Orange Money, Moov Money"],["🇨🇲 Cameroun","CM","XAF","MTN MoMo, Orange Money"],["🇬🇳 Guinée","GN","GNF","Orange Money, MTN MoMo, Cellcom"],["🇨🇩 RD Congo (Congo-Kinshasa)","COD","CDF","Vodacom M-Pesa, Airtel Money, Orange Money"],["🇨🇬 Congo Brazzaville","COG","XAF","Airtel Money, MTN Money"]].map(([s,r,i,f])=>e.jsxs("tr",{className:"border-t hover:bg-muted/20",children:[e.jsx("td",{className:"p-3 text-xs font-medium",children:s}),e.jsx("td",{className:"p-3 font-mono text-xs",children:r}),e.jsx("td",{className:"p-3 font-mono text-xs",children:i}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:f})]},r))})]})})]}),e.jsxs("section",{id:"s-statuses",children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-6",children:"Statuts de transaction"}),e.jsx("div",{className:"overflow-x-auto rounded-lg border text-sm",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Statut"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Description"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Type"})]})}),e.jsx("tbody",{children:[["pending","Paiement créé, en attente d'initiation","transitoire"],["processing","Invite envoyée, attente confirmation du client","transitoire"],["completed","Paiement confirmé, fonds crédités sur le wallet","terminal ✓"],["failed","Refusé, annulé ou erreur opérateur","terminal"],["cancelled","Annulé avant traitement","terminal"]].map(([s,r,i])=>e.jsxs("tr",{className:"border-t hover:bg-muted/20",children:[e.jsx("td",{className:"p-3",children:e.jsx("span",{className:`px-2 py-0.5 rounded text-xs font-mono font-medium ${s==="completed"?"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400":s==="failed"||s==="cancelled"?"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400":"bg-muted text-muted-foreground"}`,children:s})}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:r}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:i})]},s))})]})})]}),e.jsxs("section",{id:"s-errors",children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-6",children:"Codes d'erreur"}),e.jsx(o,{language:"json — format d'erreur",code:`{
  "success": false,
  "error":   "INSUFFICIENT_BALANCE",
  "code":    "INSUFFICIENT_BALANCE"
}`}),e.jsx("div",{className:"overflow-x-auto rounded-lg border text-sm mt-4",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"HTTP"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Code"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Description"})]})}),e.jsx("tbody",{children:[["400","INVALID_REQUEST","Paramètres manquants ou malformés"],["400","DUPLICATE_REFERENCE","externalReference déjà utilisée pour un paiement actif"],["400","INSUFFICIENT_BALANCE","Solde insuffisant sur le wallet pour le retrait"],["400","UNSUPPORTED_COUNTRY","Code pays non pris en charge"],["400","WALLET_NOT_FOUND","Wallet du pays introuvable sur votre compte"],["401","UNAUTHORIZED","Header Authorization manquant ou malformé"],["401","INVALID_API_KEY","Clé SDK invalide ou inexistante"],["403","API_KEY_INACTIVE","Clé SDK désactivée"],["403","SDK_NOT_ENABLED","Accès SDK non activé sur ce compte — contactez le support"],["403","ACCOUNT_NOT_VERIFIED","KYC non validé — complétez la vérification de votre compte"],["404","NOT_FOUND","Transaction introuvable pour cette référence"],["503","API_MAINTENANCE","API temporairement en maintenance"]].map(([s,r,i],f)=>e.jsxs("tr",{className:"border-t hover:bg-muted/20",children:[e.jsx("td",{className:"p-3 font-mono text-xs text-muted-foreground",children:s}),e.jsx("td",{className:"p-3 font-mono text-xs text-primary",children:r}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:i})]},f))})]})})]}),e.jsxs("section",{id:"s-rate",className:"pb-16",children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-6",children:"Rate Limiting"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-4",children:"Chaque clé SDK est limitée en nombre de requêtes par minute pour garantir la stabilité du service."}),e.jsx("div",{className:"grid sm:grid-cols-3 gap-3 mb-6",children:[["100 req / min","Par clé SDK"],["5 secondes","Intervalle polling recommandé"],["Retry 429","Backoff avant de réessayer"]].map(([s,r])=>e.jsxs("div",{className:"p-4 rounded-lg border bg-muted/30 text-center",children:[e.jsx("p",{className:"text-lg font-bold text-primary",children:s}),e.jsx("p",{className:"text-xs text-muted-foreground",children:r})]},s))}),e.jsx(o,{language:"json — réponse HTTP 429",code:`HTTP/1.1 429 Too Many Requests
{
  "success": false,
  "error":   "Trop de requêtes. Réessayez dans 60 secondes.",
  "code":    "RATE_LIMITED"
}`}),e.jsx(x,{type:"tip",title:"Bonne pratique",children:"Implémentez un backoff exponentiel sur les réponses 429. Pour le polling de statut, utilisez un intervalle de 5 secondes minimum — ne sondez pas plus d'une fois par seconde."})]})]})]})}function Nt(){const{user:n,isLoading:l}=fe(),{toast:a}=ge(),[d,h]=u.useState(""),[N,s]=u.useState(""),[r,i]=u.useState(""),[f,I]=u.useState(""),[w,T]=u.useState(null),[ee,te]=u.useState(null),[S,B]=u.useState(null),[se,R]=u.useState(!1),{data:P,isLoading:ue}=J({queryKey:["/api/api-maintenance-status"],refetchInterval:1e4}),{data:A,isLoading:pe}=J({queryKey:["/api/user/api-permissions"],enabled:!!(n!=null&&n.isVerified)}),{data:$=[],isLoading:V}=J({queryKey:["/api/api-keys"],enabled:!!(n!=null&&n.isVerified)&&!(P!=null&&P.enabled)}),G=re({mutationFn:async t=>(await ne("POST","/api/api-keys",t)).json(),onSuccess:()=>{oe.invalidateQueries({queryKey:["/api/api-keys"]}),h(""),s(""),i(""),I(""),T(null),R(!1),a({title:"Clé créée",description:"Votre nouvelle clé API a été créée avec succès"})},onError:t=>{a({title:"Erreur",description:t.message||"Impossible de créer la clé",variant:"destructive"})}}),H=re({mutationFn:async t=>{await ne("DELETE",`/api/api-keys/${t}`)},onSuccess:()=>{oe.invalidateQueries({queryKey:["/api/api-keys"]}),a({title:"Clé supprimée"})},onError:()=>{a({title:"Erreur",description:"Impossible de supprimer la clé",variant:"destructive"})}}),ae=t=>{navigator.clipboard.writeText(t),te(t),a({title:"Copié"}),setTimeout(()=>te(null),2e3)},he=()=>{if(!d.trim()){a({title:"Erreur",description:"Veuillez entrer un nom pour la clé",variant:"destructive"});return}if(!w){a({title:"Erreur",description:"Veuillez sélectionner un type d'API",variant:"destructive"});return}G.mutate({name:d.trim(),appName:N.trim()||void 0,webhookUrl:r.trim()||void 0,redirectUrl:f.trim()||void 0,apiType:w})};if(l||ue)return e.jsx(q,{children:e.jsx("div",{className:"flex items-center justify-center min-h-[60vh]",children:e.jsx(E,{className:"h-8 w-8 animate-spin text-primary"})})});if(P!=null&&P.enabled)return e.jsx(q,{children:e.jsx("div",{className:"flex items-center justify-center min-h-[60vh] p-4",children:e.jsxs(g,{className:"max-w-lg w-full text-center",children:[e.jsxs(b,{children:[e.jsx("div",{className:"mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center",children:e.jsx(Pe,{className:"h-8 w-8 text-orange-600 dark:text-orange-400"})}),e.jsx(v,{className:"text-2xl",children:"API en maintenance"}),e.jsx(C,{className:"text-base",children:"L'API est temporairement indisponible"})]}),e.jsx(j,{children:e.jsx(_,{href:"/dashboard",children:e.jsxs(c,{variant:"outline",children:[e.jsx(Y,{className:"h-4 w-4 mr-2"}),"Retour au tableau de bord"]})})})]})})});if(!(n!=null&&n.isVerified))return e.jsx(q,{children:e.jsxs("div",{className:"space-y-6 p-6",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold",children:"API de Paiement"}),e.jsx("p",{className:"text-muted-foreground",children:"Intégrez SendavaPay dans vos applications"})]}),e.jsxs(g,{children:[e.jsxs(b,{children:[e.jsxs(v,{className:"flex items-center gap-2",children:[e.jsx(de,{className:"h-5 w-5 text-yellow-500"}),"Vérification requise"]}),e.jsx(C,{children:"Votre compte doit être vérifié pour accéder à l'API"})]}),e.jsxs(j,{className:"space-y-4",children:[e.jsx("p",{className:"text-muted-foreground",children:"Pour des raisons de sécurité, seuls les comptes vérifiés peuvent accéder à l'API SendavaPay. Complétez votre vérification KYC pour obtenir vos clés API."}),e.jsx("div",{className:"flex flex-col sm:flex-row gap-3",children:e.jsx(_,{href:"/dashboard/kyc",children:e.jsxs(c,{children:[e.jsx(de,{className:"h-4 w-4 mr-2"}),"Vérifier mon compte"]})})})]})]})]})});const O=(A==null?void 0:A.apiSdkEnabled)??!1;A==null||A.apiRedirectEnabled;const k=$.filter(t=>t.apiType==="sdk"),p=$.filter(t=>t.apiType==="redirect"),W=({keyItem:t})=>e.jsxs("div",{className:"flex flex-col gap-3 p-4 border rounded-lg","data-testid":`api-key-${t.id}`,children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-start justify-between gap-3",children:[e.jsxs("div",{className:"space-y-1 flex-1 min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[e.jsx("span",{className:"font-medium",children:t.name}),e.jsx(L,{variant:t.isActive?"default":"secondary",children:t.isActive?"Active":"Inactive"}),e.jsx(L,{variant:"outline",className:t.apiType==="sdk"?"border-purple-400 text-purple-700 dark:text-purple-300":"",children:t.apiType==="sdk"?"SDK":"Redirection"})]}),t.appName&&e.jsxs("p",{className:"text-sm text-muted-foreground",children:["Application : ",t.appName]}),e.jsx("code",{className:"text-sm text-muted-foreground font-mono block truncate",children:t.apiKey}),e.jsxs("p",{className:"text-xs text-muted-foreground",children:["Créée le ",new Date(t.createdAt).toLocaleDateString("fr-FR"),t.requestCount>0&&` • ${t.requestCount} requêtes`]})]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx(c,{variant:"outline",size:"sm",onClick:()=>ae(t.apiKey),"data-testid":`button-copy-${t.id}`,children:ee===t.apiKey?e.jsx(m,{className:"h-4 w-4"}):e.jsx(X,{className:"h-4 w-4"})}),e.jsx(c,{variant:"outline",size:"sm",onClick:()=>B(t),disabled:H.isPending,"data-testid":`button-delete-${t.id}`,children:e.jsx(me,{className:"h-4 w-4 text-destructive"})})]})]}),(t.redirectUrl||t.webhookUrl)&&e.jsxs("div",{className:"space-y-2 border-t pt-3",children:[e.jsxs("div",{className:"flex flex-wrap gap-4 text-xs",children:[t.redirectUrl&&e.jsxs("div",{className:"flex items-center gap-1 text-muted-foreground",children:[e.jsx(ce,{className:"h-3 w-3"}),e.jsx("span",{children:"Redirection:"}),e.jsx("span",{className:"font-mono truncate max-w-[200px]",children:t.redirectUrl})]}),t.webhookUrl&&e.jsxs("div",{className:"flex items-center gap-1 text-muted-foreground",children:[e.jsx(Oe,{className:"h-3 w-3"}),e.jsx("span",{children:"Webhook:"}),e.jsx("span",{className:"font-mono truncate max-w-[200px]",children:t.webhookUrl})]})]}),t.webhookSecret&&e.jsxs("div",{className:"flex items-center gap-2 text-xs",children:[e.jsx("span",{className:"text-muted-foreground",children:"Webhook Secret:"}),e.jsx("code",{className:"font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded truncate max-w-[200px]",children:t.webhookSecret}),e.jsx(c,{variant:"ghost",size:"sm",className:"h-6 w-6 p-0",onClick:()=>ae(t.webhookSecret),"data-testid":`button-copy-secret-${t.id}`,children:ee===t.webhookSecret?e.jsx(m,{className:"h-3 w-3"}):e.jsx(X,{className:"h-3 w-3"})})]})]})]});return e.jsxs(q,{children:[e.jsxs("div",{className:"space-y-6 p-6",children:[e.jsx("div",{className:"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",children:e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold",children:"API de Paiement"}),e.jsx("p",{className:"text-muted-foreground",children:"Gérez vos clés d'intégration SendavaPay"})]})}),O&&!w&&e.jsxs(g,{children:[e.jsxs(b,{children:[e.jsxs(v,{className:"flex items-center gap-2",children:[e.jsx(Z,{className:"h-5 w-5"}),"Créer une clé API"]}),e.jsx(C,{children:"Choisissez le type d'intégration adapté à votre projet"})]}),e.jsx(j,{children:e.jsxs("div",{className:"grid sm:grid-cols-2 gap-4",children:[e.jsxs("button",{className:"p-5 border-2 rounded-xl text-left hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group",onClick:()=>T("sdk"),children:[e.jsxs("div",{className:"flex items-center gap-3 mb-3",children:[e.jsx("div",{className:"h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors",children:e.jsx(M,{className:"h-5 w-5 text-purple-600 dark:text-purple-400"})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-semibold",children:"API SDK"}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"Intégration complète"})]})]}),e.jsxs("ul",{className:"text-sm text-muted-foreground space-y-1",children:[e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(m,{className:"h-3 w-3 text-green-500 flex-shrink-0"})," Paiements avec routage par pays"]}),e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(m,{className:"h-3 w-3 text-green-500 flex-shrink-0"})," Retrait automatique Mobile Money"]}),e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(m,{className:"h-3 w-3 text-green-500 flex-shrink-0"})," Gestion des wallets par pays"]}),e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(m,{className:"h-3 w-3 text-green-500 flex-shrink-0"})," Webhooks + Documentation complète"]})]})]}),e.jsxs("button",{className:"p-5 border-2 rounded-xl text-left hover:border-primary hover:bg-primary/5 transition-all group",onClick:()=>T("redirect"),children:[e.jsxs("div",{className:"flex items-center gap-3 mb-3",children:[e.jsx("div",{className:"h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors",children:e.jsx(ce,{className:"h-5 w-5 text-blue-600 dark:text-blue-400"})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-semibold",children:"API Redirection"}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"Simple et rapide"})]})]}),e.jsxs("ul",{className:"text-sm text-muted-foreground space-y-1",children:[e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(m,{className:"h-3 w-3 text-green-500 flex-shrink-0"})," Liens de paiement générés"]}),e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(m,{className:"h-3 w-3 text-green-500 flex-shrink-0"})," Redirection après paiement"]}),e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(m,{className:"h-3 w-3 text-green-500 flex-shrink-0"})," Notifications webhook"]}),e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(m,{className:"h-3 w-3 text-green-500 flex-shrink-0"})," Intégration sans SDK"]})]})]})]})})]}),(O&&w||!O&&se)&&e.jsxs(g,{children:[e.jsxs(b,{children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx(v,{className:"flex items-center gap-2",children:w==="sdk"?e.jsxs(e.Fragment,{children:[e.jsx(M,{className:"h-5 w-5 text-purple-600"})," Nouvelle clé API SDK"]}):e.jsxs(e.Fragment,{children:[e.jsx(z,{className:"h-5 w-5 text-primary"})," Nouvelle clé API"]})}),O&&e.jsxs(c,{variant:"ghost",size:"sm",onClick:()=>T(null),"data-testid":"button-back-type",children:[e.jsx(Y,{className:"h-4 w-4 mr-1"})," Changer"]}),!O&&e.jsxs(c,{variant:"ghost",size:"sm",onClick:()=>R(!1),"data-testid":"button-cancel-create",children:[e.jsx(Y,{className:"h-4 w-4 mr-1"})," Annuler"]})]}),e.jsx(C,{children:w==="sdk"?"Clé pour l'intégration SDK complète avec retrait automatique":"Clé pour la création de liens de paiement avec redirection"})]}),e.jsxs(j,{className:"space-y-4",children:[e.jsxs("div",{className:"grid sm:grid-cols-2 gap-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx(K,{htmlFor:"keyName",children:"Nom de la clé *"}),e.jsx(F,{id:"keyName",placeholder:"Ex: Mon site e-commerce",value:d,onChange:t=>h(t.target.value),"data-testid":"input-key-name"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(K,{htmlFor:"appName",children:"Nom de l'application"}),e.jsx(F,{id:"appName",placeholder:"Ex: MaBoutique.com",value:N,onChange:t=>s(t.target.value),"data-testid":"input-app-name"})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(K,{htmlFor:"redirectUrl",children:"URL de redirection (après paiement)"}),e.jsx(F,{id:"redirectUrl",type:"url",placeholder:"https://monsite.com/paiement/succes",value:f,onChange:t=>I(t.target.value),"data-testid":"input-redirect-url"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(K,{htmlFor:"webhookUrl",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(Ae,{className:"h-4 w-4"}),"URL de webhook (notifications automatiques)"]})}),e.jsx(F,{id:"webhookUrl",type:"url",placeholder:"https://monsite.com/api/webhook/sendavapay",value:r,onChange:t=>i(t.target.value),"data-testid":"input-webhook-url"}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"SendavaPay enverra une notification POST sécurisée à cette URL lors de chaque paiement"})]}),e.jsxs(c,{onClick:he,disabled:G.isPending,className:w==="sdk"?"bg-purple-600 hover:bg-purple-700":"","data-testid":"button-create-key",children:[G.isPending?e.jsx(E,{className:"h-4 w-4 mr-2 animate-spin"}):e.jsx(z,{className:"h-4 w-4 mr-2"}),"Générer la clé"]})]})]}),!pe&&e.jsx(e.Fragment,{children:O?e.jsxs(je,{defaultValue:k.length>0?"sdk":"redirect",children:[e.jsxs(be,{children:[e.jsxs(ie,{value:"sdk",className:"gap-2",children:[e.jsx(M,{className:"h-4 w-4"}),"Clés SDK",k.length>0&&e.jsx(L,{variant:"secondary",className:"ml-1 h-5 text-xs",children:k.length})]}),e.jsxs(ie,{value:"redirect",className:"gap-2",children:[e.jsx(Q,{className:"h-4 w-4"}),"Clés Redirection",p.length>0&&e.jsx(L,{variant:"secondary",className:"ml-1 h-5 text-xs",children:p.length})]})]}),e.jsxs(le,{value:"sdk",className:"space-y-4 mt-4",children:[e.jsxs(g,{children:[e.jsxs(b,{children:[e.jsxs(v,{className:"flex items-center gap-2 text-base",children:[e.jsx(M,{className:"h-4 w-4 text-purple-600"}),"Clés API SDK"]}),e.jsxs(C,{children:[k.length," clé",k.length!==1?"s":""," SDK"]})]}),e.jsx(j,{children:V?e.jsx("div",{className:"flex justify-center py-8",children:e.jsx(E,{className:"h-6 w-6 animate-spin text-muted-foreground"})}):k.length===0?e.jsxs("div",{className:"text-center py-8 text-muted-foreground",children:[e.jsx(M,{className:"h-12 w-12 mx-auto mb-3 opacity-50"}),e.jsx("p",{children:"Aucune clé SDK créée"}),e.jsx("p",{className:"text-sm",children:'Cliquez sur "Créer une clé API" pour commencer'})]}):e.jsx("div",{className:"space-y-3",children:k.map(t=>e.jsx(W,{keyItem:t},t.id))})})]}),e.jsxs("div",{children:[e.jsxs("h2",{className:"text-xl font-bold mb-4 flex items-center gap-2",children:[e.jsx(D,{className:"h-5 w-5 text-purple-600"}),"Documentation API SDK"]}),e.jsx(Ee,{apiKeys:$})]})]}),e.jsxs(le,{value:"redirect",className:"space-y-4 mt-4",children:[e.jsxs(g,{children:[e.jsxs(b,{children:[e.jsxs(v,{className:"flex items-center gap-2 text-base",children:[e.jsx(Q,{className:"h-4 w-4 text-blue-600"}),"Clés API Redirection"]}),e.jsxs(C,{children:[p.length," clé",p.length!==1?"s":""," Redirection"]})]}),e.jsx(j,{children:V?e.jsx("div",{className:"flex justify-center py-8",children:e.jsx(E,{className:"h-6 w-6 animate-spin text-muted-foreground"})}):p.length===0?e.jsxs("div",{className:"text-center py-8 text-muted-foreground",children:[e.jsx(Q,{className:"h-12 w-12 mx-auto mb-3 opacity-50"}),e.jsx("p",{children:"Aucune clé créée"}),e.jsx("p",{className:"text-sm",children:'Cliquez sur "Créer une clé API" pour commencer'})]}):e.jsx("div",{className:"space-y-3",children:p.map(t=>e.jsx(W,{keyItem:t},t.id))})})]}),e.jsxs(g,{children:[e.jsx(b,{children:e.jsxs(v,{className:"flex items-center gap-2 text-base",children:[e.jsx(D,{className:"h-4 w-4"}),"Documentation"]})}),e.jsx(j,{children:e.jsx(_,{href:"/docs",children:e.jsxs(c,{variant:"outline","data-testid":"button-docs-redirect",children:[e.jsx(D,{className:"h-4 w-4 mr-2"}),"Voir la documentation"]})})})]})]})]}):e.jsxs("div",{className:"space-y-4",children:[e.jsxs(g,{children:[e.jsx(b,{children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsxs(v,{className:"flex items-center gap-2 text-base",children:[e.jsx(z,{className:"h-4 w-4 text-primary"}),"Mes clés API"]}),e.jsxs(C,{children:[p.length," clé",p.length!==1?"s":""]})]}),!se&&e.jsxs(c,{size:"sm",onClick:()=>{R(!0),T("redirect")},"data-testid":"button-new-key",children:[e.jsx(Z,{className:"h-4 w-4 mr-2"}),"Nouvelle clé"]})]})}),e.jsx(j,{children:V?e.jsx("div",{className:"flex justify-center py-8",children:e.jsx(E,{className:"h-6 w-6 animate-spin text-muted-foreground"})}):p.length===0?e.jsxs("div",{className:"text-center py-8 text-muted-foreground",children:[e.jsx(z,{className:"h-12 w-12 mx-auto mb-3 opacity-50"}),e.jsx("p",{children:"Aucune clé créée"}),e.jsxs(c,{className:"mt-3",size:"sm",onClick:()=>{R(!0),T("redirect")},"data-testid":"button-create-first-key",children:[e.jsx(Z,{className:"h-4 w-4 mr-2"}),"Créer ma première clé"]})]}):e.jsx("div",{className:"space-y-3",children:p.map(t=>e.jsx(W,{keyItem:t},t.id))})})]}),e.jsx(g,{children:e.jsx(j,{className:"pt-6",children:e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("div",{className:"h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0",children:e.jsx(D,{className:"h-5 w-5 text-primary"})}),e.jsxs("div",{className:"flex-1",children:[e.jsx("p",{className:"font-medium",children:"Documentation API"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Consultez la documentation pour intégrer SendavaPay dans votre application"})]}),e.jsx(_,{href:"/docs",children:e.jsxs(c,{variant:"outline","data-testid":"button-docs",children:[e.jsx(D,{className:"h-4 w-4 mr-2"}),"Voir la documentation"]})})]})})})]})})]}),e.jsx(ve,{open:!!S,onOpenChange:t=>!t&&B(null),children:e.jsxs(ye,{children:[e.jsxs(Ne,{children:[e.jsx(we,{children:"Supprimer cette clé API ?"}),e.jsxs(ke,{children:['Êtes-vous sûr de vouloir supprimer la clé "',S==null?void 0:S.name,'" ? Cette action est irréversible et toutes les intégrations utilisant cette clé cesseront de fonctionner.']})]}),e.jsxs(Ce,{children:[e.jsx(Te,{children:"Annuler"}),e.jsxs(Se,{onClick:()=>{S&&(H.mutate(S.id),B(null))},className:"bg-destructive text-destructive-foreground hover:bg-destructive/90",children:[H.isPending?e.jsx(E,{className:"h-4 w-4 mr-2 animate-spin"}):e.jsx(me,{className:"h-4 w-4 mr-2"}),"Supprimer"]})]})]})})]})}export{Nt as default};
