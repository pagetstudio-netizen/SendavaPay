import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, ExternalLink, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface PartnerPageData {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  primaryColor?: string;
}

export default function PartnerPublicPage() {
  const [match, params] = useRoute("/partner.by_:slug");

  const slug = params?.slug;

  const { data: partner, isLoading, error } = useQuery<PartnerPageData>({
    queryKey: slug ? [`/api/partner-page/${slug}`] : [],
    enabled: !!slug,
  });

  const isUnauthorized = error && (error as any).status === 403;

  if (!slug) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <Lock className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-foreground" data-testid="text-unauthorized-title">
              Accès non autorisé
            </h1>
            <p className="text-muted-foreground mb-8" data-testid="text-unauthorized-message">
              Le partenaire demandé n'a pas été trouvé.
            </p>
            <Link href="/">
              <Button className="w-full" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isUnauthorized || error || !partner) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <Lock className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-foreground" data-testid="text-unauthorized-title">
              Accès non autorisé
            </h1>
            <p className="text-muted-foreground mb-8" data-testid="text-unauthorized-message">
              Le partenaire que vous recherchez n'existe pas ou est actuellement inactif.
            </p>
            <Link href="/">
              <Button className="w-full" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const primaryColor = partner.primaryColor || "#000000";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background to-muted p-4" data-testid="partner-page-container">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center pt-12 pb-8 border-b">
          {partner.logo && (
            <img
              src={partner.logo}
              alt={partner.name}
              className="h-20 w-20 object-contain mx-auto mb-6 rounded-lg"
              data-testid="img-partner-logo"
            />
          )}
          <CardTitle className="text-4xl font-bold mb-2 text-foreground" data-testid="text-partner-name">
            {partner.name}
          </CardTitle>
          {partner.website && (
            <a
              href={partner.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
              data-testid="link-partner-website"
            >
              {partner.website}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </CardHeader>

        <CardContent className="pt-8 pb-12">
          {partner.description && (
            <div className="mb-8">
              <p className="text-foreground leading-relaxed" data-testid="text-partner-description">
                {partner.description}
              </p>
            </div>
          )}

          <div className="flex gap-4 flex-col sm:flex-row">
            <button
              style={{
                backgroundColor: primaryColor,
                color: "#ffffff",
              }}
              className="flex-1 py-3 px-6 rounded-md font-semibold hover:opacity-90 transition-opacity text-white"
              data-testid="button-pay"
            >
              Payer via {partner.name}
            </button>

            {partner.website && (
              <a
                href={partner.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  data-testid="button-visit-website"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visiter le site
                </Button>
              </a>
            )}
          </div>

          <Link href="/">
            <Button
              variant="ghost"
              className="w-full mt-4"
              data-testid="button-back-home-footer"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
