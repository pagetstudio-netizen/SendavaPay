import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Smartphone,
  CreditCard,
  Link2,
  Send,
  Download,
  CheckCircle,
} from "lucide-react";
import heroImage from "@assets/20260126_143225_1769439498445.png";
import countriesImage from "@assets/benefits-3_1769439430626.webp";
import transferImage from "@assets/xJ3fjboUJLVolfGqf752ILN4_1769439430656.png";

export default function HomePage() {
  const features = [
    {
      icon: CreditCard,
      title: "Dépôts instantanés",
      description: "Rechargez votre compte via Mobile Money (MTN, Moov, Orange) ou carte bancaire.",
    },
    {
      icon: Link2,
      title: "Liens de paiement",
      description: "Créez des liens de paiement personnalisés pour recevoir de l'argent facilement.",
    },
    {
      icon: Send,
      title: "Transferts rapides",
      description: "Envoyez de l'argent à vos proches instantanément, sans frais cachés.",
    },
    {
      icon: Download,
      title: "Retraits automatiques",
      description: "Retirez votre argent vers votre Mobile Money en quelques secondes.",
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Créez votre compte",
      description: "Inscrivez-vous gratuitement en quelques minutes avec votre email et numéro de téléphone.",
    },
    {
      step: "02",
      title: "Vérifiez votre identité",
      description: "Complétez la vérification KYC pour débloquer toutes les fonctionnalités.",
    },
    {
      step: "03",
      title: "Commencez à transférer",
      description: "Déposez, envoyez et recevez de l'argent en toute sécurité.",
    },
  ];

  const benefits = [
    {
      icon: Shield,
      title: "100% Sécurisé",
      description: "Vos données et transactions sont cryptées et protégées.",
    },
    {
      icon: Zap,
      title: "Ultra rapide",
      description: "Transactions traitées en quelques secondes.",
    },
    {
      icon: Globe,
      title: "6 pays couverts",
      description: "Togo, Bénin, Sénégal, Mali, Burkina Faso, Côte d'Ivoire.",
    },
    {
      icon: Smartphone,
      title: "Mobile first",
      description: "Plateforme optimisée pour tous vos appareils.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                  Paiements{" "}
                  <span className="text-primary">rapides</span> et{" "}
                  <span className="text-primary">sécurisés</span> en Afrique de l'Ouest
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
                  SendavaPay est une plateforme tout-en-un qui vous permet de créer des liens de paiement, 
                  de transférer de l'argent et d'effectuer des retraits crédités sous 1h à 24h.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth?tab=register">
                  <Button 
                    size="lg" 
                    className="gap-2 w-full sm:w-auto font-semibold shadow-lg shadow-primary/30" 
                    data-testid="button-hero-register"
                  >
                    Commencer maintenant
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-auto font-medium" 
                    data-testid="button-hero-learn-more"
                  >
                    En savoir plus
                  </Button>
                </a>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">Inscription gratuite</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">Transactions sécurisées</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
                <img
                  src={heroImage}
                  alt="SendavaPay - Paiements en Afrique de l'Ouest"
                  className="w-full h-auto object-cover"
                  data-testid="img-hero"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 lg:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-lg text-muted-foreground">
              Des fonctionnalités puissantes pour gérer vos finances en toute simplicité.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover-elevate transition-all duration-200">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary mb-4">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <img
                src={countriesImage}
                alt="SendavaPay disponible dans 6 pays"
                className="rounded-2xl shadow-xl w-full"
                data-testid="img-countries"
              />
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Disponible dans 6 pays d'Afrique de l'Ouest
              </h2>
              <p className="text-lg text-muted-foreground">
                Avec SendavaPay, encaissez en toute sécurité dans 6 pays d'Afrique de l'Ouest. 
                Simplifiez vos paiements, développez votre business sans frontières.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {["Togo", "Bénin", "Sénégal", "Mali", "Burkina Faso", "Côte d'Ivoire"].map((country) => (
                  <div key={country} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>{country}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-16 lg:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-lg text-muted-foreground">
              Commencez à utiliser SendavaPay en 3 étapes simples.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((item, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-primary/10 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 right-0 w-1/2 h-0.5 bg-gradient-to-r from-primary/20 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Transférez rapidement de l'argent
              </h2>
              <p className="text-lg text-muted-foreground">
                Avec SendavaPay, transférez rapidement de l'argent, recevez instantanément de l'argent. 
                Avec nous, c'est facile et rapide pour faire vos transactions et recevoir de l'argent.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <benefit.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">{benefit.title}</h4>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <img
                src={transferImage}
                alt="Transférez de l'argent avec SendavaPay"
                className="rounded-2xl shadow-xl w-full"
                data-testid="img-transfer"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers d'utilisateurs qui font confiance à SendavaPay 
            pour leurs transactions financières.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth?tab=register">
              <Button 
                size="lg" 
                variant="secondary" 
                className="gap-2 font-semibold shadow-lg" 
                data-testid="button-cta-register"
              >
                Créer un compte gratuit
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="https://wa.me/22892299772" target="_blank" rel="noopener noreferrer">
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-white/10 border-white/40 text-white font-medium backdrop-blur-sm" 
                data-testid="button-cta-contact"
              >
                Nous contacter
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
