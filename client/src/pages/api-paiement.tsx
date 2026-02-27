import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ArrowLeft, ArrowRight, Code2, Webhook } from "lucide-react";
import imgApiPaiement from "@assets/IMG_20260227_073944_233_1772177997425.jpg";

export default function ApiPaiementPage() {
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
            API de Paiement
          </h1>
          <p className="text-base text-muted-foreground mb-5">
            Notre API et SDK simplifient la gestion des transactions. Intégrez SendavaPay à votre plateforme en quelques lignes de code.
          </p>

          <div className="rounded-2xl overflow-hidden mb-5">
            <img src={imgApiPaiement} alt="API de paiement SendavaPay" className="w-full object-cover" />
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex gap-3 items-center">
              <Code2 className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">Exemples de code en JavaScript, PHP et Python. Documentation claire incluse.</p>
            </div>
            <div className="flex gap-3 items-center">
              <Webhook className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">Webhooks pour recevoir des notifications instantanées à chaque événement de paiement.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/docs" className="flex-1">
              <Button variant="outline" className="w-full font-semibold py-3 rounded-xl gap-2">
                <Code2 className="h-4 w-4" />
                Documentation
              </Button>
            </Link>
            <Link href="/auth?tab=register" className="flex-1">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl gap-2">
                Obtenir ma clé API
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
