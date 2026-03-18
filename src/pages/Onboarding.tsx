import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scan, Check, ArrowLeft, Loader2, Building2, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validateCPF, validateCNPJ, validatePhone, validateEmail, formatCPF, formatCNPJ, formatPhone } from "@/lib/validators";
import { STRIPE_PLANS, PlanKey } from "@/lib/stripe";

const segments = [
  "Moda feminina", "Moda masculina", "Moda infantil", "Moda fitness",
  "Óculos", "Calçados", "Beleza e maquiagem", "Joias e acessórios", "Multimarcas", "Outro",
];

const professions = [
  "Criador de conteúdo", "Influenciador", "Afiliado", "Revendedor",
  "Dropshipper", "Social media", "Outro",
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | "">("");
  const [accountType, setAccountType] = useState<"pj" | "pf" | "">("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "",
    cpf: "", cnpj: "", companyName: "", storeName: "", segment: "", profession: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const updateField = (field: string, value: string) => {
    let formatted = value;
    if (field === "cpf") formatted = formatCPF(value);
    if (field === "cnpj") formatted = formatCNPJ(value);
    if (field === "phone") formatted = formatPhone(value);
    setForm(prev => ({ ...prev, [field]: formatted }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validateStep3 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Nome é obrigatório";
    if (!validateEmail(form.email)) errs.email = "Email inválido";
    if (form.password.length < 6) errs.password = "Mínimo 6 caracteres";
    if (!validatePhone(form.phone)) errs.phone = "Telefone inválido";

    if (accountType === "pj") {
      if (!validateCNPJ(form.cnpj)) errs.cnpj = "CNPJ inválido";
      if (!form.companyName.trim()) errs.companyName = "Nome da empresa é obrigatório";
      if (!form.storeName.trim()) errs.storeName = "Nome da loja é obrigatório";
      if (!form.segment) errs.segment = "Selecione um segmento";
    } else {
      if (!validateCPF(form.cpf)) errs.cpf = "CPF inválido";
      if (!form.profession) errs.profession = "Selecione uma profissão";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.name, plan: selectedPlan || "starter" },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) {
        // "User already registered" — guide them to login
        if (error.message.toLowerCase().includes("already") ||
            error.message.toLowerCase().includes("registered") ||
            error.message.toLowerCase().includes("exists")) {
          toast({
            title: "Email já cadastrado",
            description: "Este email já possui uma conta. Faça login ou recupere sua senha.",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }
        throw error;
      }

      const userId = data.user?.id;

      // Update profile fields using the session that signUp may return.
      // When Supabase has email confirmation DISABLED the session comes back
      // immediately. If confirmation IS required the session is null and we
      // skip the update – the trigger already created the row with full_name.
      if (data.session && userId) {
        await supabase.from("profiles").update({
          full_name: form.name,
          phone: form.phone,
          account_type: accountType,
          cpf: accountType === "pf" ? form.cpf.replace(/\D/g, '') : null,
          cnpj: accountType === "pj" ? form.cnpj.replace(/\D/g, '') : null,
          company_name: accountType === "pj" ? form.companyName : null,
          store_name: accountType === "pj" ? form.storeName : null,
          segment: accountType === "pj" ? form.segment : null,
          profession: accountType === "pf" ? form.profession : null,
        }).eq("id", userId);

        toast({ title: "Conta criada! 🎉", description: "Bem-vindo! Seu trial de 7 dias começou." });
        navigate("/admin");
        return;
      }

      // Email confirmation required — session is null
      toast({
        title: "Confirme seu email ✉️",
        description: "Enviamos um link de confirmação. Após confirmar, volte aqui para fazer login.",
      });
      navigate("/auth");
    } catch (err: any) {
      toast({ title: "Erro ao criar conta", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const planEntries = (Object.entries(STRIPE_PLANS) as [PlanKey, typeof STRIPE_PLANS[PlanKey]][]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Scan className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">VirtualFit AI</span>
        </div>
        <button onClick={() => navigate("/auth")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Já tem conta? Entrar
        </button>
      </header>

      {/* Progress */}
      <div className="px-6 pt-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Etapa {step} de {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-2 text-xs">
          <span className={step >= 1 ? "text-primary font-medium" : "text-muted-foreground"}>Plano</span>
          <span className={step >= 2 ? "text-primary font-medium" : "text-muted-foreground"}>Tipo de conta</span>
          <span className={step >= 3 ? "text-primary font-medium" : "text-muted-foreground"}>Dados</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl">

          {/* Step 1 — Choose Plan */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <h1 className="text-2xl font-black">Escolha seu plano</h1>
                <p className="text-muted-foreground mt-1">7 dias grátis. Cancele quando quiser.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {planEntries.map(([key, plan]) => (
                  <button
                    key={key}
                    onClick={() => { setSelectedPlan(key); setStep(2); }}
                    className={`relative text-left rounded-2xl border-2 p-5 transition-all hover:border-primary/60 hover:shadow-[var(--shadow-glow)] ${
                      selectedPlan === key ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-4 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> POPULAR
                      </span>
                    )}
                    <div className="mb-3">
                      <h3 className="font-bold text-lg">{plan.name}</h3>
                      {plan.price ? (
                        <p className="text-2xl font-black text-primary">R${plan.price}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                      ) : (
                        <p className="text-lg font-bold text-muted-foreground">Sob consulta</p>
                      )}
                    </div>
                    <ul className="space-y-1.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-3.5 h-3.5 text-primary shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 text-center text-xs font-medium text-primary">
                      Testar grátis por 7 dias →
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Account Type */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <h1 className="text-2xl font-black">Tipo de conta</h1>
                <p className="text-muted-foreground mt-1">Selecione o tipo que melhor se aplica</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 max-w-md mx-auto">
                <button
                  onClick={() => { setAccountType("pj"); setStep(3); }}
                  className={`rounded-2xl border-2 p-6 text-center transition-all hover:border-primary/60 ${
                    accountType === "pj" ? "border-primary bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <Building2 className="w-10 h-10 mx-auto mb-3 text-primary" />
                  <h3 className="font-bold">Pessoa Jurídica</h3>
                  <p className="text-xs text-muted-foreground mt-1">Empresa ou loja</p>
                </button>
                <button
                  onClick={() => { setAccountType("pf"); setStep(3); }}
                  className={`rounded-2xl border-2 p-6 text-center transition-all hover:border-primary/60 ${
                    accountType === "pf" ? "border-primary bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <User className="w-10 h-10 mx-auto mb-3 text-primary" />
                  <h3 className="font-bold">Pessoa Física</h3>
                  <p className="text-xs text-muted-foreground mt-1">Criador ou influenciador</p>
                </button>
              </div>
              <div className="flex justify-center">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 — Registration Form */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <h1 className="text-2xl font-black">Criar sua conta</h1>
                <p className="text-muted-foreground mt-1">
                  Plano <span className="text-primary font-semibold capitalize">{selectedPlan}</span> —{" "}
                  {selectedPlan && STRIPE_PLANS[selectedPlan]?.price
                    ? `R$${STRIPE_PLANS[selectedPlan].price}/mês`
                    : "Sob consulta"
                  }{" "}
                  — 7 dias grátis
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome completo</Label>
                    <Input id="name" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Seu nome" />
                    {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="(11) 99999-9999" />
                    {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="seu@email.com" />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} placeholder="Mínimo 6 caracteres" />
                  {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
                </div>

                {accountType === "pj" && (
                  <div className="space-y-4 pt-2 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dados da empresa</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <Input id="cnpj" value={form.cnpj} onChange={(e) => updateField("cnpj", e.target.value)} placeholder="00.000.000/0000-00" />
                        {errors.cnpj && <p className="text-xs text-destructive mt-1">{errors.cnpj}</p>}
                      </div>
                      <div>
                        <Label htmlFor="companyName">Nome da empresa</Label>
                        <Input id="companyName" value={form.companyName} onChange={(e) => updateField("companyName", e.target.value)} placeholder="Razão social" />
                        {errors.companyName && <p className="text-xs text-destructive mt-1">{errors.companyName}</p>}
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="storeName">Nome da loja</Label>
                        <Input id="storeName" value={form.storeName} onChange={(e) => updateField("storeName", e.target.value)} placeholder="Nome fantasia" />
                        {errors.storeName && <p className="text-xs text-destructive mt-1">{errors.storeName}</p>}
                      </div>
                      <div>
                        <Label htmlFor="segment">Segmento</Label>
                        <Select value={form.segment} onValueChange={(v) => updateField("segment", v)}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {segments.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {errors.segment && <p className="text-xs text-destructive mt-1">{errors.segment}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {accountType === "pf" && (
                  <div className="space-y-4 pt-2 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dados pessoais</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cpf">CPF</Label>
                        <Input id="cpf" value={form.cpf} onChange={(e) => updateField("cpf", e.target.value)} placeholder="000.000.000-00" />
                        {errors.cpf && <p className="text-xs text-destructive mt-1">{errors.cpf}</p>}
                      </div>
                      <div>
                        <Label htmlFor="profession">Profissão</Label>
                        <Select value={form.profession} onValueChange={(v) => updateField("profession", v)}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {professions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {errors.profession && <p className="text-xs text-destructive mt-1">{errors.profession}</p>}
                      </div>
                    </div>
                  </div>
                )}

                <Button onClick={handleSubmit} className="w-full mt-2" disabled={loading} size="lg">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Criar conta e iniciar teste grátis
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  Ao criar sua conta, você concorda com os Termos de Uso e Política de Privacidade.
                </p>
              </div>

              <div className="flex justify-center">
                <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
