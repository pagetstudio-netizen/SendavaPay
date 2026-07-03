import { useEffect } from "react";
import { Link } from "wouter";
import { Code2, BookOpen, ArrowRight, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function DocumentationPage() {
  useEffect(() => {
    document.title = "Documentation | SendavaPay";
    const metaDesc = document.querySelector('meta[name="description"]');
    const content = "Choisissez votre méthode d'intégration SendavaPay : API avec redirection (checkout hébergé) ou API SDK Payin & Payout (sans redirection, backend direct).";
    if (metaDesc) {
      metaDesc.setAttribute("content", content);
    } else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = content;
      document.head.appendChild(m);
    }
    return () => { document.title = "SendavaPay"; };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-16">
        <Link href="/">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 text-sm" data-testid="button-back-home">
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </button>
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Documentation SendavaPay</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Deux façons d'intégrer SendavaPay à votre plateforme. Choisissez celle qui correspond à votre besoin.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/docs">
            <div
              className="group h-full border rounded-2xl p-8 hover-elevate transition-all cursor-pointer flex flex-col"
              data-testid="card-doc-redirect"
            >
              <div className="bg-primary/10 rounded-xl p-3 w-fit mb-5">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">API avec redirection</h2>
              <p className="text-sm text-muted-foreground flex-1 mb-6">
                Checkout hébergé par SendavaPay et liens de paiement. Intégration la plus simple et la plus rapide —
                idéal pour les boutiques en ligne, factures et paiements ponctuels.
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                Voir la documentation
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Link>

          <Link href="/sdk-docs">
            <div
              className="group h-full border rounded-2xl p-8 hover-elevate transition-all cursor-pointer flex flex-col"
              data-testid="card-doc-sdk"
            >
              <div className="bg-purple-500/10 rounded-xl p-3 w-fit mb-5">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">API SDK — Payin & Payout</h2>
              <p className="text-sm text-muted-foreground flex-1 mb-6">
                Encaissez et envoyez des fonds Mobile Money directement depuis votre back-end, sans page de
                redirection. Idéal pour les plateformes et marketplaces qui veulent un contrôle total du flux.
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-600">
                Voir la documentation
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
