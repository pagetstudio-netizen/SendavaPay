import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Search, RefreshCw, CheckCircle, XCircle, Clock, Eye } from "lucide-react";

interface SdkWithdrawalLog {
  id: number;
  reference: string;
  merchantId: number | null;
  merchantEmail: string;
  walletId: number | null;
  walletCountry: string | null;
  balanceBefore: string | null;
  amountRequested: string;
  feeApplied: string | null;
  totalDebited: string | null;
  balanceAfter: string | null;
  userBalanceBefore: string | null;
  userBalanceAfter: string | null;
  debitSuccess: boolean | null;
  phoneNumber: string | null;
  operator: string | null;
  gateway: string | null;
  gatewayReference: string | null;
  gatewayRawResponse: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LogsResponse {
  logs: SdkWithdrawalLog[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

function fmt(val: string | null | undefined, decimals = 2) {
  if (val == null) return "—";
  const n = parseFloat(val);
  return isNaN(n) ? "—" : n.toFixed(decimals);
}

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 gap-1"><CheckCircle className="w-3 h-3" />Complété</Badge>;
  if (status === "failed")    return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 gap-1"><XCircle className="w-3 h-3" />Échoué</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 gap-1"><Clock className="w-3 h-3" />En attente</Badge>;
}

function GatewayBadge({ gateway }: { gateway: string | null }) {
  if (!gateway) return <span className="text-muted-foreground text-xs">—</span>;
  const colors: Record<string, string> = {
    paydunya:  "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    soleaspay: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    omnipay:   "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    maishapay: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
    paxity:    "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    mbiyopay:  "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    leekpay:   "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  };
  return (
    <Badge className={colors[gateway.toLowerCase()] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"}>
      {gateway}
    </Badge>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b last:border-0">
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
      <span className={`text-sm text-foreground break-all ${mono ? "font-mono" : ""}`}>{value ?? "—"}</span>
    </div>
  );
}

export default function SdkWithdrawalLogsPage() {
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState<SdkWithdrawalLog | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery<LogsResponse>({
    queryKey: ["/api/admin/sdk-withdrawal-logs", page],
    refetchInterval: 30_000,
  });

  const logs: SdkWithdrawalLog[] = data?.logs ?? [];
  const filtered = search.trim()
    ? logs.filter(l =>
        l.reference.toLowerCase().includes(search.toLowerCase()) ||
        l.merchantEmail.toLowerCase().includes(search.toLowerCase()) ||
        (l.walletCountry || "").toLowerCase().includes(search.toLowerCase()) ||
        (l.phoneNumber || "").includes(search) ||
        (l.gateway || "").toLowerCase().includes(search.toLowerCase()) ||
        l.status.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Journal des retraits SDK</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Audit complet de chaque retrait — débit wallet, frais, fournisseur, réponse brute
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="button-refresh-logs"
            className="gap-2 self-start"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>

        <div className="flex items-center gap-2 bg-muted/40 border rounded-lg px-3 py-2 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filtrer par référence, email, pays, fournisseur…"
            className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-sm"
            data-testid="input-search-logs"
          />
        </div>

        <div className="text-xs text-muted-foreground">
          {total} enregistrement{total !== 1 ? "s" : ""} au total
          {search && ` · ${filtered.length} résultat${filtered.length !== 1 ? "s" : ""} filtrés`}
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs font-semibold w-[140px]">Référence</TableHead>
                  <TableHead className="text-xs font-semibold">Marchand</TableHead>
                  <TableHead className="text-xs font-semibold">Pays wallet</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Solde avant</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Montant</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Frais</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Total débité</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Solde après</TableHead>
                  <TableHead className="text-xs font-semibold">Fournisseur</TableHead>
                  <TableHead className="text-xs font-semibold">Statut</TableHead>
                  <TableHead className="text-xs font-semibold">Date</TableHead>
                  <TableHead className="text-xs font-semibold w-[48px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 12 }).map((_, j) => (
                        <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
                {!isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center text-muted-foreground py-12 text-sm">
                      Aucun retrait SDK enregistré
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filtered.map(log => (
                  <TableRow
                    key={log.id}
                    className="hover:bg-muted/30 cursor-pointer"
                    data-testid={`row-sdklog-${log.id}`}
                    onClick={() => setSelected(log)}
                  >
                    <TableCell className="font-mono text-xs text-primary truncate max-w-[140px]" title={log.reference}>
                      {log.reference.slice(0, 20)}…
                    </TableCell>
                    <TableCell className="text-xs max-w-[160px] truncate" title={log.merchantEmail}>
                      {log.merchantEmail}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">{log.walletCountry || "—"}</TableCell>
                    <TableCell className="text-xs text-right font-mono">{fmt(log.balanceBefore)}</TableCell>
                    <TableCell className="text-xs text-right font-mono font-semibold">{fmt(log.amountRequested)}</TableCell>
                    <TableCell className="text-xs text-right font-mono text-orange-600 dark:text-orange-400">{fmt(log.feeApplied)}</TableCell>
                    <TableCell className="text-xs text-right font-mono font-bold">{fmt(log.totalDebited)}</TableCell>
                    <TableCell className={`text-xs text-right font-mono font-semibold ${
                      log.debitSuccess ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}>
                      {fmt(log.balanceAfter)}
                    </TableCell>
                    <TableCell><GatewayBadge gateway={log.gateway} /></TableCell>
                    <TableCell><StatusBadge status={log.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-detail-${log.id}`}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Page {page} / {pages}</span>
            <div className="flex gap-2">
              <Button
                variant="outline" size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline" size="sm"
                disabled={page >= pages}
                onClick={() => setPage(p => p + 1)}
                data-testid="button-next-page"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm font-bold">{selected?.reference}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-1">
              <div className="grid grid-cols-2 gap-x-6">
                <DetailRow label="Statut" value={<StatusBadge status={selected.status} />} />
                <DetailRow label="Fournisseur" value={<GatewayBadge gateway={selected.gateway} />} />
                <DetailRow label="Marchand" value={selected.merchantEmail} />
                <DetailRow label="ID marchand" value={selected.merchantId?.toString()} />
                <DetailRow label="Pays wallet" value={selected.walletCountry} />
                <DetailRow label="Wallet ID" value={selected.walletId?.toString()} />
                <DetailRow label="Opérateur" value={selected.operator} />
                <DetailRow label="Numéro destinataire" value={selected.phoneNumber} />
              </div>

              <div className="mt-3 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Calcul du débit</div>
              <div className="grid grid-cols-2 gap-x-6 bg-muted/30 rounded-lg px-3">
                <DetailRow label="Solde wallet avant" value={`${fmt(selected.balanceBefore)} XOF`} />
                <DetailRow label="Montant demandé" value={`${fmt(selected.amountRequested)} XOF`} />
                <DetailRow label="Frais appliqués" value={`${fmt(selected.feeApplied)} XOF`} />
                <DetailRow label="Total débité" value={<span className="font-bold text-red-600 dark:text-red-400">{fmt(selected.totalDebited)} XOF</span>} />
                <DetailRow label="Solde wallet après" value={<span className={selected.debitSuccess ? "text-green-600 dark:text-green-400 font-semibold" : "text-red-600 dark:text-red-400"}>{fmt(selected.balanceAfter)} XOF</span>} />
                <DetailRow label="Débit réussi" value={selected.debitSuccess ? <span className="text-green-600 font-semibold">✓ Oui</span> : <span className="text-red-600 font-semibold">✗ Non</span>} />
                <DetailRow label="users.balance avant" value={`${fmt(selected.userBalanceBefore)} XOF`} />
                <DetailRow label="users.balance après" value={`${fmt(selected.userBalanceAfter)} XOF`} />
              </div>

              <div className="mt-3 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Réponse fournisseur</div>
              <div className="bg-muted/30 rounded-lg px-3">
                <DetailRow label="Référence fournisseur" value={selected.gatewayReference} mono />
                <DetailRow label="Réponse brute" value={
                  selected.gatewayRawResponse
                    ? <pre className="text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">{
                        (() => { try { return JSON.stringify(JSON.parse(selected.gatewayRawResponse), null, 2); } catch { return selected.gatewayRawResponse; } })()
                      }</pre>
                    : "—"
                } />
                {selected.errorMessage && (
                  <DetailRow label="Message d'erreur" value={
                    <span className="text-red-600 dark:text-red-400">{selected.errorMessage}</span>
                  } />
                )}
              </div>

              <div className="mt-3 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Horodatage</div>
              <div className="grid grid-cols-2 gap-x-6">
                <DetailRow label="Créé le" value={new Date(selected.createdAt).toLocaleString("fr-FR")} />
                <DetailRow label="Mis à jour" value={new Date(selected.updatedAt).toLocaleString("fr-FR")} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
