import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Target, Eye, Heart, Users, Globe, Zap, Shield, TrendingUp, Handshake } from "lucide-react";

const countries = [
  {
    name: "Togo",
    flag: "TG",
    payments: ["Moov Money", "TMoney"]
  },
  {
    name: "Côte d'Ivoire",
    flag: "CI",
    payments: ["Wave", "MTN", "Orange Money", "Moov Money"]
  },
  {
    name: "Bénin",
    flag: "BJ",
    payments: ["Celtis", "Moov Money", "MTN"]
  },
  {
    name: "Mali",
    flag: "ML",
    payments: ["Orange Money", "Moov Money"]
  },
  {
    name: "Burkina Faso",
    flag: "BF",
    payments: ["Moov Money"]
  },
  {
    name: "Sénégal",
    flag: "SN",
    payments: ["Moov Money", "Orange Money", "Wave"]
  }
];

const flagEmojis: Record<string, string> = {
  TG: "🇹🇬",
  CI: "🇨🇮",
  BJ: "🇧🇯",
  ML: "🇲🇱",
  BF: "🇧🇫",
  SN: "🇸🇳"
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back-home">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-xl">SendavaPay</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-page-title">À propos de SendavaPay</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            La solution de paiement innovante conçue pour l'Afrique de l'Ouest
          </p>
        </div>

        <div className="space-y-8">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Eye className="h-6 w-6 text-primary-foreground" />
                </div>
                Notre Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed">
                Devenir la plateforme de paiement de référence en Afrique de l'Ouest, 
                où chaque individu et chaque entreprise peut effectuer des transactions 
                financières en toute simplicité, sécurité et transparence.
              </p>
              <p className="text-lg leading-relaxed mt-4 text-muted-foreground">
                Nous imaginons un avenir où les barrières financières n'existent plus, 
                où l'accès aux services de paiement modernes est un droit pour tous, 
                et où la technologie rapproche les communautés plutôt que de les diviser.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary-foreground" />
                </div>
                Notre Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed mb-6">
                Faciliter les transactions financières pour les particuliers et les entreprises 
                en Afrique de l'Ouest grâce à une plateforme intuitive, sécurisée et accessible.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-background rounded-md">
                  <Globe className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Accessibilité</h4>
                    <p className="text-sm text-muted-foreground">
                      Rendre les services financiers accessibles à tous, même dans les zones les plus reculées
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-background rounded-md">
                  <Zap className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Rapidité</h4>
                    <p className="text-sm text-muted-foreground">
                      Offrir des transactions instantanées pour répondre aux besoins du quotidien
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-background rounded-md">
                  <Shield className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Sécurité</h4>
                    <p className="text-sm text-muted-foreground">
                      Garantir la protection maximale des fonds et des données personnelles
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-background rounded-md">
                  <TrendingUp className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Croissance</h4>
                    <p className="text-sm text-muted-foreground">
                      Accompagner les entrepreneurs dans leur développement économique
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Heart className="h-6 w-6 text-primary-foreground" />
                </div>
                Nos Valeurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="flex items-start gap-4 p-4 bg-background rounded-md">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Intégrité</h4>
                    <p className="text-muted-foreground">
                      Nous agissons avec honnêteté et transparence dans toutes nos interactions. 
                      La confiance de nos utilisateurs est notre priorité absolue, et nous nous 
                      engageons à maintenir les plus hauts standards éthiques.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-background rounded-md">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Inclusion</h4>
                    <p className="text-muted-foreground">
                      Nous croyons que chaque personne mérite un accès égal aux services financiers. 
                      Notre plateforme est conçue pour être accessible à tous, indépendamment de 
                      leur niveau d'éducation ou de leur situation géographique.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-background rounded-md">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Innovation</h4>
                    <p className="text-muted-foreground">
                      Nous repoussons constamment les limites de la technologie pour offrir 
                      des solutions toujours plus performantes et adaptées aux besoins 
                      spécifiques des marchés africains.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-background rounded-md">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Handshake className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Engagement communautaire</h4>
                    <p className="text-muted-foreground">
                      Nous sommes profondément enracinés dans les communautés que nous servons. 
                      Notre succès est directement lié au développement économique et social 
                      de l'Afrique de l'Ouest.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-background rounded-md">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Excellence du service</h4>
                    <p className="text-muted-foreground">
                      Nous nous efforçons d'offrir une expérience utilisateur exceptionnelle 
                      à chaque interaction. Notre équipe de support est disponible pour 
                      accompagner nos utilisateurs dans leur parcours financier.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Présence en Afrique de l'Ouest</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground mb-6">
                SendavaPay est disponible dans 6 pays avec différents moyens de paiement Mobile Money
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {countries.map((country) => (
                  <div key={country.flag} className="p-4 bg-muted/50 rounded-md" data-testid={`country-${country.flag}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{flagEmojis[country.flag]}</span>
                      <p className="font-semibold">{country.name}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {country.payments.map((payment) => (
                        <span 
                          key={payment} 
                          className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                        >
                          {payment}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Contactez-nous</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <p className="text-muted-foreground">
                Support client : <span className="font-medium text-foreground">+228 92 29 97 72</span>
              </p>
              <p className="text-muted-foreground">
                Email : <span className="font-medium text-foreground">contact@sendavapay.com</span>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex justify-center gap-4 flex-wrap">
          <Link href="/terms">
            <Button variant="outline" data-testid="button-view-terms">
              Conditions d'utilisation
            </Button>
          </Link>
          <Link href="/help">
            <Button variant="outline" data-testid="button-view-help">
              Centre d'aide
            </Button>
          </Link>
          <Link href="/">
            <Button data-testid="button-return-home">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
