import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Sparkles, Scan, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function LookPage() {
  const { id } = useParams<{ id: string }>();
  const [look, setLook] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("saved_looks")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setLook(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!look) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 text-center px-4">
          <h1 className="text-2xl font-bold">Look não encontrado</h1>
          <p className="text-muted-foreground mt-2">Este look pode ter sido removido.</p>
          <Link to="/">
            <Button className="mt-4">Voltar ao início</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="relative">
              <img src={look.image_base64} alt={look.garment_name} className="w-full max-h-[600px] object-contain bg-background" />
              <div className="absolute top-4 left-4">
                <span className="text-xs font-mono glass px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-primary" />
                  AI VIRTUAL FIT
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold">{look.garment_name}</h2>
                {look.garment_description && (
                  <p className="text-sm text-muted-foreground mt-1">{look.garment_description}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Link to="/photo" className="flex-1">
                  <Button className="w-full">
                    <Scan className="w-4 h-4" />
                    Provar Também
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <div className="w-6 h-6 rounded-md bg-gradient-primary flex items-center justify-center">
                  <Scan className="w-3 h-3 text-primary-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">Gerado com <strong className="text-foreground">AI Virtual Fit</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
