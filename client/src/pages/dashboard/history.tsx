import { useState } from "react";
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
} from "lucide-react";
import type { Transaction } from "@shared/schema";

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
};

const paymentMethodNames: Record<string, string> = {
  tmoney: "TMoney",
  moov: "Moov Money",
  mtn: "MTN Mobile Money",
  orange: "Orange Money",
  wave: "Wave",
  free: "Free Money",
};

const transactionTypeLabels: Record<string, { label: string; icon: typeof ArrowDownLeft; incoming: boolean }> = {
  deposit: { label: "Dépôt", icon: ArrowDownLeft, incoming: true },
  withdrawal: { label: "Retrait", icon: ArrowUpRight, incoming: false },
  transfer_in: { label: "Transfert reçu", icon: ArrowDownLeft, incoming: true },
  transfer_out: { label: "Transfert envoyé", icon: ArrowUpRight, incoming: false },
  payment_received: { label: "Paiement reçu", icon: ArrowDownLeft, incoming: true },
};

const statusBadges: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  completed: { label: "Terminé", variant: "default" },
  pending: { label: "En attente", variant: "secondary" },
  failed: { label: "Échoué", variant: "destructive" },
  cancelled: { label: "Annulé", variant: "outline" },
  rejected: { label: "Rejeté", variant: "destructive" },
};

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const filteredTransactions = transactions?.filter((tx) => {
    const matchesSearch = 
      tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.toString().includes(searchQuery) ||
      tx.payerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.mobileNumber?.includes(searchQuery);
    const matchesType = typeFilter === "all" || tx.type === typeFilter;
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

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
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Aucune transaction trouvée</p>
                <p className="text-sm">
                  {transactions?.length ? "Essayez de modifier vos filtres" : "Effectuez votre premier dépôt"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((tx) => {
                  const typeInfo = transactionTypeLabels[tx.type] || { label: tx.type, icon: Clock, incoming: true };
                  const statusInfo = statusBadges[tx.status] || { label: tx.status, variant: "secondary" as const };
                  const TypeIcon = typeInfo.icon;

                  return (
                    <div 
                      key={tx.id} 
                      className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedTransaction(tx)}
                      data-testid={`transaction-row-${tx.id}`}
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
                          {tx.type === "payment_received" && tx.payerName ? (
                            <span>De: {tx.payerName}</span>
                          ) : (
                            <span>{tx.description || `Transaction #${tx.id}`}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(tx.createdAt)}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold ${typeInfo.incoming ? "text-green-600" : "text-orange-600"}`}>
                          {typeInfo.incoming ? "+" : "-"}{formatCurrency(tx.netAmount)}
                        </p>
                        {parseFloat(tx.fee) > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Frais: {formatCurrency(tx.fee)}
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

      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détails de la transaction</DialogTitle>
            <DialogDescription>
              Informations complètes sur cette transaction
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Hash className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">ID Transaction</p>
                  <p className="font-mono font-medium">#{selectedTransaction.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Montant brut</p>
                  <p className="font-bold">{formatCurrency(selectedTransaction.amount)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Frais</p>
                  <p className="font-bold">{formatCurrency(selectedTransaction.fee)}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Montant net reçu</p>
                  <p className="font-bold text-green-600 text-xl">{formatCurrency(selectedTransaction.netAmount)}</p>
                </div>
              </div>

              {selectedTransaction.type === "payment_received" && (
                <div className="space-y-3 pt-2 border-t">
                  <h4 className="font-semibold text-sm">Informations du payeur</h4>
                  
                  {selectedTransaction.payerName && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Nom complet</p>
                        <p className="font-medium">{selectedTransaction.payerName}</p>
                      </div>
                    </div>
                  )}

                  {selectedTransaction.mobileNumber && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Numéro de téléphone</p>
                        <p className="font-medium">{selectedTransaction.mobileNumber}</p>
                      </div>
                    </div>
                  )}

                  {selectedTransaction.payerEmail && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedTransaction.payerEmail}</p>
                      </div>
                    </div>
                  )}

                  {selectedTransaction.payerCountry && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Pays</p>
                        <p className="font-medium">{countryNames[selectedTransaction.payerCountry] || selectedTransaction.payerCountry}</p>
                      </div>
                    </div>
                  )}

                  {selectedTransaction.paymentMethod && (
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Moyen de paiement</p>
                        <p className="font-medium">{paymentMethodNames[selectedTransaction.paymentMethod] || selectedTransaction.paymentMethod}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedTransaction.mobileNumber && selectedTransaction.type !== "payment_received" && (
                <div className="flex items-center gap-3 pt-2 border-t">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Numéro Mobile Money</p>
                    <p className="font-medium">{selectedTransaction.mobileNumber}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2 border-t">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Date et heure</p>
                  <p className="font-medium">{formatDate(selectedTransaction.createdAt)}</p>
                </div>
              </div>

              {selectedTransaction.description && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{selectedTransaction.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
