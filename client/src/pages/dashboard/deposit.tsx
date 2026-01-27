import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Info, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Link, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
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

const countries = [
  { id: "bj", name: "Bénin", currency: "XOF" },
  { id: "bf", name: "Burkina Faso", currency: "XOF" },
  { id: "tg", name: "Togo", currency: "XOF" },
  { id: "cm", name: "Cameroun", currency: "XAF" },
  { id: "ci", name: "Côte d'Ivoire", currency: "XOF" },
  { id: "rdc", name: "RDC", currency: "CDF" },
  { id: "cg", name: "Congo Brazzaville", currency: "XAF" },
];

const paymentMethods = [
  { id: "mtn", name: "MTN Mobile Money", logo: mtnLogo, countries: ["bj", "cm", "ci", "cg"] },
  { id: "moov", name: "Moov Money", logo: moovLogo, countries: ["bj", "bf", "tg", "ci"] },
  { id: "orange", name: "Orange Money", logo: orangeLogo, countries: ["bf", "cm", "ci"] },
  { id: "tmoney", name: "TMoney", logo: tmoneyLogo, countries: ["tg"] },
  { id: "airtel", name: "Airtel Money", logo: airtelLogo, countries: ["rdc", "cg"] },
  { id: "vodacom", name: "Vodacom M-Pesa", logo: vodacomLogo, countries: ["rdc"] },
];

const quickAmounts = [5000, 10000, 25000, 50000, 100000];

export default function DepositPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const searchString = useSearch();
  const [amount, setAmount] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("tg");
  const [paymentMethod, setPaymentMethod] = useState("tmoney");
  const [showSuccess, setShowSuccess] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (params.get("status") === "success") {
      // Récupérer le paymentId stocké
      const storedPaymentId = localStorage.getItem("lastPaymentId");
      if (storedPaymentId) {
        setVerifyingPayment(true);
        // Vérifier le statut du paiement
        fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId: storedPaymentId }),
          credentials: "include",
        })
          .then(res => res.json())
          .then(data => {
            setVerifyingPayment(false);
            if (data.status === "completed") {
              setVerificationMessage(data.message || "Paiement crédité avec succès!");
              localStorage.removeItem("lastPaymentId");
            } else {
              setVerificationMessage("Paiement en cours de traitement. Veuillez patienter quelques instants.");
            }
            setShowSuccess(true);
          })
          .catch(() => {
            setVerifyingPayment(false);
            setVerificationMessage("Vérification du paiement en cours...");
            setShowSuccess(true);
          });
      } else {
        setShowSuccess(true);
      }
    }
  }, [searchString]);

  const filteredMethods = useMemo(() => {
    return paymentMethods.filter(m => m.countries.includes(selectedCountry));
  }, [selectedCountry]);

  const handleCountryChange = (val: string) => {
    setSelectedCountry(val);
    const methodsForCountry = paymentMethods.filter(m => m.countries.includes(val));
    if (methodsForCountry.length > 0) {
      setPaymentMethod(methodsForCountry[0].id);
    }
  };

  const currentCountry = countries.find(c => c.id === selectedCountry);
  const currency = currentCountry?.currency || "XOF";

  const commissionRate = 7;
  const numericAmount = parseFloat(amount) || 0;
  const fee = Math.round(numericAmount * (commissionRate / 100));
  const netAmount = numericAmount - fee;

  const depositMutation = useMutation({
    mutationFn: async (data: { amount: number; paymentMethod: string; country: string }) => {
      const response = await apiRequest("POST", "/api/deposit", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.paymentUrl) {
        // Stocker le paymentId pour vérification au retour
        if (data.paymentId) {
          localStorage.setItem("lastPaymentId", data.paymentId);
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
    depositMutation.mutate({
      amount: numericAmount,
      paymentMethod,
      country: selectedCountry,
    });
  };

  if (verifyingPayment) {
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
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Vérification du paiement...</h2>
                <p className="text-muted-foreground">
                  Nous vérifions le statut de votre paiement. Veuillez patienter.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (showSuccess) {
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
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">
                  {verificationMessage.includes("crédité") ? "Paiement réussi!" : "Paiement en cours de traitement"}
                </h2>
                <p className="text-muted-foreground">
                  {verificationMessage || "Votre dépôt a été initié avec succès. Votre solde sera mis à jour automatiquement une fois le paiement confirmé."}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Link href="/dashboard">
                  <Button className="w-full" data-testid="button-back-dashboard">
                    Retour au tableau de bord
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={() => setShowSuccess(false)}
                  data-testid="button-new-deposit"
                >
                  Faire un autre dépôt
                </Button>
              </div>
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
            <CardDescription>Configurez votre dépôt par pays</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="country">Choisir le pays</Label>
                <Select value={selectedCountry} onValueChange={handleCountryChange}>
                  <SelectTrigger id="country" className="h-12">
                    <SelectValue placeholder="Sélectionnez un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              <div className="space-y-4">
                <Label>Moyen de paiement</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-4">
                  {filteredMethods.map((method) => (
                    <div key={method.id}>
                      <RadioGroupItem
                        value={method.id}
                        id={method.id}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={method.id}
                        className="flex flex-col items-center gap-2 rounded-xl border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
                        data-testid={`radio-payment-${method.id}`}
                      >
                        <img src={method.logo} alt={method.name} className="h-12 w-12 object-contain rounded-full bg-white shadow-sm p-1" />
                        <span className="text-xs font-bold text-center">{method.name}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20"
                disabled={numericAmount < 100 || depositMutation.isPending}
                data-testid="button-deposit-submit"
              >
                {depositMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirection...
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
