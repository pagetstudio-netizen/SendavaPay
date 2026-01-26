import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Link2, Copy, ExternalLink, Clock, CheckCircle, XCircle, Pencil, Trash2, Loader2 } from "lucide-react";
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
  const [editingLink, setEditingLink] = useState<PaymentLink | null>(null);
  const [deletingLink, setDeletingLink] = useState<PaymentLink | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    amount: "",
    productImage: "",
    allowCustomAmount: false,
    minimumAmount: "",
  });

  const { data: paymentLinks, isLoading } = useQuery<PaymentLink[]>({
    queryKey: ["/api/payment-links"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; updates: typeof editForm }) => {
      const res = await apiRequest("PUT", `/api/payment-links/${data.id}`, data.updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-links"] });
      toast({ title: "Lien modifié", description: "Le lien de paiement a été mis à jour." });
      setEditingLink(null);
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/payment-links/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-links"] });
      toast({ title: "Lien supprimé", description: "Le lien de paiement a été supprimé." });
      setDeletingLink(null);
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const copyLink = (linkCode: string) => {
    const url = `${window.location.origin}/pay/${linkCode}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Lien copié",
      description: "Le lien de paiement a été copié dans le presse-papiers.",
    });
  };

  const openEditDialog = (link: PaymentLink) => {
    setEditForm({
      title: link.title,
      description: link.description || "",
      amount: link.amount,
      productImage: link.productImage || "",
      allowCustomAmount: link.allowCustomAmount,
      minimumAmount: link.minimumAmount || "",
    });
    setEditingLink(link);
  };

  const handleEditSubmit = () => {
    if (!editingLink) return;
    updateMutation.mutate({
      id: editingLink.id,
      updates: editForm,
    });
  };

  const handleDelete = () => {
    if (!deletingLink) return;
    deleteMutation.mutate(deletingLink.id);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Liens de paiement</h1>
            <p className="text-muted-foreground">Créez et gérez vos liens de paiement</p>
          </div>
          <Link href="/dashboard/payment-links/create">
            <Button data-testid="button-create-link">
              <Plus className="h-4 w-4 mr-2" />
              Créer un lien
            </Button>
          </Link>
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
              <Link href="/dashboard/payment-links/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un lien
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paymentLinks.map((link) => {
              const status = statusConfig[link.status as keyof typeof statusConfig] || statusConfig.active;
              const StatusIcon = status.icon;
              const isActive = link.status === "active";

              return (
                <Card key={link.id} data-testid={`payment-link-${link.id}`} className="overflow-hidden">
                  {link.productImage && (
                    <div className="relative h-32 bg-muted">
                      <img
                        src={link.productImage}
                        alt={link.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
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
                      {link.allowCustomAmount ? (
                        <div>
                          <p className="text-lg font-semibold text-muted-foreground">Montant libre</p>
                          {link.minimumAmount && (
                            <p className="text-xs text-muted-foreground">
                              Min: {formatCurrency(link.minimumAmount)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-2xl font-bold">{formatCurrency(link.amount)}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Créé le {formatDate(link.createdAt)}
                      </p>
                    </div>

                    {link.paidAt && link.payerName && (
                      <div className="text-sm text-muted-foreground border-t pt-2">
                        Dernier paiement: {link.payerName}
                        {link.paidAmount && ` (${formatCurrency(link.paidAmount)})`}
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

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(link)}
                        disabled={!isActive}
                        data-testid={`button-edit-link-${link.id}`}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-destructive hover:text-destructive"
                        onClick={() => setDeletingLink(link)}
                        data-testid={`button-delete-link-${link.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!editingLink} onOpenChange={(open) => !open && setEditingLink(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le lien de paiement</DialogTitle>
            <DialogDescription>
              Modifiez les informations de votre lien de paiement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titre</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                data-testid="input-edit-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                data-testid="input-edit-description"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="edit-custom-amount"
                checked={editForm.allowCustomAmount}
                onCheckedChange={(checked) => setEditForm({ ...editForm, allowCustomAmount: checked })}
                data-testid="switch-edit-custom-amount"
              />
              <Label htmlFor="edit-custom-amount">Montant personnalisé</Label>
            </div>
            {editForm.allowCustomAmount ? (
              <div className="space-y-2">
                <Label htmlFor="edit-min-amount">Montant minimum (XOF)</Label>
                <Input
                  id="edit-min-amount"
                  type="number"
                  value={editForm.minimumAmount}
                  onChange={(e) => setEditForm({ ...editForm, minimumAmount: e.target.value })}
                  data-testid="input-edit-min-amount"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Montant (XOF)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  data-testid="input-edit-amount"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-image">URL de l'image (optionnel)</Label>
              <Input
                id="edit-image"
                value={editForm.productImage}
                onChange={(e) => setEditForm({ ...editForm, productImage: e.target.value })}
                placeholder="https://..."
                data-testid="input-edit-image"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLink(null)}>
              Annuler
            </Button>
            <Button onClick={handleEditSubmit} disabled={updateMutation.isPending} data-testid="button-save-edit">
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingLink} onOpenChange={(open) => !open && setDeletingLink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce lien de paiement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le lien "{deletingLink?.title}" sera définitivement supprimé
              et ne pourra plus être utilisé pour recevoir des paiements.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
