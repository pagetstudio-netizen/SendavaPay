import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Link2,
  AlertTriangle,
} from "lucide-react";

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num) + " XOF";
}

const quickActions = [
  { icon: Wallet, label: "Dépôt", href: "/dashboard/deposit", color: "text-green-500" },
  { icon: ArrowUpRight, label: "Retrait", href: "/dashboard/withdraw", color: "text-orange-500" },
  { icon: Send, label: "Transfert", href: "/dashboard/transfer", color: "text-blue-500" },
  { icon: Link2, label: "Lien de paiement", href: "/dashboard/payment-links", color: "text-purple-500" },
];

export default function DashboardPage() {
  const { user } = useAuth();

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
      </div>
    </DashboardLayout>
  );
}
