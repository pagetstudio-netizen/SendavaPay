import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Loader2,
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  Upload,
  FileImage,
  User,
} from "lucide-react";
import type { KycRequest } from "@shared/schema";

const documentTypes = [
  { id: "national_id", label: "Carte nationale d'identité" },
  { id: "passport", label: "Passeport" },
  { id: "driver_license", label: "Permis de conduire" },
  { id: "voter_card", label: "Carte d'électeur" },
];

const countries = [
  "Togo", "Bénin", "Sénégal", "Mali", "Burkina Faso", "Côte d'Ivoire",
  "Ghana", "Niger", "Guinée", "Cameroun",
];

export default function KycPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    country: "",
    documentType: "",
  });
  const [documentFront, setDocumentFront] = useState<File | null>(null);
  const [documentBack, setDocumentBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [showRetryForm, setShowRetryForm] = useState(false);

  const { data: kycRequest, isLoading } = useQuery<KycRequest>({
    queryKey: ["/api/kyc"],
  });

  const submitKycMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch("/api/kyc", {
        method: "POST",
        body: data,
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur lors de la soumission");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Demande envoyée",
        description: "Votre demande de vérification a été soumise avec succès.",
      });
      setShowRetryForm(false);
      setDocumentFront(null);
      setDocumentBack(null);
      setSelfie(null);
      queryClient.invalidateQueries({ queryKey: ["/api/kyc"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.country || !formData.documentType) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    if (!documentFront || !documentBack || !selfie) {
      toast({
        title: "Documents manquants",
        description: "Veuillez téléverser tous les documents requis.",
        variant: "destructive",
      });
      return;
    }

    const data = new FormData();
    data.append("fullName", formData.fullName);
    data.append("email", formData.email);
    data.append("phone", formData.phone);
    data.append("country", formData.country);
    data.append("documentType", formData.documentType);
    data.append("documentFront", documentFront);
    data.append("documentBack", documentBack);
    data.append("selfie", selfie);

    submitKycMutation.mutate(data);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille maximale est de 5 Mo.",
          variant: "destructive",
        });
        return;
      }
      setter(file);
    }
  };

  if (user?.isVerified) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
            <CardContent className="p-12 text-center">
              <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
                Compte vérifié
              </h2>
              <p className="text-green-600 dark:text-green-400 max-w-md mx-auto">
                Félicitations ! Votre compte SendavaPay est vérifié. Vous avez accès à toutes
                les fonctionnalités de la plateforme, y compris les retraits et l'API.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (kycRequest?.status === "pending") {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
            <CardContent className="p-12 text-center">
              <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mx-auto mb-6">
                <Clock className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-200 mb-2">
                Vérification en cours
              </h2>
              <p className="text-blue-600 dark:text-blue-400 max-w-md mx-auto">
                Votre demande de vérification est en cours d'examen. Nous vous informerons
                par email dès que la vérification sera terminée.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (kycRequest?.status === "rejected" && !showRetryForm) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-1">
                    Vérification refusée
                  </h2>
                  <p className="text-red-600 dark:text-red-400 mb-4">
                    {kycRequest.rejectionReason || "Votre demande de vérification a été refusée. Veuillez vérifier vos informations et réessayer."}
                  </p>
                  <Button 
                    onClick={() => setShowRetryForm(true)}
                    data-testid="button-kyc-retry"
                  >
                    Soumettre une nouvelle demande
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Vérification du compte (KYC)
          </h1>
          <p className="text-muted-foreground">
            Vérifiez votre identité pour débloquer toutes les fonctionnalités
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>
              Remplissez le formulaire avec vos informations exactes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    data-testid="input-kyc-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    data-testid="input-kyc-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    data-testid="input-kyc-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Pays de résidence</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => setFormData({ ...formData, country: value })}
                  >
                    <SelectTrigger data-testid="select-kyc-country">
                      <SelectValue placeholder="Sélectionnez un pays" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentType">Type de document</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                >
                  <SelectTrigger data-testid="select-kyc-document-type">
                    <SelectValue placeholder="Sélectionnez un type de document" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label>Documents requis</Label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="documentFront" className="text-sm text-muted-foreground">
                      Document recto
                    </Label>
                    <label
                      htmlFor="documentFront"
                      className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        documentFront ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "border-muted hover:border-primary"
                      }`}
                    >
                      {documentFront ? (
                        <>
                          <FileImage className="h-8 w-8 text-green-600 mb-2" />
                          <span className="text-xs text-center text-green-600 px-2 truncate max-w-full">
                            {documentFront.name}
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-xs text-muted-foreground">Cliquez pour téléverser</span>
                        </>
                      )}
                      <input
                        id="documentFront"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, setDocumentFront)}
                        data-testid="input-kyc-doc-front"
                      />
                    </label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="documentBack" className="text-sm text-muted-foreground">
                      Document verso
                    </Label>
                    <label
                      htmlFor="documentBack"
                      className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        documentBack ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "border-muted hover:border-primary"
                      }`}
                    >
                      {documentBack ? (
                        <>
                          <FileImage className="h-8 w-8 text-green-600 mb-2" />
                          <span className="text-xs text-center text-green-600 px-2 truncate max-w-full">
                            {documentBack.name}
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-xs text-muted-foreground">Cliquez pour téléverser</span>
                        </>
                      )}
                      <input
                        id="documentBack"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, setDocumentBack)}
                        data-testid="input-kyc-doc-back"
                      />
                    </label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="selfie" className="text-sm text-muted-foreground">
                      Selfie avec carte
                    </Label>
                    <label
                      htmlFor="selfie"
                      className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        selfie ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "border-muted hover:border-primary"
                      }`}
                    >
                      {selfie ? (
                        <>
                          <User className="h-8 w-8 text-green-600 mb-2" />
                          <span className="text-xs text-center text-green-600 px-2 truncate max-w-full">
                            {selfie.name}
                          </span>
                        </>
                      ) : (
                        <>
                          <User className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-xs text-muted-foreground text-center">Selfie tenant la carte</span>
                        </>
                      )}
                      <input
                        id="selfie"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, setSelfie)}
                        data-testid="input-kyc-selfie"
                      />
                    </label>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Formats acceptés: JPG, PNG, GIF. Taille max: 5 Mo par fichier.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={submitKycMutation.isPending}
                data-testid="button-kyc-submit"
              >
                {submitKycMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Soumettre la demande
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
