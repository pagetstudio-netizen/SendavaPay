import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Ban, Plus, Unlock, Shield, AlertTriangle, RefreshCw } from "lucide-react";
import type { PhoneBlacklist, BlacklistLog } from "@shared/schema";

function formatDate(date: string | Date) {
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  add: { label: "Ajout", color: "destructive" },
  remove: { label: "Suppression", color: "default" },
  attempt_remove: { label: "Tentative déblocage", color: "secondary" },
  otp_sent: { label: "OTP envoyé", color: "secondary" },
  otp_confirmed: { label: "OTP confirmé", color: "default" },
  otp_failed: { label: "OTP échoué", color: "destructive" },
};

export default function AdminBlacklistPage() {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [unlockId, setUnlockId] = useState<number | null>(null);
  const [unlockEntry, setUnlockEntry] = useState<PhoneBlacklist | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const { data: entries = [], isLoading } = useQuery<PhoneBlacklist[]>({
    queryKey: ["/api/admin/blacklist"],
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery<BlacklistLog[]>({
    queryKey: ["/api/admin/blacklist/logs"],
  });

  const addMutation = useMutation({
    mutationFn: (data: { phoneNumber: string; reason: string; notes: string }) =>
      apiRequest("POST", "/api/admin/blacklist", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blacklist"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blacklist/logs"] });
      setAddOpen(false);
      setNewPhone(""); setNewReason(""); setNewNotes("");
      toast({ title: "Numéro blacklisté", description: "Le numéro a été ajouté à la liste noire." });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err?.message || "Impossible d'ajouter ce numéro.", variant: "destructive" });
    },
  });

  const requestUnblockMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("POST", `/api/admin/blacklist/${id}/request-unblock`),
    onSuccess: () => {
      setOtpSent(true);
      toast({ title: "Code envoyé", description: "Un code de sécurité a été envoyé sur Telegram." });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err?.message || "Impossible d'envoyer le code.", variant: "destructive" });
    },
  });

  const confirmUnblockMutation = useMutation({
    mutationFn: ({ id, code }: { id: number; code: string }) =>
      apiRequest("POST", `/api/admin/blacklist/${id}/confirm-unblock`, { code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blacklist"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blacklist/logs"] });
      closeUnlockDialog();
      toast({ title: "Numéro débloqué", description: "Le numéro a été retiré de la liste noire." });
    },
    onError: (err: any) => {
      toast({ title: "Code invalide", description: err?.message || "Code incorrect ou expiré.", variant: "destructive" });
    },
  });

  function openUnlockDialog(entry: PhoneBlacklist) {
    setUnlockEntry(entry);
    setUnlockId(entry.id);
    setOtpSent(false);
    setOtpCode("");
  }

  function closeUnlockDialog() {
    setUnlockId(null);
    setUnlockEntry(null);
    setOtpSent(false);
    setOtpCode("");
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Ban className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Blacklist</h1>
              <p className="text-sm text-muted-foreground">Gérez les numéros bloqués sur la plateforme</p>
            </div>
          </div>
          <Button onClick={() => setAddOpen(true)} data-testid="button-add-blacklist">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un numéro
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Ban className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold" data-testid="text-blacklist-count">{entries.length}</p>
                <p className="text-sm text-muted-foreground">Numéros blacklistés</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{logs.length}</p>
                <p className="text-sm text-muted-foreground">Entrées dans les logs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{logs.filter(l => l.action === "attempt_remove").length}</p>
                <p className="text-sm text-muted-foreground">Tentatives de déblocage</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="blacklist">
          <TabsList>
            <TabsTrigger value="blacklist" data-testid="tab-blacklist">Numéros blacklistés ({entries.length})</TabsTrigger>
            <TabsTrigger value="logs" data-testid="tab-logs">Journal d'audit ({logs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="blacklist">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center text-muted-foreground">Chargement...</div>
                ) : entries.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Ban className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Aucun numéro blacklisté</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Numéro</TableHead>
                        <TableHead>Raison</TableHead>
                        <TableHead>Ajouté par</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map(entry => (
                        <TableRow key={entry.id} data-testid={`row-blacklist-${entry.id}`}>
                          <TableCell>
                            <code className="font-mono font-bold text-destructive">{entry.phoneNumber}</code>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{entry.reason || <span className="text-muted-foreground italic">Non spécifiée</span>}</TableCell>
                          <TableCell>{entry.addedByName || "-"}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{formatDate(entry.createdAt)}</TableCell>
                          <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">{entry.notes || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openUnlockDialog(entry)}
                              data-testid={`button-unlock-${entry.id}`}
                            >
                              <Unlock className="h-3 w-3 mr-1" />
                              Débloquer
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

          <TabsContent value="logs">
            <Card>
              <CardContent className="p-0">
                {logsLoading ? (
                  <div className="p-8 text-center text-muted-foreground">Chargement...</div>
                ) : logs.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">Aucun log disponible</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Numéro</TableHead>
                        <TableHead>Administrateur</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Détails</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map(log => {
                        const meta = ACTION_LABELS[log.action] || { label: log.action, color: "secondary" };
                        return (
                          <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                            <TableCell>
                              <Badge variant={meta.color as any}>{meta.label}</Badge>
                            </TableCell>
                            <TableCell><code className="font-mono text-sm">{log.phoneNumber}</code></TableCell>
                            <TableCell>{log.adminName || "-"}</TableCell>
                            <TableCell className="text-muted-foreground text-sm font-mono">{log.ipAddress || "-"}</TableCell>
                            <TableCell className="max-w-[200px] truncate text-sm">{log.details || "-"}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{formatDate(log.createdAt)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Blacklister un numéro</DialogTitle>
            <DialogDescription>
              Ce numéro sera immédiatement bloqué. Toutes les transactions (dépôts, retraits) seront refusées.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Numéro de téléphone *</Label>
              <Input
                id="phone"
                placeholder="Ex: +22507000000"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                data-testid="input-blacklist-phone"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reason">Raison</Label>
              <Input
                id="reason"
                placeholder="Ex: Fraude, arnaque..."
                value={newReason}
                onChange={e => setNewReason(e.target.value)}
                data-testid="input-blacklist-reason"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes internes</Label>
              <Textarea
                id="notes"
                placeholder="Notes supplémentaires..."
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                rows={3}
                data-testid="input-blacklist-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Annuler</Button>
            <Button
              variant="destructive"
              disabled={!newPhone.trim() || addMutation.isPending}
              onClick={() => addMutation.mutate({ phoneNumber: newPhone, reason: newReason, notes: newNotes })}
              data-testid="button-confirm-blacklist"
            >
              {addMutation.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Ban className="h-4 w-4 mr-2" />}
              Blacklister
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unblock dialog */}
      <Dialog open={!!unlockId} onOpenChange={open => { if (!open) closeUnlockDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Débloquer un numéro</DialogTitle>
            <DialogDescription>
              {!otpSent
                ? <>Cette action est protégée. Un code de sécurité sera envoyé sur <strong>Telegram</strong>. Vous devrez le saisir pour confirmer le déblocage.</>
                : <>Entrez le code de sécurité reçu sur Telegram pour débloquer <strong>{unlockEntry?.phoneNumber}</strong>.</>
              }
            </DialogDescription>
          </DialogHeader>

          {!otpSent ? (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-600 dark:text-yellow-400">Attention</p>
                <p className="text-muted-foreground mt-1">Cette action sera enregistrée et notifiée aux administrateurs. Assurez-vous d'avoir une bonne raison de débloquer ce numéro.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="otp-code">Code de sécurité (6 chiffres)</Label>
              <Input
                id="otp-code"
                placeholder="000000"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="font-mono text-xl text-center tracking-widest"
                data-testid="input-otp-code"
              />
              <p className="text-xs text-muted-foreground">Ce code expire dans 15 minutes</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeUnlockDialog}>Annuler</Button>
            {!otpSent ? (
              <Button
                variant="destructive"
                disabled={requestUnblockMutation.isPending}
                onClick={() => requestUnblockMutation.mutate(unlockId!)}
                data-testid="button-request-otp"
              >
                {requestUnblockMutation.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                Recevoir le code Telegram
              </Button>
            ) : (
              <Button
                variant="destructive"
                disabled={otpCode.length !== 6 || confirmUnblockMutation.isPending}
                onClick={() => confirmUnblockMutation.mutate({ id: unlockId!, code: otpCode })}
                data-testid="button-confirm-unblock"
              >
                {confirmUnblockMutation.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Unlock className="h-4 w-4 mr-2" />}
                Confirmer le déblocage
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
