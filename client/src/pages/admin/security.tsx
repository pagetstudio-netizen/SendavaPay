import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Shield, Ban, Check, RefreshCw, AlertTriangle, Lock, Activity, Loader2, ShieldCheck, Trash2, FileDown, Users, Mail } from "lucide-react";

interface BlockedIp {
  id: number;
  ip_address: string;
  reason: string | null;
  created_at: string;
  expires_at: string | null;
}

interface AllowedIp {
  id: number;
  ip_address: string;
  label: string | null;
  created_at: string;
}

interface SecurityEvent {
  id: number;
  userId: number | null;
  type: string;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface LoginAttempt {
  id: number;
  email_or_phone: string;
  ip_address: string | null;
  success: boolean;
  created_at: string;
}

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  failed_login: { label: "Connexion échouée", color: "text-red-600 bg-red-50 dark:bg-red-950/30" },
  brute_force: { label: "Force brute", color: "text-red-700 bg-red-100 dark:bg-red-950/50" },
  admin_login_success: { label: "Admin connecté", color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
  admin_login_otp_sent: { label: "OTP admin envoyé", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
  admin_otp_failed: { label: "OTP admin échoué", color: "text-orange-600 bg-orange-50" },
  withdrawal_otp_sent: { label: "OTP retrait envoyé", color: "text-purple-600 bg-purple-50" },
  withdrawal_otp_failed: { label: "OTP retrait échoué", color: "text-red-600 bg-red-50" },
  non_africa_admin_access: { label: "Accès hors-Afrique", color: "text-red-700 bg-red-100" },
  ip_whitelisted: { label: "IP autorisée", color: "text-green-700 bg-green-100 dark:bg-green-950/40" },
  ip_whitelist_removed: { label: "IP retirée whitelist", color: "text-orange-600 bg-orange-50" },
  ip_blocked_admin: { label: "IP bloquée (admin)", color: "text-red-600 bg-red-50" },
  ip_unblocked_admin: { label: "IP débloquée", color: "text-green-600 bg-green-50" },
  vpn_blocked: { label: "VPN bloqué", color: "text-red-700 bg-red-100" },
  geo_blocked: { label: "Pays bloqué", color: "text-orange-700 bg-orange-100" },
};

export default function SecurityDashboard() {
  const { toast } = useToast();
  const [newBlockIp, setNewBlockIp] = useState("");
  const [newBlockReason, setNewBlockReason] = useState("");
  const [newAllowIp, setNewAllowIp] = useState("");
  const [newAllowLabel, setNewAllowLabel] = useState("");

  // ── Export PDF state ────────────────────────────────────────────────────────
  const [exportStep, setExportStep]   = useState<"idle" | "otp">("idle");
  const [exportToken, setExportToken] = useState("");
  const [exportCode, setExportCode]   = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  const { data: blockedIps = [], isLoading: ipsLoading } = useQuery<BlockedIp[]>({
    queryKey: ["/api/admin/security/blocked-ips"],
  });

  const { data: allowedIps = [], isLoading: allowedLoading } = useQuery<AllowedIp[]>({
    queryKey: ["/api/admin/security/allowed-ips"],
  });

  const { data: securityEvents = [], isLoading: eventsLoading } = useQuery<SecurityEvent[]>({
    queryKey: ["/api/admin/security/events"],
  });

  const { data: loginAttempts = [], isLoading: attemptsLoading } = useQuery<LoginAttempt[]>({
    queryKey: ["/api/admin/security/login-attempts"],
  });

  const blockMutation = useMutation({
    mutationFn: async ({ ip, reason }: { ip: string; reason: string }) => {
      const res = await apiRequest("POST", "/api/admin/security/block-ip", { ip, reason });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "IP bloquée", description: `${newBlockIp} a été bloquée.` });
      setNewBlockIp(""); setNewBlockReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security/blocked-ips"] });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const unblockMutation = useMutation({
    mutationFn: async (ip: string) => {
      const res = await apiRequest("DELETE", `/api/admin/security/block-ip/${encodeURIComponent(ip)}`);
      return res.json();
    },
    onSuccess: (_, ip) => {
      toast({ title: "IP débloquée", description: `${ip} a été débloquée.` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security/blocked-ips"] });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const allowMutation = useMutation({
    mutationFn: async ({ ip, label }: { ip: string; label: string }) => {
      const res = await apiRequest("POST", "/api/admin/security/allow-ip", { ip, label });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "IP autorisée", description: `${newAllowIp} ne sera plus jamais bloquée.` });
      setNewAllowIp(""); setNewAllowLabel("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security/allowed-ips"] });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const removeAllowMutation = useMutation({
    mutationFn: async (ip: string) => {
      const res = await apiRequest("DELETE", `/api/admin/security/allow-ip/${encodeURIComponent(ip)}`);
      return res.json();
    },
    onSuccess: (_, ip) => {
      toast({ title: "IP retirée", description: `${ip} n'est plus dans la liste blanche.` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security/allowed-ips"] });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const failedToday = securityEvents.filter(e => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(e.created_at) >= today && (e.type === "failed_login" || e.type === "brute_force");
  }).length;

  const recentAttempts = loginAttempts.filter(a => {
    const h1 = new Date(Date.now() - 60 * 60 * 1000);
    return new Date(a.created_at) >= h1;
  });

  const formatDate = (d: string) => new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date(d));

  // ── Export PDF handlers ──────────────────────────────────────────────────────
  async function handleRequestExportOtp() {
    setExportLoading(true);
    try {
      const res = await apiRequest("POST", "/api/admin/export-report/request-otp");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");
      setExportToken(data.token);
      setExportCode("");
      setExportStep("otp");
      toast({ title: "Code envoyé", description: "Vérifiez votre email administrateur." });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setExportLoading(false);
    }
  }

  async function handleDownloadPdf() {
    if (!exportCode.trim()) {
      toast({ title: "Code requis", description: "Entrez le code reçu par email.", variant: "destructive" });
      return;
    }
    setExportLoading(true);
    try {
      const res = await fetch("/api/admin/export-report/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: exportToken, code: exportCode.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Erreur inconnue" }));
        throw new Error(err.message);
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const now  = new Date();
      const date = `${now.getDate().toString().padStart(2,"0")}-${(now.getMonth()+1).toString().padStart(2,"0")}-${now.getFullYear()}`;
      a.href     = url;
      a.download = `sendavapay-users-${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportStep("idle");
      setExportToken("");
      setExportCode("");
      toast({ title: "Téléchargement démarré", description: "Le rapport PDF est en cours de téléchargement." });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setExportLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Sécurité</h1>
            <p className="text-muted-foreground text-sm">Surveillance et protection de la plateforme</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600 mb-1"><AlertTriangle className="h-4 w-4" /><span className="text-xs font-medium">Échecs aujourd'hui</span></div>
              <div className="text-2xl font-bold">{failedToday}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-orange-600 mb-1"><Ban className="h-4 w-4" /><span className="text-xs font-medium">IPs bloquées</span></div>
              <div className="text-2xl font-bold">{blockedIps.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-600 mb-1"><ShieldCheck className="h-4 w-4" /><span className="text-xs font-medium">IPs autorisées</span></div>
              <div className="text-2xl font-bold">{allowedIps.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1"><Activity className="h-4 w-4" /><span className="text-xs font-medium">Événements (24h)</span></div>
              <div className="text-2xl font-bold">{securityEvents.filter(e => new Date(e.created_at) >= new Date(Date.now() - 86400000)).length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="whitelist">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="whitelist"><Lock className="h-3.5 w-3.5 mr-1.5" />Whitelist</TabsTrigger>
            <TabsTrigger value="blocked"><Ban className="h-3.5 w-3.5 mr-1.5" />IPs bloquées</TabsTrigger>
            <TabsTrigger value="events"><Activity className="h-3.5 w-3.5 mr-1.5" />Événements</TabsTrigger>
            <TabsTrigger value="attempts"><AlertTriangle className="h-3.5 w-3.5 mr-1.5" />Tentatives</TabsTrigger>
            <TabsTrigger value="export"><FileDown className="h-3.5 w-3.5 mr-1.5" />Export PDF</TabsTrigger>
          </TabsList>

          {/* ── Whitelist ── */}
          <TabsContent value="whitelist" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ajouter une IP à la liste blanche</CardTitle>
                <CardDescription>Ces IPs ne seront jamais bloquées automatiquement.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Adresse IP (ex: 41.202.x.x)" value={newAllowIp} onChange={e => setNewAllowIp(e.target.value)} className="flex-1" />
                  <Input placeholder="Label (facultatif)" value={newAllowLabel} onChange={e => setNewAllowLabel(e.target.value)} className="flex-1" />
                  <Button onClick={() => allowMutation.mutate({ ip: newAllowIp.trim(), label: newAllowLabel.trim() })} disabled={!newAllowIp.trim() || allowMutation.isPending}>
                    {allowMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">IPs autorisées ({allowedIps.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {allowedLoading ? <div className="text-center py-8 text-muted-foreground">Chargement...</div> : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {allowedIps.length === 0 && <div className="text-center py-8 text-muted-foreground">Aucune IP autorisée</div>}
                    {allowedIps.map(a => (
                      <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border text-sm">
                        <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium font-mono">{a.ip_address}</p>
                          {a.label && <p className="text-xs text-muted-foreground">{a.label}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground/60 shrink-0">{formatDate(a.created_at)}</span>
                        <Button size="sm" variant="ghost" className="text-red-600 h-7 w-7 p-0" onClick={() => removeAllowMutation.mutate(a.ip_address)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── IPs bloquées ── */}
          <TabsContent value="blocked" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bloquer une IP manuellement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Adresse IP" value={newBlockIp} onChange={e => setNewBlockIp(e.target.value)} className="flex-1" />
                  <Input placeholder="Raison" value={newBlockReason} onChange={e => setNewBlockReason(e.target.value)} className="flex-1" />
                  <Button variant="destructive" onClick={() => blockMutation.mutate({ ip: newBlockIp.trim(), reason: newBlockReason.trim() })} disabled={!newBlockIp.trim() || blockMutation.isPending}>
                    {blockMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">IPs bloquées ({blockedIps.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {ipsLoading ? <div className="text-center py-8 text-muted-foreground">Chargement...</div> : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {blockedIps.length === 0 && <div className="text-center py-8 text-muted-foreground">Aucune IP bloquée</div>}
                    {blockedIps.map(b => (
                      <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg border text-sm">
                        <Ban className="h-4 w-4 text-red-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium font-mono">{b.ip_address}</p>
                          {b.reason && <p className="text-xs text-muted-foreground">{b.reason}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground/60 shrink-0">{formatDate(b.created_at)}</span>
                        <Button size="sm" variant="ghost" className="text-green-600 h-7 w-7 p-0" onClick={() => unblockMutation.mutate(b.ip_address)}>
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Événements ── */}
          <TabsContent value="events">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base">Événements de sécurité</CardTitle>
                  <CardDescription>200 derniers événements</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {eventsLoading ? <div className="text-center py-8 text-muted-foreground">Chargement...</div> : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {securityEvents.length === 0 && <div className="text-center py-8 text-muted-foreground">Aucun événement</div>}
                    {securityEvents.map(e => {
                      const label = EVENT_LABELS[e.type] ?? { label: e.type, color: "text-gray-600 bg-gray-50" };
                      return (
                        <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg border text-sm">
                          <Badge className={`text-xs shrink-0 mt-0.5 ${label.color}`}>{label.label}</Badge>
                          <div className="flex-1 min-w-0">
                            {e.ip_address && <p className="text-xs text-muted-foreground">IP: {e.ip_address}</p>}
                            {e.details && <p className="text-xs text-muted-foreground truncate">{e.details}</p>}
                          </div>
                          <span className="text-xs text-muted-foreground/60 shrink-0">{formatDate(e.created_at)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tentatives ── */}
          <TabsContent value="attempts">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base">Tentatives de connexion</CardTitle>
                  <CardDescription>500 dernières tentatives · {recentAttempts.filter(a => a.success).length}/{recentAttempts.length} réussies dans la dernière heure</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {attemptsLoading ? <div className="text-center py-8 text-muted-foreground">Chargement...</div> : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {loginAttempts.length === 0 && <div className="text-center py-8 text-muted-foreground">Aucune tentative</div>}
                    {loginAttempts.map(a => (
                      <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border text-sm">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${a.success ? "bg-green-500" : "bg-red-500"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{a.email_or_phone}</p>
                          {a.ip_address && <p className="text-xs text-muted-foreground">IP: {a.ip_address}</p>}
                        </div>
                        <Badge variant={a.success ? "default" : "destructive"} className="text-xs shrink-0">
                          {a.success ? "Réussie" : "Échouée"}
                        </Badge>
                        <span className="text-xs text-muted-foreground/60 shrink-0">{formatDate(a.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Export PDF ── */}
          <TabsContent value="export">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                    <FileDown className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Export PDF — Rapport complet utilisateurs</CardTitle>
                    <CardDescription>Téléchargez un rapport PDF sécurisé contenant toutes les données utilisateurs.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Contenu du rapport */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30">
                    <Users className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Données utilisateurs</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Nom complet, email, téléphone, pays, date d'inscription, statut du compte (vérifié, bloqué, KYC).</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30">
                    <Shield className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Soldes & wallets</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Solde par utilisateur, soldes agrégés par pays et devise, total plateforme.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30">
                    <Activity className="h-5 w-5 text-purple-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Statistiques globales</p>
                      <p className="text-xs text-muted-foreground mt-0.5">KYC approuvés / en attente / rejetés, comptes vérifiés, emails confirmés.</p>
                    </div>
                  </div>
                </div>

                {/* Avertissement sécurité */}
                <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-800 dark:text-amber-200">Document confidentiel</p>
                    <p className="text-amber-700 dark:text-amber-300 text-xs mt-0.5">
                      Ce PDF contient des données personnelles sensibles (sans mots de passe). Pour télécharger, vous devrez confirmer votre identité via un code à 6 chiffres envoyé sur votre adresse email administrateur.
                    </p>
                  </div>
                </div>

                {/* Bouton principal */}
                <div className="flex justify-center pt-2">
                  <Button
                    size="lg"
                    onClick={handleRequestExportOtp}
                    disabled={exportLoading}
                    className="gap-2 px-8"
                  >
                    {exportLoading ? (
                      <><Loader2 className="h-5 w-5 animate-spin" />Envoi du code...</>
                    ) : (
                      <><Mail className="h-5 w-5" />Recevoir le code de confirmation</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Dialog OTP export ── */}
      <Dialog open={exportStep === "otp"} onOpenChange={(open) => { if (!open) { setExportStep("idle"); setExportCode(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5 text-blue-600" />
              Confirmer le téléchargement
            </DialogTitle>
            <DialogDescription>
              Un code à 6 chiffres a été envoyé sur votre adresse email administrateur. Il est valable <strong>10 minutes</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="export-otp">Code de confirmation</Label>
              <Input
                id="export-otp"
                placeholder="_ _ _ _ _ _"
                value={exportCode}
                onChange={e => setExportCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                maxLength={6}
                autoFocus
                onKeyDown={e => { if (e.key === "Enter" && exportCode.length === 6) handleDownloadPdf(); }}
              />
              <p className="text-xs text-muted-foreground text-center">Vérifiez vos spams si vous ne recevez pas l'email.</p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => { setExportStep("idle"); setExportCode(""); }}>
              Annuler
            </Button>
            <Button
              className="w-full sm:w-auto gap-2"
              onClick={handleDownloadPdf}
              disabled={exportCode.length !== 6 || exportLoading}
            >
              {exportLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Génération en cours...</>
              ) : (
                <><FileDown className="h-4 w-4" />Télécharger le PDF</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
