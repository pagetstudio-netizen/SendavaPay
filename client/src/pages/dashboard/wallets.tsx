import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Wallet,
  ArrowLeftRight,
  Clock,
  Info,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import type { Wallet as WalletType, WalletExchange } from "@shared/schema";
import walletIcon from "@assets/6360759_(1)_1778446078347.png";

const FLAG_MAP: Record<string, string> = {
  CI: "🇨🇮", BJ: "🇧🇯", TG: "🇹🇬", BF: "🇧🇫", SN: "🇸🇳",
  CM: "🇨🇲", ML: "🇲🇱", GN: "🇬🇳", COG: "🇨🇬", COD: "🇨🇩",
  NE: "🇳🇪", TD: "🇹🇩", CF: "🇨🇫", GA: "🇬🇦", GQ: "🇬🇶",
  GW: "🇬🇼", MR: "🇲🇷", RW: "🇷🇼", BI: "🇧🇮",
};

const ZONE_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  XOF: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
  XAF: { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800", badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" },
  CDF: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
};

const ZONE_LABELS: Record<string, string> = {
  XOF: "Zone UEMOA",
  XAF: "Zone CEMAC",
  CDF: "Zone RDC",
};

function formatAmount(amount: string | number, currency: string) {
  const num = parseFloat(amount.toString());
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num) + " " + currency;
}

function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}

function StatusBadge({ status }: { status: string }) {
  if (status === "pending") return (
    <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
      <Clock className="h-3 w-3" /> En cours
    </Badge>
  );
  if (status === "approved") return (
    <Badge variant="outline" className="gap-1 text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30">
      <CheckCircle2 className="h-3 w-3" /> Approuvé
    </Badge>
  );
  return (
    <Badge variant="outline" className="gap-1 text-red-600 border-red-300 bg-red-50 dark:bg-red-950/30">
      <XCircle className="h-3 w-3" /> Rejeté
    </Badge>
  );
}

