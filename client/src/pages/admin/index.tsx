import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Users,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Shield,
  Key,
  Percent,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Ban,
  Unlock,
  Trash2,
  Mail,
  Settings,
  BarChart3,
  History,
} from "lucide-react";
import type { User, Transaction, KycRequest, ApiKey } from "@shared/schema";
import { useState } from "react";

interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  totalDeposits: string;
  totalWithdrawals: string;
  totalCommissions: string;
  pendingKyc: number;
  activeApiKeys: number;
  commissionRate: string;
}

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-FR").format(num) + " XOF";
}

function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function DashboardContent() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const statCards = [
    { title: "Utilisateurs", value: stats?.totalUsers || 0, description: `${stats?.verifiedUsers || 0} vérifiés`, icon: Users, color: "text-blue-500", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
    { title: "Total Dépôts", value: formatCurrency(stats?.totalDeposits || 0), description: "Montant total", icon: ArrowDownLeft, color: "text-green-500", bgColor: "bg-green-100 dark:bg-green-900/30" },
    { title: "Total Retraits", value: formatCurrency(stats?.totalWithdrawals || 0), description: "Montant total", icon: ArrowUpRight, color: "text-orange-500", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
    { title: "Commissions", value: formatCurrency(stats?.totalCommissions || 0), description: `Taux: ${stats?.commissionRate || 7}%`, icon: Percent, color: "text-purple-500", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
    { title: "KYC en attente", value: stats?.pendingKyc || 0, description: "Demandes à traiter", icon: Shield, color: "text-yellow-500", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
    { title: "Clés API actives", value: stats?.activeApiKeys || 0, description: "Intégrations", icon: Key, color: "text-indigo-500", bgColor: "bg-indigo-100 dark:bg-indigo-900/30" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord administrateur</h1>
        <p className="text-muted-foreground">Vue d'ensemble de la plateforme SendavaPay</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? Array(6).fill(0).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
        )) : statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function UsersContent() {
  const { toast } = useToast();
  const { data: users, isLoading } = useQuery<User[]>({ queryKey: ["/api/admin/users"] });

  const blockMutation = useMutation({
    mutationFn: async ({ userId, block }: { userId: number; block: boolean }) => {
      await apiRequest("POST", `/api/admin/users/${userId}/${block ? "block" : "unblock"}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Succès", description: "Statut utilisateur mis à jour" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
        <p className="text-muted-foreground">Gérez les comptes utilisateurs</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Utilisateur</th>
                  <th className="text-left p-4 font-medium">Contact</th>
                  <th className="text-left p-4 font-medium">Solde</th>
                  <th className="text-left p-4 font-medium">Statut</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center"><Skeleton className="h-8 w-full" /></td></tr>
                ) : !users?.length ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Aucun utilisateur</td></tr>
                ) : users.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="p-4">
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-sm text-muted-foreground">{user.role}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{user.email}</p>
                      <p className="text-sm text-muted-foreground">{user.phone}</p>
                    </td>
                    <td className="p-4 font-medium">{formatCurrency(user.balance)}</td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap">
                        {user.isVerified && <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30">Vérifié</Badge>}
                        {user.isBlocked && <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30">Bloqué</Badge>}
                        {!user.isVerified && !user.isBlocked && <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/30">Non vérifié</Badge>}
                      </div>
                    </td>
                    <td className="p-4">
                      <Button
                        size="sm"
                        variant={user.isBlocked ? "default" : "destructive"}
                        onClick={() => blockMutation.mutate({ userId: user.id, block: !user.isBlocked })}
                        disabled={user.role === "admin"}
                      >
                        {user.isBlocked ? <Unlock className="h-4 w-4 mr-1" /> : <Ban className="h-4 w-4 mr-1" />}
                        {user.isBlocked ? "Débloquer" : "Bloquer"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TransactionsContent() {
  const { data: transactions, isLoading } = useQuery<Transaction[]>({ queryKey: ["/api/admin/transactions"] });

  const typeLabels: Record<string, string> = {
    deposit: "Dépôt", withdrawal: "Retrait", transfer_in: "Reçu", transfer_out: "Envoyé", payment_received: "Paiement"
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-muted-foreground">Historique de toutes les transactions</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">ID</th>
                  <th className="text-left p-4 font-medium">Type</th>
                  <th className="text-left p-4 font-medium">Montant</th>
                  <th className="text-left p-4 font-medium">Frais</th>
                  <th className="text-left p-4 font-medium">Statut</th>
                  <th className="text-left p-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center"><Skeleton className="h-8 w-full" /></td></tr>
                ) : !transactions?.length ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Aucune transaction</td></tr>
                ) : transactions.map((tx) => (
                  <tr key={tx.id} className="border-b">
                    <td className="p-4 font-mono text-sm">{tx.id}</td>
                    <td className="p-4">{typeLabels[tx.type] || tx.type}</td>
                    <td className="p-4 font-medium">{formatCurrency(tx.amount)}</td>
                    <td className="p-4 text-muted-foreground">{formatCurrency(tx.fee)}</td>
                    <td className="p-4">
                      <Badge className={tx.status === "completed" ? "bg-green-100 text-green-700" : tx.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>
                        {tx.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{formatDate(tx.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WithdrawalsContent() {
  const { toast } = useToast();
  const { data: withdrawals, isLoading } = useQuery<Transaction[]>({ queryKey: ["/api/admin/withdrawals"] });

  const approveMutation = useMutation({
    mutationFn: async ({ id, approve }: { id: number; approve: boolean }) => {
      await apiRequest("POST", `/api/admin/withdrawals/${id}/${approve ? "approve" : "reject"}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      toast({ title: "Succès", description: "Retrait traité" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Demandes de retrait</h1>
        <p className="text-muted-foreground">Approuvez ou rejetez les retraits</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">ID</th>
                  <th className="text-left p-4 font-medium">Montant</th>
                  <th className="text-left p-4 font-medium">Numéro</th>
                  <th className="text-left p-4 font-medium">Statut</th>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center"><Skeleton className="h-8 w-full" /></td></tr>
                ) : !withdrawals?.length ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Aucun retrait en attente</td></tr>
                ) : withdrawals.map((w) => (
                  <tr key={w.id} className="border-b">
                    <td className="p-4 font-mono text-sm">{w.id}</td>
                    <td className="p-4 font-medium">{formatCurrency(w.amount)}</td>
                    <td className="p-4">{w.mobileNumber || "-"}</td>
                    <td className="p-4">
                      <Badge className={w.status === "completed" ? "bg-green-100 text-green-700" : w.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>
                        {w.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{formatDate(w.createdAt)}</td>
                    <td className="p-4 flex gap-2">
                      {w.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => approveMutation.mutate({ id: w.id, approve: true })}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Approuver
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => approveMutation.mutate({ id: w.id, approve: false })}>
                            <XCircle className="h-4 w-4 mr-1" /> Rejeter
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KycContent() {
  const { toast } = useToast();
  const { data: requests, isLoading } = useQuery<KycRequest[]>({ queryKey: ["/api/admin/kyc"] });

  const approveMutation = useMutation({
    mutationFn: async ({ id, approve }: { id: number; approve: boolean }) => {
      await apiRequest("POST", `/api/admin/kyc/${id}/${approve ? "approve" : "reject"}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc"] });
      toast({ title: "Succès", description: "Demande KYC traitée" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vérifications KYC</h1>
        <p className="text-muted-foreground">Vérifiez les documents d'identité</p>
      </div>
      <div className="grid gap-4">
        {isLoading ? (
          <Card><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
        ) : !requests?.length ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground">Aucune demande KYC en attente</CardContent></Card>
        ) : requests.map((req) => (
          <Card key={req.id}>
            <CardHeader>
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div>
                  <CardTitle>{req.documentType}</CardTitle>
                  <CardDescription>Soumis le {formatDate(req.createdAt)}</CardDescription>
                </div>
                <Badge className={req.status === "approved" ? "bg-green-100 text-green-700" : req.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>
                  {req.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium mb-2">Document recto</p>
                  <img src={req.documentFront} alt="Recto" className="rounded-md border max-h-48 object-cover" />
                </div>
                {req.documentBack && (
                  <div>
                    <p className="text-sm font-medium mb-2">Document verso</p>
                    <img src={req.documentBack} alt="Verso" className="rounded-md border max-h-48 object-cover" />
                  </div>
                )}
              </div>
              {req.status === "pending" && (
                <div className="flex gap-2 pt-4">
                  <Button onClick={() => approveMutation.mutate({ id: req.id, approve: true })}>
                    <CheckCircle className="h-4 w-4 mr-2" /> Approuver
                  </Button>
                  <Button variant="destructive" onClick={() => approveMutation.mutate({ id: req.id, approve: false })}>
                    <XCircle className="h-4 w-4 mr-2" /> Rejeter
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ApiKeysContent() {
  const { toast } = useToast();
  const { data: apiKeys, isLoading } = useQuery<ApiKey[]>({ queryKey: ["/api/admin/api-keys"] });

  const revokeMutation = useMutation({
    mutationFn: async (keyId: number) => {
      await apiRequest("DELETE", `/api/admin/api-keys/${keyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      toast({ title: "Succès", description: "Clé API révoquée" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clés API</h1>
        <p className="text-muted-foreground">Gérez les clés API des utilisateurs</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Nom</th>
                  <th className="text-left p-4 font-medium">Clé (préfixe)</th>
                  <th className="text-left p-4 font-medium">Statut</th>
                  <th className="text-left p-4 font-medium">Créée le</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center"><Skeleton className="h-8 w-full" /></td></tr>
                ) : !apiKeys?.length ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Aucune clé API</td></tr>
                ) : apiKeys.map((key) => (
                  <tr key={key.id} className="border-b">
                    <td className="p-4 font-medium">{key.name}</td>
                    <td className="p-4 font-mono text-sm">{key.keyPrefix}...</td>
                    <td className="p-4">
                      <Badge className={key.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                        {key.isActive ? "Active" : "Révoquée"}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{formatDate(key.createdAt)}</td>
                    <td className="p-4">
                      {key.isActive && (
                        <Button size="sm" variant="destructive" onClick={() => revokeMutation.mutate(key.id)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Révoquer
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CommissionsContent() {
  const { toast } = useToast();
  const [depositRate, setDepositRate] = useState("7");
  const [withdrawalRate, setWithdrawalRate] = useState("7");

  const { data: settings, isLoading } = useQuery<{ depositRate: string; withdrawalRate: string }>({
    queryKey: ["/api/admin/settings"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { depositRate: string; withdrawalRate: string }) => {
      await apiRequest("POST", "/api/admin/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Succès", description: "Taux de commission mis à jour" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Commissions</h1>
        <p className="text-muted-foreground">Configurez les taux de commission</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Taux de commission</CardTitle>
          <CardDescription>Définissez les pourcentages prélevés sur les transactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="deposit-rate">Commission sur dépôts (%)</Label>
              <Input
                id="deposit-rate"
                type="number"
                value={depositRate}
                onChange={(e) => setDepositRate(e.target.value)}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawal-rate">Commission sur retraits (%)</Label>
              <Input
                id="withdrawal-rate"
                type="number"
                value={withdrawalRate}
                onChange={(e) => setWithdrawalRate(e.target.value)}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>
          <Button onClick={() => updateMutation.mutate({ depositRate, withdrawalRate })}>
            Enregistrer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function MessagingContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Messagerie</h1>
        <p className="text-muted-foreground">Envoyez des notifications aux utilisateurs</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <Mail className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Messagerie</h3>
          <p className="text-muted-foreground">Fonctionnalité de messagerie en cours de développement</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rapports</h1>
        <p className="text-muted-foreground">Analysez les performances de la plateforme</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Rapports analytiques</h3>
          <p className="text-muted-foreground">Fonctionnalité de rapports en cours de développement</p>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">Configurez la plateforme</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <Settings className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Paramètres système</h3>
          <p className="text-muted-foreground">Configuration de la plateforme en cours de développement</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [location] = useLocation();

  const renderContent = () => {
    if (location === "/admin" || location === "/admin/") return <DashboardContent />;
    if (location === "/admin/users") return <UsersContent />;
    if (location === "/admin/transactions") return <TransactionsContent />;
    if (location === "/admin/withdrawals") return <WithdrawalsContent />;
    if (location === "/admin/kyc") return <KycContent />;
    if (location === "/admin/api-keys") return <ApiKeysContent />;
    if (location === "/admin/commissions") return <CommissionsContent />;
    if (location === "/admin/messaging") return <MessagingContent />;
    if (location === "/admin/reports") return <ReportsContent />;
    if (location === "/admin/settings") return <SettingsContent />;
    return <DashboardContent />;
  };

  return <DashboardLayout>{renderContent()}</DashboardLayout>;
}
