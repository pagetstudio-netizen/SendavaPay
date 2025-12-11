import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Key, CreditCard, RefreshCw, Webhook, Shield } from "lucide-react";

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <Badge className="mb-4">API v1</Badge>
          <h1 className="text-4xl font-bold mb-4">Documentation API SendavaPay</h1>
          <p className="text-xl text-muted-foreground">
            Intégrez SendavaPay à vos applications pour accepter des paiements en Afrique de l'Ouest.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
          <Card>
            <CardContent className="p-6">
              <Key className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Authentification</h3>
              <p className="text-sm text-muted-foreground">
                Utilisez votre clé API pour authentifier toutes vos requêtes.
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
              <Webhook className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Webhooks</h3>
              <p className="text-sm text-muted-foreground">
                Recevez des notifications automatiques pour chaque paiement.
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="auth" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="auth">Authentification</TabsTrigger>
            <TabsTrigger value="payments">Paiements</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="errors">Erreurs</TabsTrigger>
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
                  <h4 className="font-medium mb-2">En-tête d'authentification</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`Authorization: Bearer VOTRE_CLE_API
Content-Type: application/json`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Exemple avec cURL</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`curl -X GET "https://api.sendavapay.com/v1/payments" \\
  -H "Authorization: Bearer sk_live_xxxxxxxx" \\
  -H "Content-Type: application/json"`}
                  </pre>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Important:</strong> Ne partagez jamais votre clé API. Utilisez des variables d'environnement en production.
                  </p>
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
                <div>
                  <h4 className="font-medium mb-2">Corps de la requête</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "amount": 5000,
  "currency": "XOF",
  "description": "Achat de produit",
  "callback_url": "https://votresite.com/webhook"
}`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Réponse (succès)</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "status": "success",
  "data": {
    "transaction_id": "SPY123456",
    "payment_url": "https://sendavapay.com/pay/SPY123456",
    "amount": 5000,
    "currency": "XOF",
    "expires_at": "2025-12-12T12:00:00Z"
  }
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vérifier un paiement</CardTitle>
                <CardDescription>
                  <Badge variant="secondary" className="mr-2">GET</Badge>
                  /v1/payments/:id
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Réponse</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "status": "success",
  "data": {
    "transaction_id": "SPY123456",
    "status": "completed",
    "amount": 5000,
    "currency": "XOF",
    "payer_name": "Jean Dupont",
    "payer_phone": "+228 99 99 99 99",
    "completed_at": "2025-12-11T10:30:00Z"
  }
}`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Statuts possibles</h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800">pending</Badge>
                      <span className="text-sm">En attente de paiement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">completed</Badge>
                      <span className="text-sm">Paiement confirmé</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-800">failed</Badge>
                      <span className="text-sm">Paiement échoué</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gray-100 text-gray-800">expired</Badge>
                      <span className="text-sm">Lien expiré</span>
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
                  Notifications Webhook
                </CardTitle>
                <CardDescription>
                  Recevez des notifications en temps réel pour chaque événement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Payload envoyé à votre URL</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "event": "payment.completed",
  "data": {
    "transaction_id": "SPY123456",
    "status": "completed",
    "amount": 5000,
    "currency": "XOF",
    "payer_name": "Jean Dupont",
    "payer_phone": "+228 99 99 99 99",
    "completed_at": "2025-12-11T10:30:00Z"
  },
  "timestamp": "2025-12-11T10:30:05Z"
}`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Réponse attendue</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "received": true
}`}
                  </pre>
                  <p className="text-sm text-muted-foreground mt-2">
                    Votre serveur doit retourner un code HTTP 200 avec cette réponse.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Types d'événements</h4>
                  <ul className="space-y-2 text-sm">
                    <li><code className="bg-muted px-2 py-1 rounded">payment.pending</code> - Paiement initié</li>
                    <li><code className="bg-muted px-2 py-1 rounded">payment.completed</code> - Paiement confirmé</li>
                    <li><code className="bg-muted px-2 py-1 rounded">payment.failed</code> - Paiement échoué</li>
                    <li><code className="bg-muted px-2 py-1 rounded">payment.expired</code> - Lien expiré</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Codes d'erreur</CardTitle>
                <CardDescription>
                  Liste des codes d'erreur possibles et leur signification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Code</th>
                        <th className="text-left py-3 px-4">Statut HTTP</th>
                        <th className="text-left py-3 px-4">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4"><code>invalid_api_key</code></td>
                        <td className="py-3 px-4">401</td>
                        <td className="py-3 px-4">Clé API invalide ou manquante</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4"><code>account_not_verified</code></td>
                        <td className="py-3 px-4">403</td>
                        <td className="py-3 px-4">Compte non vérifié (KYC requis)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4"><code>invalid_amount</code></td>
                        <td className="py-3 px-4">400</td>
                        <td className="py-3 px-4">Montant invalide (min: 100 XOF)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4"><code>payment_not_found</code></td>
                        <td className="py-3 px-4">404</td>
                        <td className="py-3 px-4">Transaction introuvable</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4"><code>rate_limit_exceeded</code></td>
                        <td className="py-3 px-4">429</td>
                        <td className="py-3 px-4">Trop de requêtes</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4"><code>internal_error</code></td>
                        <td className="py-3 px-4">500</td>
                        <td className="py-3 px-4">Erreur serveur</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exemple d'erreur</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "status": "error",
  "error": {
    "code": "invalid_amount",
    "message": "Le montant doit être supérieur ou égal à 100 XOF"
  }
}`}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-12">
          <CardContent className="p-8 text-center">
            <Code className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Besoin d'aide ?</h3>
            <p className="text-muted-foreground mb-4">
              Notre équipe technique est disponible pour vous accompagner dans votre intégration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:support@sendavapay.com" className="text-primary hover:underline">
                support@sendavapay.com
              </a>
              <span className="hidden sm:inline text-muted-foreground">|</span>
              <a href="https://wa.me/22899935673" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                +228 99 93 56 73
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
