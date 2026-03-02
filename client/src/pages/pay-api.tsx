import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Phone,
  Moon,
  Sun,
} from "lucide-react";
import logoPath from "@assets/20251211_105226_1765450558306.png";
import mtnLogo from "@assets/mtn_(1)_1763835082904-BVdEqpuz_1769443204393.png";
import moovLogo from "@assets/moov_(1)_1763835082986-GKkwwfPK_1769443204522.png";
import orangeLogo from "@assets/images_1769443862827.png";
import tmoneyLogo from "@assets/images_(1)_1769443862863.png";
import airtelLogo from "@assets/Airtel_logo-01_1769443862893.png";
import vodacomLogo from "@assets/vodacom_1769443862923.png";
import waveLogo from "@assets/images_(16)_1772485816419.jpeg";

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

  const { data: transaction, isLoading, error } = useQuery<ApiTransaction>({
    queryKey: ["/api/pay-api", params?.reference],
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
    if (countries.length > 0 && !selectedCountry) {
      setSelectedCountry(countries[0].code);
    }
  }, [countries, selectedCountry]);

  useEffect(() => {
    if (services.length > 0 && (!selectedServiceId || !services.find(s => s.id.toString() === selectedServiceId))) {
      setSelectedServiceId(services[0].id.toString());
    }
  }, [services, selectedServiceId]);

  const selectedService = services.find(s => s.id.toString() === selectedServiceId);
  const currency = selectedService?.currency || countries.find(c => c.code === selectedCountry)?.currency || transaction?.currency || "XOF";

  const toggleDarkMode = () => {
    const newIsDark = !isDarkMode;
    setIsDarkMode(newIsDark);
    document.documentElement.classList.toggle("dark", newIsDark);
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
  };

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
          toast({
            title: "Redirection vers Wave",
            description: "Vous allez être redirigé vers l'application Wave pour confirmer le paiement.",
          });
          window.open(data.waveUrl, "_blank");
          setVerificationMessage("Confirmez le paiement dans l'application Wave, puis revenez ici.");
        } else {
          setVerificationMessage("Veuillez confirmer le paiement sur votre téléphone...");
        }
        startPolling();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du paiement",
        variant: "destructive",
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/pay-api/${params?.reference}/verify`, {
        payId: currentPayId,
        orderId: currentOrderId,
        payerCountry: selectedCountry,
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
          stopPolling();
          setStep("complete");
          setVerificationMessage("Paiement réussi!");
          if (result.redirectUrl) {
            setRedirectUrl(result.redirectUrl);
          }
        } else if (result.status === "failed") {
          stopPolling();
          setStep("failed");
          setVerificationMessage(result.message || "Le paiement a échoué");
          if (result.redirectUrl) {
            setRedirectUrl(result.redirectUrl);
          }
        } else {
          setVerificationMessage(result.message || "En attente de confirmation...");
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  useEffect(() => {
    if (step === "complete" && redirectUrl) {
      const timer = setTimeout(() => {
        window.location.href = redirectUrl;
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step, redirectUrl]);

  const handleSubmitInfo = () => {
    if (!firstName || !lastName || !email) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }
    setStep("payment");
  };

  const handleSubmitPayment = () => {
    if (!selectedCountry || !selectedServiceId || !phoneNumber) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un pays, un opérateur et entrer votre numéro",
        variant: "destructive",
      });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
          <Card className="overflow-hidden shadow-lg">
            <CardContent className="p-8 space-y-6">
              <Skeleton className="h-6 w-3/4 mx-auto" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <img src={logoPath} alt="SendavaPay" className="h-8" />
          </div>
          <Card className="overflow-hidden shadow-lg">
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold">Transaction introuvable</h2>
              <p className="text-muted-foreground">
                Cette transaction n'existe pas ou a expiré.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (transaction.status === "completed") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <img src={logoPath} alt="SendavaPay" className="h-8" />
          </div>
          <Card className="overflow-hidden shadow-lg">
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-green-600">Paiement déjà effectué</h2>
              <p className="text-muted-foreground">
                Cette transaction a déjà été payée.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (transaction.status !== "pending") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <img src={logoPath} alt="SendavaPay" className="h-8" />
          </div>
          <Card className="overflow-hidden shadow-lg">
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <XCircle className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold">Transaction invalide</h2>
              <p className="text-muted-foreground">
                Cette transaction n'est plus disponible.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <img src={logoPath} alt="SendavaPay" className="h-8" />
          </div>
          <Card className="overflow-hidden shadow-lg">
            <CardContent className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Vérification du paiement...</h2>
                <p className="text-muted-foreground">{verificationMessage}</p>
              </div>
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

  if (step === "complete") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
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
                <p className="text-muted-foreground">
                  Votre paiement de {formatCurrency(transaction.amount, transaction.currency)} a été effectué avec succès.
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Référence</p>
                <p className="text-lg font-bold">{transaction.reference}</p>
              </div>
              {redirectUrl && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Redirection automatique dans quelques secondes...
                  </p>
                  <Button 
                    onClick={() => window.location.href = redirectUrl}
                    className="w-full"
                    size="lg"
                    data-testid="button-redirect"
                  >
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

  if (step === "failed") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
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
              <Button onClick={resetPayment} className="w-full" size="lg" data-testid="button-retry">
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto p-4">
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
              <span>{countries.find(c => c.code === selectedCountry)?.flag || ""}</span>
              <span className="font-medium">{currency}</span>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden shadow-lg">
          <CardContent className="p-6">
            {step === "info" && (
              <>
                <div className="flex items-start gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Paiement à</p>
                    <h2 className="font-semibold text-lg">{transaction.ownerName}</h2>
                    {transaction.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{transaction.description}</p>
                    )}
                    <p className="text-primary font-bold mt-1">{formatCurrency(transaction.amount, transaction.currency)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Informations personnelles</h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="firstName" className="text-sm text-muted-foreground">Prénom</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Ex. John"
                        data-testid="input-firstname"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="lastName" className="text-sm text-muted-foreground">Nom</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Ex. Doe"
                        data-testid="input-lastname"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-sm text-muted-foreground">Adresse e-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ex. email@example.com"
                      data-testid="input-email"
                    />
                  </div>
                  <Button
                    onClick={handleSubmitInfo}
                    className="w-full"
                    size="lg"
                    data-testid="button-continue"
                  >
                    Continuer vers le paiement
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

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
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Pays</Label>
                    <Select value={selectedCountry} onValueChange={(v) => { setSelectedCountry(v); setSelectedServiceId(""); }}>
                      <SelectTrigger data-testid="select-country">
                        <SelectValue placeholder="Sélectionnez votre pays" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.flag} {country.name} ({country.currency})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

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
                              <span className="text-xs font-bold text-center">{service.description || service.operator}</span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm text-muted-foreground">
                      Numéro de téléphone {selectedService?.operator || "Mobile Money"}
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Ex: 90123456"
                        className="pl-10"
                        data-testid="input-phone"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmitPayment}
                    className="w-full"
                    size="lg"
                    disabled={!selectedServiceId || !phoneNumber || payMutation.isPending}
                    data-testid="button-pay"
                  >
                    {payMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
