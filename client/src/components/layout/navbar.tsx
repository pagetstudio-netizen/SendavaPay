import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronRight, ChevronDown, Code2, BookOpen } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import logoPath from "@assets/20251211_105226_1765450558306.png";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [mobileDocsOpen, setMobileDocsOpen] = useState(false);
  const [location] = useLocation();
  const docsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (docsRef.current && !docsRef.current.contains(e.target as Node)) {
        setDocsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { href: "/#features", label: "Fonctionnalités" },
    { href: "/#how-it-works", label: "Comment ça marche" },
    { href: "/help", label: "Contact" },
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

            {/* Documentation dropdown */}
            <div ref={docsRef} className="relative">
              <button
                onClick={() => setDocsOpen((v) => !v)}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-muted-foreground hover-elevate rounded-lg transition-colors duration-200"
                data-testid="link-nav-documentation"
              >
                Documentation
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${docsOpen ? "rotate-180" : ""}`} />
              </button>

              {docsOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-background border rounded-xl shadow-lg py-1 z-50">
                  <Link href="/docs" onClick={() => setDocsOpen(false)}>
                    <div className="flex items-start gap-3 px-4 py-3 hover:bg-muted/60 transition-colors cursor-pointer rounded-lg mx-1">
                      <div className="bg-primary/10 rounded-lg p-1.5 shrink-0 mt-0.5">
                        <Code2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">API avec redirection</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Checkout hébergé, lien de paiement</p>
                      </div>
                    </div>
                  </Link>
                  <Link href="/sdk-docs" onClick={() => setDocsOpen(false)}>
                    <div className="flex items-start gap-3 px-4 py-3 hover:bg-muted/60 transition-colors cursor-pointer rounded-lg mx-1">
                      <div className="bg-purple-500/10 rounded-lg p-1.5 shrink-0 mt-0.5">
                        <BookOpen className="h-3.5 w-3.5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">API SDK Payin & Payout</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Sans redirection, backend direct</p>
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
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

        {/* Mobile menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[32rem] pb-4" : "max-h-0"
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

            {/* Mobile Documentation section */}
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover-elevate rounded-lg transition-colors duration-200"
              onClick={() => setMobileDocsOpen((v) => !v)}
            >
              Documentation
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${mobileDocsOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileDocsOpen && (
              <div className="pl-4 space-y-1">
                <Link href="/docs" onClick={() => { setIsOpen(false); setMobileDocsOpen(false); }}>
                  <div className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/60 rounded-lg transition-colors">
                    <Code2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    API avec redirection
                  </div>
                </Link>
                <Link href="/sdk-docs" onClick={() => { setIsOpen(false); setMobileDocsOpen(false); }}>
                  <div className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/60 rounded-lg transition-colors">
                    <BookOpen className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                    API SDK Payin & Payout
                  </div>
                </Link>
              </div>
            )}
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
