import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Info, ArrowLeft, Loader2, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import CountrySelect from "@/components/ui/country-select";
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

const TIMEOUT_SECONDS = 120;

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
  "Wave": waveLogo,
};

const quickAmounts = [5000, 10000, 25000, 50000, 100000];

function getOrangeUssdCode(countryCode: string): string {
  const codes: Record<string, string> = {
    CI: "#144#", CM: "#150*50#", BF: "#144#",
    COD: "#144#", COG: "#150#", BJ: "#144#", TG: "#144#",
  };
  return codes[countryCode] || "#144#";
}

export default function DepositPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [currentPayId, setCurrentPayId] = useState("");
  const [currentOrderId, setCurrentOrderId] = useState("");
  const [currentProvider, setCurrentProvider] = useState<"soleaspay" | "maishapay" | "omnipay" | "paxity">("soleaspay");
  const [timeLeft, setTimeLeft] = useState(TIMEOUT_SECONDS);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositOperator, setDepositOperator] = useState("");

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const timeLeftRef = useRef(TIMEOUT_SECONDS);

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
      const availableService = services.find(s => !s.inMaintenance);
      if (availableService) setSelectedServiceId(availableService.id.toString());
      else setSelectedServiceId("");
    }
    setPhoneNumber("");
  }, [services, selectedServiceId]);

  const selectedService = services.find(s => s.id.toString() === selectedServiceId);
  const currency = selectedService?.currency || countries.find(c => c.code === selectedCountry)?.currency || "XOF";
  const phonePrefix = COUNTRY_PREFIXES[selectedService?.countryCode || ""] || "";

  const { data: publicFees } = useQuery<{ countries: { code: string; depositFee: number }[]; global: { depositFee: number } }>({
    queryKey: ["/api/public/fees"],
  });
  const countryFeeData = publicFees?.countries.find(c => c.code === selectedCountry);
  const commissionRate = countryFeeData?.depositFee ?? publicFees?.global?.depositFee ?? 7;
  const numericAmount = parseFloat(amount) || 0;
  const fee = Math.round(numericAmount * (commissionRate / 100));
  const netAmount = numericAmount - fee;

  const stopAll = useCallback(() => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  }, []);

  const openSheet = useCallback(() => {
    setSheetVisible(false);
    setTimeout(() => setSheetVisible(true), 10);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetVisible(false);
    setTimeout(() => {
      setPaymentStatus("idle");
      setVerificationMessage("");
      setCurrentOrderId("");
      setCurrentPayId("");
      setTimeLeft(TIMEOUT_SECONDS);
      timeLeftRef.current = TIMEOUT_SECONDS;
      localStorage.removeItem("soleaspay_payment");
    }, 350);
  }, []);

  const checkPaymentStatus = useCallback(async () => {
    if (!currentPayId) return;
    try {
      const verifyUrl = currentProvider === "maishapay"
        ? `/api/verify-maishapay/${currentPayId}`
        : currentProvider === "omnipay"
        ? `/api/verify-omnipay/${currentPayId}`
        : currentProvider === "paxity"
        ? `/api/verify-paxity/${currentPayId}`
        : `/api/verify-soleaspay/${currentOrderId}/${currentPayId}`;

      const response = await fetch(verifyUrl, { credentials: "include" });
      const data = await response.json();

      if (data.status === "SUCCESS") {
        stopAll();
        setPaymentStatus("completed");
        setVerificationMessage(data.message || "Paiement crédité avec succès!");
        localStorage.removeItem("soleaspay_payment");
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      } else if (data.status === "FAILURE") {
        stopAll();
        setPaymentStatus("failed");
        setVerificationMessage(data.message || "Le paiement a échoué. Veuillez réessayer.");
        localStorage.removeItem("soleaspay_payment");
      }
    } catch {
      /* continue polling */
    }
  }, [currentOrderId, currentPayId, currentProvider, stopAll]);

  const startCountdown = useCallback(() => {
    timeLeftRef.current = TIMEOUT_SECONDS;
    setTimeLeft(TIMEOUT_SECONDS);
    countdownRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        stopAll();
        setPaymentStatus("failed");
        setVerificationMessage("Délai dépassé. La transaction n'a pas pu être confirmée. Veuillez réessayer.");
        localStorage.removeItem("soleaspay_payment");
      }
    }, 1000);
  }, [stopAll]);

  useEffect(() => {
    const saved = localStorage.getItem("soleaspay_payment");
    if (saved) {
      try {
        const { orderId, payId, provider, timestamp, amount: amt, operator } = JSON.parse(saved);
        const MAX_AGE_MS = TIMEOUT_SECONDS * 1000;
        const elapsed = Date.now() - (timestamp || 0);
        if (elapsed > MAX_AGE_MS) { localStorage.removeItem("soleaspay_payment"); return; }
        if (payId) {
          setCurrentOrderId(orderId || "");
          setCurrentPayId(payId);
          setCurrentProvider(provider || "soleaspay");
          setDepositAmount(amt || 0);
          setDepositOperator(operator || "");
          setPaymentStatus("processing");
          const remaining = Math.max(0, TIMEOUT_SECONDS - Math.floor(elapsed / 1000));
          timeLeftRef.current = remaining;
          setTimeLeft(remaining);
          openSheet();
        }
      } catch { localStorage.removeItem("soleaspay_payment"); }
    }
  }, []);

  useEffect(() => {
    if (paymentStatus === "processing" && currentPayId) {
      checkPaymentStatus();
      pollingRef.current = setInterval(checkPaymentStatus, 3000);
    }
    return () => { if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; } };
  }, [paymentStatus, currentPayId, checkPaymentStatus]);

  useEffect(() => {
    if (paymentStatus === "processing") startCountdown();
    return () => { if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; } };
  }, [paymentStatus, startCountdown]);

  const depositMutation = useMutation({
    mutationFn: async (data: { amount: number; serviceId: string; phoneNumber?: string }) => {
      const response = await apiRequest("POST", "/api/deposit-soleaspay", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.payId) {
        const provider = data.provider || "soleaspay";
        setDepositAmount(numericAmount);
        setDepositOperator(selectedService?.operator || "");
        localStorage.setItem("soleaspay_payment", JSON.stringify({
          orderId: data.orderId || "",
          payId: data.payId,
          provider,
          timestamp: Date.now(),
          amount: numericAmount,
          operator: selectedService?.operator || "",
        }));
        setCurrentOrderId(data.orderId || "");
        setCurrentPayId(data.payId);
        setCurrentProvider(provider);
        setPaymentStatus("processing");
        openSheet();

        if ((provider === "omnipay" || provider === "paxity") && data.checkoutUrl) {
          window.open(data.checkoutUrl, "_blank");
          setVerificationMessage("Complétez le paiement sur la page ouverte, puis revenez ici.");
        } else if (data.isWave && data.waveUrl) {
          window.open(data.waveUrl, "_blank");
          setVerificationMessage("Confirmez le paiement dans l'application Wave, puis revenez ici.");
        } else {
          setVerificationMessage("Veuillez confirmer le paiement sur votre téléphone.");
        }
      } else {
        toast({ title: "Erreur", description: data.message || "Erreur lors du paiement", variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message || "Une erreur est survenue", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount < 100) {
      toast({ title: "Montant invalide", description: `Le montant minimum est de 100 ${currency}.`, variant: "destructive" });
      return;
    }
    if (!phoneNumber || phoneNumber.length < 5) {
      toast({ title: "Numéro invalide", description: "Veuillez entrer un numéro de téléphone valide.", variant: "destructive" });
      return;
    }
    depositMutation.mutate({
      amount: numericAmount,
      serviceId: selectedServiceId,
      phoneNumber: (phonePrefix + phoneNumber).replace(/\s/g, ""),
    });
  };

  const operatorLogo = operatorLogos[depositOperator] || mtnLogo;
  const progressPercent = Math.round((timeLeft / TIMEOUT_SECONDS) * 100);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
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
                <CountrySelect
                  options={countries.map(c => ({ value: c.code, label: c.name, flag: c.flag, subLabel: c.currency }))}
                  value={selectedCountry}
                  onChange={setSelectedCountry}
                  placeholder="Sélectionnez un pays"
                  data-testid="select-country"
                />
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
                        <RadioGroupItem value={service.id.toString()} id={`service-${service.id}`} className="peer sr-only" disabled={service.inMaintenance} />
                        <Label
                          htmlFor={`service-${service.id}`}
                          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                            service.inMaintenance
                              ? "opacity-50 cursor-not-allowed bg-muted"
                              : "cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                          }`}
                          data-testid={`radio-service-${service.id}`}
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
                <Label htmlFor="phone">Numéro de téléphone Mobile Money</Label>
                <div className="flex h-12">
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
                    className={phonePrefix ? "rounded-l-none h-12" : "h-12"}
                    data-testid="input-phone-number"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Entrez le numéro local associé à votre compte {selectedService?.operator || "Mobile Money"}
                </p>
              </div>

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
                      <span className="flex items-center gap-1"><Info className="h-3 w-3" />Frais ({commissionRate}%)</span>
                      <span>-{fee.toLocaleString()} {currency}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Vous recevez</span>
                      <span className="text-primary">{netAmount.toLocaleString()} {currency}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20"
                disabled={numericAmount < 100 || phoneNumber.length < 5 || depositMutation.isPending || paymentStatus === "processing"}
                data-testid="button-deposit-submit"
              >
                {depositMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Traitement...</>
                ) : paymentStatus === "processing" ? (
                  <><Clock className="mr-2 h-4 w-4" />Transaction en cours...</>
                ) : (
                  `Déposer ${numericAmount > 0 ? numericAmount.toLocaleString() + " " + currency : ""}`
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom Sheet Overlay ────────────────────────────────────────────── */}
      {paymentStatus !== "idle" && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${sheetVisible ? "opacity-100" : "opacity-0"}`}
          />

          {/* Sheet */}
          <div
            className={`relative bg-background rounded-t-3xl shadow-2xl transition-transform duration-350 ease-out w-full max-w-lg mx-auto ${sheetVisible ? "translate-y-0" : "translate-y-full"}`}
            style={{ transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)" }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="px-6 pb-8 pt-4 space-y-6">

              {/* PROCESSING */}
              {paymentStatus === "processing" && (
                <>
                  <div className="text-center space-y-4">
                    <div className="relative mx-auto w-20 h-20">
                      {/* Outer pulsing ring */}
                      <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                      <div className="absolute inset-1 rounded-full bg-blue-500/10 animate-pulse" />
                      {/* Operator logo */}
                      <div className="relative w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-blue-200">
                        <img src={operatorLogo} alt={depositOperator} className="h-12 w-12 object-contain rounded-full" />
                      </div>
                    </div>

                    <div>
                      <h2 className="text-xl font-bold">Transaction en cours</h2>
                      <p className="text-muted-foreground text-sm mt-1">
                        {verificationMessage || "Veuillez confirmer le paiement sur votre téléphone."}
                      </p>
                    </div>

                    {depositAmount > 0 && (
                      <div className="bg-muted/50 rounded-2xl p-4 space-y-1">
                        <p className="text-2xl font-bold text-primary">{depositAmount.toLocaleString()} {currency}</p>
                        <p className="text-xs text-muted-foreground">via {depositOperator}</p>
                      </div>
                    )}

                    {/* Animated dots */}
                    <div className="flex justify-center gap-2">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-blue-500"
                          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                        />
                      ))}
                    </div>

                    {/* Countdown bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Expiration</span>
                        <span className={timeLeft <= 30 ? "text-orange-500 font-semibold" : ""}>{timeLeft}s</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 30 ? "bg-orange-500" : "bg-blue-500"}`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    La transaction sera automatiquement annulée si non confirmée.
                  </p>
                </>
              )}

              {/* COMPLETED */}
              {paymentStatus === "completed" && (
                <>
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-green-600">Paiement réussi !</h2>
                      <p className="text-muted-foreground text-sm mt-1">{verificationMessage}</p>
                    </div>
                    {depositAmount > 0 && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 space-y-1">
                        <p className="text-2xl font-bold text-green-600">+{netAmount > 0 ? netAmount.toLocaleString() : depositAmount.toLocaleString()} {currency}</p>
                        <p className="text-xs text-muted-foreground">crédité sur votre compte</p>
                      </div>
                    )}
                  </div>
                  <Link href="/dashboard">
                    <Button className="w-full h-12 font-semibold" data-testid="button-back-dashboard">
                      Retour au tableau de bord
                    </Button>
                  </Link>
                </>
              )}

              {/* FAILED */}
              {paymentStatus === "failed" && (
                <>
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <XCircle className="h-10 w-10 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-red-600">Transaction échouée</h2>
                      <p className="text-muted-foreground text-sm mt-1">{verificationMessage || "Le paiement n'a pas abouti."}</p>
                    </div>
                    {depositAmount > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-3 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                        <p className="text-sm text-red-700 dark:text-red-400">
                          Aucun montant n'a été débité. Vous pouvez réessayer.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Button
                      className="w-full h-12 font-semibold"
                      onClick={closeSheet}
                      data-testid="button-retry-deposit"
                    >
                      Réessayer
                    </Button>
                    <Link href="/dashboard">
                      <Button variant="outline" className="w-full h-11" data-testid="button-back-dashboard">
                        Retour au tableau de bord
                      </Button>
                    </Link>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </DashboardLayout>
  );
}
