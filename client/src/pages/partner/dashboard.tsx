import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import logoPath from "@assets/20251211_105226_1765450558306.png";
import mtnLogo from "@assets/mtn_(1)_1763835082904-BVdEqpuz_1769443204393.png";
import moovLogo from "@assets/moov_(1)_1763835082986-GKkwwfPK_1769443204522.png";
import orangeLogo from "@assets/images_1769443862827.png";
import tmoneyLogo from "@assets/images_(1)_1769443862863.png";
import airtelLogo from "@assets/Airtel_logo-01_1769443862893.png";
import vodacomLogo from "@assets/vodacom_1769443862923.png";
import waveLogo from "@assets/images_(16)_1772485816419.jpeg";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import CountrySelect from "@/components/ui/country-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
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
  ArrowDownToLine,
  ArrowUpFromLine,
  Link2,
  ExternalLink,
  Info,
  Loader2,
  CheckCircle,
  XCircle,
  Wallet,
  Lock,
  Code,
  BookOpen,
  Terminal,
  Settings,
  ToggleLeft,
  Percent,
} from "lucide-react";

type Section = "dashboard" | "deposit" | "withdraw" | "payment-links" | "profile" | "transactions" | "logs" | "api-keys" | "sdk-docs" | "config" | "support" | "fees";

const operatorLogos: Record<string, string> = {
  "MTN": mtnLogo,
  "Moov": moovLogo,
  "Orange": orangeLogo,
  "TMoney": tmoneyLogo,
  "Airtel": airtelLogo,
  "Vodacom": vodacomLogo,
  "Wave": waveLogo,
};

const methodLogos: Record<string, string> = {
  mtn: mtnLogo,
  moov: moovLogo,
  orange: orangeLogo,
  tmoney: tmoneyLogo,
  "t-money": tmoneyLogo,
  airtel: airtelLogo,
  vodacom: vodacomLogo,
  wave: waveLogo,
};

