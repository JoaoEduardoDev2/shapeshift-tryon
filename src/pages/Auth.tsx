import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scan, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const translateError = (msg: string): string => {
    if (msg.includes("Invalid login credentials"))       return "Email ou senha incorretos.";
    if (msg.includes("Email not confirmed"))             return "Email não confirmado. Confirme seu cadastro antes de entrar.";
    if (msg.includes("Too many requests"))               return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
    if (msg.includes("User not found"))                  return "Não encontramos uma conta com este email.";
    if (msg.includes("Password should be at least"))    return "A senha deve ter pelo menos 6 caracteres.";
    return msg;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowResend(false);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "Bem-vindo de volta!" });
      navigate("/admin");
    } catch (err: any) {
      const translated = translateError(err.message);
      const isUnconfirmed = err.message.includes("Email not confirmed");
      if (isUnconfirmed) setShowResend(true);
      toast({ title: "Erro ao entrar", description: translated, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast({ title: "Informe seu email", description: "Digite seu email antes de reenviar.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      setResendSent(true);
      toast({ title: "Email reenviado! ✉️", description: "Verifique sua caixa de entrada." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Email enviado!", description: "Verifique sua caixa de entrada." });
      setShowForgot(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 px-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
              <Scan className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-black">
              {showForgot ? "Recuperar Senha" : "Entrar"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {showForgot
                ? "Enviaremos um link de recuperação"
                : "Acesse o provador virtual"}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            {showForgot ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enviar Link
                </Button>
                <button type="button" onClick={() => setShowForgot(false)} className="text-sm text-muted-foreground hover:text-foreground w-full text-center">
                  Voltar ao login
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-muted-foreground hover:text-foreground">
                  Esqueceu a senha?
                </button>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Entrar
                </Button>
                {showResend && (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-700 dark:text-amber-400">
                    <p className="font-medium mb-1">Email não confirmado</p>
                    <p className="text-xs mb-2">Verifique sua caixa de entrada ou spam. Se não recebeu:</p>
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={loading || resendSent}
                      className="text-xs font-semibold underline disabled:opacity-50"
                    >
                      {resendSent ? "Email reenviado! Verifique sua caixa." : "Reenviar email de confirmação"}
                    </button>
                  </div>
                )}
              </form>
            )}

            {!showForgot && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                Não tem conta?{" "}
                <button onClick={() => navigate("/onboarding")} className="text-primary hover:underline font-medium">
                  Criar agora
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
