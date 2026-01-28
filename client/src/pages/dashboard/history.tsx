import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Search,
  Eye,
  User,
  Phone,
  MapPin,
  CreditCard,
  Mail,
  Hash,
  ShoppingBag,
  Hourglass,
} from "lucide-react";
import type { Transaction, WithdrawalRequest } from "@shared/schema";

interface CombinedHistoryItem {
  id: number;
  type: string;
  amount: string;
  fee: string;
  netAmount: string;
  status: string;
  description?: string;
  mobileNumber?: string | null;
  paymentMethod?: string | null;
  createdAt: string | Date;
  payerName?: string | null;
  payerEmail?: string | null;
  payerCountry?: string | null;
  isWithdrawalRequest?: boolean;
  country?: string | null;
  walletName?: string | null;
  rejectionReason?: string | null;
}

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-FR").format(num) + " XOF";
}

function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

const countryNames: Record<string, string> = {
  TG: "Togo",
  BJ: "Bénin",
  CI: "Côte d'Ivoire",
  SN: "Sénégal",
  ML: "Mali",
  BF: "Burkina Faso",
  CM: "Cameroun",
  COD: "RDC",
  COG: "Congo Brazzaville",
};

const paymentMethodNames: Record<string, string> = {
  tmoney: "T-Money",
  moov: "Moov Money",
  mtn: "MTN Mobile Money",
  orange: "Orange Money",
  wave: "Wave",
  free: "Free Money",
  vodacom: "Vodacom",
  airtel: "Airtel Money",
  "37": "T-Money",
  "38": "Moov Money",
  "35": "MTN Mobile Money",
  "36": "Moov Money",
  "33": "Moov Money",
  "34": "Orange Money",
  "29": "Orange Money",
  "30": "MTN Mobile Money",
  "31": "Moov Money",
  "32": "Wave",
  "1": "MTN Mobile Money",
  "2": "Orange Money",
  "52": "Vodacom",
  "53": "Airtel Money",
  "54": "Orange Money",
  "55": "Airtel Money",
  "56": "MTN Mobile Money",
};

function formatPaymentMethod(method: string): string {
  if (!method) return "";
  
  let cleaned = method
    .replace(/^soleaspay[_-]/i, "")
    .replace(/^leekpay[_-]/i, "")
    .replace(/_/g, " ")
    .replace(/\s+(TG|BJ|BF|CI|CM|COD|COG|SN|ML)$/i, "");
  
  const lowerCleaned = cleaned.toLowerCase();
  
  if (lowerCleaned.includes("t-money") || lowerCleaned.includes("tmoney")) return "T-Money";
  if (lowerCleaned.includes("mtn")) return "MTN Mobile Money";
  if (lowerCleaned.includes("moov")) return "Moov Money";
  if (lowerCleaned.includes("orange")) return "Orange Money";
  if (lowerCleaned.includes("wave")) return "Wave";
  if (lowerCleaned.includes("vodacom")) return "Vodacom";
  if (lowerCleaned.includes("airtel")) return "Airtel Money";
  
  return paymentMethodNames[method] || cleaned;
}

const transactionTypeLabels: Record<string, { label: string; icon: typeof ArrowDownLeft; incoming: boolean }> = {
  deposit: { label: "Dépôt", icon: ArrowDownLeft, incoming: true },
  withdrawal: { label: "Retrait", icon: ArrowUpRight, incoming: false },
  withdrawal_request: { label: "Demande de retrait", icon: Hourglass, incoming: false },
  transfer_in: { label: "Transfert reçu", icon: ArrowDownLeft, incoming: true },
  transfer_out: { label: "Transfert envoyé", icon: ArrowUpRight, incoming: false },
  payment_received: { label: "Paiement reçu", icon: ArrowDownLeft, incoming: true },
};

