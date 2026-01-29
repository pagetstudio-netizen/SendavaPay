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
} from "lucide-react";
import logoPath from "@assets/20251211_105226_1765450558306.png";
import mtnLogo from "@assets/mtn_(1)_1763835082904-BVdEqpuz_1769443204393.png";
import moovLogo from "@assets/moov_(1)_1763835082986-GKkwwfPK_1769443204522.png";
import orangeLogo from "@assets/images_1769443862827.png";
import tmoneyLogo from "@assets/images_(1)_1769443862863.png";
import airtelLogo from "@assets/Airtel_logo-01_1769443862893.png";
import vodacomLogo from "@assets/vodacom_1769443862923.png";

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
  operator: string;
  country: string;
  countryCode: string;
  currency: string;
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

function formatCurrency(amount: string | number, currency: string = "XOF") {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-FR").format(num) + " " + currency;
}

export default function PayApiPage() {
  const [, params] = useRoute("/pay/api/:reference");
  const { toast } = useToast();
  
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
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollingAttemptsRef = useRef(0);
  const maxPollingAttempts = 40;

  const { data: transaction, isLoading, error } = useQuery<ApiTransaction>({
    queryKey: ["/api/pay-api", params?.reference],
    enabled: !!params?.reference,
  });

  const { data: countries } = useQuery<{ code: string; name: string; flag: string; currency: string }[]>({
    queryKey: ["/api/soleaspay/countries"],
  });

  const { data: services } = useQuery<SoleasPayService[]>({
    queryKey: ["/api/soleaspay/services", selectedCountry],
    enabled: !!selectedCountry,
  });

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
        setVerificationMessage("Veuillez confirmer le paiement sur votre téléphone...");
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
        } else if (result.status === "failed") {
          stopPolling();
          setStep("failed");
          setVerificationMessage(result.message || "Le paiement a échoué");
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Transaction introuvable</h2>
            <p className="text-muted-foreground">
              Cette transaction n'existe pas ou a expiré.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (transaction.status === "completed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Paiement déjà effectué</h2>
            <p className="text-muted-foreground">
              Cette transaction a déjà été payée.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (transaction.status !== "pending") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Transaction invalide</h2>
            <p className="text-muted-foreground">
              Cette transaction n'est plus disponible.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-center mb-6">
            <img src={logoPath} alt="SendavaPay" className="h-10" />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">{formatCurrency(transaction.amount, transaction.currency)}</h1>
            {transaction.description && (
              <p className="text-muted-foreground mt-1">{transaction.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Paiement à {transaction.ownerName}
            </p>
          </div>

          {step === "info" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Prénom"
                    data-testid="input-firstname"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Nom"
                    data-testid="input-lastname"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  data-testid="input-email"
                />
              </div>
              <Button
                onClick={handleSubmitInfo}
                className="w-full"
                data-testid="button-continue"
              >
                Continuer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("info")}
                className="mb-2"
                data-testid="button-back"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>

              <div>
                <Label>Pays</Label>
                <Select value={selectedCountry} onValueChange={(v) => { setSelectedCountry(v); setSelectedServiceId(""); }}>
                  <SelectTrigger data-testid="select-country">
                    <SelectValue placeholder="Sélectionner un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries?.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCountry && services && services.length > 0 && (
                <div>
                  <Label>Mode de paiement</Label>
                  <RadioGroup value={selectedServiceId} onValueChange={setSelectedServiceId} className="mt-2">
                    {services.map((service) => (
                      <div key={service.id} className="flex items-center space-x-3 p-3 border rounded-lg hover-elevate cursor-pointer" onClick={() => setSelectedServiceId(service.id.toString())}>
                        <RadioGroupItem value={service.id.toString()} id={`service-${service.id}`} />
                        <img
                          src={operatorLogos[service.operator] || mtnLogo}
                          alt={service.operator}
                          className="h-8 w-8 object-contain"
                        />
                        <Label htmlFor={`service-${service.id}`} className="flex-1 cursor-pointer">
                          {service.operator}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {selectedServiceId && (
                <div>
                  <Label htmlFor="phone">Numéro de téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Ex: 90123456"
                      className="pl-10"
                      data-testid="input-phone"
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleSubmitPayment}
                className="w-full"
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

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
                <Shield className="h-4 w-4" />
                Paiement sécurisé par SendavaPay
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="text-center py-8">
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Paiement en cours</h3>
              <p className="text-muted-foreground">{verificationMessage}</p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
                <Clock className="h-4 w-4" />
                Veuillez confirmer sur votre téléphone
              </div>
            </div>
          )}

          {step === "complete" && (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Paiement réussi!</h3>
              <p className="text-muted-foreground">
                Votre paiement de {formatCurrency(transaction.amount, transaction.currency)} a été effectué avec succès.
              </p>
            </div>
          )}

          {step === "failed" && (
            <div className="text-center py-8">
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Paiement échoué</h3>
              <p className="text-muted-foreground mb-4">{verificationMessage}</p>
              <Button onClick={() => { setStep("payment"); stopPolling(); }} data-testid="button-retry">
                Réessayer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
