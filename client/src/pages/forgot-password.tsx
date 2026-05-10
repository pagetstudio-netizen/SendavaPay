import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft, Mail, KeyRound, Lock, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

async function apiFetch(method: string, url: string, data?: unknown) {
  const res = await apiRequest(method, url, data);
  return res.json();
}

const emailSchema = z.object({
  email: z.string().email("Email invalide"),
});

const codeSchema = z.object({
  code: z.string().length(6, "Le code doit contenir 6 chiffres").regex(/^\d+$/, "Le code ne doit contenir que des chiffres"),
});

const passwordSchema = z.object({
  password: z.string().min(6, "Mot de passe minimum 6 caractères"),
  confirmPassword: z.string().min(6, "Confirmation requise"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type Step = "email" | "code" | "password" | "done";

export default function ForgotPasswordPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const [emailLoading, setEmailLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    const token = params.get("token");
    if (token) {
      setResetToken(token);
      setStep("password");
    }
  }, [location]);

  const onSubmitEmail = async (data: z.infer<typeof emailSchema>) => {
    setEmailLoading(true);
    try {
      await apiFetch("POST", "/api/auth/forgot-password", { email: data.email });
      setEmail(data.email);
      setStep("code");
      toast({ title: "Email envoyé", description: "Vérifiez votre boîte mail pour le code à 6 chiffres." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Impossible d'envoyer l'email." });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleCodeDigit = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...codeDigits];
    next[index] = value.slice(-1);
    setCodeDigits(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCodeDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const onSubmitCode = async () => {
    const code = codeDigits.join("");
    if (code.length < 6) {
      toast({ variant: "destructive", title: "Code incomplet", description: "Entrez les 6 chiffres du code." });
      return;
    }
    setCodeLoading(true);
    try {
      const data = await apiFetch("POST", "/api/auth/verify-reset-code", { email, code });
      setResetToken(data.token);
      setStep("password");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Code invalide", description: err.message || "Code incorrect ou expiré." });
    } finally {
      setCodeLoading(false);
    }
  };

  const onSubmitPassword = async (data: z.infer<typeof passwordSchema>) => {
    setPasswordLoading(true);
    try {
      await apiFetch("POST", "/api/auth/reset-password", { token: resetToken, password: data.password });
      setStep("done");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Impossible de réinitialiser le mot de passe." });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-3xl font-black text-primary tracking-tighter italic cursor-pointer">SendavaPay</span>
          </Link>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6">

          {step === "email" && (
            <>
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Mot de passe oublié ?</h1>
                <p className="text-muted-foreground text-sm">
                  Entrez votre email et nous vous enverrons un code de vérification à 6 chiffres.
                </p>
              </div>

              <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    className="bg-muted/50 border-muted rounded-xl h-12"
                    {...emailForm.register("email")}
                    data-testid="input-forgot-email"
                  />
                  {emailForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl font-bold"
                  disabled={emailLoading}
                  data-testid="button-forgot-submit"
                >
                  {emailLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Envoi en cours...</> : "Envoyer le code"}
                </Button>
              </form>

              <div className="text-center">
                <Link href="/auth">
                  <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer inline-flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3" /> Retour à la connexion
                  </span>
                </Link>
              </div>
            </>
          )}

          {step === "code" && (
            <>
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="h-7 w-7 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Vérification</h1>
                <p className="text-muted-foreground text-sm">
                  Un code à 6 chiffres a été envoyé à <br />
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-center gap-3" onPaste={handleCodePaste}>
                  {codeDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeDigit(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      className="w-12 h-14 text-center text-xl font-bold border-2 border-muted rounded-xl bg-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      data-testid={`input-code-digit-${i}`}
                    />
                  ))}
                </div>

                <Button
                  onClick={onSubmitCode}
                  className="w-full h-12 rounded-xl font-bold"
                  disabled={codeLoading || codeDigits.join("").length < 6}
                  data-testid="button-verify-code"
                >
                  {codeLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Vérification...</> : "Vérifier le code"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Vous n'avez pas reçu le code ?{" "}
                  <button
                    type="button"
                    className="text-primary font-medium hover:underline"
                    onClick={() => { setStep("email"); setCodeDigits(["", "", "", "", "", ""]); }}
                  >
                    Renvoyer
                  </button>
                </p>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" /> Changer l'email
                </button>
              </div>
            </>
          )}

          {step === "password" && (
            <>
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-7 w-7 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Nouveau mot de passe</h1>
                <p className="text-muted-foreground text-sm">Choisissez un nouveau mot de passe sécurisé.</p>
              </div>

              <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="bg-muted/50 border-muted rounded-xl h-12 pr-12"
                      {...passwordForm.register("password")}
                      data-testid="input-new-password"
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
                  {passwordForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{passwordForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      className="bg-muted/50 border-muted rounded-xl h-12 pr-12"
                      {...passwordForm.register("confirmPassword")}
                      data-testid="input-confirm-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground"
                      onClick={() => setShowConfirm(!showConfirm)}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl font-bold"
                  disabled={passwordLoading}
                  data-testid="button-reset-password"
                >
                  {passwordLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Réinitialisation...</> : "Réinitialiser le mot de passe"}
                </Button>
              </form>
            </>
          )}

          {step === "done" && (
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Mot de passe modifié !</h1>
                <p className="text-muted-foreground text-sm">
                  Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.
                </p>
              </div>
              <Button
                className="w-full h-12 rounded-xl font-bold"
                onClick={() => navigate("/auth")}
                data-testid="button-go-to-login"
              >
                Se connecter
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
