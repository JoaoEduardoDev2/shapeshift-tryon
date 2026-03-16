import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy, ExternalLink, Loader2, Lock, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePlanLimits } from "@/hooks/usePlanLimits";

const platforms = [
  { name: "Shopify", logo: "🟢", status: "available", region: "Global", key: "shopify" },
  { name: "WooCommerce", logo: "🟣", status: "available", region: "Global", key: "woocommerce" },
  { name: "Magento", logo: "🟠", status: "coming", region: "Global", key: "magento" },
  { name: "VTEX", logo: "🔴", status: "available", region: "Global", key: "vtex" },
  { name: "BigCommerce", logo: "🔵", status: "coming", region: "Global", key: "bigcommerce" },
  { name: "Wix", logo: "⚫", status: "coming", region: "Global", key: "wix" },
  { name: "Squarespace", logo: "⬛", status: "coming", region: "Global", key: "squarespace" },
  { name: "Nuvemshop", logo: "💙", status: "available", region: "Brasil", key: "nuvemshop" },
  { name: "Tray", logo: "🧡", status: "available", region: "Brasil", key: "tray" },
  { name: "Loja Integrada", logo: "💚", status: "coming", region: "Brasil", key: "lojaintegrada" },
  { name: "Yampi", logo: "💜", status: "coming", region: "Brasil", key: "yampi" },
  { name: "Cartpanda", logo: "🐼", status: "coming", region: "Brasil", key: "cartpanda" },
  { name: "Bagy", logo: "🛍️", status: "coming", region: "Brasil", key: "bagy" },
];

const socialCommerce = [
  { name: "TikTok Shop", logo: "🎵", status: "available", key: "tiktok_shop" },
  { name: "Instagram Shop", logo: "📸", status: "coming", key: "instagram_shop" },
  { name: "Facebook Shop", logo: "📘", status: "coming", key: "facebook_shop" },
  { name: "Pinterest Shopping", logo: "📌", status: "coming", key: "pinterest_shop" },
];

interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  type?: string;
  hint?: string;
}

