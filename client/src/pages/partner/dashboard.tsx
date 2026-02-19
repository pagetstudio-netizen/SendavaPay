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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";

type Section = "dashboard" | "deposit" | "withdraw" | "payment-links" | "profile" | "transactions" | "logs" | "api-keys" | "support";

const operatorLogos: Record<string, string> = {
  "MTN": mtnLogo,
  "Moov": moovLogo,
  "Orange": orangeLogo,
  "TMoney": tmoneyLogo,
  "Airtel": airtelLogo,
  "Vodacom": vodacomLogo,
  "Wave": orangeLogo,
};

const methodLogos: Record<string, string> = {
  mtn: mtnLogo,
  moov: moovLogo,
  orange: orangeLogo,
  tmoney: tmoneyLogo,
  "t-money": tmoneyLogo,
  airtel: airtelLogo,
  vodacom: vodacomLogo,
  wave: orangeLogo,
};

const sidebarItems = [
  { key: "dashboard" as Section, icon: LayoutGrid, label: "Tableau de bord" },
  { key: "deposit" as Section, icon: ArrowDownToLine, label: "Dépôt" },
  { key: "withdraw" as Section, icon: ArrowUpFromLine, label: "Retrait" },
  { key: "payment-links" as Section, icon: Link2, label: "Liens de paiement" },
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
            {activeSection === "deposit" && <PartnerDepositSection />}
            {activeSection === "withdraw" && <PartnerWithdrawSection partner={partner} />}
            {activeSection === "payment-links" && <PartnerPaymentLinksSection />}
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
}

const quickAmounts = [5000, 10000, 25000, 50000, 100000];

