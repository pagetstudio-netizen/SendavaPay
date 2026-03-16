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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Info,
  Phone,
  KeyRound,
} from "lucide-react";
const COUNTRY_PREFIXES: Record<string, string> = {
  CI: "+225", BJ: "+229", TG: "+228", BF: "+226",
  SN: "+221", CM: "+237", ML: "+223", GN: "+224",
  COG: "+242", COD: "+243",
};

import logoPath from "@assets/20251211_105226_1765450558306.png";
import mtnLogo from "@assets/mtn_(1)_1763835082904-BVdEqpuz_1769443204393.png";
import moovLogo from "@assets/moov_(1)_1763835082986-GKkwwfPK_1769443204522.png";
import orangeLogo from "@assets/images_1769443862827.png";
import tmoneyLogo from "@assets/images_(1)_1769443862863.png";
import airtelLogo from "@assets/Airtel_logo-01_1769443862893.png";
import vodacomLogo from "@assets/vodacom_1769443862923.png";
import waveLogo from "@assets/images_(16)_1772485816419.jpeg";
import type { PaymentLink } from "@shared/schema";

interface PaymentLinkWithMerchant extends PaymentLink {
  merchantName?: string;
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
  paymentGateway?: string;
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

function getOrangeUssdCode(countryCode: string): string {
  const codes: Record<string, string> = {
    CI: "#144#",
    CM: "#150*50#",
    BF: "#144#",
    COD: "#144#",
    COG: "#150#",
    BJ: "#144#",
    TG: "#144#",
  };
  return codes[countryCode] || "#144#";
}

export default function PaymentPage() {
  const [, params] = useRoute("/pay/:code");
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [step, setStep] = useState<"info" | "payment" | "processing" | "complete" | "failed">("info");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [currentPayId, setCurrentPayId] = useState("");
  const [currentOrderId, setCurrentOrderId] = useState("");
  const [currentProvider, setCurrentProvider] = useState<"soleaspay" | "maishapay" | "omnipay" | "paxity">("soleaspay");
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollingAttemptsRef = useRef(0);
  const maxPollingAttempts = 40;

  const { data: countries = [] } = useQuery<SoleasPayCountry[]>({
    queryKey: ["/api/soleaspay/countries"],
  });

  const { data: services = [] } = useQuery<SoleasPayService[]>({
    queryKey: ["/api/soleaspay/services", selectedCountry],
    queryFn: async () => {
      const res = await fetch(`/api/soleaspay/services/${selectedCountry}`);
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
    },
    enabled: !!selectedCountry,
  });

  const { data: paymentLink, isLoading, error } = useQuery<PaymentLinkWithMerchant>({
    queryKey: ["/api/pay", params?.code],
    queryFn: async () => {
      const res = await fetch(`/api/pay/${params?.code}`);
      if (!res.ok) {
        throw new Error("Lien de paiement introuvable");
      }
      return res.json();
    },
    enabled: !!params?.code,
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
    setPhoneNumber("");
    setOtp("");
  }, [services, selectedServiceId]);

  const selectedService = services.find(s => s.id.toString() === selectedServiceId);
  const currency = selectedService?.currency || countries.find(c => c.code === selectedCountry)?.currency || "XOF";
  const isOrange = selectedService?.operator === "Orange";
  const phonePrefix = COUNTRY_PREFIXES[selectedService?.countryCode || ""] || "";

  const checkPaymentStatus = useCallback(async () => {
    if (!currentPayId) return;

    try {
      const verifyUrl = currentProvider === "winipayer"
        ? `/api/verify-winipayer/${currentPayId}`
        : currentProvider === "maishapay"
        ? `/api/verify-maishapay/${currentPayId}`
        : currentProvider === "omnipay"
        ? `/api/verify-omnipay/${currentPayId}`
        : currentProvider === "paxity"
        ? `/api/verify-paxity/${currentPayId}`
        : `/api/verify-link-soleaspay/${currentOrderId}/${currentPayId}`;
      const response = await fetch(verifyUrl);
      const data = await response.json();

      console.log("Payment verification result:", data);

      if (data.status === "SUCCESS") {
        setStep("complete");
        setVerificationMessage(data.message || "Paiement effectué avec succès!");
        localStorage.removeItem("soleaspay_link_payment");
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } else if (data.status === "FAILURE") {
        setStep("failed");
        setVerificationMessage(data.message || "Le paiement a échoué.");
        localStorage.removeItem("soleaspay_link_payment");
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } else {
        pollingAttemptsRef.current += 1;
        setVerificationMessage(`Vérification en cours... (${pollingAttemptsRef.current}/${maxPollingAttempts})`);

        if (pollingAttemptsRef.current >= maxPollingAttempts) {
          setVerificationMessage("Le paiement est en attente. Veuillez confirmer sur votre téléphone.");
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      }
    } catch (error) {
      console.error("Error checking payment:", error);
      pollingAttemptsRef.current += 1;
      if (pollingAttemptsRef.current >= maxPollingAttempts) {
        setVerificationMessage("Impossible de vérifier le paiement.");
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    }
  }, [currentOrderId, currentPayId]);

  useEffect(() => {
    const saved = localStorage.getItem("soleaspay_link_payment");
    if (saved) {
      try {
        const { orderId, payId, linkCode, provider } = JSON.parse(saved);
        if (payId && linkCode === params?.code) {
          setCurrentOrderId(orderId || "");
          setCurrentPayId(payId);
          setCurrentProvider(provider || "soleaspay");
          setStep("processing");
          pollingAttemptsRef.current = 0;
        } else {
          localStorage.removeItem("soleaspay_link_payment");
        }
      } catch (e) {
        localStorage.removeItem("soleaspay_link_payment");
      }
    }
  }, [params?.code]);

  useEffect(() => {
    if (step === "processing" && currentPayId && (currentOrderId || currentProvider === "maishapay" || currentProvider === "omnipay" || currentProvider === "paxity")) {
      checkPaymentStatus();
      pollingRef.current = setInterval(checkPaymentStatus, 3000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [step, currentOrderId, currentPayId, checkPaymentStatus]);

  const payMutation = useMutation({
    mutationFn: async (data: { 
      linkCode: string;
      amount: number;
      serviceId: string;
      phoneNumber?: string;
      payerName: string;
      payerEmail?: string;
      otp?: string;
    }) => {
      const res = await apiRequest("POST", "/api/pay-link-soleaspay", data);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success && data.payId && data.orderId) {
        const provider = data.provider || "soleaspay";
        localStorage.setItem("soleaspay_link_payment", JSON.stringify({
          orderId: data.orderId,
          payId: data.payId,
          linkCode: params?.code,
          provider,
        }));
        setCurrentOrderId(data.orderId);
        setCurrentPayId(data.payId);
        setCurrentProvider(provider);
        
        if ((provider === "winipayer" || provider === "omnipay" || provider === "paxity") && data.checkoutUrl) {
          toast({
            title: "Redirection en cours",
            description: "Vous allez être redirigé vers la page de paiement.",
          });
          window.open(data.checkoutUrl, "_blank");
          setStep("processing");
          pollingAttemptsRef.current = 0;
          setVerificationMessage("Complétez le paiement sur la page de paiement, puis revenez ici.");
        } else if (data.isWave && data.waveUrl) {
          toast({
            title: "Redirection vers Wave",
            description: "Vous allez être redirigé vers l'application Wave pour confirmer le paiement.",
          });
          window.open(data.waveUrl, "_blank");
          setStep("processing");
          pollingAttemptsRef.current = 0;
          setVerificationMessage("Confirmez le paiement dans l'application Wave, puis revenez ici.");
        } else {
          setStep("processing");
          pollingAttemptsRef.current = 0;
          setVerificationMessage(data.message || "Veuillez confirmer le paiement sur votre téléphone.");
          toast({
            title: "Paiement initié",
            description: "Veuillez confirmer le paiement sur votre téléphone.",
          });
        }
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Erreur lors du paiement",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getPaymentAmount = () => {
    if (paymentLink?.allowCustomAmount && customAmount) {
      return parseFloat(customAmount);
    }
    return parseFloat(paymentLink?.amount || "0");
  };

  const handleContinueToPayment = () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir votre nom complet.",
        variant: "destructive",
      });
      return;
    }

    if (paymentLink?.allowCustomAmount) {
      const amt = parseFloat(customAmount);
      const minAmt = parseFloat(paymentLink.minimumAmount || "0");
      if (!customAmount || isNaN(amt) || amt < 100) {
        toast({
          title: "Montant invalide",
          description: "Veuillez entrer un montant valide (minimum 100).",
          variant: "destructive",
        });
        return;
      }
      if (minAmt > 0 && amt < minAmt) {
        toast({
          title: "Montant insuffisant",
          description: `Le montant minimum est de ${formatCurrency(minAmt)}.`,
          variant: "destructive",
        });
        return;
      }
    }

    setStep("payment");
  };

  const handleSubmitPayment = () => {
    if (!selectedCountry) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez sélectionner votre pays.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedServiceId) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez sélectionner un opérateur.",
        variant: "destructive",
      });
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.length < 5) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez entrer un numéro de téléphone valide.",
        variant: "destructive",
      });
      return;
    }
    payMutation.mutate({
      linkCode: params?.code || "",
      amount: getPaymentAmount(),
      serviceId: selectedServiceId,
      phoneNumber: (phonePrefix + phoneNumber).replace(/\s/g, ""),
      payerName: `${firstName} ${lastName}`,
      payerEmail: email || undefined,
    });
  };

  const resetPayment = () => {
    setStep("info");
    setVerificationMessage("");
    setCurrentOrderId("");
    setCurrentPayId("");
    localStorage.removeItem("soleaspay_link_payment");
    pollingAttemptsRef.current = 0;
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 space-y-6">
            <div className="flex justify-center">
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-3/4 mx-auto" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !paymentLink) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Lien introuvable</h2>
            <p className="text-muted-foreground">
              Ce lien de paiement n'existe pas ou a expiré.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentLink.status === "completed") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-semibold mb-2">Paiement déjà effectué</h2>
            <p className="text-muted-foreground">
              Ce lien de paiement a déjà été utilisé.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentLink.status === "expired" || paymentLink.status === "cancelled") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Lien expiré</h2>
            <p className="text-muted-foreground">
              Ce lien de paiement n'est plus valide.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <img src={logoPath} alt="SendavaPay" className="h-8" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
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
      <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
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
                <p className="text-sm text-muted-foreground">Produit</p>
                <p className="text-lg font-bold">{paymentLink.title}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "failed") {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
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

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <a href="/" target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:opacity-80 transition-opacity">
            <img src={logoPath} alt="SendavaPay" className="h-8" />
          </a>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
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
          {paymentLink.productImage && step === "info" && (
            <div className="relative h-48 bg-muted">
              <img
                src={paymentLink.productImage}
                alt={paymentLink.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <CardContent className="p-6">
            {step === "info" && (
              <>
                <div className="flex items-start gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                  {paymentLink.productImage ? (
                    <img
                      src={paymentLink.productImage}
                      alt={paymentLink.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-lg line-clamp-2">{paymentLink.title}</h2>
                    {paymentLink.merchantName && (
                      <p className="text-xs text-muted-foreground" data-testid="text-merchant-name">
                        par {paymentLink.merchantName}
                      </p>
                    )}
                    {paymentLink.description && (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground line-clamp-1 flex-1">{paymentLink.description}</p>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2 text-xs text-primary hover:text-primary/80"
                              data-testid="button-view-description"
                            >
                              <Info className="h-3 w-3 mr-1" />
                              Détails
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-3">
                                {paymentLink.productImage && (
                                  <img
                                    src={paymentLink.productImage}
                                    alt={paymentLink.title}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                )}
                                {paymentLink.title}
                              </DialogTitle>
                            </DialogHeader>
                            <DialogDescription className="text-base leading-relaxed whitespace-pre-wrap">
                              {paymentLink.description}
                            </DialogDescription>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                    {paymentLink.allowCustomAmount ? (
                      <p className="text-primary font-bold mt-1">
                        À partir de {formatCurrency(paymentLink.minimumAmount || "100")}
                      </p>
                    ) : (
                      <p className="text-primary font-bold mt-1">{formatCurrency(paymentLink.amount)}</p>
                    )}
                  </div>
                </div>

                {paymentLink.allowCustomAmount && (
                  <div className="mb-6 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                    <Label htmlFor="custom-amount" className="text-sm font-medium">
                      Montant à payer
                    </Label>
                    <Input
                      id="custom-amount"
                      type="number"
                      placeholder={`Minimum ${formatCurrency(paymentLink.minimumAmount || "100")}`}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      min={paymentLink.minimumAmount || "100"}
                      className="mt-2 text-lg font-bold"
                      data-testid="input-custom-amount"
                    />
                  </div>
                )}

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
                    {formatCurrency(getPaymentAmount(), currency)}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Pays</Label>
                    <CountrySelect
                      options={countries.map(c => ({ value: c.code, label: c.name, flag: c.flag, subLabel: c.currency }))}
                      value={selectedCountry}
                      onChange={setSelectedCountry}
                      placeholder="Sélectionnez votre pays"
                      data-testid="select-country"
                    />
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
                              <span className="text-xs font-bold text-center">{service.description}</span>
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
                        Payer {formatCurrency(getPaymentAmount(), currency)}
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
