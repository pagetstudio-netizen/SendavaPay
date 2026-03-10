import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isIosDismissed, setIsIosDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("pwa-banner-dismissed")) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    const standalone = (window.navigator as any).standalone === true;

    if (ios && !standalone) {
      setIsIos(true);
      setVisible(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    setIsIosDismissed(true);
    sessionStorage.setItem("pwa-banner-dismissed", "1");
  };

  if (!visible || (!installPrompt && !isIos) || (isIos && isIosDismissed)) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg"
      data-testid="pwa-install-banner"
    >
      <div className="max-w-lg mx-auto flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            Installer SendavaPay
          </p>
          {isIos ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Appuyez sur <strong>Partager</strong> puis <strong>"Sur l'écran d'accueil"</strong> pour installer l'application.
            </p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Ajoutez SendavaPay à votre écran d'accueil pour un accès rapide à vos paiements.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!isIos && (
            <Button
              size="sm"
              onClick={handleInstall}
              className="gap-1.5 text-xs h-8"
              data-testid="button-pwa-install"
            >
              <Download className="w-3.5 h-3.5" />
              Installer
            </Button>
          )}
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            data-testid="button-pwa-dismiss"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
