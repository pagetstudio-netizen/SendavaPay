import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Key, Shield, Code2, Loader2 } from "lucide-react";

export default function ApiKeysPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user?.isVerified) {
      setLocation("/merchant/dashboard");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (user?.isVerified) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-muted-foreground">Redirection vers l'espace API...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">API de Paiement</h1>
          <p className="text-muted-foreground">
            Intégrez SendavaPay dans vos applications
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-yellow-500" />
              Vérification requise
            </CardTitle>
            <CardDescription>
              Votre compte doit être vérifié pour accéder à l'API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Pour des raisons de sécurité, seuls les comptes vérifiés peuvent accéder à l'API SendavaPay. 
              Complétez votre vérification KYC pour obtenir vos clés API.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard/kyc">
                <Button data-testid="button-verify-account">
                  <Shield className="h-4 w-4 mr-2" />
                  Vérifier mon compte
                </Button>
              </Link>
              <Link href="/docs">
                <Button variant="outline" data-testid="button-view-docs">
                  <Code2 className="h-4 w-4 mr-2" />
                  Voir la documentation
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Fonctionnalités API
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-medium">Créer des liens de paiement</h3>
                <p className="text-sm text-muted-foreground">
                  Générez des liens de paiement personnalisés pour vos clients
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Vérifier les paiements</h3>
                <p className="text-sm text-muted-foreground">
                  Vérifiez le statut de vos paiements en temps réel
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Créditer des comptes</h3>
                <p className="text-sm text-muted-foreground">
                  Envoyez des fonds directement aux comptes SendavaPay
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Webhooks sécurisés</h3>
                <p className="text-sm text-muted-foreground">
                  Recevez des notifications en temps réel avec signature HMAC
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
