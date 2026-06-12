import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import CountrySelect from "@/components/ui/country-select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Shield,
  Clock,
  ArrowRight,
  ArrowLeft,
  Moon,
  Sun,
  Lock,
} from "lucide-react";
import logoPath from "@assets/20251211_105226_1765450558306.png";
import mtnLogo from "@assets/mtn_(1)_1763835082904-BVdEqpuz_1769443204393.png";
import moovLogo from "@assets/moov_(1)_1763835082986-GKkwwfPK_1769443204522.png";
import orangeLogo from "@assets/images_1769443862827.png";
import tmoneyLogo from "@assets/images_(1)_1769443862863.png";
import airtelLogo from "@assets/Airtel_logo-01_1769443862893.png";
import vodacomLogo from "@assets/vodacom_1769443862923.png";
import waveLogo from "@assets/images_(16)_1772485816419.jpeg";

const COUNTRY_PREFIXES: Record<string, string> = {
  CI: "+225", BJ: "+229", TG: "+228", BF: "+226",
  SN: "+221", CM: "+237", ML: "+223", GN: "+224",
  COG: "+242", COD: "+243",
};

interface ApiTransaction {
  id: number;
  reference: string;
  amount: string;
  currency: string;
  status: string;
  description: string | null;
  customerName: string | null;
  ownerName: string;
}

interface SoleasPayService {
  id: number;
  name: string;
  description: string;
  operator: string;
  country: string;
  countryCode: string;
  currency: string;
}

interface SoleasPayCountry {
  code: string;
  name: string;
  flag: string;
  currency: string;
}

const operatorLogos: Record<string, string> = {
  "MTN": mtnLogo,
  "Moov": moovLogo,
  "Orange": orangeLogo,
  "TMoney": tmoneyLogo,
  "Airtel": airtelLogo,
  "Vodacom": vodacomLogo,
  "Wave": waveLogo,
};

function formatCurrency(amount: string | number, currency: string = "XOF") {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-FR").format(num) + " " + currency;
}

function PageShell({ isDarkMode, onToggle, children }: {
  isDarkMode: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 flex flex-col">
      <header className="w-full px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-border/50 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a href="/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
            <img src={logoPath} alt="SendavaPay" className="h-8" />
          </a>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 text-green-500" />
              <span>Paiement sécurisé SSL</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8" data-testid="button-theme-toggle">
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      <footer className="w-full py-4 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5" />
          <span>Paiement sécurisé par <span className="font-medium">SendavaPay</span></span>
        </div>
      </footer>
    </div>
  );
}

