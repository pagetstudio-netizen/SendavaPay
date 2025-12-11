import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Plus, Link2, Copy, ExternalLink, Clock, CheckCircle, XCircle } from "lucide-react";
import type { PaymentLink } from "@shared/schema";

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-FR").format(num) + " XOF";
}

function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

const statusConfig = {
  active: { label: "Actif", icon: Clock, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" },
  completed: { label: "Payé", icon: CheckCircle, color: "text-green-600 bg-green-100 dark:bg-green-900/30" },
  expired: { label: "Expiré", icon: XCircle, color: "text-gray-600 bg-gray-100 dark:bg-gray-900/30" },
  cancelled: { label: "Annulé", icon: XCircle, color: "text-red-600 bg-red-100 dark:bg-red-900/30" },
};

export default function PaymentLinksPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const { data: paymentLinks, isLoading } = useQuery<PaymentLink[]>({
    queryKey: ["/api/payment-links"],
  });

  const createLinkMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string; amount: number }) => {
      const res = await apiRequest("POST", "/api/payment-links", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Lien créé",
        description: "Votre lien de paiement a été créé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-links"] });
      setIsDialogOpen(false);
      setTitle("");
      setDescription("");
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
    const numericAmount = parseFloat(amount);
    if (!title.trim() || numericAmount < 100) {
      toast({
        title: "Informations invalides",
        description: "Veuillez remplir le titre et un montant minimum de 100 XOF.",
        variant: "destructive",
      });
      return;
    }
    createLinkMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      amount: numericAmount,
    });
  };

  const copyLink = (linkCode: string) => {
    const url = `${window.location.origin}/pay/${linkCode}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Lien copié",
      description: "Le lien de paiement a été copié dans le presse-papiers.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Liens de paiement</h1>
            <p className="text-muted-foreground">Créez et gérez vos liens de paiement</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-link">
                <Plus className="h-4 w-4 mr-2" />
                Créer un lien
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un lien de paiement</DialogTitle>
                <DialogDescription>
                  Créez un lien personnalisé pour recevoir de l'argent
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Paiement pour service X"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    data-testid="input-link-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optionnel)</Label>
                  <Textarea
                    id="description"
                    placeholder="Ajoutez plus de détails..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    data-testid="input-link-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Montant (XOF)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Ex: 10000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="100"
                    data-testid="input-link-amount"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createLinkMutation.isPending}
                  data-testid="button-submit-link"
                >
                  {createLinkMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    "Créer le lien"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !paymentLinks?.length ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Link2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Aucun lien de paiement</h3>
              <p className="text-muted-foreground mb-6">
                Créez votre premier lien de paiement pour recevoir de l'argent
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un lien
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paymentLinks.map((link) => {
              const status = statusConfig[link.status as keyof typeof statusConfig] || statusConfig.active;
              const StatusIcon = status.icon;

              return (
                <Card key={link.id} data-testid={`payment-link-${link.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-1">{link.title}</CardTitle>
                      <Badge className={`${status.color} whitespace-nowrap`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                    {link.description && (
                      <CardDescription className="line-clamp-2">{link.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-2xl font-bold">{formatCurrency(link.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        Créé le {formatDate(link.createdAt)}
                      </p>
                    </div>

                    {link.status === "completed" && link.payerName && (
                      <div className="text-sm text-muted-foreground">
                        Payé par: {link.payerName}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => copyLink(link.linkCode)}
                        data-testid={`button-copy-link-${link.id}`}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(`/pay/${link.linkCode}`, "_blank")}
                        data-testid={`button-open-link-${link.id}`}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Ouvrir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
