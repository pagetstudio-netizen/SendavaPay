import{b as je,c as ge,r as u,u as J,d as ne,j as e,e as A,L as I,f as oe,q as ie}from"./index-CLUZ_7oC.js";import{D as F}from"./dashboard-layout-B2CZ87-N.js";import{B as m}from"./button-BUVufrg4.js";import{C as g,b,c as y,d as T,a as f}from"./card-sJwYwjcF.js";import{I as X}from"./input-C02lV5FG.js";import{L as K}from"./label-JB0E9B2o.js";import{C as _,B as U}from"./badge-B8qc4je7.js";import{T as fe,b as be,c as de,a as le}from"./tabs-BALk538v.js";import{A as ye,a as Ne,b as ve,c as we,d as ke,e as Te,f as Ce,g as Oe}from"./alert-dialog-BVejVHz_.js";import{W as Se}from"./wrench-CTcc7uRL.js";import{A as Z}from"./arrow-left-CkAZFvRa.js";import{S as ce}from"./shield-CGfbUNLf.js";import{P as Q}from"./plus-mu4o34gn.js";import{C as E}from"./code-xml-xEkso1lO.js";import{E as me}from"./external-link-dqPXLAA9.js";import{K as L}from"./key-DhxII0M7.js";import{W as Ae}from"./webhook-DMwBdP1x.js";import{G as ee}from"./globe-DQMTKefc.js";import{B as M}from"./book-open-DrF8HDSj.js";import{T as xe}from"./trash-2-BokvqWVx.js";import{C as z}from"./copy-UZSOs8Wf.js";import{B as Pe}from"./bell-J0Acc95u.js";import"./avatar-hpfTqtyi.js";import"./dropdown-menu-5wwXQqkS.js";import"./index-D-QM6ZmI.js";import"./index-1excy5Zt.js";import"./index-BHsrdu1b.js";import"./menu-BrPXqb_S.js";import"./theme-toggle-B712BjT2.js";import"./sun-DE_Teob1.js";import"./20251211_105226_1765450558306-pbBvZwWp.js";import"./circle-check-big-Bff2cK3z.js";import"./file-text-D-6NSyrQ.js";import"./credit-card-BZYEXUly.js";import"./send-DmEs74_T.js";import"./link-wsVuVQ7O.js";import"./clock-7IZ54aHc.js";import"./key-round-DQi14LWt.js";import"./circle-help-BewQjiQU.js";import"./users-CWEdGlwJ.js";import"./shield-check-Bw2afJyl.js";import"./message-square-DmQp6pw8.js";import"./trending-up-KgnJmPhg.js";function r({code:n,language:i="bash"}){const[a,d]=u.useState(!1),h=()=>{navigator.clipboard.writeText(n),d(!0),setTimeout(()=>d(!1),2e3)};return e.jsxs("div",{className:"rounded-lg overflow-hidden border border-slate-700 my-3",children:[e.jsxs("div",{className:"flex items-center justify-between bg-slate-800 px-3 py-1.5",children:[e.jsx("span",{className:"text-xs text-slate-400 font-mono",children:i}),e.jsx("button",{onClick:h,className:"text-slate-400 hover:text-white transition-colors p-1",children:a?e.jsx(_,{className:"h-3 w-3"}):e.jsx(z,{className:"h-3 w-3"})})]}),e.jsx("pre",{className:"bg-slate-900 text-slate-100 p-4 overflow-x-auto text-xs font-mono leading-relaxed",children:e.jsx("code",{children:n})})]})}function P({tabs:n}){const[i,a]=u.useState(0),[d,h]=u.useState(!1),v=()=>{navigator.clipboard.writeText(n[i].code),h(!0),setTimeout(()=>h(!1),2e3)};return e.jsxs("div",{className:"rounded-lg overflow-hidden border border-slate-700 my-3",children:[e.jsxs("div",{className:"flex items-center justify-between bg-slate-800 px-3 py-1.5",children:[e.jsx("div",{className:"flex gap-1",children:n.map((s,o)=>e.jsx("button",{onClick:()=>a(o),className:`px-3 py-1 rounded text-xs font-medium transition-colors ${i===o?"bg-slate-600 text-white":"text-slate-400 hover:text-slate-200"}`,children:s.label},o))}),e.jsx("button",{onClick:v,className:"text-slate-400 hover:text-white transition-colors p-1",children:d?e.jsx(_,{className:"h-3 w-3"}):e.jsx(z,{className:"h-3 w-3"})})]}),e.jsx("pre",{className:"bg-slate-900 text-slate-100 p-4 overflow-x-auto text-xs font-mono leading-relaxed",children:e.jsx("code",{children:n[i].code})})]})}function l({method:n,path:i,description:a}){const d={POST:"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",GET:"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",PUT:"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",DELETE:"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"};return e.jsxs("div",{className:"my-4 p-3 bg-muted/40 rounded-lg border",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("span",{className:`inline-flex px-2 py-0.5 rounded text-xs font-bold font-mono flex-shrink-0 ${d[n]||"bg-muted text-muted-foreground"}`,children:n}),e.jsx("code",{className:"text-sm text-foreground font-mono",children:i})]}),a&&e.jsx("p",{className:"mt-1.5 text-xs text-muted-foreground pl-1",children:a})]})}function x({type:n,title:i,children:a}){const d={info:"bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300",warning:"bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300",tip:"bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300",danger:"bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"};return e.jsxs("div",{className:`p-4 rounded-lg border ${d[n]} text-sm my-4`,children:[i&&e.jsx("p",{className:"font-semibold mb-1",children:i}),e.jsx("div",{children:a})]})}function N({params:n}){return e.jsx("div",{className:"overflow-x-auto my-4 rounded-lg border text-sm",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Paramètre"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Type"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Description"})]})}),e.jsx("tbody",{children:n.map((i,a)=>e.jsxs("tr",{className:"border-t hover:bg-muted/20",children:[e.jsxs("td",{className:"p-3 font-mono text-xs whitespace-nowrap",children:[i.name,i.required&&e.jsx("span",{className:"text-red-500 ml-0.5",children:"*"})]}),e.jsx("td",{className:"p-3 font-mono text-xs text-muted-foreground whitespace-nowrap",children:i.type}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:i.description})]},a))})]})})}function _e({apiKeys:n}){var v;const a=((v=n.filter(s=>s.apiType==="sdk"&&s.isActive)[0])==null?void 0:v.apiKey)||"sdk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",d=s=>{var o;(o=document.getElementById(s))==null||o.scrollIntoView({behavior:"smooth",block:"start"})},h=[{id:"s-intro",label:"Introduction"},{id:"s-auth",label:"Authentification"},{label:"API Backend (server-side)",children:[{id:"s-create",label:"Créer un paiement"},{id:"s-status",label:"Statut d'un paiement"},{id:"s-verify",label:"Vérifier un paiement"},{id:"s-list",label:"Lister les transactions"},{id:"s-withdraw",label:"Retrait (pay-out)"},{id:"s-validate-withdraw",label:"Valider un retrait"},{id:"s-withdraw-status",label:"Statut d'un retrait"},{id:"s-payout-status",label:"Dispo. opérateurs payout"},{id:"s-balance",label:"Soldes wallets"}]},{label:"API Client (CORS)",children:[{id:"s-token",label:"Détails par token"},{id:"s-countries",label:"Pays disponibles"},{id:"s-services",label:"Opérateurs par pays"},{id:"s-initiate",label:"Initier le paiement"},{id:"s-otp",label:"Soumettre OTP"}]},{label:"Webhooks",children:[{id:"s-wh-config",label:"Configuration"},{id:"s-wh-events",label:"Événements"},{id:"s-wh-payload",label:"Payload & headers"},{id:"s-wh-signature",label:"Vérification HMAC"}]},{id:"s-operators",label:"Pays & Opérateurs"},{id:"s-statuses",label:"Statuts de transaction"},{id:"s-errors",label:"Codes d'erreur"},{id:"s-rate",label:"Rate Limiting"}];return e.jsxs("div",{className:"flex -mx-6 border-t min-h-screen",children:[e.jsxs("nav",{className:"hidden xl:flex flex-col w-52 flex-shrink-0 border-r bg-muted/20 sticky top-0 max-h-screen overflow-y-auto py-5 gap-0.5",children:[e.jsx("p",{className:"text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 mb-2",children:"SDK API v2.0"}),h.map((s,o)=>{var c;return s.id?e.jsx("button",{onClick:()=>d(s.id),className:"text-left px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors rounded-sm mx-1",children:s.label},o):e.jsxs("div",{className:"mt-3",children:[e.jsx("p",{className:"px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground",children:s.label}),(c=s.children)==null?void 0:c.map((j,D)=>e.jsx("button",{onClick:()=>d(j.id),className:"w-full text-left pl-6 pr-4 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors rounded-sm mx-1",children:j.label},D))]},o)})]}),e.jsxs("div",{className:"flex-1 px-6 xl:px-12 py-8 max-w-4xl space-y-14 overflow-x-hidden",children:[e.jsxs("section",{id:"s-intro",children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-6",children:"Introduction"}),e.jsx("p",{className:"text-sm text-muted-foreground leading-relaxed mb-6",children:"L'API SDK SendavaPay vous permet d'encaisser des paiements Mobile Money et d'effectuer des retraits automatisés depuis votre infrastructure. Vous construisez votre propre interface — aucune redirection, aucun composant SendavaPay."}),e.jsxs("div",{className:"grid sm:grid-cols-2 gap-3 mb-6",children:[e.jsxs("div",{className:"p-3 rounded-lg border bg-muted/30",children:[e.jsx("p",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2",children:"API Backend (server-side)"}),e.jsxs("p",{className:"text-xs text-muted-foreground",children:["Authentifiée avec votre clé ",e.jsx("code",{children:"sdk_"}),". Créer paiements, retraits, consulter soldes & transactions."]})]}),e.jsxs("div",{className:"p-3 rounded-lg border bg-muted/30",children:[e.jsx("p",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2",children:"API Client (CORS)"}),e.jsxs("p",{className:"text-xs text-muted-foreground",children:["Endpoints CORS ouverts, authentifiés par ",e.jsx("code",{children:"paymentToken"})," temporaire. Utilisables depuis n'importe quel frontend."]})]})]}),e.jsxs(x,{type:"danger",title:"Clé SDK — server-side uniquement",children:["Votre clé ",e.jsx("code",{children:"sdk_…"})," ne doit exister que sur votre serveur. Ne l'exposez jamais dans le code frontend. Utilisez les endpoints ",e.jsx("strong",{children:"API Client"})," (CORS) depuis votre frontend — ils n'ont pas besoin de la clé SDK."]})]}),e.jsxs("section",{id:"s-auth",children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-6",children:"Authentification"}),e.jsxs("p",{className:"text-sm text-muted-foreground mb-4",children:["Tous les endpoints ",e.jsx("strong",{children:"Backend"})," exigent votre clé SDK dans le header ",e.jsx("code",{className:"bg-muted px-1 rounded",children:"Authorization"}),". Les endpoints ",e.jsx("strong",{children:"Client (CORS)"})," s'authentifient via le ",e.jsx("code",{children:"paymentToken"})," retourné par ",e.jsx("code",{children:"POST /create-payment"}),"."]}),e.jsx(r,{language:"http",code:`Authorization: Bearer ${a}
Content-Type: application/json

Base URL: https://sendavapay.com/api/sdk/v1`}),e.jsx("div",{className:"overflow-x-auto rounded-lg border my-4 text-sm",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Type"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Préfixe"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Utilisation"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{className:"border-t",children:[e.jsx("td",{className:"p-3 text-xs",children:"Clé SDK"}),e.jsx("td",{className:"p-3 font-mono text-xs",children:"sdk_"}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:"Header Authorization — endpoints backend uniquement"})]}),e.jsxs("tr",{className:"border-t",children:[e.jsx("td",{className:"p-3 text-xs",children:"Payment Token"}),e.jsx("td",{className:"p-3 font-mono text-xs",children:"pay_tok_"}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:"Validité 30 min — endpoints client CORS"})]})]})]})}),e.jsx(x,{type:"warning",title:"Prérequis",children:"KYC validé et accès SDK activé par l'administrateur."})]}),e.jsxs("section",{children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-2",children:"API Backend"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-10",children:"Endpoints authentifiés par votre clé SDK. À appeler uniquement depuis votre serveur."}),e.jsxs("div",{id:"s-create",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Créer un paiement"}),e.jsxs("p",{className:"text-sm text-muted-foreground mb-3",children:["Crée une transaction et retourne un ",e.jsx("code",{className:"bg-muted px-1 rounded text-xs",children:"paymentToken"})," (valide 30 min) ainsi qu'une ",e.jsx("code",{className:"bg-muted px-1 rounded text-xs",children:"reference"})," à stocker. Transmettez le token à votre frontend pour authentifier les appels client."]}),e.jsx(l,{method:"POST",path:"/api/sdk/v1/create-payment"}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Corps de la requête"}),e.jsx(N,{params:[{name:"amount",type:"number",required:!0,description:"Montant en unité de la devise (ex. 5000 = 5 000 XOF)"},{name:"currency",type:"string",required:!0,description:"XOF · XAF · GNF · CDF"},{name:"description",type:"string",description:"Description de la transaction (max 255 car.)"},{name:"customerName",type:"string",description:"Nom du client"},{name:"customerEmail",type:"string",description:"Email du client"},{name:"customerPhone",type:"string",description:"Téléphone en E.164 (+22890000000)"},{name:"payerCountry",type:"string",description:"Code pays ISO (TG, SN, CM…) — détermine le wallet crédité"},{name:"webhookUrl",type:"string",description:"URL HTTPS de notification (écrase l'URL globale de la clé)"},{name:"externalReference",type:"string",description:"Votre référence commande pour idempotence (max 128 car.)"},{name:"metadata",type:"object",description:"Données personnalisées attachées à la transaction"}]}),e.jsx(P,{tabs:[{label:"curl",code:`curl -X POST https://sendavapay.com/api/sdk/v1/create-payment \\
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
    "webhookUrl": "https://monsite.com/webhooks/sendavapay",
    "externalReference": "order_1234"
  }'`},{label:"node.js",code:`const res = await fetch('https://sendavapay.com/api/sdk/v1/create-payment', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${a}',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 5000,
    currency: 'XOF',
    description: 'Commande #1234',
    customerName: 'Jean Dupont',
    payerCountry: 'TG',
    webhookUrl: 'https://monsite.com/webhooks/sendavapay',
    externalReference: 'order_1234',
  }),
});
const { data } = await res.json();`},{label:"php",code:`$res = Http::withHeaders([
  'Authorization' => 'Bearer ${a}',
  'Content-Type'  => 'application/json',
])->post('https://sendavapay.com/api/sdk/v1/create-payment', [
  'amount'            => 5000,
  'currency'          => 'XOF',
  'description'       => 'Commande #1234',
  'payerCountry'      => 'TG',
  'webhookUrl'        => 'https://monsite.com/webhooks/sendavapay',
  'externalReference' => 'order_1234',
]);
$data = $res->json('data');`}]}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"201 Created"})]}),e.jsx(r,{language:"json",code:`{
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
}`}),e.jsxs(x,{type:"tip",title:"Idempotence",children:["Si vous relancez la même ",e.jsx("code",{children:"externalReference"})," alors qu'un paiement est déjà ",e.jsx("code",{children:"pending"})," ou ",e.jsx("code",{children:"completed"}),", vous recevrez une erreur ",e.jsx("code",{children:"409 DUPLICATE_REFERENCE"}),". Aucun doublon n'est créé."]})]}),e.jsxs("div",{id:"s-status",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Statut d'un paiement"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"Retourne le statut actuel d'une transaction."}),e.jsx(l,{method:"GET",path:"/api/sdk/v1/payment-status/:reference"}),e.jsx(r,{language:"curl",code:`curl https://sendavapay.com/api/sdk/v1/payment-status/sdk_lcy0u4wx_a1b2c3d4e5f6g7h8 \\
  -H "Authorization: Bearer ${a}"`}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(r,{language:"json",code:`{
  "success": true,
  "data": {
    "reference":   "sdk_lcy0u4wx_a1b2c3d4e5f6g7h8",
    "status":      "completed",
    "amount":      "5000.00",
    "currency":    "XOF",
    "completedAt": "2026-05-28T10:05:32.000Z"
  }
}`})]}),e.jsxs("div",{id:"s-verify",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Vérifier un paiement"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"Retourne les détails complets d'une transaction. À utiliser côté serveur pour valider avant de livrer une commande."}),e.jsx(l,{method:"POST",path:"/api/sdk/v1/verify-payment"}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Corps de la requête"}),e.jsx(N,{params:[{name:"reference",type:"string",required:!0,description:"Référence de la transaction retournée par create-payment"}]}),e.jsx(r,{language:"curl",code:`curl -X POST https://sendavapay.com/api/sdk/v1/verify-payment \\
  -H "Authorization: Bearer ${a}" \\
  -H "Content-Type: application/json" \\
  -d '{ "reference": "sdk_lcy0u4wx_a1b2c3d4e5f6g7h8" }'`}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(r,{language:"json",code:`{
  "success": true,
  "data": {
    "reference":         "sdk_lcy0u4wx_a1b2c3d4e5f6g7h8",
    "externalReference": "order_1234",
    "amount":            "5000.00",
    "fee":               "150.00",
    "currency":          "XOF",
    "status":            "completed",
    "customerEmail":     "jean@example.com",
    "customerPhone":     "+22890000000",
    "customerName":      "Jean Dupont",
    "paymentMethod":     "tmoney",
    "createdAt":         "2026-05-28T10:00:00.000Z",
    "completedAt":       "2026-05-28T10:05:32.000Z"
  }
}`})]}),e.jsxs("div",{id:"s-list",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Lister les transactions"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"Retourne toutes les transactions (pay-in + pay-out) de votre compte."}),e.jsx(l,{method:"GET",path:"/api/sdk/v1/transactions"}),e.jsx(r,{language:"curl",code:`curl https://sendavapay.com/api/sdk/v1/transactions \\
  -H "Authorization: Bearer ${a}"`}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(r,{language:"json",code:`{
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
}`})]}),e.jsxs("div",{id:"s-withdraw",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Retrait — Pay-out"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"Envoie de l'argent depuis votre wallet vers un numéro Mobile Money. Les fonds sont débités immédiatement du wallet pays correspondant."}),e.jsx(l,{method:"POST",path:"/api/sdk/v1/withdraw"}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Corps de la requête"}),e.jsx(N,{params:[{name:"amount",type:"number",required:!0,description:"Montant à envoyer"},{name:"phoneNumber",type:"string",required:!0,description:"Numéro Mobile Money du bénéficiaire en E.164"},{name:"operator",type:"string",required:!0,description:"Slug opérateur : tmoney, moov, mtn, orange, wave, vodacom, airtel…"},{name:"country",type:"string",required:!0,description:"Code pays ISO (TG, CM, COD, COG…)"},{name:"currency",type:"string",required:!0,description:"XOF · XAF · GNF · CDF"},{name:"description",type:"string",description:"Motif du transfert"},{name:"externalReference",type:"string",description:"Votre référence paiement fournisseur"}]}),e.jsx(P,{tabs:[{label:"curl",code:`curl -X POST https://sendavapay.com/api/sdk/v1/withdraw \\
  -H "Authorization: Bearer ${a}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 10000,
    "phoneNumber": "+22890123456",
    "operator": "tmoney",
    "country": "TG",
    "currency": "XOF",
    "description": "Paiement fournisseur",
    "externalReference": "payout_456"
  }'`},{label:"node.js",code:`const res = await fetch('https://sendavapay.com/api/sdk/v1/withdraw', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${a}',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 10000,
    phoneNumber: '+22890123456',
    operator: 'tmoney',
    country: 'TG',
    currency: 'XOF',
    description: 'Paiement fournisseur',
    externalReference: 'payout_456',
  }),
});
const { data } = await res.json();`},{label:"php",code:`$res = Http::withHeaders([
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
]);`}]}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"201 Created"})]}),e.jsx(r,{language:"json",code:`{
  "success": true,
  "data": {
    "withdrawalId":      87,
    "reference":         "sdk_lcy1a3bx_z9y8w7v6u5t4s3r2",
    "externalReference": "payout_456",
    "amount":            10000,
    "fee":               100,
    "netAmount":         9900,
    "currency":          "XOF",
    "phoneNumber":       "+22890123456",
    "operator":          "tmoney",
    "country":           "TG",
    "countryName":       "Togo",
    "status":            "pending",
    "statusLabel":       "En attente de traitement",
    "walletBalance":     85000,
    "trackingUrl":       "GET /api/sdk/v1/withdrawal-status/sdk_lcy1a3bx_z9y8w7v6u5t4s3r2",
    "createdAt":         "2026-05-28T11:00:00.000Z"
  }
}`}),e.jsxs(x,{type:"info",title:"Traitement",children:["Les retraits sont traités automatiquement pour les opérateurs pris en charge. Un webhook ",e.jsx("code",{children:"withdrawal.completed"})," est envoyé à votre URL dès que le virement est effectué. Utilisez ",e.jsx("code",{children:"trackingUrl"})," pour suivre l'évolution du retrait."]})]}),e.jsxs("div",{id:"s-validate-withdraw",className:"scroll-mt-4 mb-14",children:[e.jsxs("h3",{className:"text-lg font-semibold mb-1",children:["Valider un retrait ",e.jsx("span",{className:"ml-2 text-xs font-normal text-muted-foreground",children:"(dry-run)"})]}),e.jsxs("p",{className:"text-sm text-muted-foreground mb-3",children:["Vérifie qu'un retrait peut être effectué ",e.jsx("strong",{children:"sans l'exécuter"}),". Idéal pour afficher les frais et valider le formulaire côté client avant confirmation."]}),e.jsx(l,{method:"POST",path:"/api/sdk/v1/validate-withdrawal"}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Corps de la requête"}),e.jsx(N,{params:[{name:"amount",type:"number",required:!0,description:"Montant à vérifier"},{name:"phoneNumber",type:"string",required:!0,description:"Numéro E.164 du bénéficiaire"},{name:"operator",type:"string",required:!0,description:"Slug opérateur (tmoney, moov, mtn…)"},{name:"country",type:"string",required:!0,description:"Code pays ISO (TG, CM, COD…)"},{name:"currency",type:"string",required:!1,description:"Devise (défaut XOF)"}]}),e.jsx(P,{tabs:[{label:"curl",code:`curl -X POST https://sendavapay.com/api/sdk/v1/validate-withdrawal \\
  -H "Authorization: Bearer \${KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 10000,
    "phoneNumber": "+22890123456",
    "operator": "tmoney",
    "country": "TG",
    "currency": "XOF"
  }'`},{label:"node.js",code:`const res = await fetch('https://sendavapay.com/api/sdk/v1/validate-withdrawal', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer \${KEY}',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 10000,
    phoneNumber: '+22890123456',
    operator: 'tmoney',
    country: 'TG',
  }),
});
const { success, data } = await res.json();
if (success) {
  console.log(\`Frais: \${data.fee} | Net: \${data.netAmount} | Solde: \${data.walletBalance}\`);
}`}]}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(r,{language:"json",code:`{
  "success": true,
  "data": {
    "valid":          true,
    "amount":         10000,
    "currency":       "XOF",
    "fee":            100,
    "netAmount":      9900,
    "walletBalance":  85000,
    "operatorStatus": "online",
    "country":        "TG",
    "countryName":    "Togo",
    "message":        "Retrait valide. Vous pouvez procéder."
  }
}`}),e.jsxs(x,{type:"warning",title:"Erreur côté validation",children:["Si ",e.jsx("code",{children:"success: false"}),", le champ ",e.jsx("code",{children:"code"})," indique la raison exacte :",e.jsx("code",{children:"INSUFFICIENT_BALANCE"}),", ",e.jsx("code",{children:"PAYOUT_OPERATOR_OFFLINE"}),", ",e.jsx("code",{children:"INVALID_PHONE_FORMAT"}),", ",e.jsx("code",{children:"OPERATOR_COUNTRY_MISMATCH"}),"…"]})]}),e.jsxs("div",{id:"s-withdraw-status",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Statut d'un retrait"}),e.jsxs("p",{className:"text-sm text-muted-foreground mb-3",children:["Suivez l'état d'un retrait à tout moment à partir de sa référence. Utilisez-le après un ",e.jsx("code",{children:"POST /withdraw"})," pour savoir si le virement a été effectué."]}),e.jsx(l,{method:"GET",path:"/api/sdk/v1/withdrawal-status/:reference"}),e.jsx(P,{tabs:[{label:"curl",code:'curl https://sendavapay.com/api/sdk/v1/withdrawal-status/sdk_lcy1a3bx_z9y8w7v6u5t4s3r2 \\\n  -H "Authorization: Bearer ${KEY}"'},{label:"node.js",code:`const ref = 'sdk_lcy1a3bx_z9y8w7v6u5t4s3r2';
const res = await fetch(\`https://sendavapay.com/api/sdk/v1/withdrawal-status/\${ref}\`, {
  headers: { 'Authorization': 'Bearer \${KEY}' },
});
const { data } = await res.json();
console.log(data.status, data.statusLabel);`}]}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(r,{language:"json",code:`{
  "success": true,
  "data": {
    "reference":         "sdk_lcy1a3bx_z9y8w7v6u5t4s3r2",
    "externalReference": "payout_456",
    "status":            "completed",
    "statusLabel":       "Retrait effectué avec succès",
    "amount":            "10000.00",
    "fee":               "100.00",
    "netAmount":         "9900.00",
    "currency":          "XOF",
    "phoneNumber":       "+22890123456",
    "paymentMethod":     "tmoney",
    "createdAt":         "2026-05-28T11:00:00.000Z",
    "completedAt":       "2026-05-28T11:04:17.000Z"
  }
}`}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Statuts possibles"}),e.jsx("div",{className:"overflow-x-auto rounded-lg border text-sm",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Statut"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Description"})]})}),e.jsx("tbody",{children:[["pending","En attente de traitement"],["processing","En cours de traitement chez l'opérateur"],["completed","Retrait effectué avec succès"],["failed","Retrait échoué — fonds non débités"],["cancelled","Retrait annulé"]].map(([s,o],c)=>e.jsxs("tr",{className:"border-t hover:bg-muted/20",children:[e.jsx("td",{className:"p-3 font-mono text-xs",children:s}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:o})]},c))})]})})]}),e.jsxs("div",{id:"s-payout-status",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Disponibilité opérateurs pay-out"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"Retourne le statut temps réel de chaque opérateur pour les retraits. À interroger avant d'afficher les choix d'opérateur à vos utilisateurs."}),e.jsx(l,{method:"GET",path:"/api/sdk/v1/payout-status"}),e.jsx(P,{tabs:[{label:"curl",code:'curl https://sendavapay.com/api/sdk/v1/payout-status \\\n  -H "Authorization: Bearer ${KEY}"'},{label:"node.js",code:`const res = await fetch('https://sendavapay.com/api/sdk/v1/payout-status', {
  headers: { 'Authorization': 'Bearer \${KEY}' },
});
const { data } = await res.json();
const online = data.operators.filter(op => op.payoutStatus === 'online');
console.log(\`\${data.summary.online} opérateurs disponibles\`);`}]}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(r,{language:"json",code:`{
  "success": true,
  "data": {
    "summary": {
      "online":  12,
      "offline": 2,
      "total":   14
    },
    "operators": [
      {
        "id":            "1",
        "operator":      "mtn",
        "country":       "CM",
        "currency":      "XAF",
        "gateway":       "paydunya",
        "payoutStatus":  "online",
        "depositStatus": "online"
      },
      {
        "id":            "11",
        "operator":      "airtel",
        "country":       "COG",
        "currency":      "XAF",
        "gateway":       "soleaspay",
        "payoutStatus":  "offline",
        "depositStatus": "offline"
      }
    ]
  }
}`}),e.jsxs(x,{type:"info",title:"Bonne pratique",children:["Filtrez côté client ",e.jsx("code",{children:'payoutStatus === "online"'})," avant d'afficher les opérateurs disponibles dans votre formulaire de retrait. Combinez avec ",e.jsx("code",{children:"POST /validate-withdrawal"})," pour confirmer avant envoi."]})]}),e.jsxs("div",{id:"s-balance",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Soldes wallets"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"Retourne le solde de vos wallets. Un wallet par pays."}),e.jsx(l,{method:"GET",path:"/api/sdk/v1/balance"}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Paramètres de requête (optionnels)"}),e.jsx(N,{params:[{name:"country",type:"string",description:"Code pays ISO pour filtrer sur un seul wallet (ex. ?country=TG)"}]}),e.jsx(r,{language:"curl",code:`# Tous les wallets
curl https://sendavapay.com/api/sdk/v1/balance \\
  -H "Authorization: Bearer ${a}"

# Un seul pays
curl "https://sendavapay.com/api/sdk/v1/balance?country=TG" \\
  -H "Authorization: Bearer ${a}"`}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(r,{language:"json",code:`{
  "success": true,
  "data": {
    "wallets": [
      { "country": "TG",  "countryName": "Togo",     "balance": "25000.00", "currency": "XOF" },
      { "country": "SN",  "countryName": "Sénégal",  "balance": "8500.00",  "currency": "XOF" },
      { "country": "CM",  "countryName": "Cameroun", "balance": "12000.00", "currency": "XAF" },
      { "country": "COD", "countryName": "RD Congo", "balance": "150000",   "currency": "CDF" }
    ],
    "totalWallets": 4
  }
}`})]})]}),e.jsxs("section",{children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-2",children:"API Client — CORS"}),e.jsxs("p",{className:"text-sm text-muted-foreground mb-4",children:["Ces endpoints sont accessibles depuis n'importe quel frontend (CORS ouvert). Ils s'authentifient par le ",e.jsx("code",{className:"bg-muted px-1 rounded text-xs",children:"paymentToken"})," retourné par ",e.jsx("code",{className:"bg-muted px-1 rounded text-xs",children:"create-payment"})," — pas besoin de votre clé SDK."]}),e.jsxs(x,{type:"warning",children:["Le ",e.jsx("code",{children:"paymentToken"})," a une validité de ",e.jsx("strong",{children:"30 minutes"}),". Après expiration, les appels retournent ",e.jsx("code",{children:"410 Gone"}),"."]}),e.jsxs("div",{id:"s-token",className:"scroll-mt-4 mt-10 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Détails de la transaction par token"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"Retourne les informations de la transaction associée au token : montant, devise, description, statut, nom du marchand."}),e.jsx(l,{method:"GET",path:"/api/sdk/widget/token/:paymentToken"}),e.jsx(r,{language:"javascript",code:`const res = await fetch(
  'https://sendavapay.com/api/sdk/widget/token/pay_tok_xxxx'
);
const { data } = await res.json();
// data.reference, data.amount, data.currency, data.description, data.ownerName, data.status`}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(r,{language:"json",code:`{
  "success": true,
  "data": {
    "reference":    "sdk_lcy0u4wx_a1b2c3d4e5f6g7h8",
    "amount":       "5000.00",
    "currency":     "XOF",
    "description":  "Commande #1234",
    "status":       "pending",
    "ownerName":    "MaBoutique.com",
    "customerName": "Jean Dupont",
    "customerPhone": "+22890000000"
  }
}`})]}),e.jsxs("div",{id:"s-countries",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Pays disponibles"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"Retourne la liste des pays activés avec leur devise."}),e.jsx(l,{method:"GET",path:"/api/soleaspay/countries"}),e.jsx(r,{language:"javascript",code:`const res = await fetch('https://sendavapay.com/api/soleaspay/countries');
const { data } = await res.json();
// [{ id: 'TG', name: 'Togo', currency: 'XOF' }, …]`}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(r,{language:"json",code:`{
  "success": true,
  "data": [
    { "id": "TG",  "name": "Togo",              "currency": "XOF" },
    { "id": "SN",  "name": "Sénégal",           "currency": "XOF" },
    { "id": "CM",  "name": "Cameroun",          "currency": "XAF" },
    { "id": "COD", "name": "RD Congo",          "currency": "CDF" },
    { "id": "COG", "name": "Congo Brazzaville", "currency": "XAF" }
  ]
}`})]}),e.jsxs("div",{id:"s-services",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Opérateurs par pays"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"Retourne les opérateurs Mobile Money disponibles pour un pays donné."}),e.jsx(l,{method:"GET",path:"/api/soleaspay/services/:countryCode"}),e.jsx(r,{language:"javascript",code:`const res = await fetch('https://sendavapay.com/api/soleaspay/services/SN');
const { data } = await res.json();
// [{ id: '12', name: 'Orange Money', slug: 'orange_sn' }, …]`}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(r,{language:"json",code:`{
  "success": true,
  "data": [
    { "id": "12", "name": "Orange Money", "slug": "orange_sn" },
    { "id": "15", "name": "Wave",         "slug": "wave_sn"   },
    { "id": "18", "name": "Free Money",   "slug": "free_sn"   }
  ]
}`})]}),e.jsxs("div",{id:"s-initiate",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Initier le paiement"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"Déclenche la demande de paiement Mobile Money. L'opérateur envoie une invite sur le téléphone du payeur (ou un SMS OTP selon l'opérateur)."}),e.jsx(l,{method:"POST",path:"/api/pay-api/:reference"}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Corps de la requête"}),e.jsx(N,{params:[{name:"paymentToken",type:"string",required:!0,description:"Token retourné par create-payment"},{name:"payerName",type:"string",required:!0,description:"Nom du payeur"},{name:"payerPhone",type:"string",required:!0,description:"Numéro Mobile Money en E.164 (+22890000000)"},{name:"payerEmail",type:"string",description:"Email du payeur"},{name:"payerCountry",type:"string",required:!0,description:"Code pays ISO (TG, SN, CM…)"},{name:"serviceId",type:"string",required:!0,description:"ID de l'opérateur retourné par /services/:countryCode"}]}),e.jsx(r,{language:"javascript",code:`const res = await fetch(
  'https://sendavapay.com/api/pay-api/sdk_lcy0u4wx_a1b2c3d4e5f6g7h8',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentToken: 'pay_tok_xxxx',
      payerName:    'Jean Dupont',
      payerPhone:   '+22890000000',
      payerCountry: 'TG',
      serviceId:    '5',
    }),
  }
);
const result = await res.json();`}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Réponse sans OTP"}),e.jsx(r,{language:"json",code:`{
  "success":     true,
  "status":      "processing",
  "requiresOtp": false,
  "reference":   "sdk_lcy0u4wx_a1b2c3d4e5f6g7h8",
  "message":     "Invite de paiement envoyée sur le téléphone du client"
}`}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Réponse avec OTP requis (Orange Money)"}),e.jsx(r,{language:"json",code:`{
  "success":     true,
  "status":      "processing",
  "requiresOtp": true,
  "payId":       "PAY-XXXXXXXX",
  "orderId":     "ORD-XXXXXXXX",
  "message":     "Code OTP envoyé par SMS au payeur"
}`})]}),e.jsxs("div",{id:"s-otp",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Soumettre un OTP"}),e.jsxs("p",{className:"text-sm text-muted-foreground mb-3",children:["Applicable uniquement pour les opérateurs Orange Money (BF, CI, GN, ML, SN). À appeler après réception de ",e.jsx("code",{className:"bg-muted px-1 rounded text-xs",children:"requiresOtp: true"}),"."]}),e.jsx(l,{method:"POST",path:"/api/pay-api/:reference/verify"}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Corps de la requête"}),e.jsx(N,{params:[{name:"paymentToken",type:"string",required:!0,description:"Token retourné par create-payment"},{name:"payId",type:"string",required:!0,description:"payId retourné par l'initiation du paiement"},{name:"orderId",type:"string",required:!0,description:"orderId retourné par l'initiation du paiement"},{name:"otp",type:"string",required:!0,description:"Code OTP saisi par le payeur"}]}),e.jsx(r,{language:"javascript",code:`const res = await fetch(
  'https://sendavapay.com/api/pay-api/sdk_lcy0u4wx_a1b2c3d4e5f6g7h8/verify',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentToken: 'pay_tok_xxxx',
      payId:        'PAY-XXXXXXXX',
      orderId:      'ORD-XXXXXXXX',
      otp:          '123456',
    }),
  }
);
const result = await res.json();`}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(r,{language:"json",code:`{
  "success": true,
  "message": "OTP soumis, vérification en cours"
}`})]})]}),e.jsxs("section",{children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-2",children:"Webhooks"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-10",children:"SendavaPay envoie un POST signé sur votre URL dès qu'un événement survient."}),e.jsxs("div",{id:"s-wh-config",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Configuration"}),e.jsxs("p",{className:"text-sm text-muted-foreground mb-3",children:["Configurez une URL globale pour votre clé SDK, ou passez ",e.jsx("code",{className:"bg-muted px-1 rounded text-xs",children:"webhookUrl"}),"à chaque appel ",e.jsx("code",{className:"bg-muted px-1 rounded text-xs",children:"create-payment"}),"."]}),e.jsx(l,{method:"PUT",path:"/api/sdk/v1/webhook"}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Corps de la requête"}),e.jsx(N,{params:[{name:"webhookUrl",type:"string",required:!0,description:"URL HTTPS publique recevant les notifications POST"}]}),e.jsx(r,{language:"curl",code:`curl -X PUT https://sendavapay.com/api/sdk/v1/webhook \\
  -H "Authorization: Bearer ${a}" \\
  -H "Content-Type: application/json" \\
  -d '{ "webhookUrl": "https://monsite.com/webhooks/sendavapay" }'`}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(r,{language:"json",code:`{
  "success": true,
  "data": {
    "webhookUrl":    "https://monsite.com/webhooks/sendavapay",
    "webhookSecret": "whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}`}),e.jsxs(x,{type:"warning",title:"Conservez votre webhookSecret",children:["Le ",e.jsx("code",{children:"webhookSecret"})," est affiché une seule fois. Stockez-le comme variable d'environnement sur votre serveur."]})]}),e.jsxs("div",{id:"s-wh-events",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-3",children:"Événements"}),e.jsx("div",{className:"overflow-x-auto rounded-lg border text-sm",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Événement"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Déclenché quand"})]})}),e.jsx("tbody",{children:[["payment.completed","Paiement confirmé, fonds crédités sur le wallet"],["payment.failed","Paiement refusé, annulé ou erreur opérateur"],["payment.expired","Le payeur n'a pas confirmé avant expiration"],["withdrawal.completed","Retrait traité avec succès"],["withdrawal.failed","Retrait échoué"]].map(([s,o])=>e.jsxs("tr",{className:"border-t hover:bg-muted/20",children:[e.jsx("td",{className:"p-3 font-mono text-xs text-primary",children:s}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:o})]},s))})]})})]}),e.jsxs("div",{id:"s-wh-payload",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Payload & headers"}),e.jsx(r,{language:"http — headers envoyés par SendavaPay",code:`POST https://monsite.com/webhooks/sendavapay
Content-Type: application/json
X-SendavaPay-Signature: sha256=a3f4b5c6d7e8f9...sha256hex...
X-SendavaPay-Event:     payment.completed
X-SendavaPay-Timestamp: 1748426732`}),e.jsx(r,{language:"json — payload",code:`{
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
}`}),e.jsxs(x,{type:"tip",title:"Idempotence",children:["Vérifiez toujours si la ",e.jsx("code",{children:"reference"})," a déjà été traitée avant d'agir — SendavaPay peut renvoyer le même événement en cas d'échec de votre endpoint."]})]}),e.jsxs("div",{id:"s-wh-signature",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Vérification HMAC"}),e.jsx(x,{type:"danger",title:"Toujours vérifier la signature",children:"Ne traitez jamais un webhook sans vérifier sa signature. Un webhook non vérifié peut être forgé pour simuler un paiement réussi."}),e.jsx(r,{language:"bash — calcul de la signature",code:`HMAC_SHA256(key=WEBHOOK_SECRET, data=JSON.stringify(body))
# Envoyée dans: X-SendavaPay-Signature: sha256={hex}`}),e.jsx(P,{tabs:[{label:"node.js",code:`const crypto = require('crypto');

app.post('/webhooks/sendavapay', express.raw({ type: 'application/json' }), (req, res) => {
  const sig      = req.headers['x-sendavapay-signature'];
  const expected = 'sha256=' + crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(req.body)   // Buffer brut, PAS parsé
    .digest('hex');

  if (sig !== expected) return res.status(401).end();

  const payload = JSON.parse(req.body);
  if (payload.event === 'payment.completed') {
    markOrderAsPaid(payload.reference);
  }
  res.json({ received: true });
});`},{label:"php",code:`<?php
$body     = file_get_contents('php://input');
$sig      = $_SERVER['HTTP_X_SENDAVAPAY_SIGNATURE'] ?? '';
$expected = 'sha256=' . hash_hmac('sha256', $body, getenv('WEBHOOK_SECRET'));

if (!hash_equals($expected, $sig)) {
    http_response_code(401); die();
}
$payload = json_decode($body, true);
if ($payload['event'] === 'payment.completed') {
    markOrderAsPaid($payload['reference']);
}
echo json_encode(['received' => true]);`},{label:"python",code:`import hmac, hashlib, os
from flask import Flask, request

app = Flask(__name__)

@app.route('/webhooks/sendavapay', methods=['POST'])
def webhook():
    sig      = request.headers.get('X-SendavaPay-Signature', '')
    expected = 'sha256=' + hmac.new(
        os.environ['WEBHOOK_SECRET'].encode(),
        request.data, hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return '', 401
    payload = request.json
    if payload['event'] == 'payment.completed':
        mark_order_as_paid(payload['reference'])
    return {'received': True}`}]})]})]}),e.jsxs("section",{id:"s-operators",children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-6",children:"Pays & Opérateurs"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-4",children:"Chaque paiement est crédité sur le wallet correspondant au pays. Les fonds d'un pays ne peuvent être retirés que via le wallet de ce même pays."}),e.jsx("div",{className:"overflow-x-auto rounded-lg border text-sm",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Pays"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Code"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Devise"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Opérateurs"})]})}),e.jsx("tbody",{children:[["🇹🇬 Togo","TG","XOF","TMoney, Moov Money (Flooz)"],["🇧🇯 Bénin","BJ","XOF","MTN MoMo, Moov Money"],["🇸🇳 Sénégal","SN","XOF","Orange Money, Wave, Free Money, Wizall"],["🇨🇮 Côte d'Ivoire","CI","XOF","MTN MoMo, Orange Money, Wave, Moov Money"],["🇲🇱 Mali","ML","XOF","Orange Money, Wave, Moov Money"],["🇧🇫 Burkina Faso","BF","XOF","Orange Money, Moov Money"],["🇨🇲 Cameroun","CM","XAF","MTN MoMo, Orange Money"],["🇬🇳 Guinée","GN","GNF","Orange Money, MTN MoMo, Cellcom"],["🇨🇩 RD Congo","COD","CDF","Vodacom M-Pesa, Airtel Money, Orange Money"],["🇨🇬 Congo Brazzaville","COG","XAF","Airtel Money, MTN Money"]].map(([s,o,c,j])=>e.jsxs("tr",{className:"border-t hover:bg-muted/20",children:[e.jsx("td",{className:"p-3 text-xs font-medium",children:s}),e.jsx("td",{className:"p-3 font-mono text-xs",children:o}),e.jsx("td",{className:"p-3 font-mono text-xs",children:c}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:j})]},o))})]})}),e.jsxs(x,{type:"info",title:"OTP requis",children:["Les opérateurs ",e.jsx("strong",{children:"Orange Money"})," (BF, CI, GN, ML, SN) retournent ",e.jsx("code",{children:"requiresOtp: true"})," à l'initiation du paiement. Tous les autres opérateurs n'en ont pas besoin."]})]}),e.jsxs("section",{id:"s-statuses",children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-6",children:"Statuts de transaction"}),e.jsx("div",{className:"overflow-x-auto rounded-lg border text-sm",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Statut"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Description"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Type"})]})}),e.jsx("tbody",{children:[["pending","Transaction créée, en attente d'initiation","transitoire"],["processing","Invite envoyée, en attente de confirmation du payeur","transitoire"],["completed","Paiement confirmé, fonds crédités sur le wallet","terminal ✓"],["failed","Paiement refusé, annulé ou erreur opérateur","terminal"],["cancelled","Annulé avant traitement","terminal"]].map(([s,o,c])=>e.jsxs("tr",{className:"border-t hover:bg-muted/20",children:[e.jsx("td",{className:"p-3",children:e.jsx("span",{className:`px-2 py-0.5 rounded text-xs font-mono font-medium ${s==="completed"?"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400":s==="failed"||s==="cancelled"?"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400":"bg-muted text-muted-foreground"}`,children:s})}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:o}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:c})]},s))})]})})]}),e.jsxs("section",{id:"s-errors",children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-6",children:"Codes d'erreur"}),e.jsx(r,{language:"json — format d'erreur",code:`{
  "success": false,
  "error":   "INSUFFICIENT_BALANCE",
  "code":    "INSUFFICIENT_BALANCE"
}`}),e.jsx("div",{className:"overflow-x-auto rounded-lg border text-sm mt-4",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"HTTP"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Code"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Description"})]})}),e.jsx("tbody",{children:[["400","INVALID_REQUEST","Paramètres manquants ou malformés"],["400","DUPLICATE_REFERENCE","externalReference déjà utilisée pour un paiement actif"],["400","INSUFFICIENT_BALANCE","Solde insuffisant sur le wallet pour le retrait"],["400","UNSUPPORTED_COUNTRY","Code pays non pris en charge"],["400","WALLET_NOT_FOUND","Wallet du pays introuvable sur votre compte"],["400","INVALID_PHONE_FORMAT","Numéro de téléphone invalide — format E.164 requis (+22890…)"],["400","OPERATOR_COUNTRY_MISMATCH","Opérateur incompatible avec le pays demandé"],["400","PAYOUT_OPERATOR_OFFLINE","Opérateur en maintenance — retraits temporairement indisponibles"],["400","AMOUNT_TOO_LOW","Montant inférieur au minimum autorisé (100)"],["400","AMOUNT_TOO_HIGH","Montant supérieur au maximum autorisé (5 000 000)"],["409","DUPLICATE_WITHDRAWAL","Un retrait avec cet externalReference existe déjà"],["401","UNAUTHORIZED","Header Authorization manquant ou malformé"],["401","INVALID_API_KEY","Clé SDK invalide ou inexistante"],["403","API_KEY_INACTIVE","Clé SDK désactivée"],["403","SDK_NOT_ENABLED","Accès SDK non activé — contactez le support"],["403","ACCOUNT_NOT_VERIFIED","KYC non validé"],["404","NOT_FOUND","Transaction introuvable pour cette référence"],["410","TOKEN_EXPIRED","paymentToken expiré (30 min dépassées)"],["503","API_MAINTENANCE","API temporairement en maintenance"]].map(([s,o,c],j)=>e.jsxs("tr",{className:"border-t hover:bg-muted/20",children:[e.jsx("td",{className:"p-3 font-mono text-xs text-muted-foreground",children:s}),e.jsx("td",{className:"p-3 font-mono text-xs text-primary",children:o}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:c})]},j))})]})})]}),e.jsxs("section",{id:"s-rate",className:"pb-16",children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-6",children:"Rate Limiting"}),e.jsx("div",{className:"grid sm:grid-cols-3 gap-3 mb-6",children:[["100 req / min","Par clé SDK"],["5 secondes","Intervalle polling recommandé"],["Retry 429","Backoff exponentiel"]].map(([s,o])=>e.jsxs("div",{className:"p-4 rounded-lg border bg-muted/30 text-center",children:[e.jsx("p",{className:"text-lg font-bold text-primary",children:s}),e.jsx("p",{className:"text-xs text-muted-foreground",children:o})]},s))}),e.jsx(r,{language:"json — réponse HTTP 429",code:`HTTP/1.1 429 Too Many Requests
{
  "success": false,
  "error":   "Trop de requêtes. Réessayez dans 60 secondes.",
  "code":    "RATE_LIMITED"
}`}),e.jsx(x,{type:"tip",children:"Pour le polling de statut, utilisez un intervalle de 5 secondes minimum. Implémentez un backoff exponentiel sur les réponses 429."})]})]})]})}function vt(){const{user:n,isLoading:i}=je(),{toast:a}=ge(),[d,h]=u.useState(""),[v,s]=u.useState(""),[o,c]=u.useState(""),[j,D]=u.useState(""),[w,C]=u.useState(null),[te,se]=u.useState(null),[O,B]=u.useState(null),[ae,q]=u.useState(!1),{data:S,isLoading:ue}=J({queryKey:["/api/api-maintenance-status"],refetchInterval:1e4}),{data:G,isLoading:pe}=J({queryKey:["/api/user/api-permissions"],enabled:!!(n!=null&&n.isVerified)}),{data:$=[],isLoading:H}=J({queryKey:["/api/api-keys"],enabled:!!(n!=null&&n.isVerified)&&!(S!=null&&S.enabled)}),V=ne({mutationFn:async t=>(await oe("POST","/api/api-keys",t)).json(),onSuccess:()=>{ie.invalidateQueries({queryKey:["/api/api-keys"]}),h(""),s(""),c(""),D(""),C(null),q(!1),a({title:"Clé créée",description:"Votre nouvelle clé API a été créée avec succès"})},onError:t=>{a({title:"Erreur",description:t.message||"Impossible de créer la clé",variant:"destructive"})}}),W=ne({mutationFn:async t=>{await oe("DELETE",`/api/api-keys/${t}`)},onSuccess:()=>{ie.invalidateQueries({queryKey:["/api/api-keys"]}),a({title:"Clé supprimée"})},onError:()=>{a({title:"Erreur",description:"Impossible de supprimer la clé",variant:"destructive"})}}),re=t=>{navigator.clipboard.writeText(t),se(t),a({title:"Copié"}),setTimeout(()=>se(null),2e3)},he=()=>{if(!d.trim()){a({title:"Erreur",description:"Veuillez entrer un nom pour la clé",variant:"destructive"});return}if(!w){a({title:"Erreur",description:"Veuillez sélectionner un type d'API",variant:"destructive"});return}V.mutate({name:d.trim(),appName:v.trim()||void 0,webhookUrl:o.trim()||void 0,redirectUrl:j.trim()||void 0,apiType:w})};if(i||ue)return e.jsx(F,{children:e.jsx("div",{className:"flex items-center justify-center min-h-[60vh]",children:e.jsx(A,{className:"h-8 w-8 animate-spin text-primary"})})});if(S!=null&&S.enabled)return e.jsx(F,{children:e.jsx("div",{className:"flex items-center justify-center min-h-[60vh] p-4",children:e.jsxs(g,{className:"max-w-lg w-full text-center",children:[e.jsxs(b,{children:[e.jsx("div",{className:"mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center",children:e.jsx(Se,{className:"h-8 w-8 text-orange-600 dark:text-orange-400"})}),e.jsx(y,{className:"text-2xl",children:"API en maintenance"}),e.jsx(T,{className:"text-base",children:"L'API est temporairement indisponible"})]}),e.jsx(f,{children:e.jsx(I,{href:"/dashboard",children:e.jsxs(m,{variant:"outline",children:[e.jsx(Z,{className:"h-4 w-4 mr-2"}),"Retour au tableau de bord"]})})})]})})});if(!(n!=null&&n.isVerified))return e.jsx(F,{children:e.jsxs("div",{className:"space-y-6 p-6",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold",children:"API de Paiement"}),e.jsx("p",{className:"text-muted-foreground",children:"Intégrez SendavaPay dans vos applications"})]}),e.jsxs(g,{children:[e.jsxs(b,{children:[e.jsxs(y,{className:"flex items-center gap-2",children:[e.jsx(ce,{className:"h-5 w-5 text-yellow-500"}),"Vérification requise"]}),e.jsx(T,{children:"Votre compte doit être vérifié pour accéder à l'API"})]}),e.jsxs(f,{className:"space-y-4",children:[e.jsx("p",{className:"text-muted-foreground",children:"Pour des raisons de sécurité, seuls les comptes vérifiés peuvent accéder à l'API SendavaPay."}),e.jsx(I,{href:"/dashboard/kyc",children:e.jsxs(m,{children:[e.jsx(ce,{className:"h-4 w-4 mr-2"}),"Vérifier mon compte"]})})]})]})]})});const R=(G==null?void 0:G.apiSdkEnabled)??!1,k=$.filter(t=>t.apiType==="sdk"),p=$.filter(t=>t.apiType==="redirect"),Y=({keyItem:t})=>e.jsxs("div",{className:"flex flex-col gap-3 p-4 border rounded-lg","data-testid":`api-key-${t.id}`,children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-start justify-between gap-3",children:[e.jsxs("div",{className:"space-y-1 flex-1 min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[e.jsx("span",{className:"font-medium",children:t.name}),e.jsx(U,{variant:t.isActive?"default":"secondary",children:t.isActive?"Active":"Inactive"}),e.jsx(U,{variant:"outline",className:t.apiType==="sdk"?"border-purple-400 text-purple-700 dark:text-purple-300":"",children:t.apiType==="sdk"?"SDK":"Redirection"})]}),t.appName&&e.jsxs("p",{className:"text-sm text-muted-foreground",children:["Application : ",t.appName]}),e.jsx("code",{className:"text-sm text-muted-foreground font-mono block truncate",children:t.apiKey}),e.jsxs("p",{className:"text-xs text-muted-foreground",children:["Créée le ",new Date(t.createdAt).toLocaleDateString("fr-FR"),t.requestCount>0&&` • ${t.requestCount} requêtes`]})]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx(m,{variant:"outline",size:"sm",onClick:()=>re(t.apiKey),"data-testid":`button-copy-${t.id}`,children:te===t.apiKey?e.jsx(_,{className:"h-4 w-4"}):e.jsx(z,{className:"h-4 w-4"})}),e.jsx(m,{variant:"outline",size:"sm",onClick:()=>B(t),disabled:W.isPending,"data-testid":`button-delete-${t.id}`,children:e.jsx(xe,{className:"h-4 w-4 text-destructive"})})]})]}),(t.redirectUrl||t.webhookUrl)&&e.jsxs("div",{className:"space-y-2 border-t pt-3",children:[e.jsxs("div",{className:"flex flex-wrap gap-4 text-xs",children:[t.redirectUrl&&e.jsxs("div",{className:"flex items-center gap-1 text-muted-foreground",children:[e.jsx(me,{className:"h-3 w-3"}),e.jsx("span",{children:"Redirection:"}),e.jsx("span",{className:"font-mono truncate max-w-[200px]",children:t.redirectUrl})]}),t.webhookUrl&&e.jsxs("div",{className:"flex items-center gap-1 text-muted-foreground",children:[e.jsx(Pe,{className:"h-3 w-3"}),e.jsx("span",{children:"Webhook:"}),e.jsx("span",{className:"font-mono truncate max-w-[200px]",children:t.webhookUrl})]})]}),t.webhookSecret&&e.jsxs("div",{className:"flex items-center gap-2 text-xs",children:[e.jsx("span",{className:"text-muted-foreground",children:"Secret:"}),e.jsx("code",{className:"font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded truncate max-w-[200px]",children:t.webhookSecret}),e.jsx(m,{variant:"ghost",size:"sm",className:"h-6 w-6 p-0",onClick:()=>re(t.webhookSecret),"data-testid":`button-copy-secret-${t.id}`,children:te===t.webhookSecret?e.jsx(_,{className:"h-3 w-3"}):e.jsx(z,{className:"h-3 w-3"})})]})]})]});return e.jsxs(F,{children:[e.jsxs("div",{className:"space-y-6 p-6",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold",children:"API de Paiement"}),e.jsx("p",{className:"text-muted-foreground",children:"Gérez vos clés d'intégration SendavaPay"})]}),R&&!w&&e.jsxs(g,{children:[e.jsxs(b,{children:[e.jsxs(y,{className:"flex items-center gap-2",children:[e.jsx(Q,{className:"h-5 w-5"}),"Créer une clé API"]}),e.jsx(T,{children:"Choisissez le type d'intégration adapté à votre projet"})]}),e.jsx(f,{children:e.jsxs("div",{className:"grid sm:grid-cols-2 gap-4",children:[e.jsxs("button",{className:"p-5 border-2 rounded-xl text-left hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group",onClick:()=>C("sdk"),children:[e.jsxs("div",{className:"flex items-center gap-3 mb-3",children:[e.jsx("div",{className:"h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-200 transition-colors",children:e.jsx(E,{className:"h-5 w-5 text-purple-600 dark:text-purple-400"})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-semibold",children:"API SDK"}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"Intégration complète"})]})]}),e.jsx("ul",{className:"text-sm text-muted-foreground space-y-1",children:["Encaissement Mobile Money (10 pays)","Retrait automatique pay-out","Soldes wallets par pays","Webhooks signés HMAC"].map(t=>e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(_,{className:"h-3 w-3 text-green-500 flex-shrink-0"}),t]},t))})]}),e.jsxs("button",{className:"p-5 border-2 rounded-xl text-left hover:border-primary hover:bg-primary/5 transition-all group",onClick:()=>C("redirect"),children:[e.jsxs("div",{className:"flex items-center gap-3 mb-3",children:[e.jsx("div",{className:"h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 transition-colors",children:e.jsx(me,{className:"h-5 w-5 text-blue-600 dark:text-blue-400"})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-semibold",children:"API Redirection"}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"Simple et rapide"})]})]}),e.jsx("ul",{className:"text-sm text-muted-foreground space-y-1",children:["Liens de paiement générés","Redirection après paiement","Notifications webhook","Intégration sans SDK"].map(t=>e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(_,{className:"h-3 w-3 text-green-500 flex-shrink-0"}),t]},t))})]})]})})]}),(R&&w||!R&&ae)&&e.jsxs(g,{children:[e.jsxs(b,{children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx(y,{className:"flex items-center gap-2",children:w==="sdk"?e.jsxs(e.Fragment,{children:[e.jsx(E,{className:"h-5 w-5 text-purple-600"}),"Nouvelle clé API SDK"]}):e.jsxs(e.Fragment,{children:[e.jsx(L,{className:"h-5 w-5 text-primary"}),"Nouvelle clé API"]})}),R?e.jsxs(m,{variant:"ghost",size:"sm",onClick:()=>C(null),"data-testid":"button-back-type",children:[e.jsx(Z,{className:"h-4 w-4 mr-1"}),"Changer"]}):e.jsxs(m,{variant:"ghost",size:"sm",onClick:()=>q(!1),"data-testid":"button-cancel-create",children:[e.jsx(Z,{className:"h-4 w-4 mr-1"}),"Annuler"]})]}),e.jsx(T,{children:w==="sdk"?"Clé pour l'intégration SDK complète avec retrait automatique":"Clé pour la création de liens de paiement avec redirection"})]}),e.jsxs(f,{className:"space-y-4",children:[e.jsxs("div",{className:"grid sm:grid-cols-2 gap-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx(K,{htmlFor:"keyName",children:"Nom de la clé *"}),e.jsx(X,{id:"keyName",placeholder:"Ex: Mon site e-commerce",value:d,onChange:t=>h(t.target.value),"data-testid":"input-key-name"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(K,{htmlFor:"appName",children:"Nom de l'application"}),e.jsx(X,{id:"appName",placeholder:"Ex: MaBoutique.com",value:v,onChange:t=>s(t.target.value),"data-testid":"input-app-name"})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(K,{htmlFor:"redirectUrl",children:"URL de redirection (après paiement)"}),e.jsx(X,{id:"redirectUrl",type:"url",placeholder:"https://monsite.com/paiement/succes",value:j,onChange:t=>D(t.target.value),"data-testid":"input-redirect-url"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(K,{htmlFor:"webhookUrl",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(Ae,{className:"h-4 w-4"}),"URL de webhook"]})}),e.jsx(X,{id:"webhookUrl",type:"url",placeholder:"https://monsite.com/webhooks/sendavapay",value:o,onChange:t=>c(t.target.value),"data-testid":"input-webhook-url"}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"SendavaPay enverra une notification POST sécurisée à cette URL lors de chaque paiement"})]}),e.jsxs(m,{onClick:he,disabled:V.isPending,className:w==="sdk"?"bg-purple-600 hover:bg-purple-700":"","data-testid":"button-create-key",children:[V.isPending?e.jsx(A,{className:"h-4 w-4 mr-2 animate-spin"}):e.jsx(L,{className:"h-4 w-4 mr-2"}),"Générer la clé"]})]})]}),!pe&&e.jsx(e.Fragment,{children:R?e.jsxs(fe,{defaultValue:k.length>0?"sdk":"redirect",children:[e.jsxs(be,{children:[e.jsxs(de,{value:"sdk",className:"gap-2",children:[e.jsx(E,{className:"h-4 w-4"}),"Clés SDK",k.length>0&&e.jsx(U,{variant:"secondary",className:"ml-1 h-5 text-xs",children:k.length})]}),e.jsxs(de,{value:"redirect",className:"gap-2",children:[e.jsx(ee,{className:"h-4 w-4"}),"Clés Redirection",p.length>0&&e.jsx(U,{variant:"secondary",className:"ml-1 h-5 text-xs",children:p.length})]})]}),e.jsxs(le,{value:"sdk",className:"space-y-4 mt-4",children:[e.jsxs(g,{children:[e.jsxs(b,{children:[e.jsxs(y,{className:"flex items-center gap-2 text-base",children:[e.jsx(E,{className:"h-4 w-4 text-purple-600"}),"Clés API SDK"]}),e.jsxs(T,{children:[k.length," clé",k.length!==1?"s":""," SDK"]})]}),e.jsx(f,{children:H?e.jsx("div",{className:"flex justify-center py-8",children:e.jsx(A,{className:"h-6 w-6 animate-spin text-muted-foreground"})}):k.length===0?e.jsxs("div",{className:"text-center py-8 text-muted-foreground",children:[e.jsx(E,{className:"h-12 w-12 mx-auto mb-3 opacity-50"}),e.jsx("p",{children:"Aucune clé SDK créée"}),e.jsx("p",{className:"text-sm",children:'Cliquez sur "Créer une clé API" pour commencer'})]}):e.jsx("div",{className:"space-y-3",children:k.map(t=>e.jsx(Y,{keyItem:t},t.id))})})]}),e.jsxs("div",{children:[e.jsxs("h2",{className:"text-xl font-bold mb-4 flex items-center gap-2",children:[e.jsx(M,{className:"h-5 w-5 text-purple-600"}),"Référence API SDK"]}),e.jsx(_e,{apiKeys:$})]})]}),e.jsxs(le,{value:"redirect",className:"space-y-4 mt-4",children:[e.jsxs(g,{children:[e.jsxs(b,{children:[e.jsxs(y,{className:"flex items-center gap-2 text-base",children:[e.jsx(ee,{className:"h-4 w-4 text-blue-600"}),"Clés API Redirection"]}),e.jsxs(T,{children:[p.length," clé",p.length!==1?"s":""," Redirection"]})]}),e.jsx(f,{children:H?e.jsx("div",{className:"flex justify-center py-8",children:e.jsx(A,{className:"h-6 w-6 animate-spin text-muted-foreground"})}):p.length===0?e.jsxs("div",{className:"text-center py-8 text-muted-foreground",children:[e.jsx(ee,{className:"h-12 w-12 mx-auto mb-3 opacity-50"}),e.jsx("p",{children:"Aucune clé créée"})]}):e.jsx("div",{className:"space-y-3",children:p.map(t=>e.jsx(Y,{keyItem:t},t.id))})})]}),e.jsxs(g,{children:[e.jsx(b,{children:e.jsxs(y,{className:"flex items-center gap-2 text-base",children:[e.jsx(M,{className:"h-4 w-4"}),"Documentation"]})}),e.jsx(f,{children:e.jsx(I,{href:"/docs",children:e.jsxs(m,{variant:"outline","data-testid":"button-docs-redirect",children:[e.jsx(M,{className:"h-4 w-4 mr-2"}),"Voir la documentation"]})})})]})]})]}):e.jsxs("div",{className:"space-y-4",children:[e.jsxs(g,{children:[e.jsx(b,{children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsxs(y,{className:"flex items-center gap-2 text-base",children:[e.jsx(L,{className:"h-4 w-4 text-primary"}),"Mes clés API"]}),e.jsxs(T,{children:[p.length," clé",p.length!==1?"s":""]})]}),!ae&&e.jsxs(m,{size:"sm",onClick:()=>{q(!0),C("redirect")},"data-testid":"button-new-key",children:[e.jsx(Q,{className:"h-4 w-4 mr-2"}),"Nouvelle clé"]})]})}),e.jsx(f,{children:H?e.jsx("div",{className:"flex justify-center py-8",children:e.jsx(A,{className:"h-6 w-6 animate-spin text-muted-foreground"})}):p.length===0?e.jsxs("div",{className:"text-center py-8 text-muted-foreground",children:[e.jsx(L,{className:"h-12 w-12 mx-auto mb-3 opacity-50"}),e.jsx("p",{children:"Aucune clé créée"}),e.jsxs(m,{className:"mt-3",size:"sm",onClick:()=>{q(!0),C("redirect")},"data-testid":"button-create-first-key",children:[e.jsx(Q,{className:"h-4 w-4 mr-2"}),"Créer ma première clé"]})]}):e.jsx("div",{className:"space-y-3",children:p.map(t=>e.jsx(Y,{keyItem:t},t.id))})})]}),e.jsx(g,{children:e.jsx(f,{className:"pt-6",children:e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("div",{className:"h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0",children:e.jsx(M,{className:"h-5 w-5 text-primary"})}),e.jsxs("div",{className:"flex-1",children:[e.jsx("p",{className:"font-medium",children:"Documentation API"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Consultez la documentation pour intégrer SendavaPay dans votre application"})]}),e.jsx(I,{href:"/docs",children:e.jsxs(m,{variant:"outline","data-testid":"button-docs",children:[e.jsx(M,{className:"h-4 w-4 mr-2"}),"Voir la documentation"]})})]})})})]})})]}),e.jsx(ye,{open:!!O,onOpenChange:t=>!t&&B(null),children:e.jsxs(Ne,{children:[e.jsxs(ve,{children:[e.jsx(we,{children:"Supprimer cette clé API ?"}),e.jsxs(ke,{children:['Êtes-vous sûr de vouloir supprimer la clé "',O==null?void 0:O.name,'" ? Cette action est irréversible et toutes les intégrations utilisant cette clé cesseront de fonctionner.']})]}),e.jsxs(Te,{children:[e.jsx(Ce,{children:"Annuler"}),e.jsxs(Oe,{onClick:()=>{O&&(W.mutate(O.id),B(null))},className:"bg-destructive text-destructive-foreground hover:bg-destructive/90",children:[W.isPending?e.jsx(A,{className:"h-4 w-4 mr-2 animate-spin"}):e.jsx(xe,{className:"h-4 w-4 mr-2"}),"Supprimer"]})]})]})})]})}export{vt as default};
