import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Shield,
  Key,
  Percent,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  totalDeposits: string;
  totalWithdrawals: string;
  totalCommissions: string;
  pendingKyc: number;
  activeApiKeys: number;
  commissionRate: string;
}

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-FR").format(num) + " XOF";
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const statCards = [
    {
      title: "Utilisateurs",
      value: stats?.totalUsers || 0,
      description: `${stats?.verifiedUsers || 0} vérifiés`,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Total Dépôts",
      value: formatCurrency(stats?.totalDeposits || 0),
      description: "Montant total",
      icon: ArrowDownLeft,
      color: "text-green-500",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Total Retraits",
      value: formatCurrency(stats?.totalWithdrawals || 0),
      description: "Montant total",
      icon: ArrowUpRight,
      color: "text-orange-500",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
    },
    {
      title: "Commissions",
      value: formatCurrency(stats?.totalCommissions || 0),
      description: `Taux: ${stats?.commissionRate || 7}%`,
      icon: Percent,
      color: "text-purple-500",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: "KYC en attente",
      value: stats?.pendingKyc || 0,
      description: "Demandes à traiter",
      icon: Shield,
      color: "text-yellow-500",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    },
    {
      title: "Clés API actives",
      value: stats?.activeApiKeys || 0,
      description: "Intégrations",
      icon: Key,
      color: "text-indigo-500",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord administrateur</h1>
          <p className="text-muted-foreground">Vue d'ensemble de la plateforme SendavaPay</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array(6)
                .fill(0)
                .map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-6 w-32" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            : statCards.map((stat, index) => (
                <Card key={index} data-testid={`stat-card-${index}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Activité récente
              </CardTitle>
              <CardDescription>
                Dernières transactions sur la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Graphique d'activité</p>
                <p className="text-sm">Disponible avec les données</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Actions rapides
              </CardTitle>
              <CardDescription>
                Accès aux fonctionnalités d'administration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a href="/admin/kyc" className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">Vérifications KYC</p>
                    <p className="text-sm text-muted-foreground">{stats?.pendingKyc || 0} demandes en attente</p>
                  </div>
                </div>
              </a>
              <a href="/admin/users" className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Gestion utilisateurs</p>
                    <p className="text-sm text-muted-foreground">{stats?.totalUsers || 0} utilisateurs</p>
                  </div>
                </div>
              </a>
              <a href="/admin/commissions" className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <Percent className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium">Paramètres commission</p>
                    <p className="text-sm text-muted-foreground">Taux actuel: {stats?.commissionRate || 7}%</p>
                  </div>
                </div>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
