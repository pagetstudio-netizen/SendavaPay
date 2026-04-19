import { useState, useEffect } from "react";
import { useLocation, Redirect, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import logoPath from "@assets/20251211_105226_1765450558306.png";
import heroImage from "@assets/IMG-20251205-WA0058(1)_1765450585004.jpg";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

const registerSchema = z.object({
  fullName: z.string().min(2, "Nom complet requis (minimum 2 caractères)"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide (minimum 8 chiffres)"),
  password: z.string().min(6, "Mot de passe minimum 6 caractères"),
  confirmPassword: z.string().min(6, "Confirmation requise"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const defaultTab = searchParams.get("tab") === "register" ? "register" : "login";
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { user, loginMutation, registerMutation } = useAuth();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLogin = (data: LoginFormData) => {
    loginMutation.mutate({
      emailOrPhone: data.email,
      password: data.password
    });
  };

  const onRegister = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  if (user) {
    return <Redirect to={user.role === "admin" ? "/admin" : "/dashboard"} />;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center justify-center space-y-6">
            <Link href="/">
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black text-primary tracking-tighter italic">SendavaPay</span>
              </div>
            </Link>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="login" className="mt-6">
              <div className="text-center mb-8">
                <p className="text-muted-foreground">
                  1 Veuillez utiliser vos identifiants Sendava pour accéder à votre compte SendavaPay.
                </p>
              </div>
              <div className="space-y-6">
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="vous@exemple.com"
                      className="bg-muted/50 border-muted rounded-xl h-12"
                      {...loginForm.register("email")}
                      data-testid="input-login-email"
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {loginForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="bg-muted/50 border-muted rounded-xl h-12 pr-12"
                        {...loginForm.register("password")}
                        data-testid="input-login-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground"
                        onClick={() => setShowPassword(!showPassword)}
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

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-full border border-primary flex items-center justify-center cursor-pointer">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary opacity-0 hover:opacity-20 transition-opacity" />
                      </div>
                      <span className="text-sm text-muted-foreground">Se souvenir de moi</span>
                    </div>
                    <Link href="/forgot-password" data-testid="link-forgot-password">
                      <span className="text-sm font-medium text-primary cursor-pointer hover:underline">
                        Mot de passe oublié ?
                      </span>
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-14 rounded-xl text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                    disabled={loginMutation.isPending}
                    data-testid="button-login-submit"
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Connexion...
                      </>
                    ) : (
                      "Se connecter"
                    )}
                  </Button>
                </form>
                
                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    Pas encore de compte ?{" "}
                    <span 
                      className="text-primary font-bold cursor-pointer hover:underline"
                      onClick={() => setActiveTab("register")}
                    >
                      Créer un compte
                    </span>
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="register" className="mt-6">
              <div className="text-center mb-8">
                <p className="text-muted-foreground">Créez votre compte</p>
              </div>
              <div className="space-y-6">
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-semibold">Nom complet</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Jean Dupont"
                      className="bg-muted/50 border-muted rounded-xl h-12"
                      {...registerForm.register("fullName")}
                      data-testid="input-register-name"
                    />
                    {registerForm.formState.errors.fullName && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="vous@exemple.com"
                      className="bg-muted/50 border-muted rounded-xl h-12"
                      {...registerForm.register("email")}
                      data-testid="input-register-email"
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold">Numéro de téléphone (optionnel)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+228 90000000"
                      className="bg-muted/50 border-muted rounded-xl h-12"
                      {...registerForm.register("phone")}
                      data-testid="input-register-phone"
                    />
                    {registerForm.formState.errors.phone && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registerPassword">Mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="registerPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="bg-muted/50 border-muted rounded-xl h-12 pr-12"
                        {...registerForm.register("password")}
                        data-testid="input-register-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground space-y-1">
                      <p className="font-semibold text-foreground/80">Le mot de passe doit contenir :</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-1">
                        <li>Au moins 8 caractères</li>
                        <li>Une lettre majuscule</li>
                        <li>Une lettre minuscule</li>
                        <li>Un chiffre</li>
                      </ul>
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="bg-muted/50 border-muted rounded-xl h-12 pr-12"
                        {...registerForm.register("confirmPassword")}
                        data-testid="input-register-confirm-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-14 rounded-xl text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                    disabled={registerMutation.isPending}
                    data-testid="button-register-submit"
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      "Créer mon compte"
                    )}
                  </Button>

                  <p className="text-[10px] text-center text-muted-foreground pt-2">
                    En créant un compte, vous acceptez nos{" "}
                    <span className="text-primary font-medium hover:underline cursor-pointer">Conditions d'utilisation</span>{" "}
                    et notre{" "}
                    <span className="text-primary font-medium hover:underline cursor-pointer">Politique de confidentialité</span>
                  </p>
                </form>
                
                <div className="text-center pb-4">
                  <p className="text-sm text-muted-foreground">
                    Déjà un compte ?{" "}
                    <span 
                      className="text-primary font-bold cursor-pointer hover:underline"
                      onClick={() => setActiveTab("login")}
                    >
                      Se connecter
                    </span>
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="hidden lg:block relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary/70" />
        <img
          src={heroImage}
          alt="SendavaPay"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Avec nous, c'est facile et rapide pour faire vos transactions et recevoir de l'argent.
          </h2>
          <p className="text-lg opacity-90">
            Rejoignez des milliers d'utilisateurs qui font confiance à SendavaPay 
            pour leurs paiements en Afrique de l'Ouest.
          </p>
        </div>
      </div>
    </div>
  );
}
