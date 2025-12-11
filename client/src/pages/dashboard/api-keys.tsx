import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Loader2,
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  FileText,
} from "lucide-react";
import { Link } from "wouter";
import type { ApiKey } from "@shared/schema";

function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function ApiKeysPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());

  const { data: apiKeys, isLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/api-keys"],
  });

  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/api-keys", { name });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Clé API créée",
        description: "Copiez et conservez votre clé en lieu sûr.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      setIsDialogOpen(false);
      setKeyName("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/api-keys/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Clé supprimée",
        description: "La clé API a été révoquée.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: "Clé copiée",
      description: "La clé API a été copiée dans le presse-papiers.",
    });
  };

  const toggleKeyVisibility = (id: number) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(id)) {
      newVisibleKeys.delete(id);
    } else {
      newVisibleKeys.add(id);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const maskKey = (key: string) => {
    return key.slice(0, 8) + "..." + key.slice(-4);
  };

  if (!user?.isVerified) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30">
            <CardContent className="p-12 text-center">
              <Shield className="h-16 w-16 mx-auto mb-4 text-orange-500" />
              <h2 className="text-xl font-semibold text-orange-800 dark:text-orange-200 mb-2">
                Compte non vérifié
              </h2>
              <p className="text-orange-600 dark:text-orange-300 mb-6 max-w-md mx-auto">
                Votre compte n'est pas encore vérifié. Veuillez vérifier votre compte afin d'utiliser 
                nos services de paiement sécurisés. Un compte non vérifié ne peut pas utiliser l'API.
              </p>
              <Link href="/dashboard/kyc">
                <Button data-testid="button-verify-for-api">
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
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Key className="h-6 w-6" />
              Clés API
            </h1>
            <p className="text-muted-foreground">Gérez vos clés API pour l'intégration</p>
          </div>
          <div className="flex gap-2">
            <Link href="/api-docs">
              <Button variant="outline" data-testid="button-api-docs">
                <FileText className="h-4 w-4 mr-2" />
                Documentation
              </Button>
            </Link>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-api-key">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une clé
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer une clé API</DialogTitle>
                  <DialogDescription>
                    Donnez un nom à votre clé pour l'identifier facilement
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (keyName.trim()) {
                      createKeyMutation.mutate(keyName.trim());
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="keyName">Nom de la clé</Label>
                    <Input
                      id="keyName"
                      placeholder="Ex: Production, Test, Mon site..."
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      data-testid="input-api-key-name"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createKeyMutation.isPending || !keyName.trim()}
                    data-testid="button-submit-api-key"
                  >
                    {createKeyMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      "Créer la clé"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-9 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !apiKeys?.length ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Key className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Aucune clé API</h3>
              <p className="text-muted-foreground mb-6">
                Créez votre première clé API pour intégrer SendavaPay à vos applications
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une clé
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <Card key={apiKey.id} data-testid={`api-key-${apiKey.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{apiKey.name}</h3>
                        <Badge variant={apiKey.isActive ? "default" : "secondary"}>
                          {apiKey.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                          {visibleKeys.has(apiKey.id) ? apiKey.apiKey : maskKey(apiKey.apiKey)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                          data-testid={`button-toggle-key-${apiKey.id}`}
                        >
                          {visibleKeys.has(apiKey.id) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyKey(apiKey.apiKey)}
                          data-testid={`button-copy-key-${apiKey.id}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Créée le {formatDate(apiKey.createdAt)} | {apiKey.requestCount} requêtes
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-key-${apiKey.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cette clé API ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. Toutes les applications utilisant cette clé
                            ne pourront plus accéder à l'API.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteKeyMutation.mutate(apiKey.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Sécurité des clés API</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Ne partagez jamais vos clés API publiquement</li>
              <li>Utilisez des clés différentes pour le test et la production</li>
              <li>Régénérez vos clés régulièrement pour plus de sécurité</li>
              <li>Consultez la documentation pour les bonnes pratiques</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
