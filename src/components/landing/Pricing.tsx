import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap, Crown, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ANNUAL_DISCOUNT } from "@/lib/stripe";

const ANNUAL_DISCOUNT = 0.20; // 20% off

interface PlanData {
  name: string;
  monthlyPrice: number | null;
  description: string;
  icon: typeof Sparkles;
  features: string[];
  highlight?: boolean;
  cta: string;
}

const plans: PlanData[] = [
  {
    name: "Starter",
    monthlyPrice: 149.9,
    description: "Para lojas começando com provador virtual",
    icon: Sparkles,
    cta: "Começar Agora",
    features: [
      "Até 50 produtos",
      "5.000 provas/mês",
      "Provador por foto",
      "Maquiagem básica",
      "Provador de óculos",
      "Download de imagem",
      "Analytics básico",
    ],
  },
  {
    name: "Growth",
    monthlyPrice: 299.9,
    description: "Para lojas em crescimento que querem converter mais",
    icon: Zap,
    highlight: true,
    cta: "Escolher Growth",
    features: [
      "300 produtos",
      "25.000 provas/mês",
      "Espelho virtual em tempo real",
      "Roupas superiores completas",
      "Maquiagem avançada",
      "Compartilhamento social",
      "Exportar imagem",
      "Tudo do Starter",
    ],
  },
  {
    name: "Pro",
    monthlyPrice: 499.9,
    description: "Para operações profissionais de e-commerce",
    icon: Crown,
    cta: "Escolher Pro",
    features: [
      "1.000 produtos",
      "100.000 provas/mês",
      "Animação de simulações",
      "Exportar vídeo & GIF",
      "Provador completo (moda + beleza)",
      "Integração com todas plataformas",
      "API completa",
      "White label parcial",
      "Tudo do Growth",
    ],
  },
  {
    name: "Enterprise",
    monthlyPrice: null,
    description: "Para grandes marcas e marketplaces",
    icon: Building2,
    cta: "Falar com Vendas",
    features: [
      "Produtos ilimitados",
      "Provas ilimitadas",
      "Simulação de tecido avançada",
      "Avatar corporal 3D",
      "White label total",
      "API ilimitada",
      "SLA dedicado",
      "Suporte prioritário",
      "Tudo do Pro",
    ],
  },
];

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="py-32 px-4" id="pricing">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            Planos que <span className="text-gradient">escalam</span> com você
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Comece grátis. Escale conforme cresce. Cancele quando quiser.
          </p>
        </motion.div>

        {/* Toggle mensal / anual */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-3 mb-14"
        >
          <span className={`text-sm font-medium transition-colors ${!annual ? "text-foreground" : "text-muted-foreground"}`}>
            Mensal
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
              annual ? "bg-primary" : "bg-muted"
            }`}
            aria-label="Alternar entre plano mensal e anual"
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
                initial={{ opacity: 0, scale: 0.8, x: -8 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -8 }}
                className="ml-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold"
              >
                −20% OFF
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map((plan, i) => {
            const monthly = plan.monthlyPrice;
            const displayPrice = monthly
              ? annual
                ? monthly * (1 - ANNUAL_DISCOUNT)
                : monthly
              : null;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`group relative rounded-2xl border p-6 flex flex-col transition-all duration-300 ${
                  plan.highlight
                    ? "border-primary/50 bg-primary/5 shadow-glow"
                    : "border-border bg-card hover:border-primary/20"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground whitespace-nowrap">
                    MAIS POPULAR
                  </div>
                )}

                <div className="mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                    plan.highlight ? "bg-primary/20" : "bg-primary/10"
                  }`}>
                    <plan.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>

                  <div className="mt-4">
                    {displayPrice !== null ? (
                      <div className="flex items-baseline gap-1.5">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={annual ? "annual" : "monthly"}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="text-4xl font-black"
                          >
                            R${formatPrice(displayPrice)}
                          </motion.span>
                        </AnimatePresence>
                        <span className="text-muted-foreground text-sm">/mês</span>
                      </div>
                    ) : (
                      <span className="text-4xl font-black">Custom</span>
                    )}

                    {annual && monthly && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1.5 flex items-center gap-2"
                      >
                        <span className="text-xs text-muted-foreground line-through">
                          R${formatPrice(monthly)}/mês
                        </span>
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          ECONOMIZE R${formatPrice(monthly * ANNUAL_DISCOUNT * 12)}/ano
                        </span>
                      </motion.div>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/auth">
                  <Button
                    className="w-full"
                    variant={plan.highlight ? "default" : "outline"}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-xs text-muted-foreground">
            Todos os planos incluem: SSL · LGPD/GDPR · Suporte por email · 7 dias grátis
          </p>
        </motion.div>
      </div>
    </section>
  );
}
