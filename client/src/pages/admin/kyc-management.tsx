import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  UserX, RotateCcw, Archive, AlertTriangle, CheckCircle2,
  RefreshCw, Trash2, Send, ShieldCheck, HardDrive, FileImage,
} from "lucide-react";
import type { KycRequest, User } from "@shared/schema";

type KycWithUser = KycRequest & { user?: User };

function formatDate(date: string | Date | null | undefined) {
  if (!date) return "-";
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function KycTypeLabel({ type }: { type: string }) {
  const labels: Record<string, string> = {
    national_id: "Carte nationale",
    passport: "Passeport",
    driver_license: "Permis de conduire",
    residence_permit: "Titre de séjour",
  };
  return <span>{labels[type] || type}</span>;
}

export default function AdminKycManagementPage() {
  const { toast } = useToast();
  const [resetTarget, setResetTarget] = useState<KycWithUser | null>(null);

  // Cleanup OTP flow state
  const [cleanupStep, setCleanupStep] = useState<"idle" | "confirm" | "otp">("idle");
  const [otpToken, setOtpToken] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const { data: storageStats, isLoading: statsLoading, refetch: refetchStats } = useQuery<{
    count: number | null; sizeKb: number | null; configured: boolean;
  }>({
    queryKey: ["/api/admin/kyc-management/storage-stats"],
    enabled: cleanupStep === "confirm",
    staleTime: 0,
  });

  const { data: approved = [], isLoading: approvedLoading } = useQuery<KycWithUser[]>({
    queryKey: ["/api/admin/kyc-management"],
  });

  const { data: archived = [], isLoading: archivedLoading } = useQuery<KycWithUser[]>({
    queryKey: ["/api/admin/kyc-management/archived"],
  });

  const resetMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("POST", `/api/admin/kyc-management/${id}/reset`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc-management"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc-management/archived"] });
      setResetTarget(null);
      toast({ title: "KYC réinitialisé", description: "Le statut KYC a été remis à 'Non vérifié'." });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err?.message || "Impossible de réinitialiser ce KYC.", variant: "destructive" });
    },
  });

  // Step 1 — request OTP via Telegram
  const requestOtpMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/kyc-management/cleanup-storage/request-otp");
      return res.json();
    },
    onSuccess: (data: any) => {
      setOtpToken(data.token);
      setOtpCode("");
      setCleanupStep("otp");
      toast({
        title: "Code envoyé sur Telegram",
        description: "Consultez le groupe administrateur Telegram et saisissez le code reçu.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Erreur",
        description: err?.message || "Impossible d'envoyer le code Telegram.",
        variant: "destructive",
      });
    },
  });

  // Step 2 — confirm with OTP and execute cleanup
  const confirmCleanupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/kyc-management/cleanup-storage/confirm", {
        token: otpToken,
        code: otpCode.trim(),
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      setCleanupStep("idle");
      setOtpToken("");
      setOtpCode("");
      toast({
        title: "Nettoyage terminé ✅",
        description: data?.message || "Les fichiers KYC ont été supprimés du stockage Supabase.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Code invalide",
        description: err?.message || "Le code saisi est incorrect ou expiré.",
        variant: "destructive",
      });
    },
  });

  function closeCleanupDialog() {
    if (requestOtpMutation.isPending || confirmCleanupMutation.isPending) return;
    setCleanupStep("idle");
    setOtpToken("");
    setOtpCode("");
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <UserX className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Gestion KYC</h1>
              <p className="text-sm text-muted-foreground">Réinitialisez ou archivez les dossiers KYC vérifiés</p>
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setCleanupStep("confirm")}
            data-testid="button-cleanup-kyc-storage"
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Libérer l'espace Supabase
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold" data-testid="text-approved-count">{approved.length}</p>
                <p className="text-sm text-muted-foreground">KYC vérifiés actifs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Archive className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold" data-testid="text-archived-count">{archived.length}</p>
                <p className="text-sm text-muted-foreground">KYC archivés</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-yellow-600 dark:text-yellow-400">Politique de conservation des documents</p>
            <p className="text-muted-foreground mt-1">Les documents KYC ne sont jamais supprimés définitivement. Toute réinitialisation archive le dossier et notifie les administrateurs via Telegram. L'utilisateur devra soumettre un nouveau dossier.</p>
          </div>
        </div>

        <Tabs defaultValue="approved">
          <TabsList>
            <TabsTrigger value="approved" data-testid="tab-approved">KYC vérifiés ({approved.length})</TabsTrigger>
            <TabsTrigger value="archived" data-testid="tab-archived">Archivés ({archived.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="approved">
            <Card>
              <CardContent className="p-0">
                {approvedLoading ? (
                  <div className="p-8 text-center text-muted-foreground">Chargement...</div>
                ) : approved.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Aucun KYC vérifié actif</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Type de document</TableHead>
                        <TableHead>Vérifié le</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approved.map(record => (
                        <TableRow key={record.id} data-testid={`row-kyc-${record.id}`}>
                          <TableCell className="font-medium">{record.user?.fullName || `#${record.userId}`}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{record.user?.email || "-"}</TableCell>
                          <TableCell><KycTypeLabel type={record.documentType} /></TableCell>
                          <TableCell className="text-muted-foreground text-sm">{formatDate(record.reviewedAt)}</TableCell>
                          <TableCell><Badge className="bg-green-500/10 text-green-600 border-green-500/20">Vérifié</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950"
                              onClick={() => setResetTarget(record)}
                              data-testid={`button-reset-kyc-${record.id}`}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Réinitialiser
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="archived">
            <Card>
              <CardContent className="p-0">
                {archivedLoading ? (
                  <div className="p-8 text-center text-muted-foreground">Chargement...</div>
                ) : archived.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Archive className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Aucun KYC archivé</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Type de document</TableHead>
                        <TableHead>Raison de réinitialisation</TableHead>
                        <TableHead>Archivé le</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archived.map(record => (
                        <TableRow key={record.id} data-testid={`row-archived-kyc-${record.id}`}>
                          <TableCell className="font-medium">{record.user?.fullName || `#${record.userId}`}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{record.user?.email || "-"}</TableCell>
                          <TableCell><KycTypeLabel type={record.documentType} /></TableCell>
                          <TableCell className="max-w-[250px] truncate text-sm text-muted-foreground">{record.rejectionReason || "-"}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{formatDate(record.reviewedAt)}</TableCell>
                          <TableCell><Badge variant="secondary">Archivé</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Reset confirmation dialog */}
      <Dialog open={!!resetTarget} onOpenChange={open => { if (!open) setResetTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser le KYC</DialogTitle>
            <DialogDescription>
              Cette action va supprimer le statut "Vérifié" de l'utilisateur{" "}
              <strong>{resetTarget?.user?.fullName || `#${resetTarget?.userId}`}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-orange-600 dark:text-orange-400">Conséquences de cette action</p>
              <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
                <li>Le compte sera marqué comme "Non vérifié"</li>
                <li>L'utilisateur ne pourra plus effectuer de retraits</li>
                <li>Le dossier KYC sera archivé (jamais supprimé)</li>
                <li>Une notification Telegram sera envoyée</li>
                <li>L'utilisateur devra soumettre un nouveau dossier</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>Annuler</Button>
            <Button
              variant="destructive"
              disabled={resetMutation.isPending}
              onClick={() => resetTarget && resetMutation.mutate(resetTarget.id)}
              data-testid="button-confirm-reset-kyc"
            >
              {resetMutation.isPending
                ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                : <RotateCcw className="h-4 w-4 mr-2" />
              }
              Confirmer la réinitialisation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step 1 — Cleanup confirmation dialog */}
      <Dialog open={cleanupStep === "confirm"} onOpenChange={open => { if (!open) closeCleanupDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Libérer l'espace Supabase
            </DialogTitle>
            <DialogDescription>
              Cette action supprimera tous les fichiers photos KYC de Supabase Storage.
              Un code de confirmation vous sera envoyé sur Telegram.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Storage stats counter */}
            <div className="rounded-lg border bg-muted/40 p-4">
              <div className="flex items-center gap-2 mb-3">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Espace occupé actuellement</p>
                <button
                  onClick={() => refetchStats()}
                  className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
                  title="Actualiser"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${statsLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
              {statsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Calcul en cours...
                </div>
              ) : !storageStats?.configured ? (
                <p className="text-sm text-muted-foreground italic">Stockage Supabase non configuré</p>
              ) : (
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <FileImage className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold" data-testid="text-storage-file-count">
                        {storageStats.count ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground">fichiers</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold" data-testid="text-storage-size">
                        {storageStats.sizeKb && storageStats.sizeKb > 1024
                          ? `${(storageStats.sizeKb / 1024).toFixed(1)} Mo`
                          : `${storageStats.sizeKb ?? 0} Ko`}
                      </p>
                      <p className="text-xs text-muted-foreground">utilisés</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Ce qui sera supprimé</p>
                <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Toutes les photos de pièces d'identité (recto/verso)</li>
                  <li>Toutes les photos selfie des vérifications KYC</li>
                </ul>
              </div>
            </div>
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-700 dark:text-green-400">Ce qui est conservé</p>
                <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Tous les utilisateurs et leurs comptes</li>
                  <li>Toutes les transactions</li>
                  <li>Les statuts KYC (approuvé/rejeté)</li>
                  <li>Toutes les données de la base</li>
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeCleanupDialog}>Annuler</Button>
            <Button
              variant="destructive"
              disabled={requestOtpMutation.isPending}
              onClick={() => requestOtpMutation.mutate()}
              data-testid="button-send-cleanup-otp"
            >
              {requestOtpMutation.isPending
                ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Envoi en cours...</>
                : <><Send className="h-4 w-4 mr-2" />Recevoir le code sur Telegram</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step 2 — OTP entry dialog */}
      <Dialog open={cleanupStep === "otp"} onOpenChange={open => { if (!open) closeCleanupDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-500" />
              Vérification Telegram requise
            </DialogTitle>
            <DialogDescription>
              Un code de 6 chiffres a été envoyé dans votre groupe administrateur Telegram.
              Saisissez-le ci-dessous pour confirmer le nettoyage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 flex gap-2 items-center text-sm">
              <Send className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span className="text-blue-700 dark:text-blue-300">
                Consultez le groupe Telegram administrateur — le code expire dans <strong>10 minutes</strong>.
              </span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp-code">Code de confirmation</Label>
              <Input
                id="otp-code"
                placeholder="123456"
                maxLength={6}
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl font-mono tracking-[0.5em] h-14"
                data-testid="input-cleanup-otp-code"
                onKeyDown={e => {
                  if (e.key === "Enter" && otpCode.length === 6) {
                    confirmCleanupMutation.mutate();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeCleanupDialog} disabled={confirmCleanupMutation.isPending}>
              Annuler
            </Button>
            <Button
              variant="outline"
              onClick={() => { setCleanupStep("confirm"); setOtpCode(""); }}
              disabled={confirmCleanupMutation.isPending}
            >
              Renvoyer le code
            </Button>
            <Button
              variant="destructive"
              disabled={confirmCleanupMutation.isPending || otpCode.length !== 6}
              onClick={() => confirmCleanupMutation.mutate()}
              data-testid="button-confirm-cleanup-otp"
            >
              {confirmCleanupMutation.isPending
                ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Vérification...</>
                : <><Trash2 className="h-4 w-4 mr-2" />Confirmer le nettoyage</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
