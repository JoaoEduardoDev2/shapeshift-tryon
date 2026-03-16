import { useNavigate } from "react-router-dom";
import { Scan, Lock, ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  { id: "starter", name: "Starter", price: 29, features: ["50 produtos", "5.000 provas/mês", "Provador por foto"] },
  { id: "growth", name: "Growth", price: 99, popular: true, features: ["300 produtos", "25.000 provas/mês", "Espelho virtual"] },
  { id: "pro", name: "Pro", price: 299, features: ["1.000 produtos", "100.000 provas/mês", "Exportar vídeos"] },
];

export default function Paywall() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
        <Lock className="w-7 h-7 text-destructive" />
      </div>
      <h1 className="text-2xl font-black text-center">Seu período de teste terminou</h1>
      <p className="text-muted-foreground text-center mt-2 max-w-md">
        Para continuar usando o VirtualFit AI, escolha um plano abaixo.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mt-8 max-w-3xl w-full">
        {plans.map((plan) => (
          <div
            key={plan.id}
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
            <p className="text-2xl font-black text-primary mt-1">${plan.price}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
            <ul className="mt-3 space-y-1.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />{f}
                </li>
              ))}
            </ul>
            <Button className="w-full mt-4" size="sm" variant={plan.popular ? "default" : "outline"}>
              Assinar agora <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        ))}
      </div>

      <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground mt-6">
        Voltar à página inicial
      </button>
    </div>
  );
}
