import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Info, ArrowLeft, Globe } from "lucide-react";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import comingSoonImage from "@assets/1767357766910-416405275_1769441573289.png";
import mtnLogo from "@assets/mtn_(1)_1763835082904-BVdEqpuz_1769443204393.png";
import moovLogo from "@assets/moov_(1)_1763835082986-GKkwwfPK_1769443204522.png";
import orangeLogo from "@assets/images_1769443862827.png";
import tmoneyLogo from "@assets/images_(1)_1769443862863.png";
import airtelLogo from "@assets/Airtel_logo-01_1769443862893.png";
import vodacomLogo from "@assets/vodacom_1769443862923.png";

const countries = [
  { id: "bj", name: "Bénin", currency: "XOF" },
  { id: "bf", name: "Burkina Faso", currency: "XOF" },
  { id: "tg", name: "Togo", currency: "XOF" },
  { id: "cm", name: "Cameroun", currency: "XAF" },
  { id: "ci", name: "Côte d'Ivoire", currency: "XOF" },
  { id: "rdc", name: "RDC", currency: "CDF" },
  { id: "cg", name: "Congo Brazzaville", currency: "XAF" },
];

const paymentMethods = [
  { id: "mtn", name: "MTN Mobile Money", logo: mtnLogo, countries: ["bj", "cm", "ci", "cg"] },
  { id: "moov", name: "Moov Money", logo: moovLogo, countries: ["bj", "bf", "tg", "ci"] },
  { id: "orange", name: "Orange Money", logo: orangeLogo, countries: ["bf", "cm", "ci"] },
  { id: "tmoney", name: "TMoney", logo: tmoneyLogo, countries: ["tg"] },
  { id: "airtel", name: "Airtel Money", logo: airtelLogo, countries: ["rdc", "cg"] },
  { id: "vodacom", name: "Vodacom M-Pesa", logo: vodacomLogo, countries: ["rdc"] },
];

const quickAmounts = [5000, 10000, 25000, 50000, 100000];

export default function DepositPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("tg");
  const [paymentMethod, setPaymentMethod] = useState("tmoney");
  const [mobileNumber, setMobileNumber] = useState(user?.phone || "");
  const [showComingSoon, setShowComingSoon] = useState(false);

  const filteredMethods = useMemo(() => {
    return paymentMethods.filter(m => m.countries.includes(selectedCountry));
  }, [selectedCountry]);

  // Update payment method when country changes
  const handleCountryChange = (val: string) => {
    setSelectedCountry(val);
    const methodsForCountry = paymentMethods.filter(m => m.countries.includes(val));
    if (methodsForCountry.length > 0) {
      setPaymentMethod(methodsForCountry[0].id);
    }
  };

  const currentCountry = countries.find(c => c.id === selectedCountry);
  const currency = currentCountry?.currency || "XOF";

  const commissionRate = 7;
  const numericAmount = parseFloat(amount) || 0;
  const fee = Math.round(numericAmount * (commissionRate / 100));
  const netAmount = numericAmount - fee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount < 100) {
      toast({
        title: "Montant invalide",
        description: `Le montant minimum est de 100 ${currency}.`,
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
            <CardTitle>Dépôt Mobile Money</CardTitle>
            <CardDescription>Configurez votre dépôt par pays</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="country">Choisir le pays</Label>
                <Select value={selectedCountry} onValueChange={handleCountryChange}>
                  <SelectTrigger id="country" className="h-12">
                    <SelectValue placeholder="Sélectionnez un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label htmlFor="amount">Montant ({currency})</Label>
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
                      {qa.toLocaleString()} {currency}
                    </Button>
                  ))}
                </div>
              </div>

              {numericAmount > 0 && (
                <Card className="bg-muted/50 border-none">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Montant</span>
                      <span>{numericAmount.toLocaleString()} {currency}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Frais ({commissionRate}%)
                      </span>
                      <span>-{fee.toLocaleString()} {currency}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Vous recevez</span>
                      <span className="text-green-600">{netAmount.toLocaleString()} {currency}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                <Label>Moyen de paiement</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-4">
                  {filteredMethods.map((method) => (
                    <div key={method.id}>
                      <RadioGroupItem
                        value={method.id}
                        id={method.id}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={method.id}
                        className="flex flex-col items-center gap-2 rounded-xl border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
                        data-testid={`radio-payment-${method.id}`}
                      >
                        <img src={method.logo} alt={method.name} className="h-12 w-12 object-contain rounded-full bg-white shadow-sm p-1" />
                        <span className="text-xs font-bold text-center">{method.name}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Numéro de téléphone Mobile Money</Label>
                <Input
                  id="mobileNumber"
                  type="tel"
                  placeholder="Numéro sans l'indicatif"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  data-testid="input-mobile-number"
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20"
                disabled={numericAmount < 100}
                data-testid="button-deposit-submit"
              >
                {`Déposer ${numericAmount > 0 ? numericAmount.toLocaleString() + " " + currency : ""}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
