import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useEffect, useRef } from "react";
import {
  ArrowRight,
  Shield,
  Globe,
  Smartphone,
  CreditCard,
  Link2,
  Zap,
  CheckCircle,
  Clock,
  ChevronDown,
  Headphones,
  Wallet,
  Share2,
  Banknote,
} from "lucide-react";
import heroImage from "@assets/20260126_143225_1769439498445.png";
import countriesImage from "@assets/benefits-3_1769439430626.webp";
import transferImage from "@assets/xJ3fjboUJLVolfGqf752ILN4_1769439430656.png";

export default function HomePage() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const elements = document.querySelectorAll(".scroll-animate");
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  const features = [
    {
      icon: Link2,
      title: "Liens de paiement illimités",
      description: "Créez autant de liens que vous voulez pour vos produits et services.",
    },
    {
      icon: CreditCard,
      title: "Mobile Money & Cartes",
      description: "Acceptez Mobile Money (MTN, Moov, Orange, TMoney, Wave) et cartes bancaires.",
    },
    {
      icon: Banknote,
      title: "Recevez votre argent",
      description: "Retirez vos fonds rapidement vers votre Mobile Money, sous 1h à 24h.",
    },
  ];

  const steps = [
    {
      step: "1",
      title: "Créez votre lien de paiement",
      description: "Définissez un montant et une description en quelques secondes.",
      icon: Link2,
    },
    {
      step: "2",
      title: "Partagez votre lien",
      description: "Envoyez-le à vos clients sur WhatsApp, Instagram ou par SMS.",
      icon: Share2,
    },
    {
      step: "3",
      title: "Recevez votre argent",
      description: "Vos clients paient par Mobile Money ou carte. Vous retirez vos fonds quand vous voulez.",
      icon: Wallet,
    },
  ];

  const benefits = [
    {
      icon: Globe,
      title: "Partout dans le monde",
      description: "Vendez via WhatsApp, Instagram ou lien direct.",
    },
    {
      icon: Smartphone,
      title: "Mobile Money ou Carte",
      description: "Recevez Mobile Money & cartes, sans compte bancaire.",
    },
    {
      icon: Clock,
      title: "Retrait Rapide",
      description: "Retirez vos fonds rapidement, sans stress ni paperasse.",
    },
  ];

  const faqs = [
    {
      question: "Faut-il un compte bancaire ?",
      answer: "Non, vous n'avez pas besoin de compte bancaire. Vous pouvez recevoir et retirer votre argent via Mobile Money (MTN, Moov, Orange, TMoney, Wave).",
    },
    {
      question: "Quels moyens de paiement sont acceptés ?",
      answer: "Nous acceptons Mobile Money (MTN, Moov, Orange, TMoney, Wave) et les cartes bancaires (Visa, Mastercard).",
    },
    {
      question: "En combien de temps puis-je retirer mes fonds ?",
      answer: "Les retraits sont crédités dans les plus brefs délais de 1h à 24h sur votre Mobile Money.",
    },
    {
      question: "SendavaPay est-il disponible dans mon pays ?",
      answer: "SendavaPay est disponible au Togo, Bénin, Sénégal, Mali, Burkina Faso et Côte d'Ivoire.",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <style>{`
        .scroll-animate {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        .scroll-animate.animate-in {
          opacity: 1;
          transform: translateY(0);
        }
        .scroll-animate-left {
          opacity: 0;
          transform: translateX(-60px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        .scroll-animate-left.animate-in {
          opacity: 1;
          transform: translateX(0);
        }
        .scroll-animate-right {
          opacity: 0;
          transform: translateX(60px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        .scroll-animate-right.animate-in {
          opacity: 1;
          transform: translateX(0);
        }
        .scroll-animate-scale {
          opacity: 0;
          transform: scale(0.9);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        .scroll-animate-scale.animate-in {
          opacity: 1;
          transform: scale(1);
        }
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .pulse-glow {
          animation: pulseGlow 2s ease-in-out infinite;
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(var(--primary-rgb), 0.3); }
          50% { box-shadow: 0 0 40px rgba(var(--primary-rgb), 0.6); }
        }
        .stagger-1 { transition-delay: 0.1s; }
        .stagger-2 { transition-delay: 0.2s; }
        .stagger-3 { transition-delay: 0.3s; }
        .stagger-4 { transition-delay: 0.4s; }
        .gradient-text {
          background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.7) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium scroll-animate">
                <Zap className="h-4 w-4" />
                Nouvelles Fonctionnalités
              </div>
              
              <div className="space-y-4 scroll-animate stagger-1">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                  Encaissez vos clients en{" "}
                  <span className="gradient-text">30 secondes</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
                  Créez un lien de paiement, partagez-le et recevez l'argent immédiatement par Mobile Money ou carte bancaire.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 scroll-animate stagger-2">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span>Sécurisé & conforme KYC</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <span>6 pays d'Afrique de l'Ouest</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Headphones className="h-5 w-5 text-purple-500" />
                  <span>Support local</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 scroll-animate stagger-3">
                <Link href="/auth?tab=register">
                  <Button 
                    size="lg" 
                    className="gap-2 w-full sm:w-auto font-semibold shadow-lg shadow-primary/30 text-base px-8" 
                    data-testid="button-hero-register"
                  >
                    Créer un lien de paiement
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative scroll-animate stagger-2">
              <div className="relative float-animation">
                <img
                  src={heroImage}
                  alt="SendavaPay - Encaissez vos clients facilement"
                  className="w-full h-auto object-cover rounded-2xl shadow-2xl"
                  data-testid="img-hero"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-12">
            <a href="#why-sendavapay" className="animate-bounce">
              <ChevronDown className="h-8 w-8 text-muted-foreground" />
            </a>
          </div>
        </div>
      </section>

      {/* Why SendavaPay Section */}
      <section id="why-sendavapay" className="py-20 lg:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-primary font-semibold mb-3 scroll-animate">POURQUOI SENDAVAPAY</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 scroll-animate stagger-1">
              Pensé pour vendre simplement en Afrique
            </h2>
            <p className="text-lg text-muted-foreground scroll-animate stagger-2">
              SendavaPay est conçu pour les vendeurs africains qui vendent déjà en ligne, mais perdent du temps et des ventes à cause des paiements compliqués.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="scroll-animate-left scroll-animate">
              <img
                src={countriesImage}
                alt="Vendez facilement avec SendavaPay"
                className="rounded-2xl shadow-xl w-full max-w-md mx-auto"
                data-testid="img-countries"
              />
            </div>
            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className={`flex items-start gap-4 p-6 rounded-xl bg-background shadow-sm hover-elevate transition-all scroll-animate stagger-${index + 1}`}
                >
                  <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <benefit.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-primary font-semibold mb-3 scroll-animate">COMMENT ÇA MARCHE</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 scroll-animate stagger-1">
              Votre premier paiement en 3 étapes
            </h2>
            <p className="text-lg text-muted-foreground scroll-animate stagger-2">
              Encaissez dès aujourd'hui, sans site web
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
            
            {steps.map((item, index) => (
              <div 
                key={index} 
                className={`relative text-center scroll-animate-scale scroll-animate stagger-${index + 1}`}
              >
                <div className="relative inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-6 shadow-lg">
                  {item.step}
                </div>
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary mb-4">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
                {index === 2 && (
                  <div className="mt-4 inline-flex items-center gap-2 text-green-500 font-medium">
                    <CheckCircle className="h-5 w-5" />
                    Terminé !
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12 scroll-animate">
            <Link href="/auth?tab=register">
              <Button size="lg" className="gap-2 font-semibold shadow-lg shadow-primary/30 text-base px-8" data-testid="button-steps-register">
                Créer un lien de paiement maintenant
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-primary font-semibold mb-3 scroll-animate">FONCTIONNALITÉS</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 scroll-animate stagger-1">
              L'essentiel pour encaisser sans friction
            </h2>
            <p className="text-lg text-muted-foreground scroll-animate stagger-2">
              Ce qu'il vous faut. Rien de plus.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={`hover-elevate transition-all duration-300 border-2 border-transparent hover:border-primary/20 scroll-animate-scale scroll-animate stagger-${index + 1}`}
              >
                <CardContent className="p-8 text-center">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 text-primary mb-6">
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold text-xl mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12 scroll-animate">
            <Link href="/auth?tab=register">
              <Button size="lg" className="gap-2 font-semibold shadow-lg shadow-primary/30 text-base px-8" data-testid="button-features-register">
                Créer un lien de paiement maintenant
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats/Dashboard Section */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 scroll-animate-left scroll-animate">
              <p className="text-primary font-semibold">TABLEAU DE BORD</p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                Suivez vos ventes en temps réel
              </h2>
              <p className="text-lg text-muted-foreground">
                Un tableau de bord simple et intuitif pour gérer vos paiements, suivre vos transactions et retirer vos fonds.
              </p>
              <div className="space-y-4">
                {[
                  "Historique de toutes vos transactions",
                  "Notifications en temps réel",
                  "Retraits rapides vers Mobile Money",
                  "Statistiques de vos ventes",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="scroll-animate-right scroll-animate">
              <img
                src={transferImage}
                alt="Tableau de bord SendavaPay"
                className="rounded-2xl shadow-xl w-full"
                data-testid="img-transfer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-primary font-semibold mb-3 scroll-animate">TARIFS</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 scroll-animate stagger-1">
              Aucun abonnement. Aucun frais caché.
            </h2>
            <p className="text-lg text-muted-foreground scroll-animate stagger-2">
              Vous payez seulement quand vous encaissez.
            </p>
          </div>

          <div className="max-w-lg mx-auto scroll-animate-scale scroll-animate">
            <Card className="border-2 border-primary shadow-xl">
              <CardHeader className="text-center pb-2">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mx-auto mb-4">
                  Populaire
                </div>
                <CardTitle className="text-2xl">Plan Unique</CardTitle>
                <p className="text-muted-foreground">Parfait pour les indépendants et créateurs</p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center mb-8">
                  <span className="text-5xl font-bold">7%</span>
                  <span className="text-muted-foreground"> / par transaction réussie</span>
                </div>
                <div className="space-y-4 mb-8">
                  {[
                    "Liens de paiement illimités",
                    "Mobile Money & Cartes acceptés",
                    "Retraits sous 1h à 24h (Mobile Money)",
                    "Frais de retrait : 0 FCFA",
                    "Support client disponible",
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/auth?tab=register">
                  <Button className="w-full gap-2 font-semibold text-base" size="lg" data-testid="button-pricing-register">
                    Créer un compte gratuit
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold mb-3 scroll-animate">FAQ</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold scroll-animate stagger-1">
              Questions fréquemment posées
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card 
                key={index} 
                className={`hover-elevate transition-all scroll-animate stagger-${Math.min(index + 1, 4)}`}
              >
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center scroll-animate">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Prêt à encaisser vos clients ?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers de vendeurs qui font confiance à SendavaPay pour leurs paiements en Afrique de l'Ouest.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth?tab=register">
              <Button 
                size="lg" 
                variant="secondary" 
                className="gap-2 font-semibold shadow-lg text-base px-8" 
                data-testid="button-cta-register"
              >
                Créer un compte gratuit
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <a href="https://wa.me/22892299772" target="_blank" rel="noopener noreferrer">
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-white/10 border-white/40 text-white font-medium backdrop-blur-sm text-base px-8" 
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
