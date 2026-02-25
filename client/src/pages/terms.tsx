import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Shield, AlertTriangle, Ban, Scale, FileText, Lock } from "lucide-react";

export default function TermsPage() {
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Conditions d'utilisation et Politique de confidentialité</h1>
          <p className="text-muted-foreground">Dernière mise à jour : 25 février 2026</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                1. Conditions Générales d'Utilisation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                En utilisant les services de SendavaPay, vous acceptez les présentes conditions d'utilisation. 
                SendavaPay est une plateforme de paiement en ligne destinée aux marchés d'Afrique de l'Ouest, 
                permettant les transferts d'argent, les dépôts et retraits via Mobile Money.
              </p>
              <p>
                L'utilisateur s'engage à fournir des informations exactes et à jour lors de son inscription 
                et à maintenir la confidentialité de ses identifiants de connexion.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                2. Politique de Confidentialité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                SendavaPay s'engage à protéger vos données personnelles conformément aux lois en vigueur. 
                Nous collectons uniquement les informations nécessaires au bon fonctionnement de nos services :
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Informations d'identification (nom, email, numéro de téléphone)</li>
                <li>Documents de vérification KYC</li>
                <li>Historique des transactions</li>
                <li>Données de connexion et d'utilisation</li>
              </ul>
              <p>
                Vos données ne sont jamais vendues à des tiers et sont uniquement utilisées pour 
                améliorer nos services et respecter nos obligations légales.
              </p>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Ban className="h-5 w-5" />
                3. Activités Interdites
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-destructive/5 rounded-md">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Usurpation ou falsification d'identités</h4>
                    <p className="text-sm text-muted-foreground">
                      Toute tentative d'utilisation de faux documents, d'identités volées ou de 
                      création de comptes sous de fausses identités est strictement interdite et 
                      sera signalée aux autorités compétentes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-destructive/5 rounded-md">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Transactions frauduleuses et blanchiment d'argent</h4>
                    <p className="text-sm text-muted-foreground">
                      SendavaPay applique une politique de tolérance zéro envers le blanchiment d'argent, 
                      le financement du terrorisme et toute forme de transaction frauduleuse. 
                      Toute activité suspecte sera immédiatement signalée aux autorités.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-destructive/5 rounded-md">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Publicité mensongère et promesses irréalistes</h4>
                    <p className="text-sm text-muted-foreground">
                      L'utilisation de SendavaPay pour des activités promotionnelles trompeuses, 
                      des schémas pyramidaux, des promesses de rendements irréalistes ou toute 
                      forme d'arnaque est formellement interdite.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-destructive/5 rounded-md">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Vente de produits interdits</h4>
                    <p className="text-sm text-muted-foreground">
                      Il est interdit d'utiliser nos services pour la vente de produits illégaux, 
                      contrefaits, dangereux, ou tout article dont la vente est prohibée par la loi 
                      dans les pays où nous opérons.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-destructive/5 rounded-md">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Non-respect des règles SendavaPay</h4>
                    <p className="text-sm text-muted-foreground">
                      Tout contournement de nos procédures de sécurité, utilisation abusive de nos 
                      services, ou non-respect de nos conditions d'utilisation entraînera la 
                      suspension immédiate du compte et des poursuites judiciaires si nécessaire.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                4. Sanctions et Mesures
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                En cas de violation de ces conditions, SendavaPay se réserve le droit de :
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Suspendre ou fermer définitivement le compte de l'utilisateur</li>
                <li>Bloquer les fonds en cas de suspicion de fraude</li>
                <li>Signaler les activités suspectes aux autorités compétentes</li>
                <li>Coopérer avec les forces de l'ordre dans le cadre d'enquêtes</li>
                <li>Engager des poursuites judiciaires pour recouvrer les dommages</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                5. Protection et Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                SendavaPay met en œuvre des mesures de sécurité avancées pour protéger vos 
                transactions et vos données :
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Cryptage SSL de bout en bout</li>
                <li>Vérification KYC obligatoire pour les transactions importantes</li>
                <li>Surveillance en temps réel des transactions suspectes</li>
                <li>Authentification sécurisée</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                Pour toute question concernant ces conditions ou pour signaler une activité suspecte :
              </p>
              <p className="text-muted-foreground">
                Support client : <span className="font-medium text-foreground">+228 92299772</span>
              </p>
              <p className="text-muted-foreground">
                Email : <span className="font-medium text-foreground">support@sendavapay.com</span>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline" data-testid="button-return-home">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
