import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Copy,
  Handshake,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
} from "lucide-react";

interface Partner {
  id: number;
  name: string;
  email: string;
  phone?: string;
  description?: string;
  website?: string;
  commissionRate: string | number;
  slug: string;
  status: string;
  balance: string | number;
  apiKey?: string;
  logo?: string;
  primaryColor?: string;
  enableDeposit: boolean;
  enableWithdrawal: boolean;
  enablePaymentLinks: boolean;
  allowedCountries?: string;
  allowedOperators?: string;
  createdAt: string;
  updatedAt?: string;
}

interface PartnerLog {
  id: number;
  action: string;
  details?: string;
  createdAt: string;
  ipAddress?: string;
}

interface PartnerTransaction {
  id: number;
  amount: string | number;
  type: string;
  status: string;
  reference?: string;
  createdAt: string;
}

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-FR").format(num) + " XOF";
}

function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

export function PartnersContent() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [viewTab, setViewTab] = useState<"logs" | "transactions">("logs");

  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    description: "",
    website: "",
    commissionRate: "5",
    slug: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    description: "",
    website: "",
    commissionRate: "",
    slug: "",
  });
  const [editPermissions, setEditPermissions] = useState({
    enableDeposit: true,
    enableWithdrawal: true,
    enablePaymentLinks: true,
  });

  const { data: partners, isLoading } = useQuery<Partner[]>({
    queryKey: ["/api/admin/partners"],
  });

  const { data: partnerLogs } = useQuery<PartnerLog[]>({
    queryKey: ["/api/admin/partners", selectedPartner?.id, "logs"],
    queryFn: async () => {
      if (!selectedPartner) return [];
      const res = await fetch(`/api/admin/partners/${selectedPartner.id}/logs`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
    enabled: !!selectedPartner && showViewDialog,
  });

  const { data: partnerTransactions } = useQuery<PartnerTransaction[]>({
    queryKey: ["/api/admin/partners", selectedPartner?.id, "transactions"],
    queryFn: async () => {
      if (!selectedPartner) return [];
      const res = await fetch(`/api/admin/partners/${selectedPartner.id}/transactions`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
    enabled: !!selectedPartner && showViewDialog,
  });

  const filteredPartners = useMemo(() => {
    return partners?.filter((partner) => {
      const q = searchQuery.toLowerCase();
      return (
        partner.name?.toLowerCase().includes(q) ||
        partner.email?.toLowerCase().includes(q) ||
        partner.slug?.toLowerCase().includes(q)
      );
    }) || [];
  }, [partners, searchQuery]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof createForm) => {
      await apiRequest("POST", "/api/admin/create-partner", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      toast({ title: "Succès", description: "Partenaire créé avec succès" });
      setShowCreateDialog(false);
      setCreateForm({ name: "", email: "", password: "", phone: "", description: "", website: "", commissionRate: "5", slug: "" });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message || "Échec de la création", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, any> }) => {
      await apiRequest("PATCH", `/api/admin/partners/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      toast({ title: "Succès", description: "Partenaire mis à jour" });
      setShowEditDialog(false);
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message || "Échec de la mise à jour", variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/admin/partners/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      toast({ title: "Succès", description: "Statut du partenaire mis à jour" });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message || "Échec du changement de statut", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/partners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      toast({ title: "Succès", description: "Partenaire supprimé" });
      setShowDeleteDialog(false);
      setSelectedPartner(null);
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message || "Échec de la suppression", variant: "destructive" });
    },
  });

  const openEditDialog = (partner: Partner) => {
    setSelectedPartner(partner);
    setEditForm({
      name: partner.name || "",
      email: partner.email || "",
      password: "",
      phone: partner.phone || "",
      description: partner.description || "",
      website: partner.website || "",
      commissionRate: String(partner.commissionRate || ""),
      slug: partner.slug || "",
    });
    setEditPermissions({
      enableDeposit: partner.enableDeposit ?? true,
      enableWithdrawal: partner.enableWithdrawal ?? true,
      enablePaymentLinks: partner.enablePaymentLinks ?? true,
    });
    setShowEditDialog(true);
  };

  const openViewDialog = (partner: Partner) => {
    setSelectedPartner(partner);
    setViewTab("logs");
    setShowViewDialog(true);
  };

  const openDeleteDialog = (partner: Partner) => {
    setSelectedPartner(partner);
    setShowDeleteDialog(true);
  };

  const handleCreate = () => {
    createMutation.mutate(createForm);
  };

  const handleUpdate = () => {
    if (!selectedPartner) return;
    const data: Record<string, any> = {};
    if (editForm.name) data.name = editForm.name;
    if (editForm.email) data.email = editForm.email;
    if (editForm.password) data.password = editForm.password;
    if (editForm.phone) data.phone = editForm.phone;
    if (editForm.description) data.description = editForm.description;
    if (editForm.website) data.website = editForm.website;
    if (editForm.commissionRate) data.commissionRate = editForm.commissionRate;
    if (editForm.slug) data.slug = editForm.slug;
    data.enableDeposit = editPermissions.enableDeposit;
    data.enableWithdrawal = editPermissions.enableWithdrawal;
    data.enablePaymentLinks = editPermissions.enablePaymentLinks;
    updateMutation.mutate({ id: selectedPartner.id, data });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copié", description: "Copié dans le presse-papiers" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-partners-title">Gestion des Partenaires</h1>
          <p className="text-muted-foreground" data-testid="text-partners-count">
            {partners?.length || 0} partenaire{(partners?.length || 0) !== 1 ? "s" : ""} enregistré{(partners?.length || 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => {
            setCreateForm({ name: "", email: "", password: "", phone: "", description: "", website: "", commissionRate: "5", slug: "" });
            setShowCreateDialog(true);
          }}
          data-testid="button-new-partner"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Partenaire
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5" />
              Liste des Partenaires
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-partners"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center p-8">
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ) : !filteredPartners.length ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center p-8 text-muted-foreground">
                      Aucun partenaire trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPartners.map((partner) => (
                    <TableRow key={partner.id} data-testid={`row-partner-${partner.id}`}>
                      <TableCell className="font-medium" data-testid={`text-partner-name-${partner.id}`}>
                        {partner.name}
                      </TableCell>
                      <TableCell data-testid={`text-partner-email-${partner.id}`}>
                        {partner.email}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded" data-testid={`text-partner-slug-${partner.id}`}>
                          partner.by_{partner.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={partner.status === "active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }
                          data-testid={`badge-partner-status-${partner.id}`}
                        >
                          {partner.status === "active" ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1" data-testid={`permissions-partner-${partner.id}`}>
                          {partner.enableDeposit && <Badge variant="secondary" className="text-xs">Dépôt</Badge>}
                          {partner.enableWithdrawal && <Badge variant="secondary" className="text-xs">Retrait</Badge>}
                          {partner.enablePaymentLinks && <Badge variant="secondary" className="text-xs">Liens</Badge>}
                          {!partner.enableDeposit && !partner.enableWithdrawal && !partner.enablePaymentLinks && (
                            <Badge variant="destructive" className="text-xs">Aucun</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-partner-commission-${partner.id}`}>
                        {partner.commissionRate}%
                      </TableCell>
                      <TableCell data-testid={`text-partner-balance-${partner.id}`}>
                        {formatCurrency(partner.balance || 0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openViewDialog(partner)}
                            title="Voir les détails"
                            data-testid={`button-view-partner-${partner.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(partner)}
                            title="Modifier"
                            data-testid={`button-edit-partner-${partner.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleMutation.mutate(partner.id)}
                            title={partner.status === "active" ? "Désactiver" : "Activer"}
                            data-testid={`button-toggle-partner-${partner.id}`}
                          >
                            {partner.status === "active" ? (
                              <ToggleRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(partner)}
                            title="Supprimer"
                            data-testid={`button-delete-partner-${partner.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau Partenaire</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Nom</Label>
                <Input
                  id="create-name"
                  value={createForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setCreateForm((f) => ({ ...f, name, slug: generateSlug(name) }));
                  }}
                  data-testid="input-create-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">Email</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  data-testid="input-create-email"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-password">Mot de passe</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  data-testid="input-create-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-phone">Téléphone</Label>
                <Input
                  id="create-phone"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                  data-testid="input-create-phone"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Input
                id="create-description"
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                data-testid="input-create-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-website">Site web</Label>
                <Input
                  id="create-website"
                  value={createForm.website}
                  onChange={(e) => setCreateForm((f) => ({ ...f, website: e.target.value }))}
                  data-testid="input-create-website"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-commission">Commission (%)</Label>
                <Input
                  id="create-commission"
                  type="number"
                  value={createForm.commissionRate}
                  onChange={(e) => setCreateForm((f) => ({ ...f, commissionRate: e.target.value }))}
                  data-testid="input-create-commission"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-slug">Slug</Label>
              <Input
                id="create-slug"
                value={createForm.slug}
                onChange={(e) => setCreateForm((f) => ({ ...f, slug: e.target.value }))}
                data-testid="input-create-slug"
              />
              <p className="text-xs text-muted-foreground">Auto-généré à partir du nom. Modifiable manuellement.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} data-testid="button-cancel-create">
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending || !createForm.name || !createForm.email || !createForm.password}
              data-testid="button-submit-create"
            >
              {createMutation.isPending ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le Partenaire</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nom</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  data-testid="input-edit-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  data-testid="input-edit-email"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-password">Mot de passe (laisser vide pour ne pas changer)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Nouveau mot de passe"
                  data-testid="input-edit-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Téléphone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  data-testid="input-edit-phone"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                data-testid="input-edit-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-website">Site web</Label>
                <Input
                  id="edit-website"
                  value={editForm.website}
                  onChange={(e) => setEditForm((f) => ({ ...f, website: e.target.value }))}
                  data-testid="input-edit-website"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-commission">Commission (%)</Label>
                <Input
                  id="edit-commission"
                  type="number"
                  value={editForm.commissionRate}
                  onChange={(e) => setEditForm((f) => ({ ...f, commissionRate: e.target.value }))}
                  data-testid="input-edit-commission"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={editForm.slug}
                onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))}
                data-testid="input-edit-slug"
              />
            </div>
            <div className="space-y-3 pt-2 border-t">
              <Label className="text-base font-semibold">Permissions API</Label>
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Encaissement / Paiement</p>
                    <p className="text-xs text-muted-foreground">Autoriser la collecte de paiements via l'API</p>
                  </div>
                  <Switch
                    checked={editPermissions.enableDeposit}
                    onCheckedChange={(v) => setEditPermissions(p => ({ ...p, enableDeposit: v }))}
                    data-testid="switch-enable-deposit"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Retrait automatique</p>
                    <p className="text-xs text-muted-foreground">Autoriser les retraits via l'API</p>
                  </div>
                  <Switch
                    checked={editPermissions.enableWithdrawal}
                    onCheckedChange={(v) => setEditPermissions(p => ({ ...p, enableWithdrawal: v }))}
                    data-testid="switch-enable-withdrawal"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Liens de paiement</p>
                    <p className="text-xs text-muted-foreground">Autoriser la création de liens de paiement</p>
                  </div>
                  <Switch
                    checked={editPermissions.enablePaymentLinks}
                    onCheckedChange={(v) => setEditPermissions(p => ({ ...p, enablePaymentLinks: v }))}
                    data-testid="switch-enable-payment-links"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} data-testid="button-cancel-edit">
              Annuler
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              data-testid="button-submit-edit"
            >
              {updateMutation.isPending ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le partenaire</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Êtes-vous sûr de vouloir supprimer le partenaire <strong>{selectedPartner?.name}</strong> ? Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} data-testid="button-cancel-delete">
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedPartner && deleteMutation.mutate(selectedPartner.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5" />
              Détails du Partenaire
            </DialogTitle>
          </DialogHeader>
          {selectedPartner && (
            <ScrollArea className="max-h-[65vh]">
              <div className="space-y-6 pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nom</p>
                    <p className="font-medium" data-testid="text-view-name">{selectedPartner.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium" data-testid="text-view-email">{selectedPartner.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <p className="font-medium" data-testid="text-view-phone">{selectedPartner.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Slug</p>
                    <code className="text-sm bg-muted px-1.5 py-0.5 rounded" data-testid="text-view-slug">
                      partner.by_{selectedPartner.slug}
                    </code>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Commission</p>
                    <p className="font-medium" data-testid="text-view-commission">{selectedPartner.commissionRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className="font-medium" data-testid="text-view-balance">{formatCurrency(selectedPartner.balance || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Statut</p>
                    <Badge
                      className={selectedPartner.status === "active"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }
                      data-testid="badge-view-status"
                    >
                      {selectedPartner.status === "active" ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Créé le</p>
                    <p className="text-sm" data-testid="text-view-created">{formatDate(selectedPartner.createdAt)}</p>
                  </div>
                </div>

                {selectedPartner.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm" data-testid="text-view-description">{selectedPartner.description}</p>
                  </div>
                )}

                {selectedPartner.website && (
                  <div>
                    <p className="text-sm text-muted-foreground">Site web</p>
                    <a
                      href={selectedPartner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1"
                      data-testid="link-view-website"
                    >
                      {selectedPartner.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {selectedPartner.apiKey && (
                  <div>
                    <p className="text-sm text-muted-foreground">Clé API</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1 break-all" data-testid="text-view-apikey">
                        {selectedPartner.apiKey}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(selectedPartner.apiKey!)}
                        data-testid="button-copy-apikey"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 border-b">
                  <Button
                    variant={viewTab === "logs" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewTab("logs")}
                    data-testid="button-tab-logs"
                  >
                    Logs
                  </Button>
                  <Button
                    variant={viewTab === "transactions" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewTab("transactions")}
                    data-testid="button-tab-transactions"
                  >
                    Transactions
                  </Button>
                </div>

                {viewTab === "logs" && (
                  <div>
                    {!partnerLogs?.length ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Aucun log disponible</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Action</TableHead>
                            <TableHead>Détails</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {partnerLogs.map((log) => (
                            <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                              <TableCell className="font-medium text-sm">{log.action}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{log.details || "-"}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{formatDate(log.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}

                {viewTab === "transactions" && (
                  <div>
                    {!partnerTransactions?.length ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Aucune transaction disponible</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Montant</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Référence</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {partnerTransactions.map((tx) => (
                            <TableRow key={tx.id} data-testid={`row-transaction-${tx.id}`}>
                              <TableCell className="font-medium">{formatCurrency(tx.amount)}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">{tx.type}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">{tx.status}</Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground font-mono">{tx.reference || "-"}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{formatDate(tx.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PartnersContent;
