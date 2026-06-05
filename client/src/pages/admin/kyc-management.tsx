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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserX, RotateCcw, Archive, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <UserX className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Gestion KYC</h1>
            <p className="text-sm text-muted-foreground">Réinitialisez ou archivez les dossiers KYC vérifiés</p>
          </div>
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
          <div className="space-y-4">
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
    </AdminLayout>
  );
}
