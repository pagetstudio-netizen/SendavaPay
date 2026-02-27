import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ArrowLeft, ArrowRight, Headphones, Clock, MessageSquare, CheckCircle } from "lucide-react";
import imgBesoinAide from "@assets/sendavapay4_1772177760975.jpg";

export default function AssistancePage() {
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
            Besoin d'aide ?
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Notre équipe d'assistance est à votre écoute à tout moment pour répondre à vos questions, vous aider dans vos paiements et résoudre vos problèmes en un instant.
          </p>

          <div className="rounded-2xl overflow-hidden mb-8">
            <img
              src={imgBesoinAide}
              alt="Assistance SendavaPay"
              className="w-full object-cover"
            />
          </div>

          <div className="space-y-5 mb-8">
            <div className="flex gap-4 items-start">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Disponible 24h/24 — 7j/7</h3>
                <p className="text-muted-foreground text-sm">Notre équipe de support est disponible à toute heure, même le week-end et les jours fériés. Vous n'êtes jamais seul face à un problème.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Assistance en ligne</h3>
                <p className="text-muted-foreground text-sm">Contactez-nous directement via WhatsApp ou notre chat en ligne. Nos agents répondent en quelques minutes pour résoudre votre problème rapidement.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Suivi de vos transactions</h3>
                <p className="text-muted-foreground text-sm">En cas de litige ou de problème avec un paiement, notre équipe vérifie et corrige la situation directement. Transmettez-nous simplement l'ID de transaction.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Résolution rapide garantie</h3>
                <p className="text-muted-foreground text-sm">Nous nous engageons à résoudre chaque problème dans les plus brefs délais. Votre satisfaction est notre priorité absolue.</p>
              </div>
            </div>
          </div>

          <Link href="/auth?tab=register">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl gap-2">
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
