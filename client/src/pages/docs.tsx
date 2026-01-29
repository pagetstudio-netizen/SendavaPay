import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  Copy, 
  Check, 
  Code2, 
  Key, 
  Webhook, 
  CreditCard,
  ArrowLeft,
  ExternalLink,
  Zap,
  Shield,
  FileCode,
  Wrench,
  Loader2
} from "lucide-react";

export default function ApiDocs() {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: maintenanceStatus, isLoading: maintenanceLoading } = useQuery<{ enabled: boolean }>({
    queryKey: ['/api/api-maintenance-status'],
    refetchInterval: 10000,
  });

  useEffect(() => {
    document.title = "Documentation API - SendavaPay";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Documentation compl\u00e8te de l'API SendavaPay pour int\u00e9grer les paiements Mobile Money dans vos applications. Exemples de code en JavaScript, PHP et Python.");
    }
  }, []);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast({ title: "Code copi\u00e9" });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, language, id }: { code: string; language: string; id: string }) => (
    <div className="relative">
      <div className="absolute right-2 top-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyCode(code, id)}
          data-testid={`button-copy-${id}`}
        >
          {copiedCode === id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );

  const endpoints = [
    {
      method: "POST",
      path: "/api/v1/create-payment",
      description: "Cr\u00e9er un nouveau lien de paiement",
      params: [
        { name: "amount", type: "number", required: true, description: "Montant du paiement" },
        { name: "currency", type: "string", required: false, description: "Devise (d\u00e9faut: XOF)" },
        { name: "description", type: "string", required: false, description: "Description du paiement" },
        { name: "externalReference", type: "string", required: false, description: "R\u00e9f\u00e9rence externe" },
        { name: "customerEmail", type: "string", required: false, description: "Email du client" },
        { name: "customerPhone", type: "string", required: false, description: "T\u00e9l\u00e9phone du client" },
        { name: "customerName", type: "string", required: false, description: "Nom du client" },
        { name: "redirectUrl", type: "string", required: false, description: "URL de redirection apr\u00e8s paiement" },
        { name: "metadata", type: "object", required: false, description: "Donn\u00e9es personnalis\u00e9es" },
      ],
      response: `{
  "success": true,
  "data": {
    "reference": "pay_abc123_xyz789",
    "amount": 5000,
    "currency": "XOF",
    "status": "pending",
    "paymentUrl": "https://sendavapay.com/pay/pay_abc123_xyz789",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}`,
    },
    {
      method: "POST",
      path: "/api/v1/verify-payment",
      description: "V\u00e9rifier le statut d'un paiement",
      params: [
        { name: "reference", type: "string", required: true, description: "R\u00e9f\u00e9rence du paiement" },
      ],
      response: `{
  "success": true,
  "data": {
    "reference": "pay_abc123_xyz789",
    "externalReference": "ORDER-123",
    "amount": "5000",
    "fee": "350",
    "currency": "XOF",
    "status": "completed",
    "customerEmail": "client@email.com",
    "customerPhone": "+22890123456",
    "customerName": "Jean Dupont",
    "paymentMethod": "mtn_tg",
    "createdAt": "2024-01-15T10:30:00Z",
    "completedAt": "2024-01-15T10:35:00Z"
  }
}`,
    },
    {
      method: "POST",
      path: "/api/v1/credit-account",
      description: "Cr\u00e9diter un compte utilisateur SendavaPay",
      params: [
        { name: "phone", type: "string", required: true, description: "Num\u00e9ro de t\u00e9l\u00e9phone du compte" },
        { name: "amount", type: "number", required: true, description: "Montant \u00e0 cr\u00e9diter" },
        { name: "description", type: "string", required: false, description: "Description du cr\u00e9dit" },
        { name: "externalReference", type: "string", required: false, description: "R\u00e9f\u00e9rence externe" },
      ],
      response: `{
  "success": true,
  "data": {
    "reference": "pay_def456_uvw123",
    "amount": 10000,
    "phone": "+22890123456",
    "userName": "Jean Dupont",
    "status": "completed",
    "createdAt": "2024-01-15T11:00:00Z"
  }
}`,
    },
    {
      method: "GET",
      path: "/api/v1/balance",
      description: "Consulter le solde d'un compte utilisateur",
      params: [
        { name: "phone", type: "string", required: true, description: "Num\u00e9ro de t\u00e9l\u00e9phone (query param)" },
      ],
      response: `{
  "success": true,
  "data": {
    "phone": "+22890123456",
    "balance": "150000",
    "currency": "XOF",
    "name": "Jean Dupont",
    "isVerified": true
  }
}`,
    },
    {
      method: "GET",
      path: "/api/v1/transactions",
      description: "Lister toutes vos transactions API",
      params: [],
      response: `{
  "success": true,
  "data": {
    "transactions": [...],
    "total": 50
  }
}`,
    },
  ];

  const jsExample = `// Installation: npm install axios
const axios = require('axios');

const API_KEY = 'sk_live_votre_cle_api';
const BASE_URL = 'https://sendavapay.com/api/v1';

// Cr\u00e9er un paiement
async function createPayment(amount, description) {
  try {
    const response = await axios.post(
      \`\${BASE_URL}/v1/create-payment\`,
      {
        amount,
        description,
        currency: 'XOF',
        customerEmail: 'client@email.com'
      },
      {
        headers: {
          'Authorization': \`Bearer \${API_KEY}\`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Paiement cr\u00e9\u00e9:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur:', error.response?.data);
    throw error;
  }
}

// V\u00e9rifier un paiement
async function verifyPayment(reference) {
  const response = await axios.post(
    \`\${BASE_URL}/v1/verify-payment\`,
    { reference },
    {
      headers: {
        'Authorization': \`Bearer \${API_KEY}\`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
}

// Cr\u00e9diter un compte
async function creditAccount(phone, amount, description) {
  const response = await axios.post(
    \`\${BASE_URL}/v1/credit-account\`,
    { phone, amount, description },
    {
      headers: {
        'Authorization': \`Bearer \${API_KEY}\`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
}

// Consulter le solde
async function getBalance(phone) {
  const response = await axios.get(
    \`\${BASE_URL}/v1/balance?phone=\${encodeURIComponent(phone)}\`,
    {
      headers: {
        'Authorization': \`Bearer \${API_KEY}\`
      }
    }
  );
  
  return response.data;
}`;

  const phpExample = `<?php
// Configuration
$apiKey = 'sk_live_votre_cle_api';
$baseUrl = 'https://sendavapay.com/api/v1';

// Fonction pour faire les requ\u00eates API
function sendRequest($method, $endpoint, $data = null) {
    global $apiKey, $baseUrl;
    
    $ch = curl_init();
    $url = $baseUrl . $endpoint;
    
    $headers = [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json'
    ];
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'status' => $httpCode,
        'data' => json_decode($response, true)
    ];
}

// Cr\u00e9er un paiement
function createPayment($amount, $description, $customerEmail = null) {
    $data = [
        'amount' => $amount,
        'description' => $description,
        'currency' => 'XOF'
    ];
    
    if ($customerEmail) {
        $data['customerEmail'] = $customerEmail;
    }
    
    return sendRequest('POST', '/v1/create-payment', $data);
}

// V\u00e9rifier un paiement
function verifyPayment($reference) {
    return sendRequest('POST', '/v1/verify-payment', [
        'reference' => $reference
    ]);
}

// Cr\u00e9diter un compte
function creditAccount($phone, $amount, $description = null) {
    $data = [
        'phone' => $phone,
        'amount' => $amount
    ];
    
    if ($description) {
        $data['description'] = $description;
    }
    
    return sendRequest('POST', '/v1/credit-account', $data);
}

// Consulter le solde
function getBalance($phone) {
    return sendRequest('GET', '/v1/balance?phone=' . urlencode($phone));
}

// Exemple d'utilisation
$result = createPayment(5000, 'Achat produit XYZ');
print_r($result);
?>`;

  const pythonExample = `import requests
import json

# Configuration
API_KEY = 'sk_live_votre_cle_api'
BASE_URL = 'https://sendavapay.com/api/v1'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

def create_payment(amount, description, customer_email=None):
    """Cr\u00e9er un nouveau paiement"""
    data = {
        'amount': amount,
        'description': description,
        'currency': 'XOF'
    }
    
    if customer_email:
        data['customerEmail'] = customer_email
    
    response = requests.post(
        f'{BASE_URL}/v1/create-payment',
        headers=headers,
        json=data
    )
    
    return response.json()

def verify_payment(reference):
    """V\u00e9rifier le statut d'un paiement"""
    response = requests.post(
        f'{BASE_URL}/v1/verify-payment',
        headers=headers,
        json={'reference': reference}
    )
    
    return response.json()

def credit_account(phone, amount, description=None):
    """Cr\u00e9diter un compte utilisateur"""
    data = {
        'phone': phone,
        'amount': amount
    }
    
    if description:
        data['description'] = description
    
    response = requests.post(
        f'{BASE_URL}/v1/credit-account',
        headers=headers,
        json=data
    )
    
    return response.json()

def get_balance(phone):
    """Consulter le solde d'un compte"""
    response = requests.get(
        f'{BASE_URL}/v1/balance',
        headers=headers,
        params={'phone': phone}
    )
    
    return response.json()

# Exemple d'utilisation
if __name__ == '__main__':
    # Cr\u00e9er un paiement
    result = create_payment(5000, 'Achat produit XYZ')
    print('Paiement cr\u00e9\u00e9:', json.dumps(result, indent=2))
    
    # V\u00e9rifier le paiement
    if result.get('success'):
        reference = result['data']['reference']
        status = verify_payment(reference)
        print('Statut:', json.dumps(status, indent=2))`;

  const webhookExample = `// Exemple de r\u00e9ception de webhook (Node.js/Express)
const crypto = require('crypto');
const express = require('express');
const app = express();

app.use(express.json());

const WEBHOOK_SECRET = 'whsec_votre_secret_webhook';

// V\u00e9rifier la signature du webhook
function verifyWebhookSignature(payload, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === expectedSignature;
}

app.post('/webhook/sendavapay', (req, res) => {
  const signature = req.headers['x-sendavapay-signature'];
  const event = req.headers['x-sendavapay-event'];
  
  // V\u00e9rifier la signature
  if (!verifyWebhookSignature(req.body, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const { data, timestamp } = req.body;
  
  // Traiter l'\u00e9v\u00e9nement
  switch (event) {
    case 'payment.completed':
      console.log('Paiement re\u00e7u:', data);
      // Mettre \u00e0 jour votre base de donn\u00e9es
      // Envoyer un email de confirmation
      break;
      
    case 'payment.failed':
      console.log('Paiement \u00e9chou\u00e9:', data);
      // G\u00e9rer l'\u00e9chec
      break;
      
    case 'credit.completed':
      console.log('Cr\u00e9dit effectu\u00e9:', data);
      break;
      
    default:
      console.log('Event inconnu:', event);
  }
  
  res.json({ received: true });
});

app.listen(3000);`;

  if (maintenanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (maintenanceStatus?.enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-lg w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Wrench className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <CardTitle className="text-2xl">API en maintenance</CardTitle>
            <CardDescription className="text-base">
              L'API et la documentation sont temporairement indisponibles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Nous effectuons actuellement des travaux de maintenance sur notre API. 
              Veuillez réessayer dans quelques instants.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Les paiements via liens de paiement restent fonctionnels. 
                Seule l'API développeur est temporairement désactivée.
              </p>
            </div>
            <Button onClick={() => window.location.href = "/"} variant="outline" data-testid="button-go-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Accueil
            </a>
            <div className="flex items-center gap-2">
              <FileCode className="h-6 w-6 text-primary" />
              <h1 className="font-bold text-xl">Documentation API</h1>
            </div>
          </div>
          <a href="/dashboard/api-keys">
            <Button data-testid="button-api-keys-portal">
              Gérer mes clés API
              <Key className="h-4 w-4 ml-2" />
            </Button>
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-12">
          <section className="text-center space-y-4">
            <h2 className="text-3xl font-bold">API SendavaPay</h2>
            <p className="text-lg text-muted-foreground">
              Int\u00e9grez facilement les paiements Mobile Money dans vos applications
            </p>
            <div className="flex justify-center gap-4">
              <Badge variant="outline" className="text-sm py-1 px-3">
                <Zap className="h-3 w-3 mr-1" />
                API RESTful
              </Badge>
              <Badge variant="outline" className="text-sm py-1 px-3">
                <Shield className="h-3 w-3 mr-1" />
                S\u00e9curis\u00e9 SSL
              </Badge>
              <Badge variant="outline" className="text-sm py-1 px-3">
                <Webhook className="h-3 w-3 mr-1" />
                Webhooks
              </Badge>
            </div>
          </section>

          <Card id="getting-started">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                D\u00e9marrage rapide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Créez un compte SendavaPay</strong> - Inscrivez-vous sur{" "}
                  <a href="/register" className="text-primary hover:underline">SendavaPay</a> et complétez la vérification KYC
                </li>
                <li>
                  <strong className="text-foreground">Générez votre clé API</strong> - Dans votre{" "}
                  <a href="/dashboard/api-keys" className="text-primary hover:underline">tableau de bord</a>, créez et copiez votre clé API
                </li>
                <li>
                  <strong className="text-foreground">Intégrez l'API</strong> - Utilisez les exemples ci-dessous pour commencer
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card id="authentication">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Authentification
              </CardTitle>
              <CardDescription>
                Toutes les requ\u00eates API doivent \u00eatre authentifi\u00e9es avec votre cl\u00e9 API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Incluez votre cl\u00e9 API dans l'en-t\u00eate <code className="bg-muted px-2 py-1 rounded">Authorization</code> de chaque requ\u00eate:
              </p>
              <CodeBlock
                id="auth-header"
                language="bash"
                code={`Authorization: Bearer sk_live_votre_cle_api`}
              />
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Important:</strong> Ne partagez jamais votre cl\u00e9 API. Gardez-la c\u00f4t\u00e9 serveur uniquement.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card id="endpoints">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Endpoints API
              </CardTitle>
              <CardDescription>
                Base URL: <code className="bg-muted px-2 py-1 rounded">https://sendavapay.com/api/v1</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {endpoints.map((endpoint, index) => (
                <div key={index} className="border-b pb-6 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className={endpoint.method === "GET" ? "bg-blue-500" : "bg-green-500"}>
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm font-mono">{endpoint.path}</code>
                  </div>
                  <p className="text-muted-foreground mb-4">{endpoint.description}</p>
                  
                  {endpoint.params.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Param\u00e8tres</h4>
                      <div className="bg-muted rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-3">Nom</th>
                              <th className="text-left p-3">Type</th>
                              <th className="text-left p-3">Requis</th>
                              <th className="text-left p-3">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {endpoint.params.map((param, i) => (
                              <tr key={i} className="border-b last:border-0">
                                <td className="p-3 font-mono">{param.name}</td>
                                <td className="p-3">{param.type}</td>
                                <td className="p-3">
                                  {param.required ? (
                                    <Badge className="bg-red-500">Oui</Badge>
                                  ) : (
                                    <Badge variant="outline">Non</Badge>
                                  )}
                                </td>
                                <td className="p-3 text-muted-foreground">{param.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium mb-2">R\u00e9ponse</h4>
                    <CodeBlock id={`response-${index}`} language="json" code={endpoint.response} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card id="code-examples">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                Exemples de code
              </CardTitle>
              <CardDescription>
                Exemples d'int\u00e9gration dans diff\u00e9rents langages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="javascript">
                <TabsList className="mb-4">
                  <TabsTrigger value="javascript" data-testid="tab-js">JavaScript</TabsTrigger>
                  <TabsTrigger value="php" data-testid="tab-php">PHP</TabsTrigger>
                  <TabsTrigger value="python" data-testid="tab-python">Python</TabsTrigger>
                </TabsList>
                
                <TabsContent value="javascript">
                  <CodeBlock id="js-example" language="javascript" code={jsExample} />
                </TabsContent>
                
                <TabsContent value="php">
                  <CodeBlock id="php-example" language="php" code={phpExample} />
                </TabsContent>
                
                <TabsContent value="python">
                  <CodeBlock id="python-example" language="python" code={pythonExample} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card id="webhooks">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhooks
              </CardTitle>
              <CardDescription>
                Recevez des notifications en temps r\u00e9el pour les \u00e9v\u00e9nements de paiement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">\u00c9v\u00e9nements disponibles</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    <code className="bg-muted px-2 py-1 rounded">payment.completed</code> - Paiement r\u00e9ussi
                  </li>
                  <li>
                    <code className="bg-muted px-2 py-1 rounded">payment.failed</code> - Paiement \u00e9chou\u00e9
                  </li>
                  <li>
                    <code className="bg-muted px-2 py-1 rounded">credit.completed</code> - Cr\u00e9dit effectu\u00e9
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Structure du webhook</h4>
                <CodeBlock
                  id="webhook-structure"
                  language="json"
                  code={`{
  "event": "payment.completed",
  "data": {
    "reference": "pay_abc123_xyz789",
    "amount": 5000,
    "currency": "XOF",
    "customerPhone": "+22890123456"
  },
  "timestamp": "2024-01-15T10:35:00Z"
}`}
                />
              </div>
              
              <div>
                <h4 className="font-medium mb-2">En-t\u00eates de la requ\u00eate</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    <code className="bg-muted px-2 py-1 rounded">X-SendavaPay-Signature</code> - Signature HMAC-SHA256
                  </li>
                  <li>
                    <code className="bg-muted px-2 py-1 rounded">X-SendavaPay-Event</code> - Type d'\u00e9v\u00e9nement
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Exemple de r\u00e9ception</h4>
                <CodeBlock id="webhook-example" language="javascript" code={webhookExample} />
              </div>
            </CardContent>
          </Card>

          <Card id="errors">
            <CardHeader>
              <CardTitle>Codes d'erreur</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Code HTTP</th>
                      <th className="text-left p-3">Code</th>
                      <th className="text-left p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3">401</td>
                      <td className="p-3 font-mono">UNAUTHORIZED</td>
                      <td className="p-3 text-muted-foreground">Cl\u00e9 API manquante</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">401</td>
                      <td className="p-3 font-mono">INVALID_API_KEY</td>
                      <td className="p-3 text-muted-foreground">Cl\u00e9 API invalide</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">403</td>
                      <td className="p-3 font-mono">ACCOUNT_SUSPENDED</td>
                      <td className="p-3 text-muted-foreground">Compte suspendu ou non vérifié</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">404</td>
                      <td className="p-3 font-mono">PAYMENT_NOT_FOUND</td>
                      <td className="p-3 text-muted-foreground">Paiement non trouv\u00e9</td>
                    </tr>
                    <tr>
                      <td className="p-3">404</td>
                      <td className="p-3 font-mono">USER_NOT_FOUND</td>
                      <td className="p-3 text-muted-foreground">Utilisateur non trouv\u00e9</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Besoin d'aide ? Contactez notre support technique
            </p>
            <a href="/dashboard/api-keys">
              <Button size="lg" data-testid="button-start-integration">
                <Key className="h-5 w-5 mr-2" />
                Générer ma clé API
              </Button>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
