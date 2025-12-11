import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Code, 
  Key, 
  CreditCard, 
  RefreshCw, 
  Webhook, 
  Shield, 
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Globe,
  Smartphone,
  Users,
  Wallet,
  Send,
  Download,
  FileText,
  Terminal,
  Copy
} from "lucide-react";
import { useState } from "react";

export default function ApiDocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, id, language = "json" }: { code: string; id: string; language?: string }) => (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-70"
        onClick={() => copyToClipboard(code, id)}
        data-testid={`button-copy-${id}`}
      >
        {copiedCode === id ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm" data-testid={`code-block-${id}`}>
        {code}
      </pre>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="bg-gradient-to-b from-primary/5 to-background py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Badge className="mb-4">API v1.0</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Documentation API SendavaPay</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mb-8">
            Intégrez SendavaPay à vos applications pour accepter des paiements en Afrique de l'Ouest. 
            Notre API RESTful vous permet de créer des paiements, gérer des transferts et automatiser vos transactions.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/auth?tab=register">
              <Button className="gap-2" data-testid="button-docs-register">
                Créer un compte
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={() => document.getElementById('quick-start')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="button-quick-start"
            >
              <Terminal className="h-4 w-4" />
              Démarrage rapide
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16">
          <Card>
            <CardContent className="p-6">
              <Key className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Authentification</h3>
              <p className="text-sm text-muted-foreground">
                Authentifiez vos requêtes avec des clés API sécurisées.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <CreditCard className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Paiements</h3>
              <p className="text-sm text-muted-foreground">
                Créez des paiements et vérifiez leur statut en temps réel.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Send className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Transferts</h3>
              <p className="text-sm text-muted-foreground">
                Envoyez de l'argent vers Mobile Money automatiquement.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Webhook className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Webhooks</h3>
              <p className="text-sm text-muted-foreground">
                Recevez des notifications pour chaque événement.
              </p>
            </CardContent>
          </Card>
        </div>

        <section id="quick-start" className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Démarrage rapide</h2>
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                  <div>
                    <h4 className="font-semibold mb-1">Créez un compte</h4>
                    <p className="text-sm text-muted-foreground">Inscrivez-vous et vérifiez votre identité (KYC)</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                  <div>
                    <h4 className="font-semibold mb-1">Obtenez vos clés</h4>
                    <p className="text-sm text-muted-foreground">Générez vos clés API dans le tableau de bord</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                  <div>
                    <h4 className="font-semibold mb-1">Intégrez l'API</h4>
                    <p className="text-sm text-muted-foreground">Utilisez nos exemples de code pour démarrer</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-3">URL de base de l'API</h4>
                <CodeBlock 
                  code="https://api.sendavapay.com/v1" 
                  id="base-url"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <Tabs defaultValue="auth" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 h-auto">
            <TabsTrigger value="auth" className="py-2">Authentification</TabsTrigger>
            <TabsTrigger value="payments" className="py-2">Paiements</TabsTrigger>
            <TabsTrigger value="transfers" className="py-2">Transferts</TabsTrigger>
            <TabsTrigger value="withdrawals" className="py-2">Retraits</TabsTrigger>
            <TabsTrigger value="webhooks" className="py-2">Webhooks</TabsTrigger>
            <TabsTrigger value="errors" className="py-2">Erreurs</TabsTrigger>
          </TabsList>

          <TabsContent value="auth" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Authentification
                </CardTitle>
                <CardDescription>
                  Toutes les requêtes API doivent être authentifiées avec une clé API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Types de clés API</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <Badge variant="outline" className="mb-2">Test</Badge>
                      <p className="text-sm text-muted-foreground">
                        Préfixe: <code className="bg-muted px-1 rounded">sk_test_</code><br />
                        Utilisez ces clés pour le développement et les tests.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <Badge className="mb-2">Production</Badge>
                      <p className="text-sm text-muted-foreground">
                        Préfixe: <code className="bg-muted px-1 rounded">sk_live_</code><br />
                        Utilisez ces clés en production avec de vrais paiements.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">En-tête d'authentification</h4>
                  <CodeBlock 
                    code={`Authorization: Bearer VOTRE_CLE_API
Content-Type: application/json`}
                    id="auth-header"
                  />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Exemple avec cURL</h4>
                  <CodeBlock 
                    code={`curl -X GET "https://api.sendavapay.com/v1/balance" \\
  -H "Authorization: Bearer sk_live_xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json"`}
                    id="curl-example"
                  />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Exemple avec JavaScript (Node.js)</h4>
                  <CodeBlock 
                    code={`const response = await fetch('https://api.sendavapay.com/v1/balance', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer sk_live_xxxxxxxxxxxxxxxx',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`}
                    id="js-example"
                    language="javascript"
                  />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Exemple avec PHP</h4>
                  <CodeBlock 
                    code={`<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.sendavapay.com/v1/balance');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer sk_live_xxxxxxxxxxxxxxxx',
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
print_r($data);
?>`}
                    id="php-example"
                    language="php"
                  />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Exemple avec Python</h4>
                  <CodeBlock 
                    code={`import requests

headers = {
    'Authorization': 'Bearer sk_live_xxxxxxxxxxxxxxxx',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.sendavapay.com/v1/balance',
    headers=headers
)

data = response.json()
print(data)`}
                    id="python-example"
                    language="python"
                  />
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">Sécurité importante</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Ne partagez jamais votre clé API. Utilisez des variables d'environnement en production 
                        et n'incluez jamais vos clés dans le code source versionné.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vérifier le solde</CardTitle>
                <CardDescription>
                  <Badge variant="secondary" className="mr-2">GET</Badge>
                  /v1/balance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Récupérez le solde actuel de votre compte SendavaPay.
                </p>
                <div>
                  <h4 className="font-medium mb-2">Réponse</h4>
                  <CodeBlock 
                    code={`{
  "status": "success",
  "data": {
    "balance": 150000,
    "currency": "XOF",
    "available": 150000,
    "pending": 5000
  }
}`}
                    id="balance-response"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Créer un paiement</CardTitle>
                <CardDescription>
                  <Badge variant="secondary" className="mr-2">POST</Badge>
                  /v1/payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Créez un lien de paiement pour recevoir de l'argent de vos clients.
                </p>

                <div>
                  <h4 className="font-medium mb-2">Paramètres de la requête</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Paramètre</th>
                          <th className="text-left py-2 px-2">Type</th>
                          <th className="text-left py-2 px-2">Requis</th>
                          <th className="text-left py-2 px-2">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 px-2"><code>amount</code></td>
                          <td className="py-2 px-2">integer</td>
                          <td className="py-2 px-2"><Badge size="sm">Oui</Badge></td>
                          <td className="py-2 px-2">Montant en XOF (min: 100)</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-2"><code>currency</code></td>
                          <td className="py-2 px-2">string</td>
                          <td className="py-2 px-2"><Badge size="sm">Oui</Badge></td>
                          <td className="py-2 px-2">Devise (XOF uniquement)</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-2"><code>description</code></td>
                          <td className="py-2 px-2">string</td>
                          <td className="py-2 px-2"><Badge variant="outline" size="sm">Non</Badge></td>
                          <td className="py-2 px-2">Description du paiement</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-2"><code>callback_url</code></td>
                          <td className="py-2 px-2">string</td>
                          <td className="py-2 px-2"><Badge variant="outline" size="sm">Non</Badge></td>
                          <td className="py-2 px-2">URL de notification webhook</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-2"><code>return_url</code></td>
                          <td className="py-2 px-2">string</td>
                          <td className="py-2 px-2"><Badge variant="outline" size="sm">Non</Badge></td>
                          <td className="py-2 px-2">URL de redirection après paiement</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-2"><code>metadata</code></td>
                          <td className="py-2 px-2">object</td>
                          <td className="py-2 px-2"><Badge variant="outline" size="sm">Non</Badge></td>
                          <td className="py-2 px-2">Données personnalisées (max 10 clés)</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2"><code>expires_in</code></td>
                          <td className="py-2 px-2">integer</td>
                          <td className="py-2 px-2"><Badge variant="outline" size="sm">Non</Badge></td>
                          <td className="py-2 px-2">Expiration en minutes (défaut: 60)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Corps de la requête</h4>
                  <CodeBlock 
                    code={`{
  "amount": 5000,
  "currency": "XOF",
  "description": "Achat de produit - Commande #12345",
  "callback_url": "https://votresite.com/webhook/sendavapay",
  "return_url": "https://votresite.com/merci",
  "metadata": {
    "order_id": "12345",
    "customer_email": "client@example.com"
  },
  "expires_in": 30
}`}
                    id="create-payment-body"
                  />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Réponse (succès - 201)</h4>
                  <CodeBlock 
                    code={`{
  "status": "success",
  "data": {
    "transaction_id": "SPY_1702300800_abc123",
    "payment_url": "https://sendavapay.com/pay/SPY_1702300800_abc123",
    "amount": 5000,
    "currency": "XOF",
    "description": "Achat de produit - Commande #12345",
    "status": "pending",
    "created_at": "2025-12-11T10:00:00Z",
    "expires_at": "2025-12-11T10:30:00Z",
    "metadata": {
      "order_id": "12345",
      "customer_email": "client@example.com"
    }
  }
}`}
                    id="create-payment-response"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Récupérer un paiement</CardTitle>
                <CardDescription>
                  <Badge variant="secondary" className="mr-2">GET</Badge>
                  /v1/payments/:id
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Réponse</h4>
                  <CodeBlock 
                    code={`{
  "status": "success",
  "data": {
    "transaction_id": "SPY_1702300800_abc123",
    "status": "completed",
    "amount": 5000,
    "fee": 350,
    "net_amount": 4650,
    "currency": "XOF",
    "description": "Achat de produit - Commande #12345",
    "payer": {
      "name": "Jean Dupont",
      "phone": "+228 99 99 99 99",
      "network": "MTN"
    },
    "created_at": "2025-12-11T10:00:00Z",
    "completed_at": "2025-12-11T10:15:30Z",
    "metadata": {
      "order_id": "12345",
      "customer_email": "client@example.com"
    }
  }
}`}
                    id="get-payment-response"
                  />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Statuts possibles</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">pending</Badge>
                      <span className="text-sm">En attente de paiement</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">processing</Badge>
                      <span className="text-sm">Paiement en cours</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">completed</Badge>
                      <span className="text-sm">Paiement confirmé</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">failed</Badge>
                      <span className="text-sm">Paiement échoué</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">expired</Badge>
                      <span className="text-sm">Lien expiré</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">refunded</Badge>
                      <span className="text-sm">Remboursé</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lister les paiements</CardTitle>
                <CardDescription>
                  <Badge variant="secondary" className="mr-2">GET</Badge>
                  /v1/payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Paramètres de requête</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Paramètre</th>
                          <th className="text-left py-2 px-2">Type</th>
                          <th className="text-left py-2 px-2">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 px-2"><code>page</code></td>
                          <td className="py-2 px-2">integer</td>
                          <td className="py-2 px-2">Numéro de page (défaut: 1)</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-2"><code>limit</code></td>
                          <td className="py-2 px-2">integer</td>
                          <td className="py-2 px-2">Résultats par page (max: 100)</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-2"><code>status</code></td>
                          <td className="py-2 px-2">string</td>
                          <td className="py-2 px-2">Filtrer par statut</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-2"><code>from</code></td>
                          <td className="py-2 px-2">date</td>
                          <td className="py-2 px-2">Date de début (ISO 8601)</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2"><code>to</code></td>
                          <td className="py-2 px-2">date</td>
                          <td className="py-2 px-2">Date de fin (ISO 8601)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Exemple de requête</h4>
                  <CodeBlock 
                    code={`GET /v1/payments?status=completed&from=2025-12-01&limit=20`}
                    id="list-payments-request"
                  />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Réponse</h4>
                  <CodeBlock 
                    code={`{
  "status": "success",
  "data": {
    "payments": [
      {
        "transaction_id": "SPY_1702300800_abc123",
        "amount": 5000,
        "status": "completed",
        "created_at": "2025-12-11T10:00:00Z"
      },
      {
        "transaction_id": "SPY_1702297200_def456",
        "amount": 10000,
        "status": "completed",
        "created_at": "2025-12-11T09:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}`}
                    id="list-payments-response"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transfers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Transferts internes
                </CardTitle>
                <CardDescription>
                  Envoyez de l'argent à d'autres utilisateurs SendavaPay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Créer un transfert</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    <Badge variant="secondary" className="mr-2">POST</Badge>
                    /v1/transfers
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Corps de la requête</h4>
                  <CodeBlock 
                    code={`{
  "recipient_phone": "+228 90 00 00 00",
  "amount": 5000,
  "currency": "XOF",
  "description": "Remboursement commande",
  "reference": "REF-2025-001"
}`}
                    id="transfer-body"
                  />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Réponse</h4>
                  <CodeBlock 
                    code={`{
  "status": "success",
  "data": {
    "transfer_id": "TRF_1702300800_xyz789",
    "amount": 5000,
    "currency": "XOF",
    "recipient": {
      "name": "Marie Konou",
      "phone": "+228 90 00 00 00"
    },
    "status": "completed",
    "created_at": "2025-12-11T10:00:00Z"
  }
}`}
                    id="transfer-response"
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Les transferts internes sont instantanés et sans frais entre utilisateurs SendavaPay.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Retraits Mobile Money
                </CardTitle>
                <CardDescription>
                  Retirez des fonds vers un compte Mobile Money
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Créer un retrait</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    <Badge variant="secondary" className="mr-2">POST</Badge>
                    /v1/withdrawals
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Réseaux supportés</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {["MTN Money", "Moov Money", "Orange Money", "Wave", "Free Money", "T-Money"].map((network) => (
                      <div key={network} className="flex items-center gap-2 p-3 border rounded-lg">
                        <Smartphone className="h-4 w-4 text-primary" />
                        <span className="text-sm">{network}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Corps de la requête</h4>
                  <CodeBlock 
                    code={`{
  "phone_number": "+228 99 99 99 99",
  "network": "MTN",
  "amount": 10000,
  "currency": "XOF"
}`}
                    id="withdrawal-body"
                  />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Réponse</h4>
                  <CodeBlock 
                    code={`{
  "status": "success",
  "data": {
    "withdrawal_id": "WTH_1702300800_abc123",
    "amount": 10000,
    "fee": 700,
    "net_amount": 9300,
    "currency": "XOF",
    "phone_number": "+228 99 99 99 99",
    "network": "MTN",
    "status": "processing",
    "estimated_completion": "2025-12-11T10:05:00Z"
  }
}`}
                    id="withdrawal-response"
                  />
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">Frais de retrait</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Une commission de 7% est appliquée sur chaque retrait. Le montant net sera crédité sur votre compte Mobile Money.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Configuration des Webhooks
                </CardTitle>
                <CardDescription>
                  Recevez des notifications en temps réel pour chaque événement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Configuration</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configurez votre URL de webhook dans le tableau de bord SendavaPay. 
                    Nous enverrons une requête POST à cette URL pour chaque événement.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Types d'événements</h4>
                  <div className="grid gap-2">
                    {[
                      { event: "payment.pending", desc: "Un paiement a été initié" },
                      { event: "payment.completed", desc: "Un paiement a été confirmé" },
                      { event: "payment.failed", desc: "Un paiement a échoué" },
                      { event: "payment.expired", desc: "Un lien de paiement a expiré" },
                      { event: "payment.refunded", desc: "Un paiement a été remboursé" },
                      { event: "withdrawal.processing", desc: "Un retrait est en cours" },
                      { event: "withdrawal.completed", desc: "Un retrait a été effectué" },
                      { event: "withdrawal.failed", desc: "Un retrait a échoué" },
                      { event: "transfer.completed", desc: "Un transfert a été effectué" },
                    ].map((item) => (
                      <div key={item.event} className="flex items-center gap-3 p-2 border rounded-lg">
                        <code className="bg-muted px-2 py-1 rounded text-sm">{item.event}</code>
                        <span className="text-sm text-muted-foreground">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Payload envoyé à votre URL</h4>
                  <CodeBlock 
                    code={`{
  "event": "payment.completed",
  "data": {
    "transaction_id": "SPY_1702300800_abc123",
    "status": "completed",
    "amount": 5000,
    "fee": 350,
    "net_amount": 4650,
    "currency": "XOF",
    "payer": {
      "name": "Jean Dupont",
      "phone": "+228 99 99 99 99",
      "network": "MTN"
    },
    "metadata": {
      "order_id": "12345"
    },
    "completed_at": "2025-12-11T10:15:30Z"
  },
  "timestamp": "2025-12-11T10:15:35Z",
  "signature": "sha256=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}`}
                    id="webhook-payload"
                  />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Vérification de signature</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Chaque webhook inclut une signature HMAC-SHA256 pour vérifier l'authenticité.
                  </p>
                  <CodeBlock 
                    code={`// Node.js - Vérification de signature
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return \`sha256=\${expectedSignature}\` === signature;
}

// Usage
const isValid = verifyWebhookSignature(
  req.body,
  req.headers['x-sendavapay-signature'],
  process.env.WEBHOOK_SECRET
);`}
                    id="signature-verification"
                    language="javascript"
                  />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Réponse attendue</h4>
                  <CodeBlock 
                    code={`{
  "received": true
}`}
                    id="webhook-response"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Votre serveur doit retourner un code HTTP 200 dans les 30 secondes. 
                    En cas d'échec, nous réessaierons jusqu'à 5 fois avec un délai exponentiel.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Codes d'erreur HTTP</CardTitle>
                <CardDescription>
                  L'API utilise les codes de statut HTTP standards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Code</th>
                        <th className="text-left py-3 px-4">Statut</th>
                        <th className="text-left py-3 px-4">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4"><Badge className="bg-green-100 text-green-800">200</Badge></td>
                        <td className="py-3 px-4">OK</td>
                        <td className="py-3 px-4">Requête réussie</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4"><Badge className="bg-green-100 text-green-800">201</Badge></td>
                        <td className="py-3 px-4">Created</td>
                        <td className="py-3 px-4">Ressource créée avec succès</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4"><Badge className="bg-yellow-100 text-yellow-800">400</Badge></td>
                        <td className="py-3 px-4">Bad Request</td>
                        <td className="py-3 px-4">Paramètres invalides</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4"><Badge className="bg-red-100 text-red-800">401</Badge></td>
                        <td className="py-3 px-4">Unauthorized</td>
                        <td className="py-3 px-4">Clé API invalide ou manquante</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4"><Badge className="bg-red-100 text-red-800">403</Badge></td>
                        <td className="py-3 px-4">Forbidden</td>
                        <td className="py-3 px-4">Accès refusé (KYC requis)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4"><Badge className="bg-gray-100 text-gray-800">404</Badge></td>
                        <td className="py-3 px-4">Not Found</td>
                        <td className="py-3 px-4">Ressource introuvable</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4"><Badge className="bg-orange-100 text-orange-800">429</Badge></td>
                        <td className="py-3 px-4">Too Many Requests</td>
                        <td className="py-3 px-4">Limite de requêtes atteinte</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4"><Badge className="bg-red-100 text-red-800">500</Badge></td>
                        <td className="py-3 px-4">Server Error</td>
                        <td className="py-3 px-4">Erreur interne du serveur</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Codes d'erreur API</CardTitle>
                <CardDescription>
                  Codes d'erreur spécifiques retournés dans les réponses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Code</th>
                        <th className="text-left py-3 px-4">Description</th>
                        <th className="text-left py-3 px-4">Solution</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4"><code>invalid_api_key</code></td>
                        <td className="py-3 px-4">Clé API invalide</td>
                        <td className="py-3 px-4">Vérifiez votre clé API</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4"><code>account_not_verified</code></td>
                        <td className="py-3 px-4">Compte non vérifié</td>
                        <td className="py-3 px-4">Complétez la vérification KYC</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4"><code>insufficient_balance</code></td>
                        <td className="py-3 px-4">Solde insuffisant</td>
                        <td className="py-3 px-4">Rechargez votre compte</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4"><code>invalid_amount</code></td>
                        <td className="py-3 px-4">Montant invalide</td>
                        <td className="py-3 px-4">Minimum 100 XOF</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4"><code>invalid_phone</code></td>
                        <td className="py-3 px-4">Numéro invalide</td>
                        <td className="py-3 px-4">Format: +228 XX XX XX XX</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4"><code>payment_not_found</code></td>
                        <td className="py-3 px-4">Transaction introuvable</td>
                        <td className="py-3 px-4">Vérifiez l'ID de transaction</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4"><code>recipient_not_found</code></td>
                        <td className="py-3 px-4">Destinataire introuvable</td>
                        <td className="py-3 px-4">Le numéro n'est pas inscrit</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4"><code>rate_limit_exceeded</code></td>
                        <td className="py-3 px-4">Trop de requêtes</td>
                        <td className="py-3 px-4">Attendez avant de réessayer</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4"><code>internal_error</code></td>
                        <td className="py-3 px-4">Erreur serveur</td>
                        <td className="py-3 px-4">Contactez le support</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Format d'erreur</CardTitle>
              </CardHeader>
              <CardContent>
                <CodeBlock 
                  code={`{
  "status": "error",
  "error": {
    "code": "invalid_amount",
    "message": "Le montant doit être supérieur ou égal à 100 XOF",
    "details": {
      "field": "amount",
      "min_value": 100,
      "provided_value": 50
    }
  }
}`}
                  id="error-format"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <section className="mt-16">
          <h2 className="text-3xl font-bold mb-8">Limites et quotas</h2>
          <Card>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-medium mb-4">Limites de l'API</h4>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">100 requêtes par minute (mode test)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">1000 requêtes par minute (production)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Timeout: 30 secondes par requête</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-4">Limites de transaction</h4>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Minimum: 100 XOF par transaction</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Maximum: 5,000,000 XOF par transaction</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Volume journalier: selon votre niveau KYC</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-16">
          <h2 className="text-3xl font-bold mb-8">Pays et réseaux supportés</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { country: "Togo", code: "+228", networks: ["MTN Money", "Moov Money", "T-Money"] },
              { country: "Bénin", code: "+229", networks: ["MTN Money", "Moov Money"] },
              { country: "Sénégal", code: "+221", networks: ["Orange Money", "Wave", "Free Money"] },
              { country: "Mali", code: "+223", networks: ["Orange Money", "Moov Money"] },
              { country: "Burkina Faso", code: "+226", networks: ["Orange Money", "Moov Money"] },
              { country: "Côte d'Ivoire", code: "+225", networks: ["MTN Money", "Orange Money", "Moov Money", "Wave"] },
            ].map((item) => (
              <Card key={item.country}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="h-6 w-6 text-primary" />
                    <div>
                      <h4 className="font-semibold">{item.country}</h4>
                      <span className="text-sm text-muted-foreground">{item.code}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.networks.map((network) => (
                      <Badge key={network} variant="secondary" className="text-xs">{network}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Card className="mt-16">
          <CardContent className="p-8 text-center">
            <Code className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-2xl font-semibold mb-2">Besoin d'aide ?</h3>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Notre équipe technique est disponible pour vous accompagner dans votre intégration. 
              N'hésitez pas à nous contacter pour toute question.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:support@sendavapay.com">
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  support@sendavapay.com
                </Button>
              </a>
              <a href="https://wa.me/22892299772" target="_blank" rel="noopener noreferrer">
                <Button className="gap-2">
                  <Smartphone className="h-4 w-4" />
                  +228 92 29 97 72
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
