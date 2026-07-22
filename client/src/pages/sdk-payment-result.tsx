import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Page de résultat pour les paiements SDK Wave / PayDunya.
 * Wave redirige ici après confirmation dans l'appli Wave.
 * On sonde /api/verify-payment-by-reference/:reference jusqu'à obtenir un état final.
 * Cette page est publique et ne nécessite aucune authentification.
 */
export default function SdkPaymentResultPage() {
  const searchString = useSearch();
  const [status, setStatus] = useState<"loading" | "completed" | "failed" | "pending" | "timeout">("loading");
  const [message, setMessage] = useState("");
  const [amount, setAmount]   = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 20; // ~60 secondes (poll toutes les 3 s)

  useEffect(() => {
    const urlParams  = new URLSearchParams(searchString);
    const reference  = urlParams.get("reference") || urlParams.get("ref");

    if (!reference) {
      setStatus("failed");
      setMessage("Référence de paiement manquante.");
      return;
    }

    let intervalId: ReturnType<typeof setInterval>;
    let currentAttempt = 0;
    let done = false;

    const verify = async (): Promise<boolean> => {
      try {
        const res  = await fetch(`/api/verify-payment-by-reference/${encodeURIComponent(reference)}`);
        const data = await res.json();

        if (data.status === "completed") {
          setStatus("completed");
          setMessage("Paiement confirmé avec succès !");
          if (data.amount) setAmount(parseFloat(data.amount));
          return true;
        }
        if (data.status === "failed") {
          setStatus("failed");
          setMessage("Le paiement a échoué ou a été annulé.");
          return true;
        }
        setMessage(data.message || "Vérification en cours…");
        return false;
      } catch {
        return false;
      }
    };

    const start = async () => {
      done = await verify();
      if (done) return;

      intervalId = setInterval(async () => {
        currentAttempt++;
        setAttempts(currentAttempt);
        if (currentAttempt >= maxAttempts) {
          clearInterval(intervalId);
          setStatus("timeout");
          setMessage("Le paiement n'a pas encore été confirmé. Vous pouvez fermer cette page — le webhook sera envoyé dès confirmation.");
          return;
        }
        const finished = await verify();
        if (finished) clearInterval(intervalId);
      }, 3000);
    };

    start();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [searchString]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-8 text-center">

          {status === "loading" && (
            <>
              <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-blue-500 flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-white animate-spin" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Confirmation du paiement…</h2>
              <p className="text-muted-foreground mb-4 text-sm">
                {message || "Nous vérifions votre paiement Wave. Veuillez patienter."}
              </p>
              <p className="text-xs text-muted-foreground">
                Tentative {attempts + 1} / {maxAttempts}
              </p>
            </>
          )}

          {status === "completed" && (
            <>
              <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-green-600">Paiement confirmé !</h2>
              <p className="text-muted-foreground mb-4 text-sm">{message}</p>
              {amount != null && (
                <p className="text-2xl font-bold text-green-600 mb-4">
                  {amount.toLocaleString("fr-FR")} XOF
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Vous pouvez fermer cette page et retourner sur l&apos;application du marchand.
              </p>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-red-500 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-red-600">Paiement échoué</h2>
              <p className="text-muted-foreground text-sm">{message}</p>
            </>
          )}

          {(status === "pending" || status === "timeout") && (
            <>
              <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-yellow-500 flex items-center justify-center">
                <Clock className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-yellow-600">Paiement en attente</h2>
              <p className="text-muted-foreground mb-6 text-sm">{message}</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Vérifier à nouveau
              </Button>
            </>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
