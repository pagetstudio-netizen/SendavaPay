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
import { Shield, Ban, Check, RefreshCw, AlertTriangle, Lock, Activity, Loader2 } from "lucide-react";

interface BlockedIp {
  id: number;
  ipAddress: string;
  reason: string | null;
  createdAt: string;
  expiresAt: string | null;
}

interface SecurityEvent {
  id: number;
  userId: number | null;
  type: string;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface LoginAttempt {
  id: number;
  emailOrPhone: string;
  ipAddress: string | null;
  success: boolean;
  createdAt: string;
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
};

export default function SecurityDashboard() {
  const { toast } = useToast();
  const [newIp, setNewIp] = useState("");
  const [newReason, setNewReason] = useState("");

  const { data: blockedIps = [], isLoading: ipsLoading, refetch: refetchIps } = useQuery<BlockedIp[]>({
    queryKey: ["/api/admin/security/blocked-ips"],
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
      toast({ title: "IP bloquée", description: `${newIp} a été bloqué avec succès.` });
      setNewIp(""); setNewReason("");
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
      toast({ title: "IP débloquée", description: `${ip} a été débloqué.` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security/blocked-ips"] });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const failedToday = securityEvents.filter(e => {
    const today = new Date(); today.setHours(0,0,0,0);
    return new Date(e.createdAt) >= today && (e.type === "failed_login" || e.type === "brute_force");
  }).length;

  const recentAttempts = loginAttempts.filter(a => {
    const h1 = new Date(Date.now() - 60*60*1000);
    return new Date(a.createdAt) >= h1;
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
            <div className="flex items-center gap-2 text-blue-600 mb-1"><Activity className="h-4 w-4" /><span className="text-xs font-medium">Tentatives (1h)</span></div>
            <div className="text-2xl font-bold">{recentAttempts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1"><Lock className="h-4 w-4" /><span className="text-xs font-medium">Réussies (1h)</span></div>
            <div className="text-2xl font-bold">{recentAttempts.filter(a => a.success).length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">Événements sécurité</TabsTrigger>
          <TabsTrigger value="ips">IPs bloquées</TabsTrigger>
          <TabsTrigger value="attempts">Tentatives de connexion</TabsTrigger>
        </TabsList>

        {/* Security Events */}
        <TabsContent value="events" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Événements récents</CardTitle>
                <CardDescription>100 derniers événements de sécurité</CardDescription>
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
                          {e.ipAddress && <p className="text-xs text-muted-foreground/70">IP: {e.ipAddress}{e.userId ? ` · User #${e.userId}` : ""}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground/60 shrink-0">{formatDate(e.createdAt)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blocked IPs */}
        <TabsContent value="ips" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bloquer une IP</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Input value={newIp} onChange={e => setNewIp(e.target.value)} placeholder="192.168.1.1" className="flex-1 min-w-[160px]" data-testid="input-block-ip" />
                <Input value={newReason} onChange={e => setNewReason(e.target.value)} placeholder="Raison (optionnel)" className="flex-1 min-w-[180px]" />
                <Button onClick={() => blockMutation.mutate({ ip: newIp.trim(), reason: newReason.trim() })} disabled={!newIp.trim() || blockMutation.isPending} data-testid="button-block-ip">
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
                <div className="space-y-2">
                  {blockedIps.length === 0 && <div className="text-center py-8 text-muted-foreground">Aucune IP bloquée</div>}
                  {blockedIps.map(ip => (
                    <div key={ip.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <code className="font-mono text-sm font-semibold">{ip.ipAddress}</code>
                        {ip.reason && <p className="text-xs text-muted-foreground mt-0.5">{ip.reason}</p>}
                        <p className="text-xs text-muted-foreground/60">{formatDate(ip.createdAt)}{ip.expiresAt ? ` · Expire: ${formatDate(ip.expiresAt)}` : " · Permanent"}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => unblockMutation.mutate(ip.ipAddress)} disabled={unblockMutation.isPending} data-testid={`button-unblock-${ip.id}`}>
                        <Check className="h-4 w-4 mr-1" /> Débloquer
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Login Attempts */}
        <TabsContent value="attempts" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Tentatives de connexion</CardTitle>
                <CardDescription>200 dernières tentatives</CardDescription>
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
                        <p className="font-medium truncate">{a.emailOrPhone}</p>
                        {a.ipAddress && <p className="text-xs text-muted-foreground">IP: {a.ipAddress}</p>}
                      </div>
                      <Badge variant={a.success ? "default" : "destructive"} className="text-xs shrink-0">
                        {a.success ? "Réussie" : "Échouée"}
                      </Badge>
                      <span className="text-xs text-muted-foreground/60 shrink-0">{formatDate(a.createdAt)}</span>
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
