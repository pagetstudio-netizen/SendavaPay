import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Loader2,
  CheckCircle,
  XCircle,
  CreditCard,
  Smartphone,
  Shield,
  Clock,
} from "lucide-react";
import logoPath from "@assets/20251211_105226_1765450558306.png";
import type { PaymentLink } from "@shared/schema";

const paymentMethods = [
  { id: "mtn", name: "MTN Mobile Money", icon: Smartphone },
  { id: "moov", name: "Moov Money", icon: Smartphone },
  { id: "tmoney", name: "TMoney", icon: Smartphone },
  { id: "orange", name: "Orange Money", icon: Smartphone },
];

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-FR").format(num) + " XOF";
}

export default function PaymentPage() {
  const [, params] = useRoute("/pay/:code");
  const { toast } = useToast();
  
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mtn");
  const [paymentComplete, setPaymentComplete] = useState(false);

  const { data: paymentLink, isLoading, error } = useQuery<PaymentLink>({
    queryKey: ["/api/pay", params?.code],
    queryFn: async () => {
      const res = await fetch(`/api/pay/${params?.code}`);
      if (!res.ok) {
        throw new Error("Lien de paiement introuvable");
      }
      return res.json();
    },
    enabled: !!params?.code,
  });

  const payMutation = useMutation({
    mutationFn: async (data: { payerName: string; payerPhone: string; paymentMethod: string }) => {
      const res = await apiRequest("POST", `/api/pay/${params?.code}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Paiement initié",
        description: "Veuillez valider le paiement sur votre téléphone.",
      });
      setPaymentComplete(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!payerName.trim() || !payerPhone.trim()) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }

    payMutation.mutate({
      payerName: payerName.trim(),
      payerPhone: payerPhone.trim(),
      paymentMethod,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 space-y-6">
            <div className="flex justify-center">
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-3/4 mx-auto" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !paymentLink) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Lien introuvable</h2>
            <p className="text-muted-foreground">
              Ce lien de paiement n'existe pas ou a expiré.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentLink.status === "completed") {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-semibold mb-2">Paiement déjà effectué</h2>
            <p className="text-muted-foreground">
              Ce lien de paiement a déjà été utilisé.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentLink.status === "expired" || paymentLink.status === "cancelled") {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Lien expiré</h2>
            <p className="text-muted-foreground">
              Ce lien de paiement n'est plus valide.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Vérifiez votre téléphone</h2>
            <p className="text-muted-foreground mb-6">
              Une demande de paiement a été envoyée sur votre numéro {payerPhone}. 
              Validez le paiement pour finaliser la transaction.
            </p>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Montant à payer</p>
              <p className="text-2xl font-bold">{formatCurrency(paymentLink.amount)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoPath} alt="SendavaPay" className="h-8" />
          </div>
          <CardTitle className="text-2xl">{paymentLink.title}</CardTitle>
          {paymentLink.description && (
            <CardDescription>{paymentLink.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6 p-4 bg-primary/5 rounded-lg">
            <p className="text-sm text-muted-foreground">Montant à payer</p>
            <p className="text-3xl font-bold text-primary" data-testid="text-payment-amount">
              {formatCurrency(paymentLink.amount)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="payerName">Votre nom</Label>
              <Input
                id="payerName"
                placeholder="Jean Dupont"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                data-testid="input-payer-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payerPhone">Numéro de téléphone</Label>
              <Input
                id="payerPhone"
                type="tel"
                placeholder="+228 99 99 99 99"
                value={payerPhone}
                onChange={(e) => setPayerPhone(e.target.value)}
                data-testid="input-payer-phone"
              />
            </div>

            <div className="space-y-3">
              <Label>Mode de paiement</Label>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <div key={method.id}>
                    <RadioGroupItem
                      value={method.id}
                      id={`pay-${method.id}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`pay-${method.id}`}
                      className="flex items-center gap-2 rounded-lg border-2 p-3 cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 text-sm"
                    >
                      <method.icon className="h-4 w-4" />
                      <span className="font-medium">{method.name}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={payMutation.isPending}
              data-testid="button-pay"
            >
              {payMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payer {formatCurrency(paymentLink.amount)}
                </>
              )}
            </Button>
          </form>

          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Paiement sécurisé par SendavaPay</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
