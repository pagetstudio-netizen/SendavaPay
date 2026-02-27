import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ArrowLeft, ArrowRight, Code2, Webhook, Zap, Key } from "lucide-react";
import imgApiPaiement from "@assets/IMG_20260227_073944_233_1772177997425.jpg";

export default function ApiPaiementPage() {
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
            API de Paiement
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Notre API et SDK simplifient la gestion des transactions. Acceptez les paiements, vérifiez les statuts et automatisez vos retraits depuis une seule intégration.
          </p>

          <div className="rounded-2xl overflow-hidden mb-8">
            <img
              src={imgApiPaiement}
              alt="API de paiement SendavaPay"
              className="w-full object-cover"
            />
          </div>

          <div className="space-y-5 mb-8">
            <div className="flex gap-4 items-start">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Clé API sécurisée</h3>
                <p className="text-muted-foreground text-sm">Générez votre clé API depuis votre tableau de bord en un clic. Authentifiez chaque requête avec votre clé pour des transactions sécurisées.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Code2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold mb-1">SDK multi-langages</h3>
                <p className="text-muted-foreground text-sm">Des exemples de code disponibles en JavaScript, PHP et Python. Intégrez SendavaPay dans votre application en quelques lignes de code.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Webhook className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Webhooks automatiques</h3>
                <p className="text-muted-foreground text-sm">Recevez des notifications instantanées lors de chaque événement (paiement reçu, paiement échoué, crédit effectué) via des webhooks configurables.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Documentation complète</h3>
                <p className="text-muted-foreground text-sm">Une documentation claire et des exemples concrets pour chaque endpoint. Créer des liens de paiement, vérifier des statuts, créditer des comptes — tout est documenté.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/docs" className="flex-1">
              <Button variant="outline" className="w-full font-bold py-4 rounded-xl gap-2">
                <Code2 className="h-4 w-4" />
                Voir la documentation
              </Button>
            </Link>
            <Link href="/auth?tab=register" className="flex-1">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl gap-2">
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
