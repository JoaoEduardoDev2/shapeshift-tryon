import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy, ExternalLink, Loader2, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const platforms = [
  { name: "Shopify", logo: "🟢", status: "available", region: "Global" },
  { name: "WooCommerce", logo: "🟣", status: "available", region: "Global" },
  { name: "Magento", logo: "🟠", status: "available", region: "Global" },
  { name: "VTEX", logo: "🔴", status: "available", region: "Global" },
  { name: "BigCommerce", logo: "🔵", status: "coming", region: "Global" },
  { name: "Wix", logo: "⚫", status: "coming", region: "Global" },
  { name: "Squarespace", logo: "⬛", status: "coming", region: "Global" },
  { name: "Nuvemshop", logo: "💙", status: "available", region: "Brasil" },
  { name: "Tray", logo: "🧡", status: "available", region: "Brasil" },
  { name: "Loja Integrada", logo: "💚", status: "coming", region: "Brasil" },
  { name: "Yampi", logo: "💜", status: "coming", region: "Brasil" },
  { name: "Cartpanda", logo: "🐼", status: "coming", region: "Brasil" },
  { name: "Bagy", logo: "🛍️", status: "coming", region: "Brasil" },
];

const socialCommerce = [
  { name: "TikTok Shop", logo: "🎵", status: "coming" },
  { name: "Instagram Shop", logo: "📸", status: "coming" },
  { name: "Facebook Shop", logo: "📘", status: "coming" },
  { name: "Pinterest Shopping", logo: "📌", status: "coming" },
];

export default function AdminIntegrations() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Shopify import state
  const [showShopify, setShowShopify] = useState(false);
  const [shopifyUrl, setShopifyUrl] = useState("");
  const [shopifyKey, setShopifyKey] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const embedScript = `<!-- AI Virtual Fit - Provador Virtual -->
<script>
  window.VTO_CONFIG = {
    apiKey: 'pk_live_${user?.id?.slice(0, 8) || "xxxxxxxx"}',
    theme: 'auto',
    position: 'bottom-right'
  };
</script>
<script src="https://cdn.virtualfit.app/v1/widget.js" async></script>`;

  const copyScript = () => {
    navigator.clipboard.writeText(embedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Script copiado!" });
  };

  const handleShopifyImport = async () => {
    if (!shopifyUrl.trim() || !shopifyKey.trim()) {
      toast({ title: "Preencha a URL e a API Key", variant: "destructive" });
      return;
    }

    setImporting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/shopify-import`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            store_url: shopifyUrl,
            api_key: shopifyKey,
          }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        toast({
          title: "Erro ao importar",
          description: result.error || "Verifique a URL e API Key",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Importação concluída!",
        description: `${result.imported} produtos importados, ${result.skipped} ignorados (de ${result.total} total)`,
      });
      setShowShopify(false);
      setShopifyUrl("");
      setShopifyKey("");
    } catch (err) {
      toast({ title: "Erro de conexão", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const handlePlatformClick = (name: string) => {
    if (name === "Shopify") {
      setShowShopify(true);
    } else {
      toast({ title: `Integração ${name} em breve!` });
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-black mb-1">Integrações</h1>
      <p className="text-muted-foreground mb-8">Conecte sua loja e instale o provador virtual</p>

      {/* Shopify Import Modal */}
      {showShopify && (
        <div className="rounded-2xl border-2 border-primary/30 bg-card overflow-hidden mb-8 animate-in fade-in slide-in-from-top-2">
          <div className="p-6 border-b border-border flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-bold">Conectar Shopify</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Insira a URL da sua loja e o Access Token da Admin API
              </p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">URL da loja</label>
              <Input
                placeholder="minha-loja.myshopify.com"
                value={shopifyUrl}
                onChange={(e) => setShopifyUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Admin API Access Token</label>
              <Input
                type="password"
                placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx"
                value={shopifyKey}
                onChange={(e) => setShopifyKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Encontre em Shopify Admin → Settings → Apps → Develop apps → Admin API access token
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleShopifyImport} disabled={importing}>
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                {importing ? "Importando..." : "Importar Produtos"}
              </Button>
              <Button variant="outline" onClick={() => setShowShopify(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Embed Script */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden mb-8">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-bold">Script de Instalação</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Cole no HTML do seu site para adicionar o botão "Provar Agora" automaticamente
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={copyScript}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </div>
        <pre className="p-6 text-sm font-mono text-muted-foreground overflow-x-auto leading-relaxed bg-secondary/30">
          <code>{embedScript}</code>
        </pre>
      </div>

      {/* E-commerce Platforms */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">Plataformas de E-commerce</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {platforms.map((p) => (
            <div key={p.name} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{p.logo}</span>
                <div>
                  <h4 className="font-medium text-sm">{p.name}</h4>
                  <span className="text-xs text-muted-foreground">{p.region}</span>
                </div>
              </div>
              {p.status === "available" ? (
                <Button size="sm" variant="outline" onClick={() => handlePlatformClick(p.name)}>
                  <ExternalLink className="w-3 h-3" />
                  Conectar
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground px-3 py-1 rounded-full bg-secondary">Em breve</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Social Commerce */}
      <div>
        <h3 className="text-xl font-bold mb-4">Social Commerce</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {socialCommerce.map((p) => (
            <div key={p.name} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <span className="text-2xl">{p.logo}</span>
              <div>
                <h4 className="font-medium text-sm">{p.name}</h4>
                <span className="text-xs text-muted-foreground">Em breve</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
