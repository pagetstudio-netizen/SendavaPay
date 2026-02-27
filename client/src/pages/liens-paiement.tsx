import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ArrowLeft, ArrowRight, Link2, Share2 } from "lucide-react";
import imgLiensPaiement from "@assets/IMG-20260224-WA0011_1772177956027.jpg";

export default function LiensPaiementPage() {
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
            Liens de Paiement
          </h1>
          <p className="text-base text-muted-foreground mb-5">
            Générez un lien, partagez-le, et encaissez vos paiements directement. Simple, rapide et 100 % sécurisé, même sans site web.
          </p>

          <div className="rounded-2xl overflow-hidden mb-5">
            <img src={imgLiensPaiement} alt="Liens de paiement SendavaPay" className="w-full object-cover" />
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex gap-3 items-center">
              <Link2 className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">Créez votre lien en quelques secondes, sans configuration technique.</p>
            </div>
            <div className="flex gap-3 items-center">
              <Share2 className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">Partagez sur WhatsApp, Instagram, Facebook ou par SMS et recevez vos paiements Mobile Money.</p>
            </div>
          </div>

          <Link href="/auth?tab=register">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl gap-2">
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
