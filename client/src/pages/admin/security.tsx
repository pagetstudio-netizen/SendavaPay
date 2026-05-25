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
import { Shield, Ban, Check, RefreshCw, AlertTriangle, Lock, Activity, Loader2, ShieldCheck, Trash2 } from "lucide-react";

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
              <div className="flex items-center gap-2 text-blue-600 mb-1"><Activity className="h-4 w-4" /><span className="text-xs font-medium">Tentatives (1h)</span></div>
              <div className="text-2xl font-bold">{recentAttempts.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="whitelist">
          <TabsList>
            <TabsTrigger value="whitelist">
              <ShieldCheck className="h-4 w-4 mr-1.5" />
              Liste blanche
              {allowedIps.length > 0 && (
                <span className="ml-1.5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-xs rounded-full px-1.5 py-0.5 font-semibold">{allowedIps.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="ips">IPs bloquées</TabsTrigger>
            <TabsTrigger value="events">Événements</TabsTrigger>
            <TabsTrigger value="attempts">Connexions</TabsTrigger>
          </TabsList>

          {/* ── WHITELIST ── */}
          <TabsContent value="whitelist" className="mt-4 space-y-4">
            <Card className="border-green-200 dark:border-green-900/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  Ajouter une IP à la liste blanche
                </CardTitle>
                <CardDescription>
                  Les IPs dans cette liste ne seront <strong>jamais</strong> bloquées, même si elles sont détectées comme VPN, hébergeur ou hors-Afrique. Utile pour les serveurs des marchands et bots d'intégration.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Input
                    value={newAllowIp}
                    onChange={e => setNewAllowIp(e.target.value)}
                    placeholder="Ex : 2600:1900:0:2107::1"
                    className="flex-1 min-w-[180px]"
                    data-testid="input-allow-ip"
                    onKeyDown={e => e.key === "Enter" && newAllowIp.trim() && allowMutation.mutate({ ip: newAllowIp.trim(), label: newAllowLabel.trim() })}
                  />
                  <Input
                    value={newAllowLabel}
                    onChange={e => setNewAllowLabel(e.target.value)}
                    placeholder="Nom / description (ex: Bot marchand X)"
                    className="flex-1 min-w-[200px]"
                    data-testid="input-allow-label"
                  />
                  <Button
                    onClick={() => allowMutation.mutate({ ip: newAllowIp.trim(), label: newAllowLabel.trim() })}
                    disabled={!newAllowIp.trim() || allowMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    data-testid="button-allow-ip"
                  >
                    {allowMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-1" />}
                    Autoriser
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">IPs toujours autorisées ({allowedIps.length})</CardTitle>
                <CardDescription>Ces IPs passent sans restriction de géolocalisation ni de détection VPN.</CardDescription>
              </CardHeader>
              <CardContent>
                {allowedLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Chargement...</div>
                ) : allowedIps.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <ShieldCheck className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucune IP dans la liste blanche</p>
                    <p className="text-xs mt-1">Ajoutez les IPs des serveurs marchands pour éviter tout blocage automatique.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allowedIps.map(ip => (
                      <div key={ip.id} className="flex items-center justify-between p-3 rounded-lg border border-green-100 dark:border-green-900/30 bg-green-50/40 dark:bg-green-950/10">
                        <div>
                          <div className="flex items-center gap-2">
                            <code className="font-mono text-sm font-semibold">{ip.ip_address}</code>
                            <Badge variant="outline" className="text-xs border-green-300 text-green-700 dark:text-green-400">Autorisé</Badge>
                          </div>
                          {ip.label && <p className="text-xs text-muted-foreground mt-0.5">{ip.label}</p>}
                          <p className="text-xs text-muted-foreground/60">Ajouté le {formatDate(ip.created_at)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAllowMutation.mutate(ip.ip_address)}
                          disabled={removeAllowMutation.isPending}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          data-testid={`button-remove-allow-${ip.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── BLOCKED IPs ── */}
          <TabsContent value="ips" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bloquer une IP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Input value={newBlockIp} onChange={e => setNewBlockIp(e.target.value)} placeholder="192.168.1.1" className="flex-1 min-w-[160px]" data-testid="input-block-ip" />
                  <Input value={newBlockReason} onChange={e => setNewBlockReason(e.target.value)} placeholder="Raison (optionnel)" className="flex-1 min-w-[180px]" />
                  <Button onClick={() => blockMutation.mutate({ ip: newBlockIp.trim(), reason: newBlockReason.trim() })} disabled={!newBlockIp.trim() || blockMutation.isPending} data-testid="button-block-ip">
                    {blockMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4 mr-1" />}
                    Bloquer
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">IPs bloquées ({blockedIps.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {ipsLoading ? <div className="text-center py-8 text-muted-foreground">Chargement...</div> : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {blockedIps.length === 0 && <div className="text-center py-8 text-muted-foreground">Aucune IP bloquée</div>}
                    {blockedIps.map(ip => (
                      <div key={ip.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <code className="font-mono text-sm font-semibold">{ip.ip_address}</code>
                          {ip.reason && <p className="text-xs text-muted-foreground mt-0.5">{ip.reason}</p>}
                          <p className="text-xs text-muted-foreground/60">{formatDate(ip.created_at)}{ip.expires_at ? ` · Expire: ${formatDate(ip.expires_at)}` : " · Permanent"}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => unblockMutation.mutate(ip.ip_address)} disabled={unblockMutation.isPending} data-testid={`button-unblock-${ip.id}`}>
                          <Check className="h-4 w-4 mr-1" /> Débloquer
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── SECURITY EVENTS ── */}
          <TabsContent value="events" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base">Événements récents</CardTitle>
                  <CardDescription>500 derniers événements de sécurité</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/security/events"] })}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Actualiser
                </Button>
              </CardHeader>
              <CardContent>
                {eventsLoading ? <div className="text-center py-8 text-muted-foreground">Chargement...</div> : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {securityEvents.length === 0 && <div className="text-center py-8 text-muted-foreground">Aucun événement</div>}
                    {securityEvents.map(e => {
                      const config = EVENT_LABELS[e.type] || { label: e.type, color: "text-gray-600 bg-gray-50" };
                      return (
                        <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg border text-sm">
                          <Badge className={`${config.color} border-0 text-xs shrink-0`}>{config.label}</Badge>
                          <div className="flex-1 min-w-0">
                            {e.details && <p className="text-muted-foreground truncate">{e.details}</p>}
                            {e.ip_address && <p className="text-xs text-muted-foreground/70">IP: {e.ip_address}{e.userId ? ` · User #${e.userId}` : ""}</p>}
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

          {/* ── LOGIN ATTEMPTS ── */}
          <TabsContent value="attempts" className="mt-4">
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
        </Tabs>
      </div>
    </AdminLayout>
  );
}
