import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Info, ArrowLeft, Shield, Clock, CheckCircle, XCircle, Wallet } from "lucide-react";
import { Link } from "wouter";
import mtnLogo from "@assets/mtn_(1)_1763835082904-BVdEqpuz_1769443204393.png";
import moovLogo from "@assets/moov_(1)_1763835082986-GKkwwfPK_1769443204522.png";
import orangeLogo from "@assets/images_1769443862827.png";
import tmoneyLogo from "@assets/images_(1)_1769443862863.png";
import airtelLogo from "@assets/Airtel_logo-01_1769443862893.png";
import vodacomLogo from "@assets/vodacom_1769443862923.png";

interface WithdrawOperator {
  id: string;
  name: string;
  inMaintenance?: boolean;
}

interface WithdrawCountry {
  id: string;
  name: string;
  currency: string;
  methods: WithdrawOperator[];
}

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

interface WithdrawalRequest {
  id: number;
  amount: string;
  fee: string;
  netAmount: string;
  paymentMethod: string;
  mobileNumber: string;
  country: string;
  walletName: string | null;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: "En attente", icon: Clock, color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30" },
  processing: { label: "En cours", icon: Loader2, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" },
  approved: { label: "Approuvé", icon: CheckCircle, color: "text-green-600 bg-green-100 dark:bg-green-900/30" },
  rejected: { label: "Rejeté", icon: XCircle, color: "text-red-600 bg-red-100 dark:bg-red-900/30" },
  failed: { label: "Échoué", icon: XCircle, color: "text-red-600 bg-red-100 dark:bg-red-900/30" },
};

export default function WithdrawPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [country, setCountry] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [mobileNumber, setMobileNumber] = useState(user?.phone || "");
  const [walletName, setWalletName] = useState("");

  const { data: countries = [], isLoading: countriesLoading } = useQuery<WithdrawCountry[]>({
    queryKey: ["/api/withdraw/operators"],
  });

  const { data: withdrawalRequests = [], isLoading: requestsLoading } = useQuery<WithdrawalRequest[]>({
    queryKey: ["/api/withdrawal-requests"],
  });

  const selectedCountry = countries.find(c => c.id === country);
  const availableMethods = selectedCountry?.methods || [];
  
  // Reset payment method when country changes
  useEffect(() => {
    setPaymentMethod("");
  }, [country]);

