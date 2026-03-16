import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getPlanLimits, PlanLimits } from "@/lib/planLimits";

interface PlanState {
  plan: string;
  limits: PlanLimits;
  productCount: number;
  monthlyTryons: number;
  loading: boolean;
}

export function usePlanLimits() {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<PlanState>({
    plan: "starter",
    limits: getPlanLimits("starter"),
    productCount: 0,
    monthlyTryons: 0,
    loading: true,
  });

  useEffect(() => {
    if (authLoading || !user) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    const fetchData = async () => {
      // Fetch subscription plan
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .maybeSingle();

      const plan = (sub as any)?.plan || "starter";
      const limits = getPlanLimits(plan);

      // Fetch product count
      const { count: productCount } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch monthly tryon count from analytics
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count: monthlyTryons } = await supabase
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("event_type", "tryon")
        .gte("created_at", monthStart);

      setState({
        plan,
        limits,
        productCount: productCount || 0,
        monthlyTryons: monthlyTryons || 0,
        loading: false,
      });
    };

    fetchData();
  }, [user, authLoading]);

  const canAddProduct = state.productCount < state.limits.maxProducts;
  const canDoTryon = state.monthlyTryons < state.limits.maxTryonsPerMonth;
  const remainingProducts = Math.max(0, state.limits.maxProducts - state.productCount);
  const remainingTryons = Math.max(0, state.limits.maxTryonsPerMonth - state.monthlyTryons);

  return {
    ...state,
    canAddProduct,
    canDoTryon,
    remainingProducts,
    remainingTryons,
    refresh: () => setState((s) => ({ ...s, loading: true })),
  };
}
