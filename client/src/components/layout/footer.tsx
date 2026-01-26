import logoPath from "@assets/20251211_105226_1765450558306.png";
import { useQuery } from "@tanstack/react-query";
import { SiFacebook, SiInstagram, SiWhatsapp, SiTelegram, SiTiktok, SiYoutube, SiX } from "react-icons/si";

interface SocialLink {
  id: number;
  platform: string;
  url: string | null;
  isActive: boolean;
}

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

export function Footer() {
  const { data: socialLinks = [] } = useQuery<SocialLink[]>({
    queryKey: ['/api/social-links'],
  });

  const activeLinks = socialLinks.filter(link => link.isActive && link.url);

  return (
    <footer className="bg-card border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <img src={logoPath} alt="SendavaPay" className="h-8 mb-4" />
            <p className="text-muted-foreground text-sm max-w-md">
              SendavaPay est une plateforme tout-en-un qui vous permet de créer des liens de paiement, 
              de transférer de l'argent et d'effectuer des retraits crédités sous 1h à 24h.
            </p>
            {activeLinks.length > 0 && (
              <div className="flex gap-4 mt-6 flex-wrap">
                {activeLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    data-testid={`link-${link.platform}`}
                  >
                    <SocialIcon platform={link.platform} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-semibold mb-4">Liens rapides</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Fonctionnalités
                </a>
              </li>
              <li>
                <a href="/#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                  Comment ça marche
                </a>
              </li>
              <li>
                <a href="/api-docs" className="text-muted-foreground hover:text-foreground transition-colors">
                  Documentation API
                </a>
              </li>
              <li>
                <a href="/about" className="text-muted-foreground hover:text-foreground transition-colors"
                   data-testid="link-about">
                  À propos
                </a>
              </li>
              <li>
                <a href="/help" className="text-muted-foreground hover:text-foreground transition-colors"
                   data-testid="link-help">
                  Centre d'aide
                </a>
              </li>
              <li>
                <a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors"
                   data-testid="link-terms">
                  Conditions d'utilisation
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>support@sendavapay.com</li>
              <li>+228 92 29 97 72</li>
              <li>Lomé, Togo</li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} SendavaPay. Tous droits réservés.</p>
          <p className="mt-2">
            Disponible au Togo, Bénin, Sénégal, Mali, Burkina Faso et Côte d'Ivoire
          </p>
        </div>
      </div>
    </footer>
  );
}
