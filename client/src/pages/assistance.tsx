import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ArrowLeft, ArrowRight, Clock, MessageSquare } from "lucide-react";
import imgBesoinAide from "@assets/sendavapay4_1772177760975.jpg";

export default function AssistancePage() {
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
            Besoin d'aide ?
          </h1>
          <p className="text-base text-muted-foreground mb-5">
            Notre équipe est à votre écoute à tout moment pour répondre à vos questions et résoudre vos problèmes en un instant.
          </p>

          <div className="rounded-2xl overflow-hidden mb-5">
            <img src={imgBesoinAide} alt="Assistance SendavaPay" className="w-full object-cover" />
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex gap-3 items-center">
              <Clock className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">Disponible 24h/24 — 7j/7, même le week-end et les jours fériés.</p>
            </div>
            <div className="flex gap-3 items-center">
              <MessageSquare className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">Contactez-nous via WhatsApp ou chat en ligne. Réponse en quelques minutes.</p>
            </div>
          </div>

          <Link href="/auth?tab=register">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl gap-2">
              Rejoindre SendavaPay
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
