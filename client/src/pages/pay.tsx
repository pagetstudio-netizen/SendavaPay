import { useState, useEffect } from "react";
import { useRoute, useSearch } from "wouter";
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
  Moon,
  Sun,
  Info,
} from "lucide-react";
import logoPath from "@assets/20251211_105226_1765450558306.png";
import mtnLogo from "@assets/mtn_(1)_1763835082904-BVdEqpuz_1769443204393.png";
import moovLogo from "@assets/moov_(1)_1763835082986-GKkwwfPK_1769443204522.png";
import orangeLogo from "@assets/images_1769443862827.png";
import tmoneyLogo from "@assets/images_(1)_1769443862863.png";
import airtelLogo from "@assets/Airtel_logo-01_1769443862893.png";
import vodacomLogo from "@assets/vodacom_1769443862923.png";
import type { PaymentLink } from "@shared/schema";

const countries = [
  { code: "BJ", name: "Bénin", flag: "\u{1F1E7}\u{1F1EF}", prefix: "+229" },
  { code: "BF", name: "Burkina Faso", flag: "\u{1F1E7}\u{1F1EB}", prefix: "+226" },
  { code: "TG", name: "Togo", flag: "\u{1F1F9}\u{1F1EC}", prefix: "+228" },
  { code: "CM", name: "Cameroun", flag: "\u{1F1E8}\u{1F1F2}", prefix: "+237" },
  { code: "CI", name: "Côte d'Ivoire", flag: "\u{1F1E8}\u{1F1EE}", prefix: "+225" },
  { code: "CD", name: "RDC", flag: "\u{1F1E8}\u{1F1E9}", prefix: "+243" },
  { code: "CG", name: "Congo Brazzaville", flag: "\u{1F1E8}\u{1F1EC}", prefix: "+242" },
];

const paymentMethodsByCountry: Record<string, { id: string; name: string; logo: string }[]> = {
  BJ: [
    { id: "mtn", name: "MTN Mobile Money", logo: mtnLogo },
    { id: "moov", name: "Moov Money", logo: moovLogo },
  ],
  BF: [
    { id: "orange", name: "Orange Money", logo: orangeLogo },
    { id: "moov", name: "Moov Money", logo: moovLogo },
  ],
  TG: [
    { id: "moov", name: "Moov Money", logo: moovLogo },
    { id: "tmoney", name: "TMoney", logo: tmoneyLogo },
  ],
  CM: [
    { id: "mtn", name: "MTN Mobile Money", logo: mtnLogo },
    { id: "orange", name: "Orange Money", logo: orangeLogo },
  ],
  CI: [
    { id: "mtn", name: "MTN Mobile Money", logo: mtnLogo },
    { id: "moov", name: "Moov Money", logo: moovLogo },
    { id: "orange", name: "Orange Money", logo: orangeLogo },
  ],
  CD: [
    { id: "airtel", name: "Airtel Money", logo: airtelLogo },
    { id: "vodacom", name: "Vodacom M-Pesa", logo: vodacomLogo },
  ],
  CG: [
    { id: "mtn", name: "MTN Mobile Money", logo: mtnLogo },
    { id: "airtel", name: "Airtel Money", logo: airtelLogo },
  ],
};

function getCurrencyForCountry(countryCode: string): string {
  switch (countryCode) {
    case "CD": return "CDF";
    case "CM":
    case "CG": return "XAF";
    default: return "XOF";
  }
}

function formatCurrency(amount: string | number, currency: string = "XOF") {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-FR").format(num) + " " + currency;
}