  const commissionRate = 7;
  const balance = parseFloat(user?.balance || "0");
  const numericAmount = parseFloat(amount) || 0;
  const fee = Math.round(numericAmount * (commissionRate / 100));
  const netAmount = numericAmount - fee;
  const minWithdrawal = 500;

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: number; paymentMethod: string; mobileNumber: string; country: string; walletName: string }) => {
      const res = await apiRequest("POST", "/api/withdraw", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Demande soumise",
        description: data.message || "Votre demande de retrait a été soumise.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawal-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setAmount("");
      setWalletName("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.isVerified) {
      toast({
        title: "Compte non vérifié",
        description: "Veuillez vérifier votre compte pour effectuer des retraits.",
        variant: "destructive",
      });
      return;
    }

    if (numericAmount < minWithdrawal) {
      toast({
        title: "Montant insuffisant",
        description: `Le montant minimum de retrait est de ${minWithdrawal} XOF.`,
        variant: "destructive",
      });
      return;
    }

    if (numericAmount > balance) {
      toast({
        title: "Solde insuffisant",
        description: "Vous n'avez pas assez de fonds pour ce retrait.",
        variant: "destructive",
      });
      return;
    }

    if (!country) {
      toast({
        title: "Pays requis",
        description: "Veuillez sélectionner un pays.",
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Moyen de paiement requis",
        description: "Veuillez sélectionner un moyen de paiement.",
        variant: "destructive",
      });
      return;
    }

    withdrawMutation.mutate({
      amount: numericAmount,
      paymentMethod,
      mobileNumber,
      country,
      walletName,
    });
  };

  const handleMaxAmount = () => {
    setAmount(Math.floor(balance).toString());
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("fr-FR").format(num) + " XOF";
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };


  if (!user?.isVerified) {
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
              <h1 className="text-2xl font-bold">Retrait</h1>
              <p className="text-muted-foreground">Retirez de l'argent vers votre Mobile Money</p>
            </div>
          </div>

          <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30">
            <CardContent className="p-8 text-center">
              <Shield className="h-16 w-16 mx-auto mb-4 text-orange-500" />
              <h2 className="text-xl font-semibold text-orange-800 dark:text-orange-200 mb-2">
                Compte non vérifié
              </h2>
              <p className="text-orange-600 dark:text-orange-300 mb-6 max-w-md mx-auto">
                Votre compte n'est pas encore vérifié. Veuillez vérifier votre compte afin d'utiliser 
                nos services de paiement sécurisés. Un compte non vérifié ne peut pas effectuer de retraits.
              </p>
              <Link href="/dashboard/kyc">
                <Button data-testid="button-verify-now">
                  Vérifier mon compte
                </Button>
              </Link>
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
            <h1 className="text-2xl font-bold">Retrait</h1>
            <p className="text-muted-foreground">Demandez un retrait vers votre Mobile Money</p>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <CardContent className="p-6">
            <p className="text-sm opacity-80">Solde disponible</p>
            <p className="text-3xl font-bold mt-1" data-testid="text-available-balance">
              {balance.toLocaleString()} XOF
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nouvelle demande de retrait</CardTitle>
            <CardDescription>
              Minimum: {minWithdrawal.toLocaleString()} XOF. Tous les retraits nécessitent une validation par un administrateur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="amount">Montant (XOF)</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={handleMaxAmount}>
                    Max: {balance.toLocaleString()} XOF
                  </Button>
                </div>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Entrez le montant"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-2xl h-14 font-semibold"
                  min={minWithdrawal}
                  max={balance}
                  data-testid="input-withdraw-amount"
                />
              </div>

              {numericAmount > 0 && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Montant demandé</span>
                      <span>{numericAmount.toLocaleString()} XOF</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Frais ({commissionRate}%)
                      </span>
                      <span>-{fee.toLocaleString()} XOF</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Vous recevez</span>
                      <span className="text-green-600">{netAmount.toLocaleString()} XOF</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label>Pays de réception</Label>
                <Select value={country} onValueChange={(value) => { setCountry(value); setPaymentMethod(""); }}>
                  <SelectTrigger data-testid="select-country">
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
                      if (!method?.inMaintenance) {
                        setPaymentMethod(val);
                      }
                    }} 
                    className="grid grid-cols-2 md:grid-cols-3 gap-4"
                  >
                    {availableMethods.map((method) => {
                      const logoKey = method.name.toLowerCase().replace(/\s+/g, "").replace("-", "");
                      return (
                        <div key={method.id} className="relative">
                          <RadioGroupItem
                            value={method.id}
                            id={`withdraw-${method.id}`}
                            className="peer sr-only"
                            disabled={method.inMaintenance}
                          />
                          <Label
                            htmlFor={`withdraw-${method.id}`}
                            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                              method.inMaintenance
                                ? "opacity-50 cursor-not-allowed bg-muted"
                                : "cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                            }`}
                          >
                            <img 
                              src={methodLogos[logoKey] || methodLogos[method.name.toLowerCase()] || moovLogo} 
                              alt={method.name} 
                              className="h-12 w-12 object-contain rounded-full" 
                            />
                            <span className="text-xs font-medium text-center">{method.name}</span>
                            {method.inMaintenance && (
                              <span className="text-xs text-orange-600 font-medium">En maintenance</span>
                            )}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Numéro de téléphone destinataire</Label>
                <Input
                  id="mobileNumber"
                  type="tel"
                  placeholder="+228 99 99 99 99"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  data-testid="input-withdraw-mobile"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="walletName" className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Nom du portefeuille (optionnel)
                </Label>
                <Input
                  id="walletName"
                  type="text"
                  placeholder="Ex: Mon portefeuille principal"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  data-testid="input-wallet-name"
                />
                <p className="text-xs text-muted-foreground">
                  Un nom pour identifier ce portefeuille dans vos demandes
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={withdrawMutation.isPending || numericAmount < minWithdrawal || numericAmount > balance || !country || !paymentMethod}
                data-testid="button-withdraw-submit"
              >
                {withdrawMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  `Demander le retrait${numericAmount > 0 ? ` de ${numericAmount.toLocaleString()} XOF` : ""}`
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {withdrawalRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Historique des demandes</CardTitle>
              <CardDescription>Vos demandes de retrait récentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requestsLoading ? (
                  <p className="text-muted-foreground text-center py-4">Chargement...</p>
                ) : (
                  withdrawalRequests.map((request) => {
                    const status = statusConfig[request.status];
                    const StatusIcon = status.icon;
                    const countryName = countries.find(c => c.id === request.country)?.name || request.country;
                    
                    return (
                      <div key={request.id} className="flex items-start justify-between p-4 rounded-lg bg-muted/30">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{formatCurrency(request.amount)}</span>
                            <Badge className={status.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {request.paymentMethod.toUpperCase()} - {request.mobileNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {countryName} • {formatDate(request.createdAt)}
                          </p>
                          {request.rejectionReason && (
                            <p className="text-sm text-red-600 mt-2">
                              Raison: {request.rejectionReason}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Vous recevez</p>
                          <p className="font-semibold text-green-600">{formatCurrency(request.netAmount)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
