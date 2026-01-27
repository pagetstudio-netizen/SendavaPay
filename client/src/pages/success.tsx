import { useEffect, useState } from "react";
import { useSearch, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Clock, ArrowLeft, RefreshCw } from "lucide-react";

export default function SuccessPage() {
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  
  const [status, setStatus] = useState<"loading" | "completed" | "failed" | "pending" | "timeout">("loading");
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 5;

  useEffect(() => {
    const urlParams = new URLSearchParams(searchString);
    let reference = urlParams.get("reference");
    
    // Si pas de référence dans l'URL, essayer de récupérer depuis localStorage
    if (!reference) {
      reference = localStorage.getItem("lastPaymentId");
    }
    
    if (!reference) {
      setStatus("failed");
      setMessage("Référence de paiement manquante. Veuillez retourner au tableau de bord.");
      return;
    }

    console.log("Vérification du paiement, référence:", reference);
    
    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/verify-payment-by-reference/${reference}`);
        const data = await response.json();
        
        console.log("Réponse vérification:", data);
        
        if (data.status === "completed") {
          setStatus("completed");
          setMessage(data.message || "Votre paiement a été confirmé!");
          if (data.amount) setAmount(data.amount);
          // Nettoyer localStorage
          localStorage.removeItem("lastPaymentId");
          return true;
        } else if (data.status === "failed") {
          setStatus("failed");
          setMessage(data.message || "Le paiement a échoué.");
          return true;
        } else {
          setMessage(data.message || "Vérification en cours...");
          return false;
        }
      } catch (error) {
        console.error("Erreur vérification:", error);
        return false;
      }
    };

    let intervalId: NodeJS.Timeout;
    let currentAttempt = 0;

    const startPolling = async () => {
      const completed = await verifyPayment();
      if (completed) return;

      intervalId = setInterval(async () => {
        currentAttempt++;
        setAttempts(currentAttempt);
        
        if (currentAttempt >= maxAttempts) {
          clearInterval(intervalId);
          setStatus("timeout");
          setMessage("Le paiement n'a pas encore été confirmé. Veuillez réessayer dans quelques instants.");
          return;
        }

        const completed = await verifyPayment();
        if (completed) {
          clearInterval(intervalId);
        }
      }, 3000);
    };

    startPolling();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [searchString]);

  const handleRetry = () => {
    setStatus("loading");
    setAttempts(0);
    const urlParams = new URLSearchParams(searchString);
    const reference = urlParams.get("reference");
    if (reference) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {status === "loading" && (
            <>
              <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-blue-500 flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-white animate-spin" />
              </div>
              <h2 className="text-xl font-semibold mb-2" data-testid="text-title">Vérification du paiement...</h2>
              <p className="text-muted-foreground mb-4" data-testid="text-message">
                {message || "Nous vérifions votre paiement. Veuillez patienter."}
              </p>
              <p className="text-sm text-muted-foreground">
                Tentative {attempts + 1} / {maxAttempts}
              </p>
            </>
          )}

          {status === "completed" && (
            <>
              <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-green-600" data-testid="text-title">Paiement confirmé!</h2>
              <p className="text-muted-foreground mb-4" data-testid="text-message">{message}</p>
              {amount && (
                <p className="text-2xl font-bold text-green-600 mb-6" data-testid="text-amount">
                  +{amount.toLocaleString()} XOF
                </p>
              )}
              <Button 
                onClick={() => setLocation("/dashboard")} 
                className="w-full"
                data-testid="button-dashboard"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au tableau de bord
              </Button>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-red-500 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-red-600" data-testid="text-title">Paiement échoué</h2>
              <p className="text-muted-foreground mb-6" data-testid="text-message">{message}</p>
              <div className="space-y-3">
                <Button 
                  onClick={() => setLocation("/dashboard/deposit")} 
                  className="w-full"
                  data-testid="button-retry"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setLocation("/dashboard")} 
                  className="w-full"
                  data-testid="button-dashboard"
                >
                  Retour au tableau de bord
                </Button>
              </div>
            </>
          )}

          {(status === "pending" || status === "timeout") && (
            <>
              <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-yellow-500 flex items-center justify-center">
                <Clock className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-yellow-600" data-testid="text-title">Paiement en attente</h2>
              <p className="text-muted-foreground mb-6" data-testid="text-message">{message}</p>
              <div className="space-y-3">
                <Button 
                  onClick={handleRetry} 
                  className="w-full"
                  data-testid="button-retry"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Vérifier à nouveau
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setLocation("/dashboard")} 
                  className="w-full"
                  data-testid="button-dashboard"
                >
                  Retour au tableau de bord
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
