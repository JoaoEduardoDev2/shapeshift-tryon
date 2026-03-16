import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap, Crown, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

interface Plan {
  name: string;
  price: string;
  period?: string;
  description: string;
  icon: typeof Sparkles;
  features: string[];
  highlight?: boolean;
  cta: string;
}

const plans: Plan[] = [
  {
    name: "Starter",
    price: "R$149,90",
    period: "/mês",
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
    price: "R$299,90",
    period: "/mês",
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
    price: "R$499,90",
    period: "/mês",
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
    price: "Custom",
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

export function Pricing() {
  return (
    <section className="py-32 px-4" id="pricing">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            Planos que <span className="text-gradient">escalam</span> com você
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Comece grátis. Escale conforme cresce. Cancele quando quiser.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl border p-6 flex flex-col transition-all duration-300 ${
                plan.highlight
                  ? "border-primary/50 bg-primary/5 shadow-glow"
                  : "border-border bg-card hover:border-primary/20"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
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
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
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
          ))}
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
            Todos os planos incluem: SSL · LGPD/GDPR · Suporte por email · 14 dias grátis
          </p>
        </motion.div>
      </div>
    </section>
  );
}
