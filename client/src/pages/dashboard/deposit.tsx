import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Info, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import comingSoonImage from "@assets/1767357766910-416405275_1769441573289.png";
import mtnLogo from "@assets/mtn_(1)_1763835082904-BVdEqpuz_1769443204393.png";
import moovLogo from "@assets/moov_(1)_1763835082986-GKkwwfPK_1769443204522.png";
import waveLogo from "@assets/wave_(1)_1763835083242-BDJmxeWc_(1)_1769443204492.png";
import wizallLogo from "@assets/wizall_1763835083090-BfalgIrK_1769443204592.png";
import mixxLogo from "@assets/mixxByYas-web-page_1763835083140-t9C-E95C_1769443204464.png";

const paymentMethods = [
  { id: "mtn", name: "MTN Mobile Money", logo: mtnLogo },
  { id: "moov", name: "Moov Money", logo: moovLogo },
  { id: "wave", name: "Wave", logo: waveLogo },
  { id: "wizall", name: "Wizall Money", logo: wizallLogo },
  { id: "mixx", name: "Mixx by Yas", logo: mixxLogo },
];

const quickAmounts = [5000, 10000, 25000, 50000, 100000];

export default function DepositPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mtn");
  const [mobileNumber, setMobileNumber] = useState(user?.phone || "");
  const [showComingSoon, setShowComingSoon] = useState(false);

  const commissionRate = 7;
  const numericAmount = parseFloat(amount) || 0;
  const fee = Math.round(numericAmount * (commissionRate / 100));
  const netAmount = numericAmount - fee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount < 100) {
      toast({
        title: "Montant invalide",
        description: "Le montant minimum est de 100 XOF.",
        variant: "destructive",
      });
      return;
    }
    setShowComingSoon(true);
  };

  if (showComingSoon) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setShowComingSoon(false)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Dépôt</h1>
              <p className="text-muted-foreground">Rechargez votre compte SendavaPay</p>
            </div>
          </div>

          <Card>
            <CardContent className="p-8 text-center space-y-6">
              <img
                src={comingSoonImage}
                alt="Bientôt disponible"
                className="max-w-sm mx-auto w-full h-auto"
                data-testid="img-deposit-coming-soon"
              />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Fonctionnalité bientôt disponible</h2>
                <p className="text-muted-foreground">
                  Les dépôts via Mobile Money seront bientôt disponibles. Nous travaillons pour vous offrir cette fonctionnalité.
                </p>
              </div>
              <Button onClick={() => setShowComingSoon(false)} data-testid="button-back-deposit">
                Retour
              </Button>
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
            <h1 className="text-2xl font-bold">Dépôt</h1>
            <p className="text-muted-foreground">Rechargez votre compte SendavaPay</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Montant à déposer</CardTitle>
            <CardDescription>Choisissez le montant et le mode de paiement</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="amount">Montant (XOF)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Entrez le montant"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-2xl h-14 font-semibold"
                  min="100"
                  data-testid="input-deposit-amount"
                />
                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map((qa) => (
                    <Button
                      key={qa}
                      type="button"
                      variant={numericAmount === qa ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAmount(qa.toString())}
                      data-testid={`button-quick-amount-${qa}`}
                    >
                      {qa.toLocaleString()} XOF
                    </Button>
                  ))}
                </div>
              </div>

              {numericAmount > 0 && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Montant</span>
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

              <div className="space-y-4">
                <Label>Mode de paiement</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id}>
                      <RadioGroupItem
                        value={method.id}
                        id={method.id}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={method.id}
                        className="flex flex-col items-center gap-2 rounded-lg border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
                        data-testid={`radio-payment-${method.id}`}
                      >
                        <img src={method.logo} alt={method.name} className="h-12 w-12 object-contain rounded-full" />
                        <span className="text-xs font-medium text-center">{method.name}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Numéro de téléphone</Label>
                <Input
                  id="mobileNumber"
                  type="tel"
                  placeholder="+228 99 99 99 99"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  data-testid="input-mobile-number"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={numericAmount < 100}
                data-testid="button-deposit-submit"
              >
                {`Déposer ${numericAmount > 0 ? numericAmount.toLocaleString() + " XOF" : ""}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
