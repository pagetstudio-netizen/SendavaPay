import { useEffect, useState, useMemo } from "react";
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
  RotateCcw,
  Activity,
} from "lucide-react";
import { PartnersContent } from "@/pages/admin/partners";
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

interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  totalDeposits: string;
  totalWithdrawals: string;
  totalCommissions: string;
  todayCommissions: string;
  pendingKyc: number;
  activeApiKeys: number;
  totalApiKeys?: number;
  commissionRate: string;
  apiCommissions?: string;
  totalApiPayments?: string;
  apiTransactionsCount?: number;
  apiTransactionsTotal?: number;
  totalTransactionsCount?: number;
  totalTransactionsAmount?: string;
  paymentLinkTransactionsCount?: number;
  paymentLinkTransactionsAmount?: string;
  totalPaymentLinks?: number;
  lastResetAt?: string | null;
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

interface PlatformBalance {
  totalBalance: string;
  userCount: number;
}

interface ApiUsageStats {
  originDomain: string | null;
  requestCount: number;
  lastRequest: string | null;
  apiKeyIds: number[];
  apiKeys: Array<{
    id: number;
    name: string;
    userId: number;
    isActive: boolean;
    webhookUrl: string | null;
    redirectUrl: string | null;
  }>;
}

function DashboardContent() {
  const { toast } = useToast();
  const [showResetDialog, setShowResetDialog] = useState(false);
  
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: platformBalance } = useQuery<PlatformBalance>({
    queryKey: ["/api/admin/platform-balance"],
  });

  const { data: apiUsageStats } = useQuery<ApiUsageStats[]>({
    queryKey: ["/api/admin/api-usage-stats"],
  });

  const resetStatsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/stats/reset");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Succès", description: "Les statistiques de montants ont été réinitialisées" });
      setShowResetDialog(false);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de réinitialiser les statistiques", variant: "destructive" });
    },
  });

  // Filter API usage stats to only show domains with actual requests (exclude null domains)
  const sitesWithIntegration = apiUsageStats?.filter(s => s.originDomain !== null) || [];
  const unknownDomainStats = apiUsageStats?.find(s => s.originDomain === null);

  const statCards = [
    { title: "Solde Plateforme", value: formatCurrency(platformBalance?.totalBalance || 0), description: `Solde total de ${platformBalance?.userCount || 0} utilisateurs`, icon: Wallet, color: "text-amber-500", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
    { title: "Utilisateurs", value: stats?.totalUsers || 0, description: `${stats?.verifiedUsers || 0} vérifiés`, icon: Users, color: "text-blue-500", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
    { title: "Total Transactions", value: formatCurrency(stats?.totalTransactionsAmount || 0), description: `${stats?.totalTransactionsCount || 0} transactions`, icon: History, color: "text-slate-500", bgColor: "bg-slate-100 dark:bg-slate-900/30" },
    { title: "Total Dépôts", value: formatCurrency(stats?.totalDeposits || 0), description: "Montant total", icon: ArrowDownLeft, color: "text-green-500", bgColor: "bg-green-100 dark:bg-green-900/30" },
    { title: "Total Retraits", value: formatCurrency(stats?.totalWithdrawals || 0), description: "Montant total", icon: ArrowUpRight, color: "text-orange-500", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
    { title: "Paiements API", value: formatCurrency(stats?.totalApiPayments || 0), description: `${stats?.apiTransactionsCount || 0} complétées / ${stats?.apiTransactionsTotal || 0} total`, icon: Globe, color: "text-cyan-500", bgColor: "bg-cyan-100 dark:bg-cyan-900/30" },
    { title: "Paiements Liens", value: formatCurrency(stats?.paymentLinkTransactionsAmount || 0), description: `${stats?.paymentLinkTransactionsCount || 0} transactions`, icon: LinkIcon, color: "text-pink-500", bgColor: "bg-pink-100 dark:bg-pink-900/30" },
    { title: "Commissions du jour", value: formatCurrency(stats?.todayCommissions || 0), description: "Aujourd'hui", icon: TrendingUp, color: "text-indigo-500", bgColor: "bg-indigo-100 dark:bg-indigo-900/30" },
    { title: "Commissions Totales", value: formatCurrency(stats?.totalCommissions || 0), description: `Taux: ${stats?.commissionRate || 7}%`, icon: Percent, color: "text-purple-500", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
    { title: "Commissions API", value: formatCurrency(stats?.apiCommissions || 0), description: "Via paiements API", icon: DollarSign, color: "text-emerald-500", bgColor: "bg-emerald-100 dark:bg-emerald-900/30" },
    { title: "Clés API", value: stats?.totalApiKeys || 0, description: `${stats?.activeApiKeys || 0} actives`, icon: Key, color: "text-indigo-500", bgColor: "bg-indigo-100 dark:bg-indigo-900/30" },
    { title: "Liens de paiement", value: stats?.totalPaymentLinks || 0, description: "Créés sur la plateforme", icon: FileText, color: "text-teal-500", bgColor: "bg-teal-100 dark:bg-teal-900/30" },
    { title: "KYC en attente", value: stats?.pendingKyc || 0, description: "Demandes à traiter", icon: Shield, color: "text-yellow-500", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord administrateur</h1>
          <p className="text-muted-foreground">Vue d'ensemble de la plateforme SendavaPay</p>
          {stats?.lastResetAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Dernière réinitialisation: {formatDate(stats.lastResetAt)}
            </p>
          )}
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowResetDialog(true)}
          data-testid="button-reset-stats"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Réinitialiser les montants
        </Button>
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

      {/* Sites using the API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Sites utilisant l'API
          </CardTitle>
          <CardDescription>
            Domaines détectés faisant des requêtes vers l'API SendavaPay
            {unknownDomainStats && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({unknownDomainStats.requestCount} requêtes sans domaine identifié)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sitesWithIntegration.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun site intégré détecté pour l'instant. Les domaines seront affichés lorsque des requêtes API seront effectuées.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domaine</TableHead>
                  <TableHead>Requêtes</TableHead>
                  <TableHead>Dernière activité</TableHead>
                  <TableHead>Clés API</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sitesWithIntegration.map((site, index) => (
                  <TableRow key={index} data-testid={`row-api-site-${index}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        <span 
                          className="font-medium"
                          data-testid={`text-domain-${index}`}
                        >
                          {site.originDomain}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://${site.originDomain}`, '_blank')}
                          data-testid={`button-visit-site-${index}`}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" data-testid={`badge-request-count-${index}`}>{site.requestCount}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm" data-testid={`text-last-request-${index}`}>
                      {site.lastRequest ? formatDate(site.lastRequest) : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {site.apiKeys.length > 0 ? (
                          site.apiKeys.map((key) => (
                            <Badge 
                              key={key.id} 
                              variant={key.isActive ? "outline" : "secondary"}
                              className="text-xs"
                              data-testid={`badge-api-key-${key.id}`}
                            >
                              {key.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs" data-testid={`text-no-api-keys-${index}`}>-</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser les statistiques de montants</DialogTitle>
            <DialogDescription>
              Cette action va réinitialiser tous les montants affichés (dépôts, retraits, commissions, paiements API, etc.) à zéro. 
              Les compteurs (utilisateurs, clés API, liens de paiement, nombre de transactions) ne seront PAS affectés.
              Les données originales restent intactes dans la base de données.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => resetStatsMutation.mutate()}
              disabled={resetStatsMutation.isPending}
              data-testid="button-confirm-reset"
            >
              {resetStatsMutation.isPending ? "Réinitialisation..." : "Confirmer la réinitialisation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [balanceForm, setBalanceForm] = useState({ amount: "", operation: "add", reason: "" });
  const [editForm, setEditForm] = useState({ fullName: "", email: "", phone: "", adminNote: "", role: "" });
  const [newPassword, setNewPassword] = useState("");

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

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: number; newPassword: string }) => {
      await apiRequest("POST", `/api/admin/users/${userId}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      toast({ title: "Succès", description: "Mot de passe réinitialisé" });
      setShowPasswordDialog(false);
      setNewPassword("");
      setSelectedUser(null);
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message || "Échec de la réinitialisation", variant: "destructive" });
    },
  });

  const openPasswordDialog = (user: UserType) => {
    setSelectedUser(user);
    setNewPassword("");
    setShowPasswordDialog(true);
  };

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
            <table className="w-full min-w-[1000px]">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">ID</th>
                  <th className="text-left p-4 font-medium">Utilisateur</th>
                  <th className="text-left p-4 font-medium">Contact</th>
                  <th className="text-left p-4 font-medium">Pays</th>
                  <th className="text-left p-4 font-medium">Solde</th>
                  <th className="text-left p-4 font-medium">Statut</th>
                  <th className="text-left p-4 font-medium">Inscription</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} className="p-8 text-center"><Skeleton className="h-8 w-full" /></td></tr>
                ) : !filteredUsers?.length ? (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Aucun utilisateur trouvé</td></tr>
                ) : filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/30">
                    <td className="p-4 font-mono text-sm">{user.id}</td>
                    <td className="p-4">
                      <p className="font-medium">{user.fullName}</p>
                      <span className="text-sm text-muted-foreground">
                        {user.role === "admin" ? <Badge variant="default" className="text-xs">Admin</Badge> : "Utilisateur"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 mb-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <p className="text-sm">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <p className="text-sm font-mono">{user.phone}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm" data-testid={`text-user-country-${user.id}`}>{user.country || "-"}</span>
                      </div>
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
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground" data-testid={`text-user-registration-${user.id}`}>{formatDate(user.createdAt)}</span>
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
                          onClick={() => openPasswordDialog(user)}
                          disabled={user.role === "admin"}
                          title="Changer mot de passe"
                          data-testid={`button-reset-password-${user.id}`}
                        >
                          <Key className="h-4 w-4 text-blue-600" />
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

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              {selectedUser && `Définir un nouveau mot de passe pour ${selectedUser.fullName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nouveau mot de passe</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                data-testid="input-new-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Annuler</Button>
            <Button
              onClick={() => selectedUser && resetPasswordMutation.mutate({ userId: selectedUser.id, newPassword })}
              disabled={resetPasswordMutation.isPending || newPassword.length < 6}
              data-testid="button-confirm-reset-password"
            >
              Réinitialiser
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
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const { data: transactions, isLoading } = useQuery<Transaction[]>({ queryKey: ["/api/admin/transactions"] });
  const { data: users, isLoading: usersLoading } = useQuery<UserType[]>({ queryKey: ["/api/admin/users"] });
  const { data: paymentLinks, isLoading: paymentLinksLoading } = useQuery<PaymentLink[]>({ queryKey: ["/api/admin/payment-links"] });
  const isDialogDataLoading = usersLoading || paymentLinksLoading;

  const getUserById = (userId: number) => users?.find(u => u.id === userId);
  const getPaymentLinkById = (id: number | null) => id ? paymentLinks?.find(pl => pl.id === id) : null;
  
  const selectedUser = selectedTransaction ? getUserById(selectedTransaction.userId) : null;
  const selectedPaymentLink = selectedTransaction?.paymentLinkId ? getPaymentLinkById(selectedTransaction.paymentLinkId) : null;
  const selectedMerchant = selectedPaymentLink ? getUserById(selectedPaymentLink.userId) : null;

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
    const headers = ["ID", "User ID", "Utilisateur", "Type", "Montant", "Frais", "Net", "Statut", "Pays", "Moyen de paiement", "Téléphone", "Nom payeur", "Email payeur", "Description", "Date"];
    const rows = filteredTransactions.map((tx) => {
      const user = getUserById(tx.userId);
      return [
        tx.id,
        tx.userId,
        user?.fullName || "-",
        typeLabels[tx.type] || tx.type,
        tx.amount,
        tx.fee,
        tx.netAmount,
        tx.status,
        tx.payerCountry || "-",
        tx.paymentMethod || "-",
        tx.mobileNumber || "-",
        tx.payerName || "-",
        tx.payerEmail || "-",
        tx.description || "",
        formatDate(tx.createdAt),
      ];
    });
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
          <div className="overflow-x-auto">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="border-b bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-4 font-medium">ID</th>
                    <th className="text-left p-4 font-medium">Utilisateur</th>
                    <th className="text-left p-4 font-medium">Type</th>
                    <th className="text-left p-4 font-medium">Montant</th>
                    <th className="text-left p-4 font-medium">Pays</th>
                    <th className="text-left p-4 font-medium">Moyen paiement</th>
                    <th className="text-left p-4 font-medium">Téléphone</th>
                    <th className="text-left p-4 font-medium">Statut</th>
                    <th className="text-left p-4 font-medium">Date</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={10} className="p-8 text-center"><Skeleton className="h-8 w-full" /></td></tr>
                  ) : !filteredTransactions?.length ? (
                    <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">Aucune transaction trouvée</td></tr>
                  ) : filteredTransactions.map((tx) => {
                    const user = getUserById(tx.userId);
                    return (
                    <tr key={tx.id} className={`border-b hover:bg-muted/30 ${isHighValue(tx.amount) ? "bg-orange-50 dark:bg-orange-950/20" : ""}`}>
                      <td className="p-4 font-mono text-sm">{tx.id}</td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-sm">{user?.fullName || "-"}</p>
                          <p className="text-xs text-muted-foreground">ID: {tx.userId}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{typeLabels[tx.type] || tx.type}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatCurrency(tx.amount)}</span>
                          {isHighValue(tx.amount) && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" /> Élevé
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Frais: {formatCurrency(tx.fee)}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm" data-testid={`text-country-${tx.id}`}>{tx.payerCountry || "-"}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm">{tx.paymentMethod || "-"}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-mono" data-testid={`text-phone-${tx.id}`}>{tx.mobileNumber || "-"}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={tx.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30" : tx.status === "pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30" : "bg-red-100 text-red-700 dark:bg-red-900/30"}>
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                      <td className="p-4">
                        <Button size="icon" variant="ghost" onClick={() => setSelectedTransaction(tx)} title="Voir détails" data-testid={`button-view-transaction-${tx.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Détails de la transaction #{selectedTransaction?.id}
            </DialogTitle>
            <DialogDescription>
              Toutes les informations sur cette transaction
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && isDialogDataLoading && (
            <div className="space-y-4 py-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          )}
          {selectedTransaction && !isDialogDataLoading && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">ID Transaction</p>
                  <p className="font-mono font-medium">{selectedTransaction.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge variant="outline">{typeLabels[selectedTransaction.type] || selectedTransaction.type}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <Badge className={selectedTransaction.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : selectedTransaction.status === "pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}>
                    {selectedTransaction.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="text-sm">{formatDate(selectedTransaction.createdAt)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Wallet className="h-4 w-4" /> Montants
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Montant</p>
                    <p className="font-medium text-lg">{formatCurrency(selectedTransaction.amount)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Frais</p>
                    <p className="font-medium">{formatCurrency(selectedTransaction.fee)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Net</p>
                    <p className="font-medium">{formatCurrency(selectedTransaction.netAmount)}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" /> Utilisateur (bénéficiaire)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">ID Utilisateur</p>
                    <p className="font-mono">{selectedTransaction.userId}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Nom</p>
                    <p className="font-medium">{selectedUser?.fullName || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-sm">{selectedUser?.email || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <p className="font-mono text-sm">{selectedUser?.phone || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Informations de paiement
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Pays</p>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <p>{selectedTransaction.payerCountry || "-"}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Moyen de paiement</p>
                    <p>{selectedTransaction.paymentMethod || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Numéro téléphone (payeur)</p>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <p className="font-mono">{selectedTransaction.mobileNumber || "-"}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Référence externe</p>
                    <p className="font-mono text-sm">{selectedTransaction.externalRef || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" /> Informations du payeur
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Nom du payeur</p>
                    <p>{selectedTransaction.payerName || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email du payeur</p>
                    <p className="text-sm">{selectedTransaction.payerEmail || "-"}</p>
                  </div>
                </div>
              </div>

              {selectedPaymentLink && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" /> Lien de paiement
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">ID Lien</p>
                      <p className="font-mono">{selectedPaymentLink.id}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Titre</p>
                      <p>{selectedPaymentLink.title}</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <p className="text-sm text-muted-foreground">Marchand (créateur)</p>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{selectedMerchant?.fullName || "-"}</p>
                        {selectedMerchant && (
                          <span className="text-sm text-muted-foreground">
                            ({selectedMerchant.email} - ID: {selectedMerchant.id})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedTransaction.description && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Description
                  </h4>
                  <p className="text-sm bg-muted p-3 rounded-md">{selectedTransaction.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTransaction(null)} data-testid="button-close-transaction-dialog">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  // Simple names
  mtn: "MTN Mobile Money",
  moov: "Moov Money",
  tmoney: "TMoney",
  orange: "Orange Money",
  wave: "Wave",
  celtis: "Celtis",
  vodacom: "Vodacom M-Pesa",
  airtel: "Airtel Money",
  // Operator codes
  mtn_cm: "MTN Mobile Money (Cameroun)",
  om_cm: "Orange Money (Cameroun)",
  om_ci: "Orange Money (Côte d'Ivoire)",
  mtn_ci: "MTN Money (Côte d'Ivoire)",
  moov_ci: "Moov Money (Côte d'Ivoire)",
  wave_ci: "Wave (Côte d'Ivoire)",
  moov_bf: "Moov Money (Burkina Faso)",
  om_bf: "Orange Money (Burkina Faso)",
  mtn_bj: "MTN Money (Bénin)",
  moov_bj: "Moov Money (Bénin)",
  tmoney_tg: "T-Money (Togo)",
  moov_tg: "Moov Money (Togo)",
  vodacom_cod: "Vodacom M-Pesa (RDC)",
  airtel_cod: "Airtel Money (RDC)",
  om_cod: "Orange Money (RDC)",
  airtel_cog: "Airtel Money (Congo)",
  mtn_cog: "MTN Money (Congo)",
};

// Helper function to format payment method name
function formatPaymentMethodName(method: string | null | undefined): string {
  if (!method) return "-";
  
  // Check if it's in the mapping
  const lowerMethod = method.toLowerCase();
  if (paymentMethodNames[lowerMethod]) {
    return paymentMethodNames[lowerMethod];
  }
  
  // If it's already a full name like "MTN Mobile Money" or "Moov Money", return as-is
  if (method.includes("Money") || method.includes("M-Pesa") || method.includes("Wave") || method.includes("T-Money")) {
    return method;
  }
  
  // Try to extract operator name from code (e.g., "mtn_cm" -> "MTN")
  const parts = method.split("_");
  if (parts.length > 0) {
    const operatorKey = parts[0].toLowerCase();
    if (paymentMethodNames[operatorKey]) {
      return paymentMethodNames[operatorKey];
    }
  }
  
  // Return the original value if nothing matches
  return method;
}

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
                          {request.walletName?.startsWith("PARTENAIRE:") && (
                            <Badge className="bg-purple-600 text-white dark:bg-purple-700 dark:text-white" data-testid={`badge-partner-withdrawal-${request.id}`}>
                              PARTENAIRE
                            </Badge>
                          )}
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
                            <span className="text-muted-foreground">{request.walletName?.startsWith("PARTENAIRE:") ? "Partenaire:" : "Utilisateur:"}</span>{" "}
                            <span className="font-medium">
                              {request.walletName?.startsWith("PARTENAIRE:")
                                ? request.walletName.replace("PARTENAIRE:", "").split(" - ")[0].trim()
                                : (request.user?.fullName || `User #${request.userId}`)}
                            </span>
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
                            <span className="font-medium">{formatPaymentMethodName(request.paymentMethod)}</span>
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

  const { data: duplicateKyc = [] } = useQuery<KycRequestWithUser[]>({
    queryKey: ["/api/admin/kyc/check-duplicate", selectedKyc?.documentNumber],
    queryFn: async () => {
      if (!selectedKyc?.documentNumber) return [];
      const res = await fetch(`/api/admin/kyc/check-duplicate/${encodeURIComponent(selectedKyc.documentNumber)}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedKyc?.documentNumber,
  });

  const [docNumberSearch, setDocNumberSearch] = useState("");
  const [docNumberQuery, setDocNumberQuery] = useState("");

  const { data: docNumberResults = [], isFetching: docNumberFetching } = useQuery<KycRequestWithUser[]>({
    queryKey: ["/api/admin/kyc/check-duplicate", docNumberQuery],
    queryFn: async () => {
      if (!docNumberQuery.trim()) return [];
      const res = await fetch(`/api/admin/kyc/check-duplicate/${encodeURIComponent(docNumberQuery.trim())}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!docNumberQuery.trim(),
  });

  const filteredRequests = useMemo(() => {
    return requests?.filter((req) => {
      const matchesSearch = 
        req.id.toString().includes(searchQuery) ||
        req.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.user?.phone?.includes(searchQuery) ||
        (req.documentNumber && req.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()));
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

      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4 text-blue-600" /> Vérifier un numéro de pièce d'identité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: AB123456 — entrez un numéro de document pour voir tous les comptes qui l'ont utilisé"
              value={docNumberSearch}
              onChange={(e) => setDocNumberSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") setDocNumberQuery(docNumberSearch); }}
              className="flex-1"
              data-testid="input-doc-number-search"
            />
            <Button onClick={() => setDocNumberQuery(docNumberSearch)} disabled={!docNumberSearch.trim() || docNumberFetching} data-testid="button-doc-number-search">
              {docNumberFetching ? "..." : "Vérifier"}
            </Button>
            {docNumberQuery && (
              <Button variant="outline" onClick={() => { setDocNumberSearch(""); setDocNumberQuery(""); }}>
                Effacer
              </Button>
            )}
          </div>
          {docNumberQuery && (
            <div className="mt-3">
              {docNumberFetching ? (
                <p className="text-sm text-muted-foreground">Recherche en cours...</p>
              ) : docNumberResults.length === 0 ? (
                <p className="text-sm text-green-600 font-medium">✅ Aucun compte n'a utilisé ce numéro — document unique</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">⚠️ {docNumberResults.length} compte(s) ont utilisé ce numéro :</p>
                  {docNumberResults.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-2 rounded-lg border border-destructive/30 bg-destructive/5 text-sm" data-testid={`doc-duplicate-result-${r.id}`}>
                      <div>
                        <span className="font-medium">{r.user?.fullName || `User #${r.userId}`}</span>
                        <span className="text-muted-foreground ml-2">{r.user?.email}</span>
                        <span className="text-muted-foreground ml-2">{r.user?.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={r.status === "approved" ? "bg-green-100 text-green-700" : r.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>
                          {r.status === "approved" ? "Approuvé" : r.status === "pending" ? "En attente" : "Rejeté"}
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => setSelectedKyc(r)}>Voir</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par ID, nom, email, téléphone, numéro de pièce..."
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
                    <td className="p-4">
                      <p className="font-medium">{req.documentType}</p>
                      {req.documentNumber && <p className="text-xs text-muted-foreground font-mono">N° {req.documentNumber}</p>}
                    </td>
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
                  {selectedKyc.documentNumber && (
                    <span className="text-muted-foreground font-normal text-sm">— N° {selectedKyc.documentNumber}</span>
                  )}
                </h4>
                {selectedKyc.documentNumber && duplicateKyc.filter(k => k.id !== selectedKyc.id).length > 0 && (
                  <div className="mb-3 flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive font-medium" data-testid="alert-kyc-duplicate">
                    ⚠️ Ce numéro de document (<strong>{selectedKyc.documentNumber}</strong>) a déjà été utilisé par {duplicateKyc.filter(k => k.id !== selectedKyc.id).length} autre(s) compte(s) :
                    <span className="ml-1">
                      {duplicateKyc.filter(k => k.id !== selectedKyc.id).map(k => `${k.user?.fullName || "Inconnu"} (ID ${k.userId})`).join(", ")}
                    </span>
                  </div>
                )}
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

interface ApiKeyWithUser extends ApiKey {
  keyPrefix?: string;
  user?: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
  } | null;
}

interface ApiLogSource {
  userId: number;
  user: { id: number; fullName: string; email: string } | null;
  sources: string[];
  requestCount: number;
  recentLogs: { id: number; endpoint: string; method: string; statusCode: number; ipAddress: string; userAgent: string; createdAt: string }[];
}

function ApiKeysContent() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKeyWithUser | null>(null);

  const { data: apiKeys, isLoading } = useQuery<ApiKeyWithUser[]>({ queryKey: ["/api/admin/api-keys"] });
  const { data: apiLogs } = useQuery<ApiLogSource[]>({ queryKey: ["/api/admin/api-logs"] });
  
  const getSourcesForUser = (userId: number) => {
    return apiLogs?.find(log => log.userId === userId);
  };

  const filteredKeys = useMemo(() => {
    return apiKeys?.filter((key) => {
      const matchesSearch = 
        key.id.toString().includes(searchQuery) ||
        key.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        key.keyPrefix?.includes(searchQuery) ||
        key.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        key.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
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
      setSelectedApiKey(null);
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
                placeholder="Rechercher par ID, nom, email, préfixe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-api-keys"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-api-key-status">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Créateur</TableHead>
                  <TableHead>Nom clé</TableHead>
                  <TableHead>Clé (préfixe)</TableHead>
                  <TableHead>URL Redirection</TableHead>
                  <TableHead>URL Webhook</TableHead>
                  <TableHead>Requêtes</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créée le</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={10} className="p-8 text-center"><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                ) : !filteredKeys?.length ? (
                  <TableRow><TableCell colSpan={10} className="p-8 text-center text-muted-foreground">Aucune clé API trouvée</TableCell></TableRow>
                ) : filteredKeys.map((key) => (
                  <TableRow key={key.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelectedApiKey(key)} data-testid={`row-api-key-${key.id}`}>
                    <TableCell className="font-mono text-sm" data-testid={`text-api-key-id-${key.id}`}>{key.id}</TableCell>
                    <TableCell data-testid={`text-api-key-creator-${key.id}`}>
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{key.user?.fullName || "-"}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span>{key.user?.email || "-"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-api-key-name-${key.id}`}>{key.name}</TableCell>
                    <TableCell className="font-mono text-sm" data-testid={`text-api-key-prefix-${key.id}`}>{key.keyPrefix}...</TableCell>
                    <TableCell data-testid={`text-api-key-redirect-${key.id}`}>
                      {key.redirectUrl ? (
                        <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400" title={key.redirectUrl}>
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate max-w-[120px]">{key.redirectUrl}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell data-testid={`text-api-key-webhook-${key.id}`}>
                      {key.webhookUrl ? (
                        <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400" title={key.webhookUrl}>
                          <Globe className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate max-w-[120px]">{key.webhookUrl}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell data-testid={`text-api-key-requests-${key.id}`}>{key.requestCount || 0}</TableCell>
                    <TableCell data-testid={`text-api-key-status-${key.id}`}>
                      <Badge className={key.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}>
                        {key.isActive ? "Active" : "Révoquée"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground" data-testid={`text-api-key-date-${key.id}`}>{formatDate(key.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedApiKey(key); }} data-testid={`button-view-api-key-${key.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {key.isActive && (
                          <Button size="icon" variant="destructive" onClick={(e) => { e.stopPropagation(); revokeMutation.mutate(key.id); }} data-testid={`button-revoke-api-key-${key.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedApiKey} onOpenChange={(open) => !open && setSelectedApiKey(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" /> Détails de la clé API #{selectedApiKey?.id}
            </DialogTitle>
            <DialogDescription>
              Toutes les informations sur cette clé API
            </DialogDescription>
          </DialogHeader>
          {selectedApiKey && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">ID</p>
                  <p className="font-mono font-medium" data-testid="dialog-api-key-id">{selectedApiKey.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <Badge className={selectedApiKey.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"} data-testid="dialog-api-key-status">
                    {selectedApiKey.isActive ? "Active" : "Révoquée"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Nom de la clé</p>
                  <p className="font-medium" data-testid="dialog-api-key-name">{selectedApiKey.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Préfixe de la clé</p>
                  <p className="font-mono text-sm" data-testid="dialog-api-key-prefix">{selectedApiKey.keyPrefix}...</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" /> Créateur de la clé
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">ID Utilisateur</p>
                    <p className="font-mono" data-testid="dialog-api-key-user-id">{selectedApiKey.userId}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Nom complet</p>
                    <p className="font-medium" data-testid="dialog-api-key-user-name">{selectedApiKey.user?.fullName || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm" data-testid="dialog-api-key-user-email">{selectedApiKey.user?.email || "-"}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <p className="font-mono text-sm" data-testid="dialog-api-key-user-phone">{selectedApiKey.user?.phone || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" /> URLs configurées
                </h4>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> URL de redirection
                    </p>
                    {selectedApiKey.redirectUrl ? (
                      <p className="font-mono text-sm break-all bg-muted p-2 rounded" data-testid="dialog-api-key-redirect-url">{selectedApiKey.redirectUrl}</p>
                    ) : (
                      <p className="text-muted-foreground italic" data-testid="dialog-api-key-redirect-url">Non configurée</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Globe className="h-3 w-3" /> URL du webhook
                    </p>
                    {selectedApiKey.webhookUrl ? (
                      <p className="font-mono text-sm break-all bg-muted p-2 rounded" data-testid="dialog-api-key-webhook-url">{selectedApiKey.webhookUrl}</p>
                    ) : (
                      <p className="text-muted-foreground italic" data-testid="dialog-api-key-webhook-url">Non configurée</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Sources détectées (IPs)
                </h4>
                {(() => {
                  const sources = getSourcesForUser(selectedApiKey.userId);
                  if (!sources || sources.sources.length === 0) {
                    return (
                      <p className="text-muted-foreground italic text-sm" data-testid="dialog-api-key-no-sources">
                        Aucune requête API enregistrée pour cet utilisateur
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {sources.sources.map((ip, idx) => (
                          <Badge key={idx} variant="outline" className="font-mono text-xs" data-testid={`dialog-api-key-source-${idx}`}>
                            {ip}
                          </Badge>
                        ))}
                      </div>
                      {sources.recentLogs.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground mb-2">Dernières requêtes :</p>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {sources.recentLogs.slice(0, 10).map((log, idx) => (
                              <div key={log.id} className="flex items-center gap-2 text-xs bg-muted p-2 rounded" data-testid={`dialog-api-key-log-${idx}`}>
                                <Badge className={log.statusCode < 400 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}>
                                  {log.statusCode}
                                </Badge>
                                <span className="font-mono">{log.method}</span>
                                <span className="truncate flex-1">{log.endpoint}</span>
                                <span className="text-muted-foreground">{log.ipAddress}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Statistiques
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Requêtes</p>
                    <p className="font-medium text-lg" data-testid="dialog-api-key-requests">{selectedApiKey.requestCount || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Dernière utilisation</p>
                    <p className="text-sm" data-testid="dialog-api-key-last-used">{selectedApiKey.lastUsedAt ? formatDate(selectedApiKey.lastUsedAt) : "Jamais"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Date de création</p>
                    <p className="text-sm" data-testid="dialog-api-key-created">{formatDate(selectedApiKey.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            {selectedApiKey?.isActive && (
              <Button 
                variant="destructive" 
                onClick={() => revokeMutation.mutate(selectedApiKey.id)}
                disabled={revokeMutation.isPending}
                data-testid="button-revoke-api-key-dialog"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Révoquer la clé
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedApiKey(null)} data-testid="button-close-api-key-dialog">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface FeeChangeRecord {
  id: number;
  adminId: number | null;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  reason: string | null;
  createdAt: string;
}

interface CountryFee {
  id: number;
  code: string;
  name: string;
  currency: string;
  depositFeeRate: string | null;
  withdrawFeeRate: string | null;
}

function CommissionsContent() {
  const { toast } = useToast();
  const [depositRate, setDepositRate] = useState("7");
  const [encaissementRate, setEncaissementRate] = useState("7");
  const [withdrawalRate, setWithdrawalRate] = useState("7");
  const [reason, setReason] = useState("");
  const [editingFees, setEditingFees] = useState<Record<number, { deposit: string; withdraw: string }>>({});

  const { data: settings } = useQuery<{ depositRate: string; encaissementRate: string; withdrawalRate: string }>({
    queryKey: ["/api/admin/settings"],
  });

  const { data: countriesWithFees, isLoading: loadingCountryFees } = useQuery<CountryFee[]>({
    queryKey: ["/api/admin/countries"],
  });

  const { data: feeChanges, isLoading: changesLoading } = useQuery<FeeChangeRecord[]>({
    queryKey: ["/api/admin/fee-changes"],
  });

  useEffect(() => {
    if (settings) {
      setDepositRate(settings.depositRate || "7");
      setEncaissementRate(settings.encaissementRate || "7");
      setWithdrawalRate(settings.withdrawalRate || "7");
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: { depositRate: string; encaissementRate: string; withdrawalRate: string; reason?: string }) => {
      await apiRequest("POST", "/api/admin/fees/update", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fee-changes"] });
      setReason("");
      toast({ title: "Taux mis à jour", description: "Les nouveaux taux sont actifs immédiatement pour les prochaines transactions." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour les taux", variant: "destructive" });
    },
  });

  const updateCountryFeesMutation = useMutation({
    mutationFn: async ({ id, depositFeeRate, withdrawFeeRate }: { id: number; depositFeeRate: string; withdrawFeeRate: string }) => {
      await apiRequest("PUT", `/api/admin/countries/${id}/fees`, { depositFeeRate: depositFeeRate || null, withdrawFeeRate: withdrawFeeRate || null });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/countries"] });
      setEditingFees(prev => { const n = { ...prev }; delete n[vars.id]; return n; });
      toast({ title: "Frais mis à jour", description: "Les frais spécifiques à ce pays sont actifs immédiatement." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour les frais", variant: "destructive" });
    },
  });

  const validateRate = (value: string): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 20;
  };

  const handleSubmit = () => {
    if (!validateRate(depositRate) || !validateRate(encaissementRate) || !validateRate(withdrawalRate)) {
      toast({ title: "Erreur de validation", description: "Les taux doivent \u00eatre entre 0% et 20%", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ depositRate, encaissementRate, withdrawalRate, reason: reason || undefined });
  };

  const fieldLabel = (field: string) => {
    switch (field) {
      case "deposit": return "D\u00e9p\u00f4t";
      case "encaissement": return "Encaissement";
      case "withdraw": return "Retrait";
      default: return field;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-commissions-title">Param\u00e8tres de frais</h1>
        <p className="text-muted-foreground">Configurez les taux appliqu\u00e9s aux diff\u00e9rents types de transactions</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Taux de commission</CardTitle>
          <CardDescription>D\u00e9finissez les pourcentages pr\u00e9lev\u00e9s sur les transactions (entre 0% et 20%)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="deposit-rate">Frais de d\u00e9p\u00f4t (%)</Label>
              <Input
                id="deposit-rate"
                data-testid="input-deposit-rate"
                type="number"
                value={depositRate}
                onChange={(e) => setDepositRate(e.target.value)}
                min="0"
                max="20"
                step="0.1"
              />
              {!validateRate(depositRate) && (
                <p className="text-sm text-destructive" data-testid="text-deposit-error">Doit \u00eatre entre 0 et 20</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="encaissement-rate">Frais d'encaissement (%)</Label>
              <Input
                id="encaissement-rate"
                data-testid="input-encaissement-rate"
                type="number"
                value={encaissementRate}
                onChange={(e) => setEncaissementRate(e.target.value)}
                min="0"
                max="20"
                step="0.1"
              />
              {!validateRate(encaissementRate) && (
                <p className="text-sm text-destructive" data-testid="text-encaissement-error">Doit \u00eatre entre 0 et 20</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawal-rate">Frais de retrait (%)</Label>
              <Input
                id="withdrawal-rate"
                data-testid="input-withdrawal-rate"
                type="number"
                value={withdrawalRate}
                onChange={(e) => setWithdrawalRate(e.target.value)}
                min="0"
                max="20"
                step="0.1"
              />
              {!validateRate(withdrawalRate) && (
                <p className="text-sm text-destructive" data-testid="text-withdrawal-error">Doit \u00eatre entre 0 et 20</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Raison du changement (optionnel)</Label>
            <Input
              id="reason"
              data-testid="input-fee-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Ajustement suite \u00e0 n\u00e9gociation op\u00e9rateur"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            data-testid="button-update-fees"
          >
            {updateMutation.isPending ? "Mise \u00e0 jour..." : "Mettre \u00e0 jour les taux"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grille tarifaire par pays</CardTitle>
          <CardDescription>
            Définissez des frais spécifiques par pays. Si vide, le taux global s'applique.
            Les frais incluent la commission SendavaPay et les frais partenaires.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCountryFees ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pays</TableHead>
                    <TableHead>Devise</TableHead>
                    <TableHead className="text-center">Frais dépôt (%)</TableHead>
                    <TableHead className="text-center">Frais retrait (%)</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {countriesWithFees?.map((country) => {
                    const isEditing = editingFees[country.id] !== undefined;
                    const editVals = editingFees[country.id] || {
                      deposit: country.depositFeeRate ?? "",
                      withdraw: country.withdrawFeeRate ?? "",
                    };
                    const globalDepositRate = settings?.depositRate || "7";
                    const globalWithdrawRate = settings?.withdrawalRate || "7";
                    return (
                      <TableRow key={country.id} data-testid={`row-country-fee-${country.id}`}>
                        <TableCell className="font-medium">{country.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{country.currency}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              className="w-20 mx-auto text-center"
                              value={editVals.deposit}
                              onChange={(e) => setEditingFees(prev => ({ ...prev, [country.id]: { ...editVals, deposit: e.target.value } }))}
                              placeholder={globalDepositRate}
                              min="0"
                              max="20"
                              step="0.1"
                              data-testid={`input-deposit-fee-${country.id}`}
                            />
                          ) : (
                            <span className={country.depositFeeRate ? "font-semibold text-primary" : "text-muted-foreground"}>
                              {country.depositFeeRate ? `${country.depositFeeRate}%` : `${globalDepositRate}% (global)`}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              className="w-20 mx-auto text-center"
                              value={editVals.withdraw}
                              onChange={(e) => setEditingFees(prev => ({ ...prev, [country.id]: { ...editVals, withdraw: e.target.value } }))}
                              placeholder={globalWithdrawRate}
                              min="0"
                              max="20"
                              step="0.1"
                              data-testid={`input-withdraw-fee-${country.id}`}
                            />
                          ) : (
                            <span className={country.withdrawFeeRate ? "font-semibold text-primary" : "text-muted-foreground"}>
                              {country.withdrawFeeRate ? `${country.withdrawFeeRate}%` : `${globalWithdrawRate}% (global)`}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isEditing ? (
                            <div className="flex gap-1 justify-center">
                              <Button
                                size="sm"
                                onClick={() => updateCountryFeesMutation.mutate({ id: country.id, depositFeeRate: editVals.deposit, withdrawFeeRate: editVals.withdraw })}
                                disabled={updateCountryFeesMutation.isPending}
                                data-testid={`button-save-fee-${country.id}`}
                              >
                                Enregistrer
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingFees(prev => { const n = { ...prev }; delete n[country.id]; return n; })}
                                data-testid={`button-cancel-fee-${country.id}`}
                              >
                                Annuler
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-1 justify-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingFees(prev => ({ ...prev, [country.id]: { deposit: country.depositFeeRate ?? "", withdraw: country.withdrawFeeRate ?? "" } }))}
                                data-testid={`button-edit-fee-${country.id}`}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Modifier
                              </Button>
                              {(country.depositFeeRate || country.withdrawFeeRate) && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-muted-foreground"
                                  onClick={() => updateCountryFeesMutation.mutate({ id: country.id, depositFeeRate: "", withdrawFeeRate: "" })}
                                  data-testid={`button-reset-fee-${country.id}`}
                                >
                                  Réinitialiser
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique des modifications</CardTitle>
          <CardDescription>Journal de toutes les modifications de taux</CardDescription>
        </CardHeader>
        <CardContent>
          {changesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : feeChanges && feeChanges.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Ancien taux</TableHead>
                  <TableHead>Nouveau taux</TableHead>
                  <TableHead>Raison</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeChanges.map((change) => (
                  <TableRow key={change.id} data-testid={`row-fee-change-${change.id}`}>
                    <TableCell className="text-muted-foreground text-sm" data-testid={`text-change-date-${change.id}`}>
                      {new Date(change.createdAt).toLocaleString("fr-FR")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" data-testid={`badge-change-type-${change.id}`}>
                        {fieldLabel(change.fieldChanged)}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-old-value-${change.id}`}>{change.oldValue}%</TableCell>
                    <TableCell data-testid={`text-new-value-${change.id}`}>{change.newValue}%</TableCell>
                    <TableCell className="text-muted-foreground text-sm" data-testid={`text-change-reason-${change.id}`}>
                      {change.reason || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune modification de taux enregistr\u00e9e</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface GlobalNotification {
  id: number;
  message: string;
  color: string;
  buttonText: string | null;
  buttonUrl: string | null;
  isActive: boolean;
  createdBy: number | null;
  createdAt: string;
}

const NOTIFICATION_COLORS = [
  { value: "blue", label: "Bleu", bg: "bg-blue-500", text: "text-white" },
  { value: "green", label: "Vert", bg: "bg-green-500", text: "text-white" },
  { value: "yellow", label: "Jaune", bg: "bg-yellow-500", text: "text-black" },
  { value: "red", label: "Rouge", bg: "bg-red-500", text: "text-white" },
  { value: "purple", label: "Violet", bg: "bg-purple-500", text: "text-white" },
  { value: "orange", label: "Orange", bg: "bg-orange-500", text: "text-white" },
];

function MessagingContent() {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [color, setColor] = useState("blue");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");

  const { data: notifications, isLoading } = useQuery<GlobalNotification[]>({
    queryKey: ["/api/admin/global-notifications"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { message: string; color: string; buttonText?: string; buttonUrl?: string }) => {
      await apiRequest("POST", "/api/admin/global-notifications", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/global-notifications"] });
      toast({ title: "Succès", description: "Notification créée" });
      setMessage("");
      setButtonText("");
      setButtonUrl("");
    },
    onError: () => {
      toast({ title: "Erreur", description: "Échec de la création", variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest("PUT", `/api/admin/global-notifications/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/global-notifications"] });
      toast({ title: "Succès", description: "Statut mis à jour" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Échec de la mise à jour", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/global-notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/global-notifications"] });
      toast({ title: "Succès", description: "Notification supprimée" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Échec de la suppression", variant: "destructive" });
    },
  });

  const handleCreate = () => {
    if (!message.trim()) {
      toast({ title: "Erreur", description: "Veuillez entrer un message", variant: "destructive" });
      return;
    }
    createMutation.mutate({ 
      message: message.trim(), 
      color,
      buttonText: buttonText.trim() || undefined,
      buttonUrl: buttonUrl.trim() || undefined,
    });
  };

  const getColorClasses = (colorValue: string) => {
    const colorConfig = NOTIFICATION_COLORS.find(c => c.value === colorValue);
    return colorConfig || NOTIFICATION_COLORS[0];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notifications globales</h1>
        <p className="text-muted-foreground">Créez des bannières de notification visibles par tous les utilisateurs</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle notification</CardTitle>
            <CardDescription>Cette notification s'affichera en haut de l'écran pour les utilisateurs connectés</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notification-message">Message</Label>
              <Textarea
                id="notification-message"
                placeholder="Votre message de notification..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                data-testid="textarea-notification-message"
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur de la bannière</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger data-testid="select-notification-color">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_COLORS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${c.bg}`}></div>
                        <span>{c.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="button-text">Texte du bouton (optionnel)</Label>
              <Input
                id="button-text"
                placeholder="Ex: Cliquez ici"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                data-testid="input-button-text"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="button-url">Lien du bouton (optionnel)</Label>
              <Input
                id="button-url"
                placeholder="https://..."
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
                data-testid="input-button-url"
              />
            </div>
            
            {message && (
              <div className="space-y-2">
                <Label>Aperçu</Label>
                <div className={`p-3 rounded-md ${getColorClasses(color).bg} ${getColorClasses(color).text} flex items-center justify-between gap-3`}>
                  <span className="text-sm flex-1">{message}</span>
                  {buttonText && (
                    <Button size="sm" variant="secondary" className="shrink-0">
                      {buttonText}
                    </Button>
                  )}
                  <XCircle className="h-4 w-4 cursor-pointer opacity-70 hover:opacity-100 shrink-0" />
                </div>
              </div>
            )}
            
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full" data-testid="button-create-notification">
              <Plus className="h-4 w-4 mr-2" /> Créer la notification
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications existantes</CardTitle>
            <CardDescription>Gérez vos notifications (activer/désactiver ou supprimer)</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {isLoading ? (
                <div className="p-4"><Skeleton className="h-20 w-full" /></div>
              ) : notifications && notifications.length > 0 ? (
                <div className="divide-y">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-4 space-y-3" data-testid={`notification-item-${notif.id}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className={`p-2 rounded-md ${getColorClasses(notif.color).bg} ${getColorClasses(notif.color).text} flex-1`}>
                          <p className="text-sm">{notif.message}</p>
                          {notif.buttonText && (
                            <div className="mt-2 flex items-center gap-2">
                              <Button size="sm" variant="secondary">
                                {notif.buttonText}
                              </Button>
                              {notif.buttonUrl && (
                                <span className="text-xs opacity-70 truncate max-w-[150px]">{notif.buttonUrl}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className={notif.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"} data-testid={`badge-status-${notif.id}`}>
                            {notif.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(notif.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`toggle-${notif.id}`} className="text-xs text-muted-foreground">
                              {notif.isActive ? "Désactiver" : "Activer"}
                            </Label>
                            <Switch
                              id={`toggle-${notif.id}`}
                              checked={notif.isActive}
                              onCheckedChange={(checked) => toggleMutation.mutate({ id: notif.id, isActive: checked })}
                              data-testid={`switch-toggle-${notif.id}`}
                            />
                          </div>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => deleteMutation.mutate(notif.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${notif.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune notification créée</p>
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

interface SiteSettings {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
}

function SettingsContent() {
  const { toast } = useToast();
  const [platformName, setPlatformName] = useState("SendavaPay");
  const [supportEmail, setSupportEmail] = useState("support@sendavapay.com");
  const [supportPhone, setSupportPhone] = useState("+228 92299772");

  const { data: siteSettings, isLoading: settingsLoading } = useQuery<SiteSettings>({
    queryKey: ['/api/admin/site-settings'],
  });

  useEffect(() => {
    if (siteSettings) {
      setPlatformName(siteSettings.platformName || "SendavaPay");
      setSupportEmail(siteSettings.supportEmail || "support@sendavapay.com");
      setSupportPhone(siteSettings.supportPhone || "+228 92299772");
    }
  }, [siteSettings]);

  const { data: socialLinks = [], refetch: refetchLinks } = useQuery<SocialLink[]>({
    queryKey: ['/api/admin/social-links'],
  });

  const { data: maintenanceData, refetch: refetchMaintenance } = useQuery<{ enabled: boolean }>({
    queryKey: ['/api/admin/maintenance'],
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

  const maintenanceMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest("PUT", "/api/admin/maintenance", { enabled });
      return res.json();
    },
    onSuccess: (data) => {
      refetchMaintenance();
      toast({ 
        title: data.enabled ? "Mode maintenance activé" : "Mode maintenance désactivé",
        description: data.enabled ? "La plateforme est maintenant en maintenance" : "La plateforme est maintenant accessible"
      });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier le mode maintenance", variant: "destructive" });
    }
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: { platformName: string; supportEmail: string; supportPhone: string }) => {
      const res = await apiRequest("PUT", "/api/admin/site-settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/site-settings'] });
      toast({ title: "Paramètres enregistrés", description: "Les modifications ont été appliquées avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'enregistrer les paramètres", variant: "destructive" });
    }
  });

  const handleSave = () => {
    saveSettingsMutation.mutate({ platformName, supportEmail, supportPhone });
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
          <Button onClick={handleSave} disabled={saveSettingsMutation.isPending}>
            {saveSettingsMutation.isPending ? "Enregistrement..." : "Enregistrer les paramètres"}
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
            <div className="flex items-center gap-3">
              <Badge variant={maintenanceData?.enabled ? "destructive" : "secondary"}>
                {maintenanceData?.enabled ? "Activé" : "Désactivé"}
              </Badge>
              <Switch
                checked={maintenanceData?.enabled ?? false}
                onCheckedChange={(checked) => maintenanceMutation.mutate(checked)}
                disabled={maintenanceMutation.isPending}
                data-testid="switch-maintenance-mode"
              />
            </div>
          </div>
          <ApiMaintenanceToggle />
        </CardContent>
      </Card>
    </div>
  );
}

function ApiMaintenanceToggle() {
  const { toast } = useToast();
  
  const { data: apiMaintenanceData, refetch: refetchApiMaintenance } = useQuery<{ enabled: boolean }>({
    queryKey: ['/api/admin/api-maintenance'],
  });

  const apiMaintenanceMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest("PUT", "/api/admin/api-maintenance", { enabled });
      return res.json();
    },
    onSuccess: (data) => {
      refetchApiMaintenance();
      toast({ 
        title: data.enabled ? "Maintenance API activée" : "Maintenance API désactivée",
        description: data.enabled ? "L'API et la documentation sont en maintenance" : "L'API et la documentation sont accessibles"
      });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier le mode maintenance API", variant: "destructive" });
    }
  });

  return (
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
      <div>
        <p className="font-medium">Maintenance API & Documentation</p>
        <p className="text-sm text-muted-foreground">Désactiver l'API et afficher un message de maintenance sur la documentation</p>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={apiMaintenanceData?.enabled ? "destructive" : "secondary"}>
          {apiMaintenanceData?.enabled ? "Activé" : "Désactivé"}
        </Badge>
        <Switch
          checked={apiMaintenanceData?.enabled ?? false}
          onCheckedChange={(checked) => apiMaintenanceMutation.mutate(checked)}
          disabled={apiMaintenanceMutation.isPending}
          data-testid="switch-api-maintenance-mode"
        />
      </div>
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
  const [showEditOperatorDialog, setShowEditOperatorDialog] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  const [countryForm, setCountryForm] = useState({ code: "", name: "", currency: "XOF", isActive: true });
  const [operatorForm, setOperatorForm] = useState({ countryId: 0, name: "", code: "", isActive: true, type: "mobile_money", dailyLimit: "1000000", paymentGateway: "soleaspay", inMaintenance: false, maintenanceDeposit: false, maintenanceWithdraw: false, maintenancePaymentLink: false, maintenanceApi: false });

  const { data: countries, isLoading: loadingCountries } = useQuery<Country[]>({ queryKey: ["/api/admin/countries"] });
  const { data: operators, isLoading: loadingOperators } = useQuery<Operator[]>({ queryKey: ["/api/admin/operators"] });
  const { data: staticServices = [] } = useQuery<{ id: number; name: string; description: string; country: string; countryCode: string; currency: string; operator: string; paymentGateway: string }[]>({ queryKey: ["/api/admin/static-services"] });

  const operatorsByCountry = useMemo(() => {
    if (!countries || !operators) return {};
    const grouped: Record<number, Operator[]> = {};
    countries.forEach(c => { grouped[c.id] = []; });
    operators.forEach(op => {
      if (grouped[op.countryId]) {
        grouped[op.countryId].push(op);
      }
    });
    return grouped;
  }, [countries, operators]);

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

  const updateOperatorMutation = useMutation({
    mutationFn: (data: { id: number; updates: Partial<Operator> }) => 
      apiRequest("PUT", `/api/admin/operators/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/operators"] });
      toast({ title: "Opérateur mis à jour" });
      setShowEditOperatorDialog(false);
      setEditingOperator(null);
    },
  });

  const deleteOperatorMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/operators/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/operators"] });
      toast({ title: "Opérateur supprimé" });
    },
  });

  const toggleAllOperators = async (countryId: number, active: boolean) => {
    const ops = operatorsByCountry[countryId] || [];
    for (const op of ops) {
      await updateOperatorMutation.mutateAsync({ id: op.id, updates: { isActive: active } });
    }
  };

  const openEditOperator = (op: Operator) => {
    setEditingOperator(op);
    setOperatorForm({
      countryId: op.countryId,
      name: op.name,
      code: op.code,
      isActive: op.isActive,
      type: op.type || "mobile_money",
      dailyLimit: op.dailyLimit || "1000000",
      paymentGateway: op.paymentGateway || "soleaspay",
      inMaintenance: op.inMaintenance || false,
      maintenanceDeposit: (op as any).maintenanceDeposit || false,
      maintenanceWithdraw: (op as any).maintenanceWithdraw || false,
      maintenancePaymentLink: (op as any).maintenancePaymentLink || false,
      maintenanceApi: (op as any).maintenanceApi || false,
    });
    setShowEditOperatorDialog(true);
  };

  const handleUpdateOperator = () => {
    if (!editingOperator) return;
    updateOperatorMutation.mutate({
      id: editingOperator.id,
      updates: {
        name: operatorForm.name,
        code: operatorForm.code,
        countryId: operatorForm.countryId,
        isActive: operatorForm.isActive,
        type: operatorForm.type,
        dailyLimit: operatorForm.dailyLimit,
        paymentGateway: operatorForm.paymentGateway,
        inMaintenance: operatorForm.inMaintenance,
        maintenanceDeposit: operatorForm.maintenanceDeposit,
        maintenanceWithdraw: operatorForm.maintenanceWithdraw,
        maintenancePaymentLink: operatorForm.maintenancePaymentLink,
        maintenanceApi: operatorForm.maintenanceApi,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Opérateurs par Pays</h1>
          <p className="text-muted-foreground">Configurez les opérateurs mobiles disponibles par pays</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCountryDialog(true)} data-testid="button-add-country">
            <Plus className="h-4 w-4 mr-1" /> Ajouter un pays
          </Button>
          <Button onClick={() => setShowOperatorDialog(true)} disabled={!countries?.length} data-testid="button-add-operator">
            <Plus className="h-4 w-4 mr-1" /> Ajouter un opérateur
          </Button>
        </div>
      </div>

      {loadingCountries || loadingOperators ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {countries?.map((country) => {
            const countryOperators = operatorsByCountry[country.id] || [];
            return (
              <Card key={country.id}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{({ BJ: "🇧🇯", BF: "🇧🇫", TG: "🇹🇬", CM: "🇨🇲", CI: "🇨🇮", CD: "🇨🇩", CG: "🇨🇬", SN: "🇸🇳", ML: "🇲🇱", GN: "🇬🇳", GA: "🇬🇦", MG: "🇲🇬" } as Record<string,string>)[country.code] || "🌍"}</span>
                    <CardTitle className="text-lg">{country.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleAllOperators(country.id, true)} data-testid={`button-activate-all-${country.id}`}>
                      Tout activer
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleAllOperators(country.id, false)} data-testid={`button-deactivate-all-${country.id}`}>
                      Tout désactiver
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {countryOperators.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Aucun opérateur configuré</p>
                  ) : (
                    <div className="space-y-2">
                      {countryOperators.map((op) => (
                        <div key={op.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{op.name}</span>
                            <Badge variant={op.paymentGateway === "soleaspay" ? "default" : op.paymentGateway === "maishapay" ? "outline" : op.paymentGateway === "omnipay" ? "outline" : "secondary"}>
                              {op.paymentGateway === "soleaspay" ? "SoleasPay" : op.paymentGateway === "winipayer" ? "WiniPayer" : op.paymentGateway === "maishapay" ? "MaishaPay" : op.paymentGateway === "omnipay" ? "OmniPay" : op.paymentGateway}
                            </Badge>
                            {op.inMaintenance && <Badge variant="destructive">Maintenance totale</Badge>}
                            {!op.inMaintenance && (op as any).maintenanceDeposit && <Badge variant="destructive" className="text-xs">🔴 Dépôts</Badge>}
                            {!op.inMaintenance && (op as any).maintenanceWithdraw && <Badge variant="destructive" className="text-xs">🔴 Retraits</Badge>}
                            {!op.inMaintenance && (op as any).maintenancePaymentLink && <Badge variant="destructive" className="text-xs">🔴 Liens</Badge>}
                            {!op.inMaintenance && (op as any).maintenanceApi && <Badge variant="destructive" className="text-xs">🔴 API</Badge>}
                            {!op.isActive && <Badge variant="secondary">Inactif</Badge>}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEditOperator(op)} data-testid={`button-edit-operator-${op.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteOperatorMutation.mutate(op.id)} data-testid={`button-delete-operator-${op.id}`}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Ajouter un opérateur</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={operatorForm.name} onChange={(e) => setOperatorForm({ ...operatorForm, name: e.target.value })} placeholder="Ex: MTN Mobile Money" data-testid="input-operator-name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={operatorForm.type} onValueChange={(v) => setOperatorForm({ ...operatorForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="bank">Banque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pays</Label>
                <Select value={operatorForm.countryId.toString()} onValueChange={(v) => setOperatorForm({ ...operatorForm, countryId: parseInt(v) })}>
                  <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>
                    {countries?.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={operatorForm.code} onChange={(e) => setOperatorForm({ ...operatorForm, code: e.target.value.toLowerCase() })} placeholder="mtn_bj" data-testid="input-operator-code" />
              </div>
              <div className="space-y-2">
                <Label>Limite journalière</Label>
                <Input value={operatorForm.dailyLimit} onChange={(e) => setOperatorForm({ ...operatorForm, dailyLimit: e.target.value })} placeholder="1000000" data-testid="input-operator-limit" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Passerelle de paiement</Label>
              <Select value={operatorForm.paymentGateway} onValueChange={(v) => setOperatorForm({ ...operatorForm, paymentGateway: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="soleaspay">SoleasPay</SelectItem>
                  <SelectItem value="winipayer">WiniPayer</SelectItem>
                  <SelectItem value="maishapay">MaishaPay</SelectItem>
                  <SelectItem value="omnipay">OmniPay</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">SoleasPay: USSD direct | WiniPayer: Redirection | MaishaPay: USSD direct (RDC, Congo, +) | OmniPay: CI (MTN, Moov, Orange, Wave)</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={operatorForm.isActive} onCheckedChange={(v) => setOperatorForm({ ...operatorForm, isActive: v })} data-testid="switch-operator-active" />
                <Label>Actif</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Maintenance (bloquer des pages)</Label>
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-2">
                  <Switch checked={operatorForm.inMaintenance} onCheckedChange={(v) => setOperatorForm({ ...operatorForm, inMaintenance: v })} data-testid="switch-operator-maintenance-all" />
                  <Label className="text-sm font-medium text-destructive">Toutes les pages</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={operatorForm.maintenanceDeposit} onCheckedChange={(v) => setOperatorForm({ ...operatorForm, maintenanceDeposit: v })} data-testid="switch-operator-maintenance-deposit" />
                  <Label className="text-sm">Dépôts</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={operatorForm.maintenanceWithdraw} onCheckedChange={(v) => setOperatorForm({ ...operatorForm, maintenanceWithdraw: v })} data-testid="switch-operator-maintenance-withdraw" />
                  <Label className="text-sm">Retraits</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={operatorForm.maintenancePaymentLink} onCheckedChange={(v) => setOperatorForm({ ...operatorForm, maintenancePaymentLink: v })} data-testid="switch-operator-maintenance-link" />
                  <Label className="text-sm">Liens de paiement</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={operatorForm.maintenanceApi} onCheckedChange={(v) => setOperatorForm({ ...operatorForm, maintenanceApi: v })} data-testid="switch-operator-maintenance-api" />
                  <Label className="text-sm">API paiement</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOperatorDialog(false)}>Annuler</Button>
            <Button onClick={() => createOperatorMutation.mutate(operatorForm)} data-testid="button-create-operator">Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditOperatorDialog} onOpenChange={(open) => { setShowEditOperatorDialog(open); if (!open) setEditingOperator(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Modifier l'opérateur</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={operatorForm.name} onChange={(e) => setOperatorForm({ ...operatorForm, name: e.target.value })} data-testid="input-edit-operator-name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={operatorForm.type} onValueChange={(v) => setOperatorForm({ ...operatorForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="bank">Banque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pays</Label>
                <Select value={operatorForm.countryId.toString()} onValueChange={(v) => setOperatorForm({ ...operatorForm, countryId: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {countries?.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Limite journalière</Label>
              <Input value={operatorForm.dailyLimit} onChange={(e) => setOperatorForm({ ...operatorForm, dailyLimit: e.target.value })} data-testid="input-edit-operator-limit" />
            </div>
            <div className="space-y-2">
              <Label>Passerelle de paiement</Label>
              <Select value={operatorForm.paymentGateway} onValueChange={(v) => setOperatorForm({ ...operatorForm, paymentGateway: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="soleaspay">SoleasPay</SelectItem>
                  <SelectItem value="winipayer">WiniPayer</SelectItem>
                  <SelectItem value="maishapay">MaishaPay</SelectItem>
                  <SelectItem value="omnipay">OmniPay</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">SoleasPay: USSD direct | WiniPayer: Redirection | MaishaPay: USSD direct (RDC, Congo, +) | OmniPay: CI (MTN, Moov, Orange, Wave)</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={operatorForm.isActive} onCheckedChange={(v) => setOperatorForm({ ...operatorForm, isActive: v })} data-testid="switch-edit-operator-active" />
                <Label>Actif</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Maintenance (bloquer des pages)</Label>
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-2">
                  <Switch checked={operatorForm.inMaintenance} onCheckedChange={(v) => setOperatorForm({ ...operatorForm, inMaintenance: v })} data-testid="switch-edit-operator-maintenance-all" />
                  <Label className="text-sm font-medium text-destructive">Toutes les pages</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={operatorForm.maintenanceDeposit} onCheckedChange={(v) => setOperatorForm({ ...operatorForm, maintenanceDeposit: v })} data-testid="switch-edit-operator-maintenance-deposit" />
                  <Label className="text-sm">Dépôts</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={operatorForm.maintenanceWithdraw} onCheckedChange={(v) => setOperatorForm({ ...operatorForm, maintenanceWithdraw: v })} data-testid="switch-edit-operator-maintenance-withdraw" />
                  <Label className="text-sm">Retraits</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={operatorForm.maintenancePaymentLink} onCheckedChange={(v) => setOperatorForm({ ...operatorForm, maintenancePaymentLink: v })} data-testid="switch-edit-operator-maintenance-link" />
                  <Label className="text-sm">Liens de paiement</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={operatorForm.maintenanceApi} onCheckedChange={(v) => setOperatorForm({ ...operatorForm, maintenanceApi: v })} data-testid="switch-edit-operator-maintenance-api" />
                  <Label className="text-sm">API paiement</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditOperatorDialog(false); setEditingOperator(null); }}>Annuler</Button>
            <Button onClick={handleUpdateOperator} data-testid="button-update-operator">Mettre à jour</Button>
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
          <div className="overflow-auto max-h-[500px]">
            <Table className="min-w-[900px]">
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="whitespace-nowrap min-w-[150px]">Date</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[150px]">Utilisateur</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[150px]">Action</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[350px]">Détails</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[120px]">IP</TableHead>
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
                    <TableCell className="whitespace-nowrap">{log.user?.fullName || "Système"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline">{actionLabels[log.action] || log.action}</Badge>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {log.details || "-"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {log.ipAddress || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
    if (location === "/admin/withdrawal-numbers") return <WithdrawalNumbersContent />;
    if (location === "/admin/countries") return <CountriesContent />;
    if (location === "/admin/payment-links") return <AdminPaymentLinksContent />;
    if (location === "/admin/partners") return <PartnersContent />;
    if (location === "/admin/logs") return <LogsContent />;
    return <DashboardContent />;
  };

  return <AdminLayout>{renderContent()}</AdminLayout>;
}