const statusBadges: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  completed: { label: "Terminé", variant: "default" },
  approved: { label: "Approuvé", variant: "default" },
  pending: { label: "En attente", variant: "secondary" },
  processing: { label: "En cours", variant: "secondary" },
  failed: { label: "Échoué", variant: "destructive" },
  cancelled: { label: "Annulé", variant: "outline" },
  rejected: { label: "Rejeté", variant: "destructive" },
};

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<CombinedHistoryItem | null>(null);

  const { data: transactions, isLoading: loadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: withdrawalRequests, isLoading: loadingWithdrawals } = useQuery<WithdrawalRequest[]>({
    queryKey: ["/api/withdrawal-requests"],
  });

  const isLoading = loadingTransactions || loadingWithdrawals;

  const combinedHistory = useMemo(() => {
    const items: CombinedHistoryItem[] = [];

    // Add transactions
    transactions?.forEach((tx) => {
      items.push({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        fee: tx.fee,
        netAmount: tx.netAmount,
        status: tx.status,
        description: tx.description || undefined,
        mobileNumber: tx.mobileNumber,
        paymentMethod: tx.paymentMethod,
        createdAt: tx.createdAt,
        payerName: tx.payerName,
        payerEmail: tx.payerEmail,
        payerCountry: tx.payerCountry,
        isWithdrawalRequest: false,
      });
    });

    // Add withdrawal requests (only pending ones that aren't in transactions yet)
    withdrawalRequests?.forEach((wr) => {
      // Only add pending/processing withdrawal requests (approved ones become transactions)
      if (wr.status === "pending" || wr.status === "processing" || wr.status === "rejected") {
        items.push({
          id: wr.id,
          type: "withdrawal_request",
          amount: wr.amount,
          fee: wr.fee,
          netAmount: wr.netAmount,
          status: wr.status,
          description: `Retrait ${wr.paymentMethod} - ${wr.mobileNumber}`,
          mobileNumber: wr.mobileNumber,
          paymentMethod: wr.paymentMethod,
          createdAt: wr.createdAt,
          isWithdrawalRequest: true,
          country: wr.country,
          walletName: wr.walletName,
          rejectionReason: wr.rejectionReason,
        });
      }
    });

    // Sort by date (newest first)
    return items.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [transactions, withdrawalRequests]);

  const filteredHistory = combinedHistory.filter((item) => {
    const matchesSearch = 
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toString().includes(searchQuery) ||
      item.payerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mobileNumber?.includes(searchQuery);
    const matchesType = typeFilter === "all" || item.type === typeFilter || 
      (typeFilter === "withdrawal" && item.type === "withdrawal_request");
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Historique des transactions</h1>
          <p className="text-muted-foreground">Consultez toutes vos transactions avec les détails complets</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par ID, nom, téléphone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-transactions"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40" data-testid="select-type-filter">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="deposit">Dépôt</SelectItem>
                    <SelectItem value="withdrawal">Retrait</SelectItem>
                    <SelectItem value="transfer_in">Transfert reçu</SelectItem>
                    <SelectItem value="transfer_out">Transfert envoyé</SelectItem>
                    <SelectItem value="payment_received">Paiement reçu</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40" data-testid="select-status-filter">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="failed">Échoué</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Aucune transaction trouvée</p>
                <p className="text-sm">
                  {combinedHistory.length ? "Essayez de modifier vos filtres" : "Effectuez votre premier dépôt"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHistory.map((item) => {
                  const typeInfo = transactionTypeLabels[item.type] || { label: item.type, icon: Clock, incoming: true };
                  const statusInfo = statusBadges[item.status] || { label: item.status, variant: "secondary" as const };
                  const TypeIcon = typeInfo.icon;
                  const uniqueKey = item.isWithdrawalRequest ? `wr-${item.id}` : `tx-${item.id}`;

                  return (
                    <div 
                      key={uniqueKey} 
                      className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                      data-testid={`history-row-${uniqueKey}`}
                    >
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        typeInfo.incoming 
                          ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                      }`}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{typeInfo.label}</span>
                          <Badge variant={statusInfo.variant} className="text-xs">
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {item.type === "payment_received" && item.payerName ? (
                            <span>De: {item.payerName}</span>
                          ) : (
                            <span>{item.description || `Transaction #${item.id}`}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold ${typeInfo.incoming ? "text-green-600" : "text-orange-600"}`}>
                          {typeInfo.incoming ? "+" : "-"}{formatCurrency(item.amount)}
                        </p>
                        {parseFloat(item.fee) > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Frais: {formatCurrency(item.fee)}
                          </p>
                        )}
                      </div>
                      <Button size="icon" variant="ghost" className="flex-shrink-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détails de la transaction</DialogTitle>
            <DialogDescription>
              Informations complètes sur cette transaction
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Hash className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {selectedItem.isWithdrawalRequest ? "ID Demande de retrait" : "ID Transaction"}
                  </p>
                  <p className="font-mono font-medium">#{selectedItem.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Montant brut</p>
                  <p className="font-bold">{formatCurrency(selectedItem.amount)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Frais</p>
                  <p className="font-bold">{formatCurrency(selectedItem.fee)}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Montant net</p>
                  <p className="font-bold text-green-600 text-xl">{formatCurrency(selectedItem.netAmount)}</p>
                </div>
              </div>

              {selectedItem.isWithdrawalRequest && selectedItem.rejectionReason && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-xs text-muted-foreground mb-1">Raison du rejet</p>
                  <p className="font-medium text-red-600">{selectedItem.rejectionReason}</p>
                </div>
              )}

              {selectedItem.type === "payment_received" && (
                <div className="space-y-3 pt-2 border-t">
                  <h4 className="font-semibold text-sm">Informations du payeur</h4>

                  {selectedItem.description && (
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Produit acheté</p>
                        <p className="font-medium">
                          {selectedItem.description.replace(/Paiement reçu[:\-\s]+/i, '')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {selectedItem.payerName && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Nom complet</p>
                        <p className="font-medium">{selectedItem.payerName}</p>
                      </div>
                    </div>
                  )}

                  {selectedItem.mobileNumber && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Numéro de téléphone</p>
                        <p className="font-medium">{selectedItem.mobileNumber}</p>
                      </div>
                    </div>
                  )}

                  {selectedItem.payerEmail && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedItem.payerEmail}</p>
                      </div>
                    </div>
                  )}

                  {selectedItem.payerCountry && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Pays</p>
                        <p className="font-medium">{countryNames[selectedItem.payerCountry] || selectedItem.payerCountry}</p>
                      </div>
                    </div>
                  )}

                  {selectedItem.paymentMethod && (
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Opérateur</p>
                        <p className="font-medium">{formatPaymentMethod(selectedItem.paymentMethod)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedItem.mobileNumber && selectedItem.type !== "payment_received" && (
                <div className="flex items-center gap-3 pt-2 border-t">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Numéro Mobile Money</p>
                    <p className="font-medium">{selectedItem.mobileNumber}</p>
                  </div>
                </div>
              )}

              {selectedItem.isWithdrawalRequest && selectedItem.country && (
                <div className="flex items-center gap-3 pt-2 border-t">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pays</p>
                    <p className="font-medium">{countryNames[selectedItem.country.toUpperCase()] || selectedItem.country}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2 border-t">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Date et heure</p>
                  <p className="font-medium">{formatDate(selectedItem.createdAt)}</p>
                </div>
              </div>

              {selectedItem.description && !selectedItem.isWithdrawalRequest && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{selectedItem.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
