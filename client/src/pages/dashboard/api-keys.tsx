import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import comingSoonImage from "@assets/1767357766910-416405275_1769441573289.png";

export default function ApiKeysPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="max-w-md w-full space-y-6">
          <div className="relative">
            <img 
              src={comingSoonImage} 
              alt="Bientôt disponible" 
              className="w-64 h-64 mx-auto object-contain opacity-80"
            />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">API de Paiement</h1>
            <p className="text-muted-foreground text-lg">
              Notre système d'intégration API est en cours de développement et sera bientôt disponible pour tous les développeurs.
            </p>
          </div>

          <div className="pt-4">
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="rounded-xl px-8">
                Retour au tableau de bord
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
