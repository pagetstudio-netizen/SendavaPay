import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Plus,
  Edit,
  Globe,
  Link as LinkIcon,
  AlertTriangle,
  Copy,
  DollarSign,
  StickyNote,
  UserCog,
  Calendar,
  MessageSquare,
} from "lucide-react";
import type { 
  User as UserType, 
  Transaction, 
  KycRequest, 
  ApiKey, 
  WithdrawalNumber, 
  Country, 
  Operator, 
  GlobalMessage, 
  AuditLog,
  PaymentLink,
} from "@shared/schema";
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
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [balanceForm, setBalanceForm] = useState({ amount: "", operation: "add", reason: "" });
  const [editForm, setEditForm] = useState({ fullName: "", email: "", phone: "", adminNote: "", role: "" });

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
        (statusFilter === "blocked" && user.isBlocked) ||
        (statusFilter === "admin" && user.role === "admin");
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

  const modifyBalanceMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: typeof balanceForm }) => {
      await apiRequest("POST", `/api/admin/users/${userId}/modify-balance`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Succès", description: "Solde modifié avec succès" });
      setShowBalanceDialog(false);
      setBalanceForm({ amount: "", operation: "add", reason: "" });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message || "Échec de la modification", variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: Partial<typeof editForm> }) => {
      await apiRequest("PUT", `/api/admin/users/${userId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Succès", description: "Utilisateur mis à jour" });
      setShowEditDialog(false);
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message || "Échec de la mise à jour", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Succès", description: "Utilisateur supprimé" });
      setShowDeleteDialog(false);
      setSelectedUser(null);
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message || "Échec de la suppression", variant: "destructive" });
    },
  });

  const openBalanceDialog = (user: UserType) => {
    setSelectedUser(user);
    setBalanceForm({ amount: "", operation: "add", reason: "" });
    setShowBalanceDialog(true);
  };

  const openEditDialog = (user: UserType) => {
    setSelectedUser(user);
    setEditForm({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      adminNote: (user as any).adminNote || "",
      role: user.role || "user",
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (user: UserType) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

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
                <SelectItem value="admin">Admins</SelectItem>
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
                      <p className="text-sm text-muted-foreground">
                        {user.role === "admin" ? <Badge variant="default" className="text-xs">Admin</Badge> : "Utilisateur"}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{user.email}</p>
                      <p className="text-sm text-muted-foreground">{user.phone}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium">{formatCurrency(user.balance)}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openBalanceDialog(user)}
                        data-testid={`button-modify-balance-${user.id}`}
                      >
                        <DollarSign className="h-3 w-3 mr-1" /> Modifier
                      </Button>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap">
                        {user.isVerified && <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30">Vérifié</Badge>}
                        {user.isBlocked && <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30">Bloqué</Badge>}
                        {!user.isVerified && !user.isBlocked && <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/30">Non vérifié</Badge>}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap">
                        <Button size="icon" variant="ghost" onClick={() => openEditDialog(user)} title="Modifier">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => blockMutation.mutate({ userId: user.id, block: !user.isBlocked })}
                          disabled={user.role === "admin"}
                          title={user.isBlocked ? "Débloquer" : "Bloquer"}
                        >
                          {user.isBlocked ? <Unlock className="h-4 w-4 text-green-600" /> : <Ban className="h-4 w-4 text-orange-600" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openDeleteDialog(user)}
                          disabled={user.role === "admin"}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      <Dialog open={showBalanceDialog} onOpenChange={setShowBalanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le solde</DialogTitle>
            <DialogDescription>
              {selectedUser && `Utilisateur: ${selectedUser.fullName} (Solde actuel: ${formatCurrency(selectedUser.balance)})`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Opération</Label>
              <Select value={balanceForm.operation} onValueChange={(v) => setBalanceForm({ ...balanceForm, operation: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Créditer (+)</SelectItem>
                  <SelectItem value="subtract">Débiter (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Montant (XOF)</Label>
              <Input
                type="number"
                value={balanceForm.amount}
                onChange={(e) => setBalanceForm({ ...balanceForm, amount: e.target.value })}
                placeholder="1000"
              />
            </div>
            <div className="space-y-2">
              <Label>Raison (obligatoire)</Label>
              <Textarea
                value={balanceForm.reason}
                onChange={(e) => setBalanceForm({ ...balanceForm, reason: e.target.value })}
                placeholder="Ex: Remboursement suite à réclamation"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBalanceDialog(false)}>Annuler</Button>
            <Button
              onClick={() => selectedUser && modifyBalanceMutation.mutate({ userId: selectedUser.id, data: balanceForm })}
              disabled={!balanceForm.amount || !balanceForm.reason || modifyBalanceMutation.isPending}
            >
              {balanceForm.operation === "add" ? "Créditer" : "Débiter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>Modifiez les informations du profil</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom complet</Label>
                <Input
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Utilisateur</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <StickyNote className="h-4 w-4" /> Note admin (privée)
              </Label>
              <Textarea
                value={editForm.adminNote}
                onChange={(e) => setEditForm({ ...editForm, adminNote: e.target.value })}
                placeholder="Notes visibles uniquement par les administrateurs..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Annuler</Button>
            <Button
              onClick={() => selectedUser && updateUserMutation.mutate({ userId: selectedUser.id, data: editForm })}
              disabled={updateUserMutation.isPending}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'utilisateur</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer {selectedUser?.fullName} ? Cette action est irréversible et supprimera toutes ses données.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Attention</span>
            </div>
            <p className="text-sm mt-2">
              Cette action supprimera définitivement le compte, les transactions, les liens de paiement et toutes les données associées.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={() => selectedUser && deleteUserMutation.mutate(selectedUser.id)}
              disabled={deleteUserMutation.isPending}
            >
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TransactionsContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showHighValueOnly, setShowHighValueOnly] = useState(false);

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
      const matchesHighValue = !showHighValueOnly || parseFloat(tx.amount) >= 60000;
      return matchesSearch && matchesType && matchesStatus && matchesHighValue;
    }) || [];
  }, [transactions, searchQuery, typeFilter, statusFilter, showHighValueOnly]);

  const highValueCount = useMemo(() => {
    return transactions?.filter(tx => parseFloat(tx.amount) >= 60000).length || 0;
  }, [transactions]);

  const typeLabels: Record<string, string> = {
    deposit: "Dépôt", withdrawal: "Retrait", transfer_in: "Reçu", transfer_out: "Envoyé", 
    payment_received: "Paiement"
  };

  const exportCSV = () => {
    if (!filteredTransactions?.length) return;
    const headers = ["ID", "User ID", "Type", "Montant", "Frais", "Net", "Statut", "Description", "Date"];
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      tx.userId,
      typeLabels[tx.type] || tx.type,
      tx.amount,
      tx.fee,
      tx.netAmount,
      tx.status,
      tx.description || "",
      formatDate(tx.createdAt),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const isHighValue = (amount: string) => parseFloat(amount) >= 60000;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Historique de toutes les transactions ({transactions?.length || 0} total)</p>
        </div>
        <div className="flex gap-2">
          {highValueCount > 0 && (
            <Button
              variant={showHighValueOnly ? "default" : "outline"}
              onClick={() => setShowHighValueOnly(!showHighValueOnly)}
              className="gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              {highValueCount} transactions &gt;60k
            </Button>
          )}
          <Button variant="outline" onClick={exportCSV} disabled={!filteredTransactions?.length}>
            <Download className="h-4 w-4 mr-2" /> Exporter CSV
          </Button>
        </div>
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
          <ScrollArea className="h-[500px]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50 sticky top-0">
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
                    <tr key={tx.id} className={`border-b hover:bg-muted/30 ${isHighValue(tx.amount) ? "bg-orange-50 dark:bg-orange-950/20" : ""}`}>
                      <td className="p-4 font-mono text-sm">{tx.id}</td>
                      <td className="p-4 font-mono text-sm">{tx.userId}</td>
                      <td className="p-4">{typeLabels[tx.type] || tx.type}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatCurrency(tx.amount)}</span>
                          {isHighValue(tx.amount) && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" /> Élevé
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{formatCurrency(tx.fee)}</td>
                      <td className="p-4">
                        <Badge className={tx.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30" : tx.status === "pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30" : "bg-red-100 text-red-700 dark:bg-red-900/30"}>
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

interface WithdrawalRequest {
  id: number;
  userId: number;
  amount: string;
  fee: string;
  netAmount: string;
  paymentMethod: string;
  mobileNumber: string;
  country: string;
  walletName: string | null;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  reviewedBy: number | null;
  reviewedAt: string | null;
  createdAt: string;
  user?: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    balance: string;
  };
}

const countryNames: Record<string, string> = {
  togo: "Togo",
  cote_ivoire: "Côte d'Ivoire",
  benin: "Bénin",
  mali: "Mali",
  burkina_faso: "Burkina Faso",
  senegal: "Sénégal",
};

const paymentMethodNames: Record<string, string> = {
  mtn: "MTN Mobile Money",
  moov: "Moov Money",
  tmoney: "TMoney",
  orange: "Orange Money",
  wave: "Wave",
  celtis: "Celtis",
};

function WithdrawalsContent() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [viewingRequest, setViewingRequest] = useState<WithdrawalRequest | null>(null);

  const { data: withdrawalRequests, isLoading } = useQuery<WithdrawalRequest[]>({ 
    queryKey: ["/api/admin/withdrawal-requests"] 
  });

  const filteredRequests = useMemo(() => {
    return withdrawalRequests?.filter((w) => {
      const matchesSearch = 
        w.id.toString().includes(searchQuery) ||
        w.mobileNumber?.includes(searchQuery) ||
        w.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || w.status === statusFilter;
      return matchesSearch && matchesStatus;
    }) || [];
  }, [withdrawalRequests, searchQuery, statusFilter]);

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/admin/withdrawal-requests/${id}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawal-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Succès", description: "Retrait approuvé et traité" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const res = await apiRequest("POST", `/api/admin/withdrawal-requests/${id}/reject`, { reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawal-requests"] });
      toast({ title: "Succès", description: "Demande de retrait rejetée" });
      setRejectingId(null);
      setRejectionReason("");
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const handleReject = () => {
    if (!rejectingId || !rejectionReason.trim()) {
      toast({ title: "Erreur", description: "Veuillez fournir une raison de rejet", variant: "destructive" });
      return;
    }
    rejectMutation.mutate({ id: rejectingId, reason: rejectionReason });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Demandes de retrait</h1>
        <p className="text-muted-foreground">Validez ou rejetez les demandes de retrait des utilisateurs</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par ID, nom, email ou numéro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-withdrawals"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
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
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : !filteredRequests?.length ? (
            <p className="text-center text-muted-foreground py-8">Aucune demande de retrait trouvée</p>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm text-muted-foreground">#{request.id}</span>
                          <Badge className={
                            request.status === "approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : 
                            request.status === "pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" : 
                            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }>
                            {request.status === "approved" ? "Approuvé" : request.status === "pending" ? "En attente" : "Rejeté"}
                          </Badge>
                          <span className="text-xl font-bold">{formatCurrency(request.amount)}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Utilisateur:</span>{" "}
                            <span className="font-medium">{request.user?.fullName || `User #${request.userId}`}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Email:</span>{" "}
                            <span>{request.user?.email || "-"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Pays:</span>{" "}
                            <span className="font-medium">{countryNames[request.country] || request.country}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Moyen:</span>{" "}
                            <span className="font-medium">{paymentMethodNames[request.paymentMethod] || request.paymentMethod}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Téléphone:</span>{" "}
                            <span className="font-mono">{request.mobileNumber}</span>
                          </div>
                          {request.walletName && (
                            <div>
                              <span className="text-muted-foreground">Portefeuille:</span>{" "}
                              <span>{request.walletName}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Frais:</span>{" "}
                            <span>{formatCurrency(request.fee)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Net à envoyer:</span>{" "}
                            <span className="font-medium text-green-600">{formatCurrency(request.netAmount)}</span>
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          Demandé le {formatDate(request.createdAt)}
                          {request.user && ` • Solde actuel: ${formatCurrency(request.user.balance)}`}
                        </p>
                        
                        {request.rejectionReason && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-400">
                            <strong>Raison du rejet:</strong> {request.rejectionReason}
                          </div>
                        )}
                      </div>
                      
                      {request.status === "pending" && (
                        <div className="flex gap-2 flex-wrap lg:flex-col">
                          <Button 
                            size="sm" 
                            onClick={() => approveMutation.mutate(request.id)}
                            disabled={approveMutation.isPending}
                            data-testid={`button-approve-${request.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> 
                            {approveMutation.isPending ? "..." : "Approuver"}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => setRejectingId(request.id)}
                            data-testid={`button-reject-${request.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Rejeter
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {rejectingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Rejeter la demande</CardTitle>
              <CardDescription>
                Expliquez à l'utilisateur pourquoi sa demande est rejetée
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Raison du rejet..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                data-testid="input-rejection-reason"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setRejectingId(null); setRejectionReason(""); }}>
                  Annuler
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleReject}
                  disabled={rejectMutation.isPending || !rejectionReason.trim()}
                  data-testid="button-confirm-reject"
                >
                  {rejectMutation.isPending ? "..." : "Confirmer le rejet"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
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
        key.apiKey?.slice(0, 12).includes(searchQuery);
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
                    <td className="p-4 font-mono text-sm">{key.apiKey?.slice(0, 12)}...</td>
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
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetAudience, setTargetAudience] = useState("all");

  const { data: messages, isLoading } = useQuery<GlobalMessage[]>({
    queryKey: ["/api/admin/global-messages"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; targetAudience: string }) => {
      await apiRequest("POST", "/api/admin/global-messages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/global-messages"] });
      toast({ title: "Succès", description: "Message global créé" });
      setTitle("");
      setContent("");
    },
    onError: () => {
      toast({ title: "Erreur", description: "Échec de la création", variant: "destructive" });
    },
  });

  const handleSend = () => {
    if (!title || !content) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }
    createMutation.mutate({ title, content, targetAudience });
  };

  const audienceLabels: Record<string, string> = {
    all: "Tous les utilisateurs",
    verified: "Utilisateurs vérifiés",
    unverified: "Non vérifiés",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Message global</h1>
        <p className="text-muted-foreground">Créez des annonces visibles par tous les utilisateurs</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nouveau message</CardTitle>
            <CardDescription>Ce message s'affichera pour tous les utilisateurs connectés</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Destinataires</Label>
              <Select value={targetAudience} onValueChange={setTargetAudience}>
                <SelectTrigger data-testid="select-target-audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les utilisateurs</SelectItem>
                  <SelectItem value="verified">Utilisateurs vérifiés</SelectItem>
                  <SelectItem value="unverified">Non vérifiés</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                placeholder="Titre du message..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="input-message-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Contenu</Label>
              <Textarea
                id="content"
                placeholder="Contenu du message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                data-testid="textarea-message-content"
              />
            </div>
            <Button onClick={handleSend} disabled={createMutation.isPending} className="w-full" data-testid="button-send-message">
              <Mail className="h-4 w-4 mr-2" /> Publier le message
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historique des messages</CardTitle>
            <CardDescription>Messages publiés précédemment</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="p-4"><Skeleton className="h-20 w-full" /></div>
              ) : messages && messages.length > 0 ? (
                <div className="divide-y">
                  {messages.map((msg) => (
                    <div key={msg.id} className="p-4 space-y-2" data-testid={`message-item-${msg.id}`}>
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="secondary">
                          {audienceLabels[msg.targetAudience] || msg.targetAudience}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                      <h4 className="font-medium">{msg.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{msg.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun message publié</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
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

interface SocialLink {
  id: number;
  platform: string;
  url: string | null;
  isActive: boolean;
}

const platformLabels: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  twitter: 'Twitter/X'
};

function SettingsContent() {
  const { toast } = useToast();
  const [platformName, setPlatformName] = useState("SendavaPay");
  const [supportEmail, setSupportEmail] = useState("support@sendavapay.com");
  const [supportPhone, setSupportPhone] = useState("+228 92299772");

  const { data: socialLinks = [], refetch: refetchLinks } = useQuery<SocialLink[]>({
    queryKey: ['/api/admin/social-links'],
  });

  const updateSocialMutation = useMutation({
    mutationFn: async ({ platform, url, isActive }: { platform: string; url: string; isActive: boolean }) => {
      const res = await apiRequest("PUT", `/api/admin/social-links/${platform}`, { url, isActive });
      return res.json();
    },
    onSuccess: () => {
      refetchLinks();
      toast({ title: "Lien mis à jour", description: "Le réseau social a été configuré" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le lien", variant: "destructive" });
    }
  });

  const handleSave = () => {
    toast({ title: "Paramètres enregistrés", description: "Les modifications ont été appliquées" });
  };

  const handleSocialUpdate = (platform: string, url: string, isActive: boolean) => {
    updateSocialMutation.mutate({ platform, url, isActive });
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
          <CardTitle>Réseaux sociaux</CardTitle>
          <CardDescription>Configurez les liens vers vos réseaux sociaux. Désactivez les boutons si vous n'avez pas encore de compte.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {socialLinks.map((link) => (
            <SocialLinkRow
              key={link.platform}
              link={link}
              onUpdate={handleSocialUpdate}
              isUpdating={updateSocialMutation.isPending}
            />
          ))}
          {socialLinks.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              Chargement des réseaux sociaux...
            </p>
          )}
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

function SocialLinkRow({ 
  link, 
  onUpdate, 
  isUpdating 
}: { 
  link: SocialLink; 
  onUpdate: (platform: string, url: string, isActive: boolean) => void;
  isUpdating: boolean;
}) {
  const [url, setUrl] = useState(link.url || '');
  const [isActive, setIsActive] = useState(link.isActive);

  const handleSave = () => {
    onUpdate(link.platform, url, isActive);
  };

  const handleToggle = (checked: boolean) => {
    setIsActive(checked);
    onUpdate(link.platform, url, checked);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-3 min-w-[140px]">
        <Switch
          checked={isActive}
          onCheckedChange={handleToggle}
          disabled={isUpdating}
          data-testid={`switch-${link.platform}`}
        />
        <span className="font-medium">{platformLabels[link.platform] || link.platform}</span>
      </div>
      <div className="flex-1 flex gap-2">
        <Input
          placeholder={`URL ${platformLabels[link.platform] || link.platform}`}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
          data-testid={`input-${link.platform}-url`}
        />
        <Button 
          size="sm" 
          onClick={handleSave}
          disabled={isUpdating}
          data-testid={`button-save-${link.platform}`}
        >
          Sauver
        </Button>
      </div>
    </div>
  );
}

function WithdrawalNumbersContent() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingNumber, setEditingNumber] = useState<WithdrawalNumber | null>(null);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    operator: "",
    country: "",
    label: "",
    isActive: true,
  });

  const { data: numbers, isLoading } = useQuery<WithdrawalNumber[]>({
    queryKey: ["/api/admin/withdrawal-numbers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest("POST", "/api/admin/withdrawal-numbers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawal-numbers"] });
      toast({ title: "Succès", description: "Numéro créé avec succès" });
      setShowDialog(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Erreur", description: "Échec de la création", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      await apiRequest("PUT", `/api/admin/withdrawal-numbers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawal-numbers"] });
      toast({ title: "Succès", description: "Numéro mis à jour" });
      setShowDialog(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/withdrawal-numbers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawal-numbers"] });
      toast({ title: "Succès", description: "Numéro supprimé" });
    },
  });

  const resetForm = () => {
    setFormData({ phoneNumber: "", operator: "", country: "", label: "", isActive: true });
    setEditingNumber(null);
  };

  const openEditDialog = (num: WithdrawalNumber) => {
    setEditingNumber(num);
    setFormData({
      phoneNumber: num.phoneNumber,
      operator: num.operator,
      country: num.country,
      label: num.walletName || "",
      isActive: num.isActive,
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingNumber) {
      updateMutation.mutate({ id: editingNumber.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Numéros de retrait</h1>
          <p className="text-muted-foreground">Gérez les numéros utilisés pour les retraits</p>
        </div>
        <Button onClick={() => { resetForm(); setShowDialog(true); }} data-testid="button-add-number">
          <Plus className="h-4 w-4 mr-2" /> Ajouter
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Opérateur</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ) : numbers && numbers.length > 0 ? (
                numbers.map((num) => (
                  <TableRow key={num.id}>
                    <TableCell className="font-mono">{num.phoneNumber}</TableCell>
                    <TableCell>{num.operator}</TableCell>
                    <TableCell>{num.country}</TableCell>
                    <TableCell>{num.walletName || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={num.isActive ? "default" : "secondary"}>
                        {num.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openEditDialog(num)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(num.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun numéro configuré
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNumber ? "Modifier le numéro" : "Ajouter un numéro"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Numéro de téléphone</Label>
              <Input 
                value={formData.phoneNumber} 
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+228 90 00 00 00"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Opérateur</Label>
                <Select value={formData.operator} onValueChange={(v) => setFormData({ ...formData, operator: v })}>
                  <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moov">Moov</SelectItem>
                    <SelectItem value="tmoney">T-Money</SelectItem>
                    <SelectItem value="wave">Wave</SelectItem>
                    <SelectItem value="mtn">MTN</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pays</Label>
                <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                  <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="togo">Togo</SelectItem>
                    <SelectItem value="benin">Bénin</SelectItem>
                    <SelectItem value="cote_ivoire">Côte d'Ivoire</SelectItem>
                    <SelectItem value="senegal">Sénégal</SelectItem>
                    <SelectItem value="mali">Mali</SelectItem>
                    <SelectItem value="burkina_faso">Burkina Faso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Label (optionnel)</Label>
              <Input 
                value={formData.label} 
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Ex: Principal"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={formData.isActive} 
                onCheckedChange={(v) => setFormData({ ...formData, isActive: v })} 
              />
              <Label>Actif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingNumber ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CountriesContent() {
  const { toast } = useToast();
  const [showCountryDialog, setShowCountryDialog] = useState(false);
  const [showOperatorDialog, setShowOperatorDialog] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  const [countryForm, setCountryForm] = useState({ code: "", name: "", currency: "XOF", isActive: true, flagEmoji: "" });
  const [operatorForm, setOperatorForm] = useState({ countryId: 0, name: "", code: "", isActive: true });

  const { data: countries, isLoading: loadingCountries } = useQuery<Country[]>({ queryKey: ["/api/admin/countries"] });
  const { data: operators, isLoading: loadingOperators } = useQuery<Operator[]>({ queryKey: ["/api/admin/operators"] });

  const createCountryMutation = useMutation({
    mutationFn: (data: typeof countryForm) => apiRequest("POST", "/api/admin/countries", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/countries"] });
      toast({ title: "Pays créé" });
      setShowCountryDialog(false);
    },
  });

  const deleteCountryMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/countries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/countries"] });
      toast({ title: "Pays supprimé" });
    },
  });

  const createOperatorMutation = useMutation({
    mutationFn: (data: typeof operatorForm) => apiRequest("POST", "/api/admin/operators", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/operators"] });
      toast({ title: "Opérateur créé" });
      setShowOperatorDialog(false);
    },
  });

  const deleteOperatorMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/operators/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/operators"] });
      toast({ title: "Opérateur supprimé" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pays & Opérateurs</h1>
        <p className="text-muted-foreground">Configurez les pays et opérateurs mobiles disponibles</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>Pays</CardTitle>
              <CardDescription>Liste des pays disponibles</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowCountryDialog(true)}>
              <Plus className="h-4 w-4 mr-1" /> Ajouter
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Devise</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingCountries ? (
                  <TableRow><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                ) : countries?.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono">{c.code}</TableCell>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.currency}</TableCell>
                    <TableCell><Badge variant={c.isActive ? "default" : "secondary"}>{c.isActive ? "Actif" : "Inactif"}</Badge></TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => deleteCountryMutation.mutate(c.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>Opérateurs</CardTitle>
              <CardDescription>Opérateurs mobiles par pays</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowOperatorDialog(true)} disabled={!countries?.length}>
              <Plus className="h-4 w-4 mr-1" /> Ajouter
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pays</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingOperators ? (
                  <TableRow><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                ) : operators?.map((op) => {
                  const country = countries?.find(c => c.id === op.countryId);
                  return (
                    <TableRow key={op.id}>
                      <TableCell>{country?.name || "-"}</TableCell>
                      <TableCell>{op.name}</TableCell>
                      <TableCell className="font-mono">{op.code}</TableCell>
                      <TableCell><Badge variant={op.isActive ? "default" : "secondary"}>{op.isActive ? "Actif" : "Inactif"}</Badge></TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => deleteOperatorMutation.mutate(op.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCountryDialog} onOpenChange={setShowCountryDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un pays</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code (2 lettres)</Label>
                <Input value={countryForm.code} onChange={(e) => setCountryForm({ ...countryForm, code: e.target.value.toUpperCase() })} maxLength={2} />
              </div>
              <div className="space-y-2">
                <Label>Devise</Label>
                <Select value={countryForm.currency} onValueChange={(v) => setCountryForm({ ...countryForm, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XOF">XOF</SelectItem>
                    <SelectItem value="XAF">XAF</SelectItem>
                    <SelectItem value="CDF">CDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nom du pays</Label>
              <Input value={countryForm.name} onChange={(e) => setCountryForm({ ...countryForm, name: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCountryDialog(false)}>Annuler</Button>
            <Button onClick={() => createCountryMutation.mutate(countryForm)}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showOperatorDialog} onOpenChange={setShowOperatorDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un opérateur</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pays</Label>
              <Select value={operatorForm.countryId.toString()} onValueChange={(v) => setOperatorForm({ ...operatorForm, countryId: parseInt(v) })}>
                <SelectTrigger><SelectValue placeholder="Choisir un pays" /></SelectTrigger>
                <SelectContent>
                  {countries?.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={operatorForm.name} onChange={(e) => setOperatorForm({ ...operatorForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={operatorForm.code} onChange={(e) => setOperatorForm({ ...operatorForm, code: e.target.value.toLowerCase() })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOperatorDialog(false)}>Annuler</Button>
            <Button onClick={() => createOperatorMutation.mutate(operatorForm)}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminPaymentLinksContent() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: links, isLoading } = useQuery<(PaymentLink & { user?: UserType })[]>({
    queryKey: ["/api/admin/payment-links"],
  });

  const filteredLinks = useMemo(() => {
    return links?.filter((link) =>
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.linkCode.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];
  }, [links, searchQuery]);

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/pay/${code}`);
    toast({ title: "Lien copié" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Liens de paiement</h1>
        <p className="text-muted-foreground">Tous les liens de paiement créés par les utilisateurs</p>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par titre, utilisateur ou code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ) : filteredLinks.map((link) => (
                <TableRow key={link.id}>
                  <TableCell className="font-mono text-xs">{link.linkCode}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{link.title}</TableCell>
                  <TableCell>{link.user?.fullName || "-"}</TableCell>
                  <TableCell>{formatCurrency(link.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={link.paidAt ? "default" : "secondary"}>
                      {link.paidAt ? "Payé" : "En attente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(link.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => copyLink(link.linkCode)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function LogsContent() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: logs, isLoading } = useQuery<(AuditLog & { user?: UserType })[]>({
    queryKey: ["/api/admin/audit-logs"],
  });

  const filteredLogs = useMemo(() => {
    return logs?.filter((log) =>
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];
  }, [logs, searchQuery]);

  const exportCSV = () => {
    if (!logs?.length) return;
    const headers = ["Date", "Utilisateur", "Action", "Détails", "IP"];
    const rows = logs.map((log) => [
      formatDate(log.createdAt),
      log.user?.fullName || "Système",
      log.action,
      log.details || "",
      log.ipAddress || "-",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const actionLabels: Record<string, string> = {
    withdrawal_number_created: "Numéro de retrait créé",
    global_message_created: "Message global créé",
    user_updated: "Utilisateur modifié",
    balance_credit: "Solde crédité",
    balance_debit: "Solde débité",
    user_deleted: "Utilisateur supprimé",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Logs & Sécurité</h1>
          <p className="text-muted-foreground">Historique des actions administratives</p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={!logs?.length}>
          <Download className="h-4 w-4 mr-2" /> Exporter CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans les logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Détails</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                ) : filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell>{log.user?.fullName || "Système"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{actionLabels[log.action] || log.action}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-sm">
                      {log.details || "-"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.ipAddress || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
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
    if (location === "/admin/withdrawal-numbers") return <WithdrawalNumbersContent />;
    if (location === "/admin/countries") return <CountriesContent />;
    if (location === "/admin/payment-links") return <AdminPaymentLinksContent />;
    if (location === "/admin/logs") return <LogsContent />;
    return <DashboardContent />;
  };

  return <AdminLayout>{renderContent()}</AdminLayout>;
}
