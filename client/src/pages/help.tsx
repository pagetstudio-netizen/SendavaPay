import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  HelpCircle, 
  MessageCircle, 
  Phone, 
  Mail, 
  ChevronDown,
  Shield,
  CreditCard,
  Send,
  Download,
  Link2,
  AlertCircle,
  Clock
} from "lucide-react";
import { SiFacebook, SiInstagram, SiWhatsapp, SiTelegram, SiTiktok, SiYoutube, SiX } from "react-icons/si";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SocialLink {
  id: number;
  platform: string;
  url: string;
  isActive: boolean;
}

const faqCategories = [
  {
    title: "Compte et Inscription",
    icon: Shield,
    questions: [
      {
        question: "Comment créer un compte SendavaPay ?",
        answer: "Pour créer un compte, cliquez sur 'S'inscrire' sur la page d'accueil. Remplissez le formulaire avec votre nom, email, numéro de téléphone et créez un mot de passe sécurisé. Vous recevrez un email de confirmation."
      },
      {
        question: "Qu'est-ce que la vérification KYC ?",
        answer: "La vérification KYC (Know Your Customer) est une procédure de sécurité qui nous permet de vérifier votre identité. Vous devrez fournir une pièce d'identité valide (carte d'identité, passeport) et un selfie. Cette vérification est nécessaire pour effectuer des retraits."
      },
      {
        question: "J'ai oublié mon mot de passe, que faire ?",
        answer: "Sur la page de connexion, cliquez sur 'Mot de passe oublié'. Entrez votre email et vous recevrez un lien pour réinitialiser votre mot de passe."
      },
      {
        question: "Comment modifier mes informations personnelles ?",
        answer: "Connectez-vous à votre tableau de bord, puis allez dans 'Paramètres'. Vous pouvez y modifier vos informations personnelles, votre numéro de téléphone et votre mot de passe."
      }
    ]
  },
  {
    title: "Dépôts et Recharges",
    icon: CreditCard,
    questions: [
      {
        question: "Comment effectuer un dépôt ?",
        answer: "Depuis votre tableau de bord, cliquez sur 'Dépôt'. Choisissez votre opérateur Mobile Money (MTN, Moov, Orange, TMoney, Wave), entrez le montant et suivez les instructions. Vous recevrez un code USSD à composer sur votre téléphone."
      },
      {
        question: "Quels sont les frais de dépôt ?",
        answer: "Une commission de 7% est appliquée sur chaque dépôt. Par exemple, pour un dépôt de 10 000 FCFA, les frais seront de 700 FCFA."
      },
      {
        question: "Combien de temps prend un dépôt ?",
        answer: "Les dépôts sont généralement instantanés. Dès que vous validez la transaction sur votre Mobile Money, le montant est crédité sur votre compte SendavaPay."
      },
      {
        question: "Quel est le montant minimum/maximum de dépôt ?",
        answer: "Le montant minimum de dépôt est de 100 FCFA. Le montant maximum dépend des limites de votre opérateur Mobile Money."
      }
    ]
  },
  {
    title: "Retraits",
    icon: Download,
    questions: [
      {
        question: "Comment effectuer un retrait ?",
        answer: "Depuis votre tableau de bord, cliquez sur 'Retrait'. Choisissez votre opérateur Mobile Money, entrez le montant et votre numéro de téléphone. Une fois approuvé, vous recevrez l'argent sur votre compte Mobile Money."
      },
      {
        question: "Quels sont les frais de retrait ?",
        answer: "Une commission de 7% est appliquée sur chaque retrait. Par exemple, pour un retrait de 10 000 FCFA, les frais seront de 700 FCFA."
      },
      {
        question: "Combien de temps prend un retrait ?",
        answer: "Les retraits sont traités dans un délai de 24 heures maximum. La plupart des retraits sont effectués dans l'heure."
      },
      {
        question: "Pourquoi mon retrait est-il en attente ?",
        answer: "Les retraits nécessitent une vérification manuelle pour des raisons de sécurité. Assurez-vous que votre compte est vérifié (KYC) pour accélérer le processus."
      }
    ]
  },
  {
    title: "Transferts",
    icon: Send,
    questions: [
      {
        question: "Comment transférer de l'argent à un autre utilisateur ?",
        answer: "Depuis votre tableau de bord, cliquez sur 'Transfert'. Entrez l'email ou le numéro de téléphone du destinataire, le montant et une description optionnelle. Le transfert est instantané."
      },
      {
        question: "Y a-t-il des frais pour les transferts internes ?",
        answer: "Non, les transferts entre utilisateurs SendavaPay sont gratuits et instantanés."
      },
      {
        question: "Puis-je annuler un transfert ?",
        answer: "Non, les transferts sont instantanés et irréversibles. Vérifiez bien les informations du destinataire avant de confirmer."
      }
    ]
  },
  {
    title: "Liens de Paiement",
    icon: Link2,
    questions: [
      {
        question: "Qu'est-ce qu'un lien de paiement ?",
        answer: "Un lien de paiement est une URL unique que vous pouvez partager avec vos clients pour recevoir des paiements. Idéal pour les vendeurs en ligne et les prestataires de services."
      },
      {
        question: "Comment créer un lien de paiement ?",
        answer: "Depuis votre tableau de bord, allez dans 'Liens de paiement' et cliquez sur 'Créer un lien'. Remplissez le titre, la description, le montant et ajoutez une image si vous le souhaitez."
      },
      {
        question: "Puis-je créer un lien avec un montant personnalisable ?",
        answer: "Oui, lors de la création du lien, cochez l'option 'Montant personnalisé'. Vos clients pourront ainsi entrer le montant de leur choix."
      },
      {
        question: "Combien de personnes peuvent payer via un lien ?",
        answer: "Un lien de paiement peut être utilisé par un nombre illimité de personnes. Chaque paiement est une transaction séparée."
      }
    ]
  },
  {
    title: "Sécurité",
    icon: Shield,
    questions: [
      {
        question: "Mon argent est-il en sécurité ?",
        answer: "Oui, SendavaPay utilise les dernières technologies de sécurité : cryptage SSL, vérification KYC, et surveillance des transactions suspectes."
      },
      {
        question: "Que faire si je détecte une activité suspecte ?",
        answer: "Contactez immédiatement notre service client au +228 92 29 97 72 ou par email à support@sendavapay.com. Nous bloquerons votre compte le temps de l'investigation."
      },
      {
        question: "Comment protéger mon compte ?",
        answer: "Utilisez un mot de passe fort et unique, ne partagez jamais vos identifiants, et déconnectez-vous après chaque session sur un appareil partagé."
      }
    ]
  }
];

const SocialIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case 'facebook': return <SiFacebook className="h-5 w-5" />;
    case 'instagram': return <SiInstagram className="h-5 w-5" />;
    case 'whatsapp': return <SiWhatsapp className="h-5 w-5" />;
    case 'telegram': return <SiTelegram className="h-5 w-5" />;
    case 'youtube': return <SiYoutube className="h-5 w-5" />;
    case 'tiktok': return <SiTiktok className="h-5 w-5" />;
    case 'twitter': return <SiX className="h-5 w-5" />;
    default: return null;
  }
};

const platformNames: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  twitter: 'Twitter/X'
};

export default function HelpPage() {
  const { data: socialLinks = [] } = useQuery<SocialLink[]>({
    queryKey: ['/api/social-links'],
  });

  const activeLinks = socialLinks.filter(link => link.isActive && link.url);
  const telegramLink = activeLinks.find(link => link.platform === 'telegram');

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
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Centre d'aide</h1>
          <p className="text-muted-foreground">
            Trouvez rapidement des réponses à vos questions
          </p>
        </div>

        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Besoin d'aide immédiate ?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Notre équipe de support est disponible pour vous aider du lundi au samedi, de 8h à 20h.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 p-4 bg-background rounded-md">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Appelez-nous</p>
                  <p className="font-semibold">+228 92 29 97 72</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-background rounded-md">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Écrivez-nous</p>
                  <p className="font-semibold">support@sendavapay.com</p>
                </div>
              </div>
            </div>

            {telegramLink && (
              <a 
                href={telegramLink.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full" size="lg" data-testid="button-join-telegram">
                  <SiTelegram className="h-5 w-5 mr-2" />
                  Rejoindre notre canal Telegram officiel
                </Button>
              </a>
            )}

            {activeLinks.length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-3">Suivez-nous sur les réseaux sociaux :</p>
                <div className="flex flex-wrap gap-2">
                  {activeLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" data-testid={`button-social-${link.platform}`}>
                        <SocialIcon platform={link.platform} />
                        <span className="ml-2">{platformNames[link.platform]}</span>
                      </Button>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-primary" />
            Questions fréquentes
          </h2>

          <div className="space-y-6">
            {faqCategories.map((category, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <category.icon className="h-5 w-5 text-primary" />
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((faq, faqIndex) => (
                      <AccordionItem key={faqIndex} value={`item-${index}-${faqIndex}`}>
                        <AccordionTrigger className="text-left" data-testid={`faq-question-${index}-${faqIndex}`}>
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Horaires du service client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-md">
                <p className="font-semibold">Lundi - Vendredi</p>
                <p className="text-muted-foreground">8h00 - 20h00</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-md">
                <p className="font-semibold">Samedi</p>
                <p className="text-muted-foreground">9h00 - 18h00</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              En dehors de ces horaires, vous pouvez nous envoyer un email et nous vous répondrons dès que possible.
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-center gap-4 flex-wrap">
          <Link href="/terms">
            <Button variant="outline" data-testid="button-view-terms">
              Conditions d'utilisation
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="outline" data-testid="button-view-about">
              À propos
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
