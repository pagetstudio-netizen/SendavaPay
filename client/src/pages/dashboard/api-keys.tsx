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
  Terminal, ChevronDown, ChevronUp, Webhook,
} from "lucide-react";
import type { ApiKey } from "@shared/schema";

interface ApiPermissions {
  apiSdkEnabled: boolean;
  apiRedirectEnabled: boolean;
}

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-xs font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-white hover:bg-slate-700"
        onClick={copy}
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </Button>
    </div>
  );
}

function SdkDocumentation({ apiKeys }: { apiKeys: ApiKey[] }) {
  const sdkKeys = apiKeys.filter((k) => k.apiType === "sdk" && k.isActive);
  const exampleKey = sdkKeys[0]?.apiKey || "sdk_votre_cle_ici";

  const [openSection, setOpenSection] = useState<string | null>("intro");
  const toggle = (s: string) => setOpenSection(openSection === s ? null : s);

  const Section = ({ id, title, icon: Icon, children }: any) => (
    <Card className="overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
        onClick={() => toggle(id)}
      >
        <div className="flex items-center gap-2 font-semibold">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </div>
        {openSection === id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {openSection === id && <CardContent className="pt-0 space-y-4">{children}</CardContent>}
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-lg border border-primary/20">
        <Info className="h-5 w-5 text-primary flex-shrink-0" />
        <p className="text-sm">
          <strong>API SDK</strong> — Intégration complète pour marchands. Créez des paiements, gérez des retraits automatiques et configurez des webhooks directement depuis votre site.
        </p>
      </div>

      <Section id="intro" title="Authentification" icon={Shield}>
        <p className="text-sm text-muted-foreground">
          Incluez votre clé API SDK dans l'en-tête <code className="bg-muted px-1 rounded">Authorization</code> de chaque requête.
        </p>
        <CodeBlock code={`Authorization: Bearer ${exampleKey}`} />
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Base URL :</strong> <code>https://sendavapay.com/api/sdk/v1</code>
          </p>
        </div>
      </Section>

      <Section id="wallet-routing" title="Routage automatique par pays / wallet" icon={Globe}>
        <p className="text-sm text-muted-foreground">
          SendavaPay détecte automatiquement le pays du payeur et crédite le bon wallet. Chaque paiement est attribué au wallet du pays correspondant.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border rounded-lg overflow-hidden">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Pays du payeur</th>
                <th className="text-left p-3 font-medium">Wallet crédité</th>
                <th className="text-left p-3 font-medium">Devise</th>
                <th className="text-left p-3 font-medium">Code pays</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Togo", "Wallet Togo", "XOF", "TG"],
                ["Bénin", "Wallet Bénin", "XOF", "BJ"],
                ["Sénégal", "Wallet Sénégal", "XOF", "SN"],
                ["Côte d'Ivoire", "Wallet CI", "XOF", "CI"],
                ["Mali", "Wallet Mali", "XOF", "ML"],
                ["Burkina Faso", "Wallet Burkina", "XOF", "BF"],
                ["Cameroun", "Wallet Cameroun", "XAF", "CM"],
                ["Guinée", "Wallet Guinée", "GNF", "GN"],
              ].map(([country, wallet, currency, code]) => (
                <tr key={code} className="border-t hover:bg-muted/30">
                  <td className="p-3">{country}</td>
                  <td className="p-3 text-primary font-medium">{wallet}</td>
                  <td className="p-3 font-mono">{currency}</td>
                  <td className="p-3 font-mono text-muted-foreground">{code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200">
          <strong>Exemple :</strong> Un client depuis le Togo paie via TMoney → l'argent est crédité sur votre <strong>Wallet Togo</strong>. Un client depuis le Sénégal paie via Wave → l'argent va sur votre <strong>Wallet Sénégal</strong>.
        </div>
      </Section>

      <Section id="create-payment" title="Créer un paiement" icon={Zap}>
        <p className="text-sm text-muted-foreground">
          Génère une URL de paiement que vous redirigez vers votre client.
        </p>
        <div className="space-y-1">
          <Badge variant="outline" className="font-mono text-xs">POST /api/sdk/v1/create-payment</Badge>
        </div>
        <CodeBlock language="json" code={`// Corps de la requête
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
}`} />
        <CodeBlock language="json" code={`// Réponse
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
}`} />
        <p className="text-sm text-muted-foreground">Redirigez votre client vers <code className="bg-muted px-1 rounded">paymentUrl</code>. Après paiement, il est renvoyé vers votre <code className="bg-muted px-1 rounded">redirectUrl</code>.</p>
      </Section>

      <Section id="verify-payment" title="Vérifier un paiement" icon={Check}>
        <Badge variant="outline" className="font-mono text-xs">POST /api/sdk/v1/verify-payment</Badge>
        <CodeBlock code={`// Corps
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
}`} />
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-sm text-green-800 dark:text-green-200">
          <strong>Conseil de sécurité :</strong> Vérifiez toujours le statut côté serveur avant de valider une commande. Ne vous fiez pas uniquement à la redirection.
        </div>
      </Section>

      <Section id="withdraw" title="Retrait automatique (Mobile Money)" icon={ArrowUpRight}>
        <p className="text-sm text-muted-foreground">
          Envoyez de l'argent automatiquement depuis votre wallet vers un numéro Mobile Money. Le wallet du pays spécifié est débité.
        </p>
        <Badge variant="outline" className="font-mono text-xs">POST /api/sdk/v1/withdraw</Badge>
        <CodeBlock code={`// Corps de la requête
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
}`} />
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border text-sm">
          <strong>Routage wallet :</strong> Le montant est prélevé sur votre <strong>Wallet Togo</strong> si <code>country: "TG"</code>, sur votre <strong>Wallet Bénin</strong> si <code>country: "BJ"</code>, etc. Assurez-vous que le wallet du pays a suffisamment de fonds.
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border rounded-lg overflow-hidden">
            <thead className="bg-muted"><tr>
              <th className="text-left p-2 font-medium">Pays</th>
              <th className="text-left p-2 font-medium">Code</th>
              <th className="text-left p-2 font-medium">Opérateurs supportés</th>
            </tr></thead>
            <tbody>
              {[
                ["Togo", "TG", "tmoney, flooz, togocel"],
                ["Bénin", "BJ", "mtn_bj, moov_bj"],
                ["Sénégal", "SN", "orange_sn, wave_sn, free_sn"],
                ["Côte d'Ivoire", "CI", "orange_ci, mtn_ci, wave_ci, moov_ci"],
                ["Mali", "ML", "orange_ml, wave_ml, moov_ml"],
                ["Cameroun", "CM", "orange_cm, mtn_cm"],
              ].map(([country, code, ops]) => (
                <tr key={code} className="border-t">
                  <td className="p-2">{country}</td>
                  <td className="p-2 font-mono text-muted-foreground">{code}</td>
                  <td className="p-2 font-mono text-xs">{ops}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="balance" title="Soldes des wallets" icon={Key}>
        <Badge variant="outline" className="font-mono text-xs">GET /api/sdk/v1/balance</Badge>
        <CodeBlock code={`// Tous les wallets
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
}`} />
      </Section>

      <Section id="transactions" title="Historique des transactions" icon={BookOpen}>
        <Badge variant="outline" className="font-mono text-xs">GET /api/sdk/v1/transactions</Badge>
        <CodeBlock code={`// Réponse
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
}`} />
      </Section>

      <Section id="webhook" title="Webhooks — Notifications automatiques" icon={Webhook}>
        <p className="text-sm text-muted-foreground">
          Configurez une URL webhook pour recevoir des notifications en temps réel à chaque paiement complété.
        </p>
        <Badge variant="outline" className="font-mono text-xs">PUT /api/sdk/v1/webhook</Badge>
        <CodeBlock code={`// Corps
{ "webhookUrl": "https://monsite.com/api/webhook/sendavapay" }

// Réponse
{
  "success": true,
  "data": {
    "webhookUrl": "https://monsite.com/api/webhook/sendavapay",
    "webhookSecret": "whsec_abc123...",
    "message": "Webhook configuré avec succès."
  }
}`} />
        <p className="text-sm font-medium mt-2">Payload reçu sur votre serveur :</p>
        <CodeBlock code={`{
  "event": "payment.completed",
  "reference": "sdk_abc123",
  "amount": "5000.00",
  "currency": "XOF",
  "status": "completed",
  "customerPhone": "+22890000000",
  "paymentMethod": "tmoney",
  "timestamp": "2024-01-15T10:05:00Z"
}`} />
        <p className="text-sm font-medium">Vérification de signature (Node.js) :</p>
        <CodeBlock language="javascript" code={`const crypto = require('crypto');

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
});`} />
      </Section>

      <Section id="examples" title="Exemples d'intégration" icon={Terminal}>
        <p className="text-sm font-medium">JavaScript / Node.js</p>
        <CodeBlock language="javascript" code={`const API_KEY = '${exampleKey}';
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
}`} />
        <p className="text-sm font-medium">PHP</p>
        <CodeBlock language="php" code={`<?php
$apiKey = '${exampleKey}';
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
?>`} />
        <p className="text-sm font-medium">Python</p>
        <CodeBlock language="python" code={`import requests

API_KEY = '${exampleKey}'
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
    return data['data']['paymentUrl']`} />
      </Section>
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
