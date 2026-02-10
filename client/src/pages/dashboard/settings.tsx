import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Loader2,
  User,
  Mail,
  Phone,
  Lock,
  CheckCircle,
  Shield,
  Eye,
  EyeOff,
  Store,
} from "lucide-react";
import { Link } from "wouter";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [merchantName, setMerchantName] = useState(user?.merchantName || "");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const updateMerchantNameMutation = useMutation({
    mutationFn: async (data: { merchantName: string }) => {
      const res = await apiRequest("PUT", "/api/user/merchant-name", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Nom marchand mis à jour",
        description: "Votre nom marchand a été modifié avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleMerchantNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantName.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez entrer un nom marchand.",
        variant: "destructive",
      });
      return;
    }
    updateMerchantNameMutation.mutate({ merchantName: merchantName.trim() });
  };

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("PUT", "/api/user/password", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Mot de passe mis à jour",
        description: "Votre mot de passe a été modifié avec succès.",
      });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Mot de passe trop court",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Mots de passe différents",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    updatePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Paramètres du compte</h1>
          <p className="text-muted-foreground">Gérez vos informations personnelles</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
            <CardDescription>Vos informations de profil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Nom complet</Label>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span data-testid="text-settings-name">{user?.fullName}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Statut du compte</Label>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                  {user?.isVerified ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <Badge variant="secondary" className="text-green-600 bg-green-100 dark:bg-green-900/30">
                        Vérifié
                      </Badge>
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 text-orange-500" />
                      <Badge variant="secondary" className="text-orange-600 bg-orange-100 dark:bg-orange-900/30">
                        Non vérifié
                      </Badge>
                      <Link href="/dashboard/kyc">
                        <Button variant="link" size="sm" className="p-0 h-auto">
                          Vérifier
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Email</Label>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span data-testid="text-settings-email">{user?.email}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Téléphone</Label>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span data-testid="text-settings-phone">{user?.phone}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Nom marchand
            </CardTitle>
            <CardDescription>
              Ce nom sera affiché sur vos pages de paiement (liens de paiement)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMerchantNameSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="merchantName">Nom marchand / entreprise</Label>
                <Input
                  id="merchantName"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="Ex: Ma Boutique, MonSite.com"
                  maxLength={100}
                  data-testid="input-merchant-name"
                />
                <p className="text-xs text-muted-foreground">
                  Ce nom apparaîtra sur les pages de paiement au lieu de votre nom complet
                </p>
              </div>
              <Button
                type="submit"
                disabled={updateMerchantNameMutation.isPending}
                data-testid="button-update-merchant-name"
              >
                {updateMerchantNameMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  "Enregistrer le nom marchand"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Sécurité
            </CardTitle>
            <CardDescription>Modifier votre mot de passe</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    data-testid="input-current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    data-testid="input-new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  data-testid="input-confirm-new-password"
                />
              </div>

              <Button
                type="submit"
                disabled={updatePasswordMutation.isPending}
                data-testid="button-update-password"
              >
                {updatePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  "Mettre à jour le mot de passe"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations du compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">ID du compte</span>
              <code className="text-sm bg-muted px-2 py-1 rounded" data-testid="text-account-id">
                {user?.id}
              </code>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Date d'inscription</span>
              <span data-testid="text-created-at">
                {user?.createdAt
                  ? new Intl.DateTimeFormat("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    }).format(new Date(user.createdAt))
                  : "-"}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Rôle</span>
              <Badge variant="secondary">
                {user?.role === "admin" ? "Administrateur" : "Utilisateur"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
