import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Info, ArrowLeft, Loader2, CheckCircle, XCircle, Clock, Phone } from "lucide-react";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import mtnLogo from "@assets/mtn_(1)_1763835082904-BVdEqpuz_1769443204393.png";
import moovLogo from "@assets/moov_(1)_1763835082986-GKkwwfPK_1769443204522.png";
import orangeLogo from "@assets/images_1769443862827.png";
import tmoneyLogo from "@assets/images_(1)_1769443862863.png";
import airtelLogo from "@assets/Airtel_logo-01_1769443862893.png";
import vodacomLogo from "@assets/vodacom_1769443862923.png";

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

const operatorLogos: Record<string, string> = {
  "MTN": mtnLogo,
  "Moov": moovLogo,
  "Orange": orangeLogo,
  "TMoney": tmoneyLogo,
  "Airtel": airtelLogo,
  "Vodacom": vodacomLogo,
  "Wave": orangeLogo,
};

const quickAmounts = [5000, 10000, 25000, 50000, 100000];

export default function DepositPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "pending" | "completed" | "failed">("idle");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [currentPayId, setCurrentPayId] = useState("");
  const [currentOrderId, setCurrentOrderId] = useState("");
  const [currentProvider, setCurrentProvider] = useState<"soleaspay" | "winipayer" | "maishapay">("soleaspay");
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

  useEffect(() => {
    if (countries.length > 0 && !selectedCountry) {
      setSelectedCountry(countries[0].code);
    }
  }, [countries, selectedCountry]);

  useEffect(() => {
    if (services.length > 0 && (!selectedServiceId || !services.find(s => s.id.toString() === selectedServiceId))) {
      // Select first non-maintenance service
      const availableService = services.find(s => !s.inMaintenance);
      if (availableService) {
        setSelectedServiceId(availableService.id.toString());
      } else {
        setSelectedServiceId("");
      }
    }
  }, [services, selectedServiceId]);

  const selectedService = services.find(s => s.id.toString() === selectedServiceId);
  const currency = selectedService?.currency || countries.find(c => c.code === selectedCountry)?.currency || "XOF";
  const isWiniPayer = selectedService?.paymentGateway === "winipayer";

  const { data: commissionRates } = useQuery<{ depositRate: number; encaissementRate: number; withdrawalRate: number }>({
    queryKey: ["/api/commission-rates"],
  });
  const commissionRate = commissionRates?.depositRate ?? 7;
  const numericAmount = parseFloat(amount) || 0;
  const fee = Math.round(numericAmount * (commissionRate / 100));
  const netAmount = numericAmount - fee;

  const checkPaymentStatus = useCallback(async () => {
    if (!currentPayId) return;

    try {
      const verifyUrl = currentProvider === "winipayer"
        ? `/api/verify-winipayer/${currentPayId}`
        : currentProvider === "maishapay"
        ? `/api/verify-maishapay/${currentPayId}`
        : `/api/verify-soleaspay/${currentOrderId}/${currentPayId}`;
      const response = await fetch(verifyUrl, {
        credentials: "include",
      });
      const data = await response.json();

      console.log("Verification result:", data);

      if (data.status === "SUCCESS") {
        setPaymentStatus("completed");
        setVerificationMessage(data.message || "Paiement crédité avec succès!");
        localStorage.removeItem("soleaspay_payment");
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      } else if (data.status === "FAILURE") {
        setPaymentStatus("failed");
        setVerificationMessage(data.message || "Le paiement a échoué.");
        localStorage.removeItem("soleaspay_payment");
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } else {
        pollingAttemptsRef.current += 1;
        setVerificationMessage(`Vérification en cours... (${pollingAttemptsRef.current}/${maxPollingAttempts})`);

        if (pollingAttemptsRef.current >= maxPollingAttempts) {
          setPaymentStatus("pending");
          setVerificationMessage("Le paiement est en attente. Veuillez confirmer sur votre téléphone et vérifier votre historique.");
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
        setVerificationMessage("Impossible de vérifier le paiement. Vérifiez votre historique.");
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    }
  }, [currentOrderId, currentPayId, currentProvider]);

  useEffect(() => {
    const saved = localStorage.getItem("soleaspay_payment");
    if (saved) {
      try {
        const { orderId, payId, provider, timestamp } = JSON.parse(saved);
        const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes
        const isExpired = !timestamp || Date.now() - timestamp > MAX_AGE_MS;
        if (isExpired) {
          localStorage.removeItem("soleaspay_payment");
          return;
        }
        if (payId) {
          setCurrentOrderId(orderId || "");
          setCurrentPayId(payId);
          setCurrentProvider(provider || "soleaspay");
          setPaymentStatus("processing");
          pollingAttemptsRef.current = 0;
        }
      } catch (e) {
        localStorage.removeItem("soleaspay_payment");
      }
    }
  }, []);

  useEffect(() => {
    if (paymentStatus === "processing" && currentPayId && (currentOrderId || currentProvider === "winipayer")) {
      checkPaymentStatus();
      pollingRef.current = setInterval(checkPaymentStatus, 3000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [paymentStatus, currentOrderId, currentPayId, checkPaymentStatus]);

  const depositMutation = useMutation({
    mutationFn: async (data: { amount: number; serviceId: string; phoneNumber?: string }) => {
      const response = await apiRequest("POST", "/api/deposit-soleaspay", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.payId && data.orderId) {
        const provider = data.provider || "soleaspay";
        localStorage.setItem("soleaspay_payment", JSON.stringify({
          orderId: data.orderId,
          payId: data.payId,
          provider,
          timestamp: Date.now(),
        }));
        setCurrentOrderId(data.orderId);
        setCurrentPayId(data.payId);
        setCurrentProvider(provider);
        
        if (provider === "winipayer" && data.checkoutUrl) {
          toast({
            title: "Redirection en cours",
            description: "Vous allez être redirigé vers la page de paiement.",
          });
          window.open(data.checkoutUrl, "_blank");
          setPaymentStatus("processing");
          pollingAttemptsRef.current = 0;
          setVerificationMessage("Complétez le paiement sur la page de paiement, puis revenez ici.");
        } else if (data.isWave && data.waveUrl) {
          toast({
            title: "Redirection vers Wave",
            description: "Vous allez être redirigé vers l'application Wave pour confirmer le paiement.",
          });
          window.open(data.waveUrl, "_blank");
          setPaymentStatus("processing");
          pollingAttemptsRef.current = 0;
          setVerificationMessage("Confirmez le paiement dans l'application Wave, puis revenez ici.");
        } else {
          setPaymentStatus("processing");
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
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount < 100) {
      toast({
        title: "Montant invalide",
        description: `Le montant minimum est de 100 ${currency}.`,
        variant: "destructive",
      });
      return;
    }
    if (!isWiniPayer && (!phoneNumber || phoneNumber.length < 8)) {
      toast({
        title: "Numéro invalide",
        description: "Veuillez entrer un numéro de téléphone valide.",
        variant: "destructive",
      });
      return;
    }
    depositMutation.mutate({
      amount: numericAmount,
      serviceId: selectedServiceId,
      phoneNumber: isWiniPayer ? undefined : phoneNumber.replace(/\s/g, ""),
    });
  };

  const resetPayment = () => {
    setPaymentStatus("idle");
    setVerificationMessage("");
    setCurrentOrderId("");
    setCurrentPayId("");
    localStorage.removeItem("soleaspay_payment");
    pollingAttemptsRef.current = 0;
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  if (paymentStatus !== "idle") {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Dépôt</h1>
              <p className="text-muted-foreground">Rechargez votre compte SendavaPay</p>
            </div>
          </div>

          <Card>
            <CardContent className="p-8 text-center space-y-6">
              {paymentStatus === "completed" ? (
                <>
                  <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-green-600">Paiement réussi!</h2>
                    <p className="text-muted-foreground">{verificationMessage}</p>
                  </div>
                  <Link href="/dashboard">
                    <Button data-testid="button-back-dashboard">Retour au tableau de bord</Button>
                  </Link>
                </>
              ) : paymentStatus === "failed" ? (
                <>
                  <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-red-600">Paiement échoué</h2>
                    <p className="text-muted-foreground">{verificationMessage}</p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={resetPayment} data-testid="button-retry-deposit">
                      Réessayer
                    </Button>
                    <Link href="/dashboard">
                      <Button data-testid="button-back-dashboard">Retour</Button>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold">
                      {paymentStatus === "pending" ? "Paiement en attente" : "Vérification du paiement..."}
                    </h2>
                    <p className="text-muted-foreground">
                      {verificationMessage || "Veuillez confirmer le paiement sur votre téléphone."}
                    </p>
                  </div>
                  {paymentStatus === "pending" ? (
                    <div className="flex flex-col gap-3">
                      <Button variant="outline" onClick={resetPayment} data-testid="button-new-deposit">
                        Nouveau dépôt
                      </Button>
                      <Link href="/dashboard">
                        <Button className="w-full" data-testid="button-back-dashboard-pending">
                          Retour au tableau de bord
                        </Button>
                      </Link>
                    </div>
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
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Dépôt</h1>
            <p className="text-muted-foreground">Rechargez votre compte SendavaPay</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dépôt Mobile Money</CardTitle>
            <CardDescription>Configurez votre dépôt par pays et opérateur</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="country">Choisir le pays</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger id="country" className="h-12" data-testid="select-country">
                    <SelectValue placeholder="Sélectionnez un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.currency})
                      </SelectItem>
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
                      if (!srv?.inMaintenance) {
                        setSelectedServiceId(val);
                      }
                    }} 
                    className="grid grid-cols-2 gap-4"
                  >
                    {services.map((service) => (
                      <div key={service.id} className="relative">
                        <RadioGroupItem
                          value={service.id.toString()}
                          id={`service-${service.id}`}
                          className="peer sr-only"
                          disabled={service.inMaintenance}
                        />
                        <Label
                          htmlFor={`service-${service.id}`}
                          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                            service.inMaintenance 
                              ? "opacity-50 cursor-not-allowed bg-muted" 
                              : "cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                          }`}
                          data-testid={`radio-service-${service.id}`}
                        >
                          <img 
                            src={operatorLogos[service.operator] || mtnLogo} 
                            alt={service.operator} 
                            className="h-12 w-12 object-contain rounded-full bg-white shadow-sm p-1" 
                          />
                          <span className="text-xs font-bold text-center">{service.description}</span>
                          {service.inMaintenance && (
                            <span className="text-xs text-orange-600 font-medium">En maintenance</span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {isWiniPayer ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Vous serez redirigé vers la page de paiement pour compléter votre dépôt. Aucun numéro de téléphone n'est requis.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="phone">Numéro de téléphone Mobile Money</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Ex: 90123456"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-10 h-12"
                      data-testid="input-phone-number"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Entrez le numéro associé à votre compte {selectedService?.operator || "Mobile Money"}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <Label htmlFor="amount">Montant ({currency})</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Entrez le montant"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-2xl h-14 font-semibold"
                  min="100"
                  data-testid="input-deposit-amount"
                />
                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map((qa) => (
                    <Button
                      key={qa}
                      type="button"
                      variant={numericAmount === qa ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAmount(qa.toString())}
                      data-testid={`button-quick-amount-${qa}`}
                    >
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
                      <span className="flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Frais ({commissionRate}%)
                      </span>
                      <span>-{fee.toLocaleString()} {currency}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Vous recevez</span>
                      <span className="text-green-600">{netAmount.toLocaleString()} {currency}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20"
                disabled={numericAmount < 100 || (!isWiniPayer && !phoneNumber) || depositMutation.isPending}
                data-testid="button-deposit-submit"
              >
                {depositMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  `Déposer ${numericAmount > 0 ? numericAmount.toLocaleString() + " " + currency : ""}`
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
