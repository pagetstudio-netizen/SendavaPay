import { useState, useEffect, useRef, useCallback } from "react";
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
  ExternalLink,
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
  paymentGateway?: string;
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
  const [paydunyaActionUrl, setPaydunyaActionUrl] = useState<string | null>(null);
  const [completedRedirectUrl, setCompletedRedirectUrl] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollingAttemptsRef = useRef(0);
  const maxPollingAttempts = 40;

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
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
      const res = await fetch(`/api/pay-api/${params?.reference}`);
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
    queryFn: async () => {
      const res = await fetch(`/api/soleaspay/services/${selectedCountry}`);
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    enabled: !!selectedCountry,
  });

  useEffect(() => {
    if (countries.length > 0 && !selectedCountry) setSelectedCountry(countries[0].code);
  }, [countries, selectedCountry]);

  useEffect(() => {
    if (services.length > 0 && (!selectedServiceId || !services.find(s => s.id.toString() === selectedServiceId))) {
      setSelectedServiceId(services[0].id.toString());
    }
    setPhoneNumber("");
  }, [services, selectedServiceId]);

  const selectedService = services.find(s => s.id.toString() === selectedServiceId);
  const currency = selectedService?.currency || countries.find(c => c.code === selectedCountry)?.currency || transaction?.currency || "XOF";
  const phonePrefix = COUNTRY_PREFIXES[selectedService?.countryCode || selectedCountry] || "";

  const stopPolling = useCallback(() => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  }, []);

  useEffect(() => { return () => stopPolling(); }, [stopPolling]);

  useEffect(() => {
    if (step === "complete" && completedRedirectUrl) {
      const t = setTimeout(() => { window.location.href = completedRedirectUrl; }, 3000);
      return () => clearTimeout(t);
    }
  }, [step, completedRedirectUrl]);

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/pay-api/${params?.reference}/verify`, {
        payId: currentPayId, orderId: currentOrderId, payerCountry: selectedCountry,
      });
      return res.json();
    },
  });

  const startPolling = useCallback(() => {
    pollingAttemptsRef.current = 0;
    pollingRef.current = setInterval(async () => {
      pollingAttemptsRef.current++;
      if (pollingAttemptsRef.current >= maxPollingAttempts) {
        stopPolling();
        setVerificationMessage("Le délai de paiement a expiré. Veuillez réessayer.");
        setStep("failed");
        return;
      }
      try {
        const result = await verifyMutation.mutateAsync();
        if (result.status === "completed") {
          stopPolling();
          setStep("complete");
          setVerificationMessage("Paiement réussi!");
          if (result.redirectUrl) setCompletedRedirectUrl(result.redirectUrl);
        } else if (result.status === "failed") {
          stopPolling();
          setStep("failed");
          setVerificationMessage(result.message || "Le paiement a échoué.");
        } else {
          setVerificationMessage(result.message || `Vérification en cours... (${pollingAttemptsRef.current}/${maxPollingAttempts})`);
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, 3000);
  }, [currentPayId, currentOrderId, selectedCountry, stopPolling]);

  const payMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/pay-api/${params?.reference}`, data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setCurrentPayId(data.payId || "");
        setCurrentOrderId(data.orderId || "");

        if (data.isRedirect && data.redirectUrl) {
          setPaydunyaActionUrl(data.redirectUrl);
          setStep("processing");
          pollingAttemptsRef.current = 0;
          setVerificationMessage("Cliquez sur le bouton ci-dessous pour compléter votre paiement.");
        } else if (data.isWave && data.waveUrl) {
          window.open(data.waveUrl, "_blank");
          setStep("processing");
          pollingAttemptsRef.current = 0;
          setVerificationMessage("Confirmez le paiement dans l'application Wave, puis revenez ici.");
          startPolling();
        } else {
          setStep("processing");
          pollingAttemptsRef.current = 0;
          setVerificationMessage("Veuillez confirmer le paiement sur votre téléphone.");
          toast({ title: "Paiement initié", description: "Veuillez confirmer le paiement sur votre téléphone." });
          startPolling();
        }
      } else {
        toast({ title: "Erreur", description: data.error || "Erreur lors du paiement", variant: "destructive" });
      }
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message || "Erreur lors du paiement", variant: "destructive" });
    },
  });

  const handleContinueToPayment = () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({ title: "Informations manquantes", description: "Veuillez remplir votre nom complet.", variant: "destructive" });
      return;
    }
    setStep("payment");
  };

  const handleSubmitPayment = () => {
    if (!selectedCountry) {
      toast({ title: "Informations manquantes", description: "Veuillez sélectionner votre pays.", variant: "destructive" });
      return;
    }
    if (!selectedServiceId) {
      toast({ title: "Informations manquantes", description: "Veuillez sélectionner un opérateur.", variant: "destructive" });
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.length < 5) {
      toast({ title: "Informations manquantes", description: "Veuillez entrer un numéro de téléphone valide.", variant: "destructive" });
      return;
    }
    payMutation.mutate({
      payerName: `${firstName} ${lastName}`,
      payerEmail: email || undefined,
      payerPhone: (phonePrefix + phoneNumber).replace(/\s/g, ""),
      payerCountry: selectedCountry,
      serviceId: selectedServiceId,
    });
  };

  const resetPayment = () => {
    setStep("payment");
    setVerificationMessage("");
    setCurrentOrderId("");
    setCurrentPayId("");
    setPaydunyaActionUrl(null);
    pollingAttemptsRef.current = 0;
    stopPolling();
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
          <Card className="overflow-hidden shadow-lg">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
              <div className="space-y-4">
                <Skeleton className="h-4 w-1/3" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
                <Skeleton className="h-10" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (error || !transaction) {
    return (
      <div className={`min-h-screen ${isDarkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <img src={logoPath} alt="SendavaPay" className="h-8" />
          </div>
          <Card className="overflow-hidden shadow-lg">
            <CardContent className="p-8 text-center">
              <XCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-semibold mb-2">Transaction introuvable</h2>
              <p className="text-muted-foreground">Cette transaction n'existe pas ou a expiré.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Already completed ─────────────────────────────────────────────────────
  if (transaction.status === "completed" && step !== "complete") {
    return (
      <div className={`min-h-screen ${isDarkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <img src={logoPath} alt="SendavaPay" className="h-8" />
          </div>
          <Card className="overflow-hidden shadow-lg">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-xl font-semibold mb-2">Paiement déjà effectué</h2>
              <p className="text-muted-foreground">Cette transaction a déjà été payée.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Invalid status ────────────────────────────────────────────────────────
  if (transaction.status !== "pending" && transaction.status !== "processing" && step === "info") {
    return (
      <div className={`min-h-screen ${isDarkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <img src={logoPath} alt="SendavaPay" className="h-8" />
          </div>
          <Card className="overflow-hidden shadow-lg">
            <CardContent className="p-8 text-center">
              <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Transaction indisponible</h2>
              <p className="text-muted-foreground">Cette transaction n'est plus disponible.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Processing ────────────────────────────────────────────────────────────
  if (step === "processing") {
    return (
      <div className={`min-h-screen ${isDarkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <img src={logoPath} alt="SendavaPay" className="h-8" />
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} data-testid="button-theme-toggle">
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
          <Card className="overflow-hidden shadow-lg">
            <CardContent className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Vérification du paiement...</h2>
                <p className="text-muted-foreground">
                  {verificationMessage || "Veuillez confirmer le paiement sur votre téléphone."}
                </p>
              </div>
              {paydunyaActionUrl && (
                <a href={paydunyaActionUrl} target="_blank" rel="noopener noreferrer" className="w-full block">
                  <Button variant="outline" className="w-full border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950" data-testid="button-paydunya-action">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ouvrir la page de paiement
                  </Button>
                </a>
              )}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Vérification automatique toutes les 3 secondes</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Complete ──────────────────────────────────────────────────────────────
  if (step === "complete") {
    return (
      <div className={`min-h-screen ${isDarkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <img src={logoPath} alt="SendavaPay" className="h-8" />
          </div>
          <Card className="overflow-hidden shadow-lg">
            <CardContent className="p-8 text-center space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-green-600">Paiement réussi!</h2>
                <p className="text-muted-foreground">{verificationMessage}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Référence</p>
                <p className="text-lg font-bold font-mono">{transaction.reference}</p>
              </div>
              {completedRedirectUrl && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Redirection automatique dans quelques secondes...</p>
                  <Button onClick={() => window.location.href = completedRedirectUrl!} className="w-full" size="lg" data-testid="button-redirect">
                    Retourner au site <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Failed ────────────────────────────────────────────────────────────────
  if (step === "failed") {
    return (
      <div className={`min-h-screen ${isDarkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <img src={logoPath} alt="SendavaPay" className="h-8" />
          </div>
          <Card className="overflow-hidden shadow-lg">
            <CardContent className="p-8 text-center space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-red-500 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-red-600">Paiement échoué</h2>
                <p className="text-muted-foreground">{verificationMessage}</p>
              </div>
              <Button onClick={resetPayment} className="w-full" data-testid="button-retry-payment">
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Main form (info + payment steps) ─────────────────────────────────────
  return (
    <div className={`min-h-screen ${isDarkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-md mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <a href="/" target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:opacity-80 transition-opacity">
            <img src={logoPath} alt="SendavaPay" className="h-8" />
          </a>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              data-testid="button-theme-toggle"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm">
              <span>{countries.find(c => c.code === selectedCountry)?.flag || "🌍"}</span>
              <span className="font-medium">{currency}</span>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden shadow-lg">
          <CardContent className="p-6">

            {/* ── Step: Info ── */}
            {step === "info" && (
              <>
                {/* Merchant summary */}
                <div className="flex items-start gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-lg line-clamp-2">{transaction.ownerName}</h2>
                    {transaction.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{transaction.description}</p>
                    )}
                    <p className="text-primary font-bold mt-1">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </p>
                  </div>
                </div>

                {/* Personal info form */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Informations personnelles</h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="firstName" className="text-sm text-muted-foreground">Prénom</Label>
                      <Input
                        id="firstName"
                        placeholder="Ex. John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        data-testid="input-first-name"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="lastName" className="text-sm text-muted-foreground">Nom</Label>
                      <Input
                        id="lastName"
                        placeholder="Ex. Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-sm text-muted-foreground">
                      Adresse e-mail (optionnel)
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Ex. email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      data-testid="input-email"
                    />
                  </div>

                  <Button
                    onClick={handleContinueToPayment}
                    className="w-full"
                    size="lg"
                    data-testid="button-continue"
                  >
                    Continuer vers le paiement
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            )}

            {/* ── Step: Payment ── */}
            {step === "payment" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("info")}
                  className="mb-4"
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>

                <div className="text-center mb-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total à payer</p>
                  <p className="text-3xl font-bold text-primary" data-testid="text-payment-amount">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Country */}
                  <div className="space-y-2">
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
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Opérateur Mobile Money</Label>
                      <RadioGroup
                        value={selectedServiceId}
                        onValueChange={setSelectedServiceId}
                        className="grid grid-cols-2 gap-3"
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
                              className="flex flex-col items-center gap-2 rounded-xl border-2 p-3 cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
                              data-testid={`radio-service-${service.id}`}
                            >
                              <img
                                src={operatorLogos[service.operator] || mtnLogo}
                                alt={service.operator}
                                className="h-10 w-10 object-contain rounded-full bg-white shadow-sm p-1"
                              />
                              <span className="text-xs font-bold text-center">{service.description}</span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm text-muted-foreground">
                      Numéro de téléphone {selectedService?.operator || "Mobile Money"}
                    </Label>
                    <div className="flex">
                      {phonePrefix && (
                        <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-sm font-mono font-semibold text-muted-foreground select-none shrink-0">
                          {phonePrefix}
                        </div>
                      )}
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="90123456"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                        className={phonePrefix ? "rounded-l-none" : ""}
                        data-testid="input-phone-number"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmitPayment}
                    className="w-full"
                    size="lg"
                    disabled={payMutation.isPending}
                    data-testid="button-pay"
                  >
                    {payMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        Payer {formatCurrency(transaction.amount, transaction.currency)}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    En continuant, vous acceptez les conditions générales de SendavaPay.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Paiement sécurisé par SendavaPay</span>
          </div>
        </div>
      </div>
    </div>
  );
}
