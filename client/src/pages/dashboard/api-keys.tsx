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
  Terminal, Webhook, Pencil, X, Save, ImageIcon, Upload,
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

function Endpoint({ method, path, description }: { method: string; path: string; description?: string }) {
  const colors: Record<string, string> = {
    POST:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    GET:    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    PUT:    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <div className="my-4 p-3 bg-muted/40 rounded-lg border">
      <div className="flex items-center gap-3">
        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold font-mono flex-shrink-0 ${colors[method] || "bg-muted text-muted-foreground"}`}>{method}</span>
        <code className="text-sm text-foreground font-mono">{path}</code>
      </div>
      {description && <p className="mt-1.5 text-xs text-muted-foreground pl-1">{description}</p>}
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

export function SdkDocumentation({ apiKeys }: { apiKeys: ApiKey[] }) {
  const sdkKeys = apiKeys.filter((k) => k.apiType === "sdk" && k.isActive);
  const KEY = sdkKeys[0]?.apiKey || "sdk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  type NavItem = { id?: string; label: string; children?: { id: string; label: string }[] };
  const nav: NavItem[] = [
    { id: "s-intro",   label: "Introduction" },
    { id: "s-auth",    label: "Authentification" },
    { label: "API Backend (server-side)", children: [
      { id: "s-create",    label: "Créer un paiement" },
      { id: "s-status",    label: "Statut d'un paiement" },
      { id: "s-verify",    label: "Vérifier un paiement" },
      { id: "s-list",      label: "Lister les transactions" },
      { id: "s-withdraw",              label: "Retrait (pay-out)" },
      { id: "s-withdrawals-list",      label: "Lister les retraits" },
      { id: "s-validate-withdraw",     label: "Valider un retrait" },
      { id: "s-withdraw-status",       label: "Statut d'un retrait" },
      { id: "s-payout-status",         label: "Dispo. opérateurs payout" },
      { id: "s-operators-status",      label: "Statuts opérateurs" },
      { id: "s-balance",               label: "Soldes wallets" },
      { id: "s-health",                label: "Health check" },
    ]},
    { label: "API Client (CORS)", children: [
      { id: "s-token",     label: "Détails par token" },
      { id: "s-countries", label: "Pays disponibles" },
      { id: "s-operators", label: "Opérateurs par pays" },
      { id: "s-initiate",  label: "Initier le paiement" },
      { id: "s-otp",       label: "Soumettre OTP" },
    ]},
    { label: "Webhooks", children: [
      { id: "s-wh-config",    label: "Configuration" },
      { id: "s-wh-retry",     label: "Retry automatique" },
      { id: "s-wh-events",    label: "Événements" },
      { id: "s-wh-payload",   label: "Payload & headers" },
      { id: "s-wh-signature", label: "Vérification HMAC" },
      { id: "s-wh-test",      label: "Tester le webhook" },
    ]},
    { id: "s-operators",  label: "Pays & Opérateurs" },
    { id: "s-statuses",   label: "Statuts de transaction" },
    { id: "s-errors",     label: "Codes d'erreur" },
    { id: "s-rate",       label: "Rate Limiting" },
  ];

  return (
    <div className="flex -mx-6 border-t min-h-screen">

      {/* ── SIDEBAR ── */}
      <nav className="hidden xl:flex flex-col w-52 flex-shrink-0 border-r bg-muted/20 sticky top-0 max-h-screen overflow-y-auto py-5 gap-0.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 mb-2">SDK API v3</p>
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
            depuis votre infrastructure. Vous construisez votre propre interface — aucune redirection, aucun composant SendavaPay.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">API Backend (server-side)</p>
              <p className="text-xs text-muted-foreground">Authentifiée avec votre clé <code>sdk_</code>. Créer paiements, retraits, consulter soldes & transactions.</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">API Client (CORS)</p>
              <p className="text-xs text-muted-foreground">Endpoints CORS ouverts, authentifiés par <code>paymentToken</code> temporaire. Utilisables depuis n'importe quel frontend.</p>
            </div>
          </div>
          <InfoBox type="danger" title="Clé SDK — server-side uniquement">
            Votre clé <code>sdk_…</code> ne doit exister que sur votre serveur. Ne l'exposez jamais dans le code frontend.
            Utilisez les endpoints <strong>API Client</strong> (CORS) depuis votre frontend — ils n'ont pas besoin de la clé SDK.
          </InfoBox>
        </section>

        {/* ─── AUTHENTIFICATION ─── */}
        <section id="s-auth">
          <h2 className="text-2xl font-bold border-b pb-3 mb-6">Authentification</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Tous les endpoints <strong>Backend</strong> exigent votre clé SDK dans le header <code className="bg-muted px-1 rounded">Authorization</code>.
            Les endpoints <strong>Client (CORS)</strong> s'authentifient via le <code>paymentToken</code> retourné par <code>POST /create-payment</code>.
          </p>
          <CodeBlock language="http" code={`Authorization: Bearer ${KEY}
Content-Type: application/json

Base URL: https://sendavapay.com/api/sdk/v1`} />
          <div className="overflow-x-auto rounded-lg border my-4 text-sm">
            <table className="w-full">
              <thead className="bg-muted/70">
                <tr>
                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Type</th>
                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Préfixe</th>
                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Utilisation</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3 text-xs">Clé SDK</td>
                  <td className="p-3 font-mono text-xs">sdk_</td>
                  <td className="p-3 text-xs text-muted-foreground">Header Authorization — endpoints backend uniquement</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3 text-xs">Payment Token</td>
                  <td className="p-3 font-mono text-xs">pay_tok_</td>
                  <td className="p-3 text-xs text-muted-foreground">Validité 30 min — endpoints client CORS</td>
                </tr>
              </tbody>
            </table>
          </div>
          <InfoBox type="warning" title="Prérequis">
            KYC validé et accès SDK activé par l'administrateur.
          </InfoBox>
        </section>

        {/* ─── API BACKEND ─── */}
        <section>
          <h2 className="text-2xl font-bold border-b pb-3 mb-2">API Backend</h2>
          <p className="text-sm text-muted-foreground mb-10">Endpoints authentifiés par votre clé SDK. À appeler uniquement depuis votre serveur.</p>

          {/* create-payment */}
          <div id="s-create" className="scroll-mt-4 mb-14">
            <h3 className="text-lg font-semibold mb-1">Créer un paiement</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Crée une transaction et retourne un <code className="bg-muted px-1 rounded text-xs">paymentToken</code> (valide 30 min)
              ainsi qu'une <code className="bg-muted px-1 rounded text-xs">reference</code> à stocker.
              Transmettez le token à votre frontend pour authentifier les appels client.
            </p>
            <Endpoint method="POST" path="/api/sdk/v1/create-payment" />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Corps de la requête</h4>
            <ParamTable params={[
              { name: "amount",            type: "number",  required: true,  description: "Montant en unité de la devise (ex. 5000 = 5 000 XOF)" },
              { name: "currency",          type: "string",  required: true,  description: "XOF · XAF · GNF · CDF" },
              { name: "description",       type: "string",                   description: "Description de la transaction (max 255 car.)" },
              { name: "customerName",      type: "string",                   description: "Nom du client" },
              { name: "customerEmail",     type: "string",                   description: "Email du client" },
              { name: "customerPhone",     type: "string",                   description: "Téléphone en E.164 (+22890000000)" },
              { name: "payerCountry",      type: "string",                   description: "Code pays ISO (TG, SN, CM…) — détermine le wallet crédité" },
              { name: "webhookUrl",        type: "string",                   description: "URL HTTPS de notification (écrase l'URL globale de la clé)" },
              { name: "externalReference", type: "string",                   description: "Votre référence commande pour idempotence (max 128 car.)" },
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
    "webhookUrl": "https://monsite.com/webhooks/sendavapay",
    "externalReference": "order_1234"
  }'`
              },
              { label: "node.js", code:
`const res = await fetch('https://sendavapay.com/api/sdk/v1/create-payment', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${KEY}',
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
const { data } = await res.json();`
              },
              { label: "php", code:
`$res = Http::withHeaders([
  'Authorization' => 'Bearer ${KEY}',
  'Content-Type'  => 'application/json',
])->post('https://sendavapay.com/api/sdk/v1/create-payment', [
  'amount'            => 5000,
  'currency'          => 'XOF',
  'description'       => 'Commande #1234',
  'payerCountry'      => 'TG',
  'webhookUrl'        => 'https://monsite.com/webhooks/sendavapay',
  'externalReference' => 'order_1234',
]);
$data = $res->json('data');`
              },
            ]} />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Réponse <span className="text-green-600 dark:text-green-400">201 Created</span></h4>
            <CodeBlock language="json" code={`{
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
            <InfoBox type="tip" title="Idempotence">
              Si vous relancez la même <code>externalReference</code> alors qu'un paiement est déjà <code>pending</code> ou <code>completed</code>,
              vous recevrez une erreur <code>409 DUPLICATE_REFERENCE</code>. Aucun doublon n'est créé.
            </InfoBox>
          </div>

          {/* payment-status */}
          <div id="s-status" className="scroll-mt-4 mb-14">
            <h3 className="text-lg font-semibold mb-1">Statut d'un paiement</h3>
            <p className="text-sm text-muted-foreground mb-3">Retourne le statut actuel d'une transaction.</p>
            <Endpoint method="GET" path="/api/sdk/v1/payment-status/:reference" />
            <CodeBlock language="curl" code={`curl https://sendavapay.com/api/sdk/v1/payment-status/sdk_lcy0u4wx_a1b2c3d4e5f6g7h8 \\
  -H "Authorization: Bearer ${KEY}"`} />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Réponse <span className="text-green-600 dark:text-green-400">200 OK</span></h4>
            <CodeBlock language="json" code={`{
  "success": true,
  "data": {
    "reference":   "sdk_lcy0u4wx_a1b2c3d4e5f6g7h8",
    "status":      "completed",
    "amount":      "5000.00",
    "currency":    "XOF",
    "completedAt": "2026-05-28T10:05:32.000Z"
  }
}`} />
          </div>

          {/* verify-payment */}
          <div id="s-verify" className="scroll-mt-4 mb-14">
            <h3 className="text-lg font-semibold mb-1">Vérifier un paiement</h3>
            <p className="text-sm text-muted-foreground mb-3">Retourne les détails complets d'une transaction. À utiliser côté serveur pour valider avant de livrer une commande.</p>
            <Endpoint method="POST" path="/api/sdk/v1/verify-payment" />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Corps de la requête</h4>
            <ParamTable params={[
              { name: "reference", type: "string", required: true, description: "Référence de la transaction retournée par create-payment" },
            ]} />
            <CodeBlock language="curl" code={`curl -X POST https://sendavapay.com/api/sdk/v1/verify-payment \\
  -H "Authorization: Bearer ${KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{ "reference": "sdk_lcy0u4wx_a1b2c3d4e5f6g7h8" }'`} />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Réponse <span className="text-green-600 dark:text-green-400">200 OK</span></h4>
            <CodeBlock language="json" code={`{
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
}`} />
          </div>

          {/* transactions */}
          <div id="s-list" className="scroll-mt-4 mb-14">
            <h3 className="text-lg font-semibold mb-1">Lister les transactions</h3>
            <p className="text-sm text-muted-foreground mb-3">Retourne toutes les transactions (pay-in + pay-out) de votre compte.</p>
            <Endpoint method="GET" path="/api/sdk/v1/transactions" />
            <CodeBlock language="curl" code={`curl https://sendavapay.com/api/sdk/v1/transactions \\
  -H "Authorization: Bearer ${KEY}"`} />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Réponse <span className="text-green-600 dark:text-green-400">200 OK</span></h4>
            <CodeBlock language="json" code={`{
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

          {/* withdraw */}
          <div id="s-withdraw" className="scroll-mt-4 mb-14">
            <h3 className="text-lg font-semibold mb-1">Retrait — Pay-out</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Envoie de l'argent depuis votre wallet vers un numéro Mobile Money. Les fonds sont débités immédiatement du wallet pays correspondant.
            </p>
            <Endpoint method="POST" path="/api/sdk/v1/withdraw" />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Corps de la requête</h4>
            <ParamTable params={[
              { name: "amount",            type: "number",  required: true, description: "Montant à envoyer" },
              { name: "phoneNumber",       type: "string",  required: true, description: "Numéro Mobile Money du bénéficiaire en E.164" },
              { name: "operator",          type: "string",  required: true, description: "Slug opérateur : tmoney, moov, mtn, orange, wave, vodacom, airtel…" },
              { name: "country",           type: "string",  required: true, description: "Code pays ISO (TG, CM, COD, COG…)" },
              { name: "currency",          type: "string",  required: true, description: "XOF · XAF · GNF · CDF" },
              { name: "description",       type: "string",                  description: "Motif du transfert" },
              { name: "externalReference", type: "string",                  description: "Votre référence paiement fournisseur" },
            ]} />
            <MultiCodeBlock tabs={[
              { label: "curl", code:
`curl -X POST https://sendavapay.com/api/sdk/v1/withdraw \\
  -H "Authorization: Bearer ${KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 10000,
    "phoneNumber": "+22890123456",
    "operator": "tmoney",
    "country": "TG",
    "currency": "XOF",
    "description": "Paiement fournisseur",
    "externalReference": "payout_456"
  }'`
              },
              { label: "node.js", code:
`const res = await fetch('https://sendavapay.com/api/sdk/v1/withdraw', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${KEY}',
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
const { data } = await res.json();`
              },
              { label: "php", code:
`$res = Http::withHeaders([
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
]);`
              },
            ]} />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Réponse <span className="text-green-600 dark:text-green-400">201 Created</span></h4>
            <CodeBlock language="json" code={`{
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
}`} />
            <InfoBox type="info" title="Traitement asynchrone">
              Les retraits sont traités de façon <strong>asynchrone</strong> via une file d'attente (queue + worker).
              Le statut initial est toujours <code>queued</code>. Suivez l'évolution via <code>GET /withdrawal-status/:ref</code>
              ou recevez le résultat final par webhook <code>withdrawal.completed</code> / <code>withdrawal.failed</code>.
            </InfoBox>
          </div>

          {/* withdrawals-list */}
          <div id="s-withdrawals-list" className="scroll-mt-4 mb-14">
            <h3 className="text-lg font-semibold mb-1">Lister les retraits</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Retourne la liste paginée de vos retraits. Filtrable par pays, statut et date.
            </p>
            <Endpoint method="GET" path="/api/sdk/v1/withdrawals" />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Paramètres de requête</h4>
            <ParamTable params={[
              { name: "country", type: "string", description: "Filtrer par pays ISO (ex. TG, CM)" },
              { name: "status",  type: "string", description: "Filtrer par statut : queued · processing · completed · failed · cancelled" },
              { name: "from",    type: "string", description: "Date de début ISO 8601 (ex. 2026-05-01)" },
              { name: "to",      type: "string", description: "Date de fin ISO 8601 (ex. 2026-05-31)" },
              { name: "limit",   type: "number", description: "Nombre de résultats par page (défaut 20, max 100)" },
              { name: "offset",  type: "number", description: "Décalage pour la pagination (défaut 0)" },
            ]} />
            <CodeBlock language="javascript" code={`const res = await fetch(
  'https://sendavapay.com/api/sdk/v1/withdrawals?country=TG&status=completed&limit=20',
  { headers: { 'Authorization': 'Bearer \${KEY}' } }
);
const { data } = await res.json();
console.log(\`\${data.total} retraits, page \${data.offset / data.limit + 1}\`);`} />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Réponse <span className="text-green-600 dark:text-green-400">200 OK</span></h4>
            <CodeBlock language="json" code={`{
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
}`} />
          </div>

          {/* validate-withdrawal */}
          <div id="s-validate-withdraw" className="scroll-mt-4 mb-14">
            <h3 className="text-lg font-semibold mb-1">Valider un retrait <span className="ml-2 text-xs font-normal text-muted-foreground">(dry-run)</span></h3>
            <p className="text-sm text-muted-foreground mb-3">
              Vérifie qu'un retrait peut être effectué <strong>sans l'exécuter</strong>. Idéal pour afficher les frais et valider le formulaire côté client avant confirmation.
            </p>
            <Endpoint method="POST" path="/api/sdk/v1/validate-withdrawal" />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Corps de la requête</h4>
            <ParamTable params={[
              { name: "amount",      type: "number", required: true, description: "Montant à vérifier" },
              { name: "phoneNumber", type: "string", required: true, description: "Numéro E.164 du bénéficiaire" },
              { name: "operator",    type: "string", required: true, description: "Slug opérateur (tmoney, moov, mtn…)" },
              { name: "country",     type: "string", required: true, description: "Code pays ISO (TG, CM, COD…)" },
              { name: "currency",    type: "string", required: false, description: "Devise (défaut XOF)" },
            ]} />
            <MultiCodeBlock tabs={[
              { label: "curl", code:
`curl -X POST https://sendavapay.com/api/sdk/v1/validate-withdrawal \\
  -H "Authorization: Bearer \${KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 10000,
    "phoneNumber": "+22890123456",
    "operator": "tmoney",
    "country": "TG",
    "currency": "XOF"
  }'`
              },
              { label: "node.js", code:
`const res = await fetch('https://sendavapay.com/api/sdk/v1/validate-withdrawal', {
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
}`
              },
            ]} />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Réponse <span className="text-green-600 dark:text-green-400">200 OK</span></h4>
            <CodeBlock language="json" code={`{
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
}`} />
            <InfoBox type="warning" title="Erreur côté validation">
              Si <code>success: false</code>, le champ <code>code</code> indique la raison exacte :
              <code>INSUFFICIENT_BALANCE</code>, <code>PAYOUT_OPERATOR_OFFLINE</code>, <code>INVALID_PHONE_FORMAT</code>, <code>OPERATOR_COUNTRY_MISMATCH</code>…
            </InfoBox>
          </div>

          {/* withdrawal-status */}
          <div id="s-withdraw-status" className="scroll-mt-4 mb-14">
            <h3 className="text-lg font-semibold mb-1">Statut d'un retrait</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Suivez l'état d'un retrait à tout moment à partir de sa référence. Utilisez-le après un <code>POST /withdraw</code> pour savoir si le virement a été effectué.
            </p>
            <Endpoint method="GET" path="/api/sdk/v1/withdrawal-status/:reference" />
            <MultiCodeBlock tabs={[
              { label: "curl", code:
`curl https://sendavapay.com/api/sdk/v1/withdrawal-status/sdk_lcy1a3bx_z9y8w7v6u5t4s3r2 \\
  -H "Authorization: Bearer \${KEY}"`
              },
              { label: "node.js", code:
`const ref = 'sdk_lcy1a3bx_z9y8w7v6u5t4s3r2';
const res = await fetch(\`https://sendavapay.com/api/sdk/v1/withdrawal-status/\${ref}\`, {
  headers: { 'Authorization': 'Bearer \${KEY}' },
});
const { data } = await res.json();
console.log(data.status, data.statusLabel);`
              },
            ]} />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Réponse <span className="text-green-600 dark:text-green-400">200 OK</span></h4>
            <CodeBlock language="json" code={`{
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
}`} />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Statuts possibles</h4>
            <div className="overflow-x-auto rounded-lg border text-sm">
              <table className="w-full">
                <thead className="bg-muted/70">
                  <tr>
                    <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Statut</th>
                    <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["queued",           "En file d'attente — le worker va le traiter"],
                    ["processing",       "En cours de traitement chez l'opérateur"],
                    ["provider_pending", "En attente de confirmation du fournisseur"],
                    ["completed",        "Retrait effectué avec succès"],
                    ["failed",           "Retrait échoué — fonds non débités"],
                    ["reversed",         "Fonds retournés sur le wallet après échec"],
                    ["cancelled",        "Retrait annulé avant traitement"],
                  ].map(([s, d], i) => (
                    <tr key={i} className="border-t hover:bg-muted/20">
                      <td className="p-3 font-mono text-xs">{s}</td>
                      <td className="p-3 text-xs text-muted-foreground">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* payout-status */}
          <div id="s-payout-status" className="scroll-mt-4 mb-14">
            <h3 className="text-lg font-semibold mb-1">Disponibilité opérateurs pay-out</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Retourne le statut temps réel de chaque opérateur pour les retraits. Filtrez par pays avec <code className="bg-muted px-1 rounded text-xs">?country=TG</code>.
            </p>
            <Endpoint method="GET" path="/api/sdk/v1/payout-status?country=TG" />
            <MultiCodeBlock tabs={[
              { label: "curl", code:
`# Tous les pays
curl https://sendavapay.com/api/sdk/v1/payout-status \\
  -H "Authorization: Bearer \${KEY}"

# Filtrer par pays
curl "https://sendavapay.com/api/sdk/v1/payout-status?country=TG" \\
  -H "Authorization: Bearer \${KEY}"`
              },
              { label: "node.js", code:
`const res = await fetch('https://sendavapay.com/api/sdk/v1/payout-status?country=TG', {
  headers: { 'Authorization': 'Bearer \${KEY}' },
});
const { data } = await res.json();
const online = data.operators.filter(op => op.payoutStatus === 'online');
console.log(\`\${data.summary.online} opérateurs disponibles au Togo\`);`
              },
            ]} />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Réponse <span className="text-green-600 dark:text-green-400">200 OK</span></h4>
            <CodeBlock language="json" code={`{
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
}`} />
            <InfoBox type="info" title="Bonne pratique">
              Filtrez côté client <code>payoutStatus === "online"</code> avant d'afficher les opérateurs dans votre formulaire de retrait.
              Affichez <code>maintenanceReason</code> et <code>estimatedRecoveryTime</code> pour informer vos utilisateurs en cas d'indisponibilité.
            </InfoBox>
          </div>

          {/* operators-status */}
          <div id="s-operators-status" className="scroll-mt-4 mb-14">
            <h3 className="text-lg font-semibold mb-1">Statuts opérateurs (dépôt + retrait)</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Vue complète de tous les opérateurs — dépôt ET retrait — avec leur statut en temps réel. Permet de masquer les opérateurs offline dans votre UI.
            </p>
            <Endpoint method="GET" path="/api/sdk/v1/operators-status" />
            <CodeBlock language="javascript" code={`const res = await fetch('https://sendavapay.com/api/sdk/v1/operators-status');
const { data } = await res.json();
// Masquer les opérateurs où deposit et payout sont tous les deux offline
const available = data.filter(op => op.depositStatus === 'online' || op.payoutStatus === 'online');`} />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Réponse <span className="text-green-600 dark:text-green-400">200 OK</span></h4>
            <CodeBlock language="json" code={`{
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
}`} />
            <InfoBox type="tip" title="Endpoint public (CORS)">
              Cet endpoint n'exige pas d'authentification. Appelez-le directement depuis votre frontend pour afficher uniquement les opérateurs disponibles.
            </InfoBox>
          </div>

          {/* balance */}
          <div id="s-balance" className="scroll-mt-4 mb-14">
            <h3 className="text-lg font-semibold mb-1">Soldes wallets</h3>
            <p className="text-sm text-muted-foreground mb-3">Retourne le solde de vos wallets. Un wallet par pays.</p>
            <Endpoint method="GET" path="/api/sdk/v1/balance" />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Paramètres de requête (optionnels)</h4>
            <ParamTable params={[
              { name: "country", type: "string", description: "Code pays ISO pour filtrer sur un seul wallet (ex. ?country=TG)" },
            ]} />
            <CodeBlock language="curl" code={`# Tous les wallets
curl https://sendavapay.com/api/sdk/v1/balance \\
  -H "Authorization: Bearer ${KEY}"

# Un seul pays
curl "https://sendavapay.com/api/sdk/v1/balance?country=TG" \\
  -H "Authorization: Bearer ${KEY}"`} />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Réponse <span className="text-green-600 dark:text-green-400">200 OK</span></h4>
            <CodeBlock language="json" code={`{
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
}`} />
          </div>

          {/* health */}
          <div id="s-health" className="scroll-mt-4 mb-14">
            <h3 className="text-lg font-semibold mb-1">Health check</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Vérifie l'état de l'API, de la base de données et des opérateurs en temps réel. Endpoint public — aucune authentification requise.
            </p>
            <Endpoint method="GET" path="/api/sdk/v1/health" />
            <CodeBlock language="javascript" code={`const res = await fetch('https://sendavapay.com/api/sdk/v1/health');
const data = await res.json();
if (data.status !== 'ok') console.warn('API dégradée:', data.database);`} />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Réponse <span className="text-green-600 dark:text-green-400">200 OK</span></h4>
            <CodeBlock language="json" code={`{
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
}`} />
          </div>
        </section>

        {/* ─── API CLIENT CORS ─── */}
        <section>
          <h2 className="text-2xl font-bold border-b pb-3 mb-2">API Client — CORS</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Ces endpoints sont accessibles depuis n'importe quel frontend (CORS ouvert).
            Ils s'authentifient par le <code className="bg-muted px-1 rounded text-xs">paymentToken</code> retourné par <code className="bg-muted px-1 rounded text-xs">create-payment</code> — pas besoin de votre clé SDK.
          </p>
          <InfoBox type="warning">
            Le <code>paymentToken</code> a une validité de <strong>30 minutes</strong>. Après expiration, les appels retournent <code>410 Gone</code>.
          </InfoBox>

          {/* token */}
          <div id="s-token" className="scroll-mt-4 mt-10 mb-14">
            <h3 className="text-lg font-semibold mb-1">Détails de la transaction par token</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Retourne les informations de la transaction associée au token : montant, devise, description, statut, nom du marchand.
            </p>
            <Endpoint method="GET" path="/api/sdk/v1/payment-token/:paymentToken" />
            <CodeBlock language="javascript" code={`const res = await fetch(
  'https://sendavapay.com/api/sdk/v1/payment-token/pay_tok_xxxx'
);
const { data } = await res.json();
// data.reference, data.amount, data.currency, data.description, data.ownerName, data.status`} />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Réponse <span className="text-green-600 dark:text-green-400">200 OK</span></h4>
            <CodeBlock language="json" code={`{
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
}`} />
          </div>

          {/* countries */}
          <div id="s-countries" className="scroll-mt-4 mb-14">
            <h3 className="text-lg font-semibold mb-1">Pays disponibles</h3>
            <p className="text-sm text-muted-foreground mb-3">Retourne la liste des pays activés avec leur devise.</p>
            <Endpoint method="GET" path="/api/sdk/v1/countries" />
            <CodeBlock language="javascript" code={`const res = await fetch('https://sendavapay.com/api/sdk/v1/countries');
const { data } = await res.json();
// [{ id: 'TG', name: 'Togo', currency: 'XOF' }, …]`} />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Réponse <span className="text-green-600 dark:text-green-400">200 OK</span></h4>
            <CodeBlock language="json" code={`{
  "success": true,
  "data": [
    { "id": "TG",  "name": "Togo",              "currency": "XOF" },
    { "id": "SN",  "name": "Sénégal",           "currency": "XOF" },
    { "id": "CM",  "name": "Cameroun",          "currency": "XAF" },
    { "id": "COD", "name": "RD Congo",          "currency": "CDF" },
    { "id": "COG", "name": "Congo Brazzaville", "currency": "XAF" }
  ]
}`} />
          </div>

          {/* operators */}
          <div id="s-operators" className="scroll-mt-4 mb-14">
            <h3 className="text-lg font-semibold mb-1">Opérateurs par pays</h3>
            <p className="text-sm text-muted-foreground mb-3">Retourne les opérateurs Mobile Money disponibles pour un pays donné.</p>
            <Endpoint method="GET" path="/api/sdk/v1/operators/:countryCode" />
            <CodeBlock language="javascript" code={`const res = await fetch('https://sendavapay.com/api/sdk/v1/operators/TG');
const { data } = await res.json();
// [{ id: '5', name: 'TMoney', requiresOtp: false, status: 'online' }, …]`} />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Réponse <span className="text-green-600 dark:text-green-400">200 OK</span></h4>
            <CodeBlock language="json" code={`{
  "success": true,
  "data": [
    { "id": "5",  "name": "TMoney",     "requiresOtp": false, "status": "online" },
    { "id": "6",  "name": "Flooz",      "requiresOtp": false, "status": "online" },
    { "id": "12", "name": "Orange Money","requiresOtp": true,  "status": "online" }
  ]
}`} />
          </div>

          {/* initiate */}
          <div id="s-initiate" className="scroll-mt-4 mb-14">
            <h3 className="text-lg font-semibold mb-1">Initier le paiement</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Déclenche la demande de paiement Mobile Money. L'opérateur envoie une invite sur le téléphone du payeur (ou un SMS OTP selon l'opérateur).
            </p>
            <Endpoint method="POST" path="/api/sdk/v1/initiate-payment" />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Corps de la requête</h4>
            <ParamTable params={[
              { name: "paymentToken", type: "string", required: true, description: "Token retourné par create-payment" },
              { name: "payerName",    type: "string", required: true, description: "Nom du payeur" },
              { name: "payerPhone",   type: "string", required: true, description: "Numéro Mobile Money en E.164 (+22890000000)" },
              { name: "payerEmail",   type: "string",                 description: "Email du payeur" },
              { name: "payerCountry", type: "string", required: true, description: "Code pays ISO (TG, SN, CM…)" },
              { name: "operatorId",   type: "string", required: true, description: "ID de l'opérateur retourné par /operators/:countryCode" },
            ]} />
            <CodeBlock language="javascript" code={`const res = await fetch(
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
const result = await res.json();`} />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Réponse sans OTP</h4>
            <CodeBlock language="json" code={`{
  "success":     true,
  "requiresOtp": false,
  "reference":   "sdk_lcy0u4wx_a1b2c3d4e5f6g7h8",
  "message":     "Invite de paiement envoyée sur le téléphone du client"
}`} />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Réponse avec OTP requis (Orange Money)</h4>
            <CodeBlock language="json" code={`{
  "success":     true,
  "requiresOtp": true,
  "otpToken":    "otp_xxxxxxxxxxxxxxxxxxxx",
  "reference":   "sdk_lcy0u4wx_a1b2c3d4e5f6g7h8",
  "message":     "Code OTP envoyé par SMS au payeur"
}`} />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Réponse avec redirection (Wave, etc.)</h4>
            <CodeBlock language="json" code={`{
  "success":         true,
  "requiresRedirect": true,
  "redirectUrl":     "https://wave.com/checkout/...",
  "reference":       "sdk_lcy0u4wx_a1b2c3d4e5f6g7h8"
}`} />
          </div>

          {/* OTP */}
          <div id="s-otp" className="scroll-mt-4 mb-14">
            <h3 className="text-lg font-semibold mb-1">Soumettre un OTP</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Applicable uniquement pour les opérateurs Orange Money (BF, CI, GN, ML, SN).
              À appeler après réception de <code className="bg-muted px-1 rounded text-xs">requiresOtp: true</code>.
            </p>
            <Endpoint method="POST" path="/api/sdk/v1/submit-otp" />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Corps de la requête</h4>
            <ParamTable params={[
              { name: "otpToken", type: "string", required: true, description: "otpToken retourné par initiate-payment" },
              { name: "otp",      type: "string", required: true, description: "Code OTP saisi par le payeur" },
            ]} />
            <CodeBlock language="javascript" code={`const res = await fetch(
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
const result = await res.json();`} />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Réponse <span className="text-green-600 dark:text-green-400">200 OK</span></h4>
            <CodeBlock language="json" code={`{
  "success":   true,
  "reference": "sdk_lcy0u4wx_a1b2c3d4e5f6g7h8",
  "message":   "OTP accepté. Le paiement est en cours."
}`} />
          </div>
        </section>

        {/* ─── WEBHOOKS ─── */}
        <section>
          <h2 className="text-2xl font-bold border-b pb-3 mb-2">Webhooks</h2>
          <p className="text-sm text-muted-foreground mb-10">SendavaPay envoie un POST signé sur votre URL dès qu'un événement survient.</p>

          {/* Config */}
          <div id="s-wh-config" className="scroll-mt-4 mb-14">
            <h3 className="text-lg font-semibold mb-1">Configuration</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Configurez une URL globale pour votre clé SDK, ou passez <code className="bg-muted px-1 rounded text-xs">webhookUrl</code>
              à chaque appel <code className="bg-muted px-1 rounded text-xs">create-payment</code>.
            </p>
            <Endpoint method="PUT" path="/api/sdk/v1/webhook" />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Corps de la requête</h4>
            <ParamTable params={[
              { name: "webhookUrl", type: "string", required: true, description: "URL HTTPS publique recevant les notifications POST" },
            ]} />
            <CodeBlock language="curl" code={`curl -X PUT https://sendavapay.com/api/sdk/v1/webhook \\
  -H "Authorization: Bearer ${KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{ "webhookUrl": "https://monsite.com/webhooks/sendavapay" }'`} />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Réponse <span className="text-green-600 dark:text-green-400">200 OK</span></h4>
            <CodeBlock language="json" code={`{
  "success": true,
  "data": {
    "webhookUrl":    "https://monsite.com/webhooks/sendavapay",
    "webhookSecret": "whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}`} />
            <InfoBox type="warning" title="Conservez votre webhookSecret">
              Le <code>webhookSecret</code> est affiché une seule fois. Stockez-le comme variable d'environnement sur votre serveur.
            </InfoBox>
          </div>

          {/* Events */}
          <div id="s-wh-events" className="scroll-mt-4 mb-14">
            <h3 className="text-lg font-semibold mb-3">Événements</h3>
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
                    ["payment.completed",    "Paiement confirmé, fonds crédités sur le wallet"],
                    ["payment.failed",       "Paiement refusé, annulé ou erreur opérateur"],
                    ["payment.expired",      "Le payeur n'a pas confirmé avant expiration"],
                    ["withdrawal.completed", "Retrait traité avec succès"],
                    ["withdrawal.failed",    "Retrait échoué"],
                  ].map(([e, d]) => (
                    <tr key={e} className="border-t hover:bg-muted/20">
                      <td className="p-3 font-mono text-xs text-primary">{e}</td>
                      <td className="p-3 text-xs text-muted-foreground">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payload */}
          <div id="s-wh-payload" className="scroll-mt-4 mb-14">
            <h3 className="text-lg font-semibold mb-1">Payload & headers</h3>
            <CodeBlock language="http — headers envoyés par SendavaPay" code={`POST https://monsite.com/webhooks/sendavapay
Content-Type: application/json
X-SendavaPay-Signature: sha256=a3f4b5c6d7e8f9...sha256hex...
X-SendavaPay-Event:     payment.completed
X-SendavaPay-Timestamp: 1748426732`} />
            <CodeBlock language="json — payload" code={`{
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
            <InfoBox type="tip" title="Idempotence">
              Vérifiez toujours si la <code>reference</code> a déjà été traitée avant d'agir — SendavaPay peut renvoyer le même événement en cas d'échec de votre endpoint.
            </InfoBox>
          </div>

          {/* HMAC */}
          <div id="s-wh-signature" className="scroll-mt-4 mb-14">
            <h3 className="text-lg font-semibold mb-1">Vérification HMAC</h3>
            <InfoBox type="danger" title="Toujours vérifier la signature">
              Ne traitez jamais un webhook sans vérifier sa signature. Un webhook non vérifié peut être forgé pour simuler un paiement réussi.
            </InfoBox>
            <CodeBlock language="bash — calcul de la signature" code={`HMAC_SHA256(key=WEBHOOK_SECRET, data=JSON.stringify(body))
# Envoyée dans: X-SendavaPay-Signature: sha256={hex}`} />
            <MultiCodeBlock tabs={[
              { label: "node.js", code:
`const crypto = require('crypto');

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
});`
              },
              { label: "php", code:
`<?php
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
echo json_encode(['received' => true]);`
              },
              { label: "python", code:
`import hmac, hashlib, os
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
    return {'received': True}`
              },
            ]} />
          </div>

          {/* webhook retry */}
          <div id="s-wh-retry" className="scroll-mt-4 mb-14">
            <h3 className="text-lg font-semibold mb-1">Retry automatique</h3>
            <p className="text-sm text-muted-foreground mb-3">
              SendavaPay réessaie automatiquement les webhooks en cas d'échec (timeout, HTTP 4xx/5xx). Votre endpoint doit répondre <strong>sous 10 secondes</strong>.
            </p>
            <div className="overflow-x-auto rounded-lg border text-sm">
              <table className="w-full">
                <thead className="bg-muted/70">
                  <tr>
                    <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Tentative</th>
                    <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Délai</th>
                    <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["1ère",  "Immédiat",    "Envoi initial"],
                    ["2ème",  "1 minute",    "Premier retry"],
                    ["3ème",  "5 minutes",   "Deuxième retry"],
                    ["4ème",  "30 minutes",  "Troisième retry"],
                    ["5ème",  "2 heures",    "Dernier retry — après, le webhook est marqué failed"],
                  ].map(([t, d, n], i) => (
                    <tr key={i} className="border-t hover:bg-muted/20">
                      <td className="p-3 font-mono text-xs">{t}</td>
                      <td className="p-3 text-xs">{d}</td>
                      <td className="p-3 text-xs text-muted-foreground">{n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <InfoBox type="tip" title="Idempotence">
              Chaque webhook contient un champ <code>webhookId</code> unique. Stockez les IDs déjà traités pour ignorer les doublons en cas de retry.
            </InfoBox>
          </div>

          {/* test-webhook */}
          <div id="s-wh-test" className="scroll-mt-4 mb-14">
            <h3 className="text-lg font-semibold mb-1">Tester votre endpoint webhook</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Envoie un webhook de test à votre URL configurée. Permet de vérifier que votre endpoint reçoit, vérifie la signature et répond correctement.
            </p>
            <Endpoint method="POST" path="/api/sdk/v1/test-webhook" />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Corps de la requête</h4>
            <ParamTable params={[
              { name: "event", type: "string", required: true, description: "Événement à simuler : payment.completed · payment.failed · withdrawal.completed · withdrawal.failed" },
            ]} />
            <CodeBlock language="javascript" code={`const res = await fetch('https://sendavapay.com/api/sdk/v1/test-webhook', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer \${KEY}',
    'Content-Type':  'application/json',
  },
  body: JSON.stringify({ event: 'payment.completed' }),
});
const data = await res.json();
// data.sent: true, data.responseStatus: 200, data.responseTime: 142`} />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2">Réponse <span className="text-green-600 dark:text-green-400">200 OK</span></h4>
            <CodeBlock language="json" code={`{
  "success":      true,
  "sent":         true,
  "webhookUrl":   "https://your-server.com/webhooks/sendavapay",
  "event":        "payment.completed",
  "responseStatus": 200,
  "responseTime": 142
}`} />
          </div>
        </section>

        {/* ─── PAYS & OPÉRATEURS ─── */}
        <section id="s-operators">
          <h2 className="text-2xl font-bold border-b pb-3 mb-6">Pays & Opérateurs</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Chaque paiement est crédité sur le wallet correspondant au pays. Les fonds d'un pays ne peuvent être retirés que via le wallet de ce même pays.
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
                  ["🇨🇩 RD Congo",            "COD", "CDF", "Vodacom M-Pesa, Airtel Money, Orange Money"],
                  ["🇨🇬 Congo Brazzaville",   "COG", "XAF", "Airtel Money, MTN Money"],
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
          <InfoBox type="info" title="OTP requis">
            Les opérateurs <strong>Orange Money</strong> (BF, CI, GN, ML, SN) retournent <code>requiresOtp: true</code> à l'initiation du paiement.
            Tous les autres opérateurs n'en ont pas besoin.
          </InfoBox>
        </section>

        {/* ─── STATUTS ─── */}
        <section id="s-statuses">
          <h2 className="text-2xl font-bold border-b pb-3 mb-6">Statuts de transaction</h2>

          <h3 className="text-base font-semibold mb-3">Statuts de paiement (dépôt)</h3>
          <div className="overflow-x-auto rounded-lg border text-sm mb-8">
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
                  ["pending",    "Transaction créée, en attente d'initiation",            "transitoire"],
                  ["processing", "Invite envoyée, en attente de confirmation du payeur",   "transitoire"],
                  ["completed",  "Paiement confirmé, fonds crédités sur le wallet",       "terminal ✓"],
                  ["failed",     "Paiement refusé, annulé ou erreur opérateur",           "terminal"],
                  ["cancelled",  "Annulé avant traitement",                               "terminal"],
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

          <h3 className="text-base font-semibold mb-3">Statuts de retrait (pay-out)</h3>
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
                  ["queued",           "En file d'attente — le worker va le traiter",              "transitoire"],
                  ["processing",       "En cours de traitement chez l'opérateur",                  "transitoire"],
                  ["provider_pending", "En attente de confirmation du fournisseur de paiement",    "transitoire"],
                  ["completed",        "Retrait effectué — fonds virés sur le Mobile Money",       "terminal ✓"],
                  ["failed",           "Retrait échoué — fonds non débités",                       "terminal"],
                  ["reversed",         "Fonds retournés sur le wallet après un échec définitif",   "terminal"],
                  ["cancelled",        "Retrait annulé avant traitement",                          "terminal"],
                ].map(([s, desc, type]) => (
                  <tr key={s} className="border-t hover:bg-muted/20">
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${
                        s === "completed"  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        s === "failed" || s === "cancelled" || s === "reversed" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
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
                  ["400", "INSUFFICIENT_BALANCE",       "Solde insuffisant sur le wallet pour le retrait"],
                  ["400", "UNSUPPORTED_COUNTRY",        "Code pays non pris en charge"],
                  ["400", "WALLET_NOT_FOUND",           "Wallet du pays introuvable sur votre compte"],
                  ["400", "INVALID_PHONE_FORMAT",       "Numéro de téléphone invalide — format E.164 requis (+22890…)"],
                  ["400", "OPERATOR_COUNTRY_MISMATCH",  "Opérateur incompatible avec le pays demandé"],
                  ["400", "PAYOUT_OPERATOR_OFFLINE",    "Opérateur en maintenance — retraits temporairement indisponibles"],
                  ["400", "AMOUNT_TOO_LOW",             "Montant inférieur au minimum autorisé (100)"],
                  ["400", "AMOUNT_TOO_HIGH",            "Montant supérieur au maximum autorisé (5 000 000)"],
                  ["409", "DUPLICATE_WITHDRAWAL",       "Un retrait avec cet externalReference existe déjà"],
                  ["401", "UNAUTHORIZED",         "Header Authorization manquant ou malformé"],
                  ["401", "INVALID_API_KEY",      "Clé SDK invalide ou inexistante"],
                  ["403", "API_KEY_INACTIVE",     "Clé SDK désactivée"],
                  ["403", "SDK_NOT_ENABLED",      "Accès SDK non activé — contactez le support"],
                  ["403", "ACCOUNT_NOT_VERIFIED", "KYC non validé"],
                  ["404", "NOT_FOUND",            "Transaction introuvable pour cette référence"],
                  ["410", "TOKEN_EXPIRED",        "paymentToken expiré (30 min dépassées)"],
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
          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            {[
              ["100 req / min", "Par clé SDK"],
              ["5 secondes",    "Intervalle polling recommandé"],
              ["Retry 429",     "Backoff exponentiel"],
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
          <InfoBox type="tip">
            Pour le polling de statut, utilisez un intervalle de 5 secondes minimum. Implémentez un backoff exponentiel sur les réponses 429.
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
  const [editingKeyId, setEditingKeyId] = useState<number | null>(null);
  const [editWebhookUrl, setEditWebhookUrl] = useState("");
  const [editRedirectUrl, setEditRedirectUrl] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);

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
      setNewKeyName(""); setAppName(""); setWebhookUrl(""); setRedirectUrl("");
      setSelectedType(null); setShowCreateForm(false);
      toast({ title: "Clé créée", description: "Votre nouvelle clé API a été créée avec succès" });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message || "Impossible de créer la clé", variant: "destructive" });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/api-keys/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] }); toast({ title: "Clé supprimée" }); },
    onError: () => { toast({ title: "Erreur", description: "Impossible de supprimer la clé", variant: "destructive" }); },
  });

  const uploadLogo = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch("/api/upload/product-image", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    if (!res.ok) throw new Error("Erreur lors de l'upload du logo");
    const data = await res.json();
    return data.imageUrl;
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const url = await uploadLogo(file);
      setEditLogoUrl(url);
      toast({ title: "Logo chargé", description: "Le logo sera enregistré avec les autres modifications" });
    } catch {
      toast({ title: "Erreur", description: "Impossible de charger le logo", variant: "destructive" });
    } finally {
      setLogoUploading(false);
    }
  };

  const updateKeyMutation = useMutation({
    mutationFn: async ({ id, webhookUrl, redirectUrl, logoUrl }: { id: number; webhookUrl: string; redirectUrl: string; logoUrl: string }) => {
      const res = await apiRequest("PATCH", `/api/api-keys/${id}`, { webhookUrl: webhookUrl || null, redirectUrl: redirectUrl || null, logoUrl: logoUrl || null });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      setEditingKeyId(null);
      toast({ title: "Clé mise à jour", description: "Les URLs ont été enregistrées" });
    },
    onError: () => { toast({ title: "Erreur", description: "Impossible de mettre à jour la clé", variant: "destructive" }); },
  });

  const startEdit = (keyItem: ApiKey) => {
    setEditingKeyId(keyItem.id);
    setEditWebhookUrl(keyItem.webhookUrl || "");
    setEditRedirectUrl(keyItem.redirectUrl || "");
    setEditLogoUrl((keyItem as any).logoUrl || "");
  };

  const cancelEdit = () => { setEditingKeyId(null); setEditWebhookUrl(""); setEditRedirectUrl(""); setEditLogoUrl(""); };

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast({ title: "Copié" });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) { toast({ title: "Erreur", description: "Veuillez entrer un nom pour la clé", variant: "destructive" }); return; }
    if (!selectedType)      { toast({ title: "Erreur", description: "Veuillez sélectionner un type d'API", variant: "destructive" }); return; }
    createKeyMutation.mutate({ name: newKeyName.trim(), appName: appName.trim() || undefined, webhookUrl: webhookUrl.trim() || undefined, redirectUrl: redirectUrl.trim() || undefined, apiType: selectedType });
  };

  if (authLoading || maintenanceLoading) {
    return <DashboardLayout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
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
              <Link href="/dashboard"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Retour au tableau de bord</Button></Link>
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
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-yellow-500" />Vérification requise</CardTitle>
              <CardDescription>Votre compte doit être vérifié pour accéder à l'API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Pour des raisons de sécurité, seuls les comptes vérifiés peuvent accéder à l'API SendavaPay.</p>
              <Link href="/dashboard/kyc"><Button><Shield className="h-4 w-4 mr-2" />Vérifier mon compte</Button></Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const sdkEnabled = permissions?.apiSdkEnabled ?? false;
  const sdkKeys = apiKeys.filter((k) => k.apiType === "sdk");
  const redirectKeys = apiKeys.filter((k) => k.apiType === "redirect");

  const KeyCard = ({ keyItem }: { keyItem: ApiKey }) => {
    const isEditing = editingKeyId === keyItem.id;
    const isSaving  = updateKeyMutation.isPending && editingKeyId === keyItem.id;

    return (
      <div className="flex flex-col gap-3 p-4 border rounded-lg" data-testid={`api-key-${keyItem.id}`}>
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {(keyItem as any).logoUrl && (
                <img src={(keyItem as any).logoUrl} alt="Logo" className="h-6 w-6 rounded object-cover border" />
              )}
              <span className="font-medium">{keyItem.name}</span>
              <Badge variant={keyItem.isActive ? "default" : "secondary"}>{keyItem.isActive ? "Active" : "Inactive"}</Badge>
              <Badge variant="outline" className={keyItem.apiType === "sdk" ? "border-purple-400 text-purple-700 dark:text-purple-300" : ""}>
                {keyItem.apiType === "sdk" ? "SDK" : "Redirection"}
              </Badge>
            </div>
            {keyItem.appName && <p className="text-sm text-muted-foreground">Application : {keyItem.appName}</p>}
            <code className="text-sm text-muted-foreground font-mono block truncate">{keyItem.apiKey}</code>
            <p className="text-xs text-muted-foreground">
              Créée le {new Date(keyItem.createdAt).toLocaleDateString("fr-FR")}
              {keyItem.requestCount > 0 && ` • ${keyItem.requestCount} requêtes`}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(keyItem.apiKey)} data-testid={`button-copy-${keyItem.id}`}>
              {copiedKey === keyItem.apiKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => isEditing ? cancelEdit() : startEdit(keyItem)} data-testid={`button-edit-${keyItem.id}`}>
              {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setKeyToDelete(keyItem)} disabled={deleteKeyMutation.isPending} data-testid={`button-delete-${keyItem.id}`}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        {/* ── Formulaire d'édition inline ── */}
        {isEditing && (
          <div className="border-t pt-3 space-y-3 bg-muted/20 -mx-4 px-4 pb-3 rounded-b-lg">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Modifier la clé</p>

            {/* Logo upload */}
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1.5">
                <ImageIcon className="h-3 w-3" />Logo de l'application
              </Label>
              <div className="flex items-center gap-3">
                {editLogoUrl && (
                  <img src={editLogoUrl} alt="Logo" className="h-10 w-10 rounded object-cover border" />
                )}
                <label
                  htmlFor={`logo-${keyItem.id}`}
                  className="cursor-pointer inline-flex items-center gap-1.5 h-8 px-3 text-xs rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                >
                  {logoUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  {editLogoUrl ? "Changer" : "Importer un logo"}
                </label>
                <input
                  id={`logo-${keyItem.id}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                  disabled={logoUploading}
                  data-testid={`input-logo-${keyItem.id}`}
                />
                {editLogoUrl && (
                  <button
                    type="button"
                    onClick={() => setEditLogoUrl("")}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Supprimer
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Ce logo s'affiche sur la page de paiement</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor={`wh-${keyItem.id}`} className="text-xs flex items-center gap-1.5">
                <Webhook className="h-3 w-3" />URL de webhook
              </Label>
              <Input
                id={`wh-${keyItem.id}`}
                type="url"
                placeholder="https://monsite.com/webhooks/sendavapay"
                value={editWebhookUrl}
                onChange={(e) => setEditWebhookUrl(e.target.value)}
                className="h-8 text-sm"
                data-testid={`input-edit-webhook-${keyItem.id}`}
              />
              <p className="text-xs text-muted-foreground">Laisser vide pour désactiver les webhooks</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`rd-${keyItem.id}`} className="text-xs flex items-center gap-1.5">
                <ExternalLink className="h-3 w-3" />URL de redirection (après paiement)
              </Label>
              <Input
                id={`rd-${keyItem.id}`}
                type="url"
                placeholder="https://monsite.com/paiement/succes"
                value={editRedirectUrl}
                onChange={(e) => setEditRedirectUrl(e.target.value)}
                className="h-8 text-sm"
                data-testid={`input-edit-redirect-${keyItem.id}`}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => updateKeyMutation.mutate({ id: keyItem.id, webhookUrl: editWebhookUrl, redirectUrl: editRedirectUrl, logoUrl: editLogoUrl })}
                disabled={isSaving || logoUploading}
                data-testid={`button-save-${keyItem.id}`}
              >
                {isSaving ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Save className="h-3 w-3 mr-1.5" />}
                Enregistrer
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEdit} disabled={isSaving} data-testid={`button-cancel-edit-${keyItem.id}`}>
                Annuler
              </Button>
            </div>
          </div>
        )}

        {/* ── Affichage URLs actuelles (quand pas en édition) ── */}
        {!isEditing && (keyItem.redirectUrl || keyItem.webhookUrl) && (
          <div className="space-y-2 border-t pt-3">
            <div className="flex flex-wrap gap-4 text-xs">
              {keyItem.redirectUrl && (
                <div className="flex items-center gap-1 text-muted-foreground min-w-0">
                  <ExternalLink className="h-3 w-3 flex-shrink-0" /><span className="flex-shrink-0">Redirection:</span>
                  <span className="font-mono truncate max-w-[200px]">{keyItem.redirectUrl}</span>
                </div>
              )}
              {keyItem.webhookUrl && (
                <div className="flex items-center gap-1 text-muted-foreground min-w-0">
                  <Bell className="h-3 w-3 flex-shrink-0" /><span className="flex-shrink-0">Webhook:</span>
                  <span className="font-mono truncate max-w-[200px]">{keyItem.webhookUrl}</span>
                </div>
              )}
            </div>
            {keyItem.webhookSecret && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Secret:</span>
                <code className="font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded truncate max-w-[200px]">{keyItem.webhookSecret}</code>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(keyItem.webhookSecret!)} data-testid={`button-copy-secret-${keyItem.id}`}>
                  {copiedKey === keyItem.webhookSecret ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">API de Paiement</h1>
          <p className="text-muted-foreground">Gérez vos clés d'intégration SendavaPay</p>
        </div>

        {sdkEnabled && !selectedType && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Créer une clé API</CardTitle>
              <CardDescription>Choisissez le type d'intégration adapté à votre projet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <button className="p-5 border-2 rounded-xl text-left hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group" onClick={() => setSelectedType("sdk")}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <Code2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div><p className="font-semibold">API SDK</p><p className="text-xs text-muted-foreground">Intégration complète</p></div>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {["Encaissement Mobile Money (10 pays)", "Retrait automatique pay-out", "Soldes wallets par pays", "Webhooks signés HMAC"].map(f => (
                      <li key={f} className="flex items-center gap-2"><Check className="h-3 w-3 text-green-500 flex-shrink-0" />{f}</li>
                    ))}
                  </ul>
                </button>
                <button className="p-5 border-2 rounded-xl text-left hover:border-primary hover:bg-primary/5 transition-all group" onClick={() => setSelectedType("redirect")}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <ExternalLink className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div><p className="font-semibold">API Redirection</p><p className="text-xs text-muted-foreground">Simple et rapide</p></div>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {["Liens de paiement générés", "Redirection après paiement", "Notifications webhook", "Intégration sans SDK"].map(f => (
                      <li key={f} className="flex items-center gap-2"><Check className="h-3 w-3 text-green-500 flex-shrink-0" />{f}</li>
                    ))}
                  </ul>
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {((sdkEnabled && selectedType) || (!sdkEnabled && showCreateForm)) && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {selectedType === "sdk" ? <><Code2 className="h-5 w-5 text-purple-600" />Nouvelle clé API SDK</> : <><Key className="h-5 w-5 text-primary" />Nouvelle clé API</>}
                </CardTitle>
                {sdkEnabled ? (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedType(null)} data-testid="button-back-type"><ArrowLeft className="h-4 w-4 mr-1" />Changer</Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)} data-testid="button-cancel-create"><ArrowLeft className="h-4 w-4 mr-1" />Annuler</Button>
                )}
              </div>
              <CardDescription>
                {selectedType === "sdk" ? "Clé pour l'intégration SDK complète avec retrait automatique" : "Clé pour la création de liens de paiement avec redirection"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="keyName">Nom de la clé *</Label>
                  <Input id="keyName" placeholder="Ex: Mon site e-commerce" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} data-testid="input-key-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appName">Nom de l'application</Label>
                  <Input id="appName" placeholder="Ex: MaBoutique.com" value={appName} onChange={(e) => setAppName(e.target.value)} data-testid="input-app-name" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="redirectUrl">URL de redirection (après paiement)</Label>
                <Input id="redirectUrl" type="url" placeholder="https://monsite.com/paiement/succes" value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} data-testid="input-redirect-url" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhookUrl"><div className="flex items-center gap-2"><Webhook className="h-4 w-4" />URL de webhook</div></Label>
                <Input id="webhookUrl" type="url" placeholder="https://monsite.com/webhooks/sendavapay" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} data-testid="input-webhook-url" />
                <p className="text-xs text-muted-foreground">SendavaPay enverra une notification POST sécurisée à cette URL lors de chaque paiement</p>
              </div>
              <Button onClick={handleCreateKey} disabled={createKeyMutation.isPending} className={selectedType === "sdk" ? "bg-purple-600 hover:bg-purple-700" : ""} data-testid="button-create-key">
                {createKeyMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
                Générer la clé
              </Button>
            </CardContent>
          </Card>
        )}

        {!permissionsLoading && (
          <>
            {sdkEnabled ? (
              <Tabs defaultValue={sdkKeys.length > 0 ? "sdk" : "redirect"}>
                <TabsList>
                  <TabsTrigger value="sdk" className="gap-2">
                    <Code2 className="h-4 w-4" />Clés SDK
                    {sdkKeys.length > 0 && <Badge variant="secondary" className="ml-1 h-5 text-xs">{sdkKeys.length}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="redirect" className="gap-2">
                    <Globe className="h-4 w-4" />Clés Redirection
                    {redirectKeys.length > 0 && <Badge variant="secondary" className="ml-1 h-5 text-xs">{redirectKeys.length}</Badge>}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="sdk" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base"><Code2 className="h-4 w-4 text-purple-600" />Clés API SDK</CardTitle>
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
                        <div className="space-y-3">{sdkKeys.map((key) => <KeyCard key={key.id} keyItem={key} />)}</div>
                      )}
                    </CardContent>
                  </Card>
                  <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-purple-600" />Référence API SDK
                    </h2>
                    <SdkDocumentation apiKeys={apiKeys} />
                  </div>
                </TabsContent>

                <TabsContent value="redirect" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base"><Globe className="h-4 w-4 text-blue-600" />Clés API Redirection</CardTitle>
                      <CardDescription>{redirectKeys.length} clé{redirectKeys.length !== 1 ? "s" : ""} Redirection</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {keysLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                      ) : redirectKeys.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>Aucune clé créée</p>
                        </div>
                      ) : (
                        <div className="space-y-3">{redirectKeys.map((key) => <KeyCard key={key.id} keyItem={key} />)}</div>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4" />Documentation</CardTitle></CardHeader>
                    <CardContent>
                      <Link href="/docs"><Button variant="outline" data-testid="button-docs-redirect"><BookOpen className="h-4 w-4 mr-2" />Voir la documentation</Button></Link>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base"><Key className="h-4 w-4 text-primary" />Mes clés API</CardTitle>
                        <CardDescription>{redirectKeys.length} clé{redirectKeys.length !== 1 ? "s" : ""}</CardDescription>
                      </div>
                      {!showCreateForm && (
                        <Button size="sm" onClick={() => { setShowCreateForm(true); setSelectedType("redirect"); }} data-testid="button-new-key">
                          <Plus className="h-4 w-4 mr-2" />Nouvelle clé
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
                          <Plus className="h-4 w-4 mr-2" />Créer ma première clé
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">{redirectKeys.map((key) => <KeyCard key={key.id} keyItem={key} />)}</div>
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
                      <Link href="/docs"><Button variant="outline" data-testid="button-docs"><BookOpen className="h-4 w-4 mr-2" />Voir la documentation</Button></Link>
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
              onClick={() => { if (keyToDelete) { deleteKeyMutation.mutate(keyToDelete.id); setKeyToDelete(null); } }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteKeyMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
