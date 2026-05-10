import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import CountrySelect from "@/components/ui/country-select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Info, ArrowLeft, Shield, Clock, CheckCircle, XCircle, Wallet, BadgeCheck, Check } from "lucide-react";
import { Link } from "wouter";
import mtnLogo from "@assets/mtn_(1)_1763835082904-BVdEqpuz_1769443204393.png";
import moovLogo from "@assets/moov_(1)_1763835082986-GKkwwfPK_1769443204522.png";
import orangeLogo from "@assets/images_1769443862827.png";
import tmoneyLogo from "@assets/images_(1)_1769443862863.png";
import airtelLogo from "@assets/Airtel_logo-01_1769443862893.png";
import vodacomLogo from "@assets/vodacom_1769443862923.png";
import waveLogo from "@assets/images_(16)_1772485816419.jpeg";
import type { Wallet as WalletType } from "@shared/schema";

const COUNTRY_PREFIXES: Record<string, string> = {
  CI: "+225", BJ: "+229", TG: "+228", BF: "+226",
  SN: "+221", CM: "+237", ML: "+223", NE: "+227",
  GW: "+245", COG: "+242", COD: "+243",
};

// Map currency → country codes eligible to receive that currency
const CURRENCY_COUNTRY_CODES: Record<string, string[]> = {
  XOF: ["SN", "ML", "CI", "BF", "BJ", "TG"],
  XAF: ["CM", "COG"],
  CDF: ["COD"],
};

const HIDDEN_WALLETS = ["NE", "GW"];

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
  wave: waveLogo,
};

interface WithdrawalRequest {
  id: number;
  amount: string;
  fee: string;
  netAmount: string;
  paymentMethod: string;
  mobileNumber: string;
  country: string;
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
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [country, setCountry] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [coverFees, setCoverFees] = useState(false);

  const { data: walletsData } = useQuery<{ wallets: WalletType[] }>({
    queryKey: ["/api/wallets"],
  });
  const wallets = (walletsData?.wallets ?? []).filter(w => !HIDDEN_WALLETS.includes(w.countryCode));

  const { data: allCountries = [], isLoading: countriesLoading } = useQuery<WithdrawCountry[]>({
    queryKey: ["/api/withdraw/operators"],
  });

  const { data: withdrawalRequests = [], isLoading: requestsLoading } = useQuery<WithdrawalRequest[]>({
    queryKey: ["/api/withdrawal-requests"],
  });

  // Auto-select first wallet and matching country
  useEffect(() => {
    if (wallets.length > 0 && !selectedWalletId) {
      const first = wallets[0];
      setSelectedWalletId(first.id);
      const matchingCountry = allCountries.find(c => c.id.toUpperCase() === first.countryCode.toUpperCase());
      if (matchingCountry) setCountry(matchingCountry.id);
    }
  }, [wallets, allCountries, selectedWalletId]);

  const selectedWallet = wallets.find(w => w.id === selectedWalletId) ?? null;

  // All countries (no filtering by wallet — user picks country independently)
  const countries = useMemo(() => allCountries, [allCountries]);

  const selectedCountryObj = countries.find(c => c.id === country);
  const availableMethods = selectedCountryObj?.methods || [];
  const phonePrefix = COUNTRY_PREFIXES[country.toUpperCase()] || "";

  // When country changes, auto-select the matching wallet if one exists
  const handleCountryChange = (val: string) => {
    setCountry(val);
    setPaymentMethod("");
    setMobileNumber("");
    const matchingWallet = wallets.find(w => w.countryCode.toUpperCase() === val.toUpperCase());
    if (matchingWallet) setSelectedWalletId(matchingWallet.id);
  };

  useEffect(() => {
    setPaymentMethod("");
    setMobileNumber("");
  }, [country]);

  const { data: publicFees } = useQuery<{ countries: { code: string; depositFee: number; withdrawFee: number }[]; global: { depositFee: number; withdrawFee: number } }>({
    queryKey: ["/api/public/fees"],
  });
  const countryFeeData = publicFees?.countries.find(c => c.code === country.toUpperCase());
  const commissionRate = countryFeeData?.withdrawFee ?? publicFees?.global?.withdrawFee ?? 7;

