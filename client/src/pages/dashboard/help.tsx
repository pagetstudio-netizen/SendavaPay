import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  LifeBuoy, 
  MessageCircle, 
  Link2,
  CreditCard,
  RefreshCw,
  Headphones
} from "lucide-react";
import { SiWhatsapp, SiTelegram, SiFacebook, SiYoutube } from "react-icons/si";

const contactChannels = [
  {
    id: "whatsapp",
    title: "WhatsApp",
    description: "Discuter avec un agent SendavaPay",
    url: "https://wa.me/22892299772",
    icon: SiWhatsapp,
    bgColor: "bg-green-500 dark:bg-green-600",
    textColor: "text-white",
  },
  {
    id: "telegram",
    title: "Chaîne Telegram",
    description: "Rejoindre notre communauté Telegram",
    url: "https://t.me/sendavapay",
    icon: SiTelegram,
    bgColor: "bg-blue-500 dark:bg-blue-600",
    textColor: "text-white",
  },
  {
    id: "whatsapp-channel",
    title: "WhatsApp Channel",
    description: "Recevoir les notifications et infos SendavaPay",
    url: "https://whatsapp.com/channel/0029Vb64HLEIyPtOIDeXDE1C",
    icon: SiWhatsapp,
    bgColor: "bg-green-600 dark:bg-green-700",
    textColor: "text-white",
  },
  {
    id: "facebook",
    title: "Facebook",
    description: "Suivez-nous sur Facebook",
    url: "https://www.facebook.com/profile.php?id=61585147104734",
    icon: SiFacebook,
    bgColor: "bg-blue-600 dark:bg-blue-700",
    textColor: "text-white",
  },
  {
    id: "youtube",
    title: "YouTube",
    description: "Abonnez-vous à notre chaîne YouTube",
    url: "https://youtube.com/@sendavapay?si=WsRg7LidP3nf01Kr",
    icon: SiYoutube,
    bgColor: "bg-red-600 dark:bg-red-700",
    textColor: "text-white",
  },
];

const faqItems = [
  {
    id: "create-payment-link",
    question: "Comment créer un lien de paiement ?",
    answer: "Pour créer un lien de paiement, allez dans la section 'Liens de paiement' depuis votre tableau de bord. Cliquez sur 'Créer un lien', remplissez le titre, la description et le montant souhaité. Vous pouvez également ajouter une image et activer l'option 'Montant personnalisé' pour permettre à vos clients de choisir le montant. Une fois créé, partagez le lien avec vos clients par email, SMS ou réseaux sociaux.",
    icon: Link2,
  },
  {
    id: "deposit-withdrawal",
    question: "Comment effectuer un dépôt ou retrait ?",
    answer: "Pour effectuer un dépôt, rendez-vous dans la section 'Dépôt' et choisissez votre opérateur Mobile Money (MTN, Moov, Orange, TMoney, Wave). Entrez le montant et suivez les instructions pour valider via USSD. Pour un retrait, allez dans 'Retrait', sélectionnez votre pays et opérateur, entrez le montant et votre numéro de téléphone. Les retraits sont traités sous 1h à 24h.",
    icon: CreditCard,
  },
  {
    id: "update-account",
    question: "Comment mettre à jour mon compte ?",
    answer: "Pour mettre à jour vos informations personnelles, accédez à la section 'Paramètres' depuis le menu. Vous pouvez y modifier votre nom, numéro de téléphone et mot de passe. Pour compléter votre vérification KYC (obligatoire pour les retraits), rendez-vous dans 'Vérification KYC' et soumettez une pièce d'identité valide avec un selfie.",
    icon: RefreshCw,
  },
  {
    id: "technical-support",
    question: "Qui contacter en cas de problème technique ?",
    answer: "En cas de problème technique, vous pouvez nous contacter via WhatsApp au +228 92 29 97 72 pour une assistance rapide. Vous pouvez également rejoindre notre chaîne Telegram @sendavapay pour les mises à jour et l'assistance communautaire. Notre équipe est disponible du lundi au samedi, de 8h à 20h. Pour les urgences en dehors des heures de service, envoyez un email à support@sendavapay.com.",
    icon: Headphones,
  },
];

export default function DashboardHelpPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <LifeBuoy className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-help-title">
            Besoin d'aide ?
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto" data-testid="text-help-description">
            Si vous avez un problème, une question ou besoin d'assistance, contactez-nous via nos canaux officiels. Nous sommes là pour vous aider rapidement.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Nos canaux de contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contactChannels.map((channel) => (
                <a
                  key={channel.id}
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  data-testid={`link-contact-${channel.id}`}
                >
                  <Button
                    className={`w-full h-auto py-4 flex flex-col items-center gap-2 ${channel.bgColor} ${channel.textColor}`}
                    data-testid={`button-contact-${channel.id}`}
                  >
                    <channel.icon className="h-6 w-6" />
                    <span className="font-semibold">{channel.title}</span>
                    <span className="text-xs opacity-90 text-center">
                      {channel.description}
                    </span>
                  </Button>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-primary" />
              Questions fréquentes (FAQ)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((faq, index) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger 
                    className="text-left hover:no-underline"
                    data-testid={`faq-trigger-${faq.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <faq.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span>{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent data-testid={`faq-content-${faq.id}`}>
                    <div className="pl-11 text-muted-foreground">
                      {faq.answer}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Vous ne trouvez pas la réponse à votre question ?
              </p>
              <a
                href="https://wa.me/22892299772"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-green-500 dark:bg-green-600" data-testid="button-contact-support">
                  <SiWhatsapp className="h-5 w-5 mr-2" />
                  Contacter le support
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
