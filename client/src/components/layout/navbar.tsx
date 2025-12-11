import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import logoPath from "@assets/20251211_105226_1765450558306.png";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/#features", label: "Fonctionnalités" },
    { href: "/#how-it-works", label: "Comment ça marche" },
    { href: "/#contact", label: "Contact" },
  ];

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? "bg-background/95 backdrop-blur-md shadow-sm border-b" 
        : "bg-background border-b"
    }`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <img 
              src={logoPath} 
              alt="SendavaPay" 
              className="h-8 transition-transform duration-200 group-hover:scale-105" 
              data-testid="img-logo" 
            />
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover-elevate rounded-lg transition-colors duration-200"
                data-testid={`link-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth">
              <Button 
                variant="ghost" 
                className="font-medium"
                data-testid="button-login"
              >
                Connexion
              </Button>
            </Link>
            <Link href="/auth?tab=register">
              <Button 
                className="font-medium shadow-lg shadow-primary/25"
                data-testid="button-register"
              >
                S'inscrire
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            data-testid="button-mobile-menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 pb-4" : "max-h-0"
        }`}>
          <div className="space-y-1 pt-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block px-4 py-3 text-sm font-medium text-muted-foreground hover-elevate rounded-lg transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex flex-col gap-2 pt-4 mt-4 border-t">
            <Link href="/auth" onClick={() => setIsOpen(false)}>
              <Button 
                variant="outline" 
                className="w-full justify-center font-medium"
              >
                Connexion
              </Button>
            </Link>
            <Link href="/auth?tab=register" onClick={() => setIsOpen(false)}>
              <Button className="w-full justify-center font-medium shadow-lg shadow-primary/25">
                S'inscrire
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
