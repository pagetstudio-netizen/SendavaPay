import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { partnerLoginSchema } from "@shared/schema";
import { ThemeToggle } from "@/components/theme-toggle";
import logoPath from "@assets/20251211_105226_1765450558306.png";

type LoginFormData = {
  email: string;
  password: string;
};

export default function PartnerLoginPage() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(partnerLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const res = await apiRequest("POST", "/api/partner/login", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Connecté",
        description: "Bienvenue sur votre tableau de bord partenaire",
      });
      navigate("/partner/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Email ou mot de passe incorrect",
        variant: "destructive",
      });
    },
  });

  const onLogin = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between p-4 md:p-6">
        <a href="/" className="hover:opacity-80 transition-opacity" data-testid="link-home">
          <span className="text-2xl md:text-3xl font-black text-primary tracking-tighter italic">
            SendavaPay
          </span>
        </a>
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-4">
                <img src={logoPath} alt="SendavaPay" className="h-12 w-12 object-contain" />
              </div>
              <CardTitle className="text-center text-2xl font-bold">
                Connexion Partenaire
              </CardTitle>
              <CardDescription className="text-center">
                Accédez à votre tableau de bord partenaire
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg h-10"
                    {...loginForm.register("email")}
                    data-testid="input-partner-login-email"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold">
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg h-10 pr-10"
                      {...loginForm.register("password")}
                      data-testid="input-partner-login-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="button-toggle-password-visibility"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 mt-2 rounded-lg font-semibold"
                  disabled={loginMutation.isPending}
                  data-testid="button-partner-login-submit"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Retour à{" "}
                  <a
                    href="/"
                    className="text-primary hover:underline font-medium"
                    data-testid="link-back-to-home"
                  >
                    la page principale
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
            © 2026 SendavaPay. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}
