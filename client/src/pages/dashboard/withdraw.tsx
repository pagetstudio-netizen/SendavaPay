import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Smartphone, Info, ArrowLeft, AlertTriangle, Shield } from "lucide-react";
import { Link } from "wouter";

const paymentMethods = [
  { id: "mtn", name: "MTN Mobile Money", icon: Smartphone },
  { id: "moov", name: "Moov Money", icon: Smartphone },
  { id: "tmoney", name: "TMoney", icon: Smartphone },
  { id: "orange", name: "Orange Money", icon: Smartphone },
];

export default function WithdrawPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mtn");
  const [mobileNumber, setMobileNumber] = useState(user?.phone || "");

  const commissionRate = 7;
  const balance = parseFloat(user?.balance || "0");
  const numericAmount = parseFloat(amount) || 0;
  const fee = Math.round(numericAmount * (commissionRate / 100));
  const netAmount = numericAmount - fee;
  const minWithdrawal = 500;

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: number; paymentMethod: string; mobileNumber: string }) => {
      const res = await apiRequest("POST", "/api/withdraw", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Retrait effectué",
        description: "Le montant sera crédité sur votre compte Mobile Money.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setAmount("");
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
    
    if (!user?.isVerified) {
      toast({
        title: "Compte non vérifié",
        description: "Veuillez vérifier votre compte pour effectuer des retraits.",
        variant: "destructive",
      });
      return;
    }

    if (numericAmount < minWithdrawal) {
      toast({
        title: "Montant insuffisant",
        description: `Le montant minimum de retrait est de ${minWithdrawal} XOF.`,
        variant: "destructive",
      });
      return;
    }

    if (numericAmount > balance) {
      toast({
        title: "Solde insuffisant",
        description: "Vous n'avez pas assez de fonds pour ce retrait.",
        variant: "destructive",
      });
      return;
    }

    withdrawMutation.mutate({
      amount: numericAmount,
      paymentMethod,
      mobileNumber,
    });
  };

  const handleMaxAmount = () => {
    setAmount(Math.floor(balance).toString());
  };

  if (!user?.isVerified) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Retrait</h1>
              <p className="text-muted-foreground">Retirez de l'argent vers votre Mobile Money</p>
            </div>
          </div>

          <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30">
            <CardContent className="p-8 text-center">
              <Shield className="h-16 w-16 mx-auto mb-4 text-orange-500" />
              <h2 className="text-xl font-semibold text-orange-800 dark:text-orange-200 mb-2">
                Compte non vérifié
              </h2>
              <p className="text-orange-600 dark:text-orange-300 mb-6 max-w-md mx-auto">
                Votre compte n'est pas encore vérifié. Veuillez vérifier votre compte afin d'utiliser 
                nos services de paiement sécurisés. Un compte non vérifié ne peut pas effectuer de retraits.
              </p>
              <Link href="/dashboard/kyc">
                <Button data-testid="button-verify-now">
                  Vérifier mon compte
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Retrait</h1>
            <p className="text-muted-foreground">Retirez de l'argent vers votre Mobile Money</p>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <CardContent className="p-6">
            <p className="text-sm opacity-80">Solde disponible</p>
            <p className="text-3xl font-bold mt-1" data-testid="text-available-balance">
              {balance.toLocaleString()} XOF
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Montant à retirer</CardTitle>
            <CardDescription>Minimum: {minWithdrawal.toLocaleString()} XOF</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="amount">Montant (XOF)</Label>
                  <Button type="button" variant="link" size="sm" onClick={handleMaxAmount}>
                    Max: {balance.toLocaleString()} XOF
                  </Button>
                </div>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Entrez le montant"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-2xl h-14 font-semibold"
                  min={minWithdrawal}
                  max={balance}
                  data-testid="input-withdraw-amount"
                />
              </div>

              {numericAmount > 0 && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Montant demandé</span>
                      <span>{numericAmount.toLocaleString()} XOF</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Frais ({commissionRate}%)
                      </span>
                      <span>-{fee.toLocaleString()} XOF</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Vous recevez</span>
                      <span className="text-green-600">{netAmount.toLocaleString()} XOF</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {numericAmount > balance && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Solde insuffisant pour ce montant</span>
                </div>
              )}

              <div className="space-y-4">
                <Label>Destination</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id}>
                      <RadioGroupItem
                        value={method.id}
                        id={`withdraw-${method.id}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`withdraw-${method.id}`}
                        className="flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        <method.icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{method.name}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Numéro de téléphone destinataire</Label>
                <Input
                  id="mobileNumber"
                  type="tel"
                  placeholder="+228 99 99 99 99"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  data-testid="input-withdraw-mobile"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={withdrawMutation.isPending || numericAmount < minWithdrawal || numericAmount > balance}
                data-testid="button-withdraw-submit"
              >
                {withdrawMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  `Retirer ${numericAmount > 0 ? numericAmount.toLocaleString() + " XOF" : ""}`
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
