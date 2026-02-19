import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import logoPath from "@assets/20251211_105226_1765450558306.png";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  LayoutGrid,
  UserCircle,
  CreditCard,
  Clock,
  KeyRound,
  HelpCircle,
  LogOut,
  User,
  Copy,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Activity,
  AlertCircle,
  Save,
  Upload,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Globe,
  MessageSquare,
  Search,
  X,
} from "lucide-react";

type Section = "dashboard" | "profile" | "transactions" | "logs" | "api-keys" | "support";

const sidebarItems = [
  { key: "dashboard" as Section, icon: LayoutGrid, label: "Tableau de bord" },
  { key: "profile" as Section, icon: UserCircle, label: "Mon Profil" },
  { key: "transactions" as Section, icon: CreditCard, label: "Transactions" },
  { key: "logs" as Section, icon: Clock, label: "Journaux" },
  { key: "api-keys" as Section, icon: KeyRound, label: "Clés API & SDK" },
  { key: "support" as Section, icon: HelpCircle, label: "Support" },
];

const sidebarStyle = {
  "--sidebar-width": "16rem",
  "--sidebar-width-icon": "3rem",
} as React.CSSProperties;

export default function PartnerDashboard() {
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: partner, isLoading: partnerLoading, error: partnerError } = useQuery<any>({
    queryKey: ["/api/partner/me"],
  });

  useEffect(() => {
    if (partnerError) {
      setLocation("/partner/login");
    }
  }, [partnerError, setLocation]);

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/partner/logout"),
    onSuccess: () => {
      queryClient.clear();
      setLocation("/partner/login");
    },
  });

  if (partnerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-partner">
        <div className="space-y-4 w-full max-w-md p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!partner) return null;

  const getInitials = (name: string) =>
    name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "P";

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4">
            <img src={logoPath} alt="SendavaPay" className="h-8" data-testid="img-partner-logo" />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Espace Partenaire</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarItems.map((item) => (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        isActive={activeSection === item.key}
                        onClick={() => setActiveSection(item.key)}
                        data-testid={`sidebar-${item.key}`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => logoutMutation.mutate()}
                      className="text-destructive"
                      data-testid="button-partner-logout"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Déconnexion</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{getInitials(partner.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium truncate" data-testid="text-partner-name">{partner.name}</span>
                <span className="text-xs text-muted-foreground truncate">{partner.email}</span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
            <SidebarTrigger data-testid="button-partner-sidebar-toggle" />
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2" data-testid="button-partner-user-menu">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <span className="hidden sm:inline-block text-sm font-medium">
                      {partner.name?.split(" ")[0] || "Partenaire"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <p className="font-medium">{partner.name}</p>
                    <p className="text-xs text-muted-foreground">{partner.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setActiveSection("profile")} data-testid="menu-partner-profile">
                    <UserCircle className="h-4 w-4 mr-2" />
                    Mon Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveSection("api-keys")} data-testid="menu-partner-api-keys">
                    <KeyRound className="h-4 w-4 mr-2" />
                    Clés API
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logoutMutation.mutate()}
                    className="text-destructive cursor-pointer"
                    data-testid="button-header-partner-logout"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="p-4 lg:p-6">
            {activeSection === "dashboard" && <DashboardSection />}
            {activeSection === "profile" && <ProfileSection partner={partner} />}
            {activeSection === "transactions" && <TransactionsSection />}
            {activeSection === "logs" && <LogsSection />}
            {activeSection === "api-keys" && <ApiKeysSection />}
            {activeSection === "support" && <SupportSection />}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function DashboardSection() {
  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/partner/stats"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="loading-stats">
        <h2 className="text-2xl font-bold">Tableau de bord</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total transactions",
      value: stats?.totalTransactions ?? 0,
      icon: Activity,
      testId: "stat-total-transactions",
    },
    {
      title: "Revenus",
      value: `${stats?.revenue ?? 0} FCFA`,
      icon: DollarSign,
      testId: "stat-revenue",
    },
    {
      title: "Transactions aujourd'hui",
      value: stats?.todayTransactions ?? 0,
      icon: TrendingUp,
      testId: "stat-today-transactions",
    },
    {
      title: "Transactions en attente",
      value: stats?.pendingTransactions ?? 0,
      icon: AlertCircle,
      testId: "stat-pending-transactions",
    },
  ];

  return (
    <div className="space-y-6" data-testid="section-dashboard">
      <h2 className="text-2xl font-bold">Tableau de bord</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.testId}>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={stat.testId}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ProfileSection({ partner }: { partner: any }) {
  const { toast } = useToast();
  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ["/api/partner/profile"],
  });

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    description: "",
    website: "",
    webhookUrl: "",
    callbackUrl: "",
    primaryColor: "#000000",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        phone: profile.phone || "",
        description: profile.description || "",
        website: profile.website || "",
        webhookUrl: profile.webhookUrl || "",
        callbackUrl: profile.callbackUrl || "",
        primaryColor: profile.primaryColor || "#000000",
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("PATCH", "/api/partner/update-profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner/me"] });
      toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées." });
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="loading-profile">
        <h2 className="text-2xl font-bold">Mon Profil</h2>
        <Card>
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="section-profile">
      <h2 className="text-2xl font-bold">Mon Profil</h2>
      <Card>
        <CardHeader>
          <CardTitle>Informations du partenaire</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                data-testid="input-partner-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                data-testid="input-partner-phone"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              data-testid="input-partner-description"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website">Site web</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleChange("website", e.target.value)}
                data-testid="input-partner-website"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">URL Webhook</Label>
              <Input
                id="webhookUrl"
                value={formData.webhookUrl}
                onChange={(e) => handleChange("webhookUrl", e.target.value)}
                data-testid="input-partner-webhook"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="callbackUrl">URL de callback</Label>
              <Input
                id="callbackUrl"
                value={formData.callbackUrl}
                onChange={(e) => handleChange("callbackUrl", e.target.value)}
                data-testid="input-partner-callback"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Couleur primaire</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => handleChange("primaryColor", e.target.value)}
                  className="w-12 p-1"
                  data-testid="input-partner-color"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => handleChange("primaryColor", e.target.value)}
                  data-testid="input-partner-color-text"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              {profile?.logoUrl && (
                <img src={profile.logoUrl} alt="Logo" className="h-12 w-12 rounded-md object-cover" data-testid="img-partner-current-logo" />
              )}
              <Button variant="outline" data-testid="button-upload-logo">
                <Upload className="h-4 w-4 mr-2" />
                Télécharger un logo
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={() => updateMutation.mutate(formData)}
              disabled={updateMutation.isPending}
              data-testid="button-save-profile"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TransactionsSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTx, setSelectedTx] = useState<any>(null);

  const { data: transactions, isLoading } = useQuery<any[]>({
    queryKey: ["/api/partner/transactions"],
  });

  const filteredTransactions = (transactions || []).filter((tx: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (tx.id && String(tx.id).includes(q)) ||
      (tx.reference && tx.reference.toLowerCase().includes(q)) ||
      (tx.customerName && tx.customerName.toLowerCase().includes(q)) ||
      (tx.customerEmail && tx.customerEmail.toLowerCase().includes(q)) ||
      (tx.customerPhone && tx.customerPhone.toLowerCase().includes(q)) ||
      (tx.amount && String(tx.amount).includes(q)) ||
      (tx.paymentMethod && tx.paymentMethod.toLowerCase().includes(q)) ||
      (tx.status && tx.status.toLowerCase().includes(q)) ||
      (tx.description && tx.description.toLowerCase().includes(q))
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 no-default-hover-elevate no-default-active-elevate" data-testid={`badge-status-${status}`}>Complété</Badge>;
      case "pending":
        return <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 no-default-hover-elevate no-default-active-elevate" data-testid={`badge-status-${status}`}>En attente</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 no-default-hover-elevate no-default-active-elevate" data-testid={`badge-status-${status}`}>En cours</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 no-default-hover-elevate no-default-active-elevate" data-testid={`badge-status-${status}`}>Échoué</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 no-default-hover-elevate no-default-active-elevate" data-testid={`badge-status-${status}`}>Annulé</Badge>;
      default:
        return <Badge variant="secondary" data-testid={`badge-status-${status}`}>{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const formatAmount = (amount: string | number) => {
    return Number(amount).toLocaleString("fr-FR");
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="loading-transactions">
        <h2 className="text-2xl font-bold">Transactions</h2>
        <Card>
          <CardContent className="p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full mb-2" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="section-transactions">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-2xl font-bold">Transactions</h2>
        <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate" data-testid="badge-tx-count">
          {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="relative">
        <Input
          placeholder="Rechercher par ID, référence, nom, email, téléphone, montant..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-transactions"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {selectedTx && (
        <Card data-testid="card-tx-details">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
            <CardTitle className="text-lg">Détails de la transaction</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setSelectedTx(null)} data-testid="button-close-tx-details">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Référence</p>
                <p className="font-mono text-sm font-medium" data-testid="text-detail-reference">{selectedTx.reference}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nom complet</p>
                <p className="font-medium" data-testid="text-detail-name">{selectedTx.customerName || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm" data-testid="text-detail-email">{selectedTx.customerEmail || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Téléphone</p>
                <p className="text-sm" data-testid="text-detail-phone">{selectedTx.customerPhone || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Montant</p>
                <p className="font-bold text-lg" data-testid="text-detail-amount">{formatAmount(selectedTx.amount)} {selectedTx.currency || "FCFA"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Frais</p>
                <p className="text-sm" data-testid="text-detail-fee">{formatAmount(selectedTx.fee || 0)} {selectedTx.currency || "FCFA"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mode de paiement</p>
                <p className="text-sm" data-testid="text-detail-method">{selectedTx.paymentMethod || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Statut</p>
                <div data-testid="text-detail-status">{getStatusBadge(selectedTx.status)}</div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Devise</p>
                <p className="text-sm" data-testid="text-detail-currency">{selectedTx.currency || "XOF"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm" data-testid="text-detail-date">{formatDate(selectedTx.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Heure</p>
                <p className="text-sm" data-testid="text-detail-time">{formatTime(selectedTx.createdAt)}</p>
              </div>
              {selectedTx.completedAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Complété le</p>
                  <p className="text-sm" data-testid="text-detail-completed">{formatDate(selectedTx.completedAt)} {formatTime(selectedTx.completedAt)}</p>
                </div>
              )}
              {selectedTx.description && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm" data-testid="text-detail-description">{selectedTx.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Nom complet</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Frais</TableHead>
                  <TableHead>Mode de paiement</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Heure</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx: any, index: number) => (
                    <TableRow
                      key={tx.id || index}
                      className="cursor-pointer hover-elevate"
                      onClick={() => setSelectedTx(tx)}
                      data-testid={`row-transaction-${index}`}
                    >
                      <TableCell className="font-mono text-xs" data-testid={`text-tx-reference-${index}`}>{tx.reference}</TableCell>
                      <TableCell className="font-medium" data-testid={`text-tx-name-${index}`}>{tx.customerName || "-"}</TableCell>
                      <TableCell className="text-sm" data-testid={`text-tx-phone-${index}`}>{tx.customerPhone || "-"}</TableCell>
                      <TableCell className="font-medium" data-testid={`text-tx-amount-${index}`}>{formatAmount(tx.amount)} {tx.currency || "FCFA"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground" data-testid={`text-tx-fee-${index}`}>{formatAmount(tx.fee || 0)}</TableCell>
                      <TableCell className="text-sm" data-testid={`text-tx-method-${index}`}>{tx.paymentMethod || "-"}</TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell className="text-sm" data-testid={`text-tx-date-${index}`}>{formatDate(tx.createdAt)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground" data-testid={`text-tx-time-${index}`}>{formatTime(tx.createdAt)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground" data-testid="text-no-transactions">
                      {searchQuery ? "Aucune transaction ne correspond à votre recherche" : "Aucune transaction trouvée"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LogsSection() {
  const { data: logs, isLoading } = useQuery<any[]>({
    queryKey: ["/api/partner/logs"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="loading-logs">
        <h2 className="text-2xl font-bold">Journaux d'activité</h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="section-logs">
      <h2 className="text-2xl font-bold">Journaux d'activité</h2>
      {logs && logs.length > 0 ? (
        <div className="space-y-3">
          {logs.map((log: any, index: number) => (
            <Card key={log.id || index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Badge variant="secondary" data-testid={`badge-log-action-${index}`}>{log.action}</Badge>
                    <span className="text-sm truncate" data-testid={`text-log-details-${index}`}>{log.details}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                    <span data-testid={`text-log-date-${index}`}>
                      {log.createdAt ? new Date(log.createdAt).toLocaleString("fr-FR") : "-"}
                    </span>
                    {log.ip && <span data-testid={`text-log-ip-${index}`}>{log.ip}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground" data-testid="text-no-logs">
            Aucune activité enregistrée
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ApiKeysSection() {
  const { toast } = useToast();
  const [showSecret, setShowSecret] = useState(false);

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ["/api/partner/profile"],
  });

  const regenerateMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/partner/regenerate-keys"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner/profile"] });
      toast({ title: "Clés régénérées", description: "Vos nouvelles clés API ont été générées." });
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copié", description: `${label} copié dans le presse-papier.` });
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="loading-api-keys">
        <h2 className="text-2xl font-bold">Clés API & SDK</h2>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="section-api-keys">
      <h2 className="text-2xl font-bold">Clés API & SDK</h2>

      <Card>
        <CardHeader>
          <CardTitle>Vos clés d'API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Clé API</Label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={profile?.apiKey || ""}
                className="font-mono text-sm"
                data-testid="input-api-key"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => copyToClipboard(profile?.apiKey || "", "Clé API")}
                data-testid="button-copy-api-key"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Secret API</Label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                type={showSecret ? "text" : "password"}
                value={profile?.apiSecret || ""}
                className="font-mono text-sm"
                data-testid="input-api-secret"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => setShowSecret(!showSecret)}
                data-testid="button-toggle-secret"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => copyToClipboard(profile?.apiSecret || "", "Secret API")}
                data-testid="button-copy-api-secret"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="pt-2">
            <Button
              variant="destructive"
              onClick={() => regenerateMutation.mutate()}
              disabled={regenerateMutation.isPending}
              data-testid="button-regenerate-keys"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {regenerateMutation.isPending ? "Régénération..." : "Régénérer les clés"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentation SDK</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Initialiser un paiement</h4>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm" data-testid="code-init-payment">
{`const response = await fetch('https://api.sendavapay.com/api/v1/payment/init', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'VOTRE_CLE_API',
    'X-API-Secret': 'VOTRE_SECRET_API',
  },
  body: JSON.stringify({
    amount: 1000,
    currency: 'XOF',
    customerPhone: '+22890000000',
    description: 'Paiement test',
    callbackUrl: 'https://votre-site.com/callback',
  }),
});

const data = await response.json();
console.log(data);`}
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Vérifier le statut d'une transaction</h4>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm" data-testid="code-check-status">
{`const response = await fetch('https://api.sendavapay.com/api/v1/payment/status/{reference}', {
  method: 'GET',
  headers: {
    'X-API-Key': 'VOTRE_CLE_API',
    'X-API-Secret': 'VOTRE_SECRET_API',
  },
});

const data = await response.json();
console.log(data.status); // "completed" | "pending" | "failed"`}
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Webhook de notification</h4>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm" data-testid="code-webhook">
{`// Votre serveur recevra un POST sur votre webhookUrl
// avec le corps suivant :
{
  "event": "payment.completed",
  "reference": "TXN-XXXXXXXXXXXX",
  "amount": 1000,
  "currency": "XOF",
  "status": "completed",
  "customerPhone": "+22890000000",
  "timestamp": "2026-02-19T12:00:00Z"
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SupportSection() {
  return (
    <div className="space-y-6" data-testid="section-support">
      <h2 className="text-2xl font-bold">Support</h2>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Besoin d'aide immédiate ?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Notre équipe de support est disponible du lundi au samedi, de 8h à 20h.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <a href="https://wa.me/22892299772" target="_blank" rel="noopener noreferrer" className="block">
              <Button className="w-full bg-green-500 dark:bg-green-600" data-testid="button-support-whatsapp">
                <MessageSquare className="h-4 w-4 mr-2" />
                WhatsApp : +228 92 29 97 72
              </Button>
            </a>
            <a href="https://t.me/sendavapay" target="_blank" rel="noopener noreferrer" className="block">
              <Button className="w-full bg-blue-500 dark:bg-blue-600" data-testid="button-support-telegram">
                <MessageSquare className="h-4 w-4 mr-2" />
                Telegram : @sendavapay
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Nos coordonnées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm" data-testid="text-support-phone">+228 92 29 97 72</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm" data-testid="text-support-email">support@sendavapay.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a href="https://sendavapay.com" target="_blank" rel="noopener noreferrer" className="text-sm text-primary" data-testid="text-support-website">www.sendavapay.com</a>
            </div>
            <div className="mt-4 pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">Horaires du service client :</p>
              <p className="text-sm">Lundi - Vendredi : 8h00 - 20h00</p>
              <p className="text-sm">Samedi : 9h00 - 18h00</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              FAQ Partenaires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div data-testid="faq-item-1">
              <h4 className="font-semibold text-sm">Comment obtenir mes clés API ?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Rendez-vous dans la section "Clés API & SDK" de votre tableau de bord pour visualiser et copier vos clés.
              </p>
            </div>
            <div data-testid="faq-item-2">
              <h4 className="font-semibold text-sm">Comment configurer les webhooks ?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Dans votre profil, renseignez l'URL de votre webhook. Nous enverrons les notifications de paiement à cette adresse.
              </p>
            </div>
            <div data-testid="faq-item-3">
              <h4 className="font-semibold text-sm">Quels sont les frais de transaction ?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Votre taux de commission est défini lors de la création de votre compte partenaire. Contactez le support pour toute modification.
              </p>
            </div>
            <div data-testid="faq-item-4">
              <h4 className="font-semibold text-sm">Comment intégrer le SDK sur mon site ?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Consultez la section "Clés API & SDK" pour obtenir le code d'intégration et la documentation complète.
              </p>
            </div>
            <div data-testid="faq-item-5">
              <h4 className="font-semibold text-sm">En cas de problème technique urgent ?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Contactez-nous immédiatement via WhatsApp au +228 92 29 97 72. En dehors des heures de service, envoyez un email à support@sendavapay.com.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
