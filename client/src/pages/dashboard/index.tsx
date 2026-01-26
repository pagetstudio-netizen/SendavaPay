import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet,
  ArrowUpRight,
  Link2,
  AlertTriangle,
  History,
  TrendingUp,
  TrendingDown,
  Users,
  MousePointer,
  CreditCard,
  Globe,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

const quickActions = [
  { icon: Wallet, label: "Dépôt", href: "/dashboard/deposit", color: "text-green-500" },
  { icon: ArrowUpRight, label: "Retrait", href: "/dashboard/withdraw", color: "text-orange-500" },
  { icon: Link2, label: "Lien de paiement", href: "/dashboard/payment-links", color: "text-purple-500" },
  { icon: History, label: "Historique", href: "/dashboard/history", color: "text-blue-500" },
];

interface PaymentLink {
  id: number;
  title: string;
  code: string;
  amount: string;
  isActive: boolean;
  clicks?: number;
}

interface Transaction {
  id: number;
  amount: string;
  status: string;
  paymentLinkId?: number;
  country?: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [selectedLink, setSelectedLink] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  const { data: paymentLinks = [] } = useQuery<PaymentLink[]>({
    queryKey: ["/api/payment-links"],
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const stats = useMemo(() => {
    const activeLinks = paymentLinks.filter(l => l.isActive).length;
    const inactiveLinks = paymentLinks.filter(l => !l.isActive).length;
    const totalClicks = paymentLinks.reduce((sum, l) => sum + (l.clicks || 0), 0);
    
    const paidTransactions = transactions.filter(t => t.status === "completed");
    const pendingTransactions = transactions.filter(t => t.status === "pending");
    
    const totalCollected = paidTransactions.reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const thisMonthRevenue = paidTransactions
      .filter(t => {
        const d = new Date(t.createdAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);
    
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const lastMonthRevenue = paidTransactions
      .filter(t => {
        const d = new Date(t.createdAt);
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);
    
    const evolution = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(2)
      : thisMonthRevenue > 0 ? "100" : "0";

    const uniqueClients = new Set(transactions.map(t => t.id)).size;

    return {
      activeLinks,
      inactiveLinks,
      totalLinks: paymentLinks.length,
      totalClicks,
      clickRate: transactions.length > 0 ? ((paidTransactions.length / transactions.length) * 100).toFixed(2) : "0",
      totalTransactions: transactions.length,
      paidTransactions: paidTransactions.length,
      pendingTransactions: pendingTransactions.length,
      totalCollected,
      thisMonthRevenue,
      lastMonthRevenue,
      evolution: parseFloat(evolution),
      uniqueClients,
    };
  }, [paymentLinks, transactions]);

  const last7DaysRevenue = useMemo(() => {
    const days = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
      
      const dayRevenue = transactions
        .filter(t => {
          const tDate = new Date(t.createdAt);
          return tDate.toDateString() === date.toDateString() && t.status === "completed";
        })
        .reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);
      
      days.push({ date: dateStr, revenue: dayRevenue });
    }
    
    return days;
  }, [transactions]);

  const topLinks = useMemo(() => {
    return [...paymentLinks]
      .map(link => {
        const linkTransactions = transactions.filter(t => t.paymentLinkId === link.id && t.status === "completed");
        const revenue = linkTransactions.reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);
        return { ...link, revenue, transactionCount: linkTransactions.length };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [paymentLinks, transactions]);

  const topClickedLinks = useMemo(() => {
    return [...paymentLinks]
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, 5);
  }, [paymentLinks]);

  const countryStats = useMemo(() => {
    const countries: Record<string, number> = {};
    transactions.forEach(t => {
      const country = t.country || "TG";
      countries[country] = (countries[country] || 0) + 1;
    });
    
    return Object.entries(countries)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [transactions]);

  const maxRevenue = Math.max(...last7DaysRevenue.map(d => d.revenue), 1);

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
                  {formatCurrency(user?.balance || 0)} XOF
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
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tableau de bord</CardTitle>
            <p className="text-sm text-muted-foreground">Vue d'ensemble de vos performances</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Select value={selectedLink} onValueChange={setSelectedLink}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrer par lien" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les liens</SelectItem>
                  {paymentLinks.map(link => (
                    <SelectItem key={link.id} value={link.id.toString()}>{link.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toute la période</SelectItem>
                  <SelectItem value="7days">7 derniers jours</SelectItem>
                  <SelectItem value="30days">30 derniers jours</SelectItem>
                  <SelectItem value="thisMonth">Ce mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Link2 className="h-4 w-4" />
                <span className="text-xs font-medium">Liens</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalLinks}</p>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">{stats.activeLinks} actifs</span> • <span className="text-muted-foreground">{stats.inactiveLinks} inactifs</span>
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MousePointer className="h-4 w-4" />
                <span className="text-xs font-medium">Clics</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalClicks}</p>
              <p className="text-xs text-muted-foreground">
                Taux: {stats.clickRate}%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CreditCard className="h-4 w-4" />
                <span className="text-xs font-medium">Transactions</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalTransactions}</p>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">{stats.paidTransactions} payées</span> • <span className="text-orange-500">{stats.pendingTransactions} en attente</span>
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Wallet className="h-4 w-4" />
                <span className="text-xs font-medium">Collecté</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalCollected)}</p>
              <p className="text-xs text-primary font-medium">CFA</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Évolution des revenus (7 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {last7DaysRevenue.map((day, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-16">{day.date}</span>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(day.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-24 text-right">{formatCurrency(day.revenue)} CFA</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Mois en cours</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(stats.thisMonthRevenue)} CFA</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Mois précédent</p>
              <p className="text-xl font-bold">{formatCurrency(stats.lastMonthRevenue)} CFA</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Évolution</p>
              <div className="flex items-center justify-center gap-1">
                {stats.evolution >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <p className={`text-xl font-bold ${stats.evolution >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {stats.evolution >= 0 ? "+" : ""}{stats.evolution}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Liens les plus rentables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topLinks.length > 0 ? topLinks.map((link, index) => (
                <div key={link.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{link.title}</p>
                    <p className="text-xs text-muted-foreground">{link.code}</p>
                  </div>
                  <p className="font-bold text-sm">{formatCurrency(link.revenue)} XOF</p>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun lien créé</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Liens les plus cliqués</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topClickedLinks.length > 0 ? topClickedLinks.map((link, index) => (
                <div key={link.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{link.title}</p>
                    <p className="text-xs text-muted-foreground">{link.code}</p>
                  </div>
                  <p className="font-bold text-sm">{link.clicks || 0}</p>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun lien créé</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pays principaux</CardTitle>
              <span className="text-xs text-muted-foreground">{stats.totalClicks} clics</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {countryStats.length > 0 ? countryStats.map((country, index) => {
              const maxCount = countryStats[0]?.count || 1;
              const percentage = (country.count / maxCount) * 100;
              return (
                <div key={country.code} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-8">{country.code}</span>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold w-12 text-right">{country.count}</span>
                </div>
              );
            }) : (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée disponible</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
