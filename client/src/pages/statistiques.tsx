import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ArrowLeft, ArrowRight, BarChart2, TrendingUp } from "lucide-react";
import imgStatistiques from "@assets/Screenshot_20260227-073700_1772177874148.png";

export default function StatistiquesPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link href="/">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-5 text-sm">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>
          </Link>

          <h1 className="text-4xl font-black mb-3" style={{fontFamily: "'Playfair Display', serif"}}>
            Statistiques
          </h1>
          <p className="text-base text-muted-foreground mb-5">
            Suivez vos transactions en temps réel et obtenez des rapports détaillés pour une meilleure prise de décision.
          </p>

          <div className="rounded-2xl overflow-hidden mb-5 border border-border/30">
            <img src={imgStatistiques} alt="Tableau de bord SendavaPay" className="w-full object-cover" />
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex gap-3 items-center">
              <BarChart2 className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">Revenus, transactions et liens actifs visibles en un coup d'œil.</p>
            </div>
            <div className="flex gap-3 items-center">
              <TrendingUp className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">Évolution jour par jour sur 7 jours, mois en cours et mois précédent.</p>
            </div>
          </div>

          <Link href="/auth?tab=register">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl gap-2">
              Créer mon compte
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
