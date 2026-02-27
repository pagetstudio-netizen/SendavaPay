import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ArrowLeft, ArrowRight, Link2, Share2, Shield, Smartphone } from "lucide-react";
import imgLiensPaiement from "@assets/IMG-20260224-WA0011_1772177956027.jpg";

export default function LiensPaiementPage() {
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
            Liens de Paiement
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Générez un lien, partagez-le, et encaissez vos paiements directement. Simple, rapide et 100 % sécurisé, même sans site web.
          </p>

          <div className="rounded-2xl overflow-hidden mb-8">
            <img
              src={imgLiensPaiement}
              alt="Liens de paiement SendavaPay"
              className="w-full object-cover"
            />
          </div>

          <div className="space-y-5 mb-8">
            <div className="flex gap-4 items-start">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Link2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Créez en quelques secondes</h3>
                <p className="text-muted-foreground text-sm">Définissez le nom, le montant, la devise et la description de votre produit ou service. Votre lien est prêt immédiatement, sans configuration technique.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Partagez partout</h3>
                <p className="text-muted-foreground text-sm">Partagez votre lien sur WhatsApp, Instagram, Facebook, Telegram ou par SMS. Vos clients peuvent payer depuis n'importe quel appareil.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Paiement Mobile Money</h3>
                <p className="text-muted-foreground text-sm">Vos clients paient via MTN, Moov, Orange, TMoney, Wave et bien d'autres opérateurs disponibles dans 7 pays africains.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold mb-1">100% sécurisé</h3>
                <p className="text-muted-foreground text-sm">Chaque transaction est protégée et vérifiée. Vous recevez une notification instantanée à chaque paiement reçu.</p>
              </div>
            </div>
          </div>

          <Link href="/auth?tab=register">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl gap-2">
              Créer mon premier lien
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
