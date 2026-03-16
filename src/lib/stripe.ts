export const STRIPE_PLANS = {
  starter: {
    name: "Starter",
    price: 149.9,
    price_id: "price_1TBdDaFIwaU6XMYXNwFwIbyR",
    product_id: "prod_U9x79sOee9EsNi",
    popular: false,
    features: ["50 produtos", "5.000 provas/mês", "Provador por foto", "Analytics básico"],
  },
  growth: {
    name: "Growth",
    price: 299.9,
    price_id: "price_1TBdEmFIwaU6XMYXAqC3qsZH",
    product_id: "prod_U9x9AjZwdHTpE8",
    popular: true,
    features: ["300 produtos", "25.000 provas/mês", "Espelho virtual", "Compartilhamento social"],
  },
  pro: {
    name: "Pro",
    price: 499.9,
    price_id: "price_1TBdFVFIwaU6XMYXYMLm9RZN",
    product_id: "prod_U9x9pVKGFe4Gzd",
    popular: false,
    features: ["1.000 produtos", "100.000 provas/mês", "Exportar vídeos", "Integrações completas"],
  },
  enterprise: {
    name: "Enterprise",
    price: null,
    price_id: null,
    product_id: null,
    popular: false,
    features: ["Produtos ilimitados", "Provas ilimitadas", "White label", "API completa", "Suporte dedicado"],
  },
} as const;

export type PlanKey = keyof typeof STRIPE_PLANS;

export function getPlanByProductId(productId: string): PlanKey | null {
  for (const [key, plan] of Object.entries(STRIPE_PLANS)) {
    if (plan.product_id === productId) return key as PlanKey;
  }
  return null;
}

export function getPlanByPriceId(priceId: string): PlanKey | null {
  for (const [key, plan] of Object.entries(STRIPE_PLANS)) {
    if (plan.price_id === priceId) return key as PlanKey;
  }
  return null;
}
