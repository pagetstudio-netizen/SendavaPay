import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, ImageIcon, X, ArrowLeft, Link2, ExternalLink, Info } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function CreatePaymentLinkPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [productImage, setProductImage] = useState<string | null>(null);
  const [allowCustomAmount, setAllowCustomAmount] = useState(false);
  const [minimumAmount, setMinimumAmount] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { data: publicFees } = useQuery<{ countries: { code: string; encaissementFee: number }[]; global: { encaissementFee: number } }>({
    queryKey: ["/api/public/fees"],
  });
  const userCountryCode = user?.country
    ? publicFees?.countries.find(c => c.code === user.country?.toUpperCase())
    : null;
  const encaissementRate = userCountryCode?.encaissementFee ?? publicFees?.global?.encaissementFee ?? 7;

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

  const createLinkMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string; amount: number; productImage?: string; allowCustomAmount?: boolean; minimumAmount?: number; redirectUrl?: string }) => {
      const res = await apiRequest("POST", "/api/payment-links", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Lien créé",
        description: "Votre lien de paiement a été créé avec succès.",
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

    createLinkMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      amount: allowCustomAmount ? (numericMinAmount || 100) : numericAmount,
      productImage: productImage || undefined,
      allowCustomAmount,
      minimumAmount: allowCustomAmount && numericMinAmount ? numericMinAmount : undefined,
      redirectUrl: redirectUrl.trim() || undefined,
    });
  };

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
            <h1 className="text-2xl font-bold">Créer un lien de paiement</h1>
            <p className="text-muted-foreground">Créez un lien personnalisé pour recevoir des paiements</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Nouveau lien
            </CardTitle>
            <CardDescription>
              Remplissez les informations pour créer votre lien de paiement
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
                  data-testid="input-link-title"
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
                  data-testid="input-link-description"
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
                  data-testid="input-product-image"
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
                  data-testid="switch-allow-custom"
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
                    data-testid="input-min-amount"
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
                    data-testid="input-link-amount"
                  />
                  <p className="text-xs text-muted-foreground">
                    Montant minimum: 100 XOF
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="redirect-url" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  URL de redirection (optionnel)
                </Label>
                <Input
                  id="redirect-url"
                  type="url"
                  placeholder="https://example.com/merci"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  data-testid="input-redirect-url"
                />
                <p className="text-xs text-muted-foreground">
                  Après le paiement, le client sera redirigé vers cette URL
                </p>
              </div>

              <div className="rounded-md bg-muted/50 p-4">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <span data-testid="text-encaissement-info">
                    Des frais d'encaissement de {encaissementRate}% seront appliqu\u00e9s sur chaque paiement re\u00e7u via ce lien.
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setLocation("/dashboard/payment-links")}
                  data-testid="button-cancel"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createLinkMutation.isPending || isUploading}
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
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
