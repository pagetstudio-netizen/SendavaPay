import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ArrowLeft, ArrowRight, BarChart2, TrendingUp, Eye, Clock } from "lucide-react";
import imgStatistiques from "@assets/Screenshot_20260227-073700_1772177874148.png";

export default function StatistiquesPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link href="/">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>
          </Link>

          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight" style={{fontFamily: "'Playfair Display', serif"}}>
            Statistiques
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Suivez vos transactions en temps réel et obtenez des rapports détaillés pour une meilleure prise de décision.
          </p>

          <div className="rounded-2xl overflow-hidden mb-8 border border-border/30">
            <img
              src={imgStatistiques}
              alt="Tableau de bord statistiques SendavaPay"
              className="w-full object-cover"
            />
          </div>

          <div className="space-y-5 mb-8">
            <div className="flex gap-4 items-start">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <BarChart2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Tableau de bord en temps réel</h3>
                <p className="text-muted-foreground text-sm">Visualisez vos revenus, le nombre de transactions, les liens actifs et le total collecté depuis votre tableau de bord. Toutes les données se mettent à jour automatiquement.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Évolution des revenus</h3>
                <p className="text-muted-foreground text-sm">Suivez l'évolution de vos revenus jour par jour sur les 7 derniers jours, le mois en cours et le mois précédent. Comparez votre performance facilement.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Liens les plus rentables</h3>
                <p className="text-muted-foreground text-sm">Identifiez vos liens de paiement qui génèrent le plus de revenus et ceux qui reçoivent le plus de clics pour optimiser votre stratégie de vente.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Historique complet</h3>
                <p className="text-muted-foreground text-sm">Accédez à l'historique complet de toutes vos transactions, filtrez par période, par statut ou par lien de paiement.</p>
              </div>
            </div>
          </div>

          <Link href="/auth?tab=register">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl gap-2">
              Créer mon compte gratuitement
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
