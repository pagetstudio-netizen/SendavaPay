import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Link2,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import type { Transaction } from "@shared/schema";

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num) + " XOF";
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

const quickActions = [
  { icon: Wallet, label: "Dépôt", href: "/dashboard/deposit", color: "text-green-500" },
  { icon: ArrowUpRight, label: "Retrait", href: "/dashboard/withdraw", color: "text-orange-500" },
  { icon: Send, label: "Transfert", href: "/dashboard/transfer", color: "text-blue-500" },
  { icon: Link2, label: "Lien de paiement", href: "/dashboard/payment-links", color: "text-purple-500" },
];

const transactionTypeLabels: Record<string, { label: string; icon: typeof ArrowDownLeft }> = {
  deposit: { label: "Dépôt", icon: ArrowDownLeft },
  withdrawal: { label: "Retrait", icon: ArrowUpRight },
  transfer_in: { label: "Reçu", icon: ArrowDownLeft },
  transfer_out: { label: "Envoyé", icon: ArrowUpRight },
  payment_received: { label: "Paiement reçu", icon: ArrowDownLeft },
};

const statusBadges: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  completed: { label: "Terminé", variant: "default" },
  pending: { label: "En attente", variant: "secondary" },
  failed: { label: "Échoué", variant: "destructive" },
  cancelled: { label: "Annulé", variant: "outline" },
};

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const recentTransactions = transactions?.slice(0, 5) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Bienvenue, {user?.fullName?.split(" ")[0]}</h1>
          <p className="text-muted-foreground">
            Gérez vos finances en toute simplicité avec SendavaPay
          </p>
        </div>

        {!user?.isVerified && (
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30">
            <CardContent className="flex items-center gap-4 p-4">
              <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  Compte non vérifié
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-300">
                  Vérifiez votre compte pour débloquer toutes les fonctionnalités (retraits, API).
                </p>
              </div>
              <Link href="/dashboard/kyc">
                <Button size="sm" data-testid="button-verify-account">
                  Vérifier maintenant
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Solde disponible</p>
                <p className="text-3xl md:text-4xl font-bold mt-1" data-testid="text-balance">
                  {formatCurrency(user?.balance || 0)}
                </p>
              </div>
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                <Wallet className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="hover-elevate cursor-pointer transition-all">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                  <div className={`h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3 ${action.color}`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Transactions récentes</CardTitle>
              <CardDescription>Vos dernières opérations</CardDescription>
            </div>
            <Link href="/dashboard/history">
              <Button variant="outline" size="sm" data-testid="button-view-all-transactions">
                Voir tout
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune transaction pour le moment</p>
                <p className="text-sm">Effectuez votre premier dépôt pour commencer</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => {
                  const typeInfo = transactionTypeLabels[transaction.type] || { label: transaction.type, icon: Clock };
                  const statusInfo = statusBadges[transaction.status] || { label: transaction.status, variant: "secondary" as const };
                  const isIncoming = ["deposit", "transfer_in", "payment_received"].includes(transaction.type);

                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                      data-testid={`transaction-${transaction.id}`}
                    >
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        isIncoming ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                      }`}>
                        <typeInfo.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{typeInfo.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${isIncoming ? "text-green-600" : "text-orange-600"}`}>
                          {isIncoming ? "+" : "-"}{formatCurrency(transaction.netAmount)}
                        </p>
                        <Badge variant={statusInfo.variant} className="text-xs">
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
