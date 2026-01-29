import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Shield,
  Globe,
  Smartphone,
  Link2,
  Zap,
  CheckCircle,
  Clock,
  ChevronDown,
  Headphones,
  Wallet,
  Share2,
  Banknote,
  MessageSquare,
  Users,
  Star,
  ThumbsUp,
  Phone,
  CheckCircle2,
  ShoppingBag,
  Megaphone,
  MousePointer,
  Check,
} from "lucide-react";

import mtnLogo from "@assets/mtn_(1)_1763835082904-BVdEqpuz_1769443204393.png";
import moovLogo from "@assets/moov_(1)_1763835082986-GKkwwfPK_1769443204522.png";
import waveLogo from "@assets/wave_(1)_1763835083242-BDJmxeWc_(1)_1769443204492.png";
import wizallLogo from "@assets/wizall_1763835083090-BfalgIrK_1769443204592.png";
import mixxLogo from "@assets/mixxByYas-web-page_1763835083140-t9C-E95C_1769443204464.png";
import orangeLogo from "@assets/images_1769443862827.png";
import tmoneyLogo from "@assets/images_(1)_1769443862863.png";
import airtelLogo from "@assets/Airtel_logo-01_1769443862893.png";
import vodacomLogo from "@assets/vodacom_1769443862923.png";
import heroImage1 from "@assets/benefits-3_1769443912067.webp";
import heroImage2 from "@assets/xJ3fjboUJLVolfGqf752ILN4_1769443912093.png";
import heroImage3 from "@assets/20260126_143225_1769443932093.png";

