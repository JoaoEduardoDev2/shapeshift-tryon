import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowRight, Check, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STRIPE_PLANS, ANNUAL_DISCOUNT, PlanKey } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Paywall() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [annual, setAnnual] = useState(false);

  const handleSubscribe = async (planKey: PlanKey) => {
    const plan = STRIPE_PLANS[planKey];
    if (!plan.price_id) {
      toast({ title: "Entre em contato para o plano Enterprise", description: "contato@virtualfit.app" });
      return;
    }
    const priceId = annual ? plan.price_id_annual : plan.price_id;
    if (!priceId) return;

    setLoading(planKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const displayPlans = (["starter", "growth", "pro"] as PlanKey[]).map((key) => ({
    key,
    ...STRIPE_PLANS[key],
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
        <Lock className="w-7 h-7 text-destructive" />
      </div>
      <h1 className="text-2xl font-black text-center">Seu período de teste terminou</h1>
      <p className="text-muted-foreground text-center mt-2 max-w-md">
        Para continuar usando o VirtualFit AI, escolha um plano abaixo.
      </p>

      {/* Toggle mensal/anual */}
      <div className="flex items-center justify-center gap-3 mt-6 mb-6">
        <span className={`text-sm font-medium transition-colors ${!annual ? "text-foreground" : "text-muted-foreground"}`}>
          Mensal
        </span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${annual ? "bg-primary" : "bg-muted"}`}
        >
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md"
            style={{ left: annual ? "calc(100% - 1.625rem)" : "0.125rem" }}
          />
        </button>
        <span className={`text-sm font-medium transition-colors ${annual ? "text-foreground" : "text-muted-foreground"}`}>
          Anual
        </span>
        <AnimatePresence>
          {annual && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="ml-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold"
            >
              −20% OFF
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 max-w-3xl w-full">
        {displayPlans.map((plan) => {
          const monthlyPrice = plan.price!;
          const displayPrice = annual ? monthlyPrice * (1 - ANNUAL_DISCOUNT) : monthlyPrice;

          return (
            <div
              key={plan.key}
              className={`relative rounded-2xl border-2 p-5 ${
                plan.popular ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-4 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> POPULAR
                </span>
              )}
              <h3 className="font-bold">{plan.name}</h3>
              <div className="mt-1">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={annual ? "annual" : "monthly"}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="text-2xl font-black text-primary"
                  >
                    R${formatPrice(displayPrice)}
                    <span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </motion.p>
                </AnimatePresence>
                {annual && (
                  <p className="text-xs text-muted-foreground line-through mt-0.5">
                    R${formatPrice(monthlyPrice)}/mês
                  </p>
                )}
              </div>
              <ul className="mt-3 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full mt-4"
                size="sm"
                variant={plan.popular ? "default" : "outline"}
                disabled={loading === plan.key}
                onClick={() => handleSubscribe(plan.key)}
              >
                {loading === plan.key ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Assinar agora <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          );
        })}
      </div>

      <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground mt-6">
        Voltar à página inicial
      </button>
    </div>
  );
}
