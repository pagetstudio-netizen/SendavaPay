import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Key, Shield, Code2, Loader2, Copy, Check, Trash2, Plus, ExternalLink, Wrench, ArrowLeft } from "lucide-react";
import type { ApiKey } from "@shared/schema";

export default function ApiKeysPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [newKeyName, setNewKeyName] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { data: maintenanceStatus, isLoading: maintenanceLoading } = useQuery<{ enabled: boolean }>({
    queryKey: ['/api/api-maintenance-status'],
    refetchInterval: 10000,
  });

  const { data: apiKeys = [], isLoading: keysLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/api-keys"],
    enabled: !!user?.isVerified && !maintenanceStatus?.enabled,
  });

  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/api-keys", { name });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      setNewKeyName("");
      toast({ title: "Clé créée", description: "Votre nouvelle clé API a été créée" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer la clé", variant: "destructive" });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({ title: "Clé supprimée" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer la clé", variant: "destructive" });
    },
  });

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast({ title: "Copié" });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast({ title: "Erreur", description: "Veuillez entrer un nom pour la clé", variant: "destructive" });
      return;
    }
    createKeyMutation.mutate(newKeyName.trim());
  };

  if (authLoading || maintenanceLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (maintenanceStatus?.enabled) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <Card className="max-w-lg w-full text-center">
            <CardHeader>
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Wrench className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-2xl">API en maintenance</CardTitle>
              <CardDescription className="text-base">
                L'API et la gestion des clés sont temporairement indisponibles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Nous effectuons actuellement des travaux de maintenance sur notre API. 
                Veuillez réessayer dans quelques instants.
              </p>
              <Link href="/dashboard">
                <Button variant="outline" data-testid="button-back-dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour au tableau de bord
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!user?.isVerified) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-bold">API de Paiement</h1>
            <p className="text-muted-foreground">
              Intégrez SendavaPay dans vos applications
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-yellow-500" />
                Vérification requise
              </CardTitle>
              <CardDescription>
                Votre compte doit être vérifié pour accéder à l'API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Pour des raisons de sécurité, seuls les comptes vérifiés peuvent accéder à l'API SendavaPay. 
                Complétez votre vérification KYC pour obtenir vos clés API.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/dashboard/kyc">
                  <Button data-testid="button-verify-account">
                    <Shield className="h-4 w-4 mr-2" />
                    Vérifier mon compte
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button variant="outline" data-testid="button-view-docs">
                    <Code2 className="h-4 w-4 mr-2" />
                    Voir la documentation
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Clés API</h1>
            <p className="text-muted-foreground">
              Gérez vos clés d'accès à l'API SendavaPay
            </p>
          </div>
          <Link href="/docs">
            <Button variant="outline" data-testid="button-docs">
              <Code2 className="h-4 w-4 mr-2" />
              Documentation
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Créer une nouvelle clé
            </CardTitle>
            <CardDescription>
              Donnez un nom à votre clé pour l'identifier facilement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="keyName" className="sr-only">Nom de la clé</Label>
                <Input
                  id="keyName"
                  placeholder="Ex: Mon site e-commerce"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateKey()}
                  data-testid="input-key-name"
                />
              </div>
              <Button 
                onClick={handleCreateKey} 
                disabled={createKeyMutation.isPending}
                data-testid="button-create-key"
              >
                {createKeyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Key className="h-4 w-4 mr-2" />
                )}
                Générer
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Mes clés API
            </CardTitle>
            <CardDescription>
              {apiKeys.length} clé{apiKeys.length !== 1 ? "s" : ""} active{apiKeys.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {keysLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucune clé API créée</p>
                <p className="text-sm">Créez votre première clé pour commencer à utiliser l'API</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div 
                    key={key.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg"
                    data-testid={`api-key-${key.id}`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{key.name}</span>
                        <Badge variant={key.isActive ? "default" : "secondary"}>
                          {key.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <code className="text-sm text-muted-foreground font-mono block truncate">
                        {key.apiKey}
                      </code>
                      <p className="text-xs text-muted-foreground">
                        Créée le {new Date(key.createdAt).toLocaleDateString("fr-FR")}
                        {key.requestCount > 0 && ` • ${key.requestCount} requêtes`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(key.apiKey)}
                        data-testid={`button-copy-${key.id}`}
                      >
                        {copiedKey === key.apiKey ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteKeyMutation.mutate(key.id)}
                        disabled={deleteKeyMutation.isPending}
                        data-testid={`button-delete-${key.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comment utiliser l'API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Incluez votre clé API dans l'en-tête de chaque requête:
            </p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>Authorization: Bearer VOTRE_CLE_API</code>
            </pre>
            <Link href="/docs">
              <Button variant="ghost" className="p-0 h-auto" data-testid="link-full-docs">
                Voir la documentation complète →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