export default function WalletsPage() {
  const { toast } = useToast();
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [fromWalletId, setFromWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [exchangeAmount, setExchangeAmount] = useState("");

  const { data, isLoading } = useQuery<{ wallets: WalletType[]; exchanges: WalletExchange[] }>({
    queryKey: ["/api/wallets"],
  });

  const wallets = data?.wallets ?? [];
  const exchanges = data?.exchanges ?? [];

  const exchangeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/wallets/exchange", {
        fromWalletId: parseInt(fromWalletId),
        toWalletId: parseInt(toWalletId),
        amount: exchangeAmount,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Demande envoyée",
        description: "Votre demande d'échange est en cours de traitement. Elle sera validée par l'administrateur sous 24h.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setExchangeOpen(false);
      setFromWalletId("");
      setToWalletId("");
      setExchangeAmount("");
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const fromWallet = wallets.find(w => w.id === parseInt(fromWalletId));
  const compatibleWallets = fromWallet
    ? wallets.filter(w => w.id !== fromWallet.id && w.currency === fromWallet.currency)
    : [];

  const groupedWallets = wallets.reduce<Record<string, WalletType[]>>((acc, w) => {
    if (!acc[w.currency]) acc[w.currency] = [];
    acc[w.currency].push(w);
    return acc;
  }, {});

  const totalByCurrency = Object.entries(groupedWallets).map(([currency, ws]) => ({
    currency,
    total: ws.reduce((s, w) => s + parseFloat(w.balance), 0),
    count: ws.length,
  }));

  const canExchange = wallets.length >= 2 &&
    Object.values(groupedWallets).some(ws => ws.length >= 2);

  const pendingCount = exchanges.filter(e => (e as any).status === "pending").length;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="h-6 w-6" />
              Portefeuilles par pays
            </h1>
            <p className="text-muted-foreground mt-1">
              Chaque dépôt est crédité dans le portefeuille du pays de l'opérateur utilisé.
            </p>
          </div>
          {canExchange && (
            <Dialog open={exchangeOpen} onOpenChange={setExchangeOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-open-exchange">
                  <ArrowLeftRight className="h-4 w-4" />
                  Demander un échange
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Échange entre portefeuilles</DialogTitle>
                  <DialogDescription>
                    L'échange est possible uniquement entre pays de la même zone monétaire. Il sera traité par l'administrateur sous 24h.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Les fonds seront débités immédiatement et crédités après validation (maximum 24h).</span>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Portefeuille source</Label>
                    <Select value={fromWalletId} onValueChange={(v) => { setFromWalletId(v); setToWalletId(""); }}>
                      <SelectTrigger data-testid="select-exchange-from">
                        <SelectValue placeholder="Choisir un portefeuille" />
                      </SelectTrigger>
                      <SelectContent>
                        {wallets.map(w => (
                          <SelectItem key={w.id} value={w.id.toString()}>
                            {FLAG_MAP[w.countryCode] || "🌍"} {w.countryName} — {formatAmount(w.balance, w.currency)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {fromWallet && (
                    <>
                      <div className="space-y-2">
                        <Label>Portefeuille destination</Label>
                        {compatibleWallets.length === 0 ? (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>Aucun autre portefeuille compatible ({fromWallet.currency}) disponible.</span>
                          </div>
                        ) : (
                          <Select value={toWalletId} onValueChange={setToWalletId}>
                            <SelectTrigger data-testid="select-exchange-to">
                              <SelectValue placeholder="Choisir la destination" />
                            </SelectTrigger>
                            <SelectContent>
                              {compatibleWallets.map(w => (
                                <SelectItem key={w.id} value={w.id.toString()}>
                                  {FLAG_MAP[w.countryCode] || "🌍"} {w.countryName} — {formatAmount(w.balance, w.currency)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Montant ({fromWallet.currency})</Label>
                        <Input
                          type="number"
                          placeholder="Ex: 10000"
                          value={exchangeAmount}
                          onChange={e => setExchangeAmount(e.target.value)}
                          min="1"
                          max={fromWallet.balance}
                          data-testid="input-exchange-amount"
                        />
                        <p className="text-xs text-muted-foreground">
                          Disponible : {formatAmount(fromWallet.balance, fromWallet.currency)}
                        </p>
                      </div>
                    </>
                  )}

                  <Button
                    className="w-full"
                    onClick={() => exchangeMutation.mutate()}
                    disabled={
                      exchangeMutation.isPending ||
                      !fromWalletId || !toWalletId || !exchangeAmount ||
                      parseFloat(exchangeAmount) <= 0
                    }
                    data-testid="button-confirm-exchange"
                  >
                    {exchangeMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Envoi en cours...</>
                    ) : (
                      <><ArrowLeftRight className="h-4 w-4 mr-2" />Soumettre la demande</>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Résumé par zone monétaire */}
        {totalByCurrency.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {totalByCurrency.map(({ currency, total, count }) => {
              const colors = ZONE_COLORS[currency] || ZONE_COLORS["XOF"];
              return (
                <div key={currency} className={`rounded-xl border p-4 ${colors.bg} ${colors.border}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">{ZONE_LABELS[currency] || currency}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>{count} pays</span>
                  </div>
                  <p className={`text-xl font-bold ${colors.text}`}>
                    {formatAmount(total, currency)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Total de la zone</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Portefeuilles vides */}
        {wallets.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Aucun portefeuille</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Vos portefeuilles par pays seront créés automatiquement lors de votre premier dépôt via Mobile Money.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Portefeuilles groupés par zone monétaire */}
        {Object.entries(groupedWallets).map(([currency, zoneWallets]) => {
          const colors = ZONE_COLORS[currency] || ZONE_COLORS["XOF"];
          return (
            <div key={currency}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-semibold text-base">{ZONE_LABELS[currency] || currency}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>{currency}</span>
                {zoneWallets.length >= 2 && (
                  <span className="text-xs text-muted-foreground">• Échanges possibles entre ces pays</span>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {zoneWallets.map(wallet => {
                  const flag = FLAG_MAP[wallet.countryCode] || "🌍";
                  const colors2 = ZONE_COLORS[wallet.currency] || ZONE_COLORS["XOF"];
                  const hasBalance = parseFloat(wallet.balance) > 0;
                  return (
                    <Card key={wallet.id} className={`border ${colors2.border} transition-shadow hover:shadow-md`} data-testid={`card-wallet-${wallet.countryCode}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full ${colors2.bg} flex items-center justify-center border ${colors2.border} overflow-hidden`}>
                              <img src={walletIcon} alt="wallet" className="w-8 h-8 object-contain" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{wallet.countryName} {flag}</p>
                              <p className="text-xs text-muted-foreground">{wallet.currency} · {wallet.countryCode}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className={`text-xs ${hasBalance ? colors2.badge : ""}`}>
                            {hasBalance ? "Actif" : "Vide"}
                          </Badge>
                        </div>
                        <div className="mt-4">
                          <p className="text-xs text-muted-foreground mb-1">Solde disponible</p>
                          <p className={`text-2xl font-bold ${colors2.text}`} data-testid={`balance-wallet-${wallet.countryCode}`}>
                            {formatAmount(wallet.balance, wallet.currency)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                          <span />
                          {zoneWallets.length >= 2 && (
                            <button
                              className={`text-xs flex items-center gap-1 ${colors2.text} hover:underline`}
                              onClick={() => {
                                setFromWalletId(wallet.id.toString());
                                setExchangeOpen(true);
                              }}
                              data-testid={`button-exchange-from-${wallet.countryCode}`}
                            >
                              Échanger <ChevronRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Historique des échanges */}
        {exchanges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Historique des échanges
                {pendingCount > 0 && (
                  <Badge className="ml-1 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-0">
                    {pendingCount} en attente
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Vos demandes d'échange entre portefeuilles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {exchanges.map(ex => {
                  const fromFlag = FLAG_MAP[ex.fromCountryCode] || "🌍";
                  const toFlag = FLAG_MAP[ex.toCountryCode] || "🌍";
                  const status = (ex as any).status ?? "pending";
                  return (
                    <div key={ex.id} className="flex items-center justify-between py-2 border-b last:border-0" data-testid={`exchange-row-${ex.id}`}>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span>{fromFlag}</span>
                          <span className="font-medium">{ex.fromCountryCode}</span>
                          <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                          <span>{toFlag}</span>
                          <span className="font-medium">{ex.toCountryCode}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDate(ex.createdAt)}</p>
                        {(ex as any).adminNote && (
                          <p className="text-xs text-muted-foreground italic">Note : {(ex as any).adminNote}</p>
                        )}
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <p className="font-semibold text-sm">{formatAmount(ex.amount, ex.currency)}</p>
                        <StatusBadge status={status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info zone monétaire */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Zones monétaires et échanges</p>
                <p><strong>Zone UEMOA (XOF)</strong> : Sénégal, Mali, Côte d'Ivoire, Burkina Faso, Bénin, Togo, Niger, Guinée-Bissau</p>
                <p><strong>Zone CEMAC (XAF)</strong> : Cameroun, Congo</p>
                <p><strong>Zone RDC (CDF)</strong> : République Démocratique du Congo</p>
                <p>Les échanges entre portefeuilles sont uniquement possibles au sein de la même zone monétaire, au taux 1:1. Chaque demande est validée manuellement sous 24h maximum.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
