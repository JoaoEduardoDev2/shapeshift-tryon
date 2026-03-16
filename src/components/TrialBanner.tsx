import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Subscription {
  plan: string;
  trial_start: string;
  trial_end: string;
  subscription_status: string;
}

export function TrialBanner() {
  const { user } = useAuth();
  const [sub, setSub] = useState<Subscription | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSub(data as Subscription);
      });
  }, [user]);

  if (!sub || sub.subscription_status === "active") return null;

  const trialEnd = new Date(sub.trial_end);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const isExpired = daysLeft === 0;

  if (sub.subscription_status === "cancelled") {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <div>
            <p className="font-semibold text-sm">Assinatura cancelada</p>
            <p className="text-xs text-muted-foreground">Seu acesso está bloqueado. Assine para continuar.</p>
          </div>
        </div>
        <Button size="sm" onClick={() => navigate("/pricing")}>
          <CreditCard className="w-4 h-4 mr-1" /> Assinar agora
        </Button>
      </div>
    );
  }

  if (isExpired && sub.subscription_status === "trial") {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <div>
            <p className="font-semibold text-sm">Seu período de teste terminou</p>
            <p className="text-xs text-muted-foreground">Para continuar usando o VirtualFit AI, escolha um plano.</p>
          </div>
        </div>
        <Button size="sm" onClick={() => navigate("/pricing")}>
          <CreditCard className="w-4 h-4 mr-1" /> Assinar agora
        </Button>
      </div>
    );
  }

  if (sub.subscription_status === "trial" && daysLeft > 0) {
    return (
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
        <Clock className="w-4 h-4 text-primary shrink-0" />
        <p className="text-sm">
          <span className="font-medium">Teste grátis:</span>{" "}
          <span className="text-primary font-bold">{daysLeft} {daysLeft === 1 ? "dia" : "dias"}</span> restante{daysLeft !== 1 && "s"}.
          Plano <span className="capitalize font-semibold">{sub.plan}</span>.
        </p>
      </div>
    );
  }

  return null;
}

export function useSubscriptionGuard() {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    supabase
      .from("subscriptions")
      .select("subscription_status, trial_end")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) { setStatus(null); setLoading(false); return; }
        const sub = data as { subscription_status: string; trial_end: string };
        if (sub.subscription_status === "trial") {
          const expired = new Date(sub.trial_end) < new Date();
          setStatus(expired ? "expired" : "trial");
        } else {
          setStatus(sub.subscription_status);
        }
        setLoading(false);
      });
  }, [user, authLoading]);

  const hasAccess = status === "trial" || status === "active";
  return { status, loading: loading || authLoading, hasAccess };
}