export default function PaymentPage() {
  const [, params] = useRoute("/pay/:code");
  const searchString = useSearch();
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [step, setStep] = useState<"info" | "payment" | "complete" | "processing" | "verifying">("info");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(searchString);
    if (urlParams.get("status") === "success") {
      // Récupérer le paymentId stocké
      const storedPaymentId = localStorage.getItem("lastLinkPaymentId");
      if (storedPaymentId) {
        setStep("verifying");
        // Vérifier le statut du paiement
        fetch("/api/verify-link-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId: storedPaymentId }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.status === "completed") {
              setVerificationMessage(data.message || "Paiement effectué avec succès!");
              localStorage.removeItem("lastLinkPaymentId");
            } else {
              setVerificationMessage("Paiement en cours de traitement. Vous recevrez une confirmation par email.");
            }
            setStep("complete");
          })
          .catch(() => {
            setVerificationMessage("Vérification du paiement en cours...");
            setStep("complete");
          });
      } else {
        setStep("complete");
      }
    }
  }, [searchString]);

  const { data: paymentLink, isLoading, error } = useQuery<PaymentLink>({
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

  const payMutation = useMutation({
    mutationFn: async (data: { 
      payerName: string; 
      payerPhone: string; 
      payerEmail?: string;
      payerCountry: string;
      paymentMethod: string;
      paidAmount?: number;
    }) => {
      const res = await apiRequest("POST", `/api/pay/${params?.code}`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.paymentUrl) {
        // Stocker le paymentId pour vérification au retour
        if (data.paymentId) {
          localStorage.setItem("lastLinkPaymentId", data.paymentId);
        }
        window.location.href = data.paymentUrl;
      } else {
        toast({
          title: "Erreur",
          description: "URL de paiement non reçue",
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

  const selectedCountry = countries.find(c => c.code === country);
  const availablePaymentMethods = country ? paymentMethodsByCountry[country] || [] : [];
  const selectedMethod = availablePaymentMethods.find(m => m.id === paymentMethod);

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
          description: `Le montant minimum est de ${formatCurrency(minAmt, "XOF")}.`,
          variant: "destructive",
        });
        return;
      }
    }

    setStep("payment");
  };

  const handleSubmitPayment = () => {
    if (!country) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez sélectionner votre pays.",
        variant: "destructive",
      });
      return;
    }
    if (!paymentMethod) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez sélectionner un moyen de paiement.",
        variant: "destructive",
      });
      return;
    }
    if (!phoneNumber.trim()) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez entrer votre numéro de paiement.",
        variant: "destructive",
      });
      return;
    }

    const fullPhone = `${selectedCountry?.prefix || ""}${phoneNumber}`;
    
    payMutation.mutate({
      payerName: `${firstName} ${lastName}`,
      payerPhone: fullPhone,
      payerEmail: email || undefined,
      payerCountry: country,
      paymentMethod,
      paidAmount: paymentLink?.allowCustomAmount ? parseFloat(customAmount) : undefined,
    });
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

  if (step === "verifying") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md overflow-hidden">
          <CardContent className="p-8 text-center">
            <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-blue-500 flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-white animate-spin" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Vérification du paiement...</h2>
            <p className="text-muted-foreground mb-6">
              Nous vérifions le statut de votre paiement. Veuillez patienter.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "complete") {
    const isCompleted = verificationMessage.includes("succès");
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md overflow-hidden">
          <CardContent className="p-8 text-center">
            <div className={`h-20 w-20 mx-auto mb-6 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-yellow-500'} flex items-center justify-center`}>
              {isCompleted ? (
                <CheckCircle className="h-10 w-10 text-white" />
              ) : (
                <Clock className="h-10 w-10 text-white" />
              )}
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {isCompleted ? "Paiement réussi!" : "Paiement en cours de traitement"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {verificationMessage || "Votre paiement a été initié avec succès. Le vendeur sera notifié dès la confirmation."}
            </p>
            {paymentLink && (
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-muted-foreground">Produit</p>
                <p className="text-lg font-bold">{paymentLink.title}</p>
              </div>
            )}
          </CardContent>
        </Card>
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
              <span>{selectedCountry?.flag || countries[0].flag}</span>
              <span className="font-medium">{getCurrencyForCountry(country || "TG")}</span>
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
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-lg font-bold text-primary">
                                {paymentLink.allowCustomAmount 
                                  ? `À partir de ${formatCurrency(paymentLink.minimumAmount || "100")}`
                                  : formatCurrency(paymentLink.amount)
                                }
                              </p>
                            </div>
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
                      Montant à payer (XOF)
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

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Vos informations sont utilisées uniquement pour votre commande.
                    Aucun compte n'est créé automatiquement.
                  </p>

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
                <div className="text-center mb-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total dû aujourd'hui</p>
                  <p className="text-3xl font-bold text-primary" data-testid="text-payment-amount">
                    {formatCurrency(getPaymentAmount(), getCurrencyForCountry(country))}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Pays</Label>
                    <Select value={country} onValueChange={(val) => { setCountry(val); setPaymentMethod(""); }}>
                      <SelectTrigger data-testid="select-country">
                        <SelectValue placeholder="Sélectionnez votre pays" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            <span className="flex items-center gap-2">
                              <span>{c.flag}</span>
                              <span>{c.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {country && availablePaymentMethods.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">Méthode de paiement</Label>
                      <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-3 gap-3">
                        {availablePaymentMethods.map((method) => (
                          <div key={method.id}>
                            <RadioGroupItem
                              value={method.id}
                              id={`pay-${method.id}`}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={`pay-${method.id}`}
                              className="flex flex-col items-center gap-2 rounded-lg border-2 p-3 cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
                              data-testid={`radio-payment-${method.id}`}
                            >
                              <img src={method.logo} alt={method.name} className="h-10 w-10 object-contain rounded-full" />
                              <span className="text-xs font-medium text-center">{method.name}</span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  {paymentMethod && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        Numéro {selectedMethod?.name}
                      </Label>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1 px-3 py-2 bg-muted rounded-md text-sm font-medium min-w-fit">
                          <span>{selectedCountry?.flag}</span>
                          <span>{selectedCountry?.prefix}</span>
                        </div>
                        <Input
                          type="tel"
                          placeholder="00 00 00 00"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="flex-1"
                          data-testid="input-phone"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setStep("info")}
                      className="flex-1"
                      data-testid="button-back"
                    >
                      Retour
                    </Button>
                    <Button
                      onClick={handleSubmitPayment}
                      disabled={payMutation.isPending || !country || !paymentMethod || !phoneNumber}
                      className="flex-1"
                      data-testid="button-pay"
                    >
                      {payMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Redirection...
                        </>
                      ) : (
                        `Payer ${formatCurrency(getPaymentAmount(), getCurrencyForCountry(country))}`
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}

            <a 
              href="/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              <Shield className="h-4 w-4" />
              <span>Paiement sécurisé par SendavaPay</span>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
