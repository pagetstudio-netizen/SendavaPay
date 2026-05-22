import { useAuth } from "./auth-context";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Chargement...</p>
      </div>
    </div>
  );
}

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {() => {
        if (isLoading) return <LoadingScreen />;
        if (!user) return <Redirect to="/auth" />;
        return <Component />;
      }}
    </Route>
  );
}

export function AdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {() => {
        if (isLoading) return <LoadingScreen />;
        if (!user) return <Redirect to="/auth" />;
        if (user.role !== "admin") return <Redirect to="/dashboard" />;
        return <Component />;
      }}
    </Route>
  );
}
