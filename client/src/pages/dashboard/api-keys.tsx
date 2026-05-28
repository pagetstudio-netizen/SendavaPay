import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Key, Shield, Code2, Loader2, Copy, Check, Trash2, Plus, ExternalLink,
  Wrench, ArrowLeft, Bell, Globe, Zap, ArrowUpRight, Info, BookOpen,
  Terminal, Webhook,
} from "lucide-react";
import type { ApiKey } from "@shared/schema";

interface ApiPermissions {
  apiSdkEnabled: boolean;
  apiRedirectEnabled: boolean;
}

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="rounded-lg overflow-hidden border border-slate-700 my-3">
      <div className="flex items-center justify-between bg-slate-800 px-3 py-1.5">
        <span className="text-xs text-slate-400 font-mono">{language}</span>
        <button onClick={copy} className="text-slate-400 hover:text-white transition-colors p-1">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
      <pre className="bg-slate-900 text-slate-100 p-4 overflow-x-auto text-xs font-mono leading-relaxed"><code>{code}</code></pre>
    </div>
  );
}

function MultiCodeBlock({ tabs }: { tabs: { label: string; code: string }[] }) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(tabs[active].code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="rounded-lg overflow-hidden border border-slate-700 my-3">
      <div className="flex items-center justify-between bg-slate-800 px-3 py-1.5">
        <div className="flex gap-1">
          {tabs.map((tab, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${active === i ? "bg-slate-600 text-white" : "text-slate-400 hover:text-slate-200"}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <button onClick={copy} className="text-slate-400 hover:text-white transition-colors p-1">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
      <pre className="bg-slate-900 text-slate-100 p-4 overflow-x-auto text-xs font-mono leading-relaxed"><code>{tabs[active].code}</code></pre>
    </div>
  );
}

function Endpoint({ method, path }: { method: string; path: string }) {
  const colors: Record<string, string> = {
    POST: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    GET:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    PUT:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <div className="flex items-center gap-3 my-4 p-3 bg-muted/40 rounded-lg border">
      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold font-mono ${colors[method] || "bg-muted text-muted-foreground"}`}>{method}</span>
      <code className="text-sm text-foreground">{path}</code>
    </div>
  );
}

function InfoBox({ type, title, children }: { type: "info" | "warning" | "tip" | "danger"; title?: string; children: React.ReactNode }) {
  const styles: Record<string, string> = {
    info:    "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300",
    warning: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300",
    tip:     "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300",
    danger:  "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300",
  };
  return (
    <div className={`p-4 rounded-lg border ${styles[type]} text-sm my-4`}>
      {title && <p className="font-semibold mb-1">{title}</p>}
      <div>{children}</div>
    </div>
  );
}

function ParamTable({ params }: { params: { name: string; type: string; required?: boolean; description: string }[] }) {
  return (
    <div className="overflow-x-auto my-4 rounded-lg border text-sm">
      <table className="w-full">
        <thead className="bg-muted/70">
          <tr>
            <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Paramètre</th>
            <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Type</th>
            <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p, i) => (
            <tr key={i} className="border-t hover:bg-muted/20">
              <td className="p-3 font-mono text-xs whitespace-nowrap">
                {p.name}{p.required && <span className="text-red-500 ml-0.5">*</span>}
              </td>
              <td className="p-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{p.type}</td>
              <td className="p-3 text-xs text-muted-foreground">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SdkDocumentation({ apiKeys }: { apiKeys: ApiKey[] }) {
  const sdkKeys = apiKeys.filter((k) => k.apiType === "sdk" && k.isActive);
  const KEY = sdkKeys[0]?.apiKey || "sdk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  type NavItem = { id?: string; label: string; children?: { id: string; label: string }[] };
  const nav: NavItem[] = [
    { id: "s-intro",     label: "Introduction" },
    { id: "s-arch",      label: "Architecture" },
    { id: "s-auth",      label: "Authentification" },
    { label: "Pay-in — Encaissement", children: [
      { id: "s-create",   label: "Créer un paiement" },
      { id: "s-sdk",      label: "SDK navigateur" },
      { id: "s-initiate", label: "Initier le paiement" },
      { id: "s-otp",      label: "Flux OTP" },
      { id: "s-status",   label: "Statut & polling" },
      { id: "s-list",     label: "Liste transactions" },
    ]},
    { id: "s-payout",    label: "Pay-out — Retrait" },
    { id: "s-balance",   label: "Soldes wallets" },
    { label: "Webhooks", children: [
      { id: "s-wh-config", label: "Configuration" },
      { id: "s-wh-events", label: "Événements" },
      { id: "s-wh-hmac",   label: "Vérification HMAC" },
    ]},
    { id: "s-countries", label: "Pays & Opérateurs" },
    { id: "s-statuses",  label: "Statuts" },
    { id: "s-errors",    label: "Codes d'erreur" },
    { id: "s-rate",      label: "Rate Limiting" },
  ];

  return (
    <div className="flex -mx-6 border-t min-h-screen">

      {/* ── SIDEBAR ── */}
      <nav className="hidden xl:flex flex-col w-52 flex-shrink-0 border-r bg-muted/20 sticky top-0 max-h-screen overflow-y-auto py-5 gap-0.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 mb-2">SDK API v2.0</p>
        {nav.map((item, i) =>
          item.id ? (
            <button key={i} onClick={() => scrollTo(item.id!)}
              className="text-left px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors rounded-sm mx-1">
              {item.label}
            </button>
          ) : (
            <div key={i} className="mt-3">
              <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{item.label}</p>
              {item.children?.map((child, j) => (
                <button key={j} onClick={() => scrollTo(child.id)}
                  className="w-full text-left pl-6 pr-4 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors rounded-sm mx-1">
                  {child.label}
                </button>
              ))}
            </div>
          )
        )}
      </nav>

      {/* ── CONTENT ── */}
      <div className="flex-1 px-6 xl:px-12 py-8 max-w-4xl space-y-14 overflow-x-hidden">

        {/* ─── INTRODUCTION ─── */}
        <section id="s-intro">
          <h2 className="text-2xl font-bold border-b pb-3 mb-6">Introduction</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            L'API SDK SendavaPay vous permet d'encaisser des paiements Mobile Money et d'effectuer des retraits automatisés
            directement depuis votre site ou application — <strong>sans redirection, sans iframe, sans page externe</strong>.
            Votre client reste sur votre interface du début à la fin.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {[
              ["Aucune redirection", "100 % sur votre interface"],
              ["10 pays", "XOF · XAF · GNF · CDF"],
              ["HMAC webhooks", "Signés & vérifiables"],
              ["Retrait auto", "Pay-out Mobile Money"],
            ].map(([title, sub]) => (
              <div key={title} className="p-3 rounded-lg border bg-muted/30 text-center">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>

          <h3 className="text-base font-semibold mb-3">Flux de paiement complet</h3>
          <div className="space-y-2.5">
            {[
              ["1", "Le client saisit son téléphone et son opérateur sur votre site", ""],
              ["2", "Votre backend crée un paiement", "POST /api/sdk/v1/create-payment → reference + paymentToken"],
              ["3", "Votre page initie le paiement Mobile Money", "Via le SDK navigateur — l'opérateur envoie une invite sur le téléphone"],
              ["4", "OTP si requis (Orange Money)", "Le client reçoit un SMS et entre le code sur votre page"],
              ["5", "Confirmation par polling ou webhook", "GET /api/sdk/v1/payment-status/:reference"],
              ["6", "Votre backend valide et livre la commande", "Toujours vérifier le statut côté serveur avant livraison"],
            ].map(([num, title, desc]) => (
              <div key={num} className="flex gap-3 items-start">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">{num}</div>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  {desc && <p className="text-xs text-muted-foreground font-mono mt-0.5">{desc}</p>}
                </div>
              </div>
            ))}
          </div>

          <InfoBox type="info" title="Tarifs">
            Des frais s'appliquent selon votre type de compte et le pays. Le montant net est crédité sur votre wallet pays correspondant immédiatement après confirmation du paiement.
          </InfoBox>
        </section>

        {/* ─── ARCHITECTURE ─── */}
        <section id="s-arch">
          <h2 className="text-2xl font-bold border-b pb-3 mb-6">Architecture</h2>
          <InfoBox type="danger" title="Ne jamais exposer votre clé SDK dans le navigateur">
            Votre clé <code>sdk_…</code> doit uniquement exister sur votre serveur. Une clé exposée dans le code frontend peut être volée et utilisée pour vider votre wallet.
          </InfoBox>
          <div className="rounded-lg border bg-muted/20 p-5 font-mono text-xs leading-relaxed text-muted-foreground space-y-1.5">
            <p className="text-foreground font-semibold text-sm mb-3">Flux de données</p>
            <p><span className="text-foreground">Navigateur client</span>  →  <span className="text-foreground">Votre backend</span>  (formulaire soumis)</p>
            <p><span className="text-foreground">Votre backend</span>  →  <span className="text-primary">SendavaPay API</span>  (Authorization: Bearer sdk_…)</p>
            <p><span className="text-primary">SendavaPay API</span>  →  <span className="text-foreground">Opérateur Mobile Money</span>  (invite de paiement)</p>
            <p><span className="text-foreground">Opérateur</span>  →  <span className="text-foreground">Téléphone client</span>  (confirmation)</p>
            <p><span className="text-primary">SendavaPay API</span>  →  <span className="text-foreground">Votre webhook</span>  (X-SendavaPay-Signature)</p>
            <div className="mt-3 pt-3 border-t">
              <p><span className="text-foreground">Votre frontend</span>  →  poll  <span className="text-foreground">votre propre backend</span>  (jamais SendavaPay directement)</p>
            </div>
          </div>
          <InfoBox type="tip">
            Votre frontend interroge votre propre endpoint (ex. <code>/api/check-payment?ref=xxx</code>) qui lui-même questionne SendavaPay.
            Votre clé ne touche jamais le navigateur.
          </InfoBox>
        </section>

        {/* ─── AUTHENTIFICATION ─── */}
        <section id="s-auth">
          <h2 className="text-2xl font-bold border-b pb-3 mb-6">Authentification</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Toutes les requêtes backend utilisent votre clé SDK dans le header <code className="bg-muted px-1 rounded">Authorization</code>.
          </p>
          <CodeBlock language="http" code={`Authorization: Bearer ${KEY}\nContent-Type: application/json`} />
          <div className="overflow-x-auto rounded-lg border my-4 text-sm">
            <table className="w-full">
              <thead className="bg-muted/70">
                <tr>
                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Environnement</th>
                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Préfixe clé</th>
                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">URL de base</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3 text-xs font-medium">Production</td>
                  <td className="p-3 font-mono text-xs">sdk_</td>
                  <td className="p-3 font-mono text-xs">https://sendavapay.com/api/sdk/v1</td>
                </tr>
              </tbody>
            </table>
          </div>
          <InfoBox type="warning" title="Prérequis">
            Votre compte doit être vérifié (KYC validé) et l'accès SDK activé par l'administrateur pour utiliser ces endpoints.
          </InfoBox>
        </section>

        {/* ─── PAY-IN ─── */}
        <section>
          <h2 className="text-2xl font-bold border-b pb-3 mb-2">Pay-in — Encaissement</h2>
          <p className="text-sm text-muted-foreground mb-10">Collectez des paiements Mobile Money sans aucune redirection.</p>

          {/* Étape 1 — create-payment */}
          <div id="s-create" className="scroll-mt-4">
            <h3 className="text-lg font-semibold mb-1">Étape 1 — Créer un paiement</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Depuis votre backend lors d'une commande. Retourne un <code className="bg-muted px-1 rounded text-xs">paymentToken</code> (valable 30 min)
              à transmettre à votre page de paiement.
            </p>
            <Endpoint method="POST" path="/api/sdk/v1/create-payment" />
            <ParamTable params={[
              { name: "amount",            type: "number",  required: true,  description: "Montant en unité de la devise (ex. 5000 = 5 000 XOF)" },
              { name: "currency",          type: "string",  required: true,  description: "XOF · XAF · GNF · CDF" },
              { name: "description",       type: "string",                   description: "Description visible sur le reçu (max 255 car.)" },
              { name: "customerName",      type: "string",                   description: "Nom complet du client" },
              { name: "customerEmail",     type: "string",                   description: "Email du client" },
              { name: "customerPhone",     type: "string",                   description: "Téléphone du client en format E.164 (+22890000000)" },
              { name: "payerCountry",      type: "string",                   description: "Code pays ISO 2 lettres (TG, SN, CM…) pour le routage wallet" },
              { name: "webhookUrl",        type: "string",                   description: "URL HTTPS pour recevoir les notifications de paiement" },
              { name: "externalReference", type: "string",                   description: "Votre référence commande pour l'idempotence (max 128 car.)" },
              { name: "metadata",          type: "object",                   description: "Données personnalisées attachées à la transaction" },
            ]} />
            <MultiCodeBlock tabs={[
              { label: "curl", code:
`curl -X POST https://sendavapay.com/api/sdk/v1/create-payment \\
  -H "Authorization: Bearer ${KEY}" \\
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
  }'`
              },
              { label: "node.js", code:
`const response = await fetch('https://sendavapay.com/api/sdk/v1/create-payment', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${KEY}',
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
// data.reference   → à stocker en base de données`
              },
              { label: "php", code:
`$response = Http::withHeaders([
  'Authorization' => 'Bearer ${KEY}',
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
// $data['paymentToken'] → à passer à votre page de paiement`
              },
            ]} />
            <CodeBlock language="json — réponse 201 Created" code={`{
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
}`} />
            <InfoBox type="warning" title="Idempotence">
              Passez un <code>externalReference</code> unique par commande. Si vous relancez le même <code>externalReference</code> alors qu'un paiement est déjà <code>pending</code> ou <code>completed</code>,
              vous recevrez une erreur <code>409 DUPLICATE_REFERENCE</code> — aucun doublon créé.
            </InfoBox>
          </div>

          {/* Étape 2 — SDK navigateur */}
          <div id="s-sdk" className="scroll-mt-4 mt-12">
            <h3 className="text-lg font-semibold mb-1">Étape 2 — SDK navigateur</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Chargez le SDK léger sur votre page de paiement. Il expose des méthodes API pures — aucune interface intégrée,
              vous construisez votre propre formulaire et votre propre design.
            </p>
            <CodeBlock language="html" code={`<script src="https://sendavapay.com/sdk/sendavapay.js"></script>`} />
            <CodeBlock language="javascript" code={`// Récupérez le token depuis votre backend (URL param, session, etc.)
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
// → [{ id: '12', name: 'Orange Money', slug: 'orange_sn' }, …]`} />
          </div>

          {/* Étape 3 — Initier */}
          <div id="s-initiate" className="scroll-mt-4 mt-12">
            <h3 className="text-lg font-semibold mb-1">Étape 3 — Initier le paiement Mobile Money</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Lorsque le client soumet votre formulaire. Le SDK appelle <code className="bg-muted px-1 rounded text-xs">POST /api/pay-api/:reference</code>
              (CORS autorisé depuis votre domaine).
            </p>
            <Endpoint method="POST" path="/api/pay-api/:reference" />
            <CodeBlock language="javascript" code={`document.getElementById('pay-btn').addEventListener('click', async () => {
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
});`} />
            <CodeBlock language="json — réponse sans OTP" code={`{
  "success":     true,
  "status":      "processing",
  "requiresOtp": false,
  "reference":   "sdk_lcy0u4wx_a1b2c3d4e5f6g7h8",
  "message":     "Invite de paiement envoyée sur le téléphone du client"
}`} />
            <CodeBlock language="json — réponse avec OTP requis" code={`{
  "success":     true,
  "status":      "processing",
  "requiresOtp": true,
  "payId":       "PAY-XXXXXXXX",
  "orderId":     "ORD-XXXXXXXX",
  "message":     "Code OTP envoyé par SMS au client"
}`} />
          </div>

          {/* Étape 4 — OTP */}
          <div id="s-otp" className="scroll-mt-4 mt-12">
            <h3 className="text-lg font-semibold mb-1">Étape 4 — Vérification OTP</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Certains opérateurs demandent un code OTP envoyé par SMS avant de débiter. Affichez un champ de saisie sur votre page lorsque <code className="bg-muted px-1 rounded text-xs">requiresOtp: true</code>.
            </p>
            <div className="overflow-x-auto rounded-lg border my-4 text-xs">
              <table className="w-full">
                <thead className="bg-muted/70">
                  <tr>
                    <th className="text-left p-3 font-semibold uppercase tracking-wide text-muted-foreground">Opérateur</th>
                    <th className="text-left p-3 font-semibold uppercase tracking-wide text-muted-foreground">Pays</th>
                    <th className="text-left p-3 font-semibold uppercase tracking-wide text-muted-foreground">OTP requis</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Orange Money", "BF, CI, ML, SN, GN", true],
                    ["TMoney / Flooz", "TG", false],
                    ["MTN MoMo", "CM, BJ", false],
                    ["Wave", "SN, CI, ML", false],
                    ["Vodacom M-Pesa", "COD", false],
                    ["Airtel Money", "COD, COG", false],
                    ["MTN Money", "COG", false],
                  ].map(([op, pays, otp]) => (
                    <tr key={String(op)} className="border-t hover:bg-muted/20">
                      <td className="p-3 font-medium">{op}</td>
                      <td className="p-3 text-muted-foreground">{pays}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${otp ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-muted text-muted-foreground"}`}>
                          {otp ? "Oui" : "Non"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Endpoint method="POST" path="/api/pay-api/:reference/verify" />
            <CodeBlock language="javascript" code={`document.getElementById('otp-btn').addEventListener('click', async () => {
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
});`} />
          </div>

          {/* Étape 5 — Statut */}
          <div id="s-status" className="scroll-mt-4 mt-12">
            <h3 className="text-lg font-semibold mb-1">Étape 5 — Statut & confirmation</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Interrogez le statut depuis votre backend jusqu'à confirmation. Votre frontend interroge <em>votre</em> propre endpoint — jamais SendavaPay directement.
            </p>
            <Endpoint method="GET" path="/api/sdk/v1/payment-status/:reference" />
            <MultiCodeBlock tabs={[
              { label: "polling SDK", code:
`// Option A — polling automatique via le SDK navigateur
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
// status.status : 'pending' | 'completed' | 'failed' | 'cancelled'`
              },
              { label: "curl", code:
`curl https://sendavapay.com/api/sdk/v1/payment-status/sdk_lcy0u4wx_a1b2c3d4e5f6g7h8 \\
  -H "Authorization: Bearer ${KEY}"`
              },
              { label: "node.js", code:
`async function checkPaymentStatus(reference) {
  const res = await fetch(
    \`https://sendavapay.com/api/sdk/v1/payment-status/\${reference}\`,
    { headers: { 'Authorization': 'Bearer ${KEY}' } }
  );
  const { data } = await res.json();
  return data;
  // → { reference, status, amount, currency, completedAt }
}`
              },
            ]} />
            <CodeBlock language="json — réponse 200" code={`{
  "success": true,
  "data": {
    "reference":   "sdk_lcy0u4wx_a1b2c3d4e5f6g7h8",
    "status":      "completed",
    "amount":      "5000.00",
    "currency":    "XOF",
    "completedAt": "2026-05-28T10:05:32.000Z"
  }
}`} />
            <InfoBox type="danger" title="Toujours valider côté serveur">
              Ne marquez pas une commande comme payée sur la seule base du frontend.
              Vérifiez le statut via <code>GET /api/sdk/v1/payment-status/:reference</code> depuis votre backend avant de livrer la commande.
            </InfoBox>

            <div className="overflow-x-auto rounded-lg border my-4 text-xs">
              <table className="w-full">
                <thead className="bg-muted/70">
                  <tr>
                    <th className="text-left p-3 font-semibold uppercase tracking-wide text-muted-foreground">Statut</th>
                    <th className="text-left p-3 font-semibold uppercase tracking-wide text-muted-foreground">Afficher au client</th>
                    <th className="text-left p-3 font-semibold uppercase tracking-wide text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["pending",    "Paiement en attente…",               "Afficher spinner"],
                    ["processing", "Confirmez sur votre téléphone",      "Afficher invite téléphone"],
                    ["completed",  "✓ Paiement confirmé",                "Livrer la commande, rediriger"],
                    ["failed",     "✗ Paiement échoué",                  "Afficher erreur, proposer retry"],
                    ["cancelled",  "Paiement annulé",                    "Proposer nouveau paiement"],
                  ].map(([s, display, action]) => (
                    <tr key={s} className="border-t hover:bg-muted/20">
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-mono font-medium ${
                          s === "completed"  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                          s === "failed" || s === "cancelled" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                          "bg-muted text-muted-foreground"
                        }`}>{s}</span>
                      </td>
                      <td className="p-3 text-muted-foreground">{display}</td>
                      <td className="p-3 text-muted-foreground">{action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Liste des transactions */}
          <div id="s-list" className="scroll-mt-4 mt-12">
            <h3 className="text-lg font-semibold mb-1">Liste des transactions</h3>
            <Endpoint method="GET" path="/api/sdk/v1/transactions" />
            <CodeBlock language="curl" code={`curl https://sendavapay.com/api/sdk/v1/transactions \\
  -H "Authorization: Bearer ${KEY}"`} />
            <CodeBlock language="json — réponse 200" code={`{
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
}`} />
          </div>
        </section>

        {/* ─── PAY-OUT ─── */}
        <section id="s-payout">
          <h2 className="text-2xl font-bold border-b pb-3 mb-6">Pay-out — Retrait automatique</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Envoyez de l'argent depuis votre wallet vers un numéro Mobile Money. Uniquement depuis votre backend.
            Les fonds sont débités immédiatement sur votre wallet pays.
          </p>
          <Endpoint method="POST" path="/api/sdk/v1/withdraw" />
          <ParamTable params={[
            { name: "amount",            type: "number",  required: true, description: "Montant à envoyer" },
            { name: "phoneNumber",       type: "string",  required: true, description: "Numéro Mobile Money du bénéficiaire en E.164" },
            { name: "operator",          type: "string",  required: true, description: "Slug opérateur : tmoney, moov, mtn, orange, wave, vodacom, airtel…" },
            { name: "country",           type: "string",  required: true, description: "Code pays ISO 2 lettres (TG, CM, COD, COG…)" },
            { name: "currency",          type: "string",  required: true, description: "Devise : XOF · XAF · GNF · CDF" },
            { name: "description",       type: "string",                  description: "Motif du transfert" },
            { name: "externalReference", type: "string",                  description: "Votre référence paiement fournisseur" },
          ]} />
          <MultiCodeBlock tabs={[
            { label: "curl", code:
`curl -X POST https://sendavapay.com/api/sdk/v1/withdraw \\
  -H "Authorization: Bearer ${KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount":            10000,
    "phoneNumber":       "+22890123456",
    "operator":          "tmoney",
    "country":           "TG",
    "currency":          "XOF",
    "description":       "Paiement fournisseur",
    "externalReference": "payout_456"
  }'`
            },
            { label: "node.js", code:
`const res = await fetch('https://sendavapay.com/api/sdk/v1/withdraw', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${KEY}',
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
const { data } = await res.json();`
            },
            { label: "php", code:
`$response = Http::withHeaders([
  'Authorization' => 'Bearer ${KEY}',
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
$data = $response->json('data');`
            },
          ]} />
          <CodeBlock language="json — réponse 201 Created" code={`{
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
}`} />
          <InfoBox type="info" title="Traitement">
            Les retraits sont traités automatiquement pour les opérateurs pris en charge.
            Un webhook <code>withdrawal.completed</code> est envoyé à votre URL dès que le virement est effectué.
          </InfoBox>
        </section>

        {/* ─── SOLDES ─── */}
        <section id="s-balance">
          <h2 className="text-2xl font-bold border-b pb-3 mb-6">Soldes wallets</h2>
          <p className="text-sm text-muted-foreground mb-4">Consultez le solde de vos wallets. Un wallet par pays, crédité automatiquement à chaque paiement confirmé.</p>
          <Endpoint method="GET" path="/api/sdk/v1/balance" />
          <CodeBlock language="curl" code={`# Tous les wallets
curl https://sendavapay.com/api/sdk/v1/balance \\
  -H "Authorization: Bearer ${KEY}"

# Un seul pays
curl "https://sendavapay.com/api/sdk/v1/balance?country=TG" \\
  -H "Authorization: Bearer ${KEY}"`} />
          <CodeBlock language="json — réponse 200" code={`{
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
}`} />
        </section>

        {/* ─── WEBHOOKS ─── */}
        <section>
          <h2 className="text-2xl font-bold border-b pb-3 mb-2">Webhooks</h2>
          <p className="text-sm text-muted-foreground mb-10">SendavaPay envoie un POST signé sur votre URL dès qu'un événement survient sur une transaction.</p>

          {/* Config */}
          <div id="s-wh-config" className="scroll-mt-4">
            <h3 className="text-lg font-semibold mb-1">Configuration</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Passez <code className="bg-muted px-1 rounded text-xs">webhookUrl</code> à la création du paiement,
              ou configurez une URL globale pour votre clé SDK.
            </p>
            <Endpoint method="PUT" path="/api/sdk/v1/webhook" />
            <CodeBlock language="curl" code={`curl -X PUT https://sendavapay.com/api/sdk/v1/webhook \\
  -H "Authorization: Bearer ${KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{ "webhookUrl": "https://monsite.com/api/webhook/sendavapay" }'`} />
            <CodeBlock language="json — réponse 200" code={`{
  "success": true,
  "data": {
    "webhookUrl":    "https://monsite.com/api/webhook/sendavapay",
    "webhookSecret": "whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "message":       "Webhook configuré avec succès."
  }
}`} />
            <InfoBox type="warning" title="Conservez votre webhookSecret">
              Le <code>webhookSecret</code> est affiché une seule fois. Stockez-le dans une variable d'environnement sur votre serveur — il sert à vérifier la signature HMAC de chaque notification.
            </InfoBox>
          </div>

          {/* Événements */}
          <div id="s-wh-events" className="scroll-mt-4 mt-12">
            <h3 className="text-lg font-semibold mb-3">Types d'événements</h3>
            <div className="overflow-x-auto rounded-lg border text-sm">
              <table className="w-full">
                <thead className="bg-muted/70">
                  <tr>
                    <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Événement</th>
                    <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Déclenché quand</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["payment.completed",    "Paiement confirmé, fonds crédités sur votre wallet"],
                    ["payment.failed",       "Paiement refusé, annulé par le client, ou erreur opérateur"],
                    ["payment.expired",      "Le client n'a pas confirmé avant l'expiration"],
                    ["withdrawal.completed", "Retrait traité avec succès, argent envoyé"],
                    ["withdrawal.failed",    "Retrait échoué (solde insuffisant, numéro invalide…)"],
                  ].map(([event, desc]) => (
                    <tr key={event} className="border-t hover:bg-muted/20">
                      <td className="p-3 font-mono text-xs text-primary">{event}</td>
                      <td className="p-3 text-xs text-muted-foreground">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CodeBlock language="json — payload reçu sur votre webhook" code={`{
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
}`} />
            <CodeBlock language="http — headers envoyés par SendavaPay" code={`POST https://monsite.com/api/webhook/sendavapay
Content-Type: application/json
X-SendavaPay-Signature: sha256=a3f4b5c6d7e8f9...sha256hex...
X-SendavaPay-Event:     payment.completed
X-SendavaPay-Timestamp: 1748426732`} />
          </div>

          {/* Vérification HMAC */}
          <div id="s-wh-hmac" className="scroll-mt-4 mt-12">
            <h3 className="text-lg font-semibold mb-1">Vérification de signature HMAC</h3>
            <InfoBox type="danger" title="Toujours vérifier les signatures">
              Ne traitez jamais un webhook sans vérifier sa signature HMAC. Un webhook non vérifié peut être forgé par un attaquant pour simuler des paiements réussis.
            </InfoBox>
            <p className="text-sm text-muted-foreground mb-3">La signature est calculée ainsi :</p>
            <CodeBlock language="bash" code={`HMAC_SHA256(key=WEBHOOK_SECRET, data=JSON.stringify(body))
# Envoyée dans: X-SendavaPay-Signature: sha256={hex}`} />
            <MultiCodeBlock tabs={[
              { label: "node.js", code:
`const crypto = require('crypto');

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
});`
              },
              { label: "php", code:
`<?php
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
echo json_encode(['received' => true]);`
              },
              { label: "python", code:
`import hmac, hashlib, os
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

    return {'received': True}`
              },
            ]} />
            <InfoBox type="tip" title="Idempotence webhook">
              SendavaPay peut renvoyer le même événement plusieurs fois en cas d'échec de votre endpoint.
              Vérifiez toujours via votre base de données si la <code>reference</code> a déjà été traitée avant d'agir.
            </InfoBox>
          </div>
        </section>

        {/* ─── PAYS & OPÉRATEURS ─── */}
        <section id="s-countries">
          <h2 className="text-2xl font-bold border-b pb-3 mb-6">Pays & Opérateurs</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Chaque paiement est crédité sur le wallet correspondant au pays du payeur. Les fonds d'un pays ne peuvent pas être retirés via le wallet d'un autre pays.
          </p>
          <div className="overflow-x-auto rounded-lg border text-sm">
            <table className="w-full">
              <thead className="bg-muted/70">
                <tr>
                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Pays</th>
                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Code</th>
                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Devise</th>
                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Opérateurs</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["🇹🇬 Togo",               "TG",  "XOF", "TMoney, Moov Money (Flooz)"],
                  ["🇧🇯 Bénin",               "BJ",  "XOF", "MTN MoMo, Moov Money"],
                  ["🇸🇳 Sénégal",             "SN",  "XOF", "Orange Money, Wave, Free Money, Wizall"],
                  ["🇨🇮 Côte d'Ivoire",       "CI",  "XOF", "MTN MoMo, Orange Money, Wave, Moov Money"],
                  ["🇲🇱 Mali",                "ML",  "XOF", "Orange Money, Wave, Moov Money"],
                  ["🇧🇫 Burkina Faso",        "BF",  "XOF", "Orange Money, Moov Money"],
                  ["🇨🇲 Cameroun",            "CM",  "XAF", "MTN MoMo, Orange Money"],
                  ["🇬🇳 Guinée",              "GN",  "GNF", "Orange Money, MTN MoMo, Cellcom"],
                  ["🇨🇩 RD Congo (Congo-Kinshasa)", "COD", "CDF", "Vodacom M-Pesa, Airtel Money, Orange Money"],
                  ["🇨🇬 Congo Brazzaville",  "COG", "XAF", "Airtel Money, MTN Money"],
                ].map(([country, code, currency, ops]) => (
                  <tr key={code} className="border-t hover:bg-muted/20">
                    <td className="p-3 text-xs font-medium">{country}</td>
                    <td className="p-3 font-mono text-xs">{code}</td>
                    <td className="p-3 font-mono text-xs">{currency}</td>
                    <td className="p-3 text-xs text-muted-foreground">{ops}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── STATUTS ─── */}
        <section id="s-statuses">
          <h2 className="text-2xl font-bold border-b pb-3 mb-6">Statuts de transaction</h2>
          <div className="overflow-x-auto rounded-lg border text-sm">
            <table className="w-full">
              <thead className="bg-muted/70">
                <tr>
                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Statut</th>
                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Description</th>
                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Type</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["pending",    "Paiement créé, en attente d'initiation",                   "transitoire"],
                  ["processing", "Invite envoyée, attente confirmation du client",            "transitoire"],
                  ["completed",  "Paiement confirmé, fonds crédités sur le wallet",          "terminal ✓"],
                  ["failed",     "Refusé, annulé ou erreur opérateur",                       "terminal"],
                  ["cancelled",  "Annulé avant traitement",                                  "terminal"],
                ].map(([s, desc, type]) => (
                  <tr key={s} className="border-t hover:bg-muted/20">
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${
                        s === "completed"  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        s === "failed" || s === "cancelled" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        "bg-muted text-muted-foreground"
                      }`}>{s}</span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{desc}</td>
                    <td className="p-3 text-xs text-muted-foreground">{type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── CODES D'ERREUR ─── */}
        <section id="s-errors">
          <h2 className="text-2xl font-bold border-b pb-3 mb-6">Codes d'erreur</h2>
          <CodeBlock language="json — format d'erreur" code={`{
  "success": false,
  "error":   "INSUFFICIENT_BALANCE",
  "code":    "INSUFFICIENT_BALANCE"
}`} />
          <div className="overflow-x-auto rounded-lg border text-sm mt-4">
            <table className="w-full">
              <thead className="bg-muted/70">
                <tr>
                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">HTTP</th>
                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Code</th>
                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["400", "INVALID_REQUEST",      "Paramètres manquants ou malformés"],
                  ["400", "DUPLICATE_REFERENCE",  "externalReference déjà utilisée pour un paiement actif"],
                  ["400", "INSUFFICIENT_BALANCE", "Solde insuffisant sur le wallet pour le retrait"],
                  ["400", "UNSUPPORTED_COUNTRY",  "Code pays non pris en charge"],
                  ["400", "WALLET_NOT_FOUND",     "Wallet du pays introuvable sur votre compte"],
                  ["401", "UNAUTHORIZED",         "Header Authorization manquant ou malformé"],
                  ["401", "INVALID_API_KEY",      "Clé SDK invalide ou inexistante"],
                  ["403", "API_KEY_INACTIVE",     "Clé SDK désactivée"],
                  ["403", "SDK_NOT_ENABLED",      "Accès SDK non activé sur ce compte — contactez le support"],
                  ["403", "ACCOUNT_NOT_VERIFIED", "KYC non validé — complétez la vérification de votre compte"],
                  ["404", "NOT_FOUND",            "Transaction introuvable pour cette référence"],
                  ["503", "API_MAINTENANCE",      "API temporairement en maintenance"],
                ].map(([http, code, desc], i) => (
                  <tr key={i} className="border-t hover:bg-muted/20">
                    <td className="p-3 font-mono text-xs text-muted-foreground">{http}</td>
                    <td className="p-3 font-mono text-xs text-primary">{code}</td>
                    <td className="p-3 text-xs text-muted-foreground">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── RATE LIMITING ─── */}
        <section id="s-rate" className="pb-16">
          <h2 className="text-2xl font-bold border-b pb-3 mb-6">Rate Limiting</h2>
          <p className="text-sm text-muted-foreground mb-4">Chaque clé SDK est limitée en nombre de requêtes par minute pour garantir la stabilité du service.</p>
          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            {[
              ["100 req / min", "Par clé SDK"],
              ["5 secondes",    "Intervalle polling recommandé"],
              ["Retry 429",     "Backoff avant de réessayer"],
            ].map(([val, label]) => (
              <div key={val} className="p-4 rounded-lg border bg-muted/30 text-center">
                <p className="text-lg font-bold text-primary">{val}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <CodeBlock language="json — réponse HTTP 429" code={`HTTP/1.1 429 Too Many Requests
{
  "success": false,
  "error":   "Trop de requêtes. Réessayez dans 60 secondes.",
  "code":    "RATE_LIMITED"
}`} />
          <InfoBox type="tip" title="Bonne pratique">
            Implémentez un backoff exponentiel sur les réponses 429. Pour le polling de statut, utilisez un intervalle de 5 secondes minimum — ne sondez pas plus d'une fois par seconde.
          </InfoBox>
        </section>

      </div>
    </div>
  );
}

export default function ApiKeysPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [newKeyName, setNewKeyName] = useState("");
  const [appName, setAppName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [selectedType, setSelectedType] = useState<"sdk" | "redirect" | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: maintenanceStatus, isLoading: maintenanceLoading } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/api-maintenance-status"],
    refetchInterval: 10000,
  });

  const { data: permissions, isLoading: permissionsLoading } = useQuery<ApiPermissions>({
    queryKey: ["/api/user/api-permissions"],
    enabled: !!user?.isVerified,
  });

  const { data: apiKeys = [], isLoading: keysLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/api-keys"],
    enabled: !!user?.isVerified && !maintenanceStatus?.enabled,
  });

  const createKeyMutation = useMutation({
    mutationFn: async (data: { name: string; appName?: string; webhookUrl?: string; redirectUrl?: string; apiType: string }) => {
      const res = await apiRequest("POST", "/api/api-keys", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      setNewKeyName("");
      setAppName("");
      setWebhookUrl("");
      setRedirectUrl("");
      setSelectedType(null);
      setShowCreateForm(false);
      toast({ title: "Clé créée", description: "Votre nouvelle clé API a été créée avec succès" });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message || "Impossible de créer la clé", variant: "destructive" });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({ title: "Clé supprimée" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer la clé", variant: "destructive" });
    },
  });

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast({ title: "Copié" });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast({ title: "Erreur", description: "Veuillez entrer un nom pour la clé", variant: "destructive" });
      return;
    }
    if (!selectedType) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un type d'API", variant: "destructive" });
      return;
    }
    createKeyMutation.mutate({
      name: newKeyName.trim(),
      appName: appName.trim() || undefined,
      webhookUrl: webhookUrl.trim() || undefined,
      redirectUrl: redirectUrl.trim() || undefined,
      apiType: selectedType,
    });
  };

  if (authLoading || maintenanceLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (maintenanceStatus?.enabled) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <Card className="max-w-lg w-full text-center">
            <CardHeader>
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Wrench className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-2xl">API en maintenance</CardTitle>
              <CardDescription className="text-base">L'API est temporairement indisponible</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour au tableau de bord
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!user?.isVerified) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-bold">API de Paiement</h1>
            <p className="text-muted-foreground">Intégrez SendavaPay dans vos applications</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-yellow-500" />
                Vérification requise
              </CardTitle>
              <CardDescription>Votre compte doit être vérifié pour accéder à l'API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Pour des raisons de sécurité, seuls les comptes vérifiés peuvent accéder à l'API SendavaPay.
                Complétez votre vérification KYC pour obtenir vos clés API.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/dashboard/kyc">
                  <Button>
                    <Shield className="h-4 w-4 mr-2" />
                    Vérifier mon compte
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const sdkEnabled = permissions?.apiSdkEnabled ?? false;
  const redirectEnabled = permissions?.apiRedirectEnabled ?? true;

  const sdkKeys = apiKeys.filter((k) => k.apiType === "sdk");
  const redirectKeys = apiKeys.filter((k) => k.apiType === "redirect");

  const KeyCard = ({ keyItem }: { keyItem: ApiKey }) => (
    <div className="flex flex-col gap-3 p-4 border rounded-lg" data-testid={`api-key-${keyItem.id}`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{keyItem.name}</span>
            <Badge variant={keyItem.isActive ? "default" : "secondary"}>
              {keyItem.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline" className={keyItem.apiType === "sdk" ? "border-purple-400 text-purple-700 dark:text-purple-300" : ""}>
              {keyItem.apiType === "sdk" ? "SDK" : "Redirection"}
            </Badge>
          </div>
          {keyItem.appName && (
            <p className="text-sm text-muted-foreground">Application : {keyItem.appName}</p>
          )}
          <code className="text-sm text-muted-foreground font-mono block truncate">{keyItem.apiKey}</code>
          <p className="text-xs text-muted-foreground">
            Créée le {new Date(keyItem.createdAt).toLocaleDateString("fr-FR")}
            {keyItem.requestCount > 0 && ` • ${keyItem.requestCount} requêtes`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => copyToClipboard(keyItem.apiKey)} data-testid={`button-copy-${keyItem.id}`}>
            {copiedKey === keyItem.apiKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setKeyToDelete(keyItem)} disabled={deleteKeyMutation.isPending} data-testid={`button-delete-${keyItem.id}`}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
      {(keyItem.redirectUrl || keyItem.webhookUrl) && (
        <div className="space-y-2 border-t pt-3">
          <div className="flex flex-wrap gap-4 text-xs">
            {keyItem.redirectUrl && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
                <span>Redirection:</span>
                <span className="font-mono truncate max-w-[200px]">{keyItem.redirectUrl}</span>
              </div>
            )}
            {keyItem.webhookUrl && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Bell className="h-3 w-3" />
                <span>Webhook:</span>
                <span className="font-mono truncate max-w-[200px]">{keyItem.webhookUrl}</span>
              </div>
            )}
          </div>
          {keyItem.webhookSecret && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Webhook Secret:</span>
              <code className="font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded truncate max-w-[200px]">
                {keyItem.webhookSecret}
              </code>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(keyItem.webhookSecret!)} data-testid={`button-copy-secret-${keyItem.id}`}>
                {copiedKey === keyItem.webhookSecret ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">API de Paiement</h1>
            <p className="text-muted-foreground">Gérez vos clés d'intégration SendavaPay</p>
          </div>
        </div>

        {/* When SDK is enabled: show type selection or SDK-specific form */}
        {sdkEnabled && !selectedType && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Créer une clé API
              </CardTitle>
              <CardDescription>Choisissez le type d'intégration adapté à votre projet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  className="p-5 border-2 rounded-xl text-left hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group"
                  onClick={() => setSelectedType("sdk")}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                      <Code2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold">API SDK</p>
                      <p className="text-xs text-muted-foreground">Intégration complète</p>
                    </div>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2"><Check className="h-3 w-3 text-green-500 flex-shrink-0" /> Paiements avec routage par pays</li>
                    <li className="flex items-center gap-2"><Check className="h-3 w-3 text-green-500 flex-shrink-0" /> Retrait automatique Mobile Money</li>
                    <li className="flex items-center gap-2"><Check className="h-3 w-3 text-green-500 flex-shrink-0" /> Gestion des wallets par pays</li>
                    <li className="flex items-center gap-2"><Check className="h-3 w-3 text-green-500 flex-shrink-0" /> Webhooks + Documentation complète</li>
                  </ul>
                </button>
                <button
                  className="p-5 border-2 rounded-xl text-left hover:border-primary hover:bg-primary/5 transition-all group"
                  onClick={() => setSelectedType("redirect")}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                      <ExternalLink className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold">API Redirection</p>
                      <p className="text-xs text-muted-foreground">Simple et rapide</p>
                    </div>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2"><Check className="h-3 w-3 text-green-500 flex-shrink-0" /> Liens de paiement générés</li>
                    <li className="flex items-center gap-2"><Check className="h-3 w-3 text-green-500 flex-shrink-0" /> Redirection après paiement</li>
                    <li className="flex items-center gap-2"><Check className="h-3 w-3 text-green-500 flex-shrink-0" /> Notifications webhook</li>
                    <li className="flex items-center gap-2"><Check className="h-3 w-3 text-green-500 flex-shrink-0" /> Intégration sans SDK</li>
                  </ul>
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create key form — SDK mode (with back button) or Redirect mode */}
        {((sdkEnabled && selectedType) || (!sdkEnabled && showCreateForm)) && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {selectedType === "sdk" ? (
                    <><Code2 className="h-5 w-5 text-purple-600" /> Nouvelle clé API SDK</>
                  ) : (
                    <><Key className="h-5 w-5 text-primary" /> Nouvelle clé API</>
                  )}
                </CardTitle>
                {sdkEnabled && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedType(null)} data-testid="button-back-type">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Changer
                  </Button>
                )}
                {!sdkEnabled && (
                  <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)} data-testid="button-cancel-create">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Annuler
                  </Button>
                )}
              </div>
              <CardDescription>
                {selectedType === "sdk"
                  ? "Clé pour l'intégration SDK complète avec retrait automatique"
                  : "Clé pour la création de liens de paiement avec redirection"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="keyName">Nom de la clé *</Label>
                  <Input
                    id="keyName"
                    placeholder="Ex: Mon site e-commerce"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    data-testid="input-key-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appName">Nom de l'application</Label>
                  <Input
                    id="appName"
                    placeholder="Ex: MaBoutique.com"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    data-testid="input-app-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="redirectUrl">URL de redirection (après paiement)</Label>
                <Input
                  id="redirectUrl"
                  type="url"
                  placeholder="https://monsite.com/paiement/succes"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  data-testid="input-redirect-url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">
                  <div className="flex items-center gap-2">
                    <Webhook className="h-4 w-4" />
                    URL de webhook (notifications automatiques)
                  </div>
                </Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  placeholder="https://monsite.com/api/webhook/sendavapay"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  data-testid="input-webhook-url"
                />
                <p className="text-xs text-muted-foreground">
                  SendavaPay enverra une notification POST sécurisée à cette URL lors de chaque paiement
                </p>
              </div>

              <Button
                onClick={handleCreateKey}
                disabled={createKeyMutation.isPending}
                className={selectedType === "sdk" ? "bg-purple-600 hover:bg-purple-700" : ""}
                data-testid="button-create-key"
              >
                {createKeyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Key className="h-4 w-4 mr-2" />
                )}
                Générer la clé
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Keys list */}
        {!permissionsLoading && (
          <>
            {sdkEnabled ? (
              <Tabs defaultValue={sdkKeys.length > 0 ? "sdk" : "redirect"}>
                <TabsList>
                  <TabsTrigger value="sdk" className="gap-2">
                    <Code2 className="h-4 w-4" />
                    Clés SDK
                    {sdkKeys.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 text-xs">{sdkKeys.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="redirect" className="gap-2">
                    <Globe className="h-4 w-4" />
                    Clés Redirection
                    {redirectKeys.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 text-xs">{redirectKeys.length}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="sdk" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Code2 className="h-4 w-4 text-purple-600" />
                        Clés API SDK
                      </CardTitle>
                      <CardDescription>{sdkKeys.length} clé{sdkKeys.length !== 1 ? "s" : ""} SDK</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {keysLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                      ) : sdkKeys.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Code2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>Aucune clé SDK créée</p>
                          <p className="text-sm">Cliquez sur "Créer une clé API" pour commencer</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sdkKeys.map((key) => <KeyCard key={key.id} keyItem={key} />)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-purple-600" />
                      Documentation API SDK
                    </h2>
                    <SdkDocumentation apiKeys={apiKeys} />
                  </div>
                </TabsContent>

                <TabsContent value="redirect" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Globe className="h-4 w-4 text-blue-600" />
                        Clés API Redirection
                      </CardTitle>
                      <CardDescription>{redirectKeys.length} clé{redirectKeys.length !== 1 ? "s" : ""} Redirection</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {keysLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                      ) : redirectKeys.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>Aucune clé créée</p>
                          <p className="text-sm">Cliquez sur "Créer une clé API" pour commencer</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {redirectKeys.map((key) => <KeyCard key={key.id} keyItem={key} />)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <BookOpen className="h-4 w-4" />
                        Documentation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Link href="/docs">
                        <Button variant="outline" data-testid="button-docs-redirect">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Voir la documentation
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              /* Redirect-only mode: no tabs, no SDK mentions */
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Key className="h-4 w-4 text-primary" />
                          Mes clés API
                        </CardTitle>
                        <CardDescription>{redirectKeys.length} clé{redirectKeys.length !== 1 ? "s" : ""}</CardDescription>
                      </div>
                      {!showCreateForm && (
                        <Button size="sm" onClick={() => { setShowCreateForm(true); setSelectedType("redirect"); }} data-testid="button-new-key">
                          <Plus className="h-4 w-4 mr-2" />
                          Nouvelle clé
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {keysLoading ? (
                      <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : redirectKeys.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Aucune clé créée</p>
                        <Button className="mt-3" size="sm" onClick={() => { setShowCreateForm(true); setSelectedType("redirect"); }} data-testid="button-create-first-key">
                          <Plus className="h-4 w-4 mr-2" />
                          Créer ma première clé
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {redirectKeys.map((key) => <KeyCard key={key.id} keyItem={key} />)}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Documentation API</p>
                        <p className="text-sm text-muted-foreground">Consultez la documentation pour intégrer SendavaPay dans votre application</p>
                      </div>
                      <Link href="/docs">
                        <Button variant="outline" data-testid="button-docs">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Voir la documentation
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>

      <AlertDialog open={!!keyToDelete} onOpenChange={(open) => !open && setKeyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette clé API ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la clé "{keyToDelete?.name}" ?
              Cette action est irréversible et toutes les intégrations utilisant cette clé cesseront de fonctionner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (keyToDelete) {
                  deleteKeyMutation.mutate(keyToDelete.id);
                  setKeyToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteKeyMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
