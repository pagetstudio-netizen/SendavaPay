import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, ImageIcon, X, ArrowLeft, Link2 } from "lucide-react";
import type { PaymentLink } from "@shared/schema";

export default function EditPaymentLinkPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const linkId = params.id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [productImage, setProductImage] = useState<string | null>(null);
  const [allowCustomAmount, setAllowCustomAmount] = useState(false);
  const [minimumAmount, setMinimumAmount] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: paymentLinks, isLoading } = useQuery<PaymentLink[]>({
    queryKey: ["/api/payment-links"],
  });

  const link = paymentLinks?.find((l) => l.id === parseInt(linkId || "0"));

  useEffect(() => {
    if (link && !initialized) {
      setTitle(link.title);
      setDescription(link.description || "");
      setAmount(link.amount);
      setProductImage(link.productImage || null);
      setAllowCustomAmount(link.allowCustomAmount);
      setMinimumAmount(link.minimumAmount || "");
      setInitialized(true);
    }
  }, [link, initialized]);

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/upload/product-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur lors de l'upload");
      }

      const data = await res.json();
      setProductImage(data.imageUrl);
      toast({
        title: "Image ajoutée",
        description: "L'image du produit a été uploadée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'upload",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const updateLinkMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string; amount: string; productImage?: string; allowCustomAmount?: boolean; minimumAmount?: string }) => {
      const res = await apiRequest("PUT", `/api/payment-links/${linkId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Lien modifié",
        description: "Votre lien de paiement a été mis à jour avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-links"] });
      setLocation("/dashboard/payment-links");
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
    const numericMinAmount = minimumAmount ? parseFloat(minimumAmount) : null;
    
    if (!title.trim()) {
      toast({
        title: "Informations invalides",
        description: "Veuillez remplir le titre.",
        variant: "destructive",
      });
      return;
    }

    if (!allowCustomAmount && numericAmount < 100) {
      toast({
        title: "Informations invalides",
        description: "Le montant doit être d'au moins 100 XOF.",
        variant: "destructive",
      });
      return;
    }

    if (allowCustomAmount && numericMinAmount !== null && numericMinAmount < 100) {
      toast({
        title: "Informations invalides",
        description: "Le montant minimum doit être d'au moins 100 XOF.",
        variant: "destructive",
      });
      return;
    }

    updateLinkMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      amount: allowCustomAmount ? String(numericMinAmount || 100) : String(numericAmount),
      productImage: productImage || undefined,
      allowCustomAmount,
      minimumAmount: allowCustomAmount && numericMinAmount ? String(numericMinAmount) : undefined,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-12 w-48" />
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-96 w-full" />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!link) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Lien introuvable</h1>
          <p className="text-muted-foreground mb-6">Ce lien de paiement n'existe pas ou a été supprimé.</p>
          <Button onClick={() => setLocation("/dashboard/payment-links")} data-testid="button-back-not-found">
            Retour aux liens
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (link.status !== "active") {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Modification impossible</h1>
          <p className="text-muted-foreground mb-6">Vous ne pouvez modifier que les liens actifs.</p>
          <Button onClick={() => setLocation("/dashboard/payment-links")} data-testid="button-back-inactive">
            Retour aux liens
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/dashboard/payment-links")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Modifier le lien de paiement</h1>
            <p className="text-muted-foreground">Modifiez les informations de votre lien</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Modification du lien
            </CardTitle>
            <CardDescription>
              Mettez à jour les informations de votre lien de paiement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Titre du produit/service *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Consultation, Produit X, Service Y..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="input-edit-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  placeholder="Ajoutez plus de détails sur votre produit ou service..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  data-testid="input-edit-description"
                />
              </div>

              <div className="space-y-4">
                <Label>Image du produit (optionnel)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  data-testid="input-edit-product-image"
                />
                {productImage ? (
                  <div className="relative rounded-md overflow-hidden border">
                    <img
                      src={productImage}
                      alt="Aperçu du produit"
                      className="w-full h-48 object-cover"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setProductImage(null)}
                      data-testid="button-remove-image"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    data-testid="container-upload-image"
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Upload en cours...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3 rounded-full bg-muted">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <span className="text-sm font-medium">Cliquez pour ajouter une image</span>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG, GIF, WebP (max 5 Mo)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-4 border rounded-md bg-muted/30">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-custom" className="text-sm font-medium cursor-pointer">
                    Le client choisit le montant
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Permettre au client de saisir son propre montant
                  </p>
                </div>
                <Switch
                  id="allow-custom"
                  checked={allowCustomAmount}
                  onCheckedChange={setAllowCustomAmount}
                  data-testid="switch-edit-allow-custom"
                />
              </div>

              {allowCustomAmount ? (
                <div className="space-y-2">
                  <Label htmlFor="min-amount">Montant minimum (XOF)</Label>
                  <Input
                    id="min-amount"
                    type="number"
                    placeholder="Ex: 1000 (optionnel, minimum 100)"
                    value={minimumAmount}
                    onChange={(e) => setMinimumAmount(e.target.value)}
                    min="100"
                    data-testid="input-edit-min-amount"
                  />
                  <p className="text-xs text-muted-foreground">
                    Le client ne pourra pas payer moins que ce montant
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="amount">Montant à payer (XOF) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Ex: 10000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="100"
                    data-testid="input-edit-amount"
                  />
                  <p className="text-xs text-muted-foreground">
                    Montant minimum: 100 XOF
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setLocation("/dashboard/payment-links")}
                  data-testid="button-cancel-edit"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={updateLinkMutation.isPending || isUploading}
                  data-testid="button-submit-edit"
                >
                  {updateLinkMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer les modifications"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
