import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, ArrowLeft, AlertTriangle, Send, User } from "lucide-react";
import { Link } from "wouter";

export default function TransferPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [description, setDescription] = useState("");

  const balance = parseFloat(user?.balance || "0");
  const numericAmount = parseFloat(amount) || 0;
  const minTransfer = 100;

  const transferMutation = useMutation({
    mutationFn: async (data: { amount: number; recipientPhone: string; description?: string }) => {
      const res = await apiRequest("POST", "/api/transfer", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Transfert réussi",
        description: `${numericAmount.toLocaleString()} XOF ont été envoyés avec succès.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setAmount("");
      setRecipientPhone("");
      setDescription("");
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

    if (numericAmount < minTransfer) {
      toast({
        title: "Montant insuffisant",
        description: `Le montant minimum de transfert est de ${minTransfer} XOF.`,
        variant: "destructive",
      });
      return;
    }

    if (numericAmount > balance) {
      toast({
        title: "Solde insuffisant",
        description: "Vous n'avez pas assez de fonds pour ce transfert.",
        variant: "destructive",
      });
      return;
    }

    if (!recipientPhone.trim()) {
      toast({
        title: "Destinataire requis",
        description: "Veuillez entrer le numéro de téléphone du destinataire.",
        variant: "destructive",
      });
      return;
    }

    transferMutation.mutate({
      amount: numericAmount,
      recipientPhone: recipientPhone.trim(),
      description: description.trim() || undefined,
    });
  };

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
            <h1 className="text-2xl font-bold">Transfert</h1>
            <p className="text-muted-foreground">Envoyez de l'argent à un autre utilisateur</p>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <CardContent className="p-6">
            <p className="text-sm opacity-80">Solde disponible</p>
            <p className="text-3xl font-bold mt-1" data-testid="text-transfer-balance">
              {balance.toLocaleString()} XOF
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Envoyer de l'argent
            </CardTitle>
            <CardDescription>
              Transfert gratuit vers un autre compte SendavaPay
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="recipientPhone">Numéro du destinataire</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="recipientPhone"
                    type="tel"
                    placeholder="+228 99 99 99 99"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="pl-10"
                    data-testid="input-transfer-recipient"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Entrez le numéro de téléphone du destinataire (doit avoir un compte SendavaPay)
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="amount">Montant (XOF)</Label>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setAmount(Math.floor(balance).toString())}
                  >
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
                  min={minTransfer}
                  max={balance}
                  data-testid="input-transfer-amount"
                />
              </div>

              {numericAmount > balance && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Solde insuffisant pour ce montant</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  placeholder="Ajoutez une note..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  data-testid="input-transfer-description"
                />
              </div>

              <Card className="bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                    <Send className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Transfert gratuit</p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Aucuns frais pour les transferts entre utilisateurs
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={transferMutation.isPending || numericAmount < minTransfer || numericAmount > balance}
                data-testid="button-transfer-submit"
              >
                {transferMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Transfert en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer {numericAmount > 0 ? numericAmount.toLocaleString() + " XOF" : ""}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
