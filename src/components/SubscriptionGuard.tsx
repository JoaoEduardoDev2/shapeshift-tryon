import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscriptionGuard } from "@/components/TrialBanner";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { status, loading, hasAccess } = useSubscriptionGuard();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || loading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!hasAccess) {
      navigate("/paywall");
    }
  }, [user, authLoading, loading, hasAccess, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !hasAccess) return null;

  return <>{children}</>;
}
