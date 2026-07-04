import { useState } from "react";
import { useLocation, Redirect, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff, ShieldCheck, Mail, Smartphone, RefreshCw, CheckCircle2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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

  // ── Admin 2FA ───────────────────────────────────────────────────────────
  const [adminOtpStep, setAdminOtpStep] = useState(false);
  const [adminTempToken, setAdminTempToken] = useState("");
  const [adminOtpCode, setAdminOtpCode] = useState("");

  // ── Email verification ──────────────────────────────────────────────────
  const [emailVerifStep, setEmailVerifStep] = useState(false);
  const [emailVerifToken, setEmailVerifToken] = useState("");
  const [emailVerifAddress, setEmailVerifAddress] = useState("");
  const [emailVerifCode, setEmailVerifCode] = useState("");

  // ── Nouvel appareil ─────────────────────────────────────────────────────
  const [deviceVerifStep, setDeviceVerifStep] = useState(false);
  const [deviceTempToken, setDeviceTempToken] = useState("");
  const [deviceVerifCode, setDeviceVerifCode] = useState("");
  
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", phone: "", password: "", confirmPassword: "" },
  });

  // ── Admin OTP mutation ─────────────────────────────────────────────────
  const adminOtpMutation = useMutation({
    mutationFn: async ({ tempToken, code }: { tempToken: string; code: string }) => {
      const res = await apiRequest("POST", "/api/auth/admin-verify-otp", { tempToken, code });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data);
      toast({ title: "Connexion admin réussie", description: `Bienvenue, ${data.fullName}!` });
    },
    onError: (e: Error) => {
      toast({ title: "Code invalide", description: e.message, variant: "destructive" });
    },
  });

  // ── Email verification mutation ────────────────────────────────────────
  const emailVerifMutation = useMutation({
    mutationFn: async ({ tempToken, code }: { tempToken: string; code: string }) => {
      const res = await apiRequest("POST", "/api/auth/verify-email", { tempToken, code });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data);
      toast({ title: "Email vérifié ✅", description: `Bienvenue sur SendavaPay, ${data.fullName}!` });
    },
    onError: (e: Error) => {
      toast({ title: "Code invalide", description: e.message, variant: "destructive" });
    },
  });

  // ── Resend verification mutation ───────────────────────────────────────
  const resendVerifMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/auth/resend-verification", { email });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.tempToken) setEmailVerifToken(data.tempToken);
      toast({ title: "Email renvoyé", description: "Vérifiez votre boîte mail (et vos spams)." });
    },
    onError: (e: Error) => {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    },
  });

  // ── Device verification mutation ───────────────────────────────────────
  const deviceVerifMutation = useMutation({
    mutationFn: async ({ tempToken, code }: { tempToken: string; code: string }) => {
      const res = await apiRequest("POST", "/api/auth/verify-device", { tempToken, code });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data);
      toast({ title: "Appareil confirmé ✅", description: `Bienvenue, ${data.fullName}! Cet appareil est maintenant de confiance.` });
    },
    onError: (e: Error) => {
      toast({ title: "Code invalide", description: e.message, variant: "destructive" });
    },
  });

  const onLogin = (data: LoginFormData) => {
    loginMutation.mutate({ emailOrPhone: data.email, password: data.password }, {
      onSuccess: (res: any) => {
        if (res?.requireOtp && res?.tempToken) {
          setAdminTempToken(res.tempToken);
          setAdminOtpStep(true);
        } else if (res?.requireEmailVerification && res?.tempToken) {
          setEmailVerifToken(res.tempToken);
          setEmailVerifAddress(res.email || data.email);
          setEmailVerifStep(true);
        } else if (res?.requireDeviceVerification && res?.tempToken) {
          setDeviceTempToken(res.tempToken);
          setDeviceVerifStep(true);
        }
      }
    });
  };

  const onRegister = (data: RegisterFormData) => {
    registerMutation.mutate(data, {
      onSuccess: (res: any) => {
        if (res?.requireEmailVerification && res?.tempToken) {
          setEmailVerifToken(res.tempToken);
          setEmailVerifAddress(res.email || data.email);
          setEmailVerifStep(true);
          setActiveTab("login");
          toast({
            title: "Compte créé !",
            description: "Un code d'activation a été envoyé à votre adresse email.",
          });
        }
      }
    });
  };

  const onAdminOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminOtpCode.trim()) return;
    adminOtpMutation.mutate({ tempToken: adminTempToken, code: adminOtpCode.trim() });
  };

  const onEmailVerifSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailVerifCode.length !== 6) return;
    emailVerifMutation.mutate({ tempToken: emailVerifToken, code: emailVerifCode.trim() });
  };

  const onDeviceVerifSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deviceVerifCode.length !== 6) return;
    deviceVerifMutation.mutate({ tempToken: deviceTempToken, code: deviceVerifCode.trim() });
  };

  if (user) {
    return <Redirect to={user.role === "admin" ? "/admin" : "/dashboard"} />;
  }

  const renderCodeInput = (
    value: string,
    onChange: (v: string) => void,
    testId: string
  ) => (
    <Input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={6}
      placeholder="123456"
      className="text-center text-3xl h-16 font-mono tracking-widest rounded-xl"
      value={value}
      onChange={e => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      autoFocus
      data-testid={testId}
    />
  );

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

              {/* ── Admin 2FA OTP ──────────────────────────────────────── */}
              {adminOtpStep ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/50 mb-4">
                      <ShieldCheck className="h-8 w-8 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold">Vérification administrateur</h2>
                    <p className="text-muted-foreground mt-2 text-sm">
                      Veuillez saisir le code de 6 chiffres que vous avez reçu.
                    </p>
                  </div>
                  <form onSubmit={onAdminOtpSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminOtpCode">Code de vérification</Label>
                      {renderCodeInput(adminOtpCode, setAdminOtpCode, "input-admin-otp")}
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-14 rounded-xl text-lg font-bold"
                      disabled={adminOtpMutation.isPending || adminOtpCode.length !== 6}
                      data-testid="button-admin-otp-submit"
                    >
                      {adminOtpMutation.isPending ? (
                        <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Vérification...</>
                      ) : "Confirmer"}
                    </Button>
                    <button
                      type="button"
                      className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => { setAdminOtpStep(false); setAdminOtpCode(""); setAdminTempToken(""); }}
                    >
                      ← Retour à la connexion
                    </button>
                  </form>
                </div>

              /* ── Email verification step ─────────────────────────────── */
              ) : emailVerifStep ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/50 mb-4">
                      <Mail className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold">Vérifiez votre email</h2>
                    <p className="text-muted-foreground mt-2 text-sm">
                      Un code d'activation a été envoyé à<br />
                      <strong className="text-foreground">{emailVerifAddress}</strong>
                    </p>
                  </div>

                  <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 text-sm text-green-800 dark:text-green-300">
                    <CheckCircle2 className="h-4 w-4 inline mr-2" />
                    Vous pouvez aussi cliquer sur le lien dans l'email pour activer directement votre compte.
                  </div>

                  <form onSubmit={onEmailVerifSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Code d'activation (6 chiffres)</Label>
                      {renderCodeInput(emailVerifCode, setEmailVerifCode, "input-email-verif-code")}
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-14 rounded-xl text-lg font-bold"
                      disabled={emailVerifMutation.isPending || emailVerifCode.length !== 6}
                      data-testid="button-email-verif-submit"
                    >
                      {emailVerifMutation.isPending ? (
                        <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Activation...</>
                      ) : "Activer mon compte"}
                    </Button>
                    <div className="flex items-center justify-between text-sm">
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => { setEmailVerifStep(false); setEmailVerifCode(""); }}
                      >
                        ← Retour
                      </button>
                      <button
                        type="button"
                        className="text-primary hover:underline flex items-center gap-1"
                        disabled={resendVerifMutation.isPending}
                        onClick={() => resendVerifMutation.mutate(emailVerifAddress)}
                        data-testid="button-resend-verif"
                      >
                        {resendVerifMutation.isPending
                          ? <><Loader2 className="h-3 w-3 animate-spin" />Envoi...</>
                          : <><RefreshCw className="h-3 w-3" />Renvoyer le code</>
                        }
                      </button>
                    </div>
                  </form>
                </div>

              /* ── Device verification step ────────────────────────────── */
              ) : deviceVerifStep ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/50 mb-4">
                      <Smartphone className="h-8 w-8 text-orange-600" />
                    </div>
                    <h2 className="text-xl font-bold">Nouvel appareil détecté</h2>
                    <p className="text-muted-foreground mt-2 text-sm">
                      Pour protéger votre compte, un code de confirmation a été envoyé à votre adresse email.
                    </p>
                  </div>

                  <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 p-4 text-sm text-orange-800 dark:text-orange-300">
                    <ShieldCheck className="h-4 w-4 inline mr-2" />
                    Cet appareil sera mémorisé pendant 90 jours après vérification.
                  </div>

                  <form onSubmit={onDeviceVerifSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Code de confirmation (6 chiffres)</Label>
                      {renderCodeInput(deviceVerifCode, setDeviceVerifCode, "input-device-verif-code")}
                      <p className="text-xs text-muted-foreground text-center">
                        Vous pouvez aussi cliquer sur le lien dans l'email.
                      </p>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-14 rounded-xl text-lg font-bold"
                      disabled={deviceVerifMutation.isPending || deviceVerifCode.length !== 6}
                      data-testid="button-device-verif-submit"
                    >
                      {deviceVerifMutation.isPending ? (
                        <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Vérification...</>
                      ) : "Confirmer la connexion"}
                    </Button>
                    <button
                      type="button"
                      className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => { setDeviceVerifStep(false); setDeviceVerifCode(""); setDeviceTempToken(""); }}
                    >
                      ← Retour à la connexion
                    </button>
                  </form>
                </div>

              ) : (
              <>
              <div className="text-center mb-8">
                <p className="text-muted-foreground">
                  Veuillez utiliser vos identifiants Sendava pour accéder à votre compte SendavaPay.
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
              </>)}
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
