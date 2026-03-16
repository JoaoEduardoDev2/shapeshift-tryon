import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [form, setForm] = useState({
    store_name: "",
    domain: "",
    primary_color: "#3b82f6",
    platform: "",
    platform_url: "",
    tracking_pixel: "",
  });

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("store_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm({
            store_name: data.store_name || "",
            domain: data.domain || "",
            primary_color: data.primary_color || "#3b82f6",
            platform: data.platform || "",
            platform_url: data.platform_url || "",
            tracking_pixel: data.tracking_pixel || "",
          });
        }
        setLoadingSettings(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("store_settings").upsert({
      user_id: user.id,
      ...form,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Configurações salvas!" });
    }
    setSaving(false);
  };

  if (loading || loadingSettings) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 className="text-3xl font-black mb-1">Configurações</h1>
      <p className="text-muted-foreground mb-8">Configure sua loja e personalize o provador</p>

      <div className="max-w-xl space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-bold">Dados da Loja</h3>
          <div>
            <Label>Nome da Loja</Label>
            <Input value={form.store_name} onChange={(e) => setForm((f) => ({ ...f, store_name: e.target.value }))} placeholder="Minha Loja" />
          </div>
          <div>
            <Label>Domínio</Label>
            <Input value={form.domain} onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))} placeholder="minhaloja.com.br" />
          </div>
          <div>
            <Label>Cor Principal</Label>
            <div className="flex gap-2 items-center">
              <input type="color" value={form.primary_color} onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
              <Input value={form.primary_color} onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))} className="flex-1" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-bold">Plataforma E-commerce</h3>
          <div>
            <Label>Plataforma</Label>
            <Input value={form.platform} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))} placeholder="Shopify, WooCommerce, Nuvemshop..." />
          </div>
          <div>
            <Label>URL da Loja</Label>
            <Input value={form.platform_url} onChange={(e) => setForm((f) => ({ ...f, platform_url: e.target.value }))} placeholder="https://minhaloja.myshopify.com" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-bold">Rastreamento</h3>
          <div>
            <Label>Pixel de Rastreamento</Label>
            <Input value={form.tracking_pixel} onChange={(e) => setForm((f) => ({ ...f, tracking_pixel: e.target.value }))} placeholder="Cole o código do pixel aqui" />
            <p className="text-xs text-muted-foreground mt-1">Facebook Pixel, Google Tag, TikTok Pixel, etc.</p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Configurações
        </Button>
      </div>
    </AdminLayout>
  );
}