export default function HomePage() {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [currentPlatform, setCurrentPlatform] = useState(0);
  
  const platforms = ["WhatsApp", "Instagram", "Facebook", "Telegram"];
  const platformColors = ["text-green-500", "text-pink-500", "text-blue-600", "text-blue-400"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlatform((prev) => (prev + 1) % platforms.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

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
      icon: Smartphone,
      title: "Moyens de Paiement",
      description: "MTN, Moov, Orange, TMoney, Wave",
    },
    {
      icon: ShoppingBag,
      title: "Tous Produits",
      description: "Vendez n'importe quel produit ou service",
    },
    {
      icon: Megaphone,
      title: "Partagez vos liens partout",
      description: "WhatsApp, Instagram, Facebook...",
    },
    {
      icon: MousePointer,
      title: "User Friendly",
      description: "Interface simple et intuitive",
    },
    {
      icon: Phone,
      title: "Support Réactif",
      description: "Assistance disponible 7j/7",
    },
    {
      icon: CheckCircle2,
      title: "Conformité KYC",
      description: "Vérification sécurisée",
    },
  ];

  const steps = [
    {
      step: "Etape 1",
      title: "Créez votre lien de paiement",
      description: "Définissez un montant en quelques secondes.",
      icon: Users,
    },
    {
      step: "Etape 2",
      title: "Partagez votre lien",
      description: "Envoyez-le à vos clients sur WhatsApp, Instagram ou par SMS.",
      icon: Share2,
    },
    {
      step: "Etape 3",
      title: "Recevez votre argent",
      description: "Vos clients paient par Mobile Money. Retirez vos fonds quand vous voulez.",
      icon: Wallet,
    },
  ];

  const benefits = [
    {
      icon: Clock,
      title: "Gagner du temps",
      description: "Automatiser les réponses et la gestion des commandes",
    },
    {
      icon: Shield,
      title: "Paiements sécurisés",
      description: "Transactions protégées et conformes aux normes",
    },
    {
      icon: Banknote,
      title: "Retrait rapide",
      description: "Recevez vos fonds sous 1h à 24h sur Mobile Money",
    },
  ];

  const faqs = [
    {
      question: "Faut-il un compte bancaire ?",
      answer: "Non, vous n'avez pas besoin de compte bancaire. Vous pouvez recevoir et retirer votre argent via Mobile Money (MTN, Moov, Orange, TMoney, Wave).",
    },
    {
      question: "Quels moyens de paiement sont acceptés ?",
      answer: "Nous acceptons Mobile Money (MTN, Moov, Orange, TMoney, Wave).",
    },
    {
      question: "En combien de temps puis-je retirer mes fonds ?",
      answer: "Les retraits sont crédités dans les plus brefs délais de 1h à 24h sur votre Mobile Money.",
    },
    {
      question: "SendavaPay est-il disponible dans mon pays ?",
      answer: "SendavaPay est disponible au Bénin, Burkina Faso, Togo, Cameroun, Côte d'Ivoire, RDC et Congo Brazzaville.",
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
        .scroll-animate-scale {
          opacity: 0;
          transform: scale(0.9);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        .scroll-animate-scale.animate-in {
          opacity: 1;
          transform: scale(1);
        }
        .stagger-1 { transition-delay: 0.1s; }
        .stagger-2 { transition-delay: 0.2s; }
        .stagger-3 { transition-delay: 0.3s; }
        .stagger-4 { transition-delay: 0.4s; }
        .platform-text {
          animation: fadeInUp 0.5s ease-out;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .hero-gradient {
          background: linear-gradient(180deg, hsl(var(--primary)/0.08) 0%, hsl(var(--background)) 100%);
        }
        .logo-marquee {
          display: flex;
          animation: marquee 20s linear infinite;
        }
        .logo-marquee:hover {
          animation-play-state: paused;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden hero-gradient">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-background text-sm font-medium scroll-animate">
              <Zap className="h-4 w-4 text-primary" />
              Nouvelles Fonctionnalités
            </div>
            
            <div className="space-y-6 scroll-animate stagger-1">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                Encaissez vos clients sur{" "}
                <span key={currentPlatform} className={`platform-text inline-block ${platformColors[currentPlatform]}`}>
                  {platforms[currentPlatform]}
                </span>
                <br />
                en <span className="text-primary">30 secondes</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Créez un lien de paiement, partagez-le et recevez l'argent immédiatement par Mobile Money.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 scroll-animate stagger-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Sécurisé & conforme KYC</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>7 pays d'Afrique</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Support local</span>
              </div>
            </div>

            <div className="scroll-animate stagger-3">
              <Link href="/auth?tab=register">
                <Button 
                  size="sm" 
                  className="gap-2 font-medium text-sm px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90" 
                  data-testid="button-hero-register"
                >
                  Créer un lien de paiement
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Mobile Money Providers - Scrolling Logos */}
            <div className="pt-8 scroll-animate stagger-4">
              <p className="text-sm text-muted-foreground mb-6">Moyens de paiement acceptés</p>
              <div className="overflow-hidden max-w-3xl mx-auto">
                <div className="logo-marquee gap-8">
                  {[mtnLogo, moovLogo, orangeLogo, tmoneyLogo, airtelLogo, vodacomLogo, mtnLogo, moovLogo, orangeLogo, tmoneyLogo, airtelLogo, vodacomLogo].map((logo, index) => (
                    <div key={index} className="flex-shrink-0">
                      <img 
                        src={logo} 
                        alt="Mobile Money" 
                        className="h-16 w-16 object-contain rounded-full"
                      />
                    </div>
                  ))}
                </div>
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

      {/* Hero Image 1 - Tailors/Entrepreneurs */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 scroll-animate">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Transformez votre passion en revenus
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Artisans, créateurs, couturiers... Acceptez les paiements de vos clients en toute simplicité. Partagez votre lien et recevez l'argent directement sur Mobile Money.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/auth?tab=register">
                  <Button size="sm" className="gap-2 bg-foreground text-background hover:bg-foreground/90">
                    Commencer maintenant
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="order-1 md:order-2 flex justify-center scroll-animate stagger-1">
              <img 
                src={heroImage1} 
                alt="Entrepreneur africaine" 
                className="max-w-sm w-full rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Hero Image 2 - Dashboard/Analytics */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center scroll-animate">
              <img 
                src={heroImage2} 
                alt="Dashboard de ventes" 
                className="max-w-md w-full"
              />
            </div>
            <div className="scroll-animate stagger-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Suivez vos ventes en temps réel
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Tableau de bord intuitif pour visualiser vos revenus, vos transactions et la croissance de votre activité. Prenez des décisions éclairées.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/auth?tab=register">
                  <Button size="sm" className="gap-2 bg-foreground text-background hover:bg-foreground/90">
                    Créer mon compte
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why SendavaPay Section */}
      <section id="why-sendavapay" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-background text-sm font-medium mb-6 scroll-animate">
              POURQUOI SENDAVAPAY
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 scroll-animate stagger-1">
              Le meilleur choix pour votre business
            </h2>
            <p className="text-lg text-muted-foreground scroll-animate stagger-2">
              Que vous soyez étudiant, créateur de contenu, e-commerçant ou PME, SendavaPay s'adapte à vos objectifs.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-16 scroll-animate">
            <div className="text-center p-4">
              <div className="text-3xl md:text-4xl font-bold text-foreground">150+</div>
              <div className="text-sm text-muted-foreground mt-1">Avis positifs</div>
            </div>
            <div className="text-center p-4 border-x">
              <div className="text-3xl md:text-4xl font-bold text-foreground">1000+</div>
              <div className="text-sm text-muted-foreground mt-1">Clients satisfaits</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl md:text-4xl font-bold text-foreground">4.9/5</div>
              <div className="text-sm text-muted-foreground mt-1">Notes globales</div>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-4 max-w-2xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card 
                key={index} 
                className={`hover-elevate transition-all scroll-animate stagger-${index + 1}`}
              >
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <benefit.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Hero Image 3 - Features Showcase */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 scroll-animate">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Tout ce dont vous avez besoin
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Vente de produits digitaux, création de liens de paiement, monétisation de votre audience. API de paiement disponible pour les développeurs.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Check className="h-5 w-5 text-green-500" />
                  Vente de produits digitaux
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Check className="h-5 w-5 text-green-500" />
                  Création de liens de paiement
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Check className="h-5 w-5 text-green-500" />
                  API de paiement (bientôt)
                </li>
              </ul>
              <Link href="/auth?tab=register">
                <Button size="sm" className="gap-2 bg-foreground text-background hover:bg-foreground/90">
                  Rejoindre SendavaPay
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="order-1 md:order-2 flex justify-center scroll-animate stagger-1">
              <img 
                src={heroImage3} 
                alt="Fonctionnalités SendavaPay" 
                className="max-w-lg w-full rounded-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-background text-sm font-medium mb-6 scroll-animate">
              Comment ça marche
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 scroll-animate stagger-1">
              VOTRE PREMIER PAIEMENT EN 3 ÉTAPES
            </h2>
            <p className="text-lg text-muted-foreground scroll-animate stagger-2">
              Encaissez dès aujourd'hui, sans site web
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {steps.map((item, index) => (
              <Card 
                key={index} 
                className={`hover-elevate transition-all scroll-animate-scale scroll-animate stagger-${index + 1}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground font-medium">{item.step}</span>
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <item.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12 scroll-animate">
            <Link href="/auth?tab=register">
              <Button 
                size="lg" 
                className="gap-2 font-semibold text-base px-8 py-6 rounded-xl bg-foreground text-background hover:bg-foreground/90" 
                data-testid="button-steps-register"
              >
                Créer un lien de paiement maintenant
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-20 lg:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-background text-sm font-medium mb-6 scroll-animate">
              Fonctionnalités
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 scroll-animate stagger-1">
              Des fonctionnalités qui font la différence
            </h2>
            <p className="text-lg text-muted-foreground scroll-animate stagger-2">
              Chaque fonctionnalité de SendavaPay a été conçue pour répondre aux réalités du marché africain.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={`hover-elevate transition-all scroll-animate-scale scroll-animate stagger-${Math.min(index + 1, 4)}`}
              >
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary mb-4">
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-bold text-base mb-1">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-background text-sm font-medium mb-6 scroll-animate">
              Tarifs
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 scroll-animate stagger-1">
              Aucun abonnement.
            </h2>
            <p className="text-lg text-muted-foreground scroll-animate stagger-2">
              Vous payez seulement quand vous encaissez.
            </p>
          </div>

          <div className="max-w-lg mx-auto scroll-animate-scale scroll-animate">
            <Card className="border-2 border-primary overflow-hidden">
              <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
                Populaire
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold mb-2">Plan Unique</h3>
                  <p className="text-muted-foreground text-sm mb-6">Parfait pour les indépendants et créateurs</p>
                </div>
                <div className="space-y-4 mb-8">
                  {[
                    "Liens de paiement illimités",
                    "Mobile Money accepté",
                    "Retraits sous 1h à 24h",
                    "Zéro frais d'inscription",
                    "Support client disponible",
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/auth?tab=register">
                  <Button 
                    className="w-full gap-2 font-semibold text-base py-6 rounded-xl bg-foreground text-background hover:bg-foreground/90" 
                    size="lg" 
                    data-testid="button-pricing-register"
                  >
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
      <section id="faq" className="py-20 lg:py-28 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-background text-sm font-medium mb-6 scroll-animate">
              FAQ
            </div>
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
                className="gap-2 font-semibold shadow-lg text-base px-8 py-6 rounded-xl" 
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
                className="bg-white/10 border-white/40 text-white font-medium backdrop-blur-sm text-base px-8 py-6 rounded-xl" 
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
