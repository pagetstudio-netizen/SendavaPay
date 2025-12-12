import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Search,
  Download,
  Phone,
  MapPin,
  User,
  FileText,
  ExternalLink,
} from "lucide-react";
import type { User as UserType, Transaction, KycRequest, ApiKey } from "@shared/schema";
import { useState, useMemo } from "react";

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

interface KycRequestWithUser extends KycRequest {
  user?: UserType;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  const { data: users, isLoading } = useQuery<UserType[]>({ queryKey: ["/api/admin/users"] });

  const filteredUsers = useMemo(() => {
    return users?.filter((user) => {
      const matchesSearch = 
        user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone?.includes(searchQuery) ||
        user.id.toString() === searchQuery;
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "verified" && user.isVerified) ||
        (statusFilter === "unverified" && !user.isVerified) ||
        (statusFilter === "blocked" && user.isBlocked);
      return matchesSearch && matchesStatus;
    }) || [];
  }, [users, searchQuery, statusFilter]);

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
        <p className="text-muted-foreground">Gérez les comptes utilisateurs ({users?.length || 0} utilisateurs)</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email, téléphone, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-users"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="verified">Vérifiés</SelectItem>
                <SelectItem value="unverified">Non vérifiés</SelectItem>
                <SelectItem value="blocked">Bloqués</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">ID</th>
                  <th className="text-left p-4 font-medium">Utilisateur</th>
                  <th className="text-left p-4 font-medium">Contact</th>
                  <th className="text-left p-4 font-medium">Solde</th>
                  <th className="text-left p-4 font-medium">Statut</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center"><Skeleton className="h-8 w-full" /></td></tr>
                ) : !filteredUsers?.length ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Aucun utilisateur trouvé</td></tr>
                ) : filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/30">
                    <td className="p-4 font-mono text-sm">{user.id}</td>
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
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={user.isBlocked ? "default" : "destructive"}
                          onClick={() => blockMutation.mutate({ userId: user.id, block: !user.isBlocked })}
                          disabled={user.role === "admin"}
                        >
                          {user.isBlocked ? <Unlock className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de l'utilisateur</DialogTitle>
            <DialogDescription>Informations complètes du compte</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">ID</p>
                  <p className="font-mono font-medium">{selectedUser.id}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Rôle</p>
                  <p className="font-medium">{selectedUser.role}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Nom complet</p>
                    <p className="font-medium">{selectedUser.fullName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{selectedUser.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Solde</p>
                    <p className="font-bold text-lg">{formatCurrency(selectedUser.balance)}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap pt-2">
                {selectedUser.isVerified ? (
                  <Badge className="bg-green-100 text-green-700">Compte vérifié</Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-700">Non vérifié</Badge>
                )}
                {selectedUser.isBlocked && (
                  <Badge className="bg-red-100 text-red-700">Bloqué</Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TransactionsContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: transactions, isLoading } = useQuery<Transaction[]>({ queryKey: ["/api/admin/transactions"] });

  const filteredTransactions = useMemo(() => {
    return transactions?.filter((tx) => {
      const matchesSearch = 
        tx.id.toString().includes(searchQuery) ||
        tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.mobileNumber?.includes(searchQuery) ||
        tx.payerName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || tx.type === typeFilter;
      const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    }) || [];
  }, [transactions, searchQuery, typeFilter, statusFilter]);

  const typeLabels: Record<string, string> = {
    deposit: "Dépôt", withdrawal: "Retrait", transfer_in: "Reçu", transfer_out: "Envoyé", payment_received: "Paiement"
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-muted-foreground">Historique de toutes les transactions ({transactions?.length || 0} total)</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ID, description, téléphone, nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-transactions"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="deposit">Dépôt</SelectItem>
                <SelectItem value="withdrawal">Retrait</SelectItem>
                <SelectItem value="transfer_in">Reçu</SelectItem>
                <SelectItem value="transfer_out">Envoyé</SelectItem>
                <SelectItem value="payment_received">Paiement</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">ID</th>
                  <th className="text-left p-4 font-medium">User ID</th>
                  <th className="text-left p-4 font-medium">Type</th>
                  <th className="text-left p-4 font-medium">Montant</th>
                  <th className="text-left p-4 font-medium">Frais</th>
                  <th className="text-left p-4 font-medium">Statut</th>
                  <th className="text-left p-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="p-8 text-center"><Skeleton className="h-8 w-full" /></td></tr>
                ) : !filteredTransactions?.length ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Aucune transaction trouvée</td></tr>
                ) : filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b hover:bg-muted/30">
                    <td className="p-4 font-mono text-sm">{tx.id}</td>
                    <td className="p-4 font-mono text-sm">{tx.userId}</td>
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: withdrawals, isLoading } = useQuery<Transaction[]>({ queryKey: ["/api/admin/withdrawals"] });

  const filteredWithdrawals = useMemo(() => {
    return withdrawals?.filter((w) => {
      const matchesSearch = 
        w.id.toString().includes(searchQuery) ||
        w.mobileNumber?.includes(searchQuery);
      const matchesStatus = statusFilter === "all" || w.status === statusFilter;
      return matchesSearch && matchesStatus;
    }) || [];
  }, [withdrawals, searchQuery, statusFilter]);

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
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par ID ou numéro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="completed">Approuvé</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">ID</th>
                  <th className="text-left p-4 font-medium">User ID</th>
                  <th className="text-left p-4 font-medium">Montant</th>
                  <th className="text-left p-4 font-medium">Numéro</th>
                  <th className="text-left p-4 font-medium">Statut</th>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="p-8 text-center"><Skeleton className="h-8 w-full" /></td></tr>
                ) : !filteredWithdrawals?.length ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Aucun retrait trouvé</td></tr>
                ) : filteredWithdrawals.map((w) => (
                  <tr key={w.id} className="border-b hover:bg-muted/30">
                    <td className="p-4 font-mono text-sm">{w.id}</td>
                    <td className="p-4 font-mono text-sm">{w.userId}</td>
                    <td className="p-4 font-medium">{formatCurrency(w.amount)}</td>
                    <td className="p-4">{w.mobileNumber || "-"}</td>
                    <td className="p-4">
                      <Badge className={w.status === "completed" ? "bg-green-100 text-green-700" : w.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>
                        {w.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{formatDate(w.createdAt)}</td>
                    <td className="p-4 flex gap-2 flex-wrap">
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedKyc, setSelectedKyc] = useState<KycRequestWithUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: requests, isLoading } = useQuery<KycRequestWithUser[]>({ queryKey: ["/api/admin/kyc"] });

  const filteredRequests = useMemo(() => {
    return requests?.filter((req) => {
      const matchesSearch = 
        req.id.toString().includes(searchQuery) ||
        req.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.user?.phone?.includes(searchQuery);
      const matchesStatus = statusFilter === "all" || req.status === statusFilter;
      return matchesSearch && matchesStatus;
    }) || [];
  }, [requests, searchQuery, statusFilter]);

  const approveMutation = useMutation({
    mutationFn: async ({ id, approve, reason }: { id: number; approve: boolean; reason?: string }) => {
      await apiRequest("POST", `/api/admin/kyc/${id}/${approve ? "approve" : "reject"}`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setSelectedKyc(null);
      setRejectionReason("");
      toast({ title: "Succès", description: "Demande KYC traitée" });
    },
  });

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vérifications KYC</h1>
        <p className="text-muted-foreground">Vérifiez les documents d'identité ({requests?.length || 0} demandes)</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par ID, nom, email, téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-kyc"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvé</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">ID</th>
                  <th className="text-left p-4 font-medium">Utilisateur</th>
                  <th className="text-left p-4 font-medium">Document</th>
                  <th className="text-left p-4 font-medium">Statut</th>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center"><Skeleton className="h-8 w-full" /></td></tr>
                ) : !filteredRequests?.length ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Aucune demande KYC trouvée</td></tr>
                ) : filteredRequests.map((req) => (
                  <tr key={req.id} className="border-b hover:bg-muted/30">
                    <td className="p-4 font-mono text-sm">{req.id}</td>
                    <td className="p-4">
                      <p className="font-medium">{req.user?.fullName || `User #${req.userId}`}</p>
                      <p className="text-sm text-muted-foreground">{req.user?.email}</p>
                      <p className="text-xs text-muted-foreground">{req.user?.phone}</p>
                    </td>
                    <td className="p-4">{req.documentType}</td>
                    <td className="p-4">
                      <Badge className={req.status === "approved" ? "bg-green-100 text-green-700" : req.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>
                        {req.status === "approved" ? "Approuvé" : req.status === "pending" ? "En attente" : "Rejeté"}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{formatDate(req.createdAt)}</td>
                    <td className="p-4">
                      <Button size="sm" variant="outline" onClick={() => setSelectedKyc(req)}>
                        <Eye className="h-4 w-4 mr-1" /> Voir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedKyc} onOpenChange={() => { setSelectedKyc(null); setRejectionReason(""); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la demande KYC #{selectedKyc?.id}</DialogTitle>
            <DialogDescription>Documents et informations de l'utilisateur</DialogDescription>
          </DialogHeader>
          {selectedKyc && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-muted/30">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" /> Informations de l'utilisateur
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Nom complet</p>
                    <p className="font-medium">{selectedKyc.user?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedKyc.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{selectedKyc.user?.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Solde</p>
                    <p className="font-medium">{formatCurrency(selectedKyc.user?.balance || 0)}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/30">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Document: {selectedKyc.documentType}
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Soumis le {formatDate(selectedKyc.createdAt)}
                  {selectedKyc.reviewedAt && ` - Traité le ${formatDate(selectedKyc.reviewedAt)}`}
                </p>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Document recto</p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownload(selectedKyc.documentFrontPath, `kyc_${selectedKyc.id}_front.jpg`)}
                      >
                        <Download className="h-4 w-4 mr-1" /> Télécharger
                      </Button>
                    </div>
                    <a href={selectedKyc.documentFrontPath} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={selectedKyc.documentFrontPath} 
                        alt="Recto" 
                        className="rounded-md border max-h-48 object-cover w-full cursor-pointer hover:opacity-80" 
                      />
                    </a>
                  </div>
                  {selectedKyc.documentBackPath && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Document verso</p>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownload(selectedKyc.documentBackPath!, `kyc_${selectedKyc.id}_back.jpg`)}
                        >
                          <Download className="h-4 w-4 mr-1" /> Télécharger
                        </Button>
                      </div>
                      <a href={selectedKyc.documentBackPath} target="_blank" rel="noopener noreferrer">
                        <img 
                          src={selectedKyc.documentBackPath} 
                          alt="Verso" 
                          className="rounded-md border max-h-48 object-cover w-full cursor-pointer hover:opacity-80" 
                        />
                      </a>
                    </div>
                  )}
                </div>

                {selectedKyc.selfiePath && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Selfie de vérification</p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownload(selectedKyc.selfiePath!, `kyc_${selectedKyc.id}_selfie.jpg`)}
                      >
                        <Download className="h-4 w-4 mr-1" /> Télécharger
                      </Button>
                    </div>
                    <a href={selectedKyc.selfiePath} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={selectedKyc.selfiePath} 
                        alt="Selfie" 
                        className="rounded-md border max-h-48 object-cover cursor-pointer hover:opacity-80" 
                      />
                    </a>
                  </div>
                )}
              </div>

              {selectedKyc.rejectionReason && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">Raison du rejet:</p>
                  <p className="text-sm text-red-600 dark:text-red-300">{selectedKyc.rejectionReason}</p>
                </div>
              )}

              {selectedKyc.status === "pending" && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Raison du rejet (optionnel)</Label>
                    <Textarea
                      placeholder="Expliquez pourquoi la demande est rejetée..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => approveMutation.mutate({ id: selectedKyc.id, approve: true })}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" /> Approuver
                    </Button>
                    <Button 
                      variant="destructive"
                      className="flex-1"
                      onClick={() => approveMutation.mutate({ id: selectedKyc.id, approve: false, reason: rejectionReason })}
                      disabled={approveMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" /> Rejeter
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ApiKeysContent() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: apiKeys, isLoading } = useQuery<ApiKey[]>({ queryKey: ["/api/admin/api-keys"] });

  const filteredKeys = useMemo(() => {
    return apiKeys?.filter((key) => {
      const matchesSearch = 
        key.id.toString().includes(searchQuery) ||
        key.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        key.keyPrefix?.includes(searchQuery);
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "active" && key.isActive) ||
        (statusFilter === "revoked" && !key.isActive);
      return matchesSearch && matchesStatus;
    }) || [];
  }, [apiKeys, searchQuery, statusFilter]);

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
        <p className="text-muted-foreground">Gérez les clés API des utilisateurs ({apiKeys?.length || 0} clés)</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par ID, nom, préfixe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actives</SelectItem>
                <SelectItem value="revoked">Révoquées</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">ID</th>
                  <th className="text-left p-4 font-medium">User ID</th>
                  <th className="text-left p-4 font-medium">Nom</th>
                  <th className="text-left p-4 font-medium">Clé (préfixe)</th>
                  <th className="text-left p-4 font-medium">Requêtes</th>
                  <th className="text-left p-4 font-medium">Statut</th>
                  <th className="text-left p-4 font-medium">Créée le</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} className="p-8 text-center"><Skeleton className="h-8 w-full" /></td></tr>
                ) : !filteredKeys?.length ? (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Aucune clé API trouvée</td></tr>
                ) : filteredKeys.map((key) => (
                  <tr key={key.id} className="border-b hover:bg-muted/30">
                    <td className="p-4 font-mono text-sm">{key.id}</td>
                    <td className="p-4 font-mono text-sm">{key.userId}</td>
                    <td className="p-4 font-medium">{key.name}</td>
                    <td className="p-4 font-mono text-sm">{key.keyPrefix}...</td>
                    <td className="p-4">{key.requestCount || 0}</td>
                    <td className="p-4">
                      <Badge className={key.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                        {key.isActive ? "Active" : "Révoquée"}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{formatDate(key.createdAt)}</td>
                    <td className="p-4">
                      {key.isActive && (
                        <Button size="sm" variant="destructive" onClick={() => revokeMutation.mutate(key.id)}>
                          <Trash2 className="h-4 w-4" />
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

  const { data: settings } = useQuery<{ depositRate: string; withdrawalRate: string }>({
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
        <p className="text-muted-foreground">Configurez les taux de commission de la plateforme</p>
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
            Enregistrer les modifications
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique des commissions</CardTitle>
          <CardDescription>Revenus générés par les commissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Les statistiques de commission sont disponibles dans le tableau de bord principal</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MessagingContent() {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [targetAudience, setTargetAudience] = useState("all");

  const handleSend = () => {
    if (!subject || !message) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }
    toast({ title: "Fonctionnalité à venir", description: "L'envoi de messages sera disponible prochainement" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Messagerie</h1>
        <p className="text-muted-foreground">Envoyez des notifications aux utilisateurs</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouveau message</CardTitle>
          <CardDescription>Envoyez une notification par email à vos utilisateurs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Destinataires</Label>
            <Select value={targetAudience} onValueChange={setTargetAudience}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les utilisateurs</SelectItem>
                <SelectItem value="verified">Utilisateurs vérifiés</SelectItem>
                <SelectItem value="unverified">Utilisateurs non vérifiés</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Sujet</Label>
            <Input
              id="subject"
              placeholder="Sujet du message..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Contenu du message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
            />
          </div>
          <Button onClick={handleSend}>
            <Mail className="h-4 w-4 mr-2" /> Envoyer le message
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsContent() {
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rapports</h1>
        <p className="text-muted-foreground">Analysez les performances de la plateforme</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Résumé des utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span>Total utilisateurs</span>
                <span className="font-bold text-xl">{stats?.totalUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span>Utilisateurs vérifiés</span>
                <span className="font-bold text-xl text-green-600">{stats?.verifiedUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <span>KYC en attente</span>
                <span className="font-bold text-xl text-yellow-600">{stats?.pendingKyc || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Résumé financier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span>Total dépôts</span>
                <span className="font-bold text-lg text-green-600">{formatCurrency(stats?.totalDeposits || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <span>Total retraits</span>
                <span className="font-bold text-lg text-orange-600">{formatCurrency(stats?.totalWithdrawals || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <span>Commissions gagnées</span>
                <span className="font-bold text-lg text-purple-600">{formatCurrency(stats?.totalCommissions || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activité API</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <div>
              <p className="font-medium">Clés API actives</p>
              <p className="text-sm text-muted-foreground">Intégrations tierces</p>
            </div>
            <span className="font-bold text-2xl text-indigo-600">{stats?.activeApiKeys || 0}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsContent() {
  const { toast } = useToast();
  const [platformName, setPlatformName] = useState("SendavaPay");
  const [supportEmail, setSupportEmail] = useState("support@sendavapay.com");
  const [supportPhone, setSupportPhone] = useState("+228 92299772");

  const handleSave = () => {
    toast({ title: "Paramètres enregistrés", description: "Les modifications ont été appliquées" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">Configurez la plateforme SendavaPay</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>Paramètres de base de la plateforme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform-name">Nom de la plateforme</Label>
            <Input
              id="platform-name"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-email">Email de support</Label>
            <Input
              id="support-email"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-phone">Téléphone de support</Label>
            <Input
              id="support-phone"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
            />
          </div>
          <Button onClick={handleSave}>
            Enregistrer les paramètres
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance</CardTitle>
          <CardDescription>Options de maintenance de la plateforme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="font-medium">Mode maintenance</p>
              <p className="text-sm text-muted-foreground">Désactiver temporairement la plateforme</p>
            </div>
            <Badge>Désactivé</Badge>
          </div>
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
