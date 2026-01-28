import { useEffect } from "react";
import { useLocation } from "wouter";

export default function ApiDocsPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/docs");
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Redirection vers la documentation...</p>
    </div>
  );
}
