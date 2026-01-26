import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import comingSoonImage from "@assets/1767357766910-416405275_1769441573289.png";

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <img
            src={comingSoonImage}
            alt="Bientôt disponible"
            className="max-w-md mx-auto w-full h-auto"
            data-testid="img-coming-soon"
          />
          
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold">
              API de Paiement
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Notre API de paiement sera bientôt disponible. Vous pourrez intégrer SendavaPay 
              directement dans vos applications pour accepter des paiements Mobile Money.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button variant="outline" className="gap-2" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4" />
                Retour à l'accueil
              </Button>
            </Link>
            <a href="https://wa.me/22892299772" target="_blank" rel="noopener noreferrer">
              <Button data-testid="button-contact-api">
                Nous contacter
              </Button>
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
