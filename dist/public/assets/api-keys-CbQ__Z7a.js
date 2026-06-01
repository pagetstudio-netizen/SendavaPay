import{g as Ae,b as Pe,c as Ee,r as u,u as ae,d as re,j as e,e as C,L,X as Re,f as ne,q as oe}from"./index-zmsunOwQ.js";import{D as $}from"./dashboard-layout-C7cHA04K.js";import{B as m}from"./button-K2jfxsq4.js";import{C as f,b as y,c as N,d as S,a as b}from"./card-m57kYsvh.js";import{I as E}from"./input-9Fsgegx1.js";import{L as R}from"./label-wg0AMEqe.js";import{C as q,B}from"./badge-TGeVorO_.js";import{T as _e,b as qe,c as ye,a as Ne}from"./tabs-CjpUvMl1.js";import{A as Me,a as Fe,b as De,c as Ke,d as Ue,e as ze,f as Ie,g as Le,P as $e}from"./alert-dialog-DGXWWQx_.js";import{A as ie}from"./arrow-left-BWUCP5aY.js";import{S as ve}from"./shield-Bm1-xJeQ.js";import{P as de}from"./plus-BzjRZGwA.js";import{C as D}from"./code-xml-BAAjBg2e.js";import{E as le}from"./external-link-hut-ts-0.js";import{K as G}from"./key-Yy2vvwIX.js";import{W as we}from"./webhook-DitYiGmP.js";import{G as ce}from"./globe-Bw4ifQ6U.js";import{B as K,S as Be}from"./save-B_UHUrjN.js";import{T as ke}from"./trash-2-CwsurO3E.js";import{C as X}from"./copy-40VE9u9B.js";import{B as Ge}from"./bell-Dke94RgU.js";import"./avatar-DsrB1cXe.js";import"./dropdown-menu-BKfLnEYF.js";import"./index-CEPutFhs.js";import"./index-mmApO8N7.js";import"./index-CKKkSeEv.js";import"./menu-B0LJSVOB.js";import"./theme-toggle-DLfWakwb.js";import"./sun-Bi7VN5aI.js";import"./20251211_105226_1765450558306-pbBvZwWp.js";import"./circle-check-big-CW5ptqZM.js";import"./file-text-CrBIPEbE.js";import"./credit-card-C0vT5rqF.js";import"./send-D7915h_q.js";import"./link-DJTDvu_Y.js";import"./clock-Bl63Jtb8.js";import"./key-round-DEmYW5ex.js";import"./circle-help-wYxXbFD-.js";import"./users-DmAxu3A7.js";import"./shield-check-CEhkmblo.js";import"./message-square-y9rjd2cH.js";import"./trending-up-DI-gt6jK.js";/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xe=Ae("Wrench",[["path",{d:"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",key:"cbrjhi"}]]);function a({code:o,language:d="bash"}){const[r,c]=u.useState(!1),g=()=>{navigator.clipboard.writeText(o),c(!0),setTimeout(()=>c(!1),2e3)};return e.jsxs("div",{className:"rounded-lg overflow-hidden border border-slate-700 my-3",children:[e.jsxs("div",{className:"flex items-center justify-between bg-slate-800 px-3 py-1.5",children:[e.jsx("span",{className:"text-xs text-slate-400 font-mono",children:d}),e.jsx("button",{onClick:g,className:"text-slate-400 hover:text-white transition-colors p-1",children:r?e.jsx(q,{className:"h-3 w-3"}):e.jsx(X,{className:"h-3 w-3"})})]}),e.jsx("pre",{className:"bg-slate-900 text-slate-100 p-4 overflow-x-auto text-xs font-mono leading-relaxed",children:e.jsx("code",{children:o})})]})}function _({tabs:o}){const[d,r]=u.useState(0),[c,g]=u.useState(!1),v=()=>{navigator.clipboard.writeText(o[d].code),g(!0),setTimeout(()=>g(!1),2e3)};return e.jsxs("div",{className:"rounded-lg overflow-hidden border border-slate-700 my-3",children:[e.jsxs("div",{className:"flex items-center justify-between bg-slate-800 px-3 py-1.5",children:[e.jsx("div",{className:"flex gap-1",children:o.map((s,n)=>e.jsx("button",{onClick:()=>r(n),className:`px-3 py-1 rounded text-xs font-medium transition-colors ${d===n?"bg-slate-600 text-white":"text-slate-400 hover:text-slate-200"}`,children:s.label},n))}),e.jsx("button",{onClick:v,className:"text-slate-400 hover:text-white transition-colors p-1",children:c?e.jsx(q,{className:"h-3 w-3"}):e.jsx(X,{className:"h-3 w-3"})})]}),e.jsx("pre",{className:"bg-slate-900 text-slate-100 p-4 overflow-x-auto text-xs font-mono leading-relaxed",children:e.jsx("code",{children:o[d].code})})]})}function i({method:o,path:d,description:r}){const c={POST:"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",GET:"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",PUT:"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",DELETE:"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"};return e.jsxs("div",{className:"my-4 p-3 bg-muted/40 rounded-lg border",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("span",{className:`inline-flex px-2 py-0.5 rounded text-xs font-bold font-mono flex-shrink-0 ${c[o]||"bg-muted text-muted-foreground"}`,children:o}),e.jsx("code",{className:"text-sm text-foreground font-mono",children:d})]}),r&&e.jsx("p",{className:"mt-1.5 text-xs text-muted-foreground pl-1",children:r})]})}function x({type:o,title:d,children:r}){const c={info:"bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300",warning:"bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300",tip:"bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300",danger:"bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"};return e.jsxs("div",{className:`p-4 rounded-lg border ${c[o]} text-sm my-4`,children:[d&&e.jsx("p",{className:"font-semibold mb-1",children:d}),e.jsx("div",{children:r})]})}function j({params:o}){return e.jsx("div",{className:"overflow-x-auto my-4 rounded-lg border text-sm",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Paramètre"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Type"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Description"})]})}),e.jsx("tbody",{children:o.map((d,r)=>e.jsxs("tr",{className:"border-t hover:bg-muted/20",children:[e.jsxs("td",{className:"p-3 font-mono text-xs whitespace-nowrap",children:[d.name,d.required&&e.jsx("span",{className:"text-red-500 ml-0.5",children:"*"})]}),e.jsx("td",{className:"p-3 font-mono text-xs text-muted-foreground whitespace-nowrap",children:d.type}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:d.description})]},r))})]})})}function He({apiKeys:o}){var v;const r=((v=o.filter(s=>s.apiType==="sdk"&&s.isActive)[0])==null?void 0:v.apiKey)||"sdk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",c=s=>{var n;(n=document.getElementById(s))==null||n.scrollIntoView({behavior:"smooth",block:"start"})},g=[{id:"s-intro",label:"Introduction"},{id:"s-auth",label:"Authentification"},{label:"API Backend (server-side)",children:[{id:"s-create",label:"Créer un paiement"},{id:"s-status",label:"Statut d'un paiement"},{id:"s-verify",label:"Vérifier un paiement"},{id:"s-list",label:"Lister les transactions"},{id:"s-withdraw",label:"Retrait (pay-out)"},{id:"s-withdrawals-list",label:"Lister les retraits"},{id:"s-validate-withdraw",label:"Valider un retrait"},{id:"s-withdraw-status",label:"Statut d'un retrait"},{id:"s-payout-status",label:"Dispo. opérateurs payout"},{id:"s-operators-status",label:"Statuts opérateurs"},{id:"s-balance",label:"Soldes wallets"},{id:"s-health",label:"Health check"}]},{label:"API Client (CORS)",children:[{id:"s-token",label:"Détails par token"},{id:"s-countries",label:"Pays disponibles"},{id:"s-operators",label:"Opérateurs par pays"},{id:"s-initiate",label:"Initier le paiement"},{id:"s-otp",label:"Soumettre OTP"}]},{label:"Webhooks",children:[{id:"s-wh-config",label:"Configuration"},{id:"s-wh-retry",label:"Retry automatique"},{id:"s-wh-events",label:"Événements"},{id:"s-wh-payload",label:"Payload & headers"},{id:"s-wh-signature",label:"Vérification HMAC"},{id:"s-wh-test",label:"Tester le webhook"}]},{id:"s-operators",label:"Pays & Opérateurs"},{id:"s-statuses",label:"Statuts de transaction"},{id:"s-errors",label:"Codes d'erreur"},{id:"s-rate",label:"Rate Limiting"}];return e.jsxs("div",{className:"flex -mx-6 border-t min-h-screen",children:[e.jsxs("nav",{className:"hidden xl:flex flex-col w-52 flex-shrink-0 border-r bg-muted/20 sticky top-0 max-h-screen overflow-y-auto py-5 gap-0.5",children:[e.jsx("p",{className:"text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 mb-2",children:"SDK API v3"}),g.map((s,n)=>{var l;return s.id?e.jsx("button",{onClick:()=>c(s.id),className:"text-left px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors rounded-sm mx-1",children:s.label},n):e.jsxs("div",{className:"mt-3",children:[e.jsx("p",{className:"px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground",children:s.label}),(l=s.children)==null?void 0:l.map((p,U)=>e.jsx("button",{onClick:()=>c(p.id),className:"w-full text-left pl-6 pr-4 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors rounded-sm mx-1",children:p.label},U))]},n)})]}),e.jsxs("div",{className:"flex-1 px-6 xl:px-12 py-8 max-w-4xl space-y-14 overflow-x-hidden",children:[e.jsxs("section",{id:"s-intro",children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-6",children:"Introduction"}),e.jsx("p",{className:"text-sm text-muted-foreground leading-relaxed mb-6",children:"L'API SDK SendavaPay vous permet d'encaisser des paiements Mobile Money et d'effectuer des retraits automatisés depuis votre infrastructure. Vous construisez votre propre interface — aucune redirection, aucun composant SendavaPay."}),e.jsxs("div",{className:"grid sm:grid-cols-2 gap-3 mb-6",children:[e.jsxs("div",{className:"p-3 rounded-lg border bg-muted/30",children:[e.jsx("p",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2",children:"API Backend (server-side)"}),e.jsxs("p",{className:"text-xs text-muted-foreground",children:["Authentifiée avec votre clé ",e.jsx("code",{children:"sdk_"}),". Créer paiements, retraits, consulter soldes & transactions."]})]}),e.jsxs("div",{className:"p-3 rounded-lg border bg-muted/30",children:[e.jsx("p",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2",children:"API Client (CORS)"}),e.jsxs("p",{className:"text-xs text-muted-foreground",children:["Endpoints CORS ouverts, authentifiés par ",e.jsx("code",{children:"paymentToken"})," temporaire. Utilisables depuis n'importe quel frontend."]})]})]}),e.jsxs(x,{type:"danger",title:"Clé SDK — server-side uniquement",children:["Votre clé ",e.jsx("code",{children:"sdk_…"})," ne doit exister que sur votre serveur. Ne l'exposez jamais dans le code frontend. Utilisez les endpoints ",e.jsx("strong",{children:"API Client"})," (CORS) depuis votre frontend — ils n'ont pas besoin de la clé SDK."]})]}),e.jsxs("section",{id:"s-auth",children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-6",children:"Authentification"}),e.jsxs("p",{className:"text-sm text-muted-foreground mb-4",children:["Tous les endpoints ",e.jsx("strong",{children:"Backend"})," exigent votre clé SDK dans le header ",e.jsx("code",{className:"bg-muted px-1 rounded",children:"Authorization"}),". Les endpoints ",e.jsx("strong",{children:"Client (CORS)"})," s'authentifient via le ",e.jsx("code",{children:"paymentToken"})," retourné par ",e.jsx("code",{children:"POST /create-payment"}),"."]}),e.jsx(a,{language:"http",code:`Authorization: Bearer ${r}
Content-Type: application/json

Base URL: https://sendavapay.com/api/sdk/v1`}),e.jsx("div",{className:"overflow-x-auto rounded-lg border my-4 text-sm",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Type"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Préfixe"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Utilisation"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{className:"border-t",children:[e.jsx("td",{className:"p-3 text-xs",children:"Clé SDK"}),e.jsx("td",{className:"p-3 font-mono text-xs",children:"sdk_"}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:"Header Authorization — endpoints backend uniquement"})]}),e.jsxs("tr",{className:"border-t",children:[e.jsx("td",{className:"p-3 text-xs",children:"Payment Token"}),e.jsx("td",{className:"p-3 font-mono text-xs",children:"pay_tok_"}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:"Validité 30 min — endpoints client CORS"})]})]})]})}),e.jsx(x,{type:"warning",title:"Prérequis",children:"KYC validé et accès SDK activé par l'administrateur."})]}),e.jsxs("section",{children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-2",children:"API Backend"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-10",children:"Endpoints authentifiés par votre clé SDK. À appeler uniquement depuis votre serveur."}),e.jsxs("div",{id:"s-create",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Créer un paiement"}),e.jsxs("p",{className:"text-sm text-muted-foreground mb-3",children:["Crée une transaction et retourne un ",e.jsx("code",{className:"bg-muted px-1 rounded text-xs",children:"paymentToken"})," (valide 30 min) ainsi qu'une ",e.jsx("code",{className:"bg-muted px-1 rounded text-xs",children:"reference"})," à stocker. Transmettez le token à votre frontend pour authentifier les appels client."]}),e.jsx(i,{method:"POST",path:"/api/sdk/v1/create-payment"}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Corps de la requête"}),e.jsx(j,{params:[{name:"amount",type:"number",required:!0,description:"Montant en unité de la devise (ex. 5000 = 5 000 XOF)"},{name:"currency",type:"string",required:!0,description:"XOF · XAF · GNF · CDF"},{name:"description",type:"string",description:"Description de la transaction (max 255 car.)"},{name:"customerName",type:"string",description:"Nom du client"},{name:"customerEmail",type:"string",description:"Email du client"},{name:"customerPhone",type:"string",description:"Téléphone en E.164 (+22890000000)"},{name:"payerCountry",type:"string",description:"Code pays ISO (TG, SN, CM…) — détermine le wallet crédité"},{name:"webhookUrl",type:"string",description:"URL HTTPS de notification (écrase l'URL globale de la clé)"},{name:"externalReference",type:"string",description:"Votre référence commande pour idempotence (max 128 car.)"},{name:"metadata",type:"object",description:"Données personnalisées attachées à la transaction"}]}),e.jsx(_,{tabs:[{label:"curl",code:`curl -X POST https://sendavapay.com/api/sdk/v1/create-payment \\
  -H "Authorization: Bearer ${r}" \\
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
    'Authorization': 'Bearer ${r}',
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
  'Authorization' => 'Bearer ${r}',
  'Content-Type'  => 'application/json',
])->post('https://sendavapay.com/api/sdk/v1/create-payment', [
  'amount'            => 5000,
  'currency'          => 'XOF',
  'description'       => 'Commande #1234',
  'payerCountry'      => 'TG',
  'webhookUrl'        => 'https://monsite.com/webhooks/sendavapay',
  'externalReference' => 'order_1234',
]);
$data = $res->json('data');`}]}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"201 Created"})]}),e.jsx(a,{language:"json",code:`{
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
}`}),e.jsxs(x,{type:"tip",title:"Idempotence",children:["Si vous relancez la même ",e.jsx("code",{children:"externalReference"})," alors qu'un paiement est déjà ",e.jsx("code",{children:"pending"})," ou ",e.jsx("code",{children:"completed"}),", vous recevrez une erreur ",e.jsx("code",{children:"409 DUPLICATE_REFERENCE"}),". Aucun doublon n'est créé."]})]}),e.jsxs("div",{id:"s-status",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Statut d'un paiement"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"Retourne le statut actuel d'une transaction."}),e.jsx(i,{method:"GET",path:"/api/sdk/v1/payment-status/:reference"}),e.jsx(a,{language:"curl",code:`curl https://sendavapay.com/api/sdk/v1/payment-status/sdk_lcy0u4wx_a1b2c3d4e5f6g7h8 \\
  -H "Authorization: Bearer ${r}"`}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(a,{language:"json",code:`{
  "success": true,
  "data": {
    "reference":   "sdk_lcy0u4wx_a1b2c3d4e5f6g7h8",
    "status":      "completed",
    "amount":      "5000.00",
    "currency":    "XOF",
    "completedAt": "2026-05-28T10:05:32.000Z"
  }
}`})]}),e.jsxs("div",{id:"s-verify",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Vérifier un paiement"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"Retourne les détails complets d'une transaction. À utiliser côté serveur pour valider avant de livrer une commande."}),e.jsx(i,{method:"POST",path:"/api/sdk/v1/verify-payment"}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Corps de la requête"}),e.jsx(j,{params:[{name:"reference",type:"string",required:!0,description:"Référence de la transaction retournée par create-payment"}]}),e.jsx(a,{language:"curl",code:`curl -X POST https://sendavapay.com/api/sdk/v1/verify-payment \\
  -H "Authorization: Bearer ${r}" \\
  -H "Content-Type: application/json" \\
  -d '{ "reference": "sdk_lcy0u4wx_a1b2c3d4e5f6g7h8" }'`}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(a,{language:"json",code:`{
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
}`})]}),e.jsxs("div",{id:"s-list",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Lister les transactions"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"Retourne toutes les transactions (pay-in + pay-out) de votre compte."}),e.jsx(i,{method:"GET",path:"/api/sdk/v1/transactions"}),e.jsx(a,{language:"curl",code:`curl https://sendavapay.com/api/sdk/v1/transactions \\
  -H "Authorization: Bearer ${r}"`}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(a,{language:"json",code:`{
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
}`})]}),e.jsxs("div",{id:"s-withdraw",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Retrait — Pay-out"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"Envoie de l'argent depuis votre wallet vers un numéro Mobile Money. Les fonds sont débités immédiatement du wallet pays correspondant."}),e.jsx(i,{method:"POST",path:"/api/sdk/v1/withdraw"}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Corps de la requête"}),e.jsx(j,{params:[{name:"amount",type:"number",required:!0,description:"Montant à envoyer"},{name:"phoneNumber",type:"string",required:!0,description:"Numéro Mobile Money du bénéficiaire en E.164"},{name:"operator",type:"string",required:!0,description:"Slug opérateur : tmoney, moov, mtn, orange, wave, vodacom, airtel…"},{name:"country",type:"string",required:!0,description:"Code pays ISO (TG, CM, COD, COG…)"},{name:"currency",type:"string",required:!0,description:"XOF · XAF · GNF · CDF"},{name:"description",type:"string",description:"Motif du transfert"},{name:"externalReference",type:"string",description:"Votre référence paiement fournisseur"}]}),e.jsx(_,{tabs:[{label:"curl",code:`curl -X POST https://sendavapay.com/api/sdk/v1/withdraw \\
  -H "Authorization: Bearer ${r}" \\
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
    'Authorization': 'Bearer ${r}',
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
  'Authorization' => 'Bearer ${r}',
  'Content-Type'  => 'application/json',
])->post('https://sendavapay.com/api/sdk/v1/withdraw', [
  'amount'            => 10000,
  'phoneNumber'       => '+22890123456',
  'operator'          => 'tmoney',
  'country'           => 'TG',
  'currency'          => 'XOF',
  'description'       => 'Paiement fournisseur',
  'externalReference' => 'payout_456',
]);`}]}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"201 Created"})]}),e.jsx(a,{language:"json",code:`{
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
    "status":            "queued",
    "statusLabel":       "En file d'attente de traitement",
    "walletBalance":     85000,
    "trackingUrl":       "GET /api/sdk/v1/withdrawal-status/sdk_lcy1a3bx_z9y8w7v6u5t4s3r2",
    "createdAt":         "2026-05-28T11:00:00.000Z"
  }
}`}),e.jsxs(x,{type:"info",title:"Traitement asynchrone",children:["Les retraits sont traités de façon ",e.jsx("strong",{children:"asynchrone"})," via une file d'attente (queue + worker). Le statut initial est toujours ",e.jsx("code",{children:"queued"}),". Suivez l'évolution via ",e.jsx("code",{children:"GET /withdrawal-status/:ref"}),"ou recevez le résultat final par webhook ",e.jsx("code",{children:"withdrawal.completed"})," / ",e.jsx("code",{children:"withdrawal.failed"}),"."]})]}),e.jsxs("div",{id:"s-withdrawals-list",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Lister les retraits"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"Retourne la liste paginée de vos retraits. Filtrable par pays, statut et date."}),e.jsx(i,{method:"GET",path:"/api/sdk/v1/withdrawals"}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Paramètres de requête"}),e.jsx(j,{params:[{name:"country",type:"string",description:"Filtrer par pays ISO (ex. TG, CM)"},{name:"status",type:"string",description:"Filtrer par statut : queued · processing · completed · failed · cancelled"},{name:"from",type:"string",description:"Date de début ISO 8601 (ex. 2026-05-01)"},{name:"to",type:"string",description:"Date de fin ISO 8601 (ex. 2026-05-31)"},{name:"limit",type:"number",description:"Nombre de résultats par page (défaut 20, max 100)"},{name:"offset",type:"number",description:"Décalage pour la pagination (défaut 0)"}]}),e.jsx(a,{language:"javascript",code:"const res = await fetch(\n  'https://sendavapay.com/api/sdk/v1/withdrawals?country=TG&status=completed&limit=20',\n  { headers: { 'Authorization': 'Bearer ${KEY}' } }\n);\nconst { data } = await res.json();\nconsole.log(`${data.total} retraits, page ${data.offset / data.limit + 1}`);"}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(a,{language:"json",code:`{
  "success": true,
  "data": {
    "total":       47,
    "limit":       20,
    "offset":      0,
    "withdrawals": [
      {
        "reference":   "sdk_lcy1a3bx_z9y8w7v6u5t4s3r2",
        "amount":      "10000.00",
        "fee":         "100.00",
        "currency":    "XOF",
        "phoneNumber": "+22890123456",
        "operator":    "tmoney",
        "country":     "TG",
        "status":      "completed",
        "createdAt":   "2026-05-28T11:00:00.000Z",
        "completedAt": "2026-05-28T11:04:17.000Z"
      }
    ]
  }
}`})]}),e.jsxs("div",{id:"s-validate-withdraw",className:"scroll-mt-4 mb-14",children:[e.jsxs("h3",{className:"text-lg font-semibold mb-1",children:["Valider un retrait ",e.jsx("span",{className:"ml-2 text-xs font-normal text-muted-foreground",children:"(dry-run)"})]}),e.jsxs("p",{className:"text-sm text-muted-foreground mb-3",children:["Vérifie qu'un retrait peut être effectué ",e.jsx("strong",{children:"sans l'exécuter"}),". Idéal pour afficher les frais et valider le formulaire côté client avant confirmation."]}),e.jsx(i,{method:"POST",path:"/api/sdk/v1/validate-withdrawal"}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Corps de la requête"}),e.jsx(j,{params:[{name:"amount",type:"number",required:!0,description:"Montant à vérifier"},{name:"phoneNumber",type:"string",required:!0,description:"Numéro E.164 du bénéficiaire"},{name:"operator",type:"string",required:!0,description:"Slug opérateur (tmoney, moov, mtn…)"},{name:"country",type:"string",required:!0,description:"Code pays ISO (TG, CM, COD…)"},{name:"currency",type:"string",required:!1,description:"Devise (défaut XOF)"}]}),e.jsx(_,{tabs:[{label:"curl",code:`curl -X POST https://sendavapay.com/api/sdk/v1/validate-withdrawal \\
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
}`}]}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(a,{language:"json",code:`{
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
}`}),e.jsxs(x,{type:"warning",title:"Erreur côté validation",children:["Si ",e.jsx("code",{children:"success: false"}),", le champ ",e.jsx("code",{children:"code"})," indique la raison exacte :",e.jsx("code",{children:"INSUFFICIENT_BALANCE"}),", ",e.jsx("code",{children:"PAYOUT_OPERATOR_OFFLINE"}),", ",e.jsx("code",{children:"INVALID_PHONE_FORMAT"}),", ",e.jsx("code",{children:"OPERATOR_COUNTRY_MISMATCH"}),"…"]})]}),e.jsxs("div",{id:"s-withdraw-status",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Statut d'un retrait"}),e.jsxs("p",{className:"text-sm text-muted-foreground mb-3",children:["Suivez l'état d'un retrait à tout moment à partir de sa référence. Utilisez-le après un ",e.jsx("code",{children:"POST /withdraw"})," pour savoir si le virement a été effectué."]}),e.jsx(i,{method:"GET",path:"/api/sdk/v1/withdrawal-status/:reference"}),e.jsx(_,{tabs:[{label:"curl",code:'curl https://sendavapay.com/api/sdk/v1/withdrawal-status/sdk_lcy1a3bx_z9y8w7v6u5t4s3r2 \\\n  -H "Authorization: Bearer ${KEY}"'},{label:"node.js",code:`const ref = 'sdk_lcy1a3bx_z9y8w7v6u5t4s3r2';
const res = await fetch(\`https://sendavapay.com/api/sdk/v1/withdrawal-status/\${ref}\`, {
  headers: { 'Authorization': 'Bearer \${KEY}' },
});
const { data } = await res.json();
console.log(data.status, data.statusLabel);`}]}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(a,{language:"json",code:`{
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
}`}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Statuts possibles"}),e.jsx("div",{className:"overflow-x-auto rounded-lg border text-sm",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Statut"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Description"})]})}),e.jsx("tbody",{children:[["queued","En file d'attente — le worker va le traiter"],["processing","En cours de traitement chez l'opérateur"],["provider_pending","En attente de confirmation du fournisseur"],["completed","Retrait effectué avec succès"],["failed","Retrait échoué — fonds non débités"],["reversed","Fonds retournés sur le wallet après échec"],["cancelled","Retrait annulé avant traitement"]].map(([s,n],l)=>e.jsxs("tr",{className:"border-t hover:bg-muted/20",children:[e.jsx("td",{className:"p-3 font-mono text-xs",children:s}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:n})]},l))})]})})]}),e.jsxs("div",{id:"s-payout-status",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Disponibilité opérateurs pay-out"}),e.jsxs("p",{className:"text-sm text-muted-foreground mb-3",children:["Retourne le statut temps réel de chaque opérateur pour les retraits. Filtrez par pays avec ",e.jsx("code",{className:"bg-muted px-1 rounded text-xs",children:"?country=TG"}),"."]}),e.jsx(i,{method:"GET",path:"/api/sdk/v1/payout-status?country=TG"}),e.jsx(_,{tabs:[{label:"curl",code:`# Tous les pays
curl https://sendavapay.com/api/sdk/v1/payout-status \\
  -H "Authorization: Bearer \${KEY}"

# Filtrer par pays
curl "https://sendavapay.com/api/sdk/v1/payout-status?country=TG" \\
  -H "Authorization: Bearer \${KEY}"`},{label:"node.js",code:`const res = await fetch('https://sendavapay.com/api/sdk/v1/payout-status?country=TG', {
  headers: { 'Authorization': 'Bearer \${KEY}' },
});
const { data } = await res.json();
const online = data.operators.filter(op => op.payoutStatus === 'online');
console.log(\`\${data.summary.online} opérateurs disponibles au Togo\`);`}]}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(a,{language:"json",code:`{
  "success": true,
  "data": {
    "summary": {
      "online":  12,
      "offline": 2,
      "total":   14
    },
    "operators": [
      {
        "id":                    "1",
        "operator":              "tmoney",
        "country":               "TG",
        "currency":              "XOF",
        "gateway":               "soleaspay",
        "payoutStatus":          "online",
        "depositStatus":         "online",
        "maintenanceReason":     null,
        "estimatedRecoveryTime": null
      },
      {
        "id":                    "11",
        "operator":              "airtel",
        "country":               "COG",
        "currency":              "XAF",
        "gateway":               "soleaspay",
        "payoutStatus":          "offline",
        "depositStatus":         "offline",
        "maintenanceReason":     "Maintenance opérateur programmée",
        "estimatedRecoveryTime": "2026-05-29T08:00:00.000Z"
      }
    ]
  }
}`}),e.jsxs(x,{type:"info",title:"Bonne pratique",children:["Filtrez côté client ",e.jsx("code",{children:'payoutStatus === "online"'})," avant d'afficher les opérateurs dans votre formulaire de retrait. Affichez ",e.jsx("code",{children:"maintenanceReason"})," et ",e.jsx("code",{children:"estimatedRecoveryTime"})," pour informer vos utilisateurs en cas d'indisponibilité."]})]}),e.jsxs("div",{id:"s-operators-status",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Statuts opérateurs (dépôt + retrait)"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"Vue complète de tous les opérateurs — dépôt ET retrait — avec leur statut en temps réel. Permet de masquer les opérateurs offline dans votre UI."}),e.jsx(i,{method:"GET",path:"/api/sdk/v1/operators-status"}),e.jsx(a,{language:"javascript",code:`const res = await fetch('https://sendavapay.com/api/sdk/v1/operators-status');
const { data } = await res.json();
// Masquer les opérateurs où deposit et payout sont tous les deux offline
const available = data.filter(op => op.depositStatus === 'online' || op.payoutStatus === 'online');`}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(a,{language:"json",code:`{
  "success": true,
  "data": [
    {
      "id":            "5",
      "name":          "TMoney",
      "country":       "TG",
      "currency":      "XOF",
      "depositStatus": "online",
      "payoutStatus":  "online",
      "requiresOtp":   false
    },
    {
      "id":            "12",
      "name":          "Orange Money",
      "country":       "SN",
      "currency":      "XOF",
      "depositStatus": "online",
      "payoutStatus":  "offline",
      "requiresOtp":   true
    }
  ]
}`}),e.jsx(x,{type:"tip",title:"Endpoint public (CORS)",children:"Cet endpoint n'exige pas d'authentification. Appelez-le directement depuis votre frontend pour afficher uniquement les opérateurs disponibles."})]}),e.jsxs("div",{id:"s-balance",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Soldes wallets"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"Retourne le solde de vos wallets. Un wallet par pays."}),e.jsx(i,{method:"GET",path:"/api/sdk/v1/balance"}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Paramètres de requête (optionnels)"}),e.jsx(j,{params:[{name:"country",type:"string",description:"Code pays ISO pour filtrer sur un seul wallet (ex. ?country=TG)"}]}),e.jsx(a,{language:"curl",code:`# Tous les wallets
curl https://sendavapay.com/api/sdk/v1/balance \\
  -H "Authorization: Bearer ${r}"

# Un seul pays
curl "https://sendavapay.com/api/sdk/v1/balance?country=TG" \\
  -H "Authorization: Bearer ${r}"`}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(a,{language:"json",code:`{
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
}`})]}),e.jsxs("div",{id:"s-health",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Health check"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"Vérifie l'état de l'API, de la base de données et des opérateurs en temps réel. Endpoint public — aucune authentification requise."}),e.jsx(i,{method:"GET",path:"/api/sdk/v1/health"}),e.jsx(a,{language:"javascript",code:`const res = await fetch('https://sendavapay.com/api/sdk/v1/health');
const data = await res.json();
if (data.status !== 'ok') console.warn('API dégradée:', data.database);`}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(a,{language:"json",code:`{
  "status":   "ok",
  "database": "connected",
  "operators": {
    "online":  12,
    "offline": 2,
    "total":   14
  },
  "payout": {
    "online":  10,
    "offline": 4
  },
  "maintenance": false,
  "timestamp": "2026-05-29T08:00:00.000Z"
}`})]})]}),e.jsxs("section",{children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-2",children:"API Client — CORS"}),e.jsxs("p",{className:"text-sm text-muted-foreground mb-4",children:["Ces endpoints sont accessibles depuis n'importe quel frontend (CORS ouvert). Ils s'authentifient par le ",e.jsx("code",{className:"bg-muted px-1 rounded text-xs",children:"paymentToken"})," retourné par ",e.jsx("code",{className:"bg-muted px-1 rounded text-xs",children:"create-payment"})," — pas besoin de votre clé SDK."]}),e.jsxs(x,{type:"warning",children:["Le ",e.jsx("code",{children:"paymentToken"})," a une validité de ",e.jsx("strong",{children:"30 minutes"}),". Après expiration, les appels retournent ",e.jsx("code",{children:"410 Gone"}),"."]}),e.jsxs("div",{id:"s-token",className:"scroll-mt-4 mt-10 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Détails de la transaction par token"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"Retourne les informations de la transaction associée au token : montant, devise, description, statut, nom du marchand."}),e.jsx(i,{method:"GET",path:"/api/sdk/v1/payment-token/:paymentToken"}),e.jsx(a,{language:"javascript",code:`const res = await fetch(
  'https://sendavapay.com/api/sdk/v1/payment-token/pay_tok_xxxx'
);
const { data } = await res.json();
// data.reference, data.amount, data.currency, data.description, data.ownerName, data.status`}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(a,{language:"json",code:`{
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
}`})]}),e.jsxs("div",{id:"s-countries",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Pays disponibles"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"Retourne la liste des pays activés avec leur devise."}),e.jsx(i,{method:"GET",path:"/api/sdk/v1/countries"}),e.jsx(a,{language:"javascript",code:`const res = await fetch('https://sendavapay.com/api/sdk/v1/countries');
const { data } = await res.json();
// [{ id: 'TG', name: 'Togo', currency: 'XOF' }, …]`}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(a,{language:"json",code:`{
  "success": true,
  "data": [
    { "id": "TG",  "name": "Togo",              "currency": "XOF" },
    { "id": "SN",  "name": "Sénégal",           "currency": "XOF" },
    { "id": "CM",  "name": "Cameroun",          "currency": "XAF" },
    { "id": "COD", "name": "RD Congo",          "currency": "CDF" },
    { "id": "COG", "name": "Congo Brazzaville", "currency": "XAF" }
  ]
}`})]}),e.jsxs("div",{id:"s-operators",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Opérateurs par pays"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"Retourne les opérateurs Mobile Money disponibles pour un pays donné."}),e.jsx(i,{method:"GET",path:"/api/sdk/v1/operators/:countryCode"}),e.jsx(a,{language:"javascript",code:`const res = await fetch('https://sendavapay.com/api/sdk/v1/operators/TG');
const { data } = await res.json();
// [{ id: '5', name: 'TMoney', requiresOtp: false, status: 'online' }, …]`}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(a,{language:"json",code:`{
  "success": true,
  "data": [
    { "id": "5",  "name": "TMoney",     "requiresOtp": false, "status": "online" },
    { "id": "6",  "name": "Flooz",      "requiresOtp": false, "status": "online" },
    { "id": "12", "name": "Orange Money","requiresOtp": true,  "status": "online" }
  ]
}`})]}),e.jsxs("div",{id:"s-initiate",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Initier le paiement"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"Déclenche la demande de paiement Mobile Money. L'opérateur envoie une invite sur le téléphone du payeur (ou un SMS OTP selon l'opérateur)."}),e.jsx(i,{method:"POST",path:"/api/sdk/v1/initiate-payment"}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Corps de la requête"}),e.jsx(j,{params:[{name:"paymentToken",type:"string",required:!0,description:"Token retourné par create-payment"},{name:"payerName",type:"string",required:!0,description:"Nom du payeur"},{name:"payerPhone",type:"string",required:!0,description:"Numéro Mobile Money en E.164 (+22890000000)"},{name:"payerEmail",type:"string",description:"Email du payeur"},{name:"payerCountry",type:"string",required:!0,description:"Code pays ISO (TG, SN, CM…)"},{name:"operatorId",type:"string",required:!0,description:"ID de l'opérateur retourné par /operators/:countryCode"}]}),e.jsx(a,{language:"javascript",code:`const res = await fetch(
  'https://sendavapay.com/api/sdk/v1/initiate-payment',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentToken: 'pay_tok_xxxx',
      payerName:    'Jean Dupont',
      payerPhone:   '+22890000000',
      payerCountry: 'TG',
      operatorId:   '5',
    }),
  }
);
const result = await res.json();`}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Réponse sans OTP"}),e.jsx(a,{language:"json",code:`{
  "success":     true,
  "requiresOtp": false,
  "reference":   "sdk_lcy0u4wx_a1b2c3d4e5f6g7h8",
  "message":     "Invite de paiement envoyée sur le téléphone du client"
}`}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Réponse avec OTP requis (Orange Money)"}),e.jsx(a,{language:"json",code:`{
  "success":     true,
  "requiresOtp": true,
  "otpToken":    "otp_xxxxxxxxxxxxxxxxxxxx",
  "reference":   "sdk_lcy0u4wx_a1b2c3d4e5f6g7h8",
  "message":     "Code OTP envoyé par SMS au payeur"
}`}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Réponse avec redirection (Wave, etc.)"}),e.jsx(a,{language:"json",code:`{
  "success":         true,
  "requiresRedirect": true,
  "redirectUrl":     "https://wave.com/checkout/...",
  "reference":       "sdk_lcy0u4wx_a1b2c3d4e5f6g7h8"
}`})]}),e.jsxs("div",{id:"s-otp",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Soumettre un OTP"}),e.jsxs("p",{className:"text-sm text-muted-foreground mb-3",children:["Applicable uniquement pour les opérateurs Orange Money (BF, CI, GN, ML, SN). À appeler après réception de ",e.jsx("code",{className:"bg-muted px-1 rounded text-xs",children:"requiresOtp: true"}),"."]}),e.jsx(i,{method:"POST",path:"/api/sdk/v1/submit-otp"}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Corps de la requête"}),e.jsx(j,{params:[{name:"otpToken",type:"string",required:!0,description:"otpToken retourné par initiate-payment"},{name:"otp",type:"string",required:!0,description:"Code OTP saisi par le payeur"}]}),e.jsx(a,{language:"javascript",code:`const res = await fetch(
  'https://sendavapay.com/api/sdk/v1/submit-otp',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      otpToken: 'otp_xxxxxxxxxxxxxxxxxxxx',
      otp:      '123456',
    }),
  }
);
const result = await res.json();`}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(a,{language:"json",code:`{
  "success":   true,
  "reference": "sdk_lcy0u4wx_a1b2c3d4e5f6g7h8",
  "message":   "OTP accepté. Le paiement est en cours."
}`})]})]}),e.jsxs("section",{children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-2",children:"Webhooks"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-10",children:"SendavaPay envoie un POST signé sur votre URL dès qu'un événement survient."}),e.jsxs("div",{id:"s-wh-config",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Configuration"}),e.jsxs("p",{className:"text-sm text-muted-foreground mb-3",children:["Configurez une URL globale pour votre clé SDK, ou passez ",e.jsx("code",{className:"bg-muted px-1 rounded text-xs",children:"webhookUrl"}),"à chaque appel ",e.jsx("code",{className:"bg-muted px-1 rounded text-xs",children:"create-payment"}),"."]}),e.jsx(i,{method:"PUT",path:"/api/sdk/v1/webhook"}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Corps de la requête"}),e.jsx(j,{params:[{name:"webhookUrl",type:"string",required:!0,description:"URL HTTPS publique recevant les notifications POST"}]}),e.jsx(a,{language:"curl",code:`curl -X PUT https://sendavapay.com/api/sdk/v1/webhook \\
  -H "Authorization: Bearer ${r}" \\
  -H "Content-Type: application/json" \\
  -d '{ "webhookUrl": "https://monsite.com/webhooks/sendavapay" }'`}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(a,{language:"json",code:`{
  "success": true,
  "data": {
    "webhookUrl":    "https://monsite.com/webhooks/sendavapay",
    "webhookSecret": "whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}`}),e.jsxs(x,{type:"warning",title:"Conservez votre webhookSecret",children:["Le ",e.jsx("code",{children:"webhookSecret"})," est affiché une seule fois. Stockez-le comme variable d'environnement sur votre serveur."]})]}),e.jsxs("div",{id:"s-wh-events",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-3",children:"Événements"}),e.jsx("div",{className:"overflow-x-auto rounded-lg border text-sm",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Événement"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Déclenché quand"})]})}),e.jsx("tbody",{children:[["payment.completed","Paiement confirmé, fonds crédités sur le wallet"],["payment.failed","Paiement refusé, annulé ou erreur opérateur"],["payment.expired","Le payeur n'a pas confirmé avant expiration"],["withdrawal.completed","Retrait traité avec succès"],["withdrawal.failed","Retrait échoué"]].map(([s,n])=>e.jsxs("tr",{className:"border-t hover:bg-muted/20",children:[e.jsx("td",{className:"p-3 font-mono text-xs text-primary",children:s}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:n})]},s))})]})})]}),e.jsxs("div",{id:"s-wh-payload",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Payload & headers"}),e.jsx(a,{language:"http — headers envoyés par SendavaPay",code:`POST https://monsite.com/webhooks/sendavapay
Content-Type: application/json
X-SendavaPay-Signature: sha256=a3f4b5c6d7e8f9...sha256hex...
X-SendavaPay-Event:     payment.completed
X-SendavaPay-Timestamp: 1748426732`}),e.jsx(a,{language:"json — payload",code:`{
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
}`}),e.jsxs(x,{type:"tip",title:"Idempotence",children:["Vérifiez toujours si la ",e.jsx("code",{children:"reference"})," a déjà été traitée avant d'agir — SendavaPay peut renvoyer le même événement en cas d'échec de votre endpoint."]})]}),e.jsxs("div",{id:"s-wh-signature",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Vérification HMAC"}),e.jsx(x,{type:"danger",title:"Toujours vérifier la signature",children:"Ne traitez jamais un webhook sans vérifier sa signature. Un webhook non vérifié peut être forgé pour simuler un paiement réussi."}),e.jsx(a,{language:"bash — calcul de la signature",code:`HMAC_SHA256(key=WEBHOOK_SECRET, data=JSON.stringify(body))
# Envoyée dans: X-SendavaPay-Signature: sha256={hex}`}),e.jsx(_,{tabs:[{label:"node.js",code:`const crypto = require('crypto');

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
    return {'received': True}`}]})]}),e.jsxs("div",{id:"s-wh-retry",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Retry automatique"}),e.jsxs("p",{className:"text-sm text-muted-foreground mb-3",children:["SendavaPay réessaie automatiquement les webhooks en cas d'échec (timeout, HTTP 4xx/5xx). Votre endpoint doit répondre ",e.jsx("strong",{children:"sous 10 secondes"}),"."]}),e.jsx("div",{className:"overflow-x-auto rounded-lg border text-sm",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Tentative"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Délai"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Note"})]})}),e.jsx("tbody",{children:[["1ère","Immédiat","Envoi initial"],["2ème","1 minute","Premier retry"],["3ème","5 minutes","Deuxième retry"],["4ème","30 minutes","Troisième retry"],["5ème","2 heures","Dernier retry — après, le webhook est marqué failed"]].map(([s,n,l],p)=>e.jsxs("tr",{className:"border-t hover:bg-muted/20",children:[e.jsx("td",{className:"p-3 font-mono text-xs",children:s}),e.jsx("td",{className:"p-3 text-xs",children:n}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:l})]},p))})]})}),e.jsxs(x,{type:"tip",title:"Idempotence",children:["Chaque webhook contient un champ ",e.jsx("code",{children:"webhookId"})," unique. Stockez les IDs déjà traités pour ignorer les doublons en cas de retry."]})]}),e.jsxs("div",{id:"s-wh-test",className:"scroll-mt-4 mb-14",children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",children:"Tester votre endpoint webhook"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-3",children:"Envoie un webhook de test à votre URL configurée. Permet de vérifier que votre endpoint reçoit, vérifie la signature et répond correctement."}),e.jsx(i,{method:"POST",path:"/api/sdk/v1/test-webhook"}),e.jsx("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:"Corps de la requête"}),e.jsx(j,{params:[{name:"event",type:"string",required:!0,description:"Événement à simuler : payment.completed · payment.failed · withdrawal.completed · withdrawal.failed"}]}),e.jsx(a,{language:"javascript",code:`const res = await fetch('https://sendavapay.com/api/sdk/v1/test-webhook', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer \${KEY}',
    'Content-Type':  'application/json',
  },
  body: JSON.stringify({ event: 'payment.completed' }),
});
const data = await res.json();
// data.sent: true, data.responseStatus: 200, data.responseTime: 142`}),e.jsxs("h4",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2",children:["Réponse ",e.jsx("span",{className:"text-green-600 dark:text-green-400",children:"200 OK"})]}),e.jsx(a,{language:"json",code:`{
  "success":      true,
  "sent":         true,
  "webhookUrl":   "https://your-server.com/webhooks/sendavapay",
  "event":        "payment.completed",
  "responseStatus": 200,
  "responseTime": 142
}`})]})]}),e.jsxs("section",{id:"s-operators",children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-6",children:"Pays & Opérateurs"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-4",children:"Chaque paiement est crédité sur le wallet correspondant au pays. Les fonds d'un pays ne peuvent être retirés que via le wallet de ce même pays."}),e.jsx("div",{className:"overflow-x-auto rounded-lg border text-sm",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Pays"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Code"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Devise"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Opérateurs"})]})}),e.jsx("tbody",{children:[["🇹🇬 Togo","TG","XOF","TMoney, Moov Money (Flooz)"],["🇧🇯 Bénin","BJ","XOF","MTN MoMo, Moov Money"],["🇸🇳 Sénégal","SN","XOF","Orange Money, Wave, Free Money, Wizall"],["🇨🇮 Côte d'Ivoire","CI","XOF","MTN MoMo, Orange Money, Wave, Moov Money"],["🇲🇱 Mali","ML","XOF","Orange Money, Wave, Moov Money"],["🇧🇫 Burkina Faso","BF","XOF","Orange Money, Moov Money"],["🇨🇲 Cameroun","CM","XAF","MTN MoMo, Orange Money"],["🇬🇳 Guinée","GN","GNF","Orange Money, MTN MoMo, Cellcom"],["🇨🇩 RD Congo","COD","CDF","Vodacom M-Pesa, Airtel Money, Orange Money"],["🇨🇬 Congo Brazzaville","COG","XAF","Airtel Money, MTN Money"]].map(([s,n,l,p])=>e.jsxs("tr",{className:"border-t hover:bg-muted/20",children:[e.jsx("td",{className:"p-3 text-xs font-medium",children:s}),e.jsx("td",{className:"p-3 font-mono text-xs",children:n}),e.jsx("td",{className:"p-3 font-mono text-xs",children:l}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:p})]},n))})]})}),e.jsxs(x,{type:"info",title:"OTP requis",children:["Les opérateurs ",e.jsx("strong",{children:"Orange Money"})," (BF, CI, GN, ML, SN) retournent ",e.jsx("code",{children:"requiresOtp: true"})," à l'initiation du paiement. Tous les autres opérateurs n'en ont pas besoin."]})]}),e.jsxs("section",{id:"s-statuses",children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-6",children:"Statuts de transaction"}),e.jsx("h3",{className:"text-base font-semibold mb-3",children:"Statuts de paiement (dépôt)"}),e.jsx("div",{className:"overflow-x-auto rounded-lg border text-sm mb-8",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Statut"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Description"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Type"})]})}),e.jsx("tbody",{children:[["pending","Transaction créée, en attente d'initiation","transitoire"],["processing","Invite envoyée, en attente de confirmation du payeur","transitoire"],["completed","Paiement confirmé, fonds crédités sur le wallet","terminal ✓"],["failed","Paiement refusé, annulé ou erreur opérateur","terminal"],["cancelled","Annulé avant traitement","terminal"]].map(([s,n,l])=>e.jsxs("tr",{className:"border-t hover:bg-muted/20",children:[e.jsx("td",{className:"p-3",children:e.jsx("span",{className:`px-2 py-0.5 rounded text-xs font-mono font-medium ${s==="completed"?"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400":s==="failed"||s==="cancelled"?"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400":"bg-muted text-muted-foreground"}`,children:s})}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:n}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:l})]},s))})]})}),e.jsx("h3",{className:"text-base font-semibold mb-3",children:"Statuts de retrait (pay-out)"}),e.jsx("div",{className:"overflow-x-auto rounded-lg border text-sm",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Statut"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Description"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Type"})]})}),e.jsx("tbody",{children:[["queued","En file d'attente — le worker va le traiter","transitoire"],["processing","En cours de traitement chez l'opérateur","transitoire"],["provider_pending","En attente de confirmation du fournisseur de paiement","transitoire"],["completed","Retrait effectué — fonds virés sur le Mobile Money","terminal ✓"],["failed","Retrait échoué — fonds non débités","terminal"],["reversed","Fonds retournés sur le wallet après un échec définitif","terminal"],["cancelled","Retrait annulé avant traitement","terminal"]].map(([s,n,l])=>e.jsxs("tr",{className:"border-t hover:bg-muted/20",children:[e.jsx("td",{className:"p-3",children:e.jsx("span",{className:`px-2 py-0.5 rounded text-xs font-mono font-medium ${s==="completed"?"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400":s==="failed"||s==="cancelled"||s==="reversed"?"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400":"bg-muted text-muted-foreground"}`,children:s})}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:n}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:l})]},s))})]})})]}),e.jsxs("section",{id:"s-errors",children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-6",children:"Codes d'erreur"}),e.jsx(a,{language:"json — format d'erreur",code:`{
  "success": false,
  "error":   "INSUFFICIENT_BALANCE",
  "code":    "INSUFFICIENT_BALANCE"
}`}),e.jsx("div",{className:"overflow-x-auto rounded-lg border text-sm mt-4",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"HTTP"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Code"}),e.jsx("th",{className:"text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground",children:"Description"})]})}),e.jsx("tbody",{children:[["400","INVALID_REQUEST","Paramètres manquants ou malformés"],["400","DUPLICATE_REFERENCE","externalReference déjà utilisée pour un paiement actif"],["400","INSUFFICIENT_BALANCE","Solde insuffisant sur le wallet pour le retrait"],["400","UNSUPPORTED_COUNTRY","Code pays non pris en charge"],["400","WALLET_NOT_FOUND","Wallet du pays introuvable sur votre compte"],["400","INVALID_PHONE_FORMAT","Numéro de téléphone invalide — format E.164 requis (+22890…)"],["400","OPERATOR_COUNTRY_MISMATCH","Opérateur incompatible avec le pays demandé"],["400","PAYOUT_OPERATOR_OFFLINE","Opérateur en maintenance — retraits temporairement indisponibles"],["400","AMOUNT_TOO_LOW","Montant inférieur au minimum autorisé (100)"],["400","AMOUNT_TOO_HIGH","Montant supérieur au maximum autorisé (5 000 000)"],["409","DUPLICATE_WITHDRAWAL","Un retrait avec cet externalReference existe déjà"],["401","UNAUTHORIZED","Header Authorization manquant ou malformé"],["401","INVALID_API_KEY","Clé SDK invalide ou inexistante"],["403","API_KEY_INACTIVE","Clé SDK désactivée"],["403","SDK_NOT_ENABLED","Accès SDK non activé — contactez le support"],["403","ACCOUNT_NOT_VERIFIED","KYC non validé"],["404","NOT_FOUND","Transaction introuvable pour cette référence"],["410","TOKEN_EXPIRED","paymentToken expiré (30 min dépassées)"],["503","API_MAINTENANCE","API temporairement en maintenance"]].map(([s,n,l],p)=>e.jsxs("tr",{className:"border-t hover:bg-muted/20",children:[e.jsx("td",{className:"p-3 font-mono text-xs text-muted-foreground",children:s}),e.jsx("td",{className:"p-3 font-mono text-xs text-primary",children:n}),e.jsx("td",{className:"p-3 text-xs text-muted-foreground",children:l})]},p))})]})})]}),e.jsxs("section",{id:"s-rate",className:"pb-16",children:[e.jsx("h2",{className:"text-2xl font-bold border-b pb-3 mb-6",children:"Rate Limiting"}),e.jsx("div",{className:"grid sm:grid-cols-3 gap-3 mb-6",children:[["100 req / min","Par clé SDK"],["5 secondes","Intervalle polling recommandé"],["Retry 429","Backoff exponentiel"]].map(([s,n])=>e.jsxs("div",{className:"p-4 rounded-lg border bg-muted/30 text-center",children:[e.jsx("p",{className:"text-lg font-bold text-primary",children:s}),e.jsx("p",{className:"text-xs text-muted-foreground",children:n})]},s))}),e.jsx(a,{language:"json — réponse HTTP 429",code:`HTTP/1.1 429 Too Many Requests
{
  "success": false,
  "error":   "Trop de requêtes. Réessayez dans 60 secondes.",
  "code":    "RATE_LIMITED"
}`}),e.jsx(x,{type:"tip",children:"Pour le polling de statut, utilisez un intervalle de 5 secondes minimum. Implémentez un backoff exponentiel sur les réponses 429."})]})]})]})}function Ft(){const{user:o,isLoading:d}=Pe(),{toast:r}=Ee(),[c,g]=u.useState(""),[v,s]=u.useState(""),[n,l]=u.useState(""),[p,U]=u.useState(""),[w,O]=u.useState(null),[me,xe]=u.useState(null),[A,H]=u.useState(null),[ue,z]=u.useState(!1),[pe,V]=u.useState(null),[he,W]=u.useState(""),[je,Y]=u.useState(""),{data:P,isLoading:Te}=ae({queryKey:["/api/api-maintenance-status"],refetchInterval:1e4}),{data:Z,isLoading:Ce}=ae({queryKey:["/api/user/api-permissions"],enabled:!!(o!=null&&o.isVerified)}),{data:J=[],isLoading:Q}=ae({queryKey:["/api/api-keys"],enabled:!!(o!=null&&o.isVerified)&&!(P!=null&&P.enabled)}),ee=re({mutationFn:async t=>(await ne("POST","/api/api-keys",t)).json(),onSuccess:()=>{oe.invalidateQueries({queryKey:["/api/api-keys"]}),g(""),s(""),l(""),U(""),O(null),z(!1),r({title:"Clé créée",description:"Votre nouvelle clé API a été créée avec succès"})},onError:t=>{r({title:"Erreur",description:t.message||"Impossible de créer la clé",variant:"destructive"})}}),te=re({mutationFn:async t=>{await ne("DELETE",`/api/api-keys/${t}`)},onSuccess:()=>{oe.invalidateQueries({queryKey:["/api/api-keys"]}),r({title:"Clé supprimée"})},onError:()=>{r({title:"Erreur",description:"Impossible de supprimer la clé",variant:"destructive"})}}),ge=re({mutationFn:async({id:t,webhookUrl:T,redirectUrl:F})=>(await ne("PATCH",`/api/api-keys/${t}`,{webhookUrl:T||null,redirectUrl:F||null})).json(),onSuccess:()=>{oe.invalidateQueries({queryKey:["/api/api-keys"]}),V(null),r({title:"Clé mise à jour",description:"Les URLs ont été enregistrées"})},onError:()=>{r({title:"Erreur",description:"Impossible de mettre à jour la clé",variant:"destructive"})}}),Se=t=>{V(t.id),W(t.webhookUrl||""),Y(t.redirectUrl||"")},fe=()=>{V(null),W(""),Y("")},be=t=>{navigator.clipboard.writeText(t),xe(t),r({title:"Copié"}),setTimeout(()=>xe(null),2e3)},Oe=()=>{if(!c.trim()){r({title:"Erreur",description:"Veuillez entrer un nom pour la clé",variant:"destructive"});return}if(!w){r({title:"Erreur",description:"Veuillez sélectionner un type d'API",variant:"destructive"});return}ee.mutate({name:c.trim(),appName:v.trim()||void 0,webhookUrl:n.trim()||void 0,redirectUrl:p.trim()||void 0,apiType:w})};if(d||Te)return e.jsx($,{children:e.jsx("div",{className:"flex items-center justify-center min-h-[60vh]",children:e.jsx(C,{className:"h-8 w-8 animate-spin text-primary"})})});if(P!=null&&P.enabled)return e.jsx($,{children:e.jsx("div",{className:"flex items-center justify-center min-h-[60vh] p-4",children:e.jsxs(f,{className:"max-w-lg w-full text-center",children:[e.jsxs(y,{children:[e.jsx("div",{className:"mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center",children:e.jsx(Xe,{className:"h-8 w-8 text-orange-600 dark:text-orange-400"})}),e.jsx(N,{className:"text-2xl",children:"API en maintenance"}),e.jsx(S,{className:"text-base",children:"L'API est temporairement indisponible"})]}),e.jsx(b,{children:e.jsx(L,{href:"/dashboard",children:e.jsxs(m,{variant:"outline",children:[e.jsx(ie,{className:"h-4 w-4 mr-2"}),"Retour au tableau de bord"]})})})]})})});if(!(o!=null&&o.isVerified))return e.jsx($,{children:e.jsxs("div",{className:"space-y-6 p-6",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold",children:"API de Paiement"}),e.jsx("p",{className:"text-muted-foreground",children:"Intégrez SendavaPay dans vos applications"})]}),e.jsxs(f,{children:[e.jsxs(y,{children:[e.jsxs(N,{className:"flex items-center gap-2",children:[e.jsx(ve,{className:"h-5 w-5 text-yellow-500"}),"Vérification requise"]}),e.jsx(S,{children:"Votre compte doit être vérifié pour accéder à l'API"})]}),e.jsxs(b,{className:"space-y-4",children:[e.jsx("p",{className:"text-muted-foreground",children:"Pour des raisons de sécurité, seuls les comptes vérifiés peuvent accéder à l'API SendavaPay."}),e.jsx(L,{href:"/dashboard/kyc",children:e.jsxs(m,{children:[e.jsx(ve,{className:"h-4 w-4 mr-2"}),"Vérifier mon compte"]})})]})]})]})});const M=(Z==null?void 0:Z.apiSdkEnabled)??!1,k=J.filter(t=>t.apiType==="sdk"),h=J.filter(t=>t.apiType==="redirect"),se=({keyItem:t})=>{const T=pe===t.id,F=ge.isPending&&pe===t.id;return e.jsxs("div",{className:"flex flex-col gap-3 p-4 border rounded-lg","data-testid":`api-key-${t.id}`,children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-start justify-between gap-3",children:[e.jsxs("div",{className:"space-y-1 flex-1 min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[e.jsx("span",{className:"font-medium",children:t.name}),e.jsx(B,{variant:t.isActive?"default":"secondary",children:t.isActive?"Active":"Inactive"}),e.jsx(B,{variant:"outline",className:t.apiType==="sdk"?"border-purple-400 text-purple-700 dark:text-purple-300":"",children:t.apiType==="sdk"?"SDK":"Redirection"})]}),t.appName&&e.jsxs("p",{className:"text-sm text-muted-foreground",children:["Application : ",t.appName]}),e.jsx("code",{className:"text-sm text-muted-foreground font-mono block truncate",children:t.apiKey}),e.jsxs("p",{className:"text-xs text-muted-foreground",children:["Créée le ",new Date(t.createdAt).toLocaleDateString("fr-FR"),t.requestCount>0&&` • ${t.requestCount} requêtes`]})]}),e.jsxs("div",{className:"flex gap-2 flex-shrink-0",children:[e.jsx(m,{variant:"outline",size:"sm",onClick:()=>be(t.apiKey),"data-testid":`button-copy-${t.id}`,children:me===t.apiKey?e.jsx(q,{className:"h-4 w-4"}):e.jsx(X,{className:"h-4 w-4"})}),e.jsx(m,{variant:"outline",size:"sm",onClick:()=>T?fe():Se(t),"data-testid":`button-edit-${t.id}`,children:T?e.jsx(Re,{className:"h-4 w-4"}):e.jsx($e,{className:"h-4 w-4"})}),e.jsx(m,{variant:"outline",size:"sm",onClick:()=>H(t),disabled:te.isPending,"data-testid":`button-delete-${t.id}`,children:e.jsx(ke,{className:"h-4 w-4 text-destructive"})})]})]}),T&&e.jsxs("div",{className:"border-t pt-3 space-y-3 bg-muted/20 -mx-4 px-4 pb-3 rounded-b-lg",children:[e.jsx("p",{className:"text-xs font-semibold uppercase tracking-wide text-muted-foreground",children:"Modifier les URLs"}),e.jsxs("div",{className:"space-y-1",children:[e.jsxs(R,{htmlFor:`wh-${t.id}`,className:"text-xs flex items-center gap-1.5",children:[e.jsx(we,{className:"h-3 w-3"}),"URL de webhook"]}),e.jsx(E,{id:`wh-${t.id}`,type:"url",placeholder:"https://monsite.com/webhooks/sendavapay",value:he,onChange:I=>W(I.target.value),className:"h-8 text-sm","data-testid":`input-edit-webhook-${t.id}`}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"Laisser vide pour désactiver les webhooks"})]}),e.jsxs("div",{className:"space-y-1",children:[e.jsxs(R,{htmlFor:`rd-${t.id}`,className:"text-xs flex items-center gap-1.5",children:[e.jsx(le,{className:"h-3 w-3"}),"URL de redirection (après paiement)"]}),e.jsx(E,{id:`rd-${t.id}`,type:"url",placeholder:"https://monsite.com/paiement/succes",value:je,onChange:I=>Y(I.target.value),className:"h-8 text-sm","data-testid":`input-edit-redirect-${t.id}`})]}),e.jsxs("div",{className:"flex gap-2 pt-1",children:[e.jsxs(m,{size:"sm",onClick:()=>ge.mutate({id:t.id,webhookUrl:he,redirectUrl:je}),disabled:F,"data-testid":`button-save-${t.id}`,children:[F?e.jsx(C,{className:"h-3 w-3 mr-1.5 animate-spin"}):e.jsx(Be,{className:"h-3 w-3 mr-1.5"}),"Enregistrer"]}),e.jsx(m,{size:"sm",variant:"outline",onClick:fe,disabled:F,"data-testid":`button-cancel-edit-${t.id}`,children:"Annuler"})]})]}),!T&&(t.redirectUrl||t.webhookUrl)&&e.jsxs("div",{className:"space-y-2 border-t pt-3",children:[e.jsxs("div",{className:"flex flex-wrap gap-4 text-xs",children:[t.redirectUrl&&e.jsxs("div",{className:"flex items-center gap-1 text-muted-foreground min-w-0",children:[e.jsx(le,{className:"h-3 w-3 flex-shrink-0"}),e.jsx("span",{className:"flex-shrink-0",children:"Redirection:"}),e.jsx("span",{className:"font-mono truncate max-w-[200px]",children:t.redirectUrl})]}),t.webhookUrl&&e.jsxs("div",{className:"flex items-center gap-1 text-muted-foreground min-w-0",children:[e.jsx(Ge,{className:"h-3 w-3 flex-shrink-0"}),e.jsx("span",{className:"flex-shrink-0",children:"Webhook:"}),e.jsx("span",{className:"font-mono truncate max-w-[200px]",children:t.webhookUrl})]})]}),t.webhookSecret&&e.jsxs("div",{className:"flex items-center gap-2 text-xs",children:[e.jsx("span",{className:"text-muted-foreground",children:"Secret:"}),e.jsx("code",{className:"font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded truncate max-w-[200px]",children:t.webhookSecret}),e.jsx(m,{variant:"ghost",size:"sm",className:"h-6 w-6 p-0",onClick:()=>be(t.webhookSecret),"data-testid":`button-copy-secret-${t.id}`,children:me===t.webhookSecret?e.jsx(q,{className:"h-3 w-3"}):e.jsx(X,{className:"h-3 w-3"})})]})]})]})};return e.jsxs($,{children:[e.jsxs("div",{className:"space-y-6 p-6",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold",children:"API de Paiement"}),e.jsx("p",{className:"text-muted-foreground",children:"Gérez vos clés d'intégration SendavaPay"})]}),M&&!w&&e.jsxs(f,{children:[e.jsxs(y,{children:[e.jsxs(N,{className:"flex items-center gap-2",children:[e.jsx(de,{className:"h-5 w-5"}),"Créer une clé API"]}),e.jsx(S,{children:"Choisissez le type d'intégration adapté à votre projet"})]}),e.jsx(b,{children:e.jsxs("div",{className:"grid sm:grid-cols-2 gap-4",children:[e.jsxs("button",{className:"p-5 border-2 rounded-xl text-left hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group",onClick:()=>O("sdk"),children:[e.jsxs("div",{className:"flex items-center gap-3 mb-3",children:[e.jsx("div",{className:"h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-200 transition-colors",children:e.jsx(D,{className:"h-5 w-5 text-purple-600 dark:text-purple-400"})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-semibold",children:"API SDK"}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"Intégration complète"})]})]}),e.jsx("ul",{className:"text-sm text-muted-foreground space-y-1",children:["Encaissement Mobile Money (10 pays)","Retrait automatique pay-out","Soldes wallets par pays","Webhooks signés HMAC"].map(t=>e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(q,{className:"h-3 w-3 text-green-500 flex-shrink-0"}),t]},t))})]}),e.jsxs("button",{className:"p-5 border-2 rounded-xl text-left hover:border-primary hover:bg-primary/5 transition-all group",onClick:()=>O("redirect"),children:[e.jsxs("div",{className:"flex items-center gap-3 mb-3",children:[e.jsx("div",{className:"h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 transition-colors",children:e.jsx(le,{className:"h-5 w-5 text-blue-600 dark:text-blue-400"})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-semibold",children:"API Redirection"}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"Simple et rapide"})]})]}),e.jsx("ul",{className:"text-sm text-muted-foreground space-y-1",children:["Liens de paiement générés","Redirection après paiement","Notifications webhook","Intégration sans SDK"].map(t=>e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx(q,{className:"h-3 w-3 text-green-500 flex-shrink-0"}),t]},t))})]})]})})]}),(M&&w||!M&&ue)&&e.jsxs(f,{children:[e.jsxs(y,{children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx(N,{className:"flex items-center gap-2",children:w==="sdk"?e.jsxs(e.Fragment,{children:[e.jsx(D,{className:"h-5 w-5 text-purple-600"}),"Nouvelle clé API SDK"]}):e.jsxs(e.Fragment,{children:[e.jsx(G,{className:"h-5 w-5 text-primary"}),"Nouvelle clé API"]})}),M?e.jsxs(m,{variant:"ghost",size:"sm",onClick:()=>O(null),"data-testid":"button-back-type",children:[e.jsx(ie,{className:"h-4 w-4 mr-1"}),"Changer"]}):e.jsxs(m,{variant:"ghost",size:"sm",onClick:()=>z(!1),"data-testid":"button-cancel-create",children:[e.jsx(ie,{className:"h-4 w-4 mr-1"}),"Annuler"]})]}),e.jsx(S,{children:w==="sdk"?"Clé pour l'intégration SDK complète avec retrait automatique":"Clé pour la création de liens de paiement avec redirection"})]}),e.jsxs(b,{className:"space-y-4",children:[e.jsxs("div",{className:"grid sm:grid-cols-2 gap-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx(R,{htmlFor:"keyName",children:"Nom de la clé *"}),e.jsx(E,{id:"keyName",placeholder:"Ex: Mon site e-commerce",value:c,onChange:t=>g(t.target.value),"data-testid":"input-key-name"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(R,{htmlFor:"appName",children:"Nom de l'application"}),e.jsx(E,{id:"appName",placeholder:"Ex: MaBoutique.com",value:v,onChange:t=>s(t.target.value),"data-testid":"input-app-name"})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(R,{htmlFor:"redirectUrl",children:"URL de redirection (après paiement)"}),e.jsx(E,{id:"redirectUrl",type:"url",placeholder:"https://monsite.com/paiement/succes",value:p,onChange:t=>U(t.target.value),"data-testid":"input-redirect-url"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(R,{htmlFor:"webhookUrl",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(we,{className:"h-4 w-4"}),"URL de webhook"]})}),e.jsx(E,{id:"webhookUrl",type:"url",placeholder:"https://monsite.com/webhooks/sendavapay",value:n,onChange:t=>l(t.target.value),"data-testid":"input-webhook-url"}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"SendavaPay enverra une notification POST sécurisée à cette URL lors de chaque paiement"})]}),e.jsxs(m,{onClick:Oe,disabled:ee.isPending,className:w==="sdk"?"bg-purple-600 hover:bg-purple-700":"","data-testid":"button-create-key",children:[ee.isPending?e.jsx(C,{className:"h-4 w-4 mr-2 animate-spin"}):e.jsx(G,{className:"h-4 w-4 mr-2"}),"Générer la clé"]})]})]}),!Ce&&e.jsx(e.Fragment,{children:M?e.jsxs(_e,{defaultValue:k.length>0?"sdk":"redirect",children:[e.jsxs(qe,{children:[e.jsxs(ye,{value:"sdk",className:"gap-2",children:[e.jsx(D,{className:"h-4 w-4"}),"Clés SDK",k.length>0&&e.jsx(B,{variant:"secondary",className:"ml-1 h-5 text-xs",children:k.length})]}),e.jsxs(ye,{value:"redirect",className:"gap-2",children:[e.jsx(ce,{className:"h-4 w-4"}),"Clés Redirection",h.length>0&&e.jsx(B,{variant:"secondary",className:"ml-1 h-5 text-xs",children:h.length})]})]}),e.jsxs(Ne,{value:"sdk",className:"space-y-4 mt-4",children:[e.jsxs(f,{children:[e.jsxs(y,{children:[e.jsxs(N,{className:"flex items-center gap-2 text-base",children:[e.jsx(D,{className:"h-4 w-4 text-purple-600"}),"Clés API SDK"]}),e.jsxs(S,{children:[k.length," clé",k.length!==1?"s":""," SDK"]})]}),e.jsx(b,{children:Q?e.jsx("div",{className:"flex justify-center py-8",children:e.jsx(C,{className:"h-6 w-6 animate-spin text-muted-foreground"})}):k.length===0?e.jsxs("div",{className:"text-center py-8 text-muted-foreground",children:[e.jsx(D,{className:"h-12 w-12 mx-auto mb-3 opacity-50"}),e.jsx("p",{children:"Aucune clé SDK créée"}),e.jsx("p",{className:"text-sm",children:'Cliquez sur "Créer une clé API" pour commencer'})]}):e.jsx("div",{className:"space-y-3",children:k.map(t=>e.jsx(se,{keyItem:t},t.id))})})]}),e.jsxs("div",{children:[e.jsxs("h2",{className:"text-xl font-bold mb-4 flex items-center gap-2",children:[e.jsx(K,{className:"h-5 w-5 text-purple-600"}),"Référence API SDK"]}),e.jsx(He,{apiKeys:J})]})]}),e.jsxs(Ne,{value:"redirect",className:"space-y-4 mt-4",children:[e.jsxs(f,{children:[e.jsxs(y,{children:[e.jsxs(N,{className:"flex items-center gap-2 text-base",children:[e.jsx(ce,{className:"h-4 w-4 text-blue-600"}),"Clés API Redirection"]}),e.jsxs(S,{children:[h.length," clé",h.length!==1?"s":""," Redirection"]})]}),e.jsx(b,{children:Q?e.jsx("div",{className:"flex justify-center py-8",children:e.jsx(C,{className:"h-6 w-6 animate-spin text-muted-foreground"})}):h.length===0?e.jsxs("div",{className:"text-center py-8 text-muted-foreground",children:[e.jsx(ce,{className:"h-12 w-12 mx-auto mb-3 opacity-50"}),e.jsx("p",{children:"Aucune clé créée"})]}):e.jsx("div",{className:"space-y-3",children:h.map(t=>e.jsx(se,{keyItem:t},t.id))})})]}),e.jsxs(f,{children:[e.jsx(y,{children:e.jsxs(N,{className:"flex items-center gap-2 text-base",children:[e.jsx(K,{className:"h-4 w-4"}),"Documentation"]})}),e.jsx(b,{children:e.jsx(L,{href:"/docs",children:e.jsxs(m,{variant:"outline","data-testid":"button-docs-redirect",children:[e.jsx(K,{className:"h-4 w-4 mr-2"}),"Voir la documentation"]})})})]})]})]}):e.jsxs("div",{className:"space-y-4",children:[e.jsxs(f,{children:[e.jsx(y,{children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsxs(N,{className:"flex items-center gap-2 text-base",children:[e.jsx(G,{className:"h-4 w-4 text-primary"}),"Mes clés API"]}),e.jsxs(S,{children:[h.length," clé",h.length!==1?"s":""]})]}),!ue&&e.jsxs(m,{size:"sm",onClick:()=>{z(!0),O("redirect")},"data-testid":"button-new-key",children:[e.jsx(de,{className:"h-4 w-4 mr-2"}),"Nouvelle clé"]})]})}),e.jsx(b,{children:Q?e.jsx("div",{className:"flex justify-center py-8",children:e.jsx(C,{className:"h-6 w-6 animate-spin text-muted-foreground"})}):h.length===0?e.jsxs("div",{className:"text-center py-8 text-muted-foreground",children:[e.jsx(G,{className:"h-12 w-12 mx-auto mb-3 opacity-50"}),e.jsx("p",{children:"Aucune clé créée"}),e.jsxs(m,{className:"mt-3",size:"sm",onClick:()=>{z(!0),O("redirect")},"data-testid":"button-create-first-key",children:[e.jsx(de,{className:"h-4 w-4 mr-2"}),"Créer ma première clé"]})]}):e.jsx("div",{className:"space-y-3",children:h.map(t=>e.jsx(se,{keyItem:t},t.id))})})]}),e.jsx(f,{children:e.jsx(b,{className:"pt-6",children:e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("div",{className:"h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0",children:e.jsx(K,{className:"h-5 w-5 text-primary"})}),e.jsxs("div",{className:"flex-1",children:[e.jsx("p",{className:"font-medium",children:"Documentation API"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Consultez la documentation pour intégrer SendavaPay dans votre application"})]}),e.jsx(L,{href:"/docs",children:e.jsxs(m,{variant:"outline","data-testid":"button-docs",children:[e.jsx(K,{className:"h-4 w-4 mr-2"}),"Voir la documentation"]})})]})})})]})})]}),e.jsx(Me,{open:!!A,onOpenChange:t=>!t&&H(null),children:e.jsxs(Fe,{children:[e.jsxs(De,{children:[e.jsx(Ke,{children:"Supprimer cette clé API ?"}),e.jsxs(Ue,{children:['Êtes-vous sûr de vouloir supprimer la clé "',A==null?void 0:A.name,'" ? Cette action est irréversible et toutes les intégrations utilisant cette clé cesseront de fonctionner.']})]}),e.jsxs(ze,{children:[e.jsx(Ie,{children:"Annuler"}),e.jsxs(Le,{onClick:()=>{A&&(te.mutate(A.id),H(null))},className:"bg-destructive text-destructive-foreground hover:bg-destructive/90",children:[te.isPending?e.jsx(C,{className:"h-4 w-4 mr-2 animate-spin"}):e.jsx(ke,{className:"h-4 w-4 mr-2"}),"Supprimer"]})]})]})})]})}export{Ft as default};