const sidebarItems = [
  { key: "dashboard" as Section, icon: LayoutGrid, label: "Tableau de bord" },
  { key: "deposit" as Section, icon: ArrowDownToLine, label: "Dépôt" },
  { key: "withdraw" as Section, icon: ArrowUpFromLine, label: "Retrait" },
  { key: "payment-links" as Section, icon: Link2, label: "Liens de paiement" },
  { key: "profile" as Section, icon: UserCircle, label: "Mon Profil" },
  { key: "transactions" as Section, icon: CreditCard, label: "Transactions" },
  { key: "logs" as Section, icon: Clock, label: "Journaux" },
  { key: "api-keys" as Section, icon: KeyRound, label: "Clés API" },
  { key: "sdk-docs" as Section, icon: BookOpen, label: "Documentation SDK" },
  { key: "config" as Section, icon: Settings, label: "Configuration" },
  { key: "fees" as Section, icon: Percent, label: "Tarifs" },
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
            {activeSection === "deposit" && <PartnerDepositSection />}
            {activeSection === "withdraw" && <PartnerWithdrawSection partner={partner} />}
            {activeSection === "payment-links" && <PartnerPaymentLinksSection />}
            {activeSection === "profile" && <ProfileSection partner={partner} />}
            {activeSection === "transactions" && <TransactionsSection />}
            {activeSection === "logs" && <LogsSection />}
            {activeSection === "api-keys" && <ApiKeysSection />}
            {activeSection === "sdk-docs" && <SdkDocsSection />}
            {activeSection === "config" && <ConfigSection partner={partner} />}
            {activeSection === "fees" && <PartnerFeesSection />}
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

  const { data: partnerData } = useQuery<any>({
    queryKey: ["/api/partner/me"],
  });

  const formatBalance = (bal: string | number) => {
    const num = typeof bal === "string" ? parseFloat(bal) : bal;
    return new Intl.NumberFormat("fr-FR").format(num);
  };

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
      title: "Solde disponible",
      value: `${formatBalance(partnerData?.balance ?? 0)} FCFA`,
      icon: Wallet,
      testId: "stat-balance",
      highlight: true,
    },
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat: any) => (
          <Card key={stat.testId} className={stat.highlight ? "border-primary bg-primary/5" : ""}>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.highlight ? "text-primary" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.highlight ? "text-primary" : ""}`} data-testid={stat.testId}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface SoleasPayCountry {
  code: string;
  name: string;
  flag: string;
  currency: string;
}

interface SoleasPayService {
  id: number;
  name: string;
  description: string;
  country: string;
  countryCode: string;
  currency: string;
  operator: string;
  inMaintenance?: boolean;
  paymentGateway?: string;
}

const COUNTRY_PREFIXES: Record<string, string> = {
  CI: "+225", BJ: "+229", TG: "+228", BF: "+226",
  SN: "+221", CM: "+237", ML: "+223", GN: "+224",
  COG: "+242", COD: "+243",
};

const quickAmounts = [5000, 10000, 25000, 50000, 100000];

function PartnerDepositSection() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dépôt</h2>
        <p className="text-muted-foreground">Rechargement du compte partenaire</p>
      </div>
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
        <CardContent className="p-8 text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
            <Info className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-200">Rechargez via votre compte personnel</h3>
            <p className="text-blue-700 dark:text-blue-300 max-w-md mx-auto leading-relaxed">
              Bonjour ! Pour recharger votre compte partenaire, veuillez effectuer un dépôt sur votre compte personnel SendavaPay, puis utiliser la fonctionnalité de transfert dans la section <strong>Retrait</strong> pour transférer les fonds vers ce compte partenaire.
            </p>
          </div>
          <div className="rounded-lg bg-blue-100 dark:bg-blue-900/40 p-4 text-sm text-blue-700 dark:text-blue-300 text-left space-y-2">
            <p className="font-semibold">Étapes :</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Connectez-vous sur votre compte personnel SendavaPay</li>
              <li>Effectuez un dépôt Mobile Money sur votre compte personnel</li>
              <li>Revenez ici et utilisez "Retrait → Transférer vers compte personnel" (dans l'autre sens)</li>
            </ol>
          </div>
          <p className="text-xs text-blue-500 dark:text-blue-400">
            Cette procédure garantit la traçabilité et la sécurité de vos fonds.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


interface WithdrawCountry {
  id: string;
  name: string;
  currency: string;
  methods: { id: string; name: string; inMaintenance?: boolean }[];
}

const withdrawStatusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: "En attente", icon: Clock, color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30" },
  processing: { label: "En cours", icon: Loader2, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" },
  approved: { label: "Approuvé", icon: CheckCircle, color: "text-green-600 bg-green-100 dark:bg-green-900/30" },
  rejected: { label: "Rejeté", icon: XCircle, color: "text-red-600 bg-red-100 dark:bg-red-900/30" },
  failed: { label: "Échoué", icon: XCircle, color: "text-red-600 bg-red-100 dark:bg-red-900/30" },
  completed: { label: "Complété", icon: CheckCircle, color: "text-green-600 bg-green-100 dark:bg-green-900/30" },
};

function PartnerWithdrawSection({ partner }: { partner: any }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [transferSuccess, setTransferSuccess] = useState<{ message: string; amount: number } | null>(null);

  const balance = parseFloat(partner?.balance || "0");
  const numericAmount = parseFloat(amount) || 0;
  const minTransfer = 500;

  const transferMutation = useMutation({
    mutationFn: async (data: { amount: number; accountIdentifier: string }) => {
      const res = await apiRequest("POST", "/api/partner/transfer-to-personal", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setTransferSuccess({ message: data.message, amount: numericAmount });
      queryClient.invalidateQueries({ queryKey: ["/api/partner/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner/stats"] });
      setAmount("");
      setAccountIdentifier("");
    },
    onError: (error: Error) => {
      toast({ title: "Transfert échoué", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount < minTransfer) {
      toast({ title: "Montant insuffisant", description: `Minimum: ${minTransfer.toLocaleString()} FCFA`, variant: "destructive" });
      return;
    }
    if (numericAmount > balance) {
      toast({ title: "Solde insuffisant", description: "Vous n'avez pas assez de fonds.", variant: "destructive" });
      return;
    }
    if (!accountIdentifier.trim()) {
      toast({ title: "Identifiant requis", description: "Entrez l'email ou le téléphone de votre compte personnel.", variant: "destructive" });
      return;
    }
    transferMutation.mutate({ amount: numericAmount, accountIdentifier });
  };

  if (transferSuccess) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Retrait</h2>
          <p className="text-muted-foreground">Transférer vers compte personnel</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center space-y-5">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-green-600">Transfert effectué !</h3>
              <p className="text-muted-foreground">{transferSuccess.message}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              <p className="font-medium">Prochaine étape :</p>
              <p>Connectez-vous sur votre compte personnel SendavaPay et effectuez un retrait Mobile Money.</p>
            </div>
            <Button onClick={() => setTransferSuccess(null)} data-testid="button-partner-transfer-new">
              Nouveau transfert
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Retrait</h2>
        <p className="text-muted-foreground">Transférez votre solde vers votre compte personnel</p>
      </div>

      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-6">
          <p className="text-sm opacity-80">Solde disponible</p>
          <p className="text-3xl font-bold mt-1" data-testid="text-partner-balance">{balance.toLocaleString()} FCFA</p>
        </CardContent>
      </Card>

      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Pour retirer de l'argent, transférez d'abord votre solde partenaire vers votre compte personnel SendavaPay, puis effectuez un retrait Mobile Money depuis votre compte personnel.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transférer vers compte personnel</CardTitle>
          <CardDescription>Minimum: {minTransfer.toLocaleString()} FCFA. Le transfert est instantané.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <Label>Montant à transférer (FCFA)</Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => setAmount(Math.floor(balance).toString())} data-testid="button-partner-transfer-max">
                  Tout: {balance.toLocaleString()} FCFA
                </Button>
              </div>
              <Input
                type="number"
                placeholder="Entrez le montant"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-2xl h-14 font-semibold"
                min={minTransfer}
                max={balance}
                data-testid="input-partner-transfer-amount"
              />
            </div>

            {numericAmount > 0 && (
              <Card className="bg-muted/50 border-none">
                <CardContent className="p-4">
                  <div className="flex justify-between font-semibold">
                    <span>Montant transféré</span>
                    <span className="text-green-600">{numericAmount.toLocaleString()} FCFA</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Aucun frais — transfert interne SendavaPay</p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label>Compte personnel de destination</Label>
              <Input
                type="text"
                placeholder="Email ou téléphone de votre compte personnel"
                value={accountIdentifier}
                onChange={(e) => setAccountIdentifier(e.target.value)}
                data-testid="input-partner-transfer-account"
              />
              <p className="text-xs text-muted-foreground">
                Entrez l'email ou le numéro de téléphone associé à votre compte personnel SendavaPay.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={transferMutation.isPending || numericAmount < minTransfer || numericAmount > balance || !accountIdentifier.trim()}
              data-testid="button-partner-transfer-submit"
            >
              {transferMutation.isPending
                ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Transfert en cours...</>)
                : `Transférer ${numericAmount > 0 ? numericAmount.toLocaleString() + " FCFA" : ""} vers mon compte personnel`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function PartnerPaymentLinksSection() {
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [allowCustomAmount, setAllowCustomAmount] = useState(false);
  const [minimumAmount, setMinimumAmount] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");

  const { data: links = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/partner/payment-links"],
  });

  const { data: commissionRates } = useQuery<{ depositRate: number; withdrawalRate: number; encaissementRate: number }>({
    queryKey: ["/api/partner/commission-rates"],
  });
  const encaissementRate = commissionRates?.encaissementRate ?? 5;

  const createLinkMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/partner/payment-links", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Lien créé", description: "Votre lien de paiement a été créé avec succès." });
      queryClient.invalidateQueries({ queryKey: ["/api/partner/payment-links"] });
      setShowCreate(false);
      setTitle(""); setDescription(""); setAmount(""); setAllowCustomAmount(false); setMinimumAmount(""); setRedirectUrl("");
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    const numericMinAmount = minimumAmount ? parseFloat(minimumAmount) : null;

    if (!title.trim()) {
      toast({ title: "Titre requis", description: "Veuillez saisir un titre.", variant: "destructive" });
      return;
    }
    if (!allowCustomAmount && (isNaN(numericAmount) || numericAmount < 100)) {
      toast({ title: "Montant invalide", description: "Montant minimum: 100 FCFA", variant: "destructive" });
      return;
    }

    createLinkMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      amount: allowCustomAmount ? (numericMinAmount || 100) : numericAmount,
      allowCustomAmount,
      minimumAmount: allowCustomAmount && numericMinAmount ? numericMinAmount : undefined,
      redirectUrl: redirectUrl.trim() || undefined,
    });
  };

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`https://sendavapay.com/pay/${code}`);
    toast({ title: "Lien copié", description: "Le lien a été copié dans le presse-papiers." });
  };

  if (showCreate) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)} data-testid="button-partner-back-links">
            <X className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Créer un lien de paiement</h2>
            <p className="text-muted-foreground">Créez un lien personnalisé pour recevoir des paiements</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" />Nouveau lien</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Titre du produit/service *</Label>
                <Input placeholder="Ex: Consultation, Produit X..." value={title} onChange={(e) => setTitle(e.target.value)} data-testid="input-partner-link-title" />
              </div>

              <div className="space-y-2">
                <Label>Description (optionnel)</Label>
                <Textarea placeholder="Détails supplémentaires..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} data-testid="input-partner-link-desc" />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-md bg-muted/30">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium cursor-pointer">Le client choisit le montant</Label>
                  <p className="text-xs text-muted-foreground">Permettre au client de saisir son montant</p>
                </div>
                <Switch checked={allowCustomAmount} onCheckedChange={setAllowCustomAmount} data-testid="switch-partner-custom-amount" />
              </div>

              {allowCustomAmount ? (
                <div className="space-y-2">
                  <Label>Montant minimum (FCFA)</Label>
                  <Input type="number" placeholder="Ex: 1000 (minimum 100)" value={minimumAmount} onChange={(e) => setMinimumAmount(e.target.value)} min="100" data-testid="input-partner-min-amount" />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Montant à payer (FCFA) *</Label>
                  <Input type="number" placeholder="Ex: 10000" value={amount} onChange={(e) => setAmount(e.target.value)} min="100" data-testid="input-partner-link-amount" />
                </div>
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-2"><ExternalLink className="h-4 w-4" />URL de redirection (optionnel)</Label>
                <Input type="url" placeholder="https://example.com/merci" value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} data-testid="input-partner-redirect" />
              </div>

              <div className="rounded-md bg-muted/50 p-4">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Des frais d'encaissement de {encaissementRate}% seront appliqués sur chaque paiement.</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreate(false)} data-testid="button-partner-cancel-link">Annuler</Button>
                <Button type="submit" className="flex-1" disabled={createLinkMutation.isPending} data-testid="button-partner-submit-link">
                  {createLinkMutation.isPending ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Création...</>) : "Créer le lien"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold">Liens de paiement</h2>
          <p className="text-muted-foreground">Gérez vos liens de paiement personnalisés</p>
        </div>
        <Button onClick={() => setShowCreate(true)} data-testid="button-partner-create-link">
          <Link2 className="h-4 w-4 mr-2" />
          Créer un lien
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : links.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun lien de paiement</h3>
            <p className="text-muted-foreground mb-4">Créez votre premier lien pour commencer à recevoir des paiements.</p>
            <Button onClick={() => setShowCreate(true)} data-testid="button-partner-create-first-link">Créer un lien</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {links.map((link: any) => (
            <Card key={link.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{link.title}</h3>
                    <p className="text-sm text-muted-foreground">{parseFloat(link.amount).toLocaleString()} FCFA</p>
                    {link.allowCustomAmount && <Badge variant="secondary">Montant libre</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyLink(link.linkCode)} data-testid={`button-copy-link-${link.id}`}>
                      <Copy className="h-3 w-3 mr-1" />
                      Copier
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => window.open(`/pay/${link.linkCode}`, "_blank")} data-testid={`button-open-link-${link.id}`}>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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

      <ChangePasswordCard />
    </div>
  );
}

function ChangePasswordCard() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      apiRequest("POST", "/api/partner/change-password", data),
    onSuccess: () => {
      toast({ title: "Mot de passe modifié", description: "Votre mot de passe a été mis à jour avec succès." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Erreur", description: "Le nouveau mot de passe doit contenir au moins 6 caractères.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <Card data-testid="card-change-password">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Modifier le mot de passe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Mot de passe actuel</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              data-testid="input-current-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0"
              onClick={() => setShowCurrent(!showCurrent)}
              data-testid="button-toggle-current-password"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">Nouveau mot de passe</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              data-testid="input-new-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0"
              onClick={() => setShowNew(!showNew)}
              data-testid="button-toggle-new-password"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              data-testid="input-confirm-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0"
              onClick={() => setShowConfirm(!showConfirm)}
              data-testid="button-toggle-confirm-password"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSubmit}
            disabled={changePasswordMutation.isPending}
            data-testid="button-change-password"
          >
            <Lock className="h-4 w-4 mr-2" />
            {changePasswordMutation.isPending ? "Modification..." : "Modifier le mot de passe"}
          </Button>
        </div>
      </CardContent>
    </Card>
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

    </div>
  );
}

const ALL_COUNTRIES = [
  { code: "BJ", name: "Bénin", currency: "XOF" },
  { code: "BF", name: "Burkina Faso", currency: "XOF" },
  { code: "CM", name: "Cameroun", currency: "XAF" },
  { code: "CI", name: "Côte d'Ivoire", currency: "XOF" },
  { code: "COG", name: "Congo Brazzaville", currency: "XAF" },
  { code: "COD", name: "RDC", currency: "CDF" },
  { code: "TG", name: "Togo", currency: "XOF" },
];

const ALL_OPERATORS = [
  { code: "MTN", name: "MTN Mobile Money", countries: ["BJ", "CM", "CI", "COG"] },
  { code: "Moov", name: "Moov Money", countries: ["BJ", "BF", "CI", "TG"] },
  { code: "Orange", name: "Orange Money", countries: ["BF", "CM", "CI", "COD"] },
  { code: "TMoney", name: "T-Money", countries: ["TG"] },
  { code: "Wave", name: "Wave", countries: ["CI"] },
  { code: "Vodacom", name: "Vodacom M-Pesa", countries: ["COD"] },
  { code: "Airtel", name: "Airtel Money", countries: ["COD", "COG"] },
];

function ConfigSection({ partner }: { partner: any }) {
  const { toast } = useToast();

  const parseJsonArray = (val: string | null | undefined): string[] => {
    if (!val) return [];
    try { return JSON.parse(val); } catch { return []; }
  };

  const savedCountries = parseJsonArray(partner.allowedCountries);
  const savedOperators = parseJsonArray(partner.allowedOperators);

  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    savedCountries.length > 0 ? savedCountries : ALL_COUNTRIES.map(c => c.code)
  );
  const [selectedOperators, setSelectedOperators] = useState<string[]>(
    savedOperators.length > 0 ? savedOperators : ALL_OPERATORS.map(o => o.code)
  );

  const configMutation = useMutation({
    mutationFn: async (data: { allowedCountries: string[]; allowedOperators: string[] }) => {
      await apiRequest("PATCH", "/api/partner/config", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner/me"] });
      toast({ title: "Configuration sauvegardée", description: "Vos préférences de pays et opérateurs ont été mises à jour." });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message || "Échec de la sauvegarde", variant: "destructive" });
    },
  });

  const toggleCountry = (code: string) => {
    setSelectedCountries(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const toggleOperator = (code: string) => {
    setSelectedOperators(prev =>
      prev.includes(code) ? prev.filter(o => o !== code) : [...prev, code]
    );
  };

  const availableOperators = ALL_OPERATORS.filter(op =>
    op.countries.some(c => selectedCountries.includes(c))
  );

  const handleSave = () => {
    configMutation.mutate({
      allowedCountries: selectedCountries,
      allowedOperators: selectedOperators,
    });
  };

  return (
    <div className="space-y-6" data-testid="section-config">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold">Configuration</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Choisissez les pays et modes de paiement disponibles sur votre site
          </p>
        </div>
        <Button onClick={handleSave} disabled={configMutation.isPending} data-testid="button-save-config">
          {configMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Sauvegarder
        </Button>
      </div>

      {!partner.enableDeposit && !partner.enableWithdrawal && !partner.enablePaymentLinks && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Toutes les fonctions API sont désactivées par l'administrateur. Contactez le support pour les activer.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ToggleLeft className="h-5 w-5" />
            Fonctions API
          </CardTitle>
          <CardDescription>
            Fonctions activées par l'administrateur pour votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center justify-between p-3 rounded-md border">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="h-4 w-4" />
                <span className="text-sm font-medium">Encaissement</span>
              </div>
              <Badge variant={partner.enableDeposit ? "default" : "secondary"}>
                {partner.enableDeposit ? "Actif" : "Désactivé"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md border">
              <div className="flex items-center gap-2">
                <ArrowUpFromLine className="h-4 w-4" />
                <span className="text-sm font-medium">Retrait</span>
              </div>
              <Badge variant={partner.enableWithdrawal ? "default" : "secondary"}>
                {partner.enableWithdrawal ? "Actif" : "Désactivé"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md border">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                <span className="text-sm font-medium">Liens de paiement</span>
              </div>
              <Badge variant={partner.enablePaymentLinks ? "default" : "secondary"}>
                {partner.enablePaymentLinks ? "Actif" : "Désactivé"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Pays disponibles
          </CardTitle>
          <CardDescription>
            Sélectionnez les pays que vous souhaitez afficher sur votre page de paiement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_COUNTRIES.map(country => (
              <div
                key={country.code}
                className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${
                  selectedCountries.includes(country.code) ? "border-primary bg-primary/5" : "opacity-60"
                }`}
                onClick={() => toggleCountry(country.code)}
                data-testid={`toggle-country-${country.code}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{country.name}</span>
                  <Badge variant="secondary" className="text-xs">{country.currency}</Badge>
                </div>
                <Switch
                  checked={selectedCountries.includes(country.code)}
                  onCheckedChange={() => toggleCountry(country.code)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Modes de paiement
          </CardTitle>
          <CardDescription>
            Sélectionnez les opérateurs de paiement mobile à afficher
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {availableOperators.map(op => {
              const logo = operatorLogos[op.code];
              return (
                <div
                  key={op.code}
                  className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${
                    selectedOperators.includes(op.code) ? "border-primary bg-primary/5" : "opacity-60"
                  }`}
                  onClick={() => toggleOperator(op.code)}
                  data-testid={`toggle-operator-${op.code}`}
                >
                  <div className="flex items-center gap-2">
                    {logo && <img src={logo} alt={op.name} className="h-6 w-6 object-contain" />}
                    <span className="text-sm font-medium">{op.name}</span>
                  </div>
                  <Switch
                    checked={selectedOperators.includes(op.code)}
                    onCheckedChange={() => toggleOperator(op.code)}
                  />
                </div>
              );
            })}
          </div>
          {availableOperators.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sélectionnez au moins un pays pour voir les opérateurs disponibles
            </p>
          )}
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
              <a href="https://SendavaPay.com" target="_blank" rel="noopener noreferrer" className="text-sm text-primary" data-testid="text-support-website">https://SendavaPay.com</a>
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

function SdkDocsSection() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"javascript" | "php" | "python">("javascript");

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copié", description: "Code copié dans le presse-papiers." });
  };

  const baseUrl = window.location.origin;

  const jsInstall = `npm install node-fetch`;
  const jsExample = `import SendavaPay from "./sendavapay.js";

const client = new SendavaPay(
  "VOTRE_API_KEY",
  "VOTRE_API_SECRET",
  "${baseUrl}"
);

// 1. Collecter un paiement (USSD direct au téléphone du client)
const payment = await client.createPayment({
  amount: 5000,
  phoneNumber: "+22890123456",  // Numéro du client
  operator: "TMoney",           // MTN, Moov, Orange, TMoney, Wave...
  country: "TG",                // TG, BJ, BF, CM, CI, COD, COG
  customerName: "Jean Dupont",
  description: "Achat produit",
  callbackUrl: "https://votre-site.com/callback"
});
// { success: true, status: "PROCESSING", reference: "PTR_..." }

// 2. Attendre la confirmation (polling automatique)
const result = await client.waitForPayment(payment.reference);
if (result.status === "SUCCESS") {
  console.log("Paiement confirmé !");
}

// Ou vérifier manuellement
const status = await client.verifyPayment(payment.reference);

// 3. Retrait vers Mobile Money
const withdraw = await client.createWithdraw({
  amount: 3000,
  phoneNumber: "+22890123456",
  operator: "TMoney",
  country: "TG"
});

// 4. Solde et transactions
const balance = await client.getBalance();
const transactions = await client.getTransactions();`;

  const phpExample = `<?php
require_once "SendavaPay.php";

$client = new SendavaPay(
  "VOTRE_API_KEY",
  "VOTRE_API_SECRET",
  "${baseUrl}"
);

// 1. Collecter un paiement (USSD direct au téléphone du client)
$payment = $client->createPayment([
  "amount" => 5000,
  "phoneNumber" => "+22890123456",  // Numéro du client
  "operator" => "TMoney",           // MTN, Moov, Orange, TMoney, Wave...
  "country" => "TG",                // TG, BJ, BF, CM, CI, COD, COG
  "customerName" => "Jean Dupont",
  "description" => "Achat produit",
]);
// ["success" => true, "status" => "PROCESSING", "reference" => "PTR_..."]

// 2. Attendre la confirmation (polling automatique)
$result = $client->waitForPayment($payment["reference"]);
if ($result["status"] === "SUCCESS") {
    echo "Paiement confirmé !";
}

// 3. Retrait vers Mobile Money
$withdraw = $client->createWithdraw([
  "amount" => 3000,
  "phoneNumber" => "+22890123456",
  "operator" => "TMoney",
  "country" => "TG"
]);

// 4. Solde et transactions
$balance = $client->getBalance();
$transactions = $client->getTransactions();
?>`;

  const pyExample = `from sendavapay import SendavaPay

client = SendavaPay(
    api_key="VOTRE_API_KEY",
    api_secret="VOTRE_API_SECRET",
    base_url="${baseUrl}"
)

# 1. Collecter un paiement (USSD direct au téléphone du client)
payment = client.create_payment(
    amount=5000,
    phone_number="+22890123456",  # Numéro du client
    operator="TMoney",            # MTN, Moov, Orange, TMoney, Wave...
    country="TG",                 # TG, BJ, BF, CM, CI, COD, COG
    customer_name="Jean Dupont",
    description="Achat produit",
)
# {"success": True, "status": "PROCESSING", "reference": "PTR_..."}

# 2. Attendre la confirmation (polling automatique)
result = client.wait_for_payment(payment["reference"])
if result["status"] == "SUCCESS":
    print("Paiement confirmé !")

# 3. Retrait vers Mobile Money
withdraw = client.create_withdraw(
    amount=3000,
    phone_number="+22890123456",
    operator="TMoney",
    country="TG"
)

# 4. Solde et transactions
balance = client.get_balance()
transactions = client.get_transactions()`;

  const hmacExplanation = `// Chaque requête est signée avec HMAC-SHA256
// Le SDK le fait automatiquement pour vous.
//
// Headers envoyés :
//   x-api-key: VOTRE_API_KEY
//   x-signature: HMAC-SHA256(API_SECRET, JSON.stringify(payload))
//
// Le serveur vérifie la signature avant d'exécuter la requête.
// Cela garantit que seul le détenteur du secret peut faire des appels.`;

  const endpoints = [
    { method: "POST", path: "/api/sdk/payment", desc: "Collecter un paiement (USSD direct)" },
    { method: "POST", path: "/api/sdk/withdraw", desc: "Effectuer un retrait" },
    { method: "POST", path: "/api/sdk/verify", desc: "Vérifier / confirmer un paiement" },
    { method: "GET", path: "/api/sdk/transaction/:id", desc: "Consulter une transaction" },
    { method: "GET", path: "/api/sdk/transactions", desc: "Lister les transactions" },
    { method: "GET", path: "/api/sdk/balance", desc: "Consulter le solde" },
  ];

  const responseExample = `{
  "success": true,
  "status": "SUCCESS",
  "txid": "PTR_A1B2C3D4E5F6G7H8",
  "reference": "PTR_A1B2C3D4E5F6G7H8",
  "amount": "5000",
  "fee": "250",
  "currency": "XOF",
  "message": "Paiement validé"
}`;

  const countriesOperators = [
    { country: "B\u00e9nin", code: "BJ", currency: "XOF", operators: [{ name: "MTN", value: "MTN" }, { name: "Moov", value: "Moov" }] },
    { country: "Burkina Faso", code: "BF", currency: "XOF", operators: [{ name: "Moov", value: "Moov" }, { name: "Orange", value: "Orange" }] },
    { country: "Togo", code: "TG", currency: "XOF", operators: [{ name: "T-Money", value: "TMoney" }, { name: "Moov", value: "Moov" }] },
    { country: "Cameroun", code: "CM", currency: "XAF", operators: [{ name: "MTN", value: "MTN" }, { name: "Orange", value: "Orange" }] },
    { country: "C\u00f4te d'Ivoire", code: "CI", currency: "XOF", operators: [{ name: "Orange", value: "Orange" }, { name: "MTN", value: "MTN" }, { name: "Moov", value: "Moov" }, { name: "Wave", value: "Wave" }] },
    { country: "RDC", code: "COD", currency: "CDF", operators: [{ name: "Vodacom", value: "Vodacom" }, { name: "Airtel", value: "Airtel" }, { name: "Orange", value: "Orange" }] },
    { country: "Congo Brazzaville", code: "COG", currency: "XAF", operators: [{ name: "Airtel", value: "Airtel" }, { name: "MTN", value: "MTN" }] },
  ];

  const tabs = [
    { key: "javascript" as const, label: "JavaScript (Node.js)" },
    { key: "php" as const, label: "PHP" },
    { key: "python" as const, label: "Python" },
  ];

  return (
    <div className="space-y-6" data-testid="section-sdk-docs">
      <div>
        <h2 className="text-2xl font-bold">Documentation SDK</h2>
        <p className="text-muted-foreground mt-1">
          Intégrez SendavaPay directement sur votre site web en mode white-label.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            URL de base de l'API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted px-3 py-2 rounded-md text-sm font-mono" data-testid="text-sdk-base-url">{baseUrl}</code>
            <Button size="icon" variant="outline" onClick={() => copyCode(baseUrl)} data-testid="button-copy-base-url">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Authentification HMAC-SHA256
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Toutes les requêtes sont signées avec HMAC-SHA256 pour garantir la sécurité. Les SDK gèrent automatiquement la signature.
          </p>
          <div className="relative">
            <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto font-mono whitespace-pre-wrap" data-testid="code-hmac-explanation">{hmacExplanation}</pre>
            <Button size="icon" variant="ghost" className="absolute top-2 right-2" onClick={() => copyCode(hmacExplanation)} data-testid="button-copy-hmac">
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Endpoints disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {endpoints.map((ep, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b last:border-b-0" data-testid={`endpoint-${i}`}>
                <Badge className={ep.method === "POST" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}>
                  {ep.method}
                </Badge>
                <code className="text-sm font-mono flex-1">{ep.path}</code>
                <span className="text-sm text-muted-foreground">{ep.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Pays et op\u00e9rateurs disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Voici les valeurs exactes \u00e0 utiliser pour les param\u00e8tres <code className="bg-muted px-1 rounded">country</code> et <code className="bg-muted px-1 rounded">operator</code> dans vos appels API.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-countries-operators">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium">Pays</th>
                  <th className="text-left py-2 pr-4 font-medium">Code pays</th>
                  <th className="text-left py-2 pr-4 font-medium">Devise</th>
                  <th className="text-left py-2 font-medium">Op\u00e9rateurs (valeur \u00e0 envoyer)</th>
                </tr>
              </thead>
              <tbody>
                {countriesOperators.map((c) => (
                  <tr key={c.code} className="border-b last:border-b-0" data-testid={`row-country-${c.code}`}>
                    <td className="py-2 pr-4">{c.country}</td>
                    <td className="py-2 pr-4">
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{c.code}</code>
                    </td>
                    <td className="py-2 pr-4">
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{c.currency}</code>
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1.5">
                        {c.operators.map((op) => (
                          <span key={op.value} className="inline-flex items-center gap-1">
                            <span className="text-muted-foreground">{op.name}:</span>
                            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{op.value}</code>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground">
              <strong>Exemple :</strong> Pour un paiement MTN au B\u00e9nin, utilisez <code className="px-1 rounded bg-background">country: "BJ"</code> et <code className="px-1 rounded bg-background">operator: "MTN"</code>.
              Le num\u00e9ro de t\u00e9l\u00e9phone peut inclure l'indicatif pays (ex: +22990123456) ou \u00eatre au format local (ex: 90123456).
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Exemples d'int\u00e9gration
          </CardTitle>
          <div className="flex gap-2 mt-2 flex-wrap">
            {tabs.map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(tab.key)}
                data-testid={`button-tab-${tab.key}`}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === "javascript" && (
            <div className="space-y-4" data-testid="code-example-javascript">
              <div>
                <p className="text-sm font-medium mb-2">1. Téléchargez le fichier SDK :</p>
                <code className="bg-muted px-3 py-2 rounded-md text-sm font-mono block">sendavapay.js</code>
              </div>
              <div className="relative">
                <p className="text-sm font-medium mb-2">2. Utilisation :</p>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto font-mono whitespace-pre-wrap">{jsExample}</pre>
                <Button size="icon" variant="ghost" className="absolute top-8 right-2" onClick={() => copyCode(jsExample)} data-testid="button-copy-js">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
          {activeTab === "php" && (
            <div className="space-y-4" data-testid="code-example-php">
              <div>
                <p className="text-sm font-medium mb-2">1. Téléchargez le fichier SDK :</p>
                <code className="bg-muted px-3 py-2 rounded-md text-sm font-mono block">SendavaPay.php</code>
              </div>
              <div className="relative">
                <p className="text-sm font-medium mb-2">2. Utilisation :</p>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto font-mono whitespace-pre-wrap">{phpExample}</pre>
                <Button size="icon" variant="ghost" className="absolute top-8 right-2" onClick={() => copyCode(phpExample)} data-testid="button-copy-php">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
          {activeTab === "python" && (
            <div className="space-y-4" data-testid="code-example-python">
              <div>
                <p className="text-sm font-medium mb-2">1. Installation :</p>
                <code className="bg-muted px-3 py-2 rounded-md text-sm font-mono block">pip install requests</code>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">2. Téléchargez le fichier SDK :</p>
                <code className="bg-muted px-3 py-2 rounded-md text-sm font-mono block">sendavapay.py</code>
              </div>
              <div className="relative">
                <p className="text-sm font-medium mb-2">3. Utilisation :</p>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto font-mono whitespace-pre-wrap">{pyExample}</pre>
                <Button size="icon" variant="ghost" className="absolute top-8 right-2" onClick={() => copyCode(pyExample)} data-testid="button-copy-python">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Format de réponse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Toutes les réponses de l'API suivent le format JSON suivant :
          </p>
          <div className="relative">
            <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto font-mono whitespace-pre-wrap" data-testid="code-response-format">{responseExample}</pre>
            <Button size="icon" variant="ghost" className="absolute top-2 right-2" onClick={() => copyCode(responseExample)} data-testid="button-copy-response">
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Statuts possibles :</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">PENDING</Badge>
                  <span className="text-sm text-muted-foreground">En attente</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">PROCESSING</Badge>
                  <span className="text-sm text-muted-foreground">En cours</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">SUCCESS</Badge>
                  <span className="text-sm text-muted-foreground">Réussi</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">FAILED</Badge>
                  <span className="text-sm text-muted-foreground">Échoué</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">CANCELLED</Badge>
                  <span className="text-sm text-muted-foreground">Annulé</span>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Devises supportées :</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>XOF - Franc CFA (UEMOA)</p>
                <p>XAF - Franc CFA (CEMAC)</p>
                <p>CDF - Franc congolais</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tarifs par pays ──────────────────────────────────────────────────────────

const FEE_LOGO_MAP: Record<string, string> = {
  "mtn.png": mtnLogo,
  "moov.png": moovLogo,
  "orange.png": orangeLogo,
  "tmoney.png": tmoneyLogo,
  "t-money.png": tmoneyLogo,
  "airtel.png": airtelLogo,
  "vodacom.png": vodacomLogo,
  "wave.png": orangeLogo,
};

const COUNTRY_FLAG: Record<string, string> = {
  BJ: "🇧🇯", BF: "🇧🇫", CM: "🇨🇲", COG: "🇨🇬", CI: "🇨🇮",
  ML: "🇲🇱", COD: "🇨🇩", SN: "🇸🇳", TG: "🇹🇬",
};

interface PublicFeesCountry {
  id: number;
  code: string;
  name: string;
  currency: string;
  depositFee: number;
  withdrawFee: number;
  encaissementFee: number;
  operators: { id: number; name: string; logo: string | null; inMaintenance: boolean }[];
}

interface PublicFeesData {
  countries: PublicFeesCountry[];
  global: { depositFee: number; withdrawFee: number; encaissementFee: number };
}

function PartnerFeesSection() {
  const [selectedCountry, setSelectedCountry] = useState(0);

  const { data, isLoading } = useQuery<PublicFeesData>({
    queryKey: ["/api/public/fees"],
    queryFn: async () => {
      const res = await fetch("/api/public/fees");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const countries = data?.countries ?? [];
  const current = countries[selectedCountry];

  return (
    <div className="space-y-6 p-6" data-testid="section-fees">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Percent className="h-6 w-6" />
          Tarifs par opérateur
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Frais configurés par l'administrateur pour chaque pays et opérateur.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : countries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">Aucune donnée disponible.</div>
      ) : (
        <>
          {/* Onglets par pays */}
          <div className="flex flex-wrap gap-2">
            {countries.map((country, idx) => (
              <button
                key={country.id}
                data-testid={`tab-fees-country-${country.code}`}
                onClick={() => setSelectedCountry(idx)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  selectedCountry === idx
                    ? "bg-primary text-primary-foreground border-primary shadow"
                    : "bg-background border-border hover:border-primary/40 hover:bg-primary/5"
                }`}
              >
                <span className="text-base leading-none">{COUNTRY_FLAG[country.code] ?? "🌍"}</span>
                <span>{country.name}</span>
                <span className="text-xs opacity-60">{country.currency}</span>
              </button>
            ))}
          </div>

          {/* Cartes opérateurs */}
          {current && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {current.operators.map((op) => {
                const logo = op.logo ? FEE_LOGO_MAP[op.logo] ?? null : null;
                return (
                  <Card
                    key={op.id}
                    data-testid={`card-fees-operator-${op.id}`}
                    className={`transition-all ${op.inMaintenance ? "opacity-50 grayscale" : "hover:shadow-md"}`}
                  >
                    <CardContent className="p-5 flex flex-col gap-4">
                      {/* En-tête opérateur */}
                      <div className="flex items-center gap-3">
                        {logo ? (
                          <img src={logo} alt={op.name} className="h-10 w-10 object-contain flex-shrink-0" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base flex-shrink-0">
                            {op.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{op.name}</p>
                          {op.inMaintenance ? (
                            <span className="text-xs text-orange-500">En maintenance</span>
                          ) : (
                            <span className="text-xs text-green-600 dark:text-green-400">Disponible</span>
                          )}
                        </div>
                      </div>

                      {/* Pay In / Pay Out */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 p-3 text-center">
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Pay In</p>
                          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{current.depositFee}%</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Dépôt</p>
                        </div>
                        <div className="rounded-xl bg-orange-50 dark:bg-orange-950/40 p-3 text-center">
                          <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">Pay Out</p>
                          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{current.withdrawFee}%</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Retrait</p>
                        </div>
                      </div>

                      {/* Encaissement */}
                      <div className="rounded-xl bg-green-50 dark:bg-green-950/40 p-3 text-center">
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Encaissement (lien)</p>
                        <p className="text-xl font-bold text-green-700 dark:text-green-300">{current.encaissementFee}%</p>
                      </div>

                      <p className="text-xs text-center text-muted-foreground">{current.currency}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
