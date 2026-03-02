import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Shield,
  Globe,
  Smartphone,
  Link2,
  Zap,
  CheckCircle,
  ChevronDown,
  Headphones,
  MessageSquare,
  Star,
  ThumbsUp,
  Phone,
  CheckCircle2,
  ShoppingBag,
  Megaphone,
  MousePointer,
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
import heroCashpay from "@assets/Cashpay-Web-2_1772436554124.png";
import imgLiensPaiement from "@assets/IMG-20260224-WA0011_1772177956027.jpg";
import imgBesoinAide from "@assets/sendavapay4_1772177760975.jpg";
import imgApiPaiement from "@assets/IMG_20260227_073944_233_1772177997425.jpg";
import imgStatistiques from "@assets/Screenshot_20260227-073700_1772177874148.png";
import illuPayments from "@assets/PW20_case-alternative_1772182143704.png";
import illuLocal from "@assets/PW20_case-local_1772182143541.png";
import illuCard from "@assets/PW20_case-cc_1772182143744.png";
import illuReport from "@assets/PW20_case-reporting_1772182143681.png";
import illuSupport from "@assets/PW20_case-customer_1772182143821.png";
import stepIconLien from "@assets/20260302_080514_1772438852269.png";
import stepIconPartage from "@assets/20260302_080335_1772438852071.png";
import stepIconEncaisse from "@assets/20260302_080214_1772438852298.png";

const COUNTRY_FLAGS: Record<string, string> = {
  BJ: "🇧🇯", BF: "🇧🇫", CM: "🇨🇲", COG: "🇨🇬", CI: "🇨🇮",
  ML: "🇲🇱", COD: "🇨🇩", SN: "🇸🇳", TG: "🇹🇬",
};

const OPERATOR_LOGOS: Record<string, string> = {
  "mtn.png": mtnLogo,
  "moov.png": moovLogo,
  "wave.png": waveLogo,
  "wizall.png": wizallLogo,
  "orange.png": orangeLogo,
  "tmoney.png": tmoneyLogo,
  "airtel.png": airtelLogo,
  "vodacom.png": vodacomLogo,
};

function getOperatorLogo(logo: string | null): string | null {
  if (!logo) return null;
  return OPERATOR_LOGOS[logo] || null;
}

interface PublicFeesData {
  countries: {
    id: number;
    code: string;
    name: string;
    currency: string;
    depositFee: number;
    withdrawFee: number;
    encaissementFee: number;
    operators: { id: number; name: string; logo: string | null; inMaintenance: boolean }[];
  }[];
  global: { depositFee: number; withdrawFee: number; encaissementFee: number };
}