export default function PayApiPage() {
  const [, params] = useRoute("/pay/api/:reference");
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [step, setStep] = useState<"info" | "payment" | "processing" | "complete" | "failed">("info");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [currentPayId, setCurrentPayId] = useState("");
  const [currentOrderId, setCurrentOrderId] = useState("");
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollingAttemptsRef = useRef(0);
  const maxPollingAttempts = 40;

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const { data: transaction, isLoading, error } = useQuery<ApiTransaction>({
    queryKey: ["/api/pay-api", params?.reference],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/pay-api/${params?.reference}`);
      if (!res.ok) throw new Error("Transaction introuvable");
      return res.json();
    },
    enabled: !!params?.reference,
  });

  const { data: countries = [] } = useQuery<SoleasPayCountry[]>({
    queryKey: ["/api/soleaspay/countries"],
  });

  const { data: services = [] } = useQuery<SoleasPayService[]>({
    queryKey: ["/api/soleaspay/services", selectedCountry],
    enabled: !!selectedCountry,
  });

  useEffect(() => {
    if (countries.length > 0 && !selectedCountry) setSelectedCountry(countries[0].code);
  }, [countries, selectedCountry]);

  useEffect(() => {
    if (services.length > 0 && (!selectedServiceId || !services.find(s => s.id.toString() === selectedServiceId))) {
      setSelectedServiceId(services[0].id.toString());
    }
  }, [services, selectedServiceId]);

  const selectedService = services.find(s => s.id.toString() === selectedServiceId);
  const currency = selectedService?.currency || countries.find(c => c.code === selectedCountry)?.currency || transaction?.currency || "XOF";
  const phonePrefix = COUNTRY_PREFIXES[selectedService?.countryCode || selectedCountry] || "";

  const payMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/pay-api/${params?.reference}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setCurrentPayId(data.payId);
        setCurrentOrderId(data.orderId);
        setStep("processing");
        if (data.isWave && data.waveUrl) {
          toast({ title: "Redirection vers Wave", description: "Confirmez dans l'application Wave." });
          window.open(data.waveUrl, "_blank");
          setVerificationMessage("Confirmez le paiement dans l'application Wave, puis revenez ici.");
        } else {
          setVerificationMessage("Veuillez confirmer le paiement sur votre téléphone...");
        }
        startPolling();
      } else {
        toast({ title: "Erreur", description: data.error || "Erreur lors du paiement", variant: "destructive" });
      }
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message || "Erreur lors du paiement", variant: "destructive" });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/pay-api/${params?.reference}/verify`, {
        payId: currentPayId, orderId: currentOrderId, payerCountry: selectedCountry,
      });
      return response.json();
    },
  });

  const startPolling = () => {
    pollingAttemptsRef.current = 0;
    pollingRef.current = setInterval(async () => {
      pollingAttemptsRef.current++;
      if (pollingAttemptsRef.current >= maxPollingAttempts) {
        stopPolling();
        setStep("failed");
        setVerificationMessage("Le délai de paiement a expiré. Veuillez réessayer.");
        return;
      }
      try {
        const result = await verifyMutation.mutateAsync();
        if (result.status === "completed") {
          stopPolling(); setStep("complete"); setVerificationMessage("Paiement réussi!");
          if (result.redirectUrl) setRedirectUrl(result.redirectUrl);
        } else if (result.status === "failed") {
          stopPolling(); setStep("failed"); setVerificationMessage(result.message || "Le paiement a échoué");
          if (result.redirectUrl) setRedirectUrl(result.redirectUrl);
        } else {
          setVerificationMessage(result.message || "En attente de confirmation...");
        }
      } catch (e) { console.error("Polling error:", e); }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  };

  useEffect(() => { return () => stopPolling(); }, []);

  useEffect(() => {
    if (step === "complete" && redirectUrl) {
      const t = setTimeout(() => { window.location.href = redirectUrl; }, 3000);
      return () => clearTimeout(t);
    }
  }, [step, redirectUrl]);

  const handleSubmitInfo = () => {
    if (!firstName || !lastName || !email) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }
    setStep("payment");
  };

  const handleSubmitPayment = () => {
    if (!selectedCountry || !selectedServiceId || !phoneNumber) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un pays, un opérateur et entrer votre numéro", variant: "destructive" });
      return;
    }
    payMutation.mutate({
      payerName: `${firstName} ${lastName}`,
      payerEmail: email,
      payerPhone: phoneNumber,
      payerCountry: selectedCountry,
      serviceId: selectedServiceId,
    });
  };

  const resetPayment = () => {
    setStep("payment");
    setVerificationMessage("");
    setCurrentOrderId("");
    setCurrentPayId("");
    pollingAttemptsRef.current = 0;
    stopPolling();
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageShell isDarkMode={isDarkMode} onToggle={toggleDarkMode}>
        <Card className="shadow-xl border-0">
          <CardContent className="p-7 space-y-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (error || !transaction) {
    return (
      <PageShell isDarkMode={isDarkMode} onToggle={toggleDarkMode}>
        <Card className="shadow-xl border-0">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">Transaction introuvable</h2>
            <p className="text-sm text-muted-foreground">Cette transaction n'existe pas ou a expiré.</p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  // ── Already completed ─────────────────────────────────────────────────────
  if (transaction.status === "completed") {
    return (
      <PageShell isDarkMode={isDarkMode} onToggle={toggleDarkMode}>
        <Card className="shadow-xl border-0">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-green-600">Paiement déjà effectué</h2>
            <p className="text-sm text-muted-foreground">Cette transaction a déjà été payée.</p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  // ── Invalid status ────────────────────────────────────────────────────────
  if (transaction.status !== "pending" && step !== "processing" && step !== "complete" && step !== "failed") {
    return (
      <PageShell isDarkMode={isDarkMode} onToggle={toggleDarkMode}>
        <Card className="shadow-xl border-0">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <XCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Transaction invalide</h2>
            <p className="text-sm text-muted-foreground">Cette transaction n'est plus disponible.</p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  // ── Processing ────────────────────────────────────────────────────────────
  if (step === "processing") {
    return (
      <PageShell isDarkMode={isDarkMode} onToggle={toggleDarkMode}>
        <Card className="shadow-xl border-0">
          <CardContent className="p-8 text-center space-y-5">
            <div className="mx-auto w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Vérification du paiement...</h2>
              <p className="text-sm text-muted-foreground px-2">{verificationMessage}</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Vérification automatique toutes les 3 secondes</span>
            </div>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  // ── Complete ──────────────────────────────────────────────────────────────
  if (step === "complete") {
    return (
      <PageShell isDarkMode={isDarkMode} onToggle={toggleDarkMode}>
        <Card className="shadow-xl border-0">
          <CardContent className="p-8 text-center space-y-5">
            <div className="mx-auto w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold text-green-600">Paiement réussi!</h2>
              <p className="text-sm text-muted-foreground">
                Votre paiement de <span className="font-semibold text-foreground">{formatCurrency(transaction.amount, transaction.currency)}</span> a été effectué avec succès.
              </p>
            </div>
            <div className="bg-muted/60 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Référence</p>
              <p className="text-lg font-bold font-mono tracking-wide">{transaction.reference}</p>
            </div>
            {redirectUrl && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Redirection automatique dans quelques secondes...</p>
                <Button onClick={() => window.location.href = redirectUrl!} className="w-full" size="lg" data-testid="button-redirect">
                  Retourner au site <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  // ── Failed ────────────────────────────────────────────────────────────────
  if (step === "failed") {
    return (
      <PageShell isDarkMode={isDarkMode} onToggle={toggleDarkMode}>
        <Card className="shadow-xl border-0">
          <CardContent className="p-8 text-center space-y-5">
            <div className="mx-auto w-20 h-20 rounded-full bg-red-500 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold text-red-600">Paiement échoué</h2>
              <p className="text-sm text-muted-foreground px-2">{verificationMessage}</p>
            </div>
            <Button onClick={resetPayment} className="w-full" size="lg" data-testid="button-retry">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <PageShell isDarkMode={isDarkMode} onToggle={toggleDarkMode}>
      <Card className="shadow-xl border-0">
        <CardContent className="p-6">

          {/* ── Step: Info ── */}
          {step === "info" && (
            <div className="space-y-5">
              {/* Merchant summary */}
              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Paiement à</p>
                  <h2 className="font-semibold text-lg leading-tight">{transaction.ownerName}</h2>
                  {transaction.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{transaction.description}</p>
                  )}
                  <p className="text-primary font-bold text-lg mt-1">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                </div>
              </div>

              {/* Personal info form */}
              <div className="space-y-3.5">
                <h3 className="font-semibold text-base">Vos informations</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-sm text-muted-foreground">Prénom</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      className="h-11 text-sm"
                      data-testid="input-firstname"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-sm text-muted-foreground">Nom</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="h-11 text-sm"
                      data-testid="input-lastname"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm text-muted-foreground">Adresse e-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemple.com"
                    className="h-11 text-sm"
                    data-testid="input-email"
                  />
                </div>

                <Button onClick={handleSubmitInfo} className="w-full mt-1" size="lg" data-testid="button-continue">
                  Continuer vers le paiement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step: Payment ── */}
          {step === "payment" && (
            <div className="space-y-4">
              <button
                onClick={() => setStep("info")}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>

              {/* Amount banner */}
              <div className="text-center py-3 px-4 bg-primary/5 border border-primary/20 rounded-xl">
                <p className="text-xs text-muted-foreground mb-0.5">Total à payer</p>
                <p className="text-3xl font-bold text-primary" data-testid="text-payment-amount">
                  {formatCurrency(transaction.amount, transaction.currency)}
                </p>
              </div>

              <div className="space-y-4">
                {/* Country */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Pays</Label>
                  <CountrySelect
                    options={countries.map(c => ({ value: c.code, label: c.name, flag: c.flag, subLabel: c.currency }))}
                    value={selectedCountry}
                    onChange={(v) => { setSelectedCountry(v); setSelectedServiceId(""); }}
                    placeholder="Sélectionnez votre pays"
                    data-testid="select-country"
                  />
                </div>

                {/* Operator */}
                {services.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Opérateur Mobile Money</Label>
                    <RadioGroup
                      value={selectedServiceId}
                      onValueChange={setSelectedServiceId}
                      className="grid grid-cols-4 gap-2"
                    >
                      {services.map((service) => (
                        <div key={service.id}>
                          <RadioGroupItem
                            value={service.id.toString()}
                            id={`service-${service.id}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`service-${service.id}`}
                            className="flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50 transition-all"
                            data-testid={`radio-service-${service.id}`}
                          >
                            <img
                              src={operatorLogos[service.operator] || mtnLogo}
                              alt={service.operator}
                              className="h-10 w-10 object-contain rounded-full bg-white shadow-sm p-0.5"
                            />
                            <span className="text-xs font-semibold text-center leading-tight">
                              {service.operator}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm text-muted-foreground">
                    Numéro {selectedService?.operator || "Mobile Money"}
                  </Label>
                  <div className="flex h-11">
                    {phonePrefix && (
                      <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-sm font-mono font-semibold text-muted-foreground select-none shrink-0 whitespace-nowrap">
                        {phonePrefix}
                      </div>
                    )}
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="90123456"
                      className={`text-sm ${phonePrefix ? "rounded-l-none h-11" : "h-11"}`}
                      data-testid="input-phone"
                    />
                  </div>
                </div>

                {/* Pay button */}
                <Button
                  onClick={handleSubmitPayment}
                  className="w-full"
                  size="lg"
                  disabled={!selectedServiceId || !phoneNumber || payMutation.isPending}
                  data-testid="button-pay"
                >
                  {payMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Traitement...</>
                  ) : (
                    <>Payer {formatCurrency(transaction.amount, transaction.currency)}</>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground leading-relaxed">
                  En continuant, vous acceptez les{" "}
                  <a href="/terms" target="_blank" className="underline hover:text-foreground transition-colors">
                    conditions générales
                  </a>{" "}
                  de SendavaPay.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