  const balance = selectedWallet ? parseFloat(selectedWallet.balance) : parseFloat(user?.balance || "0");
  const currency = selectedWallet?.currency || "XOF";
  const numericAmount = parseFloat(amount) || 0;
  const fee = Math.round(numericAmount * (commissionRate / 100));
  const netAmount = coverFees ? numericAmount : numericAmount - fee;
  const totalDeducted = coverFees ? numericAmount + fee : numericAmount;
  const minWithdrawal = 200;

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: number; paymentMethod: string; mobileNumber: string; country: string; coverFees: boolean; walletId?: number }) => {
      const res = await apiRequest("POST", "/api/withdraw", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.autoProcessed ? "Retrait effectué" : "Retrait en cours",
        description: data.message || "Votre retrait a été traité instantanément.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawal-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      setAmount("");
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
      toast({ title: "Compte non vérifié", description: "Veuillez vérifier votre compte pour effectuer des retraits.", variant: "destructive" });
      return;
    }

    if (!selectedWalletId) {
      toast({ title: "Portefeuille requis", description: "Veuillez sélectionner un portefeuille.", variant: "destructive" });
      return;
    }

    if (numericAmount < minWithdrawal) {
      toast({ title: "Montant insuffisant", description: `Le montant minimum de retrait est de ${minWithdrawal} ${currency}.`, variant: "destructive" });
      return;
    }

    if (totalDeducted > balance) {
      toast({
        title: "Solde insuffisant",
        description: coverFees
          ? `Il vous faut ${totalDeducted.toLocaleString("fr-FR")} ${currency} (montant + frais de ${fee.toLocaleString("fr-FR")} ${currency}).`
          : "Vous n'avez pas assez de fonds dans ce portefeuille.",
        variant: "destructive",
      });
      return;
    }

    if (!country) {
      toast({ title: "Pays requis", description: "Veuillez sélectionner un pays.", variant: "destructive" });
      return;
    }

    if (!paymentMethod) {
      toast({ title: "Moyen de paiement requis", description: "Veuillez sélectionner un moyen de paiement.", variant: "destructive" });
      return;
    }

    withdrawMutation.mutate({
      amount: numericAmount,
      paymentMethod,
      mobileNumber: (phonePrefix + mobileNumber).replace(/\s/g, ""),
      country,
      coverFees,
      walletId: selectedWalletId ?? undefined,
    });
  };

  const handleMaxAmount = () => {
    setAmount(Math.floor(balance).toString());
  };

  const formatAmount = (amount: string | number, curr?: string) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("fr-FR").format(num) + " " + (curr || currency);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(new Date(date));
  };

  if (!user?.isVerified) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
            <div>
              <h1 className="text-2xl font-bold">Retrait</h1>
              <p className="text-muted-foreground">Retirez de l'argent vers votre Mobile Money</p>
            </div>
          </div>
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30">
            <CardContent className="p-8 text-center">
              <Shield className="h-16 w-16 mx-auto mb-4 text-orange-500" />
              <h2 className="text-xl font-semibold text-orange-800 dark:text-orange-200 mb-2">Compte non vérifié</h2>
              <p className="text-orange-600 dark:text-orange-300 mb-6 max-w-md mx-auto">
                Votre compte n'est pas encore vérifié. Veuillez vérifier votre compte afin d'utiliser nos services de paiement sécurisés.
              </p>
              <Link href="/dashboard/kyc"><Button data-testid="button-verify-now">Vérifier mon compte</Button></Link>
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
          <Link href="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold">Retrait</h1>
            <p className="text-muted-foreground">Demandez un retrait vers votre Mobile Money</p>
          </div>
        </div>

        {/* Wallet Selector */}
        {wallets.length > 0 && (
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <Wallet className="h-4 w-4" />
              Sélectionnez le portefeuille à débiter
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {wallets.map((w) => {
                const isSelected = selectedWalletId === w.id;
                const matchingCountry = allCountries.find(c => c.id.toUpperCase() === w.countryCode.toUpperCase());
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setSelectedWalletId(w.id);
                      if (matchingCountry) {
                        setCountry(matchingCountry.id);
                        setPaymentMethod("");
                        setMobileNumber("");
                      }
                    }}
                    data-testid={`button-wallet-${w.id}`}
                    className={`text-left rounded-xl border-2 p-3 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-muted/30 hover:border-primary/40"
                    }`}
                  >
                    <p className="text-xs font-medium text-muted-foreground truncate">{w.countryName}</p>
                    <p className="text-sm font-bold mt-0.5">
                      {new Intl.NumberFormat("fr-FR").format(parseFloat(w.balance))} <span className="text-xs font-semibold text-muted-foreground">{w.currency}</span>
                    </p>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-xs text-primary font-semibold mt-1">
                        <Check className="h-3 w-3" /> Sélectionné
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Balance card */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <CardContent className="p-6">
            <p className="text-sm opacity-80">
              {selectedWallet ? `Solde — ${selectedWallet.countryName}` : "Solde disponible"}
            </p>
            <p className="text-3xl font-bold mt-1" data-testid="text-available-balance">
              {new Intl.NumberFormat("fr-FR").format(balance)} {currency}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nouvelle demande de retrait</CardTitle>
            <CardDescription>
              Minimum: {minWithdrawal.toLocaleString("fr-FR")} {currency}. Les retraits sont traités instantanément.
              {selectedWallet && (
                <span className="block mt-1 text-primary">
                  Portefeuille sélectionné : {selectedWallet.countryName} ({selectedWallet.currency})
                  {Object.keys(CURRENCY_COUNTRY_CODES).includes(selectedWallet.currency)
                    ? " — pays compatibles affichés uniquement"
                    : ""}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="amount">Montant ({currency})</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={handleMaxAmount}>
                    Max: {new Intl.NumberFormat("fr-FR").format(Math.floor(balance))} {currency}
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
                      <span>{numericAmount.toLocaleString("fr-FR")} {currency}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Info className="h-3 w-3" />Frais ({commissionRate}%)</span>
                      <span className={coverFees ? "text-orange-600" : ""}>{coverFees ? "+" : "-"}{fee.toLocaleString("fr-FR")} {currency}</span>
                    </div>
                    {coverFees && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Info className="h-3 w-3" />Total débité de votre portefeuille</span>
                        <span className="font-medium text-orange-600">{totalDeducted.toLocaleString("fr-FR")} {currency}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Destinataire reçoit</span>
                      <span className="text-green-600">{netAmount.toLocaleString("fr-FR")} {currency}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Je supporte les frais */}
              <div
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${
                  coverFees ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:border-primary/50"
                }`}
                onClick={() => setCoverFees(prev => !prev)}
                data-testid="checkbox-cover-fees"
              >
                <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-sm border-2 flex items-center justify-center transition-colors ${
                  coverFees ? "bg-primary border-primary" : "border-primary bg-transparent"
                }`}>
                  {coverFees && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                    Je supporte les frais
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {coverFees && numericAmount > 0
                      ? `Le destinataire recevra ${numericAmount.toLocaleString("fr-FR")} ${currency}. Les frais de ${fee.toLocaleString("fr-FR")} ${currency} seront prélevés en plus sur votre portefeuille (total : ${totalDeducted.toLocaleString("fr-FR")} ${currency}).`
                      : "Le destinataire recevra le montant complet. Les frais seront prélevés en supplément sur votre portefeuille."}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pays de réception</Label>
                <CountrySelect
                  options={countries.map(c => {
                    const w = wallets.find(w => w.countryCode.toUpperCase() === c.id.toUpperCase());
                    return {
                      value: c.id,
                      label: c.name,
                      subLabel: w ? `${new Intl.NumberFormat("fr-FR").format(parseFloat(w.balance))} ${c.currency}` : c.currency,
                    };
                  })}
                  value={country}
                  onChange={handleCountryChange}
                  placeholder={countriesLoading ? "Chargement..." : "Sélectionnez un pays"}
                  data-testid="select-country"
                />
              </div>

              {availableMethods.length > 0 && (
                <div className="space-y-4">
                  <Label>Moyen de paiement</Label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(val) => {
                      const method = availableMethods.find(m => m.id === val);
                      if (!method?.inMaintenance) setPaymentMethod(val);
                    }}
                    className="grid grid-cols-2 md:grid-cols-3 gap-4"
                  >
                    {availableMethods.map((method) => {
                      const logoKey = method.name.toLowerCase().replace(/\s+/g, "").replace("-", "");
                      return (
                        <div key={method.id} className="relative">
                          <RadioGroupItem value={method.id} id={`withdraw-${method.id}`} className="peer sr-only" disabled={method.inMaintenance} />
                          <Label
                            htmlFor={`withdraw-${method.id}`}
                            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                              method.inMaintenance
                                ? "opacity-50 cursor-not-allowed bg-muted"
                                : "cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                            }`}
                          >
                            <img src={methodLogos[logoKey] || methodLogos[method.name.toLowerCase()] || moovLogo} alt={method.name} className="h-12 w-12 object-contain rounded-full" />
                            <span className="text-xs font-medium text-center">{method.name}</span>
                            {method.inMaintenance && <span className="text-xs text-orange-600 font-medium">En maintenance</span>}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Numéro de téléphone destinataire</Label>
                <div className="flex">
                  {phonePrefix && (
                    <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-sm font-mono font-semibold text-muted-foreground select-none shrink-0">
                      {phonePrefix}
                    </div>
                  )}
                  <Input
                    id="mobileNumber"
                    type="tel"
                    placeholder="90123456"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                    className={phonePrefix ? "rounded-l-none" : ""}
                    data-testid="input-withdraw-mobile"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={
                  withdrawMutation.isPending ||
                  !selectedWalletId ||
                  numericAmount < minWithdrawal ||
                  totalDeducted > balance ||
                  !country ||
                  !paymentMethod
                }
                data-testid="button-withdraw-submit"
              >
                {withdrawMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Envoi...</>
                ) : (
                  `Demander le retrait${numericAmount > 0 ? ` de ${numericAmount.toLocaleString("fr-FR")} ${currency}` : ""}`
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
                    const status = statusConfig[request.status] || { label: request.status, icon: Clock, color: "text-gray-600 bg-gray-100 dark:bg-gray-900/30" };
                    const StatusIcon = status.icon;
                    const countryName = allCountries.find(c => c.id === request.country)?.name || request.country;

                    return (
                      <div key={request.id} className="flex items-start justify-between p-4 rounded-lg bg-muted/30">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{formatAmount(request.amount, "XOF")}</span>
                            <Badge className={status.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{request.paymentMethod.toUpperCase()} - {request.mobileNumber}</p>
                          <p className="text-xs text-muted-foreground">{countryName} • {formatDate(request.createdAt)}</p>
                          {request.rejectionReason && (
                            <p className="text-sm text-red-600 mt-2">Raison: {request.rejectionReason}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Vous recevez</p>
                          <p className="font-semibold text-green-600">{formatAmount(request.netAmount, "XOF")}</p>
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
