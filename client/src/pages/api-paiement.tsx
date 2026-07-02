import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ArrowLeft, ArrowRight, Code2, Webhook, Zap, MessageCircle, BookOpen } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import imgApiPaiement from "@assets/IMG_20260227_073944_233_1772177997425.jpg";

const WHATSAPP_NUMBER = "22892299772";

export default function ApiPaiementPage() {
  const supportUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Bonjour, j'ai besoin d'aide concernant l'API SendavaPay."
  )}`;

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

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Link href="/docs" className="flex-1">
              <Button variant="outline" className="w-full font-semibold py-3 rounded-xl gap-2" data-testid="button-docs">
                <Code2 className="h-4 w-4" />
                Documentation
              </Button>
            </Link>
            <Link href="/auth?tab=register" className="flex-1">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl gap-2" data-testid="button-get-api-key">
                Obtenir ma clé API
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* SDK Payin / Payout sans redirection */}
          <div className="border border-border rounded-2xl p-5 mb-4 bg-muted/30">
            <div className="flex items-start gap-3 mb-3">
              <div className="bg-primary/10 rounded-xl p-2 shrink-0">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-base mb-1">API SDK — Payin & Payout sans redirection</h2>
                <p className="text-sm text-muted-foreground">
                  Collectez et envoyez des fonds Mobile Money directement depuis votre back-end, sans aucune page de redirection.
                  Idéal pour les plateformes, marketplaces et applications qui ont besoin d'un contrôle total du flux de paiement.
                </p>
              </div>
            </div>
            <Link href="/sdk-docs">
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl gap-2"
                data-testid="button-request-sdk-access"
              >
                <BookOpen className="h-4 w-4" />
                Voir la documentation SDK
              </Button>
            </Link>
          </div>

          {/* Support WhatsApp */}
          <a href={supportUrl} target="_blank" rel="noopener noreferrer">
            <Button
              variant="outline"
              className="w-full border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 font-semibold py-3 rounded-xl gap-2"
              data-testid="button-whatsapp-support"
            >
              <MessageCircle className="h-4 w-4" />
              Contacter le support via WhatsApp
            </Button>
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