const platformForms: Record<string, { fields: FieldConfig[]; functionName: string }> = {
  shopify: {
    fields: [
      { key: "store_url", label: "URL da loja", placeholder: "minha-loja.myshopify.com" },
      { key: "api_key", label: "Admin API Access Token", placeholder: "shpat_xxxxxxxxxxxxxxxxxxxxxxxx", type: "password", hint: "Shopify Admin → Settings → Apps → Develop apps → Admin API access token" },
    ],
    functionName: "shopify-import",
  },
  woocommerce: {
    fields: [
      { key: "store_url", label: "URL do site", placeholder: "https://minha-loja.com.br" },
      { key: "consumer_key", label: "Consumer Key", placeholder: "ck_xxxxxxxxxxxxxxxxxxxxxxxx", type: "password", hint: "WooCommerce → Settings → Advanced → REST API → Add key" },
      { key: "consumer_secret", label: "Consumer Secret", placeholder: "cs_xxxxxxxxxxxxxxxxxxxxxxxx", type: "password" },
    ],
    functionName: "woocommerce-import",
  },
  vtex: {
    fields: [
      { key: "account_name", label: "Account Name", placeholder: "minha-loja", hint: "Nome da conta VTEX (ex: minha-loja.vtexcommercestable.com.br)" },
      { key: "app_key", label: "App Key", placeholder: "vtexappkey-minha-loja-XXXXXX", type: "password", hint: "VTEX Admin → Account Settings → Application Keys" },
      { key: "app_token", label: "App Token", placeholder: "XXXXXXXXXXXXXXXXXXXXXXXX", type: "password" },
    ],
    functionName: "vtex-import",
  },
  nuvemshop: {
    fields: [
      { key: "store_id", label: "Store ID", placeholder: "1234567", hint: "Encontre em Nuvemshop Admin → Configurações → Dados da loja ou na URL do painel" },
      { key: "access_token", label: "Access Token", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxx", type: "password", hint: "Gerado ao criar um app em partners.nuvemshop.com.br" },
    ],
    functionName: "nuvemshop-import",
  },
  tray: {
    fields: [
      { key: "api_url", label: "URL da API Tray", placeholder: "https://minha-loja.commercesuite.com.br/web_api", hint: "Encontre em Tray Admin → Integrações → API" },
      { key: "access_token", label: "Access Token", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxx", type: "password", hint: "Gerado pela autenticação OAuth da Tray" },
    ],
    functionName: "tray-import",
  },
  tiktok_shop: {
    fields: [
      { key: "app_key", label: "App Key", placeholder: "xxxxxxxxxxxxxxxx", hint: "TikTok Shop Partner Center → App Management → App Key" },
      { key: "app_secret", label: "Access Token", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxx", type: "password", hint: "Token de acesso gerado via TikTok Shop Open API" },
      { key: "shop_cipher", label: "Shop Cipher (opcional)", placeholder: "xxxxxxxx" },
    ],
    functionName: "tiktok-shop-import",
  },
};

export default function AdminIntegrations() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { limits, loading: planLoading } = usePlanLimits();
  const [copied, setCopied] = useState(false);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (!planLoading && !limits.hasFullIntegrations) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-black mb-2">Integrações Completas</h1>
          <p className="text-muted-foreground max-w-md mb-6">
            As integrações com plataformas de e-commerce estão disponíveis a partir do plano <strong>Pro</strong>.
          </p>
          <Button onClick={() => navigate("/paywall")}>Fazer Upgrade</Button>
        </div>
      </AdminLayout>
    );
  }

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

  const handleImport = async () => {
    if (!activePlatform || !platformForms[activePlatform]) return;
    const config = platformForms[activePlatform];
    const missing = config.fields.some((f) => !f.key.includes("opcional") && !formValues[f.key]?.trim());
    if (missing) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    setImporting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/${config.functionName}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(formValues),
        }
      );

      const result = await res.json();
      if (!res.ok) {
        toast({ title: "Erro ao importar", description: result.error || "Verifique as credenciais", variant: "destructive" });
        return;
      }

      toast({
        title: "Importação concluída!",
        description: `${result.imported} produtos importados, ${result.skipped} ignorados (de ${result.total} total)`,
      });
      setActivePlatform(null);
      setFormValues({});
    } catch {
      toast({ title: "Erro de conexão", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const handlePlatformClick = (key: string) => {
    if (platformForms[key]) {
      setActivePlatform(key);
      setFormValues({});
    } else {
      toast({ title: "Integração em breve!" });
    }
  };

  const activeName = [...platforms, ...socialCommerce].find((p) => p.key === activePlatform)?.name;

  return (
    <AdminLayout>
      <h1 className="text-3xl font-black mb-1">Integrações</h1>
      <p className="text-muted-foreground mb-8">Conecte sua loja e instale o provador virtual</p>

      {/* Platform Import Form */}
      {activePlatform && platformForms[activePlatform] && (
        <div className="rounded-2xl border-2 border-primary/30 bg-card overflow-hidden mb-8 animate-in fade-in slide-in-from-top-2">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-bold">Conectar {activeName}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Preencha as credenciais para importar produtos</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setActivePlatform(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-6 space-y-4">
            {platformForms[activePlatform].fields.map((field) => (
              <div key={field.key}>
                <label className="text-sm font-medium mb-1.5 block">{field.label}</label>
                <Input
                  type={field.type || "text"}
                  placeholder={field.placeholder}
                  value={formValues[field.key] || ""}
                  onChange={(e) => setFormValues((v) => ({ ...v, [field.key]: e.target.value }))}
                />
                {field.hint && <p className="text-xs text-muted-foreground mt-1">{field.hint}</p>}
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleImport} disabled={importing}>
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                {importing ? "Importando..." : "Importar Produtos"}
              </Button>
              <Button variant="outline" onClick={() => setActivePlatform(null)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Embed Script */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden mb-8">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-bold">Script de Instalação</h3>
            <p className="text-xs text-muted-foreground mt-1">Cole no HTML do seu site para adicionar o botão "Provar Agora" automaticamente</p>
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
                <Button size="sm" variant={activePlatform === p.key ? "default" : "outline"} onClick={() => handlePlatformClick(p.key)}>
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
            <div key={p.name} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{p.logo}</span>
                <div>
                  <h4 className="font-medium text-sm">{p.name}</h4>
                  {p.status === "coming" && <span className="text-xs text-muted-foreground">Em breve</span>}
                </div>
              </div>
              {p.status === "available" ? (
                <Button size="sm" variant={activePlatform === p.key ? "default" : "outline"} onClick={() => handlePlatformClick(p.key)}>
                  <ExternalLink className="w-3 h-3" />
                  Conectar
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