function PartnerDepositSection() {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "pending" | "completed" | "failed">("idle");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [currentPayId, setCurrentPayId] = useState("");
  const [currentOrderId, setCurrentOrderId] = useState("");
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollingAttemptsRef = useRef(0);
  const maxPollingAttempts = 40;

  const { data: countries = [] } = useQuery<SoleasPayCountry[]>({
    queryKey: ["/api/partner/deposit/countries"],
  });

  const { data: services = [] } = useQuery<SoleasPayService[]>({
    queryKey: ["/api/partner/deposit/services", selectedCountry],
    queryFn: async () => {
      const res = await fetch(`/api/partner/deposit/services/${selectedCountry}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
    },
    enabled: !!selectedCountry,
  });

  const { data: commissionRates } = useQuery<{ depositRate: number; withdrawalRate: number; encaissementRate: number }>({
    queryKey: ["/api/partner/commission-rates"],
  });

  useEffect(() => {
    if (countries.length > 0 && !selectedCountry) {
      setSelectedCountry(countries[0].code);
    }
  }, [countries, selectedCountry]);

  useEffect(() => {
    if (services.length > 0 && (!selectedServiceId || !services.find(s => s.id.toString() === selectedServiceId))) {
      const availableService = services.find(s => !s.inMaintenance);
      if (availableService) setSelectedServiceId(availableService.id.toString());
      else setSelectedServiceId("");
    }
  }, [services, selectedServiceId]);

  const selectedService = services.find(s => s.id.toString() === selectedServiceId);
  const currency = selectedService?.currency || countries.find(c => c.code === selectedCountry)?.currency || "XOF";
  const commissionRate = commissionRates?.depositRate ?? 7;
  const numericAmount = parseFloat(amount) || 0;
  const fee = Math.round(numericAmount * (commissionRate / 100));
  const netAmount = numericAmount - fee;

  const checkPaymentStatus = useCallback(async () => {
    if (!currentOrderId || !currentPayId) return;
    try {
      const response = await fetch(`/api/partner/verify-deposit/${currentOrderId}/${currentPayId}`, { credentials: "include" });
      const data = await response.json();
      if (data.status === "completed") {
        setPaymentStatus("completed");
        setVerificationMessage(data.message || "Paiement confirmé!");
        localStorage.removeItem("partner_deposit_payment");
        if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
        queryClient.invalidateQueries({ queryKey: ["/api/partner/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/partner/stats"] });
      } else if (data.status === "failed") {
        setPaymentStatus("failed");
        setVerificationMessage(data.message || "Paiement échoué.");
        localStorage.removeItem("partner_deposit_payment");
        if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      } else {
        pollingAttemptsRef.current += 1;
        setVerificationMessage(`Vérification en cours... (${pollingAttemptsRef.current}/${maxPollingAttempts})`);
        if (pollingAttemptsRef.current >= maxPollingAttempts) {
          setPaymentStatus("pending");
          setVerificationMessage("Le paiement est en attente. Veuillez confirmer sur votre téléphone.");
          if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
        }
      }
    } catch {
      pollingAttemptsRef.current += 1;
      if (pollingAttemptsRef.current >= maxPollingAttempts) {
        setVerificationMessage("Impossible de vérifier le paiement.");
        if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      }
    }
  }, [currentOrderId, currentPayId]);

  useEffect(() => {
    const saved = localStorage.getItem("partner_deposit_payment");
    if (saved) {
      try {
        const { orderId, payId } = JSON.parse(saved);
        if (orderId && payId) {
          setCurrentOrderId(orderId);
          setCurrentPayId(payId);
          setPaymentStatus("processing");
          pollingAttemptsRef.current = 0;
        }
      } catch { localStorage.removeItem("partner_deposit_payment"); }
    }
  }, []);

  useEffect(() => {
    if (paymentStatus === "processing" && currentOrderId && currentPayId) {
      checkPaymentStatus();
      pollingRef.current = setInterval(checkPaymentStatus, 3000);
    }
    return () => { if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; } };
  }, [paymentStatus, currentOrderId, currentPayId, checkPaymentStatus]);

  const depositMutation = useMutation({
    mutationFn: async (data: { amount: number; serviceId: string; phoneNumber: string }) => {
      const response = await apiRequest("POST", "/api/partner/deposit", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.payId && data.orderId) {
        localStorage.setItem("partner_deposit_payment", JSON.stringify({ orderId: data.orderId, payId: data.payId }));
        setCurrentOrderId(data.orderId);
        setCurrentPayId(data.payId);
        if (data.isWave && data.waveUrl) {
          toast({ title: "Redirection vers Wave", description: "Confirmez le paiement dans Wave." });
          window.open(data.waveUrl, "_blank");
        } else {
          toast({ title: "Paiement initié", description: "Veuillez confirmer sur votre téléphone." });
        }
        setPaymentStatus("processing");
        pollingAttemptsRef.current = 0;
        setVerificationMessage(data.message || "Veuillez confirmer le paiement sur votre téléphone.");
      } else {
        toast({ title: "Erreur", description: data.message || "Erreur lors du paiement", variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount < 100) {
      toast({ title: "Montant invalide", description: `Montant minimum: 100 ${currency}`, variant: "destructive" });
      return;
    }
    if (!phoneNumber || phoneNumber.length < 8) {
      toast({ title: "Numéro invalide", description: "Entrez un numéro valide.", variant: "destructive" });
      return;
    }
    depositMutation.mutate({ amount: numericAmount, serviceId: selectedServiceId, phoneNumber: phoneNumber.replace(/\s/g, "") });
  };

  const resetPayment = () => {
    setPaymentStatus("idle");
    setVerificationMessage("");
    setCurrentOrderId("");
    setCurrentPayId("");
    localStorage.removeItem("partner_deposit_payment");
    pollingAttemptsRef.current = 0;
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  };

  if (paymentStatus !== "idle") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">Dépôt</h2>
        <Card>
          <CardContent className="p-8 text-center space-y-6">
            {paymentStatus === "completed" ? (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-green-600">Paiement réussi!</h3>
                  <p className="text-muted-foreground">{verificationMessage}</p>
                </div>
                <Button onClick={resetPayment} data-testid="button-partner-deposit-done">Nouveau dépôt</Button>
              </>
            ) : paymentStatus === "failed" ? (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-red-600">Paiement échoué</h3>
                  <p className="text-muted-foreground">{verificationMessage}</p>
                </div>
                <Button variant="outline" onClick={resetPayment} data-testid="button-partner-deposit-retry">Réessayer</Button>
              </>
            ) : (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">
                    {paymentStatus === "pending" ? "Paiement en attente" : "Vérification du paiement..."}
                  </h3>
                  <p className="text-muted-foreground">
                    {verificationMessage || "Veuillez confirmer le paiement sur votre téléphone."}
                  </p>
                </div>
                {paymentStatus === "pending" ? (
                  <Button variant="outline" onClick={resetPayment} data-testid="button-partner-deposit-new">Nouveau dépôt</Button>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Vérification automatique toutes les 3 secondes</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dépôt</h2>
        <p className="text-muted-foreground">Rechargez votre compte partenaire</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dépôt Mobile Money</CardTitle>
          <CardDescription>Sélectionnez le pays, l'opérateur et entrez le montant</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Label>Choisir le pays</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger data-testid="select-partner-deposit-country">
                  <SelectValue placeholder="Sélectionnez un pays" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.flag} {c.name} ({c.currency})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {services.length > 0 && (
              <div className="space-y-4">
                <Label>Opérateur Mobile Money</Label>
                <RadioGroup
                  value={selectedServiceId}
                  onValueChange={(val) => {
                    const srv = services.find(s => s.id.toString() === val);
                    if (!srv?.inMaintenance) setSelectedServiceId(val);
                  }}
                  className="grid grid-cols-2 gap-4"
                >
                  {services.map((service) => (
                    <div key={service.id} className="relative">
                      <RadioGroupItem value={service.id.toString()} id={`pdep-${service.id}`} className="peer sr-only" disabled={service.inMaintenance} />
                      <Label
                        htmlFor={`pdep-${service.id}`}
                        className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                          service.inMaintenance ? "opacity-50 cursor-not-allowed bg-muted" : "cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                        }`}
                        data-testid={`radio-partner-service-${service.id}`}
                      >
                        <img src={operatorLogos[service.operator] || mtnLogo} alt={service.operator} className="h-12 w-12 object-contain rounded-full bg-white shadow-sm p-1" />
                        <span className="text-xs font-bold text-center">{service.description}</span>
                        {service.inMaintenance && <span className="text-xs text-orange-600 font-medium">En maintenance</span>}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            <div className="space-y-2">
              <Label>Numéro de téléphone Mobile Money</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="Ex: 90123456"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10"
                  data-testid="input-partner-deposit-phone"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Montant ({currency})</Label>
              <Input
                type="number"
                placeholder="Entrez le montant"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-2xl h-14 font-semibold"
                min="100"
                data-testid="input-partner-deposit-amount"
              />
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((qa) => (
                  <Button key={qa} type="button" variant={numericAmount === qa ? "default" : "outline"} size="sm" onClick={() => setAmount(qa.toString())} data-testid={`button-partner-quick-${qa}`}>
                    {qa.toLocaleString()} {currency}
                  </Button>
                ))}
              </div>
            </div>

            {numericAmount > 0 && (
              <Card className="bg-muted/50 border-none">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Montant</span>
                    <span>{numericAmount.toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Info className="h-3 w-3" />Frais ({commissionRate}%)</span>
                    <span>-{fee.toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Vous recevez</span>
                    <span className="text-green-600">{netAmount.toLocaleString()} {currency}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={numericAmount < 100 || !phoneNumber || depositMutation.isPending} data-testid="button-partner-deposit-submit">
              {depositMutation.isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Traitement...</>) : `Déposer ${numericAmount > 0 ? numericAmount.toLocaleString() + " " + currency : ""}`}
            </Button>
          </form>
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

function PartnerWithdrawSection({ partner }: { partner: any }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [country, setCountry] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [walletName, setWalletName] = useState("");

  const { data: countries = [], isLoading: countriesLoading } = useQuery<WithdrawCountry[]>({
    queryKey: ["/api/partner/withdraw/operators"],
  });

  const { data: commissionRates } = useQuery<{ depositRate: number; withdrawalRate: number; encaissementRate: number }>({
    queryKey: ["/api/partner/commission-rates"],
  });

  const selectedCountry = countries.find(c => c.id === country);
  const availableMethods = selectedCountry?.methods || [];
  const commissionRate = commissionRates?.withdrawalRate ?? 7;
  const balance = parseFloat(partner?.balance || "0");
  const numericAmount = parseFloat(amount) || 0;
  const fee = Math.round(numericAmount * (commissionRate / 100));
  const netAmount = numericAmount - fee;
  const minWithdrawal = 500;

  useEffect(() => { setPaymentMethod(""); }, [country]);

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: number; paymentMethod: string; mobileNumber: string; country: string; walletName: string }) => {
      const res = await apiRequest("POST", "/api/partner/withdraw", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Demande soumise", description: data.message || "Votre demande de retrait a été soumise." });
      queryClient.invalidateQueries({ queryKey: ["/api/partner/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner/stats"] });
      setAmount("");
      setWalletName("");
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount < minWithdrawal) {
      toast({ title: "Montant insuffisant", description: `Minimum: ${minWithdrawal} FCFA`, variant: "destructive" });
      return;
    }
    if (numericAmount > balance) {
      toast({ title: "Solde insuffisant", description: "Vous n'avez pas assez de fonds.", variant: "destructive" });
      return;
    }
    if (!country) { toast({ title: "Pays requis", description: "Sélectionnez un pays.", variant: "destructive" }); return; }
    if (!paymentMethod) { toast({ title: "Moyen de paiement requis", description: "Sélectionnez un opérateur.", variant: "destructive" }); return; }
    if (!mobileNumber) { toast({ title: "Numéro requis", description: "Entrez un numéro de téléphone.", variant: "destructive" }); return; }
    withdrawMutation.mutate({ amount: numericAmount, paymentMethod, mobileNumber, country, walletName });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Retrait</h2>
        <p className="text-muted-foreground">Retirez vers votre Mobile Money</p>
      </div>

      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-6">
          <p className="text-sm opacity-80">Solde disponible</p>
          <p className="text-3xl font-bold mt-1" data-testid="text-partner-balance">{balance.toLocaleString()} FCFA</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle demande de retrait</CardTitle>
          <CardDescription>Minimum: {minWithdrawal.toLocaleString()} FCFA. Tous les retraits nécessitent une validation administrateur.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <Label>Montant (FCFA)</Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => setAmount(Math.floor(balance).toString())}>
                  Max: {balance.toLocaleString()} FCFA
                </Button>
              </div>
              <Input
                type="number"
                placeholder="Entrez le montant"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-2xl h-14 font-semibold"
                min={minWithdrawal}
                max={balance}
                data-testid="input-partner-withdraw-amount"
              />
            </div>

            {numericAmount > 0 && (
              <Card className="bg-muted/50 border-none">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Montant demandé</span>
                    <span>{numericAmount.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Info className="h-3 w-3" />Frais ({commissionRate}%)</span>
                    <span>-{fee.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Vous recevez</span>
                    <span className="text-green-600">{netAmount.toLocaleString()} FCFA</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label>Pays de réception</Label>
              <Select value={country} onValueChange={(val) => { setCountry(val); setPaymentMethod(""); }}>
                <SelectTrigger data-testid="select-partner-withdraw-country">
                  <SelectValue placeholder="Sélectionnez un pays" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {availableMethods.length > 0 && (
              <div className="space-y-4">
                <Label>Moyen de paiement</Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(val) => {
                    const method = availableMethods.find(m => m.id === val);
                    if (!method?.inMaintenance) setPaymentMethod(val);
                  }}
                  className="grid grid-cols-2 md:grid-cols-3 gap-4"
                >
                  {availableMethods.map((method) => {
                    const logoKey = method.name.toLowerCase().replace(/\s+/g, "").replace("-", "");
                    return (
                      <div key={method.id} className="relative">
                        <RadioGroupItem value={method.id} id={`pw-${method.id}`} className="peer sr-only" disabled={method.inMaintenance} />
                        <Label
                          htmlFor={`pw-${method.id}`}
                          className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                            method.inMaintenance ? "opacity-50 cursor-not-allowed bg-muted" : "cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                          }`}
                        >
                          <img src={methodLogos[logoKey] || methodLogos[method.name.toLowerCase()] || moovLogo} alt={method.name} className="h-12 w-12 object-contain rounded-full" />
                          <span className="text-xs font-medium text-center">{method.name}</span>
                          {method.inMaintenance && <span className="text-xs text-orange-600 font-medium">En maintenance</span>}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            )}

            <div className="space-y-2">
              <Label>Numéro de téléphone destinataire</Label>
              <Input type="tel" placeholder="+228 99 99 99 99" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} data-testid="input-partner-withdraw-mobile" />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Wallet className="h-4 w-4" />Nom du portefeuille (optionnel)</Label>
              <Input type="text" placeholder="Ex: Mon portefeuille" value={walletName} onChange={(e) => setWalletName(e.target.value)} data-testid="input-partner-wallet-name" />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={withdrawMutation.isPending || numericAmount < minWithdrawal || numericAmount > balance || !country || !paymentMethod || !mobileNumber} data-testid="button-partner-withdraw-submit">
              {withdrawMutation.isPending ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Envoi...</>) : `Demander le retrait${numericAmount > 0 ? ` de ${numericAmount.toLocaleString()} FCFA` : ""}`}
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
  const encaissementRate = commissionRates?.encaissementRate ?? 7;

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
