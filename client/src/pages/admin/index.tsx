import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ADMIN_PATH } from "@/lib/admin-path";
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
  ArrowLeftRight,
  TrendingUp,
  Shield,
  Key,
  Percent,
  CheckCircle,
  XCircle,
  Clock,
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
  Loader2,
  CheckCircle2,
  Sparkles,
  Send,
  Eye,
  EyeOff,
  Code2,
  Zap,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  ImageOff,
  FileImage,
  SquareCheck,
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
  WalletExchange,
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
  totalExchangeCommissions?: string;
  pendingExchangeCommissions?: string;
  totalExchangesCount?: number;
  pendingExchangesCount?: number;
  walletExchangeRate?: string;
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
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const { data: platformBalance } = useQuery<PlatformBalance>({
    queryKey: ["/api/admin/platform-balance"],
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
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
    { title: "Commissions Échanges", value: formatCurrency(stats?.totalExchangeCommissions || 0), description: `${stats?.totalExchangesCount || 0} échanges • Taux: ${stats?.walletExchangeRate || 4}%`, icon: ArrowLeftRight, color: "text-violet-500", bgColor: "bg-violet-100 dark:bg-violet-900/30" },
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
  const [showApiPermDialog, setShowApiPermDialog] = useState(false);
  const [apiPermForm, setApiPermForm] = useState({ apiSdkEnabled: false, apiRedirectEnabled: false });
  const [showFeesDialog, setShowFeesDialog] = useState(false);
  const [feesForm, setFeesForm] = useState({
    customDepositFeeRate: "",
    customWithdrawalFeeRate: "",
    customApiPaymentFeeRate: "",
    customApiSdkFeeRate: "",
    customPersonalFeeRate: "",
  });
  const [balanceForm, setBalanceForm] = useState({ amount: "", operation: "add", reason: "", walletId: "" });
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

  const emergencyKillMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/emergency-kill`);
      return res as { message: string; actions: string[] };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "🚨 Compte neutralisé",
        description: (
          <div className="text-xs space-y-1 mt-1">
            {data.actions?.map((a: string, i: number) => (
              <div key={i}>{a}</div>
            ))}
          </div>
        ),
        duration: 8000,
      });
    },
    onError: () => toast({ title: "Erreur", description: "Emergency kill échoué", variant: "destructive" }),
  });

  const { data: selectedUserWallets } = useQuery<{ id: number; countryCode: string; countryName: string; currency: string; balance: string }[]>({
    queryKey: ["/api/admin/users", selectedUser?.id, "wallets"],
    queryFn: async () => {
      if (!selectedUser) return [];
      const res = await fetch(`/api/admin/users/${selectedUser.id}/wallets`);
      return res.json();
    },
    enabled: !!selectedUser && showBalanceDialog,
  });

  const modifyBalanceMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: typeof balanceForm }) => {
      await apiRequest("POST", `/api/admin/users/${userId}/modify-balance`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Succès", description: "Solde modifié avec succès" });
      setShowBalanceDialog(false);
      setBalanceForm({ amount: "", operation: "add", reason: "", walletId: "" });
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

  const apiPermMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: typeof apiPermForm }) => {
      const res = await apiRequest("PUT", `/api/admin/users/${userId}/api-permissions`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Succès", description: "Permissions API mises à jour" });
      setShowApiPermDialog(false);
      setSelectedUser(null);
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message || "Échec de la mise à jour", variant: "destructive" });
    },
  });

  const feesMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: typeof feesForm }) => {
      const res = await apiRequest("PUT", `/api/admin/users/${userId}/custom-fees`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Succès", description: "Frais personnalisés enregistrés" });
      setShowFeesDialog(false);
      setSelectedUser(null);
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message || "Échec de la mise à jour", variant: "destructive" });
    },
  });

  const openFeesDialog = (user: UserType) => {
    setSelectedUser(user);
    const u = user as any;
    setFeesForm({
      customDepositFeeRate: u.customDepositFeeRate != null ? String(u.customDepositFeeRate) : "",
      customWithdrawalFeeRate: u.customWithdrawalFeeRate != null ? String(u.customWithdrawalFeeRate) : "",
      customApiPaymentFeeRate: u.customApiPaymentFeeRate != null ? String(u.customApiPaymentFeeRate) : "",
      customApiSdkFeeRate: u.customApiSdkFeeRate != null ? String(u.customApiSdkFeeRate) : "",
      customPersonalFeeRate: u.customPersonalFeeRate != null ? String(u.customPersonalFeeRate) : "",
    });
    setShowFeesDialog(true);
  };

  const openApiPermDialog = (user: UserType) => {
    setSelectedUser(user);
    setApiPermForm({
      apiSdkEnabled: !!(user as any).apiSdkEnabled,
      apiRedirectEnabled: !!(user as any).apiRedirectEnabled,
    });
    setShowApiPermDialog(true);
  };

  const openPasswordDialog = (user: UserType) => {
    setSelectedUser(user);
    setNewPassword("");
    setShowPasswordDialog(true);
  };

  const openBalanceDialog = (user: UserType) => {
    setSelectedUser(user);
    setBalanceForm({ amount: "", operation: "add", reason: "", walletId: "" });
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
                          onClick={() => {
                            if (confirm(`🚨 EMERGENCY KILL\n\nCela va immédiatement :\n• Bloquer le compte\n• Détruire TOUTES les sessions actives\n• Désactiver TOUTES les clés API\n• Blacklister le téléphone\n\nUtilisateur : ${user.email}\n\nConfirmer ?`)) {
                              emergencyKillMutation.mutate(user.id);
                            }
                          }}
                          disabled={user.role === "admin" || emergencyKillMutation.isPending}
                          title="🚨 Emergency Kill — Neutraliser immédiatement"
                          data-testid={`button-emergency-kill-${user.id}`}
                          className="hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <ShieldAlert className="h-4 w-4 text-red-600" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openFeesDialog(user)}
                          title="Frais personnalisés"
                          data-testid={`button-fees-${user.id}`}
                        >
                          <Percent className={`h-4 w-4 ${(user as any).customDepositFeeRate != null || (user as any).customWithdrawalFeeRate != null ? "text-orange-500" : "text-muted-foreground"}`} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openApiPermDialog(user)}
                          title="Permissions API"
                          data-testid={`button-api-perm-${user.id}`}
                        >
                          <Code2 className={`h-4 w-4 ${(user as any).apiSdkEnabled || (user as any).apiRedirectEnabled ? "text-purple-600" : "text-muted-foreground"}`} />
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
              <Label>Portefeuille cible</Label>
              <Select value={balanceForm.walletId} onValueChange={(v) => setBalanceForm({ ...balanceForm, walletId: v })}>
                <SelectTrigger data-testid="select-wallet-target">
                  <SelectValue placeholder="Sélectionner un portefeuille" />
                </SelectTrigger>
                <SelectContent>
                  {(selectedUserWallets || []).map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.countryName} ({w.currency}) — Solde: {parseFloat(w.balance).toLocaleString("fr-FR")} {w.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!selectedUserWallets || selectedUserWallets.length === 0) && (
                <p className="text-xs text-muted-foreground">Aucun portefeuille trouvé pour cet utilisateur.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Montant</Label>
              <Input
                type="number"
                value={balanceForm.amount}
                onChange={(e) => setBalanceForm({ ...balanceForm, amount: e.target.value })}
                placeholder="1000"
                data-testid="input-balance-amount"
              />
            </div>
            <div className="space-y-2">
              <Label>Raison (obligatoire)</Label>
              <Textarea
                value={balanceForm.reason}
                onChange={(e) => setBalanceForm({ ...balanceForm, reason: e.target.value })}
                placeholder="Ex: Remboursement suite à réclamation"
                data-testid="input-balance-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBalanceDialog(false)}>Annuler</Button>
            <Button
              data-testid="button-confirm-balance"
              onClick={() => selectedUser && modifyBalanceMutation.mutate({ userId: selectedUser.id, data: balanceForm })}
              disabled={!balanceForm.amount || !balanceForm.reason || !balanceForm.walletId || modifyBalanceMutation.isPending}
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

      {/* Custom Fees Dialog */}
      <Dialog open={showFeesDialog} onOpenChange={setShowFeesDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-orange-500" />
              Frais personnalisés
            </DialogTitle>
            <DialogDescription>
              {selectedUser && `Définir des frais spécifiques pour ${selectedUser.fullName}. Laisser vide pour utiliser les frais globaux.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-200">
              <strong>Priorité :</strong> Frais utilisateur &gt; Frais pays &gt; Frais globaux. Laisser un champ vide pour hériter des frais supérieurs.
            </div>
            {[
              { key: "customDepositFeeRate", label: "Dépôt", desc: "Frais sur les dépôts Mobile Money", icon: "↓", color: "text-green-600" },
              { key: "customWithdrawalFeeRate", label: "Retrait", desc: "Frais sur les retraits Mobile Money", icon: "↑", color: "text-red-600" },
              { key: "customApiPaymentFeeRate", label: "API / Liens de paiement", desc: "Frais sur les paiements reçus (lien + API redirect)", icon: "🔗", color: "text-blue-600" },
              { key: "customApiSdkFeeRate", label: "API SDK", desc: "Frais sur les retraits automatiques SDK (défaut 1%)", icon: "⚡", color: "text-purple-600" },
              { key: "customPersonalFeeRate", label: "Personnel", desc: "Frais sur les transactions personnelles", icon: "👤", color: "text-gray-600" },
            ].map(({ key, label, desc, icon, color }) => (
              <div key={key} className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${color}`}>{icon}</span>
                    <Label className="text-sm font-medium">{label}</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <div className="relative w-28">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    placeholder="Défaut"
                    value={feesForm[key as keyof typeof feesForm]}
                    onChange={(e) => setFeesForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="pr-6 text-sm"
                    data-testid={`input-fee-${key}`}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                </div>
              </div>
            ))}
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
              <strong>Effacer un frais :</strong> Supprimer la valeur et enregistrer pour revenir aux frais globaux.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeesDialog(false)}>Annuler</Button>
            <Button
              onClick={() => selectedUser && feesMutation.mutate({ userId: selectedUser.id, data: feesForm })}
              disabled={feesMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              data-testid="button-confirm-fees"
            >
              {feesMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Percent className="h-4 w-4 mr-2" />
              )}
              Enregistrer les frais
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Permissions Dialog */}
      <Dialog open={showApiPermDialog} onOpenChange={setShowApiPermDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-purple-600" />
              Permissions API
            </DialogTitle>
            <DialogDescription>
              {selectedUser && `Activer ou désactiver les types d'API pour ${selectedUser.fullName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Code2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">API SDK</p>
                  <p className="text-xs text-muted-foreground">Paiements, retraits automatiques, webhooks</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApiPermForm((f) => ({ ...f, apiSdkEnabled: !f.apiSdkEnabled }))}
                className="flex-shrink-0"
                data-testid="toggle-sdk-enabled"
              >
                {apiPermForm.apiSdkEnabled
                  ? <ToggleRight className="h-8 w-8 text-purple-600" />
                  : <ToggleLeft className="h-8 w-8 text-muted-foreground" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">API Redirection</p>
                  <p className="text-xs text-muted-foreground">Liens de paiement avec redirection</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApiPermForm((f) => ({ ...f, apiRedirectEnabled: !f.apiRedirectEnabled }))}
                className="flex-shrink-0"
                data-testid="toggle-redirect-enabled"
              >
                {apiPermForm.apiRedirectEnabled
                  ? <ToggleRight className="h-8 w-8 text-blue-600" />
                  : <ToggleLeft className="h-8 w-8 text-muted-foreground" />}
              </button>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200">
              <strong>Note :</strong> L'utilisateur doit également avoir un compte vérifié pour accéder à l'API.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApiPermDialog(false)}>Annuler</Button>
            <Button
              onClick={() => selectedUser && apiPermMutation.mutate({ userId: selectedUser.id, data: apiPermForm })}
              disabled={apiPermMutation.isPending}
              data-testid="button-confirm-api-perm"
            >
              {apiPermMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Code2 className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface PaymentAttempt {
  id: string;
  _table?: string;
  reference: string;
  externalReference?: string | null;
  source: string;
  sourceLabel: string;
  status: string;
  amount: string;
  fee?: string | null;
  currency: string;
  userId?: number | null;
  userName?: string | null;
  userEmail?: string | null;
  payerName?: string | null;
  payerPhone?: string | null;
  payerEmail?: string | null;
  payerCountry?: string | null;
  paymentMethod?: string | null;
  description?: string | null;
  errorInfo?: string | null;
  gatewayProvider?: string | null;
  metadata?: Record<string, any> | null;
  partnerName?: string | null;
  webhookUrl?: string | null;
  webhookSent?: boolean | null;
  webhookAttempts?: number;
  ipAddress?: string | null;
  completedAt?: string | null;
  updatedAt?: string | null;
  createdAt: string;
}

function TransactionsContent() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"confirmed" | "attempts">("confirmed");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showHighValueOnly, setShowHighValueOnly] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [txNote, setTxNote] = useState("");
  const [txNoteSaved, setTxNoteSaved] = useState(false);
  const [attemptSearch, setAttemptSearch] = useState("");
  const [attemptStatusFilter, setAttemptStatusFilter] = useState("all");
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [sdkActionRef, setSdkActionRef] = useState<string | null>(null);
  const [selectedAttemptDetail, setSelectedAttemptDetail] = useState<PaymentAttempt | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ attempt: PaymentAttempt; action: "complete" | "failed" | "pending" } | null>(null);

  const copyRef = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(text);
    setTimeout(() => setCopiedRef(null), 1500);
  };

  const forceCompleteSdkMutation = useMutation({
    mutationFn: async (reference: string) => {
      const res = await apiRequest("POST", `/api/admin/sdk-transactions/${reference}/force-complete`, {});
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Erreur"); }
      return res.json();
    },
    onSuccess: (data) => {
      setSdkActionRef(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-attempts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      toast({ title: "✅ Transaction complétée", description: data.message });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const resendWebhookSdkMutation = useMutation({
    mutationFn: async (reference: string) => {
      const res = await apiRequest("POST", `/api/admin/sdk-transactions/${reference}/resend-webhook`, {});
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Erreur"); }
      return res.json();
    },
    onSuccess: (data) => {
      setSdkActionRef(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-attempts"] });
      toast({ title: "📡 Webhook renvoyé", description: data.message });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const rejectSdkMutation = useMutation({
    mutationFn: async (reference: string) => {
      const res = await apiRequest("POST", `/api/admin/sdk-transactions/${reference}/force-reject`, {});
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Erreur"); }
      return res.json();
    },
    onSuccess: (data) => {
      setSdkActionRef(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-attempts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      toast({ title: "❌ Transaction rejetée", description: data.message });
    },
    onError: (e: any) => { setSdkActionRef(null); toast({ title: "Erreur", description: e.message, variant: "destructive" }); },
  });

  const checkGatewayStatusMutation = useMutation({
    mutationFn: async (reference: string) => {
      const res = await apiRequest("POST", `/api/admin/sdk-transactions/${reference}/check-gateway-status`, {});
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Erreur"); }
      return res.json();
    },
    onSuccess: (data, reference) => {
      setSdkActionRef(null);
      const statusLabel: Record<string, string> = { success: "✅ Succès", pending: "⏳ En attente", failed: "❌ Échoué", unknown: "❓ Inconnu" };
      const gwLabel = statusLabel[data.gatewayStatus] || data.gatewayStatus || "—";
      const syncLabel = data.synced === true ? " (synchronisé)" : data.synced === false ? " ⚠️ désync avec la DB" : "";
      toast({
        title: `🔍 Statut ${data.gateway || "Passerelle"} : ${gwLabel}${syncLabel}`,
        description: data.transactionId ? `ID transaction: ${data.transactionId}` : data.message || `Ref: ${reference}`,
        duration: 8000,
      });
      if (data.synced === false) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-attempts"] });
      }
    },
    onError: (e: any) => { setSdkActionRef(null); toast({ title: "Erreur vérification", description: e.message, variant: "destructive" }); },
  });

  const { data: attempts = [], isLoading: attemptsLoading } = useQuery<PaymentAttempt[]>({
    queryKey: ["/api/admin/payment-attempts"],
    enabled: activeTab === "attempts",
  });

  const setAttemptStatusMutation = useMutation({
    mutationFn: async ({ reference, action }: { reference: string; action: "complete" | "failed" | "pending" }) => {
      const res = await apiRequest("POST", `/api/admin/payment-attempts/${encodeURIComponent(reference)}/set-status`, { action });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Erreur"); }
      return res.json();
    },
    onSuccess: (data) => {
      setConfirmAction(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-attempts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      toast({ title: "✅ Mise à jour effectuée", description: data.message });
    },
    onError: (e: any) => { setConfirmAction(null); toast({ title: "Erreur", description: e.message, variant: "destructive" }); },
  });

  const saveNoteMutation = useMutation({
    mutationFn: async ({ id, note }: { id: number; note: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/transactions/${id}/note`, { adminNote: note });
      return res.json();
    },
    onSuccess: (updated) => {
      setSelectedTransaction(updated);
      setTxNoteSaved(true);
      setTimeout(() => setTxNoteSaved(false), 2500);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
    },
  });

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

  const filteredAttempts = useMemo(() => {
    return attempts.filter(a => {
      const q = attemptSearch.toLowerCase();
      const matchesSearch = !q ||
        a.reference?.toLowerCase().includes(q) ||
        a.userName?.toLowerCase().includes(q) ||
        a.payerName?.toLowerCase().includes(q) ||
        a.payerPhone?.includes(q) ||
        a.userId?.toString().includes(q) ||
        a.partnerName?.toLowerCase().includes(q) ||
        a.paymentMethod?.toLowerCase().includes(q);
      const matchesStatus = attemptStatusFilter === "all" || a.status === attemptStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [attempts, attemptSearch, attemptStatusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">
            {activeTab === "confirmed"
              ? `Transactions confirmées (${transactions?.length || 0})`
              : `Toutes les tentatives (${attempts.length})`}
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === "confirmed" && highValueCount > 0 && (
            <Button
              variant={showHighValueOnly ? "default" : "outline"}
              onClick={() => setShowHighValueOnly(!showHighValueOnly)}
              className="gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              {highValueCount} transactions &gt;60k
            </Button>
          )}
          {activeTab === "confirmed" && (
            <Button variant="outline" onClick={exportCSV} disabled={!filteredTransactions?.length}>
              <Download className="h-4 w-4 mr-2" /> Exporter CSV
            </Button>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        <Button
          variant={activeTab === "confirmed" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("confirmed")}
          data-testid="tab-confirmed-transactions"
        >
          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
          Confirmées
        </Button>
        <Button
          variant={activeTab === "attempts" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("attempts")}
          data-testid="tab-payment-attempts"
        >
          <Clock className="h-3.5 w-3.5 mr-1.5" />
          Toutes les tentatives
          {attempts.length > 0 && (
            <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">{attempts.length}</Badge>
          )}
        </Button>
      </div>

      {/* ── TENTATIVES VIEW ───────────────────────────────────────── */}
      {activeTab === "attempts" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Référence, utilisateur, téléphone, partenaire…"
                    value={attemptSearch}
                    onChange={e => setAttemptSearch(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-attempts"
                  />
                </div>
                <Select value={attemptStatusFilter} onValueChange={setAttemptStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="processing">En cours</SelectItem>
                    <SelectItem value="completed">Complété</SelectItem>
                    <SelectItem value="failed">Échoué</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {attemptsLoading ? (
                <div className="space-y-2 p-4">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : filteredAttempts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>Aucune tentative trouvée</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/30">
                      <tr>
                        <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Source</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Référence</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Montant</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Utilisateur / Payeur</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Méthode</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Statut</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Info / Webhook</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredAttempts.map(a => {
                        const isSdk = a._table === "sdk";
                        const isStuck = isSdk && (a.status === "processing" || a.status === "pending");
                        const canResend = isSdk && a.status === "completed" && !!a.webhookUrl;
                        const isActing = sdkActionRef === a.reference && (forceCompleteSdkMutation.isPending || resendWebhookSdkMutation.isPending || rejectSdkMutation.isPending || checkGatewayStatusMutation.isPending);
                        return (
                        <tr key={a.id} className={`hover:bg-muted/30 transition-colors ${isStuck ? "bg-orange-50/40 dark:bg-orange-900/10" : ""}`} data-testid={`row-attempt-${a.id}`}>
                          <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">{formatDate(a.createdAt)}</td>
                          <td className="p-3">
                            <Badge variant="outline" className={`text-xs whitespace-nowrap ${isSdk ? "border-purple-300 text-purple-700 dark:text-purple-400" : ""}`}>
                              {a.sourceLabel}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs truncate max-w-[160px]" title={a.reference}>{a.reference}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5 shrink-0"
                                onClick={() => copyRef(a.reference)}
                                title="Copier la référence"
                                data-testid={`button-copy-attempt-ref-${a.id}`}
                              >
                                {copiedRef === a.reference
                                  ? <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  : <Copy className="h-3 w-3" />}
                              </Button>
                            </div>
                          </td>
                          <td className="p-3 font-semibold whitespace-nowrap">
                            {parseFloat(a.amount).toLocaleString()} {a.currency}
                          </td>
                          <td className="p-3">
                            <div className="text-xs">
                              {a.userName ? (
                                <span className="font-medium">{a.userName}</span>
                              ) : a.payerName ? (
                                <span>{a.payerName}</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                              {a.userId && <span className="text-muted-foreground ml-1">(ID {a.userId})</span>}
                              {a.payerPhone && <div className="text-muted-foreground font-mono">{a.payerPhone}</div>}
                            </div>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">{a.paymentMethod || "—"}</td>
                          <td className="p-3">
                            <Badge className={
                              a.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                              a.status === "failed" || a.status === "cancelled" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                              a.status === "processing" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                              "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }>
                              {a.status === "pending" ? "En attente" :
                               a.status === "processing" ? "En cours" :
                               a.status === "completed" ? "Complété" :
                               a.status === "failed" ? "Échoué" :
                               a.status === "cancelled" ? "Annulé" : a.status}
                            </Badge>
                          </td>
                          <td className="p-3 max-w-[180px]">
                            {a.errorInfo ? (
                              <span className="text-xs text-red-600 dark:text-red-400 truncate block" title={a.errorInfo}>
                                {a.errorInfo}
                              </span>
                            ) : isSdk && a.webhookUrl ? (
                              <div className="text-xs space-y-0.5">
                                <div className={`font-medium ${a.webhookSent ? "text-green-600" : "text-orange-500"}`}>
                                  Webhook: {a.webhookSent ? "✓ envoyé" : `✗ non envoyé${a.webhookAttempts ? ` (${a.webhookAttempts} essai${a.webhookAttempts > 1 ? "s" : ""})` : ""}`}
                                </div>
                                <div className="text-muted-foreground truncate max-w-[160px]" title={a.webhookUrl}>
                                  {a.webhookUrl}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              {/* ── Boutons SDK ── */}
                              {isSdk && isStuck && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs border-green-400 text-green-700 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20 whitespace-nowrap"
                                    disabled={isActing}
                                    onClick={() => { setSdkActionRef(a.reference); forceCompleteSdkMutation.mutate(a.reference); }}
                                    data-testid={`button-force-complete-sdk-${a.id}`}
                                    title="Approuver : crédite le wallet du marchand et envoie le webhook payment.completed"
                                  >
                                    {isActing && forceCompleteSdkMutation.isPending ? "…" : "✅ Approuver"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20 whitespace-nowrap"
                                    disabled={isActing}
                                    onClick={() => { setSdkActionRef(a.reference); rejectSdkMutation.mutate(a.reference); }}
                                    data-testid={`button-reject-sdk-${a.id}`}
                                    title="Rejeter : rembourse le wallet du marchand et envoie le webhook payment.failed"
                                  >
                                    {isActing && rejectSdkMutation.isPending ? "…" : "❌ Rejeter"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs border-blue-300 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/20 whitespace-nowrap"
                                    disabled={isActing}
                                    onClick={() => { setSdkActionRef(a.reference); checkGatewayStatusMutation.mutate(a.reference); }}
                                    data-testid={`button-check-status-sdk-${a.id}`}
                                    title="Vérifier le statut réel auprès du fournisseur de paiement (PayDunya, etc.)"
                                  >
                                    {isActing && checkGatewayStatusMutation.isPending ? "…" : "🔍 Vérifier"}
                                  </Button>
                                </>
                              )}
                              {isSdk && canResend && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/20 whitespace-nowrap"
                                  disabled={isActing}
                                  onClick={() => { setSdkActionRef(a.reference); resendWebhookSdkMutation.mutate(a.reference); }}
                                  data-testid={`button-resend-webhook-sdk-${a.id}`}
                                  title="Renvoyer le webhook payment.completed au marchand"
                                >
                                  {isActing && resendWebhookSdkMutation.isPending ? "…" : "📡 Webhook"}
                                </Button>
                              )}
                              {/* ── Boutons non-SDK (dépôt / lien de paiement) ── */}
                              {!isSdk && (a.status === "pending" || a.status === "processing") && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs border-green-400 text-green-700 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20 whitespace-nowrap"
                                    onClick={() => setConfirmAction({ attempt: a, action: "complete" })}
                                    data-testid={`button-validate-attempt-${a.id}`}
                                    title="Valider : crédite le wallet du vendeur"
                                  >
                                    ✅ Valider
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20 whitespace-nowrap"
                                    onClick={() => setConfirmAction({ attempt: a, action: "failed" })}
                                    data-testid={`button-reject-attempt-${a.id}`}
                                    title="Rejeter : marquer comme échoué"
                                  >
                                    ❌ Rejeter
                                  </Button>
                                </>
                              )}
                              {!isSdk && (a.status === "failed" || a.status === "cancelled") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs border-yellow-400 text-yellow-700 hover:bg-yellow-50 dark:text-yellow-400 dark:border-yellow-700 dark:hover:bg-yellow-900/20 whitespace-nowrap"
                                  onClick={() => setConfirmAction({ attempt: a, action: "pending" })}
                                  data-testid={`button-reset-attempt-${a.id}`}
                                  title="Remettre en attente"
                                >
                                  🔄 Réinitialiser
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-muted-foreground hover:text-foreground whitespace-nowrap"
                                onClick={() => setSelectedAttemptDetail(a)}
                                data-testid={`button-detail-attempt-${a.id}`}
                                title="Voir les détails de cette transaction"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Détails
                              </Button>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── MODALE DÉTAILS TENTATIVE DE TRANSACTION ───────────────── */}
      <Dialog open={!!selectedAttemptDetail} onOpenChange={(open) => { if (!open) setSelectedAttemptDetail(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Détails de la transaction
            </DialogTitle>
            <DialogDescription className="font-mono text-xs break-all">
              {selectedAttemptDetail?.reference}
            </DialogDescription>
          </DialogHeader>

          {selectedAttemptDetail && (() => {
            const a = selectedAttemptDetail;
            const isFailed = a.status === "failed" || a.status === "cancelled";
            const meta = a.metadata || {};

            // Classifier la source de l'erreur
            const failureReason = a.errorInfo || meta.failure_reason || meta.error || null;
            const isClientError = failureReason && (
              /solde insuffisant|insufficient|balance|fonds|fund|invalid.*account|compte.*invalide|incorrect|wrong.*pin|pin.*wrong|mauvais/i.test(failureReason)
            );
            const isSendavaPayError = failureReason && (
              /timeout|exception|internal|server error|unavailable|connexion|network/i.test(failureReason)
            );
            const errorSource = isClientError
              ? "merchant"
              : isSendavaPayError
              ? "sendavapay"
              : failureReason ? "gateway" : null;

            return (
              <div className="space-y-4 mt-2">

                {/* Statut + classification erreur */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={
                    a.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    isFailed ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                    a.status === "processing" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }>
                    {a.status === "pending" ? "⏳ En attente" :
                     a.status === "processing" ? "🔄 En cours" :
                     a.status === "completed" ? "✅ Complété" :
                     a.status === "failed" ? "❌ Échoué" :
                     a.status === "cancelled" ? "🚫 Annulé" : a.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{a.sourceLabel}</Badge>
                  {a.gatewayProvider && (
                    <Badge variant="outline" className="text-xs text-purple-700 border-purple-300">
                      via {a.gatewayProvider}
                    </Badge>
                  )}
                </div>

                {/* Bloc erreur avec classification */}
                {isFailed && (
                  <div className={`rounded-lg border p-3 space-y-2 ${
                    errorSource === "merchant"
                      ? "bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800"
                      : errorSource === "sendavapay"
                      ? "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800"
                      : "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800"
                  }`}>
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>
                        {errorSource === "merchant"
                          ? "⚠️ Erreur côté client/marchand"
                          : errorSource === "sendavapay"
                          ? "🔴 Erreur interne SendavaPay"
                          : "❌ Erreur de paiement"}
                      </span>
                    </div>
                    {failureReason ? (
                      <p className="text-sm font-mono bg-white/60 dark:bg-black/20 rounded px-2 py-1 break-all">
                        {failureReason}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Aucun message d'erreur enregistré</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {errorSource === "merchant"
                        ? "Le paiement a échoué à cause d'un problème du côté du payeur (solde insuffisant, mauvais PIN, compte invalide...). SendavaPay n'est pas en cause."
                        : errorSource === "sendavapay"
                        ? "Le paiement a échoué à cause d'un problème interne ou réseau. À investiguer côté SendavaPay."
                        : "Le paiement a été refusé par la passerelle de paiement."}
                    </p>
                  </div>
                )}

                {/* Infos transaction */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Montant</p>
                    <p className="font-semibold">{parseFloat(a.amount).toLocaleString()} {a.currency}</p>
                    {a.fee && parseFloat(a.fee) > 0 && (
                      <p className="text-xs text-muted-foreground">Frais : {parseFloat(a.fee).toLocaleString()} {a.currency}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Méthode</p>
                    <p>{a.paymentMethod || <span className="text-muted-foreground">—</span>}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Compte marchand</p>
                    <p>{a.userName || <span className="text-muted-foreground">—</span>}</p>
                    {a.userEmail && <p className="text-xs text-muted-foreground">{a.userEmail}</p>}
                    {a.userId && <p className="text-xs text-muted-foreground">ID {a.userId}</p>}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payeur</p>
                    <p>{a.payerName || <span className="text-muted-foreground">—</span>}</p>
                    {a.payerPhone && <p className="text-xs font-mono text-muted-foreground">{a.payerPhone}</p>}
                    {a.payerEmail && <p className="text-xs text-muted-foreground">{a.payerEmail}</p>}
                  </div>
                  {a.description && (
                    <div className="col-span-2 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</p>
                      <p className="text-muted-foreground">{a.description}</p>
                    </div>
                  )}
                  {a.partnerName && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Partenaire</p>
                      <p>{a.partnerName}</p>
                    </div>
                  )}
                </div>

                {/* Références */}
                <div className="space-y-2 bg-muted/30 rounded-lg p-3 text-xs font-mono">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground shrink-0">Réf. interne :</span>
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="truncate">{a.reference}</span>
                      <Button size="icon" variant="ghost" className="h-5 w-5 shrink-0" onClick={() => copyRef(a.reference)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {a.externalReference && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground shrink-0">Réf. gateway :</span>
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="truncate">{a.externalReference}</span>
                        <Button size="icon" variant="ghost" className="h-5 w-5 shrink-0" onClick={() => copyRef(a.externalReference!)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {a.ipAddress && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground shrink-0">IP :</span>
                      <span>{a.ipAddress}</span>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div className="space-y-1 text-xs">
                  <p className="font-medium text-muted-foreground uppercase tracking-wide">Chronologie</p>
                  <div className="space-y-1 border-l-2 border-muted pl-3">
                    <div className="flex gap-2">
                      <span className="text-muted-foreground shrink-0">Créée :</span>
                      <span>{new Date(a.createdAt).toLocaleString("fr-FR")}</span>
                    </div>
                    {a.updatedAt && a.updatedAt !== a.createdAt && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground shrink-0">Mise à jour :</span>
                        <span>{new Date(a.updatedAt).toLocaleString("fr-FR")}</span>
                      </div>
                    )}
                    {a.completedAt && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground shrink-0">Complétée :</span>
                        <span>{new Date(a.completedAt).toLocaleString("fr-FR")}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Webhook */}
                {a.webhookUrl && (
                  <div className="space-y-1 text-xs">
                    <p className="font-medium text-muted-foreground uppercase tracking-wide">Webhook marchand</p>
                    <div className="bg-muted/30 rounded p-2 space-y-1">
                      <p className="font-mono break-all">{a.webhookUrl}</p>
                      <p className={a.webhookSent ? "text-green-600" : "text-orange-500"}>
                        {a.webhookSent ? `✓ Envoyé` : `✗ Non envoyé`}
                        {(a.webhookAttempts ?? 0) > 0 && ` (${a.webhookAttempts} tentative${(a.webhookAttempts ?? 0) > 1 ? "s" : ""})`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Métadonnées brutes (debug) */}
                {Object.keys(meta).length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">
                      Données gateway brutes (debug)
                    </summary>
                    <pre className="mt-2 bg-muted/40 rounded p-2 overflow-x-auto text-[10px] leading-relaxed whitespace-pre-wrap break-all">
                      {JSON.stringify(meta, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            );
          })()}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAttemptDetail(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOGUE CONFIRMATION ACTION SUR TENTATIVE ───────────── */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.action === "complete" && "✅ Valider ce paiement ?"}
              {confirmAction?.action === "failed"   && "❌ Rejeter ce paiement ?"}
              {confirmAction?.action === "pending"  && "🔄 Remettre en attente ?"}
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-2">
              <div className="font-mono text-xs text-muted-foreground break-all">{confirmAction?.attempt.reference}</div>
              {confirmAction?.action === "complete" && (
                <p>
                  Le montant de <strong>{parseFloat(confirmAction.attempt.amount).toLocaleString()} {confirmAction.attempt.currency}</strong> sera
                  crédité sur le wallet de l&apos;utilisateur (après frais). Cette action est irréversible.
                </p>
              )}
              {confirmAction?.action === "failed" && (
                <p>Ce paiement sera marqué comme <strong>échoué</strong>. Aucun wallet ne sera crédité.</p>
              )}
              {confirmAction?.action === "pending" && (
                <p>Ce paiement sera remis en statut <strong>en attente</strong>. Aucun crédit ne sera effectué.</p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={setAttemptStatusMutation.isPending}>
              Annuler
            </Button>
            <Button
              variant={confirmAction?.action === "complete" ? "default" : confirmAction?.action === "failed" ? "destructive" : "outline"}
              disabled={setAttemptStatusMutation.isPending}
              onClick={() => confirmAction && setAttemptStatusMutation.mutate({ reference: confirmAction.attempt.reference, action: confirmAction.action })}
              data-testid="button-confirm-action-attempt"
            >
              {setAttemptStatusMutation.isPending ? "En cours…" :
                confirmAction?.action === "complete" ? "Confirmer et créditer" :
                confirmAction?.action === "failed"   ? "Confirmer le rejet" :
                "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CONFIRMED TRANSACTIONS VIEW (existing) ───────────────── */}
      {activeTab === "confirmed" && (
      <>
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
                        <div className="flex items-center gap-1">
                          {tx.adminNote && (
                            <span title={tx.adminNote} className="text-yellow-500">
                              <StickyNote className="h-3.5 w-3.5" />
                            </span>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => { setSelectedTransaction(tx); setTxNote(tx.adminNote || ""); }} title="Voir détails" data-testid={`button-view-transaction-${tx.id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedTransaction} onOpenChange={(open) => { if (!open) { setSelectedTransaction(null); setTxNote(""); setTxNoteSaved(false); } }}>
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
                  <div className="flex items-center gap-1.5">
                    <p className="font-mono font-medium">{selectedTransaction.id}</p>
                    <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => { navigator.clipboard.writeText(String(selectedTransaction.id)); }} title="Copier l'ID" data-testid="button-copy-tx-id">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
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
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <p className="font-mono">{selectedTransaction.mobileNumber || "-"}</p>
                      {selectedTransaction.mobileNumber && (
                        <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => navigator.clipboard.writeText(selectedTransaction.mobileNumber!)} title="Copier" data-testid="button-copy-tx-phone">
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Référence externe</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-mono text-sm break-all">{selectedTransaction.externalRef || "-"}</p>
                      {selectedTransaction.externalRef && (
                        <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => navigator.clipboard.writeText(selectedTransaction.externalRef!)} title="Copier la référence" data-testid="button-copy-tx-extref">
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
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

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Note administrative
                </h4>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Ajouter une note interne sur cette transaction (visible uniquement par les admins)…"
                    value={txNote}
                    onChange={(e) => setTxNote(e.target.value)}
                    rows={3}
                    className="resize-none text-sm"
                    data-testid="textarea-tx-admin-note"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => saveNoteMutation.mutate({ id: selectedTransaction.id, note: txNote })}
                      disabled={saveNoteMutation.isPending}
                      data-testid="button-save-tx-note"
                    >
                      {saveNoteMutation.isPending ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Sauvegarde…</> : "Sauvegarder la note"}
                    </Button>
                    {txNoteSaved && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Note sauvegardée</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTransaction(null)} data-testid="button-close-transaction-dialog">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
      )}

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
  externalReference: string | null;
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

  const retryApiMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/admin/withdrawal-requests/${id}/retry-api`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Erreur inconnue" }));
        throw new Error(err.message || "Erreur lors de la relance");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawal-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Relance effectuée", description: data.message || "Retrait relancé via API" });
    },
    onError: (error: Error) => {
      toast({ title: "Échec de la relance", description: error.message, variant: "destructive" });
    },
  });

  const cancelOmnipayMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/admin/withdrawal-requests/${id}/cancel-omnipay`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawal-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      const detail = data.omnipaySuccess
        ? "OmniPay a confirmé l'annulation."
        : `Solde remboursé (OmniPay: ${data.omnipayMessage || "non confirmé"}).`;
      toast({ title: "Retrait annulé et remboursé", description: detail });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const [omnipayStatusResults, setOmnipayStatusResults] = useState<any[]>([]);
  const [showOmnipayStatusDialog, setShowOmnipayStatusDialog] = useState(false);

  const checkStatusXafMutation = useMutation({
    mutationFn: async (currency: string) => {
      const res = await apiRequest("POST", `/api/admin/omnipay/check-status-stuck`, { currency });
      return res.json();
    },
    onSuccess: (data) => {
      setOmnipayStatusResults(data.results || []);
      setShowOmnipayStatusDialog(true);
    },
    onError: (error: Error) => {
      toast({ title: "Erreur vérification OmniPay", description: error.message, variant: "destructive" });
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
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          className="border-blue-400 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          disabled={checkStatusXafMutation.isPending}
          onClick={() => checkStatusXafMutation.mutate("XAF")}
          data-testid="button-check-status-xaf"
        >
          {checkStatusXafMutation.isPending ? "Vérification..." : "🔍 Statut transferts XAF (OmniPay)"}
        </Button>
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
                            request.status === "processing" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }>
                            {request.status === "approved" ? "Approuvé" : 
                             request.status === "pending" ? "En attente" : 
                             request.status === "processing" ? "En cours" :
                             "Rejeté"}
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
                          <div className={`mt-2 p-2 rounded text-sm ${request.status === "pending" ? "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"}`}>
                            <strong>{request.status === "pending" ? "⚠️ Erreur paiement auto:" : "Raison du rejet:"}</strong> {request.rejectionReason}
                          </div>
                        )}
                      </div>
                      
                      {request.status === "pending" && (() => {
                        const rr = request.rejectionReason || "";
                        const ref = request.externalReference || "";
                        const isPayDunya =
                          ref.startsWith("PD-WD-") ||
                          rr.toLowerCase().includes("paydunya") ||
                          rr.toLowerCase().includes("pay dunya");
                        const isMbiyoPay =
                          ref.startsWith("mbiyopay_payout_") ||
                          rr.toLowerCase().includes("mbiyopay") ||
                          rr.toLowerCase().includes("mbiyo");
                        const canRetry =
                          rr.length > 0 &&
                          !rr.startsWith("LIQUIDITY_HOLD") &&
                          (isPayDunya || isMbiyoPay);
                        const retryLabel = isPayDunya
                          ? "Relancer PayDunya"
                          : isMbiyoPay
                          ? "Relancer MbiyoPay"
                          : "Relancer via API";

                        return (
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
                            {canRetry && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                disabled={retryApiMutation.isPending}
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Relancer automatiquement ce retrait de ${formatCurrency(request.netAmount)} via ${isPayDunya ? "PayDunya" : "MbiyoPay"} ?`
                                    )
                                  ) {
                                    retryApiMutation.mutate(request.id);
                                  }
                                }}
                                data-testid={`button-retry-api-${request.id}`}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                {retryApiMutation.isPending ? "..." : retryLabel}
                              </Button>
                            )}
                            {ref && !ref.startsWith("PD-WD-") && !ref.startsWith("mbiyopay_") && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-orange-400 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Annuler via OmniPay et rembourser ${formatCurrency(request.amount)} à l'utilisateur ?`
                                    )
                                  ) {
                                    cancelOmnipayMutation.mutate(request.id);
                                  }
                                }}
                                disabled={cancelOmnipayMutation.isPending}
                                data-testid={`button-cancel-omnipay-${request.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                {cancelOmnipayMutation.isPending ? "..." : "Annuler OmniPay"}
                              </Button>
                            )}
                          </div>
                        );
                      })()}
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

      {showOmnipayStatusDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Statut des transferts XAF chez OmniPay</CardTitle>
              <CardDescription>
                Résultat de la vérification en temps réel pour chaque transfert Cameroun/Congo envoyé à OmniPay
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {omnipayStatusResults.map((r) => (
                <div key={r.id} className="flex items-start justify-between p-3 rounded-lg border bg-muted/30 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold">#{r.id}</span>
                      <Badge variant="outline" className="text-xs">{r.ourStatus}</Badge>
                      <span className="text-sm font-medium">{parseFloat(r.amount).toLocaleString()} XAF</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-1 truncate">{r.reference}</p>
                    <p className="text-sm mt-1">{r.omnipayStatusLabel} — <span className="text-muted-foreground">{r.omnipayMessage}</span></p>
                  </div>
                </div>
              ))}
              {omnipayStatusResults.length === 0 && (
                <p className="text-muted-foreground text-center py-4">Aucun transfert trouvé</p>
              )}
              <div className="pt-2 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <strong>Info :</strong> Si tous les transferts sont <strong>❌ Échoués (status=4)</strong> chez OmniPay, les fonds ne sont pas partis. 
                Les retraits en statut <em>"en attente"</em> dans notre base peuvent être annulés via le bouton <em>"Annuler OmniPay"</em> pour rembourser l'utilisateur.
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowOmnipayStatusDialog(false)}>Fermer</Button>
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
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [showDeleteImagesConfirm, setShowDeleteImagesConfirm] = useState(false);

  const { data: requests, isLoading } = useQuery<KycRequestWithUser[]>({ queryKey: ["/api/admin/kyc"] });

  const { data: kycSignedUrls } = useQuery<{ frontUrl: string; backUrl: string; selfieUrl: string }>({
    queryKey: ["/api/admin/kyc", selectedKyc?.id, "signed-urls"],
    queryFn: async () => {
      if (!selectedKyc?.id) return { frontUrl: "", backUrl: "", selfieUrl: "" };
      const res = await fetch(`/api/admin/kyc/${selectedKyc.id}/signed-urls`, { credentials: "include" });
      if (!res.ok) return { frontUrl: "", backUrl: "", selfieUrl: "" };
      return res.json();
    },
    enabled: !!selectedKyc?.id,
    staleTime: 50 * 60 * 1000,
  });

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

  const deleteImagesMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await apiRequest("POST", "/api/admin/kyc/delete-images", { ids });
      return res.json();
    },
    onSuccess: (data: { deleted: number; freed: number; errors: string[] }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc"] });
      setCheckedIds(new Set());
      setShowDeleteImagesConfirm(false);
      const freed = data.freed > 0 ? ` (~${Math.round(data.freed / 1024 / 1024)} Mo libérés)` : "";
      toast({
        title: "Images supprimées ✅",
        description: `${data.deleted} fichier(s) supprimé(s) de Supabase${freed}.${data.errors?.length ? ` (${data.errors.length} erreur(s))` : ""}`,
      });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err?.message || "Impossible de supprimer les images.", variant: "destructive" });
    },
  });

  const toggleCheck = (id: number) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (checkedIds.size === filteredRequests.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(filteredRequests.map(r => r.id)));
    }
  };

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
        {/* Barre de sélection groupée */}
        {checkedIds.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 bg-orange-50 dark:bg-orange-950/30 border-b border-orange-200 dark:border-orange-800">
            <SquareCheck className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
              {checkedIds.size} dossier{checkedIds.size > 1 ? "s" : ""} sélectionné{checkedIds.size > 1 ? "s" : ""}
            </span>
            <Button
              size="sm"
              variant="destructive"
              className="ml-auto flex items-center gap-1.5"
              onClick={() => setShowDeleteImagesConfirm(true)}
              disabled={deleteImagesMutation.isPending}
              data-testid="button-bulk-delete-kyc-images"
            >
              <ImageOff className="h-3.5 w-3.5" />
              Supprimer les images ({checkedIds.size})
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCheckedIds(new Set())} className="text-muted-foreground">
              Annuler
            </Button>
          </div>
        )}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-border cursor-pointer w-4 h-4"
                      checked={filteredRequests.length > 0 && checkedIds.size === filteredRequests.length}
                      onChange={toggleAll}
                      data-testid="checkbox-select-all-kyc"
                    />
                  </th>
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
                  <tr><td colSpan={7} className="p-8 text-center"><Skeleton className="h-8 w-full" /></td></tr>
                ) : !filteredRequests?.length ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Aucune demande KYC trouvée</td></tr>
                ) : filteredRequests.map((req) => (
                  <tr key={req.id} className={`border-b hover:bg-muted/30 ${checkedIds.has(req.id) ? "bg-orange-50/60 dark:bg-orange-950/20" : ""}`}>
                    <td className="p-4">
                      <input
                        type="checkbox"
                        className="rounded border-border cursor-pointer w-4 h-4"
                        checked={checkedIds.has(req.id)}
                        onChange={() => toggleCheck(req.id)}
                        data-testid={`checkbox-kyc-${req.id}`}
                      />
                    </td>
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
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" onClick={() => setSelectedKyc(req)} data-testid={`button-view-kyc-${req.id}`}>
                          <Eye className="h-4 w-4 mr-1" /> Voir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950"
                          title="Supprimer les images de Supabase"
                          onClick={() => { setCheckedIds(new Set([req.id])); setShowDeleteImagesConfirm(true); }}
                          data-testid={`button-delete-images-kyc-${req.id}`}
                        >
                          <ImageOff className="h-4 w-4" />
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

      {/* Dialog confirmation suppression images */}
      <Dialog open={showDeleteImagesConfirm} onOpenChange={open => { if (!open && !deleteImagesMutation.isPending) { setShowDeleteImagesConfirm(false); setCheckedIds(new Set()); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageOff className="h-5 w-5 text-destructive" />
              Supprimer les images de Supabase
            </DialogTitle>
            <DialogDescription>
              Vous allez supprimer les photos de {checkedIds.size} dossier{checkedIds.size > 1 ? "s" : ""} KYC de Supabase Storage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Ce qui sera supprimé</p>
                <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Recto de la pièce d'identité</li>
                  <li>Verso de la pièce d'identité</li>
                  <li>Photo selfie de vérification</li>
                </ul>
              </div>
            </div>
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-700 dark:text-green-400">Ce qui est conservé</p>
                <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Le dossier KYC et son statut</li>
                  <li>Les informations de l'utilisateur</li>
                  <li>Toutes les données en base</li>
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteImagesConfirm(false); setCheckedIds(new Set()); }} disabled={deleteImagesMutation.isPending}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={deleteImagesMutation.isPending}
              onClick={() => deleteImagesMutation.mutate(Array.from(checkedIds))}
              data-testid="button-confirm-delete-kyc-images"
            >
              {deleteImagesMutation.isPending
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Suppression...</>
                : <><ImageOff className="h-4 w-4 mr-2" />Confirmer la suppression</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                        onClick={() => handleDownload(kycSignedUrls?.frontUrl || selectedKyc.documentFrontPath, `kyc_${selectedKyc.id}_front.jpg`)}
                      >
                        <Download className="h-4 w-4 mr-1" /> Télécharger
                      </Button>
                    </div>
                    {kycSignedUrls?.frontUrl ? (
                      <a href={kycSignedUrls.frontUrl} target="_blank" rel="noopener noreferrer">
                        <img src={kycSignedUrls.frontUrl} alt="Recto" className="rounded-md border max-h-48 object-cover w-full cursor-pointer hover:opacity-80" />
                      </a>
                    ) : (
                      <div className="rounded-md border bg-muted h-48 flex items-center justify-center text-muted-foreground text-sm">Chargement...</div>
                    )}
                  </div>
                  {selectedKyc.documentBackPath && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Document verso</p>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownload(kycSignedUrls?.backUrl || selectedKyc.documentBackPath!, `kyc_${selectedKyc.id}_back.jpg`)}
                        >
                          <Download className="h-4 w-4 mr-1" /> Télécharger
                        </Button>
                      </div>
                      {kycSignedUrls?.backUrl ? (
                        <a href={kycSignedUrls.backUrl} target="_blank" rel="noopener noreferrer">
                          <img src={kycSignedUrls.backUrl} alt="Verso" className="rounded-md border max-h-48 object-cover w-full cursor-pointer hover:opacity-80" />
                        </a>
                      ) : (
                        <div className="rounded-md border bg-muted h-48 flex items-center justify-center text-muted-foreground text-sm">Chargement...</div>
                      )}
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
                        onClick={() => handleDownload(kycSignedUrls?.selfieUrl || selectedKyc.selfiePath!, `kyc_${selectedKyc.id}_selfie.jpg`)}
                      >
                        <Download className="h-4 w-4 mr-1" /> Télécharger
                      </Button>
                    </div>
                    {kycSignedUrls?.selfieUrl ? (
                      <a href={kycSignedUrls.selfieUrl} target="_blank" rel="noopener noreferrer">
                        <img 
                          src={kycSignedUrls.selfieUrl} 
                          alt="Selfie" 
                          className="rounded-md border max-h-48 object-cover cursor-pointer hover:opacity-80" 
                        />
                      </a>
                    ) : (
                      <div className="rounded-md border bg-muted h-48 flex items-center justify-center text-muted-foreground text-sm">Chargement...</div>
                    )}
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
  encaissementFeeRate: string | null;
  apiFeeRate: string | null;
}

function CommissionsContent() {
  const { toast } = useToast();
  const [depositRate, setDepositRate] = useState("7");
  const [encaissementRate, setEncaissementRate] = useState("5");
  const [withdrawalRate, setWithdrawalRate] = useState("7");
  const [walletExchangeRate, setWalletExchangeRate] = useState("4");
  const [partnerWalletExchangeFee, setPartnerWalletExchangeFee] = useState("2");
  const [walletExchangeEnabled, setWalletExchangeEnabled] = useState(true);
  const [reason, setReason] = useState("");
  const [editingFees, setEditingFees] = useState<Record<number, { deposit: string; withdraw: string; encaissement: string; api: string }>>({});

  const { data: settings } = useQuery<{ depositRate: string; encaissementRate: string; withdrawalRate: string; walletExchangeRate: string; partnerWalletExchangeFee: string; walletExchangeEnabled: boolean }>({
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
      setEncaissementRate(settings.encaissementRate || "5");
      setWithdrawalRate(settings.withdrawalRate || "7");
      setWalletExchangeRate(settings.walletExchangeRate || "4");
      setPartnerWalletExchangeFee(settings.partnerWalletExchangeFee || "2");
      setWalletExchangeEnabled(settings.walletExchangeEnabled !== false);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: { depositRate: string; encaissementRate: string; withdrawalRate: string; walletExchangeRate: string; partnerWalletExchangeFee: string; walletExchangeEnabled: boolean; reason?: string }) => {
      await apiRequest("POST", "/api/admin/fees/update", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fee-changes"] });
      setReason("");
      toast({ title: "Paramètres mis à jour", description: "Les nouveaux réglages sont actifs immédiatement pour les prochaines transactions." });
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
    if (!validateRate(depositRate) || !validateRate(encaissementRate) || !validateRate(withdrawalRate) || !validateRate(walletExchangeRate) || !validateRate(partnerWalletExchangeFee)) {
      toast({ title: "Erreur de validation", description: "Les taux doivent être entre 0% et 20%", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ depositRate, encaissementRate, withdrawalRate, walletExchangeRate, partnerWalletExchangeFee, walletExchangeEnabled, reason: reason || undefined });
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
                <p className="text-sm text-destructive" data-testid="text-withdrawal-error">Doit être entre 0 et 20</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="exchange-rate">Frais d'échange wallet (%)</Label>
              <Input
                id="exchange-rate"
                data-testid="input-exchange-rate"
                type="number"
                value={walletExchangeRate}
                onChange={(e) => setWalletExchangeRate(e.target.value)}
                min="0"
                max="20"
                step="0.1"
              />
              {!validateRate(walletExchangeRate) && (
                <p className="text-sm text-destructive" data-testid="text-exchange-rate-error">Doit être entre 0 et 20</p>
              )}
              <p className="text-xs text-muted-foreground">Prélevé lors des échanges entre portefeuilles utilisateurs. Actuellement : {settings?.walletExchangeRate || "4"}%</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-exchange-fee">Frais d'échange wallet partenaire (%)</Label>
              <Input
                id="partner-exchange-fee"
                data-testid="input-partner-exchange-fee"
                type="number"
                value={partnerWalletExchangeFee}
                onChange={(e) => setPartnerWalletExchangeFee(e.target.value)}
                min="0"
                max="20"
                step="0.1"
              />
              {!validateRate(partnerWalletExchangeFee) && (
                <p className="text-sm text-destructive" data-testid="text-partner-exchange-fee-error">Doit être entre 0 et 20</p>
              )}
              <p className="text-xs text-muted-foreground">Prélevé lors des échanges entre wallets pays dans l'espace partenaire. Actuellement : {settings?.partnerWalletExchangeFee || "2"}%</p>
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ArrowLeftRight className={`h-5 w-5 mt-0.5 ${walletExchangeEnabled ? "text-primary" : "text-muted-foreground"}`} />
              <div>
                <p className="font-medium">Échanges entre wallets</p>
                <p className="text-sm text-muted-foreground">
                  {walletExchangeEnabled
                    ? "Les utilisateurs peuvent demander un transfert entre leurs wallets de même devise."
                    : "Les échanges sont désactivés. Les fonds reçus dans un pays seront retirés dans ce même pays."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-sm font-medium ${walletExchangeEnabled ? "text-green-600" : "text-muted-foreground"}`}>
                {walletExchangeEnabled ? "Activés" : "Désactivés"}
              </span>
              <Switch
                checked={walletExchangeEnabled}
                onCheckedChange={setWalletExchangeEnabled}
                aria-label="Activer les échanges entre wallets"
                data-testid="switch-wallet-exchange-enabled"
              />
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
            {updateMutation.isPending ? "Mise \u00e0 jour..." : "Enregistrer les paramètres"}
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

  const { data: withdrawalsData, refetch: refetchWithdrawals } = useQuery<{ enabled: boolean }>({
    queryKey: ['/api/admin/withdrawals-status'],
  });

  const withdrawalsMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest("PUT", "/api/admin/withdrawals-status", { enabled });
      return res.json();
    },
    onSuccess: (data) => {
      refetchWithdrawals();
      toast({
        title: data.enabled ? "Retraits activés" : "Retraits désactivés",
        description: data.enabled ? "Les utilisateurs peuvent effectuer des retraits" : "Les retraits sont temporairement indisponibles",
      });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier le statut des retraits", variant: "destructive" });
    }
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
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="font-medium">Retraits</p>
              <p className="text-sm text-muted-foreground">
                {withdrawalsData?.enabled === false
                  ? "Les retraits sont désactivés — les utilisateurs voient « Retrait indisponible »"
                  : "Les utilisateurs peuvent effectuer des retraits normalement"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={withdrawalsData?.enabled === false ? "destructive" : "secondary"}>
                {withdrawalsData?.enabled === false ? "Désactivé" : "Activé"}
              </Badge>
              <Switch
                checked={withdrawalsData?.enabled !== false}
                onCheckedChange={(checked) => withdrawalsMutation.mutate(checked)}
                disabled={withdrawalsMutation.isPending}
                data-testid="switch-withdrawals-enabled"
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

  const toggleCountryMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PUT", `/api/admin/countries/${id}`, { isActive }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/countries"] });
      toast({
        title: vars.isActive ? "Pays activé" : "Pays désactivé",
        description: vars.isActive
          ? "Le pays est maintenant visible pour les utilisateurs."
          : "Le pays est masqué — dépôts, retraits et liens de paiement désactivés.",
      });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de modifier le statut du pays", variant: "destructive" }),
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
              <Card key={country.id} className={country.isActive === false ? "opacity-60 border-destructive/40" : ""}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{({ BJ: "🇧🇯", BF: "🇧🇫", TG: "🇹🇬", CM: "🇨🇲", CI: "🇨🇮", CD: "🇨🇩", CG: "🇨🇬", SN: "🇸🇳", ML: "🇲🇱", GN: "🇬🇳", GA: "🇬🇦", MG: "🇲🇬" } as Record<string,string>)[country.code] || "🌍"}</span>
                    <CardTitle className="text-lg">{country.name}</CardTitle>
                    {country.isActive === false && (
                      <Badge variant="destructive" className="text-xs">Désactivé</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 bg-muted/30">
                      <Switch
                        checked={country.isActive !== false}
                        onCheckedChange={(checked) =>
                          toggleCountryMutation.mutate({ id: country.id, isActive: checked })
                        }
                        disabled={toggleCountryMutation.isPending}
                        data-testid={`switch-country-active-${country.id}`}
                      />
                      <Label className="text-sm cursor-pointer select-none">
                        {country.isActive !== false ? "Actif" : "Inactif"}
                      </Label>
                    </div>
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
                            <Badge variant={op.paymentGateway === "soleaspay" ? "default" : op.paymentGateway === "maishapay" ? "outline" : op.paymentGateway === "omnipay" ? "outline" : op.paymentGateway === "paxity" ? "outline" : op.paymentGateway === "mbiyopay" ? "outline" : op.paymentGateway === "gomboplus" ? "outline" : "secondary"}>
                              {op.paymentGateway === "soleaspay" ? "SoleasPay" : op.paymentGateway === "maishapay" ? "MaishaPay" : op.paymentGateway === "omnipay" ? "OmniPay" : op.paymentGateway === "paxity" ? "Paxity" : op.paymentGateway === "mbiyopay" ? "MbiyoPay" : op.paymentGateway === "gomboplus" ? "GomboPlus" : op.paymentGateway === "paydunya" ? "PayDunya" : op.paymentGateway}
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
                <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                  <SelectItem value="mbiyopay">MbiyoPay</SelectItem>
                  <SelectItem value="soleaspay">SoleasPay</SelectItem>
                  <SelectItem value="maishapay">MaishaPay</SelectItem>
                  <SelectItem value="omnipay">OmniPay</SelectItem>
                  <SelectItem value="paxity">Paxity</SelectItem>
                  <SelectItem value="gomboplus">GomboPlus</SelectItem>
                  <SelectItem value="paydunya">PayDunya</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">GomboPlus: TG, BJ, BF (MTN, Moov, Yas/T-Money, Orange) | MbiyoPay: Afrique de l'Ouest &amp; Centrale | SoleasPay: USSD direct | MaishaPay: USSD direct (RDC, Congo, +) | OmniPay: CI (MTN, Moov, Orange, Wave) | Paxity: Afrique de l'Ouest &amp; Centrale | PayDunya: SN, ML, BF, CI, BJ</p>
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
                <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                  <SelectItem value="mbiyopay">MbiyoPay</SelectItem>
                  <SelectItem value="soleaspay">SoleasPay</SelectItem>
                  <SelectItem value="maishapay">MaishaPay</SelectItem>
                  <SelectItem value="omnipay">OmniPay</SelectItem>
                  <SelectItem value="paxity">Paxity</SelectItem>
                  <SelectItem value="gomboplus">GomboPlus</SelectItem>
                  <SelectItem value="paydunya">PayDunya</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">GomboPlus: TG, BJ, BF (MTN, Moov, Yas/T-Money, Orange) | MbiyoPay: Afrique de l'Ouest &amp; Centrale | SoleasPay: USSD direct | MaishaPay: USSD direct (RDC, Congo, +) | OmniPay: CI (MTN, Moov, Orange, Wave) | Paxity: Afrique de l'Ouest &amp; Centrale | PayDunya: SN, ML, BF, CI, BJ</p>
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

function WalletExchangesContent() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [rejectNote, setRejectNote] = useState("");
  const [approveNote, setApproveNote] = useState("");
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });

  const { data: exchanges, isLoading } = useQuery<(WalletExchange & { user?: UserType })[]>({
    queryKey: ["/api/admin/wallet-exchanges", statusFilter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/wallet-exchanges?status=${statusFilter}`, { credentials: "include" });
      if (!res.ok) throw new Error("Erreur serveur");
      return res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, adminNote }: { id: number; adminNote: string }) => {
      await apiRequest("POST", `/api/admin/wallet-exchanges/${id}/approve`, { adminNote });
    },
    onSuccess: () => {
      toast({ title: "Approuvé", description: "L'échange a été approuvé et les fonds crédités." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallet-exchanges"] });
      setApproveDialog({ open: false, id: null });
      setApproveNote("");
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Erreur", description: e.message }),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, adminNote }: { id: number; adminNote: string }) => {
      await apiRequest("POST", `/api/admin/wallet-exchanges/${id}/reject`, { adminNote });
    },
    onSuccess: () => {
      toast({ title: "Rejeté", description: "L'échange a été rejeté et les fonds recrédités à l'utilisateur." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallet-exchanges"] });
      setRejectDialog({ open: false, id: null });
      setRejectNote("");
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Erreur", description: e.message }),
  });

  const FLAG_MAP: Record<string, string> = {
    CI: "🇨🇮", BJ: "🇧🇯", TG: "🇹🇬", BF: "🇧🇫", SN: "🇸🇳",
    CM: "🇨🇲", ML: "🇲🇱", GN: "🇬🇳", COG: "🇨🇬", COD: "🇨🇩",
    NE: "🇳🇪", TD: "🇹🇩", CF: "🇨🇫", GA: "🇬🇦", GQ: "🇬🇶",
    GW: "🇬🇼", MR: "🇲🇷", RW: "🇷🇼", BI: "🇧🇮",
  };

  const filtered = useMemo(() => {
    if (!exchanges) return [];
    const q = searchQuery.toLowerCase();
    return exchanges.filter(ex =>
      !q ||
      ex.user?.fullName?.toLowerCase().includes(q) ||
      (ex as any).partner?.name?.toLowerCase().includes(q) ||
      ex.fromCountryCode.toLowerCase().includes(q) ||
      ex.toCountryCode.toLowerCase().includes(q) ||
      ex.currency.toLowerCase().includes(q)
    );
  }, [exchanges, searchQuery]);

  const pendingCount = exchanges?.filter(e => e.status === "pending").length ?? 0;

  const statusBadge = (status: string) => {
    if (status === "pending") return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-0 gap-1"><Clock className="h-3 w-3" />En attente</Badge>;
    if (status === "approved") return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-0 gap-1"><CheckCircle className="h-3 w-3" />Approuvé</Badge>;
    return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-0 gap-1"><XCircle className="h-3 w-3" />Rejeté</Badge>;
  };

  const totalCommissionEarned = (exchanges || [])
    .filter(e => e.status === "approved")
    .reduce((sum, e) => sum + parseFloat((e as any).fee || "0"), 0);
  const pendingCommission = (exchanges || [])
    .filter(e => e.status === "pending")
    .reduce((sum, e) => sum + parseFloat((e as any).fee || "0"), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Échanges Wallets
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1">{pendingCount} en attente</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">Validez ou rejetez les demandes d'échange entre portefeuilles utilisateurs</p>
        </div>
      </div>

      {/* Statistiques de commission */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Commissions encaissées</p>
                <p className="text-xl font-bold text-violet-600">{new Intl.NumberFormat("fr-FR").format(totalCommissionEarned)} FCFA</p>
                <p className="text-xs text-muted-foreground">{(exchanges || []).filter(e => e.status === "approved").length} échanges approuvés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Commissions en attente</p>
                <p className="text-xl font-bold text-amber-600">{new Intl.NumberFormat("fr-FR").format(pendingCommission)} FCFA</p>
                <p className="text-xs text-muted-foreground">{pendingCount} échanges à traiter</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <ArrowLeftRight className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total échanges</p>
                <p className="text-xl font-bold">{(exchanges || []).length}</p>
                <p className="text-xs text-muted-foreground">{(exchanges || []).filter(e => e.status === "rejected").length} rejetés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par utilisateur, pays, devise..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-exchanges"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44" data-testid="select-filter-status">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvés</SelectItem>
                <SelectItem value="rejected">Rejetés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">ID</TableHead>
                  <TableHead className="whitespace-nowrap">Utilisateur</TableHead>
                  <TableHead className="whitespace-nowrap">De → Vers</TableHead>
                  <TableHead className="whitespace-nowrap">Montant</TableHead>
                  <TableHead className="whitespace-nowrap">Statut</TableHead>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Note</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3].map(i => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      Aucun échange trouvé
                    </TableCell>
                  </TableRow>
                ) : filtered.map(ex => (
                  <TableRow key={`${(ex as any).isPartner ? "p" : "u"}-${ex.id}`} data-testid={`exchange-row-${ex.id}`}>
                    <TableCell className="text-xs text-muted-foreground font-mono">#{ex.id}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div>
                        {(ex as any).isPartner ? (
                          <>
                            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-0 text-xs mb-0.5">Partenaire</Badge>
                            <p className="font-medium text-sm">{(ex as any).partner?.name || "—"}</p>
                          </>
                        ) : (
                          <>
                            <p className="font-medium text-sm">{ex.user?.fullName || "—"}</p>
                            <p className="text-xs text-muted-foreground">#{ex.userId}</p>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm">
                        <span>{FLAG_MAP[ex.fromCountryCode] || "🌍"}</span>
                        <span className="font-medium">{ex.fromCountryCode}</span>
                        <span className="text-muted-foreground">→</span>
                        <span>{FLAG_MAP[ex.toCountryCode] || "🌍"}</span>
                        <span className="font-medium">{ex.toCountryCode}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{ex.currency}</p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-semibold">
                      {new Intl.NumberFormat("fr-FR").format(parseFloat(ex.amount))} {ex.currency}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{statusBadge(ex.status)}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(ex.createdAt)}
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      <p className="text-xs text-muted-foreground truncate">{ex.adminNote || "—"}</p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      {ex.status === "pending" && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950/30 gap-1"
                            onClick={() => setApproveDialog({ open: true, id: ex.id })}
                            data-testid={`button-approve-${ex.id}`}
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Approuver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1"
                            onClick={() => setRejectDialog({ open: true, id: ex.id })}
                            data-testid={`button-reject-${ex.id}`}
                          >
                            <XCircle className="h-3.5 w-3.5" /> Rejeter
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Approbation */}
      <Dialog open={approveDialog.open} onOpenChange={open => { setApproveDialog({ open, id: approveDialog.id }); if (!open) setApproveNote(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" /> Approuver l'échange
            </DialogTitle>
            <DialogDescription>
              Les fonds seront crédités dans le portefeuille destination. Une notification Telegram sera envoyée.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Note administrative (optionnel)</Label>
            <Input
              placeholder="Ex: Échange validé après vérification..."
              value={approveNote}
              onChange={e => setApproveNote(e.target.value)}
              data-testid="input-approve-note"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog({ open: false, id: null })}>Annuler</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => approveDialog.id && approveMutation.mutate({ id: approveDialog.id, adminNote: approveNote })}
              disabled={approveMutation.isPending}
              data-testid="button-confirm-approve"
            >
              {approveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Confirmer l'approbation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Rejet */}
      <Dialog open={rejectDialog.open} onOpenChange={open => { setRejectDialog({ open, id: rejectDialog.id }); if (!open) setRejectNote(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" /> Rejeter l'échange
            </DialogTitle>
            <DialogDescription>
              Les fonds seront recrédités dans le portefeuille source. Une notification Telegram sera envoyée.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Raison du rejet (optionnel)</Label>
            <Input
              placeholder="Ex: Solde insuffisant, vérification requise..."
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              data-testid="input-reject-note"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, id: null })}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={() => rejectDialog.id && rejectMutation.mutate({ id: rejectDialog.id, adminNote: rejectNote })}
              disabled={rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type EmailButton = { text: string; url: string; color: string };

function EmailBroadcastContent() {
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [buttons, setButtons] = useState<EmailButton[]>([]);
  const [newBtn, setNewBtn] = useState<EmailButton>({ text: "", url: "", color: "#059669" });
  const [aiPrompt, setAiPrompt] = useState("");
  const [preview, setPreview] = useState(false);
  const [sent, setSent] = useState<number | null>(null);
  const [textColor, setTextColor] = useState("#000000");
  const [highlightColor, setHighlightColor] = useState("#ffff00");

  const { data: users } = useQuery<UserType[]>({ queryKey: ["/api/admin/users"] });
  const userCount = (users || []).filter((u: any) => u.email?.includes("@")).length;

  /* ── Sync editor → state ── */
  const syncContent = useCallback(() => {
    if (editorRef.current) setBodyHtml(editorRef.current.innerHTML);
  }, []);

  /* ── execCommand helper (uses onMouseDown to keep selection) ── */
  const execCmd = useCallback((cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value ?? undefined);
    syncContent();
  }, [syncContent]);

  const generateMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await apiRequest("POST", "/api/admin/generate-email-content", { prompt });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.subject) setSubject(data.subject);
      if (data.bodyHtml && editorRef.current) {
        editorRef.current.innerHTML = data.bodyHtml;
        setBodyHtml(data.bodyHtml);
      }
      if (data.buttonText && data.buttonText !== "null" && data.buttonUrl && data.buttonUrl !== "null") {
        setButtons(prev => [...prev, { text: data.buttonText, url: data.buttonUrl, color: "#059669" }]);
      }
      toast({ title: "✅ Contenu généré", description: "Vérifiez et modifiez si nécessaire." });
    },
    onError: (err: any) => {
      toast({ title: "Erreur IA", description: err.message || "Échec de la génération", variant: "destructive" });
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/broadcast-email", { subject, bodyHtml, buttons });
      return res.json();
    },
    onSuccess: (data: any) => {
      setSent(data.queued);
      toast({ title: "📧 Envoi lancé", description: data.message });
    },
    onError: (err: any) => {
      toast({ title: "Erreur d'envoi", description: err.message || "Échec", variant: "destructive" });
    },
  });

  const previewHtml = `
    <div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#059669,#10b981);padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;">SendavaPay</h1>
      </div>
      <div style="padding:32px 28px;">
        <p style="margin-top:0;">Bonjour [Prénom],</p>
        ${bodyHtml}
        ${buttons.map(b => `<p style="text-align:center;margin:8px 0;"><a href="${b.url}" style="display:inline-block;background:${b.color};color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">${b.text}</a></p>`).join('')}
        <p style="margin-bottom:0;">À bientôt,<br/>L'équipe SendavaPay</p>
      </div>
      <div style="background:#f9fafb;padding:16px;text-align:center;color:#6b7280;font-size:12px;">
        <p style="margin:0;">SendavaPay · noreply@sendavapay.com</p>
      </div>
    </div>
  `;

  const tb = "px-2 py-1 text-sm border rounded hover:bg-gray-100 active:bg-gray-200 transition-colors select-none";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Email Broadcast</h1>
        <p className="text-muted-foreground">Envoyez un email à tous les utilisateurs inscrits</p>
      </div>

      {/* ── IA ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" /> Générer avec l'IA
          </CardTitle>
          <CardDescription>Décrivez le contenu voulu, l'IA rédige l'email complet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Ex : Annonce de nouvelles fonctionnalités de retrait instantané..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={3}
            data-testid="textarea-ai-prompt"
          />
          <Button onClick={() => generateMutation.mutate(aiPrompt)} disabled={!aiPrompt.trim() || generateMutation.isPending} data-testid="button-generate-ai" className="bg-violet-600 hover:bg-violet-700">
            {generateMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Génération...</> : <><Sparkles className="h-4 w-4 mr-2" /> Générer l'email</>}
          </Button>
        </CardContent>
      </Card>

      {/* ── Composition ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Composer l'email</CardTitle>
          <CardDescription>Éditeur riche — sélectionnez du texte puis appliquez le formatage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sujet */}
          <div className="space-y-2">
            <Label htmlFor="email-subject">Sujet</Label>
            <Input id="email-subject" placeholder="Objet de l'email..." value={subject} onChange={(e) => setSubject(e.target.value)} data-testid="input-email-subject" />
          </div>

          {/* ── Éditeur riche ── */}
          <div className="space-y-2">
            <Label>Corps du message</Label>
            <div className="border rounded-lg overflow-hidden shadow-sm">

              {/* Barre d'outils */}
              <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b">

                {/* Gras / Italique / Souligné / Barré */}
                <button type="button" onMouseDown={e => { e.preventDefault(); execCmd("bold"); }} className={tb + " font-bold"} title="Gras (Ctrl+B)">B</button>
                <button type="button" onMouseDown={e => { e.preventDefault(); execCmd("italic"); }} className={tb + " italic"} title="Italique (Ctrl+I)">I</button>
                <button type="button" onMouseDown={e => { e.preventDefault(); execCmd("underline"); }} className={tb + " underline"} title="Souligner (Ctrl+U)">U</button>
                <button type="button" onMouseDown={e => { e.preventDefault(); execCmd("strikeThrough"); }} className={tb + " line-through"} title="Barré">S</button>

                <span className="w-px h-5 bg-gray-300 mx-0.5" />

                {/* Couleur texte */}
                <label className={tb + " cursor-pointer relative flex items-center gap-0.5"} title="Couleur du texte">
                  <span className="font-bold" style={{ color: textColor }}>A</span>
                  <span className="text-xs">▾</span>
                  <input type="color" value={textColor} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    onChange={e => setTextColor(e.target.value)}
                    onInput={e => execCmd("foreColor", (e.target as HTMLInputElement).value)} />
                </label>

                {/* Surbrillance */}
                <label className={tb + " cursor-pointer relative flex items-center gap-0.5"} title="Couleur de fond / surbrillance">
                  <span className="px-0.5 font-bold" style={{ background: highlightColor }}>H</span>
                  <span className="text-xs">▾</span>
                  <input type="color" value={highlightColor} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    onChange={e => setHighlightColor(e.target.value)}
                    onInput={e => execCmd("hiliteColor", (e.target as HTMLInputElement).value)} />
                </label>

                <span className="w-px h-5 bg-gray-300 mx-0.5" />

                {/* Taille de police */}
                <select
                  defaultValue="3"
                  onMouseDown={e => e.stopPropagation()}
                  onChange={e => execCmd("fontSize", e.target.value)}
                  className="text-sm border rounded px-1 py-0.5 bg-white h-7"
                  title="Taille du texte"
                >
                  <option value="1">Très petit</option>
                  <option value="2">Petit</option>
                  <option value="3">Normal</option>
                  <option value="4">Grand</option>
                  <option value="5">Très grand</option>
                  <option value="6">Titre</option>
                </select>

                <span className="w-px h-5 bg-gray-300 mx-0.5" />

                {/* Alignement */}
                <button type="button" onMouseDown={e => { e.preventDefault(); execCmd("justifyLeft"); }} className={tb} title="Aligner à gauche">≡L</button>
                <button type="button" onMouseDown={e => { e.preventDefault(); execCmd("justifyCenter"); }} className={tb} title="Centrer">≡C</button>
                <button type="button" onMouseDown={e => { e.preventDefault(); execCmd("justifyRight"); }} className={tb} title="Aligner à droite">≡R</button>

                <span className="w-px h-5 bg-gray-300 mx-0.5" />

                {/* Listes */}
                <button type="button" onMouseDown={e => { e.preventDefault(); execCmd("insertUnorderedList"); }} className={tb} title="Liste à puces">• —</button>
                <button type="button" onMouseDown={e => { e.preventDefault(); execCmd("insertOrderedList"); }} className={tb} title="Liste numérotée">1. —</button>

                <span className="w-px h-5 bg-gray-300 mx-0.5" />

                {/* Effacer le formatage */}
                <button type="button" onMouseDown={e => { e.preventDefault(); execCmd("removeFormat"); }} className={tb + " text-red-500"} title="Effacer le formatage">✕ fmt</button>
              </div>

              {/* Zone de saisie */}
              <div
                ref={editorRef}
                contentEditable
                onInput={syncContent}
                onBlur={syncContent}
                suppressContentEditableWarning
                data-testid="div-email-body"
                className="min-h-[220px] p-4 outline-none text-sm leading-relaxed"
                style={{ wordBreak: "break-word" }}
                data-placeholder="Commencez à écrire votre message ici..."
              />
            </div>
            <p className="text-xs text-muted-foreground">Le bonjour et la signature sont ajoutés automatiquement à l'envoi.</p>
          </div>

          {/* ── Boutons CTA multiples ── */}
          <div className="space-y-3">
            <Label>Boutons d'action (optionnel — plusieurs autorisés)</Label>

            {/* Liste des boutons ajoutés */}
            {buttons.length > 0 && (
              <div className="space-y-2">
                {buttons.map((btn, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 border rounded-lg bg-gray-50">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: btn.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{btn.text}</p>
                      <p className="text-xs text-muted-foreground truncate">{btn.url}</p>
                    </div>
                    <button type="button" onClick={() => setButtons(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-sm font-medium flex-shrink-0">Supprimer</button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulaire d'ajout */}
            <div className="border rounded-lg p-3 bg-gray-50 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Ajouter un bouton</p>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Texte du bouton" value={newBtn.text} onChange={e => setNewBtn(p => ({ ...p, text: e.target.value }))} />
                <Input placeholder="https://sendavapay.com/..." value={newBtn.url} onChange={e => setNewBtn(p => ({ ...p, url: e.target.value }))} />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  Couleur :
                  <input type="color" value={newBtn.color} onChange={e => setNewBtn(p => ({ ...p, color: e.target.value }))} className="w-7 h-7 border rounded cursor-pointer p-0" />
                </label>
                <div className="h-7 px-4 rounded text-white text-xs flex items-center font-semibold" style={{ background: newBtn.color }}>
                  {newBtn.text || "Aperçu"}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!newBtn.text.trim() || !newBtn.url.trim()}
                  onClick={() => { setButtons(prev => [...prev, { ...newBtn }]); setNewBtn({ text: "", url: "", color: "#059669" }); }}
                >
                  + Ajouter
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Prévisualisation ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> Prévisualisation email</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setPreview(!preview)} data-testid="button-toggle-preview">
              {preview ? <><EyeOff className="h-4 w-4 mr-1" /> Masquer</> : <><Eye className="h-4 w-4 mr-1" /> Afficher</>}
            </Button>
          </div>
        </CardHeader>
        {preview && (
          <CardContent>
            <div className="border rounded-lg p-4 bg-gray-50 overflow-auto" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </CardContent>
        )}
      </Card>

      {/* ── Envoi ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" /> Envoyer</CardTitle>
          <CardDescription>
            {userCount > 0 ? `${userCount} utilisateur${userCount > 1 ? 's' : ''} avec une adresse email valide` : "Chargement des utilisateurs..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent !== null ? (
            <div className="flex items-center gap-2 text-emerald-600 font-medium">
              <CheckCircle2 className="h-5 w-5" />
              Envoi lancé vers {sent} destinataire{sent > 1 ? 's' : ''}. Vérifiez les logs serveur pour le détail.
            </div>
          ) : (
            <Button
              onClick={() => broadcastMutation.mutate()}
              disabled={!subject.trim() || !bodyHtml.trim() || broadcastMutation.isPending || userCount === 0}
              data-testid="button-send-broadcast"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {broadcastMutation.isPending
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Envoi en cours...</>
                : <><Send className="h-4 w-4 mr-2" /> Envoyer à {userCount} utilisateur{userCount > 1 ? 's' : ''}</>}
            </Button>
          )}
        </CardContent>
        {sent !== null && (
          <CardFooter>
            <Button variant="outline" size="sm" onClick={() => {
              setSent(null); setSubject(""); setBodyHtml(""); setButtons([]); setAiPrompt("");
              if (editorRef.current) editorRef.current.innerHTML = "";
            }}>
              Nouveau broadcast
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [location] = useLocation();

  const renderContent = () => {
    if (location === ADMIN_PATH || location === ADMIN_PATH + "/") return <DashboardContent />;
    if (location === ADMIN_PATH + "/users") return <UsersContent />;
    if (location === ADMIN_PATH + "/transactions") return <TransactionsContent />;
    if (location === ADMIN_PATH + "/withdrawals") return <WithdrawalsContent />;
    if (location === ADMIN_PATH + "/kyc") return <KycContent />;
    if (location === ADMIN_PATH + "/api-keys") return <ApiKeysContent />;
    if (location === ADMIN_PATH + "/commissions") return <CommissionsContent />;
    if (location === ADMIN_PATH + "/messaging") return <MessagingContent />;
    if (location === ADMIN_PATH + "/email-broadcast") return <EmailBroadcastContent />;
    if (location === ADMIN_PATH + "/reports") return <ReportsContent />;
    if (location === ADMIN_PATH + "/settings") return <SettingsContent />;
    if (location === ADMIN_PATH + "/withdrawal-numbers") return <WithdrawalNumbersContent />;
    if (location === ADMIN_PATH + "/countries") return <CountriesContent />;
    if (location === ADMIN_PATH + "/payment-links") return <AdminPaymentLinksContent />;
    if (location === ADMIN_PATH + "/partners") return <PartnersContent />;
    if (location === ADMIN_PATH + "/wallet-exchanges") return <WalletExchangesContent />;
    if (location === ADMIN_PATH + "/logs") return <LogsContent />;
    return <DashboardContent />;
  };

  return <AdminLayout>{renderContent()}</AdminLayout>;
}
