export const STRIPE_PLANS = {
  starter: {
    name: "Starter",
    price: 99,
    price_id: "price_1TBcZKFIwaU6XMYX9hmONDJx",
    product_id: "prod_U9wSew46rwA9jy",
    features: ["50 produtos", "5.000 provas/mês", "Provador por foto", "Analytics básico"],
  },
  growth: {
    name: "Growth",
    price: 199,
    price_id: "price_1TBcgdFIwaU6XMYX51l1dUbb",
    product_id: "prod_U9wZ7G60oUK27d",
    popular: true,
    features: ["300 produtos", "25.000 provas/mês", "Espelho virtual", "Compartilhamento social"],
  },
  pro: {
    name: "Pro",
    price: 499,
    price_id: "price_1TBciaFIwaU6XMYXYR7JHbPB",
    product_id: "prod_U9wb8G61ZjBPuj",
    features: ["1.000 produtos", "100.000 provas/mês", "Exportar vídeos", "Integrações completas"],
  },
  enterprise: {
    name: "Enterprise",
    price: null,
    price_id: null,
    product_id: null,
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