function FeesSection() {
  const [selectedCountry, setSelectedCountry] = useState(0);

  const { data, isLoading } = useQuery<PublicFeesData>({
    queryKey: ["/api/public/fees"],
    queryFn: async () => {
      const res = await fetch("/api/public/fees");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const countries = data?.countries || [];
  const current = countries[selectedCountry];

  return (
    <section id="pricing" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-background text-sm font-medium mb-6 scroll-animate">
            Tarifs
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 scroll-animate stagger-1">
            Frais par opérateur
          </h2>
          <p className="text-lg text-muted-foreground scroll-animate stagger-2">
            Aucun abonnement. Vous payez seulement quand vous encaissez.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Country Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-10 scroll-animate">
              {countries.map((country, idx) => (
                <button
                  key={country.id}
                  data-testid={`tab-country-${country.code}`}
                  onClick={() => setSelectedCountry(idx)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    selectedCountry === idx
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-background border-border hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  <span className="text-lg leading-none">{COUNTRY_FLAGS[country.code] || "🌍"}</span>
                  <span>{country.name}</span>
                </button>
              ))}
            </div>

            {/* Country Fee Cards */}
            {current && (
              <div className="scroll-animate">
                {/* Fee summary row */}
                <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                  {[
                    { label: "Dépôt", value: current.depositFee, color: "text-blue-600 dark:text-blue-400" },
                    { label: "Retrait", value: current.withdrawFee, color: "text-orange-600 dark:text-orange-400" },
                    { label: "Encaissement", value: current.encaissementFee, color: "text-green-600 dark:text-green-400" },
                  ].map((item) => (
                    <div key={item.label} className="bg-background border border-border rounded-2xl p-4 text-center shadow-sm">
                      <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                      <p className={`text-2xl font-bold ${item.color}`}>{item.value}%</p>
                      <p className="text-xs text-muted-foreground mt-1">{current.currency}</p>
                    </div>
                  ))}
                </div>

                {/* Operators grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
                  {current.operators.map((op) => {
                    const logo = getOperatorLogo(op.logo);
                    return (
                      <div
                        key={op.id}
                        data-testid={`card-operator-${op.id}`}
                        className={`bg-background border rounded-2xl p-4 flex flex-col items-center gap-3 shadow-sm transition-all hover:shadow-md ${
                          op.inMaintenance ? "opacity-50 grayscale" : "border-border"
                        }`}
                      >
                        {logo ? (
                          <img src={logo} alt={op.name} className="h-10 w-auto object-contain" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {op.name.charAt(0)}
                          </div>
                        )}
                        <p className="text-xs font-semibold text-center leading-tight">{op.name}</p>
                        {op.inMaintenance && (
                          <span className="text-xs text-orange-500 font-medium">Maintenance</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* CTA */}
                <div className="flex justify-center mt-10">
                  <Link href="/auth?tab=register">
                    <Button
                      className="gap-2 font-semibold text-base py-6 px-8 rounded-xl bg-foreground text-background hover:bg-foreground/90"
                      size="lg"
                      data-testid="button-pricing-register"
                    >
                      Créer un compte gratuit
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default function HomePage() {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [currentPlatform, setCurrentPlatform] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
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
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    const elements = document.querySelectorAll(".scroll-animate, .slide-left, .slide-right, .zoom-in, .reveal-card");
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  const features = [
    {
      image: illuPayments,
      title: "Moyens de Paiement",
      description: "MTN, Moov, Orange, TMoney, Wave",
    },
    {
      image: illuLocal,
      title: "Tous Produits",
      description: "Vendez n'importe quel produit ou service",
    },
    {
      image: illuCard,
      title: "Partagez vos liens",
      description: "WhatsApp, Instagram, Facebook...",
    },
    {
      image: illuReport,
      title: "User Friendly",
      description: "Interface simple et intuitive",
    },
    {
      image: illuSupport,
      title: "Support Réactif",
      description: "Assistance disponible 7j/7",
    },
    {
      image: illuLocal,
      title: "Conformité KYC",
      description: "Vérification sécurisée",
    },
  ];

  const steps = [
    {
      step: "Etape 1",
      title: "Créez votre lien de paiement",
      description: "Définissez un montant en quelques secondes.",
      img: stepIconLien,
    },
    {
      step: "Etape 2",
      title: "Partagez votre lien",
      description: "Envoyez-le à vos clients sur WhatsApp, Instagram ou par SMS.",
      img: stepIconPartage,
    },
    {
      step: "Etape 3",
      title: "Recevez votre argent",
      description: "Vos clients paient par Mobile Money. Retirez vos fonds quand vous voulez.",
      img: stepIconEncaisse,
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
      answer: "Les retraits sont crédités instantanément sur votre Mobile Money.",
    },
    {
      question: "SendavaPay est-il disponible dans mon pays ?",
      answer: "SendavaPay est disponible au Bénin, Burkina Faso, Togo, Cameroun, Côte d'Ivoire, RDC et Congo Brazzaville.",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <style>{`
        /* === SCROLL ANIMATE: slide up === */
        .scroll-animate {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 1.0s cubic-bezier(0.34, 1.4, 0.64, 1),
                      transform 1.0s cubic-bezier(0.34, 1.4, 0.64, 1);
        }
        .scroll-animate.animate-in {
          opacity: 1;
          transform: translateY(0);
        }

        /* === SLIDE FROM LEFT === */
        .slide-left {
          opacity: 0;
          transform: translateX(-40px);
          transition: opacity 1.1s cubic-bezier(0.34, 1.4, 0.64, 1),
                      transform 1.1s cubic-bezier(0.34, 1.4, 0.64, 1);
        }
        .slide-left.animate-in {
          opacity: 1;
          transform: translateX(0);
        }

        /* === SLIDE FROM RIGHT === */
        .slide-right {
          opacity: 0;
          transform: translateX(40px);
          transition: opacity 1.1s cubic-bezier(0.34, 1.4, 0.64, 1),
                      transform 1.1s cubic-bezier(0.34, 1.4, 0.64, 1);
        }
        .slide-right.animate-in {
          opacity: 1;
          transform: translateX(0);
        }

        /* === ZOOM IN (for cards) === */
        .zoom-in {
          opacity: 0;
          transform: scale(0.92) translateY(24px);
          transition: opacity 1.0s cubic-bezier(0.34, 1.4, 0.64, 1),
                      transform 1.0s cubic-bezier(0.34, 1.4, 0.64, 1);
        }
        .zoom-in.animate-in {
          opacity: 1;
          transform: scale(1) translateY(0);
        }

        /* === REVEAL CARD (for promo cards) === */
        .reveal-card {
          opacity: 0;
          transform: translateY(40px) scale(0.97);
          transition: opacity 1.2s cubic-bezier(0.34, 1.4, 0.64, 1),
                      transform 1.2s cubic-bezier(0.34, 1.4, 0.64, 1);
        }
        .reveal-card.animate-in {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        /* === SCALE (for feature cards) === */
        .scroll-animate-scale {
          opacity: 0;
          transform: scale(0.92) translateY(18px);
          transition: opacity 1.0s cubic-bezier(0.34, 1.4, 0.64, 1),
                      transform 1.0s cubic-bezier(0.34, 1.4, 0.64, 1);
        }
        .scroll-animate-scale.animate-in {
          opacity: 1;
          transform: scale(1) translateY(0);
        }

        /* === STAGGER DELAYS === */
        .stagger-1 { transition-delay: 0.12s; }
        .stagger-2 { transition-delay: 0.24s; }
        .stagger-3 { transition-delay: 0.36s; }
        .stagger-4 { transition-delay: 0.48s; }
        .stagger-5 { transition-delay: 0.60s; }
        .stagger-6 { transition-delay: 0.72s; }

        /* === PLATFORM TEXT === */
        .platform-text {
          animation: fadeInUp 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* === HERO GRADIENT === */
        .hero-gradient {
          background: linear-gradient(135deg, #5b7cf7 0%, #3a4dd4 60%, #2d3db8 100%);
        }

        /* === CAROUSEL SCROLLBAR HIDE === */
        .carousel-scroll::-webkit-scrollbar { display: none; }

        /* === MARQUEE === */
        .logo-marquee {
          display: flex;
          animation: marquee 20s linear infinite;
        }
        .logo-marquee:hover {
          animation-play-state: paused;
        }
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden hero-gradient">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-14 pb-0 text-center">

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4 scroll-animate">
            Unifiez vos paiements avec
          </h1>

          {/* SendavaPay orange highlight */}
          <div className="inline-block bg-amber-400 px-5 py-2 rounded-lg mb-6 scroll-animate stagger-1">
            <span className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white">
              SendavaPay
            </span>
          </div>

          {/* Subtitle */}
          <p className="text-white/90 text-base md:text-lg font-medium max-w-xl mx-auto mb-8 scroll-animate stagger-2">
            Alimentez votre expansion à travers un réseau de millions d'utilisateurs actifs.
            Grâce à SendavaPay, vos paiements circulent plus vite, plus loin, et plus intelligemment.
          </p>

          {/* CTA */}
          <div className="flex justify-center mb-10 scroll-animate stagger-3">
            <Link href="/auth?tab=register">
              <Button
                size="lg"
                className="gap-2 font-semibold px-8 py-4 rounded-xl bg-white text-blue-700 hover:bg-white/90 shadow-lg"
                data-testid="button-hero-register"
              >
                Commencer gratuitement
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Hero image flush at bottom */}
          <div className="scroll-animate stagger-4">
            <img
              src={heroCashpay}
              alt="SendavaPay dashboard"
              className="w-full max-w-lg mx-auto object-contain"
            />
          </div>
        </div>

        {/* Mobile money logos strip */}
        <div className="bg-white dark:bg-background py-4">
          <p className="text-center text-xs text-muted-foreground mb-3">Moyens de paiement acceptés</p>
          <div className="overflow-hidden max-w-3xl mx-auto">
            <div className="logo-marquee gap-8">
              {[mtnLogo, moovLogo, orangeLogo, tmoneyLogo, airtelLogo, vodacomLogo, mtnLogo, moovLogo, orangeLogo, tmoneyLogo, airtelLogo, vodacomLogo].map((logo, index) => (
                <div key={index} className="flex-shrink-0">
                  <img src={logo} alt="Mobile Money" className="h-14 w-14 object-contain rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Hero Image 1 - Tailors/Entrepreneurs */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 slide-left space-y-6 text-center md:text-left">
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                Pour les entrepreneurs
              </span>
              <h2 className="text-4xl md:text-5xl font-black leading-tight" style={{fontFamily: "'Playfair Display', serif"}}>
                Transformez votre passion en revenus
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Artisans, créateurs, couturiers — acceptez les paiements de vos clients en toute simplicité. Partagez votre lien et recevez l'argent directement sur Mobile Money.
              </p>
              <div className="flex justify-center md:justify-start">
                <Link href="/auth?tab=register">
                  <Button className="gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-xl text-base">
                    Commencer maintenant
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="order-1 md:order-2 flex justify-center slide-right">
              <img 
                src={heroImage1} 
                alt="Entrepreneur africaine" 
                className="max-w-sm w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Sections promotionnelles */}
      <section className="bg-gray-100 dark:bg-muted/50 py-6">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Statistiques */}
          <div className="bg-white dark:bg-card rounded-2xl overflow-hidden reveal-card">
            <div className="p-6">
              <h2 className="text-4xl font-black mb-3 leading-tight" style={{fontFamily: "'Playfair Display', serif"}}>
                Statistiques
              </h2>
              <p className="text-base text-muted-foreground mb-4">
                Suivez vos transactions en temps réel et obtenez des rapports détaillés pour une meilleure prise de décision.
              </p>
              <div className="rounded-xl overflow-hidden mb-4 border border-border/30">
                <img src={imgStatistiques} alt="Tableau de bord statistiques SendavaPay" className="w-full object-cover" />
              </div>
              <Link href="/statistiques">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold text-base py-3 rounded-xl">
                  En savoir plus
                </Button>
              </Link>
            </div>
          </div>

          {/* Liens de Paiement */}
          <div className="bg-white dark:bg-card rounded-2xl overflow-hidden reveal-card stagger-1">
            <div className="p-6">
              <h2 className="text-4xl font-black mb-3 leading-tight" style={{fontFamily: "'Playfair Display', serif"}}>
                Liens de Paiement
              </h2>
              <p className="text-base text-muted-foreground mb-4">
                Générez un lien, partagez-le, et encaissez vos paiements directement. Simple, rapide et 100 % sécurisé, même sans site web.
              </p>
              <div className="rounded-xl overflow-hidden mb-4">
                <img src={imgLiensPaiement} alt="Liens de paiement SendavaPay" className="w-full object-cover" />
              </div>
              <Link href="/liens-de-paiement">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold text-base py-3 rounded-xl">
                  En savoir plus
                </Button>
              </Link>
            </div>
          </div>

          {/* Besoin d'aide */}
          <div className="bg-white dark:bg-card rounded-2xl overflow-hidden reveal-card stagger-2">
            <div className="p-6">
              <h2 className="text-4xl font-black mb-3 leading-tight" style={{fontFamily: "'Playfair Display', serif"}}>
                Besoin d'aide ?
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Notre équipe d'assistance est à votre écoute à tout moment pour répondre à vos questions, vous aider dans vos paiements et résoudre vos problèmes en un instant. Contactez-nous en ligne, à tout moment, où que vous soyez.
              </p>
              <div className="rounded-xl overflow-hidden mb-4">
                <img src={imgBesoinAide} alt="Assistance SendavaPay" className="w-full object-cover" />
              </div>
              <Link href="/assistance">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold text-base py-3 rounded-xl">
                  En savoir plus
                </Button>
              </Link>
            </div>
          </div>

          {/* API de Paiement */}
          <div className="bg-white dark:bg-card rounded-2xl overflow-hidden reveal-card stagger-3">
            <div className="p-6">
              <h2 className="text-4xl font-black mb-3 leading-tight" style={{fontFamily: "'Playfair Display', serif"}}>
                API de Paiement
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Notre API et SDK simplifient la gestion des transactions. Acceptez les paiements, vérifiez les statuts et automatisez vos retraits depuis une seule intégration.
              </p>
              <div className="rounded-xl overflow-hidden mb-4">
                <img src={imgApiPaiement} alt="API de paiement SendavaPay" className="w-full object-cover" />
              </div>
              <Link href="/api-de-paiement">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold text-base py-3 rounded-xl">
                  En savoir plus
                </Button>
              </Link>
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
                    <img src={item.img} alt={item.title} className="h-12 w-12 object-contain" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center mt-12 scroll-animate">
            <Link href="/auth?tab=register">
              <Button 
                size="sm"
                className="gap-2 font-medium px-5 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90" 
                data-testid="button-steps-register"
              >
                Créer un lien de paiement maintenant
                <ArrowRight className="h-4 w-4" />
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

          {/* Carousel */}
          <div className="relative">
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto pb-4 scroll-smooth carousel-scroll"
              style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none", msOverflowStyle: "none" }}
              onScroll={(e) => {
                const el = e.currentTarget;
                const cardWidth = el.scrollWidth / features.length;
                setActiveFeature(Math.round(el.scrollLeft / cardWidth));
              }}
            >
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-blue-50 dark:bg-blue-950/20 rounded-2xl p-6 flex-none hover-elevate transition-all"
                  style={{ scrollSnapAlign: "start", width: "calc(75% - 8px)", minWidth: "260px", maxWidth: "320px" }}
                >
                  <img src={feature.image} alt="" className="w-20 h-20 object-contain mb-5" />
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              ))}
              {/* trailing spacer */}
              <div className="flex-none w-4" />
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-4">
              {features.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (!carouselRef.current) return;
                    const cardWidth = carouselRef.current.scrollWidth / features.length;
                    carouselRef.current.scrollTo({ left: cardWidth * i, behavior: "smooth" });
                    setActiveFeature(i);
                  }}
                  className={`rounded-full transition-all duration-300 ${
                    i === activeFeature
                      ? "bg-primary w-5 h-2"
                      : "bg-muted-foreground/30 w-2 h-2"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Fees by Country Section */}
      <FeesSection />

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

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`bg-background border border-border rounded-2xl overflow-hidden scroll-animate stagger-${Math.min(index + 1, 4)}`}
              >
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-semibold text-base">{faq.question}</span>
                  <span className={`flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center transition-transform duration-300 ${openFaq === index ? "rotate-45" : ""}`}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: openFaq === index ? "200px" : "0px" }}
                >
                  <p className="px-6 pb-5 text-muted-foreground text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
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
