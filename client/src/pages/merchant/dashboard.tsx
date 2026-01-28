import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Copy, 
  Key, 
  RefreshCw, 
  Webhook, 
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
  FileText,
  Loader2,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Wallet
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Merchant {
  id: number;
  name: string;
  email: string;
  companyName: string | null;
  website: string | null;
  balance: string;
  status: string;
  isVerified: boolean;
  apiKey: string;
  webhookUrl: string | null;
  createdAt: string;
}

interface ApiTransaction {
  id: number;
  reference: string;
  externalReference: string | null;
  type: string;
  amount: string;
  fee: string;
  currency: string;
  status: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerName: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface Webhook {
  id: number;
  url: string;
  events: string;
  isActive: boolean;
  lastTriggered: string | null;
  failureCount: number;
}

export default function MerchantDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isRegeneratingKeys, setIsRegeneratingKeys] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState("payment.completed,credit.completed");

  useEffect(() => {
    document.title = "Tableau de bord Marchand - SendavaPay";
  }, []);
  const [isAddingWebhook, setIsAddingWebhook] = useState(false);

  useEffect(() => {
    loadMerchantData();
  }, []);

  const loadMerchantData = async () => {
    try {
      const [merchantRes, transactionsRes, webhooksRes] = await Promise.all([
        fetch("/api/merchant/me"),
        fetch("/api/merchant/transactions"),
        fetch("/api/merchant/webhooks"),
      ]);

      const merchantData = await merchantRes.json();
      const transactionsData = await transactionsRes.json();
      const webhooksData = await webhooksRes.json();

      if (!merchantData.success) {
        setLocation("/merchant");
        return;
      }

      setMerchant(merchantData.merchant);
      setTransactions(transactionsData.transactions || []);
      setWebhooks(webhooksData.webhooks || []);
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de charger les donn\u00e9es", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/merchant/logout", { method: "POST" });
    setLocation("/merchant");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copi\u00e9", description: `${label} copi\u00e9 dans le presse-papier` });
  };

  const regenerateKeys = async () => {
    if (!confirm("\u00cates-vous s\u00fbr de vouloir r\u00e9g\u00e9n\u00e9rer vos cl\u00e9s API ? Les anciennes cl\u00e9s seront invalid\u00e9es.")) {
      return;
    }

    setIsRegeneratingKeys(true);
    try {
      const response = await fetch("/api/merchant/regenerate-keys", { method: "POST" });
      const data = await response.json();

      if (data.success) {
        setMerchant(prev => prev ? { ...prev, apiKey: data.apiKey } : null);
        toast({ title: "Cl\u00e9s r\u00e9g\u00e9n\u00e9r\u00e9es", description: "Vos nouvelles cl\u00e9s API ont \u00e9t\u00e9 g\u00e9n\u00e9r\u00e9es" });
      }
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setIsRegeneratingKeys(false);
    }
  };

  const addWebhook = async () => {
    if (!newWebhookUrl) return;

    setIsAddingWebhook(true);
    try {
      const response = await fetch("/api/merchant/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newWebhookUrl, events: newWebhookEvents }),
      });

      const data = await response.json();
      if (data.success) {
        setWebhooks(prev => [...prev, data.webhook]);
        setNewWebhookUrl("");
        toast({ title: "Webhook ajout\u00e9" });
      }
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setIsAddingWebhook(false);
    }
  };

  const deleteWebhook = async (id: number) => {
    try {
      await fetch(`/api/merchant/webhooks/${id}`, { method: "DELETE" });
      setWebhooks(prev => prev.filter(w => w.id !== id));
      toast({ title: "Webhook supprim\u00e9" });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("fr-FR").format(parseFloat(amount)) + " XOF";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Compl\u00e9t\u00e9</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />\u00c9chou\u00e9</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case "credit":
        return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!merchant) {
    return null;
  }

  const completedTransactions = transactions.filter(t => t.status === "completed");
  const totalVolume = completedTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">{merchant.companyName || merchant.name}</h1>
              <p className="text-sm text-muted-foreground">{merchant.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation("/docs")} data-testid="button-docs">
              <FileText className="h-4 w-4 mr-2" />
              Documentation
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solde</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(merchant.balance)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalVolume.toString())}</div>
              <p className="text-xs text-muted-foreground">{completedTransactions.length} transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Statut</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge className={merchant.status === "active" ? "bg-green-500" : "bg-yellow-500"}>
                  {merchant.status === "active" ? "Actif" : "En attente"}
                </Badge>
                {merchant.isVerified && <Badge variant="outline">V\u00e9rifi\u00e9</Badge>}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
            <TabsTrigger value="api-keys" data-testid="tab-api-keys">Cl\u00e9s API</TabsTrigger>
            <TabsTrigger value="webhooks" data-testid="tab-webhooks">Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transactions r\u00e9centes</CardTitle>
                <CardDescription>Historique de vos transactions API</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune transaction pour le moment
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>R\u00e9f\u00e9rence</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                          <TableCell className="font-mono text-sm">{transaction.reference}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(transaction.type)}
                              <span className="capitalize">{transaction.type}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(transaction.amount)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {transaction.customerName || transaction.customerPhone || "-"}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(transaction.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-keys">
            <Card>
              <CardHeader>
                <CardTitle>Cl\u00e9s API</CardTitle>
                <CardDescription>
                  Utilisez ces cl\u00e9s pour authentifier vos requ\u00eates API. Gardez-les confidentielles.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>Cl\u00e9 API Publique</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        value={merchant.apiKey}
                        readOnly
                        className="font-mono"
                        data-testid="input-api-key"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowApiKey(!showApiKey)}
                        data-testid="button-toggle-api-key"
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(merchant.apiKey, "Cl\u00e9 API")}
                        data-testid="button-copy-api-key"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={regenerateKeys}
                    disabled={isRegeneratingKeys}
                    data-testid="button-regenerate-keys"
                  >
                    {isRegeneratingKeys ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    R\u00e9g\u00e9n\u00e9rer les cl\u00e9s
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Attention: Cette action invalidera vos cl\u00e9s actuelles.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks">
            <Card>
              <CardHeader>
                <CardTitle>Webhooks</CardTitle>
                <CardDescription>
                  Configurez des URLs pour recevoir des notifications en temps r\u00e9el
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://votre-site.com/webhook"
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                    data-testid="input-webhook-url"
                  />
                  <Button onClick={addWebhook} disabled={isAddingWebhook || !newWebhookUrl} data-testid="button-add-webhook">
                    {isAddingWebhook ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>

                {webhooks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun webhook configur\u00e9
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>URL</TableHead>
                        <TableHead>\u00c9v\u00e9nements</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {webhooks.map((webhook) => (
                        <TableRow key={webhook.id} data-testid={`row-webhook-${webhook.id}`}>
                          <TableCell className="font-mono text-sm">{webhook.url}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {webhook.events.split(",").map((event) => (
                                <Badge key={event} variant="outline" className="text-xs">
                                  {event}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={webhook.isActive ? "bg-green-500" : "bg-gray-500"}>
                              {webhook.isActive ? "Actif" : "Inactif"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteWebhook(webhook.id)}
                              data-testid={`button-delete-webhook-${webhook.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">\u00c9v\u00e9nements disponibles</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li><code>payment.completed</code> - Paiement r\u00e9ussi</li>
                    <li><code>payment.failed</code> - Paiement \u00e9chou\u00e9</li>
                    <li><code>credit.completed</code> - Cr\u00e9dit effectu\u00e9</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
