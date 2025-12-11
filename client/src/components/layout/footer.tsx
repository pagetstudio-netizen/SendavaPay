import logoPath from "@assets/20251211_105226_1765450558306.png";
import { SiFacebook, SiInstagram, SiWhatsapp, SiTelegram, SiTiktok, SiYoutube } from "react-icons/si";

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <img src={logoPath} alt="SendavaPay" className="h-8 mb-4" />
            <p className="text-muted-foreground text-sm max-w-md">
              SendavaPay est une plateforme tout-en-un qui vous permet de créer des liens de paiement, 
              de transférer de l'argent et d'effectuer des retraits instantanés, rapides et sécurisés.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" 
                 className="text-muted-foreground hover:text-primary transition-colors"
                 data-testid="link-facebook">
                <SiFacebook className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                 className="text-muted-foreground hover:text-primary transition-colors"
                 data-testid="link-instagram">
                <SiInstagram className="h-5 w-5" />
              </a>
              <a href="https://wa.me/22892299772" target="_blank" rel="noopener noreferrer"
                 className="text-muted-foreground hover:text-primary transition-colors"
                 data-testid="link-whatsapp">
                <SiWhatsapp className="h-5 w-5" />
              </a>
              <a href="https://t.me/sendavapay" target="_blank" rel="noopener noreferrer"
                 className="text-muted-foreground hover:text-primary transition-colors"
                 data-testid="link-telegram">
                <SiTelegram className="h-5 w-5" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"
                 className="text-muted-foreground hover:text-primary transition-colors"
                 data-testid="link-youtube">
                <SiYoutube className="h-5 w-5" />
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer"
                 className="text-muted-foreground hover:text-primary transition-colors"
                 data-testid="link-tiktok">
                <SiTiktok className="h-5 w-5" />
              </a>
            </div>
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
