import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import logoPath from "@assets/20251211_105226_1765450558306.png";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  const navLinks = [
    { href: "/#features", label: "Fonctionnalités" },
    { href: "/#how-it-works", label: "Comment ça marche" },
    { href: "/#contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <img src={logoPath} alt="SendavaPay" className="h-8" data-testid="img-logo" />
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid={`link-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth">
              <Button variant="ghost" data-testid="button-login">
                Connexion
              </Button>
            </Link>
            <Link href="/auth?tab=register">
              <Button data-testid="button-register">
                S'inscrire
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            data-testid="button-mobile-menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t">
              <Link href="/auth" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  Connexion
                </Button>
              </Link>
              <Link href="/auth?tab=register" onClick={() => setIsOpen(false)}>
                <Button className="w-full">
                  S'inscrire
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
