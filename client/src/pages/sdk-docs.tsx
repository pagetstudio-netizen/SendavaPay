import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SdkDocumentation } from "@/pages/dashboard/api-keys";

export default function SdkDocsPage() {
  useEffect(() => {
    document.title = "Documentation API SDK Payin & Payout | SendavaPay";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content",
        "Documentation complète de l'API SDK SendavaPay — Payin & Payout Mobile Money sans redirection. Encaissez et envoyez des fonds sur 10 pays d'Afrique de l'Ouest et Centrale (Togo, Bénin, Cameroun, Côte d'Ivoire, Sénégal, RD Congo…) directement depuis votre backend."
      );
    } else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = "Documentation complète de l'API SDK SendavaPay — Payin & Payout Mobile Money sans redirection. Encaissez et envoyez des fonds sur 10 pays d'Afrique de l'Ouest et Centrale directement depuis votre backend.";
      document.head.appendChild(m);
    }
    const setMeta = (property: string, content: string, attr = "property") => {
      let el = document.querySelector(`meta[${attr}="${property}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, property); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("og:title",       "API SDK SendavaPay — Payin & Payout sans redirection");
    setMeta("og:description", "Encaissez des paiements Mobile Money et effectuez des retraits automatisés via l'API SDK SendavaPay. Intégration complète sans page de redirection.");
    setMeta("og:type",        "website");
    setMeta("og:url",         "https://sendavapay.com/sdk-docs");
    setMeta("twitter:card",   "summary_large_image", "name");
    setMeta("twitter:title",  "API SDK SendavaPay — Payin & Payout Mobile Money", "name");

    const canonical = document.querySelector('link[rel="canonical"]') || (() => {
      const l = document.createElement("link"); l.setAttribute("rel", "canonical"); document.head.appendChild(l); return l;
    })();
    (canonical as HTMLLinkElement).href = "https://sendavapay.com/sdk-docs";

    return () => {
      document.title = "SendavaPay";
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero SEO */}
      <div className="border-b bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href="/api-de-paiement">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm">
              <ArrowLeft className="h-4 w-4" />
              API de Paiement
            </button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  API SDK v3
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Payin & Payout
                </span>
              </div>
              <h1 className="text-2xl font-bold">Référence API SDK</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Intégration complète sans redirection — 10 pays, Mobile Money, Webhooks HMAC
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link href="/docs">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  API Redirection
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
              <Link href="/auth?tab=register">
                <Button size="sm" className="gap-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white">
                  Obtenir ma clé SDK
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Documentation content (placeholder key used for public visitors) */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4">
        <SdkDocumentation apiKeys={[]} />
      </main>

      <Footer />
    </div>
  );
}
